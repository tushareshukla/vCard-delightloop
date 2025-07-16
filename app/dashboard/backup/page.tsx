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
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import EventCard from "@/components/dashboard/EventCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, campaigns: 0, gifts: 0 });
  const [userDetails, setUserDetails] = useState<any>(null);
  const router = useRouter();

  // Add pagination options
  const paginationOptions = [10, 25, 50, 100];

  useEffect(() => {
    if (!isLoadingCookies && authToken) {
      fetchUserDetails();
      fetchDashboardData();
    }
  }, [isLoadingCookies, authToken]);

  const fetchUserDetails = async () => {
    try {
      if (!authToken || !userId) return;

      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(`${baseUrl}/v1/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!authToken || !organizationId) {
        return;
      }

      const baseUrl = await getBackendApiBaseUrl();
      
      // Fetch events data
      const eventsResponse = await fetch(`${baseUrl}/v1/organizations/${organizationId}/events?limit=4&sortField=updatedAt&sortOrder=desc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (eventsResponse.status === 401) {
        router.push("/");
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(`${baseUrl}/v1/organizations/${organizationId}/dashboard/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!eventsResponse.ok || !statsResponse.ok) {
        throw new Error(`HTTP error! status: ${eventsResponse.status || statsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      const statsData = await statsResponse.json();

      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }

      if (statsData.success) {
        setStats({
          events: statsData.data.eventCount || 0,
          campaigns: statsData.data.campaignCount || 0,
          gifts: statsData.data.giftCount || 0,
        });

        // Create activity items
        const activityItems = [
          ...(statsData.data.recentDeliveries || []).map((delivery: any) => ({
            id: `delivery-${delivery.id}`,
            emoji: "🎁",
            message: `${delivery.count} gifts delivered for ${delivery.campaignName}`,
            timestamp: delivery.timestamp,
            campaignId: delivery.campaignId,
          })),
          ...(statsData.data.recentCampaigns || []).map((campaign: any) => ({
            id: `campaign-${campaign.id}`,
            emoji: "✨",
            message: `Campaign "${campaign.name}" was created`,
            timestamp: campaign.createdAt,
            campaignId: campaign.id,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         .slice(0, 5); // Limit to 5 most recent activities

        setActivities(activityItems);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

      if (data.success) {
        let filteredCampaigns = data.data;

        // Only filter on the client side if status is provided and not 'all'
        if (status && status !== "all") {
          filteredCampaigns = filteredCampaigns.filter(
            (campaign: any) =>
              campaign.status.toLowerCase() === status.toLowerCase()
          );
        }

        setCampaigns(filteredCampaigns);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.currentPage);
      } else {
        throw new Error(data.error || "Failed to fetch campaigns");
      }
    } catch (err) {
      console.error("Error details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch campaigns"
      );
    } finally {
      setLoading(false);
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

  // Format events for EventCard component
  const formattedEvents = events.map(event => ({
    id: event.eventId || event._id,
    name: event.name || "Untitled Event",
    image: event.media?.banner,
    date: event.eventDate || event.createdAt,
    location: event.location || "Online",
    type: event.type || "Event",
    topics: event.eventTopic || [],
    updatedAt: event.updatedAt || event.createdAt,
    status: event.status || "upcoming"
  }));

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      {/* //todo ------------------  Sidebar ------------------ */}
      <AdminSidebar />
      {/* //todo ------------------  Main Content ------------------ */}
      <div className={`pt-3 bg-primary w-full overflow-x-hidden`}>
        <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto pb-10 sm:pb-0">
          {/* //! Header */}
          <div className="flex justify-between items-center gap-3 mb-3 md:mb-4">
            <h1 className="text-lg md:text-[30px] md:leading-9 font-[500] truncate">
              Campaign Overview
            </h1>
            <div className="flex gap-2 flex-shrink-0">
              {/* Event Campaign button temporarily hidden
              <Link
                href="/dashboard/event-campaign"
                className="bg-[#7E3AF2] font-medium text-white px-3 py-1.5 rounded-lg text-sm md:text-base hover:bg-[#6e2fd9] duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Image
                  src="/svgs/event-icon.svg"
                  alt="event"
                  width={16}
                  height={16}
                  className="w-4 h-4 md:w-[18px] md:h-[18px]"
                />
                Event Campaign
              </Link>
              */}
              <Link 
                href="/create-your-campaign"
                className="bg-primary font-medium text-white px-3 py-1.5 rounded-lg text-sm md:text-base hover:bg-primary-dark duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Image
                  src="/svgs/Shimmer.svg"
                  alt="plus"
                  width={16}
                  height={16}
                  className="w-4 h-4 md:w-[18px] md:h-[18px]"
                />
                New Campaign
              </Link>
            </div>
          </div>

          {/* //! Description */}
          <p className="text-[13px] md:text-[16px] font-normal leading-5 md:leading-6 text-[#667085] mb-3 md:mb-[18px]">
            Track delivery rates, engagement, and ROI in real-time.
          </p>
          {/* //! Three Images Below Campaign Overview */}
          <div className=" flex-col md:flex-row mb-6 gap-4 md:gap-8 border-y-[1px] py-[18px] border-[#F2F4F7] hidden">
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

          {/* //! Buttons, Search, and Filter */}
          <div className="flex  flex-col md:flex-row md:items-center justify-between gap-3 my-3 md:my-[30px]">
            {/* Mobile-only search - at top for mobile */}
            <div className="flex md:hidden w-full h-[40px] border border-[#D0D5DD] shadow-sm rounded-lg px-3 py-2 bg-white">
              <Image
                src="/svgs/search.svg"
                alt="Search Icon"
                className="w-4 h-4 text-gray-400 mt-0.5"
                width={16}
                height={16}
              />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 ml-2 text-sm focus:outline-none text-gray-800 placeholder-gray-500"
              />
            </div>

            {/* Mobile filter and pagination controls in one row */}
            <div className="hidden  justify-between items-center w-full gap-2">
              {/* Filter button */}
              <div className="relative z-20 flex-1">
                <button
                  onClick={toggleMobileFilter}
                  className="w-full flex justify-between items-center px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white shadow-sm text-sm"
                >
                  <span className="truncate">
                    Filter:{" "}
                    {activeFilter.charAt(0).toUpperCase() +
                      activeFilter.slice(1).replace("_", " ")}
                  </span>
                  <Image
                    src="/svgs/arrow.svg"
                    alt="Toggle Filter"
                    width={10}
                    height={10}
                    className={`transition-transform duration-300 ${
                      mobileFilterOpen ? "rotate-180" : ""
                    } ml-1 flex-shrink-0`}
                  />
                </button>

                {/* Mobile filter dropdown */}
                {mobileFilterOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-[#D0D5DD] rounded-lg shadow-lg text-sm">
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 ${
                        activeFilter === "all" ? "bg-[#F9FAFB]" : ""
                      }`}
                      onClick={() => handleFilterClick("all")}
                    >
                      View all
                    </button>
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 border-t border-[#D0D5DD] ${
                        activeFilter === "draft" ? "bg-[#F9FAFB]" : ""
                      }`}
                      onClick={() => handleFilterClick("draft")}
                    >
                      Draft
                    </button>
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 border-t border-[#D0D5DD] ${
                        activeFilter === "live" ? "bg-[#F9FAFB]" : ""
                      }`}
                      onClick={() => handleFilterClick("live")}
                    >
                      Live
                    </button>
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 border-t border-[#D0D5DD] ${
                        activeFilter === "waiting_for_approval"
                          ? "bg-[#F9FAFB]"
                          : ""
                      }`}
                      onClick={() => handleFilterClick("waiting_for_approval")}
                    >
                      Waiting for Approval
                    </button>
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 border-t border-[#D0D5DD] ${
                        activeFilter === "matching gifts" ? "bg-[#F9FAFB]" : ""
                      }`}
                      onClick={() => handleFilterClick("matching gifts")}
                    >
                      Matching Gifts
                    </button>
                    <button
                      className={`w-full text-left text-[#344054] px-3 py-2.5 border-t border-[#D0D5DD] ${
                        activeFilter === "completed" ? "bg-[#F9FAFB]" : ""
                      }`}
                      onClick={() => handleFilterClick("completed")}
                    >
                      Completed
                    </button>
                  </div>
                )}
              </div>

              {/* Combined pagination and refresh controls */}
              <div className="flex gap-2">
                <select
                  className="p-2 h-[40px] text-xs font-[500] border border-[#D0D5DD] shadow-sm rounded-md text-gray-700 w-[90px]"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                >
                  {paginationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    fetchCampaigns(currentPage, searchTerm, activeFilter)
                  }
                  className="p-2 h-[40px] text-[14px] font-[500] border border-[#D0D5DD] shadow-sm rounded-md text-gray-700 hover:bg-gray-50"
                  title="Refresh Campaigns"
                >
                  <Image
                    src="/svgs/refresh.svg"
                    alt="Refresh Campaigns"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            {/* Desktop filter buttons - first in order for web view */}
            <div className="hidden md:inline-flex border border-[#D0D5DD] rounded-lg bg-white shadow-sm overflow-x-auto">
              <button
                className={`text-[#344054] px-4 py-2 rounded-l-lg focus:outline-none ${
                  activeFilter === "all" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("all")}
              >
                View all
              </button>
              <button
                className={`text-[#344054] px-4 py-2 border-l border-[#D0D5DD] focus:outline-none ${
                  activeFilter === "draft" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("draft")}
              >
                Draft
              </button>
              <button
                className={`text-[#344054] px-4 py-2 border-l border-[#D0D5DD] focus:outline-none ${
                  activeFilter === "live" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("live")}
              >
                Live
              </button>
              <button
                className={`text-[#344054] px-4 py-2 border-l border-[#D0D5DD] p-1 focus:outline-none ${
                  activeFilter === "waiting_for_approval" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("waiting_for_approval")}
              >
                Waiting for Approval
              </button>
              <button
                className={`text-[#344054] px-4 py-2 border-l border-[#D0D5DD] p-1 focus:outline-none ${
                  activeFilter === "matching gifts" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("matching gifts")}
              >
                Matching Gifts
              </button>
              <button
                className={`text-[#344054] px-4 py-2 border-l border-[#D0D5DD] rounded-r-lg focus:outline-none ${
                  activeFilter === "completed" ? "bg-[#F9FAFB]" : ""
                }`}
                onClick={() => handleFilterClick("completed")}
              >
                Completed
              </button>
            </div>

            {/* Desktop search and pagination controls */}
            <div className="hidden md:flex items-center gap-3">
              {/* Desktop search - second in order for web view */}
              <div className="flex w-[400px] h-[44px] border border-[#D0D5DD] shadow-sm rounded-lg px-3 py-2 bg-white">
                <Image
                  src="/svgs/search.svg"
                  alt="Search Icon"
                  className="w-5 h-5 text-gray-400 mt-0.5"
                  width={16}
                  height={16}
                />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 ml-2 text-base focus:outline-none text-gray-800 placeholder-gray-500"
                />
              </div>

              <select
                className="p-2 h-[40px] text-[14px] font-[500] border border-[#D0D5DD] shadow-sm rounded-md text-gray-700"
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
              >
                {paginationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} items
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  fetchCampaigns(currentPage, searchTerm, activeFilter)
                }
                className="p-2 h-[40px] text-[14px] font-[500] border border-[#D0D5DD] shadow-sm rounded-md text-gray-700 hover:bg-gray-50"
                title="Refresh Campaigns"
              >
                <Image
                  src="/svgs/refresh.svg"
                  alt="Refresh Campaigns"
                  width={16}
                  height={16}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>

          {/* //! Campaigns Table */}
          <div className="bg-white rounded-lg">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="text-center">
                  <tr className="text-left h-[18px] text-[12px] bg-[#FCFCFD] text-[#667085] pt-12 pb-12">
                    <th className="py-3 font-medium pl-4">Campaign Name</th>
                    <th className="py-[12px] font-medium whitespace-nowrap pl-6">
                      Status
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap pl-4">
                      Start Date
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap pl-4">
                      End Date
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap pl-2">
                      Profiles Targeted
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap pl-6">
                      Gifts Delivered
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap text-right">
                      Total Budget
                    </th>
                    <th className="py-2 font-medium whitespace-nowrap pl-2"></th>
                  </tr>
                </thead>

                <tbody className="">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-red-500">
                        Error: {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        No campaigns found
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign, index) => (
                      <CampaignTableRow
                        key={campaign._id}
                        campaign={campaign}
                        authToken={authToken}
                        index={index}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {loading && (
                <div className="text-center py-4 text-sm">Loading...</div>
              )}
              {error && (
                <div className="text-center py-4 text-red-500 text-sm">
                  Error: {error}
                </div>
              )}
              {!loading && !error && filteredCampaigns.length === 0 ? (
                <div className="text-center py-4 text-sm">
                  No campaigns found
                </div>
              ) : (
                filteredCampaigns.map((campaign, index) => (
                  <div
                    key={campaign._id}
                    className="border rounded-lg p-3 mb-3 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-[15px] break-words line-clamp-1">
                        {campaign.name || ""}
                      </h3>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          campaign.status === "live"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : campaign.status === "waiting_for_approval"
                            ? "bg-yellow-100 text-yellow-800"
                            : campaign.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : campaign.status === "matching gifts"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status
                          ? campaign.status.charAt(0).toUpperCase() +
                            campaign.status.slice(1).replace(/_/g, " ")
                          : ""}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date:</span>
                        <span>
                          {campaign.startDate
                            ? new Date(campaign.startDate).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date:</span>
                        <span>
                          {campaign.endDate
                            ? new Date(campaign.endDate).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gifts Delivered:</span>
                        <span>{campaign.giftsDelivered || ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Budget:</span>
                        <span>
                          {campaign.totalBudget
                            ? `$${campaign.totalBudget.toLocaleString()}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      {/* Gift delivery progress bar with count and percentage */}
                      <div className="w-3/5 pr-2 flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${
                                campaign.giftsDelivered &&
                                campaign.profilesTargeted
                                  ? Math.min(
                                      Math.round(
                                        (campaign.giftsDelivered /
                                          campaign.profilesTargeted) *
                                          100
                                      ),
                                      100
                                    )
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {campaign.giftsDelivered || 0}/
                          {campaign.profilesTargeted || 0}{" "}
                          {campaign.giftsDelivered && campaign.profilesTargeted
                            ? Math.min(
                                Math.round(
                                  (campaign.giftsDelivered /
                                    campaign.profilesTargeted) *
                                    100
                                ),
                                100
                              )
                            : 0}
                          %
                        </span>
                      </div>

                      <Link
                        href={`/campaign-detail/${campaign._id}`}
                        className="text-primary text-xs font-medium px-3 py-1.5 border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/campaign-detail/${campaign._id}`);
                        }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr className="mb-3"></hr>

            {/* Pagination - with extra bottom margin to avoid navbar obstruction */}
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

            {/* Mobile pagination info - with extra bottom margin */}
            <div className="flex justify-center mt-2 mb-10 text-xs text-gray-500 md:hidden">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
