"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut, CircleUserRound, IdCard, Search, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { config } from "@/utils/config";
import { handleLogout } from "@/utils/logout";
import TempLogo from "@/components/ui/TempLogo";

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
    }
  ];
  const sidebarConfig = {
    menuItems: navLinks,
    profileSection: {
      defaultPath: "/",
      defaultAvatar: "User",
      defaultName: "User",
      defaultEmail: "user@example.com",
    },
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
    	{/* //! (0) ------------ Mobile Sticky top bar  ------------ */}
			<div className="sticky  top-0 inset-x-0 z-50 bg-primary sm:hidden px-4 py-4 flex items-center justify-between">
				<Link href="/">
				<TempLogo v2={true} />
				</Link>
				<div
					className="grid gap-[5px] w-6"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					<div
						className={`h-[2px] bg-white rounded-full transition-all duration-150 ${
							mobileMenuOpen ? "-rotate-45 translate-y-[7px]" : ""
						}`}
					></div>
					<div
						className={`h-[2px] bg-white rounded-full transition-all duration-150 ${
							mobileMenuOpen ? "w-0" : "w-full"
						}`}
					></div>
					<div
						className={`h-[2px] bg-white rounded-full transition-all duration-150 ${
							mobileMenuOpen ? "rotate-45 -translate-y-[7px]" : ""
						}`}
					></div>
				</div>
			</div>
			{/* //! (1) ------------ Mobile Sidebar  ------------ */}
			<div
				className={`fixed inset-0 z-[9999] sm:hidden transition-all duration-300 ${
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex h-screen">
					<div className="w-[304px] bg-primary text-white flex flex-col">
						{/* //? ------------ Header ------------ */}
						<div className="px-7 py-4 border-b border-purple-400/20">
						<TempLogo v2={true} />
						</div>
						{/* //? ------------ Navigation ------------ */}
						<nav className="flex-1 px-4 py-6 overflow-y-auto">
							{/* Search Input (hidden if collapsed) */}



							{sidebarConfig.menuItems.map((item) => (
								<div key={item.title} className="mb-2">
									{ (
										<Link
											href={item.href}
											className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
												isMenuActive(item.href)
													? "bg-white/20 text-white"
													: "text-white/80 hover:bg-white/10 hover:text-white"
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											{item.icon &&
												item.icon}
											<span className="font-medium">{item.title}</span>
										</Link>
									)}
								</div>
							))}
						</nav>

						{/* //? ------------ Bottom Section ------------ */}
						<div className="p-4 border-t border-purple-400/20">
							{/* User Profile */}
							<Link
								href={sidebarConfig.profileSection.defaultPath}
								className={`flex items-center space-x-3  rounded-lg  transition-all duration-200 ${
									isMenuActive(sidebarConfig.profileSection.defaultPath)
										? "bg-[#7F56D9] text-white"
										: "hover:bg-[#7F56D9] hover:text-white opacity-60"
								}`}
								onClick={() => setMobileMenuOpen(false)}
							>
								<CircleUserRound className="size-5" />
								<div className={`flex-1 min-w-0 `}>
									<p className="text-white font-medium text-sm truncate">
										{userData?.firstName || ""} {userData?.lastName || ""}
									</p>
									<p className="text-white/60 text-xs truncate">
										{userData?.email || ""}
									</p>
								</div>

								<button className="p-1 hover:bg-white/10 text-sm flex gap-2 items-center rounded transition-colors">
									<LogOut className="size-4 text-white/70" />
									Log Out
								</button>
							</Link>
						</div>
					</div>

					{/* // ------------ Overlay ------------ */}
					<div
						className="flex-1 relative bg-black/20 backdrop-blur-sm"
						onClick={() => setMobileMenuOpen(false)}
					>
						<button
							onClick={() => setMobileMenuOpen(false)}
							className="text-white hover:text-gray-300 absolute top-4 right-4"
						>
							<X className="size-7" />
						</button>
					</div>
				</div>
			</div>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col items-center bg-primary text-white h-screen sticky top-0 w-[81px] p-4 z-50">
        {/* Logo at top */}
        <div className="mb-10 mt-1">
        <TempLogo v2={true} mobile={true}/>
        </div>
        {/* Nav Icons */}
        <nav className="flex flex-col justify-between h-full items-center gap-5 w-full">
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
        <div className="mt-auto mb-2 flex-col items-center w-full hidden">
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
      <nav className="hidden inset-x-0 bottom-0 z-50 bg-primary text-white  items-center justify-between px-6 py-2 shadow-[0_-2px_10px_rgba(127,86,217,0.04)]">
        {/* Logo left */}
       <TempLogo v2={true}/>

        <div className="flex items-center justify-between gap-6">
        {/* Nav links center */}
        <div className="flex-1 flex justify-center items-center gap-8 ">
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
        <div className="flex flex-col items-center gap-1 min-w-[60px] ">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="size-[22px]" />
          </button>
          <p className="text-white/80 text-[10px] font-medium text-right max-w-[56px] truncate hidden">
            {userData
              ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"
              : "User"}
          </p>
        </div>
        </div>
      </nav>
    </>
  );
}
