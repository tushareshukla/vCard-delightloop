"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut, CircleUserRound, IdCard } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

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
  const HandleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {}
    // Remove all possible cookies and clear storage
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
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/users/${userId}`,
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

  // Highlight current menu
  const isMenuActive = (path: string) => pathname === path;

  // Core icons array for easy rendering
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
      {/* Desktop: left vertical */}
      <div className="hidden sm:flex flex-col justify-start items-center bg-primary text-white sm:h-screen sm:sticky sm:top-0 sm:w-[81px] sm:p-4 px-3 z-50 rounded-t-lg">
        <div className="flex flex-col items-center w-full">
          {/* Logo at the very top */}
          <div className="pt-2 mb-8 w-full flex justify-center">
            <Image
              src="/svgs/Infinitylogo.svg"
              alt="Logo"
              width={44}
              height={21}
              className="h-[21px] w-[44px]"
              priority
            />
          </div>
          {/* Nav icons */}
          <nav className="flex flex-col items-center space-y-4 w-full">
            {navLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center justify-center w-full p-3 rounded-lg transition-all duration-300 ${
                  item.active
                    ? "bg-[#7F56D9] text-white"
                    : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                }`}
                title={item.title}
              >
                {item.icon}
              </Link>
            ))}
            {/* Logout */}
            <button
              onClick={HandleLogout}
              className="flex items-center justify-center w-full p-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="size-[24px]" />
            </button>
          </nav>
          {/* User info always shown at the bottom */}
          <div className="mt-8 flex flex-col items-center w-full">
            <p className="text-white font-medium text-xs truncate max-w-[90px] text-center">
              {userData
                ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"
                : "User"}
            </p>
            <p className="text-white/60 text-xs truncate max-w-[90px] text-center">
              {userData?.email || userEmail || ""}
            </p>
          </div>
        </div>
      </div>
      {/* Mobile: bottom horizontal */}
      <div className="fixed sm:hidden inset-x-0 bottom-0 z-50 bg-primary text-white flex items-center justify-between px-6 py-2 shadow-[0_-2px_10px_rgba(127,86,217,0.04)]">
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
        {/* Nav links */}
        <nav className="flex-1 flex justify-center items-center gap-7">
          {navLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                item.active
                  ? "bg-[#7F56D9] text-white"
                  : "hover:bg-[#7F56D9] hover:text-white opacity-60"
              }`}
              title={item.title}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
        {/* Logout and user info on right */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={HandleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="size-[22px]" />
          </button>
          <p className="text-white/80 text-[10px] font-medium text-right max-w-[68px] truncate">
            {userData
              ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"
              : "User"}
          </p>
        </div>
      </div>
    </>
  );
}
