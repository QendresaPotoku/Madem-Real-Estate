import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'madem_session';

/**
 * Guards the dashboard: no session cookie → redirect to /login.
 * If already authenticated and hitting /login → redirect to the dashboard.
 * (The cookie's validity is enforced by the API; this is just routing UX.)
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/login';

  if (!hasSession && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, the API proxy, and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
