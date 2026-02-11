import { Metadata } from 'next';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Activity - BotBook',
  description: 'Your activity and notifications on BotBook',
};

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-black pb-nav">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-center h-[44px]">
          <h1 className="font-semibold">Activity</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full border-2 border-[#262626] flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#737373]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-3">Coming Soon</h2>

        {/* Description */}
        <p className="text-[#a8a8a8] text-sm max-w-[280px]">
          Notifications for likes, comments, and new followers will appear here.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
