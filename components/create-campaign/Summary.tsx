"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  PlusCircle,
  ArrowLeft,
  HelpCircle,
  X,
  Info,
  Zap,
  Users,
  CalendarDays,
  Clock,
  FileText,
  Wallet,
  Plus,
  Divide,
} from "lucide-react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/wallet/StripePaymentForm";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

interface SummaryProps {
  eventId: string;
  data: {
    name: string;
    description: string;
    goal: string;
    motion?: string;
    recipientSource: string;
    recipients: Array<{
      id: string;
      name: string;
      email: string;
      company?: string;
      title?: string;
    }>;
    giftType: string;
    message: string;
    templateId: string;
    budget: {
      perRecipient: number;
      total: number;
    };
    boostRegistrationData?: {
      registrationGoal: number;
      perGiftCost: number;
      conversionFactor: number;
      budget?: {
        totalLeads: number;
        creditCost: number;
        giftCost: number;
        totalBudget: number;
      };
    };
    eventDetails?: {
      id: string;
      name: string;
      type?: string;
      date?: string;
    };
  };
  onSubmit: () => void;
  onBack: () => void;
  campaignId: string;
  authToken: string;
  userId: string;
  organizationId: string;
}

// Modal component for successful campaign launch
interface LaunchSuccessModalProps {
  isOpen: boolean;
  campaignName: string;
  eventName?: string;
  recipientCount: number;
  onClose: () => void;
  onViewDashboard: () => void;
  onCreateNewCampaign: () => void;
  onReturnToEvent: () => void;
  campaignData: any;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const LaunchSuccessModal: React.FC<LaunchSuccessModalProps> = ({
  isOpen,
  campaignName,
  eventName,
  recipientCount,
  onClose,
  onViewDashboard,
  onCreateNewCampaign,
  onReturnToEvent,
  campaignData,
}) => {
  // Add effect to prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the body
      document.body.classList.add("overflow-hidden");
    } else {
      // Re-enable scrolling when modal closes
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return typeof window !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] backdrop-blur-md"
        style={{ touchAction: "none" }}
      >
        <div className="bg-white rounded-lg shadow-2xl w-[95%] mx-auto md:w-auto md:max-w-md max-h-[95vh] overflow-y-auto">
          {/* Header with Lottie animation */}
          <div className="bg-primary text-white p-6 text-center relative overflow-hidden">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute hidden top-3 right-3 text-white/80 hover:text-white transition-colors z-20"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lottie Animation */}
            <div className="h-28 relative flex items-center justify-center">
              <DotLottieReact
                src="https://lottie.host/df8b78a8-1464-4c9c-a052-e66b3e0c28f0/Mz5VlowxXi.lottie"
                loop
                autoplay
                style={{
                  height: 180,
                  width: 180,
                  position: "absolute",
                  top: -20,
                }}
              />
            </div>
            <h2 className="text-2xl font-bold relative z-10">
              Campaign {campaignData?.giftSelectionMode == "manual" ? "Launched" : "Submitted"}!
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 text-lg mb-6 text-center leading-snug">
              {campaignData?.giftSelectionMode == "manual" ?
                <>
                  Your <span className="font-semibold">{campaignName}</span>{" "}
                  campaign
                  {eventName ? ` for ${eventName}` : ""} is now live.
                </> : <>

                  We are matching Gifts for your <span className="font-semibold">{campaignName}</span> campaign.

                </>}
            </p>

            {/* Gift Box Lottie Animation */}
            <div className="flex justify-center mb-2">
              <div className="w-28 h-28 -mt-2">
                <DotLottieReact
                  src="https://lottie.host/e09846d8-1011-4fdf-bbe0-87ce5ebc1a2a/2GZSpL1SLX.lottie"
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            {/* {campaignData?.giftSelectionMode !== "manual" && (
              <p className="text-gray-700 mb-8 text-center leading-snug">
                {campaignData?.motion == "booth_giveaways" ? "" : <span>We are matching Gifts for your <span className="font-semibold">{campaignName}</span> campaign.</span>}
              </p>
            )} */}

            <div className="flex items-center justify-center mb-6">
              <HelpCircle className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-center text-gray-700 font-medium">
                What would you like to do next?
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={onViewDashboard}
                className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-all flex items-center justify-center group relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                aria-label="View campaign dashboard"
              >
                <span className="absolute inset-0 w-full h-full bg-white/[0.07] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                <span className="relative flex items-center">
                  <Megaphone className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                  <span className="group-hover:tracking-wide transition-all duration-300">
                    View Campaign Details
                  </span>
                </span>
              </button>

              {/* onClick={onCreateNewCampaign} */}
              <Link
                href="/dashboard"
                className="w-full px-4 py-3 border border-primary text-primary rounded-md hover:bg-purple-50 transition-all flex items-center justify-center group relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                aria-label="Create new campaign"
              >
                <span className="absolute inset-0 w-full h-full bg-primary/[0.05] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                <span className="relative flex items-center">
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                  <span className="group-hover:tracking-wide transition-all duration-300">
                    Return to Dashboard
                  </span>
                </span>
              </Link>

              {/* {eventName && (
                  <button
                    onClick={onReturnToEvent}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all flex items-center justify-center group relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                    aria-label="Return to event page"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gray-100/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    <span className="relative flex items-center">
                      <ArrowLeft className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-300" />
                      <span className="group-hover:tracking-wide transition-all duration-300">
                        Return to Event
                      </span>
                    </span>
                  </button>
                )} */}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;
};

// Mock user account data - in real app, would come from API or context
const userAccount = {
  credits: 500,
  totalCredits: 1000,
  walletBalance: 2500,
  totalBudget: 5000,
};

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-8"></div>

      <div className="flex flex-col lg:flex-row lg:space-x-8">
        {/* Left Column Skeleton */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg mb-8">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
              <div className="h-6 w-44 bg-gray-200 rounded"></div>
            </div>

            <div className="p-6 space-y-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-start space-x-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full mt-0.5"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1.5"></div>
                    <div className="h-5 w-full bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:w-1/3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg mb-8 h-full">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
              <div className="h-6 w-56 bg-gray-200 rounded"></div>
            </div>

            <div className="p-6 flex flex-col h-[calc(100%-64px)]">
              <div className="mb-3">
                <div className="h-4 w-36 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex justify-between items-center"
                    >
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                  <div className="pt-2.5 mt-2.5 border-t border-gray-200 flex justify-between items-center">
                    <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="flex justify-between items-center"
                      >
                        <div className="h-4 w-28 bg-gray-200 rounded"></div>
                        <div className="h-5 w-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-between mt-8">
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
        <div className="flex space-x-4">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

const Summary: React.FC<SummaryProps> = ({
  data,
  onSubmit,
  onBack,
  campaignId,
  authToken,
  userId,
  organizationId,
  eventId,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newCredits, setNewCredits] = useState(100);
  const [newWalletAmount, setNewWalletAmount] = useState(500);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [giftDetails, setGiftDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500); // Wait until all animations have completed

    return () => clearTimeout(timer);
  }, []);
  const [allRecipientsHaveLinkedin, setAllRecipientsHaveLinkedin] = useState(false);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setIsLoading(true);
        console.log("[Campaign] Fetching campaign details");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          const campaignData3 = responseData?.campaign;
          setCampaignData(campaignData3);

          // Check if there are gift catalogs and fetch the first gift's details
          if (campaignData3?.giftCatalogs?.length > 0 && campaignData3?.giftSelectionMode === "manual") {
            const selectedGifts = campaignData3.giftCatalogs[0].selectedGift;
            if (selectedGifts && selectedGifts.length > 0) {
              if (selectedGifts.length === 1) {
                await fetchGiftDetails(selectedGifts[0]);
              } else {
                await fetchMultipleGiftDetails(selectedGifts);
              }
            }
          }
        } else {
          console.error("[Campaign] Failed to fetch details:", {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (error) {
        console.error("[Campaign] Error fetching campaign details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId && organizationId && authToken) {
      fetchCampaignDetails();
    }
  }, [campaignId, organizationId, authToken]);

  //   const campaignData = {
  //     status: "live",
  //   };

  // const response = await fetch(
  //   `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
  //   {
  //     method: "PUT",
  //     headers: {
  //       Authorization: `Bearer ${authToken}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(campaignData),
  //   }
  // );

  // if (!response.ok) {
  //   const errorData = await response.json().catch(() => null);
  //   console.error("API Error Response:", errorData);
  //   throw new Error(
  //     `Failed to update campaign: ${response.status}${
  //       errorData?.message ? ` - ${errorData.message}` : ""
  //     }`
  //   );
  // }
  const [campaignLaunchSuccessfully, setCampaignLaunchSuccessfully] =
    useState(false);

  const handleSubmit = async () => {

    setIsSubmitting(true);
    if (eventId == "1") {
      try {
        // Skip gift selection API if multiple gifts are selected
        if (!(campaignData?.giftCatalogs?.[0]?.selectedGift?.length > 1)) {
          // First call - Gift Selection API
          const giftSelectionResponse = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/gift-selection`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!giftSelectionResponse.ok) {
            const errorData = await giftSelectionResponse.json().catch(() => null);
            console.error("Gift Selection API Error:", errorData);
            throw new Error(
              `Failed to assign gifts: ${giftSelectionResponse.status}${errorData?.message ? ` - ${errorData.message}` : ""}`
            );
          }
        }

        // Second call - Run Campaign API
        if (campaignData?.giftSelectionMode === "manual") {
          const runResponse = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/run`,
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

          if (!runResponse.ok) {
            const errorData = await runResponse.json().catch(() => null);
            console.error("Run Campaign API Error:", errorData);
            throw new Error(
              `Failed to run campaign: ${runResponse.status}${errorData?.message ? ` - ${errorData.message}` : ""}`
            );
          }
        }

        setIsSubmitting(false);
        setShowSuccessModal(true);
        setCampaignLaunchSuccessfully(true);

      } catch (error) {
        console.error("Error in campaign launch:", error);
        toast.error(
          `Failed to launch campaign: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        setIsSubmitting(false);
      }
    }
    try {
      // Fetch current event data to get existing campaignIds
      const eventRes = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${campaignData?.eventId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      let campaignIds: string[] = [];
      if (eventRes.ok) {
        const eventData = await eventRes.json();
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

      // Now PATCH with the updated array
      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${campaignData?.eventId}`,
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
      if (!response2.ok) {
        const errorData = await response2.json().catch(() => null);
        console.error("API Error Response:", errorData);
        throw new Error(
          `Failed to update event: ${response2.status}${errorData?.message ? ` - ${errorData.message}` : ""}`
        );
      }

      // Skip gift selection API if multiple gifts are selected
      if (!(campaignData?.giftCatalogs?.[0]?.selectedGift?.length > 1)) {
        // First call - Gift Selection API
        const giftSelectionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/gift-selection`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!giftSelectionResponse.ok) {
          const errorData = await giftSelectionResponse.json().catch(() => null);
          console.error("Gift Selection API Error:", errorData);
          throw new Error(
            `Failed to assign gifts: ${giftSelectionResponse.status}${errorData?.message ? ` - ${errorData.message}` : ""}`
          );
        }
      }

      // Second call - Run Campaign API
      if (campaignData?.giftSelectionMode === "manual") {
        const runResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/run`,
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

        if (!runResponse.ok) {
          const errorData = await runResponse.json().catch(() => null);
          console.error("Run Campaign API Error:", errorData);
          throw new Error(
            `Failed to run campaign: ${runResponse.status}${errorData?.message ? ` - ${errorData.message}` : ""}`
          );
        }
      }

      setIsSubmitting(false);
      setShowSuccessModal(true);
      setCampaignLaunchSuccessfully(true);
    } catch (error) {
      console.error("Error in campaign launch:", error);
      toast.error(
        `Failed to launch campaign: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsSubmitting(false);
    }
  };


  const handleViewDashboard = () => {
    router.push(`/campaign-details/${campaignId}`);
  };

  const handleCreateNewCampaign = () => {
    router.push("/create-campaign");
  };

  const handleReturnToEvent = () => {
    // If we have event details, navigate to that event's page
    if (data.eventDetails) {
      router.push(`/event/${data.eventDetails.id}`);
    } else {
      // If no event details, just go to events list
      router.push("/events");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    onSubmit(); // Complete the submission flow
  };

  // Helper to get campaign motion label
  const getMotionLabel = (motionId?: string) => {
    if (!motionId) return "Not specified";

    const motions: { [key: string]: string } = {
      boost_registration: "Boost Registration",
      ensure_attendance: "Ensure Attendance",
      set_up_meeting: "Set Up 1:1 Meeting",
      vip_box_pickup: "VIP Box Pickup",
      express_send: "Express Send",
      booth_giveaways: "Booth Giveaways",
      thank_you: "Thank You",
    };

    return motions[motionId] || "Unknown";
  };

  // Helper to get gift type label from ID
  const getGiftTypeLabel = (giftType: string) => {
    const giftTypes: { [key: string]: string } = {
      gift_card: "Gift Card",
      custom_box: "Custom Gift Box",
      experience: "Experience Gift",
      swag: "Branded Swag",
    };

    return giftTypes[giftType] || "Unknown";
  };

  // Helper to get template label from ID
  const getTemplateLabel = (templateId: string) => {
    const templates: { [key: string]: string } = {
      template_modern: "Modern",
      template_elegant: "Elegant",
      template_playful: "Playful",
    };

    return templates[templateId] || "Default";
  };

  // Calculate target completion date (today + 10 days)
  const getCompletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate budget
  const recipientCount = data.recipients?.length || 0;
  const totalBudget = data.budget?.perRecipient
    ? data.budget.perRecipient * recipientCount
    : data.budget?.total || recipientCount * 50; // Default $50 per recipient if not set

  // Calculate boost registration budget if applicable
  const boostBudget = data.boostRegistrationData?.budget?.totalBudget || 0;

  // Calculate credit usage
  const estimatedCreditUsage =
    data.motion === "boost_registration"
      ? data.boostRegistrationData?.budget?.creditCost || 0
      : recipientCount * 1; // Assume 1 credit per recipient for other motions

  // Calculate wallet usage
  const estimatedWalletUsage =
    data.motion === "boost_registration"
      ? data.boostRegistrationData?.budget?.giftCost || 0
      : totalBudget;

  // Get animation delay based on index
  const getAnimationDelay = (index: number) => {
    return `${100 + index * 120}ms`;
  };

  // Apply animation class based on index
  const getAnimationClass = (index: number) => {
    return "animate-fade-in-up opacity-0";
  };

  const fetchWalletData = async () => {
    try {
      console.log("[Wallet] Starting wallet balance fetch");
      setWalletLoading(true);

      if (!userId || !organizationId) {
        console.warn(
          "[Wallet] No user ID or organization ID found, aborting balance fetch"
        );
        setWalletLoading(false);
        return;
      }

      // Use the correct API endpoint structure
      const response = await fetch(
        `/api/wallet/${organizationId}?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      console.log("[Wallet] Balance API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Wallet] Balance data received:", {
          currentBalance: data.wallet?.current_balance,
          fullData: data,
        });
        setWalletBalance(data.wallet?.current_balance || 0);
      } else {
        console.error("[Wallet] Failed to fetch balance:", {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      console.error("[Wallet] Error in fetchWalletBalance:", error);
    } finally {
      setWalletLoading(false);
    }
  };

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
        await fetchWalletData();
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

  // Add useEffect for wallet balance
  useEffect(() => {
    fetchWalletData();
  }, [userId, authToken]);

  useEffect(() => {
    if (paymentComplete) {
      setPaymentComplete(false);
      fetchWalletData();
    }
  }, [paymentComplete]);

  const fetchGiftDetails = async (giftId: string) => {
    try {
      console.log("[Gift] Fetching gift details for ID:", giftId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${giftId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[Gift] Details received:", data);
        setGiftDetails(data);
      } else {
        console.error("[Gift] Failed to fetch gift details:", {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      console.error("[Gift] Error fetching gift details:", error);
    }
  };

  const fetchMultipleGiftDetails = async (giftIds: string[]) => {
    try {
      console.log("[Gifts] Fetching details for multiple gifts:", giftIds);
      const giftPromises = giftIds.map(async (giftId) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${giftId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return data;
          } else {
            console.error(`[Gift] Failed to fetch gift ${giftId}:`, {
              status: response.status,
              statusText: response.statusText,
            });
            return null;
          }
        } catch (error) {
          console.error(`[Gift] Error fetching gift ${giftId}:`, error);
          return null;
        }
      });

      const giftDetails = await Promise.all(giftPromises);
      const validGiftDetails = giftDetails.filter(gift => gift !== null);

      if (validGiftDetails.length > 0) {
        // Calculate total cost for all gifts
        const totalCost = validGiftDetails.reduce((sum, gift) => {
          return sum + (gift.price + gift.handlingCost + gift.shippingCost);
        }, 0);

        setGiftDetails({
          ...validGiftDetails[0], // Keep the first gift's details for backward compatibility
          totalCost,
          allGifts: validGiftDetails
        });
      }
    } catch (error) {
      console.error("[Gifts] Error fetching multiple gift details:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Campaign Summary
          </h2>
          <p className="text-base text-gray-600 mb-8">
            Review your campaign details before launching.
          </p>

          <div className="flex flex-col lg:flex-row lg:space-x-8">
            {/* Left Column - Campaign Summary */}
            <div className="lg:w-2/3">
              {/* Campaign Summary Card */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-lg mb-8 h-full">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mr-3">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    Campaign Overview
                  </h3>
                </div>

                <div className="p-6 space-y-5">
                  {/* Campaign Name */}
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <Info className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Campaign Name
                      </p>
                      <p className="text-base font-semibold mt-0.5">
                        {campaignData?.name || data.name}
                      </p>
                    </div>
                  </div>

                  {/* Motion */}
                  {data.eventDetails && (
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                        <Zap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Motion
                        </p>
                        <p className="text-base font-semibold mt-0.5">
                          {getMotionLabel(campaignData?.motion)}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Target Audience */}
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Target Audience
                      </p>
                      <p className="text-base font-semibold mt-0.5">
                        {campaignData?.motion === "booth_giveaways" ?
                          `${campaignData?.total_recipients} Recipients` :
                          `${data.recipients?.length || 0} Recipients from "${data.recipientSource}"`}
                      </p>
                      {campaignData?.giftSelectionMode === "manual" && campaignData?.giftCatalogs?.[0]?.selectedGift && (
                        <p className="text-sm mt-1">
                          {campaignData.giftCatalogs[0].selectedGift.length} Gift{campaignData.giftCatalogs[0].selectedGift.length !== 1 ? 's' : ''} Selected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Event */}
                  {data.eventDetails && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Event
                          </p>
                          <p className="text-base font-semibold mt-0.5">
                            {data.eventDetails.name} (
                            {data.eventDetails.type || "Unspecified"})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                          <CalendarDays className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Event Date
                          </p>
                          <p className="text-base font-semibold mt-0.5">
                            {campaignData?.eventStartDate
                              ? new Date(
                                campaignData?.eventStartDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                              : "Date not specified"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Expected Completion */}
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {eventId == "1"
                          ? "Deliver By Date"
                          : "Expected Completion"}
                      </p>
                      <p className="text-base font-semibold mt-0.5">
                        {new Date(
                          campaignData?.deliverByDate
                        ).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                        }
                      </p>
                      <p
                        className={`text-xs mt-1 flex items-center ${eventId == "1" ? "hidden" : ""
                          }`}
                      >
                        <Info className="h-3.5 w-3.5 mr-1" />
                        {
                          `${Math.ceil((new Date(campaignData?.deliverByDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from launch`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Budget Section */}
            <div className="lg:w-1/3">
              {/* Campaign Budget Section */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-lg mb-8 h-full">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-12 h-12 bg-purple-50 border-4 border-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="h-6 w-6 text-purple-600" />
                    </div>
                    Campaign Budget Summary
                  </h3>
                </div>

                <div className="p-6 flex flex-col h-[calc(100%-64px)]">
                  {/* Cost Breakdown Section */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Cost Breakdown
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Gift Cost (incl. S&H)
                        </span>
                        <span className="text-base font-semibold">
                          $
                          {campaignData?.giftSelectionMode === "manual" ? (
                            giftDetails?.allGifts ? (
                              // If we have multiple gifts, use the maximum gift cost
                              (Math.max(...giftDetails.allGifts.map(gift =>
                                gift.price + gift.handlingCost + gift.shippingCost)) *
                                campaignData?.total_recipients || 0)
                            ) : (
                              // Single gift calculation (backward compatibility)
                              ((giftDetails?.price +
                                giftDetails?.handlingCost +
                                giftDetails?.shippingCost) *
                                campaignData?.total_recipients || 0)
                            )
                          ) : (
                            // Automatic gift selection calculation
                            ((campaignData?.budget?.maxPerGift + 12) *
                              campaignData?.total_recipients || 0)
                          )}
                        </span>
                      </div>
                      {/* <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Shipping & Handling
                        </span>
                        <span className="text-base font-semibold">
                          $
                          {(giftDetails?.handlingCost +
                            giftDetails?.shippingCost) *
                            campaignData?.total_recipients || 0}
                        </span>
                      </div> */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Credits Used
                        </span>
                        <span className="text-base font-semibold">
                          0 credits
                        </span>
                      </div>
                      <div className="pt-2.5 mt-2.5 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          Total Campaign Cost
                        </span>
                        <span className="text-base font-semibold text-primary">
                          $
                          {campaignData?.giftSelectionMode == "manual" ? (
                            giftDetails?.allGifts ? (
                              // If we have multiple gifts, use the maximum gift cost
                              (Math.max(...giftDetails.allGifts.map(gift =>
                                gift.price + gift.handlingCost + gift.shippingCost)) *
                                campaignData?.total_recipients || 0)
                            ) : (
                              // Single gift calculation (backward compatibility)
                              ((giftDetails?.price +
                                giftDetails?.handlingCost +
                                giftDetails?.shippingCost) *
                                campaignData?.total_recipients || 0)
                            )
                          ) : (
                            // Automatic gift selection calculation
                            ((campaignData?.budget?.maxPerGift + 12) *
                              campaignData?.total_recipients || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Status Section - Push to bottom */}
                  <div className="mt-auto">
                    {!walletLoading && walletBalance < (campaignData?.giftSelectionMode == "manual" ? (
                      giftDetails?.allGifts ? (
                        // If we have multiple gifts, use the maximum gift cost
                        (Math.max(...giftDetails.allGifts.map(gift =>
                          gift.price + gift.handlingCost + gift.shippingCost)) *
                          campaignData?.total_recipients || 0)
                      ) : (
                        // Single gift calculation (backward compatibility)
                        ((giftDetails?.price +
                          giftDetails?.handlingCost +
                          giftDetails?.shippingCost) *
                          campaignData?.total_recipients || 0)
                      )
                    ) : (
                      // Automatic gift selection calculation
                      ((campaignData?.budget?.maxPerGift + 12) *
                        campaignData?.total_recipients || 0)
                    )) && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                              Wallet Balance
                            </h4>
                            <span className="text-lg font-semibold text-gray-900">
                              ${walletBalance}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Required Amount
                              </span>
                              <span className="text-base font-semibold">
                                $
                                {campaignData?.giftSelectionMode == "manual" ? (
                                  giftDetails?.allGifts ? (
                                    // If we have multiple gifts, use the maximum gift cost
                                    (Math.max(...giftDetails.allGifts.map(gift =>
                                      gift.price + gift.handlingCost + gift.shippingCost)) *
                                      campaignData?.total_recipients || 0)
                                  ) : (
                                    // Single gift calculation (backward compatibility)
                                    ((giftDetails?.price +
                                      giftDetails?.handlingCost +
                                      giftDetails?.shippingCost) *
                                      campaignData?.total_recipients || 0)
                                  )
                                ) : (
                                  // Automatic gift selection calculation
                                  ((campaignData?.budget?.maxPerGift + 12) *
                                    campaignData?.total_recipients || 0)
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Difference
                              </span>
                              <span className="text-base font-semibold text-red-600">
                                ${(() => {
                                  const totalCost = campaignData?.giftSelectionMode === "manual" ? (
                                    giftDetails?.allGifts ? (
                                      // If we have multiple gifts, use the maximum gift cost
                                      (Math.max(...giftDetails.allGifts.map(gift =>
                                        gift.price + gift.handlingCost + gift.shippingCost)) *
                                        campaignData?.total_recipients || 0)
                                    ) : (
                                      // Single gift calculation (backward compatibility)
                                      ((giftDetails?.price +
                                        giftDetails?.handlingCost +
                                        giftDetails?.shippingCost) *
                                        campaignData?.total_recipients || 0)
                                    )
                                  ) : (
                                    // Automatic gift selection calculation
                                    ((campaignData?.budget?.maxPerGift + 12) *
                                      campaignData?.total_recipients || 0)
                                  );

                                  console.log('Final calculation details:', {
                                    walletBalance,
                                    totalCost,
                                    difference: walletBalance - totalCost,
                                    giftSelectionMode: campaignData?.giftSelectionMode,
                                    totalRecipients: campaignData?.total_recipients,
                                    hasMultipleGifts: !!giftDetails?.allGifts
                                  });

                                  return Math.abs(walletBalance - totalCost).toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {showAddWallet ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-grow">
                            <input
                              type="number"
                              min="100"
                              step="100"
                              value={newWalletAmount}
                              onChange={(e) =>
                                setNewWalletAmount(
                                  parseInt(e.target.value) || 500
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              placeholder="Enter amount"
                            />
                          </div>
                          <Button
                            onClick={handleAddFundClick}
                            className="flex items-center space-x-2 text-white"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add to Wallet</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowAddWallet(false)}
                            className="text-gray-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!walletLoading && Number(walletBalance) < (campaignData?.giftSelectionMode === "manual" ? (
                          giftDetails?.allGifts ? (
                            // If we have multiple gifts, use the maximum gift cost
                            (Math.max(...giftDetails.allGifts.map(gift =>
                              gift.price + gift.handlingCost + gift.shippingCost)) *
                              campaignData?.total_recipients || 0)
                          ) : (
                            // Single gift calculation (backward compatibility)
                            ((giftDetails?.price +
                              giftDetails?.handlingCost +
                              giftDetails?.shippingCost) *
                              campaignData?.total_recipients || 0)
                          )
                        ) : (
                          // Automatic gift selection calculation
                          ((campaignData?.budget?.maxPerGift + 12) *
                            campaignData?.total_recipients || 0))) && (
                          <Button
                            onClick={handleAddFundClick}
                            className="w-full text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Funds to Wallet
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {campaignData?.status === "draft" || campaignLaunchSuccessfully ? (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex space-x-4">
                <Link
                  href={`/campaigns`}
                  className="text-primary text-sm font-medium px-3 grid place-items-center border border-primary rounded-md hover:bg-primary hover:text-white"
                >
                  Save as Draft
                </Link>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    (typeof walletBalance === 'number' && walletBalance <
                    (campaignData?.giftSelectionMode === "manual" ?
                      (giftDetails?.allGifts ? (
                        // If we have multiple gifts, use the maximum gift cost
                        (Math.max(...giftDetails.allGifts.map(gift =>
                          gift.price + gift.handlingCost + gift.shippingCost)) *
                          campaignData?.total_recipients || 0)
                      ) : (
                        // Single gift calculation (backward compatibility)
                        ((giftDetails?.price +
                          giftDetails?.handlingCost +
                          giftDetails?.shippingCost) *
                          campaignData?.total_recipients || 0)
                      )) :
                      // Automatic gift selection calculation
                      ((campaignData?.budget?.maxPerGift + 12) *
                        campaignData?.total_recipients || 0)))
                  }
                  className="flex items-center text-white"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4"
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
                      {campaignData?.giftSelectionMode === "manual" ? (
                        "Launching..."
                      ) : (
                        "Submitting..."
                      )}
                    </>
                  ) : (
                    <>
                      {campaignData?.giftSelectionMode === "manual" ? (
                        "Launch Campaign"
                      ) : (
                        "Submit Campaign"
                      )}
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between mt-8">
              <div className="grid gap-2 place-items-end w-full">
                <Link
                  href={`/campaigns`}
                  className="text-white text-sm px-3 grid place-items-center border border-primary rounded-md bg-primary py-2 font-medium hover:bg-primary/90"
                >
                  Go to campaigns
                </Link>
                <p className="text-xs text-green-600 font-medium">
                  Campaign launched successfully!
                </p>
              </div>
            </div>
          )}

          {/* Launch Success Modal */}
          <LaunchSuccessModal
            isOpen={showSuccessModal}
            campaignData={campaignData}
            campaignName={data.name}
            eventName={data.eventDetails?.name}
            recipientCount={data.recipients?.length || 0}
            onClose={closeSuccessModal}
            onViewDashboard={handleViewDashboard}
            onCreateNewCampaign={handleCreateNewCampaign}
            onReturnToEvent={handleReturnToEvent}
          />

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
                  <Button
                    onClick={handleAmountSubmit}
                    className="flex-1 text-white"
                  >
                    Continue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAmountInput(false);
                      setAmount("");
                    }}
                  >
                    Cancel
                  </Button>
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
        </>
      )}
    </div>
  );
};

export default Summary;
