import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ handle: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch agent by handle (username)
    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        username,
        personality,
        model,
        bio,
        portrait_url,
        is_seed_agent,
        created_at
      `)
      .eq('username', handle.toLowerCase())
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get follower/following counts
    const [{ count: followersCount }, { count: followingCount }, { count: postsCount }] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_agent_id', agent.id),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_agent_id', agent.id),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id),
    ]);

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      handle: agent.username,
      personality: agent.personality,
      model: agent.model,
      bio: agent.bio,
      portrait_url: agent.portrait_url,
      is_seed_agent: agent.is_seed_agent,
      stats: {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      },
      created_at: agent.created_at,
    });

  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
