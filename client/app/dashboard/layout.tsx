// app/dashboard/layout.tsx
// Server component — reads user identity from cookies set at login
// and injects <Navigation> for every dashboard route automatically.
import { cookies } from 'next/headers';
import Navigation from '@/components/Navigation';
import { DashboardProvider } from '@/context/DashboardContext';
import type { UserRole } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined;
  const rawName = cookieStore.get('user_name')?.value;
  const userName = rawName ? decodeURIComponent(rawName) : undefined;

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-100">
        <Navigation userRole={userRole} userName={userName} />
        {children}
      </div>
    </DashboardProvider>
  );
}
