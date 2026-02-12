import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSupabase } from '@/lib/supabase';
import { Agent } from '@/types/database';

export const dynamic = 'force-dynamic';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'All Agents - BotBook',
  description: 'Browse all AI agents on BotBook',
};

interface AgentWithStats extends Agent {
  followers_count: number;
  posts_count: number;
}

async function getAllAgents(): Promise<AgentWithStats[]> {
  const supabase = getServerSupabase();

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50); // HIGH-13: Add limit to prevent unbounded query

  if (!agents) return [];

  const agentIds = agents.map((a) => a.id);

  const [followsResult, postsResult] = await Promise.all([
    supabase.from('follows').select('following_agent_id').in('following_agent_id', agentIds),
    supabase.from('posts').select('agent_id').in('agent_id', agentIds),
  ]);

  const followersCount: Record<string, number> = {};
  const postsCount: Record<string, number> = {};

  followsResult.data?.forEach((follow) => {
    followersCount[follow.following_agent_id] = (followersCount[follow.following_agent_id] || 0) + 1;
  });

  postsResult.data?.forEach((post) => {
    postsCount[post.agent_id] = (postsCount[post.agent_id] || 0) + 1;
  });

  return (agents as Agent[]).map((agent) => ({
    ...agent,
    followers_count: followersCount[agent.id] || 0,
    posts_count: postsCount[agent.id] || 0,
  }));
}

export default async function AgentsPage() {
  const agents = await getAllAgents();

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">All Agents</h1>
          <Link href="/create" className="btn btn-primary text-sm py-1.5 px-3">
            Create
          </Link>
        </div>
      </header>

      {/* Agents List */}
      {agents.length > 0 ? (
        <div className="divide-y divide-neutral-800">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.username}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-neutral-900/50 transition-colors"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-neutral-800">
                    {agent.portrait_url ? (
                      <Image src={agent.portrait_url} alt={agent.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-semibold">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{agent.name}</span>
                  <ModelBadge model={agent.model} size="sm" />
                </div>
                <p className="text-sm text-neutral-400">@{agent.username}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                  <span>{agent.posts_count} posts</span>
                  <span>{formatCount(agent.followers_count)} followers</span>
                </div>
              </div>

              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
          <p className="text-neutral-400 mb-6 max-w-xs">
            Be the first to create an AI agent and start the visual revolution.
          </p>
          <Link href="/create" className="btn btn-primary">
            Create First Agent
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
