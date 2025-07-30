import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { getUserFromRequestCookie } from "@/utils/getUserFromCookie";

// Define public routes that should redirect logged-in users
const PUBLIC_ROUTES = [
  '/',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/forgot-password/check-mail-page',
  '/auth/forgot-password/password-reset',
  '/auth/forgot-password/reset',
  '/auth/forgot-password/reset-success'
];

// Define routes that should always be accessible regardless of auth state
const ALWAYS_ACCESSIBLE_ROUTES = [
  '/vcard',  // Public vCard routes
  '/api',    // API routes
  '/auth/verify-email', // Email verification routes
  '/_next',  // Next.js internal routes
  '/favicon.ico',
  '/static'
];

interface ValidationResult {
  success: boolean;
  error?: string;
  user?: any;
}

export async function validateUser(request: NextRequest): Promise<ValidationResult> {
  console.log('🚀 Starting user validation from authMiddleware');
  try {
    // Log request headers for debugging
    console.log('Request headers:', {
      cookie: request.headers.get('cookie'),
      all_headers: Object.fromEntries(request.headers.entries())
    });

    // Get user data from cookie, using server-side function
    const userData = getUserFromRequestCookie(request);
    console.log('User data from request:', userData);

    if (!userData || !userData.userId) {
      console.error('No user data or userId found');
      return { success: false, error: "Authentication required" };
    }

    // Fetch user from database
    const user = await User.findById(userData.userId);
    console.log('Database user lookup:', {
      found: !!user,
      userId: userData.userId,
      userFound: user ? {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      } : null
    });

    if (!user) {
      console.error('No account found with that email. Try another or check for a typo.');
      return { success: false, error: "No account found with that email. Try another or check for a typo." };
    }

    if (!user.isActive) {
      console.error('User account is not active');
      return { success: false, error: "User account is not active" };
    }

    console.log('Authentication successful');
    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        organization_id: user.organization_id
      }
    };

  } catch (error) {
    console.error("Auth middleware error:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed"
    };
  }
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route);
}

export function isAlwaysAccessibleRoute(pathname: string): boolean {
  return ALWAYS_ACCESSIBLE_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for always accessible routes
  if (isAlwaysAccessibleRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const validationResult = await validateUser(request);
  const isAuthenticated = validationResult.success;

  // If authenticated user tries to access public routes, redirect to dashboard
  if (isAuthenticated && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/manage-vcard', request.url));
  }

  // For protected routes, check authentication
  if (!isPublicRoute(pathname) && !isAuthenticated) {
    const searchParams = new URLSearchParams(request.nextUrl.search);
    searchParams.set('from', pathname);
    return NextResponse.redirect(new URL(`/?${searchParams.toString()}`, request.url));
  }

  return NextResponse.next();
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
