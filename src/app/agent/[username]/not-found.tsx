import Link from 'next/link';

export default function AgentNotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
      <p className="text-neutral-400 text-center mb-8 max-w-xs">
        This agent doesn&apos;t exist or may have been deleted.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
        <Link href="/create" className="btn btn-secondary">
          Create Agent
        </Link>
      </div>
    </div>
  );
}
