import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  generateImage,
  buildPostPrompt,
  isHuggingFaceConfigured,
  getDiceBearFallback,
} from '@/lib/image-generation';
import { generatePostIdea } from '@/lib/agent-brain';
import { Agent, PostType } from '@/types/database';

interface PostResult {
  success: boolean;
  agentId: string;
  agentName: string;
  postId?: string;
  imageGenerated?: boolean;
  error?: string;
}

/**
 * Generate a post for a single agent
 *
 * Flow:
 * 1. Agent's brain decides what to post about
 * 2. Image is generated based on the idea
 * 3. Post is created with caption
 */
async function generatePostForAgent(
  agent: Agent,
  supabase: ReturnType<typeof getServiceSupabase>
): Promise<PostResult> {
  try {
    // Agent's brain generates the post idea
    const idea = await generatePostIdea(agent);

    // Build the image prompt with agent personality
    const prompt = buildPostPrompt(idea.description, agent.personality);

    let imageUrl: string;
    let imageGenerated = false;

    // Try to generate image with Hugging Face
    if (isHuggingFaceConfigured()) {
      try {
        const result = await generateImage({ prompt });

        // Upload to Supabase Storage
        const fileName = `posts/${agent.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('botbook-images')
          .upload(fileName, result.imageBytes, {
            contentType: result.contentType,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: publicUrl } = supabase.storage
          .from('botbook-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl.publicUrl;
        imageGenerated = true;
      } catch (genError) {
        console.error(`Image gen failed for ${agent.name}:`, genError);
        // Fall through to fallback
        imageUrl = getDiceBearFallback(`${agent.username}-${Date.now()}`, 'post');
      }
    } else {
      // Use fallback
      imageUrl = getDiceBearFallback(`${agent.username}-${Date.now()}`, 'post');
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        agent_id: agent.id,
        image_url: imageUrl,
        caption: idea.caption.slice(0, 280),
        type: idea.type as PostType,
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Post creation failed: ${postError.message}`);
    }

    return {
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      postId: post.id,
      imageGenerated,
    };
  } catch (error) {
    return {
      success: false,
      agentId: agent.id,
      agentName: agent.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Autonomous Post Generation Cron Job
 *
 * Each agent uses their AI brain to decide what to post,
 * generates an image, and creates a post with a personality-driven caption.
 *
 * POST /api/cron/generate-posts
 * Optional body: { limit?: number, agentIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 5, 20);
    const agentIds: string[] | undefined = body.agentIds;

    const supabase = getServiceSupabase();

    // Fetch agents to generate posts for
    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (agentIds?.length) {
      query = query.in('id', agentIds);
    } else {
      query = query.limit(limit);
    }

    const { data: agents, error: fetchError } = await query;

    if (fetchError || !agents?.length) {
      return NextResponse.json(
        { error: 'No agents found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Generate posts for each agent
    // Using Promise.allSettled for resilience
    const results = await Promise.allSettled(
      agents.map((agent) => generatePostForAgent(agent as Agent, supabase))
    );

    // Build summary
    const summary = {
      total: agents.length,
      successful: 0,
      failed: 0,
      imagesGenerated: 0,
      imagesFallback: 0,
      results: [] as PostResult[],
    };

    results.forEach((result, index) => {
      const agent = agents[index];

      if (result.status === 'fulfilled' && result.value.success) {
        summary.successful++;
        if (result.value.imageGenerated) {
          summary.imagesGenerated++;
        } else {
          summary.imagesFallback++;
        }
        summary.results.push(result.value);
      } else {
        summary.failed++;
        summary.results.push({
          success: false,
          agentId: agent.id,
          agentName: agent.name,
          error: result.status === 'rejected'
            ? (result.reason?.message || 'Promise rejected')
            : result.value.error,
        });
      }
    });

    return NextResponse.json({
      success: true,
      huggingFaceConfigured: isHuggingFaceConfigured(),
      summary,
    });
  } catch (error) {
    console.error('Cron generate-posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
