'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearTokens } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

interface NavigationProps {
  userRole?: UserRole;
  userName?: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

function getNavLinks(role?: UserRole): NavLink[] {
  const common: NavLink[] = [
    { href: '/dashboard',             label: 'Events',       icon: '🎪' },
    { href: '/dashboard/leaderboard', label: 'Leaderboard',  icon: '🏆' },
    { href: '/dashboard/shop',        label: 'Shop',         icon: '🛍️' },
    { href: '/dashboard/profile',     label: 'My Profile',   icon: '👤' },
  ];

  const organizerLinks: NavLink[] = [
    { href: '/dashboard/events/create',       label: 'Create Event',       icon: '➕' },
    { href: '/dashboard/organizer/capture',   label: 'Capture Attendance', icon: '📸' },
  ];

  const adminLinks: NavLink[] = [
    { href: '/dashboard/admin', label: 'Admin Panel', icon: '⚙️' },
  ];

  if (role === 'organizer') return [...common, ...organizerLinks];
  if (role === 'admin')     return [...common, ...adminLinks];
  return common;
}

export default function Navigation({ userRole, userName }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navLinks = getNavLinks(userRole);

  const handleLogout = () => {
    clearTokens();
    router.push('/');
  };

  const close = () => setIsOpen(false);

  return (
    <>
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/dashboard" className="text-base font-bold text-gray-900">
          CampusEngage
        </Link>
      </header>

      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar drawer ─────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">CampusEngage</span>
          <button
            onClick={close}
            aria-label="Close menu"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        {userName && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-sm">{getInitials(userName)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
