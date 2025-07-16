"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Plus,
  Calendar,
  MapPin,
  Tag,
  Megaphone,
  Eye,
  Edit,
  Archive,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";

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

@keyframes subtleShake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-1deg);
  }
  75% {
    transform: rotate(1deg);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

@keyframes buttonLift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-2px);
  }
}

@keyframes buttonGlow {
  0% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  100% {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
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

.hover-subtle-shake:hover {
  animation: subtleShake 0.5s ease-in-out;
}

.hover-pulse-glow:hover {
  animation: pulseGlow 2s ease-in-out infinite;
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.hover-rotate {
  transition: transform 0.3s ease;
}

.hover-rotate:hover {
  transform: rotate(5deg);
}

.hover-bounce {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hover-bounce:hover {
  transform: scale(1.1);
}

.hover-button {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hover-button:hover {
  animation: buttonLift 0.3s forwards, buttonGlow 0.3s forwards;
}
`;

/**
 * Event interface defining the structure of event data
 *
 * @property {string} eventId - Unique identifier for the event
 * @property {string} name - Name of the event
 * @property {string} type - Type of event (e.g., "Conference", "Webinar")
 * @property {string} eventDate - Formatted date string of the event
 * @property {string} location - Location of the event
 * @property {string} eventUrl - URL to the event's page
 * @property {string} hostCompany - Name of the host company
 * @property {string} eventDesc - Description of the event
 * @property {string} targetAudience - Target audience for the event
 * @property {string[]} eventTopic - Array of topics or categories for the event
 * @property {string[]} agendaSummary - Array of summary points for the event agenda
 * @property {string[]} speakers - Array of speaker names
 * @property {string} serviceFocus - Main focus or theme of the event
 * @property {object} media - Object containing event logo and banner
 * @property {string} eventHashtag - Hashtag for the event
 * @property {string[]} campaignIds - Array of campaign IDs associated with the event
 * @property {string} createdAt - Formatted string indicating when the event was created
 * @property {string} updatedAt - Formatted string indicating when the event was last updated
 * @property {string} status - Optional status of the event
 */
interface Event {
  eventId: string;
  name: string;
  type: string;
  eventDate: string;
  location: string;
  eventUrl: string;
  hostCompany: string;
  eventDesc: string;
  targetAudience: string;
  eventTopic: string[];
  agendaSummary: string[];
  speakers: string[];
  serviceFocus: string;
  media: {
    eventLogo: string;
    banner: string;
  };
  eventHashtag: string;
  campaignIds: string[];
  createdAt: string;
  updatedAt: string;
  status?: "upcoming" | "live" | "past" | "archived" | "draft";
}

/**
 * Mock event data for demonstration purposes
 *
 * TODO: Replace with actual API data when integrating with backend
 * The structure should match the Event interface above
 */
const mockEvents: Event[] = [
  {
    eventId: "1",
    name: "B2B Growth Summit 2025",
    type: "Webinar",
    eventDate: "Apr 22, 2025",
    location: "Online",
    eventUrl: "",
    hostCompany: "",
    eventDesc: "",
    targetAudience: "",
    eventTopic: ["ABM", "Martech", "AI"],
    agendaSummary: [],
    speakers: [],
    serviceFocus: "",
    media: {
      eventLogo: "",
      banner: "",
    },
    eventHashtag: "",
    campaignIds: ["1", "2"],
    createdAt: "2025-04-20T10:00:00",
    updatedAt: "2025-04-20T10:00:00",
  },
  {
    eventId: "2",
    name: "Digital Marketing Conference",
    type: "Conference",
    eventDate: "May 15, 2025",
    location: "San Francisco, CA",
    eventUrl: "",
    hostCompany: "",
    eventDesc: "",
    targetAudience: "",
    eventTopic: ["Digital", "Marketing", "Strategy"],
    agendaSummary: [],
    speakers: [],
    serviceFocus: "",
    media: {
      eventLogo: "",
      banner: "",
    },
    eventHashtag: "",
    campaignIds: ["3"],
    createdAt: "2025-05-10T10:00:00",
    updatedAt: "2025-05-10T10:00:00",
  },
];

/**
 * EventsPage Component
 *
 * Displays a list of events with filtering and sorting capabilities.
 *
 * API Integration:
 * 1. Replace the mockEvents with actual API data
 * 2. Update the fetchEvents function to call your API endpoint
 * 3. Ensure the API response matches the Event interface structure
 * 4. Add error handling for API failures
 *
 * Example API integration:
 *
 * const fetchEvents = async () => {
 *   try {
 *     const response = await fetch(
 *       `https://sandbox-api.delightloop.ai/v1/organizations/${organizationId}/events`,
 *       {
 *         headers: {
 *           Authorization: `Bearer ${authToken}`,
 *         },
 *       }
 *     );
 *
 *     if (!response.ok) {
 *       throw new Error(`API error: ${response.status}`);
 *     }
 *
 *     const data = await response.json();
 *
 *     // Transform API data to match Event interface if needed
 *     const events = data.map((item: any) => ({
 *       id: item.id,
 *       name: item.name,
 *       date: formatDate(item.date),
 *       type: item.type,
 *       location: item.location,
 *       status: item.status,
 *       imageUrl: item.imageUrl || "/placeholder-event.jpg",
 *       tags: item.tags || [],
 *       campaignCount: item.campaignCount || 0,
 *       activeCampaigns: item.activeCampaigns || 0,
 *       draftCampaigns: item.draftCampaigns || 0,
 *       lastUpdated: formatTimeAgo(item.updatedAt),
 *     }));
 *
 *     setEvents(events);
 *   } catch (error) {
 *     console.error("Failed to fetch events:", error);
 *     setError("Failed to load events. Please try again later.");
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 */
const TYPE_OPTIONS = ["Webinar", "Conference", "Workshop", "Meetup"];

export default function EventsPage() {
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    status: {
      upcoming: false,
      live: false,
      past: false,
      archived: false,
    },
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  // Pagination options
  const paginationOptions = [6, 12, 24, 36];

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Add new filter states
  const [sortFilter, setSortFilter] = useState<
    "createdToday" | "updatedToday" | "customDate" | "none"
  >("none");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");

  // Unique filter options
  // Add "Draft" and "Archived" to statusOptions
  const statusOptions = [
    "Draft",
    "Upcoming",
    "Active",
    "Completed",
    "Archived",
  ];

  // Update filterCount
  useEffect(() => {
    setFilterCount(
      (statusFilter.length ? 1 : 0) +
        (typeFilter.length ? 1 : 0) +
        (sortFilter !== "none" ? 1 : 0) +
        (sortFilter === "customDate" && (customDateFrom || customDateTo)
          ? 1
          : 0)
    );
  }, [statusFilter, typeFilter, sortFilter, customDateFrom, customDateTo]);

  // Ensure new/updated events appear on page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [events.length, sortFilter, customDateFrom, customDateTo]);

  /**
   * Fetches events data from the API
   *
   * TODO: Replace with actual API call
   * Current implementation uses mock data for demonstration
   */
  useEffect(() => {
    const fetchEvents = async () => {
      // Don't fetch if we're still loading auth or missing data
      if (isLoadingCookies || !authToken || !userId || !organizationId) {
        console.log("Waiting for auth data...", {
          isLoadingCookies,
          hasToken: !!authToken,
          userId,
          organizationId,
        });
        return;
      }

      // Don't fetch if we've already initialized
      if (isInitialized) {
        console.log("Events already initialized");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching events...");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Raw API response:", responseData);

        // Check if the data is in the expected format
        const eventsData =
          responseData.events || responseData.data || responseData;

        if (!Array.isArray(eventsData)) {
          console.error("Events data is not an array:", eventsData);
          throw new Error("Invalid data format received from API");
        }

        // Transform the data to match our interface
        const transformedEvents = eventsData
          .map((event: any, index: number) => {
            try {
              return {
                eventId:
                  event._id || event.id || `event-${Date.now()}-${index}`,
                name: event.name || "Untitled Event",
                type: event.type || "Other",
                eventDate: event.eventDate || new Date().toISOString(),
                location: event.location || "TBD",
                eventUrl: event.eventUrl || "",
                hostCompany: event.hostCompany || "",
                eventDesc: event.eventDesc || "",
                targetAudience: event.targetAudience || "",
                eventTopic: Array.isArray(event.eventTopic)
                  ? event.eventTopic
                  : [],
                agendaSummary: Array.isArray(event.agendaSummary)
                  ? event.agendaSummary
                  : [],
                speakers: Array.isArray(event.speakers) ? event.speakers : [],
                serviceFocus: event.serviceFocus || "",
                media: {
                  eventLogo:
                    event.media?.eventLogo ||
                    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop",
                  banner:
                    event.media?.banner ||
                    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
                },
                eventHashtag: event.eventHashtag || "",
                campaignIds: Array.isArray(event.campaignIds)
                  ? event.campaignIds
                  : [],
                createdAt: event.createdAt || new Date().toISOString(),
                updatedAt: event.updatedAt || new Date().toISOString(),
                status: event.status
                  ? String(event.status).toLowerCase()
                  : undefined,
              } as Event;
            } catch (err) {
              console.error("Error transforming event:", err, event);
              return null;
            }
          })
          .filter((event): event is Event => event !== null);

        console.log("Transformed events:", transformedEvents);
        setEvents(transformedEvents);
        // Calculate total pages based on the number of events and items per page
        setTotalPages(Math.ceil(transformedEvents.length / itemsPerPage));
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [authToken, userId, organizationId, isLoadingCookies, isInitialized]);

  // Update total pages when itemsPerPage changes
  useEffect(() => {
    if (events.length > 0) {
      setTotalPages(Math.ceil(events.length / itemsPerPage));
      // Reset to first page when items per page changes
      setCurrentPage(1);
    }
  }, [events.length, itemsPerPage]);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of events section
      document
        .getElementById("events-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newValue: number) => {
    setItemsPerPage(newValue);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  /**
   * Returns the appropriate status badge based on event status
   *
   * @param {string} status - The event status
   * @returns {JSX.Element} - The badge component
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Upcoming
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Completed
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Draft
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-gray-200 text-gray-500 hover:bg-gray-200">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  // Add filter toggle function
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Function to filter events based on search and filter criteria
  const getFilteredEvents = () => {
    const filtered = events.filter((event) => {
      // Filter out events with draft campaign status
      if (event.status === "draft") {
        return false;
      }

      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.eventTopic &&
          event.eventTopic.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ));

      // Status filter (now matches backend status and computed status)
      let matchesStatus = true;
      if (statusFilter.length) {
        const eventStatus = getEventStatus(event);
        matchesStatus = statusFilter.some(
          (s) => eventStatus === s.toLowerCase()
        );
      }

      // Type
      let matchesType = true;
      if (typeFilter.length) {
        matchesType = typeFilter.includes(event.type);
      }

      // Custom date filter
      let matchesDate = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (sortFilter === "createdToday") {
        const created = new Date(event.createdAt);
        created.setHours(0, 0, 0, 0);
        matchesDate = created.getTime() === today.getTime();
      } else if (sortFilter === "updatedToday") {
        const updated = new Date(event.updatedAt);
        updated.setHours(0, 0, 0, 0);
        matchesDate = updated.getTime() === today.getTime();
      } else if (
        sortFilter === "customDate" &&
        (customDateFrom || customDateTo)
      ) {
        const created = new Date(event.createdAt);
        const updated = new Date(event.updatedAt);
        let from = customDateFrom ? new Date(customDateFrom) : null;
        let to = customDateTo ? new Date(customDateTo) : null;
        matchesDate =
          (!from || created >= from || updated >= from) &&
          (!to || created <= to || updated <= to);
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    return filtered;
  };

  // Get paginated events
  const getPaginatedEvents = () => {
    const filteredEvents = getFilteredEvents();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEvents.slice(startIndex, endIndex);
  };

  // Helper function to safely get event status
  // Now uses backend status if present and matches filter labels
  const getEventStatus = (
    event: Event
  ): "upcoming" | "active" | "completed" | "draft" | "archived" => {
    // Use backend status if present and valid
    if (typeof event.status === "string") {
      const status = event.status.toLowerCase();
      if (
        status === "upcoming" ||
        status === "active" ||
        status === "completed" ||
        status === "draft" ||
        status === "archived"
      ) {
        return status;
      }
    }
    // Fallback to computed status
    try {
      const now = new Date();
      const eventDate = new Date(event.eventDate);
      if (isNaN(eventDate.getTime())) return "upcoming";
      const eventPlus24 = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
      if (eventDate > now) return "upcoming";
      if (now <= eventPlus24) return "active";
      if (now > eventPlus24) return "completed";
      return "upcoming";
    } catch {
      return "upcoming";
    }
  };

  // Helper function to safely format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "Date TBD";
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date TBD";
    }
  };

  // Improved "x days x hours x minutes ago" formatting
  const getTimeAgo = (dateString: string): string => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      if (isNaN(past.getTime())) return "Recently";
      let diff = Math.floor((now.getTime() - past.getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      const days = Math.floor(diff / 86400);
      diff -= days * 86400;
      const hours = Math.floor(diff / 3600);
      diff -= hours * 3600;
      const minutes = Math.floor(diff / 60);
      let str = "";
      if (days) str += `${days}d `;
      if (hours) str += `${hours}h `;
      if (minutes || (!days && !hours)) str += `${minutes}m `;
      return str.trim() + " ago";
    } catch {
      return "Recently";
    }
  };

  // Tooltip logic for event name (show only on event name hover, above)
  const [tooltipEventId, setTooltipEventId] = useState<string | null>(null);
  const nameRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  // Helper for creative chip UI
  const Chip = ({
    label,
    selected,
    onClick,
    color = "primary",
    icon,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
    color?: string;
    icon?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium shadow-sm
        ${
          selected
            ? "bg-primary text-white border-primary scale-105 shadow-lg"
            : "bg-white border-gray-300 text-gray-700 hover:bg-primary/10 hover:scale-105"
        }
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30
      `}
      style={{
        boxShadow: selected ? "0 4px 16px 0 rgba(127,86,217,0.10)" : undefined,
        transform: selected ? "scale(1.07)" : undefined,
      }}
      aria-pressed={selected}
    >
      {icon}
      <span>{label}</span>
      {selected && (
        <svg
          className="ml-1 w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="8" cy="8" r="8" fill="#7F56D9" />
          <path
            d="M5 8l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  const [archivingId, setArchivingId] = useState<string | null>(null);

  // Add prevStatus tracking state
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({});

  // Update archive handler to save previous status
  const handleArchiveEvent = async (eventId: string) => {
    if (!authToken || !organizationId) {
      toast.error("Missing authentication");
      return;
    }
    setArchivingId(eventId);
    try {
      // Find the event and save its current status before archiving
      const event = events.find((e) => e.eventId === eventId);
      const currentStatus = event?.status || getEventStatus(event as Event);

      setPrevStatuses((prev) => ({
        ...prev,
        [eventId]: currentStatus,
      }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "archived" }),
        }
      );
      if (!res.ok) throw new Error("Failed to archive event");
      // Optimistically update UI
      setEvents((prev) =>
        prev.map((ev) =>
          ev.eventId === eventId ? { ...ev, status: "archived" } : ev
        )
      );
      toast.success("Event archived");
    } catch (err: any) {
      toast.error(err.message || "Failed to archive event");
    } finally {
      setArchivingId(null);
    }
  };

  // Add unarchive handler
  const handleUnarchiveEvent = async (eventId: string) => {
    if (!authToken || !organizationId) {
      toast.error("Missing authentication");
      return;
    }
    setArchivingId(eventId);
    try {
      // Get the previous status or default to "upcoming"
      const prevStatus = prevStatuses[eventId] || "upcoming";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: prevStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to unarchive event");

      // Optimistically update UI
      setEvents((prev) =>
        prev.map((ev) =>
          ev.eventId === eventId ? { ...ev, status: prevStatus as any } : ev
        )
      );

      // Remove from prevStatuses
      setPrevStatuses((prev) => {
        const newState = { ...prev };
        delete newState[eventId];
        return newState;
      });

      toast.success("Event unarchived");
    } catch (err: any) {
      toast.error(err.message || "Failed to unarchive event");
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      {/* Sidebar - now sticky */}
      <AdminSidebar />

      {/* Main Content - with proper overflow handling */}
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <div
            className="animate-fade-in opacity-0"
            style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
          >
            <div className="relative">
              <PageHeader
                title="Events"
                description="Manage and track your events"
                primaryButton={{
                  text: "Add Event",
                  icon: Plus,
                  href: "/event/create",
                  variant: "primary"
                }}
                chips={filterCount > 0 ? [{ text: `${filterCount} filter${filterCount > 1 ? 's' : ''} applied`, color: "blue" }] : []}
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
                      <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>
                    
                    {/* Filter Button */}
                    <button
                      onClick={() => setShowFilters((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                      </svg>
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
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    <span>Filters</span>
                    {filterCount > 0 && (
                      <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-4 md:right-10 top-[280px] md:top-[280px] z-[120] w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                  {/* Status Multi-Select - creative chips */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2 py-1">
                      {statusOptions.map((status) => (
                        <Chip
                          key={status}
                          label={status}
                          selected={statusFilter.includes(status)}
                          onClick={() =>
                            setStatusFilter((prev) =>
                              prev.includes(status)
                                ? prev.filter((s) => s !== status)
                                : [...prev, status]
                            )
                          }
                          icon={
                            status === "Active" ? (
                              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                            ) : status === "Upcoming" ? (
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                            ) : status === "Completed" ? (
                              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                            ) : status === "Draft" ? (
                              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                            ) : status === "Archived" ? (
                              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {/* Type Multi-Select - creative chips */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Event Type
                    </label>
                    <div className="flex flex-wrap gap-2 py-1">
                      {TYPE_OPTIONS.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          selected={typeFilter.includes(type)}
                          onClick={() =>
                            setTypeFilter((prev) =>
                              prev.includes(type)
                                ? prev.filter((t) => t !== type)
                                : [...prev, type]
                            )
                          }
                          icon={
                            type === "Webinar" ? (
                              <CalendarDays className="w-3 h-3 text-primary" />
                            ) : type === "Conference" ? (
                              <Tag className="w-3 h-3 text-blue-500" />
                            ) : type === "Workshop" ? (
                              <Megaphone className="w-3 h-3 text-green-500" />
                            ) : type === "Meetup" ? (
                              <MapPin className="w-3 h-3 text-yellow-500" />
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {/* Sort/Date Filters */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sort & Date
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Chip
                          label="Created Today"
                          selected={sortFilter === "createdToday"}
                          onClick={() => setSortFilter("createdToday")}
                        />
                        <Chip
                          label="Updated Today"
                          selected={sortFilter === "updatedToday"}
                          onClick={() => setSortFilter("updatedToday")}
                        />
                        <Chip
                          label="Custom Date"
                          selected={sortFilter === "customDate"}
                          onClick={() => setSortFilter("customDate")}
                        />
                      </div>
                      {sortFilter === "customDate" && (
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            placeholder="From"
                          />
                          <span className="text-xs text-gray-400">to</span>
                          <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            placeholder="To"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Clear Filters Button */}
                  {(statusFilter.length > 0 ||
                    typeFilter.length > 0 ||
                    (sortFilter !== "none" && sortFilter !== "customDate") ||
                    (sortFilter === "customDate" &&
                      (customDateFrom || customDateTo))) && (
                    <div className="flex justify-end pt-2">
                      <button
                        className="text-xs text-primary hover:underline px-2 py-1"
                        onClick={() => {
                          setStatusFilter([]);
                          setTypeFilter([]);
                          setSortFilter("none");
                          setCustomDateFrom("");
                          setCustomDateTo("");
                        }}
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Events Content */}
            <div
              id="events-section"
              className="animate-fade-in-up opacity-0 mx-4 md:mx-6 lg:mx-8"
              style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 flex flex-col h-full"
                    >
                      {/* Skeleton for event image */}
                      <div className="h-[120px] w-full bg-gray-200 rounded-lg mb-4 flex-shrink-0" />

                      {/* Skeleton for event title */}
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 flex-shrink-0" />

                      {/* Skeleton for event meta info */}
                      <div className="space-y-2 mb-4 flex-shrink-0">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>

                      {/* Skeleton for tags */}
                      <div className="flex gap-2 mb-4 flex-shrink-0">
                        <div className="h-6 bg-gray-200 rounded w-16" />
                        <div className="h-6 bg-gray-200 rounded w-20" />
                        <div className="h-6 bg-gray-200 rounded w-14" />
                      </div>

                      {/* Add flex-grow spacer */}
                      <div className="flex-grow"></div>

                      {/* Skeleton for footer */}
                      <div className="flex justify-between items-center pt-4 border-t mt-auto flex-shrink-0">
                        <div className="h-8 bg-gray-200 rounded w-20" />
                        <div className="h-8 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <svg
                        className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No events found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || showFilters
                        ? "Try adjusting your search or filters"
                        : "Let's add your first event and start crafting moments of delight"}
                    </p>

                    {!searchTerm && !showFilters && (
                      <Link
                        href="/event/create"
                        className="w-full sm:w-auto inline-block"
                      >
                        <Button
                          className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
                          style={{
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                            transform: "translateY(0)",
                            boxShadow:
                              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-4px)";
                            e.currentTarget.style.boxShadow =
                              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4 hover-bounce" />
                          Add New Event
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : getFilteredEvents().length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <svg
                        className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No matching events
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your search or filters to find what you're
                      looking for
                    </p>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter([]);
                        setTypeFilter([]);
                        setSortFilter("none");
                        setCustomDateFrom("");
                        setCustomDateTo("");
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {getPaginatedEvents().map((event, index) => (
                    <Card
                      key={event.eventId}
                      className="rounded-xl shadow-sm border bg-white hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible z-10 group animate-card-deal hover-lift flex flex-col"
                      style={{
                        height: "100%", // Ensure all cards have same height
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {/* Event Image with Status Badge */}
                      <div className="relative h-[120px] w-full overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            event.media?.banner ||
                            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop"
                          }
                          alt={event.name || "Event"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop";
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(getEventStatus(event))}
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            variant="outline"
                            className="bg-white/80 text-gray-600 text-xs"
                          >
                            Updated {getTimeAgo(event.updatedAt)}
                          </Badge>
                        </div>
                      </div>

                      {/* Event Header with Title and Meta Information */}
                      <CardHeader className="pb-3 sm:pb-4">
                        {/* Tooltip on event name if truncated */}
                        <div className="relative w-full">
                          <Link
                            href={`/event/${event.eventId}`}
                            className="text-base sm:text-lg font-semibold hover:text-primary transition-colors block truncate max-w-full"
                            ref={(el) => {
                              nameRefs.current[event.eventId] = el;
                            }}
                            tabIndex={0}
                            onMouseEnter={() => {
                              if (
                                nameRefs.current[event.eventId] &&
                                nameRefs.current[event.eventId]!.scrollWidth >
                                  nameRefs.current[event.eventId]!.clientWidth
                              ) {
                                setTooltipEventId(event.eventId);
                              }
                            }}
                            onMouseLeave={() => setTooltipEventId(null)}
                          >
                            {event.name}
                          </Link>
                          {/* Tooltip if text is truncated and only on event name hover */}
                          {tooltipEventId === event.eventId && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 bg-purple-50 text-black text-xs rounded px-3 py-2 shadow-lg whitespace-pre-line min-w-[180px] max-w-xs pointer-events-none opacity-100 transition-opacity duration-200"
                              style={{
                                whiteSpace: "pre-line",
                                maxWidth: "320px",
                              }}
                            >
                              {event.name}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-1 sm:gap-2 mt-2 sm:mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 hover-subtle-shake" />
                            <span>{formatDate(event.eventDate)}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 sm:h-4 sm:w-4 hover-subtle-shake" />
                            <span>{event.type}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 hover-subtle-shake" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        {/* Event Tags - Creative Tag Display */}
                        {Array.isArray(event.eventTopic) &&
                          event.eventTopic.length > 0 && (
                            <div className="mt-4 sm:mt-5 mb-1 sm:mb-2 pt-1">
                              {event.eventTopic.length <= 3 ? (
                                // Simple display for 3 or fewer tags
                                <div className="flex flex-wrap gap-1">
                                  {event.eventTopic.map((topic, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-primary/10 text-primary border border-primary/20 shadow-sm hover:scale-110 transition-transform"
                                    >
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                // Enhanced display for more than 3 tags with creative presentation
                                <div className="relative">
                                  <div className="flex flex-wrap gap-1 relative">
                                    {/* Show first 2 tags */}
                                    {event.eventTopic
                                      .slice(0, 2)
                                      .map((topic, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="text-xs bg-primary/10 text-primary border border-primary/20 shadow-sm transform transition-all duration-300 hover:scale-110 hover:rotate-1 hover:shadow-md"
                                        >
                                          {topic}
                                        </Badge>
                                      ))}

                                    {/* Counter badge with tag count and tooltip */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-primary/20 text-primary border border-primary/30 shadow-sm cursor-pointer hover:bg-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-md"
                                          >
                                            +{event.eventTopic.length - 2}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-white p-2 shadow-lg rounded-md border z-50 max-w-xs">
                                          <div className="flex flex-wrap gap-1">
                                            {event.eventTopic
                                              .slice(2)
                                              .map((topic, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="secondary"
                                                  className="text-xs bg-primary/5 text-primary border border-primary/10"
                                                >
                                                  {topic}
                                                </Badge>
                                              ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </CardHeader>

                      {/* Event Content with Campaign Stats - added flex-grow to push footer down */}
                      <CardContent className="pb-2 sm:pb-3 overflow-visible flex-grow">
                        <div className="flex items-center justify-between">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-xs sm:text-sm font-medium text-gray-700 hover-scale cursor-pointer">
                                  <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 hover-subtle-shake" />
                                  <span>
                                    {Array.isArray(event.campaignIds)
                                      ? event.campaignIds.length
                                      : 0}{" "}
                                    Campaigns
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                align="start"
                                className="bg-white border border-gray-200 shadow-md p-3 w-auto min-w-[180px] z-50"
                                sideOffset={5}
                                avoidCollisions={true}
                                collisionPadding={10}
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm text-gray-900">
                                    Campaign Status
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                      <span className="text-gray-600">
                                        Active:
                                      </span>
                                      <span className="ml-auto font-medium">
                                        {Array.isArray(event.campaignIds)
                                          ? event.campaignIds.length
                                          : 0}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                      <span className="text-gray-600">
                                        Complete:
                                      </span>
                                      <span className="ml-auto font-medium">
                                        {Array.isArray(event.campaignIds)
                                          ? event.campaignIds.length
                                          : 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>

                      {/* Event Footer with Action Buttons - at the bottom */}
                      <CardFooter className="flex justify-between pt-3 sm:pt-4 border-t mt-auto flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/event/${event.eventId}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-600 hover:text-primary hover:bg-primary/5 group hover-scale"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View event details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex gap-2">
                          <Link href={`/campaigns/create/`}>
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 hover-scale hover-button"
                            >
                              Create Campaign
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover-scale"
                              >
                                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white"
                            >
                              <DropdownMenuItem
                                asChild
                                className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
                              >
                                <Link href={`/event/${event.eventId}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>

                              {getEventStatus(event) === "archived" ? (
                                <DropdownMenuItem
                                  className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
                                  onClick={() =>
                                    handleUnarchiveEvent(event.eventId)
                                  }
                                  disabled={archivingId === event.eventId}
                                >
                                  <Archive className="mr-2 h-4 w-4 rotate-180" />
                                  {archivingId === event.eventId
                                    ? "Unarchiving..."
                                    : "Unarchive"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
                                  onClick={() =>
                                    handleArchiveEvent(event.eventId)
                                  }
                                  disabled={archivingId === event.eventId}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  {archivingId === event.eventId
                                    ? "Archiving..."
                                    : "Archive"}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                asChild
                                className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
                              >
                                <Link href={`/event/${event.eventId}`}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {!isLoading && getFilteredEvents().length > itemsPerPage && (
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
                          {Array.from(
                            { length: Math.min(3, totalPages) },
                            (_, i) => {
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
                            }
                          )}
                          {totalPages > 3 && currentPage < totalPages - 1 && (
                            <span className="flex items-center justify-center px-2">
                              ...
                            </span>
                          )}
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

                    {/* Mobile pagination info */}
                    <div className="flex justify-center mt-2 mb-10 text-xs text-gray-500 md:hidden">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
