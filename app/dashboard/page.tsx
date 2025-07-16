"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import EventCard from "@/components/dashboard/EventCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import {
  Calendar,
  PlusCircle,
  Sparkles,
  Tag,
  MapPin,
  Eye,
  MoreVertical,
  Edit,
  Archive,
  ExternalLink,
  Megaphone,
  Filter,
  X,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import styles from "./styles.module.css";
import MetricsCards from "@/components/dashboard/MetricsCards";
import { toast } from "react-hot-toast";
import DelightEngage from "@/components/dashboard/DelightEngage";
import DelightSense from "@/components/dashboard/DelightSense";
import axiosClient from "@/utils/axiosInstance";

// Add type definition at the top of the file
interface Event {
  _id?: string;
  id?: string;
  name: string;
  media?: {
    banner?: string;
  };
  image?: string;
  eventDate?: string;
  date?: string;
  createdAt: string;
  updatedAt: string;
  location?: string;
  type?: string;
  eventTopic?: string[];
  topics?: string[];
  status?: string;
}

// Utility functions
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateStr);
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

const getTimeAgo = (dateString: string) => {
  try {
    const now = new Date();
    const past = new Date(dateString);

    if (isNaN(past.getTime())) {
      console.warn("Invalid date:", dateString);
      return "Recently";
    }

    const diff = now.getTime() - past.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 30) return `${Math.floor(days / 30)} months ago`;
    if (days > 0) return `${days} days ago`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hours ago`;

    return "Just now";
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "Recently";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "upcoming":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Upcoming
        </Badge>
      );
    case "live":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Live
        </Badge>
      );
    case "past":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          Past
        </Badge>
      );
    default:
      return null;
  }
};

// Filter types
type SortFilterType = "none" | "createdToday" | "updatedToday" | "customDate";

// Filter state type
interface FilterState {
  showFilters: boolean;
  statusFilter: string[];
  typeFilter: string[];
  showFilterCount: number;
  sortFilter: SortFilterType;
  customDateFrom: string;
  customDateTo: string;
}

// Filter options
const filterOptions = {
  status: ["Draft", "Upcoming", "Active", "Completed", "Archived"],
  type: ["Webinar", "Conference", "Workshop", "Meetup"],
} as const;

export default function Dashboard() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]); // Store all events for filtering
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, campaigns: 0, gifts: 0 });
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    giftsDelivered: 0,
    acknowledgementRate: 0,
    walletBalance: 0,
    deliveredGrowth: 0,
    acknowledgedGrowth: 0,
  });
  const [tooltipEventId, setTooltipEventId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const nameRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const router = useRouter();

  // Filter states
  const [filterState, setFilterState] = useState<FilterState>({
    showFilters: false,
    statusFilter: [],
    typeFilter: [],
    showFilterCount: 0,
    sortFilter: "none",
    customDateFrom: "",
    customDateTo: "",
  });

  // Update filter count whenever filters change
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      showFilterCount:
        (prev.statusFilter.length ? 1 : 0) +
        (prev.typeFilter.length ? 1 : 0) +
        (prev.sortFilter !== "none" ? 1 : 0) +
        (prev.sortFilter === "customDate" &&
          (prev.customDateFrom || prev.customDateTo)
          ? 1
          : 0),
    }));
  }, [
    filterState.statusFilter,
    filterState.typeFilter,
    filterState.sortFilter,
    filterState.customDateFrom,
    filterState.customDateTo,
  ]);

  useEffect(() => {
    if (!isLoadingCookies && authToken) {
      fetchUserDetails();
      fetchDashboardData();
      fetchMetrics();
    }
  }, [isLoadingCookies, authToken]);

  // Debug userDetails state
  useEffect(() => {
    console.log("userDetails state updated:", userDetails);
    console.log(
      "firstName value:",
      userDetails?.firstName || userDetails?.name?.split(" ")[0] || "there"
    );
  }, [userDetails]);

  const fetchUserDetails = async () => {
    try {
      if (!authToken || !userId || !organizationId) return;

      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 401) {
        router.push("/");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("User details response:", data);

      // The API returns an array directly, not wrapped in a success property
      if (Array.isArray(data)) {
        // Find the current user in the response data
        const currentUser = data.find((user: any) => user._id === userId);
        if (currentUser) {
          console.log("Current user found:", currentUser);
          setUserDetails(currentUser);
        } else {
          console.log("Current user not found in response");
        }
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
    const eventsResponse = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/events`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
        );

      if (eventsResponse.status === 401) {
        router.push("/");
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/dashboard/stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!eventsResponse.ok || !statsResponse.ok) {
        throw new Error(
          `HTTP error! status: ${eventsResponse.status || statsResponse.status}`
        );
      }

      const eventsData = await eventsResponse.json();
      const statsData = await statsResponse.json();

      // Handle the events data
      let eventsToSet: Event[] = [];

      if (Array.isArray(eventsData.events)) {
        eventsToSet = eventsData.events;
      } else if (Array.isArray(eventsData)) {
        eventsToSet = eventsData;
      }

      // Store all events for filtering
      setAllEvents(eventsToSet);

      // Sort by updatedAt and take the first 3
      const sortedEvents = eventsToSet
        .sort((a, b) => {
          const dateA = new Date(b.eventDate || b.createdAt || "").getTime();
          const dateB = new Date(a.eventDate || a.createdAt || "").getTime();
          return dateA - dateB;
        })
        .slice(0, 3);

      console.log("Sorted events to display:", sortedEvents);
      setEvents(sortedEvents);

      // Set statistics from API response
      if (statsData && statsData.data) {
        // Count only events that don't have status "draft"
        const nonDraftEventsCount = eventsToSet.filter((event) => {
          const status = event.status?.toLowerCase() || "";
          return status !== "draft";
        }).length;

        setStats({
          events: nonDraftEventsCount,
          campaigns: statsData.data.last30Days.campaignCount || 0,
          gifts: statsData.data.last30Days.deliveredCount || 0,
        });

        // Get recent activities from the API response
        if (Array.isArray(statsData.data.recentActivity)) {
          // Map the activities from the API response
          const activityItems = statsData.data.recentActivity.map(
            (activity: any) => ({
              id: activity.id || `activity-${Date.now()}-${Math.random()}`,
              emoji: "✨", // Default emoji
              message:
                activity.formattedText ||
                `Activity related to ${activity.name}`,
              timestamp: new Date().toISOString(), // Default to current time if not provided
              campaignId: activity.id, // Use the activity ID as the campaign ID
            })
          );

          setActivities(activityItems);
        } else {
          // Fallback mock data if no activities in response
          const mockActivities = [
            {
              id: "activity-1",
              emoji: "✨",
              message: 'Campaign "Welcome Webinar" was created',
              timestamp: new Date().toISOString(),
              campaignId: "campaign-1",
            },
            {
              id: "activity-2",
              emoji: "🎁",
              message: "5 gifts delivered for Spring Conference 2023",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              campaignId: "campaign-2",
            },
          ];

          setActivities(mockActivities);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const baseUrl = await getBackendApiBaseUrl();

      // Fetch metrics data from dashboard stats endpoint
      const response = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();

      // Fetch wallet balance separately
      let walletBalance = 0;
      try {
        // Use the exact endpoint format from the user's example
        const walletResponse = await fetch(
          `${baseUrl}/v1/${userId}/wallet/check-balance`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          console.log("Wallet API response:", walletData);

          // Extract the current_balance field from the wallet property
          walletBalance = walletData.wallet?.current_balance || 0;
          console.log("Extracted wallet balance:", walletBalance);
        } else {
          console.error(
            "Error fetching wallet balance - response not OK:",
            walletResponse.status
          );

          // Try an alternative endpoint format as a fallback
          console.log("Trying alternative wallet endpoint format...");
          const alternativeWalletResponse = await fetch(
            `${baseUrl}/v1/organizations/${organizationId}/wallet/balance`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (alternativeWalletResponse.ok) {
            const alternativeWalletData =
              await alternativeWalletResponse.json();
            console.log(
              "Alternative wallet API response:",
              alternativeWalletData
            );

            // Extract balance from alternative response format
            if (alternativeWalletData.wallet?.balance) {
              walletBalance = alternativeWalletData.wallet.balance;
            } else if (alternativeWalletData.balance) {
              walletBalance = alternativeWalletData.balance;
            } else if (alternativeWalletData.current_balance) {
              walletBalance = alternativeWalletData.current_balance;
            }

            console.log(
              "Extracted wallet balance from alternative endpoint:",
              walletBalance
            );
          }
        }
      } catch (walletError) {
        console.error("Error fetching wallet balance:", walletError);
      }

      // Create the metrics object with all the values
      const metricsData = {
        // Use deliveredCount from last30Days for gifts delivered
        giftsDelivered: data.data.last30Days.deliveredCount || 0,
        // Use acknowledgmentPercentage from last30Days for acknowledgement rate
        acknowledgementRate: data.data.last30Days.acknowledgmentPercentage || 0,
        // Use the wallet balance from the wallet API
        walletBalance: walletBalance,
        // Use growth values from the API
        deliveredGrowth: data.data.growth30Days.deliveredGrowth || 0,
        acknowledgedGrowth: data.data.growth30Days.acknowledgedGrowth || 0,
      };

      console.log("Setting metrics with data:", metricsData);

      // Update the metrics state
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const handleAddCredits = () => {
    router.push("/dashboard/wallet");
  };

  // Archive event handler
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({});
  const handleArchiveEvent = async (eventId: string) => {
    if (!authToken || !organizationId) {
      toast.error("Missing authentication");
      return;
    }
    setArchivingId(eventId);
    try {
      const event = events.find((e) => e.id === eventId);
      const currentStatus = event?.status || getEventStatus(event as Event);

      setPrevStatuses((prev) => ({
        ...prev,
        [eventId]: currentStatus,
      }));
      const baseUrl = await getBackendApiBaseUrl();
      const res = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/events/${eventId}`,
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
          ev._id === eventId || ev.id === eventId
            ? { ...ev, status: "archived" }
            : ev
        )
      );
      toast.success("Event archived");
    } catch (err: any) {
      toast.error(err.message || "Failed to archive event");
    } finally {
      setArchivingId(null);
    }
  };
  const handleUnarchiveEvent = async (eventId: string) => {
    if (!authToken || !organizationId) {
      toast.error("Missing authentication");
      return;
    }
    setArchivingId(eventId);
    try {
      // Get the previous status or default to "upcoming"
      const prevStatus = prevStatuses[eventId] || "upcoming";

      const baseUrl = await getBackendApiBaseUrl();
      const res = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/events/${eventId}`,
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

      // Optimistically update UI - here's the key fix
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId || ev.id === eventId
            ? { ...ev, status: prevStatus }
            : ev
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
      console.error("Unarchive error:", err);
      toast.error(err.message || "Failed to unarchive event");
    } finally {
      setArchivingId(null);
    }
  };
  // Helper function to safely get event status
  const getEventStatus = (
    event: Event
  ): "draft" | "upcoming" | "active" | "completed" | "archived" => {
    // Use backend status if present and valid
    if (typeof event.status === "string") {
      const status = event.status.toLowerCase();
      if (
        status === "draft" ||
        status === "upcoming" ||
        status === "active" ||
        status === "completed" ||
        status === "archived"
      ) {
        return status as
          | "draft"
          | "upcoming"
          | "active"
          | "completed"
          | "archived";
      }
    }

    // Fallback to computed status
    try {
      const now = new Date();
      const eventDate = new Date(
        event.eventDate || event.date || event.createdAt || ""
      );
      if (isNaN(eventDate.getTime())) return "upcoming";
      const eventPlus24 = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
      if (eventDate > now) return "upcoming";
      if (now <= eventPlus24) return "active";
      return "completed";
    } catch {
      return "upcoming";
    }
  };

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setFilterState((prev) => ({
      ...prev,
      statusFilter: prev.statusFilter.includes(status)
        ? prev.statusFilter.filter((s) => s !== status)
        : [...prev.statusFilter, status],
    }));
  };

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setFilterState((prev) => ({
      ...prev,
      typeFilter: prev.typeFilter.includes(type)
        ? prev.typeFilter.filter((t) => t !== type)
        : [...prev.typeFilter, type],
    }));
  };

  // Toggle sort filter
  const toggleSortFilter = (value: SortFilterType) => {
    setFilterState((prev) => ({
      ...prev,
      sortFilter: prev.sortFilter === value ? "none" : value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterState((prev) => ({
      ...prev,
      statusFilter: [],
      typeFilter: [],
      sortFilter: "none",
      customDateFrom: "",
      customDateTo: "",
      showFilters: false,
    }));
  };

  // Apply filters to get events to display
  const getFilteredEvents = () => {
    // If no filters are active, return originally sorted events (limited to 3)
    if (
      filterState.statusFilter.length === 0 &&
      filterState.typeFilter.length === 0 &&
      filterState.sortFilter === "none"
    ) {
      return formattedEvents;
    }

    // If filters are active, apply them to all events
    const filtered = formattedAllEvents.filter((event) => {
      // Status filter
      let matchesStatus = true;
      if (filterState.statusFilter.length > 0) {
        matchesStatus = filterState.statusFilter.some(
          (s) => event.status === s.toLowerCase()
        );
      }

      // Type filter
      let matchesType = true;
      if (filterState.typeFilter.length > 0) {
        matchesType = filterState.typeFilter.includes(event.type);
      }

      // Custom date filter
      let matchesDate = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterState.sortFilter === "createdToday") {
        const created = new Date(event.createdAt);
        created.setHours(0, 0, 0, 0);
        matchesDate = created.getTime() === today.getTime();
      } else if (filterState.sortFilter === "updatedToday") {
        const updated = new Date(event.updatedAt);
        updated.setHours(0, 0, 0, 0);
        matchesDate = updated.getTime() === today.getTime();
      } else if (
        filterState.sortFilter === "customDate" &&
        (filterState.customDateFrom || filterState.customDateTo)
      ) {
        const created = new Date(event.createdAt);
        const updated = new Date(event.updatedAt);
        let from = filterState.customDateFrom
          ? new Date(filterState.customDateFrom)
          : null;
        let to = filterState.customDateTo
          ? new Date(filterState.customDateTo)
          : null;
        matchesDate =
          (!from || created >= from || updated >= from) &&
          (!to || created <= to || updated <= to);
      }

      return matchesStatus && matchesType && matchesDate;
    });

    // If we have 3 or fewer filtered events, return them all
    if (filtered.length <= 3) {
      return filtered;
    }

    // If we have more than 3 events, ensure representation from each filter category
    const result: typeof filtered = [];

    // First, try to include at least one event from each selected status
    if (filterState.statusFilter.length > 0) {
      filterState.statusFilter.forEach((status) => {
        if (result.length >= 3) return;
        const matchingEvent = filtered.find(
          (event) =>
            getEventStatus(event) === status.toLowerCase() &&
            !result.includes(event)
        );
        if (matchingEvent) {
          result.push(matchingEvent);
        }
      });
    }

    // Next, try to include at least one event from each selected type
    if (filterState.typeFilter.length > 0 && result.length < 3) {
      filterState.typeFilter.forEach((type) => {
        if (result.length >= 3) return;
        const matchingEvent = filtered.find(
          (event) => event.type === type && !result.includes(event)
        );
        if (matchingEvent) {
          result.push(matchingEvent);
        }
      });
    }

    // If we still have room, add remaining filtered events until we reach 3
    if (result.length < 3) {
      filtered.forEach((event) => {
        if (result.length >= 3) return;
        if (!result.includes(event)) {
          result.push(event);
        }
      });
    }

    return result;
  };

  // Format events for EventCard component
  const formattedEvents = events.map((event) => ({
    id: event._id || event.id || "",
    name: event.name || "Untitled Event",
    image: event.media?.banner || event.image,
    date: event.eventDate || event.date || event.createdAt || "",
    location: event.location || "Online",
    type: event.type || "Event",
    topics: event.eventTopic || event.topics || [],
    updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
    status: getEventStatus(event),
  }));

  // Format all events for filtering
  const formattedAllEvents = allEvents.map((event) => ({
    id: event._id || event.id || "",
    name: event.name || "Untitled Event",
    image: event.media?.banner || event.image,
    date: event.eventDate || event.date || event.createdAt || "",
    location: event.location || "Online",
    type: event.type || "Event",
    topics: event.eventTopic || event.topics || [],
    updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
    status: getEventStatus(event),
  }));

  // If no events exist, create mock events for preview
  const mockEvents = [
    {
      id: "mock-1",
      name: "Annual Tech Conference 2023",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
      date: new Date().toISOString(),
      location: "San Francisco, CA",
      type: "Conference",
      topics: ["Technology", "Innovation", "AI"],
      updatedAt: new Date().toISOString(),
      status: "upcoming",
    },
    {
      id: "mock-2",
      name: "Quarterly Partner Meetup",
      image:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=2070&auto=format&fit=crop",
      date: new Date().toISOString(),
      location: "Online",
      type: "Webinar",
      topics: ["Partnerships", "Strategy"],
      updatedAt: new Date().toISOString(),
      status: "live",
    },
    {
      id: "mock-3",
      name: "Customer Appreciation Day",
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop",
      date: new Date().toISOString(),
      location: "Chicago, IL",
      type: "Event",
      topics: ["Customer Success"],
      updatedAt: new Date().toISOString(),
      status: "draft",
    },
  ];

  const displayEvents =
    getFilteredEvents().length > 0
      ? getFilteredEvents()
      : formattedEvents.length > 0
        ? formattedEvents
        : mockEvents;

  const hasEvents = formattedEvents.length > 0;
  const hasFilteredEvents = getFilteredEvents().length > 0;

  // Chip component for filter UI
  const Chip = ({
    label,
    selected,
    onClick,
    icon,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
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

  // Empty state component for when there are no events
  const EventsEmptyState = ({ filtered = false }) => (
    <div className="bg-white rounded-xl p-8 shadow-sm text-center border border-gray-200 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-light/30 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {filtered ? "No matching events" : "No events yet"}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {filtered
            ? "Try adjusting your filters to see different events"
            : "Events are the foundation of your gifting campaigns. Create your first event to start engaging with your audience through personalized gifts."}
        </p>
        {filtered ? (
          <Button
            className="bg-primary hover:bg-primary/90 text-white hover:shadow-md hover:shadow-primary/30 transition-all duration-300 group"
            onClick={clearFilters}
          >
            <X className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">
              Clear Filters
            </span>
          </Button>
        ) : (
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-white hover:shadow-md hover:shadow-primary/30 transition-all duration-300 group"
          >
            <Link href="/event/create" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                Create Your First Event
              </span>
              <Sparkles className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Draft
          </Badge>
        );
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

  return (
    <>
      <div className="flex h-screen flex-col sm:flex-row bg-white">
        {/* Sidebar */}
        <AdminSidebar />
        {/* Main Content */}
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="pl-6 pr-6 pt-2 pb-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
            {loading ? (
              <div className="space-y-6">
                {/* Skeleton for Welcome Header */}
                <div className="bg-white py-6 px-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-5">
                      <div className="hidden sm:block w-28 h-28 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-3">
                        <div className="h-8 bg-gray-200 rounded-md w-60"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-80"></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
                      <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Skeleton for Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <div className="h-8 bg-gray-200 rounded-md w-24"></div>
                            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-md w-40 mt-2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skeleton for Event Cards Grid */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded-md w-32"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-200 rounded-lg h-[280px]"
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Skeleton for Activity Feed */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="h-6 bg-gray-200 rounded-md w-40 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Welcome Header */}
                <div
                  className={`opacity-0 ${styles.animateFadeInUp}`}
                  style={{
                    animationDelay: "150ms",
                    animationFillMode: "forwards",
                  }}
                >
                  <WelcomeHeader
                    firstName={
                      userDetails?.firstName ||
                      userDetails?.name?.split(" ")[0] ||
                      "there"
                    }
                    stats={stats}
                  />
                </div>

                {/* Metrics Cards */}
                <div
                  className={`opacity-0 ${styles.animateFadeInUp}`}
                  style={{
                    animationDelay: "250ms",
                    animationFillMode: "forwards",
                  }}
                >
                  <MetricsCards
                    metrics={metrics}
                    onAddCredits={handleAddCredits}
                  />
                </div>

                {/* Event Cards Grid */}
                <div
                  className={`bg-white p-0 opacity-0 ${styles.animateFadeInUp}`}
                  style={{
                    animationDelay: "350ms",
                    animationFillMode: "forwards"
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        Events
                      </h2>
                    </div>

                    {/* Filter section for events */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilterState((prev) => ({
                            ...prev,
                            showFilters: !prev.showFilters,
                          }))
                        }
                        className={`relative border-gray-300 text-gray-700 hover:text-primary hover:border-primary transition-all ${
                          filterState.showFilters
                            ? "bg-primary/5 border-primary text-primary"
                            : ""
                          }`}
                      >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Filter
                        {filterState.showFilterCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {filterState.showFilterCount}
                          </span>
                        )}
                      </Button>

                      {filterState.showFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-gray-500 hover:text-primary"
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Clear
                        </Button>
                      )}

                      <Link href="/event" className="ml-auto sm:ml-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary border border-primary/20 hover:bg-primary/5"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Filter dropdown */}
                  {filterState.showFilters && (
                    <div className="absolute right-0 top-12 z-[120] w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                      {/* Status Multi-Select - creative chips */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Status
                        </label>
                        <div className="flex flex-wrap gap-2 py-1">
                          {filterOptions.status.map((status) => (
                            <Chip
                              key={status}
                              label={status}
                              selected={filterState.statusFilter.includes(
                                status
                              )}
                              onClick={() => toggleStatusFilter(status)}
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

                      {/* Event Type Multi-Select - creative chips */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Event Type
                        </label>
                        <div className="flex flex-wrap gap-2 py-1">
                          {filterOptions.type.map((type) => (
                            <Chip
                              key={type}
                              label={type}
                              selected={filterState.typeFilter.includes(type)}
                              onClick={() => toggleTypeFilter(type)}
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
                              selected={
                                filterState.sortFilter === "createdToday"
                              }
                              onClick={() =>
                                setFilterState((prev) => ({
                                  ...prev,
                                  sortFilter:
                                    prev.sortFilter === "createdToday"
                                      ? "none"
                                      : "createdToday",
                                }))
                              }
                            />
                            <Chip
                              label="Updated Today"
                              selected={
                                filterState.sortFilter === "updatedToday"
                              }
                              onClick={() =>
                                setFilterState((prev) => ({
                                  ...prev,
                                  sortFilter:
                                    prev.sortFilter === "updatedToday"
                                      ? "none"
                                      : "updatedToday",
                                }))
                              }
                            />
                            <Chip
                              label="Custom Date"
                              selected={filterState.sortFilter === "customDate"}
                              onClick={() =>
                                setFilterState((prev) => ({
                                  ...prev,
                                  sortFilter:
                                    prev.sortFilter === "customDate"
                                      ? "none"
                                      : "customDate",
                                }))
                              }
                            />
                          </div>
                          {filterState.sortFilter === "customDate" && (
                            <div className="flex gap-2 items-center mt-2">
                              <input
                                type="date"
                                value={filterState.customDateFrom}
                                onChange={(e) =>
                                  setFilterState((prev) => ({
                                    ...prev,
                                    customDateFrom: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                                placeholder="From"
                              />
                              <span className="text-xs text-gray-400">to</span>
                              <input
                                type="date"
                                value={filterState.customDateTo}
                                onChange={(e) =>
                                  setFilterState((prev) => ({
                                    ...prev,
                                    customDateTo: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                                placeholder="To"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      {(filterState.statusFilter.length > 0 ||
                        filterState.typeFilter.length > 0 ||
                        filterState.sortFilter !== "none" ||
                        (filterState.sortFilter === "customDate" &&
                          (filterState.customDateFrom ||
                            filterState.customDateTo))) && (
                          <div className="flex justify-end pt-2">
                            <button
                              className="text-xs text-primary hover:underline px-2 py-1"
                              onClick={clearFilters}
                            >
                              Clear all filters
                            </button>
                          </div>
                        )}
                    </div>
                  )}

                  {hasEvents ? (
                    (filterState.statusFilter.length > 0 ||
                      filterState.typeFilter.length > 0) &&
                      !hasFilteredEvents ? (
                      <EventsEmptyState filtered={true} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {displayEvents.map((event, index) => (
                          <Card
                            key={event.id}
                            className={`rounded-xl border bg-white transition-all duration-300 overflow-visible z-10 group ${styles.animateCardDeal} ${styles.hoverLift} flex flex-col h-full`}
                            style={{
                              animationDelay: `${index * 100}ms`,
                              boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
                              borderColor: '#EAECF0'
                            }}
                          >
                            {/* Event Image with Status Badge */}
                            <div className="relative h-[120px] w-full overflow-hidden flex-shrink-0 rounded-t-xl">
                              <Image
                                src={
                                  event.image ||
                                  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop"
                                }
                                alt={event.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop";
                                }}
                              />
                              <div className="absolute top-2 right-2">
                                {getStatusBadge(event.status)}
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
                                  href={`/event/${event.id}`}
                                  className="text-base sm:text-lg font-semibold hover:text-primary transition-colors block truncate max-w-full"
                                  ref={(el: HTMLAnchorElement | null) => {
                                    if (el) {
                                      nameRefs.current[event.id] = el;
                                    }
                                  }}
                                  tabIndex={0}
                                  onMouseEnter={() => {
                                    if (
                                      nameRefs.current[event.id] &&
                                      nameRefs.current[event.id]!.scrollWidth >
                                      nameRefs.current[event.id]!.clientWidth
                                    ) {
                                      setTooltipEventId(event.id);
                                    }
                                  }}
                                  onMouseLeave={() => setTooltipEventId(null)}
                                >
                                  {event.name}
                                </Link>
                                {/* Tooltip if text is truncated and only on event name hover */}
                                {tooltipEventId === event.id && (
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
                                  <span>{formatDate(event.date)}</span>
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

                              {/* Event Tags - using the same logic from event page */}
                              {Array.isArray(event.topics) &&
                                event.topics.length > 0 && (
                                  <div className="mt-4 sm:mt-5 mb-1 sm:mb-2 pt-1">
                                    {event.topics.length <= 3 ? (
                                      // Simple display for 3 or fewer tags
                                      <div className="flex flex-wrap gap-1">
                                        {event.topics.map((topic, index) => (
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
                                          {event.topics
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
                                                  +{event.topics.length - 2}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-white p-2 shadow-lg rounded-md border z-50 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                  {event.topics
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
                                    <Link href={`/event/${event.id}`}>
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
                                <Link href={`/campaigns/create?eventId=${event.id}`}>
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
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:scale-105 transition-transform"
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
                                      className="hover:bg-gray-100 transition-colors duration-200"
                                    >
                                      <Link href={`/event/${event.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    {getEventStatus(event) === "archived" ? (
                                      <DropdownMenuItem
                                        className="hover:bg-gray-100 transition-colors duration-200"
                                        onClick={() =>
                                          handleUnarchiveEvent(event.id)
                                        }
                                        disabled={archivingId === event.id}
                                      >
                                        <Archive className="mr-2 h-4 w-4 rotate-180" />
                                        {archivingId === event.id
                                          ? "Unarchiving..."
                                          : "Unarchive"}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="hover:bg-gray-100 transition-colors duration-200"
                                        onClick={() =>
                                          handleArchiveEvent(event.id)
                                        }
                                        disabled={archivingId === event.id}
                                      >
                                        <Archive className="mr-2 h-4 w-4" />
                                        {archivingId === event.id
                                          ? "Archiving..."
                                          : "Archive"}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      asChild
                                      className="hover:bg-gray-100 transition-colors duration-200"
                                    >
                                      <Link href={`/event/${event.id}`}>
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
                    )
                  ) : (
                    <EventsEmptyState filtered={false} />
                  )}
                </div>

                {/* Activity Feed and Delight Sections */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 ${styles.animateFadeInUp}`}
                  style={{
                    animationDelay: "450ms",
                    animationFillMode: "forwards",
                  }}
                >
                  {/* Recent Campaign Activity */}
                  <ActivityFeed activities={activities} />

                  {/* Delight Engage */}
                  <DelightEngage />

                  {/* Delight Sense */}
                  <DelightSense />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
