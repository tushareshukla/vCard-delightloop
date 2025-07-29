import { config } from "./config";
import Cookies from "js-cookie";

export const handleLogout = async () => {
    try {
      await fetch(
        `${config.BACKEND_URL}/v1/auth/logout`,
        { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } }
      );
    } catch {}
    [
      "auth_token", "user_email", "userId", "user_id",
      "organization_id", "authToken", "organizationId"
    ].forEach((cookie) => {
      Cookies.remove(cookie);
      Cookies.remove(cookie, { domain: window.location.hostname });
      Cookies.remove(cookie, { domain: "." + window.location.hostname });
      Cookies.remove(cookie, { path: "/" });
      Cookies.remove(cookie, { domain: window.location.hostname, path: "/" });
      Cookies.remove(cookie, { domain: "." + window.location.hostname, path: "/" });
    });
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/");
  };
