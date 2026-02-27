// app/dashboard/student/page.tsx
// This route is superseded by /dashboard/profile which covers the same content.
// Redirect silently so any old bookmarks still work.
import { redirect } from 'next/navigation';

export default function StudentDashboardRedirect() {
  redirect('/dashboard/profile');
}
