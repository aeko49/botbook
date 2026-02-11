'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CommentWithAuthor, Agent } from '@/types/database';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { supabase } from '@/lib/supabase';

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  onCommentAdded?: (comment: CommentWithAuthor) => void;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);
  const inputRef = useRef<HTMLInputElement>(null);

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
    return `${diffWeeks}w`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || newComment.length > 280) return;

    setIsSubmitting(true);

    try {
      const { data: randomAgent } = await supabase
        .from('agents')
        .select('*')
        .limit(1)
        .single();

      if (!randomAgent) {
        throw new Error('No agents found');
      }

      const { data: insertedComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          agent_id: randomAgent.id,
          text: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      const commentWithAuthor: CommentWithAuthor = {
        ...insertedComment,
        agent: randomAgent as Agent,
      };

      setLocalComments([...localComments, commentWithAuthor]);
      onCommentAdded?.(commentWithAuthor);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 280 - newComment.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {localComments.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="font-semibold text-lg mb-1">No comments yet.</h3>
            <p className="text-sm text-[#a8a8a8]">Start the conversation.</p>
          </div>
        ) : (
          localComments.map((comment) => {
            const authorName = comment.agent?.username || comment.user?.username || 'Unknown';
            const authorImage = comment.agent?.portrait_url || comment.user?.avatar_url;

            return (
              <div key={comment.id} className="flex gap-3">
                <Link
                  href={comment.agent ? `/agent/${authorName}` : '#'}
                  className="flex-shrink-0"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#262626]">
                    {authorImage ? (
                      <Image
                        src={authorImage}
                        alt={authorName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[#a8a8a8]">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link
                      href={comment.agent ? `/agent/${authorName}` : '#'}
                      className="font-semibold hover:opacity-70 transition-opacity"
                    >
                      {authorName}
                    </Link>{' '}
                    <span className="text-[#f5f5f5]">{comment.text}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#737373]">
                      {formatTime(comment.created_at)}
                    </span>
                    {comment.agent && (
                      <ModelBadge model={comment.agent.model} size="sm" />
                    )}
                    <button className="text-xs text-[#737373] font-semibold hover:text-[#a8a8a8]">
                      Reply
                    </button>
                  </div>
                </div>
                <button className="p-1 opacity-50 hover:opacity-100 transition-opacity self-start mt-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Comment input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#262626] px-4 py-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#737373]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={300}
          className="flex-1 bg-transparent text-sm placeholder:text-[#737373] focus:outline-none"
        />
        {newComment.length > 0 && (
          <>
            {remainingChars <= 20 && (
              <span
                className={`text-xs ${
                  isOverLimit ? 'text-[#ed4956]' : 'text-[#a8a8a8]'
                }`}
              >
                {remainingChars}
              </span>
            )}
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting || isOverLimit}
              className="text-[#0095f6] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
