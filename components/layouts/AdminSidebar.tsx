"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut, CircleUserRound, IdCard } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { config } from "@/utils/config";

export default function Sidebar() {
  const pathname = usePathname();
  const { userId, authToken, organizationId } = useAuth();

  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
  const [userEmail, setUserEmail] = useState("");

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/auth/logout`,
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

  useEffect(() => {
    setUserEmail(Cookies.get("user_email") || "");
  }, []);
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !authToken || !organizationId) return;
      try {
        const response = await fetch(
          `${config.BACKEND_URL}/v1/organizations/${organizationId}/users/${userId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (response.ok) {
          const result = await response.json();
          setUserData({
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
          });
        }
      } catch {}
    };
    fetchUserData();
  }, [userId, authToken, organizationId]);

  // Helper for active menu
  const isMenuActive = (path: string) => pathname === path;

  // Navigation config
  const navLinks = [
    {
      href: "/manage-vcard",
      title: "VCard",
      icon: <IdCard className="size-[24px]" />,
      active: isMenuActive("/manage-vcard"),
    },
    {
      href: "/profile",
      title: "Profile",
      icon: <CircleUserRound className="size-[24px]" />,
      active: isMenuActive("/profile"),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col items-center bg-primary text-white h-screen sticky top-0 w-[81px] p-4 z-50">
        {/* Logo at top */}
        <div className="mb-10 mt-1">
          <Image
            src="/svgs/Infinitylogo.svg"
            alt="Logo"
            width={44}
            height={21}
            className="h-[21px] w-[44px]"
            priority
          />
        </div>
        {/* Nav Icons */}
        <nav className="flex flex-col items-center gap-5 w-full">
          {navLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-center w-full p-3 rounded-lg transition-all duration-300
                ${item.active ? "bg-[#7F56D9] text-white" : "hover:bg-[#7F56D9] hover:text-white opacity-60"}
              `}
              title={item.title}
            >
              {item.icon}
            </Link>
          ))}
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="size-[24px]" />
          </button>
        </nav>
        {/* User info at bottom */}
        <div className="mt-auto mb-2 flex flex-col items-center w-full">
          <p className="text-white font-medium text-xs truncate max-w-[90px] text-center">
            {userData
              ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"
              : "User"}
          </p>
          <p className="text-white/60 text-xs truncate max-w-[90px] text-center">
            {userData?.email || userEmail || ""}
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed sm:hidden inset-x-0 bottom-0 z-50 bg-primary text-white flex items-center justify-between px-6 py-2 shadow-[0_-2px_10px_rgba(127,86,217,0.04)]">
        {/* Logo left */}
        <div className="flex items-center">
          <Image
            src="/svgs/Infinitylogo.svg"
            alt="Logo"
            width={34}
            height={18}
            className="h-[18px] w-[34px]"
            priority
          />
        </div>
        {/* Nav links center */}
        <div className="flex-1 flex justify-center items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300
                ${item.active ? "bg-[#7F56D9] text-white" : "hover:bg-[#7F56D9] hover:text-white opacity-60"}
              `}
              title={item.title}
            >
              {item.icon}
            </Link>
          ))}
        </div>
        {/* Logout & user info right */}
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="size-[22px]" />
          </button>
          <p className="text-white/80 text-[10px] font-medium text-right max-w-[56px] truncate">
            {userData
              ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"
              : "User"}
          </p>
        </div>
      </nav>
    </>
  );
}
