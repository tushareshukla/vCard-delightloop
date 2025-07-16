"use client";
import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { Plus, Search } from "lucide-react";
import {
  getDelightEngageLists,
  createDelightEngageList,
} from "../utils/api/delightEngage";
import * as XLSX from "xlsx";
import { Mail } from "lucide-react";

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
  }
}

@keyframes cardDeal {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes skeletonPulse {
  0% {
    background-color: rgba(226, 232, 240, 0.6);
  }
  50% {
    background-color: rgba(226, 232, 240, 0.9);
  }
  100% {
    background-color: rgba(226, 232, 240, 0.6);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-card-deal {
  animation: cardDeal 0.4s ease-out forwards;
  opacity: 0;
}

.animate-skeleton-pulse {
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
`;

// Extend DelightEngageList type to include metrics
interface DelightEngageList {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    totalContacts?: number;
  };
  eventId?: string;
  eventName?: string;
  outcome?: string;
  stepCount?: number;
  steps?: any[];
  status?: "draft" | "active" | "inactive";
  event_id?: string; // Backend field
  outreach_outcome?: string; // Backend field
}

function getUpdatedAgo(updatedAt: string) {
  if (typeof window === "undefined") return "";
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffInHours = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60)
  );
  if (diffInHours < 1) return "just now";
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

export default function DelightEngageLists() {
  const { authToken, organizationId, isLoadingCookies } = useAuth();
  const [lists, setLists] = useState<DelightEngageList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Add pagination state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Add pagination options
  const paginationOptions = [12, 24, 36, 48];

  // Add state for create sequence modal
  const [showCreateSequenceModal, setShowCreateSequenceModal] = useState(false);
  const [sequenceData, setSequenceData] = useState({
    name: "",
    event: "",
    outcome: "",
  });
  const [isCreatingSequence, setIsCreatingSequence] = useState(false);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [sequenceCreated, setSequenceCreated] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);

  // Replace static events with state that will be fetched
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Update outreach outcomes array to match API enum values
  const outreachOutcomes = [
    {
      value: "registration_boost_net_new",
      label: "Registration boost - Net new",
    },
    {
      value: "registration_boost_existing_accounts",
      label: "Registration boost - Exiting accounts",
    },
    {
      value: "registration_boost_existing_users",
      label: "Registration boost - Existing users",
    },
    {
      value: "pre_event_book_meeting_booth",
      label: "Pre event - Book a meeting at booth (Physical)",
    },
    { value: "thank_you_book_meeting", label: "Thank you - Book a meeting" },
    { value: "thank_you_watch_video", label: "Thank you - Watch the video" },
    { value: "thank_you_leave_review", label: "Thank you - leave a review" },
    {
      value: "thank_you_download_whitepapers",
      label: "Thank you - download the WhitePapers",
    },
    { value: "speaker_confirmation", label: "Speaker confirmation" },
  ];

  // Add state for event details
  const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null);

  useEffect(() => {
    if (!isLoadingCookies) {
      fetchLists();
      fetchEvents(); // Add this to fetch events when component loads
    }
    // eslint-disable-next-line
  }, [isLoadingCookies]);

  // Add effect to refresh lists when returning to page (e.g., from emails page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoadingCookies) {
        // Refresh lists when page becomes visible again
        fetchLists();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoadingCookies]);

  const fetchLists = async () => {
    if (!authToken || !organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/sequences`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sequences: ${response.status}`);
      }

      const data = await response.json();
      const sequences = data.sequences || data.data || [];

      // Fetch step counts and enrich sequences with event and outcome data
      const sequencesWithStepCounts = await Promise.all(
        sequences.map(async (sequence) => {
          try {
            // Fetch step count
            const stepsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/sequences/${sequence._id}/steps`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            let stepCount = 0;
            let steps = [];
            if (stepsResponse.ok) {
              const stepsData = await stepsResponse.json();
              steps = stepsData.steps || [];
              stepCount = steps.length;
            }

            // Fetch event name if event_id exists
            let eventName = "";
            if (sequence.event_id) {
              try {
                const eventResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${sequence.event_id}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (eventResponse.ok) {
                  const eventData = await eventResponse.json();
                  eventName = eventData.name || eventData.event?.name || "";
                  console.log(
                    `Event fetched for sequence ${sequence._id}:`,
                    eventName
                  );
                } else {
                  console.log(
                    `Failed to fetch event for sequence ${sequence._id}:`,
                    eventResponse.status
                  );
                }
              } catch (error) {
                console.error(
                  `Error fetching event for sequence ${sequence._id}:`,
                  error
                );
              }
            }

            // Convert outreach_outcome to readable label
            const outcomeLabel =
              outreachOutcomes.find(
                (outcome) => outcome.value === sequence.outreach_outcome
              )?.label || sequence.outreach_outcome;

            console.log(`Sequence ${sequence._id} mapping:`, {
              event_id: sequence.event_id,
              eventName,
              outreach_outcome: sequence.outreach_outcome,
              outcomeLabel,
            });

            return {
              ...sequence,
              stepCount,
              steps,
              eventId: sequence.event_id,
              eventName,
              outcome: outcomeLabel,
            };
          } catch (error) {
            console.error(
              `Error fetching data for sequence ${sequence._id}:`,
              error
            );
            return {
              ...sequence,
              stepCount: 0,
              eventId: sequence.event_id,
              eventName: "",
              outcome:
                outreachOutcomes.find(
                  (outcome) => outcome.value === sequence.outreach_outcome
                )?.label || sequence.outreach_outcome,
            };
          }
        })
      );

      setLists(sequencesWithStepCounts);

      // Calculate total pages
      setTotalPages(Math.ceil(sequencesWithStepCounts.length / itemsPerPage));
    } catch (err) {
      setError("Failed to fetch lists");
      console.error("Error fetching sequences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to fetch events
  const fetchEvents = async () => {
    if (!authToken || !organizationId) return;

    setIsLoadingEvents(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();

      // Extract events from the response
      const eventsData = data.events || data.data || [];

      // Transform events to the format needed for the dropdown
      const formattedEvents = eventsData.map((event: any) => ({
        id: event._id || event.eventId || event.id,
        name: event.name || "Unnamed Event",
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Fallback to sample events if API call fails
      setEvents([
        { id: "1", name: "Annual Conference 2023" },
        { id: "2", name: "Product Launch Webinar" },
        { id: "3", name: "Customer Appreciation Event" },
      ]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Toggle filters function
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Function to handle items per page change
  const handleItemsPerPageChange = (newValue: number) => {
    setItemsPerPage(newValue);
    setCurrentPage(1); // Reset to first page when changing items per page
    setTotalPages(Math.ceil(lists.length / newValue));
  };

  // Function to get filtered lists based on search term
  const getFilteredLists = () => {
    // Filter lists based on search term
    const filteredLists = lists.filter((list) => {
      return (
        searchTerm === "" ||
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (list.description &&
          list.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    // Update total pages based on filtered results
    const newTotalPages = Math.ceil(filteredLists.length / itemsPerPage);
    if (totalPages !== newTotalPages) {
      setTotalPages(newTotalPages);

      // Reset to first page if current page is out of range
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      lists: filteredLists.slice(startIndex, endIndex),
      totalCount: filteredLists.length,
    };
  };

  // Add function to fetch event details
  const fetchEventDetails = async (eventId: string) => {
    if (!authToken || !organizationId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch event details: ${response.status}`);
      }

      const data = await response.json();
      setSelectedEventDetails(data);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  // Update event selection handler
  const handleEventChange = (eventId: string) => {
    setSequenceData({
      ...sequenceData,
      event: eventId,
    });
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
      setSelectedEventDetails(null);
    }
  };

  // Update handleCreateSequence function
  const handleCreateSequence = async (e: FormEvent) => {
    e.preventDefault();
    if (isCreatingSequence) return;
    setIsCreatingSequence(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/sequences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: sequenceData.name,
            event_id: sequenceData.event,
            outreach_outcome: sequenceData.outcome,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create sequence: ${response.status}`);
      }

      const data = await response.json();

      // Create new sequence object with the API response
      const newSequence = {
        _id: data.sequence_id,
        name: sequenceData.name,
        description: selectedEventDetails?.description || "New email sequence",
        userId: "current-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          totalContacts: 0,
        },
        eventId: sequenceData.event,
        eventName: events.find((e) => e.id === sequenceData.event)?.name || "",
        outcome:
          outreachOutcomes.find((o) => o.value === sequenceData.outcome)
            ?.label || sequenceData.outcome,
      };

      setLists([newSequence, ...lists]);
      setSequenceCreated(true);

      // Navigate to the email sequence page with the correct parameters
      const params = new URLSearchParams();
      params.append("sequenceId", data.sequence_id);
      if (sequenceData.event) {
        params.append("eventId", sequenceData.event);
      }
      params.append("outreachOutcome", sequenceData.outcome);

      // Navigate to the email sequence page
      router.push(`/delight-engage/emails?${params.toString()}`);

      // Reset form after short delay
      setTimeout(() => {
        setSequenceCreated(false);
        setShowCreateSequenceModal(false);
        setSequenceData({
          name: "",
          event: "",
          outcome: "",
        });
        setSelectedEventDetails(null);
      }, 1500);
    } catch (error) {
      console.error("Error creating sequence:", error);
      setError("Failed to create sequence");
    } finally {
      setIsCreatingSequence(false);
    }
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#F9F9FC]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <div
            className="animate-fade-in opacity-0 relative z-10"
            style={{ animationDelay: "20ms", animationFillMode: "forwards" }}
          >
            <PageHeader
              title="Delight Engage"
              description="Manage and organize your outreach sequences"
              chips={[
                {
                  text: "Beta",
                  color: "blue"
                }
              ]}
              primaryButton={{
                text: "Create New Sequence",
                icon: Plus,
                onClick: () => setShowCreateSequenceModal(true),
                variant: "primary"
              }}
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
                      placeholder="Search sequences..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  

                </div>
              </div>

              {/* Desktop: Single row layout */}
              <div className="hidden md:flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sequences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            {/* Lists Display */}
            <div
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
            >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="p-5 border border-[#D2CEFE] rounded-xl relative bg-white animate-fade-in-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4 animate-skeleton-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-skeleton-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-skeleton-pulse"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-2/5 animate-skeleton-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-skeleton-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <div className="text-red-500 text-center my-8">{error}</div>
              </div>
            ) : lists.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <div className="text-gray-500 text-center py-8">
                  No outreach sequences yet. Create your first sequence to start
                  engaging with your audience!
                </div>
              </div>
            ) : getFilteredLists().lists.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 mt-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative w-40 h-40 mb-4">
                    <Image
                      src="/svgs/empty-search.svg"
                      alt="No results found"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback if SVG doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.src = "/svgs/Mail.svg";
                      }}
                    />
                  </div>
                  <h3 className="text-gray-800 font-semibold text-lg mb-2">
                    No matching sequences found
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    We couldn't find any sequences that match your search
                    criteria. Try adjusting your search or create a new
                    sequence.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <p>Here are some suggestions:</p>
                    <ul className="list-disc list-inside text-left max-w-md mx-auto">
                      <li>Check for spelling errors in your search term</li>
                      <li>
                        Try using different keywords or more general terms
                      </li>
                      <li>
                        Clear your search and browse all available sequences
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Clear Search
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                      Create New Sequence
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {getFilteredLists().lists.map((list, index) => (
                  <div
                    key={list._id}
                    className={`p-5 border border-[#D2CEFE] rounded-xl
                      hover:shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px]
                      transition-shadow duration-300 cursor-pointer
                      relative hover-lift animate-card-deal bg-white
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() =>
                      router.push(
                        `/delight-engage/emails?sequenceId=${list._id}`
                      )
                    }
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="font-semibold text-lg truncate text-[#101828]">
                        {list.name}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded capitalize ${
                          list.status === "active"
                            ? "bg-green-100 text-green-700"
                            : list.status === "draft"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {list.status || "draft"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {list.stepCount
                        ? list.stepCount === 1
                          ? "1 Step Sequence"
                          : `${list.stepCount} Step Sequence`
                        : "Empty Sequence"}
                    </div>
                    {list.eventName && (
                      <div className="text-xs text-gray-700 mb-1 font-medium flex items-center gap-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          Event
                        </span>
                        <span className="truncate">{list.eventName}</span>
                      </div>
                    )}
                    {list.outcome && (
                      <div className="text-xs text-purple-700 mb-2 font-medium flex items-center gap-1">
                        <span className="bg-purple-50 px-2 py-0.5 rounded text-purple-700">
                          Outcome
                        </span>
                        <span className="truncate">{list.outcome}</span>
                      </div>
                    )}
                    <div className="flex justify-end items-center">
                      <div className="text-xs text-[#101828D6] font-semibold">
                        Updated {getUpdatedAgo(list.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination UI */}
            {!isLoading && !error && getFilteredLists().totalCount > 0 && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mt-3 md:mt-4 border-t pt-3 border-gray-100">
                  {/* Items per page selector */}
                  <div className="flex items-center mb-3 sm:mb-0">
                    <span className="text-xs md:text-sm text-gray-500 mr-2">
                      Show
                    </span>
                    <select
                      className="p-1 md:p-2 h-[32px] text-xs font-[500] border border-[#D0D5DD] shadow-sm rounded-md text-gray-700 w-[70px]"
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
                    <span className="text-xs md:text-sm text-gray-500 ml-2">
                      per page
                    </span>
                  </div>

                  {/* Page navigation */}
                  <div className="flex justify-between items-center w-full sm:w-auto">
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

                    <div className="flex items-center mx-2">
                      <span className="text-xs md:text-sm text-gray-500 mx-2 hidden sm:inline">
                        Page
                      </span>
                      <div className="flex space-x-1 md:space-x-2 text-[#667085] text-xs md:text-[14px] font-[500]">
                        {(() => {
                          const pages: number[] = [];
                          const maxVisiblePages = 3;
                          if (totalPages <= maxVisiblePages) {
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else if (currentPage <= 2) {
                            for (let i = 1; i <= 3; i++) {
                              pages.push(i);
                            }
                          } else if (currentPage >= totalPages - 1) {
                            for (let i = totalPages - 2; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pages.push(i);
                            }
                          }
                          return (
                            <>
                              {pages[0] > 1 && (
                                <>
                                  <button
                                    onClick={() => handlePageChange(1)}
                                    className={`px-2 py-1 rounded-md h-[30px] w-[30px] md:h-[36px] md:w-[36px] ${
                                      currentPage === 1
                                        ? "bg-[#F9F5FF] text-[#7F56D9] border border-[#7F56D9]"
                                        : "border border-gray-200 hover:bg-gray-50"
                                    }`}
                                  >
                                    1
                                  </button>
                                  {pages[0] > 2 && (
                                    <span className="flex items-center justify-center px-2">
                                      ...
                                    </span>
                                  )}
                                </>
                              )}
                              {pages.map((page) => (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`px-2 py-1 rounded-md h-[30px] w-[30px] md:h-[36px] md:w-[36px] ${
                                    currentPage === page
                                      ? "bg-[#F9F5FF] text-[#7F56D9] border border-[#7F56D9]"
                                      : "border border-gray-200 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              {pages[pages.length - 1] < totalPages && (
                                <>
                                  {pages[pages.length - 1] < totalPages - 1 && (
                                    <span className="flex items-center justify-center px-2">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handlePageChange(totalPages)}
                                    className={`px-2 py-1 rounded-md h-[30px] w-[30px] md:h-[36px] md:w-[36px] ${
                                      currentPage === totalPages
                                        ? "bg-[#F9F5FF] text-[#7F56D9] border border-[#7F56D9]"
                                        : "border border-gray-200 hover:bg-gray-50"
                                    }`}
                                  >
                                    {totalPages}
                                  </button>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-xs md:text-sm text-gray-500 mx-2 hidden sm:inline">
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
                </div>
                {/* Mobile pagination info */}
                <div className="flex justify-center mt-2 mb-10 text-xs text-gray-500 md:hidden">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Create Sequence Modal */}
          {showCreateSequenceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[600px] relative max-h-[90vh] overflow-y-auto">
                <div className="relative z-20">
                  <div className="flex justify-between items-start mb-5 border-b-[1px] border-[#EAECF0] pb-5">
                    <div>
                      <h2 className="text-xl font-semibold text-[#101828] mb-1">
                        Create New Email Sequence
                      </h2>
                      <p className="text-sm text-[#667085]">
                        Set up email sequences to engage with your audience
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateSequenceModal(false);
                        setSequenceData({
                          name: "",
                          event: "",
                          outcome: "",
                        });
                        setSelectedEventDetails(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleCreateSequence} className="space-y-6">
                    <div>
                      <label
                        htmlFor="sequence-name"
                        className="block text-sm font-medium text-[#344054] mb-1"
                      >
                        Sequence Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sequence-name"
                        type="text"
                        value={sequenceData.name}
                        onChange={(e) =>
                          setSequenceData({
                            ...sequenceData,
                            name: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                        placeholder="Enter sequence name"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="event"
                        className="block text-sm font-medium text-[#344054] mb-1"
                      >
                        Select Event <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="event"
                        value={sequenceData.event}
                        onChange={(e) => handleEventChange(e.target.value)}
                        className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white"
                        required
                      >
                        <option value="">Select an event</option>
                        {isLoadingEvents ? (
                          <option disabled>Loading events...</option>
                        ) : events.length > 0 ? (
                          events.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No events found</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="outcome"
                        className="block text-sm font-medium text-[#344054] mb-1"
                      >
                        Outreach Outcome <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="outcome"
                        value={sequenceData.outcome}
                        onChange={(e) =>
                          setSequenceData({
                            ...sequenceData,
                            outcome: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white"
                        required
                      >
                        <option value="">Select an outcome</option>
                        {outreachOutcomes.map((outcome) => (
                          <option key={outcome.value} value={outcome.value}>
                            {outcome.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#667085] mt-1">
                        Choose the desired outcome for this outreach sequence
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#EAECF0] mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateSequenceModal(false);
                          setSequenceData({
                            name: "",
                            event: "",
                            outcome: "",
                          });
                          setSelectedEventDetails(null);
                        }}
                        className="px-4 py-2.5 border border-[#D0D5DD] text-[#344054] rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          !sequenceData.name ||
                          isCreatingSequence ||
                          sequenceCreated
                        }
                        className="px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sequenceCreated ? (
                          <>
                            <svg
                              className="w-4 h-4 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>Created!</span>
                          </>
                        ) : isCreatingSequence ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <span>Create Sequence</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
