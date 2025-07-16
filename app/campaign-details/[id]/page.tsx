/**
 * =====================================================
 * CAMPAIGN DETAILS PAGE
 * =====================================================
 * 
 * This is the main campaign management dashboard that provides comprehensive
 * campaign oversight, recipient management, and analytics capabilities.
 * 
 * KEY FEATURES:
 * - Campaign overview with key metrics and status tracking
 * - Recipient management with tabular view and individual timeline tracking
 * - Touchpoint analytics with engagement insights and journey visualization
 * - Gift assignment and delivery tracking
 * - Real-time status updates and notifications
 * - Export functionality for reporting
 * 
 * MAIN COMPONENTS USED:
 * - AnalyticsOverview: Provides campaign-wide analytics dashboard
 * - TouchpointTimeline: Shows individual recipient journey timelines
 * - Various UI components for tables, modals, and data visualization
 * 
 * DATA FLOW:
 * 1. Campaign data loaded from API based on campaign ID
 * 2. Recipients data transformed for analytics and table display
 * 3. Real-time updates through state management
 * 4. Export capabilities for PDF and CSV formats
 * 
 * TAB STRUCTURE:
 * - Recipients: Table view with individual timeline expansion
 * - Analytics: Campaign-wide analytics and insights dashboard
 * - Meeting: Calendar view for meeting scheduling (if applicable)
 * 
 * @author Delightloop Development Team
 * @version 2.0
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Users,
  Gift,
  CheckCircle,
  Clock,
  Share2,
  DollarSign,
  Search,
  Filter,
  AlertTriangle,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Square,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  X,
  MessageSquareText,
  BarChart,
  BarChart3,
  MessageSquare,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layouts/PageHeader";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import EventCardFinal from "@/components/create-campaign/event-card-final";
import { useAuth } from "@/app/context/AuthContext";
import { env } from "process";
import { EditableCardPreview } from "@/components/shared/EditableCardPreview";
import Image from "next/image";
import { createPortal } from "react-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CampaignPDF from "./CampaignPDF";
import { TouchpointAnalytics, TouchpointEvent, TouchpointType } from '../../../components/dashboard/TouchpointAnalytics';
import TouchpointTimeline from '../../../components/dashboard/TouchpointAnalytics';
import AnalyticsOverview from '../../../components/dashboard/AnalyticsOverview';
import { generateTemplateToken } from "@/utils/templateToken";
import TouchpointTimelineV2 from "@/components/dashboard/TouchPointTimeLineV2";
// =========================================================
// Skeleton Loading Styles
// =========================================================

// =========================================================
// Helper Functions
// =========================================================

/**
 * Format a campaign motion ID to its display name
 * @param motionId - The campaign motion ID to format
 * @returns Formatted display name
 */
const getCampaignMotionName = (motionId: string): string => {
  switch (motionId) {
    case "boost_registration":
      return "Boost Registration";
    case "ensure_attendance":
      return "Ensure Attendance";
    case "set_up_meeting":
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
      return motionId || ""; // Return original value or default if undefined
  }
};

/**
 * Format a timing value to its display name
 * @param timing - The timing value to format
 * @returns Formatted display name
 */
const formatEventTiming = (timing: string): string => {
  switch (timing) {
    case "pre":
      return "Pre-event";
    case "during":
      return "During Event";
    case "post":
      return "Post-event";
    default:
      return timing || "Pre-event"; // Return original value or default
  }
};

/**
 * Counter animation hook for animating number values
 * @param end - The final number to count to
 * @param duration - Animation duration in milliseconds
 * @param delay - Delay before animation starts in milliseconds
 * @returns The current count value during animation
 */
function useCountAnimation(
  end: number,
  duration: number = 1500,
  delay: number = 0
) {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animation frame callback
      const animateCount = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = timestamp - startTimeRef.current;
        const progressRatio = Math.min(progress / duration, 1);

        // Easing function for smoother animation
        const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
        countRef.current = Math.round(easeOutQuart * end);
        setCount(countRef.current);

        if (progressRatio < 1) {
          frameRef.current = requestAnimationFrame(animateCount);
        }
      };

      frameRef.current = requestAnimationFrame(animateCount);

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return count;
}

/**
 * Format a number as USD currency
 * @param value - Number to format as currency
 * @returns Formatted currency string with dollar sign
 */
function formatCurrency(value: number): string {
  return "$" + value.toLocaleString();
}

/**
 * =====================================================
 * DATA INTERFACES
 * =====================================================
 */

/**
 * Raw recipient data structure from the API
 * This interface represents the data as it comes from the backend,
 * including MongoDB ObjectId structures and date objects
 */
interface ApiRecipient {
  _id: string | { $oid: string };
  firstName: string;
  lastName: string;
  mailId: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  status: string;
  expectedDeliveryDate: string | null | { $date: string };
  deliveryDate: string | null | { $date: string };
  acknowledgedAt: string | null | { $date: string };
  assignedGiftId: string | { $oid: string };
  whyGift: string;
  shippingInfo?: {
    carrier?: string;
    trackingId?: string;
    trackingUrl?: string;
    deliveryNote?: string;
  };
  addressVerification?: {
    confirmationUrl: string;
    emailSentAt: { $date: string };
    verifiedAt: { $date: string } | null;
    sendCount: number;
  };
  feedback?: {
    question1?: string;
    reaction1?: string;
    question2?: string;
    reaction2?: string;
    textMessage?: {
      content?: string;
      timestamp?: string;
    };
    videoMessage?: {
      mediaUrl?: string;
      timestamp?: string;
      duration?: number;
    };
    audioMessage?: {
      mediaUrl?: string;
      timestamp?: string;
      duration?: number;
    };
    message?: {
      type?: string;
      content?: string;
      mediaUrl?: string;
      duration?: number;
      summary?: string;
      sentimentScore?: number;
    };
  };
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isVerified: boolean;
    confidenceScore: number | null;
  };
}

/**
 * Gift item interface
 * Represents a gift that can be assigned to recipients
 */
interface Gift {
  _id: string;
  name: string;
  price: number;
  primaryImgUrl: string;
  descShort: string;
}

/**
 * Processed recipient data structure
 * This is the cleaned and normalized version of ApiRecipient
 * used throughout the application for display and manipulation
 */
interface Recipient {
  _id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  assignedGiftId?: string;
  status: string;
  deliveryDetails?: {
    deliveredDate?: string;
    acknowledgedAt?: string;
    declinedDate?: string;
    estimatedDelivery?: string;
    issueDate?: string;
    trackingUrl?: string; // Added tracking URL
    trackingId?: string; // Added tracking ID
    carrier?: string; // Added carrier
  };
  addressVerification?: {
    confirmationUrl: string;
    emailSentAt: { $date: string };
    verifiedAt: { $date: string } | null;
    sendCount: number;
  };
  assignedGift?: Gift;
  feedback?: {
    question1?: string;
    reaction1?: string;
    question2?: string;
    reaction2?: string;
    textMessage?: {
      content?: string;
      timestamp?: string;
    };
    videoMessage?: {
      mediaUrl?: string;
      timestamp?: string;
      duration?: number;
    };
    audioMessage?: {
      mediaUrl?: string;
      timestamp?: string;
      duration?: number;
    };
    message?: {
      type?: string;
      content?: string;
      mediaUrl?: string;
      duration?: number;
      summary?: string;
      sentimentScore?: number;
    };
  };
}

/**
 * Landing page configuration interface
 * Defines the structure for customizable landing pages
 * Used for recipient experience customization
 */
interface LandingPageConfig {
  logo: {
    type: "upload" | "url";
    url: string;
  };
  background: {
    type: "solid" | "gradient";
    color: string;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: "to-r" | "to-br" | "to-b" | "to-bl";
  };
  content: {
    headline: string;
    headlineColor: string;
    description: string;
    descriptionColor: string;
  };
  media: {
    type: "image" | "video";
    imageUrl: string;
    videoUrl: string;
  };
  actionButtons: {
    primary: {
      enabled: boolean;
      text: string;
      color: string;
      url: string;
    };
    secondary: {
      enabled: boolean;
      text: string;
      color: string;
      url: string;
    };
  };
  date: {
    enabled: boolean;
    value: Date | string | undefined;
    color: string;
  };
}

/**
 * Main Campaign data structure
 * Contains all campaign-related information including recipients,
 * budget, settings, and customization options
 */
interface Campaign {
  _id: string;
  name: string;
  title: string;
  description: string;
  status: string; // 'draft', 'ready_for_launch', 'active', 'completed', etc.
  motion: string; // Campaign type/strategy
  launchDate: string;
  createdBy: string;
  organization_id: string;
  createdAt: string;
  updatedAt: string;
  creatorUserId: string;
  recipientSummary: {
    new: number;      // Count of new recipients
    existing: number; // Count of existing recipients
    total: number;    // Total recipient count
  };
  stats: {
    engagementRate: string;    // Percentage as string
    conversionRate: string;    // Percentage as string
    totalConversions: number;  // Actual conversion count
  };
  recipients: Recipient[];                    // Array of all recipients
  tags?: Array<{ id: string; name: string; color: string }>; // Optional campaign tags
  outcomeCard?: {                            // Post-delivery experience card
    description: string;
    buttonText: string;
    logoLink: string;
    type: string;
    videoLink?: string;
  };
  outcomeTemplate?: {                        // Template for outcome experiences
    description: string;
    buttonText: string;
    logoLink: string;
    type: string;
    videoLink?: string;
  };
  landingPageConfig?: LandingPageConfig;     // Custom landing page settings
  budget: {
    totalBudget: number;  // Total budget allocated
    maxPerGift: number;   // Maximum cost per individual gift
    currency: string;     // Currency code (e.g., "USD")
    spent: number;        // Amount already spent
  };
  giftSelectionMode: string;                 // 'manual', 'auto', etc.
  goal: string;                              // Campaign objective
  total_recipients: number;                  // Total recipient count (duplicate of recipientSummary.total)
  emailTemplate: {                           // Email templates for different stages
    addressConfirmedEmail: string;
    inTransitEmail: string;
    deliveredEmail: string;
    acknowledgedEmail: string;
  };
}

/**
 * Event data structure for event-based campaigns
 * Contains detailed information about associated events
 */
interface Event {
  event: {
    _id: string;
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
      eventLogo?: string;
      banner?: string;
    };
    eventHashtag: string;
    campaignIds: string[];
    creatorUserId: string;
    organizationId: string;
  };
}

// Helper function to format dates consistently as "Apr 17, 2025"
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-"; // Invalid date

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

// Format timestamp for feedback messages
const formatTimestamp = (timestamp?: string | null): string => {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ""; // Invalid date

    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
};

// Format full date and time for analytics
const formatFullDateTime = (timestamp?: string | null): string => {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ""; // Invalid date

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting full date time:", error);
    return "";
  }
};

// Utility function to transform recipients into touchpoint analytics
/**
 * =====================================================
 * DATA TRANSFORMATION FUNCTIONS
 * =====================================================
 */

/**
 * Transforms recipient data into touchpoint analytics format
 * 
 * This is a CRITICAL function that converts raw recipient data into
 * the structured format required by the analytics components.
 * 
 * TRANSFORMATION PROCESS:
 * 1. Maps each recipient to TouchpointAnalytics interface
 * 2. Generates touchpoint events based on recipient status and data
 * 3. Calculates engagement scores and current stage
 * 4. Creates timeline events for visualization
 * 
 * GENERATED TOUCHPOINT EVENTS:
 * - invite_sent: When campaign was launched
 * - address_confirmed: When recipient verified their address
 * - gift_sent: When gift shipping was initiated
 * - gift_in_transit: During shipping process
 * - gift_delivered: When gift reached recipient
 * - feedback_submitted: When recipient provided feedback
 * 
 * @param recipients - Array of processed recipient data
 * @returns Array of TouchpointAnalytics objects for analytics visualization
 */
const transformRecipientsToTouchpointAnalytics = (recipients: Recipient[]): TouchpointAnalytics[] => {
  return recipients.map(recipient => {
    const events: TouchpointEvent[] = [];
    let eventIdCounter = 1;
    let fallbackGiftSelectedTimestamp = new Date().toISOString();

    // Add events based on available recipient data
    if (recipient.addressVerification?.emailSentAt) {
      const emailSentTimestamp = typeof recipient.addressVerification.emailSentAt === 'string'
        ? recipient.addressVerification.emailSentAt
        : recipient.addressVerification.emailSentAt.$date;

      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'invite_sent',
        timestamp: emailSentTimestamp,
        data: {
          recipientEmail: recipient.email,
          inviteType: 'address_confirmation'
        }
      });
    }

    if (recipient.assignedGift) {
      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'gift_selected',
        timestamp: (() => {
          if (recipient.addressVerification?.emailSentAt) {
            const emailSentTimestamp = typeof recipient.addressVerification.emailSentAt === 'string'
              ? recipient.addressVerification.emailSentAt
              : recipient.addressVerification.emailSentAt.$date;

            const baseDate = new Date(emailSentTimestamp);
            if (!isNaN(baseDate.getTime())) {
              return new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
            }
          }
          return new Date().toISOString();
        })(),
        data: {
          giftName: recipient.assignedGift.name,
          giftPrice: recipient.assignedGift.price
        }
      });
    }

    if (recipient.addressVerification?.verifiedAt) {
      const verifiedAtTimestamp = typeof recipient.addressVerification.verifiedAt === 'string'
        ? recipient.addressVerification.verifiedAt
        : recipient.addressVerification.verifiedAt.$date;

      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'address_confirmed',
        timestamp: verifiedAtTimestamp,
        data: {
          address: 'Address verified',
          verificationMethod: 'email'
        }
      });
    }

    if (recipient.deliveryDetails?.deliveredDate) {
      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'gift_delivered',
        timestamp: recipient.deliveryDetails.deliveredDate,
        data: {
          carrier: recipient.deliveryDetails.carrier || 'Unknown',
          trackingId: recipient.deliveryDetails.trackingId
        }
      });
    }

    if (recipient.deliveryDetails?.acknowledgedAt) {
      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'landing_page_accessed',
        timestamp: recipient.deliveryDetails.acknowledgedAt,
        data: {
          acknowledged: true,
          accessType: 'gift_acknowledgment'
        }
      });
    }

    if (recipient.feedback?.message) {
      events.push({
        id: `event_${eventIdCounter++}`,
        type: 'feedback_submitted',
        timestamp: new Date().toISOString(), // Use current timestamp as fallback
        data: {
          feedbackType: recipient.feedback.message.type || 'text',
          hasMedia: !!recipient.feedback.message.mediaUrl,
          sentimentScore: recipient.feedback.message.sentimentScore
        }
      });
    }

    // Calculate engagement score based on interactions
    const engagementScore = Math.min(
      Math.round((events.length * 20) + (recipient.feedback ? 30 : 0)),
      100
    );

    // Determine current stage based on status
    const getCurrentStage = (status: string): string => {
      switch (status.toLowerCase()) {
        case 'invitationsend':
        case 'invitation_sent':
          return 'Invitation Sent';
        case 'awaitingaddressconfirmation':
        case 'awaiting address confirmation':
          return 'Awaiting Address';
        case 'orderplaced':
          return 'Order Placed';
        case 'intransit':
        case 'in-transit':
          return 'In Transit';
        case 'delivered':
          return 'Delivered';
        case 'acknowledged':
          return 'Acknowledged';
        default:
          return 'Pending';
      }
    };

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      recipientId: recipient._id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      events,
      summary: {
        totalInteractions: events.length,
        firstInteraction: events.length > 0 ? events[0].timestamp : undefined,
        lastInteraction: events.length > 0 ? events[events.length - 1].timestamp : undefined,
        engagementScore,
        currentStage: getCurrentStage(recipient.status)
      }
    };
  });
};

// Dynamic text replacement function
const renderDynamicText = (text: string) => {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
    const sampleData: Record<string, string> = {
      "first-name": "Sarah",
      "last-name": "Johnson",
      company: "Acme Corp",
      "gift-name": "Premium Package",
      "First Name": "Sarah",
      "Last Name": "Johnson",
      Company: "Acme Corp",
      "Event Name": "Tech Summit 2025",
    };
    return sampleData[field] || sampleData[field.toLowerCase()] || `[${field}]`;
  });
};

// Get background style based on configuration
const getBackgroundStyle = (landingPageConfig?: LandingPageConfig) => {
  if (!landingPageConfig) return { backgroundColor: "#FFFFFF" };

  if (landingPageConfig.background.type === "gradient") {
    const direction = landingPageConfig.background.gradientDirection || "to-br";
    return {
      background: `linear-gradient(${direction === "to-r"
        ? "to right"
        : direction === "to-br"
          ? "to bottom right"
          : direction === "to-b"
            ? "to bottom"
            : "to bottom left"
        }, ${landingPageConfig.background.gradientFrom || "#7C3AED"}, ${landingPageConfig.background.gradientTo || "#A855F7"
        })`,
    };
  }
  return { backgroundColor: landingPageConfig.background.color };
};

// Video player component for handling embedded videos
const VideoPlayer = ({
  url,
  className,
}: {
  url: string;
  className?: string;
}) => {
  const extractVideoContent = (url: string) => {
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("watch?v=")
          ? url.split("watch?v=")[1].split("&")[0]
          : url.split("youtu.be/")[1].split("?")[0];
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          type: "iframe" as const,
        };
      }
      if (url.includes("vimeo.com")) {
        const videoId = url.split("vimeo.com/")[1].split("?")[0];
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          type: "iframe" as const,
        };
      }
      if (url.includes("dailymotion.com") || url.includes("dai.ly")) {
        const videoId = url.includes("dai.ly/")
          ? url.split("dai.ly/")[1].split("?")[0]
          : url.split("dailymotion.com/video/")[1].split("_")[0];
        return {
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
          type: "iframe" as const,
        };
      }
      // For other URLs, try to use as direct video
      return { embedUrl: url, type: "video" as const };
    } catch {
      return null;
    }
  };

  const videoContent = extractVideoContent(url);

  if (!videoContent) {
    return (
      <div
        className={`bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white">
          <svg
            className="mx-auto mb-2 w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12l4-4h9a2 2 0 002-2z"
            />
          </svg>
          <p className="text-sm">Video Player</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {videoContent.type === "iframe" ? (
        <iframe
          src={videoContent.embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      ) : (
        <video
          src={videoContent.embedUrl}
          controls
          className="w-full h-full object-cover"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

// =========================================================
// Meeting Calendar Component
// =========================================================

interface MeetingHost {
  hostId: string;
  hostInfo: {
    name: string;
    email: string;
    role: string;
    linkedinUrl: string;
    timezone: string;
  };
  schedule: Array<{
    date: string; // "2025-06-12"
    slots: Array<{
      slotId: string;
      startTime: string; // "09:00"
      endTime: string; // "10:00"
      isBooked: boolean;
      recipientId?: string;
      bookedAt?: string;
    }>;
  }>;
  preferences: {
    slotDuration: number;
    isActive: boolean;
  };
}

interface MeetingCalendarProps {
  campaign: Campaign;
}

function MeetingCalendar({ campaign }: MeetingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHostFilter, setSelectedHostFilter] = useState<string>("all");

  // Extract meeting hosts from campaign data with robust checking
  const extractMeetingHosts = (): MeetingHost[] => {
    console.log("Raw campaign data:", campaign);
    console.log("Campaign meetingHosts:", (campaign as any)?.meetingHosts);

    // Try multiple ways to access the meetingHosts data
    let hosts = (campaign as any)?.meetingHosts || [];

    // If hosts is empty, try other possible locations
    if (!hosts || hosts.length === 0) {
      hosts = (campaign as any)?.meeting_hosts || [];
    }
    if (!hosts || hosts.length === 0) {
      hosts = (campaign as any)?.meetingData?.hosts || [];
    }

    console.log("Extracted hosts:", hosts);
    console.log("Number of hosts found:", hosts?.length || 0);

    return hosts || [];
  };

  const meetingHosts: MeetingHost[] = extractMeetingHosts();

  // Get all unique dates that have scheduled meetings
  const getScheduledDates = (): string[] => {
    const dates = new Set<string>();
    console.log("Processing hosts for dates:", meetingHosts);

    const hostsToCheck =
      selectedHostFilter === "all"
        ? meetingHosts
        : meetingHosts.filter((host) => host.hostId === selectedHostFilter);

    hostsToCheck.forEach((host, hostIndex) => {
      console.log(`Host ${hostIndex}:`, host);
      console.log(`Host ${hostIndex} schedule:`, host.schedule);

      host.schedule?.forEach((scheduleItem, scheduleIndex) => {
        console.log(
          `Host ${hostIndex}, Schedule ${scheduleIndex}:`,
          scheduleItem
        );
        if (scheduleItem.slots && scheduleItem.slots.length > 0) {
          console.log(
            `Adding date: ${scheduleItem.date} with ${scheduleItem.slots.length} slots`
          );
          dates.add(scheduleItem.date);
        }
      });
    });

    const sortedDates = Array.from(dates).sort();
    console.log("Final scheduled dates:", sortedDates);
    return sortedDates;
  };

  const scheduledDates = getScheduledDates();

  // Calculate meeting statistics
  const getMeetingStats = () => {
    const hostsToCheck =
      selectedHostFilter === "all"
        ? meetingHosts
        : meetingHosts.filter((host) => host.hostId === selectedHostFilter);

    let totalSlots = 0;
    let bookedSlots = 0;

    hostsToCheck.forEach((host) => {
      host.schedule?.forEach((scheduleItem) => {
        if (scheduleItem.slots) {
          totalSlots += scheduleItem.slots.length;
          bookedSlots += scheduleItem.slots.filter(
            (slot) => slot.isBooked
          ).length;
        }
      });
    });

    return {
      totalHosts: hostsToCheck.length,
      totalSlots,
      bookedSlots,
      availableSlots: totalSlots - bookedSlots,
    };
  };

  const meetingStats = getMeetingStats();

  // Set initial current date to the first month that has meetings, or current date if no meetings
  const getInitialDate = (): Date => {
    if (scheduledDates.length > 0) {
      // Use the first scheduled date to determine the initial month to show
      const firstMeetingDate = new Date(scheduledDates[0] + "T00:00:00");
      console.log("Setting initial date to:", firstMeetingDate);
      return firstMeetingDate;
    }
    console.log("No scheduled dates, using current date");
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(() => getInitialDate());

  // Debug logging
  console.log("===== MEETING CALENDAR DEBUG =====");
  console.log("Meeting hosts:", meetingHosts);
  console.log("Scheduled dates:", scheduledDates);
  console.log("Current date:", currentDate);
  console.log("Total hosts:", meetingHosts.length);
  console.log("Total dates with meetings:", scheduledDates.length);
  console.log("==================================");

  // Generate calendar days for the current month
  const generateCalendarDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }

    return days;
  };

  // Check if a date has meetings
  const hasScheduledMeetings = (date: Date): boolean => {
    const dateString = date.toISOString().split("T")[0]; // "2025-06-12"
    return getScheduledDates().includes(dateString);
  };

  // Get meetings for a specific date
  const getMeetingsForDate = (dateString: string) => {
    const meetings: Array<{
      host: MeetingHost;
      slot: any;
    }> = [];

    const hostsToCheck =
      selectedHostFilter === "all"
        ? meetingHosts
        : meetingHosts.filter((host) => host.hostId === selectedHostFilter);

    hostsToCheck.forEach((host) => {
      const scheduleForDate = host.schedule?.find((s) => s.date === dateString);
      if (scheduleForDate && scheduleForDate.slots) {
        scheduleForDate.slots.forEach((slot) => {
          meetings.push({ host, slot });
        });
      }
    });

    return meetings.sort((a, b) =>
      a.slot.startTime.localeCompare(b.slot.startTime)
    );
  };

  // Get all unique months that have meetings
  const getMonthsWithMeetings = (): string[] => {
    const months = new Set<string>();
    scheduledDates.forEach((date) => {
      const dateObj = new Date(date + "T00:00:00");
      const monthKey = `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}`;
      months.add(monthKey);
    });
    return Array.from(months).sort();
  };

  const monthsWithMeetings = getMonthsWithMeetings();

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Format time for display
  const formatTime = (time: string): string => {
    return time; // Already in "09:00" format
  };

  // Get recipient info if slot is booked
  const getRecipientInfo = (recipientId?: string) => {
    if (!recipientId) return null;
    return campaign.recipients?.find((r) => r._id === recipientId);
  };

  const calendarDays = generateCalendarDays(currentDate);
  const selectedDateMeetings = selectedDate
    ? getMeetingsForDate(selectedDate)
    : [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Summary at bottom */}
      <div className="p-6 border-b border-gray-200">
        {scheduledDates.length === 0 ? (
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">No meeting slots have been scheduled yet.</p>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Meeting Summary
              {selectedHostFilter !== "all" && (
                <span className="text-xs text-gray-500 ml-2">
                  (Filtered by:{" "}
                  {
                    meetingHosts.find((h) => h.hostId === selectedHostFilter)
                      ?.hostInfo.name
                  }
                  )
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-900">Total Hosts</div>
                <div className="text-2xl font-bold text-blue-700">
                  {meetingStats.totalHosts}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-900">Total Slots</div>
                <div className="text-2xl font-bold text-purple-700">
                  {meetingStats.totalSlots}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-medium text-orange-900">Booked Slots</div>
                <div className="text-2xl font-bold text-orange-700">
                  {meetingStats.bookedSlots}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">
                  Available Slots
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {meetingStats.availableSlots}
                </div>
              </div>
            </div>

            {/* Quick overview of all dates */}
            {/* <div className="mt-4">
              <div className="text-xs font-medium text-gray-700 mb-2">
                All Available Dates:
              </div>
              <div className="flex flex-wrap gap-2">
                {scheduledDates.map((date) => {
                  const slotCount = getMeetingsForDate(date).length;
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        const selectedDate = new Date(date + "T00:00:00");
                        setCurrentDate(selectedDate);
                        setSelectedDate(date);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                    >
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}{" "}
                      ({slotCount})
                    </button>
                  );
                })}
              </div>
            </div> */}
          </div>
        )}
      </div>
      {/* Calendar Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {scheduledDates.length} meeting
              {scheduledDates.length !== 1 ? "s" : ""} scheduled
            </div>

            {/* Host Filter */}
            {meetingHosts.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Host:</span>
                <select
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  value={selectedHostFilter}
                  onChange={(e) => {
                    setSelectedHostFilter(e.target.value);
                    setSelectedDate(null); // Reset selected date when changing host filter
                  }}
                >
                  <option value="all">All Hosts</option>
                  {meetingHosts.map((host) => (
                    <option key={host.hostId} value={host.hostId}>
                      {host.hostInfo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick navigation to months with meetings */}
            {scheduledDates.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Months:</span>
                <select
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split("-");
                      const newDate = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        1
                      );
                      setCurrentDate(newDate);
                    }
                  }}
                  value={`${currentDate.getFullYear()}-${String(
                    currentDate.getMonth() + 1
                  ).padStart(2, "0")}`}
                >
                  {monthsWithMeetings.map((monthKey) => {
                    const [year, month] = monthKey.split("-");
                    const monthName = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      1
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <option key={monthKey} value={monthKey}>
                        {monthName}
                      </option>
                    );
                  })}
                </select>
                <span className="text-xs text-gray-500">|</span>
                <select
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedDate = new Date(
                        e.target.value + "T00:00:00"
                      );
                      setCurrentDate(selectedDate);
                      setSelectedDate(e.target.value);
                    }
                  }}
                  value={selectedDate || ""}
                >
                  <option value="">Select specific date</option>
                  {scheduledDates.map((date) => {
                    const dateObj = new Date(date + "T00:00:00");
                    const meetingsForDate = getMeetingsForDate(date);
                    return (
                      <option key={date} value={date}>
                        {dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        ({meetingsForDate.length} slot
                        {meetingsForDate.length !== 1 ? "s" : ""})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-fit  border-b ">
        {/* Calendar Grid */}
        <div className="flex-1 p-6 h-fit">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-3 ">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const dateString = date.toISOString().split("T")[0];
              const isSelected = selectedDate === dateString;
              const hasMeetings = hasScheduledMeetings(date);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateString)}
                  disabled={!hasMeetings}
                  className={`
                    relative h-16 w-full rounded-md text-sm transition-colors
                    ${!isCurrentMonth ? "text-gray-300" : ""}
                    ${isCurrentMonth && !hasMeetings
                      ? "text-gray-400 cursor-not-allowed"
                      : ""
                    }
                    ${isToday && isCurrentMonth
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : ""
                    }
                    ${isSelected ? "bg-primary text-white" : ""}
                    ${hasMeetings && !isSelected && isCurrentMonth
                      ? "bg-green-50 text-green-700 font-medium hover:bg-green-100"
                      : ""
                    }
                    ${hasMeetings && isCurrentMonth && !isSelected
                      ? "hover:bg-green-100"
                      : ""
                    }
                  `}
                >
                  {date.getDate()}
                  {hasMeetings && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-green-500"
                          }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Has meetings</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Meeting Details Panel */}
        {selectedDate && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 max-h-[600px] overflow-y-auto">
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </h4>

              {selectedDateMeetings.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateMeetings.map((meeting, index) => (
                    <div
                      key={`${meeting.host.hostId}-${meeting.slot.slotId}`}
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                    >
                      {/* Time and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${meeting.slot.isBooked
                              ? "bg-primary"
                              : "bg-green-500"
                              }`}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {formatTime(meeting.slot.startTime)} -{" "}
                            {formatTime(meeting.slot.endTime)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${meeting.slot.isBooked
                            ? "bg-primary-xlight text-primary-dark"
                            : "bg-green-100 text-green-700"
                            }`}
                        >
                          {meeting.slot.isBooked ? "Booked" : "Available"}
                        </span>
                      </div>

                      {/* Host Information */}
                      <div className="mb-3 p-3 bg-gray-50 rounded-md">
                        <div className="text-xs text-gray-500 mb-1">Host</div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {meeting.host.hostInfo.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {meeting.host.hostInfo.email}
                          </div>
                          <div className="text-xs text-gray-600">
                            {meeting.host.hostInfo.role}
                          </div>
                          <div className="text-xs text-gray-500">
                            Timezone: {meeting.host.hostInfo.timezone}
                          </div>
                          {meeting.host.hostInfo.linkedinUrl && (
                            <a
                              href={meeting.host.hostInfo.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              LinkedIn Profile
                              <svg
                                className="w-3 h-3 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Recipient Information (if booked) */}
                      {meeting.slot.isBooked && meeting.slot.recipientId && (
                        <div className="p-3 bg-primary-xlight rounded-md">
                          <div className="text-xs text-primary/80 mb-1">
                            Booked by
                          </div>
                          {(() => {
                            const recipient = getRecipientInfo(
                              meeting.slot.recipientId
                            );
                            return recipient ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-primary">
                                  {recipient.name}
                                </div>
                                <div className="text-xs text-primary/90">
                                  {recipient.email}
                                </div>
                                <div className="text-xs text-primary/80">
                                  {recipient.company} • {recipient.title}
                                </div>
                                {/* {meeting.slot.bookedAt && (
                                  <div className="text-xs text-blue-600">
                                    Booked:{" "}
                                    {new Date(
                                      meeting.slot.bookedAt
                                    ).toLocaleDateString()}
                                  </div>
                                )} */}
                              </div>
                            ) : (
                              <div className="text-xs text-blue-700">
                                Recipient ID: {meeting.slot.recipientId}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Slot Details */}
                      {/* <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Slot ID: {meeting.slot.slotId}</div>
                          <div>
                            Recipient ID:{" "}
                            {meeting.slot.recipientId || "Not assigned"}
                          </div>
                        </div>
                      </div> */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    No meetings scheduled for this date
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * =====================================================
 * MAIN CAMPAIGN DETAILS COMPONENT
 * =====================================================
 * 
 * The primary component for campaign management and analytics.
 * This component serves as the central dashboard for campaign oversight,
 * providing comprehensive recipient management and touchpoint analytics.
 * 
 * COMPONENT ARCHITECTURE:
 * - Multi-tab interface (Recipients, Analytics, Meeting)
 * - Real-time data loading and state management
 * - Integrated analytics with TouchpointTimeline and AnalyticsOverview
 * - Advanced filtering, search, and pagination
 * - Export capabilities for reporting
 * 
 * KEY FEATURES:
 * 1. Recipients Tab:
 *    - Tabular view of all campaign recipients
 *    - Individual timeline expansion with TouchpointTimeline component
 *    - Status tracking and gift assignment
 *    - Bulk operations and filtering
 * 
 * 2. Analytics Tab:
 *    - Campaign-wide analytics dashboard using AnalyticsOverview component
 *    - Engagement metrics and distribution analysis
 *    - Visual timeline representations
 *    - Export functionality
 * 
 * 3. Meeting Tab (event campaigns):
 *    - Calendar view for meeting scheduling
 *    - Host management and availability
 *    - Booking tracking
 * 
 * DATA FLOW:
 * 1. Component loads campaign data from API (/api/campaigns/{id})
 * 2. Recipients data loaded and transformed using transformRecipientsToTouchpointAnalytics
 * 3. State managed through React hooks with real-time updates
 * 4. Analytics components receive transformed data for visualization
 * 
 * TOUCHPOINT ANALYTICS INTEGRATION:
 * - Raw recipient data transformed into TouchpointAnalytics format
 * - Individual timelines shown in expanded table rows (compact mode)
 * - Campaign-wide analytics displayed in dedicated Analytics tab
 * 
 * @param params - Contains campaign ID from URL route
 */
export default function CampaignDetails({
  params,
}: {
  params: { id: string };
}) {
  /**
   * =====================================================
   * STATE MANAGEMENT
   * =====================================================
   * 
   * Comprehensive state management for campaign data,
   * UI interactions, and real-time updates
   */

  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [giftsMap, setGiftsMap] = useState<Map<string, Gift>>(new Map());
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [allGiftsModalOpen, setAllGiftsModalOpen] = useState<boolean>(false);
  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [giftCostModalOpen, setGiftCostModalOpen] = useState(false);
  const [handleLaunchCampaignLoading, setHandleLaunchCampaignLoading] =
    useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("recipients");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["all"]);
  // Add new state for status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  // Engagement filter state
  const [selectedEngagementFilters, setSelectedEngagementFilters] = useState<string[]>(["all"]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Sample message and template data for recipient experience tab
  const [message, setMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const templateOptions = [
    {
      id: "template_modern",
      name: "Modern",
      description: "Clean and professional design",
      selected: true,
    },
    {
      id: "template_elegant",
      name: "Elegant",
      description: "Sophisticated and classy",
      selected: false,
    },
    {
      id: "template_playful",
      name: "Playful",
      description: "Fun and colorful design",
      selected: false,
    },
  ];

  // Stats for animated counters
  const [stats, setStats] = useState({
    recipients: 0,
    giftsSent: 0,
    delivered: 0,
    acknowledged: 0,
    pending: 0,
    totalBudget: 0,
    feedbackCount: 0, // Add feedback count to stats
  });

  // Animated counter values
  const recipientsCount = useCountAnimation(stats.recipients, 1500, 400);
  const giftsSentCount = useCountAnimation(stats.giftsSent, 1500, 500);
  const deliveredCount = useCountAnimation(stats.delivered, 1500, 550);
  const acknowledgedCount = useCountAnimation(stats.acknowledged, 1500, 600);
  const pendingCount = useCountAnimation(stats.pending, 1500, 700);
  const budgetCount = useCountAnimation(stats.totalBudget, 2000, 800);
  const feedbackCount = useCountAnimation(stats.feedbackCount, 1500, 900); // Add feedback count animation

  // State for action menu
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState<string | null>(null);

  // State for expanded recipient timelines
  const [expandedTimelines, setExpandedTimelines] = useState<Set<string>>(new Set());
  const [timelineData, setTimelineData] = useState<Record<string, any[]>>({});
  const [loadingTimelines, setLoadingTimelines] = useState<Set<string>>(new Set());
  
  // State for engagement scores
  const [engagementScores, setEngagementScores] = useState<Record<string, number>>({});
console.log("Engagement scores state initialized:", engagementScores);
  // useRef for handling click outside of dropdown
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Add these new state variables inside your component
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Add to the state management section after showCopySuccess state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<{
    name: string;
    reaction?: string;
    reactionTimestamp?: string;
    message?: string;
    textMessage?: string;
    textMessageTimestamp?: string;
    videoMessage?: string;
    videoMessageTimestamp?: string;
    audioMessage?: string;
    audioMessageTimestamp?: string;
    legacyMessage?: any;
  } | null>(null);

  // Add this effect to create a portal container when the component mounts
  useEffect(() => {
    const portalEl = document.createElement("div");
    portalEl.id = "action-menu-portal";
    portalEl.style.position = "absolute";
    portalEl.style.top = "0";
    portalEl.style.left = "0";
    portalEl.style.width = "100%";
    portalEl.style.height = "100%";
    portalEl.style.pointerEvents = "none";
    portalEl.style.zIndex = "50";
    document.body.appendChild(portalEl);
    setPortalContainer(portalEl);

    return () => {
      if (document.body.contains(portalEl)) {
        document.body.removeChild(portalEl);
      }
    };
  }, []);

  // Replace the existing handleClickOutside function
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If action menu is not open, do nothing
      if (!actionMenuOpen) return;

      // Check if the click was inside any action menu
      const clickedInsideMenu = document
        .querySelector(".action-menu-dropdown")
        ?.contains(event.target as Node);

      // Check if the click was on an action button
      const clickedOnButton = actionButtonRefs.current[
        actionMenuOpen
      ]?.contains(event.target as Node);

      // Check if clicked on a copy button inside the menu
      const clickedOnCopyButton = (event.target as HTMLElement)?.closest('button')?.textContent?.includes('Copy');

      if (!clickedInsideMenu && !clickedOnButton && !clickedOnCopyButton) {
        setActionMenuOpen(null);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [actionMenuOpen]);

  // Create a new function to position the menu
  const getMenuPosition = (recipientId: string) => {
    if (!actionButtonRefs.current[recipientId]) return { direction: "down", left: 0, top: 0 };

    const button = actionButtonRefs.current[recipientId];
    const rect = button?.getBoundingClientRect();

    if (!rect) return { direction: "down", left: 0, top: 0 };

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Open upward if there's not enough space below
    const direction = spaceBelow < 150 && spaceAbove > 150 ? "up" : "down";

    // Calculate position relative to the button
    const left = rect.left + window.scrollX;
    const top = direction === "up" ? rect.top + window.scrollY : rect.bottom + window.scrollY;

    return {
      direction,
      left,
      top,
    };
  };

  // =========================================================
  // Action Menu Logic Functions
  // =========================================================

  // Determine menu content based on recipient status
  const getMenuContent = (recipient: Recipient) => {
    const status = recipient.status;
    const baseUrl = window.location.origin;

    if (status === "InvitationSend" || status === "AwaitingGiftSelection" || status === "AwaitingAddressConfirmation") {
      // Generate encrypted token with recipient and campaign data
      const token = generateTemplateToken({
        recipient_id: recipient._id,
        campaign_id: campaign?._id || "",
        playbook_id: campaign?._id || "", // Using campaign ID as fallback
        playbook_run_id: campaign?._id || "" // Using campaign ID as fallback
      });

      // URL encode the token to ensure safe transmission
      const encodedToken = encodeURIComponent(token);
      const url = baseUrl + "/experience/claim?token=" + encodedToken;

      return {
        type: "confirmation" as const,
        label: "Copy Address Confirmation URL",
        url: url,
        icon: "copy" as const
      };
    } else if (status === "OrderPlaced" || status === "InTransit") {
      const url = baseUrl + "/public/gift-tracker/" + recipient._id;
      return {
        type: "tracking" as const,
        label: "Copy Tracking URL",
        url: url,
        icon: "copy" as const
      };
    } else {
      return {
        type: "empty" as const,
        label: "No actions available",
        url: "",
        icon: "info" as const
      };
    }
  };
  const handleToggleTimeline = async (recipientId: string) => {
    const newExpanded = new Set(expandedTimelines);

    if (newExpanded.has(recipientId)) {
      newExpanded.delete(recipientId);
      setExpandedTimelines(newExpanded);
    } else {
      newExpanded.add(recipientId);
      setExpandedTimelines(newExpanded);
      
      // If timeline data doesn't exist, fetch it
      if (!timelineData[recipientId]) {
        setLoadingTimelines(prev => new Set(prev).add(recipientId));
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipient-timeline?recipientId=${recipientId}&campaignId=${campaign?._id}`;
          const response = await fetch(apiUrl, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch recipient timeline');
          }
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setTimelineData(prev => ({
              ...prev,
              [recipientId]: result.data,
            }));
            
            // Update engagement score if available in the response
            if (result.summary?.engagementScore !== undefined) {
              setEngagementScores(prev => ({
                ...prev,
                [recipientId]: result.summary.engagementScore
              }));
            }
          } else {
            setTimelineData(prev => ({ ...prev, [recipientId]: [] }));
          }

        } catch (error) {
          console.log("Error fetching recipient timeline:", error);
          setTimelineData(prev => ({ ...prev, [recipientId]: [] }));
        } finally {
          // Always remove the recipient from the loading set
          setLoadingTimelines(prev => {
            const newLoading = new Set(prev);
            newLoading.delete(recipientId);
            return newLoading;
          });
        }
      }
    }
  };


  // =========================================================
  // Data Fetching
  // =========================================================

  useEffect(() => {
    if (!isLoadingCookies) {
      // Fetch campaign data by ID from the API
      const loadCampaign = async () => {
        setIsLoading(true);
        try {
          const pathParts = window.location.pathname.split("/");
          const campaignId = pathParts[pathParts.length - 1];
          console.log("Campaign ID from URL:", campaignId);

          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`;
          const token = authToken;

          const response = await fetch(apiUrl, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 404) {
              setNotFound(true);
              setError("Campaign not found");
            } else {
              throw new Error(`API error: ${response.status}`);
            }
            return;
          }

          const data = await response.json();
          console.log("Campaign data:", data);
          setCampaign(data.campaign);
          console.log("Campaign:", campaign);

          // Process the campaign data
          const processedCampaign: Campaign = {
            _id: data.campaign._id || data.campaign.id,
            name: data.campaign.name || "",
            title: data.campaign.title || data.campaign.name || "",
            description: data.campaign.description || "",
            status: data.campaign.status || "draft",
            motion: data.campaign.motion,
            launchDate: data.campaign.launchDate || data.campaign.createdAt,
            createdBy: data.campaign.createdBy || "",
            organization_id: data.campaign.organization_id || organizationId,
            createdAt: data.campaign.createdAt || "",
            updatedAt: data.campaign.updatedAt || "",
            creatorUserId: data.campaign.creatorUserId || "",
            recipientSummary: {
              new: Math.round(stats.recipients * 1),
              existing: Math.round(stats.recipients * 0),
              total: stats.recipients,
            },
            stats: {
              engagementRate: data.stats?.engagementRate || "0%",
              conversionRate: data.stats?.conversionRate || "0%",
              totalConversions: data.stats?.totalConversions || 0,
            },
            recipients: [], // Will be populated later
            tags: data.tags || [],
            outcomeCard: data.campaign.outcomeCard || null,
            outcomeTemplate: data.campaign.outcomeTemplate || null,
            landingPageConfig: data.campaign.landingPageConfig || undefined,
            budget: {
              totalBudget: data.campaign.budget?.totalBudget || 0,
              maxPerGift: data.campaign.budget?.maxPerGift || 0,
              currency: data.campaign.budget?.currency || "USD",
              spent: data.campaign.budget?.spent || 0,
            },
            giftSelectionMode: data.campaign.giftSelectionMode || "",
            goal: data.campaign.goal || "",
            total_recipients: data.campaign.total_recipients || 0,
            emailTemplate: data.campaign.emailTemplate || {
              addressConfirmedEmail: "",
              inTransitEmail: "",
              deliveredEmail: "",
              acknowledgedEmail: "",
            },
            // Add meetingHosts data for meeting campaigns
            ...(data.campaign.meetingHosts && {
              meetingHosts: data.campaign.meetingHosts,
            }),
          };

          console.log("Raw API campaign data:", data.campaign);
          console.log("Processed campaign:", processedCampaign);
          console.log("MeetingHosts in raw data:", data.campaign.meetingHosts);
          console.log(
            "MeetingHosts in processed data:",
            (processedCampaign as any).meetingHosts
          );

          console.log("Campaign budget new:", data.campaign.budget);

          console.log("Processed campaign:", processedCampaign);

          setCampaign(processedCampaign);

          // Check if the campaign has an eventId and fetch event details if it does
          if (data.campaign.eventId) {
            await loadEventDetails(data.campaign.eventId);
          }

          // After campaign is loaded, fetch the recipients
          const campaignBudget = data.campaign?.budget?.totalBudget || 0;
          console.log(
            "Passing campaign budget to loadRecipients:",
            campaignBudget
          );
          await loadRecipients(campaignId, campaignBudget);

          setMessage(data.message || "");
          setCustomMessage(data.campaign.outcomeCard?.message || "");
          setLogoUrl(data.campaign.outcomeCard?.logoLink || "");
        } catch (err) {
          console.error("Error fetching campaign data:", err);
          setError("Failed to load campaign data");
        } finally {
          setIsLoading(false);
        }
      };

      // Fetch event details
      const loadEventDetails = async (eventId: string) => {
        try {
          const eventUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/events/${eventId}`;
          const token = authToken;

          console.log("Fetching event details from:", eventUrl);

          const response = await fetch(eventUrl, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error(`Error fetching event details: ${response.status}`);
            return;
          }

          const eventData = await response.json();
          console.log("Event details:", eventData);

          // Process and use event data as needed
          // For example, you could update state with event details:
          setEventDetails(eventData);
        } catch (error) {
          console.error("Error in loadEventDetails:", error);
        }
      };

      // Fetch recipients for the campaign
      const loadRecipients = async (
        campaignId: string,
        campaignBudget: number = 0
      ) => {
        setIsLoadingRecipients(true);
        try {
          // Using the API endpoint from the provided curl command
          const recipientsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/campaigns/${campaignId}/recipients`;
          const token = authToken;

          console.log("Fetching recipients from:", recipientsUrl);

          const response = await fetch(recipientsUrl, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error(
              `Error response: ${response.status} ${response.statusText}`
            );
            throw new Error(`Error fetching recipients: ${response.status}`);
          }

          const result = await response.json();

          // Debug the API response structure
          console.log(
            "Recipients API response:",
            JSON.stringify(result, null, 2)
          );

          // Log shipping info specifically
          if (result.data && result.data.length > 0) {
            console.log(
              "First recipient's shipping info:",
              result.data[0].shippingInfo
            );
            // Check if trackingUrl is directly accessible
            if (
              result.data[0].shippingInfo &&
              result.data[0].shippingInfo.trackingUrl
            ) {
              console.log(
                "Found tracking URL in response:",
                result.data[0].shippingInfo.trackingUrl
              );
            } else {
              console.log(
                "No tracking URL found in first recipient's shipping info"
              );
            }
          }

          // Flexible handling of API response structure
          const apiRecipients = (
            Array.isArray(result.data)
              ? result.data
              : Array.isArray(result)
                ? result
                : []
          ) as ApiRecipient[];

          if (apiRecipients.length === 0) {
            console.warn("No recipients found in API response");
          }

          console.log(
            `Found ${apiRecipients.length} recipients in API response`
          );
          console.log("API recipients:", apiRecipients);

          // Collect unique gift IDs to fetch gift details
          const uniqueGiftIds = [
            ...new Set(
              apiRecipients
                .map((r) => r.assignedGiftId as string | undefined)
                .filter((id): id is string => id !== undefined && id !== null)
            ),
          ];

          console.log("Unique gift IDs to fetch:", uniqueGiftIds);

          // Fetch gift details for each unique gift ID
          const giftsMap = new Map<string, Gift>();

          // Fetch gift details in parallel
          if (uniqueGiftIds.length > 0) {
            const giftPromises = uniqueGiftIds.map(async (giftId) => {
              try {
                const giftUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${giftId}`;
                const giftResponse = await fetch(giftUrl, {
                  headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                });

                if (!giftResponse.ok) {
                  console.error(
                    `Error fetching gift ${giftId}: ${giftResponse.status}`
                  );
                  return;
                }

                const giftData = await giftResponse.json();
                console.log(`Gift data for ${giftId}:`, giftData);
                console.log("Gift data:", giftData.images.primaryImgUrl);

                // Map the gift data to our Gift interface
                giftsMap.set(giftId, {
                  _id: giftData._id,
                  name: giftData.name,
                  price: Number(giftData.price),
                  primaryImgUrl: giftData.images?.primaryImgUrl,
                  descShort: giftData.descShort || "No description available",
                });
              } catch (error) {
                console.error(`Error processing gift ${giftId}:`, error);
              }
            });

            // Wait for all gift fetch operations to complete
            await Promise.all(giftPromises);
          }

          setGiftsMap(giftsMap);
          console.log("Gifts map created with", giftsMap.size, "gifts");

          // Helper function to extract ID from MongoDB format
          const extractId = (idObj: any): string => {
            if (typeof idObj === "string") return idObj;
            if (idObj && idObj.$oid) return idObj.$oid;
            return "";
          };

          // Helper function to extract Date from MongoDB format
          const extractDate = (dateObj: any): string | undefined => {
            if (!dateObj) return undefined;
            if (typeof dateObj === "string") return dateObj;
            if (dateObj.$date) return new Date(dateObj.$date).toISOString();
            return undefined;
          };

          // Update the transform function in loadRecipients to handle MongoDB format
          const transformedRecipients: Recipient[] = apiRecipients.map(
            (apiRecipient) => {
              console.log("Processing API recipient:", apiRecipient._id);
              console.log("Shipping info:", apiRecipient.shippingInfo);

              // Map API status to component status - keep original case for UI mapping
              let componentStatus = apiRecipient.status || "Pending";

              // Status mapping based on the campaign-detail/[id]/page.tsx file
              if (componentStatus === "Processing") {
                // Check if address is empty or not verified
                const addressEmpty =
                  !apiRecipient.address ||
                  Object.values(apiRecipient.address).some(
                    (val) => val === ""
                  ) ||
                  apiRecipient.address.isVerified === false;

                if (addressEmpty) {
                  componentStatus = "Awaiting Address Confirmation";
                }
              }

              // Extract feedback data
              const feedbackData = apiRecipient.feedback;
              console.log(
                "Recipient feedback data:",
                JSON.stringify(feedbackData, null, 2)
              );

              // Process assignedGiftId from MongoDB format if needed
              const assignedGiftId = extractId(apiRecipient.assignedGiftId);

              // Process dates from MongoDB format
              const deliveryDate = extractDate(apiRecipient.deliveryDate);
              const acknowledgedAt = extractDate(apiRecipient.acknowledgedAt);
              const expectedDeliveryDate = extractDate(
                apiRecipient.expectedDeliveryDate
              );

              // Process shipping information
              const trackingUrl = apiRecipient.shippingInfo?.trackingUrl || "";
              const trackingId = apiRecipient.shippingInfo?.trackingId || "";
              const carrier = apiRecipient.shippingInfo?.carrier || "";

              console.log("Extracted tracking URL:", trackingUrl);

              const recipient: Recipient = {
                _id: extractId(apiRecipient._id),
                name: `${apiRecipient.firstName || ""} ${apiRecipient.lastName || ""
                  }`.trim(),
                email: apiRecipient.mailId || "",
                company: apiRecipient.companyName || "",
                title: apiRecipient.jobTitle || "",
                assignedGiftId: assignedGiftId,
                status: componentStatus,
                deliveryDetails: {
                  deliveredDate: deliveryDate,
                  acknowledgedAt: acknowledgedAt,
                  estimatedDelivery: expectedDeliveryDate,
                  trackingUrl: trackingUrl,
                  trackingId: trackingId,
                  carrier: carrier,
                },
                addressVerification: apiRecipient.addressVerification
                  ? {
                    confirmationUrl:
                      apiRecipient.addressVerification.confirmationUrl,
                    emailSentAt: apiRecipient.addressVerification.emailSentAt,
                    verifiedAt: apiRecipient.addressVerification.verifiedAt,
                    sendCount: apiRecipient.addressVerification.sendCount,
                  }
                  : undefined,
                assignedGift:
                  assignedGiftId && giftsMap.has(assignedGiftId)
                    ? giftsMap.get(assignedGiftId)
                    : undefined,
                feedback: feedbackData,
              };

              console.log(
                "Transformed recipient:",
                recipient._id,
                "with tracking URL:",
                recipient.deliveryDetails?.trackingUrl
              );
              return recipient;
            }
          );

          setRecipients(transformedRecipients);

          // Update campaign with recipients
          setCampaign((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              recipients: transformedRecipients,
            };
          });

          // Calculate stats for counters
          const recipientsCount = transformedRecipients.length;
          const giftsSentCount = transformedRecipients.filter(
            (r) =>
              r.assignedGiftId &&
              ["InTransit", "Delivered", "Acknowledged", "Failed"].includes(
                r.status
              )
          ).length;
          const deliveredCount = transformedRecipients.filter(
            (r) => r.status === "Delivered" || r.status === "Acknowledged"
          ).length;
          const acknowledgedCount = transformedRecipients.filter(
            (r) => r.status === "Acknowledged"
          ).length;

          // Count as pending any recipient whose status is not Delivered or Acknowledged
          // This includes Processing, Awaiting Address Confirmation, etc.
          const pendingCount = transformedRecipients.filter(
            (r) => r.status !== "Delivered" && r.status !== "Acknowledged"
          ).length;

          // Calculate total budget from gift prices
          console.log("Campaign budget:", campaign);
          // Use the budget passed from loadCampaign
          let totalBudget = campaignBudget;
          console.log("Using budget passed from loadCampaign:", totalBudget);

          setStats({
            recipients: recipientsCount,
            giftsSent: giftsSentCount,
            delivered: deliveredCount,
            acknowledged: acknowledgedCount,
            pending: pendingCount,
            totalBudget: totalBudget,
            feedbackCount: countFeedbackEntries(transformedRecipients),
          });

          // Fetch engagement scores for all recipients
          await fetchEngagementScores(transformedRecipients, campaignId);
        } catch (err) {
          console.error("Error fetching recipients:", err);
          // Don't set a main error here since we want to display the campaign even if recipients fail
        } finally {
          setIsLoadingRecipients(false);
        }
      };

      // Fetch engagement scores for all recipients
      const fetchEngagementScores = async (recipients: Recipient[], campaignId: string) => {
        console.log("Fetching engagement scores for", recipients.length, "recipients");
        
        const scores: Record<string, number> = {};
        
        // Fetch engagement scores in parallel for better performance
        const engagementPromises = recipients.map(async (recipient) => {
          try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipient-timeline?recipientId=${recipient._id}&campaignId=${campaignId}`;
            const response = await fetch(apiUrl, {
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            });
            
            if (!response.ok) {
              console.warn(`Failed to fetch engagement score for recipient ${recipient._id}`);
              return;
            }
            
            const result = await response.json();
            if (result.summary?.engagementScore !== undefined) {
              scores[recipient._id] = result.summary.engagementScore;
              console.log(`Engagement score for ${recipient.name}: ${result.summary.engagementScore}`);
            }
          } catch (error) {
            console.error(`Error fetching engagement score for recipient ${recipient._id}:`, error);
          }
        });

        // Wait for all engagement score fetches to complete
        await Promise.all(engagementPromises);
        
        // Update the engagement scores state
        setEngagementScores(scores);
        console.log("All engagement scores fetched:", scores);
      };

      loadCampaign();
    }
  }, [isLoadingCookies]);

  const [giftCostBreakdown, setGiftCostBreakdown] = useState({
    totalGiftCost: 0,
    creditsUsed: 0,
    walletBalance: 0,
    requiredAmount: 0,
    difference: 0,
  });

  // Add this function to calculate gift costs
  const calculateGiftCosts = () => {
    // Calculate total gift cost including shipping & handling
    const totalGiftCost = recipients.reduce((acc, recipient) => {
      if (recipient.assignedGift) {
        // Add gift price + default S&H ($10)
        return acc + (recipient.assignedGift.price + 10);
      }
      return acc;
    }, 0);

    // For this example, let's assume wallet balance is fixed
    const walletBalance = 2500;

    setGiftCostBreakdown({
      totalGiftCost,
      creditsUsed: 0, // If you have credits system
      walletBalance,
      requiredAmount: totalGiftCost,
      difference: walletBalance - totalGiftCost,
    });
  };

  // Call this when opening the modal
  useEffect(() => {
    calculateGiftCosts();
  }, [recipients]);

  const [userCurrentWalletBalance, setUserCurrentWalletBalance] = useState(0);
  const fetchWalletBalance = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/${userId}/wallet/check-balance`
    );
    const data = await response.json();
    console.log("walletBalance", data.wallet?.current_balance);
    setUserCurrentWalletBalance(data.wallet?.current_balance || 0);
  };

  useEffect(() => {
    GetAllGifts();
    fetchWalletBalance();
  }, [campaign]);

  const GetAllGifts = async () => {
    try {
      let allGifts: Gift[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxGiftBudget = campaign?.budget?.maxPerGift || 0;

      while (hasMorePages) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts?page=${currentPage}&limit=50`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch gifts");
        }

        // Add gifts from current page to our collection, filtering by maxPerGift budget
        const filteredGifts = data.gifts.filter((gift: any) => {
          const giftPrice = Number(gift.price);
          return maxGiftBudget === 0 || giftPrice <= maxGiftBudget;
        });

        allGifts = [...allGifts, ...filteredGifts];

        // Check if we've reached the last page
        // If total items is greater than current items, we have more pages
        hasMorePages = data.total > currentPage * data.limit;
        currentPage++;
      }

      console.log(
        `Total gifts fetched (within budget of $${maxGiftBudget}):`,
        allGifts.length
      );
      setAllGifts(allGifts);
    } catch (error) {
      console.error("Error fetching gifts:", error);
    }
  };

  const handleLaunchCampaign = async () => {
    try {
      setHandleLaunchCampaignLoading(true);
      console.log(
        "campaign",
        campaign?._id,
        "organizationId",
        organizationId,
        "userId",
        userId
      );
      const runResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/campaigns/${campaign?._id}/run`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );
      console.log("runResponse", runResponse);
      if (!runResponse.ok) {
        setHandleLaunchCampaignLoading(false);
        const errorData = await runResponse.json().catch(() => null);
        console.error("Run Campaign API Error:", errorData);
        throw new Error(
          `Failed to run campaign: ${runResponse.status}${errorData?.message ? ` - ${errorData.message}` : ""
          }`
        );
      }
      window.location.reload();
    } catch (error) {
      console.error("Error launching campaign:", error);
      // Add error handling UI feedback here
    }
  };

  const handleAssignGiftToRecipient = async (
    giftId: string,
    recipientId: string
  ) => {
    try {
      const response = await fetch(`/api/recipients/${recipientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedGiftId: giftId,
        }),
      });
      if (response.ok) {
        setAllGiftsModalOpen(false);
        setSelectedGiftId("");
        setSelectedRecipientId("");
        //fetch recipients again
        // loadRecipients();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error assigning gift to recipient:", error);
    }
  };

  // =========================================================
  // Data Processing & Calculations
  // =========================================================
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);

  // Calculate engagement score for a recipient
  const calculateEngagementScore = (recipient: Recipient): number => {
    // Use the fetched engagement score from the API, fallback to 0 if not available
    return engagementScores[recipient._id] || 0;
  };

  // Filter recipients based on search query, status filter, and engagement filter
  const filteredRecipients =
    campaign?.recipients?.filter((recipient) => {
      const matchesSearch =
        searchQuery === "" ||
        recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.company.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = selectedStatuses.includes("all");

      if (!matchesStatus) {
        // Check if recipient status matches any of the selected statuses
        matchesStatus = selectedStatuses.some((selectedStatus) => {
          // Handle specific status filter cases
          if (
            selectedStatus === "OrderPlaced" &&
            recipient.status === "OrderPlaced"
          ) {
            return true;
          } else if (
            selectedStatus === "in-transit" &&
            (recipient.status === "in-transit" ||
              recipient.status === "InTransit")
          ) {
            return true;
          } else if (
            selectedStatus === "AwaitingAddressConfirmation" &&
            (recipient.status === "AwaitingAddressConfirmation" ||
              recipient.status === "Awaiting Address Confirmation")
          ) {
            return true;
          } else if (recipient.status === selectedStatus) {
            return true;
          }
          return false;
        });
      }

      // Check engagement filter
      let matchesEngagement = selectedEngagementFilters.includes("all");

      if (!matchesEngagement) {
        const engagementScore = calculateEngagementScore(recipient);
        matchesEngagement = selectedEngagementFilters.some((selectedEngagement) => {
          if (selectedEngagement === "high" && engagementScore >= 80) {
            return true;
          } else if (selectedEngagement === "medium" && engagementScore >= 60 && engagementScore < 80) {
            return true;
          } else if (selectedEngagement === "low" && engagementScore >= 40 && engagementScore < 60) {
            return true;
          } else if (selectedEngagement === "very-low" && engagementScore < 40) {
            return true;
          }
          return false;
        });
      }

      return matchesSearch && matchesStatus && matchesEngagement;
    }) || [];

  // Calculate pagination values
  const totalRecipients = filteredRecipients.length;
  const totalPages = Math.ceil(totalRecipients / pageSize);

  // Get current page recipients
  const indexOfLastRecipient = currentPage * pageSize;
  const indexOfFirstRecipient = indexOfLastRecipient - pageSize;
  const currentRecipients = filteredRecipients.slice(
    indexOfFirstRecipient,
    indexOfLastRecipient
  );

  // Get unique statuses for filter options
  const uniqueStatuses = [
    "all",
    ...new Set(
      recipients.map((r) => {
        if (r.status === "in-transit" || r.status === "InTransit")
          return "in-transit";
        if (
          r.status === "AwaitingAddressConfirmation" ||
          r.status === "Awaiting Address Confirmation"
        )
          return "AwaitingAddressConfirmation";
        return r.status || "Pending";
      })
    ),
  ];

  // Function to get display name for status
  const getStatusDisplayName = (status: string): string => {
    switch (status) {
      case "all":
        return "All Statuses";
      case "in-transit":
        return "In Transit";
      case "InTransit":
        return "In Transit";
      case "AwaitingAddressConfirmation":
        return "Awaiting Adress Confirmation";
      case "Awaiting Address Confirmation":
        return "Address Needed";
      case "OrderPlaced":
        return "Order Placed";
      case "Delivered":
        return "Delivered";
      case "Acknowledged":
        return "Acknowledged";
      case "Failed":
        return "Delivery Failed";
      case "Pending":
        return "Pending";
      case "InvitationSend":
        return "Invite Sent";
      case "DonatedToCharity":
        return "Donated";
      case "AwaitingGiftSelection":
        return "Awaiting Gift Selection";
      default:
        return (
          status.charAt(0).toUpperCase() +
          status
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim()
        );
    }
  };

  // =========================================================
  // Event Handlers
  // =========================================================

  // Page navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedStatuses(["all"]);
    setSelectedEngagementFilters(["all"]);
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Calculate engagement distribution
  const calculateEngagementDistribution = () => {
    const distribution = { high: 0, medium: 0, low: 0, veryLow: 0 };

    recipients.forEach(recipient => {
      const score = calculateEngagementScore(recipient);
      if (score >= 80) distribution.high++;
      else if (score >= 60) distribution.medium++;
      else if (score >= 40) distribution.low++;
      else distribution.veryLow++;
    });

    return distribution;
  };

  // =========================================================
  // UI Helper Functions
  // =========================================================

  // Get status badge styling based on recipient status
  const getEngagementBadge = (engagementScore: number) => {
    if (engagementScore === 0) {
      return (
        <div className="inline-flex items-center px-2.5 py-1 text-sm rounded-full bg-gray-100 text-gray-700 mx-auto">
          <span>-</span>
        </div>
      );
    }

    let badgeColor = "bg-purple-50 text-purple-700";
    if (engagementScore >= 75) {
      badgeColor = "bg-purple-50 text-purple-700";
    } else if (engagementScore >= 50) {
      badgeColor = "bg-purple-100 text-purple-700";
    } else if (engagementScore >= 25) {
      badgeColor = "bg-purple-200 text-purple-800";
    }

    return (
      <div className={`inline-flex items-center px-2.5 py-1 text-sm rounded-full ${badgeColor} mx-auto`}>
        <span>{engagementScore}%</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="8" x2="22" y2="8" />
              <path d="M12 12v4" />
              <path d="M9 12v4" />
              <path d="M15 12v4" />
            </svg>
            <span>Delivered</span>
          </div>
        );
      case "DonatedToCharity":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mx-auto">
            <Heart className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-500" />
            <span>Donated</span>
          </div>
        );
      case "AwaitingGiftSelection":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-purple-50 text-purple-700 mx-auto">
            <span>Awaiting Gift Selection</span>
          </div>
        );
      case "AwaitingAddressConfirmation":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-orange-50 text-orange-700 mx-auto">
            <span>Awaiting Address Confirmation</span>
          </div>
        );
      case "GiftSelected":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-pink-50 text-pink-700 mx-auto">
            <span>Gift Selected</span>
          </div>
        );
      case "OrderPlaced":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Order Placed</span>
          </div>
        );
      case "Acknowledged":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-green-50 text-green-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Acknowledged </span>
          </div>
        );
      case "in-transit":
      case "InTransit":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span>In Transit</span>
          </div>
        );
      case "Processing":
      case "processing":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-[#F4F3FF] text-[#6941C6] mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-[#6941C6]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Processing</span>
          </div>
        );
      case "Failed":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-red-50 text-red-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Delivery Failed</span>
          </div>
        );
      case "Declined":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-red-50 text-red-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            <span>Declined</span>
          </div>
        );
      case "DeliveryIssue":
      case "Delivery Issue":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-yellow-50 text-yellow-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Delivery Issue</span>
          </div>
        );
      case "InvitationSend":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-sky-50 text-sky-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
            <span>Invite Sent</span>
          </div>
        );
      case "Pending":
      case "pending":
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Pending</span>
          </div>
        );
      default:
        // For any other status, provide a generic badge
        return (
          <div className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{status || "Unknown"}</span>
          </div>
        );
    }
  };

  // Helper function to check if a recipient's gift can be updated
  // Recipients can have their gift updated unless they are already Delivered or Acknowledged

  // Update the feedback UI display component
  const renderFeedback = (
    feedback: Recipient["feedback"],
    recipientName: string
  ) => {
    console.log("Rendering feedback:", JSON.stringify(feedback));

    // If feedback is a string (old format)
    if (typeof feedback === "string") {
      return feedback === "liked" ? (
        <div
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-50 text-green-500"
          title="Recipient liked the gift"
        >
          <ThumbsUp className="h-4 w-4" />
        </div>
      ) : (
        <div
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-500"
          title="Recipient disliked the gift"
        >
          <ThumbsDown className="h-4 w-4" />
        </div>
      );
    }

    // If feedback is the new object format
    if (feedback && typeof feedback === "object") {
      // Check reaction1 for thumbs up/down
      const hasThumbsUp = feedback.reaction1 === "thumbs_up";
      const hasThumbsDown = feedback.reaction1 === "thumbs_down";
      const hasTextMessage =
        feedback.textMessage?.content || feedback.reaction2;
      const hasVideoMessage =
        feedback.videoMessage?.mediaUrl || feedback.message?.mediaUrl;
      const hasAudioMessage = feedback.audioMessage?.mediaUrl;
      const hasLegacyMessage =
        feedback.message?.content && !feedback.message?.mediaUrl;
      const hasReaction2 = feedback.reaction2;

      console.log("Feedback reaction:", feedback.reaction1);
      console.log("Has text message:", !!hasTextMessage);
      console.log("Has video message:", !!hasVideoMessage);
      console.log("Has audio message:", !!hasAudioMessage);
      console.log("Has legacy message:", !!hasLegacyMessage);

      return (
        <div className="flex flex-wrap items-center gap-1">
          {/* Thumbs up/down reaction */}
          {hasThumbsUp && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-50 text-green-500 cursor-pointer hover:bg-green-100 transition-colors"
              title="Positive feedback - click to view details"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: "thumbs_up",
                  reactionTimestamp: feedback.textMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage: feedback.textMessage?.content,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage: feedback.videoMessage?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-thumbs-up"
              >
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
            </div>
          )}

          {hasThumbsDown && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-500 cursor-pointer hover:bg-red-100 transition-colors"
              title="Negative feedback - click to view details"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: "thumbs_down",
                  reactionTimestamp: feedback.textMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage: feedback.textMessage?.content,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage: feedback.videoMessage?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-thumbs-down"
              >
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
            </div>
          )}

          {/* Text message feedback */}
          {hasTextMessage && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-50 text-green-600 cursor-pointer hover:bg-green-100 transition-colors"
              title="Text message - click to view"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: feedback.reaction1,
                  reactionTimestamp: feedback.textMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage:
                    feedback.textMessage?.content || feedback.reaction2,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage: feedback.videoMessage?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              <MessageSquareText className="h-4 w-4" />
            </div>
          )}

          {/* Video message feedback */}
          {hasVideoMessage && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-50 text-purple-600 cursor-pointer hover:bg-purple-100 transition-colors"
              title="Video message - click to view"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: feedback.reaction1,
                  reactionTimestamp: feedback.videoMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage: feedback.textMessage?.content,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage:
                    feedback.videoMessage?.mediaUrl ||
                    feedback.message?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
          )}

          {/* Audio message feedback */}
          {hasAudioMessage && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors"
              title="Audio message - click to listen"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: feedback.reaction1,
                  reactionTimestamp: feedback.audioMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage: feedback.textMessage?.content,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage: feedback.videoMessage?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}

          {/* Legacy message (for backward compatibility) */}
          {hasLegacyMessage && !hasTextMessage && !hasVideoMessage && (
            <div
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-50 text-amber-600 cursor-pointer hover:bg-amber-100 transition-colors"
              title="Message - click to view"
              onClick={() => {
                setSelectedFeedback({
                  name: recipientName,
                  reaction: feedback.reaction1,
                  reactionTimestamp: feedback.textMessage?.timestamp || new Date().toISOString(),
                  message: feedback.reaction2 || "",
                  textMessage: feedback.textMessage?.content,
                  textMessageTimestamp: feedback.textMessage?.timestamp,
                  videoMessage: feedback.videoMessage?.mediaUrl,
                  videoMessageTimestamp: feedback.videoMessage?.timestamp,
                  audioMessage: feedback.audioMessage?.mediaUrl,
                  audioMessageTimestamp: feedback.audioMessage?.timestamp,
                  legacyMessage: feedback.message,
                });
                setShowFeedbackModal(true);
              }}
            >
              {feedback.message?.mediaUrl ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
              ) : (
                <MessageSquareText className="h-4 w-4" />
              )}
            </div>
          )}

          {/* Reaction2 message (for backward compatibility) */}
          {hasReaction2 &&
            !hasTextMessage &&
            !hasVideoMessage &&
            !hasLegacyMessage && (
              <div
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-50 text-amber-600 cursor-pointer hover:bg-amber-100 transition-colors"
                title="Click to view recipient message"
                onClick={() => {
                  setSelectedFeedback({
                    name: recipientName,
                    reaction: feedback.reaction1,
                    reactionTimestamp: feedback.textMessage?.timestamp || new Date().toISOString(),
                    message: feedback.reaction2 || "",
                    textMessage: feedback.textMessage?.content,
                    textMessageTimestamp: feedback.textMessage?.timestamp,
                    videoMessage: feedback.videoMessage?.mediaUrl,
                    videoMessageTimestamp: feedback.videoMessage?.timestamp,
                    audioMessage: feedback.audioMessage?.mediaUrl,
                    audioMessageTimestamp: feedback.audioMessage?.timestamp,
                    legacyMessage: feedback.message,
                  });
                  setShowFeedbackModal(true);
                }}
              >
                <MessageSquareText className="h-4 w-4" />
              </div>
            )}

          {!hasThumbsUp &&
            !hasThumbsDown &&
            !hasTextMessage &&
            !hasVideoMessage &&
            !hasAudioMessage &&
            !hasLegacyMessage &&
            !hasReaction2 && <span className="text-gray-400">-</span>}
        </div>
      );
    }

    return <span className="text-gray-400">-</span>;
  };

  // =========================================================
  // Render Loading State
  // =========================================================

  if (isLoading) {
    return (
      <div className="flex bg-[#F9FAFB]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full">
          <div className="p-6 bg-[#F9FAFB] rounded-tl-3xl h-[100%]">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded w-full"></div>
              <div className="h-64 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // Render Error State
  // =========================================================

  if (error || !campaign || notFound) {
    return (
      <div className="flex bg-[#F9FAFB]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full">
          <div className="p-6 bg-[#F9FAFB] rounded-tl-3xl h-[100%] flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 text-red-500 mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Error Loading Campaign
              </h3>
              <p className="mt-2 text-gray-600">
                {error || "Campaign not found"}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => (window.location.href = "/campaigns")}
                  variant="outline"
                >
                  Back to Campaigns
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // Main UI Render
  // =========================================================

  return (
    <>
      <div className="flex bg-[#F9FAFB]">
        {giftCostModalOpen && (
          <div className="fixed inset-0 flex items-center z-50 justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg w-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    className="mr-2 text-primary"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    >
                      <path d="M20.943 16.835a15.76 15.76 0 0 0-4.476-8.616c-.517-.503-.775-.754-1.346-.986C14.55 7 14.059 7 13.078 7h-2.156c-.981 0-1.472 0-2.043.233c-.57.232-.83.483-1.346.986a15.76 15.76 0 0 0-4.476 8.616C2.57 19.773 5.28 22 8.308 22h7.384c3.029 0 5.74-2.227 5.25-5.165" />
                      <path d="M7.257 4.443c-.207-.3-.506-.708.112-.8c.635-.096 1.294.338 1.94.33c.583-.009.88-.268 1.2-.638C10.845 2.946 11.365 2 12 2s1.155.946 1.491 1.335c.32.37.617.63 1.2.637c.646.01 1.305-.425 1.94-.33c.618.093.319.5.112.8l-.932 1.359c-.4.58-.599.87-1.017 1.035S13.837 7 12.758 7h-1.516c-1.08 0-1.619 0-2.036-.164S8.589 6.38 8.189 5.8zm6.37 8.476c-.216-.799-1.317-1.519-2.638-.98s-1.53 2.272.467 2.457c.904.083 1.492-.097 2.031.412c.54.508.64 1.923-.739 2.304c-1.377.381-2.742-.214-2.89-1.06m1.984-5.06v.761m0 5.476v.764" />
                    </g>
                  </svg>
                  Gift Cost Breakdown
                </h3>
                <button
                  onClick={() => setGiftCostModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">
                    Total Gift Cost (incl. S&H)
                  </span>
                  <span className="text-base font-semibold">
                    ${giftCostBreakdown.totalGiftCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Credits Used</span>
                  <span className="text-base font-semibold">
                    {giftCostBreakdown.creditsUsed} credits
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Wallet Balance
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${userCurrentWalletBalance.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Required Amount
                      </span>
                      <span className="text-base font-semibold">
                        ${giftCostBreakdown.requiredAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Difference</span>
                      <span
                        className={`text-base font-semibold ${userCurrentWalletBalance -
                          giftCostBreakdown.requiredAmount >=
                          0
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        $
                        {Math.abs(
                          userCurrentWalletBalance -
                          giftCostBreakdown.requiredAmount
                        ).toLocaleString()}
                        {userCurrentWalletBalance -
                          giftCostBreakdown.requiredAmount <
                          0
                          ? ""
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {userCurrentWalletBalance - giftCostBreakdown.requiredAmount <
                0 ? (
                <Link
                  href="/dashboard/wallet"
                  className="inline-block text-center mt-5 bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary/95 transition-all duration-300 w-full"
                >
                  Add Funds
                </Link>
              ) : (
                <button
                  onClick={handleLaunchCampaign}
                  disabled={handleLaunchCampaignLoading}
                  className="w-full mt-5 bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary/95 transition-all duration-300"
                >
                  {handleLaunchCampaignLoading ? (
                    <span className="text-sm">Launch Campaign...</span>
                  ) : (
                    "Launch Campaign"
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="p-6 bg-[#F9FAFB] rounded-tl-3xl h-[100%] overflow-y-auto pb-10 sm:pb-0">
            {/* Header with PageHeader */}
            <div>
              <PageHeader
                backLink={{
                  href: "/campaigns",
                  text: "Back to campaigns"
                }}
                title={campaign.title || campaign.name}

                chips={[

                  {
                    text: campaign.status === "active"
                      ? "Active"
                      : campaign.status === "live"
                        ? "Live"
                        : campaign.status === "scheduled"
                          ? "Scheduled"
                          : campaign.status === "ready_for_launch"
                            ? "Ready For Launch"
                            : campaign.status === "matching_gifts"
                              ? "Matching Gifts"
                              : campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1),
                    color: campaign.status === "active"
                      ? "green"
                      : campaign.status === "live"
                        ? "green"
                        : campaign.status === "scheduled"
                          ? "blue"
                          : campaign.status === "ready_for_launch"
                            ? "yellow"
                            : "gray"
                  }
                ]}
                lastUpdated={campaign.updatedAt ? new Date(campaign.updatedAt) : undefined}
                primaryButton={
                  campaign?.giftSelectionMode !== "manual" && campaign?.status === "ready_for_launch" ? {
                    text: "Launch Campaign",
                    variant: "primary",
                    onClick: () => {
                      if (setGiftCostModalOpen) {
                        setGiftCostModalOpen(!giftCostModalOpen);
                      }
                    }
                  } : undefined
                }
                secondaryButton={{
                  text: "Export",
                  icon: Share2,
                  variant: "secondary",
                  onClick: () => {
                    // Trigger the hidden PDF download
                    const downloadElement = document.getElementById('pdf-download-link');
                    if (downloadElement) {
                      downloadElement.click();
                    }
                  }
                }}
              />

              {/* Hidden PDF Download Link */}
              <div style={{ display: 'none' }}>
                <PDFDownloadLink
                  id="pdf-download-link"
                  document={
                    <CampaignPDF
                      campaign={campaign}
                      recipients={recipients}
                      stats={stats}
                      eventDetails={eventDetails}
                    />
                  }
                  fileName={`campaign-${campaign._id}.pdf`}
                >
                  Download PDF
                </PDFDownloadLink>
              </div>
            </div>

            {/* Campaign details with EventCardFinal */}
            <div
              className={`mt-1 ${eventDetails == null ? "hidden" : "block"
                }`}
            >
              <EventCardFinal
                event={{
                  id: campaign._id,
                  name: campaign.title || campaign.name,
                  image:
                    eventDetails?.event?.media?.banner ||
                    "/images/campaign-placeholder.svg",
                  startDate: formatDate(campaign.launchDate),
                  location: eventDetails?.event?.location || "Virtual Event",
                  type: getCampaignMotionName(campaign.motion),
                  stats: {
                    registration: {
                      new: Math.round(stats.recipients * 0.4),
                      existing: Math.round(stats.recipients * 0.5),
                      total: stats.recipients,
                    },
                    abmAccounts: {
                      new: Math.round(stats.recipients * 0.4),
                      existing: Math.round(stats.recipients * 0.5),
                      total: Math.round(stats.recipients * 1),
                      crmConnected: false,
                    },
                    opportunityCoverage: {
                      count: Math.round(stats.recipients * 0.15),
                      value: Math.round(
                        parseFloat(campaign.stats.conversionRate) * 10000
                      ),
                      target: Math.round(
                        parseFloat(campaign.stats.conversionRate) * 12000
                      ),
                    },
                  },
                  crmConnected: false,
                }}
              />
            </div>

            {/* Campaign Summary Card */}

            <div className="mt-6">
              <div className="bg-white p-6 rounded-lg border shadow-lg transition-all duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  {/* Recipients */}
                  <div className="rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {campaign?.motion === "booth_giveaways"
                          ? "Expected "
                          : ""}
                        Recipients
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {campaign?.motion === "booth_giveaways"
                        ? campaign?.total_recipients
                        : recipientsCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Gifts Sent */}
                  <div
                    className={`rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md ${campaign?.motion === "booth_giveaways" ? "hidden" : ""
                      }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-indigo-50 border-4 border-indigo-100 rounded-full flex items-center justify-center">
                        <Gift className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium">
                        Gifts Sent
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {campaign?.status == "ready_for_launch" ||
                        campaign?.status == "matching_gifts"
                        ? "0"
                        : giftsSentCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Delivered */}
                  <div
                    className={`rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md ${campaign?.motion === "booth_giveaways" ? "hidden" : ""
                      }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-orange-50 border-4 border-orange-100 rounded-full flex items-center justify-center">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium">Delivered</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {deliveredCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Acknowledged */}
                  <div className="rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-green-50 border-4 border-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">
                        Acknowledged
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {acknowledgedCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Pending */}
                  <div
                    className={`summary-card rounded-lg p-4 transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md ${campaign?.motion === "booth_giveaways" ? "hidden" : ""
                      } hidden`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-yellow-50 border-4 border-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600 summary-icon group-hover:scale-105" />
                      </div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold summary-number animate-count-up" style={{ animationDelay: "750ms" }}>
                      {pendingCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div className="rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Feedback</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {feedbackCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Total Budget */}
                  <div
                    className={`rounded-lg p-4 transition-colors border border-gray-200 shadow-sm hover:shadow-md ${campaign?.motion === "booth_giveaways" ? "hidden" : ""
                      }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium">
                        Total Budget
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${giftCostBreakdown?.requiredAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipients Section with Tabs */}
            <div
              className="mt-6 animate-fade-in-up opacity-0"
              style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
            >
              <div
                className="bg-white rounded-lg border border-gray-200 shadow-sm animate-scale-in hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: "500ms" }}
              >
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("recipients")}
                      className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "recipients"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Recipients
                    </button>
                    <button
                      onClick={() => setActiveTab("experience")}
                      className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "experience"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Recipient Experience
                    </button>

                    <button
                      onClick={() => setActiveTab("analytics")}
                      className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "analytics"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Analytics
                    </button>

                    {campaign?.motion == "set_up_meeting" && (
                      <button
                        onClick={() => setActiveTab("meetings")}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "meetings"
                          ? "text-primary border-b-2 border-primary"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        Meetings
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Recipients Tab */}
                  {activeTab === "recipients" && (
                    <div className="relative">
                      {/* Controls: Engagement Chips left, Search + Filter right */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        {/* Left side: Engagement Chips */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Engagement:</span>
                          {(() => {
                            const distribution = calculateEngagementDistribution();
                            return [
                              { key: "all", label: "All", color: "gray", count: recipients.length },
                              { key: "high", label: "High (80%+)", color: "purple-700", count: distribution.high },
                              { key: "medium", label: "Medium (60-79%)", color: "purple-600", count: distribution.medium },
                              { key: "low", label: "Low (40-59%)", color: "purple-500", count: distribution.low },
                              { key: "very-low", label: "Very Low (<40%)", color: "purple-400", count: distribution.veryLow },
                            ].map((engagement) => {
                              const isSelected = selectedEngagementFilters.includes(engagement.key);
                              return (
                                <button
                                  key={engagement.key}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${isSelected
                                    ? "bg-primary text-white border-primary"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    }`}
                                  onClick={() => {
                                    if (engagement.key === "all") {
                                      setSelectedEngagementFilters(["all"]);
                                    } else {
                                      let newSelected = [...selectedEngagementFilters];
                                      if (newSelected.includes("all")) {
                                        newSelected = newSelected.filter((s) => s !== "all");
                                      }
                                      if (newSelected.includes(engagement.key)) {
                                        newSelected = newSelected.filter((s) => s !== engagement.key);
                                      } else {
                                        newSelected.push(engagement.key);
                                      }
                                      if (newSelected.length === 0) {
                                        newSelected = ["all"];
                                      }
                                      setSelectedEngagementFilters(newSelected);
                                    }
                                    setCurrentPage(1);
                                  }}
                                >
                                  {engagement.color === "purple-700" && (
                                    <div className="w-2 h-2 rounded-full bg-purple-700"></div>
                                  )}
                                  {engagement.color === "purple-600" && (
                                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                  )}
                                  {engagement.color === "purple-500" && (
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  )}
                                  {engagement.color === "purple-400" && (
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                  )}
                                  {engagement.color === "gray" && (
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                  )}
                                  {engagement.label}
                                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-1">
                                    {engagement.count}
                                  </span>
                                </button>
                              );
                            });
                          })()}
                          {selectedEngagementFilters.length > 1 ||
                            (selectedEngagementFilters.length === 1 && !selectedEngagementFilters.includes("all")) ? (
                            <button
                              onClick={() => {
                                setSelectedEngagementFilters(["all"]);
                                setCurrentPage(1);
                              }}
                              className="ml-2 text-xs text-purple-600 hover:text-purple-800"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>

                        {/* Right side: Search Bar and Filter Button */}
                        <div className="flex items-center gap-3">
                          {/* Search Bar */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search recipients..."
                              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>

                          {/* Filter Button */}
                          <div className={`relative ${campaign?.motion === "booth_giveaways" ? "hidden" : ""}`}>
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                              type="button"
                            >
                              <Filter className="h-4 w-4" />
                            </button>
                            {showStatusDropdown && (
                              <div className="absolute z-50 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg top-full right-0 animate-fade-in-up overflow-hidden">
                                <div className="p-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3">Status</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { key: "all", color: "gray" },
                                      { key: "Delivered", color: "blue" },
                                      { key: "Acknowledged", color: "green" },
                                      { key: "in-transit", color: "amber" },
                                      { key: "OrderPlaced", color: "blue" },
                                      {
                                        key: "AwaitingAddressConfirmation",
                                        color: "orange",
                                      },
                                      {
                                        key: "InvitationSend",
                                        color: "sky",
                                      },
                                      {
                                        key: "AwaitingGiftSelection",
                                        color: "purple",
                                      },
                                      {
                                        key: "GiftSelected",
                                        color: "pink",
                                      },
                                      {
                                        key: "DonatedToCharity",
                                        color: "gray",
                                      },
                                      { key: "Failed", color: "red" },
                                    ].map((status) => {
                                      const isSelected = selectedStatuses.includes(status.key);
                                      return (
                                        <button
                                          key={status.key}
                                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${isSelected
                                            ? "bg-primary text-white border-primary"
                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                            }`}
                                          onClick={() => {
                                            if (status.key === "all") {
                                              setSelectedStatuses(["all"]);
                                              setStatusFilter("all");
                                            } else {
                                              let newSelected = [...selectedStatuses];
                                              if (newSelected.includes("all")) {
                                                newSelected = newSelected.filter((s) => s !== "all");
                                              }
                                              if (newSelected.includes(status.key)) {
                                                newSelected = newSelected.filter((s) => s !== status.key);
                                              } else {
                                                newSelected.push(status.key);
                                              }
                                              if (newSelected.length === 0) {
                                                newSelected = ["all"];
                                                setStatusFilter("all");
                                              } else {
                                                setStatusFilter(newSelected[0]);
                                              }
                                              setSelectedStatuses(newSelected);
                                            }
                                            setCurrentPage(1);
                                          }}
                                        >
                                          {status.color === "blue" && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                          )}
                                          {status.color === "green" && (
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          )}
                                          {status.color === "amber" && (
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                          )}
                                          {status.color === "purple" && (
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                          )}
                                          {status.color === "orange" && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                          )}
                                          {status.color === "gray" && (
                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                          )}
                                          {status.color === "red" && (
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                          )}
                                          {status.color === "sky" && (
                                            <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                          )}
                                          {status.color === "pink" && (
                                            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                          )}
                                          {status.color === "gray" && !isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                          )}
                                          {getStatusDisplayName(status.key)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Table View - hidden on mobile */}
                      <div className="hidden md:block">
                        <div
                          className={`absolute top-0 left-0 w-full h-full bg-white/80 z-50 backdrop-blur-sm ${campaign?.status == "matching_gifts"
                            ? "block"
                            : "hidden"
                            }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <div className=" text-center">
                              <div className="text-2xl font-bold text-primary mb-1">
                                Matching Gifts
                              </div>
                              <div className="text-sm">
                                We are matching gifts for your campaign. Please
                                check back soon.
                              </div>
                            </div>
                          </div>
                        </div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recipient
                              </th>
                              <th
                                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${campaign?.motion === "booth_giveaways"
                                  ? "hidden"
                                  : ""
                                  }`}
                              >
                                Company & Role
                              </th>
                              <th
                                className={`px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 ${campaign?.motion === "booth_giveaways"
                                  ? "hidden"
                                  : ""
                                  }`}
                              >
                                Gift
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Key Dates
                              </th>
                              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Feedback
                              </th>
                              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Engagement Activity
                              </th>
                              {campaign?.status !== "ready_for_launch" &&
                                campaign?.motion !== "booth_giveaways" && (
                                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                    Actions
                                  </th>
                                )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {/* TODO: Replace with actual recipients data from API */}
                            {currentRecipients.map((recipient) => (
                              <React.Fragment key={recipient._id}>
                                <tr className="hover:bg-gray-50">
                                  <td className="px-1 py-4">
                                    <div className="flex items-center">
                                      <div className="ml-2">
                                        <div className="text-sm font-medium text-gray-900">
                                          {recipient.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {recipient.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td
                                    className={`px-4 py-4 ${campaign?.motion === "booth_giveaways"
                                      ? "hidden"
                                      : ""
                                      }`}
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {recipient.company || "-"}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {recipient.title || "-"}
                                        {/* {campaign?.giftSelectionMode} */}
                                      </div>
                                    </div>
                                  </td>
                                  <td
                                    className={`px-2 py-2 w-40 ${campaign?.motion === "booth_giveaways"
                                      ? "hidden"
                                      : ""
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex-shrink-0 relative group">
                                        <Image
                                          src={
                                            recipient.assignedGift
                                              ?.primaryImgUrl || "/loading.png"
                                          }
                                          alt={
                                            recipient.assignedGift?.name ||
                                            "Gift image"
                                          }
                                          className="h-16 w-16 object-cover rounded-lg border border-gray-200 transition-transform group-hover:scale-105"
                                          onError={(e) => {
                                            e.currentTarget.src = "/loading.png";
                                          }}
                                          width={64}
                                          height={64}
                                        />

                                        {/* Hover Tooltip */}
                                        {recipient.assignedGift && (
                                          <div className="absolute left-full top-0 ml-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                            <div className="flex gap-4">
                                              <div className="flex-shrink-0">
                                                <Image
                                                  src={recipient.assignedGift.primaryImgUrl || "/loading.png"}
                                                  alt={recipient.assignedGift.name}
                                                  className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                                                  onError={(e) => {
                                                    e.currentTarget.src = "/loading.png";
                                                  }}
                                                  width={80}
                                                  height={80}
                                                />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 text-sm mb-1">
                                                  {recipient.assignedGift.name}
                                                </h3>
                                                <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                                                  {recipient.assignedGift.descShort}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-sm font-semibold text-gray-900">
                                                    ${recipient.assignedGift.price.toLocaleString()}
                                                  </span>
                                                  {campaign?.giftSelectionMode === "hyper_personalize" &&
                                                    campaign?.status === "ready_for_launch" && (
                                                      <button
                                                        className="text-xs text-primary-light font-semibold hover:underline"
                                                        onClick={() => {
                                                          setSelectedRecipientId(recipient._id);
                                                          setAllGiftsModalOpen(true);
                                                        }}
                                                      >
                                                        Change
                                                      </button>
                                                    )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    {getStatusBadge(recipient.status)}
                                    {/* {recipient.status} */}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="space-y-2">
                                      {recipient.deliveryDetails
                                        ?.deliveredDate && (
                                          <div className="flex items-center text-xs text-gray-900">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <rect
                                                x="2"
                                                y="4"
                                                width="20"
                                                height="16"
                                                rx="2"
                                              />
                                              <line x1="2" y1="8" x2="22" y2="8" />
                                              <path d="M12 12v4" />
                                              <path d="M9 12v4" />
                                              <path d="M15 12v4" />
                                            </svg>
                                            <span>
                                              Delivered:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.deliveredDate
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails
                                        ?.acknowledgedAt && (
                                          <div className="flex items-center text-xs text-gray-900">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                              Acknowledged:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.acknowledgedAt
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails
                                        ?.declinedDate && (
                                          <div className="flex items-center text-xs text-gray-900">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <circle cx="12" cy="12" r="10" />
                                              <path d="M15 9l-6 6M9 9l6 6" />
                                            </svg>
                                            <span>
                                              Declined:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.declinedDate
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {!recipient.deliveryDetails
                                        ?.deliveredDate &&
                                        recipient.deliveryDetails
                                          ?.estimatedDelivery && (
                                          <div className="flex items-center text-xs text-gray-900">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-amber-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <rect
                                                x="3"
                                                y="4"
                                                width="18"
                                                height="16"
                                                rx="2"
                                              />
                                              <line
                                                x1="16"
                                                y1="2"
                                                x2="16"
                                                y2="6"
                                              />
                                              <line x1="8" y1="2" x2="8" y2="6" />
                                              <line
                                                x1="3"
                                                y1="10"
                                                x2="21"
                                                y2="10"
                                              />
                                            </svg>
                                            <span>
                                              Est. Delivery:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.estimatedDelivery
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails?.issueDate && (
                                        <div className="flex items-center text-xs text-gray-900">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1.5 flex-shrink-0 text-yellow-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span>
                                            Issue:{" "}
                                            {formatDate(
                                              recipient.deliveryDetails?.issueDate
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {!recipient.deliveryDetails?.deliveredDate &&
                                        !recipient.deliveryDetails?.acknowledgedAt &&
                                        !recipient.deliveryDetails?.declinedDate &&
                                        !recipient.deliveryDetails?.estimatedDelivery &&
                                        !recipient.deliveryDetails?.issueDate && (
                                          <span className="text-xs text-gray-500">-</span>
                                        )}
                                    </div>
                                  </td>

                                  <td className="px-2 py-4 text-center">
                                    {recipient.feedback?.message?.mediaUrl && (
                                      <div>
                                        <button
                                          onClick={() =>
                                            setShowVideoModal(recipient._id)
                                          }
                                          className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <circle cx="12" cy="12" r="10" />
                                            <polygon points="10 8 16 12 10 16 10 8" />
                                          </svg>
                                        </button>

                                        {showVideoModal === recipient._id && (
                                          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                            <div className="bg-white rounded-lg w-full max-w-2xl mx-auto">
                                              <div className="flex justify-between items-center p-4 border-b">
                                                <h3 className="text-lg font-semibold">
                                                  Feedback Video
                                                </h3>
                                                <button
                                                  onClick={() =>
                                                    setShowVideoModal(null)
                                                  }
                                                  className="text-gray-500 hover:text-gray-700"
                                                >
                                                  <svg
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                  </svg>
                                                </button>
                                              </div>
                                              <div
                                                className="relative w-full"
                                                style={{ paddingTop: "56.25%" }}
                                              >
                                                <video
                                                  src={
                                                    recipient.feedback?.message
                                                      ?.mediaUrl
                                                  }
                                                  controls
                                                  className="absolute inset-0 w-full h-full object-contain bg-black"
                                                  playsInline
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {recipient.feedback ? (
                                      renderFeedback(
                                        recipient.feedback,
                                        recipient.name
                                      )
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* Engagement Activity Column */}
                                  <td className="px-2 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      {(() => {
                                        const engagementScore = calculateEngagementScore(recipient);
                                        return getEngagementBadge(engagementScore);
                                      })()}
                                      <button
                                        onClick={() => handleToggleTimeline(recipient._id)}
                                        className={`text-gray-500 hover:text-purple-600 focus:outline-none p-1.5 rounded-full hover:bg-purple-50 transition-colors border ${expandedTimelines.has(recipient._id)
                                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                                          : 'border-gray-200 hover:border-purple-200'
                                          }`}
                                        title={expandedTimelines.has(recipient._id) ? "Collapse Timeline" : "View Timeline"}
                                      >
                                        {expandedTimelines.has(recipient._id) ? (
                                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                          </svg>
                                        ) : (
                                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </td>

                                  <td className="px-1 py-4 text-center relative w-16">
                                    <div className="relative inline-block">
                                      <button
                                        ref={(el) => {
                                          if (el) {
                                            actionButtonRefs.current[recipient._id] = el;
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setActionMenuOpen(
                                            actionMenuOpen === recipient._id
                                              ? null
                                              : recipient._id
                                          );
                                        }}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="More options"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>

                                      {actionMenuOpen === recipient._id && (
                                        <div
                                          className={`absolute right-0 z-50 w-72 ${getMenuPosition(recipient._id).direction === "up"
                                            ? "bottom-full mb-1"
                                            : "top-full mt-1"
                                            }`}
                                        >
                                          <div className="bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200 overflow-hidden">
                                            <div className="py-1.5 px-2">
                                              {(() => {
                                                const menuContent = getMenuContent(recipient);

                                                if (menuContent.type === 'empty') {
                                                  return (
                                                    <div className="flex items-center w-full px-3 py-2.5 text-sm text-gray-500">
                                                      <div className="mr-2.5 p-1.5 rounded-full bg-gray-100">
                                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                      </div>
                                                      <span>{menuContent.label}</span>
                                                    </div>
                                                  );
                                                }

                                                return (
                                                  <button
                                                    onMouseUp={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();

                                                      const url = menuContent.url;
                                                      navigator.clipboard.writeText(url).then(() => {
                                                        setShowCopySuccess(`${menuContent.type}-${recipient._id}`);
                                                        setTimeout(() => setShowCopySuccess(null), 2000);
                                                        setTimeout(() => setActionMenuOpen(null), 100);
                                                      }).catch(() => {
                                                        // Fallback for older browsers
                                                        const textArea = document.createElement("textarea");
                                                        textArea.value = url;
                                                        document.body.appendChild(textArea);
                                                        textArea.select();
                                                        document.execCommand("copy");
                                                        document.body.removeChild(textArea);
                                                        setShowCopySuccess(`${menuContent.type}-${recipient._id}`);
                                                        setTimeout(() => setShowCopySuccess(null), 2000);
                                                        setTimeout(() => setActionMenuOpen(null), 100);
                                                      });
                                                    }}
                                                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 group"
                                                  >
                                                    <div
                                                      className={`mr-2.5 p-1.5 rounded-full group-hover:bg-purple-50
                                                      transition-colors duration-150 ${showCopySuccess === `${menuContent.type}-${recipient._id}`
                                                          ? "bg-green-50"
                                                          : "bg-gray-100"
                                                        }`}
                                                    >
                                                      {showCopySuccess === `${menuContent.type}-${recipient._id}` ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                      ) : (
                                                        <Copy className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                                                      )}
                                                    </div>
                                                    <span>{menuContent.label}</span>
                                                  </button>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Timeline Row */}
                                {expandedTimelines.has(recipient._id) && (
                                  <tr>
                                    <td colSpan={8} className="px-0 py-0">
                                      <div className="bg-white border-t border-l-4 border-l-purple-500 border-gray-200 shadow-sm">
                                        {/* Timeline Header */}
                                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                              </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Timeline Events</h3>
                                            </div>
                                            <button
                                              onClick={() => handleToggleTimeline(recipient._id)} 
                                              className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                              title="Collapse Timeline"
                                            >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                        <div className="px-6 py-5 min-h-[200px] flex items-center justify-center">
                                          {loadingTimelines.has(recipient._id) ? (
                                            <div className="text-center text-gray-500">
                                              <svg className="animate-spin h-6 w-6 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              <p className="mt-2 text-sm">Loading Timeline...</p>
                                            </div>
                                          ) : timelineData[recipient._id] && timelineData[recipient._id].length > 0 ? (
                                            <TouchpointTimelineV2
                                              timelineEvents={timelineData[recipient._id]}
                                              isExpanded={true}
                                            />
                                          ) : (
                                            <div className="text-center text-gray-500">
                                              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
                                              <p className="mt-2 text-sm font-medium">No Timeline Data</p>
                                              <p className="text-xs">No events have been recorded for this recipient yet.</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {currentRecipients.map((recipient) => (
                          <div
                            key={recipient._id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start p-4 border-b border-gray-100">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {recipient.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {recipient.email}
                                </p>
                              </div>
                              <div className="relative">
                                {/* {canUpdateGift(recipient.status) && ( */}
                                <button
                                  ref={(el) => {
                                    if (el) {
                                      actionButtonRefs.current[`mobile-${recipient._id}`] = el;
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setActionMenuOpen(
                                      actionMenuOpen === recipient._id
                                        ? null
                                        : recipient._id
                                    );
                                  }}
                                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                  aria-label="More options"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                                {/* )} */}

                                {portalContainer &&
                                  actionMenuOpen === recipient._id &&
                                  createPortal(
                                    <div
                                      className="absolute"
                                      style={{
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                      }}
                                    >
                                      <div
                                        className="action-menu-dropdown absolute z-50"
                                        style={{
                                          width: "300px",
                                          left: `${getMenuPosition(`mobile-${recipient._id}`).left - 250}px`,
                                          top: `${getMenuPosition(`mobile-${recipient._id}`).top}px`,
                                          transform: getMenuPosition(`mobile-${recipient._id}`).direction === "up" ? "translateY(-100%)" : "translateY(0)",
                                          pointerEvents: "auto",
                                        }}
                                      >
                                        <div
                                          className={`bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200 overflow-hidden`}
                                          style={{
                                            transformOrigin:
                                              getMenuPosition(
                                                `mobile-${recipient._id}`
                                              ).direction === "up"
                                                ? "bottom right"
                                                : "top right",
                                            animation:
                                              "menuFadeIn 0.2s ease forwards",
                                          }}
                                        >
                                          <div className="py-1.5 px-2">
                                            {(() => {
                                              const menuContent = getMenuContent(recipient);

                                              if (menuContent.type === 'empty') {
                                                return (
                                                  <div className="flex items-center w-full px-3 py-2.5 text-sm text-gray-500">
                                                    <div className="mr-2.5 p-1.5 rounded-full bg-gray-100">
                                                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                      </svg>
                                                    </div>
                                                    <span>{menuContent.label}</span>
                                                  </div>
                                                );
                                              }

                                              return (
                                                <button
                                                  onMouseUp={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();

                                                    const url = menuContent.url;
                                                    navigator.clipboard.writeText(url).then(() => {
                                                      setShowCopySuccess(`${menuContent.type}-${recipient._id}`);
                                                      setTimeout(() => setShowCopySuccess(null), 2000);
                                                      setTimeout(() => setActionMenuOpen(null), 100);
                                                    }).catch(() => {
                                                      // Fallback for older browsers
                                                      const textArea = document.createElement("textarea");
                                                      textArea.value = url;
                                                      document.body.appendChild(textArea);
                                                      textArea.select();
                                                      document.execCommand("copy");
                                                      document.body.removeChild(textArea);
                                                      setShowCopySuccess(`${menuContent.type}-${recipient._id}`);
                                                      setTimeout(() => setShowCopySuccess(null), 2000);
                                                      setTimeout(() => setActionMenuOpen(null), 100);
                                                    });
                                                  }}
                                                  className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 group"
                                                >
                                                  <div
                                                    className={`mr-2.5 p-1.5 rounded-full group-hover:bg-purple-50
                                                      transition-colors duration-150 ${showCopySuccess === `${menuContent.type}-${recipient._id}`
                                                        ? "bg-green-50"
                                                        : "bg-gray-100"
                                                      }`}
                                                  >
                                                    {showCopySuccess === `${menuContent.type}-${recipient._id}` ? (
                                                      <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                      <Copy className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                                                    )}
                                                  </div>
                                                  <span>{menuContent.label}</span>
                                                </button>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>,
                                    actionButtonRefs.current[
                                      `mobile-${recipient._id}`
                                    ]?.parentElement || document.body
                                  )}
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="px-4 py-3 space-y-4">
                              {/* Company & Role - Combined in one div */}
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Company & Role
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {recipient.company}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {recipient.title}
                                </p>
                              </div>

                              {/* Status */}
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Status
                                </p>
                                <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-blue-700">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
                                  <span className="text-sm">
                                    {recipient.status.charAt(0).toUpperCase() +
                                      recipient.status.slice(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Gift */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mr-2">
                                  <Image
                                    src={
                                      recipient.assignedGift?.primaryImgUrl ||
                                      "/loading.png"
                                    }
                                    alt={
                                      recipient.assignedGift?.name ||
                                      "Gift image"
                                    }
                                    className="h-10 w-10 object-cover rounded-md"
                                    onError={(e) => {
                                      e.currentTarget.src = "/loading.png";
                                    }}
                                    width={40}
                                    height={40}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {recipient.assignedGift?.name}
                                  </div>
                                  <div className="text-sm text-gray-500 line-clamp-2 max-h-10 overflow-hidden">
                                    {recipient.assignedGift?.descShort}
                                  </div>
                                  {recipient.assignedGift?.price &&
                                    recipient.assignedGift.price > 0 &&
                                    recipient.status !== "InvitationSend" && (
                                      <div className="text-sm font-medium text-gray-900 mt-0.5">
                                        $
                                        {recipient.assignedGift.price.toLocaleString()}
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Key Dates */}
                              {(recipient.deliveryDetails?.deliveredDate ||
                                recipient.deliveryDetails?.acknowledgedAt ||
                                recipient.deliveryDetails?.declinedDate ||
                                recipient.deliveryDetails?.estimatedDelivery ||
                                recipient.deliveryDetails?.issueDate) && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                      Key Dates
                                    </p>
                                    <div className="space-y-2">
                                      {recipient.deliveryDetails
                                        ?.deliveredDate && (
                                          <div className="flex items-center text-sm">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <rect
                                                x="2"
                                                y="4"
                                                width="20"
                                                height="16"
                                                rx="2"
                                              />
                                              <line x1="2" y1="8" x2="22" y2="8" />
                                              <path d="M12 12v4" />
                                              <path d="M9 12v4" />
                                              <path d="M15 12v4" />
                                            </svg>
                                            <span>
                                              Delivered:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.deliveredDate
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails
                                        ?.acknowledgedAt && (
                                          <div className="flex items-center text-sm">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                              Acknowledged:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.acknowledgedAt
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails
                                        ?.declinedDate && (
                                          <div className="flex items-center text-sm">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <circle cx="12" cy="12" r="10" />
                                              <path d="M15 9l-6 6M9 9l6 6" />
                                            </svg>
                                            <span>
                                              Declined:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.declinedDate
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {!recipient.deliveryDetails
                                        ?.deliveredDate &&
                                        recipient.deliveryDetails
                                          ?.estimatedDelivery && (
                                          <div className="flex items-center text-sm">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1.5 flex-shrink-0 text-amber-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <rect
                                                x="3"
                                                y="4"
                                                width="18"
                                                height="16"
                                                rx="2"
                                              />
                                              <line
                                                x1="16"
                                                y1="2"
                                                x2="16"
                                                y2="6"
                                              />
                                              <line x1="8" y1="2" x2="8" y2="6" />
                                              <line
                                                x1="3"
                                                y1="10"
                                                x2="21"
                                                y2="10"
                                              />
                                            </svg>
                                            <span>
                                              Est. Delivery:{" "}
                                              {formatDate(
                                                recipient.deliveryDetails
                                                  ?.estimatedDelivery
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {recipient.deliveryDetails?.issueDate && (
                                        <div className="flex items-center text-sm">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1.5 flex-shrink-0 text-yellow-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span>
                                            Issue:{" "}
                                            {formatDate(
                                              recipient.deliveryDetails?.issueDate
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Feedback - Simplified to only show icon */}
                              {recipient.feedback && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-500 mb-1">
                                    Feedback
                                  </p>

                                  {recipient.feedback?.message?.mediaUrl && (
                                    <div>
                                      <button
                                        onClick={() =>
                                          setShowVideoModal(recipient._id)
                                        }
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full hover:bg-gray-100 transition-colors"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <circle cx="12" cy="12" r="10" />
                                          <polygon points="10 8 16 12 10 16 10 8" />
                                        </svg>
                                      </button>

                                      {showVideoModal === recipient._id && (
                                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                          <div className="bg-white rounded-lg w-full max-w-4xl mx-auto">
                                            <div className="flex justify-between items-center p-4 border-b">
                                              <h3 className="text-lg font-semibold">
                                                Feedback Video
                                              </h3>
                                              <button
                                                onClick={() =>
                                                  setShowVideoModal(null)
                                                }
                                                className="text-gray-500 hover:text-gray-700"
                                              >
                                                <svg
                                                  width="24"
                                                  height="24"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                </svg>
                                              </button>
                                            </div>
                                            <div
                                              className="relative w-full"
                                              style={{ paddingTop: "56.25%" }}
                                            >
                                              <video
                                                src={
                                                  recipient.feedback?.message
                                                    ?.mediaUrl
                                                }
                                                controls
                                                className="absolute inset-0 w-full h-full object-contain bg-black"
                                                playsInline
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {renderFeedback(
                                    recipient.feedback,
                                    recipient.name
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 py-3 border-t border-gray-200">
                        <div className="flex items-center mb-3 sm:mb-0">
                          <span className="text-sm text-gray-700">
                            Showing{" "}
                            <span className="font-medium">
                              {indexOfFirstRecipient + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                              {Math.min(indexOfLastRecipient, totalRecipients)}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                              {totalRecipients}
                            </span>{" "}
                            recipients
                          </span>

                          <div className="ml-4">
                            <select
                              className="border border-gray-200 rounded-md text-sm py-1 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                              value={pageSize}
                              onChange={handlePageSizeChange}
                            >
                              {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                  {size} per page
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Go to first page"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Go to previous page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <div className="px-4 py-1.5 text-sm text-gray-700">
                            <span className="font-medium">{currentPage}</span> /{" "}
                            {totalPages}
                          </div>

                          <button
                            onClick={goToNextPage}
                            disabled={
                              currentPage === totalPages || totalPages === 0
                            }
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Go to next page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={goToLastPage}
                            disabled={
                              currentPage === totalPages || totalPages === 0
                            }
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Go to last page"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recipient Experience Tab */}
                  {activeTab === "experience" && (
                    <div className="space-y-10">


                      {/* Custom Message Section */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-md font-medium">
                            Custom Message
                          </h3>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600 text-sm mb-4">
                            This personalized message will appear on the landing
                            page and in notification emails.
                          </p>

                          <EditableCardPreview
                            customMessage={customMessage}
                            logoUrl={logoUrl}
                            editable={false}
                          />

                          {/* <div className="border border-gray-300 rounded-md mb-3">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center space-x-2">
                              <div className="text-xs text-gray-500">
                                Placeholders:
                                <span className="ml-1 px-2 py-1 bg-gray-200 rounded text-xs">
                                  {"{{recipient.name}}"}
                                </span>
                                <span className="ml-1 px-2 py-1 bg-gray-200 rounded text-xs">
                                  {"{{sender.name}}"}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-b-md">
                              <div className="whitespace-pre-line text-sm text-gray-800">
                                {message}
                              </div>
                            </div>
                          </div> */}
                        </div>
                      </div>

                      {/* Landing Page Template Section */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-md font-medium">
                            Landing Page Template
                          </h3>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600 text-sm mb-6">
                            This is the template recipients will see when they
                            claim their gift.
                          </p>

                          {/* Landing Page Preview */}
                          {campaign?.landingPageConfig ? (
                            <div
                              className="w-full h-[800px] mx-auto relative rounded-lg overflow-hidden shadow-lg"
                              style={getBackgroundStyle(
                                campaign.landingPageConfig
                              )}
                            >
                              {/* Main Content */}
                              <div className="relative w-full px-4 sm:px-6 md:px-[6%] mx-auto pb-1 flex-grow">
                                <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start mt-6 md:mt-10">
                                  {/* Left Side - Text Content */}
                                  <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
                                    {/* Logo above headline, top-left aligned with headline */}
                                    {campaign.landingPageConfig.logo.url && campaign.landingPageConfig.logo.url.trim() && (
                                      <div className="mb-4">
                                        <img
                                          src={campaign.landingPageConfig.logo.url}
                                          alt="Company Logo"
                                          className="h-8 md:h-10 object-contain"
                                          onError={(e) => {
                                            // Hide the logo container if image fails to load
                                            const logoContainer = e.currentTarget.parentElement;
                                            if (logoContainer) {
                                              logoContainer.style.display = 'none';
                                            }
                                          }}
                                        />
                                      </div>
                                    )}

                                    <div className="space-y-2 md:space-y-4 lg:space-y-6 relative z-10">
                                      <h1
                                        className="text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-bold leading-tight"
                                        style={{
                                          color:
                                            campaign.landingPageConfig.content
                                              .headlineColor,
                                        }}
                                      >
                                        {renderDynamicText(
                                          campaign.landingPageConfig.content
                                            .headline
                                        )}
                                      </h1>
                                      <p
                                        className="text-sm sm:text-base md:text-lg lg:text-2xl font-medium"
                                        style={{
                                          color:
                                            campaign.landingPageConfig.content
                                              .descriptionColor,
                                        }}
                                      >
                                        {renderDynamicText(
                                          campaign.landingPageConfig.content
                                            .description
                                        )}
                                      </p>
                                    </div>

                                    {/* Date Field */}
                                    {campaign.landingPageConfig.date
                                      .enabled && (
                                        <div
                                          className="flex items-center gap-2 font-medium text-base"
                                          style={{
                                            color:
                                              campaign.landingPageConfig.date
                                                .color,
                                          }}
                                        >
                                          <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                          {campaign.landingPageConfig.date.value
                                            ? campaign.landingPageConfig.date
                                              .value instanceof Date
                                              ? campaign.landingPageConfig.date.value.toLocaleDateString(
                                                "en-US",
                                                {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                }
                                              )
                                              : new Date(
                                                campaign.landingPageConfig.date.value
                                              ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              })
                                            : "June 5, 2025"}
                                        </div>
                                      )}

                                    {/* Action buttons below content if no media */}
                                    {!((campaign.landingPageConfig.media.type === "image" && campaign.landingPageConfig.media.imageUrl && campaign.landingPageConfig.media.imageUrl.trim()) ||
                                      (campaign.landingPageConfig.media.type === "video" && campaign.landingPageConfig.media.videoUrl && campaign.landingPageConfig.media.videoUrl.trim())) && (
                                        <div className="w-full">
                                          <div className="flex flex-col md:flex-row gap-3 justify-start">
                                            {campaign.landingPageConfig?.actionButtons.primary.enabled &&
                                              campaign.landingPageConfig?.actionButtons.primary.text &&
                                              campaign.landingPageConfig?.actionButtons.primary.text.trim() &&
                                              campaign.landingPageConfig?.actionButtons.primary.url &&
                                              campaign.landingPageConfig?.actionButtons.primary.url.trim() && (
                                                <button
                                                  className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 animate-pulse-attention rounded-lg transition-all duration-200"
                                                  style={{
                                                    backgroundColor:
                                                      campaign.landingPageConfig
                                                        .actionButtons.primary.color,
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      campaign.landingPageConfig
                                                        ?.actionButtons.primary.url
                                                    ) {
                                                      window.open(
                                                        campaign.landingPageConfig
                                                          .actionButtons.primary.url,
                                                        "_blank"
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {
                                                    campaign.landingPageConfig
                                                      .actionButtons.primary.text
                                                  }
                                                </button>
                                              )}
                                            {campaign.landingPageConfig?.actionButtons.secondary.enabled &&
                                              campaign.landingPageConfig?.actionButtons.secondary.text &&
                                              campaign.landingPageConfig?.actionButtons.secondary.text.trim() &&
                                              campaign.landingPageConfig?.actionButtons.secondary.url &&
                                              campaign.landingPageConfig?.actionButtons.secondary.url.trim() && (
                                                <button
                                                  className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 rounded-lg transition-all duration-200"
                                                  style={{
                                                    backgroundColor:
                                                      campaign.landingPageConfig
                                                        .actionButtons.secondary
                                                        .color,
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      campaign.landingPageConfig
                                                        ?.actionButtons.secondary.url
                                                    ) {
                                                      window.open(
                                                        campaign.landingPageConfig
                                                          .actionButtons.secondary
                                                          .url,
                                                        "_blank"
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {
                                                    campaign.landingPageConfig
                                                      .actionButtons.secondary.text
                                                  }
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      )}
                                  </div>

                                  {/* Right Side - Media and Action Buttons (when media is present) */}
                                  {((campaign.landingPageConfig.media.type === "image" && campaign.landingPageConfig.media.imageUrl && campaign.landingPageConfig.media.imageUrl.trim()) ||
                                    (campaign.landingPageConfig.media.type === "video" && campaign.landingPageConfig.media.videoUrl && campaign.landingPageConfig.media.videoUrl.trim())) && (
                                      <div className="w-full md:w-[55%] mt-0 md:mt-20 relative flex-shrink-0 flex flex-col gap-4">
                                        {/* Media Section */}
                                        <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                                          {campaign.landingPageConfig.media.type ===
                                            "image" ? (
                                            campaign.landingPageConfig.media
                                              .imageUrl && campaign.landingPageConfig.media.imageUrl.trim() && (
                                              <img
                                                src={
                                                  campaign.landingPageConfig.media
                                                    .imageUrl
                                                }
                                                alt="Resource"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  // Hide the media container if image fails to load
                                                  const mediaContainer = e.currentTarget.closest('div[class*="aspect-video"]');
                                                  if (mediaContainer) {
                                                    (mediaContainer as HTMLElement).style.display = 'none';
                                                  }
                                                }}
                                              />
                                            )
                                          ) : (
                                            campaign.landingPageConfig.media.videoUrl && campaign.landingPageConfig.media.videoUrl.trim() && (
                                              <VideoPlayer
                                                url={
                                                  campaign.landingPageConfig.media
                                                    .videoUrl
                                                }
                                                className="w-full h-full"
                                              />
                                            )
                                          )}
                                        </div>

                                        {/* Action buttons below media on the right */}
                                        <div className="w-full">
                                          <div className="flex flex-col md:flex-row gap-3 justify-center">
                                            {campaign.landingPageConfig?.actionButtons.primary.enabled &&
                                              campaign.landingPageConfig?.actionButtons.primary.text &&
                                              campaign.landingPageConfig?.actionButtons.primary.text.trim() &&
                                              campaign.landingPageConfig?.actionButtons.primary.url &&
                                              campaign.landingPageConfig?.actionButtons.primary.url.trim() && (
                                                <button
                                                  className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 animate-pulse-attention rounded-lg transition-all duration-200"
                                                  style={{
                                                    backgroundColor:
                                                      campaign.landingPageConfig
                                                        .actionButtons.primary.color,
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      campaign.landingPageConfig
                                                        ?.actionButtons.primary.url
                                                    ) {
                                                      window.open(
                                                        campaign.landingPageConfig
                                                          .actionButtons.primary.url,
                                                        "_blank"
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {
                                                    campaign.landingPageConfig
                                                      .actionButtons.primary.text
                                                  }
                                                </button>
                                              )}
                                            {campaign.landingPageConfig?.actionButtons.secondary.enabled &&
                                              campaign.landingPageConfig?.actionButtons.secondary.text &&
                                              campaign.landingPageConfig?.actionButtons.secondary.text.trim() &&
                                              campaign.landingPageConfig?.actionButtons.secondary.url &&
                                              campaign.landingPageConfig?.actionButtons.secondary.url.trim() && (
                                                <button
                                                  className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 rounded-lg transition-all duration-200"
                                                  style={{
                                                    backgroundColor:
                                                      campaign.landingPageConfig
                                                        .actionButtons.secondary
                                                        .color,
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      campaign.landingPageConfig
                                                        ?.actionButtons.secondary.url
                                                    ) {
                                                      window.open(
                                                        campaign.landingPageConfig
                                                          .actionButtons.secondary
                                                          .url,
                                                        "_blank"
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {
                                                    campaign.landingPageConfig
                                                      .actionButtons.secondary.text
                                                  }
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="absolute bottom-0 left-0 right-0 w-full px-4 sm:px-6 lg:px-8 py-4">
                                <div className="grid gap-3 pt-3 border-t-[1px] border-gray-400 border-dotted">
                                  <div className="flex flex-col sm:flex-row text-xs md:text-sm items-center gap-4 sm:justify-between text-center sm:text-left">
                                    <div>
                                      <span className="font-semibold">
                                        Made with
                                      </span>{" "}
                                      ❤️{" "}
                                      <span className="font-medium">
                                        delightl
                                        <span className="text-primary">oo</span>
                                        p
                                      </span>{" "}
                                      🎁 Loved this experience? Discover how
                                      leading teams create moments like this —
                                      at scale, with AI.
                                    </div>
                                    <a
                                      href="https://www.delightloop.com/bookademo"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-3 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-[10px] md:text-xs"
                                    >
                                      Get Started →
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Fallback for campaigns without landingPageConfig
                            <div className="bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] w-full h-[800px] mx-auto rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <div className="bg-white rounded-lg p-8 shadow-lg max-w-md">
                                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Landing Page Template
                                  </h3>
                                  <p className="text-gray-600 mb-4">
                                    No landing page configuration found for this
                                    campaign.
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    The landing page template will be available
                                    once configured in the campaign settings.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analytics Tab */}
                  {activeTab === "analytics" && (
                    <div className="space-y-6">
                      <AnalyticsOverview
                        recipients={recipients ? transformRecipientsToTouchpointAnalytics(recipients) : []}
                      />
                    </div>
                  )}

                  {activeTab === "meetings" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold mb-4">
                          Meeting Calendar
                        </h2>
                        <p className="text-gray-600 mb-6">
                          View scheduled meetings and available time slots.
                        </p>
                      </div>

                      {/* Meeting Calendar Component */}
                      <MeetingCalendar campaign={campaign} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {allGiftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-[350px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select a Gift</h2>
              <button
                onClick={() => {
                  setAllGiftsModalOpen(false);
                  setSelectedGiftId("");
                  setSelectedRecipientId("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 overflow-y-auto max-h-[80vh]">
              {allGifts.map((gift) => (
                <label
                  key={gift._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="giftSelection"
                    value={gift._id}
                    checked={selectedGiftId === gift._id}
                    onChange={() => setSelectedGiftId(gift._id)}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-[60px] h-[60px] relative">
                      <Image
                        src={gift?.images?.primaryImgUrl || "/loading.png"}
                        alt={gift.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/loading.png";
                        }}
                      />
                    </div>
                    <div className="text-sm font-medium grid gap-1">
                      <div className="text-gray-900">{gift.name}</div>
                      <div className="text-xs text-gray-500">${gift.price}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedGiftId("");
                  setAllGiftsModalOpen(false);
                  setSelectedRecipientId("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedGiftId}
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  if (selectedGiftId && selectedRecipientId) {
                    handleAssignGiftToRecipient(
                      selectedGiftId,
                      selectedRecipientId
                    );
                  }
                }}
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Feedback Modal with Compact Design */}
      {showFeedbackModal && selectedFeedback && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Feedback from {selectedFeedback.name}
                  </h3>
                  <p className="text-xs text-gray-500">All feedback and messages</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Reaction Feedback */}
              {selectedFeedback.reaction && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center h-6 w-6 rounded-full ${selectedFeedback.reaction === "thumbs_up"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                        }`}>
                        {selectedFeedback.reaction === "thumbs_up" ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedFeedback.reaction === "thumbs_up" ? "Positive" : "Negative"} Feedback
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatFullDateTime(selectedFeedback.reactionTimestamp || new Date().toISOString())}
                    </div>
                  </div>
                  {selectedFeedback.message && (
                    <div className="text-sm text-gray-600 bg-white rounded p-2 border-l-2 border-gray-200">
                      {selectedFeedback.message}
                    </div>
                  )}
                </div>
              )}

              {/* Text Message */}
              {selectedFeedback.textMessage && (
                <div className="bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                        <MessageSquareText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Text Message</span>
                    </div>
                    {selectedFeedback.textMessageTimestamp && (
                      <div className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatFullDateTime(selectedFeedback.textMessageTimestamp)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 bg-white rounded p-2 border-l-2 border-green-300">
                    {selectedFeedback.textMessage}
                  </div>
                </div>
              )}

              {/* Video Message */}
              {selectedFeedback.videoMessage && (
                <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Video Message</span>
                    </div>
                    {selectedFeedback.videoMessageTimestamp && (
                      <div className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatFullDateTime(selectedFeedback.videoMessageTimestamp)}
                      </div>
                    )}
                  </div>
                  <div className="bg-black rounded overflow-hidden">
                    <video
                      src={selectedFeedback.videoMessage}
                      controls
                      className="w-full max-h-48"
                      playsInline
                    />
                  </div>
                </div>
              )}

              {/* Audio Message */}
              {selectedFeedback.audioMessage && (
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Audio Message</span>
                    </div>
                    {selectedFeedback.audioMessageTimestamp && (
                      <div className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatFullDateTime(selectedFeedback.audioMessageTimestamp)}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded p-2 border border-blue-200">
                    <audio
                      src={selectedFeedback.audioMessage}
                      controls
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              {/* Legacy Message */}
              {selectedFeedback.legacyMessage &&
                !selectedFeedback.textMessage &&
                !selectedFeedback.videoMessage &&
                !selectedFeedback.audioMessage && (
                  <div className="bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-600">
                          {selectedFeedback.legacyMessage.mediaUrl ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <MessageSquareText className="h-4 w-4" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {selectedFeedback.legacyMessage.mediaUrl ? "Video Message" : "Message"}
                        </span>
                      </div>
                    </div>
                    {selectedFeedback.legacyMessage.mediaUrl ? (
                      <div className="bg-black rounded overflow-hidden">
                        <video
                          src={selectedFeedback.legacyMessage.mediaUrl}
                          controls
                          className="w-full max-h-48"
                          playsInline
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 bg-white rounded p-2 border-l-2 border-amber-300">
                        {selectedFeedback.legacyMessage.content ||
                          selectedFeedback.message ||
                          "No message content provided."}
                      </div>
                    )}
                  </div>
                )}

              {/* General Message */}
              {selectedFeedback.message &&
                !selectedFeedback.textMessage &&
                !selectedFeedback.videoMessage &&
                !selectedFeedback.audioMessage &&
                !selectedFeedback.legacyMessage && (
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-600">
                        <MessageSquareText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Message</span>
                    </div>
                    <div className="text-sm text-gray-700 bg-white rounded p-2 border-l-2 border-gray-300">
                      {selectedFeedback.message}
                    </div>
                  </div>
                )}

              {/* No Content */}
              {!selectedFeedback.reaction &&
                !selectedFeedback.textMessage &&
                !selectedFeedback.videoMessage &&
                !selectedFeedback.audioMessage &&
                !selectedFeedback.legacyMessage &&
                !selectedFeedback.message && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquareText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No feedback content available</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}


    </>
  );
}

// Add this function before the other helper functions
const countFeedbackEntries = (recipients: Recipient[]): number => {
  return recipients.reduce((count, recipient) => {
    if (recipient.feedback) {
      // Count if there's any feedback (reaction1, reaction2, or message)
      if (
        recipient.feedback.reaction1 ||
        recipient.feedback.reaction2 ||
        recipient.feedback.message
      ) {
        return count + 1;
      }
    }
    return count;
  }, 0);
};

// // Update the loadRecipients function to include feedback count
// const loadRecipients = async (
//   campaignId: string,
//   campaignBudget: number = 0
// ) => {
//   // ... existing code ...
//   try {
//     // ... existing code ...
//     setRecipients(processedRecipients);

//     // Update stats with feedback count
//     setStats((prevStats) => ({
//       ...prevStats,
//       feedbackCount: countFeedbackEntries(processedRecipients),
//     }));

//     // ... rest of existing code ...
//   } catch (error) {
//     // ... existing error handling ...
//   }
// };
