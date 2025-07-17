"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  Sparkles,
  Mail,
  Phone,
  Home,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import { config } from "@/utils/config";

interface TrackingData {
  draftVCardId: string;
  status:
    | "order_confirm"
    | "card_production"
    | "out_for_delivery"
    | "delivered"
    | "activated"
    | "failed";
  estimatedDelivery: string;
  trackingNumber?: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
    date: string;
    time: string;
    completed: boolean;
  }>;
}

const TrackingStep = ({
  icon: Icon,
  title,
  description,
  date,
  time,
  status,
  isLast = false,
}: {
  icon: any;
  title: string;
  description: string;
  date?: string;
  time?: string;
  status: "completed" | "current" | "upcoming";
  isLast?: boolean;
}) => (
  <div className="flex items-start gap-4">
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          status === "completed"
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
            : status === "current"
            ? "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white animate-pulse"
            : "bg-gray-200 text-gray-400"
        }`}
      >
        {status === "completed" ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
      {!isLast && (
        <div
          className={`w-1 h-16 mt-2 rounded-full transition-all duration-300 ${
            status === "completed" ? "bg-green-500" : "bg-gray-200"
          }`}
        />
      )}
    </div>
    <div className="flex-1 pb-8">
      <h3
        className={`font-semibold text-lg ${
          status === "completed"
            ? "text-green-600"
            : status === "current"
            ? "text-[#7C3AED]"
            : "text-gray-400"
        }`}
      >
        {title}
      </h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
      {date && time && (
        <div className="flex items-center gap-2 mt-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">
            {date} at {time}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default function VCardTrackingPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId: draftVCardId } = use(params);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (draftVCardId) {
      fetchTrackingData(draftVCardId);
    }
  }, [draftVCardId]);

  const fetchTrackingData = async (draft_vcardId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the draft VCard data using the draft_vcardId
      const response = await fetch(
        `${config.BACKEND_URL}/v1/vcard/draft/${draft_vcardId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `VCard order not found. Please check your tracking link.\n\nNote: The tracking ID should be a draft_vcardId (UUID format like: 123e4567-e89b-12d3-a456-426614174000).\nReceived: ${draft_vcardId}`
          );
        }
        throw new Error("Failed to fetch tracking information");
      }

      const apiData = await response.json();

      if (!apiData.success) {
        throw new Error(
          apiData.error_message || "Failed to fetch tracking information"
        );
      }

      const draftVCard = apiData.data;

      // Map backend status to frontend status and determine timeline completion
      const backendStatus = draftVCard.status?.status || "order_confirm";
      const statusDates = draftVCard.status || {};

      // Define the correct order of statuses
      const statusOrder = [
        "order_confirm",
        "card_production",
        "out_for_delivery",
        "delivered",
        "activated",
      ];
      const currentStatusIndex = statusOrder.indexOf(backendStatus);

      // Create timeline based on actual backend data with proper completion logic
      const timeline = [
        {
          status: "Order Confirmed",
          description: "Your order has been received and is being processed",
          timestamp: statusDates.order_confirm_date
            ? new Date(statusDates.order_confirm_date).toLocaleDateString() +
              ", " +
              new Date(statusDates.order_confirm_date).toLocaleTimeString()
            : "",
          date: statusDates.order_confirm_date
            ? new Date(statusDates.order_confirm_date).toLocaleDateString()
            : "",
          time: statusDates.order_confirm_date
            ? new Date(statusDates.order_confirm_date).toLocaleTimeString()
            : "",
          completed: currentStatusIndex > 0, // Completed if we've moved past order_confirm
        },
        {
          status: "Card Production",
          description: "Your NFC card is being crafted with premium materials",
          timestamp: statusDates.card_production_date
            ? new Date(statusDates.card_production_date).toLocaleDateString() +
              ", " +
              new Date(statusDates.card_production_date).toLocaleTimeString()
            : currentStatusIndex > 1
            ? "Completed"
            : "", // Show "Completed" if skipped but status is ahead
          date: statusDates.card_production_date
            ? new Date(statusDates.card_production_date).toLocaleDateString()
            : currentStatusIndex > 1
            ? "Completed"
            : "",
          time: statusDates.card_production_date
            ? new Date(statusDates.card_production_date).toLocaleTimeString()
            : "",
          completed: currentStatusIndex > 1, // Completed if we've moved past card_production
        },
        {
          status: "Out for Delivery",
          description: "Your package is on its way to you",
          timestamp: statusDates.out_for_delivery_date
            ? new Date(statusDates.out_for_delivery_date).toLocaleDateString() +
              ", " +
              new Date(statusDates.out_for_delivery_date).toLocaleTimeString()
            : "",
          date: statusDates.out_for_delivery_date
            ? new Date(statusDates.out_for_delivery_date).toLocaleDateString()
            : "",
          time: statusDates.out_for_delivery_date
            ? new Date(statusDates.out_for_delivery_date).toLocaleTimeString()
            : "",
          completed: currentStatusIndex > 2, // Completed if we've moved past out_for_delivery
        },
        {
          status: "Delivered",
          description: "Package delivered successfully",
          timestamp: statusDates.delivered_date
            ? new Date(statusDates.delivered_date).toLocaleDateString() +
              ", " +
              new Date(statusDates.delivered_date).toLocaleTimeString()
            : "",
          date: statusDates.delivered_date
            ? new Date(statusDates.delivered_date).toLocaleDateString()
            : "",
          time: statusDates.delivered_date
            ? new Date(statusDates.delivered_date).toLocaleTimeString()
            : "",
          completed: currentStatusIndex > 3, // Completed if we've moved past delivered
        },
        {
          status: "Activated",
          description: "You've activated your Delight Card",
          timestamp: statusDates.activated_date
            ? new Date(statusDates.activated_date).toLocaleDateString() +
              ", " +
              new Date(statusDates.activated_date).toLocaleTimeString()
            : "",
          date: statusDates.activated_date
            ? new Date(statusDates.activated_date).toLocaleDateString()
            : "",
          time: statusDates.activated_date
            ? new Date(statusDates.activated_date).toLocaleTimeString()
            : "",
          completed: backendStatus === "activated",
        },
      ];

      // Handle shipping address - Use embedded data only (no API calls)
      let shippingAddress = {
        name: draftVCard.fullName || "Customer",
        address: "Address will be updated when available",
        city: "City",
        zipCode: "ZIP",
        country: "Country",
      };

      // Check if shipping info is directly embedded in draftVCard
      if (draftVCard.shippingAddress) {
        const embedded = draftVCard.shippingAddress;
        shippingAddress = {
          name:
            embedded.fullName ||
            embedded.name ||
            draftVCard.fullName ||
            "Customer",
          address: `${embedded.addressLine1 || embedded.address || ""}${
            embedded.addressLine2 ? ", " + embedded.addressLine2 : ""
          }`.trim(),
          city: embedded.city || "City",
          zipCode: embedded.postalCode || embedded.zipCode || "ZIP",
          country: embedded.country || "Country",
        };
      }
      // Check if shipping info is in the shipping subdocument
      else if (draftVCard.shipping) {
        const shipping = draftVCard.shipping;
        shippingAddress = {
          name:
            shipping.fullName ||
            shipping.name ||
            draftVCard.fullName ||
            "Customer",
          address: `${shipping.addressLine1 || shipping.address || ""}${
            shipping.addressLine2 ? ", " + shipping.addressLine2 : ""
          }`.trim(),
          city: shipping.city || "City",
          zipCode: shipping.postalCode || shipping.zipCode || "ZIP",
          country: shipping.country || "Country",
        };
      }
      // If we have shippingId but no embedded data, show fallback message
      else if (draftVCard.shippingId) {
        // Show that shipping address exists but needs backend fix to display
        shippingAddress = {
          name: draftVCard.fullName || "Customer",
          address: "Shipping address confirmed",
          city: "Address on file",
          zipCode: "✓ Confirmed",
          country: "✓ On File",
        };
      }

      // Clean up address formatting
      if (
        shippingAddress.address &&
        shippingAddress.address !== "Address will be updated when available"
      ) {
        // Remove any empty leading/trailing parts
        shippingAddress.address = shippingAddress.address
          .replace(/^,\s*|,\s*$/g, "")
          .trim();
        if (!shippingAddress.address) {
          shippingAddress.address = "Address will be updated when available";
        }
      }

      // Calculate estimated delivery date (order confirmation + 7 days)
      let estimatedDelivery = "TBD";
      if (statusDates.order_confirm_date) {
        const orderDate = new Date(statusDates.order_confirm_date);
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(orderDate.getDate() + 7);

        // Format as "July 15, 2025" style
        estimatedDelivery = deliveryDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      // Create tracking data
      const trackingData: TrackingData = {
        draftVCardId: draftVCard.draft_vcardId,
        status: backendStatus,
        estimatedDelivery,
        trackingNumber: "DL" + draftVCard.draft_vcardId.slice(-8).toUpperCase(),
        shippingAddress,
        timeline,
      };

      setTrackingData(trackingData);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tracking information"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingNumber = async () => {
    if (trackingData?.trackingNumber) {
      try {
        await navigator.clipboard.writeText(trackingData.trackingNumber);
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activated":
        return "from-[#7C3AED] to-[#A855F7]"; // Brand purple for activation success
      case "delivered":
        return "from-green-500 to-green-600"; // Green for delivery success
      case "out_for_delivery":
        return "from-[#7C3AED] to-[#A855F7]"; // Brand purple for in transit
      case "card_production":
        return "from-[#7C3AED] to-[#A855F7]"; // Brand purple for production
      case "failed":
        return "from-red-500 to-red-600"; // Red for errors
      default: // order_confirm
        return "from-[#7C3AED] to-[#A855F7]"; // Brand purple for initial status
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "activated":
        return "Activated";
      case "delivered":
        return "Delivered";
      case "out_for_delivery":
        return "Out for Delivery";
      case "card_production":
        return "In Production";
      case "failed":
        return "Failed";
      default: // order_confirm
        return "Processing";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-red-500 text-2xl">❌</div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Tracking Information Not Found
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">
            {error || "Unable to load tracking information"}
          </p>

          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF]">
      <div className="max-w-md mx-auto min-h-screen">
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative pt-6 pb-4 px-6">
            <div className="text-center pt-6 pb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Track Your Order
              </h1>
              <p className="text-gray-600">
                Order #{trackingData.draftVCardId.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Status Card */}
          <div className="px-6 mb-6">
            <div
              className={`bg-gradient-to-r ${getStatusColor(
                trackingData.status
              )} rounded-2xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {getStatusText(trackingData.status)}
                  </h2>
                  <p className="text-white/80">
                    Expected delivery: {trackingData.estimatedDelivery}
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {trackingData.status === "activated" ? (
                    <CreditCard className="w-8 h-8" />
                  ) : trackingData.status === "delivered" ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : trackingData.status === "out_for_delivery" ? (
                    <Truck className="w-8 h-8" />
                  ) : (
                    <Package className="w-8 h-8" />
                  )}
                </div>
              </div>

              {trackingData.trackingNumber && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">
                        Tracking Number
                      </p>
                      <p className="text-white font-mono text-lg">
                        {trackingData.trackingNumber}
                      </p>
                    </div>
                    <Button
                      onClick={copyTrackingNumber}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 p-2"
                    >
                      {copiedTracking ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Shipping Address
                </h3>
              </div>
              <div className="text-gray-600">
                <p className="font-medium">
                  {trackingData.shippingAddress.name}
                </p>
                <p>{trackingData.shippingAddress.address}</p>
                <p>
                  {trackingData.shippingAddress.city},{" "}
                  {trackingData.shippingAddress.zipCode}
                </p>
                <p>{trackingData.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-lg mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#7C3AED]" />
                Order Timeline
              </h3>

              <div className="space-y-1">
                {trackingData.timeline.map((step, index) => {
                  const isLast = index === trackingData.timeline.length - 1;

                  // Determine step status based on current backend status and step completion
                  let stepStatus: "completed" | "current" | "upcoming";

                  if (step.completed) {
                    stepStatus = "completed";
                  } else {
                    // Find the current active step based on backend status
                    const statusMap = {
                      order_confirm: 0,
                      card_production: 1,
                      out_for_delivery: 2,
                      delivered: 3,
                      activated: 4,
                    };

                    const currentStatusIndex =
                      statusMap[
                        trackingData.status as keyof typeof statusMap
                      ] || 0;

                    if (index === currentStatusIndex) {
                      stepStatus = "current"; // This will get the purple color
                    } else {
                      stepStatus = "upcoming";
                    }
                  }

                  const getStepIcon = (stepStatus: string) => {
                    switch (stepStatus) {
                      case "Order Confirmed":
                        return CheckCircle;
                      case "Card Production":
                        return Package;
                      case "Out for Delivery":
                        return Truck;
                      case "Delivered":
                        return MapPin;
                      case "Activated":
                        return CreditCard;
                      default:
                        return CheckCircle;
                    }
                  };

                  return (
                    <TrackingStep
                      key={index}
                      icon={getStepIcon(step.status)}
                      title={step.status}
                      description={step.description}
                      date={step.date}
                      time={step.time}
                      status={stepStatus}
                      isLast={isLast}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="px-6 pb-8">
            <div className="bg-gradient-to-r from-[#7C3AED]/5 to-[#A855F7]/5 border border-[#7C3AED]/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-[#7C3AED]" />
                <h3 className="font-semibold text-gray-900 text-lg">
                  Need Help?
                </h3>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#7C3AED] rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    You'll receive email updates when your order status changes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#7C3AED] rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Once delivered, tap your card on any phone to activate it
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    window.open("mailto:harsha@delightloop.com", "_blank")
                  }
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button
                  onClick={() => window.open("tel:+91 9844363776", "_blank")}
                  className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </Button>
              </div>
            </div>
          </div>

          {/* Powered by DelightLoop */}
          <div className="text-center pb-8">
            <p className="text-gray-400 text-sm">Powered by Delightloop</p>
          </div>
        </div>
      </div>
    </div>
  );
}
