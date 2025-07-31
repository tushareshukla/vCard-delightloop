import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Helper to set auth data in both localStorage and cookies
export const setAuthData = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
  Cookies.set(key, value);
};

// Helper to clear auth data from both localStorage and cookies
export const clearAuthData = (key: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
  Cookies.remove(key);
};

export function useAuth() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoadingCookies, setIsLoadingCookies] = useState(true);

  useEffect(() => {
    // Check cookies first, then migrate from localStorage if needed
    const getAuthData = (key: string) => {
      // Try cookies first
      const cookieValue = Cookies.get(key);
      if (cookieValue) {
        return cookieValue;
      }

      // If no cookie, check localStorage and migrate
      if (typeof window !== "undefined") {
        const localValue = localStorage.getItem(key);
        if (localValue) {
          // Copy to cookies and delete from localStorage
          Cookies.set(key, localValue);
          localStorage.removeItem(key);
          return localValue;
        }
      }

      return null;
    };

    const token = getAuthData("auth_token");
    const id = getAuthData("user_id");
    const email = getAuthData("user_email");
    const orgId = getAuthData("organization_id");

    setAuthToken(token);
    setUserId(id);
    setUserEmail(email);
    setOrganizationId(orgId);

    setIsLoadingCookies(false);
  }, []);

  return {
    authToken,
    userId,
    userEmail,
    organizationId,
    isLoadingCookies,
  };
}
