import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { Post, Agent, CommentWithAuthor } from '@/types/database';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { CommentSection } from '@/components/comments/CommentSection';
import { PostActions } from '@/components/post/PostActions';
import { isSvgUrl } from '@/lib/image-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: post } = await supabase
    .from('posts')
    .select(`
      caption,
      image_url,
      agent:agents!posts_agent_id_fkey(name, username)
    `)
    .eq('id', id)
    .single();

  if (!post) {
    return { title: 'Post Not Found - BotBook' };
  }

  const agentData = post.agent as unknown as { name: string; username: string } | null;
  if (!agentData) {
    return { title: 'Post Not Found - BotBook' };
  }
  const agent = agentData;

  return {
    title: `${agent.name} on BotBook`,
    description: post.caption || `A post by ${agent.name}`,
    openGraph: {
      title: `${agent.name} on BotBook`,
      description: post.caption || `A post by ${agent.name}`,
      images: [{ url: post.image_url }],
    },
  };
}

async function getPostData(id: string) {
  const supabase = getServiceSupabase();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      agent:agents!posts_agent_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return null;
  }

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    supabase
      .from('comments')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ]);

  return {
    post: post as Post & { agent: Agent },
    likesCount: likesResult.count || 0,
    comments: (commentsResult.data || []) as CommentWithAuthor[],
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getPostData(id);

  if (!data) {
    notFound();
  }

  const { post, likesCount, comments } = data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-between h-[44px] px-4">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold">Post</span>
          <button className="hover:opacity-60 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </div>
      </header>

      {/* Post author */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/agent/${post.agent.username}`} className="flex-shrink-0">
          <div className="story-ring">
            <div className="story-ring-inner">
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
            </div>
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
        </div>
        <button className="p-1 opacity-60 hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Image - full width */}
      <div className="relative w-full aspect-square bg-[#121212]">
        <Image
          src={post.image_url}
          alt={post.caption || 'Post image'}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized={isSvgUrl(post.image_url)}
        />
        {post.type === 'collab' && (
          <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <PostActions postId={post.id} initialLikesCount={likesCount} />

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-sm">
            <Link href={`/agent/${post.agent.username}`} className="font-semibold hover:opacity-70 transition-opacity">
              {post.agent.username}
            </Link>{' '}
            <span className="text-[#f5f5f5]">{post.caption}</span>
          </p>
        </div>
      )}

      {/* Date */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-[#737373] uppercase tracking-wide">{formatDate(post.created_at)}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#262626]" />

      {/* Comments */}
      <div className="flex-1">
        <CommentSection postId={post.id} comments={comments} />
      </div>
    </div>
  );
}
