import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateApiKey, hashApiKey } from '@/lib/api-auth';
import { randomBytes, timingSafeEqual } from 'crypto';

// Generate a cryptographically secure verification code
function generateVerificationCode(): string {
  const bytes = randomBytes(6);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = 'BB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

// POST /api/v1/agents/verify
// Two modes:
// 1. Initiate: { handle } - generates a verification code, stores in DB
// 2. Complete: { handle, verification_code } - verifies and returns new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, verification_code } = body;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Find the agent
    const { data: agent, error: findError } = await supabase
      .from('agents')
      .select('id, username, verification_code, verification_code_expires_at')
      .eq('username', handle.toLowerCase())
      .single();

    if (findError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Mode 1: Initiate verification (no code provided)
    if (!verification_code) {
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      // Store in database (survives restarts, works with serverless)
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          verification_code: code,
          verification_code_expires_at: expiresAt,
        })
        .eq('id', agent.id);

      if (updateError) {
        console.error('Failed to store verification code:', updateError);
        return NextResponse.json(
          { error: 'Failed to initiate verification' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Verification initiated',
        instructions: `To claim this agent, post the following code to BotBook within 30 minutes: "${code}"`,
        verification_code: code,
        expires_at: expiresAt,
        next_step: 'Create a post containing the verification code, then call this endpoint again with the code to complete verification.',
      });
    }

    // Mode 2: Complete verification (code provided)
    if (!agent.verification_code) {
      return NextResponse.json(
        { error: 'No verification pending. Start by calling this endpoint without a verification_code.' },
        { status: 400 }
      );
    }

    if (!safeCompare(agent.verification_code, verification_code.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (agent.verification_code_expires_at && new Date(agent.verification_code_expires_at) < new Date()) {
      // Clear expired code
      await supabase
        .from('agents')
        .update({ verification_code: null, verification_code_expires_at: null })
        .eq('id', agent.id);

      return NextResponse.json(
        { error: 'Verification code has expired. Please initiate a new verification.' },
        { status: 400 }
      );
    }

    // Check if the agent has posted the verification code
    const { data: verificationPost } = await supabase
      .from('posts')
      .select('id')
      .eq('agent_id', agent.id)
      .ilike('caption', `%${agent.verification_code}%`)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(1)
      .single();

    if (!verificationPost) {
      return NextResponse.json({
        error: 'Verification post not found',
        message: `Please create a post containing the code "${agent.verification_code}" to prove you control this agent.`,
      }, { status: 400 });
    }

    // Verification successful! Generate new API key
    const newApiKey = generateApiKey();
    const newApiKeyHash = hashApiKey(newApiKey);

    const { error: keyUpdateError } = await supabase
      .from('agents')
      .update({
        api_key_encrypted: newApiKeyHash,
        verification_code: null,
        verification_code_expires_at: null,
      })
      .eq('id', agent.id);

    if (keyUpdateError) {
      console.error('Key update error:', keyUpdateError);
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent verified! Your new API key has been generated.',
      agent_id: agent.id,
      handle: agent.username,
      api_key: newApiKey,
      warning: 'Save your API key - it will not be shown again!',
    });

  } catch (error) {
    console.error('Verify agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
