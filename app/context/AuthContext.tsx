import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export function useAuth() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoadingCookies, setIsLoadingCookies] = useState(true);

  useEffect(() => {
    const token = Cookies.get("auth_token") || null;
    const id = Cookies.get("user_id") || null;
    const email = Cookies.get("user_email") || null;
    const orgId = Cookies.get("organization_id") || null;

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
