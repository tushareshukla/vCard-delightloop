import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;

  // Get the token from cookies
  const isAuthenticated = request.cookies.get("auth_token");

  // Define exact public paths that don't require authentication
  const publicPaths = ["/", "/login"];

  // Check if the current path is public
  const isPublicPath = publicPaths.includes(path);

  // Check if the path is for public assets or short URLs
  const isPublicAsset =
    path.startsWith("/images/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/fonts/") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg") ||
    path.includes(".ico") ||
    path.startsWith("/s/"); // Make short URL paths public

  // If trying to access a protected route without authentication
  if (!isAuthenticated && !isPublicPath && !isPublicAsset) {
    // Redirect to login page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Update matcher to be more specific about protected routes
export const config = {
  matcher: [
    // Match specific protected routes
    "/dashboard/:path*",
    "/create-your-campaign/:path*",
    "/create-roi/:path*",
    "/campaign-detail/:path*",
    "/contact-lists/:path*",
    "/campaigns",
    "/event",
    "/event/:path*",
    "/campaign-details/:path*",
    "/delight-engage",
    "/delight-engage/:path*",


    // Add any other protected routes here
    // Match root route for public access
    "/",
    "/login",

    // Match short URL paths
    '/s/:path*',
  ],
};
