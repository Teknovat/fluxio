import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from './lib/jwt-edge';

/**
 * Next.js middleware for route protection and authentication
 * Handles:
 * - Redirecting unauthenticated users to login
 * - Redirecting authenticated users away from login page
 * - Enforcing admin-only routes
 */
export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token');
    const { pathname } = request.nextUrl;

    // Handle login page
    if (pathname.startsWith('/login')) {
        // If user is already authenticated, redirect to mouvements
        if (token) {
            const payload = verifyTokenEdge(token.value);
            if (payload) {
                return NextResponse.redirect(new URL('/mouvements', request.url));
            }
        }
        // Allow access to login page for unauthenticated users
        return NextResponse.next();
    }

    // All other routes require authentication
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token validity
    const payload = verifyTokenEdge(token.value);
    if (!payload) {
        // Invalid or expired token - redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check admin-only routes
    const adminRoutes = ['/intervenants', '/utilisateurs'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute && payload.role !== 'ADMIN') {
        // Non-admin user trying to access admin route - redirect to mouvements
        return NextResponse.redirect(new URL('/mouvements', request.url));
    }

    // Allow access to the route
    return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Excludes:
 * - API routes (/api/*)
 * - Static files (_next/static/*)
 * - Image optimization (_next/image/*)
 * - Favicon and other public files
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
    ],
};
