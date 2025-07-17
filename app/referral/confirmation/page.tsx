"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Check,
  ArrowLeft,
  Sparkles,
  Clock,
  Package,
  MapPin,
  Smartphone,
} from "lucide-react";
import confetti from "canvas-confetti";
import InfinityLoader from "@/components/common/InfinityLoader";

interface OrderData {
  draftId: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

// Custom Timeline Step Component
const TimelineStep = ({
  icon: Icon,
  title,
  description,
  status,
  stepIndex,
  isLast = false,
  isVisible = false,
  lineProgress = 0,
}: {
  icon: any;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  stepIndex: number;
  isLast?: boolean;
  isVisible?: boolean;
  lineProgress?: number;
}) => {
  // Different meaningful colors for each step
  const stepColors = [
    {
      bg: "from-green-500 to-green-600",
      text: "text-green-600",
      line: "bg-gradient-to-b from-green-500 to-green-400",
    }, // Success/Order
    {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
      line: "bg-gradient-to-b from-blue-500 to-blue-400",
    }, // Shipping/Travel
    {
      bg: "from-orange-500 to-orange-600",
      text: "text-orange-600",
      line: "bg-gradient-to-b from-orange-500 to-orange-400",
    }, // Action/Tap
    {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
      line: "bg-gradient-to-b from-purple-500 to-purple-400",
    }, // Magic/Claim
  ];

  const currentColor = stepColors[stepIndex] || stepColors[0];

  return (
    <div className="flex items-start gap-4 transition-all duration-700 ease-out">
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-700 ease-out transform ${
            status === "completed"
              ? `bg-gradient-to-r ${currentColor.bg} text-white scale-100`
              : status === "current"
              ? `bg-gradient-to-r ${currentColor.bg} text-white animate-pulse scale-110 shadow-xl`
              : isVisible
              ? `bg-gradient-to-r ${currentColor.bg} text-white scale-100`
              : "bg-gray-200 text-gray-400 scale-90"
          }`}
        >
          {status === "completed" ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Icon
              className={`w-6 h-6 transition-all duration-700 ${
                isVisible || status === "current" ? "scale-100" : "scale-80"
              }`}
            />
          )}
        </div>
        {!isLast && (
          <div className="relative w-1 h-16 mt-2">
            {/* Background line (thicker gray for visibility) */}
            <div className="absolute inset-0 bg-gray-300 rounded-full w-1"></div>
            {/* Animated progress line */}
            <div
              className="absolute top-0 left-0 w-1 rounded-full transition-all duration-1000 ease-out"
              style={{
                height: `${Math.min(100, Math.max(0, lineProgress))}%`,
                background:
                  stepIndex === 0
                    ? "linear-gradient(to bottom, #10b981, #059669)" // Green
                    : stepIndex === 1
                    ? "linear-gradient(to bottom, #3b82f6, #2563eb)" // Blue
                    : stepIndex === 2
                    ? "linear-gradient(to bottom, #f97316, #ea580c)" // Orange
                    : "linear-gradient(to bottom, #8b5cf6, #7c3aed)", // Purple
                transformOrigin: "top",
              }}
            />
          </div>
        )}
      </div>
      <div className="flex-1 pb-8">
        <h3
          className={`font-semibold text-lg transition-all duration-700 ${
            status === "completed" || isVisible
              ? currentColor.text
              : "text-gray-500"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm mt-1 transition-all duration-700 ${
            status === "completed"
              ? `${currentColor.text}/80`
              : isVisible || status === "current"
              ? "text-gray-600"
              : "text-gray-500"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [timelineVisibility, setTimelineVisibility] = useState([
    true, // "We'll ship it to you" starts as current/visible
    false,
    false,
    false,
  ]);
  const [lineProgress, setLineProgress] = useState([0, 0, 0, 0]);
  const timelineRef = useRef<HTMLDivElement>(null);

  const referralVcr = searchParams?.get("vcr");
  const cardType = searchParams?.get("cardType") || "physical"; // Default to physical for backward compatibility
  const handle = searchParams?.get("handle"); // Handle for digital cards
  const draftId = searchParams?.get("draftId"); // Draft ID for vcard tracking

  // Confetti animation function
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 1000,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Left side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      // Right side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  };

  // Trigger confetti on first page load
  useEffect(() => {
    if (!confettiTriggered && !loading) {
      // Add a small delay to ensure the page has rendered
      const confettiTimeout = setTimeout(() => {
        triggerConfetti();
        setConfettiTriggered(true);
      }, 500);

      return () => clearTimeout(confettiTimeout);
    }
  }, [loading, confettiTriggered]);

  useEffect(() => {
    if (draftId) {
      // For vcard tracking, only use draftId (UUID)
      setTimeout(() => {
        // Calculate estimated delivery (today + 7 days) since we don't have order confirmation date here
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);

        const startDate = new Date(deliveryDate);
        const endDate = new Date(deliveryDate);
        endDate.setDate(startDate.getDate() + 2); // 2-day range

        const startFormatted = startDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        });
        const endFormatted = endDate.toLocaleDateString("en-US", {
          month:
            startDate.getMonth() === endDate.getMonth() ? undefined : "long",
          day: "numeric",
          year: "numeric",
        });

        const estimatedDelivery = `${startFormatted}-${endFormatted}`;

        setOrderData({
          draftId: draftId,
          trackingUrl: `${window.location.origin}/vcard/track/${draftId}`,
          estimatedDelivery,
        });
        setLoading(false);
        setIsAnimated(true);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [draftId]);

  // Scroll-based animation for timeline
  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current && isAnimated) {
        const rect = timelineRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        // Calculate scroll progress - more aggressive to complete all steps
        const scrollProgress = Math.max(
          0,
          Math.min(
            1,
            (windowHeight - elementTop + elementHeight * 0.1) /
              (windowHeight + elementHeight * 0.2)
          )
        );

        // Progressive step animation - adjusted thresholds for proper flow
        const stepThresholds = [0.1, 0.35, 0.65, 0.85]; // More spread out progression
        const newVisibility = stepThresholds.map(
          (threshold) => scrollProgress >= threshold
        );

        // Calculate line progress for each step - simplified and more visible
        const newLineProgress = [0, 0, 0, 0];

        // Step 0 line (Green): grows from 0.1 to 0.35 progress
        if (scrollProgress > 0.1) {
          newLineProgress[0] = Math.min(
            100,
            ((scrollProgress - 0.1) / 0.25) * 100
          );
        }

        // Step 1 line (Blue): grows from 0.35 to 0.65 progress
        if (scrollProgress > 0.35) {
          newLineProgress[1] = Math.min(
            100,
            ((scrollProgress - 0.35) / 0.3) * 100
          );
        }

        // Step 2 line (Orange): grows from 0.65 to 0.85 progress
        if (scrollProgress > 0.65) {
          newLineProgress[2] = Math.min(
            100,
            ((scrollProgress - 0.65) / 0.2) * 100
          );
        }

        setTimelineVisibility(newVisibility);
        setLineProgress(newLineProgress);
      }
    };

    // Initial check and scroll listener
    window.addEventListener("scroll", handleScroll);

    // Delay initial check to ensure component is mounted
    const initialCheckTimer = setTimeout(() => {
      handleScroll();
    }, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(initialCheckTimer);
    };
  }, [isAnimated]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleGoBack = () => {
    try {
      // For digital cards, navigate back to LinkedIn page instead of checkout
      // since the draft VCard is deleted after card creation
      const params = new URLSearchParams();
      if (referralVcr) params.set("vcr", referralVcr);

      // Always redirect to LinkedIn page as it's the safest fallback
      // since the draft VCard is no longer available after card creation
      router.push(`/referral/linkedin?${params.toString()}`);
    } catch (error) {
      console.error("Error navigating back:", error);
      // Fallback navigation to LinkedIn page
      router.push("/referral/linkedin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center">
        <div className="text-center">
          <InfinityLoader width={80} height={80} className="mx-auto mb-6" />
          <p className="text-gray-600 text-lg">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-32 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-ping delay-500"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen">
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden">
          {/* Header Section with Back Button */}
          <div className="relative pt-6 pb-2 px-6">
            {/* Back Button - Show for all card types */}
            <button
              onClick={handleGoBack}
              className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Header Section */}
          <div className="pt-16 pb-8 px-6 text-center">
            <div
              className={`transform transition-all duration-1000 ${
                isAnimated
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              {/* Success Animation */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse shadow-2xl"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
                {/* Celebration sparkles */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-300 shadow-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce delay-700 shadow-lg"></div>
                <div className="absolute top-2 left-2 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping delay-1000"></div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                You're In!
              </h1>
              {cardType === "digital" ? (
                <p className="text-gray-600 text-lg mb-2">
                  Your Digital Card is ready! You can now share your
                  professional profile with anyone instantly.
                </p>
              ) : (
                <>
                  <p className="text-gray-600 text-lg mb-2">
                    Your Delight Card is being crafted. Once it arrives, just
                    tap it to personalize and activate your card.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Digital Card Section */}
          {cardType === "digital" && (
            <div
              className={`px-6 mb-8 transform transition-all duration-1000 delay-300 ${
                isAnimated
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              {/* Digital Card Success Section - Matching DelightLoop Design System */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full flex items-center justify-center shadow-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      Your Digital Card is Ready!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Share your professional profile instantly with anyone
                    </p>
                  </div>
                </div>

                {/* URL Display Section with proper formatting */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-[#7C3AED]" />
                    <p className="text-sm font-semibold text-gray-700">
                      Your Digital Card URL:
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[#7C3AED] text-sm font-mono break-all leading-relaxed">
                      {(() => {
                        try {
                          // Handle different URL scenarios with proper fallbacks
                          if (handle && handle.trim()) {
                            return `${
                              window.location.origin
                            }/vcard/${handle.trim()}`;
                          } else if (referralVcr && referralVcr.trim()) {
                            return `${
                              window.location.origin
                            }/vcard/${referralVcr.trim()}`;
                          } else {
                            return `${window.location.origin}/vcard/your-card`;
                          }
                        } catch (error) {
                          console.error(
                            "Error generating digital card URL:",
                            error
                          );
                          return `${window.location.origin}/vcard/your-card`;
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Matching DelightLoop Design System */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      try {
                        let digitalUrl;
                        if (handle && handle.trim()) {
                          digitalUrl = `${
                            window.location.origin
                          }/vcard/${handle.trim()}`;
                        } else if (referralVcr && referralVcr.trim()) {
                          digitalUrl = `${
                            window.location.origin
                          }/vcard/${referralVcr.trim()}`;
                        } else {
                          digitalUrl = `${window.location.origin}/vcard/your-card`;
                        }
                        copyToClipboard(digitalUrl);
                      } catch (error) {
                        console.error("Error copying URL:", error);
                      }
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl py-3 font-medium transition-all duration-200 hover:shadow-md"
                  >
                    {copiedTracking ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      try {
                        let digitalUrl;
                        if (handle && handle.trim()) {
                          digitalUrl = `${
                            window.location.origin
                          }/vcard/${handle.trim()}`;
                        } else if (referralVcr && referralVcr.trim()) {
                          digitalUrl = `${
                            window.location.origin
                          }/vcard/${referralVcr.trim()}`;
                        } else {
                          digitalUrl = `${window.location.origin}/vcard/your-card`;
                        }
                        window.open(digitalUrl, "_blank");
                      } catch (error) {
                        console.error("Error opening digital card:", error);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white rounded-xl py-3 font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] transform"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Card
                  </Button>
                </div>

                {/* Additional Features Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#7C3AED]/5 to-[#A855F7]/5 rounded-xl border border-[#7C3AED]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        What's Next?
                      </h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        <li>
                          • Share your card link via text, email, or social
                          media
                        </li>
                        <li>
                          • Update your profile anytime from your dashboard
                        </li>
                        <li>• Track who views your card and when</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Physical Card Journey - Only show for physical cards */}
          {cardType === "physical" && (
            <>
              {/* Timeline Section */}
              <div
                ref={timelineRef}
                className={`px-6 mb-8 transform transition-all duration-1000 delay-300 ${
                  isAnimated
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-3xl p-6 border border-gray-200/50">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                    Your Journey
                  </h2>

                  <div className="space-y-1">
                    <TimelineStep
                      icon={Package}
                      title="You ordered your card"
                      description="Your order has been received and is being processed"
                      status="completed"
                      stepIndex={0}
                      isVisible={true} // Always visible since it's completed
                      lineProgress={lineProgress[0]}
                    />
                    <TimelineStep
                      icon={MapPin}
                      title="We'll ship it to you"
                      description="Your NFC card will be crafted and shipped within 5-7 days"
                      status={timelineVisibility[0] ? "current" : "upcoming"} // Start as current step
                      stepIndex={1}
                      isVisible={timelineVisibility[0]} // Control visibility with scroll
                      lineProgress={lineProgress[1]}
                    />
                    <TimelineStep
                      icon={Smartphone}
                      title="Tap it on your phone"
                      description="Once delivered, simply tap your card on any phone"
                      status={
                        timelineVisibility[1] && !timelineVisibility[2]
                          ? "current"
                          : timelineVisibility[1]
                          ? "completed"
                          : "upcoming"
                      }
                      stepIndex={2}
                      isVisible={timelineVisibility[1]}
                      lineProgress={lineProgress[2]}
                    />
                    <TimelineStep
                      icon={Sparkles}
                      title="You claim it and make it yours"
                      description="Personalize and activate your card to start sharing"
                      status={
                        timelineVisibility[2] && !timelineVisibility[3]
                          ? "current"
                          : timelineVisibility[2]
                          ? "completed"
                          : "upcoming"
                      }
                      stepIndex={3}
                      isLast={true}
                      isVisible={timelineVisibility[2]}
                      lineProgress={lineProgress[3]}
                    />
                  </div>
                </div>
              </div>

              {/* Tracking Section */}
              {orderData?.trackingUrl && (
                <div
                  className={`px-6 mb-8 transform transition-all duration-1000 delay-500 ${
                    isAnimated
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                >
                  <div className="bg-white border-2 border-[#7C3AED]/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Track Your Order
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-medium">
                        Tracking URL:
                      </p>
                      <p className="text-[#7C3AED] text-sm font-mono break-all">
                        {orderData.trackingUrl}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => copyToClipboard(orderData.trackingUrl!)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      >
                        {copiedTracking ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => {
                          const trackingUrl = `${window.location.origin}/vcard/track/${draftId}`;
                          window.open(trackingUrl, "_blank");
                        }}
                        className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Track Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom Spacing */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
