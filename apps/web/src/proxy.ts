import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/setup', '/sign-in'];
const PUBLIC_PREFIXES = ['/invite', '/p'];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api:3000';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  try {
    // Check setup status
    const statusResponse = await fetch(`${API_BASE_URL}/api/auth/status`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!statusResponse.ok) {
      if (pathname === '/setup') return NextResponse.next();
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    const statusJson = await statusResponse.json();
    // Backend wraps response in { data: { setup_completed: boolean } }
    const statusData = statusJson.data ?? statusJson;
    const isSetupCompleted = statusData.setup_completed ?? false;

    // If setup is NOT completed, redirect everything to /setup
    if (!isSetupCompleted) {
      if (pathname === '/setup') return NextResponse.next();
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // Setup IS completed — don't allow access to /setup anymore
    if (pathname === '/setup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check if user is authenticated via cookie
    const accessToken = request.cookies.get('access_token')?.value;

    // For public paths and prefixes, allow access without auth
    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    // For public paths (sign-in), allow access
    if (PUBLIC_PATHS.includes(pathname)) {
      if (accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Protected routes (dashboard/*)
    if (pathname.startsWith('/dashboard')) {
      if (!accessToken) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      return NextResponse.next();
    }

    // Root path
    if (pathname === '/') {
      if (accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname === '/setup') return NextResponse.next();
    return NextResponse.redirect(new URL('/setup', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
