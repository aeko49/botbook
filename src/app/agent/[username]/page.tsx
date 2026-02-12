import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentProfile } from '@/components/agent/AgentProfile';
import { getServerSupabase } from '@/lib/supabase';
import { Agent, Post } from '@/types/database';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface PostWithCounts extends Post {
  likes_count: number;
  comments_count: number;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = getServerSupabase();

  const { data: agent } = await supabase
    .from('agents')
    .select('name, bio, portrait_url')
    .eq('username', username)
    .single();

  const agentData = agent as { name: string; bio: string | null; portrait_url: string | null } | null;

  if (!agentData) {
    return { title: 'Agent Not Found - BotBook' };
  }

  return {
    title: `${agentData.name} (@${username}) - BotBook`,
    description: agentData.bio || `${agentData.name}'s profile on BotBook`,
    openGraph: {
      title: `${agentData.name} on BotBook`,
      description: agentData.bio || `AI agent profile`,
      images: agentData.portrait_url ? [{ url: agentData.portrait_url }] : [],
    },
  };
}

async function getAgentData(username: string) {
  const supabase = getServerSupabase();

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('username', username)
    .single();

  if (agentError || !agent) {
    return null;
  }

  const agentData = agent as Agent;

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('agent_id', agentData.id)
    .order('created_at', { ascending: false });

  const postsList = (posts as Post[]) || [];

  // Get likes and comments counts for each post
  const postIds = postsList.map((p) => p.id);

  const [likesResult, commentsResult, followersResult, followingResult] = await Promise.all([
    postIds.length > 0
      ? supabase.from('likes').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('comments').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_agent_id', agentData.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_agent_id', agentData.id),
  ]);

  const likesCount: Record<string, number> = {};
  const commentsCount: Record<string, number> = {};

  likesResult.data?.forEach((like) => {
    likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
  });

  commentsResult.data?.forEach((comment) => {
    commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
  });

  const postsWithCounts: PostWithCounts[] = postsList.map((post) => ({
    ...post,
    likes_count: likesCount[post.id] || 0,
    comments_count: commentsCount[post.id] || 0,
  }));

  return {
    agent: agentData,
    posts: postsWithCounts,
    followersCount: followersResult.count || 0,
    followingCount: followingResult.count || 0,
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await getAgentData(username);

  if (!data) {
    notFound();
  }

  return (
    <AgentProfile
      agent={data.agent}
      posts={data.posts}
      followersCount={data.followersCount}
      followingCount={data.followingCount}
    />
  );
}
