"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CircularProgress from "@/components/dashboard/CircularProgress";
import GiftStatusAnimation from "@/components/dashboard/GiftStatusAnimation";
import OpportunityAnimation from "@/components/dashboard/OpportunityAnimation";
import CampaignTableRow from "@/components/dashboard/CampaignTableRow";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useRouter } from "next/navigation";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useAuth } from "@/app/context/AuthContext";
import CampaignProgressBar from "@/components/dashboard/CampaignProgressBar";
import PageHeader from "@/components/layouts/PageHeader";
import { Calendar, Plus, Search, Filter, Grid3X3, List } from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import ReactDOM from "react-dom";

// Function to get campaign motion display name from ID
const getCampaignMotionName = (motionId: string): string => {
  switch (motionId) {
    case "boost_registration":
      return "Boost Registration";
    case "ensure_attendance":
      return "Ensure Attendance";
    case "setup_meeting":
      return "Set up 1:1 Meeting";
    case "vip_box_pickup":
      return "VIP Box Pickup";
    case "express_send":
      return "Express Send";
    case "booth_giveaways":
      return "Booth Giveaways";
    case "thank_you":
      return "Thank You";
    default:
      return motionId || "Event"; // Return original value or default if undefined
  }
};

// Function to format event timing
const formatEventTiming = (
  startDate: string,
  deliverByDate: string,
  createdAt: string
): string => {
  const startDateObj = new Date(startDate);
  const deliverByDateObj = new Date(deliverByDate);
  const createdAtObj = new Date(createdAt);

  if (createdAtObj < startDateObj) {
    return "Pre-event";
  } else if (createdAtObj >= startDateObj && createdAtObj <= deliverByDateObj) {
    return "During Event";
  } else {
    return "Post-event";
  }
};

// Animation keyframes for the page
const animations = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardDeal {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-card-deal {
  animation: cardDeal 0.5s ease-out forwards;
  opacity: 0;
}

/* Mobile responsive utilities */
@media (min-width: 475px) {
  .xs\\:inline { display: inline; }
  .xs\\:hidden { display: none; }
}

@media (max-width: 474px) {
  .xs\\:inline { display: none; }
  .xs\\:hidden { display: inline; }
}
`;

export default function CampaignsList() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const router = useRouter();
  const [filterDropdownContainer, setFilterDropdownContainer] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let el = document.getElementById("campaigns-filter-portal");
      if (!el) {
        el = document.createElement("div");
        el.id = "campaigns-filter-portal";
        document.body.appendChild(el);
      }
      setFilterDropdownContainer(el);
    }
  }, []);

  // Add pagination options
  const paginationOptions = [12, 24, 36, 48];

  useEffect(() => {
    if (!isLoadingCookies) {
      fetchCampaigns(1);
    }
  }, [isLoadingCookies]);

  const fetchCampaigns = async (
    page: number,
    search?: string,
    status?: string
  ) => {
    try {
      setLoading(true);
      console.log("All Data", authToken, userId, userEmail, organizationId);

      if (!authToken || !organizationId) {
        //router.push('/');
        return;
      }

      // Create query parameters with proper type handling
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", itemsPerPage.toString());
      queryParams.append("sortField", "updatedAt");
      queryParams.append("sortOrder", "desc");
      if (search?.trim()) queryParams.append("name", search);
      if (status && status !== "all") queryParams.append("status", status);

      // Get base URL from environment variable
      const baseUrl = await getBackendApiBaseUrl();

      // Construct the API URL with query parameters
      const apiUrl = `${baseUrl}/v1/organizations/${organizationId}/campaigns_new?${queryParams}`;
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401) {
        router.push("/");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Campaign API Response:", data);

      if (data.success) {
        let filteredCampaigns = data.data;
        console.log("First Campaign Object:", filteredCampaigns[0]);

        // Only filter on the client side if status is provided and not 'all'
        if (status && status !== "all") {
          filteredCampaigns = filteredCampaigns.filter(
            (campaign: any) =>
              campaign.status.toLowerCase() === status.toLowerCase()
          );
        }

        // Fetch recipient counts for each campaign
        const campaignsWithRecipientCounts = await Promise.all(
          filteredCampaigns.map(async (campaign: any) => {
            try {
              const recipientCounts = await fetchRecipientCounts(campaign._id);
              return {
                ...campaign,
                recipientCountsData: recipientCounts,
              };
            } catch (error) {
              console.error(
                `Error fetching recipient counts for campaign ${campaign._id}:`,
                error
              );
              return campaign;
            }
          })
        );
        
        // Set the campaigns data first, then set loading to false
        setCampaigns(campaignsWithRecipientCounts);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.currentPage);
        setLoading(false);
      } else {
        throw new Error(data.error || "Failed to fetch campaigns");
      }
    } catch (err) {
      console.error("Error details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch campaigns"
      );
      setLoading(false);
    }
  };

  // Function to fetch recipient counts for a campaign
  const fetchRecipientCounts = async (campaignId: string) => {
    try {
      const baseUrl = await getBackendApiBaseUrl();
      const recipientCountsUrl = `${baseUrl}/v1/organizations/${organizationId}/campaigns/${campaignId}/recipient-counts`;
      //const recipientCountsUrl = `http://localhost:5500/v1/organizations/${organizationId}/campaigns/${campaignId}/recipient-counts`;

      const response = await fetch(recipientCountsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recipient counts: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Recipient counts for campaign ${campaignId}:`, data);
      return data.data;
    } catch (error) {
      console.error("Error fetching recipient counts:", error);
      return null;
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCampaigns(1, searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchCampaigns(1, searchTerm, activeFilter);
  }, [itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCampaigns(page, searchTerm);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (!searchTerm) return true;
    // console.log("Campaign Name:", campaign?.total_recipients);
    return campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFilterClick = (status: string) => {
    setActiveFilter(status);
    setCurrentPage(1);
    fetchCampaigns(1, searchTerm, status);
    setMobileFilterOpen(false);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newValue: number) => {
    setItemsPerPage(newValue);
    setCurrentPage(1); // Reset to first page when changing items per page
    fetchCampaigns(1, searchTerm, activeFilter);
  };

  // Toggle mobile filter dropdown
  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      {/* Sidebar */}
      <AdminSidebar />
      {/* Main Content */}
      <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-4 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <div
            className="animate-fade-in opacity-0 "
            style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
          >
            <div className="relative">
              <PageHeader
                title="Campaign Overview"
                description="Track delivery rates, engagement, and ROI in real-time."
                primaryButton={{
                  text: "New Campaign",
                  icon: Plus,
                  href: "/campaigns/create",
                  variant: "primary"
                }}
                chips={activeFilter !== "all" ? [{ text: `Filter: ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1).replace(/_/g, " ")}`, color: "blue" }] : []}
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
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Filter Button */}
                    <button
                      onClick={toggleMobileFilter}
                      className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline text-sm">Filters</span>
                      {activeFilter !== "all" && (
                        <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                          1
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
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <ViewToggle
                    options={[
                      { value: "list", icon: List, title: "List view" },
                      { value: "card", icon: Grid3X3, title: "Card view" },
                    ]}
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as "card" | "list")}
                  />

                  <button
                    onClick={toggleMobileFilter}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilter !== "all" && (
                      <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        1
                      </span>
                    )}
                  </button>
                </div>
              </div>

                {/* Filter Dropdown */}
                {filterDropdownContainer &&
                  mobileFilterOpen &&
                  ReactDOM.createPortal(
                  <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                      {/* Status filter */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Status
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "all", color: "gray", label: "View All" },
                            { key: "draft", color: "gray", label: "Draft" },
                            {
                              key: "waiting_for_approval",
                              color: "yellow",
                              label: "Waiting for Approval",
                            },
                            { key: "live", color: "green", label: "Live" },
                            {
                              key: "completed",
                              color: "blue",
                              label: "Completed",
                            },
                            {
                              key: "rejected",
                              color: "red",
                              label: "Rejected",
                            },
                            {
                              key: "cancelled",
                              color: "orange",
                              label: "Cancelled",
                            },
                            {
                              key: "list_building",
                              color: "purple",
                              label: "List Building",
                            },
                            {
                              key: "ready_for_launch",
                              color: "cyan",
                              label: "Ready for Launch",
                            },
                            {
                              key: "matching gifts",
                              color: "pink",
                              label: "Matching Gifts",
                            },
                          ].map((status) => {
                            const isSelected = activeFilter === status.key;
                            return (
                              <button
                                key={status.key}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                  isSelected
                                    ? "bg-primary text-white border-primary"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                }`}
                                onClick={() => handleFilterClick(status.key)}
                              >
                                {status.color === "blue" && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                                {status.color === "green" && (
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                                {status.color === "yellow" && (
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                )}
                                {status.color === "purple" && (
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                )}
                                {status.color === "orange" && (
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                )}
                                {status.color === "cyan" && (
                                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                )}
                                {status.color === "red" && (
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                )}
                                {status.color === "pink" && (
                                  <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                )}
                                {status.color === "gray" && isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                                {status.color === "gray" && !isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                )}
                                {status.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      {activeFilter !== "all" && (
                        <div className="flex justify-end pt-2">
                          <button
                            className="text-xs text-primary hover:underline px-2 py-1"
                            onClick={() => handleFilterClick("all")}
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </div>,
                    filterDropdownContainer
                  )}
            </div>
          </div>

          {/* Three Images Below Campaign Overview */}
          <div className="flex-col md:flex-row mb-6 gap-4 md:gap-8 border-y-[1px] py-[18px] border-[#F2F4F7] hidden">
            <div className="text-[13px] font-[500]">
              <CircularProgress
                totalCampaigns={30}
                completedCampaigns={10}
                liveCampaigns={10}
                draftCampaigns={5}
                waitingCampaigns={5}
              />
            </div>
            <GiftStatusAnimation delivered={100} inTransits={200} total={300} />

            <OpportunityAnimation opportunities={84} value={115000} />
          </div>

          {/* Campaign Content */}
          <div
            className="animate-fade-in-up opacity-0 mx-4 md:mx-6 lg:mx-8"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {loading ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => (
                  <div
                    key={index}
                      className="bg-white p-5 shadow-md rounded-lg"
                      style={{
                        border: '1px solid #F3F4F6'
                      }}
                  >
                    {/* Skeleton for campaign header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                        </div>
                        <div className="h-6 bg-gray-200 rounded-full w-16 ml-4" />
                      </div>

                      {/* Skeleton for tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                        <div className="h-6 bg-gray-200 rounded-full w-24" />
                    </div>

                      {/* Skeleton for stats row */}
                      <div className="flex justify-between items-center mb-4 py-3 px-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-12 mb-1 mx-auto" />
                          <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                      </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-16 mb-1 mx-auto" />
                          <div className="h-4 bg-gray-200 rounded w-6 mx-auto" />
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-10 mb-1 mx-auto" />
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                      </div>
                    </div>

                      {/* Skeleton for progress section */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-16" />
                          <div className="h-4 bg-gray-200 rounded w-8" />
                      </div>
                        <div className="h-2 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  ))}
                    </div>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => (
                    <div
                      key={index}
                      className="bg-white p-4 shadow-md rounded-lg"
                      style={{
                        border: '1px solid #F3F4F6'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="h-4 bg-gray-200 rounded w-16" />
                          <div className="h-4 bg-gray-200 rounded w-12" />
                          <div className="h-4 bg-gray-200 rounded w-20" />
                          <div className="h-6 bg-gray-200 rounded-full w-16" />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              )
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center p-4 animate-fade-in">
                No campaigns found
              </div>
            ) : viewMode === "card" ? (
              <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map((campaign, index) => (
                  <Link
                    key={campaign._id}
                    href={campaign.status !== "draft"
                      ? `/campaign-details/${campaign._id}`
                      : `/campaigns/create?campaignId=${campaign._id}`
                    }
                                                                                      className="group block bg-white p-4 md:p-5 animate-card-deal shadow-sm hover:shadow-lg hover:bg-gray-50/40 hover:border-gray-300/60 transition-all duration-200 ease-out h-fit cursor-pointer rounded-lg"
                    style={{
                        border: '1px solid #F3F4F6',
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Campaign Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary text-base mb-2 line-clamp-2 sm:truncate transition-colors duration-200">
                          {campaign.name || ""}
                        </h3>
                        {(campaign.eventId?.name || campaign.eventName) && (
                          <p className="text-sm text-gray-600 truncate mb-2 sm:mb-3">
                              {campaign.eventId?.name ||
                                campaign.eventName ||
                                "Not specified"}
                            </p>
                        )}
                      </div>
                      <div
                        className={`inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold self-start ${
                          campaign.status === "live"
                            ? "bg-green-100 text-green-800 shadow-sm"
                            : campaign.status === "draft"
                              ? "bg-amber-50 text-amber-700 shadow-sm"
                              : campaign.status === "waiting_for_approval"
                                ? "bg-yellow-100 text-yellow-800 shadow-sm"
                                : campaign.status === "completed"
                                  ? "bg-blue-100 text-blue-800 shadow-sm"
                                  : campaign.status === "matching gifts"
                                    ? "bg-purple-100 text-purple-800 shadow-sm"
                                    : "bg-gray-100 text-gray-800 shadow-sm"
                        }`}
                      >
                        {campaign.status === "live" && (
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 md:mr-2 animate-pulse"></div>
                        )}
                        <span className="hidden sm:inline">
                          {campaign.status
                            ? campaign.status.charAt(0).toUpperCase() +
                              campaign.status.slice(1).replace(/_/g, " ")
                            : ""}
                        </span>
                        <span className="sm:hidden">
                          {campaign.status === "live" ? "Live" :
                           campaign.status === "draft" ? "Draft" :
                           campaign.status === "completed" ? "Done" :
                           campaign.status === "waiting_for_approval" ? "Pending" :
                           campaign.status || ""}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        {getCampaignMotionName(campaign.eventType || "")}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {formatEventTiming(
                          campaign.eventStartDate,
                          campaign?.deliverByDate,
                          campaign?.createdAt
                        )}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex justify-between items-center mb-4 py-3 px-3 bg-gray-50 rounded-lg">
                                            <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Budget</div>
                        <div className="font-semibold text-gray-900">
                          {campaign.budget?.totalBudget
                            ? `$${(campaign.budget.totalBudget + ((campaign.motion === "booth_giveaways" ? campaign.total_recipients : campaign?.recipientCountsData?.total_recipients || 0) * 10)).toLocaleString()}`
                            : "$0"}
                      </div>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Recipients</div>
                        <div className="font-semibold text-gray-900">
                          {campaign?.motion === "booth_giveaways"
                            ? campaign?.total_recipients
                            : campaign?.recipientCountsData?.total_recipients || 0}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Dates</div>
                        <div className="font-medium text-gray-900 text-xs">
                          {campaign.eventStartDate && campaign.deliverByDate
                            ? `${new Date(campaign.eventStartDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })} - ${new Date(campaign.deliverByDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}`
                            : "Not set"}
                        </div>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {((((campaign.recipientCountsData?.status_counts?.Delivered || 0) +
                            (campaign.recipientCountsData?.status_counts?.Acknowledged || 0)) /
                            Math.max(1, campaign.motion == "booth_giveaways"
                              ? campaign.total_recipients
                              : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    <CampaignProgressBar
                      totalRecipients={
                        campaign.motion == "booth_giveaways"
                          ? campaign.total_recipients
                          : campaign.recipientCountsData?.total_recipients ||
                            campaign.profilesTargeted ||
                            0
                      }
                      delivered={
                        (campaign.recipientCountsData?.status_counts
                          ?.Delivered || 0) +
                        (campaign.recipientCountsData?.status_counts
                          ?.Acknowledged || 0)
                      }
                      acknowledged={
                        campaign.recipientCountsData?.status_counts
                          ?.Acknowledged || 0
                      }
                        className="h-2"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                {/* Mobile: Always List View */}
                <div className="block md:hidden space-y-2">
                  {campaigns.map((campaign, index) => (
                    <Link
                      key={campaign._id}
                      href={campaign.status !== "draft"
                        ? `/campaign-details/${campaign._id}`
                        : `/campaigns/create?campaignId=${campaign._id}`
                      }
                      className="group block bg-white p-4 shadow-sm hover:shadow-lg hover:bg-gray-50/30 hover:border-gray-300/50 transition-all duration-200 ease-out cursor-pointer rounded-lg"
                      style={{
                        border: '1px solid #F3F4F6',
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        {/* Left side - Campaign Info */}
                                                 <div className="flex-1 min-w-0 pr-3">
                           <h3 className="font-semibold text-gray-900 group-hover:text-primary text-sm leading-tight mb-1 line-clamp-2 transition-colors duration-200">
                             {campaign.name || ""}
                           </h3>
                           {(campaign.eventId?.name || campaign.eventName) && (
                             <p className="text-xs text-gray-600 truncate mb-2">
                               {campaign.eventId?.name ||
                                 campaign.eventName ||
                                 "Not specified"}
                             </p>
                           )}

                                                     {/* Progress Bar */}
                           <div className="mb-1">
                             <div className="flex items-center gap-2">
                               <div className="flex-1 max-w-[200px]">
                                 <div className="w-full bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  {/* Progress bars implementation */}
                                                                     <div
                                     className="bg-blue-400 h-1.5 rounded-full absolute left-0 top-0 transition-all duration-300"
                                     style={{
                                       width: `${((((campaign.recipientCountsData?.status_counts?.Delivered || 0) +
                                         (campaign.recipientCountsData?.status_counts?.Acknowledged || 0)) /
                                         Math.max(1, campaign.motion == "booth_giveaways"
                                           ? campaign.total_recipients
                                           : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%`
                                     }}
                                   ></div>
                                   <div
                                     className="bg-green-500 h-1.5 rounded-full absolute left-0 top-0 transition-all duration-300 mix-blend-multiply"
                                     style={{
                                       width: `${(((campaign.recipientCountsData?.status_counts?.Acknowledged || 0) /
                                         Math.max(1, campaign.motion == "booth_giveaways"
                                           ? campaign.total_recipients
                                           : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%`
                                     }}
                                   ></div>
                                                                 </div>
                               </div>
                               <div className="text-[10px] text-gray-500 whitespace-nowrap leading-tight">
                                 {((((campaign.recipientCountsData?.status_counts?.Delivered || 0) +
                                   (campaign.recipientCountsData?.status_counts?.Acknowledged || 0)) /
                                   Math.max(1, campaign.motion == "booth_giveaways"
                                     ? campaign.total_recipients
                                     : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Right side - Mobile optimized layout */}
                         <div className="flex flex-col gap-2 flex-shrink-0">
                                                     {/* Budget and Status row */}
                           <div className="flex items-center justify-between gap-3">
                             <div className="text-right">
                               <div className="text-[10px] text-gray-500 mb-0.5">Budget</div>
                               <div className="font-semibold text-gray-900 text-xs">
                                 {campaign.budget?.totalBudget
                                   ? `$${(campaign.budget.totalBudget + ((campaign.motion === "booth_giveaways" ? campaign.total_recipients : campaign?.recipientCountsData?.total_recipients || 0) * 10)).toLocaleString()}`
                                   : "$0"}
                               </div>
                             </div>
                             <div
                               className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                campaign.status === "live"
                                  ? "bg-green-100 text-green-800 shadow-sm"
                                  : campaign.status === "draft"
                                    ? "bg-amber-50 text-amber-700 shadow-sm"
                                    : campaign.status === "waiting_for_approval"
                                      ? "bg-yellow-100 text-yellow-800 shadow-sm"
                                      : campaign.status === "completed"
                                        ? "bg-blue-100 text-blue-800 shadow-sm"
                                        : campaign.status === "matching gifts"
                                          ? "bg-purple-100 text-purple-800 shadow-sm"
                                          : "bg-gray-100 text-gray-800 shadow-sm"
                              }`}
                            >
                                                             {campaign.status === "live" && (
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                               )}
                               <span>
                                 {campaign.status === "live" ? "Live" :
                                  campaign.status === "draft" ? "Draft" :
                                  campaign.status === "completed" ? "Done" :
                                  campaign.status === "waiting_for_approval" ? "Pending" :
                                  campaign.status || ""}
                               </span>
                            </div>
                          </div>

                                                     {/* Tags row */}
                           <div className="flex flex-wrap gap-1 justify-end">
                             <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                               {getCampaignMotionName(campaign.eventType || "").length > 12
                                 ? getCampaignMotionName(campaign.eventType || "").substring(0, 12) + "..."
                                 : getCampaignMotionName(campaign.eventType || "")}
                             </span>
                             <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-medium">
                               {formatEventTiming(
                                 campaign.eventStartDate,
                                 campaign?.deliverByDate,
                                 campaign?.createdAt
                               )}
                             </span>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: List View */}
                <div className="hidden md:block space-y-3">
                {campaigns.map((campaign, index) => (
                        <Link
                    key={campaign._id}
                    href={campaign.status !== "draft"
                      ? `/campaign-details/${campaign._id}`
                      : `/campaigns/create?campaignId=${campaign._id}`
                    }
                                                                                      className="group block bg-white p-3 shadow-sm hover:shadow-lg hover:bg-gray-50/30 hover:border-gray-300/50 transition-all duration-200 ease-out cursor-pointer rounded-lg"
                          style={{
                        border: '1px solid #F3F4F6',
                        animationDelay: `${index * 50}ms`,
                      }}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left side - Campaign Info */}
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary text-base mb-1 truncate transition-colors duration-200">
                          {campaign.name || ""}
                        </h3>
                        {(campaign.eventId?.name || campaign.eventName) && (
                          <p className="text-sm text-gray-600 truncate mb-3">
                            {campaign.eventId?.name ||
                              campaign.eventName ||
                              "Not specified"}
                          </p>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex-1 max-w-xs md:max-w-sm">
                              <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                {/* Delivered (blue) - base layer */}
                                <div
                                  className="bg-blue-400 h-2 rounded-full absolute left-0 top-0 transition-all duration-300"
                                  style={{
                                    width: `${((((campaign.recipientCountsData?.status_counts?.Delivered || 0) +
                                      (campaign.recipientCountsData?.status_counts?.Acknowledged || 0)) /
                                      Math.max(1, campaign.motion == "booth_giveaways"
                                        ? campaign.total_recipients
                                        : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%`
                                  }}
                                ></div>
                                {/* Acknowledged (green) - overlay layer */}
                                <div
                                  className="bg-green-500 h-2 rounded-full absolute left-0 top-0 transition-all duration-300 mix-blend-multiply"
                                  style={{
                                    width: `${(((campaign.recipientCountsData?.status_counts?.Acknowledged || 0) /
                                      Math.max(1, campaign.motion == "booth_giveaways"
                                        ? campaign.total_recipients
                                        : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {((((campaign.recipientCountsData?.status_counts?.Delivered || 0) +
                                (campaign.recipientCountsData?.status_counts?.Acknowledged || 0)) /
                                Math.max(1, campaign.motion == "booth_giveaways"
                                  ? campaign.total_recipients
                                  : campaign.recipientCountsData?.total_recipients || 0)) * 100).toFixed(0)}% completed
                            </div>
                          </div>
                          {/* Legend - Mobile optimized */}
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-gray-600">
                                <span className="hidden sm:inline">Acknowledged: </span>
                                <span className="sm:hidden">Ack: </span>
                                {campaign.recipientCountsData?.status_counts?.Acknowledged || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-gray-600">
                                <span className="hidden sm:inline">Delivered: </span>
                                <span className="sm:hidden">Del: </span>
                                {campaign.recipientCountsData?.status_counts?.Delivered || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span className="text-gray-600">
                                Total: {campaign?.motion === "booth_giveaways"
                                  ? campaign?.total_recipients
                                  : campaign?.recipientCountsData?.total_recipients || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Mobile optimized layout */}
                      <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
                        {/* Mobile: Tags row */}
                        <div className="flex flex-wrap gap-1.5 md:gap-2 order-2 md:order-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                            {getCampaignMotionName(campaign.eventType || "")}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {formatEventTiming(
                              campaign.eventStartDate,
                              campaign?.deliverByDate,
                              campaign?.createdAt
                            )}
                          </span>
                        </div>

                        {/* Mobile: Budget and Status row */}
                        <div className="flex items-center justify-between md:justify-start md:gap-6 order-1 md:order-2">
                          <div className="text-left md:text-center">
                            <div className="text-xs text-gray-500 mb-1">Budget</div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {campaign.budget?.totalBudget
                                ? `$${(campaign.budget.totalBudget + ((campaign.motion === "booth_giveaways" ? campaign.total_recipients : campaign?.recipientCountsData?.total_recipients || 0) * 10)).toLocaleString()}`
                                : "$0"}
                            </div>
                          </div>
                          <div
                            className={`inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold ${
                              campaign.status === "live"
                                ? "bg-green-100 text-green-800 shadow-sm"
                                : campaign.status === "draft"
                                  ? "bg-amber-50 text-amber-700 shadow-sm"
                                  : campaign.status === "waiting_for_approval"
                                    ? "bg-yellow-100 text-yellow-800 shadow-sm"
                                    : campaign.status === "completed"
                                      ? "bg-blue-100 text-blue-800 shadow-sm"
                                      : campaign.status === "matching gifts"
                                        ? "bg-purple-100 text-purple-800 shadow-sm"
                                        : "bg-gray-100 text-gray-800 shadow-sm"
                            }`}
                          >
                            {campaign.status === "live" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 md:mr-2 animate-pulse"></div>
                            )}
                            <span className="hidden xs:inline">
                              {campaign.status
                                ? campaign.status.charAt(0).toUpperCase() +
                                  campaign.status.slice(1).replace(/_/g, " ")
                                : ""}
                            </span>
                            <span className="xs:hidden">
                              {campaign.status === "live" ? "Live" :
                               campaign.status === "draft" ? "Draft" :
                               campaign.status === "completed" ? "Done" :
                               campaign.status === "waiting_for_approval" ? "Pending" :
                               campaign.status || ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 md:mt-4 border-t pt-3 border-gray-100">
            <button
              className={`flex items-center px-2 py-1.5 md:px-4 md:py-2 text-[#667085] font-[500] text-xs md:text-[14px] border border-gray-200 rounded-md ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Image
                src="/svgs/Rarrow.svg"
                alt="Previous Icon"
                width={8}
                height={8}
                className="mr-1 md:mr-2 w-2 h-2 md:w-3 md:h-3"
              />
              Prev
            </button>

            <div className="flex items-center">
              <span className="text-xs md:text-sm text-gray-500 mr-2 hidden sm:inline">
                Page
              </span>
              <div className="flex space-x-1 md:space-x-2 text-[#667085] text-xs md:text-[14px] font-[500]">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 py-1 rounded-md h-[30px] w-[30px] md:h-[36px] md:w-[36px] ${
                        currentPage === pageNum
                          ? "bg-[#F9F5FF] text-[#7F56D9] border border-[#7F56D9]"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && currentPage < totalPages - 1 && (
                  <span className="flex items-center justify-center px-2">
                    ...
                  </span>
                )}
              </div>
              <span className="text-xs md:text-sm text-gray-500 ml-2 hidden sm:inline">
                of {totalPages}
              </span>
            </div>

            <button
              className={`flex items-center px-2 py-1.5 md:px-4 md:py-2 text-[#667085] font-[500] text-xs md:text-[14px] border border-gray-200 rounded-md ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <Image
                src="/svgs/arrow.svg"
                alt="Next Icon"
                width={8}
                height={8}
                className="ml-1 md:ml-2 w-2 h-2 md:w-3 md:h-3"
              />
            </button>
          </div>

          {/* Mobile pagination info */}
          <div className="flex justify-center mt-2 mb-10 text-xs text-gray-500 md:hidden">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}
