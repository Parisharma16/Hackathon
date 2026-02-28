import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection proxy (Next.js 16+ replaces middleware.ts with proxy.ts).
 * Redirects unauthenticated users to /login when they access /dashboard routes.
 *
 * The exported function MUST be named "proxy" (not "middleware") in proxy.ts.
 * Ref: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export function proxy(request: NextRequest) {
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
