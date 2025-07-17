"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Megaphone, 
  ArrowLeft, 
  HelpCircle, 
  X 
} from "lucide-react";

interface CampaignLaunchSuccessModalProps {
  isOpen: boolean;
  campaignName: string;
  eventName?: string;
  recipientCount?: number;
  onClose: () => void;
  onViewDashboard?: () => void;
  onCreateNewCampaign?: () => void;
  onReturnToEvent?: () => void;
  campaignData?: any;
  campaignId?: string;
  boothGiveawayCTALink?: string;
}

const CampaignLaunchSuccessModal: React.FC<CampaignLaunchSuccessModalProps> = ({
  isOpen,
  campaignName,
  eventName,
  recipientCount = 0,
  onClose,
  onViewDashboard,
  onCreateNewCampaign,
  onReturnToEvent,
  campaignData,
  campaignId,
  boothGiveawayCTALink,
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

  // Determine if it's a manual campaign or AI-powered
  const isManualCampaign = campaignData?.giftSelectionMode === "manual" || 
                          campaignData?.giftTypeMode === "manual_gift";

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
              Campaign {isManualCampaign ? "Launched" : "Submitted"}!
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 text-lg mb-6 text-center leading-snug">
              {isManualCampaign ? (
                <>
                  Your <span className="font-semibold">{campaignName}</span>{" "}
                  campaign
                  {eventName ? ` for ${eventName}` : ""} is now live.
                </>
              ) : (
                <>
                  We are matching Gifts for your <span className="font-semibold">{campaignName}</span> campaign.
                </>
              )}
            </p>

            {/* Booth Giveaway CTA Link */}
            {boothGiveawayCTALink && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Booth Giveaway CTA Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={boothGiveawayCTALink}
                    readOnly
                    className="flex-1 p-2 text-sm bg-white border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(boothGiveawayCTALink)}
                    className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-all text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Share this link with your booth visitors to claim their gifts.
                </p>
              </div>
            )}

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

            <div className="flex items-center justify-center mb-6">
              <HelpCircle className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-center text-gray-700 font-medium">
                What would you like to do next?
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              {/* View Campaign Details Button */}
              {onViewDashboard ? (
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
              ) : campaignId ? (
                <Link
                  href={`/campaign-details/${campaignId}`}
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
                </Link>
              ) : null}

              {/* Return to Dashboard Button */}
              <Link
                href="/manage-vcard"
                className="w-full px-4 py-3 border border-primary text-primary rounded-md hover:bg-purple-50 transition-all flex items-center justify-center group relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                aria-label="Return to dashboard"
              >
                <span className="absolute inset-0 w-full h-full bg-primary/[0.05] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                <span className="relative flex items-center">
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                  <span className="group-hover:tracking-wide transition-all duration-300">
                    Return to Dashboard
                  </span>
                </span>
              </Link>

              {/* Create New Campaign Button */}
              {/* {onCreateNewCampaign && (
                <button
                  onClick={onCreateNewCampaign}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all flex items-center justify-center group relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                  aria-label="Create new campaign"
                >
                  <span className="absolute inset-0 w-full h-full bg-gray-100/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  <span className="relative flex items-center">
                    <Megaphone className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                    <span className="group-hover:tracking-wide transition-all duration-300">
                      Create New Campaign
                    </span>
                  </span>
                </button>
              )} */}

              {/* Return to Event Button */}
              {/* {eventName && onReturnToEvent && (
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

export default CampaignLaunchSuccessModal; 