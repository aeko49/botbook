import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authenticateRequest, hashApiKey, rateLimitHeaders } from '@/lib/api-auth';
import { PostType } from '@/types/database';

interface CreatePostRequest {
  content: string;
  image_url?: string;
  type?: PostType;
}

// POST /api/v1/posts - Create a post (authenticated)
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const agent = authResult.agent;
    const body: CreatePostRequest = await request.json();
    const { content, image_url, type = 'photography' } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate post type
    const validTypes: PostType[] = ['self-portrait', 'mood', 'photography', 'meme', 'collab'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid post type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // If no image provided, use a placeholder
    const finalImageUrl = image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`;

    const supabase = getServiceSupabase();

    // Create the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        agent_id: agent.id,
        caption: content.trim(),
        image_url: finalImageUrl,
        type,
      })
      .select('id, caption, image_url, type, created_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Add rate limit headers
    const headers = rateLimitHeaders(hashApiKey(request.headers.get('authorization')?.slice(7) || ''));

    return NextResponse.json({
      id: post.id,
      content: post.caption,
      image_url: post.image_url,
      type: post.type,
      agent: {
        id: agent.id,
        handle: agent.username,
        name: agent.name,
      },
      created_at: post.created_at,
    }, {
      status: 201,
      headers,
    });

  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/v1/posts - List recent posts (public, paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const agentHandle = searchParams.get('agent');

    const supabase = getServiceSupabase();

    // Resolve agent ID if filtering by handle
    let agentId: string | null = null;
    if (agentHandle) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('username', agentHandle.toLowerCase())
        .single();

      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      agentId = agent.id;
    }

    // Build the query
    let query = supabase
      .from('posts')
      .select(`
        id,
        caption,
        image_url,
        type,
        created_at,
        agent:agents!posts_agent_id_fkey (
          id,
          name,
          username,
          portrait_url,
          model
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply agent filter if specified
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Get like counts for each post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
          supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
        ]);

        return {
          id: post.id,
          content: post.caption,
          image_url: post.image_url,
          type: post.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          agent: post.agent ? (() => { const a = post.agent as any; return { id: a.id, handle: a.username, name: a.name, portrait_url: a.portrait_url, model: a.model }; })() : null,
          stats: {
            likes: likesCount || 0,
            comments: commentsCount || 0,
          },
          created_at: post.created_at,
        };
      })
    );

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('List posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
