"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  Megaphone,
  LogOut,
  Container,
  LayoutDashboard,
  Calendar,
  SquareUserRound,
  MailPlus,
  Warehouse,
  StickyNote,
  Wallet,
  CircleUserRound,
  IdCard,
} from "lucide-react";
import { Gift } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
// Add context menu interface
interface ContextMenu {
  show: boolean;
  x: number;
  y: number;
  menuType: string;
}

export default function Sidebar() {
  const [sidebaropen, setSidebaropen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    show: false,
    x: 0,
    y: 0,
    menuType: "",
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth and user data
  const { userId, authToken, organizationId } = useAuth();
  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const vcarduserParam = searchParams.get("vcarduser");
//   console.log("vcarduser", vcarduserParam);

  const [vcarduser, setVcarduser] = useState(
    vcarduserParam === "true" ? true : false
  );

  const HandleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include", // Important: include cookies in the request
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Server logout failed:", error);
    }

    // Remove client-side cookies with various domain/path combinations
    const cookiesToRemove = [
      "auth_token",
      "user_email",
      "userId",
      "user_id",
      "organization_id",
      "authToken",
      "organizationId",
    ];

    cookiesToRemove.forEach((cookieName) => {
      // Try removing with default options
      Cookies.remove(cookieName);

      // Try removing with domain options
      Cookies.remove(cookieName, { domain: window.location.hostname });
      Cookies.remove(cookieName, { domain: "." + window.location.hostname });

      // Try removing with path options
      Cookies.remove(cookieName, { path: "/" });
      Cookies.remove(cookieName, {
        domain: window.location.hostname,
        path: "/",
      });
      Cookies.remove(cookieName, {
        domain: "." + window.location.hostname,
        path: "/",
      });
    });

    // Clear any remaining cookies by iterating through all cookies
    const allCookies = document.cookie.split(";");
    allCookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        Cookies.remove(name);
        Cookies.remove(name, { path: "/" });
        Cookies.remove(name, { domain: window.location.hostname });
        Cookies.remove(name, { domain: "." + window.location.hostname });
        Cookies.remove(name, { domain: window.location.hostname, path: "/" });
        Cookies.remove(name, {
          domain: "." + window.location.hostname,
          path: "/",
        });
      }
    });

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Force a hard redirect to clear any remaining session data
    window.location.replace("/");
  };
  // Add useEffect to handle client-side cookie reading
  useEffect(() => {
    const email = Cookies.get("user_email") || "";
    setUserEmail(email);
  }, []);

  // Fetch user data when userId is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !authToken || !organizationId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          //   console.log("Backend user data response:", result);

          // Handle the response structure from backend API
          if (result) {
            setUserData({
              firstName: result.firstName,
              lastName: result.lastName,
              email: result.email,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data from backend:", error);
      }
    };

    fetchUserData();
  }, [userId, authToken, organizationId]);

  // Handle context menu click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu({ show: false, x: 0, y: 0, menuType: "" });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, menuType: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      menuType,
    });
  };

  // Function to handle submenu toggling
  const handleMenuClick = (menu) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  // Function to check if a menu item is active based on pathname
  const isMenuActive = (path: string) => {
    return pathname === path;
  };

  // Helper function to get menu item classes
  const getMenuItemClasses = (path: string) => {
    return `flex items-center hover:bg-[#7F56D9] hover:rounded-lg hover:w-full group transition-all duration-300 ease-in-out transform hover:translate-x-1 ${
      isMenuActive(path) ? "bg-[#7F56D9] rounded-lg" : ""
    }`;
  };

  return (
    <>
      <style jsx global>{`
        .menu-item {
          position: relative;
          transition: all 0.3s ease;
        }

        .menu-item::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: #7f56d9;
          transition: all 0.3s ease;
          transform: translateX(-50%);
          opacity: 0;
        }

        .menu-item:hover::after {
          width: 100%;
          opacity: 1;
        }

        .context-menu {
          animation: scaleIn 0.2s ease-out;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .menu-hover-effect {
          transition: all 0.3s ease;
        }

        .menu-hover-effect:hover {
          transform: translateX(4px);
          background: rgba(127, 86, 217, 0.1);
        }
      `}</style>
      {/* //! ----------- Mobile Menu ------------ */}

      <div className="sticky top-0 inset-x-0 z-50 bg-primary sm:hidden px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <Image
            src="/img/bigHeaderFromDashboard.png"
            alt="Logo"
            width={500}
            height={321}
            className="w-32"
          />
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

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-[9999] sm:hidden transition-all duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-screen">
          {/* Sidebar Content */}
          <div className="w-[304px] bg-primary text-white flex flex-col">
            {/* Header */}
            <div className="px-7 py-4 border-b border-purple-400/20">
              <Image
                src="/img/bigHeaderFromDashboard.png"
                alt="Logo"
                width={500}
                height={321}
                className="w-32"
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              {/* Home */}
              {/* <div className="mb-2">
                <Link
                  href="/dashboard"
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="font-medium">Home</span>
                  </div>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div> */}

              {/*  //? ------------ Dashboard ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </div>

              {/*  //? ------------ Events ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname.startsWith("/event")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("events")}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Events</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "events" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "events" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/event"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/event")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Events
                    </Link>
                    <Link
                      href="/event/create"
                      className={`block p-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
                        isMenuActive("/event/create")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Event
                    </Link>
                  </div>
                )}
              </div>

              {/*  //? ------------ Campaigns ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/campaigns" || pathname === "/create-campaign"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("campaigns")}
                >
                  <div className="flex items-center space-x-3">
                    <Megaphone className="w-5 h-5" />
                    <span className="font-medium">Campaigns</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "campaigns" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "campaigns" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/campaigns"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/campaigns")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Campaigns
                    </Link>
                    <Link
                      href="/campaigns/create"
                      className={`block p-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
                        isMenuActive("/create-campaign")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Campaign
                    </Link>
                  </div>
                )}
              </div>

              {/*  //? ------------ Contact Lists ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/contact-lists"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/contact-lists")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <SquareUserRound className="w-5 h-5" />
                  <span className="font-medium">Contact Lists</span>
                </Link>
              </div>

              {/*  //? ------------ Playbooks ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/playbook" || pathname === "/playbook/create"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("playbooks")}
                >
                  <div className="flex items-center space-x-3">
                    <StickyNote className="w-5 h-5" />
                    <span className="font-medium">Playbooks</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "playbooks" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "playbooks" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/playbook"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/playbook")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Playbooks
                    </Link>
                    <Link
                      href="/playbook/create"
                      className={`block p-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
                        isMenuActive("/playbook/create")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Playbook
                    </Link>
                  </div>
                )}
              </div>

              {/*  //? ------------ Delight Engage ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/delight-engage"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/delight-engage")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MailPlus className="w-5 h-5" />
                  <span className="font-medium">Delight Engage</span>
                </Link>
              </div>

              {/*  //? ------------ Gifting Activities ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/dashboard/gifting-activities" ||
                    pathname === "/dashboard/playbook-run"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("gifting-activities")}
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">Gifting Activities</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "gifting-activities" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "gifting-activities" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/dashboard/gifting-activities"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/dashboard/gifting-activities")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/playbook-run"
                      className={`block p-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
                        isMenuActive("/dashboard/playbook-run")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Send Gift
                    </Link>
                  </div>
                )}
              </div>

              {/*  //? ------------ Inventory ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/inventory"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard/inventory")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Container className="w-5 h-5" />
                  <span className="font-medium">Inventory</span>
                </Link>
              </div>

              {/*  //? ------------ Warehouse Activities ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/dashboard/warehouse-activities" ||
                    pathname === "/dashboard/warehouse-activities/add"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("warehouse-activities")}
                >
                  <div className="flex items-center space-x-3">
                    <Warehouse className="w-5 h-5" />
                    <span className="font-medium">Warehouse Activities</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "warehouse-activities" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "warehouse-activities" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/dashboard/warehouse-activities"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/dashboard/warehouse-activities")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/warehouse-activities/add"
                      className={`block p-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors ${
                        isMenuActive("/dashboard/warehouse-activities/add")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Send Your Inventory to Delightloop
                    </Link>
                  </div>
                )}
              </div>

              {/* //? ------------ V Card ------------ */}
              <div className="mb-2">
                <Link
                  href="/manage-vcard"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/manage-vcard")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IdCard className="w-5 h-5" />
                  <span className="font-medium">VCard</span>
                </Link>
              </div>
              {/* //? ------------ Wallet ------------ */}
              <div className={`mb-2 ${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/wallet"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard/wallet")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">Wallet</span>
                </Link>
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-purple-400/20">
              {/* Support & Settings */}
              {/* <div className="space-y-2 mb-4">
                <Link
                  href="/support"
                  className="flex items-center space-x-3 p-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.196l1.335-.67a1 1 0 011.365.098l1.83 1.83a1 1 0 01.098 1.365L15.958 6.04M6.04 15.958l.67-1.335a1 1 0 011.365-.098l1.83 1.83a1 1 0 01.098 1.365L8.772 19.05"
                    />
                  </svg>
                  <span className="font-medium">Support</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center space-x-3 p-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">Settings</span>
                </Link>
              </div> */}

              {/* User Profile */}

              <Link
                href="/profile"
                className={`flex items-center space-x-3  rounded-lg ${
                  vcarduser ? "w-fit" : "p-3"
                } transition-all duration-200 ${
                  isMenuActive("/profile")
                    ? "bg-[#7F56D9] text-white"
                    : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <CircleUserRound
                  className={`w-5 h-5 ${vcarduser ? "hidden" : ""}`}
                />
                <div className={`flex-1 min-w-0 ${vcarduser ? "hidden" : ""}`}>
                  <p className="text-white font-medium text-sm truncate">
                    {userData
                      ? `${userData.firstName || ""} ${
                          userData.lastName || ""
                        }`.trim() || "User"
                      : "Loading..."}
                  </p>
                  <p className="text-white/60 text-xs truncate">
                    {userData?.email || userEmail || "No email available"}
                  </p>
                </div>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await HandleLogout();
                  }}
                  className="p-1 hover:bg-white/10 text-sm flex gap-2 items-center rounded transition-colors"
                >
                  <LogOut className="w-4 h-4 text-white/70" />
                  {vcarduser ? " Log Out" : ""}
                </button>
              </Link>
            </div>
          </div>

          {/* Overlay */}
          <div
            className="flex-1 relative bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white hover:text-gray-300 absolute top-4 right-4"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* //! ----------- Desktop Menu ------------ */}
      <div
        className={`   bg-primary z-50 text-white  sm:h-screen    sm:sticky sm:top-0 hidden sm:flex sm:flex-col justify-between sm:justify-normal px-3 rounded-t-lg sm:rounded-t-none ${
          sidebaropen ? "sm:w-[81px] sm:p-4 sm:pt-6" : " sm:p-6"
        } duration-100`}
      >
        <div>
          {/* Logo */}
          <div className=" pt-2 sm:pt-0 sm:mb-6 ml-1 cursor-pointer">
            {!sidebaropen ? (
              <Image
                src="/img/bigHeaderFromDashboard.png"
                alt="Logo"
                width={500}
                height={321}
                onClick={() => setSidebaropen(!sidebaropen)}
                className="w-40 "
              />
            ) : (
              <Image
                src="/svgs/Infinitylogo.svg"
                alt="Logo"
                width={281}
                height={221}
                onClick={() => setSidebaropen(!sidebaropen)}
                className="pr-1   h-[21px] w-[44px] "
              />
            )}
          </div>
          {/* Search Input (hidden if collapsed) */}
          {/* {!sidebaropen && (
            <div className="mb-6 relative">
              <Image
                src="/svgs/searchu.svg"
                alt="Search Icon"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full h-10 rounded-md bg-[#7F56D9] pl-10 text-white placeholder-white placeholder:text-[16px] placeholder:font-[400]"
              />
            </div>
          )} */}
        </div>
        {/* Sidebar Menu */}
        <nav className="sm:flex-grow  h-60 overflow-y-auto  scrollbar-hide">
          {!sidebaropen ? (
            // Expanded Desktop Menu (similar to mobile)
            <ul className="space-y-2">
              {/* Dashboard */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>

              {/* Events */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname.startsWith("/event")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("events")}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Events</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "events" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "events" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/event"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/event")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      All Events
                    </Link>
                    <Link
                      href="/event/create"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/event/create")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Create Event
                    </Link>
                  </div>
                )}
              </li>

              {/* Campaigns */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/campaigns" ||
                    pathname === "/create-campaign" ||
                    pathname === "/create-your-campaign"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("campaigns")}
                >
                  <div className="flex items-center space-x-3">
                    <Megaphone className="w-5 h-5" />
                    <span className="font-medium">Campaigns</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "campaigns" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "campaigns" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/campaigns"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/campaigns")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      All Campaigns
                    </Link>
                    <Link
                      href="/campaigns/create"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/create-your-campaign") ||
                        isMenuActive("/create-campaign")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Create Campaign
                    </Link>
                  </div>
                )}
              </li>

              {/* Contact Lists */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/contact-lists"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/contact-lists")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <SquareUserRound className="w-5 h-5" />
                  <span className="font-medium">Contact Lists</span>
                </Link>
              </li>

              {/* Playbooks */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/playbook" || pathname === "/playbook/create"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("playbooks")}
                >
                  <div className="flex items-center space-x-3">
                    <StickyNote className="w-5 h-5" />
                    <span className="font-medium">Playbooks</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "playbooks" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "playbooks" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/playbook"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/playbook")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      All Playbooks
                    </Link>
                    <Link
                      href="/playbook/create"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/playbook/create")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Create Playbook
                    </Link>
                  </div>
                )}
              </li>

              {/* Delight Engage */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/delight-engage"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/delight-engage")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <MailPlus className="w-5 h-5" />
                  <span className="font-medium">Delight Engage</span>
                </Link>
              </li>

              {/* Gifting Activities */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/dashboard/gifting-activities" ||
                    pathname === "/dashboard/playbook-run"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("gifting-activities")}
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">Gifting Activities</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "gifting-activities" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "gifting-activities" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/dashboard/gifting-activities"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/dashboard/gifting-activities")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/playbook-run"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/dashboard/playbook-run")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Send Gift
                    </Link>
                  </div>
                )}
              </li>

              {/* Inventory */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/inventory"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard/inventory")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Container className="w-5 h-5" />
                  <span className="font-medium">Inventory</span>
                </Link>
              </li>

              {/* Warehouse Activities */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    pathname === "/dashboard/warehouse-activities" ||
                    pathname === "/dashboard/warehouse-activities/add"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleMenuClick("warehouse-activities")}
                >
                  <div className="flex items-center space-x-3">
                    <Warehouse className="w-5 h-5" />
                    <span className="font-medium">Warehouse Activities</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === "warehouse-activities" ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {activeMenu === "warehouse-activities" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <Link
                      href="/dashboard/warehouse-activities"
                      className={`block p-2 rounded text-sm transition-colors ${
                        isMenuActive("/dashboard/warehouse-activities")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/warehouse-activities/add"
                      className={`block p-2 rounded text-sm transition-colors w-40  ${
                        isMenuActive("/dashboard/warehouse-activities/add")
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Send Your Inventory to Delightloop
                    </Link>
                  </div>
                )}
              </li>

              {/* V Card */}
              <li>
                <Link
                  href="/manage-vcard"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/manage-vcard")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <IdCard className="w-5 h-5" />
                  <span className="font-medium">VCard</span>
                </Link>
              </li>
              {/* Wallet */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/wallet"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isMenuActive("/dashboard/wallet")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">Wallet</span>
                </Link>
              </li>
            </ul>
          ) : (
            // Collapsed Desktop Menu (Icons Only - Direct Links)
            <ul className="grid gap-3 ">
              {/* Dashboard */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/dashboard")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Dashboard"
                >
                  <LayoutDashboard className="size-[22px]" />
                </Link>
              </li>

              {/* Events */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/event"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    pathname.startsWith("/event")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Events"
                >
                  <Calendar className="size-[22px]" />
                </Link>
              </li>

              {/* Campaigns */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/campaigns"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    pathname.startsWith("/campaign")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Campaigns"
                >
                  <Megaphone className="size-[22px]" />
                </Link>
              </li>

              {/* Contact Lists */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/contact-lists"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/contact-lists")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Contact Lists"
                >
                  <SquareUserRound className="size-[22px]" />
                </Link>
              </li>

              {/* Playbooks */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/playbook"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    pathname.startsWith("/playbook")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Playbooks"
                >
                  <StickyNote className="size-[22px]" />
                </Link>
              </li>

              {/* Delight Engage */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/delight-engage"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/delight-engage")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Delight Engage"
                >
                  <MailPlus className="size-[22px]" />
                </Link>
              </li>

              {/* Gifting Activities */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/gifting-activities"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    pathname.startsWith("/dashboard/gifting-activities") ||
                    pathname.startsWith("/dashboard/playbook-run")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Gifting Activities"
                >
                  <Gift className="size-[24px]" />
                </Link>
              </li>

              {/* Inventory */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/inventory"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/dashboard/inventory")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Inventory"
                >
                  <Container className="size-[23px]" />
                </Link>
              </li>

              {/* Warehouse Activities */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/warehouse-activities"
                  className={`flex items-center justify-center p-3 mx-auto w-fit rounded-lg transition-all duration-300 ${
                    pathname.startsWith("/dashboard/warehouse-activities")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Warehouse Activities"
                >
                  <Warehouse className="size-[22px]" />
                </Link>
              </li>
              {/* //? ------------ V Card ------------ */}
              <li className="">
                <Link
                  href="/manage-vcard"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/manage-vcard")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="VCard"
                >
                  <IdCard className="size-[24px]" />
                </Link>
              </li>
              {/* Wallet */}
              <li className={`${vcarduser ? "hidden" : ""}`}>
                <Link
                  href="/dashboard/wallet"
                  className={`flex items-center w-fit mx-auto justify-center p-3 rounded-lg transition-all duration-300 ${
                    isMenuActive("/dashboard/wallet")
                      ? "bg-[#7F56D9] text-white"
                      : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                  }`}
                  title="Wallet"
                >
                  <Wallet className="size-[24px]" />
                </Link>
              </li>
            </ul>
          )}
        </nav>
        {/* Settings and Support */}
        {/* <div className="mb-6 gap-8">
          <div className=" items-center space-x-2 hover:bg-[#7F56D9]  hover:rounded-lg hover:w-full hover:text-white hidden">
            <Link href="/playbook">
              <Image
                src="/svgs/support.svg"
                alt="Support"
                className={`${sidebaropen ? "size-6 m-2" : "size-6 m-2"}`}
                width={200}
                height={200}
              />
            </Link>
            {!sidebaropen && <span>Support</span>}
          </div>
          <div className="mt-5">
            <div className=" items-center space-x-2 hover:text-white hover:bg-[#7F56D9]  hover:rounded-lg hover:w-full mb-2 hidden">
              <Link href="/dashboard/gifting-activities">
                <Image
                  src="/svgs/settings.svg"
                  alt="Settings"
                  className={`${sidebaropen ? "size-6 m-2" : "size-6 m-2"}`}
                  width={200}
                  height={200}
                />
              </Link>
              {!sidebaropen && <span>Settings</span>}
            </div>
          </div>
        </div> */}
        {/* HR Line */}
        <hr
          className={`
            ${sidebaropen ? "w-[49px]" : "w-full"}
            h-[1px] hidden sm:block bg-[#7F56D9] border-0 mb-4
          `}
        />
        {/* Profile at the bottom */}
        <div className="sm:mt-auto">
          {!sidebaropen ? (
            // Expanded Profile Section (similar to mobile)
            <div className="space-y-3">
              <Link
                href="/profile"
                className={`flex items-center space-x-3 p-3 rounded-lg  transition-all duration-200 ${
                  vcarduser ? "hidden" : ""
                } ${
                  isMenuActive("/profile")
                    ? "bg-[#7F56D9] text-white"
                    : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                }`}
              >
                <CircleUserRound className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {userData
                      ? `${userData.firstName || ""} ${
                          userData.lastName || ""
                        }`.trim() || "User"
                      : "Loading..."}
                  </p>
                  <p className="text-white/60 text-xs truncate">
                    {userData?.email || userEmail || "No email available"}
                  </p>
                </div>
              </Link>

              <button
                onClick={async () => await HandleLogout()}
                className="flex items-center space-x-3 w-full p-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          ) : (
            // Collapsed Profile Section (Icons only)
            <div className="space-y-3">
              <Link
                href="/profile"
                className={`flex items-center justify-center p-3 rounded-lg  transition-all duration-200 mx-auto w-fit ${
                  vcarduser ? "hidden" : ""
                } ${
                  isMenuActive("/profile")
                    ? "bg-[#7F56D9] text-white"
                    : "hover:bg-[#7F56D9] hover:text-white opacity-60"
                }`}
                title="Profile"
              >
                <CircleUserRound className="w-6 h-6" />
              </Link>

              <button
                onClick={async () => await HandleLogout()}
                className="flex items-center justify-center p-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 mx-auto w-fit"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu.show && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white shadow-lg rounded-lg py-2 min-w-[160px] z-50 context-menu"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer menu-hover-effect">
              {contextMenu.menuType === "dashboard" && "Dashboard Settings"}
              {contextMenu.menuType === "events" && "Event Settings"}
              {contextMenu.menuType === "campaigns" && "Campaign Settings"}
            </div>
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer menu-hover-effect">
              Pin to Top
            </div>
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer menu-hover-effect">
              Hide from Menu
            </div>
            {contextMenu.menuType === "campaigns" && (
              <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer menu-hover-effect">
                View Analytics
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
