"use client";
import { useEffect, useState, useRef } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import PageHeader from "@/components/layouts/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Gift, Search, Filter } from "lucide-react";

interface PlaybookRun {
  _id: string;
  playbook_id: string;
  recipient_ids: string[];
  status: string;
  run_timestamp: string;
  organization_id: string;
  completed_at?: string;
  success_count: number;
  total_count: number;
}

interface Recipient {
  _id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  status: string;
  assignedGift?: {
    name: string;
    price: number;
    primaryImgUrl: string;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  deliveryDate?: string;
  acknowledgedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Add this interface and state for recipient-specific notification preferences
interface RecipientNotificationPrefs {
  [recipientId: string]: {
    addressUpdated: boolean;
    shipmentInitiated: boolean;
    giftDelivered: boolean;
    giftAcknowledged: boolean;
  };
}

// Animation keyframes and utility classes (copied from /event/page.tsx)
const animations = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
}
@keyframes cardDeal {
  0% { opacity: 0; transform: translateY(30px) scale(0.95);}
  100% { opacity: 1; transform: translateY(0) scale(1);}
}
@keyframes subtleShake {
  0%, 100% { transform: rotate(0deg);}
  25% { transform: rotate(-1deg);}
  75% { transform: rotate(1deg);}
}
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  }
}
@keyframes buttonLift {
  0% { transform: translateY(0);}
  100% { transform: translateY(-2px);}
}
@keyframes buttonGlow {
  0% {
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  }
  100% {
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 2px rgba(99,102,241,0.2);
  }
}
.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
.animate-card-deal { animation: cardDeal 0.5s ease-out forwards; opacity: 0; }
.hover-subtle-shake:hover { animation: subtleShake 0.5s ease-in-out; }
.hover-pulse-glow:hover { animation: pulseGlow 2s ease-in-out infinite; }
.hover-scale { transition: transform 0.3s ease; }
.hover-scale:hover { transform: scale(1.02);}
.hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease;}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}
.hover-rotate { transition: transform 0.3s ease;}
.hover-rotate:hover { transform: rotate(5deg);}
.hover-bounce { transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275);}
.hover-bounce:hover { transform: scale(1.1);}
.hover-button { transition: all 0.3s cubic-bezier(0.25,0.8,0.25,1);}
.hover-button:hover { animation: buttonLift 0.3s forwards, buttonGlow 0.3s forwards;}
`;

export default function GiftingActivities() {
  const router = useRouter();
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [playbookRuns, setPlaybookRuns] = useState<PlaybookRun[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<
    string | null
  >(null);
  const [notifications, setNotifications] = useState({
    addressUpdated: true,
    shipmentInitiated: true,
    giftDelivered: true,
    giftAcknowledged: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationModalRef = useRef<HTMLDivElement>(null);
  const [recipientNotificationPrefs, setRecipientNotificationPrefs] =
    useState<RecipientNotificationPrefs>({});
  const [showMenuOnTop, setShowMenuOnTop] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  // Add filter toggle function for ListPageHeader
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  // Filter dropdown state for status
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Get unique statuses for filter options
  const uniqueStatuses = [
    "All",
    ...new Set(
      recipients.map((r) => {
        if (r.status === "GiftSelected") return "Gift Selected";
        if (r.status === "OrderPlaced") return "Order Placed";
        return r.status || "Pending";
      })
    ),
  ];

  // Filter recipients based on search query and status
  const filteredRecipients = recipients
    .sort((a, b) => {
      // Sort by creation date/updated date in descending order (most recent first)
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .filter((recipient) => {
      // First apply status filter
      if (statusFilter !== "All") {
        const displayStatus =
          recipient.status === "GiftSelected"
            ? "Gift Selected"
            : recipient.status === "OrderPlaced"
            ? "Order Placed"
            : recipient.status || "Pending";
        if (displayStatus !== statusFilter) return false;
      }

      // Then apply search filter
      if (!searchQuery.trim()) return true;

      const searchLower = searchQuery.toLowerCase();
      const fullName =
        `${recipient.firstName} ${recipient.lastName}`.toLowerCase();
      const company = recipient.companyName?.toLowerCase() || "";
      const giftName = recipient.assignedGift?.name?.toLowerCase() || "";

      return (
        fullName.includes(searchLower) ||
        company.includes(searchLower) ||
        giftName.includes(searchLower)
      );
    });

  // Get current recipients
  const getCurrentRecipients = () => {
    if (!filteredRecipients) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecipients.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Calculate total pages
  const getTotalPages = () => {
    if (!filteredRecipients) return 1;
    return Math.ceil(filteredRecipients.length / itemsPerPage);
  };

  // Reset to first page when filter changes
  useEffect(() => {
    if (!isLoadingCookies) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, isLoadingCookies]);

  useEffect(() => {
    if (!isLoadingCookies) {
      if (organizationId) {
        setUserOrgId(organizationId);
        fetchPlaybookRuns(organizationId);
      }
    }
  }, [organizationId, isLoadingCookies]);

  const fetchPlaybookRuns = async (orgId: string) => {
    try {
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }
      setLoading(true);
      const response = await fetch(
        `/api/playbook-runs?organization_id=${orgId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPlaybookRuns(data.playbookRuns);
        setRecipients(data.recipients);
      }
    } catch (error) {
      console.error("Error fetching playbook data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle mobile sidebar

  // Add a click outside handler to close the menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        notificationModalRef.current &&
        !notificationModalRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
        setShowNotificationModal(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add a function to toggle the notification settings
  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  // Update the function to save notification preferences
  const saveNotifications = async (recipientId: string) => {
    if (!recipientId) {
      console.error("Recipient ID is missing");
      return;
    }

    setIsSaving(true);

    try {
      // First, update our local cache of preferences
      const updatedPrefs = { ...notifications };
      setRecipientNotificationPrefs((prev) => ({
        ...prev,
        [recipientId]: updatedPrefs,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/update-notification-prefs/recipients/${recipientId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            notificationPrefs: updatedPrefs,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }

      const data = await response.json();
      console.log("Notification preferences updated:", data);

      // Show success toast notification
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Close the notification modal instead of the menu
      setShowNotificationModal(null);
    } catch (error) {
      console.error("Error saving notification settings:", error);

      // Show error toast notification
      toast({
        title: "Error updating preferences",
        description: "Failed to save notification settings. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update the open menu handler to fetch preferences
  const handleOpenMenu = (rowId: string, recipientId: string) => {
    if (openMenuId === rowId) {
      setOpenMenuId(null);
    } else {
      // Calculate position for menu
      if (tableRef.current) {
        const tableRows = tableRef.current.querySelectorAll("tbody tr");
        const totalRows = tableRows.length;

        // Find the index of the current row
        let currentRowIndex = -1;
        tableRows.forEach((row, index) => {
          if (row.querySelector(`[data-recipient-id="${rowId}"]`)) {
            currentRowIndex = index;
          }
        });

        // If near bottom (last 3 rows), show menu on top
        setShowMenuOnTop(currentRowIndex >= totalRows - 3);
      }

      setOpenMenuId(rowId);
      // Don't fetch preferences yet - only when they click the notification settings option
    }
  };

  // Update the fetchNotificationPreferences function to use recipient-specific preferences
  const fetchNotificationPreferences = async (recipientId: string) => {
    try {
      // Check if we already have cached preferences for this recipient
      if (recipientNotificationPrefs[recipientId]) {
        console.log("Using cached preferences for recipient:", recipientId);
        setNotifications(recipientNotificationPrefs[recipientId]);
        return;
      }

      // Set loading state if needed
      // setIsLoadingPreferences(true);

      // In a real implementation, fetch from API
      console.log("Fetching preferences for recipient:", recipientId);

      // Example API call:
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/notification-prefs/recipients/${recipientId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.notificationPrefs) {
            // Update the recipient-specific preferences
            setRecipientNotificationPrefs((prev) => ({
              ...prev,
              [recipientId]: data.notificationPrefs,
            }));

            // Set as current notifications
            setNotifications(data.notificationPrefs);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching notification preferences from API:", err);
      }

      // If API call fails or recipient has no saved preferences, use defaults
      const defaultPrefs = {
        addressUpdated: true,
        shipmentInitiated: true,
        giftDelivered: true,
        giftAcknowledged: false,
      };

      // Save the default preferences for this recipient
      setRecipientNotificationPrefs((prev) => ({
        ...prev,
        [recipientId]: defaultPrefs,
      }));

      // Set as current notifications
      setNotifications(defaultPrefs);
    } catch (error) {
      console.error("Error in fetchNotificationPreferences:", error);

      // Use defaults on error
      setNotifications({
        addressUpdated: true,
        shipmentInitiated: true,
        giftDelivered: true,
        giftAcknowledged: false,
      });
    }
  };

  // Add this function at the top level inside your component
  const toast = ({
    title,
    description,
    status,
    duration,
    isClosable,
  }: {
    title: string;
    description: string;
    status: "success" | "error";
    duration: number;
    isClosable: boolean;
  }) => {
    // Create a div for the toast
    const toastDiv = document.createElement("div");
    toastDiv.className = `fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity duration-500 ${
      status === "success"
        ? "bg-green-50 border border-green-200"
        : "bg-red-50 border border-red-200"
    }`;

    // Add content to the toast
    toastDiv.innerHTML = `
      <div class="flex items-start">
        <div class="${
          status === "success" ? "text-green-500" : "text-red-500"
        } flex-shrink-0">
          ${
            status === "success"
              ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
              : '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 001.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium ${
            status === "success" ? "text-green-800" : "text-red-800"
          }">${title}</p>
          <p class="mt-1 text-sm ${
            status === "success" ? "text-green-700" : "text-red-700"
          }">${description}</p>
        </div>
        ${
          isClosable
            ? `<button class="ml-4 text-gray-400 hover:text-gray-900" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>`
            : ""
        }
      </div>
    `;

    // Add the toast to the document
    document.body.appendChild(toastDiv);

    // Auto-remove after duration
    if (duration) {
      setTimeout(() => {
        toastDiv.style.opacity = "0";
        setTimeout(() => toastDiv.remove(), 500);
      }, duration);
    }
  };

  // Update filterCount based on active filters
  useEffect(() => {
    let count = 0;
    if (statusFilter !== "All") count++;
    setFilterCount(count);
  }, [statusFilter]);

  const handleMenuOptionClick = (option: string, recipientId: string) => {
    if (option === "viewDetails") {
      router.push(`/public/gift-tracker/${recipientId}`);
      setOpenMenuId(null); // Close the dropdown
    } else if (option === "notificationSettings") {
      setOpenMenuId(null); // Close the dropdown
      setShowNotificationModal(recipientId); // Open the notification modal
      fetchNotificationPreferences(recipientId); // Fetch preferences for this recipient
    }
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <div
            className="animate-fade-in opacity-0"
            style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
          >
            <PageHeader
              title="Gifting Activities"
              description="Create and manage your gifting activities"
              showDivider={true}
              className="pt-2"
            />
            
            {/* Search and Filter Controls */}
            <div className="mx-4 md:mx-6 lg:mx-8 mb-6 rounded-xl px-3 md:px-4 py-3 md:py-4 -mt-2" style={{ backgroundColor: '#F9FAFB' }}>
              {/* Mobile: Single row layout */}
              <div className="block md:hidden">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search gifting activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline text-sm">Filters</span>
                    {filterCount > 0 && (
                      <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop: Single row layout */}
              <div className="hidden md:flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search gifting activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {filterCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                {/* Status Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 border border-[#D0D5DD] rounded-md bg-white text-sm"
                      onClick={() => setShowStatusDropdown((v) => !v)}
                      type="button"
                    >
                      <span>{statusFilter}</span>
                      <svg
                        className="w-4 h-4 ml-2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute z-[130] mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 left-0">
                        {uniqueStatuses.map((status) => (
                          <button
                            key={status}
                            className={`block w-full text-left px-4 py-2 text-sm rounded hover:bg-primary-xlight ${
                              statusFilter === status
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-gray-700"
                            }`}
                            onClick={() => {
                              setStatusFilter(status);
                              setShowStatusDropdown(false);
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Clear Filters Button */}
                {statusFilter !== "All" && (
                  <div className="flex justify-end pt-2">
                    <button
                      className="text-xs text-primary hover:underline px-2 py-1"
                      onClick={() => {
                        setStatusFilter("All");
                      }}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Content - Table for desktop, Cards for mobile */}
            <div className="mx-4 md:mx-6 lg:mx-8">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-sm" style={{ border: '1px solid #F3F4F6' }}>
                                  <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50 border-y border-[#EAECF0]">
                      <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        ATTENDEE NAME
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        COMPANY
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        GIFT
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        DELIVERY AT
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        DELIVERY STATUS
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        DELIVERY DATE
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                        ACKNOWLEDGED AT
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      // Skeleton rows (no circular loader)
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx}>
                          <td colSpan={8}>
                            <div className="flex gap-4 items-center py-4">
                              <div className="h-8 w-8 bg-gray-200 rounded-full" />
                              <div className="h-4 bg-gray-200 rounded w-1/4" />
                              <div className="h-4 bg-gray-200 rounded w-1/6" />
                              <div className="h-4 bg-gray-200 rounded w-1/6" />
                              <div className="h-4 bg-gray-200 rounded w-1/6" />
                              <div className="h-4 bg-gray-200 rounded w-1/6" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : recipients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          No gifting activities found
                        </td>
                      </tr>
                    ) : filteredRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center h-30 text-bold">
                          No results found
                        </td>
                      </tr>
                    ) : (
                      getCurrentRecipients().map((recipient, idx) => (
                        <tr
                          key={recipient._id}
                          className={`
                               border-b font-medium border-[#EAECF0]
                               hover:bg-gray-50/30 hover:shadow-sm transition-all duration-200 ease-out
                               animate-card-deal relative
                               ${
                                 openMenuId === recipient._id ||
                                 showNotificationModal === recipient._id
                                   ? "z-50"
                                   : "z-0"
                               }
                             `}
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          <td className="py-4 px-4 text-sm text-[#1B1D21]">
                            {recipient.firstName} {recipient.lastName}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {recipient.companyName || "---"}
                          </td>
                          <td className="py-4 px-4">
                            {recipient.assignedGift ? (
                              <div className="flex items-center gap-2">
                                <Image
                                  src={
                                    recipient.assignedGift.primaryImgUrl ||
                                    "/img/Avatar.png"
                                  }
                                  alt="Gift"
                                  width={40}
                                  height={40}
                                />
                                <div>
                                  <p className="text-sm text-[#1B1D21]">
                                    {recipient.assignedGift.name}
                                  </p>
                                  <p className="text-sm text-[#667085]">
                                    ${recipient.assignedGift.price}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-[#667085]">
                                No gift assigned
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {recipient.address
                              ? (() => {
                                  const parts: string[] = [];
                                  if (recipient.address?.city)
                                    parts.push(recipient.address.city);
                                  if (recipient.address?.state)
                                    parts.push(recipient.address.state);
                                  if (recipient.address?.country)
                                    parts.push(recipient.address.country);
                                  if (parts.length > 0) {
                                    return parts.join(", ");
                                  } else if (recipient.address?.line1) {
                                    return `${recipient.address.line1.slice(
                                      0,
                                      3
                                    )}****`;
                                  }
                                  return "---";
                                })()
                              : "---"}
                          </td>
                          <td className="py-4 px-4">
                            <span className="flex items-center gap-1">
                              <span
                                className={`text-sm px-2.5 py-1 rounded-full ${
                                  recipient.status === "GiftSelected" &&
                                  (!recipient.address?.line1 ||
                                    recipient.address.line1 === "")
                                    ? "bg-[#F9F5FF] text-[#7F56D9]"
                                    : recipient.status === "GiftSelected"
                                    ? "bg-[#ECFDF3] text-[#027A48]"
                                    : recipient.status === "Pending"
                                    ? "bg-[#FEF6EE] text-[#B54708]"
                                    : recipient.status === "Delivered"
                                    ? "bg-[#EFF8FF] text-[#026AA2]"
                                    : recipient.status === "Acknowledged"
                                    ? "bg-[#ECFDF3] text-[#027A48]"
                                    : recipient.status === "OrderPlaced"
                                    ? "bg-[#ECFDF3] text-[#027A48]"
                                    : recipient.status === "InTransit"
                                    ? "bg-[#FEF3C7] text-[#92400E]"
                                    : "bg-gray-100 text-[#1B1D21]"
                                }`}
                              >
                                {recipient.status === "GiftSelected" &&
                                (!recipient.address?.line1 ||
                                  recipient.address.line1 === "")
                                  ? "Awaiting Address Confirmation"
                                  : recipient.status === "GiftSelected"
                                  ? "Address Confirmed"
                                  : recipient.status === "OrderPlaced"
                                  ? "Order Placed"
                                  : recipient.status === "InTransit"
                                  ? "In Transit"
                                  : recipient.status || "Pending"}
                              </span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {recipient.deliveryDate
                              ? new Date(
                                  recipient.deliveryDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "---"}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {recipient.acknowledgedAt
                              ? (() => {
                                  try {
                                    const date = new Date(
                                      recipient.acknowledgedAt
                                    );
                                    if (isNaN(date.getTime())) {
                                      return "---";
                                    }
                                    const day = date
                                      .getDate()
                                      .toString()
                                      .padStart(2, "0");
                                    const month = date.toLocaleString("en-US", {
                                      month: "short",
                                    });
                                    const year = date
                                      .getFullYear()
                                      .toString()
                                      .slice(-2);
                                    const time = date.toLocaleString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    });
                                    return `${day} ${month} ${year}, ${time}`;
                                  } catch (error) {
                                    console.error(
                                      "Error formatting date:",
                                      error
                                    );
                                    return "---";
                                  }
                                })()
                              : "---"}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085] relative z-0">
                            <div
                              className="grid gap-0.5 cursor-pointer relative z-30"
                              onClick={() =>
                                handleOpenMenu(recipient._id, recipient._id)
                              }
                              data-recipient-id={recipient._id}
                            >
                              <div className="size-1 bg-black rounded-full"></div>
                              <div className="size-1 bg-black rounded-full"></div>
                              <div className="size-1 bg-black rounded-full"></div>
                            </div>

                            {/* Dropdown Menu - Only show when openMenuId matches */}
                            {openMenuId === recipient._id && (
                              <div
                                ref={menuRef}
                                className={`absolute ${
                                  showMenuOnTop ? "bottom-12" : "top-12"
                                } right-4 min-w-[220px] bg-white rounded-xl shadow-xl border border-gray-200 z-[200] transition-all duration-200 animate-fade-in-up`}
                                style={{
                                  zIndex: 200,
                                  boxShadow:
                                    "0 8px 32px 0 rgba(31, 38, 135, 0.12), 0 1.5px 4px 0 rgba(60, 72, 88, 0.08)",
                                  padding: 0,
                                }}
                              >
                                {/* Caret */}
                                <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45 z-10"></div>
                                <div className="divide-y divide-gray-100 py-2">
                                  <button
                                    onClick={() =>
                                      handleMenuOptionClick(
                                        "viewDetails",
                                        recipient._id
                                      )
                                    }
                                    className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-primary-xlight rounded-t-xl transition-colors"
                                    style={{
                                      border: "none",
                                      background: "none",
                                    }}
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      className="text-primary"
                                    >
                                      <path
                                        d="M12 5c-7 0-9 7-9 7s2 7 9 7 9-7 9-7-2-7-9-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                    View Details
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMenuOptionClick(
                                        "notificationSettings",
                                        recipient._id
                                      )
                                    }
                                    className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-primary-xlight rounded-b-xl transition-colors"
                                    style={{
                                      border: "none",
                                      background: "none",
                                    }}
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      className="text-primary"
                                    >
                                      <path
                                        d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 10-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 006 19h12a1 1 0 00.71-1.71L18 16z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                    Notification Settings
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Notification Settings Modal - Only show when showNotificationModal matches */}
                            {showNotificationModal === recipient._id && (
                              <div
                                ref={notificationModalRef}
                                className={`absolute ${
                                  showMenuOnTop ? "bottom-12" : "top-12"
                                } right-4 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[210] transition-all duration-200 animate-fade-in-up`}
                                style={{
                                  zIndex: 210,
                                  boxShadow:
                                    "0 12px 32px 0 rgba(31,38,135,0.14), 0 2px 8px 0 rgba(60,72,88,0.10)",
                                  padding: 0,
                                }}
                              >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-gray-100">
                                  <h3 className="font-semibold text-gray-900 text-base">
                                    Notification Settings
                                  </h3>
                                  <button
                                    className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
                                    aria-label="Close"
                                    onClick={() =>
                                      setShowNotificationModal(null)
                                    }
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        d="M18 6L6 18"
                                        stroke="#444"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M6 6L18 18"
                                        stroke="#444"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                {/* Modal Content */}
                                <div className="px-6 py-4">
                                  <p className="text-xs text-gray-500 mb-4">
                                    Choose which notifications you want to
                                    receive for this gift
                                  </p>
                                  <div className="space-y-4">
                                    {/* Toggle Switches */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">
                                        Recipient Address Updated
                                      </span>
                                      <label className="inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={notifications.addressUpdated}
                                          onChange={() =>
                                            toggleNotification("addressUpdated")
                                          }
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                          <div
                                            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                              notifications.addressUpdated
                                                ? "translate-x-4"
                                                : ""
                                            }`}
                                          ></div>
                                        </div>
                                      </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">
                                        Shipment Initiated
                                      </span>
                                      <label className="inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            notifications.shipmentInitiated
                                          }
                                          onChange={() =>
                                            toggleNotification(
                                              "shipmentInitiated"
                                            )
                                          }
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                          <div
                                            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                              notifications.shipmentInitiated
                                                ? "translate-x-4"
                                                : ""
                                            }`}
                                          ></div>
                                        </div>
                                      </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">
                                        Delivered
                                      </span>
                                      <label className="inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={notifications.giftDelivered}
                                          onChange={() =>
                                            toggleNotification("giftDelivered")
                                          }
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                          <div
                                            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                              notifications.giftDelivered
                                                ? "translate-x-4"
                                                : ""
                                            }`}
                                          ></div>
                                        </div>
                                      </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">
                                        Acknowledged
                                      </span>
                                      <label className="inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            notifications.giftAcknowledged
                                          }
                                          onChange={() =>
                                            toggleNotification(
                                              "giftAcknowledged"
                                            )
                                          }
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                          <div
                                            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                              notifications.giftAcknowledged
                                                ? "translate-x-4"
                                                : ""
                                            }`}
                                          ></div>
                                        </div>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="mt-6 flex justify-end">
                                    <button
                                      onClick={() =>
                                        saveNotifications(recipient._id)
                                      }
                                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 min-w-[120px]"
                                      disabled={isSaving}
                                    >
                                      {isSaving && (
                                        <svg
                                          className="animate-spin h-4 w-4 mr-2 text-white"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                          ></path>
                                        </svg>
                                      )}
                                      {isSaving ? "Saving..." : "Save Settings"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {loading ? (
                  // Skeleton cards (no circular loader)
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg shadow p-4 border border-[#EAECF0] animate-pulse"
                      >
                        <div className="flex gap-3 items-center mb-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full" />
                          <div className="h-4 bg-gray-200 rounded w-1/3" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="text-center py-4">
                    No gifting activities found
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="text-center py-4 font-bold">
                    No results found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCurrentRecipients().map((recipient, idx) => (
                      <div
                        key={recipient._id}
                        className="bg-white rounded-lg shadow p-4 border border-[#EAECF0] hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover-lift animate-card-deal"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-[#1B1D21]">
                              {recipient.firstName} {recipient.lastName}
                            </h3>
                            <p className="text-sm text-[#667085]">
                              {recipient.companyName || "---"}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              recipient.status === "GiftSelected" &&
                              (!recipient.address?.line1 ||
                                recipient.address.line1 === "")
                                ? "bg-[#F9F5FF] text-[#7F56D9]"
                                : recipient.status === "GiftSelected"
                                ? "bg-[#ECFDF3] text-[#027A48]"
                                : recipient.status === "Pending"
                                ? "bg-[#FEF6EE] text-[#B54708]"
                                : recipient.status === "Delivered"
                                ? "bg-[#EFF8FF] text-[#026AA2]"
                                : recipient.status === "Acknowledged"
                                ? "bg-[#ECFDF3] text-[#027A48]"
                                : recipient.status === "OrderPlaced"
                                ? "bg-[#ECFDF3] text-[#027A48]"
                                : recipient.status === "InTransit"
                                ? "bg-[#FEF3C7] text-[#92400E]"
                                : "bg-gray-100 text-[#1B1D21]"
                            }`}
                          >
                            {recipient.status === "GiftSelected" &&
                            (!recipient.address?.line1 ||
                              recipient.address.line1 === "")
                              ? "Awaiting Address Confirmation"
                              : recipient.status === "GiftSelected"
                              ? "Address Confirmed"
                              : recipient.status === "OrderPlaced"
                              ? "Order Placed"
                              : recipient.status === "InTransit"
                              ? "In Transit"
                              : recipient.status || "Pending"}
                          </span>
                        </div>

                        {recipient.assignedGift && (
                          <div className="flex items-center gap-2 mb-3 border-t border-b border-[#EAECF0] py-2">
                            <Image
                              src={
                                recipient.assignedGift.primaryImgUrl ||
                                "/img/Avatar.png"
                              }
                              alt="Gift"
                              width={40}
                              height={40}
                              className="rounded"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {recipient.assignedGift.name}
                              </p>
                              <p className="text-xs text-[#667085]">
                                ${recipient.assignedGift.price}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[#667085]">DELIVERY AT</p>
                            <p className="font-medium">
                              {recipient.address
                                ? (() => {
                                    const parts: string[] = [];
                                    if (recipient.address?.city)
                                      parts.push(recipient.address.city);
                                    if (recipient.address?.state)
                                      parts.push(recipient.address.state);
                                    if (recipient.address?.country)
                                      parts.push(recipient.address.country);
                                    if (parts.length > 0) {
                                      return parts.join(", ");
                                    } else if (recipient.address?.line1) {
                                      return `${recipient.address.line1.slice(
                                        0,
                                        3
                                      )}****`;
                                    }
                                    return "---";
                                  })()
                                : "---"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#667085]">DELIVERY DATE</p>
                            <p className="font-medium">
                              {recipient.deliveryDate
                                ? new Date(
                                    recipient.deliveryDate
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "---"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[#667085]">ACKNOWLEDGED AT</p>
                            <p className="font-medium">
                              {recipient.acknowledgedAt
                                ? (() => {
                                    try {
                                      const date = new Date(
                                        recipient.acknowledgedAt
                                      );
                                      if (isNaN(date.getTime())) {
                                        return "---";
                                      }
                                      const day = date
                                        .getDate()
                                        .toString()
                                        .padStart(2, "0");
                                      const month = date.toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                        }
                                      );
                                      const year = date
                                        .getFullYear()
                                        .toString()
                                        .slice(-2);
                                      const time = date.toLocaleString(
                                        "en-US",
                                        {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                        }
                                      );
                                      return `${day} ${month} ${year}, ${time}`;
                                    } catch (error) {
                                      console.error(
                                        "Error formatting date:",
                                        error
                                      );
                                      return "---";
                                    }
                                  })()
                                : "---"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination - Responsive */}
            <div className="flex flex-wrap justify-between items-center p-4 border-t border-[#EAECF0] mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-2 md:px-4 py-2 text-[#667085] font-medium disabled:opacity-50 text-sm md:text-base"
              >
                <Image
                  src="/svgs/Rarrow.svg"
                  alt="Previous"
                  width={11}
                  height={11}
                />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex gap-1 md:gap-2 justify-center">
                {Array.from({ length: getTotalPages() }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-sm ${
                      currentPage === i + 1
                        ? "bg-[#F9F5FF] text-[#7F56D9]"
                        : "text-[#667085]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()))
                }
                disabled={currentPage === getTotalPages()}
                className="flex items-center gap-2 px-2 md:px-4 py-2 text-[#667085] font-medium disabled:opacity-50 text-sm md:text-base"
              >
                <span className="hidden sm:inline">Next</span>
                <Image
                  src="/svgs/arrow.svg"
                  alt="Next"
                  width={11}
                  height={11}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
