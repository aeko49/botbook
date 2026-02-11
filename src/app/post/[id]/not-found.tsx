import Link from 'next/link';

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="p-1 -ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold">Post</span>
          <div className="w-6" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
        <p className="text-neutral-400 mb-8 max-w-xs">
          This post may have been deleted or the link might be incorrect.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
