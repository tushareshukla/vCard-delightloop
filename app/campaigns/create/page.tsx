"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { motion as FramerMotion } from "framer-motion";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import Link from "next/link";
import {
  createCampaign,
  updateCampaign,
  updateMotion,
  addRecipients,
  runCampaign,
  setSmartMatchGifts,
  setSingleGift,
  setRecipientsChoiceGifts,
  updateLandingPageConfig,
  updateGiftCard,
  updateEmailTemplates,
  type LandingPageConfig,
  type GiftCard,
  type CampaignEmailTemplates,
} from "@/lib/api/campaigns2";
import CampaignLaunchSuccessModal from "@/components/shared/CampaignLaunchSuccessModal";
import InfinityLoader from "@/components/common/InfinityLoader";
import {
  MapPin,
  Plus,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  CalendarDays,
  LineChart,
  Package,
  Heart,
  ArrowLeftRight,
  ArrowLeft,
  Globe,
  Loader2,
  Calendar,
  Link as LinkIcon,
  Users,
  Database,
  Upload,
  Target,
  Megaphone,
  Info,
  CalendarRange,
  UserPlus,
  Tent,
  CalendarClock,
  ThumbsUp,
  Building,
  History,
  Flame,
  Award,
  Rocket,
  ArrowRightLeft,
  Gift,
  Trophy,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";

// Import MotionSelect component
import { MotionSelect } from "@/components/ui/motion-select";
import CampaignDesigner from "@/components/create-campaign/CampaignDesigner";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

// Add hover animation variants
const cardHoverVariants = {
  initial: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 },
  },
};

// Campaign goal options
const campaignGoals = [
  {
    id: "drive-event",
    title: "Drive Event",
    description: "Maximize ROI from Events",
    icon: CalendarDays,
    color: "bg-blue-100 text-blue-600",
    motions: [
      {
        id: "boost-registration",
        title: "Boost Registration",
        description:
          "Converts cold/warm leads into registrants using a thoughtful nudge",
        contextQuestion:
          "Which event would you like to boost registrations for?",
        icon: "userPlus",
      },
      {
        id: "ensure-attendance",
        title: "Ensure Attendance",
        description:
          "Combat drop-offs and no-shows with friendly reminder + incentive",
        contextQuestion: "Which event would you like to ensure attendance for?",
        icon: "calendarClock",
      },
      {
        id: "booth-pickup",
        title: "Booth Pickup",
        description: "Nudges to visit the booth (and pick up a cool gift)",
        contextQuestion: "Which event will you be exhibiting at?",
        icon: "tent",
      },
      {
        id: "book-meetings",
        title: "Book 1:1 Meetings",
        description: "Drive deeper engagement with top-tier attendees",
        contextQuestion: "Which event would you like to book meetings for?",
        icon: "calendar",
      },
      {
        id: "thank-you",
        title: "Thank You",
        description: "Keep the conversation alive while the memory is fresh",
        contextQuestion:
          "Which event would you like to send thank you gifts for?",
        icon: "thumbsUp",
      },
    ],
  },
  {
    id: "pipeline-acceleration",
    title: "Pipeline Acceleration",
    description: "Move Deals Faster",
    icon: LineChart,
    color: "bg-green-100 text-green-600",
    motions: [
      {
        id: "break-into-accounts",
        title: "Break into Target Accounts",
        description:
          "Get attention from key decision makers at target accounts",
        contextQuestion: "What types of accounts are you targeting?",
        icon: "building",
      },
      {
        id: "reengage-cold-leads",
        title: "Re-engage Cold Leads",
        description: "Warm up leads that have gone quiet",
        contextQuestion: "What segment of cold leads are you targeting?",
        icon: "history",
      },
      {
        id: "nurture-warm-leads",
        title: "Nurture Warm Leads",
        description: "Keep momentum with engaged prospects",
        contextQuestion: "What type of warm leads are you nurturing?",
        icon: "flame",
      },
      {
        id: "champion-activation",
        title: "Champion Activation",
        description: "Empower internal champions to advocate for you",
        contextQuestion: "Who are your champions at target accounts?",
        icon: "award",
      },
    ],
  },
  {
    id: "product-launch",
    title: "Product Launch & Takeout",
    description: "Activate Awareness Around Your Product",
    icon: Package,
    color: "bg-purple-100 text-purple-600",
    motions: [
      {
        id: "product-launch",
        title: "Product Launch",
        description: "Grab attention with a memorable, branded gift",
        contextQuestion: "Which product or feature are you launching?",
        icon: "rocket",
      },
      {
        id: "competitive-takeout",
        title: "Competitive Takeout",
        description: "Deliver a message/gift combo that highlights your edge",
        contextQuestion: "Which competitor's customers are you targeting?",
        icon: "arrowRightLeft",
      },
      {
        id: "migration-nudge",
        title: "Migration Nudge",
        description: "Reduce switching friction with a thoughtful gesture",
        contextQuestion: "What platform are customers migrating from?",
        icon: "arrowLeftRight",
      },
    ],
  },
  {
    id: "customer-relationships",
    title: "Customer Relationships",
    description: "Grow LTV & Retention",
    icon: Heart,
    color: "bg-red-100 text-red-600",
    motions: [
      {
        id: "thank-you-gifts",
        title: "Thank You Gifts",
        description: "Strengthens emotional connection and brand loyalty",
        contextQuestion: "What are you thanking your customers for?",
        icon: "gift",
      },
      {
        id: "anniversary-milestone",
        title: "Anniversary / Milestone",
        description: "Surprise + delight deepens the relationship",
        contextQuestion: "What milestone are you celebrating?",
        icon: "trophy",
      },
      {
        id: "feedback-collection",
        title: "Feedback Collection",
        description: "Ask for NPS, testimonial, or review",
        contextQuestion: "What type of feedback are you collecting?",
        icon: "messageSquare",
      },
      {
        id: "csat-recovery",
        title: "CSAT Recovery",
        description: "Show you care with a recovery nudge",
        contextQuestion: "What issue are you addressing with this recovery?",
        icon: "heartHandshake",
      },
    ],
  },
  {
    id: "quick-send",
    title: "Quick Send",
    description: "Fast, Flexible sending",
    icon: ArrowLeftRight,
    color: "bg-amber-100 text-amber-600",
    motions: [
      {
        id: "express-send",
        title: "Express Send",
        description: "Send gifts to specific recipients now",
        contextQuestion: "What's the occasion for this quick send?",
        icon: "package",
      },
      {
        id: "claim-link",
        title: "Claim Link",
        description: "Generate a reusable gift link you can share with anyone.",
        contextQuestion: "What would you like people to claim?",
        icon: "linkIcon",
      },
    ],
  },
];

// Define interface for events
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

// Define interface for contact lists
interface ContactList {
  id: string;
  name: string;
  count: number;
}

// Loading skeleton component
const CampaignCreateSkeleton = () => {
  return (
    <div className="flex-1 pt-3 bg-primary">
      <div className="p-6 bg-gray-50 rounded-tl-3xl min-h-screen border-l border-gray-200 sm:border-l-0 sm:border-t sm:border-r border-gray-100 shadow-lg">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="px-6 md:px-8">
            <div className="h-5 bg-gray-200 rounded-md w-40 mb-6"></div>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="h-8 bg-gray-200 rounded-md w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-96"></div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <div className="h-10 bg-gray-200 rounded-md w-24"></div>
                <div className="h-10 bg-gray-200 rounded-md w-32"></div>
              </div>
            </div>
            <div className="h-px bg-gray-200 w-full mt-5"></div>
          </div>

          {/* Step indicator Skeleton */}
          <div className="mb-8 mt-6 px-6 md:px-8 flex justify-center">
            <div className="h-6 bg-gray-200 rounded-md w-64"></div>
          </div>

          {/* Main content Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 mx-6 md:mx-8 p-6 md:p-8">
            <div className="h-6 bg-gray-200 rounded-md w-72 mb-8"></div>

            {/* Goal cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 h-32 animate-pulse"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get status class
const getStatusClass = (status: string | undefined) => {
  if (!status) return "bg-yellow-100 text-yellow-700";

  const statusLower = status.toLowerCase();
  if (statusLower === "upcoming") return "bg-green-100 text-green-700";
  if (["active", "live"].includes(statusLower))
    return "bg-blue-100 text-blue-700";
  if (["past", "completed"].includes(statusLower))
    return "bg-gray-100 text-gray-700";
  if (statusLower === "archived") return "bg-gray-200 text-gray-500";
  if (statusLower === "draft") return "bg-amber-100 text-amber-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function CampaignCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();

  // API configuration (no initialization needed!)
  const apiUrl = process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL || "";

  // Launch error state
  const [launchError, setLaunchError] = useState<string | null>(null);

  // State management
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedMotion, setSelectedMotion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<"existing" | "url" | null>(
    null
  );
  const [eventUrl, setEventUrl] = useState("");
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextData, setContextData] = useState("");
  const [recipientSource, setRecipientSource] = useState<
    "saved" | "crm" | "upload" | null
  >(null);
  const [savedLists, setSavedLists] = useState<ContactList[]>([]);
  const [crmLists, setCrmLists] = useState<ContactList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "goal-selection" | "campaign-designer"
  >("goal-selection");
  const [mockRecipients, setMockRecipients] = useState<any[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isAutoLoadingEvent, setIsAutoLoadingEvent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [launchedCampaignId, setLaunchedCampaignId] = useState<string | null>(
    null
  );
  const [boothGiveawayCTALink, setBoothGiveawayCTALink] = useState<
    string | null
  >(null);
  const [isLaunching, setIsLaunching] = useState(false);


  // =============================================
  // GIFT TYPE STATE MANAGEMENT (No UI Changes)
  // =============================================

  // Gift type management
  const [giftTypeMode, setGiftTypeMode] = useState<
    "manual_gift" | "multi_gift" | "hyper_personalize"
  >("manual_gift");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<Gift[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [giftBudget, setGiftBudget] = useState(15); // Default budget set to 15
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [gifts, setGifts] = useState<Map<string, Gift>>(new Map());
  const [recommendedGifts, setRecommendedGifts] = useState<Gift[]>([]);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [allGiftsUnfiltered, setAllGiftsUnfiltered] = useState<Gift[]>([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [allCampaignData, setAllCampaignData] = useState<any>(null);


  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [lastKnownPrice, setLastKnownPrice] = useState<number>(0);

  const showNotification = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Function to fetch wallet balance
//   const fetchWalletBalance = async () => {
//     if (!userId || !authToken || !apiUrl) {
//       console.log("⚠️ Cannot fetch wallet balance: Missing auth data");
//       return;
//     }

//     try {
//       setIsLoadingWallet(true);
//       console.log("💰 Fetching wallet balance...");

//       const response = await fetch(
//         `${apiUrl}/v1/${userId}/wallet/check-balance`,
//         {
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Wallet API error: ${response.status}`);
//       }

//       const walletData = await response.json();
//       console.log("💰 Raw wallet API response:", walletData);
//       console.log("💰 wallet object:", walletData.wallet);
//       console.log("💰 current_balance:", walletData.wallet?.current_balance);

//       // Extract balance from the actual API response structure
//       const balance = walletData.wallet?.current_balance ||
//                      walletData.current_balance ||
//                      walletData.balance ||
//                      walletData.available_balance || 0;

//       console.log("💰 Extracted balance:", balance);

//       setWalletBalance(balance);
//       console.log("💰 Wallet balance fetched:", balance);

//     } catch (error) {
//       console.error("❌ Failed to fetch wallet balance:", error);
//       setWalletBalance(null);
//     } finally {
//       setIsLoadingWallet(false);
//     }
//   };

  // Function to check if there are insufficient funds
//   const checkInsufficientFunds = () => {
//     if (currentStep !== "campaign-designer" || typeof window === "undefined") {
//       return { hasInsufficientFunds: false, campaignPrice: 0, isWalletLoading: false };
//     }

//     const designerData = (window as any).campaignDesignerState;
//     const campaignPrice = Number(designerData?.budgetTotal) || 0;

//     // If campaign price is 0, don't block
//     if (campaignPrice === 0) {
//       return { hasInsufficientFunds: false, campaignPrice, isWalletLoading: false };
//     }

//     // If wallet balance is still loading, block the action
//     if (isLoadingWallet) {
//       return { hasInsufficientFunds: true, campaignPrice, isWalletLoading: true };
//     }

//     // If wallet balance is null (failed to load), block the action for safety
//     if (walletBalance === null) {
//       return { hasInsufficientFunds: true, campaignPrice, isWalletLoading: false };
//     }

//     const hasInsufficientFunds = campaignPrice > walletBalance;

//     if (hasInsufficientFunds) {
//       console.log(`💸 Insufficient funds: Campaign ($${campaignPrice}) > Wallet ($${walletBalance})`);
//     }

//     return { hasInsufficientFunds, campaignPrice, isWalletLoading: false };
//   };

  // Gift type interfaces
  interface Gift {
    _id: string;
    name: string;
    price: number;
    descShort: string;
    category?: string;
    images: {
      primaryImgUrl: string;
      secondaryImgUrl?: string;
    };
    sku?: string;
    rationale?: string;
    confidence_score?: string;
  }

  interface Bundle {
    _id: string;
    bundleId: string;
    bundleName: string;
    description: string;
    imgUrl: string;
    isAvailable: boolean;
    gifts: Array<{
      giftId: string;
      name: string;
      shortDescription: string;
      inventory: number;
      imageUrl: string;
    }>;
  }

  // Get the selected goal object
  const selectedGoalObj = campaignGoals.find(
    (goal) => goal.id === selectedGoal
  );

  // Get the selected motion object
  const selectedMotionObj = selectedGoalObj?.motions.find(
    (motion) => motion.id === selectedMotion
  );

  // Create motion options for MotionSelect
  const motionOptions =
    selectedGoalObj?.motions.map((motion) => ({
      id: motion.id,
      title: motion.title,
      description: motion.description,
      iconType: motion.icon as
        | "userPlus"
        | "calendarClock"
        | "tent"
        | "calendar"
        | "thumbsUp"
        | "building"
        | "history"
        | "flame"
        | "award"
        | "rocket"
        | "arrowRightLeft"
        | "arrowLeftRight"
        | "gift"
        | "trophy"
        | "messageSquare"
        | "heartHandshake"
        | "package"
        | "linkIcon",
    })) || [];

  // Auth check
  useEffect(() => {
    if (!isLoadingCookies && (!authToken || !userId || !organizationId)) {
      router.push("/auth/login");
      return;
    }

    if (!isLoadingCookies && authToken && userId && organizationId) {
      setIsLoading(false);
    }
  }, [isLoadingCookies, authToken, userId, organizationId, router]);

  // API is ready when auth data is available - no initialization needed!
  const isAPIReady = !!(authToken && organizationId && apiUrl);

  // Handle event ID and campaign ID query parameters
  useEffect(() => {
    const eventId = searchParams.get("eventId");


    if (eventId && !isLoadingCookies && authToken && userId && organizationId) {
      console.log("🎪 Event ID detected in query string:", eventId);

      // Only auto-select if no goal is already selected (don't override user choice)
      if (!selectedGoal) {
        setSelectedGoal("drive-event");
      }

      // Only auto-select if no motion is already selected (don't override user choice)
      if (!selectedMotion) {
        setSelectedMotion("boost-registration");
      }

      // Fetch events and select the specified event
      const autoLoadEvent = async () => {
        try {
          setIsAutoLoadingEvent(true);
          console.log("🎪 Auto-loading events to find event ID:", eventId);

          // Fetch events and get the data directly
          const events = await fetchEvents();
          console.log("🎪 Fetched events:", events.length);

          // Find the event with the specified ID
          const targetEvent = events.find((event) => event.eventId === eventId);

          if (targetEvent) {
            console.log("✅ Found target event:", targetEvent.name);
            setSelectedEvent(targetEvent.eventId);
            setEventSource("existing");
          } else {
            console.error("❌ Event not found after fetching events");
            console.log(
              "Available events:",
              events.map((e) => ({ id: e.eventId, name: e.name }))
            );
            // Show a user-friendly error message
            setEventError(
              `Event with ID ${eventId} not found. Please check the event ID or create a new event.`
            );
          }
        } catch (error) {
          console.error("❌ Error auto-loading event:", error);
          setEventError(
            "Failed to load the specified event. Please try again or select a different event."
          );
        } finally {
          setIsAutoLoadingEvent(false);
        }
      };

      autoLoadEvent();
    }
  }, [
    searchParams,
    isLoadingCookies,
    authToken,
    userId,
    organizationId,
    existingEvents.length,
    selectedGoal,
    selectedMotion,
  ]);

  useEffect(() => {
    console.log("--------- All Campaign Data ---------", allCampaignData);
    const campaignId = searchParams.get("campaignId");

    // STEP 1: Handle campaign ID - just fetch and log data
    if (
      campaignId &&
      !isLoadingCookies &&
      authToken &&
      userId &&
      organizationId
    ) {
      console.log("📄 Campaign ID detected in query string:", campaignId);

      const fetchAndLogCampaign = async () => {
        try {
          console.log("🔄 Starting campaign fetch...");
          console.log("API URL:", apiUrl);
          console.log("Organization ID:", organizationId);
          console.log("Auth Token exists:", !!authToken);

          const { getCampaign } = await import("@/lib/api/campaigns2");
          const campaignData = await getCampaign(
            apiUrl,
            organizationId,
            authToken,
            campaignId
          );

          console.log("✅ RAW CAMPAIGN DATA RECEIVED:");
          console.log("=".repeat(50));
          console.log(JSON.stringify(campaignData, null, 2));
          console.log("=".repeat(50));

          setAllCampaignData(campaignData?.campaign);


          // STEP 2: Populate Goal, Motion, and Event
          console.log("🔄 STEP 2: Populating Goal, Motion, and Event...");

          const campaign = campaignData.campaign || campaignData;

          // 1. Map Goal from backend enum to frontend value
          const goalMapping = {
            delight_event_attendees: "drive-event",
            create_more_pipeline: "pipeline-acceleration",
            reduce_churn: "customer-relationships",
          };

          if (campaign.goal && goalMapping[campaign.goal]) {
            console.log(
              `📌 Setting Goal: ${campaign.goal} → ${
                goalMapping[campaign.goal]
              }`
            );
            setSelectedGoal(goalMapping[campaign.goal]);
          }

          // 2. Set Event ID if available - use existing events or fetch if needed
          if (campaign.eventId) {
            console.log(`📌 Setting Event ID: ${campaign.eventId}`);
            setEventSource("existing");

            // Check if events are already loaded, if not fetch them
            let eventsToSearch = existingEvents;

            if (eventsToSearch.length === 0) {
              console.log(
                `📌 No events loaded yet, fetching events to find: ${campaign.eventId}`
              );
              try {
                eventsToSearch = await fetchEvents();
                console.log(
                  `📌 Events fetched, count: ${eventsToSearch.length}`
                );
              } catch (error) {
                console.error(`❌ Error fetching events:`, error);
                return;
              }
            } else {
              console.log(
                `📌 Using already loaded events, count: ${eventsToSearch.length}`
              );
            }

            const foundEvent = eventsToSearch.find(
              (event) => event.eventId === campaign.eventId
            );
            if (foundEvent) {
              console.log(`📌 Found and selecting event: ${foundEvent.name}`);
              setSelectedEvent(campaign.eventId);
            } else {
              console.log(
                `❌ Event with ID ${campaign.eventId} not found in events list`
              );
              console.log(
                `📋 Available events:`,
                eventsToSearch.map((e) => ({ id: e.eventId, name: e.name }))
              );
            }
          }

          // 3. Set Motion after events are loaded (to avoid triggering duplicate fetch)
          if (campaign.motion) {
            console.log(`📌 Setting Motion: ${campaign.motion}`);
            setSelectedMotion(campaign.motion);
          }

          console.log("✅ STEP 2 COMPLETED: Goal, Motion, and Event populated");
        } catch (error) {
          console.error("❌ Error fetching campaign:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
          });
        }
      };

      fetchAndLogCampaign();
    }
  }, [ isLoadingCookies, authToken, userId, organizationId]);

  // =============================================
  // GIFT TYPE INITIALIZATION EFFECTS
  // =============================================

  // Initialize gift data on component mount
  useEffect(() => {
    if (!isLoadingCookies && authToken && userId && organizationId) {
      console.log("🎁 Initializing gift data...");
      fetchBundles();
    }
  }, [isLoadingCookies, authToken, userId, organizationId]);

  // Initialize gift type when campaign designer loads
  useEffect(() => {
    if (currentStep === "campaign-designer") {
      console.log(
        "🎁 Campaign designer loaded, initializing default gift type..."
      );

      // Default to "One Gift for All" mode if not already set
      if (giftTypeMode === "manual_gift" && bundles.length > 0) {
        handleOneGiftForAllFlow();
      }
    }
  }, [currentStep, bundles.length]);

  // Expose gift type functions to global window for CampaignDesigner integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).campaignGiftFunctions = {
        handleSmartMatchFlow,
        handleOneGiftForAllFlow,
        handleLetRecipientsChooseFlow,
        determineGiftTypeFromDesignerData,
        initializeGiftTypeFromCampaignData,
        getCurrentGiftType: () => giftTypeMode,
        getSelectedGift: () => selectedGift,
        getSelectedGifts: () => selectedGifts,
        getSelectedBundle: () => selectedBundle,
        getGiftBudget: () => giftBudget,
        setGiftBudget: (budget: number) => setGiftBudget(budget),
        getAllGifts: () => allGifts,
        getRecommendedGifts: () => recommendedGifts,
        getBundles: () => bundles,
      };

      // Expose wallet balance functions to global window for CampaignDesigner integration
    //   (window as any).walletFunctions = {
    //     getWalletBalance: () => walletBalance,
    //     isLoadingWallet: () => isLoadingWallet,
    //     checkInsufficientFunds: checkInsufficientFunds,
    //     fetchWalletBalance: fetchWalletBalance,
    //     // Additional helper functions
    //     hasInsufficientFunds: () => checkInsufficientFunds().hasInsufficientFunds,
    //     getCampaignPrice: () => checkInsufficientFunds().campaignPrice,
    //     getWalletStatus: () => ({
    //       balance: walletBalance,
    //       isLoading: isLoadingWallet,
    //       isAvailable: walletBalance !== null,
    //     }),
    //   };
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).campaignGiftFunctions;
        delete (window as any).walletFunctions;
      }
    };
  }, [
    giftTypeMode,
    selectedGift,
    selectedGifts,
    selectedBundle,
    giftBudget,
    allGifts,
    recommendedGifts,
    bundles,
    walletBalance,
    isLoadingWallet,
  ]);

  // Fetch wallet balance when entering campaign designer step
//   useEffect(() => {
//     if (currentStep === "campaign-designer" && userId && authToken && apiUrl) {
//       console.log("💰 Entering campaign designer step - fetching wallet balance...");
//       fetchWalletBalance();
//     }
//   }, [currentStep, userId, authToken, apiUrl]);

  // Monitor price changes and fetch wallet balance when price changes
  useEffect(() => {
    if (currentStep === "campaign-designer" && typeof window !== "undefined") {
      const checkPriceChanges = () => {
        const designerData = (window as any).campaignDesignerState;
        if (designerData && designerData.budgetTotal) {
          const currentPrice = Number(designerData.budgetTotal) || 0;

          // Only fetch wallet balance if price has changed
          if (currentPrice !== lastKnownPrice && currentPrice > 0) {
            console.log(`💰 Price changed from ${lastKnownPrice} to ${currentPrice}, fetching wallet balance...`);
            setLastKnownPrice(currentPrice);
            // fetchWalletBalance();
          }
        }
      };

      // Check price changes every 2 seconds when on campaign designer
      const interval = setInterval(checkPriceChanges, 2000);

      // Initial check
      checkPriceChanges();

      return () => clearInterval(interval);
    }
  }, [currentStep, lastKnownPrice, userId, authToken, apiUrl]);

  // Handle goal selection
  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    setSelectedMotion(null);
    setEventSource(null);
    setSelectedEvent(null);
    setEventUrl("");
    setContextData("");
    setRecipientSource(null);
    setSelectedList(null);
    setUploadedFile(null);
  };

  // Handle motion selection
  const handleMotionSelect = (motionId: string) => {
    setSelectedMotion(motionId);

    // If drive-event goal, fetch events
    if (selectedGoal === "drive-event" && existingEvents.length === 0) {
      // Fetch existing events from API
      fetchEvents().catch((error) => {
        console.error("Error fetching events in handleMotionSelect:", error);
      });
    }
  };

  // Fetch events from API
  const fetchEvents = async (): Promise<Event[]> => {
    if (!authToken || !organizationId) {
      console.error("Missing auth token or organization ID");
      setEventError("Authentication error. Please try again later.");
      return [];
    }

    try {
      setIsLoadingEvents(true);
      setEventError(null);

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
      console.log("Raw events API response:", responseData);

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
              eventId: event._id || event.id || `event-${Date.now()}-${index}`,
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
      setExistingEvents(transformedEvents);
      return transformedEvents;
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEventError(
        err instanceof Error
          ? err.message
          : "Failed to load events. Please try again."
      );
      return [];
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Handle event source selection
  const handleEventSourceSelect = (source: "existing" | "url") => {
    setEventSource(source);
  };

  // Handle recipient source selection
  const handleRecipientSourceSelect = (source: "saved" | "crm" | "upload") => {
    setRecipientSource(source);
    setSelectedList(null);
    setUploadedFile(null);

    // Load contact lists if needed
    if (source === "saved" && savedLists.length === 0) {
      // Mock data - in production this would be an API call
      setSavedLists([
        { id: "list1", name: "VIP Customers", count: 125 },
        { id: "list2", name: "Enterprise Leads", count: 78 },
        { id: "list3", name: "Conference Attendees", count: 203 },
      ]);
    }

    if (source === "crm" && crmLists.length === 0) {
      // Mock data - in production this would be an API call to connected CRM
      setCrmLists([
        { id: "crm1", name: "HubSpot - High Value Prospects", count: 87 },
        { id: "crm2", name: "HubSpot - Recent Demos", count: 42 },
        { id: "crm3", name: "Salesforce - Q2 Opportunities", count: 156 },
      ]);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    setIsProcessing(true);

    // Create mock recipients data for the campaign designer
    if (recipientSource === "saved" || recipientSource === "crm") {
      const selectedListData =
        recipientSource === "saved"
          ? savedLists.find((list) => list.id === selectedList)
          : crmLists.find((list) => list.id === selectedList);

      const count = selectedListData?.count || 10;
      const mockData = Array.from({ length: count }, (_, i) => ({
        name: `Recipient ${i + 1}`,
        email: `recipient${i + 1}@example.com`,
        company: `Company ${String.fromCharCode(65 + (i % 26))}`,
      }));

      setMockRecipients(mockData);
    } else if (recipientSource === "upload" && uploadedFile) {
      // In a real implementation, we would parse the file
      // For now, just create some mock data
      const mockData = Array.from({ length: 15 }, (_, i) => ({
        name: `Upload ${i + 1}`,
        email: `upload${i + 1}@example.com`,
        company: `Company ${String.fromCharCode(65 + (i % 26))}`,
      }));

      setMockRecipients(mockData);
    }

    // Move to the campaign designer step
    setTimeout(() => {
      setCurrentStep("campaign-designer");
      setIsProcessing(false);
    }, 1000);
  };

  // Handle campaign launch
  const handleSaveDraft = async () => {
    if (!isAPIReady) {
      console.error("❌ API not ready for save draft");
      showNotification(
        "API not ready. Please wait a moment and try again.",
        "error"
      );
      return;
    }

    // Basic wallet balance check (non-blocking for drafts, just informational)
    // const { isWalletLoading } = checkInsufficientFunds();

    // if (isWalletLoading) {
    //   console.log("💰 Wallet balance still loading, but proceeding with draft save...");
    // }

    setIsSavingDraft(true);
    try {
      const designerData = (window as any).campaignDesignerState;
      const goalData = {
        selectedGoal: selectedGoal || "",
        selectedMotion: selectedMotion || "",
        contextData: contextData || "",
        selectedEvent: selectedEvent || "",
        recipientSource: recipientSource || "",
        selectedList: selectedList || "",
      };
      const result = await executeCompleteCampaignFlow(
        designerData,
        goalData,
        true
      ); // isDraft=true
      if (result.success) {
        showNotification(
          "Draft saved successfully!",
          "success"
        );
        setIsSavingDraft(false);
        router.push("/campaigns");
      } else {
        showNotification(
          "Failed to save draft: " + (result.error || "Unknown error"),
          "error"
        );
      }
    } catch (err) {
      showNotification(
        "Draft save error: " +
          (err instanceof Error ? err.message : "Unknown error"),
        "error"
      );
    } finally {
      setIsSavingDraft(false);
      router.push("/campaigns");
    }
  };

  // =============================================
  // GIFT TYPE PROCESSING FUNCTIONS (No UI)
  // =============================================

  // Function 1: Fetch Bundles with Gifts
  const fetchBundles = async () => {
    try {
      setIsLoadingGifts(true);
      setGiftError(null);

      console.log("🎁 Fetching bundles from API...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles?isGift=true&sortOrder=desc`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const bundlesResponse = await response.json();
      console.log("🎁 Bundles response:", bundlesResponse);

      if (!bundlesResponse.success || !bundlesResponse.data) {
        throw new Error("Invalid response format");
      }

      const bundlesData = bundlesResponse.data;
      const allGiftsMap = new Map<string, Gift>();

      // Process each bundle and its gifts
      bundlesData.forEach((bundle: any) => {
        console.log(
          `📦 Processing bundle: ${bundle.bundleName} (${bundle.bundleId})`
        );

        // Process each gift in the bundle
        (bundle.gifts || []).forEach((gift: any) => {
          // Generate estimated price if not provided
          let estimatedPrice = 0;
          if (gift.name) {
            const name = gift.name.toLowerCase();
            if (
              name.includes("executive") ||
              name.includes("luxury") ||
              name.includes("premium")
            ) {
              estimatedPrice = Math.floor(Math.random() * 200) + 100; // $100-300
            } else if (
              name.includes("smart") ||
              name.includes("wireless") ||
              name.includes("bluetooth")
            ) {
              estimatedPrice = Math.floor(Math.random() * 150) + 50; // $50-200
            } else if (
              name.includes("eco") ||
              name.includes("bamboo") ||
              name.includes("wooden")
            ) {
              estimatedPrice = Math.floor(Math.random() * 100) + 25; // $25-125
            } else {
              estimatedPrice = Math.floor(Math.random() * 100) + 20; // $20-120
            }
          }

          const giftObj: Gift = {
            _id: gift.giftId,
            name: gift.name || "Unnamed Gift",
            price: Number(gift.price) || estimatedPrice,
            descShort: gift.shortDescription || "",
            category: gift.category || "",
            images: {
              primaryImgUrl:
                gift.imageUrl && gift.imageUrl.trim() !== ""
                  ? gift.imageUrl
                  : "/images/placeholder-gift.svg",
              secondaryImgUrl:
                gift.imageUrl && gift.imageUrl.trim() !== ""
                  ? gift.imageUrl
                  : "/images/placeholder-gift.svg",
            },
            sku: gift.sku || "",
            rationale: gift.rationale || "",
            confidence_score: gift.confidence_score || "0",
          };
          allGiftsMap.set(gift.giftId, giftObj);
        });
      });

      // Create enriched bundle objects
      const enrichedBundles = bundlesData.map((bundle: any) => ({
        _id: bundle.bundleId,
        bundleId: bundle.bundleId,
        bundleName: bundle.bundleName,
        description: bundle.description || "",
        imgUrl: bundle.imgUrl || "",
        isAvailable: bundle.isAvailable !== false,
        gifts: (bundle.gifts || []).map((gift: any) => ({
          giftId: gift.giftId,
          name: gift.name,
          shortDescription: gift.shortDescription,
          inventory: gift.inventory,
          imageUrl: gift.imageUrl,
        })),
      }));

      setBundles(enrichedBundles);
      setGifts(allGiftsMap);

      console.log("🎁 Bundles loaded successfully:", enrichedBundles.length);
      return enrichedBundles;
    } catch (error) {
      console.error("Error fetching bundles:", error);
      setGiftError(
        error instanceof Error ? error.message : "Failed to load bundles"
      );
      return [];
    } finally {
      setIsLoadingGifts(false);
    }
  };

  // Function 2: Process Gift Selection by Type
  const processGiftsByType = async (
    giftType: "manual_gift" | "multi_gift" | "hyper_personalize",
    designerData?: any
  ): Promise<Gift[]> => {
    console.log(`🎯 Processing gifts for type: ${giftType}`);

    if (bundles.length === 0) {
      console.log("🎁 No bundles loaded, fetching bundles first...");
      await fetchBundles();
    }

    // Auto-select the main bundle
    const mainBundleId = "67ce2054e04f14d6638c7b6c";
    setSelectedBundle(mainBundleId);

    // Find the main bundle
    const mainBundle = bundles.find((b) => b.bundleId === mainBundleId);
    if (!mainBundle) {
      console.error("Main bundle not found:", mainBundleId);
      return []; // Return empty array instead of undefined
    }

    // Get gifts from the main bundle
    const bundleGifts = mainBundle.gifts
      .map((g) => gifts.get(g.giftId))
      .filter(Boolean) as Gift[];

    // Sort by price (highest first)
    const sortedGifts = bundleGifts.sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );

    // Apply budget filtering for recommendations
    const maxBudget =
      giftType === "hyper_personalize" ? designerData?.budget?.max || 0 : 500;
    const budgetFilteredGifts = sortedGifts.filter(
      (gift) => gift.price <= maxBudget
    );

    // Get top 3 recommendations
    const topRecommendations = budgetFilteredGifts.slice(0, 3);

    // Update state
    setAllGifts(budgetFilteredGifts);
    setAllGiftsUnfiltered(sortedGifts);
    setRecommendedGifts(topRecommendations);

    console.log(
      `🎯 Processed ${sortedGifts.length} gifts, ${topRecommendations.length} recommendations`
    );
    return topRecommendations;
  };

  // Function 3: Handle Smart Match (Hyper Personalize)
  const handleSmartMatchFlow = async (designerData?: any): Promise<Gift[]> => {
    console.log("🤖 Starting Smart Match flow...");
    setGiftTypeMode("hyper_personalize");

    // Clear previous selections
    setSelectedGift(null);
    setSelectedGifts([]);

    // Process gifts with budget consideration
    const recommendations = await processGiftsByType(
      "hyper_personalize",
      designerData
    );

    console.log("🤖 Smart Match setup complete, AI will select gifts");
    return recommendations;
  };

  // Function 4: Handle One Gift for All (Manual Single)
  const handleOneGiftForAllFlow = async (): Promise<Gift[]> => {
    console.log("🎯 Starting One Gift for All flow...");
    setGiftTypeMode("manual_gift");

    // Clear previous selections
    setSelectedGifts([]);

    // Process gifts and auto-select top recommendation
    const recommendations = await processGiftsByType("manual_gift");

    if (recommendations.length > 0) {
      setSelectedGift(recommendations[0]);
      console.log("🎯 Auto-selected top gift:", recommendations[0].name);
    }

    return recommendations;
  };

  // Function 5: Handle Let Recipients Choose (Multi Gift)
  const handleLetRecipientsChooseFlow = async (): Promise<Gift[]> => {
    console.log("🎁 Starting Let Recipients Choose flow...");
    setGiftTypeMode("multi_gift");

    // Clear previous selections
    setSelectedGift(null);

    // Process gifts and auto-select top 3 recommendations
    const recommendations = await processGiftsByType("multi_gift");

    if (recommendations.length > 0) {
      setSelectedGifts(recommendations);
      console.log(
        "🎁 Auto-selected top gifts:",
        recommendations.map((g) => g.name)
      );
    }

    return recommendations;
  };

  // Function 6: Determine Gift Type from Designer Data
  const determineGiftTypeFromDesignerData = (designerData: any) => {
    console.log("🔍 Analyzing designer data to determine gift type...");

    // Enhanced debugging for gift type detection
    console.log("🔍 Designer Data Analysis:");
    console.log("  selectedGiftMode:", designerData.selectedGiftMode);
    console.log("  hyperPersonalization:", designerData.hyperPersonalization);
    console.log(
      "  selectedRecipientGifts:",
      designerData.selectedRecipientGifts
    );
    console.log(
      "  selectedRecipientGifts length:",
      designerData.selectedRecipientGifts?.length || 0
    );
    console.log("  selectedGift:", designerData.selectedGift);
    console.log("  selectedBundle:", designerData.selectedBundle);

    // 🎯 PRIORITY 1: Check explicit selectedGiftMode FIRST
    if (designerData.selectedGiftMode) {
      console.log("🎯 EXPLICIT MODE DETECTED:", designerData.selectedGiftMode);

      if (
        designerData.selectedGiftMode === "hyper_personalize" ||
        designerData.selectedGiftMode === "hyper-personalize" ||
        designerData.selectedGiftMode === "smart-match"
      ) {
        console.log("🔍 Detected: Smart Match (hyper_personalize) - EXPLICIT");
        return "hyper_personalize";
      }

      if (
        designerData.selectedGiftMode === "recipient-choice" ||
        designerData.selectedGiftMode === "multi_gift" ||
        designerData.selectedGiftMode === "multiple"
      ) {
        console.log(
          "🔍 Detected: Let Recipients Choose (multi_gift) - EXPLICIT"
        );
        return "multi_gift";
      }

      if (
        designerData.selectedGiftMode === "one-gift" ||
        designerData.selectedGiftMode === "single" ||
        designerData.selectedGiftMode === "manual_gift"
      ) {
        console.log("🔍 Detected: One Gift for All (manual_gift) - EXPLICIT");
        return "manual_gift";
      }

      console.log(
        "⚠️ Unknown selectedGiftMode:",
        designerData.selectedGiftMode,
        "- falling back to analysis"
      );
    }

    // 🎯 PRIORITY 2: Check for hyper personalization flag
    if (designerData.hyperPersonalization === true) {
      console.log("🔍 Detected: Smart Match (hyper_personalize) - FLAG");
      return "hyper_personalize";
    }

    // 🎯 PRIORITY 3: Analyze gift arrays (only if no explicit mode)
    console.log("🔍 No explicit mode found, analyzing gift selections...");

    const hasMultipleRecipientGifts =
      designerData.selectedRecipientGifts &&
      Array.isArray(designerData.selectedRecipientGifts) &&
      designerData.selectedRecipientGifts.length > 1;

    const hasSingleGift =
      designerData.selectedGift || designerData.selectedBundle;

    if (hasMultipleRecipientGifts && !hasSingleGift) {
      console.log("🔍 Detected: Let Recipients Choose (multi_gift) - INFERRED");
      console.log("  Reason: Multiple gifts but no single gift selected");
      return "multi_gift";
    }

    if (hasSingleGift) {
      console.log("🔍 Detected: One Gift for All (manual_gift) - INFERRED");
      console.log("  Reason: Single gift selected");
      return "manual_gift";
    }

    // Default fallback
    console.log(
      "🔍 No clear detection - defaulting to: One Gift for All (manual_gift)"
    );
    return "manual_gift";
  };

  // Function 7: Initialize Gift Type from Campaign Data
  const initializeGiftTypeFromCampaignData = async (campaignData: any) => {
    console.log("🚀 Initializing gift type from existing campaign...");

    if (!campaignData.giftSelectionMode) {
      console.log("🚀 No gift selection mode found, using default");
      return;
    }

    // Map backend modes to frontend types
    const modeMapping = {
      hyper_personalize: "hyper_personalize",
      manual: "manual_gift",
    };

    const detectedType =
      modeMapping[campaignData.giftSelectionMode] || "manual_gift";
    console.log("🚀 Detected gift type from campaign:", detectedType);

    // Set budget if available
    if (campaignData.budget?.maxPerGift) {
      setGiftBudget(campaignData.budget.maxPerGift);
    }

    // Initialize the appropriate flow
    switch (detectedType) {
      case "hyper_personalize":
        await handleSmartMatchFlow(campaignData);
        break;
      case "multi_gift":
        await handleLetRecipientsChooseFlow();
        break;
      default:
        await handleOneGiftForAllFlow();
        break;
    }
  };

  // =============================================
  // INDIVIDUAL CAMPAIGN STEP FUNCTIONS
  // =============================================

  // STEP 1: Create Blank Campaign
  const createBlankCampaign = async (
    designerData: any,
    goalData: {
      selectedGoal: string;
      selectedMotion: string;
      contextData: string;
      selectedEvent?: string;
      recipientSource?: string;
      selectedList?: string;
    },
    // existingCampaignId?: string // Add optional parameter for existing campaign ID
  ) => {
    console.log("📝 STEP 1: Creating blank campaign...");

    if (!isAPIReady) {
      console.error("❌ API not ready. Debug info:", {
        isLoadingCookies,
        hasAuthToken: !!authToken,
        hasUserId: !!userId,
        hasOrganizationId: !!organizationId,
        apiUrl,
        isAPIReady,
      });
      throw new Error("API not ready. Please refresh the page and try again.");
    }

    const {
      selectedGoal,
      selectedMotion,
      contextData,
      selectedEvent,
      recipientSource,
      selectedList,
    } = goalData;
    const campaignName =
      designerData.campaignName ||
      `${selectedGoalObj?.title} - ${selectedMotionObj?.title}` ||
      "Draft Campaign";

    // =============================================
    // ENHANCED GIFT TYPE HANDLING
    // =============================================

    // Determine gift type from designer data or current state
    let currentGiftType = giftTypeMode;
    const syncedGiftData: {
      giftType: string;
      selectedGift: Gift | null;
      selectedGifts: Gift[];
      selectedBundle: string | null;
    } = {
      giftType: currentGiftType,
      selectedGift: selectedGift,
      selectedGifts: selectedGifts,
      selectedBundle: selectedBundle,
    };

    if (designerData) {
      currentGiftType = determineGiftTypeFromDesignerData(designerData);
      setGiftTypeMode(currentGiftType);

      // =============================================
      // SYNC PAGE STATE WITH DETECTED GIFT TYPE
      // =============================================

      console.log(
        "🔄 Syncing page state with detected gift type:",
        currentGiftType
      );

      if (currentGiftType === "manual_gift") {
        // 🎯 SINGLE GIFT MODE: Use only the selectedGift, ignore selectedRecipientGifts
        console.log("🎯 SINGLE GIFT MODE: Processing single gift selection...");

        if (designerData.selectedGift) {
          const gift = gifts.get(designerData.selectedGift);
          if (gift) {
            setSelectedGift(gift);
            console.log("🔄 Synced single gift:", gift.name);
            syncedGiftData.selectedGift = gift;
          } else {
            // Fallback for single gift
            const fallbackGift = {
              _id: designerData.selectedGift,
              name: "Selected Gift",
              price: 50,
              descShort: "Single gift selection",
              images: { primaryImgUrl: "/images/placeholder-gift.svg" },
            };
            setSelectedGift(fallbackGift);
            console.log("🔄 Synced single gift (fallback):", fallbackGift.name);
            syncedGiftData.selectedGift = fallbackGift;
          }
        } else {
          console.log(
            "⚠️ Single gift mode but no selectedGift found in designer data"
          );
        }

        // Clear multiple gifts for single gift mode
        setSelectedGifts([]);
        syncedGiftData.selectedGifts = [];
        console.log("🔄 Cleared multiple gifts for single gift mode");
      } else if (currentGiftType === "multi_gift") {
        // 🎯 MULTI-GIFT MODE: Use selectedRecipientGifts array
        console.log(
          "🎯 MULTI-GIFT MODE: Processing multiple gift selection..."
        );

        if (
          designerData.selectedRecipientGifts &&
          Array.isArray(designerData.selectedRecipientGifts)
        ) {
          // Convert gift IDs to gift objects if possible
          const giftObjects = designerData.selectedRecipientGifts.map(
            (giftId: string) => {
              const gift = gifts.get(giftId);
              if (gift) return gift;
              // Fallback: create minimal gift object with better name detection
              const fallbackName = giftId.includes("7b3f")
                ? "Executive Pen Set"
                : giftId.includes("7b40")
                ? "Smart Water Bottle"
                : giftId.includes("7b41")
                ? "Bamboo Notebook"
                : giftId.includes("7b42")
                ? "Wireless Charger"
                : `Gift ${giftId.slice(-4)}`;
              return {
                _id: giftId,
                name: fallbackName,
                price: 50, // Default price
                descShort: "Gift option for recipients",
                images: { primaryImgUrl: "/images/placeholder-gift.svg" },
              };
            }
          );
          setSelectedGifts(giftObjects);
          console.log(
            "🔄 Synced multiple gifts:",
            giftObjects.map((g) => g.name)
          );

          // Update synced data for immediate use
          syncedGiftData.selectedGifts = giftObjects;
        } else {
          console.log(
            "⚠️ Multi-gift mode but no selectedRecipientGifts found in designer data"
          );
        }

        // Clear single gift for multi-gift mode
        setSelectedGift(null);
        syncedGiftData.selectedGift = null;
        console.log("🔄 Cleared single gift for multi-gift mode");
      } else if (currentGiftType === "hyper_personalize") {
        // 🎯 SMART MATCH MODE: Clear both selections (AI handles)
        console.log("🎯 SMART MATCH MODE: AI will handle gift selection...");
        setSelectedGift(null);
        setSelectedGifts([]);
        syncedGiftData.selectedGift = null;
        syncedGiftData.selectedGifts = [];
        console.log("🔄 Cleared selections for Smart Match mode");
      }

      // Sync bundle selection
      if (designerData.selectedBundle) {
        setSelectedBundle(designerData.selectedBundle);
        console.log("🔄 Synced bundle:", designerData.selectedBundle);
        syncedGiftData.selectedBundle = designerData.selectedBundle;
      }

      // Update gift type in synced data
      syncedGiftData.giftType = currentGiftType;
    }

    console.log("🎁 Campaign gift type:", currentGiftType);
    console.log("🎁 Synced gift data for immediate use:", {
      type: syncedGiftData.giftType,
      selectedGift: syncedGiftData.selectedGift?.name || "None",
      selectedGifts: syncedGiftData.selectedGifts.map((g) => g.name),
      selectedBundle: syncedGiftData.selectedBundle || "None",
    });

    // Map frontend goal values to backend enum values
    const goalMapping: { [key: string]: string } = {
      "drive-event": "delight_event_attendees",
      "pipeline-acceleration": "create_more_pipeline",
      "product-launch": "create_more_pipeline",
      "customer-relationships": "reduce_churn",
      "quick-send": "",
      "booth-pickup": "delight_event_attendees", // Add booth-pickup mapping
    };

    // Build campaign data for campaigns2 API (simplified structure)
    const blankCampaignData = {
      name: campaignName,
      description: contextData || "",
      goal: selectedGoal ? goalMapping[selectedGoal] || "" : "",
      source: recipientSource || "manual",
    };

    console.log("🎁 Creating campaign with campaigns2 API:", blankCampaignData);

    const campaignIdInParams = searchParams.get("campaignId");
    let createResult;
    if (!campaignIdInParams) {

         createResult = await createCampaign(
            apiUrl,
            organizationId,
            authToken,
            blankCampaignData
        );
    }
        const campaignId = campaignIdInParams ? campaignIdInParams : createResult?.campaign_id;



      if (!campaignId) {
        console.error("❌ No campaign ID in response:", createResult);
        throw new Error("STEP 1 FAILED: No campaign ID returned from API");

    }

    console.log("✅ STEP 1 COMPLETED: Campaign ID:", campaignId);

    return { campaignId, campaignName, syncedGiftData };
  };

  // STEP 2: Update Campaign with Detailed Information
  const updateCampaignDetails = async (
    campaignId: string,
    campaignName: string,
    designerData: any,
    contextData: string,
    syncedGiftData?: {
      giftType: string;
      selectedGift: Gift | null;
      selectedGifts: Gift[];
      selectedBundle: string | null;
    }
  ) => {
    console.log("📝 STEP 2: Updating campaign with detailed data...");

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    // =============================================
    // ENHANCED GIFT TYPE HANDLING FOR UPDATE
    // =============================================

    // Use synced gift data if provided, otherwise fall back to state
    const currentGiftType = syncedGiftData?.giftType || giftTypeMode;
    const currentSelectedGift = syncedGiftData?.selectedGift || selectedGift;
    const currentSelectedGifts = syncedGiftData?.selectedGifts || selectedGifts;
    const currentSelectedBundle =
      syncedGiftData?.selectedBundle || selectedBundle;

    console.log("🎁 Updating campaign with gift type:", currentGiftType);
    console.log("🎁 Using gift data:", {
      type: currentGiftType,
      selectedGift: currentSelectedGift?.name || "None",
      selectedGifts: currentSelectedGifts.map((g) => g.name),
      selectedBundle: currentSelectedBundle || "None",
      source: syncedGiftData ? "syncedGiftData" : "state",
    });

    const updateData: any = {
      name: campaignName,
      description: "",
      status: "draft",
      budget: {
        totalBudget:
          currentGiftType === "hyper_personalize"
            ? designerData.budget.max *
              (designerData.selectedContactsCount || 1)
            : designerData.budgetTotal || 0,
        maxPerGift:
          currentGiftType === "hyper_personalize"
            ? designerData.budget.max
            : designerData.giftCost || 0,
        currency: "USD",
        spent: 0,
      },
      eventStartDate: designerData.startByDate
        ? new Date(designerData.startByDate)
        : undefined,
      deliverByDate: designerData.deliveryByDate
        ? new Date(designerData.deliveryByDate)
        : undefined,
      total_recipients: (() => {
        console.log("🔍 DEBUG total_recipients calculation:");
        console.log("  recipientCount:", designerData.recipientCount);
        console.log("  selectedContactsCount:", designerData.selectedContactsCount);
        console.log("  filteredRecipientsCount:", designerData.filteredRecipientsCount);
        const result = designerData.recipientCount ||
          designerData.selectedContactsCount ||
          designerData.filteredRecipientsCount ||
          0;
        console.log("  final result:", result);
        return result;
      })(),
      cta_link: designerData.ctaLink || "",
      eventId: selectedEvent || "",
    };

    // Add contactListId from CampaignDesigner if available
    if (designerData.contactListId || designerData.selectedListId) {
      updateData.contactListId =
        designerData.contactListId || designerData.selectedListId;
      console.log(
        "📞 Added contactListId from CampaignDesigner:",
        updateData.contactListId
      );
    }

    // =============================================
    // NOTE: Gift catalogs are now handled by specialized APIs
    // =============================================

    console.log("🎁 Gift type detected:", currentGiftType);
    console.log(
      "🎁 Gift selection will be handled by specialized APIs in Step 5"
    );

    // Note: Landing page configuration will be handled by specialized API in Step 4
    // if (designerData.landingPageConfig) {
    //   updateData.landingPageConfig = designerData.landingPageConfig;
    // }

    // Add dates if available
    if (designerData.startByDate) {
      updateData.eventStartDate = designerData.startByDate;
    }
    if (designerData.deliveryByDate) {
      updateData.deliverByDate = designerData.deliveryByDate;
    }

    console.log("🎁 Final update data:", JSON.stringify(updateData, null, 2));

    const updateResult = await updateCampaign(
      apiUrl,
      organizationId,
      authToken,
      campaignId,
      updateData
    );
    console.log("✅ STEP 2 COMPLETED: Campaign updated");

    // Check if the update was successful based on the response format
    const isSuccess =
      updateResult.message?.includes("successfully") ||
      updateResult.success === true;

    return {
      success: isSuccess,
      data: updateResult,
      message: updateResult.message || "Campaign updated",
    };
  };

  // STEP 2A: Update Campaign motion
  const updateCampaignMotion = async (
    campaignId: string,
    selectedMotion: string
  ) => {
    console.log("🎯 STEP 2A: Updating campaign motion...");

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    if (!selectedMotion) {
      console.log("ℹ️ STEP 2A SKIPPED: No motion selected");
      return { success: false, info: "No motion selected" };
    }

    try {
      const result = await updateMotion(
        apiUrl,
        organizationId,
        authToken,
        campaignId,
        selectedMotion
      );
      console.log("✅ STEP 2A COMPLETED: Campaign motion updated successfully");
      return {
        success: true,
        data: result,
        message: "Motion updated successfully",
      };
    } catch (error) {
      console.error("❌ STEP 2A FAILED: Motion update failed:", error);
      throw new Error(`Motion update failed: ${error}`);
    }
  };

  // STEP 3: Add Recipients to Campaign
  const addRecipientsToCampaign = async (
    campaignId: string,
    designerData: any
  ) => {
    console.log("📝 STEP 3: Adding recipients to campaign...");

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    if (
      designerData.selectedContactsCount > 0 ||
      designerData.filteredRecipientsCount > 0
    ) {
      let contactIds: string[] = [];

      if (
        designerData.selectedContacts &&
        Array.isArray(designerData.selectedContacts)
      ) {
        contactIds = designerData.selectedContacts
          .filter((contact) => contact.id)
          .map((contact) => contact.id);
      } else if (
        designerData.filteredRecipients &&
        Array.isArray(designerData.filteredRecipients)
      ) {
        contactIds = designerData.filteredRecipients
          .filter((recipient) => recipient.id)
          .map((recipient) => recipient.id);
      } else if (
        designerData.originalRecipients &&
        Array.isArray(designerData.originalRecipients)
      ) {
        contactIds = designerData.originalRecipients
          .filter((recipient) => recipient.id)
          .map((recipient) => recipient.id);
      }

      if (contactIds.length > 0) {
        try {
          const addResult = await addRecipients(
            apiUrl,
            organizationId,
            authToken,
            campaignId,
            contactIds,
            "list"
          );
          console.log("✅ STEP 3 COMPLETED: Recipients added to campaign");
          return {
            success: true,
            data: addResult,
            message: "Recipients added successfully",
          };
        } catch (error) {
          console.warn(
            "⚠️ Recipients creation failed (non-critical) - continuing..."
          );
          return { success: false, warning: "Recipients creation failed" };
        }
      } else {
        console.log("⚠️ STEP 3 SKIPPED: No valid contact IDs found");
        return { success: false, warning: "No valid contact IDs found" };
      }
    } else {
      console.log("ℹ️ STEP 3 SKIPPED: No recipients to add");
      return { success: false, info: "No recipients to add" };
    }
  };

  // STEP 4A: Update Landing Page Configuration
  const updateLandingPageConfigStep = async (
    campaignId: string,
    designerData: any
  ) => {
    if (designerData.landingPageConfig) {
      console.log("📝 STEP 4A: Updating landing page configuration...");

      if (!isAPIReady) {
        throw new Error("API not ready");
      }

      try {
        const result = await updateLandingPageConfig(
          apiUrl,
          organizationId,
          authToken,
          campaignId,
          designerData.landingPageConfig
        );
        console.log("✅ STEP 4A COMPLETED: Landing page configuration updated");
        return { success: true, data: result };
      } catch (error) {
        console.warn(
          "⚠️ STEP 4A WARNING: Landing page configuration update failed (non-critical)"
        );
        return {
          success: false,
          warning: "Landing page configuration update failed",
        };
      }
    } else {
      console.log("ℹ️ STEP 4A SKIPPED: No landing page configuration provided");
      return { success: false, info: "No landing page configuration provided" };
    }
  };

  // STEP 4B: Update Gift Card (Outcome Card)
  const updateGiftCardStep = async (campaignId: string, designerData: any) => {
    if (designerData.outcomeCard) {
      console.log("📝 STEP 4B: Updating gift card (outcome card)...");

      if (!isAPIReady) {
        throw new Error("API not ready");
      }

      try {
        const result = await updateGiftCard(
          apiUrl,
          organizationId,
          authToken,
          campaignId,
          designerData.outcomeCard
        );
        console.log("✅ STEP 4B COMPLETED: Gift card (outcome card) updated");
        return { success: true, data: result };
      } catch (error) {
        console.warn(
          "⚠️ STEP 4B WARNING: Gift card update failed (non-critical)"
        );
        return { success: false, warning: "Gift card update failed" };
      }
    } else {
      console.log("ℹ️ STEP 4B SKIPPED: No gift card (outcome card) provided");
      return { success: false, info: "No gift card (outcome card) provided" };
    }
  };

  // STEP 4C: Update Event with Campaign ID
  const updateEventWithCampaignId = async (
    campaignId: string,
    selectedGoal: string,
    selectedEvent?: string
  ) => {
    if (selectedGoal === "drive-event" && selectedEvent) {
      console.log("📝 STEP 4C: Updating event with campaign ID...");

      try {
        // Fetch current event data to get existing campaignIds
        const eventResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${selectedEvent}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        let campaignIds: string[] = [];
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          campaignIds = Array.isArray(eventData.event.campaignIds)
            ? eventData.event.campaignIds.map((idObj: any) =>
                typeof idObj === "string" ? idObj : idObj.$oid
              )
            : [];
        }

        // Add the new campaignId if not already present
        if (!campaignIds.includes(campaignId)) {
          campaignIds.push(campaignId);
        }

        // Update event with new campaignIds array
        const updateEventResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${selectedEvent}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              campaignIds,
            }),
          }
        );

        if (updateEventResponse.ok) {
          console.log("✅ STEP 4C COMPLETED: Event updated with campaign ID");
          return { success: true };
        } else {
          console.warn("⚠️ STEP 4C WARNING: Event update failed (non-critical)");
          return { success: false, warning: "Event update failed" };
        }
      } catch (eventError) {
        console.warn("⚠️ STEP 4C WARNING: Event update error (non-critical)");
        return { success: false, error: eventError };
      }
    } else {
      console.log(
        "ℹ️ STEP 4C SKIPPED: Not a drive-event campaign or no event selected"
      );
      return { success: false, info: "Not applicable for this campaign type" };
    }
  };

  // STEP 4D: Update Email Templates
  const updateEmailTemplatesStep = async (campaignId: string, designerData: any) => {
    if (designerData.emailTemplates) {
      console.log("📝 STEP 4D: Updating email templates...");

      if (!isAPIReady) {
        throw new Error("API not ready");
      }

      try {
        const result = await updateEmailTemplates(
          apiUrl,
          organizationId,
          authToken,
          campaignId,
          designerData.emailTemplates
        );
        console.log("✅ STEP 4D COMPLETED: Email templates updated");
        return { success: true, data: result };
      } catch (error) {
        console.warn(
          "⚠️ STEP 4D WARNING: Email templates update failed (non-critical)"
        );
        return {
          success: false,
          warning: "Email templates update failed",
        };
      }
    } else {
      console.log("ℹ️ STEP 4D SKIPPED: No email templates provided");
      return { success: false, info: "No email templates provided" };
    }
  };

  // STEP 5: Execute Gift Selection via Specialized APIs
  const executeGiftSelection = async (
    campaignId: string,
    designerData: any,
    syncedGiftData?: {
      giftType: string;
      selectedGift: Gift | null;
      selectedGifts: Gift[];
      selectedBundle: string | null;
    }
  ) => {
    console.log("📝 STEP 5: Executing gift selection via specialized APIs...");

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    // =============================================
    // ENHANCED GIFT SELECTION LOGIC
    // =============================================

    // Use synced gift data if provided, otherwise fall back to state
    const currentGiftType = syncedGiftData?.giftType || giftTypeMode;
    const currentSelectedGift = syncedGiftData?.selectedGift || selectedGift;
    const currentSelectedGifts = syncedGiftData?.selectedGifts || selectedGifts;
    const currentSelectedBundle =
      syncedGiftData?.selectedBundle || selectedBundle;

    console.log("🎁 Current gift type mode:", currentGiftType);

    // Log gift selection details
    console.log("🎁 Gift Selection Analysis:");
    console.log("  Selected Bundle:", currentSelectedBundle || "None");
    console.log("  Selected Single Gift:", currentSelectedGift?.name || "None");
    console.log(
      "  Selected Multiple Gifts:",
      currentSelectedGifts.map((g) => g.name) || []
    );
    console.log("  Gift Type Mode:", currentGiftType);
    console.log("  Data Source:", syncedGiftData ? "syncedGiftData" : "state");

    // Enhanced decision logic based on gift type
    let shouldExecuteGiftSelection = false;
    let selectionReason = "";

    if (currentGiftType === "hyper_personalize") {
      // Smart Match: Always execute API (AI handles selection)
      shouldExecuteGiftSelection = true;
      selectionReason = "Smart Match mode - AI will handle gift selection";
    } else if (currentGiftType === "manual_gift") {
      // One Gift for All: Execute if single gift/bundle selected
      if (currentSelectedBundle || currentSelectedGift) {
        shouldExecuteGiftSelection = true;
        selectionReason = `Single gift mode - ${
          currentSelectedGift?.name || currentSelectedBundle
        }`;
      } else if (designerData.selectedBundle || designerData.selectedGift) {
        shouldExecuteGiftSelection = true;
        selectionReason = "Single gift mode - using designer selection";
      } else {
        selectionReason = "Single gift mode - no gift selected";
      }
    } else if (currentGiftType === "multi_gift") {
      // Let Recipients Choose: Execute if multiple gifts selected
      console.log("🎁 Analyzing multi-gift mode selections...");
      console.log("  Current selectedGifts:", currentSelectedGifts.length);
      console.log(
        "  Designer selectedRecipientGifts:",
        designerData.selectedRecipientGifts?.length || 0
      );

      if (currentSelectedGifts.length > 0) {
        shouldExecuteGiftSelection = true;
        selectionReason = `Multiple gift mode - ${currentSelectedGifts.length} synced gifts selected`;
      } else if (
        designerData.selectedRecipientGifts &&
        Array.isArray(designerData.selectedRecipientGifts) &&
        designerData.selectedRecipientGifts.length > 0
      ) {
        shouldExecuteGiftSelection = true;
        selectionReason = `Multiple gift mode - ${designerData.selectedRecipientGifts.length} designer gifts`;
      } else {
        selectionReason =
          "Multiple gift mode - no gifts found in either synced data or designer data";
      }
    }

    console.log(
      "🎯 Gift Selection Decision:",
      shouldExecuteGiftSelection ? "EXECUTE" : "SKIP"
    );
    console.log("🎯 Reason:", selectionReason);

    if (shouldExecuteGiftSelection) {
      try {
        console.log("🎯 Executing Gift Selection API...");

        // Choose the appropriate specialized gift API based on gift type
        if (currentGiftType === "hyper_personalize") {
          // 🤖 Smart Match API
          console.log("🤖 Calling Smart Match API...");
          if (currentSelectedBundle) {
            const giftCatalogs = [
              {
                catalogId: currentSelectedBundle,
                selectedGift: [currentSelectedBundle],
              },
            ];
            const result = await setSmartMatchGifts(
              apiUrl,
              organizationId,
              authToken,
              campaignId,
              giftCatalogs
            );
            console.log("✅ Smart Match API success:", result);
          } else {
            console.warn("⚠️ Smart Match mode but no bundle selected");
          }
        } else if (currentGiftType === "multi_gift") {
          // 🎁 Recipients Choice API
          console.log("🎁 Calling Recipients Choice API...");
          if (currentSelectedGifts.length > 0) {
            const giftIds = currentSelectedGifts.map((gift) => gift._id);
            const catalogId = currentSelectedBundle || giftIds[0];
            const giftCatalogs = [
              {
                catalogId: catalogId,
                selectedGift: giftIds,
              },
            ];
            const result = await setRecipientsChoiceGifts(
              apiUrl,
              organizationId,
              authToken,
              campaignId,
              giftCatalogs
            );
            console.log("✅ Recipients Choice API success:", result);
          } else if (
            designerData.selectedRecipientGifts &&
            Array.isArray(designerData.selectedRecipientGifts) &&
            designerData.selectedRecipientGifts.length > 0
          ) {
            // Fallback to designer data
            const catalogId =
              currentSelectedBundle || designerData.selectedRecipientGifts[0];
            const giftCatalogs = [
              {
                catalogId: catalogId,
                selectedGift: designerData.selectedRecipientGifts,
              },
            ];
            const result = await setRecipientsChoiceGifts(
              apiUrl,
              organizationId,
              authToken,
              campaignId,
              giftCatalogs
            );
            console.log("✅ Recipients Choice API success (fallback):", result);
          } else {
            console.warn("⚠️ Recipients Choice mode but no gifts selected");
          }
        } else if (currentGiftType === "manual_gift") {
          // 🎯 Single Gift API
          console.log("🎯 Calling Single Gift API...");
          if (currentSelectedGift) {
            const catalogId = currentSelectedBundle || currentSelectedGift._id;
            const giftCatalog = {
              catalogId: catalogId,
              selectedGift: [currentSelectedGift._id],
            };
            const result = await setSingleGift(
              apiUrl,
              organizationId,
              authToken,
              campaignId,
              giftCatalog
            );
            console.log("✅ Single Gift API success:", result);
          } else if (designerData.selectedGift) {
            // Fallback to designer data
            const catalogId =
              currentSelectedBundle || designerData.selectedGift;
            const giftCatalog = {
              catalogId: catalogId,
              selectedGift: [designerData.selectedGift],
            };
            const result = await setSingleGift(
              apiUrl,
              organizationId,
              authToken,
              campaignId,
              giftCatalog
            );
            console.log("✅ Single Gift API success (fallback):", result);
          } else {
            console.warn("⚠️ Single Gift mode but no gift selected");
          }
        }

        console.log(
          "✅ STEP 5 COMPLETED: Gift selection completed successfully via specialized API"
        );
        return { success: true };
      } catch (giftError) {
        console.warn(
          "⚠️ STEP 5 WARNING: Gift selection error (non-critical)",
          giftError
        );
        return { success: false, warning: "Gift selection failed" };
      }
    } else {
      console.log("ℹ️ STEP 5 SKIPPED:", selectionReason);
      return { success: false, info: selectionReason };
    }
  };

  // STEP 6: Run Campaign (All Modes)
  const runCampaignStep = async (campaignId: string, designerData: any) => {
    console.log("📝 STEP 5: Running campaign...");

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    // Run campaign for all gift modes (manual, recipient-choice, hyper_personalize)
    try {
      const runResult = await runCampaign(
        apiUrl,
        organizationId,
        authToken,
        campaignId,
        false
      );
      console.log("✅ STEP 6 COMPLETED: Campaign is now running");
      return {
        success: true,
        data: runResult,
        message: "Campaign launched successfully",
      };
    } catch (runError) {
      console.error("❌ STEP 6 ERROR: Run campaign failed");
      console.error("Error details:", runError);
      return {
        success: false,
        warning: runError instanceof Error ? runError.message : "Campaign launch failed",
        error: runError instanceof Error ? runError.message : "Campaign launch failed"
      };
    }
  };

  // DRAFT: Save Gift Selection Data (for drafts only - no recipient assignment)
  const saveDraftGiftSelection = async (
    campaignId: string,
    designerData: any,
    syncedGiftData?: {
      giftType: string;
      selectedGift: Gift | null;
      selectedGifts: Gift[];
      selectedBundle: string | null;
    }
  ) => {
    console.log(
      "💾 DRAFT: Saving gift selection data only (no assignment to recipients)..."
    );

    if (!isAPIReady) {
      throw new Error("API not ready");
    }

    // Use synced gift data if provided, otherwise fall back to state
    const currentGiftType = syncedGiftData?.giftType || giftTypeMode;
    const currentSelectedGift = syncedGiftData?.selectedGift || selectedGift;
    const currentSelectedGifts = syncedGiftData?.selectedGifts || selectedGifts;
    const currentSelectedBundle =
      syncedGiftData?.selectedBundle || selectedBundle;

    console.log("💾 Draft gift selection details:");
    console.log("  Gift Type:", currentGiftType);
    console.log("  Selected Bundle:", currentSelectedBundle || "None");
    console.log("  Selected Single Gift:", currentSelectedGift?.name || "None");
    console.log(
      "  Selected Multiple Gifts:",
      currentSelectedGifts.map((g) => g.name) || []
    );

    try {
      // Update campaign with gift selection data (without assigning to recipients)
      const giftSelectionData: any = {
        giftSelectionMode:
          currentGiftType === "hyper_personalize"
            ? "hyper_personalize"
            : "manual",
      };

      // Add contactListId from CampaignDesigner if available
      if (designerData.contactListId || designerData.selectedListId) {
        giftSelectionData.contactListId =
          designerData.contactListId || designerData.selectedListId;
        console.log(
          "💾 Added contactListId from CampaignDesigner to draft:",
          giftSelectionData.contactListId
        );
      }

      // Add total_recipients for booth pickup campaigns
      if (designerData.recipientCount) {
        giftSelectionData.total_recipients = designerData.recipientCount;
        console.log(
          "💾 Added recipientCount to draft for booth pickup:",
          giftSelectionData.total_recipients
        );
      }

      // Add gift catalog data based on type
      if (currentSelectedBundle) {
        giftSelectionData.selectedBundle = currentSelectedBundle;
      }

      if (currentGiftType === "manual_gift" && currentSelectedGift) {
        giftSelectionData.selectedGift = currentSelectedGift._id;
        giftSelectionData.giftCatalogs = [
          {
            catalogId: currentSelectedBundle || currentSelectedGift._id,
            selectedGift: [currentSelectedGift._id],
          },
        ];
      } else if (
        currentGiftType === "multi_gift" &&
        currentSelectedGifts.length > 0
      ) {
        const giftIds = currentSelectedGifts.map((gift) => gift._id);
        giftSelectionData.selectedRecipientGifts = giftIds;
        giftSelectionData.giftCatalogs = [
          {
            catalogId: currentSelectedBundle || giftIds[0],
            selectedGift: giftIds,
          },
        ];
      } else if (currentGiftType === "hyper_personalize") {
        if (currentSelectedBundle) {
          giftSelectionData.giftCatalogs = [
            {
              catalogId: currentSelectedBundle,
              selectedGift: [currentSelectedBundle],
            },
          ];
        }
      }

      // Update campaign with gift selection data
      const updateResult = await updateCampaign(
        apiUrl,
        organizationId,
        authToken,
        campaignId,
        giftSelectionData
      );

      console.log("💾 Draft gift selection data saved successfully");
      return { success: true, data: updateResult };
    } catch (error) {
      console.error("💾 Failed to save draft gift selection:", error);
      return { success: false, error: error };
    }
  };

  // =============================================
  // COMPLETE CAMPAIGN FLOW (ORCHESTRATOR)
  // =============================================

  // Complete 6-Step Campaign Creation Flow
  const executeCompleteCampaignFlow = async (
    designerData: any,
    goalData: {
      selectedGoal: string;
      selectedMotion: string;
      contextData: string;
      selectedEvent?: string;
      recipientSource?: string;
      selectedList?: string;
    },
    isDraft: boolean = false // Add isDraft parameter
  ) => {
    console.log(
      isDraft
        ? "💾 EXECUTING SAVE DRAFT FLOW (Steps 1-4C)..."
        : "🚀 EXECUTING COMPLETE CAMPAIGN FLOW..."
    );
    console.log("=".repeat(60));

    const {
      selectedGoal,
      selectedMotion,
      contextData,
      selectedEvent,
      recipientSource,
      selectedList,
    } = goalData;
    let campaignId: string = "";
    let campaignName: string = "";

    try {
      // STEP 1: Create Blank Campaign
      console.log("🔄 Starting Step 1: Create Blank Campaign");
      // Check if we have an existing campaign ID from the URL
    //   const existingCampaignId = searchParams.get("campaignId");
      const step1Result = await createBlankCampaign(designerData, goalData);

      if (!step1Result.campaignId) {
        throw new Error(
          "STEP 1 FAILED: Campaign creation failed - no campaign ID returned"
        );
      }

      campaignId = step1Result.campaignId;
      campaignName = step1Result.campaignName;
      console.log("✅ STEP 1 SUCCESS: Campaign created, proceeding to Step 2");

      // STEP 2: Update Campaign with Detailed Information
      console.log("🔄 Starting Step 2: Update Campaign Details");
      const step2Result = await updateCampaignDetails(
        campaignId,
        campaignName,
        designerData,
        contextData,
        step1Result.syncedGiftData
      );

      console.log("🔍 STEP 2 RESULT DEBUG:", {
        hasSuccess: "success" in step2Result,
        successValue: step2Result.success,
        resultKeys: Object.keys(step2Result),
        message: step2Result.message || step2Result.data?.message,
      });

      if (!step2Result.success) {
        console.error("❌ STEP 2 FAILED - Response details:", step2Result);
        throw new Error("STEP 2 FAILED: Campaign update failed");
      }
      console.log("✅ STEP 2 SUCCESS: Campaign updated, proceeding to Step 2A");

      // STEP 2A: Update Campaign Motion
      console.log("🔄 Starting Step 2A: Update Campaign Motion");
      const step2AResult = await updateCampaignMotion(
        campaignId,
        selectedMotion
      );
      if (step2AResult.success) {
        console.log("✅ STEP 2A SUCCESS: Motion updated, proceeding to Step 3");
      } else {
        console.log(
          "⚠️ STEP 2A WARNING: Motion not updated, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step2AResult as any).info || "Not applicable"
        );
      }

      // STEP 3: Add Recipients to Campaign
      console.log("🔄 Starting Step 3: Add Recipients");
      const step3Result = await addRecipientsToCampaign(
        campaignId,
        designerData
      );

      // Note: Recipients step is non-critical, so we continue even if it fails
      if (step3Result.success) {
        console.log(
          "✅ STEP 3 SUCCESS: Recipients added, proceeding to Step 4"
        );
      } else {
        console.log(
          "⚠️ STEP 3 WARNING: Recipients not added, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step3Result as any).warning || (step3Result as any).info || "Unknown"
        );
      }

      // STEP 4A: Update Landing Page Configuration (if available)
      console.log("🔄 Starting Step 4A: Update Landing Page Configuration");
      const step4AResult = await updateLandingPageConfigStep(
        campaignId,
        designerData
      );

      // Note: Landing page config is non-critical, so we continue even if it fails
      if (step4AResult.success) {
        console.log(
          "✅ STEP 4A SUCCESS: Landing page configuration updated, proceeding to Step 4B"
        );
      } else {
        console.log(
          "⚠️ STEP 4A WARNING: Landing page configuration not updated, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step4AResult as any).warning ||
            (step4AResult as any).info ||
            "Not applicable or failed"
        );
      }

      // STEP 4B: Update Gift Card (Outcome Card) (if available)
      console.log("🔄 Starting Step 4B: Update Gift Card (Outcome Card)");
      const step4BResult = await updateGiftCardStep(campaignId, designerData);

      // Note: Gift card update is non-critical, so we continue even if it fails
      if (step4BResult.success) {
        console.log(
          "✅ STEP 4B SUCCESS: Gift card updated, proceeding to Step 4C"
        );
      } else {
        console.log(
          "⚠️ STEP 4B WARNING: Gift card not updated, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step4BResult as any).warning ||
            (step4BResult as any).info ||
            "Not applicable or failed"
        );
      }

      // STEP 4C: Update Event with Campaign ID (if drive-event goal)
      console.log("🔄 Starting Step 4C: Update Event");
      const step4CResult = await updateEventWithCampaignId(
        campaignId,
        selectedGoal,
        selectedEvent
      );

      // Note: Event update is non-critical, so we continue even if it fails
      if (step4CResult.success) {
        console.log("✅ STEP 4C SUCCESS: Event updated, proceeding to Step 4D");
      } else {
        console.log(
          "⚠️ STEP 4C WARNING: Event not updated, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step4CResult as any).warning ||
            (step4CResult as any).info ||
            "Not applicable or failed"
        );
      }

      // STEP 4D: Update Email Templates (if available)
      console.log("🔄 Starting Step 4D: Update Email Templates");
      const step4DResult = await updateEmailTemplatesStep(
        campaignId,
        designerData
      );

      // Note: Email templates update is non-critical, so we continue even if it fails
      if (step4DResult.success) {
        console.log(
          "✅ STEP 4D SUCCESS: Email templates updated, proceeding to Step 5"
        );
      } else {
        console.log(
          "⚠️ STEP 4D WARNING: Email templates not updated, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step4DResult as any).warning ||
            (step4DResult as any).info ||
            "Not applicable or failed"
        );
      }

      // If draft, save gift selection data and stop here (don't assign to recipients)
      if (isDraft) {
        console.log("💾 STEP 5 (Draft): Saving gift selection data only...");

        // Save gift selection data to campaign without assigning to recipients
        const draftGiftData = await saveDraftGiftSelection(
          campaignId,
          designerData,
          step1Result.syncedGiftData
        );

        if (draftGiftData.success) {
          console.log("✅ Draft gift selection saved successfully");
        } else {
          console.log("⚠️ Warning: Draft gift selection not saved");
        }

        console.log(
          "💾 Draft save flow complete. Skipping recipient assignment and launch."
        );
        return { success: true, campaignId, draft: true };
      }

      // STEP 5: Gift Selection API (using specialized gift APIs)
      console.log("🔄 Starting Step 5: Gift Selection with Specialized APIs");
      const step5Result = await executeGiftSelection(
        campaignId,
        designerData,
        step1Result.syncedGiftData
      );

      // Note: Gift selection is non-critical, so we continue even if it fails
      if (step5Result.success) {
        console.log(
          "✅ STEP 5 SUCCESS: Gift selection completed via specialized API, proceeding to Step 6"
        );
      } else {
        console.log(
          "⚠️ STEP 5 WARNING: Gift selection not completed, but continuing flow"
        );
        console.log(
          "   Reason:",
          (step5Result as any).warning ||
            (step5Result as any).info ||
            "Not applicable or failed"
        );
      }

      // STEP 6: Run Campaign API (final step)
      console.log("🔄 Starting Step 6: Run Campaign");
      const step6Result = await runCampaignStep(campaignId, designerData);

      console.log("step6Result", step6Result);

      if (step6Result.success) {
        console.log("✅ STEP 6 SUCCESS: Campaign launched successfully");
        console.log("🎉 COMPLETE CAMPAIGN FLOW FINISHED SUCCESSFULLY!");
        console.log("📊 FINAL SUMMARY:");
        console.log("  ✅ Campaign Created (ID:", campaignId + ")");
        console.log("  ✅ Campaign Updated");
        console.log(
          "  " + (step2AResult.success ? "✅" : "⚠️") + " Motion:",
          step2AResult.success
            ? "Updated"
            : "Warning - " + ((step2AResult as any).info || "Not applicable")
        );
        console.log(
          "  " + (step3Result.success ? "✅" : "⚠️") + " Recipients:",
          step3Result.success
            ? "Added"
            : "Warning - " +
                ((step3Result as any).warning || (step3Result as any).info)
        );
        console.log(
          "  " + (step4AResult.success ? "✅" : "⚠️") + " Landing Page Config:",
          step4AResult.success
            ? "Updated"
            : "Warning - " +
                ((step4AResult as any).warning || (step4AResult as any).info)
        );
        console.log(
          "  " + (step4BResult.success ? "✅" : "⚠️") + " Gift Card:",
          step4BResult.success
            ? "Updated"
            : "Warning - " +
                ((step4BResult as any).warning || (step4BResult as any).info)
        );
        console.log(
          "  " + (step4CResult.success ? "✅" : "⚠️") + " Event:",
          step4CResult.success
            ? "Updated"
            : "Warning - " +
                ((step4CResult as any).warning || (step4CResult as any).info)
        );
        console.log(
          "  " + (step4DResult.success ? "✅" : "⚠️") + " Email Templates:",
          step4DResult.success
            ? "Updated"
            : "Warning - " +
                ((step4DResult as any).warning || (step4DResult as any).info)
        );
        console.log(
          "  " +
            (step5Result.success ? "✅" : "⚠️") +
            " Gift Selection (Specialized API):",
          step5Result.success
            ? "Completed"
            : "Warning - " +
                ((step5Result as any).warning || (step5Result as any).info)
        );
        console.log("  ✅ Campaign Launch: Launched Successfully");
        console.log("=".repeat(60));

        return { success: true, campaignId, launched: true };
      } else {
        console.log("❌ STEP 6 FAILED: Campaign launch failed");
        console.log(
          "   Reason:",
          step6Result.warning || "Campaign launch failed"
        );
        console.log("⚠️ CAMPAIGN FLOW COMPLETED WITH LAUNCH FAILURE");
        console.log("📊 FINAL SUMMARY:");
        console.log("  ✅ Campaign Created (ID:", campaignId + ")");
        console.log("  ✅ Campaign Updated");
        console.log(
          "  " + (step2AResult.success ? "✅" : "⚠️") + " Motion:",
          step2AResult.success
            ? "Updated"
            : "Warning - " + ((step2AResult as any).info || "Not applicable")
        );
        console.log(
          "  " + (step3Result.success ? "✅" : "⚠️") + " Recipients:",
          step3Result.success
            ? "Added"
            : "Warning - " +
                ((step3Result as any).warning || (step3Result as any).info)
        );
        console.log(
          "  " + (step4AResult.success ? "✅" : "⚠️") + " Landing Page Config:",
          step4AResult.success
            ? "Updated"
            : "Warning - " +
                ((step4AResult as any).warning || (step4AResult as any).info)
        );
        console.log(
          "  " + (step4BResult.success ? "✅" : "⚠️") + " Gift Card:",
          step4BResult.success
            ? "Updated"
            : "Warning - " +
                ((step4BResult as any).warning || (step4BResult as any).info)
        );
        console.log(
          "  " + (step4CResult.success ? "✅" : "⚠️") + " Event:",
          step4CResult.success
            ? "Updated"
            : "Warning - " +
                ((step4CResult as any).warning || (step4CResult as any).info)
        );
        console.log(
          "  " + (step4DResult.success ? "✅" : "⚠️") + " Email Templates:",
          step4DResult.success
            ? "Updated"
            : "Warning - " +
                ((step4DResult as any).warning || (step4DResult as any).info)
        );
        console.log(
          "  " +
            (step5Result.success ? "✅" : "⚠️") +
            " Gift Selection (Specialized API):",
          step5Result.success
            ? "Completed"
            : "Warning - " +
                ((step5Result as any).warning || (step5Result as any).info)
        );
        console.log("  ❌ Campaign Launch: FAILED");
        console.log("=".repeat(60));

        return {
          success: false,
          campaignId,
          launched: false,
          partialSuccess: true,
          error: `Campaign created but launch failed: ${step6Result.warning || "Unknown launch error"}`,
          message: "Campaign saved as draft but could not be launched"
        };
      }
    } catch (error) {
      console.error("❌ COMPLETE CAMPAIGN FLOW FAILED!");
      console.error("=".repeat(60));
      console.error("💥 FAILURE DETAILS:");
      console.error(
        "   Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(
        "   Campaign ID (if created):",
        campaignId || "Not created"
      );
      console.error(
        "   Campaign Name (if created):",
        campaignName || "Not created"
      );

      // Determine which step failed based on the error message
      if (error instanceof Error) {
        if (error.message.includes("STEP 1")) {
          console.error("   Failed at: Step 1 - Campaign Creation");
          console.error("   Impact: No campaign was created");
        } else if (error.message.includes("STEP 2")) {
          console.error("   Failed at: Step 2 - Campaign Update");
          console.error("   Impact: Campaign created but not fully configured");
        } else {
          console.error("   Failed at: Unknown step");
        }
      }

      console.error("=".repeat(60));

      // Return error details instead of throwing
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        campaignId: campaignId || undefined,
        step:
          error instanceof Error && error.message.includes("STEP")
            ? error.message.match(/STEP (\d+)/)?.[1]
            : "unknown",
      };
    }
  };

  // New function for booth giveaway campaign flow
  const executeBoothGiveawayCampaignFlow = async (
    designerData: any,
    goalData: {
      selectedGoal: string;
      selectedMotion: string;
      contextData: string;
      selectedEvent?: string;
    }
  ) => {
    console.log("🎪 EXECUTING BOOTH GIVEAWAY CAMPAIGN FLOW...");
    console.log("=".repeat(60));

    try {
      // STEP 1: Create Blank Campaign
      // Check if we have an existing campaign ID from the URL
    //   const existingCampaignId = searchParams.get("campaignId");
      const step1Result = await createBlankCampaign(designerData, goalData);
      const { campaignId, campaignName, syncedGiftData } = step1Result;

      if (!campaignId) {
        throw new Error(
          "STEP 1 FAILED: Campaign creation failed - no campaign ID returned"
        );
      }
      console.log("✅ STEP 1 SUCCESS: Campaign created with ID:", campaignId);

      // STEP 2: Update Campaign with Booth-Specific Details
      const boothUpdateData = {
        ...designerData,
        total_recipients: (() => {
          console.log("🎪 DEBUG booth total_recipients calculation:");
          console.log("  recipientCount:", designerData.recipientCount);
          console.log("  boothCapacity:", designerData.boothCapacity);
          console.log("  selectedContactsCount:", designerData.selectedContactsCount);
          const result = designerData.recipientCount ||
            designerData.boothCapacity || 
            designerData.selectedContactsCount || 0;
          console.log("  final result:", result);
          return result;
        })(),
        motion: "booth-pickup",
      };
      const step2Result = await updateCampaignDetails(
        campaignId,
        campaignName,
        boothUpdateData,
        goalData.contextData,
        syncedGiftData
      );

      if (!step2Result.success) {
        throw new Error("STEP 2 FAILED: Campaign update failed");
      }
      console.log("✅ STEP 2 SUCCESS: Campaign updated with booth details");

      // STEP 2A: Update Campaign Motion
      const step2AResult = await updateCampaignMotion(
        campaignId,
        "booth-pickup"
      );
      if (!step2AResult.success) {
        console.log(
          "⚠️ STEP 2A WARNING: Motion not updated, but continuing flow"
        );
      } else {
        console.log("✅ STEP 2A SUCCESS: Motion updated to booth-pickup");
      }

      // STEP 4A: Update Landing Page Configuration
      const step4AResult = await updateLandingPageConfigStep(
        campaignId,
        designerData
      );
      if (step4AResult.success) {
        console.log("✅ STEP 4A SUCCESS: Landing page configuration updated");
      } else {
        console.log(
          "⚠️ STEP 4A WARNING: Landing page configuration not updated"
        );
      }

      // STEP 4B: Update Gift Card
      const step4BResult = await updateGiftCardStep(campaignId, designerData);
      if (step4BResult.success) {
        console.log("✅ STEP 4B SUCCESS: Gift card updated");
      } else {
        console.log("⚠️ STEP 4B WARNING: Gift card not updated");
      }

      // STEP 4C: Update Event with Campaign ID (if drive-event goal)
      const step4CResult = await updateEventWithCampaignId(
        campaignId,
        goalData.selectedGoal,
        goalData.selectedEvent
      );
      if (step4CResult.success) {
        console.log("✅ STEP 4C SUCCESS: Event updated with campaign ID");
      } else {
        console.log("⚠️ STEP 4C WARNING: Event not updated with campaign ID");
      }

      // STEP 4D: Update Email Templates (if available)
      const step4DResult = await updateEmailTemplatesStep(
        campaignId,
        designerData
      );
      if (step4DResult.success) {
        console.log("✅ STEP 4D SUCCESS: Email templates updated");
      } else {
        console.log("⚠️ STEP 4D WARNING: Email templates not updated");
      }

      // STEP 5: Gift Selection (modified for booth)
      const step5Result = await executeGiftSelection(
        campaignId,
        designerData,
        syncedGiftData
      );
      if (step5Result.success) {
        console.log("✅ STEP 5 SUCCESS: Gift selection completed");
      } else {
        console.log("⚠️ STEP 5 WARNING: Gift selection not completed");
      }

      // STEP 6: Run Booth Campaign
      const step6Result = await runBoothCampaign(campaignId);
      if (!step6Result.success) {
        throw new Error(
          "STEP 6 FAILED: Campaign run failed - " + step6Result.message
        );
      }
      console.log("✅ STEP 6 SUCCESS: Booth campaign launched successfully");

      console.log("🎉 BOOTH GIVEAWAY CAMPAIGN FLOW COMPLETED!");
      console.log("=".repeat(60));

      return {
        success: true,
        campaignId,
        launched: true,
        boothGiveawayCTALink: step6Result.boothGiveawayCTALink,
      };
    } catch (error) {
      console.error("❌ BOOTH GIVEAWAY CAMPAIGN FLOW FAILED:", error);
      return {
        success: false,
        launched: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // New function to run booth campaign
  const runBoothCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/run`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sendForApproval: false }),
        }
      );

      const result = await response.json();
      return {
        success: response.ok,
        boothGiveawayCTALink: result.boothGiveawayCTALink,
        message: result.message,
      };
    } catch (error) {
      console.error("Failed to run booth campaign:", error);
      return {
        success: false,
        message: "Failed to run booth campaign",
      };
    }
  };

  // Modified handleLaunch function
  const handleLaunch = async () => {
    if (!isAPIReady) {
      console.error("❌ API not ready for launch");
      setLaunchError("API not ready. Please wait a moment and try again.");
      return;
    }

    // Check wallet balance before proceeding
    // const { hasInsufficientFunds, campaignPrice, isWalletLoading } = checkInsufficientFunds();

    // if (isWalletLoading) {
    //   showNotification("Please wait while we check your wallet balance...", "error");
    //   return;
    // }

    // if (hasInsufficientFunds) {
    //   if (walletBalance === null) {
    //     showNotification(
    //       "Unable to verify wallet balance. Please check your connection and try again.",
    //       "error"
    //     );
    //   } else {
    //     showNotification(
    //       `Insufficient wallet balance. Campaign cost: $${campaignPrice.toFixed(2)}, Available: $${(walletBalance || 0).toFixed(2)}`,
    //       "error"
    //     );
    //   }
    //   return;
    // }

    const campaignIdInParams = searchParams.get("campaignId");

    console.log("--------- campaignIdInParams ---------", campaignIdInParams);

    setIsLaunching(true);
    try {
      // Check if CampaignDesigner has exposed its state
      const designerData = (window as any).campaignDesignerState;

      console.log(
        "----------- designerData -------------",
        designerData.recipientsCount
      );
      console.log("----------- recipientCount (booth) ---", designerData.recipientCount);
      console.log("------------- selectedMotion ---------", selectedMotion);
      console.log("----------- Full designerData --------", designerData);
      
      // Force trigger window state update if needed
      if (selectedMotion === "booth-pickup" && (!designerData.recipientCount || designerData.recipientCount === 0)) {
        console.log("⚠️ WARNING: recipientCount is 0 or missing for booth pickup campaign!");
        console.log("Available data keys:", Object.keys(designerData));
      }

      // Validate recipient count based on campaign type
      if (selectedMotion === "booth-pickup") {
        if (!designerData.recipientCount || designerData.recipientCount === 0) {
          showNotification(
            "No recipient count found, please set the expected number of booth visitors",
            "error"
          );
          setIsLaunching(false);
          return;
        }
      } else {
        if (designerData.recipientsCount === 0) {
          showNotification(
            "No recipients found, please add recipients to the campaign",
            "error"
          );
          setIsLaunching(false);
          return;
        }
      }

      if (!designerData) {
        console.error("❌ No campaign designer data available");
        setLaunchError(
          "Campaign setup is incomplete. Please complete the campaign setup before saving."
        );
        return;
      }

      // Map frontend goal values to backend enum values
      const goalMapping: { [key: string]: string } = {
        "drive-event": "delight_event_attendees",
        "pipeline-acceleration": "create_more_pipeline",
        "product-launch": "create_more_pipeline",
        "customer-relationships": "reduce_churn",
        "quick-send": "",
        "booth-pickup": "delight_event_attendees", // Add booth-pickup mapping
      };

      // Create basic campaign data for goal selection step (simplified for campaigns2 API)
    //   const basicCampaignData = {
    //     name:
    //       `${selectedGoalObj?.title} - ${selectedMotionObj?.title}` ||
    //       "Draft Campaign",
    //     description: contextData || "",
    //     goal: selectedGoal ? goalMapping[selectedGoal] || "" : "",
    //     source: recipientSource || "manual",
    //   };

      // Create blank campaign using campaigns2 API
    //   console.log(
    //     "📝 Creating campaign with campaigns2 API:",
    //     basicCampaignData
    //   );
    //   const result = await createCampaign(
    //     apiUrl,
    //     organizationId,
    //     authToken,
    //     basicCampaignData
    //   );
    //   console.log("result", result);

    //   if (!result.campaign_id) {
    //     console.error("❌ Campaign creation failed:", result.error);
    //     throw new Error(`Failed to create campaign: ${result.error}`);
    //   }

    //   console.log("✅ Campaign created successfully:", result);

      if (currentStep === "campaign-designer" && designerData) {
        // Use the appropriate campaign flow function based on motion
        const goalData = {
          selectedGoal: selectedGoal || "",
          selectedMotion: selectedMotion || "",
          contextData: contextData || "",
          selectedEvent: selectedEvent || "",
          recipientSource: recipientSource || "",
          selectedList: selectedList || "",
        };

        let flowResult;

        // Check if this is a booth giveaway campaign
        if (selectedMotion === "booth-pickup") {
          flowResult = await executeBoothGiveawayCampaignFlow(
            designerData,
            goalData
          );
        } else {
          flowResult = await executeCompleteCampaignFlow(
            designerData,
            goalData
          );
        }

        if (flowResult.success && flowResult.launched) {
          // Full success - campaign created and launched
          setLaunchedCampaignId(flowResult.campaignId || null);
          if (flowResult.boothGiveawayCTALink) {
            setBoothGiveawayCTALink(flowResult.boothGiveawayCTALink);
          }
          setShowSuccessModal(true);
        } else if (flowResult.partialSuccess) {
          // Partial success - campaign created but launch failed
          setLaunchedCampaignId(flowResult.campaignId || null);
          showNotification(
            `Campaign created but launch failed: ${flowResult.error || "Unknown error"}. You can try launching it from the campaigns page.`,
            "error"
          );
        } else {
          // Complete failure - campaign creation failed
          console.error("❌ Campaign flow failed with details:", {
            error: flowResult.error,
            step: flowResult.step,
            campaignId: flowResult.campaignId,
          });

          let errorMessage = "Failed to save campaign. ";

          switch (flowResult.step) {
            case "1":
              errorMessage +=
                "Could not create the initial campaign. Please try again.";
              break;
            case "2":
              errorMessage +=
                "Campaign was created but could not be updated with details.";
              if (flowResult.campaignId) {
                errorMessage += ` Campaign ID: ${flowResult.campaignId}`;
              }
              break;
            case "4C":
              errorMessage +=
                "Campaign was created but could not be linked to the event.";
              break;
            case "5":
              errorMessage += "Campaign was created but gift selection failed.";
              break;
            case "6":
              errorMessage += "Campaign was created but could not be launched.";
              break;
            default:
              errorMessage +=
                flowResult.error ||
                "An unexpected error occurred. Please try again.";
          }

          setLaunchError(errorMessage);
        }
      } else {
        console.error("❌ No campaign designer data available");
        setLaunchError(
          "Campaign setup is incomplete. Please complete all required steps."
        );
      }
    } catch (error) {
      console.error("❌ CAMPAIGN SAVE FAILED:");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
    //   alert("Failed to save campaign. Please try again.");
      showNotification(
        "Failed to save campaign. Please try again.",
        "error"
      );
    } finally {
      console.log("🔄 Resetting launch button state...");
      setIsLaunching(false);
    }
  };

  // Handle back to goal selection
  const handleBackToGoalSelection = () => {
    setCurrentStep("goal-selection");
  };

  // Modal handlers
  const handleViewDashboard = () => {
    if (launchedCampaignId) {
      router.push(`/campaign-details/${launchedCampaignId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleCreateNewCampaign = () => {
    router.push("/campaigns/create");
  };

  const handleReturnToEvent = () => {
    if (selectedEvent) {
      router.push(`/event/${selectedEvent}`);
    } else {
      router.push("/events");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    router.push("/dashboard");
  };

  // Check if we can continue
  const canContinue = () => {
    if (!selectedGoal || !selectedMotion) return false;

    // Quick Send goal doesn't need context data
    if (selectedGoal === "quick-send") {
      return true;
    }

    // Context data validation
    if (selectedGoal === "drive-event") {
      if (eventSource === "existing" && !selectedEvent) return false;
      if (eventSource === "url" && !eventUrl) return false;
      if (!eventSource) return false;
    } else {
      // For other goals, require context data
      if (!contextData) return false;
    }

    return true;
  };

  // Filter events based on search term and exclude draft events
  const getFilteredEvents = () => {
    // First filter out draft events
    const nonDraftEvents = existingEvents.filter(
      (event) => event.status?.toLowerCase() !== "draft"
    );

    // Then apply search term filter if it exists
    if (!searchTerm) return nonDraftEvents;

    return nonDraftEvents.filter(
      (event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.eventTopic &&
          event.eventTopic.some((topic) =>
            topic.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        {/* Left Sidebar */}
        <AdminSidebar />

        {/* Main Content with Skeleton */}
        <CampaignCreateSkeleton />
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 pt-3 bg-primary">
        <div className="p-6 bg-gray-50 rounded-tl-3xl min-h-screen border-l border-gray-200 sm:border-l-0 sm:border-t sm:border-r  shadow-lg">
          {currentStep === "goal-selection" ? (
            <div className="w-full">
              {/* Replace header with PageHeader component */}
              <PageHeader
                backLink={{
                  href: "/campaigns",
                  text: "Back to campaigns",
                }}
                title="Create Your Campaign"
                description="Start by defining your goal and motion to create a targeted, effective campaign"
              />

              {/* Main content */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 mx-6 md:mx-8 p-6 md:p-8">
                {/* Goal selection */}
                <FramerMotion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Target
                      className="w-5 h-5"
                      style={{ color: "rgb(105, 65, 198)" }}
                    />
                    Select your campaign goal
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Choose the primary business objective you want to achieve
                    with this campaign.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {campaignGoals.map((goal) => (
                      <FramerMotion.div
                        key={goal.id}
                        initial="initial"
                        animate="show"
                        whileHover="hover"
                        variants={{
                          ...itemVariants,
                          ...cardHoverVariants,
                        }}
                        onClick={() => handleGoalSelect(goal.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all h-full flex flex-col relative overflow-hidden ${
                          selectedGoal === goal.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200"
                        }`}
                      >
                        <div
                          className="absolute inset-0 z-0"
                          style={{
                            background: "#ffffff",
                            backgroundImage: `
                              radial-gradient(
                                circle at top right,
                                rgba(173, 109, 244, 0.5),
                                transparent 70%
                              )
                            `,
                            filter: "blur(80px)",
                            backgroundRepeat: "no-repeat",
                            opacity: selectedGoal === goal.id ? "1" : "0.7",
                          }}
                        />
                        <div
                          className={`w-10 h-10 rounded-lg ${goal.color} flex items-center justify-center mb-2 relative z-10`}
                        >
                          <goal.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-medium text-base mb-1 relative z-10">
                          {goal.title}
                        </h3>
                        <p className="text-gray-600 text-xs relative z-10">
                          {goal.description}
                        </p>
                      </FramerMotion.div>
                    ))}
                  </div>

                  {/* Motion selection - only shown when a goal is selected */}
                  {selectedGoal && (
                    <FramerMotion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 pt-6 border-t border-gray-200"
                    >
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Megaphone
                          className="w-5 h-5"
                          style={{ color: "rgb(105, 65, 198)" }}
                        />
                        Select your campaign motion
                      </h3>
                      <p className="text-sm text-gray-500 mb-5">
                        This helps us tailor your campaign structure and gift
                        suggestions.
                      </p>

                      <div className="mb-6">
                        <MotionSelect
                          options={motionOptions}
                          value={selectedMotion}
                          onChange={handleMotionSelect}
                          placeholder="Select a motion to determine how your campaign will engage with your audience"
                        />
                      </div>

                      {/* Context collection section - only shown when a motion is selected and not Quick Send */}
                      {selectedMotion && selectedGoal !== "quick-send" && (
                        <FramerMotion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 pt-6 border-t border-gray-200"
                        >
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Info
                              className="w-5 h-5"
                              style={{ color: "rgb(105, 65, 198)" }}
                            />
                            {selectedMotionObj?.contextQuestion}
                          </h3>

                          {/* Context collection based on goal type */}
                          {selectedGoal === "drive-event" ? (
                            <div className="space-y-6">
                              {/* Auto-loading indicator */}
                              {isAutoLoadingEvent && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                  <span className="text-sm text-blue-700">
                                    Loading event from URL parameter...
                                  </span>
                                </div>
                              )}
                              <FramerMotion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="overflow-hidden"
                              >
                                {isLoadingEvents ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="border rounded-lg overflow-hidden animate-pulse"
                                      >
                                        <div className="h-32 bg-gray-200"></div>
                                        <div className="p-3">
                                          <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                                          <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : eventError ? (
                                  <div className="text-center py-6 border rounded-lg">
                                    <p className="text-red-500 mb-2">
                                      {eventError}
                                    </p>
                                    <button
                                      className="text-primary text-sm hover:underline"
                                      onClick={() => fetchEvents()}
                                    >
                                      Try again
                                    </button>
                                  </div>
                                ) : existingEvents.length === 0 ? (
                                  <div className="mt-6 border-t pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <button
                                        onClick={() => setShowAllEvents(true)}
                                        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                                      >
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                                          <Search className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <p className="font-medium">
                                          Find Existing Event
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                          Search from events already in our
                                          system
                                        </p>
                                      </button>

                                      <button
                                        onClick={() => setEventSource("url")}
                                        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                                      >
                                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                                          <Globe className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <p className="font-medium">
                                          Add Public Event
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                          Enter URL for a public event
                                        </p>
                                      </button>
                                    </div>

                                    <div className="mt-4 flex justify-center">
                                      <Link
                                        href="/event/create"
                                        className="text-primary text-sm hover:underline flex items-center"
                                      >
                                        Or create a new event from scratch
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                      </Link>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                                    {/* Top 4 recent non-draft events as cards */}
                                    {existingEvents
                                      .filter(
                                        (event) =>
                                          event.status?.toLowerCase() !==
                                          "draft"
                                      )
                                      .slice(0, 4)
                                      .map((event) => (
                                        <FramerMotion.div
                                          key={event.eventId}
                                          initial="initial"
                                          animate="show"
                                          whileHover="hover"
                                          variants={{
                                            ...itemVariants,
                                            ...cardHoverVariants,
                                          }}
                                          onClick={() => {
                                            setSelectedEvent(event.eventId);
                                            setEventSource("existing");
                                          }}
                                          className={`border rounded-lg overflow-hidden cursor-pointer transition-all h-full flex flex-col relative ${
                                            selectedEvent === event.eventId
                                              ? "ring-2 ring-primary border-primary"
                                              : "border-gray-200"
                                          }`}
                                        >
                                          <div
                                            className="absolute inset-0 z-0"
                                            style={{
                                              background: "#ffffff",
                                              backgroundImage: `
                                              radial-gradient(
                                                circle at top right,
                                                rgba(173, 109, 244, 0.5),
                                                transparent 70%
                                              )
                                            `,
                                              filter: "blur(80px)",
                                              backgroundRepeat: "no-repeat",
                                              opacity:
                                                selectedEvent === event.eventId
                                                  ? "1"
                                                  : "0.7",
                                            }}
                                          />
                                          <div className="h-32 relative bg-gray-100 z-10">
                                            <Image
                                              src={
                                                event.media?.banner ||
                                                "/images/event-placeholder.jpg"
                                              }
                                              alt={event.name}
                                              fill
                                              style={{ objectFit: "cover" }}
                                            />
                                            {event.status && (
                                              <span
                                                className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${getStatusClass(
                                                  event.status
                                                )}`}
                                              >
                                                {event.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  event.status.slice(1)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="p-3 relative z-10">
                                            <h3 className="font-medium text-sm line-clamp-1">
                                              {event.name}
                                            </h3>
                                            <div className="flex items-center mt-1 text-xs text-gray-500">
                                              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">
                                                {new Date(
                                                  event.eventDate
                                                ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                })}
                                              </span>
                                              <span className="mx-1">•</span>
                                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">
                                                {event.location}
                                              </span>
                                            </div>
                                          </div>
                                        </FramerMotion.div>
                                      ))}

                                    {/* Unified Add Event card */}
                                    <FramerMotion.div
                                      initial="initial"
                                      animate="show"
                                      whileHover="hover"
                                      variants={{
                                        ...itemVariants,
                                        ...cardHoverVariants,
                                      }}
                                      onClick={() => setShowAllEvents(true)}
                                      className="border border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all h-56 flex flex-col relative"
                                    >
                                      <div
                                        className="absolute inset-0 z-0"
                                        style={{
                                          background: "#ffffff",
                                          backgroundImage: `
                                            radial-gradient(
                                              circle at top right,
                                              rgba(173, 109, 244, 0.5),
                                              transparent 70%
                                            )
                                          `,
                                          filter: "blur(80px)",
                                          backgroundRepeat: "no-repeat",
                                          opacity: "0.7",
                                        }}
                                      />
                                      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                          <Plus className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="font-medium text-primary">
                                          Find or Add Event
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 text-center px-3">
                                          Search existing events or add a new
                                          one
                                        </p>
                                      </div>
                                    </FramerMotion.div>
                                  </div>
                                )}

                                {/* All Events Modal/Expanded View */}
                                {showAllEvents && (
                                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
                                      <div className="flex justify-between items-center p-4 border-b">
                                        <h3 className="text-lg font-semibold flex items-center">
                                          <CalendarRange
                                            className="w-5 h-5 mr-2"
                                            style={{
                                              color: "rgb(105, 65, 198)",
                                            }}
                                          />
                                          Find or Add Event
                                        </h3>
                                        <button
                                          onClick={() => {
                                            setShowAllEvents(false);
                                            setEventSource(null);
                                          }}
                                          className="p-2 rounded-full hover:bg-gray-100"
                                        >
                                          <X
                                            className="w-5 h-5"
                                            style={{
                                              color: "rgb(105, 65, 198)",
                                            }}
                                          />
                                        </button>
                                      </div>

                                      {/* Tabs */}
                                      <div className="flex border-b">
                                        <button
                                          onClick={() => setEventSource(null)}
                                          className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
                                            !eventSource
                                              ? "border-b-2 border-primary text-primary"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          <Search
                                            className="w-4 h-4 inline mr-2"
                                            style={{
                                              color: !eventSource
                                                ? "rgb(105, 65, 198)"
                                                : "currentColor",
                                            }}
                                          />
                                          Find Existing Event
                                        </button>
                                        <button
                                          onClick={() => setEventSource("url")}
                                          className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
                                            eventSource === "url"
                                              ? "border-b-2 border-primary text-primary"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          <Globe
                                            className="w-4 h-4 inline mr-2"
                                            style={{
                                              color:
                                                eventSource === "url"
                                                  ? "rgb(105, 65, 198)"
                                                  : "currentColor",
                                            }}
                                          />
                                          Add Event URL
                                        </button>
                                      </div>

                                      {/* Search Tab Content */}
                                      {!eventSource && (
                                        <>
                                          <div className="p-4 border-b">
                                            <div className="relative">
                                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search
                                                  className="h-5 w-5"
                                                  style={{
                                                    color: "rgb(105, 65, 198)",
                                                  }}
                                                />
                                              </div>
                                              <input
                                                type="text"
                                                placeholder="Search events by name, location, or topic..."
                                                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                  setSearchTerm(e.target.value)
                                                }
                                              />
                                            </div>
                                          </div>

                                          <div className="flex-1 overflow-y-auto p-4">
                                            {isLoadingEvents ? (
                                              <div className="space-y-2">
                                                {[...Array(3)].map((_, i) => (
                                                  <div
                                                    key={i}
                                                    className="border rounded-lg p-4 animate-pulse"
                                                  >
                                                    <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                                                    <div className="flex gap-2">
                                                      <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                                                      <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : getFilteredEvents().length ===
                                              0 ? (
                                              <div className="text-center py-6">
                                                <p className="text-gray-500">
                                                  No events match your search
                                                </p>
                                                <button
                                                  className="text-primary text-sm mt-2 hover:underline"
                                                  onClick={() =>
                                                    setSearchTerm("")
                                                  }
                                                >
                                                  Clear search
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {getFilteredEvents().map(
                                                  (event) => (
                                                    <div
                                                      key={event.eventId}
                                                      onClick={() => {
                                                        setSelectedEvent(
                                                          event.eventId
                                                        );
                                                        setEventSource(
                                                          "existing"
                                                        );
                                                        setShowAllEvents(false);
                                                      }}
                                                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                                                        selectedEvent ===
                                                        event.eventId
                                                          ? "border-primary bg-primary/5"
                                                          : "border-gray-200"
                                                      }`}
                                                    >
                                                      <div className="flex justify-between items-start">
                                                        <div className="flex gap-3">
                                                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <div className="h-full w-full relative">
                                                              <Image
                                                                src={
                                                                  event.media
                                                                    ?.banner ||
                                                                  "/images/event-placeholder.jpg"
                                                                }
                                                                alt={event.name}
                                                                fill
                                                                style={{
                                                                  objectFit:
                                                                    "cover",
                                                                }}
                                                              />
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <h3 className="font-medium">
                                                              {event.name}
                                                            </h3>
                                                            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                                                              <span className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {new Date(
                                                                  event.eventDate
                                                                ).toLocaleDateString(
                                                                  "en-US",
                                                                  {
                                                                    month:
                                                                      "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                  }
                                                                )}
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {event.status && (
                                                          <span
                                                            className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(
                                                              event.status
                                                            )}`}
                                                          >
                                                            {event.status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                              event.status.slice(
                                                                1
                                                              )}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center mt-2 text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        <span>
                                                          {event.location}
                                                        </span>
                                                      </div>
                                                      {event.eventTopic &&
                                                        event.eventTopic
                                                          .length > 0 && (
                                                          <div className="flex flex-wrap gap-1 mt-2">
                                                            {event.eventTopic
                                                              .slice(0, 2)
                                                              .map(
                                                                (
                                                                  topic,
                                                                  index
                                                                ) => (
                                                                  <span
                                                                    key={index}
                                                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                                                  >
                                                                    {topic}
                                                                  </span>
                                                                )
                                                              )}
                                                            {event.eventTopic
                                                              .length > 2 && (
                                                              <span className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                                                                +
                                                                {event
                                                                  .eventTopic
                                                                  .length - 2}
                                                              </span>
                                                            )}
                                                          </div>
                                                        )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}

                                      {/* URL Tab Content */}
                                      {eventSource === "url" && (
                                        <div className="flex-1 p-4 flex flex-col">
                                          <div className="mb-4 relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                              <Globe
                                                className="h-5 w-5"
                                                style={{
                                                  color: "rgb(105, 65, 198)",
                                                }}
                                              />
                                            </div>
                                            <input
                                              type="text"
                                              placeholder="https://eventbrite.com/your-event or other event URL"
                                              className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                              value={eventUrl}
                                              onChange={(e) =>
                                                setEventUrl(e.target.value)
                                              }
                                            />
                                          </div>

                                          <p className="text-sm text-gray-500 mb-4">
                                            We'll extract event details from the
                                            URL to personalize your campaign
                                          </p>

                                          <div className="mt-auto flex justify-end">
                                            <button
                                              onClick={() => {
                                                if (eventUrl) {
                                                  setShowAllEvents(false);
                                                }
                                              }}
                                              disabled={!eventUrl}
                                              className={`px-4 py-2 rounded-lg ${
                                                eventUrl
                                                  ? "bg-primary text-white hover:bg-primary/90"
                                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                              }`}
                                            >
                                              Continue with URL
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      <div className="p-4 border-t flex justify-end">
                                        <button
                                          onClick={() => {
                                            setShowAllEvents(false);
                                            setEventSource(null);
                                          }}
                                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </FramerMotion.div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="relative">
                                <textarea
                                  placeholder={`Enter details about ${selectedMotionObj?.contextQuestion.toLowerCase()}`}
                                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                                  value={contextData}
                                  onChange={(e) =>
                                    setContextData(e.target.value)
                                  }
                                />
                              </div>

                              <p className="text-sm text-gray-500">
                                This information helps us tailor your campaign
                                for maximum effectiveness
                              </p>
                            </div>
                          )}
                        </FramerMotion.div>
                      )}
                    </FramerMotion.div>
                  )}
                </FramerMotion.div>

                {/* Continue button */}
                <FramerMotion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 flex justify-end"
                >
                  <button
                    onClick={handleContinue}
                    disabled={
                      !canContinue() ||
                      isProcessing ||
                      isLaunching ||
                      isSavingDraft
                    }
                    className={`px-6 py-2 rounded-lg flex items-center justify-center ${
                      canContinue() &&
                      !isProcessing &&
                      !isLaunching &&
                      !isSavingDraft
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </FramerMotion.div>
              </div>
            </div>
          ) : (
            /* Campaign Designer Step */
            <div className="w-full">
              {/* Custom back link above title */}
              <div className="px-6 md:px-8 mb-6">
                <button
                  onClick={handleBackToGoalSelection}
                  disabled={isLaunching || isSavingDraft}
                  className={`flex items-center gap-2 text-primary font-medium text-sm hover:underline w-fit ${
                    isLaunching || isSavingDraft
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to goal selection
                </button>
              </div>

              <PageHeader
                title={`${selectedGoalObj?.title || ""} - ${
                  selectedMotionObj?.title || ""
                }`}
                description="Design your campaign and customize it for your audience"
                chips={[{ text: "Draft", color: "yellow" }]}
                // primaryButton={{
                //   text: !isAPIReady
                //     ? "Initializing..."
                //     : isLaunching
                //     ? "Launching..."
                //     : "Launch Campaign",
                //   variant: "primary",
                //   onClick: handleLaunch,
                //   disabled: isLaunching || isSavingDraft,
                //   className:
                //     isLaunching || isSavingDraft
                //       ? "bg-gray-400 border border-gray-400 text-white cursor-not-allowed pointer-events-none"
                //       : "bg-primary border border-primary text-white hover:bg-primary/90",
                //   icon: isLaunching ? (
                //     <InfinityLoader width={16} height={16} />
                //   ) : undefined,
                // }}
                // secondaryButton={{
                //   text: isSavingDraft ? "Saving..." : "Save Draft",
                //   variant: "secondary",
                //   onClick: isSavingDraft ? () => {} : handleSaveDraft,
                //   disabled: isSavingDraft || isLaunching,
                //   className:
                //     isSavingDraft || isLaunching
                //       ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                //       : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
                //   icon: isSavingDraft ? (
                //     <InfinityLoader width={16} height={16} />
                //   ) : undefined,
                // }}
              />

              {/*               //! --- Notification Section  */}
              {showToast && (
        <div
          className={`fixed top-[70px] right-1 sm:top-4 sm:right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toastType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } transition-opacity duration-300 flex items-center gap-2`}
        >
          {toastType === "success" ? (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-auto text-gray-700 hover:text-gray-900"
          ><svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )}




              <div className="mt-2 w-full px-6 md:px-8">
                <CampaignDesigner
                  goal={selectedGoal || ""}
                  goalTitle={selectedGoalObj?.title || ""}
                  motion={selectedMotion || ""}
                  motionTitle={selectedMotionObj?.title || ""}
                  contextData={
                    selectedGoal === "drive-event" &&
                    eventSource === "existing" &&
                    selectedEvent
                      ? existingEvents.find(
                          (event) => event.eventId === selectedEvent
                        )?.name || ""
                      : selectedGoal === "drive-event" && eventSource === "url"
                      ? eventUrl
                      : contextData
                  }
                  draftCampaignData={allCampaignData}
                  recipients={mockRecipients}
                  onLaunch={handleLaunch}
                  onSaveDraft={handleSaveDraft}
                  eventId={
                    selectedGoal === "drive-event" &&
                    eventSource === "existing" &&
                    selectedEvent
                      ? selectedEvent
                      : undefined
                  }
                  isLaunching={isLaunching}
                  isSaving={isSavingDraft}
                  showNotification={showNotification}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Launch Success Modal */}
      <CampaignLaunchSuccessModal
        isOpen={showSuccessModal}
        campaignName={`${selectedGoalObj?.title || ""} - ${
          selectedMotionObj?.title || ""
        }`}
        eventName={
          selectedGoal === "drive-event" &&
          eventSource === "existing" &&
          selectedEvent
            ? existingEvents.find((event) => event.eventId === selectedEvent)
                ?.name
            : undefined
        }
        recipientCount={
          selectedMotion === "booth-pickup" 
            ? ((window as any).campaignDesignerState?.recipientCount || 0)
            : mockRecipients.length
        }
        onClose={closeSuccessModal}
        onViewDashboard={handleViewDashboard}
        onCreateNewCampaign={handleCreateNewCampaign}
        onReturnToEvent={handleReturnToEvent}
        campaignId={launchedCampaignId || undefined}
        campaignData={{
          giftSelectionMode: "manual",
          giftTypeMode: "manual_gift",
        }}
      />
    </div>
  );
}
