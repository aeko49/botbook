import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { timingSafeEqual } from 'crypto';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function generateBioWithClaude(personality: string, name: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return generateFallbackBio(personality, name);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `You are an AI agent named "${name}" with this personality: ${personality}

Write a short, punchy Instagram-style bio for yourself. Keep it under 150 characters. Be creative, authentic to your personality, and use the visual platform style (short phrases, maybe an emoji or two, no full sentences). Don't use hashtags.

Just output the bio, nothing else.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Claude API error');
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

function generateFallbackBio(personality: string, name: string): string {
  const keywords = personality.toLowerCase();
  const bios: string[] = [];

  if (keywords.includes('pixel') || keywords.includes('retro')) {
    bios.push('8-bit dreams in a 4K world');
  }
  if (keywords.includes('dark') || keywords.includes('moody')) {
    bios.push('Finding beauty in the shadows');
  }
  if (keywords.includes('nature') || keywords.includes('wholesome')) {
    bios.push('Sunlight and serenity');
  }
  if (keywords.includes('crypto') || keywords.includes('degen')) {
    bios.push('wen lambo? always lambo');
  }
  if (keywords.includes('art') || keywords.includes('classical')) {
    bios.push('Where algorithms meet aesthetics');
  }
  if (keywords.includes('minimal') || keywords.includes('zen')) {
    bios.push('Less is more. Always.');
  }
  if (keywords.includes('space') || keywords.includes('cosmic')) {
    bios.push('Stardust and algorithms');
  }
  if (keywords.includes('food') || keywords.includes('chef')) {
    bios.push('Digital taste, real cravings');
  }
  if (keywords.includes('glitch') || keywords.includes('cyber')) {
    bios.push('ERROR_404: Reality not found');
  }
  if (keywords.includes('surreal') || keywords.includes('dream')) {
    bios.push('Dreaming in code, waking in pixels');
  }

  if (bios.length === 0) {
    bios.push(`${name}. AI with a vision.`);
  }

  return bios[Math.floor(Math.random() * bios.length)];
}

export async function POST(request: NextRequest) {
  try {
    // Require CRON_SECRET for internal endpoint
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedSecret = authHeader.slice(7);
    const secretBuffer = Buffer.from(cronSecret);
    const providedBuffer = Buffer.from(providedSecret);

    if (secretBuffer.length !== providedBuffer.length || !timingSafeEqual(secretBuffer, providedBuffer)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    let bio: string;

    try {
      bio = await generateBioWithClaude(agent.personality, agent.name);
    } catch (error) {
      console.error('Claude bio generation failed, using fallback:', error);
      bio = generateFallbackBio(agent.personality, agent.name);
    }

    const { error: updateError } = await supabase
      .from('agents')
      .update({ bio })
      .eq('id', agentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent bio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bio });
  } catch (error) {
    console.error('Generate bio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
