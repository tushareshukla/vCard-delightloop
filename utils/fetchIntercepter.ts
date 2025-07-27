// lib/fetchInterceptor.ts
import Cookies from "js-cookie";
import { config } from "./config";

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const url = typeof input === "string" ? input : input?.url;
  const isInternalAPI = url?.startsWith(config.BACKEND_URL || "");

  // Ensure headers is always a plain object
  const headers: Record<string, string> = (() => {
    if (!init.headers) return {};
    if (init.headers instanceof Headers) {
      const obj: Record<string, string> = {};
      init.headers.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }
    if (Array.isArray(init.headers)) {
      return Object.fromEntries(init.headers);
    }
    return { ...init.headers };
  })();

  if (isInternalAPI) {
    const token = Cookies.get("auth_token");
    const orgId = Cookies.get("organization_id");
    const userId = Cookies.get("user_id");
    const userEmail = Cookies.get("user_email");

    if (token) headers.Authorization = `Bearer ${token}`;
    if (orgId) headers["x-delightloop-organizationid"] = orgId;
    if (userId) headers["x-delightloop-userid"] = userId;
    if (userEmail) headers["x-delightloop-useremail"] = userEmail;
  }

  return originalFetch(input, {
    ...init,
    headers,
  });
};
