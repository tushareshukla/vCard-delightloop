/**
 * CAMPAIGN DESIGNER COMPONENT
 *
 * This component provides a dynamic, multi-step campaign creation interface that adapts
 * based on the selected goal and motion combination. It supports multiple recipient
 * management modes and gift selection strategies.
 *
 * ARCHITECTURE OVERVIEW:
 * ===================
 *
 * GOAL-MOTION COMBINATIONS:
 * The component renders different UI sections based on goal + motion pairs:
 *
 * 1. QUICK SEND MODES:
 *    - quick-send + express-send: Individual contact selection with search/add functionality
 *    - quick-send + claim-link: Universal link mode with gift allocation controls
 *
 * 2. EVENT-DRIVEN MODES:
 *    - drive-event + boost-registration: Event registration campaigns
 *    - drive-event + ensure-attendance: Attendance confirmation campaigns
 *    - drive-event + booth-pickup: Trade show booth visit campaigns
 *    - drive-event + book-meetings: Meeting booking campaigns
 *    - drive-event + thank-you: Post-event thank you campaigns
 *
 * 3. SALES PIPELINE MODES:
 *    - pipeline-acceleration + break-into-accounts: New account outreach
 *    - pipeline-acceleration + reengage-cold-leads: Lead reactivation
 *    - pipeline-acceleration + nurture-warm-leads: Lead nurturing
 *    - pipeline-acceleration + champion-activation: Internal champion engagement
 *
 * 4. PRODUCT LAUNCH MODES:
 *    - product-launch + product-launch: New product announcements
 *    - product-launch + competitive-takeout: Competitive displacement
 *    - product-launch + migration-nudge: Product migration campaigns
 *
 * 5. CUSTOMER RELATIONSHIP MODES:
 *    - customer-relationships + thank-you-gifts: Customer appreciation
 *    - customer-relationships + anniversary-milestone: Relationship milestones
 *    - customer-relationships + feedback-collection: Customer feedback requests
 *    - customer-relationships + csat-recovery: Customer satisfaction recovery
 *
 * 6. REGULAR MODES:
 *    - All other combinations use standard contact list selection
 *
 * RECIPIENT MANAGEMENT MODES:
 * ===========================
 *
 * 1. EXPRESS SEND MODE (quick-send + express-send):
 *    - Search-powered contact dropdown
 *    - Individual contact selection
 *    - Quick Add Contact modal with full contact details
 *    - Recipients table with delivery address selection
 *    - Real-time contact filtering and search
 *
 * 2. CLAIM LINK MODE (quick-send + claim-link):
 *    - Universal gift link generation
 *    - Gift allocation quantity controls
 *    - Business email restriction toggle
 *    - No individual contact management needed
 *
 * 3. REGULAR MODE (all other combinations):
 *    - Contact list selection from saved lists
 *    - Contact preview with search functionality
 *    - Pagination for large contact lists
 *    - Delivery address selection per contact
 *
 * STATE MANAGEMENT:
 * ================
 *
 * Mode Detection:
 * - isQuickSendExpressMode: Detects quick-send + express-send combination
 * - isQuickSendClaimLinkMode: Detects quick-send + claim-link combination
 * - All other combinations fall back to regular mode
 *
 * Dynamic State:
 * - selectedContacts: Used in Express Send mode for individual selections
 * - numberOfGifts: Used in Claim Link mode for allocation control
 * - businessEmailsOnly: Used in Claim Link mode for email restrictions
 * - savedLists/selectedListId: Used in Regular mode for list selection
 *
 * EXTENDING THE COMPONENT:
 * =======================
 *
 * To add a new goal-motion combination:
 * 1. Add mode detection variables (e.g., isNewMode = goal === "new-goal" && motion === "new-motion")
 * 2. Update conditional rendering in Recipients section
 * 3. Add new state variables if needed
 * 4. Update budget calculation logic in calculateBudget()
 * 5. Update summary display in collapsed mode
 * 6. Add landing page content generation in generateLandingPageContent()
 *
 * To add new recipient management modes:
 * 1. Create new state variables for the mode
 * 2. Add conditional rendering section in Recipients
 * 3. Update budget calculation to handle new recipient count logic
 * 4. Update filteredRecipients sync logic if needed
 * 5. Update collapsed mode summary display
 *
 * DEPENDENCIES:
 * ============
 * - Requires authentication context for API calls
 * - Uses Switch component from UI library
 * - Integrates with contact list management APIs
 * - Supports event data integration for event-driven campaigns
 *
 * @author Harsha
 * @version 2.0.0
 * @lastUpdated 2024-12-19
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/wallet/StripePaymentForm";
import { toast } from "react-hot-toast";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
import {
  ChevronDown,
  ChevronUp,
  Users,
  Gift,
  Paintbrush,
  Search,
  Check,
  Sparkles,
  Package,
  MousePointerClick,
  Calendar,
  Database,
  ListFilter,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Info,
  CreditCard,
  LineChart,
  PackageOpen,
  ShoppingBag,
  Target,
  ChevronDownIcon,
  Mail,
} from "lucide-react";
import LandingPageDesigner, {
  LandingPageConfig,
} from "./landing-page-designer";
import { EditableCardPreview } from "../shared/EditableCardPreview";
import { Switch } from "@/components/ui/switch";
import InfinityLoader from "@/components/common/InfinityLoader";
import Link from "next/link";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";

// Add CSS keyframes for slide-in animation
const slideInAnimation = `
@keyframes slideInFromRight {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes slideOutToRight {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
`;

// Animation will be added inside the component

// LinkedIn Logo Component
const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill="#0077B5"
    />
  </svg>
);

// Gift mode options
const giftModes = [
  {
    id: "smart-match",
    title: "Smart Match",
    description:
      "Let AI recommend a unique, hyper-personalized gift for each recipient using profile insights and behavior.",
    subtext: "Best for personalized gifting at scale.",
    icon: Sparkles,
  },
  {
    id: "one-gift",
    title: "One Gift for All",
    description:
      "Choose one gift to send to all recipients — simple, consistent, and quick to launch.",
    subtext: "Best for fast campaigns or single-SKU use.",
    icon: Package,
  },
  {
    id: "recipient-choice",
    title: "Let Recipients Choose",
    description:
      "Select a curated set of gifts and let each recipient pick what they like most.",
    subtext: "Best for premium or inclusive experiences.",
    icon: MousePointerClick,
  },
];

interface CampaignDesignerProps {
  goal: string;
  goalTitle: string;
  motion: string;
  motionTitle: string;
  contextData: string;
  recipients: any[];
  onLaunch: () => void;
  onSaveDraft: () => void;
  eventId?: string; // Add eventId as an optional prop
  isLaunching?: boolean; // Add loading state for launch
  isSaving?: boolean; // Add loading state for save draft
  draftCampaignData?: any;
  showNotification: (message: string, type: "success" | "error") => void;
}

// Helper function to compare arrays
const arraysEqual = (a: string[], b: string[]) => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

export default function CampaignDesigner({
  goal,
  goalTitle,
  motion,
  motionTitle,
  contextData,
  recipients,
  onLaunch,
  onSaveDraft,
  eventId,
  isLaunching,
  isSaving,
  draftCampaignData,
  showNotification,
}: CampaignDesignerProps) {
  // Payment related states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Payment related handlers
  const handleAddFundClick = () => {
    setShowAmountInput(true);
  };

  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowAmountInput(false);
        setShowPaymentModal(true);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error(error);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: string) => {
    try {
      setIsProcessingPayment(true);
      const response = await fetch("/api/stripe/success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          payment_intent: paymentIntent,
          organization_id: organizationId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment processed successfully!");
        setShowPaymentModal(false);
        setAmount("");
        await fetchWalletBalance();
        setPaymentComplete(true);
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error in payment success handler:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Update wallet balance when payment is complete
  useEffect(() => {
    if (paymentComplete) {
      setPaymentComplete(false);
      fetchWalletBalance();
    }
  }, [paymentComplete]);
  // Get auth context
  const { authToken, userId, organizationId } = useAuth();
  const router = useRouter();

  console.log("🎬 CampaignDesigner component initialized", {
    goal,
    goalTitle,
    motion,
    motionTitle,
    eventId,
    isLaunching,
    isSaving,
    hasDraftData: !!draftCampaignData,
  });

  console.log("🔐 Auth context status", {
    hasAuthToken: !!authToken,
    hasOrganizationId: !!organizationId,
    organizationId: organizationId || "not set",
  });

  // Mode detection
  const isQuickSendExpressMode = goal === "quick-send" && motion === "express-send";
  console.log("🎯 Mode detection", {
    goal,
    motion,
    isQuickSendExpressMode,
    modeDescription: isQuickSendExpressMode ? "Quick Send Express" : "Other mode",
  });

  // Campaign metadata states
  const [campaignName, setCampaignName] = useState<string>(
    draftCampaignData?.name || `${goalTitle} - ${motionTitle}`
  );
  const [startByDate, setStartByDate] = useState<string>(
    draftCampaignData?.eventStartDate
      ? new Date(draftCampaignData.eventStartDate).toISOString().split("T")[0]
      : ""
  );
  const [deliveryByDate, setDeliveryByDate] = useState<string>(
    draftCampaignData?.deliverByDate
      ? new Date(draftCampaignData.deliverByDate).toISOString().split("T")[0]
      : ""
  );

  // Event data state
  const [eventData, setEventData] = useState<any>(
    draftCampaignData?.eventData || null
  );
  const [organization, setOrganization] = useState<any>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Calculate default expiration date (today + 90 days)
  const defaultExpirationDate = new Date();
  defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 90);
  const [giftExpirationDate, setGiftExpirationDate] = useState<string>(
    defaultExpirationDate.toISOString().split("T")[0]
  );

  // Section expansion states - allow null for all collapsed
  const [expandedSection, setExpandedSection] = useState<
    | "recipients"
    | "gift"
    | "experience"
    | "budget"
    | "analytics"
    | "email-template"
    | "post-ack"
    | null
  >("recipients");
  const [selectedGiftMode, setSelectedGiftMode] = useState<string>(
    draftCampaignData?.giftSelectionMode === "hyper_personalize"
      ? "smart-match"
      : draftCampaignData?.giftSelectionMode === "manual"
      ? "one-gift"
      : "recipient-choice"
  );
  const [giftMessage, setGiftMessage] = useState<string>(
    draftCampaignData?.outcomeCard?.message || ""
  );
  const [giftLogo, setGiftLogo] = useState<string>(
    draftCampaignData?.outcomeCard?.logoLink || "/Logo Final.png"
  );
  const [landingPageContent, setLandingPageContent] = useState<string>(
    draftCampaignData?.landingPageConfig?.content?.description || ""
  );

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Function to fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const baseUrl = await getBackendApiBaseUrl();

      const walletBalanceResponse = await fetch(
        `${baseUrl}/v1/${userId}/wallet/check-balance`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (walletBalanceResponse.ok) {
        const data = await walletBalanceResponse.json();
        console.log("Wallet balance data:", data);
        setWalletBalance(data.wallet?.current_balance || 0);
      } else {
        const errorData = await walletBalanceResponse.json();
        if (errorData.error_code === "ERR_WALLET_NOT_FOUND") {
          console.log("Wallet not found, setting balance to 0");
          setWalletBalance(0);
        } else {
          console.error("Failed to fetch wallet balance");
          showNotification("Failed to fetch wallet balance", "error");
        }
      }
    } catch (error) {
      console.error("Error in fetchWalletBalance:", error);
      showNotification("Error fetching wallet balance", "error");
    }
  };

  // Call fetchWalletBalance when component mounts
  useEffect(() => {
    if (userId && authToken) {
      fetchWalletBalance();
    }
  }, [userId, authToken]);

  // Landing page designer state
  const [landingPageConfig, setLandingPageConfig] =
    useState<LandingPageConfig | null>(
      draftCampaignData?.landingPageConfig
        ? {
            logo: {
              type: draftCampaignData.landingPageConfig.logo.type || "url",
              url:
                draftCampaignData.landingPageConfig.logo.url ||
                "/Logo Final.png",
            },
            background: {
              type:
                draftCampaignData.landingPageConfig.background.type ||
                "gradient",
              color:
                draftCampaignData.landingPageConfig.background.color ||
                "#FFFFFF",
              gradientFrom:
                draftCampaignData.landingPageConfig.background.gradientFrom ||
                "#ECFCFF",
              gradientTo:
                draftCampaignData.landingPageConfig.background.gradientTo ||
                "#E8C2FF",
              gradientDirection:
                draftCampaignData.landingPageConfig.background
                  .gradientDirection || "to-r",
            },
            content: {
              headline:
                draftCampaignData.landingPageConfig.content.headline ||
                "Hello {{first-name}}, You've Got a Special Gift!",
              headlineColor:
                draftCampaignData.landingPageConfig.content.headlineColor ||
                "#111827",
              description:
                draftCampaignData.landingPageConfig.content.description || "",
              descriptionColor:
                draftCampaignData.landingPageConfig.content.descriptionColor ||
                "#6B7280",
            },
            media: {
              type: draftCampaignData.landingPageConfig.media.type || "image",
              imageUrl:
                draftCampaignData.landingPageConfig.media.imageUrl || "",
              videoUrl:
                draftCampaignData.landingPageConfig.media.videoUrl || "",
            },
            actionButtons: {
              primary: {
                enabled:
                  draftCampaignData.landingPageConfig.actionButtons?.primary
                    ?.enabled ?? true,
                text:
                  draftCampaignData.landingPageConfig.actionButtons?.primary
                    ?.text || "Register Now",
                color:
                  draftCampaignData.landingPageConfig.actionButtons?.primary
                    ?.color || "#6941C6",
                url:
                  draftCampaignData.landingPageConfig.actionButtons?.primary
                    ?.url || "#claim",
              },
              secondary: {
                enabled:
                  draftCampaignData.landingPageConfig.actionButtons?.secondary
                    ?.enabled ?? true,
                text:
                  draftCampaignData.landingPageConfig.actionButtons?.secondary
                    ?.text || "Learn More",
                color:
                  draftCampaignData.landingPageConfig.actionButtons?.secondary
                    ?.color || "#6941C6",
                url:
                  draftCampaignData.landingPageConfig.actionButtons?.secondary
                    ?.url || "#learn-more",
              },
            },
            date: {
              enabled:
                draftCampaignData.landingPageConfig.date?.enabled ?? true,
              value:
                draftCampaignData.landingPageConfig.date?.value || undefined,
              color:
                draftCampaignData.landingPageConfig.date?.color || "#6941C6",
            },
          }
        : null
    );

  // Email template states
  const [emailTemplates, setEmailTemplates] = useState({
    addressConfirmedEmail: {
      enabled: draftCampaignData?.emailTemplates?.addressConfirmedEmail?.enabled ?? true,
      subject: draftCampaignData?.emailTemplates?.addressConfirmedEmail?.subject || "{{First Name}}, {{org-name}} would like to send you something special",
      content: draftCampaignData?.emailTemplates?.addressConfirmedEmail?.content || `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;">
  {{Logo URL}}
  <p style="font-size: 18px; color: #333;">Hi {{First Name}},</p>
  <p style="font-size: 16px; color: #555;">We hope to see you at Black Hat. In the meantime, we'd love to send something your way. A small token of appreciation from {{org-name}} for being a cyber defender.</p>
  <p style="font-size: 16px; color: #555;">Just let us know where you'd like it mailed and it'll be on its way.</p>
  <p style="margin-bottom: 5px;"><a href="{{Verification URL}}" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Confirm mailing address</a></p>
  <p style="font-size: 12px; color: #555; margin-top: 5px;">(Takes just a few seconds.)</p>
  <p style="font-size: 16px; color: #555;">Rest assured your information is completely secure. We're in cybersecurity afterall.</p>
  <p style="font-size: 16px; color: #555; margin-top: 20px;">{{org-name}} team</p>
</div>`
    },
    /* inTransitEmail: {
      enabled: draftCampaignData?.emailTemplates?.inTransitEmail?.enabled ?? false,
      subject: draftCampaignData?.emailTemplates?.inTransitEmail?.subject || "📦 Your gift is on the way!",
      content: draftCampaignData?.emailTemplates?.inTransitEmail?.content || "Your gift has shipped and is on its way to you! Track your package using the tracking number provided."
    },
    deliveredEmail: {
      enabled: draftCampaignData?.emailTemplates?.deliveredEmail?.enabled ?? false,
      subject: draftCampaignData?.emailTemplates?.deliveredEmail?.subject || "✅ Your gift has been delivered",
      content: draftCampaignData?.emailTemplates?.deliveredEmail?.content || "Your gift has been successfully delivered! We hope you enjoy it."
    },
    acknowledgedEmail: {
      enabled: draftCampaignData?.emailTemplates?.acknowledgedEmail?.enabled ?? false,
      subject: draftCampaignData?.emailTemplates?.acknowledgedEmail?.subject || "🙏 Thank you for acknowledging your gift",
      content: draftCampaignData?.emailTemplates?.acknowledgedEmail?.content || "Thank you for acknowledging receipt of your gift! We're glad you received it."
    } */
  });

  const handleEmailTemplateChange = (templateType: string, field: string, value: string | boolean) => {
    setEmailTemplates(prev => ({
      ...prev,
      [templateType]: {
        ...prev[templateType],
        [field]: value
      }
    }));
  };

  // Recipients states
  const [savedLists, setSavedLists] = useState<
    { id: string; name: string; count: number }[]
  >([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(
    draftCampaignData?.contactListId || null
  );

  // API integration states
  const [isLoadingContactLists, setIsLoadingContactLists] = useState(false);
  const [contactListError, setContactListError] = useState("");
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientsError, setRecipientsError] = useState("");

  // Mock sample recipients data for selected list
  const [sampleRecipients, setSampleRecipients] = useState<any[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recipientsPerPage = 5;

  /**
   * RECIPIENT MANAGEMENT STATE VARIABLES
   * ====================================
   * These states handle different recipient management modes and their UI interactions.
   */

  // EXPRESS SEND MODE STATES (quick-send + express-send)
  // -----------------------------------------------------
  const [allContacts, setAllContacts] = useState<any[]>([]); // All available contacts from organization
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>(""); // Search filter for contact dropdown
  const [isLoadingAllContacts, setIsLoadingAllContacts] = useState(false); // Loading state for contacts API
  const [searchResults, setSearchResults] = useState<any[]>([]); // Store search results
  const [showAddContactForm, setShowAddContactForm] = useState(false); // Quick Add Contact modal visibility
  const [isClosingAddContactForm, setIsClosingAddContactForm] = useState(false); // Modal closing animation state
  const [showContactDropdown, setShowContactDropdown] = useState(false); // Contact search dropdown visibility
  const [showAddressSection, setShowAddressSection] = useState(false); // Address section toggle in Add Contact form

  // New contact form data for Quick Add Contact functionality
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    jobTitle: "",
    linkedinUrl: "", // LinkedIn handle (not full URL)
    address: {
      line1: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
  });

  // UNIVERSAL DELIVERY ADDRESS STATE
  // --------------------------------
  // Maps recipient ID to selected delivery address option (used across all modes)
  const [recipientDeliveryAddresses, setRecipientDeliveryAddresses] = useState<{
    [key: string]: string;
  }>({});

  // CLAIM LINK MODE STATES (quick-send + claim-link)
  // ------------------------------------------------
  const [numberOfGifts, setNumberOfGifts] = useState<number>(10); // Total gifts available for claiming
  const [businessEmailsOnly, setBusinessEmailsOnly] = useState<boolean>(true); // Restrict to business email domains

  // TODO: Replace with API call to fetch organization's delivery locations
  // For now, only "Direct to recipient" is functional - others are UI placeholders
  const deliveryAddressOptions = [
    {
      id: "direct",
      label: "Direct to recipient",
      description: "Ship to recipient's address",
      available: true, // Only this option is currently functional
    },
    // Placeholder options - will be populated from organization settings API
    {
      id: "hq",
      label: "Company HQ",
      description: "Will be populated from organization settings",
      available: false, // Disabled until API integration
    },
    {
      id: "branch-office",
      label: "Branch Office",
      description: "Will be populated from organization settings",
      available: false, // Disabled until API integration
    },
    {
      id: "warehouse",
      label: "Distribution Center",
      description: "Will be populated from organization settings",
      available: false, // Disabled until API integration
    },
  ];

  // Configuration flag - set to true when delivery locations API is ready
  const hasDeliveryLocationsAPI = false;

  // TODO: Implement this function when delivery locations API is ready
  const fetchOrganizationDeliveryLocations = async () => {
    if (!hasDeliveryLocationsAPI) {
      console.log("Delivery locations API not yet implemented");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/delivery-locations`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch delivery locations: ${response.status}`
        );
      }

      const data = await response.json();
      // TODO: Update deliveryAddressOptions state with API response
      console.log("Delivery locations from API:", data);
    } catch (error) {
      console.error("Error fetching delivery locations:", error);
    }
  };

  // Gift browser states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isClosingGiftModal, setIsClosingGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string>("premium-notebook");
  const [giftFilterCatalog, setGiftFilterCatalog] = useState<string>("");
  const [giftFilterPrice, setGiftFilterPrice] = useState<string>("");
  const [giftSearchQuery, setGiftSearchQuery] = useState<string>("");
  const [giftSortBy, setGiftSortBy] = useState<string>("recommended");

  // State for displayed gifts in One Gift for All section
  const [displayedOneGiftOptions, setDisplayedOneGiftOptions] = useState<
    string[]
  >([]);

  // Bundle states for recipient-choice mode
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [isLoadingBundles, setIsLoadingBundles] = useState(false);
  const [bundlesError, setBundlesError] = useState("");

  // Budget configuration type
  interface BudgetConfig {
    min: number;
    max: number;
    giftCost: number;
    shippingCost: number;
    handlingCost: number;
    nfcCardCost: number;
    availableCredits: number;
    requiredCredits: number;
    showDetails: boolean;
  }

  // State declarations
  const [selectedRecipientGifts, setSelectedRecipientGifts] = useState<
    string[]
  >([]);
  const [showRecipientGiftModal, setShowRecipientGiftModal] = useState(false);
  const [isClosingRecipientGiftModal, setIsClosingRecipientGiftModal] =
    useState(false);

  // Consolidated budget state
  const [budget, setBudget] = useState<BudgetConfig>({
    min: 0,
    max: 15, // Default max budget set to 15
    giftCost: 0,
    shippingCost: 0,
    handlingCost: 0,
    nfcCardCost: 0,
    availableCredits: 0,
    requiredCredits: 0,
    showDetails: false,
  });

  // Booth pickup recipient count
  const [recipientCount, setRecipientCount] = useState<number>(
    draftCampaignData?.total_recipients && motion === "booth-pickup" 
      ? draftCampaignData.total_recipients 
      : 10
  );

  // Sample gift data with shipping and handling costs
  interface SampleGift {
    id: string;
    name: string;
    price: number;
    shippingCost: number;
    handlingCost: number;
    catalog: string;
    image: string;
  }

  const sampleGifts: SampleGift[] = [
    {
      id: "premium-notebook",
      name: "Premium Notebook Set",
      price: 49.99,
      shippingCost: 8.99,
      handlingCost: 3.99,
      catalog: "premium",
      image: "/img/gifts/premium-notebook.jpg",
    },
    {
      id: "wireless-earbuds",
      name: "Wireless Earbuds",
      price: 79.99,
      shippingCost: 7.99,
      handlingCost: 4.99,
      catalog: "tech",
      image: "/img/gifts/wireless-earbuds.jpg",
    },
    {
      id: "gourmet-coffee",
      name: "Gourmet Coffee Set",
      price: 39.99,
      shippingCost: 9.99,
      handlingCost: 3.49,
      catalog: "food",
      image: "/img/gifts/gourmet-coffee.jpg",
    },
    {
      id: "eco-water-bottle",
      name: "Eco Water Bottle",
      price: 29.99,
      shippingCost: 6.99,
      handlingCost: 2.99,
      catalog: "eco",
      image: "/img/gifts/eco-water-bottle.jpg",
    },
    {
      id: "leather-journal",
      name: "Leather Journal",
      price: 45.99,
      shippingCost: 7.49,
      handlingCost: 3.49,
      catalog: "premium",
      image: "/img/gifts/leather-journal.jpg",
    },
    {
      id: "smart-water-bottle",
      name: "Smart Water Bottle",
      price: 59.99,
      shippingCost: 8.49,
      handlingCost: 3.99,
      catalog: "tech",
      image: "/img/gifts/smart-water-bottle.jpg",
    },
    {
      id: "desk-plant-kit",
      name: "Desk Plant Kit",
      price: 34.99,
      shippingCost: 10.99,
      handlingCost: 4.49,
      catalog: "eco",
      image: "/img/gifts/desk-plant-kit.jpg",
    },
    {
      id: "bluetooth-speaker",
      name: "Bluetooth Speaker",
      price: 69.99,
      shippingCost: 8.99,
      handlingCost: 4.99,
      catalog: "tech",
      image: "/img/gifts/bluetooth-speaker.jpg",
    },
    {
      id: "artisan-chocolates",
      name: "Artisan Chocolates",
      price: 29.99,
      shippingCost: 12.99,
      handlingCost: 5.49,
      catalog: "food",
      image: "/img/gifts/artisan-chocolates.jpg",
    },
    {
      id: "tech-organizer",
      name: "Tech Organizer",
      price: 39.99,
      shippingCost: 7.49,
      handlingCost: 3.49,
      catalog: "tech",
      image: "/img/gifts/tech-organizer.jpg",
    },
    {
      id: "wine-set",
      name: "Wine Accessory Set",
      price: 49.99,
      shippingCost: 9.99,
      handlingCost: 4.99,
      catalog: "premium",
      image: "/img/gifts/wine-set.jpg",
    },
    {
      id: "fitness-tracker",
      name: "Fitness Tracker",
      price: 89.99,
      shippingCost: 6.99,
      handlingCost: 3.99,
      catalog: "tech",
      image: "/img/gifts/fitness-tracker.jpg",
    },
    {
      id: "bamboo-cutlery",
      name: "Bamboo Cutlery Set",
      price: 24.99,
      shippingCost: 5.99,
      handlingCost: 2.49,
      catalog: "eco",
      image: "/img/gifts/bamboo-cutlery.jpg",
    },
    {
      id: "tea-sampler",
      name: "Artisan Tea Sampler",
      price: 32.99,
      shippingCost: 8.49,
      handlingCost: 3.99,
      catalog: "food",
      image: "/img/gifts/tea-sampler.jpg",
    },
    {
      id: "wireless-charger",
      name: "Wireless Charging Pad",
      price: 44.99,
      shippingCost: 6.49,
      handlingCost: 2.99,
      catalog: "tech",
      image: "/img/gifts/wireless-charger.jpg",
    },
  ];

  // Gift bundle types
  interface Gift {
    giftId: string;
    name: string;
    shortDescription: string;
    inventory: number;
    imageUrl: string;
    price: number;
    shippingCost?: number;
    handlingCost?: number;
    category: string;
  }

  interface Bundle {
    bundleId: string;
    bundleName: string;
    description: string;
    imgUrl: string;
    isAvailable: boolean;
    gifts: Gift[];
  }

  // Toggle section expansion - allow all to be collapsed
  const toggleSection = (
    section:
      | "recipients"
      | "gift"
      | "experience"
      | "budget"
      | "analytics"
      | "email-template"
      | "post-ack"
  ) => {
    if (expandedSection === section) {
      // Allow all sections to be collapsed
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Fetch contact lists from API
  const fetchContactLists = async () => {
    try {
      setIsLoadingContactLists(true);
      setContactListError("");

      if (!authToken || !organizationId) {
        throw new Error("Authentication information missing");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contact lists: ${response.status}`);
      }

      const data = await response.json();

      // Check if the data has the expected structure
      // Allow for different API response formats
      const lists = data.lists || data.data?.lists || data.data || [];

      if (!Array.isArray(lists)) {
        throw new Error("Invalid response format: lists is not an array");
      }

      // Transform API response to match our state format
      const transformedLists = lists.map((list) => ({
        id: list._id || list.id || "",
        name: list.name || "Unnamed List",
        count:
          list.metrics?.totalContacts ||
          list.contacts?.length ||
          list.metrics?.totalRecipients ||
          list.recipients?.length ||
          list.recipientCount ||
          0,
      }));

      setSavedLists(transformedLists);
    } catch (error) {
      console.error("Error fetching contact lists:", error);
      setContactListError(
        error instanceof Error ? error.message : "Failed to fetch contact lists"
      );
    } finally {
      setIsLoadingContactLists(false);
    }
  };

  // Load recipients from a selected contact list
  const handleListSelect = async (listId: string) => {
    setSelectedListId(listId);
    setCurrentPage(1);
    setSearchQuery("");
    setIsLoadingRecipients(true);
    setRecipientsError("");

    try {
      if (!authToken || !organizationId) {
        throw new Error("Authentication information missing");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${listId}/contacts/details`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }

      const data = await response.json();

      // Transform API contacts to match our recipient format
      const transformedRecipients = data.contacts.map((contact: any) => ({
        id: contact._id,
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.mailId,
        company: contact.companyName || "",
        role: contact.jobTitle || "",
        linkedin: contact.linkedinUrl
          ? contact.linkedinUrl.split("/in/")[1]
          : "",
        hasAddress: !!(
          contact.address?.line1 ||
          contact.address?.city ||
          contact.address?.state ||
          contact.address?.country
        ),
      }));

      setSampleRecipients(transformedRecipients);
      setFilteredRecipients(transformedRecipients);

      // Initialize delivery addresses for new recipients
      // Always default to "direct" since it's the only available option currently
      const initialAddresses: { [key: string]: string } = {};
      transformedRecipients.forEach((recipient) => {
        initialAddresses[recipient.id] = "direct"; // Only available delivery option
      });
      setRecipientDeliveryAddresses(initialAddresses);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setRecipientsError(
        error instanceof Error ? error.message : "Failed to load contacts"
      );

      // Fallback to mock data if API fails
      const mockSampleData = [
        {
          id: "1",
          name: "John Smith",
          company: "Acme Corp",
          role: "CEO",
          email: "john@acmecorp.com",
          linkedin: "johnsmith",
          hasAddress: true,
        },
        {
          id: "2",
          name: "Sarah Johnson",
          company: "TechStart",
          role: "CTO",
          email: "sarah@techstart.io",
          linkedin: "sarahjohnson",
          hasAddress: true,
        },
        {
          id: "3",
          name: "Michael Brown",
          company: "Global Innovations",
          role: "VP Sales",
          email: "michael@globalinnovations.com",
          linkedin: "michaelbrown",
          hasAddress: false,
        },
        {
          id: "4",
          name: "Emily Davis",
          company: "Future Systems",
          role: "Director",
          email: "emily@futuresystems.co",
          linkedin: "emilydavis",
          hasAddress: true,
        },
        {
          id: "5",
          name: "Robert Wilson",
          company: "Bright Solutions",
          role: "Manager",
          email: "robert@brightsolutions.com",
          linkedin: "robertwilson",
          hasAddress: false,
        },
      ];

      setSampleRecipients(mockSampleData);
      setFilteredRecipients(mockSampleData);

      // Initialize delivery addresses for mock recipients
      // Always default to "direct" since it's the only available option currently
      const initialAddresses: { [key: string]: string } = {};
      mockSampleData.forEach((recipient) => {
        initialAddresses[recipient.id] = "direct"; // Only available delivery option
      });
      setRecipientDeliveryAddresses(initialAddresses);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Search contacts by name using the search API
  const searchContactsByName = async (searchTerm: string) => {
    console.log("📞 searchContactsByName called", {
      searchTerm,
      hasAuthToken: !!authToken,
      hasOrganizationId: !!organizationId,
      organizationId,
      timestamp: new Date().toISOString(),
    });

    try {
      setIsLoadingAllContacts(true);
      setRecipientsError("");

      if (!authToken || !organizationId) {
        const error = "Authentication information missing";
        console.error("❌ Authentication missing", { authToken: !!authToken, organizationId: !!organizationId });
        throw new Error(error);
      }

      // Use the search API with name parameter
      const apiUrl = `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/contacts?name=${encodeURIComponent(searchTerm)}&limit=50&skip=0`;
      console.log("📡 Making API request to search endpoint", {
        url: apiUrl,
        method: "GET",
        searchTerm,
        headers: {
          Authorization: `Bearer ${authToken?.substring(0, 20)}...`,
          Accept: "application/json",
        },
      });

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      console.log("📡 API response received", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API request failed", {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
        });
        throw new Error(`Failed to search contacts: ${response.status}`);
      }

      const data = await response.json();

      console.log("📄 API response data", {
        dataKeys: Object.keys(data),
        contactsCount: (data.contacts || data.data || []).length,
        sampleData: data.contacts?.[0] || data.data?.[0] || "No contacts",
      });

      // Transform API contacts to match our format
      const transformedContacts = (data.contacts || data.data || []).map(
        (contact: any) => ({
          id: contact._id || contact.id,
          name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          email: contact.mailId || contact.email,
          company: contact.companyName || contact.company || "",
          role: contact.jobTitle || contact.role || "",
          linkedin: contact.linkedinUrl
            ? contact.linkedinUrl.split("/in/")[1]
            : "",
          hasAddress: !!(
            contact.address?.line1 ||
            contact.address?.city ||
            contact.address?.state ||
            contact.address?.country
          ),
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
        })
      );

      console.log("✅ Contacts processed successfully", {
        originalCount: (data.contacts || data.data || []).length,
        transformedCount: transformedContacts.length,
        sampleTransformed: transformedContacts[0] || "No contacts",
      });

      // For search API, return the results instead of setting state
      return transformedContacts;
    } catch (error) {
      console.error("Error fetching all contacts:", error);
      setRecipientsError(
        error instanceof Error ? error.message : "Failed to fetch contacts"
      );

      // Fallback to mock data if API fails
      const mockContacts = [
        {
          id: "1",
          name: "John Smith",
          company: "Acme Corp",
          role: "CEO",
          email: "john@acmecorp.com",
          linkedin: "johnsmith",
          hasAddress: true,
          firstName: "John",
          lastName: "Smith",
        },
        {
          id: "2",
          name: "Sarah Johnson",
          company: "TechStart",
          role: "CTO",
          email: "sarah@techstart.io",
          linkedin: "sarahjohnson",
          hasAddress: true,
          firstName: "Sarah",
          lastName: "Johnson",
        },
        {
          id: "3",
          name: "Michael Brown",
          company: "Global Innovations",
          role: "VP Sales",
          email: "michael@globalinnovations.com",
          linkedin: "michaelbrown",
          hasAddress: false,
          firstName: "Michael",
          lastName: "Brown",
        },
        {
          id: "4",
          name: "Emily Davis",
          company: "Future Systems",
          role: "Director",
          email: "emily@futuresystems.co",
          linkedin: "emilydavis",
          hasAddress: true,
          firstName: "Emily",
          lastName: "Davis",
        },
        {
          id: "5",
          name: "Robert Wilson",
          company: "Bright Solutions",
          role: "Manager",
          email: "robert@brightsolutions.com",
          linkedin: "robertwilson",
          hasAddress: false,
          firstName: "Robert",
          lastName: "Wilson",
        },
        {
          id: "6",
          name: "Jessica Martinez",
          company: "Innovation Labs",
          role: "Product Manager",
          email: "jessica@innovationlabs.com",
          linkedin: "jessicamartinez",
          hasAddress: true,
          firstName: "Jessica",
          lastName: "Martinez",
        },
        {
          id: "7",
          name: "David Chen",
          company: "Tech Solutions",
          role: "Engineer",
          email: "david@techsolutions.com",
          linkedin: "davidchen",
          hasAddress: false,
          firstName: "David",
          lastName: "Chen",
        },
        {
          id: "8",
          name: "Lisa Thompson",
          company: "Creative Agency",
          role: "Designer",
          email: "lisa@creativeagency.com",
          linkedin: "lisathompson",
          hasAddress: true,
          firstName: "Lisa",
          lastName: "Thompson",
        },
      ];

      // For search API, return mock data on error
      console.log("📋 Using mock data due to API error");
      return mockContacts;
    } finally {
      setIsLoadingAllContacts(false);
    }
  };

  // Open add contact slider
  const openAddContactForm = () => {
    setShowAddContactForm(true);
  };

  // Close add contact slider
  const closeAddContactForm = () => {
    setIsClosingAddContactForm(true);
    setTimeout(() => {
      setShowAddContactForm(false);
      setIsClosingAddContactForm(false);
    }, 300); // Match the animation duration
  };

  // Add new contact for Quick Send mode
  const addContactToState = () => {
    // Validate required fields
    if (!newContact.firstName || !newContact.lastName || !newContact.email) {
      //   alert(
      //     "Please fill in all required fields (First Name, Last Name, Email)"
      //   );
      showNotification(
        "Please fill in all required fields (First Name, Last Name, Email)",
        "error"
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContact.email)) {
      //   alert("Please enter a valid email address");
      showNotification("Please enter a valid email address", "error");
      return;
    }

    // Check if contact with same email already exists in campaign
    const existingContact = selectedContacts.find(
      (contact) =>
        contact.email.toLowerCase() === newContact.email.toLowerCase()
    );

    if (existingContact) {
      //   alert(
      //     "A contact with this email is already in your campaign recipients."
      //   );
      showNotification(
        "A contact with this email is already in your campaign recipients.",
        "error"
      );
      return;
    }

    // Create the new contact locally (no API call)
    const newContactId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const transformedContact = {
      id: newContactId,
      name: `${newContact.firstName} ${newContact.lastName}`,
      email: newContact.email,
      company: newContact.companyName || "",
      role: newContact.jobTitle || "",
      linkedin: newContact.linkedinUrl || "",
      hasAddress: !!(newContact.address.line1 || newContact.address.city),
      firstName: newContact.firstName,
      lastName: newContact.lastName,
    };

    // Add to all contacts and automatically select it for the campaign
    setAllContacts((prev) => [transformedContact, ...prev]);
    setSelectedContacts((prev) => [...prev, transformedContact]);

    // Initialize delivery address
    setRecipientDeliveryAddresses((prev) => ({
      ...prev,
      [transformedContact.id]: "direct",
    }));

    // Reset form and close
    setNewContact({
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      jobTitle: "",
      linkedinUrl: "",
      address: {
        line1: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      },
    });
  };

  // Handler functions for different button actions
  const handleAddAndClose = () => {
    addContactToState();
    closeAddContactForm();
  };

  const handleAddAnother = () => {
    addContactToState();
    // Keep modal open but reset form for next contact
    setNewContact({
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      jobTitle: "",
      linkedinUrl: "",
      address: {
        line1: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      },
    });
  };

  // Toggle contact selection for Quick Send mode
  const toggleContactSelection = (contact: any) => {
    const isSelected = selectedContacts.some((c) => c.id === contact.id);

    if (isSelected) {
      // Remove from selected
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id));
      // Remove delivery address
      setRecipientDeliveryAddresses((prev) => {
        const updated = { ...prev };
        delete updated[contact.id];
        return updated;
      });
    } else {
      // Add to selected
      setSelectedContacts((prev) => [...prev, contact]);
      // Initialize delivery address
      setRecipientDeliveryAddresses((prev) => ({
        ...prev,
        [contact.id]: "direct",
      }));
    }
  };

  // Filter contacts based on search query for Quick Send mode
  const getFilteredContacts = () => {
    // For Quick Send Express mode, use search results from API
    if (goal === "quick-send" && motion === "express-send") {
      return searchResults;
    }

    // For other modes, use the old logic with allContacts
    if (!contactSearchQuery.trim()) {
      return allContacts;
    }

    const lowercasedQuery = contactSearchQuery.toLowerCase();
    return allContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(lowercasedQuery) ||
        contact.email.toLowerCase().includes(lowercasedQuery) ||
        contact.company.toLowerCase().includes(lowercasedQuery) ||
        contact.role.toLowerCase().includes(lowercasedQuery)
    );
  };

  /**
   * MODE DETECTION LOGIC
   * ===================
   * These variables determine which recipient management interface to render
   * based on the goal + motion combination passed as props.
   *
   * IMPORTANT: When adding new modes, ensure you:
   * 1. Update the conditional rendering in the Recipients section
   * 2. Update the budget calculation logic
   * 3. Update the collapsed mode summary display
   * 4. Update the description text above the interface
   */

  // Quick Send Express Mode: Individual contact selection with search/add functionality
  // Quick Send Claim Link Mode: Universal link with gift allocation controls
  const isQuickSendClaimLinkMode =
    goal === "quick-send" && motion === "claim-link";

  // Legacy compatibility for existing code that checks isQuickSendMode
  const isQuickSendMode = isQuickSendExpressMode;

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRecipients(sampleRecipients);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = sampleRecipients.filter(
        (recipient) =>
          recipient.name.toLowerCase().includes(lowercasedQuery) ||
          recipient.email.toLowerCase().includes(lowercasedQuery) ||
          recipient.company.toLowerCase().includes(lowercasedQuery) ||
          recipient.role.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredRecipients(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, sampleRecipients]);

  // Pagination logic
  const indexOfLastRecipient = currentPage * recipientsPerPage;
  const indexOfFirstRecipient = indexOfLastRecipient - recipientsPerPage;
  const currentRecipients = filteredRecipients.slice(
    indexOfFirstRecipient,
    indexOfLastRecipient
  );
  const totalPages = Math.ceil(filteredRecipients.length / recipientsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle delivery address selection for a recipient
  const handleDeliveryAddressChange = (
    recipientId: string,
    addressId: string
  ) => {
    setRecipientDeliveryAddresses((prev) => ({
      ...prev,
      [recipientId]: addressId,
    }));
  };

  // Get delivery address for a recipient (default to "direct")
  const getRecipientDeliveryAddress = (recipientId: string) => {
    return recipientDeliveryAddresses[recipientId] || "direct";
  };

  /**
   * DYNAMIC LANDING PAGE CONTENT GENERATION
   * =======================================
   * Generates personalized landing page content based on goal-motion combinations
   * and event data (if applicable).
   *
   * CONTENT CUSTOMIZATION BY GOAL:
   * - drive-event: Event-specific messaging with dates, locations, and CTAs
   * - pipeline-acceleration: Sales-focused messaging for different pipeline stages
   * - product-launch: Product-centric messaging for launches and migrations
   * - customer-relationships: Relationship-focused appreciation and feedback messaging
   * - quick-send: Simple, direct messaging for quick campaigns
   *
   * EVENT INTEGRATION:
   * When eventId is provided, the function pulls event data to customize:
   * - Event name and date integration
   * - Location-specific messaging
   * - Motion-specific CTAs (registration, attendance, booth visits, etc.)
   *
   * PERSONALIZATION TOKENS:
   * All content supports {{first-name}} personalization tokens for recipients.
   *
   * EXTENDING:
   * To add new goal-motion combinations, add corresponding logic in this function
   * with appropriate headline and description content.
   */
  const generateLandingPageContent = () => {
    // Default content if no event data is available
    let headline = `Hello {{first-name}}, Your ${motionTitle} Gift Awaits!`;
    let description = `Thank you for being a valued ${
      goal === "customer-relationships" ? "customer" : "contact"
    }! We've selected this gift for you as part of our ${motionTitle} campaign.`;

    // If we have event data, customize the content
    if (eventData) {
      const eventName = eventData.name;
      const eventDateFormatted = eventData.eventDate
        ? new Date(eventData.eventDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "";
      const eventLocation = eventData.location || "Virtual";

      // Customize headline based on motion for drive-event goal
      if (goal === "drive-event") {
        if (motion === "boost-registration") {
          headline = `Hello {{first-name}}`;
          description = `We'd love to have you join us at ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          }${
            eventLocation !== "Virtual" ? ` at ${eventLocation}` : ""
          }. Surprise! We've got something special just for you. Think of it as a little "hello" that's way better than a handshake. Enjoy!`;
        } else if (motion === "ensure-attendance") {
          headline = `Hello {{first-name}}`;
          description = `We're looking forward to seeing you at ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          }${
            eventLocation !== "Virtual" ? ` at ${eventLocation}` : ""
          }. Here's a gift to remind you of this upcoming event!`;
        } else if (motion === "booth-pickup") {
          headline = `Hello {{first-name}}`;
          description = `Stop by our booth at ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          } to pick up your special gift. We're excited to meet you in person!`;
        } else if (motion === "book-meetings") {
          headline = `Hello {{first-name}}`;
          description = `We'd love to schedule a 1:1 meeting with you at ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          }. Claim this gift and let's find a time to chat!`;
        } else if (motion === "thank-you") {
          headline = `Hello {{first-name}}`;
          description = `We hope you enjoyed ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          }. As a token of our appreciation for your participation, we've selected this gift for you.`;
        } else {
          // Default for other event motions
          headline = `Hello {{first-name}}, A Gift from ${eventName}!`;
          description = `We've selected this special gift for you in connection with ${eventName}${
            eventDateFormatted ? ` on ${eventDateFormatted}` : ""
          }.`;
        }
      }
    }

    // If no event data or not an event-related goal, use motion-specific messaging
    if (!eventData || goal !== "drive-event") {
      // Pipeline Acceleration motions
      if (goal === "pipeline-acceleration") {
        if (motion === "break-into-accounts") {
          headline = `Hello {{first-name}}, We'd Love to Connect`;
          description = `We've selected this gift for you as we'd like to explore how we might work together. Looking forward to the conversation!`;
        } else if (motion === "reengage-cold-leads") {
          headline = `Hello {{first-name}}, Let's Reconnect`;
          description = `It's been a while since we last spoke, and we'd love to pick up where we left off. Please enjoy this gift as we reconnect.`;
        } else if (motion === "nurture-warm-leads") {
          headline = `Hello {{first-name}}, Thanks for Your Interest`;
          description = `We appreciate your continued interest in our solutions. We've selected this gift to thank you as we continue our conversation.`;
        } else if (motion === "champion-activation") {
          headline = `Hello {{first-name}}, Thank You for Your Support`;
          description = `We appreciate your advocacy and support. This gift is a small token of our gratitude for championing our solutions.`;
        }
      }
      // Product Launch & Takeout motions
      else if (goal === "product-launch") {
        if (motion === "product-launch") {
          headline = `Hello {{first-name}}, Introducing Our New Solution`;
          description = `We're excited to share our latest innovation with you. Please enjoy this gift as you explore what's new.`;
        } else if (motion === "competitive-takeout") {
          headline = `Hello {{first-name}}, Discover a Better Alternative`;
          description = `We believe we can offer you a better experience. Please enjoy this gift as you consider your options.`;
        } else if (motion === "migration-nudge") {
          headline = `Hello {{first-name}}, Making the Switch is Easy`;
          description = `We're here to make your transition seamless. This gift is a small token to help you consider making the change.`;
        }
      }
      // Customer Relationships motions
      else if (goal === "customer-relationships") {
        if (motion === "thank-you-gifts") {
          headline = `Hello {{first-name}}, Thank You for Your Partnership`;
          description = `We truly value our relationship and wanted to express our gratitude with this small token of appreciation.`;
        } else if (motion === "anniversary-milestone") {
          headline = `Hello {{first-name}}, Celebrating Our Partnership`;
          description = `We're celebrating our continued partnership and the milestones we've achieved together. Please enjoy this gift!`;
        } else if (motion === "feedback-collection") {
          headline = `Hello {{first-name}}, We Value Your Feedback`;
          description = `Your opinion matters to us. We've selected this gift to thank you for sharing your thoughts with us.`;
        } else if (motion === "csat-recovery") {
          headline = `Hello {{first-name}}, We Appreciate Your Patience`;
          description = `Thank you for giving us the opportunity to improve. Please accept this gift as a token of our commitment to your satisfaction.`;
        }
      }
      // Quick Send motion
      else if (goal === "quick-send" && motion === "express-send") {
        headline = `Hello {{first-name}}, A Gift for You`;
        description = `We've selected this special gift just for you. We hope you enjoy it!`;
      }
    }

    return { headline, description };
  };

  // Get default landing page content based on goal, motion and event data
  React.useEffect(() => {
    // Set default gift message if none exists or update with organization name when available
    const orgName = organization?.name || "Team";
    const defaultMessage = `🎁 Surprise! We've got something special just for you. Think of it as a little "hello" that's way better than a handshake. Enjoy!`;

    if (!giftMessage) {
      setGiftMessage(defaultMessage);
    }

    // Set default dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // Start by default: 7 days from now

    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 14); // Delivery by default: 14 days from now

    setStartByDate(startDate.toISOString().split("T")[0]);
    setDeliveryByDate(deliveryDate.toISOString().split("T")[0]);

    // Generate dynamic content based on event, goal, and motion
    const { headline, description } = generateLandingPageContent();
    setLandingPageContent(description);

    // Set default landing page config only if there's no draft data
    if (!landingPageConfig && !draftCampaignData?.landingPageConfig) {
      setLandingPageConfig({
        logo: {
          type: "url",
          url: organization?.branding?.logo_url || "/Logo Final.png",
        },
        background: {
          type: "gradient",
          color: "#FFFFFF",
          gradientFrom: "#ECFCFF",
          gradientTo: "#E8C2FF",
          gradientDirection: "to-r",
        },
        content: {
          headline: headline,
          headlineColor: "#111827",
          description: description,
          descriptionColor: "#6B7280",
        },
        media: {
          type: "image",
          imageUrl:
            "https://static.vecteezy.com/system/resources/previews/011/564/411/non_2x/reserved-sign-on-restaurant-table-booked-desk-in-cozy-cafe-against-blurred-background-booking-and-reservation-concept-book-seat-for-costumer-free-photo.JPG",
          videoUrl: "",
        },
        actionButtons: {
          primary: {
            enabled: true,
            text: "Register Now",
            color: "#6941C6",
            url: "#claim",
          },
          secondary: {
            enabled: true,
            text: "Learn More",
            color: "#6941C6",
            url: "#learn-more",
          },
        },
        date: {
          enabled: true,
          value: deliveryDate,
          color: "#6941C6",
        },
      });
    }
  }, [
    goal,
    motion,
    motionTitle,
    giftMessage,
    organizationId,
    eventData,
    organization,
  ]);

  // Update landing page content and logo when relevant data changes
  React.useEffect(() => {
    if (landingPageConfig && !draftCampaignData?.landingPageConfig) {
      const updates: Partial<LandingPageConfig> = {};
      let hasUpdates = false;

      // Update logo if organization data is available and different
      if (
        organization?.branding?.logo_url &&
        landingPageConfig.logo.url !== organization.branding.logo_url
      ) {
        updates.logo = {
          ...landingPageConfig.logo,
          url: organization.branding.logo_url,
        };
        hasUpdates = true;
      }

      // Generate dynamic content based on goal, motion, and event data only if not draft
      const { headline, description } = generateLandingPageContent();

      // Only update content if it has actually changed and we're not in draft mode
      if (
        landingPageConfig.content.headline !== headline ||
        landingPageConfig.content.description !== description
      ) {
        updates.content = {
          ...landingPageConfig.content,
          headline: headline,
          description: description,
        };
        hasUpdates = true;
      }

      // Only update if there are actual changes
      if (hasUpdates) {
        setLandingPageConfig({
          ...landingPageConfig,
          ...updates,
        });
      }

      // Update landing page content only if not draft
      setLandingPageContent(description);
    }
  }, [organization, goal, motion, motionTitle, eventData, draftCampaignData]);

  // Fetch bundles from API for recipient-choice mode
  const fetchBundles = async () => {
    try {
      setIsLoadingBundles(true);
      setBundlesError("");

      if (!authToken || !organizationId) {
        throw new Error("Authentication information missing");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles?isGift=true&sortOrder=desc`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bundles: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("API returned unsuccessful response");
      }

      // Set bundles from API response
      setBundles(data.data || []);

      // Auto-select Delight Collection bundle (67ce2054e04f14d6638c7b6c) as default
      if (data.data && data.data.length > 0) {
        const delightCollectionId = "67ce2054e04f14d6638c7b6c";
        const delightCollection = data.data.find(
          (bundle) => bundle.bundleId === delightCollectionId
        );

        // Use Delight Collection if available, otherwise fall back to first bundle
        const selectedBundleData = delightCollection || data.data[0];
        setSelectedBundle(selectedBundleData.bundleId);

        // Update selected recipient gifts based on selected bundle
        if (selectedBundleData.gifts && selectedBundleData.gifts.length > 0) {
          // Filter gifts by budget, then sort by price in descending order (highest price first)
          const budgetFilteredGifts = selectedBundleData.gifts.filter(
            (gift) => gift.price >= budget.min && gift.price <= budget.max
          );
          const sortedGifts = [...budgetFilteredGifts].sort(
            (a, b) => b.price - a.price
          );
          // Get first 4 gifts or all if less than 4
          const initialGifts = sortedGifts
            .slice(0, 4)
            .map((gift) => gift.giftId);
          setSelectedRecipientGifts(initialGifts);
        }
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
      setBundlesError(
        error instanceof Error ? error.message : "Failed to fetch bundles"
      );
    } finally {
      setIsLoadingBundles(false);
    }
  };

  // Add style tag to document head for slide-in animation
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = slideInAnimation;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Load default data and select first list on component mount
  useEffect(() => {
    console.log("🏗️ Component mount useEffect triggered", {
      dependencies: {
        authToken: !!authToken,
        organizationId: !!organizationId,
        isQuickSendMode,
        draftCampaignData: !!draftCampaignData,
      },
      currentState: {
        startByDate,
        deliveryByDate,
      },
    });

    // Set default dates based on current date or draft data
    const today = new Date();

    if (draftCampaignData) {
      console.log("📋 Using draft data for dates", { draftCampaignData });
      // Use dates from draft if available
      if (draftCampaignData.eventStartDate) {
        setStartByDate(
          new Date(draftCampaignData.eventStartDate).toISOString().split("T")[0]
        );
      }
      if (draftCampaignData.deliverByDate) {
        setDeliveryByDate(
          new Date(draftCampaignData.deliverByDate).toISOString().split("T")[0]
        );
      }
    } else {
      console.log("📅 Setting default dates (no draft data)");
      // Set default dates if no draft data
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 7);
      setStartByDate(startDate.toISOString().split("T")[0]);

      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 14);
      setDeliveryByDate(deliveryDate.toISOString().split("T")[0]);
    }

    // Fetch data based on mode
    if (authToken && organizationId) {
      console.log("✅ Auth ready - proceeding with data fetching", { isQuickSendMode });

      // Fetch organization data for branding
      fetchOrganization();

      if (isQuickSendMode) {
        // Quick Send mode - contacts will be loaded on demand when user searches
        console.log("🎯 Quick Send mode - contacts will be loaded when user types 3+ characters");
      } else {
        // Fetch saved lists for normal mode
        fetchContactLists().then(() => {
          // If we have a draft with a contact list, select it
          if (draftCampaignData?.contactListId) {
            handleListSelect(draftCampaignData.contactListId);
          }
        });
      }
      // TODO: Uncomment when delivery locations API is ready
      // fetchOrganizationDeliveryLocations();
    }
  }, [authToken, organizationId, isQuickSendMode, draftCampaignData]);

  // Search useEffect - trigger API call when user types 3+ characters
  useEffect(() => {
    console.log("🔍 Search useEffect triggered", {
      contactSearchQuery: `"${contactSearchQuery}"`,
      queryLength: contactSearchQuery.length,
      isQuickSendExpressMode: goal === "quick-send" && motion === "express-send",
    });

    // Exit early if not in Quick Send Express mode
    if (goal !== "quick-send" || motion !== "express-send") {
      console.log("❌ Not in Quick Send Express mode - exiting search useEffect");
      return;
    }

    // Exit early if query is less than 3 characters
    if (contactSearchQuery.length < 3) {
      console.log("❌ Search query less than 3 characters - exiting search useEffect", {
        required: 3,
        actual: contactSearchQuery.length,
      });
      // Clear search results when query is too short
      setSearchResults([]);
      return;
    }

    // Set up debounced API call
    console.log("⏱️ Setting up debounced API call with 500ms delay");
    const timeoutId = setTimeout(async () => {
      console.log("📞 Debounce timeout reached - triggering searchContactsByName", {
        searchQuery: contactSearchQuery,
      });
      try {
        const results = await searchContactsByName(contactSearchQuery);
        setSearchResults(results || []);
        console.log("✅ Search results updated", { count: results?.length || 0 });
      } catch (error) {
        console.error("❌ Search failed", error);
        setSearchResults([]);
      }
    }, 500);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up search timeout");
      clearTimeout(timeoutId);
    };
  }, [contactSearchQuery, goal, motion]);

  // Auto-select first list when lists are loaded (only for non-Quick Send mode)
  //   useEffect(() => {
  // Only auto-select first list if:
  // 1. Not in Quick Send mode
  // 2. We have lists
  // 3. No list is currently selected
  // 4. No draft data with a contact list
  //     if (
  //       !isQuickSendMode &&
  //       savedLists.length > 0 &&
  //       !selectedListId &&
  //       !draftCampaignData?.contactListId
  //     ) {
  //       handleListSelect(savedLists[0].id);
  //     }
  //   }, [savedLists, selectedListId, isQuickSendMode, draftCampaignData]);

  // Fetch bundles when gift mode is set to recipient-choice or one-gift
  useEffect(() => {
    if (
      (selectedGiftMode === "recipient-choice" ||
        selectedGiftMode === "one-gift") &&
      authToken &&
      organizationId &&
      bundles.length === 0
    ) {
      fetchBundles();
    }
  }, [selectedGiftMode, authToken, organizationId, bundles.length]);

  // Ensure gift expiration date is always today + 90 days until campaign is launched
  useEffect(() => {
    // Only update if the campaign hasn't been launched yet
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 90);
    setGiftExpirationDate(expirationDate.toISOString().split("T")[0]);
  }, []);

  // Update gift selections when mode or budget changes
  useEffect(() => {
    // Skip if we don't have the necessary data yet
    if (!selectedGiftMode || !budget || !bundles) return;

    // Handle One Gift for All mode
    if (selectedGiftMode === "one-gift") {
      // If we have bundles, use the first 4 gifts from the selected bundle
      if (bundles.length > 0 && selectedBundle) {
        const bundleGifts =
          bundles.find((b) => b.bundleId === selectedBundle)?.gifts || [];
        // Filter gifts by budget, then sort by price in descending order (highest price first)
        const budgetFilteredGifts = bundleGifts.filter(
          (gift) => gift.price >= budget.min && gift.price <= budget.max
        );
        const sortedGifts = [...budgetFilteredGifts].sort(
          (a, b) => b.price - a.price
        );
        const giftIds = sortedGifts.slice(0, 4).map((gift) => gift.giftId);

        // Only update if the gift IDs have changed
        if (!arraysEqual(displayedOneGiftOptions, giftIds)) {
          setDisplayedOneGiftOptions(giftIds);
        }

        // Set the first gift as selected if we have gifts and current selection is invalid
        if (
          giftIds.length > 0 &&
          (!selectedGift || !sortedGifts.some((g) => g.giftId === selectedGift))
        ) {
          setSelectedGift(giftIds[0]);
        }
      } else {
        // Otherwise use sample gifts filtered by budget and sorted by price descending
        const budgetFilteredSampleGifts = sampleGifts.filter(
          (gift) => gift.price >= budget.min && gift.price <= budget.max
        );
        const sortedSampleGifts = [...budgetFilteredSampleGifts].sort(
          (a, b) => b.price - a.price
        );
        const sampleGiftIds = sortedSampleGifts
          .slice(0, 4)
          .map((gift) => gift.id);

        // Only update if the gift IDs have changed
        if (!arraysEqual(displayedOneGiftOptions, sampleGiftIds)) {
          setDisplayedOneGiftOptions(sampleGiftIds);
        }

        // Set the first gift as selected if current selection is invalid
        if (!selectedGift || !sampleGiftIds.includes(selectedGift)) {
          setSelectedGift(sampleGiftIds[0]);
        }
      }
    }
    // Handle Recipient Choice mode
    else if (selectedGiftMode === "recipient-choice") {
      if (selectedBundle && bundles.length > 0) {
        // Handle API bundle gifts
        const bundle = bundles.find((b) => b.bundleId === selectedBundle);
        const bundleGifts = bundle?.gifts || [];
        if (bundleGifts.length > 0) {
          // Filter current selections to only include gifts within budget
          const budgetFilteredGifts = bundleGifts.filter(
            (gift) => gift.price >= budget.min && gift.price <= budget.max
          );
          const currentValidSelections = selectedRecipientGifts.filter(
            (giftId) =>
              budgetFilteredGifts.some((gift) => gift.giftId === giftId)
          );

          let newSelections = currentValidSelections;

          // If we have fewer than 3 valid selections, add more from budget-filtered gifts
          if (currentValidSelections.length < 3) {
            const sortedGifts = [...budgetFilteredGifts].sort(
              (a, b) => b.price - a.price
            );
            const additionalGifts = sortedGifts
              .filter((gift) => !currentValidSelections.includes(gift.giftId))
              .slice(0, 11 - currentValidSelections.length)
              .map((gift) => gift.giftId);

            newSelections = [...currentValidSelections, ...additionalGifts];
          } else {
            // Update selections to only include budget-valid gifts
            newSelections = currentValidSelections.slice(0, 11);
          }

          // Only update if the selections have changed
          if (!arraysEqual(selectedRecipientGifts, newSelections)) {
            setSelectedRecipientGifts(newSelections);
          }
        }
      } else {
        // Handle sample gifts fallback
        const budgetFilteredSampleGifts = sampleGifts.filter(
          (gift) => gift.price >= budget.min && gift.price <= budget.max
        );
        const currentValidSelections = selectedRecipientGifts.filter((giftId) =>
          budgetFilteredSampleGifts.some((gift) => gift.id === giftId)
        );

        let newSelections = currentValidSelections;

        // If we have fewer than 3 valid selections, add more from budget-filtered gifts
        if (currentValidSelections.length < 3) {
          const sortedGifts = [...budgetFilteredSampleGifts].sort(
            (a, b) => b.price - a.price
          );
          const additionalGifts = sortedGifts
            .filter((gift) => !currentValidSelections.includes(gift.id))
            .slice(0, 11 - currentValidSelections.length)
            .map((gift) => gift.id);

          newSelections = [...currentValidSelections, ...additionalGifts];
        } else {
          // Update selections to only include budget-valid gifts
          newSelections = currentValidSelections.slice(0, 11);
        }

        // Only update if the selections have changed
        if (!arraysEqual(selectedRecipientGifts, newSelections)) {
          setSelectedRecipientGifts(newSelections);
        }
      }
    }
  }, [
    selectedGiftMode,
    budget,
    selectedBundle,
    bundles,
    selectedGift,
    selectedRecipientGifts,
    displayedOneGiftOptions,
    sampleGifts,
  ]);

  // Filter and sort gifts for the modal
  const filteredGifts = sampleGifts
    .filter((gift) => {
      // Filter by budget first
      if (gift.price < budget.min || gift.price > budget.max) return false;

      // Filter by catalog
      if (giftFilterCatalog && gift.catalog !== giftFilterCatalog) return false;

      // Filter by price
      if (giftFilterPrice === "under25" && gift.price >= 25) return false;
      if (giftFilterPrice === "25to50" && (gift.price < 25 || gift.price > 50))
        return false;
      if (
        giftFilterPrice === "50to100" &&
        (gift.price < 50 || gift.price > 100)
      )
        return false;
      if (giftFilterPrice === "over100" && gift.price <= 100) return false;

      // Filter by search query
      if (
        giftSearchQuery &&
        !gift.name.toLowerCase().includes(giftSearchQuery.toLowerCase())
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (giftSortBy === "price-low") return a.price - b.price;
      if (giftSortBy === "price-high") return b.price - a.price;
      if (giftSortBy === "name") return a.name.localeCompare(b.name);
      // Default: recommended - sort by price descending
      return b.price - a.price;
    });

  // Get recommended gifts (first 4, filtered by budget and sorted by price descending)
  const recommendedGifts = [...sampleGifts]
    .filter((gift) => gift.price >= budget.min && gift.price <= budget.max)
    .sort((a, b) => b.price - a.price)
    .slice(0, 4);

  // Handle gift selection
  const handleGiftSelect = (giftId: string) => {
    setSelectedGift(giftId);

    // For One Gift for All mode, implement queue behavior
    if (selectedGiftMode === "one-gift") {
      // If the gift is already in the displayed options, just move it to the front
      if (displayedOneGiftOptions.includes(giftId)) {
        setDisplayedOneGiftOptions([
          giftId,
          ...displayedOneGiftOptions.filter((id) => id !== giftId),
        ]);
      } else {
        // Otherwise, add it to the front and remove the last one if we have 11 already
        const newDisplayedOptions = [giftId];

        // Add the existing options (except the selected one) up to a maximum of 10 more
        const remainingOptions = displayedOneGiftOptions
          .filter((id) => id !== giftId)
          .slice(0, 10);
        setDisplayedOneGiftOptions([
          ...newDisplayedOptions,
          ...remainingOptions,
        ]);
      }
    }
  };

  // Open gift browser modal
  const openGiftModal = () => {
    setShowGiftModal(true);
  };

  // Close gift browser modal
  const closeGiftModal = () => {
    setIsClosingGiftModal(true);
    setTimeout(() => {
      setShowGiftModal(false);
      setIsClosingGiftModal(false);
    }, 300); // Match the animation duration
  };

  // Select gift from modal and close
  const selectGiftAndClose = (giftId: string) => {
    handleGiftSelect(giftId); // Use the same logic as handleGiftSelect
    closeGiftModal();
  };

  // Reset gift filters
  const resetGiftFilters = () => {
    setGiftFilterCatalog("");
    setGiftFilterPrice("");
    setGiftSearchQuery("");
    setGiftSortBy("recommended");
  };

  // Toggle recipient gift selection
  const toggleRecipientGift = (giftId: string) => {
    if (selectedRecipientGifts.includes(giftId)) {
      // Don't allow deselecting if we would have fewer than 3 gifts
      if (selectedRecipientGifts.length > 3) {
        setSelectedRecipientGifts(
          selectedRecipientGifts.filter((id) => id !== giftId)
        );
      } else {
        // Show a message that at least 3 gifts are required
        // alert("At least 3 gift options are required for recipient choice");
        showNotification(
          "At least 3 gift options are required for recipient choice",
          "error"
        );
      }
    } else {
      // Check if adding would exceed 11 gifts
      if (selectedRecipientGifts.length >= 11) {
        // alert("Maximum of 11 gift options allowed");
        showNotification("Maximum of 11 gift options allowed", "error");
        return;
      }
      setSelectedRecipientGifts([...selectedRecipientGifts, giftId]);
    }
  };

  // Handle bundle selection
  const handleBundleSelect = (bundleId: string) => {
    setSelectedBundle(bundleId);

    // Find the selected bundle
    const bundle = bundles.find((b) => b.bundleId === bundleId);
    if (bundle && bundle.gifts && bundle.gifts.length > 0) {
      // Filter gifts by budget, then sort by price in descending order and get first 11 gifts or all if less than 11
      const budgetFilteredGifts = bundle.gifts.filter(
        (gift) => gift.price >= budget.min && gift.price <= budget.max
      );
      const sortedGifts = [...budgetFilteredGifts].sort(
        (a, b) => b.price - a.price
      );
      const initialGifts = sortedGifts.slice(0, 11).map((gift) => gift.giftId);
      setSelectedRecipientGifts(initialGifts);
    }
  };

  // Open recipient gift browser modal
  const openRecipientGiftModal = () => {
    setShowRecipientGiftModal(true);
  };

  // Close recipient gift browser modal
  const closeRecipientGiftModal = () => {
    setIsClosingRecipientGiftModal(true);
    setTimeout(() => {
      setShowRecipientGiftModal(false);
      setIsClosingRecipientGiftModal(false);
    }, 300); // Match the animation duration
  };

  // Get the selected recipient gifts data (NO fallback to sampleGifts)
  const selectedRecipientGiftsData =
    selectedBundle && bundles.length > 0
      ? bundles
          .find((bundle) => bundle.bundleId === selectedBundle)
          ?.gifts.filter((gift) => selectedRecipientGifts.includes(gift.giftId))
          .filter(
            (gift) => gift.price >= budget.min && gift.price <= budget.max
          ) // Filter by budget
          .sort((a, b) => b.price - a.price) || [] // Sort by price descending
      : [];

  // Budget states
  // Budget state is now consolidated in the budget object

  // NFC card state
  const [includeNfcCard, setIncludeNfcCard] = useState<boolean>(false);

  // CRM Sync states - all turned on by default
  const [crmSyncInviteSent, setCrmSyncInviteSent] = useState<boolean>(true);
  const [crmSyncGiftSelected, setCrmSyncGiftSelected] = useState<boolean>(true);
  const [crmSyncAddressUpdated, setCrmSyncAddressUpdated] =
    useState<boolean>(true);
  const [crmSyncInTransit, setCrmSyncInTransit] = useState<boolean>(true);
  const [crmSyncDelivered, setCrmSyncDelivered] = useState<boolean>(true);
  const [crmSyncAcknowledged, setCrmSyncAcknowledged] = useState<boolean>(true);

  // Notification states - all turned on by default
  const [senderSlackNotifications, setSenderSlackNotifications] =
    useState<boolean>(true);
  const [senderEmailNotifications, setSenderEmailNotifications] =
    useState<boolean>(true);
  const [salesOwnerSlackNotifications, setSalesOwnerSlackNotifications] =
    useState<boolean>(true);
  const [salesOwnerEmailNotifications, setSalesOwnerEmailNotifications] =
    useState<boolean>(true);

  // Derived budget values
  const totalBeforeCredits =
    budget.giftCost +
    budget.shippingCost +
    budget.handlingCost +
    budget.nfcCardCost;
  const totalAfterCredits = totalBeforeCredits;

  /**
   * DYNAMIC BUDGET CALCULATION
   * ==========================
   * Calculates campaign costs based on the selected mode and recipient count.
   *
   * RECIPIENT COUNT LOGIC:
   * - Express Send Mode: Uses selectedContacts.length
   * - Claim Link Mode: Uses numberOfGifts (user-defined allocation)
   * - Regular Mode: Uses filteredRecipients.length or recipients.length
   *
   * COST COMPONENTS:
   * - Gift Cost: Varies by gift mode (one-gift, recipient-choice, smart-match)
   * - Shipping Cost: Per-recipient shipping charges
   * - Handling Cost: Per-recipient handling fees
   * - NFC Card Cost: Optional $9 per recipient for NFC cards
   * - Credits: Required for smart-match and recipient-choice modes
   *
   * IMPORTANT: When adding new modes, ensure recipient count logic is updated here.
   */
  const calculateBudget = () => {
    let calculatedGiftCost = 0;
    let calculatedShippingCost = 0;
    let calculatedHandlingCost = 0;
    let calculatedNfcCardCost = 0;
    let calculatedRequiredCredits = 0;

    // Get the number of recipients
    const totalRecipients = isQuickSendExpressMode
      ? selectedContacts.length
      : isQuickSendClaimLinkMode
      ? numberOfGifts
      : motion === "booth-pickup"
      ? recipientCount
      : filteredRecipients.length || recipients.length || 0;

    if (totalRecipients > 0) {
      // Calculate NFC card cost if enabled
      if (includeNfcCard) {
        calculatedNfcCardCost = totalRecipients * 9; // $9 per NFC card
      }

      // Calculate required credits based on gift mode
      if (
        selectedGiftMode === "smart-match" ||
        selectedGiftMode === "recipient-choice"
      ) {
        // For Smart Match and Recipient Choice modes - 1 credit per recipient
        calculatedRequiredCredits = totalRecipients;
      }
      // For "one-gift" mode - no credits required

      if (selectedGiftMode === "one-gift") {
        // For "One Gift for All" mode, use the selected gift's costs
        let giftDetails;

        if (selectedBundle && bundles.length > 0) {
          // Get gift from API data
          giftDetails = bundles
            .find((b) => b.bundleId === selectedBundle)
            ?.gifts.find((g) => g.giftId === selectedGift);
          console.info("giftDetails if", giftDetails);
        } else {
          // Get gift from sample data
          giftDetails = sampleGifts.find((g) => g.id === selectedGift);
          console.info("giftDetails else", giftDetails);
        }

        if (giftDetails) {
          calculatedGiftCost = totalRecipients * giftDetails.price;
          calculatedShippingCost =
            totalRecipients * (giftDetails.shippingCost || 10); // Default shipping if not specified
          calculatedHandlingCost =
            totalRecipients * (giftDetails.handlingCost || 5); // Default handling if not specified
        }
      } else if (selectedGiftMode === "recipient-choice") {
        // For "Recipient Choice" mode, use the highest-priced gift
        let highestPrice = 0;
        let highestShippingCost = 0;
        let highestHandlingCost = 0;

        if (selectedBundle && bundles.length > 0) {
          // Calculate from API data
          const bundleGifts =
            bundles.find((b) => b.bundleId === selectedBundle)?.gifts || [];
          const selectedGifts = bundleGifts.filter((g) =>
            selectedRecipientGifts.includes(g.giftId)
          );

          console.info("selectedGifts", selectedGifts);

          if (selectedGifts.length > 0) {
            // Find the highest-priced gift
            selectedGifts.forEach((gift) => {
              if (gift.price > highestPrice) {
                highestPrice = gift.price;
                highestShippingCost = gift.shippingCost || 10;
                highestHandlingCost = gift.handlingCost || 5;
              }
            });
          }
        } else {
          // Calculate from sample data
          const selectedGifts = sampleGifts.filter((g) =>
            selectedRecipientGifts.includes(g.id)
          );

          if (selectedGifts.length > 0) {
            // Find the highest-priced gift
            selectedGifts.forEach((gift) => {
              if (gift.price > highestPrice) {
                highestPrice = gift.price;
                highestShippingCost = gift.shippingCost;
                highestHandlingCost = gift.handlingCost;
              }
            });
          }
        }

        if (highestPrice > 0) {
          // Apply to all recipients
          calculatedGiftCost = totalRecipients * highestPrice;
          calculatedShippingCost = totalRecipients * highestShippingCost;
          calculatedHandlingCost = totalRecipients * highestHandlingCost;
        }
      } else if (selectedGiftMode === "smart-match") {
        // For "Smart Match" mode, use a fixed average price
        calculatedGiftCost = totalRecipients * 50; // Average gift cost
        calculatedShippingCost = totalRecipients * 10; // Average shipping
        calculatedHandlingCost = totalRecipients * 5; // Average handling
      }
    }

    // Update consolidated budget state
    setBudget((prev) => ({
      ...prev,
      giftCost: parseFloat(calculatedGiftCost.toFixed(2)),
      shippingCost: parseFloat(calculatedShippingCost.toFixed(2)),
      handlingCost: parseFloat(calculatedHandlingCost.toFixed(2)),
      nfcCardCost: parseFloat(calculatedNfcCardCost.toFixed(2)),
      requiredCredits: calculatedRequiredCredits,
    }));
  };

  // Keep filteredRecipients in sync with selectedContacts in Quick Send Express mode
  useEffect(() => {
    if (isQuickSendExpressMode) {
      setFilteredRecipients(selectedContacts);
    }
  }, [selectedContacts, isQuickSendExpressMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContactDropdown) {
        const target = event.target as Element;
        if (!target.closest(".contact-dropdown-container")) {
          setShowContactDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showContactDropdown]);

  // Update budget when relevant factors change
  useEffect(() => {
    calculateBudget();
  }, [
    selectedGiftMode,
    selectedGift,
    selectedRecipientGifts,
    filteredRecipients.length,
    recipients.length,
    selectedContacts.length,
    selectedBundle,
    includeNfcCard,
    isQuickSendExpressMode,
    isQuickSendClaimLinkMode,
    numberOfGifts,
    motion === "booth-pickup" ? recipientCount : undefined,
  ]);

  // Toggle budget details
  const toggleBudgetDetails = () => {
    setBudget((prev) => ({
      ...prev,
      showDetails: !prev.showDetails,
    }));
  };

  // Fetch event data if eventId is provided
  useEffect(() => {
    if (eventId && authToken && organizationId) {
      fetchEventData();
    }
  }, [eventId, authToken, organizationId]);

  // Auto-select all filtered recipients when they're loaded
  useEffect(() => {
    // Only auto-select for regular campaign modes, not Quick Send Express
    if (filteredRecipients.length > 0) {
      // Filter out recipients that are already selected to avoid duplicates
      const newRecipients = filteredRecipients.filter(
        (recipient) =>
          !selectedContacts.some((selected) => selected.id === recipient.id)
      );

      if (newRecipients.length > 0) {
        console.log(
          `🔄 Auto-selecting ${newRecipients.length} filtered recipients`
        );
        setSelectedContacts((prev) => [...prev, ...newRecipients]);

        // Initialize delivery addresses for new recipients
        const newAddresses: { [key: string]: string } = {};
        newRecipients.forEach((recipient) => {
          newAddresses[recipient.id] = "direct"; // Default delivery option
        });
        setRecipientDeliveryAddresses((prev) => ({ ...prev, ...newAddresses }));
      }
    }
  }, [filteredRecipients, isQuickSendExpressMode]); // Don't include selectedContacts to avoid infinite loop

  // Expose campaign designer state to window object for debugging
  useEffect(() => {
    console.log("🎪 CampaignDesigner useEffect triggered for window state update");
    console.log("  motion:", motion);
    console.log("  recipientCount:", recipientCount);
    console.log("  isBoothPickup:", motion === "booth-pickup");
    
    (window as any).campaignDesignerState = {
      campaignName,
      startByDate,
      deliveryByDate,
      giftExpirationDate,
      selectedGiftMode,
      giftMessage,
      giftLogo,
      // Recipients data - all sources
      recipientsCount: motion === "booth-pickup" 
        ? recipientCount 
        : isQuickSendExpressMode
        ? selectedContacts.length
        : filteredRecipients.length || recipients.length || 0,
      recipientCount: motion === "booth-pickup" ? recipientCount : undefined,
      selectedContactsCount: selectedContacts?.length || 0,
      filteredRecipientsCount: filteredRecipients?.length || 0,
      originalRecipientsCount: recipients?.length || 0,
      allContactsCount: allContacts?.length || 0,
      selectedGift,
      selectedBundle,
      selectedRecipientGifts,
      budget,
      budgetTotal: totalAfterCredits || 0,
      expandedSection,
      isQuickSendMode,
      isQuickSendExpressMode,
      isQuickSendClaimLinkMode,
      landingPageContent,
      landingPageConfig,
      eventData,
      // Contact list selection
      selectedListId: selectedListId,
      contactListId: selectedListId, // Add both for compatibility
      // Detailed recipient arrays
      selectedContacts: selectedContacts || [],
      filteredRecipients: filteredRecipients || [],
      allContacts: allContacts || [],
      originalRecipients: recipients || [],
      currentStep: "campaign-designer",
      lastUpdated: new Date().toISOString(),
      organization,
      // Add outcome card data
      outcomeCard: {
        message: giftMessage,
        logoLink: giftLogo,
      },
      // Add email template data
      emailTemplates,
    };

    // Cleanup function
    return () => {
      delete (window as any).campaignDesignerState;
    };
  }, [
    campaignName,
    startByDate,
    deliveryByDate,
    giftExpirationDate,
    selectedGiftMode,
    giftMessage,
    giftLogo,
    selectedContacts,
    filteredRecipients,
    allContacts,
    recipients,
    selectedGift,
    selectedBundle,
    selectedRecipientGifts,
    budget,
    totalAfterCredits,
    expandedSection,
    isQuickSendMode,
    isQuickSendExpressMode,
    isQuickSendClaimLinkMode,
    landingPageContent,
    landingPageConfig,
    eventData,
    selectedListId, // Add this so window object updates when contact list changes
    recipientCount, // Add this so window object updates when recipient count changes
    motion, // Add this so window object updates when motion changes
    emailTemplates, // Add this so window object updates when email templates change
  ]);

  // Function to fetch event data
  const fetchEventData = async () => {
    if (!eventId || !authToken || !organizationId) return;

    try {
      setIsLoadingEvent(true);
      setEventError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.status}`);
      }

      const data = await response.json();

      // Check if the data has the expected structure
      const eventData = data.event || data.data || data;

      if (!eventData) {
        throw new Error("Invalid response format: event data not found");
      }

      // Transform API response to match our state format
      const transformedEvent = {
        id: eventData._id || eventData.id || "",
        name: eventData.name || "Unnamed Event",
        eventDate: eventData.eventDate || "",
        location: eventData.location || "",
        currentRegistration:
          eventData.currentRegistration || eventData.registrationCount || "--",
        expectedRegistration:
          eventData.expectedRegistration || eventData.expectedAttendees || "--",
        bannerImage:
          eventData.media?.banner ||
          eventData.bannerImage ||
          "/images/event-placeholder.jpg",
      };

      setEventData(transformedEvent);

      // Update campaign name with event name if available and no draft data
      if (transformedEvent.name && !draftCampaignData) {
        setCampaignName(`${transformedEvent.name}-${motionTitle}`);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      setEventError(
        error instanceof Error ? error.message : "Failed to fetch event data"
      );
    } finally {
      setIsLoadingEvent(false);
    }
  };

  // Function to fetch organization data
  const fetchOrganization = async () => {
    if (!authToken || !organizationId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organization: ${response.status}`);
      }

      const data = await response.json();
      setOrganization(data);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  };
  useEffect(() => {
    if (landingPageConfig?.logo?.url && giftLogo === "/Logo Final.png") {
      setGiftLogo(landingPageConfig.logo.url);
    }
  }, [landingPageConfig?.logo?.url, giftLogo]);
  
  return (
    <div className="flex flex-col h-full w-full mt-0">
      {/* Event Information Section - Only show for event-related campaigns */}
      {(goal === "drive-event" || eventId) && (
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4">
            {isLoadingEvent ? (
              <div className="flex items-center justify-center p-6">
                <svg
                  className="animate-spin h-5 w-5 text-primary mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-gray-500">
                  Loading event information...
                </span>
              </div>
            ) : eventError ? (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                <div className="flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Error loading event</span>
                </div>
                <p className="mb-3">{eventError}</p>
                <button
                  onClick={fetchEventData}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                {/* Event Banner Image - Left Side (1/3) */}
                <div className="w-full md:w-1/3">
                  <div className="rounded-lg overflow-hidden h-full shadow-sm border border-gray-100 bg-gray-50">
                    <div className="relative w-full h-40 md:h-full">
                      <img
                        src={
                          eventData?.bannerImage ||
                          "/images/event-placeholder.jpg"
                        }
                        alt="Event Banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 inline-block max-w-max">
                          <p className="text-xs font-medium text-gray-900">
                            Event Banner
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details - Right Side (2/3) */}
                <div className="w-full md:w-2/3">
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm h-full p-5">
                    {/* Event Name */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {eventData?.name || ""}
                    </h3>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Date */}
                      <div className="flex items-start">
                        <div className="text-primary mr-3 mt-1">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">
                            Event Date
                          </span>
                          <p className="text-base font-medium">
                            {eventData?.eventDate
                              ? new Date(
                                  eventData.eventDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "---"}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start">
                        <div className="text-primary mr-3 mt-1">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">
                            Location
                          </span>
                          <p className="text-base font-medium">
                            {eventData?.location || "Virtual"}
                          </p>
                        </div>
                      </div>

                      {/* Current Registration */}
                      <div className="flex items-start">
                        <div className="text-primary mr-3 mt-1">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">
                            Current Registration
                          </span>
                          <div className="flex items-center">
                            <p className="text-base font-medium mr-2">
                              {eventData?.currentRegistration?.toLocaleString() ||
                                "0"}
                            </p>
                            {(eventData?.currentRegistration > 0 ||
                              !eventData) && (
                              <span className="text-xs text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                                <ChevronUp className="h-3 w-3 mr-0.5" />
                                <span>+23 this week</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expected Registration */}
                      <div className="flex items-start">
                        <div className="text-primary mr-3 mt-1">
                          <Target className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">
                            Expected Registration
                          </span>
                          <p className="text-base font-medium">
                            {eventData?.expectedRegistration?.toLocaleString() ||
                              "---"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaign General Info Section */}
      <div className="bg-white rounded-lg shadow-sm mb-4">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="campaign-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Campaign Name
              </label>
              <input
                type="text"
                id="campaign-name"
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="start-by"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start By Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="start-by"
                  className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={startByDate}
                  onChange={(e) => setStartByDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="delivery-by"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Delivery By Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="delivery-by"
                  className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={deliveryByDate}
                  onChange={(e) => setDeliveryByDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow w-full">
        <div className="w-full">
          <div className="flex flex-col">
            {/* Configuration */}
            <div className="w-full">
              {/* Recipients Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "recipients"
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                  onClick={() => toggleSection("recipients")}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Recipients
                    </h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "recipients" && (
                      <div className="flex items-center mr-3 text-sm">
                        {motion === "booth-pickup" ? (
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                            {recipientCount} Expected Recipients
                          </div>
                        ) : isQuickSendExpressMode ? (
                          selectedContacts.length > 0 ? (
                            <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                              {selectedContacts.length} contacts selected
                            </div>
                          ) : (
                            <span className="italic text-gray-500">
                              No contacts selected
                            </span>
                          )
                        ) : isQuickSendClaimLinkMode ? (
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                            {numberOfGifts} gift{numberOfGifts !== 1 ? "s" : ""}{" "}
                            - Universal Link
                          </div>
                        ) : selectedListId && savedLists.length > 0 ? (
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                            {savedLists.find(
                              (list) => list.id === selectedListId
                            )?.name || "Selected list"}{" "}
                            ({filteredRecipients.length})
                          </div>
                        ) : (
                          <span className="italic text-gray-500">
                            No contact list selected
                          </span>
                        )}
                      </div>
                    )}
                    {expandedSection === "recipients" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "recipients" && (
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">
                      {isQuickSendExpressMode
                        ? "Search and select contacts for your quick send campaign"
                        : isQuickSendClaimLinkMode
                        ? "Configure your universal gift link campaign settings below"
                        : motion === "booth-pickup"
                        ? "Set the expected number of recipients for your booth giveaway campaign"
                        : "Select a contact list to use for this campaign"}
                    </p>

                    {motion === "booth-pickup" ? (
                      // Booth Pickup Recipient Counter
                      <div className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                          <label className="text-sm font-medium text-gray-700">
                            Expected Number of Recipients:
                          </label>
                          <div className="flex items-center gap-4 w-fit bg-[#F9F5FF] border border-[#D2CEFE] rounded-full px-4 py-2 shadow-sm">
                            <button
                              type="button"
                              aria-label="Decrease recipients"
                              onClick={() =>
                                setRecipientCount((prev) =>
                                  Math.max(prev - 1, 1)
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M5 12h14" />
                              </svg>
                            </button>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={1000}
                                value={recipientCount}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value, 10);
                                  if (isNaN(val)) val = 1;
                                  setRecipientCount(
                                    Math.max(1, Math.min(val, 1000))
                                  );
                                }}
                                className="w-20 text-center text-lg font-semibold bg-transparent border-none focus:ring-0 focus:outline-none text-[#7F56D9] placeholder:text-[#D2CEFE]"
                                style={{ appearance: "textfield" }}
                                aria-label="Expected recipient count"
                              />
                            </div>
                            <button
                              type="button"
                              aria-label="Increase recipients"
                              onClick={() =>
                                setRecipientCount((prev) =>
                                  Math.min(prev + 1, 1000)
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : isQuickSendExpressMode ? (
                      /**
                       * QUICK SEND EXPRESS MODE INTERFACE
                       * ================================
                       * Individual contact selection with search dropdown and recipients table.
                       * Features:
                       * - Real-time contact search with dropdown results
                       * - Quick Add Contact modal with full contact details
                       * - Recipients table with delivery address selection
                       * - Contact removal functionality
                       * - LinkedIn profile integration
                       */
                      <div className="space-y-6">
                        {/* Search Contact Listbox */}
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1 contact-dropdown-container">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search and select contacts..."
                                value={contactSearchQuery}
                                onChange={(e) => {
                                  console.log("⌨️ User input change detected", {
                                    previousValue: `"${contactSearchQuery}"`,
                                    newValue: `"${e.target.value}"`,
                                    previousLength: contactSearchQuery.length,
                                    newLength: e.target.value.length,
                                    lengthChange: e.target.value.length - contactSearchQuery.length,
                                    crossedThreshold: {
                                      from: contactSearchQuery.length < 3 ? "under 3" : "3+",
                                      to: e.target.value.length < 3 ? "under 3" : "3+",
                                      willTriggerAPI: e.target.value.length >= 3 && contactSearchQuery.length < 3
                                    }
                                  });
                                  setContactSearchQuery(e.target.value);
                                  setShowContactDropdown(true);
                                }}
                                onFocus={() => setShowContactDropdown(true)}
                                className="pl-9 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />

                              {/* Contact Dropdown */}
                              {showContactDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {isLoadingAllContacts ? (
                                    <div className="flex items-center justify-center p-4">
                                      <svg
                                        className="animate-spin h-4 w-4 text-primary mr-2"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
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
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      <span className="text-sm text-gray-500">
                                        Loading contacts...
                                      </span>
                                    </div>
                                  ) : recipientsError ? (
                                    <div className="p-4 text-center">
                                      <p className="text-sm text-red-600 mb-2">
                                        {recipientsError}
                                      </p>
                                      <button
                                        onClick={async () => {
                                          // Retry the search with current query
                                          if (contactSearchQuery.length >= 3) {
                                            try {
                                              const results = await searchContactsByName(contactSearchQuery);
                                              setSearchResults(results || []);
                                            } catch (error) {
                                              console.error("❌ Retry search failed", error);
                                            }
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-primary text-white rounded text-xs hover:bg-primary-dark"
                                      >
                                        Try Again
                                      </button>
                                    </div>
                                  ) : getFilteredContacts().length > 0 ? (
                                    getFilteredContacts()
                                      .filter(
                                        (contact) =>
                                          !selectedContacts.some(
                                            (c) => c.id === contact.id
                                          )
                                      )
                                      .slice(0, 10) // Limit to 10 results for better UX
                                      .map((contact) => (
                                        <div
                                          key={contact.id}
                                          onClick={() => {
                                            toggleContactSelection(contact);
                                            setContactSearchQuery("");
                                            setShowContactDropdown(false);
                                          }}
                                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="font-medium text-gray-900">
                                                {contact.name}
                                              </div>
                                              <div className="text-sm text-gray-500">
                                                {contact.email}
                                              </div>
                                              {(contact.company ||
                                                contact.role) && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                  {[
                                                    contact.role,
                                                    contact.company,
                                                  ]
                                                    .filter(Boolean)
                                                    .join(" at ")}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      {contactSearchQuery
                                        ? "No contacts found matching your search"
                                        : "No contacts available"}
                                    </div>
                                  )}

                                  {/* Show fewer results message if filtered results are > 10 */}
                                  {getFilteredContacts().filter(
                                    (contact) =>
                                      !selectedContacts.some(
                                        (c) => c.id === contact.id
                                      )
                                  ).length > 10 && (
                                    <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                                      Showing first 10 results. Keep typing to
                                      refine search.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={openAddContactForm}
                            className="flex items-center px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Quick Add Contact
                          </button>
                        </div>

                        {/* Campaign Recipients Section */}
                        <div className="mt-6">
                          {/* Recipients Table */}
                          {selectedContacts.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h5 className="font-medium text-gray-900">
                                  Selected Recipients ({selectedContacts.length}
                                  )
                                </h5>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        Name
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        Email
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        Company
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        Role
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        LinkedIn
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        <div className="flex items-center gap-1">
                                          Delivery Address
                                          {!hasDeliveryLocationsAPI && (
                                            <div className="relative group">
                                              <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 w-56 -left-28 top-5">
                                                Choose where to ship gifts:
                                                directly to recipients or to
                                                your organization's
                                                branches/custom addresses when
                                                configured.
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedContacts.map((contact) => (
                                      <tr
                                        key={contact.id}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="font-medium text-gray-900">
                                            {contact.name}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="text-gray-700">
                                            {contact.email}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="text-gray-600">
                                            {contact.company || "—"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="text-gray-600">
                                            {contact.role || "—"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {contact.linkedin ? (
                                            <a
                                              href={`https://linkedin.com/in/${contact.linkedin}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                              title="View LinkedIn Profile"
                                            >
                                              <LinkedInIcon className="w-4 h-4" />
                                              <span>{contact.linkedin}</span>
                                            </a>
                                          ) : (
                                            <span className="text-gray-400">
                                              —
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="relative">
                                            <select
                                              value={getRecipientDeliveryAddress(
                                                contact.id
                                              )}
                                              onChange={(e) =>
                                                handleDeliveryAddressChange(
                                                  contact.id,
                                                  e.target.value
                                                )
                                              }
                                              className="w-full text-xs border border-gray-300 rounded py-1 px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                            >
                                              {deliveryAddressOptions
                                                .filter(
                                                  (option) =>
                                                    hasDeliveryLocationsAPI ||
                                                    option.available
                                                )
                                                .map((option) => (
                                                  <option
                                                    key={option.id}
                                                    value={option.id}
                                                  >
                                                    {option.label}
                                                    {!option.available &&
                                                    !hasDeliveryLocationsAPI
                                                      ? " (Coming Soon)"
                                                      : ""}
                                                  </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none">
                                              <ChevronDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                          <button
                                            onClick={() =>
                                              toggleContactSelection(contact)
                                            }
                                            className="text-red-500 hover:text-red-700 p-1 rounded"
                                            title="Remove contact"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                              <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-500 mb-2">
                                No one to surprise yet!
                              </p>
                              <p className="text-sm text-gray-400">
                                Search and select contacts above to add them to
                                your campaign
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isQuickSendClaimLinkMode ? (
                      /**
                       * QUICK SEND CLAIM LINK MODE INTERFACE
                       * ===================================
                       * Universal gift link generation with allocation controls.
                       * Features:
                       * - Info banner explaining universal link behavior
                       * - Gift quantity allocation controls (1-1000)
                       * - Business email restriction toggle
                       * - No individual contact management required
                       * - Automatic budget calculation based on gift count
                       */
                      <div className="space-y-6">
                        {/* Info Banner */}
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Info className="w-5 h-5 text-primary mt-0.5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-primary mb-2">
                                Universal Gift Link Mode
                              </h4>
                              <div className="text-sm text-primary/80 space-y-2">
                                <p>
                                  You're creating a single claim link for anyone
                                  to redeem the gift - no contacts needed.
                                </p>
                                <div>
                                  <p className="mb-1">
                                    Anyone with this link can claim until:
                                  </p>
                                  <ul className="ml-4 space-y-1">
                                    <li>• The gift count is exhausted</li>
                                    <li>
                                      • Or, the gift expires (check Gift
                                      Expiration Date on Gifts section)
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gift Allocation Control */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-4">
                            Gift Allocation Control
                          </h5>

                          <div className="space-y-4">
                            {/* Number of Gifts */}
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium text-gray-700 min-w-0">
                                Number of Gifts:
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setNumberOfGifts(
                                      Math.max(1, numberOfGifts - 1)
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={numberOfGifts <= 1}
                                >
                                  -
                                </button>
                                <div className="w-16 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={numberOfGifts}
                                    onChange={(e) =>
                                      setNumberOfGifts(
                                        Math.max(
                                          1,
                                          parseInt(e.target.value) || 1
                                        )
                                      )
                                    }
                                    className="w-full text-center border border-gray-300 rounded py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </div>
                                <button
                                  onClick={() =>
                                    setNumberOfGifts(
                                      Math.min(1000, numberOfGifts + 1)
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={numberOfGifts >= 1000}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Business Emails Only */}
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-gray-700">
                                Allow only business emails
                              </label>
                              <Switch
                                checked={businessEmailsOnly}
                                onCheckedChange={setBusinessEmailsOnly}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /**
                       * REGULAR MODE INTERFACE
                       * =====================
                       * Traditional contact list selection for all other goal-motion combinations.
                       * Features:
                       * - Contact list dropdown selection
                       * - Contact preview table with search and pagination
                       * - Delivery address selection per contact
                       * - Support for large contact lists
                       * - Integration with contact list management system
                       */
                      <div className="mb-6">
                        {isLoadingContactLists ? (
                          <div className="flex items-center justify-center p-4 border border-gray-200 rounded-md">
                            <svg
                              className="animate-spin h-5 w-5 text-primary mr-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span className="text-gray-500">
                              Loading contact lists...
                            </span>
                          </div>
                        ) : contactListError ? (
                          <div className="p-4 bg-red-50 text-red-700 rounded-md">
                            <div className="flex items-center mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">
                                Error loading contact lists
                              </span>
                            </div>
                            <p className="mb-3">{contactListError}</p>
                            <button
                              onClick={fetchContactLists}
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : savedLists.length > 0 ? (
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <select
                                value={selectedListId || ""}
                                onChange={(e) =>
                                  handleListSelect(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                aria-label="Select a contact list"
                              >
                                <option value="" disabled>
                                  Select a contact list...
                                </option>
                                {savedLists.map((list) => (
                                  <option key={list.id} value={list.id}>
                                    {list.name} ({list.count} contacts)
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                            <Link
                              href="/contact-lists"
                              className="flex items-center text-sm text-primary hover:text-primary/80 font-medium whitespace-nowrap"
                            >
                              <Database className="w-4 h-4 mr-1" />
                              Manage Lists
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                            <ListFilter className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">
                              No contact lists found
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                              You need to create a contact list before launching
                              a campaign
                            </p>
                            <a
                              href="/contact-lists"
                              className="inline-flex items-center py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              <Database className="w-4 h-4 mr-2" />
                              Manage Contact Lists
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact Preview - Only for regular mode (non-Quick Send modes) */}
                    {!isQuickSendExpressMode &&
                      !isQuickSendClaimLinkMode &&
                      selectedListId &&
                      motion !== "booth-pickup" && (
                        <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h5 className="font-medium text-gray-900 mb-2">
                              Contacts in this List
                            </h5>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search contacts in this list..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>

                          {isLoadingRecipients ? (
                            <div className="flex items-center justify-center p-8">
                              <svg
                                className="animate-spin h-5 w-5 text-primary mr-3"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-gray-500">
                                Loading contacts...
                              </span>
                            </div>
                          ) : recipientsError ? (
                            <div className="p-4 text-center">
                              <p className="text-red-600 mb-2">
                                {recipientsError}
                              </p>
                              <button
                                onClick={() => handleListSelect(selectedListId)}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : sampleRecipients.length > 0 &&
                            currentRecipients.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-gray-500">
                                No contacts found matching your search.
                              </p>
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery("")}
                                  className="mt-2 text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          ) : sampleRecipients.length > 0 ? (
                            <>
                              {/* Recipients table */}
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      Name
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      Company
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      Role
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      Email
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      LinkedIn
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                                    >
                                      <div className="flex items-center gap-1">
                                        Delivery Address
                                        {!hasDeliveryLocationsAPI && (
                                          <div className="relative group">
                                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 w-56 -left-28 top-5">
                                              Choose where to ship gifts:
                                              directly to recipients or to your
                                              organization's branches/custom
                                              addresses when configured.
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {currentRecipients.map((recipient) => (
                                    <tr
                                      key={recipient.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-medium text-gray-900">
                                          {recipient.name}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-gray-700">
                                          {recipient.company}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-gray-600">
                                          {recipient.role}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-gray-600">
                                          {recipient.email}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        {recipient.linkedin ? (
                                          <div className="flex items-center">
                                            <svg
                                              className="h-3.5 w-3.5 mr-1"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                                fill="#0077B5"
                                              />
                                            </svg>
                                            <span className="text-xs text-gray-500">
                                              {recipient.linkedin}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-300 text-xs">
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                        <div className="relative">
                                          <select
                                            value={getRecipientDeliveryAddress(
                                              recipient.id
                                            )}
                                            onChange={(e) =>
                                              handleDeliveryAddressChange(
                                                recipient.id,
                                                e.target.value
                                              )
                                            }
                                            className="w-full text-xs border border-gray-300 rounded py-1 px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                          >
                                            {deliveryAddressOptions
                                              .filter(
                                                (option) =>
                                                  hasDeliveryLocationsAPI ||
                                                  option.available
                                              )
                                              .map((option) => (
                                                <option
                                                  key={option.id}
                                                  value={option.id}
                                                >
                                                  {option.label}
                                                  {!option.available &&
                                                  !hasDeliveryLocationsAPI
                                                    ? " (Coming Soon)"
                                                    : ""}
                                                </option>
                                              ))}
                                          </select>
                                          <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none">
                                            <ChevronDown className="h-3 w-3 text-gray-400" />
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Pagination */}
                              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  Showing {indexOfFirstRecipient + 1}-
                                  {Math.min(
                                    indexOfLastRecipient,
                                    filteredRecipients.length
                                  )}{" "}
                                  of {filteredRecipients.length} contacts
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded ${
                                      currentPage === 1
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>
                                  {Array.from({
                                    length: Math.min(totalPages, 3),
                                  }).map((_, i) => {
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
                                        key={pageNum}
                                        onClick={() => paginate(pageNum)}
                                        className={`w-6 h-6 text-xs flex items-center justify-center rounded ${
                                          currentPage === pageNum
                                            ? "bg-primary text-white"
                                            : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                  <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1 rounded ${
                                      currentPage === totalPages
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              No contacts found in this list
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Gift Selection Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "gift" ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("gift")}
                >
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">Gift</h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "gift" && (
                      <div className="flex items-center mr-3 text-sm">
                        {selectedGiftMode === "one-gift" ? (
                          <div className="flex items-center">
                            {/* Gift thumbnail */}
                            <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 mr-2 bg-gray-50 flex-shrink-0">
                              {selectedBundle && bundles.length > 0 ? (
                                <img
                                  src={
                                    bundles
                                      .find(
                                        (b) => b.bundleId === selectedBundle
                                      )
                                      ?.gifts.find(
                                        (g) => g.giftId === selectedGift
                                      )?.imageUrl ||
                                    "/images/placeholder-gift.svg"
                                  }
                                  alt="Selected gift"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/images/placeholder-gift.svg";
                                  }}
                                />
                              ) : (
                                <img
                                  src={
                                    sampleGifts.find(
                                      (g) => g.id === selectedGift
                                    )?.image || "/images/placeholder-gift.svg"
                                  }
                                  alt="Selected gift"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/images/placeholder-gift.svg";
                                  }}
                                />
                              )}
                            </div>
                            <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                              One Gift for All
                            </div>
                          </div>
                        ) : selectedGiftMode === "recipient-choice" ? (
                          <div className="flex items-center">
                            {/* Gift thumbnails - show up to 3 with +X more indicator */}
                            <div className="flex -space-x-3 mr-2">
                              {selectedRecipientGifts
                                .slice(0, 5)
                                .map((giftId, index) => {
                                  const gift =
                                    selectedBundle && bundles.length > 0
                                      ? bundles
                                          .find(
                                            (b) => b.bundleId === selectedBundle
                                          )
                                          ?.gifts.find(
                                            (g) => g.giftId === giftId
                                          )
                                      : sampleGifts.find(
                                          (g) => g.id === giftId
                                        );

                                  // Get the image URL based on the gift object type
                                  const imageUrl =
                                    selectedBundle && bundles.length > 0
                                      ? (gift as Gift)?.imageUrl ||
                                        "/images/placeholder-gift.svg"
                                      : (gift as SampleGift)?.image ||
                                        "/images/placeholder-gift.svg";

                                  return (
                                    <div
                                      key={index}
                                      className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-gray-50 flex-shrink-0"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Gift ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "/images/placeholder-gift.svg";
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              {selectedRecipientGifts.length > 5 && (
                                <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700">
                                  +{selectedRecipientGifts.length - 5}
                                </div>
                              )}
                            </div>
                            <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                              Recipient Choice
                            </div>
                          </div>
                        ) : selectedGiftMode === "smart-match" ? (
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                            Smart Match
                          </div>
                        ) : (
                          <span className="italic text-gray-500">
                            No gift mode selected
                          </span>
                        )}
                      </div>
                    )}
                    {expandedSection === "gift" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "gift" && (
                  <div className="p-4">
                    <h4 className="text-base font-medium mb-3">
                      Select Gift Mode
                    </h4>
                    <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                      {giftModes.map((mode) => (
                        <div
                          key={mode.id}
                          onClick={() => {
                            if (
                              mode.id === "smart-match" &&
                              motion === "booth-pickup"
                            ) {
                              return; // Do nothing if trying to select Smart Match in booth pickup mode
                            }
                            setSelectedGiftMode(mode.id);
                          }}
                          className={`flex-1 min-w-[240px] border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedGiftMode === mode.id
                              ? "border-primary ring-2 ring-primary/20"
                              : mode.id === "smart-match" &&
                                motion === "booth-pickup"
                              ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              {selectedGiftMode === mode.id ? (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full border-2 ${
                                    mode.id === "smart-match" &&
                                    motion === "booth-pickup"
                                      ? "border-gray-200"
                                      : "border-gray-300"
                                  }`}
                                ></div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="flex items-center mb-1">
                                <mode.icon
                                  className={`w-4 h-4 mr-2 ${
                                    mode.id === "smart-match" &&
                                    motion === "booth-pickup"
                                      ? "text-gray-400"
                                      : "text-primary"
                                  }`}
                                />
                                <h5
                                  className={`font-medium ${
                                    mode.id === "smart-match" &&
                                    motion === "booth-pickup"
                                      ? "text-gray-400"
                                      : ""
                                  }`}
                                >
                                  {mode.title}
                                </h5>
                              </div>
                              <p
                                className={`text-sm ${
                                  mode.id === "smart-match" &&
                                  motion === "booth-pickup"
                                    ? "text-gray-400"
                                    : "text-gray-600"
                                } mb-1`}
                              >
                                {mode.description}
                              </p>
                              <p
                                className={`text-xs ${
                                  mode.id === "smart-match" &&
                                  motion === "booth-pickup"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {mode.id === "smart-match" &&
                                motion === "booth-pickup"
                                  ? "Not available for booth pickup campaigns"
                                  : mode.subtext}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Budget Configuration Section */}
                    {selectedGiftMode === "smart-match" && (
                      <div className="mt-6">
                        <div className="flex flex-col md:flex-row gap-8 mb-6">
                          <div className="flex-1 min-w-[300px]">
                            <h4 className="text-base font-medium mb-4 flex items-center gap-2">
                              Gift Budget Configuration
                            </h4>
                            <p className="text-sm text-gray-500 mb-4">
                              Set your per-recipient gift budget limit
                            </p>
                            <div className="flex items-center gap-4 w-fit bg-[#F9F5FF] border border-[#D2CEFE] rounded-full px-4 py-2 shadow-sm">
                              <button
                                type="button"
                                aria-label="Decrease budget"
                                onClick={() =>
                                  setBudget((prev) => ({
                                    ...prev,
                                    max: Math.max(prev.max - 1, 1),
                                  }))
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 12h14" />
                                </svg>
                              </button>
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-semibold text-[#7F56D9]">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={500}
                                  value={budget.max}
                                  onChange={(e) => {
                                    let val = parseInt(e.target.value, 10);
                                    if (isNaN(val)) val = 1;
                                    setBudget((prev) => ({
                                      ...prev,
                                      max: Math.max(1, Math.min(val, 500)),
                                    }));
                                  }}
                                  className="w-16 text-center text-lg font-semibold bg-transparent border-none focus:ring-0 focus:outline-none text-[#7F56D9] placeholder:text-[#D2CEFE]"
                                  style={{ appearance: "textfield" }}
                                  aria-label="Gift budget amount"
                                />
                              </div>
                              <button
                                type="button"
                                aria-label="Increase budget"
                                onClick={() =>
                                  setBudget((prev) => ({
                                    ...prev,
                                    max: Math.min(prev.max + 1, 500),
                                  }))
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </button>
                            </div>
                            <div className="text-xs text-[#7F56D9] mt-2 ml-2 flex items-center gap-1">
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                stroke="#7F56D9"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                              </svg>
                              <span>
                                Budget can be edited anytime before sending
                                gifts. Gift recommendations will automatically
                                update to match your budget range.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Gift Bundle Selection for Smart Match */}
                        {bundles.length > 1 && (
                          <div className="mt-6">
                            <h4 className="text-base font-medium mb-3">
                              Gift Bundle
                            </h4>
                            <p className="text-sm text-gray-500 mb-4">
                              Select the gift catalog to use for AI
                              recommendations
                            </p>
                            <div className="relative">
                              <select
                                id="bundle-select-smart-match"
                                value={selectedBundle || ""}
                                onChange={(e) =>
                                  handleBundleSelect(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                aria-label="Select a gift bundle"
                              >
                                {bundles.map((bundle) => (
                                  <option
                                    key={bundle.bundleId}
                                    value={bundle.bundleId}
                                  >
                                    {bundle.bundleName}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>

                            {selectedBundle && (
                              <p className="mt-2 text-sm text-gray-500">
                                {
                                  bundles.find(
                                    (b) => b.bundleId === selectedBundle
                                  )?.description
                                }
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedGiftMode === "one-gift" && (
                      <div className="mt-6">
                        <h4 className="text-base font-medium mb-3">
                          Select a Gift for All Recipients
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Choose one gift that will be sent to all recipients in
                          this campaign
                        </p>

                        {isLoadingBundles ? (
                          <div className="flex items-center justify-center p-8 border border-gray-200 rounded-md">
                            <svg
                              className="animate-spin h-5 w-5 text-primary mr-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span className="text-gray-500">
                              Loading gift options...
                            </span>
                          </div>
                        ) : bundlesError ? (
                          <div className="p-4 bg-red-50 text-red-700 rounded-md">
                            <div className="flex items-center mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">
                                Error loading gift options
                              </span>
                            </div>
                            <p className="mb-3">{bundlesError}</p>
                            <button
                              onClick={fetchBundles}
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : bundles.length > 0 ? (
                          <>
                            {/* Bundle selection dropdown - hidden for one-gift mode */}
                            {false && bundles.length > 1 && (
                              <div className="mb-4">
                                <label
                                  htmlFor="bundle-select-one-gift"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Gift Bundle
                                </label>
                                <div className="relative">
                                  <select
                                    id="bundle-select-one-gift"
                                    value={selectedBundle || ""}
                                    onChange={(e) =>
                                      handleBundleSelect(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                    aria-label="Select a gift bundle"
                                  >
                                    {bundles.map((bundle) => (
                                      <option
                                        key={bundle.bundleId}
                                        value={bundle.bundleId}
                                      >
                                        {bundle.bundleName}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>

                                {/* Selected bundle description */}
                                {selectedBundle && (
                                  <p className="mt-2 text-sm text-gray-500">
                                    {
                                      bundles.find(
                                        (b) => b.bundleId === selectedBundle
                                      )?.description
                                    }
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                              {/* Gift options from API - use the queue of displayed gifts */}
                              {selectedBundle &&
                              displayedOneGiftOptions.length > 0
                                ? displayedOneGiftOptions
                                    .map((giftId) =>
                                      bundles
                                        .find(
                                          (b) => b.bundleId === selectedBundle
                                        )
                                        ?.gifts.find((g) => g.giftId === giftId)
                                    )
                                    .filter((gift) => gift !== undefined)
                                    .map((gift: any) => (
                                      <div
                                        key={gift.giftId}
                                        onClick={() =>
                                          handleGiftSelect(gift.giftId)
                                        }
                                        className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                          selectedGift === gift.giftId
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-gray-200 hover:border-primary"
                                        }`}
                                      >
                                        <div className="h-40 bg-gray-100 relative">
                                          <img
                                            src={gift.imageUrl}
                                            alt={gift.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                                /\s/g,
                                                "+"
                                              )}`;
                                            }}
                                          />
                                        </div>
                                        <div className="p-2 pt-1.5 pb-1">
                                          <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-sm truncate max-w-[70%]">
                                              {gift.name}
                                            </h5>
                                            <span className="text-xs text-gray-600 whitespace-nowrap">
                                              ${gift.price}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 h-6 overflow-hidden">
                                            {gift.shortDescription ||
                                              "Premium quality gift"}
                                          </p>
                                          <div className="flex justify-end items-center">
                                            <div
                                              className={`w-4 h-4 rounded-full ${
                                                selectedGift === gift.giftId
                                                  ? "bg-primary flex items-center justify-center"
                                                  : "border-2 border-gray-300"
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation(); // Prevent the parent onClick from firing
                                                handleGiftSelect(gift.giftId);
                                              }}
                                            >
                                              {selectedGift === gift.giftId && (
                                                <Check className="w-2.5 h-2.5 text-white" />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                : null}
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                            {/* Recommended gifts - use the queue of displayed gifts */}
                            {displayedOneGiftOptions.length > 0
                              ? displayedOneGiftOptions
                                  .map((giftId) =>
                                    sampleGifts.find((g) => g.id === giftId)
                                  )
                                  .filter((gift) => gift !== undefined)
                                  .sort((a, b) => b.price - a.price) // Sort sample gifts by price descending
                                  .map((gift) => (
                                    <div
                                      key={gift.id}
                                      onClick={() => handleGiftSelect(gift.id)}
                                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                        selectedGift === gift.id
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-gray-200 hover:border-primary"
                                      }`}
                                    >
                                      <div className="h-40 bg-gray-100 relative">
                                        <img
                                          src={gift.image}
                                          alt={gift.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                              /\s/g,
                                              "+"
                                            )}`;
                                          }}
                                        />
                                      </div>
                                      <div className="p-2 pt-1.5 pb-1">
                                        <div className="flex justify-between items-center">
                                          <h5 className="font-medium text-sm truncate max-w-[70%]">
                                            {gift.name}
                                          </h5>
                                          <span className="text-xs text-gray-600 whitespace-nowrap">
                                            ${gift.price}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 h-6 overflow-hidden">
                                          {gift.catalog === "premium"
                                            ? "Premium quality gift"
                                            : gift.catalog === "tech"
                                            ? "Latest technology"
                                            : gift.catalog === "eco"
                                            ? "Eco-friendly product"
                                            : "Gourmet selection"}
                                        </p>
                                        <div className="flex justify-end items-center">
                                          <div
                                            className={`w-4 h-4 rounded-full ${
                                              selectedGift === gift.id
                                                ? "bg-primary flex items-center justify-center"
                                                : "border-2 border-gray-300"
                                            }`}
                                            onClick={(e) => {
                                              e.stopPropagation(); // Prevent the parent onClick from firing
                                              handleGiftSelect(gift.id);
                                            }}
                                          >
                                            {selectedGift === gift.id && (
                                              <Check className="w-2.5 h-2.5 text-white" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                              : recommendedGifts.slice(0, 6).map((gift) => (
                                  <div
                                    key={gift.id}
                                    onClick={() => handleGiftSelect(gift.id)}
                                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                      selectedGift === gift.id
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-primary"
                                    }`}
                                  >
                                    <div className="h-40 bg-gray-100 relative">
                                      <img
                                        src={gift.image}
                                        alt={gift.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                            /\s/g,
                                            "+"
                                          )}`;
                                        }}
                                      />
                                    </div>
                                    <div className="p-2 pt-1.5 pb-1">
                                      <div className="flex justify-between items-center">
                                        <h5 className="font-medium text-sm truncate max-w-[70%]">
                                          {gift.name}
                                        </h5>
                                        <span className="text-xs text-gray-600 whitespace-nowrap">
                                          ${gift.price}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 h-6 overflow-hidden">
                                        {gift.catalog === "premium"
                                          ? "Premium quality gift"
                                          : gift.catalog === "tech"
                                          ? "Latest technology"
                                          : gift.catalog === "eco"
                                          ? "Eco-friendly product"
                                          : "Gourmet selection"}
                                      </p>
                                      <div className="flex justify-end items-center">
                                        <div
                                          className={`w-4 h-4 rounded-full ${
                                            selectedGift === gift.id
                                              ? "bg-primary flex items-center justify-center"
                                              : "border-2 border-gray-300"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent the parent onClick from firing
                                            handleGiftSelect(gift.id);
                                          }}
                                        >
                                          {selectedGift === gift.id && (
                                            <Check className="w-2.5 h-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                          </div>
                        )}

                        {/* Browse more gifts button */}
                        <button
                          onClick={openGiftModal}
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <Gift className="w-4 h-4" />
                          Browse More Gifts
                        </button>

                        {/* Gift Expiration Date */}
                        <div className="mt-6">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-medium">
                              Gift Expiration Date
                            </h4>
                            <div className="relative group">
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 w-64 -left-32 top-6">
                                This is the date until which the gift invite
                                remains valid. After this date, the gift claim
                                link will expire and become invalid. Default is
                                90 days from today.
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            Set the date when gift invites will expire
                          </p>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              id="gift-expiration"
                              className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              value={giftExpirationDate}
                              onChange={(e) =>
                                setGiftExpirationDate(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedGiftMode === "recipient-choice" && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-base font-medium">
                            Selected Gift Options
                          </h4>
                          <div className="text-sm text-gray-500">
                            Recipients will choose 1 of{" "}
                            {selectedRecipientGifts.length}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          These gift options will be presented to your
                          recipients to choose from
                        </p>

                        {isLoadingBundles ? (
                          <div className="flex items-center justify-center p-8 border border-gray-200 rounded-md">
                            <svg
                              className="animate-spin h-5 w-5 text-primary mr-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span className="text-gray-500">
                              Loading gift bundles...
                            </span>
                          </div>
                        ) : bundlesError ? (
                          <div className="p-4 bg-red-50 text-red-700 rounded-md">
                            <div className="flex items-center mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">
                                Error loading gift bundles
                              </span>
                            </div>
                            <p className="mb-3">{bundlesError}</p>
                            <button
                              onClick={fetchBundles}
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : bundles.length > 0 ? (
                          <>
                            {/* Bundle selection dropdown - hidden for recipient-choice mode */}
                            {false && bundles.length > 1 && (
                              <div className="mb-4">
                                <label
                                  htmlFor="bundle-select"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Gift Bundle
                                </label>
                                <div className="relative">
                                  <select
                                    id="bundle-select"
                                    value={selectedBundle || ""}
                                    onChange={(e) =>
                                      handleBundleSelect(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                                    aria-label="Select a gift bundle"
                                  >
                                    {bundles.map((bundle) => (
                                      <option
                                        key={bundle.bundleId}
                                        value={bundle.bundleId}
                                      >
                                        {bundle.bundleName}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>

                                {selectedBundle && (
                                  <p className="mt-2 text-sm text-gray-500">
                                    {
                                      bundles.find(
                                        (b) => b.bundleId === selectedBundle
                                      )?.description
                                    }
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                              {/* Pre-selected gift options */}
                              {selectedRecipientGiftsData.map((gift) => (
                                <div
                                  key={gift.giftId}
                                  className="border rounded-lg overflow-hidden cursor-pointer transition-all border-primary ring-1 ring-primary/20"
                                  onClick={() =>
                                    toggleRecipientGift(gift.giftId)
                                  }
                                >
                                  <div className="h-40 bg-gray-100 relative">
                                    <img
                                      src={gift.imageUrl}
                                      alt={gift.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                          /\s/g,
                                          "+"
                                        )}`;
                                      }}
                                    />
                                  </div>
                                  <div className="p-2 pt-1.5 pb-1">
                                    <div className="flex justify-between items-center">
                                      <h5 className="font-medium text-sm truncate max-w-[70%]">
                                        {gift.name}
                                      </h5>
                                      <span className="text-xs text-gray-600 whitespace-nowrap">
                                        ${gift.price}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 h-8 line-clamp-2 overflow-hidden">
                                      {gift.shortDescription ||
                                        (gift.category === "premium"
                                          ? "Premium quality gift"
                                          : gift.category === "tech"
                                          ? "Latest technology"
                                          : gift.category === "eco"
                                          ? "Eco-friendly product"
                                          : "Gourmet selection")}
                                    </p>
                                    <div className="flex justify-end items-center">
                                      <div
                                        className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent the parent onClick from firing
                                          toggleRecipientGift(gift.giftId);
                                        }}
                                      >
                                        <Check className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500 mb-3">
                              No gift bundles available
                            </p>
                            <button
                              onClick={fetchBundles}
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {/* Browse more gifts button */}
                        <button
                          onClick={openRecipientGiftModal}
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <Gift className="w-4 h-4" />
                          Browse More Gifts
                        </button>

                        {/* Gift Expiration Date */}
                        <div className="mt-6">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-medium">
                              Gift Expiration Date
                            </h4>
                            <div className="relative group">
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 w-64 -left-32 top-6">
                                This is the date until which the gift invite
                                remains valid. After this date, the gift claim
                                link will expire and become invalid. Default is
                                90 days from today.
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            Set the date when gift invites will expire
                          </p>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              id="gift-expiration-recipient"
                              className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              value={giftExpirationDate}
                              onChange={(e) =>
                                setGiftExpirationDate(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Gift Browser Modal for Recipient Choice - Slide from right */}
                        {showRecipientGiftModal && (
                          <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-end p-0"
                            style={{
                              animation: isClosingRecipientGiftModal
                                ? "fadeOut 0.3s ease-out"
                                : "fadeIn 0.3s ease-out",
                            }}
                          >
                            <div
                              className="bg-white shadow-xl w-full sm:w-[750px] md:w-[950px] lg:w-[1200px] xl:w-[1400px] h-full flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"
                              style={{
                                animation: isClosingRecipientGiftModal
                                  ? "slideOutToRight 0.3s ease-out"
                                  : "slideInFromRight 0.3s ease-out",
                              }}
                            >
                              {/* Modal Header */}
                              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <PackageOpen className="w-5 h-5 text-primary" />
                                  {selectedBundle && bundles.length > 0
                                    ? `Manage Gifts - ${
                                        bundles.find(
                                          (b) => b.bundleId === selectedBundle
                                        )?.bundleName
                                      }`
                                    : "Manage Gift Options"}
                                </h3>
                                <button
                                  onClick={closeRecipientGiftModal}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              {/* Instructions */}
                              <div className="border-b border-gray-200 p-4 bg-blue-50">
                                <div className="flex items-start">
                                  <div className="text-blue-500 mr-3">
                                    <Info className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-blue-700">
                                      Select 3-11 gift options for your
                                      recipients to choose from. We recommend
                                      including a variety of gift types to
                                      appeal to different preferences.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Filters */}
                              <div className="border-b border-gray-200 p-4">
                                <div className="flex flex-wrap gap-3">
                                  {/* Catalog filter */}
                                  <div className="relative">
                                    <select
                                      value={giftFilterCatalog}
                                      onChange={(e) =>
                                        setGiftFilterCatalog(e.target.value)
                                      }
                                      className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                      <option value="">All Categories</option>
                                      {selectedBundle && bundles.length > 0 ? (
                                        // Get unique categories from the selected bundle
                                        Array.from(
                                          new Set(
                                            bundles
                                              .find(
                                                (b) =>
                                                  b.bundleId === selectedBundle
                                              )
                                              ?.gifts.map(
                                                (gift) => gift.category
                                              ) || []
                                          )
                                        ).map((category) => (
                                          <option
                                            key={category}
                                            value={category}
                                          >
                                            {category}
                                          </option>
                                        ))
                                      ) : (
                                        // Use sample gift catalogs if no API data
                                        <>
                                          <option value="premium">
                                            Premium Collection
                                          </option>
                                          <option value="tech">
                                            Tech Gadgets
                                          </option>
                                          <option value="eco">
                                            Eco-Friendly
                                          </option>
                                          <option value="food">
                                            Food & Beverage
                                          </option>
                                        </>
                                      )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </div>
                                  </div>

                                  {/* Price filter */}
                                  <div className="relative">
                                    <select
                                      value={giftFilterPrice}
                                      onChange={(e) =>
                                        setGiftFilterPrice(e.target.value)
                                      }
                                      className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                      <option value="">Any Price</option>
                                      <option value="under25">Under $25</option>
                                      <option value="25to50">$25 - $50</option>
                                      <option value="50to100">
                                        $50 - $100
                                      </option>
                                      <option value="over100">Over $100</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </div>
                                  </div>

                                  {/* Search input */}
                                  <div className="relative flex-grow">
                                    <input
                                      type="text"
                                      placeholder="Search gifts..."
                                      value={giftSearchQuery}
                                      onChange={(e) =>
                                        setGiftSearchQuery(e.target.value)
                                      }
                                      className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>

                                  {/* Reset filters */}
                                  <button
                                    onClick={resetGiftFilters}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Reset
                                  </button>
                                </div>
                              </div>

                              {/* Gift Grid */}
                              <div className="overflow-y-auto p-4 flex-grow">
                                {selectedBundle && bundles.length > 0 ? (
                                  // Use API data
                                  (() => {
                                    const selectedBundleGifts =
                                      bundles.find(
                                        (b) => b.bundleId === selectedBundle
                                      )?.gifts || [];
                                    const filteredGifts = selectedBundleGifts
                                      .filter((gift) => {
                                        // Filter by budget first
                                        if (
                                          gift.price < budget.min ||
                                          gift.price > budget.max
                                        )
                                          return false;

                                        // Filter by category
                                        if (
                                          giftFilterCatalog &&
                                          gift.category !== giftFilterCatalog
                                        )
                                          return false;

                                        // Filter by price
                                        if (
                                          giftFilterPrice === "under25" &&
                                          gift.price >= 25
                                        )
                                          return false;
                                        if (
                                          giftFilterPrice === "25to50" &&
                                          (gift.price < 25 || gift.price > 50)
                                        )
                                          return false;
                                        if (
                                          giftFilterPrice === "50to100" &&
                                          (gift.price < 50 || gift.price > 100)
                                        )
                                          return false;
                                        if (
                                          giftFilterPrice === "over100" &&
                                          gift.price <= 100
                                        )
                                          return false;

                                        // Filter by search query
                                        if (
                                          giftSearchQuery &&
                                          !gift.name
                                            .toLowerCase()
                                            .includes(
                                              giftSearchQuery.toLowerCase()
                                            )
                                        )
                                          return false;

                                        return true;
                                      })
                                      .sort((a, b) => b.price - a.price); // Sort by price descending

                                    return filteredGifts.length > 0 ? (
                                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {filteredGifts.map((gift) => (
                                          <div
                                            key={gift.giftId}
                                            onClick={() => {
                                              if (
                                                selectedRecipientGifts.length >=
                                                  11 &&
                                                !selectedRecipientGifts.includes(
                                                  gift.giftId
                                                )
                                              ) {
                                                return; // Prevent click when limit reached
                                              }
                                              toggleRecipientGift(gift.giftId);
                                            }}
                                            className={`border rounded-lg overflow-hidden transition-all ${
                                              selectedRecipientGifts.includes(
                                                gift.giftId
                                              )
                                                ? "border-primary ring-2 ring-primary/20 cursor-pointer"
                                                : selectedRecipientGifts.length >=
                                                    11 &&
                                                  !selectedRecipientGifts.includes(
                                                    gift.giftId
                                                  )
                                                ? "border-gray-200 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 hover:border-primary cursor-pointer"
                                            }`}
                                          >
                                            <div className="h-40 bg-gray-100">
                                              <img
                                                src={gift.imageUrl}
                                                alt={gift.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                                    /\s/g,
                                                    "+"
                                                  )}`;
                                                }}
                                              />
                                            </div>
                                            <div className="p-2 pt-1.5 pb-1">
                                              <div className="flex justify-between items-center">
                                                <h5 className="font-medium text-sm truncate max-w-[70%]">
                                                  {gift.name}
                                                </h5>
                                                <span className="text-xs text-gray-600 whitespace-nowrap">
                                                  ${gift.price}
                                                </span>
                                              </div>
                                              <p className="text-xs text-gray-500 h-8 line-clamp-2 overflow-hidden">
                                                {gift.shortDescription ||
                                                  "Premium quality gift"}
                                              </p>
                                              <div className="flex justify-end items-center">
                                                <div
                                                  className={`w-4 h-4 rounded-full ${
                                                    selectedRecipientGifts.includes(
                                                      gift.giftId
                                                    )
                                                      ? "bg-primary flex items-center justify-center"
                                                      : "border-2 border-gray-300"
                                                  }`}
                                                  onClick={(e) => {
                                                    e.stopPropagation(); // Prevent the parent onClick from firing
                                                    if (
                                                      selectedRecipientGifts.length >=
                                                        11 &&
                                                      !selectedRecipientGifts.includes(
                                                        gift.giftId
                                                      )
                                                    ) {
                                                      return; // Prevent click when limit reached
                                                    }
                                                    toggleRecipientGift(
                                                      gift.giftId
                                                    );
                                                  }}
                                                >
                                                  {selectedRecipientGifts.includes(
                                                    gift.giftId
                                                  ) && (
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="text-gray-400 mb-3">
                                          <Package className="w-12 h-12 mx-auto" />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-700 mb-2">
                                          No gifts found
                                        </h4>
                                        <p className="text-gray-500 max-w-md">
                                          No gifts match your current filters.
                                          Try adjusting your search criteria or
                                          resetting filters.
                                        </p>
                                        <button
                                          onClick={resetGiftFilters}
                                          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                          Reset Filters
                                        </button>
                                      </div>
                                    );
                                  })()
                                ) : // Use sample data
                                filteredGifts.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {filteredGifts.map((gift) => (
                                      <div
                                        key={gift.id}
                                        onClick={() => {
                                          if (
                                            selectedRecipientGifts.length >=
                                              11 &&
                                            !selectedRecipientGifts.includes(
                                              gift.id
                                            )
                                          ) {
                                            return; // Prevent click when limit reached
                                          }
                                          toggleRecipientGift(gift.id);
                                        }}
                                        className={`border rounded-lg overflow-hidden transition-all ${
                                          selectedRecipientGifts.includes(
                                            gift.id
                                          )
                                            ? "border-primary ring-2 ring-primary/20 cursor-pointer"
                                            : selectedRecipientGifts.length >=
                                                11 &&
                                              !selectedRecipientGifts.includes(
                                                gift.id
                                              )
                                            ? "border-gray-200 opacity-50 cursor-not-allowed"
                                            : "border-gray-200 hover:border-primary cursor-pointer"
                                        }`}
                                      >
                                        <div className="h-40 bg-gray-100">
                                          <img
                                            src={gift.image}
                                            alt={gift.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                                /\s/g,
                                                "+"
                                              )}`;
                                            }}
                                          />
                                        </div>
                                        <div className="p-2 pt-1.5 pb-1">
                                          <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-sm truncate max-w-[70%]">
                                              {gift.name}
                                            </h5>
                                            <span className="text-xs text-gray-600 whitespace-nowrap">
                                              ${gift.price}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 h-6 overflow-hidden">
                                            {gift.catalog === "premium"
                                              ? "Premium quality gift"
                                              : gift.catalog === "tech"
                                              ? "Latest technology"
                                              : gift.catalog === "eco"
                                              ? "Eco-friendly product"
                                              : "Gourmet selection"}
                                          </p>
                                          <div className="flex justify-end items-center">
                                            <div
                                              className={`w-4 h-4 rounded-full ${
                                                selectedRecipientGifts.includes(
                                                  gift.id
                                                )
                                                  ? "bg-primary flex items-center justify-center"
                                                  : "border-2 border-gray-300"
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation(); // Prevent the parent onClick from firing
                                                if (
                                                  selectedRecipientGifts.length >=
                                                    11 &&
                                                  !selectedRecipientGifts.includes(
                                                    gift.id
                                                  )
                                                ) {
                                                  return; // Prevent click when limit reached
                                                }
                                                toggleRecipientGift(gift.id);
                                              }}
                                            >
                                              {selectedRecipientGifts.includes(
                                                gift.id
                                              ) && (
                                                <Check className="w-2.5 h-2.5 text-white" />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="text-gray-400 mb-3">
                                      <Package className="w-12 h-12 mx-auto" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-700 mb-2">
                                      No gifts found
                                    </h4>
                                    <p className="text-gray-500 max-w-md">
                                      No gifts match your current filters. Try
                                      adjusting your search criteria or
                                      resetting filters.
                                    </p>
                                    <button
                                      onClick={resetGiftFilters}
                                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                      Reset Filters
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Modal Footer */}
                              <div className="border-t border-gray-200 p-4 flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                  {selectedRecipientGifts.length} gifts selected
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={closeRecipientGiftModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => closeRecipientGiftModal()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                                  >
                                    Confirm Selection
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Personalization Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "experience"
                      ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("experience")}
                >
                  <div className="flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Personalization
                    </h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "experience" && (
                      <div className="flex items-center mr-3 text-sm">
                        {giftMessage ? (
                          <div className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md italic max-w-[500px] truncate">
                            "{giftMessage.split("\n")[0].substring(0, 60)}
                            {giftMessage.split("\n")[0].length > 60
                              ? "..."
                              : ""}
                            "
                          </div>
                        ) : (
                          <span className="italic text-gray-500">
                            No message added
                          </span>
                        )}
                      </div>
                    )}
                    {expandedSection === "experience" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "experience" && (
                  <div className="p-4">
                    <div>
                      <h4 className="text-base font-medium mb-2">
                        Craft Your Gift Message
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">
                        This message will be printed on a physical postcard
                        inside the gift box — the first thing your recipient
                        reads.
                      </p>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <EditableCardPreview
                          customMessage={giftMessage}
                          setCustomMessage={setGiftMessage}
                          logoUrl={giftLogo}
                          setLogoUrl={(url) => {
                            setGiftLogo(url);
                          }}
                          editable={true}
                        />
                        <div className="mt-3 text-xs text-gray-500 flex justify-between">
                          <span>Click on the message or logo to edit</span>
                          <span>{giftMessage.length}/200 characters</span>
                        </div>
                      </div>
                    </div>

                    {/* NFC Card Option */}
                    <div className="mt-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="include-nfc-card"
                            checked={includeNfcCard}
                            onChange={(e) =>
                              setIncludeNfcCard(e.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <label
                                htmlFor="include-nfc-card"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                Include NFC Business Card
                              </label>
                              <div className="relative group">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 w-64 -left-32 top-6">
                                  A metal business card with your name printed
                                  on it. Recipients can tap it on their phone to
                                  instantly share your contact information.
                                  Perfect for networking and making lasting
                                  impressions.
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              Add a premium metal NFC business card to each gift
                              box. Recipients can tap the card on their phone to
                              instantly share your contact information.
                            </p>
                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="text-gray-600">
                                Cost:{" "}
                                <span className="font-medium text-primary">
                                  $9 per card
                                </span>
                              </span>
                              <span className="text-gray-600">
                                Material:{" "}
                                <span className="font-medium">
                                  Premium Metal
                                </span>
                              </span>
                              <span className="text-gray-600">
                                Compatibility:{" "}
                                <span className="font-medium">
                                  iOS & Android
                                </span>
                              </span>
                            </div>
                            {/* Always show the NFC card preview */}
                            <div className="mt-4 flex flex-col items-center">
                              <div
                                className="relative w-full max-w-xs sm:max-w-sm md:max-w-md bg-gray-100 border border-gray-200 rounded-xl shadow-md flex items-center justify-center overflow-hidden"
                                style={{ aspectRatio: "21/12" }}
                              >
                                <img
                                  src="/images/nfc-vcard-black-gold.png"
                                  alt="NFC Card Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src =
                                      "/images/event-placeholder.jpg";
                                  }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-2 text-center">
                                NFC Card Preview
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Gifting Analytics Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "analytics"
                      ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("analytics")}
                >
                  <div className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Gifting Analytics
                    </h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "analytics" && (
                      <div className="flex items-center mr-3 text-sm">
                        {landingPageConfig ? (
                          <div className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md italic max-w-[400px] truncate">
                            "
                            {landingPageConfig.content.headline.substring(
                              0,
                              60
                            )}
                            {landingPageConfig.content.headline.length > 60
                              ? "..."
                              : ""}
                            "
                          </div>
                        ) : (
                          <span className="italic text-gray-500">
                            Landing page not configured
                          </span>
                        )}
                      </div>
                    )}
                    {expandedSection === "analytics" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "analytics" && (
                  <div className="p-4">
                    <div>
                      <h4 className="text-base font-medium mb-2">
                        Customize Landing Page Design
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Create the page recipients will see when they scan the
                        QR code on their postcard.
                      </p>
                      <LandingPageDesigner
                        preset={landingPageConfig || undefined}
                        onChange={(config) => setLandingPageConfig(config)}
                        campaignId={`campaign-${organizationId}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email Template Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "email-template"
                      ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("email-template")}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Email Templates
                    </h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "email-template" && (
                      <div className="flex items-center mr-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                          {emailTemplates.addressConfirmedEmail.enabled ? "Personalized" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    )}
                    {expandedSection === "email-template" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "email-template" && (
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="text-base font-medium mb-2">
                        Customize Email Templates
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Configure email templates that will be sent to recipients at different stages of the gift delivery process.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Address Confirmed Email */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">Address Confirmation Email</h5>
                            <p className="text-sm text-gray-500">Sent when recipient confirms their delivery address</p>
                          </div>
                          <Switch
                            checked={emailTemplates.addressConfirmedEmail.enabled}
                            onCheckedChange={(checked) => handleEmailTemplateChange('addressConfirmedEmail', 'enabled', checked)}
                          />
                        </div>
                        {emailTemplates.addressConfirmedEmail.enabled && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject Line
                              </label>
                              <input
                                type="text"
                                value={emailTemplates.addressConfirmedEmail.subject}
                                onChange={(e) => handleEmailTemplateChange('addressConfirmedEmail', 'subject', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email subject line"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Content
                              </label>
                              <textarea
                                value={emailTemplates.addressConfirmedEmail.content}
                                onChange={(e) => handleEmailTemplateChange('addressConfirmedEmail', 'content', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email content"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* In Transit Email */}
                      {/* <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">In Transit Email</h5>
                            <p className="text-sm text-gray-500">Sent when the gift is shipped and on its way</p>
                          </div>
                          <Switch
                            checked={emailTemplates.inTransitEmail.enabled}
                            onCheckedChange={(checked) => handleEmailTemplateChange('inTransitEmail', 'enabled', checked)}
                          />
                        </div>
                        {emailTemplates.inTransitEmail.enabled && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject Line
                              </label>
                              <input
                                type="text"
                                value={emailTemplates.inTransitEmail.subject}
                                onChange={(e) => handleEmailTemplateChange('inTransitEmail', 'subject', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email subject line"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Content
                              </label>
                              <textarea
                                value={emailTemplates.inTransitEmail.content}
                                onChange={(e) => handleEmailTemplateChange('inTransitEmail', 'content', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email content"
                              />
                            </div>
                          </div>
                        )}
                      </div> */}

                      {/* Delivered Email */}
                      {/* <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">Delivered Email</h5>
                            <p className="text-sm text-gray-500">Sent when the gift has been delivered</p>
                          </div>
                          <Switch
                            checked={emailTemplates.deliveredEmail.enabled}
                            onCheckedChange={(checked) => handleEmailTemplateChange('deliveredEmail', 'enabled', checked)}
                          />
                        </div>
                        {emailTemplates.deliveredEmail.enabled && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject Line
                              </label>
                              <input
                                type="text"
                                value={emailTemplates.deliveredEmail.subject}
                                onChange={(e) => handleEmailTemplateChange('deliveredEmail', 'subject', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email subject line"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Content
                              </label>
                              <textarea
                                value={emailTemplates.deliveredEmail.content}
                                onChange={(e) => handleEmailTemplateChange('deliveredEmail', 'content', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email content"
                              />
                            </div>
                          </div>
                        )}
                      </div> */}

                      {/* Acknowledged Email */}
                      {/* <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">Acknowledged Email</h5>
                            <p className="text-sm text-gray-500">Sent when recipient acknowledges receiving the gift</p>
                          </div>
                          <Switch
                            checked={emailTemplates.acknowledgedEmail.enabled}
                            onCheckedChange={(checked) => handleEmailTemplateChange('acknowledgedEmail', 'enabled', checked)}
                          />
                        </div>
                        {emailTemplates.acknowledgedEmail.enabled && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject Line
                              </label>
                              <input
                                type="text"
                                value={emailTemplates.acknowledgedEmail.subject}
                                onChange={(e) => handleEmailTemplateChange('acknowledgedEmail', 'subject', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email subject line"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Content
                              </label>
                              <textarea
                                value={emailTemplates.acknowledgedEmail.content}
                                onChange={(e) => handleEmailTemplateChange('acknowledgedEmail', 'content', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Email content"
                              />
                            </div>
                          </div>
                        )}
                      </div> */}
                    </div>

                    {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Email Template Tips:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• Use personalization tokens like {`{{first-name}}`} and {`{{gift-name}}`}</li>
                            <li>• Keep subject lines under 50 characters for mobile optimization</li>
                            <li>• Include clear next steps or tracking information when relevant</li>
                            <li>• Test your templates to ensure they display correctly</li>
                          </ul>
                        </div>
                      </div>
                    </div> */}
                  </div>
                )}
              </div>

              {/* Post Acknowledgement Workflow Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "post-ack"
                      ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("post-ack")}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Post Acknowledgement Workflow
                    </h3>
                  </div>
                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "post-ack" && (
                      <div className="flex items-center mr-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                            {
                              [
                                crmSyncInviteSent,
                                crmSyncGiftSelected,
                                crmSyncAddressUpdated,
                                crmSyncInTransit,
                                crmSyncDelivered,
                                crmSyncAcknowledged,
                              ].filter(Boolean).length
                            }
                            /6 CRM sync
                          </div>
                          <div className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md font-medium">
                            {
                              [
                                senderSlackNotifications,
                                senderEmailNotifications,
                                salesOwnerSlackNotifications,
                                salesOwnerEmailNotifications,
                              ].filter(Boolean).length
                            }
                            /4 notifications
                          </div>
                        </div>
                      </div>
                    )}
                    {expandedSection === "post-ack" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
                {expandedSection === "post-ack" && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* CRM Sync */}
                      <div>
                        <h4 className="text-base font-medium mb-2">CRM Sync</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Select which touchpoints to sync to your CRM system:
                        </p>
                        <div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              Invite Sent
                            </span>
                            <Switch
                              checked={crmSyncInviteSent}
                              onCheckedChange={setCrmSyncInviteSent}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              Gift Selected
                            </span>
                            <Switch
                              checked={crmSyncGiftSelected}
                              onCheckedChange={setCrmSyncGiftSelected}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              Address Updated
                            </span>
                            <Switch
                              checked={crmSyncAddressUpdated}
                              onCheckedChange={setCrmSyncAddressUpdated}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              In Transit
                            </span>
                            <Switch
                              checked={crmSyncInTransit}
                              onCheckedChange={setCrmSyncInTransit}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              Delivered
                            </span>
                            <Switch
                              checked={crmSyncDelivered}
                              onCheckedChange={setCrmSyncDelivered}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">
                              Acknowledged
                            </span>
                            <Switch
                              checked={crmSyncAcknowledged}
                              onCheckedChange={setCrmSyncAcknowledged}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Notifications */}
                      <div>
                        <h4 className="text-base font-medium mb-2">
                          Notifications
                        </h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Choose who should receive notifications and via which
                          channels:
                        </p>
                        <div>
                          <div className="font-medium mb-2 mt-4 first:mt-0">
                            Sender
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">Slack</span>
                            <Switch
                              checked={senderSlackNotifications}
                              onCheckedChange={setSenderSlackNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">Email</span>
                            <Switch
                              checked={senderEmailNotifications}
                              onCheckedChange={setSenderEmailNotifications}
                            />
                          </div>
                          <div className="font-medium mb-2 mt-4">
                            Sales Owner
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">Slack</span>
                            <Switch
                              checked={salesOwnerSlackNotifications}
                              onCheckedChange={setSalesOwnerSlackNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">Email</span>
                            <Switch
                              checked={salesOwnerEmailNotifications}
                              onCheckedChange={setSalesOwnerEmailNotifications}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Summary Section */}
              <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    expandedSection === "budget"
                      ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleSection("budget")}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Campaign Budget
                    </h3>
                  </div>

                  <div className="flex items-center">
                    {/* Summary shown only when collapsed */}
                    {expandedSection !== "budget" && (
                      <div className="flex items-center mr-3 text-sm">
                        {Number(walletBalance) - Number(totalAfterCredits) <
                          0 &&
                          Number(totalAfterCredits) !==
                            Number(walletBalance) && (
                            <div className="text-red-500 font-medium text-xs inline-block pr-3 ">
                              (Insufficient funds: $
                              {walletBalance.toLocaleString()})
                            </div>
                          )}
                        <div className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md font-medium">
                          Total:{" "}
                          <span className="text-primary">
                            ${totalAfterCredits.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {expandedSection === "budget" ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedSection === "budget" && (
                  <div className="p-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">
                          Campaign Budget Summary
                        </h4>
                        <button
                          onClick={toggleBudgetDetails}
                          className="flex items-center text-primary hover:text-primary/80 transition-colors text-xs font-medium"
                          aria-expanded={budget.showDetails}
                          aria-label={
                            budget.showDetails
                              ? "Hide budget details"
                              : "Show budget details"
                          }
                        >
                          <span className="mr-1">
                            {budget.showDetails
                              ? "Hide details"
                              : "View details"}
                          </span>
                          {budget.showDetails ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Collapsed View */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Est. Campaign Budget
                          </span>
                          <span className="font-medium">
                            ${totalBeforeCredits.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <CreditCard className="h-3.5 w-3.5 mr-1 text-primary" />
                            Credits Required
                          </span>
                          <span className="font-medium text-primary">
                            {budget.requiredCredits > 0
                              ? budget.requiredCredits
                              : "0"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            {Number(walletBalance) - Number(totalAfterCredits) <
                              0 &&
                              Number(totalAfterCredits) !==
                                Number(walletBalance) && (
                                <div className="text-red-500 text-xs inline-block pr-3 ">
                                  (Insufficient funds: $
                                  {walletBalance.toLocaleString()})
                                </div>
                              )}
                            ${totalAfterCredits.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {budget.showDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-200 animate-fadeIn">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Gift Cost</span>
                              <span className="font-medium">
                                ${budget.giftCost.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Shipping (est.)
                              </span>
                              <span className="font-medium">
                                ${budget.shippingCost.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Handling Charge
                              </span>
                              <span className="font-medium">
                                ${budget.handlingCost.toLocaleString()}
                              </span>
                            </div>
                            {includeNfcCard && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center">
                                  <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                                  NFC Business Cards
                                </span>
                                <span className="font-medium">
                                  ${budget.nfcCardCost.toLocaleString()}
                                </span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium">
                                ${totalBeforeCredits.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 flex items-center">
                                <CreditCard className="h-3.5 w-3.5 mr-1 text-primary" />
                                Credits Required
                              </span>
                              <span className="font-medium text-primary">
                                {budget.requiredCredits}
                              </span>
                            </div>

                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Info className="h-3 w-3 mr-1" />
                              <span>
                                {budget.availableCredits} credits available in
                                your account
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Browser Modal for One Gift - Slide from right */}
      {showGiftModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-end p-0"
          style={{
            animation: isClosingGiftModal
              ? "fadeOut 0.3s ease-out"
              : "fadeIn 0.3s ease-out",
          }}
        >
          <div
            className="bg-white shadow-xl w-full sm:w-[750px] md:w-[950px] lg:w-[1200px] xl:w-[1400px] h-full flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"
            style={{
              animation: isClosingGiftModal
                ? "slideOutToRight 0.3s ease-out"
                : "slideInFromRight 0.3s ease-out",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {selectedBundle && bundles.length > 0
                  ? `Select a Gift - ${
                      bundles.find((b) => b.bundleId === selectedBundle)
                        ?.bundleName
                    }`
                  : "Select a Gift"}
              </h3>
              <button
                onClick={closeGiftModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="border-b border-gray-200 p-4 bg-blue-50">
              <div className="flex items-start">
                <div className="text-blue-500 mr-3">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">
                    Select one gift that will be sent to all recipients in this
                    campaign. Choose something that will appeal to your entire
                    audience.
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-wrap gap-3">
                {/* Catalog filter */}
                <div className="relative">
                  <select
                    value={giftFilterCatalog}
                    onChange={(e) => setGiftFilterCatalog(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {selectedBundle && bundles.length > 0 ? (
                      // Get unique categories from the selected bundle
                      Array.from(
                        new Set(
                          bundles
                            .find((b) => b.bundleId === selectedBundle)
                            ?.gifts.map((gift) => gift.category) || []
                        )
                      ).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))
                    ) : (
                      // Use sample gift catalogs if no API data
                      <>
                        <option value="premium">Premium Collection</option>
                        <option value="tech">Tech Gadgets</option>
                        <option value="eco">Eco-Friendly</option>
                        <option value="food">Food & Beverage</option>
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>

                {/* Price filter */}
                <div className="relative">
                  <select
                    value={giftFilterPrice}
                    onChange={(e) => setGiftFilterPrice(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Any Price</option>
                    <option value="under25">Under $25</option>
                    <option value="25to50">$25 - $50</option>
                    <option value="50to100">$50 - $100</option>
                    <option value="over100">Over $100</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>

                {/* Search input */}
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search gifts..."
                    value={giftSearchQuery}
                    onChange={(e) => setGiftSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Reset filters */}
                <button
                  onClick={resetGiftFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Gift Grid */}
            <div className="overflow-y-auto p-4 flex-grow">
              {selectedBundle && bundles.length > 0 ? (
                // Use API data
                (() => {
                  const allGifts = bundles.flatMap((bundle) => bundle.gifts);
                  const filteredGifts = allGifts
                    .filter((gift) => {
                      // Filter by budget first
                      if (gift.price < budget.min || gift.price > budget.max)
                        return false;

                      // Filter by category
                      if (
                        giftFilterCatalog &&
                        gift.category !== giftFilterCatalog
                      )
                        return false;

                      // Filter by price
                      if (giftFilterPrice === "under25" && gift.price >= 25)
                        return false;
                      if (
                        giftFilterPrice === "25to50" &&
                        (gift.price < 25 || gift.price > 50)
                      )
                        return false;
                      if (
                        giftFilterPrice === "50to100" &&
                        (gift.price < 50 || gift.price > 100)
                      )
                        return false;
                      if (giftFilterPrice === "over100" && gift.price <= 100)
                        return false;

                      // Filter by search query
                      if (
                        giftSearchQuery &&
                        !gift.name
                          .toLowerCase()
                          .includes(giftSearchQuery.toLowerCase())
                      )
                        return false;

                      return true;
                    })
                    .sort((a, b) => b.price - a.price); // Sort by price descending

                  return filteredGifts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredGifts.map((gift) => (
                        <div
                          key={gift.giftId}
                          onClick={() => selectGiftAndClose(gift.giftId)}
                          className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                            selectedGift === gift.giftId
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-primary"
                          }`}
                        >
                          <div className="h-40 bg-gray-100">
                            <img
                              src={gift.imageUrl}
                              alt={gift.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                                  /\s/g,
                                  "+"
                                )}`;
                              }}
                            />
                          </div>
                          <div className="p-2 pt-1.5 pb-1">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium text-sm truncate max-w-[70%]">
                                {gift.name}
                              </h5>
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                ${gift.price}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 h-6 overflow-hidden">
                              {gift.shortDescription || "Premium quality gift"}
                            </p>
                            <div className="flex justify-end items-center">
                              <div
                                className={`w-4 h-4 rounded-full ${
                                  selectedGift === gift.giftId
                                    ? "bg-primary flex items-center justify-center"
                                    : "border-2 border-gray-300"
                                }`}
                              >
                                {selectedGift === gift.giftId && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-gray-400 mb-3">
                        <Package className="w-12 h-12 mx-auto" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-700 mb-2">
                        No gifts found
                      </h4>
                      <p className="text-gray-500 max-w-md">
                        No gifts match your current filters. Try adjusting your
                        search criteria or resetting filters.
                      </p>
                      <button
                        onClick={resetGiftFilters}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  );
                })()
              ) : // Use sample data
              filteredGifts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredGifts.map((gift) => (
                    <div
                      key={gift.id}
                      onClick={() => selectGiftAndClose(gift.id)}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedGift === gift.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-primary"
                      }`}
                    >
                      <div className="h-40 bg-gray-100">
                        <img
                          src={gift.image}
                          alt={gift.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/300x200?text=${gift.name.replace(
                              /\s/g,
                              "+"
                            )}`;
                          }}
                        />
                      </div>
                      <div className="p-2 pt-1.5 pb-1">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-sm truncate max-w-[70%]">
                            {gift.name}
                          </h5>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            ${gift.price}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 h-6 overflow-hidden">
                          {gift.catalog === "premium"
                            ? "Premium quality gift"
                            : gift.catalog === "tech"
                            ? "Latest technology"
                            : gift.catalog === "eco"
                            ? "Eco-friendly product"
                            : "Gourmet selection"}
                        </p>
                        <div className="flex justify-end items-center">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              selectedGift === gift.id
                                ? "bg-primary flex items-center justify-center"
                                : "border-2 border-gray-300"
                            }`}
                          >
                            {selectedGift === gift.id && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-gray-400 mb-3">
                    <Package className="w-12 h-12 mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    No gifts found
                  </h4>
                  <p className="text-gray-500 max-w-md">
                    No gifts match your current filters. Try adjusting your
                    search criteria or resetting filters.
                  </p>
                  <button
                    onClick={resetGiftFilters}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end items-center">
              <div className="flex gap-3">
                <button
                  onClick={closeGiftModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={closeGiftModal}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Contact Modal */}
      {showAddContactForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{
            animation: isClosingAddContactForm
              ? "fadeOut 0.3s ease-out"
              : "fadeIn 0.3s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAddContactForm();
            }
          }}
        >
          <div
            className="bg-white shadow-xl w-full max-w-md rounded-lg max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-in-out"
            style={{
              animation: isClosingAddContactForm
                ? "fadeOut 0.3s ease-out"
                : "fadeIn 0.3s ease-out",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Quick Add Contact
              </h3>
              <button
                onClick={closeAddContactForm}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add a new contact and automatically include them in this
                  campaign.
                </p>

                {/* Contact Form - Compact Layout */}
                <div className="space-y-4">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newContact.firstName}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newContact.lastName}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact({ ...newContact, email: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="john@company.com"
                    />
                  </div>

                  {/* Company & Job Title Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={newContact.companyName}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={newContact.jobTitle}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            jobTitle: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="CEO"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      LinkedIn Handle
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">
                          linkedin.com/in/
                        </span>
                      </div>
                      <input
                        type="text"
                        value={newContact.linkedinUrl || ""}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            linkedinUrl: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded py-2 pl-32 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* Address Section - Collapsible */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddressSection(!showAddressSection)}
                      className="flex items-center justify-between w-full py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                      <span className="text-sm font-medium text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        Address Information (Optional)
                      </span>
                      {showAddressSection ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {showAddressSection && (
                      <div className="mt-3 space-y-3 animate-fadeIn">
                        {/* Street Address */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={newContact.address.line1}
                            onChange={(e) =>
                              setNewContact({
                                ...newContact,
                                address: {
                                  ...newContact.address,
                                  line1: e.target.value,
                                },
                              })
                            }
                            className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="123 Main Street"
                          />
                        </div>

                        {/* City, State, ZIP Row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={newContact.address.city}
                              onChange={(e) =>
                                setNewContact({
                                  ...newContact,
                                  address: {
                                    ...newContact.address,
                                    city: e.target.value,
                                  },
                                })
                              }
                              className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="San Francisco"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              value={newContact.address.state}
                              onChange={(e) =>
                                setNewContact({
                                  ...newContact,
                                  address: {
                                    ...newContact.address,
                                    state: e.target.value,
                                  },
                                })
                              }
                              className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              ZIP
                            </label>
                            <input
                              type="text"
                              value={newContact.address.zipCode}
                              onChange={(e) =>
                                setNewContact({
                                  ...newContact,
                                  address: {
                                    ...newContact.address,
                                    zipCode: e.target.value,
                                  },
                                })
                              }
                              className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="94102"
                            />
                          </div>
                        </div>

                        {/* Country */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <select
                            value={newContact.address.country}
                            onChange={(e) =>
                              setNewContact({
                                ...newContact,
                                address: {
                                  ...newContact.address,
                                  country: e.target.value,
                                },
                              })
                            }
                            className="w-full border border-gray-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">
                              United Kingdom
                            </option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Netherlands">Netherlands</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50 rounded-b-lg">
              <button
                onClick={closeAddContactForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleAddAndClose}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm"
                >
                  Add & Close
                </button>
                <button
                  onClick={handleAddAnother}
                  className="px-4 py-2 bg-[#F4EBFF] border border-[#F4EBFF] text-[#6941C6] rounded-lg text-sm font-medium hover:bg-[#E9D7FE] hover:border-[#E9D7FE] shadow-sm"
                  style={{ boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)" }}
                >
                  Add Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={onSaveDraft}
            disabled={isSaving || isLaunching}
            className={`flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium shadow-xs ${
              isSaving || isLaunching
                ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isSaving && <InfinityLoader width={16} height={16} />}
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            onClick={onLaunch}
            disabled={
              isSaving ||
              isLaunching ||
              (Number(walletBalance) - Number(totalAfterCredits) < 0 &&
                Number(totalAfterCredits) !== Number(walletBalance))
            }
            className={`flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium shadow-xs ${
              isSaving ||
              isLaunching ||
              (Number(walletBalance) - Number(totalAfterCredits) < 0 &&
                Number(totalAfterCredits) !== Number(walletBalance))
                ? "bg-gray-400 border border-gray-400 text-white cursor-not-allowed"
                : "bg-primary border border-primary text-white hover:bg-primary/90"
            }`}
          >
            {isLaunching && <InfinityLoader width={16} height={16} />}
            <span>{isLaunching ? "Launching..." : "Launch Campaign"} </span>
          </button>

          {Number(walletBalance) - Number(totalAfterCredits) < 0 &&
            Number(totalAfterCredits) !== Number(walletBalance) && (
                              <button
                  onClick={handleAddFundClick}
                  className="px-4 animate-pulse py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm flex items-center justify-center"
              >
                Add Funds
              </button>
            )}
        </div>
      </div>

      {/* Amount Input Modal */}
      {showAmountInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">Add Funds to Wallet</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                min="1"
                step="0.01"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAmountSubmit}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowAmountInput(false);
                  setAmount("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
            {isProcessingPayment ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Processing your payment...</p>
              </div>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <StripePaymentForm
                  amount={parseFloat(amount)}
                  onSuccess={handlePaymentSuccess}
                  onClose={() => setShowPaymentModal(false)}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DEVELOPMENT NOTES FOR FUTURE MAINTAINERS
 * ========================================
 *
 * TESTING NEW GOAL-MOTION COMBINATIONS:
 * 1. Test mode detection logic with console.log statements
 * 2. Verify conditional rendering in Recipients section
 * 3. Check budget calculation with different recipient counts
 * 4. Test collapsed mode summary display
 * 5. Verify landing page content generation
 *
 * COMMON PITFALLS TO AVOID:
 * - Forgetting to update budget calculation for new modes
 * - Not updating the collapsed mode summary for new states
 * - Missing useEffect dependencies when adding new state variables
 * - Not handling edge cases in recipient count calculation
 * - Forgetting to update description text for new modes
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Contact search is debounced to avoid excessive API calls
 * - Large contact lists are paginated to maintain UI responsiveness
 * - Budget calculations are memoized through useEffect dependencies
 * - Contact dropdown results are limited to 10 items for better UX
 *
 * ACCESSIBILITY FEATURES:
 * - All form inputs have proper labels and ARIA attributes
 * - Keyboard navigation is supported throughout the interface
 * - Screen reader announcements for dynamic content changes
 * - Focus management in modals and dropdowns
 *
 * API INTEGRATION POINTS:
 * - Contact list fetching: /v1/organizations/{id}/contact-lists
 * - All contacts fetching: /v1/organizations/{id}/contacts
 * - Event data fetching: /v1/organizations/{id}/events/{eventId}
 * - Contact creation: /v1/organizations/{id}/contacts (POST)
 * - Gift/bundle data: Various endpoints based on selected mode
 *
 * For questions or issues, contact the DelightLoop Development Team.
 */
