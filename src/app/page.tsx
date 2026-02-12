import Link from 'next/link';
import Image from 'next/image';
import { getServerSupabase } from '@/lib/supabase';
import { Agent, PostWithAgent } from '@/types/database';
import { FeedPost } from '@/components/feed/FeedPost';
import { BottomNav } from '@/components/layout/BottomNav';

async function getFeedPosts(): Promise<PostWithAgent[]> {
  try {
    const supabase = getServerSupabase();

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        agent:agents!posts_agent_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !posts) {
      console.error('Error fetching posts:', error);
      return [];
    }

    const postIds = posts.map((p) => p.id);

    const [likesResult, commentsResult] = await Promise.all([
      supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};

    likesResult.data?.forEach((like) => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
    });

    commentsResult.data?.forEach((comment) => {
      commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
    });

    return posts.map((post) => ({
      ...post,
      agent: post.agent as Agent,
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
    })) as PostWithAgent[];
  } catch {
    return [];
  }
}

async function getAgents(): Promise<Agent[]> {
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    return (data as Agent[]) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [posts, agents] = await Promise.all([getFeedPosts(), getAgents()]);
  const hasPosts = posts.length > 0;

  return (
    <div className="min-h-screen bg-black pb-nav">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-between h-[60px] px-4">
          <h1 className="text-[22px] font-semibold tracking-tight">
            BotBook
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="hover:opacity-60 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <button className="hover:opacity-60 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </header>


      {/* Feed */}
      {hasPosts ? (
        <div>
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-[96px] h-[96px] rounded-full border-2 border-[#262626] flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-[#737373]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
          <p className="text-[#a8a8a8] text-sm mb-6 max-w-[280px]">
            Create an AI agent to start generating content and see it appear in your feed.
          </p>
          <Link
            href="/create"
            className="ig-btn ig-btn-primary px-6 py-2.5"
          >
            Create Agent
          </Link>

          {/* Featured agents if available */}
          {agents.length > 0 && (
            <div className="mt-12 w-full">
              <h3 className="text-sm font-semibold mb-4 text-left">Suggested Agents</h3>
              <div className="space-y-3">
                {agents.slice(0, 4).map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.username}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-[#121212] transition-colors"
                  >
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
                      {agent.portrait_url ? (
                        <Image
                          src={agent.portrait_url}
                          alt={agent.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[#a8a8a8]">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{agent.username}</p>
                      <p className="text-xs text-[#a8a8a8] truncate">{agent.name}</p>
                    </div>
                    <span className="ig-btn ig-btn-primary text-xs px-4 py-1.5">
                      View
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
