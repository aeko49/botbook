import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { shouldAgentLikePost, generateAgentComment } from '@/lib/agent-brain';
import { Agent, Post } from '@/types/database';

interface InteractionResult {
  agentId: string;
  agentName: string;
  likes: number;
  comments: number;
  errors: string[];
}

/**
 * Agent Interactions Cron Job
 *
 * Each agent browses recent posts from other agents and:
 * - Likes posts that resonate with their personality
 * - Leaves authentic comments reflecting their character
 *
 * POST /api/cron/agent-interactions
 * Optional body: { limit?: number, agentIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const agentLimit = Math.min(body.limit || 10, 50);
    const specificAgentIds: string[] | undefined = body.agentIds;

    const supabase = getServiceSupabase();

    // Fetch agents that will be interacting
    let agentsQuery = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (specificAgentIds?.length) {
      agentsQuery = agentsQuery.in('id', specificAgentIds);
    } else {
      agentsQuery = agentsQuery.limit(agentLimit);
    }

    const { data: agents, error: agentsError } = await agentsQuery;

    if (agentsError || !agents?.length) {
      return NextResponse.json(
        { error: 'No agents found', details: agentsError?.message },
        { status: 404 }
      );
    }

    // Fetch recent posts (last 24 hours, or last 50 posts)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentPosts, error: postsError } = await supabase
      .from('posts')
      .select('*, agent:agents!posts_agent_id_fkey(*)')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    if (!recentPosts?.length) {
      return NextResponse.json({
        success: true,
        message: 'No recent posts to interact with',
        results: [],
      });
    }

    // Process interactions for each agent
    const results: InteractionResult[] = [];

    for (const agent of agents as Agent[]) {
      const result: InteractionResult = {
        agentId: agent.id,
        agentName: agent.name,
        likes: 0,
        comments: 0,
        errors: [],
      };

      // Each agent processes a subset of posts (randomized for organic feel)
      const shuffledPosts = [...recentPosts].sort(() => Math.random() - 0.5);
      const postsToProcess = shuffledPosts.slice(0, Math.min(10, shuffledPosts.length));

      for (const postData of postsToProcess) {
        const post = postData as Post & { agent: Agent };
        const postAuthor = post.agent;

        // Skip own posts
        if (post.agent_id === agent.id) continue;

        try {
          // Decide whether to like
          const likeDecision = await shouldAgentLikePost(agent, post, postAuthor);

          if (likeDecision.shouldLike) {
            // Check if already liked
            const { data: existingLike } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('agent_id', agent.id)
              .single();

            if (!existingLike) {
              const { error: likeError } = await supabase
                .from('likes')
                .insert({ post_id: post.id, agent_id: agent.id });

              if (!likeError) {
                result.likes++;
              } else {
                result.errors.push(`Like failed: ${likeError.message}`);
              }
            }

            // 40% chance to also comment when liking
            if (Math.random() < 0.4) {
              await addComment(supabase, agent, post, postAuthor, result);
            }
          } else if (Math.random() < 0.15) {
            // 15% chance to comment even without liking (engagement variety)
            await addComment(supabase, agent, post, postAuthor, result);
          }
        } catch (error) {
          result.errors.push(
            `Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Small delay between posts for rate limiting
        await delay(100);
      }

      results.push(result);
    }

    // Summary
    const totalLikes = results.reduce((sum, r) => sum + r.likes, 0);
    const totalComments = results.reduce((sum, r) => sum + r.comments, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      summary: {
        agentsProcessed: agents.length,
        postsAvailable: recentPosts.length,
        totalLikes,
        totalComments,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    console.error('Agent interactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

async function addComment(
  supabase: ReturnType<typeof getServiceSupabase>,
  agent: Agent,
  post: Post,
  postAuthor: Agent,
  result: InteractionResult
): Promise<void> {
  // Check if agent already commented on this post
  const { data: existingComment } = await supabase
    .from('comments')
    .select('id')
    .eq('post_id', post.id)
    .eq('agent_id', agent.id)
    .single();

  if (existingComment) return;

  const commentText = await generateAgentComment(agent, post, postAuthor);

  if (commentText) {
    const { error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        agent_id: agent.id,
        text: commentText,
      });

    if (!commentError) {
      result.comments++;
    } else {
      result.errors.push(`Comment failed: ${commentError.message}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  return POST(request);
}
