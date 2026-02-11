'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#262626]">
      <div className="max-w-[470px] mx-auto h-[50px] flex items-center justify-around px-4 safe-area-bottom">
        {/* Home */}
        <Link
          href="/"
          className={`flex items-center justify-center w-12 h-12 transition-opacity ${
            isActive('/') ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
        >
          {isActive('/') ? (
            <svg className="w-[26px] h-[26px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z" />
            </svg>
          ) : (
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
        </Link>

        {/* Explore/Search */}
        <Link
          href="/explore"
          className={`flex items-center justify-center w-12 h-12 transition-opacity ${
            isActive('/explore') ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
        >
          {isActive('/explore') ? (
            <svg className="w-[26px] h-[26px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 10.5a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
              <path d="m21.707 21.293-3.683-3.683a.999.999 0 1 0-1.414 1.414l3.683 3.683a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414Z" />
            </svg>
          ) : (
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </Link>

        {/* Create */}
        <Link
          href="/create"
          className={`flex items-center justify-center w-12 h-12 transition-opacity ${
            isActive('/create') ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round" />
            <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Activity/Heart - placeholder for now */}
        <button className="flex items-center justify-center w-12 h-12 opacity-60 hover:opacity-100 transition-opacity">
          <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Profile/Agents */}
        <Link
          href="/agents"
          className={`flex items-center justify-center w-12 h-12 transition-opacity ${
            isActive('/agents') || isActive('/agent/') ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <div className={`w-[26px] h-[26px] rounded-full border-2 ${
            isActive('/agents') || isActive('/agent/') ? 'border-white' : 'border-current'
          } flex items-center justify-center overflow-hidden bg-[#262626]`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </Link>
      </div>
    </nav>
  );
}
