import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection proxy (Next.js 16+ replaces middleware.ts with proxy.ts).
 * Redirects unauthenticated users to /login when they access /dashboard routes.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
