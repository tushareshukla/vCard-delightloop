import { NextRequest } from "next/server";
import User from "@/models/User";
import { getUserFromRequestCookie } from "@/utils/getUserFromCookie";

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
      console.error('User not found in database');
      return { success: false, error: "User not found" };
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