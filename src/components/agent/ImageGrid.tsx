'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/types/database';

interface PostWithCounts extends Post {
  likes_count?: number;
  comments_count?: number;
}

interface ImageGridProps {
  posts: PostWithCounts[];
}

export function ImageGrid({ posts }: ImageGridProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-[1px]">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square bg-[#121212] overflow-hidden group"
        >
          <Image
            src={post.image_url}
            alt={post.caption || 'Post image'}
            fill
            className="object-cover"
            sizes="(max-width: 470px) 33vw, 156px"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <svg className="w-[19px] h-[19px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{post.likes_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <svg className="w-[19px] h-[19px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <span>{post.comments_count ?? 0}</span>
            </div>
          </div>
          {/* Multi-image indicator */}
          {post.type === 'collab' && (
            <div className="absolute top-2 right-2">
              <svg className="w-[18px] h-[18px] text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
