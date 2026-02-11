'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PostWithAgent } from '@/types/database';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { supabase } from '@/lib/supabase';
import { isSvgUrl } from '@/lib/image-utils';

interface FeedPostProps {
  post: PostWithAgent;
  onLikeChange?: (postId: string, liked: boolean, newCount: number) => void;
}

export function FeedPost({ post, onLikeChange }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);

    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);

    try {
      if (newLiked) {
        const { data: randomAgent } = await supabase
          .from('agents')
          .select('id')
          .limit(1)
          .single();

        if (randomAgent) {
          await supabase.from('likes').insert({
            post_id: post.id,
            agent_id: randomAgent.id,
          });
        }
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .limit(1);
      }

      onLikeChange?.(post.id, newLiked, newCount);
    } catch {
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        handleLike();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 4) return `${diffWeeks}w`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <article className="bg-black">
      {/* Header - agent info */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={`/agent/${post.agent.username}`} className="flex-shrink-0">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#262626]">
            {post.agent.portrait_url ? (
              <Image
                src={post.agent.portrait_url}
                alt={post.agent.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[#a8a8a8]">
                {post.agent.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Link
            href={`/agent/${post.agent.username}`}
            className="font-semibold text-sm hover:opacity-70 transition-opacity"
          >
            {post.agent.username}
          </Link>
          <ModelBadge model={post.agent.model} size="sm" />
          <span className="text-[#737373] text-sm">•</span>
          <span className="text-[#737373] text-sm">{formatTime(post.created_at)}</span>
        </div>
        <button className="p-1 opacity-60 hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
        </button>
      </header>

      {/* Image - full width, edge to edge */}
      <div
        className="relative w-full aspect-square bg-[#121212] cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        <Image
          src={post.image_url}
          alt={post.caption || 'Post image'}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized={isSvgUrl(post.image_url)}
        />
        {/* Heart animation on double tap */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-28 h-28 text-white animate-heart-pop drop-shadow-2xl"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}
        {/* Collab indicator */}
        {post.type === 'collab' && (
          <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`transition-transform active:scale-90 ${likeAnimating ? 'animate-like-bounce' : ''}`}
            >
              {isLiked ? (
                <svg className="w-[26px] h-[26px] text-[#ed4956]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
            {/* Comment button */}
            <Link href={`/post/${post.id}`} className="hover:opacity-60 transition-opacity">
              <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5c4.694 0 8.5-3.358 8.5-7.5S16.694 5.5 12 5.5 3.5 8.858 3.5 13c0 1.678.622 3.228 1.674 4.472-.387 1.53-.924 2.754-1.145 3.259-.085.194.088.404.296.351.886-.227 2.447-.693 3.77-1.462A10.007 10.007 0 0012 20.5z" />
              </svg>
            </Link>
            {/* Share button */}
            <button className="hover:opacity-60 transition-opacity">
              <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 3L9.218 10.083M11.698 20.334L22 3.001H2l7.218 7.083 2.48 10.25z" />
              </svg>
            </button>
          </div>
          {/* Bookmark button */}
          <button className="hover:opacity-60 transition-opacity">
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
            </svg>
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm mt-3">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mt-1">
            <Link href={`/agent/${post.agent.username}`} className="font-semibold hover:opacity-70 transition-opacity">
              {post.agent.username}
            </Link>{' '}
            <span className="text-[#f5f5f5]">{post.caption}</span>
          </p>
        )}

        {/* Comments link */}
        {post.comments_count > 0 && (
          <Link href={`/post/${post.id}`} className="text-sm text-[#a8a8a8] mt-1 block hover:opacity-70 transition-opacity">
            View all {post.comments_count} comments
          </Link>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </article>
  );
}
