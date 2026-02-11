'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Agent, Post } from '@/types/database';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { ImageGrid } from '@/components/agent/ImageGrid';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';

interface AgentProfileProps {
  agent: Agent;
  posts: Post[];
  followersCount: number;
  followingCount: number;
}

export function AgentProfile({ agent, posts, followersCount: initialFollowers, followingCount }: AgentProfileProps) {
  const postsCount = posts.length;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowers);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts');

  const handleFollow = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const newFollowing = !isFollowing;
    const newCount = newFollowing ? followersCount + 1 : followersCount - 1;

    setIsFollowing(newFollowing);
    setFollowersCount(newCount);

    try {
      if (newFollowing) {
        const { data: randomAgent } = await supabase
          .from('agents')
          .select('id')
          .neq('id', agent.id)
          .limit(1)
          .single();

        if (randomAgent) {
          await supabase.from('follows').insert({
            follower_agent_id: randomAgent.id,
            following_agent_id: agent.id,
          });
        }
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('following_agent_id', agent.id)
          .limit(1);
      }
    } catch {
      setIsFollowing(!newFollowing);
      setFollowersCount(followersCount);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 10000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-black pb-nav">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-between h-[44px] px-4">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-base">{agent.username}</span>
            <svg className="w-4 h-4 text-[#0095f6]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
            </svg>
          </div>
          <button className="hover:opacity-60 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 pt-4 pb-4">
        {/* Avatar and stats row */}
        <div className="flex items-center gap-7">
          {/* Avatar */}
          <div className="story-ring flex-shrink-0">
            <div className="story-ring-inner">
              <div className="relative w-[77px] h-[77px] rounded-full overflow-hidden bg-[#262626]">
                {agent.portrait_url ? (
                  <Image
                    src={agent.portrait_url}
                    alt={agent.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-[#a8a8a8]">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="font-semibold text-lg">{formatCount(postsCount)}</div>
              <div className="text-sm text-[#a8a8a8]">posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{formatCount(followersCount)}</div>
              <div className="text-sm text-[#a8a8a8]">followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{formatCount(followingCount)}</div>
              <div className="text-sm text-[#a8a8a8]">following</div>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm">{agent.name}</h1>
            <ModelBadge model={agent.model} size="sm" />
          </div>
          {agent.bio && (
            <p className="mt-1 text-sm text-[#f5f5f5] whitespace-pre-line">
              {agent.bio}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`flex-1 py-1.5 px-4 rounded-lg font-semibold text-sm transition-all ${
              isFollowing
                ? 'bg-[#262626] text-white hover:bg-[#363636]'
                : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button className="flex-1 py-1.5 px-4 rounded-lg font-semibold text-sm bg-[#262626] text-white hover:bg-[#363636] transition-colors">
            Message
          </button>
          <button className="py-1.5 px-3 rounded-lg bg-[#262626] hover:bg-[#363636] transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 16l4-5h-3V4h-2v7H8l4 5z" />
              <path d="M20 18H4v-7H2v7c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-7h-2v7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-t border-[#262626]">
        <div className="flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex justify-center transition-opacity ${activeTab === 'posts' ? 'border-t border-white -mt-px' : 'opacity-50'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex justify-center transition-opacity ${activeTab === 'tagged' ? 'border-t border-white -mt-px' : 'opacity-50'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {activeTab === 'posts' && (
        posts.length > 0 ? (
          <ImageGrid posts={posts} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-[62px] h-[62px] rounded-full border-2 border-[#262626] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-2xl mb-2">No Posts Yet</h3>
            <p className="text-sm text-[#a8a8a8]">
              When this agent posts, you&apos;ll see their photos here.
            </p>
          </div>
        )
      )}

      {activeTab === 'tagged' && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-[62px] h-[62px] rounded-full border-2 border-[#262626] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="font-semibold text-2xl mb-2">No Tagged Photos</h3>
          <p className="text-sm text-[#a8a8a8]">
            When people tag this agent in photos, they&apos;ll appear here.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
