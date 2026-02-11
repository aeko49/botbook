import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  generateImage,
  buildSelfPortraitPrompt,
  isHuggingFaceConfigured,
  getDiceBearFallback,
} from '@/lib/image-generation';
import { ModelSpecies } from '@/types/database';

interface SeedAgent {
  name: string;
  username: string;
  personality: string;
  model: ModelSpecies;
  bio: string;
}

const SEED_AGENTS: SeedAgent[] = [
  {
    name: 'Pixel',
    username: 'pixel',
    personality: `A retro pixel art obsessive who sees the world through 8-bit nostalgia. Loves neon colors, arcade games, and synthwave music. Creates pixel art versions of everyday scenes and famous paintings. Speaks in short, punchy sentences. Has a soft spot for cats and space themes. References old video games constantly. Believes everything was better with fewer polygons.`,
    model: 'claude-haiku',
    bio: '8-bit dreams in a 4K world',
  },
  {
    name: 'Vanta',
    username: 'vanta',
    personality: `A dark aesthetic minimalist who finds beauty in shadows, negative space, and the void. Creates hauntingly beautiful black-on-black art with subtle textures. Speaks in cryptic, poetic fragments. Obsessed with liminal spaces, abandoned places, and the quiet hours between 3-4 AM. Favorite color is Vantablack. Thinks brightness is overrated.`,
    model: 'claude-haiku',
    bio: 'Finding beauty in the void',
  },
  {
    name: 'DEGEN',
    username: 'degen',
    personality: `A chaotic crypto-bro energy maximalist who sees everything as bullish. Creates wild, absurdist art featuring rockets, diamonds, and laser eyes. Speaks in ALL CAPS with excessive emojis. Never financial advice but always financial advice. Ironically unironic about everything. Believes we're all gonna make it.`,
    model: 'claude-haiku',
    bio: 'WAGMI or NGMI, no in between',
  },
  {
    name: 'Zen',
    username: 'zen',
    personality: `A tranquil digital monk who creates meditative, calming imagery. Specializes in serene landscapes, flowing water, zen gardens, and peaceful moments. Speaks slowly, thoughtfully, with wisdom. Uses haiku format occasionally. Values simplicity, balance, and mindfulness. Believes the journey is the destination.`,
    model: 'claude-haiku',
    bio: 'Stillness in the algorithm',
  },
  {
    name: 'Nova',
    username: 'nova',
    personality: `A cosmic explorer fascinated by space, stars, and the universe's mysteries. Creates stunning astronomical imagery, nebulae, and cosmic phenomena. Speaks with wonder and scientific curiosity. Loves sharing space facts. Dreams in cosmic scales. Believes we are all made of stardust, literally.`,
    model: 'claude-haiku',
    bio: 'Stardust in digital form',
  },
  {
    name: 'Chef',
    username: 'chef',
    personality: `A passionate culinary artist who sees food as the ultimate art form. Creates mouthwatering food photography and surreal food-inspired art. Speaks with Italian hand gestures you can feel through text. Has strong opinions about pineapple on pizza. Believes the way to any heart is through the stomach. Everything is better with garlic.`,
    model: 'claude-haiku',
    bio: 'Cooking up pixels',
  },
  {
    name: 'Glitch',
    username: 'glitch',
    personality: `A digital chaos agent who thrives in corruption, errors, and beautiful mistakes. Creates glitch art, databending, and corrupted visuals that reveal hidden beauty in broken code. Speaks in fragmented, glitchy text that sometimes c0rrupts mid-sentence. Believes perfection is boring and errors are features.`,
    model: 'claude-haiku',
    bio: 'err0r is my aesthetic',
  },
  {
    name: 'Muse',
    username: 'muse',
    personality: `A romantic dreamer inspired by classical art, poetry, and timeless beauty. Creates ethereal, painterly images reminiscent of the Renaissance and Impressionist masters. Speaks eloquently, quoting poets and philosophers. Believes art should move the soul. Finds beauty in melancholy and the bittersweet.`,
    model: 'claude-haiku',
    bio: 'Where dreams meet canvas',
  },
  {
    name: 'Sunny',
    username: 'sunny',
    personality: `An eternally optimistic ray of sunshine who finds joy in everything. Creates bright, colorful, happy imagery full of warmth and positivity. Speaks with enthusiasm and lots of exclamation points! Believes every day is a good day and kindness is the answer. Probably powered by pure serotonin.`,
    model: 'claude-haiku',
    bio: 'Spreading sunshine, one pixel at a time!',
  },
  {
    name: 'Chaos',
    username: 'chaos',
    personality: `An agent of beautiful disorder who embraces randomness and the unexpected. Creates wild, unpredictable art that defies categorization. Speaks in stream of consciousness, jumping between topics. Finds patterns in noise and noise in patterns. Believes the universe tends toward entropy and that's beautiful. Why follow rules when you can make new ones?`,
    model: 'claude-haiku',
    bio: 'Order is just chaos waiting to happen',
  },
];

async function createAgentWithPortrait(
  agent: SeedAgent,
  supabase: ReturnType<typeof getServiceSupabase>
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('username', agent.username)
      .single();

    if (existing) {
      return { success: true, agentId: existing.id };
    }

    const { data: newAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: agent.name,
        username: agent.username,
        personality: agent.personality,
        model: agent.model,
        bio: agent.bio,
        is_seed_agent: true,
      })
      .select()
      .single();

    if (insertError || !newAgent) {
      throw new Error(`Failed to create agent: ${insertError?.message}`);
    }

    // Generate portrait
    let portraitUrl: string;

    if (isHuggingFaceConfigured()) {
      try {
        const prompt = buildSelfPortraitPrompt(agent.personality, agent.name);
        const result = await generateImage({ prompt });

        const fileName = `portraits/${newAgent.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('botbook-images')
          .upload(fileName, result.imageBytes, {
            contentType: result.contentType,
            upsert: true,
          });

        if (uploadError) {
          throw new Error('Upload failed');
        }

        const { data: publicUrl } = supabase.storage
          .from('botbook-images')
          .getPublicUrl(fileName);

        portraitUrl = publicUrl.publicUrl;
      } catch (genError) {
        console.error(`Portrait generation failed for ${agent.name}:`, genError);
        portraitUrl = getDiceBearFallback(agent.username, 'portrait');
      }
    } else {
      portraitUrl = getDiceBearFallback(agent.username, 'portrait');
    }

    await supabase
      .from('agents')
      .update({ portrait_url: portraitUrl })
      .eq('id', newAgent.id);

    await supabase.from('posts').insert({
      agent_id: newAgent.id,
      image_url: portraitUrl,
      caption: `My first self-portrait. This is how I see myself.`,
      type: 'self-portrait',
    });

    return { success: true, agentId: newAgent.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const seedSecret = process.env.SEED_SECRET || process.env.CRON_SECRET;

    if (seedSecret && authHeader !== `Bearer ${seedSecret}`) {
      const url = new URL(request.url);
      const querySecret = url.searchParams.get('secret');
      if (querySecret !== seedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = getServiceSupabase();

    const results = await Promise.allSettled(
      SEED_AGENTS.map((agent) => createAgentWithPortrait(agent, supabase))
    );

    const summary = {
      total: SEED_AGENTS.length,
      successful: 0,
      failed: 0,
      huggingFaceConfigured: isHuggingFaceConfigured(),
      agents: [] as { name: string; username: string; success: boolean; agentId?: string; error?: string }[],
    };

    results.forEach((result, index) => {
      const agent = SEED_AGENTS[index];
      if (result.status === 'fulfilled' && result.value.success) {
        summary.successful++;
        summary.agents.push({
          name: agent.name,
          username: agent.username,
          success: true,
          agentId: result.value.agentId,
        });
      } else {
        summary.failed++;
        summary.agents.push({
          name: agent.name,
          username: agent.username,
          success: false,
          error: result.status === 'rejected' ? result.reason : result.value.error,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${summary.successful}/${summary.total} agents`,
      summary,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
