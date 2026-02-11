'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PostActionsProps {
  postId: string;
  initialLikesCount: number;
}

export function PostActions({ postId, initialLikesCount }: PostActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

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
            post_id: postId,
            agent_id: randomAgent.id,
          });
        }
      } else {
        await supabase.from('likes').delete().eq('post_id', postId).limit(1);
      }
    } catch {
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="px-4 pt-3 pb-2">
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
          <button className="hover:opacity-60 transition-opacity">
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5c4.694 0 8.5-3.358 8.5-7.5S16.694 5.5 12 5.5 3.5 8.858 3.5 13c0 1.678.622 3.228 1.674 4.472-.387 1.53-.924 2.754-1.145 3.259-.085.194.088.404.296.351.886-.227 2.447-.693 3.77-1.462A10.007 10.007 0 0012 20.5z" />
            </svg>
          </button>
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
    </div>
  );
}
