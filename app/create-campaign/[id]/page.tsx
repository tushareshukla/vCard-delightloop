"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AnimatedCampaignStepper from "@/components/create-campaign/AnimatedCampaignStepper";
import { useAuth } from "@/app/context/AuthContext";
// Import step components - we'll create these next
import CampaignMotion from "@/components/create-campaign/CampaignMotion";
import Recipients from "@/components/create-campaign/Recipients";
import RecipientExperience from "@/components/create-campaign/RecipientExperience";
import Summary from "@/components/create-campaign/Summary";

interface EventDetails {
  name: string;
  date: string;
  type: string;
  registrantCount: number;
  eventData?: string;
  id: string;
}

interface CampaignMotionProps {
  data: {
    name: string;
    description: string;
    goal: string;
    motion?: string;
    eventDetails?: EventDetails;
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
    mockEvent?: {
      // ... existing mockEvent properties
    };
  };
  onNext: (data: any) => void;
  campaignId: string;
  authToken: string;
  userId: string;
  organizationId: string;
}

// Step transition variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  }),
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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(40px);
  }
}

@keyframes slideOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-40px);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out forwards;
}

.animate-slide-out-right {
  animation: slideOutRight 0.5s ease-out forwards;
}

.animate-slide-out-left {
  animation: slideOutLeft 0.5s ease-out forwards;
}
`;

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
  // Get campaign ID from URL path parameter

  // Get event ID from URL if available

  const eventId = params.id as string;
  console.log("Event ID:", eventId);

  // Auth context states
  const [isLoading, setIsLoading] = useState(false);

  // State for current step (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // State to track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Track direction for animations
  const [direction, setDirection] = useState(0);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // State for event details (this would normally be fetched from API using eventId)
  const [eventDetails, setEventDetails] = useState<EventDetails | undefined>(
    undefined
  );

  // Add this function to check and get campaign ID from URL
  const getCampaignIdFromUrl = () => {
    const campaignIdFromUrl = searchParams.get("campaignId");
    console.log("Campaign ID from URL:", campaignIdFromUrl);
    return campaignIdFromUrl;
  };

  // Add function to update URL with campaign ID
  const addCampaignIdToUrl = (newCampaignId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("campaignId", newCampaignId);
    window.history.pushState({}, "", url.toString());
  };

  // Modify createCampaign function
  const createCampaign = async (eventData) => {
    if (!authToken || !userId || !organizationId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/users/${userId}/campaigns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name: `${eventData.name} Campaign`,
            eventId: eventData._id,
            // giftSelectionMode: "manual",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create campaign: ${response.statusText}`);
      }

      const campaignData = await response.json();
      console.log("Campaign created successfully:", campaignData);

      // Add campaign ID to URL and state
      addCampaignIdToUrl(campaignData.campaign_id);
      setCampaignId(campaignData.campaign_id);

      return campaignData;
    } catch (error) {
      console.error("Error creating campaign:", error);
      return null;
    }
  };

  // Modify fetchEventDetails function
  const fetchEventDetails = async (id: string) => {
    if (!authToken || !userId || !organizationId) return;

    // Skip event fetching if id is "1"
    if (id === "1") {
      // Check if campaign ID exists in URL
      const existingCampaignId = getCampaignIdFromUrl();

      if (existingCampaignId) {
        console.log("Using existing campaign:", existingCampaignId);
        setCampaignId(existingCampaignId);
      } else {
        // Create new campaign without event data
        console.log("Creating new campaign without event...");
        // You might need a different createCampaign function here or modify the existing one
        const now = new Date();
        const mockEventData = { name: `Untitled Campaign – ${now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})} ${now.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`
        }
        const campaign = await createCampaign(mockEventData);
        console.log("New campaign created:", campaign);
      }
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${id}`,
        {
          method: "GET",
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
      setEventDetails(data.event);

      // Check if campaign ID exists in URL
      const existingCampaignId = getCampaignIdFromUrl();

      if (existingCampaignId) {
        // Use existing campaign ID
        console.log("Using existing campaign:", existingCampaignId);
        setCampaignId(existingCampaignId);
      } else {
        // Create new campaign and add to URL
        console.log("Creating new campaign...");
        const campaign = await createCampaign(data.event);
        console.log("New campaign created:", campaign);
      }

      console.log("Event details fetched:", data.event);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  // Use this in the useEffect
  useEffect(() => {
    if (authToken && userId && organizationId) {
      console.log("Fetching event details");
      fetchEventDetails(eventId || "");
    }
  }, [authToken, userId, organizationId]);

  // Campaign data state to be passed between steps
  const [campaignData, setCampaignData] = useState({
    // Campaign Motion data
    name: "",
    description: "",
    goal: "",
    eventDetails: undefined as EventDetails | undefined,

    // Recipients data
    recipientSource: "",
    recipients: [],

    // Recipient Experience data
    giftType: "",
    message: "",
    templateId: "",

    // Budget
    budget: {
      perRecipient: 0,
      total: 0,
    },
  });

  // Update campaign data with event details when available
  useEffect(() => {
    if (eventDetails && eventId) {
      setCampaignData((prev) => ({
        ...prev,
        eventDetails: {
          ...eventDetails,
          id: eventId,
        },
        name: prev.name || `${eventDetails.name} Campaign`,
      }));
    } else if (eventDetails) {
      // Handle the case where eventId is null
      setCampaignData((prev) => ({
        ...prev,
        eventDetails: {
          ...eventDetails,
          id: "unknown", // Provide a default ID
        },
        name: prev.name || `${eventDetails.name} Campaign`,
      }));
    }
  }, [eventDetails, eventId]);

  // Mapping of step number to step ID for the stepper component
  const stepMap = {
    1: "plan",
    2: "leads",
    3: "craft",
    4: "deliver",
  };

  // Reverse mapping for navigation
  const reverseStepMap = {
    plan: 1,
    leads: 2,
    craft: 3,
    deliver: 4,
  };

  // Update completed steps when navigating forward
  useEffect(() => {
    if (!completedSteps.includes(currentStep - 1) && currentStep > 1) {
      setCompletedSteps((prev) => [...prev, currentStep - 1]);
    }
  }, [currentStep, completedSteps]);

  // State to track animation
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle step transition animation
  const handleStepAnimation = (newStep: number) => {
    setIsAnimating(true);
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // Handle stepper click
  const handleStepClick = (stepId: string) => {
    // Convert stepId to numeric step
    const targetStep = reverseStepMap[stepId];

    if (targetStep && !isAnimating) {
      // Check if we can navigate to this step
      // We can navigate if:
      // 1. It's a step we've already completed
      // 2. It's the current step
      // 3. It's the next step from the current step
      if (
        completedSteps.includes(targetStep) ||
        targetStep === currentStep ||
        targetStep === currentStep + 1
      ) {
        // Set direction and update step with animation
        handleStepAnimation(targetStep);
      }
    }
  };

  // Handle next button click
  const handleNext = (stepData: any) => {
    if (isAnimating) return;

    // Update campaign data with current step data
    setCampaignData({
      ...campaignData,
      ...stepData,
    });

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 4) {
      // Set direction and update step with animation
      handleStepAnimation(currentStep + 1);
    }
  };

  // Handle back button click
  const handleBack = () => {
    if (currentStep > 1 && !isAnimating) {
      // Set direction and update step with animation
      handleStepAnimation(currentStep - 1);
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!authToken || !userId || !organizationId || !campaignId) {
      console.error("Missing auth details or campaign ID");
      return;
    }

    // Here you would handle the API call to update the campaign
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/users/${userId}/campaigns/${campaignId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update campaign: ${response.status}`);
      }

      console.log("Campaign updated successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };
  // console.log("[Create Campaign] Campaign Data:", eventDetails);
  // console.log("[Create Campaign] Campaign ID:", eventDetails?._id);

  // Render current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignMotion
            data={{
              name: eventDetails?.name || "",
              description: eventDetails?.eventDesc || "",
              goal: `Engage with ${
                eventDetails?.targetAudience || "attendees"
              }`,
              eventDetails: eventDetails
                ? {
                    name: eventDetails.name,
                    id: eventDetails.id,
                    image: eventDetails.media.banner,
                    date: eventDetails.eventDate,
                    type: eventDetails.type,
                    location: eventDetails.location,
                    registrantCount: eventDetails.registrantCount || 0,
                    eventData: eventDetails.eventData,
                    id: eventDetails.id,
                  }
                : undefined,
            }}
            onNext={handleNext}
            campaignId={campaignId}
            authToken={authToken}
            userId={userId}
            organizationId={organizationId}
            eventId={eventId}
          />
        );
      case 2:
        return (
          <Recipients
            data={campaignData}
            onNext={handleNext}
            onBack={handleBack}
            campaignId={campaignId}
            authToken={authToken}
            userId={userId}
            organizationId={organizationId}
            eventId={eventId}
          />
        );
      case 3:
        return (
          <RecipientExperience
            data={campaignData}
            onNext={handleNext}
            onBack={handleBack}
            campaignId={campaignId}
            authToken={authToken}
            userId={userId}
            organizationId={organizationId}
            eventId={eventId}
            maxBudget={Number(campaignData.budget?.maxPerGift) || 0}
          />
        );
      case 4:
        return (
          <Summary
            data={campaignData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            campaignId={campaignId}
            authToken={authToken}
            userId={userId}
            organizationId={organizationId}
            eventId={eventId}
          />
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full">
          <div className="p-6 bg-[#F9FAFB] rounded-tl-3xl h-[100%] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading campaign...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>
        {animations}
      </style>
      <div className="flex bg-[#F9FAFB]">
        <AdminSidebar />
        <div
          className="pt-3 bg-primary w-full overflow-x-hidden animate-fade-in opacity-0"
          style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
        >
          <div className="p-6 bg-[#F9FAFB] rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden">
            {/* Header Section with Border */}
            <div
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 animate-fade-in-up opacity-0"
              style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[#667085] mb-4">
                <Link href="/dashboard">
                  <Image
                    src="/svgs/home.svg"
                    alt="Home"
                    width={18}
                    height={18}
                  />
                </Link>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#D0D5DD"
                    d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                  />
                </svg>
                <Link
                  href="/dashboard"
                  className="text-[#667085] font-medium hover:text-[#101828]"
                >
                  Campaign List
                </Link>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#D0D5DD"
                    d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                  />
                </svg>
                <span className="text-[#101828] font-medium">
                  Create Campaign
                </span>
              </div>

              {/* Page Title */}
              <h1 className="text-[28px] font-semibold text-[#1B1D21]">
                Create Campaign
              </h1>
              <p className="text-[#667085] text-xs font-medium">
                {campaignId
                  ? `Campaign ID: ${campaignId}`
                  : "Creating Campaign..."}
              </p>
            </div>

            {/* Stepper with Border */}
            <div
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 animate-fade-in-up opacity-0"
              style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
            >
              <AnimatedCampaignStepper
                currentStep={
                  stepMap[currentStep] as "plan" | "leads" | "craft" | "deliver"
                }
                onStepClick={handleStepClick}
              />
            </div>

            {/* Step Content */}
            <div
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-fade-in-up opacity-0"
              style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
            >
              <div
                key={`step-container-${currentStep}`}
                className="w-full relative"
              >
                <div
                  key={currentStep}
                  className={`w-full ${
                    direction > 0
                      ? "animate-slide-in-right"
                      : "animate-slide-in-left"
                  }`}
                >
                  {renderStep()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
