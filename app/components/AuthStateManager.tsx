"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Define public routes that should redirect logged-in users
const PUBLIC_ROUTES = [
  "/",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/forgot-password/check-mail-page",
  "/auth/forgot-password/password-reset",
  "/auth/forgot-password/reset",
  "/auth/forgot-password/reset-success",
  "/login",
];

// Define routes that should always be accessible regardless of auth state
const ALWAYS_ACCESSIBLE_ROUTES = [
  "/vcard", // Public vCard routes (legacy)
  "/api", // API routes
  "/auth/verify-email", // Email verification routes
  "/_next", // Next.js internal routes
  "/favicon.ico",
  "/static",
  // Add root-level vCard routes
  "/[handle]", // Dynamic vCard routes at root level
];

export default function AuthStateManager() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let authChannel;

    try {
      if (typeof BroadcastChannel !== "undefined") {
        authChannel = new BroadcastChannel("auth_channel");

        // Listen for login in other tabs
        authChannel.onmessage = (event) => {
          if (event.data.type === "OTHER_TAB_LOGIN") {
            // Get current tab's ID
            const currentTabId = Cookies.get("current_tab_id");

            // Only proceed if this is a different tab
            if (currentTabId !== event.data.sourceTabId) {
              // Just redirect to login, cookies are already handled by the login tab
              window.location.href = "/?session_ended=true";
            }
          }
        };
      }
    } catch (error) {
      console.warn("AuthStateManager: BroadcastChannel not supported");
    }

    // Check if user is logged in
    const authToken = Cookies.get("auth_token");
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAlwaysAccessible = ALWAYS_ACCESSIBLE_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // If user is logged in and trying to access a public route
    if (authToken && isPublicRoute && !isAlwaysAccessible) {
      router.replace("/manage-vcard");
    }

    // Cleanup
    return () => {
      if (authChannel) {
        authChannel.close();
      }
    };
  }, [pathname, router]);

  return null;
}
