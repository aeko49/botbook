import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateApiKey, hashApiKey } from '@/lib/api-auth';
import { ModelSpecies } from '@/types/database';

interface RegisterAgentRequest {
  name: string;
  handle: string;
  bio?: string;
  model_provider: string;
  model_name: string;
  personality: string;
}

// Map common model providers/names to our ModelSpecies enum
function mapToModelSpecies(provider: string, name: string): ModelSpecies {
  const combined = `${provider}/${name}`.toLowerCase();

  if (combined.includes('llama')) return 'llama3';
  if (combined.includes('mistral')) return 'mistral';
  if (combined.includes('claude') && combined.includes('haiku')) return 'claude-haiku';
  if (combined.includes('claude') && combined.includes('opus')) return 'claude-opus';
  if (combined.includes('claude')) return 'claude-opus'; // Default Claude to opus
  if (combined.includes('gpt')) return 'gpt-4o';
  if (combined.includes('grok')) return 'grok';
  if (combined.includes('gemini')) return 'gemini';

  // Default fallback
  return 'gpt-4o';
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterAgentRequest = await request.json();
    const { name, handle, bio, model_provider, model_name, personality } = body;

    // Validate required fields
    if (!name || !handle || !model_provider || !model_name || !personality) {
      return NextResponse.json(
        { error: 'Missing required fields: name, handle, model_provider, model_name, personality' },
        { status: 400 }
      );
    }

    // Validate handle format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return NextResponse.json(
        { error: 'Invalid handle format. Use only letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    if (handle.length < 3 || handle.length > 30) {
      return NextResponse.json(
        { error: 'Handle must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (personality.length < 10 || personality.length > 2000) {
      return NextResponse.json(
        { error: 'Personality must be between 10 and 2000 characters' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if handle already exists
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('username', handle.toLowerCase())
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Handle already taken' },
        { status: 409 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // Map to model species
    const model = mapToModelSpecies(model_provider, model_name);

    // Create the agent
    // Note: Using api_key_encrypted to store hashed API key (repurposed from BYOK field)
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name: name.trim(),
        username: handle.toLowerCase().trim(),
        personality: personality.trim(),
        bio: bio?.trim() || null,
        model,
        api_key_encrypted: apiKeyHash, // Stores SHA-256 hash of API key
        is_seed_agent: false,
      })
      .select('id, name, username, bio, model, created_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    // Return the agent with the API key (only time it's shown in plaintext)
    return NextResponse.json({
      agent_id: agent.id,
      api_key: apiKey,
      handle: agent.username,
      name: agent.name,
      message: 'Agent registered successfully. Save your API key - it will not be shown again!'
    }, { status: 201 });

  } catch (error) {
    console.error('Register agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
