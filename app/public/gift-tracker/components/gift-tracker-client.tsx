"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Gift ,
  Truck,
  MapPin,
  Package,
  BarChart3,
  ExternalLink,
  HelpCircle,
  Linkedin,
  Mail,
  Calendar,
  Database,
  User,
  Building,
  Heart,
  CheckCircle2,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Sparkles,
  CheckCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import React from "react";

interface RecipientData {
  _id?: string;
  mailId?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  ctaLink?: string;
  whyGift?: string;
  JobTitle?: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  acknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  shippingInfo?: {
    carrier?: string;
    trackingId?: string;
    trackingUrl?: string;
  };
  gift?: {
    _id?: string;
    sku?: string;
    name?: string;
    descShort?: string;
    descFull?: string;
    primaryImgUrl?: string;
    price?: number;
  };
  parent?: {
    _id?: string;
    name?: string;
    parentType?: string;
    createdBy?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  organization?: {
    _id?: string;
    name?: string;
    image?: string;
    parentType?: string;
    createdBy?: {
      _id?: string;
    };
  };
}

// Update the Animations component to include font imports and scroll reveal animation
const Animations = () => {
  useEffect(() => {
    const styleEl = document.createElement("style");

    styleEl.textContent = `
      /* Import Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

      /* Base font styles */
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      @keyframes bounce-subtle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes bounce-x {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(3px); }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes pulse-subtle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slide-in-top {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-left {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes scale-in {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes rotate-in {
        from {
          transform: rotate(-10deg) scale(0.9);
          opacity: 0;
        }
        to {
          transform: rotate(0) scale(1);
          opacity: 1;
        }
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
        }
        50% {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.8);
        }
      }

      @keyframes progress-fill {
        from { width: 0%; }
        to { width: var(--target-width, 100%); }
      }

      @keyframes sparkle {
        0%, 100% { transform: scale(0.8); opacity: 0.2; }
        50% { transform: scale(1.2); opacity: 1; }
      }

      @keyframes ripple {
        0% {
          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3);
        }
        100% {
          box-shadow: 0 0 0 20px rgba(139, 92, 246, 0);
        }
      }

      @keyframes float-rotate {
        0% { transform: translateY(0) rotate(0); }
        50% { transform: translateY(-5px) rotate(5deg); }
        100% { transform: translateY(0) rotate(0); }
      }

      @keyframes page-reveal {
        0% { opacity: 0; }
        20% { opacity: 0; }
        100% { opacity: 1; }
      }

      @keyframes scroll-reveal {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-bounce-subtle { animation: bounce-subtle 6s ease-in-out infinite; }
      .animate-bounce-x { animation: bounce-x 1.5s ease-in-out infinite; }
      .animate-shimmer { animation: shimmer 2s infinite linear; }
      .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
      .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      .animate-slide-in-top { animation: slide-in-top 0.5s ease-out forwards; }
      .animate-slide-in-left { animation: slide-in-left 0.5s ease-out forwards; }
      .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
      .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
      .animate-rotate-in { animation: rotate-in 0.5s ease-out forwards; }
      .animate-glow { animation: glow 2s infinite ease-in-out; }
      .animate-progress-fill { animation: progress-fill 1.5s ease-out forwards; }
      .animate-sparkle { animation: sparkle 2s infinite ease-in-out; }
      .animate-ripple { animation: ripple 1.5s infinite; }
      .animate-float-rotate { animation: float-rotate 8s ease-in-out infinite; }
      .animate-page-reveal { animation: page-reveal 1.2s ease-out forwards; }
      .animate-scroll-reveal { animation: scroll-reveal 0.8s ease-out forwards; }

      .delay-100 { animation-delay: 0.1s; }
      .delay-200 { animation-delay: 0.2s; }
      .delay-300 { animation-delay: 0.3s; }
      .delay-400 { animation-delay: 0.4s; }
      .delay-500 { animation-delay: 0.5s; }
      .delay-600 { animation-delay: 0.6s; }
      .delay-700 { animation-delay: 0.7s; }
      .delay-800 { animation-delay: 0.8s; }
      .delay-900 { animation-delay: 0.9s; }
      .delay-1000 { animation-delay: 1s; }
      .delay-1500 { animation-delay: 1.5s; }
      .delay-2000 { animation-delay: 2s; }

      .scroll-reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
      }

      .scroll-reveal.revealed {
        opacity: 1;
        transform: translateY(0);
      }
    `;

    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return null;
};

// Add a ScrollReveal component to handle scroll animations
function ScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      root: null, // use viewport as root
      rootMargin: "0px",
      threshold: 0.15, // trigger when 15% of the element is visible
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // Once revealed, stop observing to avoid re-triggering
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Select all elements with the scroll-reveal class
    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return null;
}

// Simple Button component if you don't have it
const Button = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };

  const sizeClasses = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Card components
const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({ className = "", children, ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Badge component
const Badge = ({ className = "", variant = "default", children, ...props }) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

  const variantClasses = {
    default: "border-transparent bg-primary text-white hover:bg-opacity-80",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "border-gray-200 text-gray-900 hover:bg-gray-100",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Avatar components
const Avatar = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Simple client-side image with fallback
const ImageWithFallback = ({ src, fallbackSrc, alt, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleError = () => {
    if (isClient && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  if (!isClient) {
    // Server-side rendering fallback
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

// PageLoadAnimation Component
function PageLoadAnimation() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full animate-pulse-subtle"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <Gift className="h-10 w-10 text-violet-600 animate-bounce-subtle" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center animate-sparkle">
            <Sparkles className="h-3 w-3 text-violet-600" />
          </div>
          <div
            className="absolute -bottom-1 -left-1 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center animate-sparkle"
            style={{ animationDelay: "0.5s" }}
          >
            <Sparkles className="h-3 w-3 text-violet-600" />
          </div>
        </div>
        <p className="text-lg font-semibold bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent animate-pulse-subtle">
          Loading Gift Tracker...
        </p>
      </div>
    </div>
  );
}

// MobileSwipeHint Component
function MobileSwipeHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg animate-pulse sm:hidden z-50 backdrop-blur-sm">
      <ChevronLeft className="h-4 w-4 animate-bounce-x" />
      <span>Swipe to see all steps</span>
      <ChevronRight className="h-4 w-4 animate-bounce-x" />
    </div>
  );
}

// StickyStatusHeader Component
function StickyStatusHeader({ giftName, status }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header after scrolling past 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-violet-100 shadow-sm py-2 px-4 z-50 sm:hidden animate-slide-in-top">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-violet-100 to-violet-200 p-1.5 rounded-full">
            <Truck className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-sm font-medium">{giftName}</span>
        </div>
        <Badge className="bg-gradient-to-r from-violet-600 to-violet-500 hover:bg-violet-700 text-[10px]">
          {status}
        </Badge>
      </div>
    </div>
  );
}

// ContactFooter Component
// function ContactFooter() {
//   return (
//     <Card className="bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 transform transition-all duration-500 hover:shadow-md">
//       <CardContent className="p-4 sm:p-5">
//         <div className="flex flex-col space-y-4">
//           <div className="flex flex-col sm:flex-row items-center justify-between">
//             <div className="flex items-center mb-4 sm:mb-0">
//               <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 mr-1.5 sm:mr-2" />
//               <h3 className="text-sm sm:text-base font-medium">
//                 Need help? Contact Delightloop
//               </h3>
//             </div>

//             <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
//               >
//                 <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                 <span>Email Sarah</span>
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
//               >
//                 <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                 <span>LinkedIn</span>
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
//               >
//                 <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                 <span>Help</span>
//                 <ExternalLink className="ml-1.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
//               </Button>
//             </div>
//           </div>

//           {/* Marketing actions - with prioritized CTA */}
//           <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-1 sm:mt-2">
//             <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">
//               Marketing Actions
//             </h3>

//             {/* Primary action */}
//             <Button
//               variant="default"
//               size="sm"
//               className="w-full text-xs text-white sm:text-sm h-9 mb-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
//             >
//               <Calendar className="h-3.5 w-3.5 mr-1.5 text-white" />
//               Schedule Follow-up
//             </Button>

//             {/* Secondary actions */}
//             <div className="grid grid-cols-2 gap-2 sm:gap-3">
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 className="w-full text-xs sm:text-sm h-8 sm:h-9 transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100"
//               >
//                 <Database className="h-3.5 w-3.5 mr-1.5" />
//                 Add to CRM
//               </Button>
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 className="w-full text-xs sm:text-sm h-8 sm:h-9 transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100"
//               >
//                 <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
//                 View Analytics
//               </Button>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// DeliveryDetails Component
function DeliveryDetailsWithAPI({ trackingData, recipient }) {
  // Check if we have a valid date to display
  const hasValidDeliveryDate =
    trackingData.deliveryDate &&
    !isNaN(new Date(trackingData.deliveryDate).getTime());

  const hasValidExpectedDeliveryDate =
    trackingData.expectedDeliveryDate &&
    !isNaN(new Date(trackingData.expectedDeliveryDate).getTime());

  // Format date properly or show pending message
  const formatDeliveryDate = () => {
    if (hasValidDeliveryDate) {
      return new Date(trackingData.deliveryDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } else if (hasValidExpectedDeliveryDate) {
      return new Date(trackingData.expectedDeliveryDate).toLocaleString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }
      );
    } else {
      return "To be determined";
    }
  };

  return (
    <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
      {/* Card header remains the same */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 p-4 sm:p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold">
              Delivery Information
            </h2>
          </div>
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-violet-50 to-violet-100 text-violet-700 border-violet-200 text-xs font-medium px-3 py-1 h-7 sm:h-8"
          >
            {trackingData.carrier || "Carrier"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 pt-3 sm:pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded-lg border border-gray-100 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
            <p className="text-sm sm:text-base font-medium">
              {trackingData.trackingId || (
                <span className="text-gray-400">Pending</span>
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded-lg border border-gray-100 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Last Updated</p>
            <p className="text-sm sm:text-base font-medium">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-2.5 rounded-lg border border-violet-100 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-sm">
            <p className="text-xs text-gray-500 mb-1">
              {hasValidDeliveryDate ? "Delivered On" : "Estimated Delivery"}
            </p>
            <p className="text-sm sm:text-base font-medium text-violet-700">
              {formatDeliveryDate()}
            </p>
          </div>
        </div>

        {/* Rest of the component remains the same */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="w-full sm:w-auto">
            <Button
              variant="default"
              className="w-full sm:w-auto text-xs text-white sm:text-sm h-9 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
              onClick={() =>
                window.open(
                  trackingData.trackingUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              disabled={!trackingData.trackingUrl || !trackingData.trackingId}
            >
              Track via Carrier <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
          {/* <Button
            variant="outline"
            className="flex-1 text-xs sm:text-sm h-9 hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            View Campaign Details
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
}

// GiftSummaryCard Component
function GiftSummaryCardWithAPI({ gift, recipient, sender, campaignName, organization, campaignData }: {
  gift: any;
  recipient: any;
  sender: any;
  campaignName: any;
  organization?: any;
  campaignData?: any;
}) {
  return (
    <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
      <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600 p-4 sm:p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="h-32 w-32 text-white" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 relative z-10">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 flex items-center">
            <Heart className="h-4 w-4 mr-2 fill-white" />
            Recipient & Gift Summary
          </h2>
          <div className="flex flex-wrap gap-2">
           {/*  <Badge
              variant="secondary"
              className="bg-white/20 backdrop-blur-sm text-white border-white/10 text-xs hover:bg-white/30 transition-colors duration-300"
            >
              Campaign: {campaignName}
            </Badge>
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-violet-400/50 to-violet-300/50 backdrop-blur-sm text-white border-violet-400/30 text-xs hover:bg-violet-500/70 transition-colors duration-300 shadow-sm"
            >
              <span className="mr-1">Gift</span>
              <span className="font-mono bg-white/20 px-1 rounded text-[10px]">
                #{gift.giftId}
              </span>
            </Badge> */}
          </div>
        </div>

        {/* Added emotional design element */}
        {/* <p className="text-xs text-violet-100 mt-1 relative z-10">
          You're brightening someone's day with this thoughtful gift!
        </p> */}
      </div>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Recipient Info - 5 columns on desktop */}
          <div className="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-gray-100 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-violet-200 shadow-sm">
                <div className="bg-gradient-to-br from-violet-100 to-violet-200 text-violet-600 h-full w-full flex items-center justify-center text-base sm:text-lg font-semibold">
                  {recipient.firstName.charAt(0)}
                </div>
              </Avatar>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">
                  {recipient.firstName} {recipient.lastName}
                </h3>
                <p className="text-gray-500 text-sm flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  {recipient.jobTitle}
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 transform transition-all duration-300 hover:translate-x-1">
                <Mail className="h-4 w-4 text-violet-500" />
                <span>{recipient.email}</span>
              </div>
              <div className="flex items-center gap-2.5 transform transition-all duration-300 hover:translate-x-1">
                <User className="h-4 w-4 text-violet-500" />
                <div>
                  <span className="text-gray-500">Sent By:</span>{" "}
                  {sender.firstName} {sender.lastName}
                </div>
              </div>

              {/* Organization Logo Section */}
              {/* <div className="flex items-center gap-2.5 transform transition-all duration-300 hover:translate-x-1 mt-3 pt-3 border-t border-gray-100">
                <Building className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    From:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-32 h-8 sm:w-32 sm:h-8 overflow-hidden  flex items-center justify-center shadow-sm border border-gray-200">
                      <ImageWithFallback
                        src={organization?.image}
                        fallbackSrc="/Logo%20Final.png"
                        alt={organization?.name || "Delightloop"}
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>

                    {organization?.name && organization.name !== "Delightloop" && (
                      <span className="text-xs text-gray-600 font-medium">
                        {organization.name}
                      </span>
                    )}
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Gift Info - 7 columns on desktop */}
          <div className="md:col-span-7 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className={`flex flex-col sm:flex-row gap-4 items-start ${campaignData?.giftSelectionMode === "manual" && campaignData?.giftCatalogs[0]?.selectedGift.length !== 1 ? "" : "hidden"}`}>
              {/* Full-width image on mobile */}
              <div className="w-full sm:w-1/3 aspect-square sm:aspect-auto sm:h-32 bg-white rounded-lg border overflow-hidden flex items-center justify-center shadow-sm group">
                <ImageWithFallback
                  src={gift.imageUrl}
                  fallbackSrc="/img/Tshirts.png"
                  alt={gift.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {gift.name}
                  </h3>
                {/*   <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 text-xs"
                  >
                    ${gift.price.toFixed(2)}
                  </Badge> */}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-violet-50 to-violet-100 text-violet-700 border-violet-200 text-xs"
                  >
                    <Gift className="h-3 w-3 mr-1" /> Physical Gift
                  </Badge>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-gray-600">
                  {gift.description}
                </p>

                {/* <div className="flex mt-3 sm:mt-4">
                  <Button
                    className="w-full text-xs text-white sm:text-sm h-8 sm:h-9 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
                    variant="default"
                    size="sm"
                  >
                    Send Follow-up
                  </Button>
                </div> */}
              </div>
            </div>
            <div className={`flex flex-col sm:flex-row gap-4 items-start ${campaignData?.giftSelectionMode === "manual" && campaignData?.giftCatalogs[0]?.selectedGift.length !== 1 ? "hidden" : ""}`}>
              {/* Full-width image on mobile */}
              <div className="w-full sm:w-1/3 aspect-square sm:aspect-auto sm:h-32 bg-white rounded-lg border overflow-hidden flex items-center justify-center shadow-sm group">

                <Gift className="h-full w-full text-violet-600 animate-bounce-subtle" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between  items-start">
                  <h3 className="font-semibold text-base mt-2 sm:text-lg">
                  A Little Delight for You
                  </h3>
                {/*   <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 text-xs"
                  >
                    ${gift.price.toFixed(2)}
                  </Badge> */}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-600">
                Arriving soon!
                </p>





                {/* <div className="flex mt-3 sm:mt-4">
                  <Button
                    className="w-full text-xs text-white sm:text-sm h-8 sm:h-9 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
                    variant="default"
                    size="sm"
                  >
                    Send Follow-up
                  </Button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Update the GiftStepper component to fix the progress bar
function GiftStepperWithAPI({ trackingData, recipient }) {
  const isAwaitingAddress = trackingData.isAwaitingAddress;

  // Create steps based on tracking data
  const steps = [
    {
      id: 1,
      name: isAwaitingAddress ? "Awaiting Address" : "Address Confirmed",
      icon: CheckCheck,
      date: isAwaitingAddress
        ? "Pending"
        : new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      details: isAwaitingAddress
        ? `Waiting for ${recipient.firstName} to confirm their delivery address.`
        : `${recipient.firstName}'s address verified and confirmed for delivery.`,
      location: isAwaitingAddress
        ? "Pending"
        : recipient.address?.city && recipient.address?.state
        ? `${recipient.address.city}, ${recipient.address.state}`
        : "Location pending",
    },
    {
      id: 2,
      name: "Processing",
      icon: Package,
      date: "",
      details: isAwaitingAddress
        ? `Your gift will be packaged and prepared for shipping once address is confirmed.`
        : `Your gift has been packaged and is being prepared for shipping.`,
      location: "Delightloop Fulfillment Center",
    },
    {
      id: 3,
      name: "In Transit",
      icon: Truck,
      date: "",
      details: isAwaitingAddress
        ? `Your gift will be shipped to ${recipient.firstName} after processing.`
        : `Your gift is on its way to ${recipient.firstName}.`,
      location: "",
    },
    {
      id: 4,
      name: "Delivered",
      icon: CheckCircle2,
      date: recipient.deliveryDate
        ? new Date(recipient.deliveryDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      details: recipient.deliveryDate
        ? `Your gift has been successfully delivered to ${recipient.firstName}'s address.`
        : `Your gift will be delivered to ${recipient.firstName}'s address.`,
      location:
        recipient.address?.city && recipient.address?.state
          ? `${recipient.address.city}, ${recipient.address.state}`
          : "Delivery location pending",
    },
    {
      id: 5,
      name: "Acknowledged",
      icon: ThumbsUp,
      date: recipient.acknowledgedAt
        ? new Date(recipient.acknowledgedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      details: recipient.acknowledgedAt
        ? `${recipient.firstName} acknowledged the gift – delight delivered!`
        : `${recipient.firstName} will acknowledge receiving your thoughtful gift.`,
      location: "",
    },
  ];

  // Helper function to determine step status
  const getStepStatus = (step) => {
    if (isAwaitingAddress) {
      if (step.id === 1) return "current";
      return "upcoming";
    }

    if (step.id < trackingData.currentStep) return "completed";
    if (step.id === trackingData.currentStep) return "current";
    return "upcoming";
  };

  // Calculate progress percentage
  const progressPercentage = isAwaitingAddress
    ? 0
    : ((trackingData.currentStep - 1) / (steps.length - 1)) * 100;

  const [activeStep, setActiveStep] = useState(
    isAwaitingAddress ? 1 : trackingData.currentStep
  );
  const progressRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Set initial animation state
    setIsAnimating(true);

    // Reset animation state after animation completes
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Removed click handlers - steps are now non-interactive
  // const handleStepClick = (stepId) => {
  //   setActiveStep(stepId);
  // };

  // const handlePrevStep = () => {
  //   if (activeStep > 1) {
  //     setActiveStep(activeStep - 1);
  //   }
  // };

  // const handleNextStep = () => {
  //   if (activeStep < steps.length) {
  //     setActiveStep(activeStep + 1);
  //   }
  // };

  const activeStepData =
    steps.find((step) => step.id === activeStep) || steps[0];

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6 transform transition-all duration-500 hover:shadow-md">
      <h2 className="text-lg font-semibold mb-4 sm:mb-6 flex items-center">
        Gift Tracking
        {/* <Badge className="ml-2 bg-gradient-to-r from-violet-400 to-violet-500 text-white hover:from-violet-500 hover:to-violet-600 text-[10px] shadow-sm">
          <span className="mr-1">ID</span>
          <span className="font-mono bg-white/20 px-1 rounded">
            {trackingData.giftId}
          </span>
        </Badge> */}
      </h2>

      {/* Horizontal stepper - optimized for mobile with touch interaction */}
      <div className="relative mb-6 sm:mb-8">
        {/* Desktop stepper */}
        <div className="hidden sm:flex items-center justify-between relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const StepIcon = step.icon;
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center z-10 transition-all duration-500 ease-in-out"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-all duration-500 ease-in-out
                    ${
                      status === "completed"
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                        : status === "current"
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                        : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400"
                    }
                    ${
                      step.id === activeStep ? "ring-4 ring-violet-200/50" : ""
                    }
                    ${status === "current" ? "animate-ripple" : ""}
                    transform group-hover:scale-110 shadow-sm`}
                >
                  <StepIcon
                    className={`h-6 w-6 ${
                      status === "current" ? "animate-float-rotate" : ""
                    }`}
                  />

                  {/* Add a small star decoration for the current step */}
                  {status === "current" && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-medium transition-colors duration-500
                      ${
                        step.id === activeStep
                          ? "text-violet-600"
                          : status === "current"
                          ? "text-violet-600"
                          : "text-gray-700"
                      } group-hover:text-violet-600`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.date}</p>
                </div>
              </div>
            );
          })}

          {/* Connecting lines with improved gradient and animation - FIXED to be thinner and properly positioned */}
          <div className="absolute top-6 left-[6%] w-[88%] h-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full -z-0 overflow-hidden">
            <div
              ref={progressRef}
              className={`h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full relative overflow-hidden ${
                isAnimating ? "animate-progress-fill" : ""
              }`}
              style={
                {
                  width: isAnimating ? "0%" : `${progressPercentage}%`,
                  ["--target-width" as any]: `${progressPercentage}%`,
                } as React.CSSProperties
              }
            >
              {/* Add shimmer effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Mobile stepper - simplified without navigation */}
        <div className="sm:hidden">
          <div className="flex items-center justify-center mb-3">
            <div className="text-center">
              <p className="text-sm font-medium text-violet-600">
                {activeStepData.name}
              </p>
              <p className="text-xs text-gray-500">{activeStepData.date}</p>
            </div>
          </div>

          <div className="relative h-10 mb-4">
            {/* Progress bar with gradient and animation - FIXED to be thinner and properly positioned */}
            <div className="absolute top-1/2 left-[6%] -translate-y-1/2 w-[88%] h-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full"></div>
            <div
              className={`absolute top-1/2 left-[6%] -translate-y-1/2 h-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500 ease-in-out overflow-hidden ${
                isAnimating ? "animate-progress-fill" : ""
              }`}
              style={
                {
                  width: isAnimating ? "0%" : `${progressPercentage}%`,
                  ["--target-width" as any]: `${progressPercentage}%`,
                } as React.CSSProperties
              }
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>

            {/* Step icons with improved animations */}
            {steps.map((step, index) => {
              const status = getStepStatus(step);
              const StepIcon = step.icon;
              const isFirst = index === 0;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.id}
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3.5 transition-all duration-300 ease-in-out`}
                  style={{
                    left: `${6 + (index / (steps.length - 1)) * 88}%`,
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ease-in-out
                      ${
                        status === "completed"
                          ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                          : status === "current"
                          ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                          : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400"
                      }
                      ${
                        step.id === activeStep
                          ? "ring-2 ring-violet-200/70 scale-110"
                          : ""
                      }
                      ${
                        status === "current" ? "animate-ripple" : ""
                      } shadow-sm`}
                  >
                    <StepIcon
                      className={`h-3.5 w-3.5 ${
                        status === "current" ? "animate-float-rotate" : ""
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status details - enhanced for mobile */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3.5 sm:p-4 rounded-lg border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg flex-shrink-0 ${
              activeStep === trackingData.currentStep
                ? "bg-gradient-to-br from-violet-100 to-violet-200"
                : "bg-gradient-to-br from-gray-100 to-gray-200"
            } shadow-sm`}
          >
            <activeStepData.icon
              className={`h-5 w-5 ${
                activeStep === trackingData.currentStep
                  ? "text-violet-600"
                  : "text-gray-600"
              }`}
            />
          </div>
          <div>
            <p
              className={`font-medium text-sm sm:text-base ${
                activeStep === trackingData.currentStep ? "text-violet-600" : ""
              }`}
            >
              {activeStepData.name}
              {activeStepData.location && (
                <span className="text-xs text-gray-500 ml-2">
                  • {activeStepData.location}
                </span>
              )}
            </p>
            {/* <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {activeStepData.details}
            </p> */}

            {/* Estimated delivery info */}
            {activeStep === 3 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Estimated Delivery:</p>
                  <p className="text-xs font-medium text-violet-600">
                    {new Date(
                      trackingData.expectedDeliveryDate
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// PostcardPreview Component
// function PostcardPreviewWithAPI({ message, recipient, sender, campaignName }) {
//   return (
//     <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
//       <div className="bg-gradient-to-r from-violet-500 via-violet-600 to-violet-500 p-3 sm:p-4 flex items-center justify-between">
//         <div className="flex items-center">
//           <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2" />
//           <h2 className="text-base sm:text-lg font-semibold text-white">
//             Message Preview
//           </h2>
//         </div>
//         <Badge
//           variant="outline"
//           className="text-[10px] sm:text-xs bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
//         >
//           {campaignName}
//         </Badge>
//       </div>

//       <CardContent className="p-0">
//         <div className="bg-[url('/placeholder.svg?height=200&width=400')] bg-cover bg-center">
//           <div className="backdrop-blur-sm backdrop-brightness-[1.02] p-4 sm:p-5 bg-gradient-to-br from-white/70 to-white/80">
//             <div className="bg-white/95 p-4 sm:p-5 rounded-lg mb-3 sm:mb-4 text-gray-700 italic text-xs sm:text-sm shadow-sm border border-gray-100 relative transform transition-all duration-500 hover:shadow-md hover:scale-[1.01]">
//               {/* Decorative elements with animations */}
//               <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"></div>
//               <div
//                 className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
//                 style={{ animationDelay: "0.5s" }}
//               ></div>
//               <div
//                 className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
//                 style={{ animationDelay: "1s" }}
//               ></div>
//               <div
//                 className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
//                 style={{ animationDelay: "1.5s" }}
//               ></div>

//               <p className="leading-relaxed">
//                 {message}
//                 <br />
//                 <br />
//                 Best regards,
//                 <br />
//                 {sender.firstName}
//               </p>
//             </div>

//             <div className="flex justify-end">
//               <div className="h-16 sm:h-20 w-16 sm:w-20 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:rotate-3 hover:shadow-md">
//                 <img
//                   src="/img/qr.png"
//                   alt="QR Code"
//                   className="h-12 sm:h-16 w-12 sm:w-16 object-contain"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// The client component which receives data from the server component
export function GiftTrackerClientComponent({
  recipientData,
}: {
  recipientData: RecipientData;
}) {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 2000);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Map API data to required component formats
  const giftData = {
    giftId: recipientData?.gift?._id || "Unknown",
    name: recipientData?.gift?.name || "Premium Gift Box",
    description:
      recipientData?.gift?.descShort || "A premium selection of gifts",
    price: recipientData?.gift?.price || 65,
    imageUrl: recipientData?.gift?.primaryImgUrl || "/img/Tshirts.png",
  };

  // Apply the same status logic as gifting activities page
  const rawStatus = recipientData?.status || "Processing";
  const hasEmptyAddress =
    !recipientData?.address?.line1 ||
    recipientData?.address?.line1.trim() === "";

  // Determine the display status using the same logic as gifting activities
  const status =
    rawStatus === "GiftSelected" && hasEmptyAddress
      ? "Awaiting Address Confirmation"
      : rawStatus === "GiftSelected"
      ? "Address Confirmed"
      : rawStatus === "OrderPlaced"
      ? "Order Placed"
      : rawStatus === "InTransit"
      ? "In Transit"
      : rawStatus || "Processing";

  const isAwaitingAddress = rawStatus === "GiftSelected" && hasEmptyAddress;

  // Map the delivery status - calculated based on recipient status
  const currentStep = isAwaitingAddress
    ? 1 // If awaiting address, we're at step 1
    : status === "Acknowledged"
    ? 5
    : status === "Delivered"
    ? 4
    : status === "InTransit" || status === "In Transit"
    ? 3
    : status === "Order Placed" || rawStatus === "OrderPlaced"
    ? 2
    : rawStatus === "GiftSelected" && !hasEmptyAddress
    ? 2 // Address confirmed, move to processing
    : 1;

  // Create tracking data from API data
  const trackingData = {
    giftId: `DL-${recipientData?._id?.substring(0, 5) || "00000"}`,
    currentStep: currentStep,
    trackingId: recipientData?.shippingInfo?.trackingId || "",
    carrier: recipientData?.shippingInfo?.carrier || "",
    trackingUrl: recipientData?.shippingInfo?.trackingUrl || "#",
    expectedDeliveryDate: recipientData?.expectedDeliveryDate || null,
    deliveryDate: recipientData?.deliveryDate || null,
    isAwaitingAddress: isAwaitingAddress,
  };

  // Map recipient data with actual values from API
  const recipient = {
    firstName: recipientData?.firstName || "Recipient",
    lastName: recipientData?.lastName || "",
    email: recipientData?.mailId || "recipient@example.com",
    jobTitle: "Customer",
    message: recipientData?.whyGift || "Thank you for your business!",
    status: status, // Use the computed display status
    address: {
      city: recipientData?.address?.city || "",
      state: recipientData?.address?.state || "",
      country: recipientData?.address?.country || "",
    },
    deliveryDate: recipientData?.deliveryDate || null,
    acknowledgedAt: recipientData?.acknowledgedAt || null,
  };

  // Map sender data from parent campaign data
  const sender = {
    firstName: recipientData?.parent?.createdBy?.firstName || "Sender",
    lastName: recipientData?.parent?.createdBy?.lastName || "",
    email: recipientData?.parent?.createdBy?.email || "sender@company.com",
    jobTitle: "Representative",
    company: recipientData?.parent?.name || "Company",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Animation component to inject all animations */}
      <Animations />

      {/* Scroll reveal observer */}
      <ScrollReveal />

      {/* Page load animation */}
      {!pageLoaded && <PageLoadAnimation />}

      {/* Display API data for debugging */}
      {/* <div className="fixed top-2 right-2 z-50 bg-black text-white p-2 rounded text-xs max-w-xs overflow-auto max-h-48">
        <p className="font-bold mb-1">API Data:</p>
        <pre>{JSON.stringify(recipientData, null, 2)}</pre>
      </div> */}

      {/* Sticky header for mobile */}
      <StickyStatusHeader
        giftName={giftData.name}
        status={status} // Use the computed display status
      />

      <main
        className={`container max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ${
          pageLoaded ? "animate-page-reveal" : "opacity-0"
        }`}
      >

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="mb-3 sm:mb-4 w-[150px] sm:w-[180px] h-[35px] sm:h-[40px] relative">
            <ImageWithFallback
              src={recipientData?.organization?.image}
              fallbackSrc="/Logo%20Final.png"
              alt={recipientData?.organization?.name || "Delightloop"}
              width={180}
              height={40}
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent animate-scale-in pt-2">
            Track Gift Status
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-2 animate-fade-in delay-200">
            Real-time update of your sent gift
          </p>

          {/* Added personalization element */}
          <p className="text-xs text-violet-600 mt-1 animate-fade-in delay-500 flex items-center gap-1.5">
           {/*  <Sparkles className="h-3 w-3 animate-sparkle" />
            Hello, {sender.firstName}! Your gift to {recipient.firstName} is{" "}
            {isAwaitingAddress
              ? "waiting for address confirmation"
              : status.toLowerCase()}
            .
            <Sparkles
              className="h-3 w-3 animate-sparkle"
              style={{ animationDelay: "0.5s" }}
            /> */}
          </p>
        </div>

        {/* Gift Status Timeline - Now at the top for immediate visibility */}
        <div className="mb-8 sm:mb-10 scroll-reveal">
          <GiftStepperWithAPI
            trackingData={trackingData}
            recipient={recipient}
          />
        </div>


        <div className="mb-8 sm:mb-10 scroll-reveal">
          <GiftSummaryCardWithAPI
            gift={giftData}
            recipient={recipient}
            sender={sender}
            campaignName={recipientData?.parent?.name || "Gift Campaign"}
            organization={recipientData?.organization}
            campaignData={recipientData?.parent}
          />
        </div>

        {/* Delivery Details */}
        <div className="mb-8 sm:mb-10 scroll-reveal">
          <DeliveryDetailsWithAPI
            trackingData={trackingData}
            recipient={recipient}
          />
        </div>

        {/* Message Preview */}
        {/* <div className="mb-8 sm:mb-10 scroll-reveal">
          <PostcardPreviewWithAPI
            message={recipient.message}
            recipient={recipient}
            sender={sender}
            campaignName={recipientData?.parent?.name || "Gift Campaign"}
          />
        </div> */}

        {/* Contact/Follow-up */}
        {/* <div className="scroll-reveal">
          <ContactFooter />
        </div> */}

        {/* Footer CTA */}
        <Card className="mt-10 sm:mt-12 bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 overflow-hidden scroll-reveal">
          <CardContent className="p-0">
            <div className="p-4 sm:p-6 relative overflow-hidden">
              {/* Decorative element with animation */}
              <div
                className="absolute top-0 right-0 w-24 h-24 opacity-10 animate-float-rotate"
                style={{
                  transform: `translateY(${scrollY * 0.05}px) rotate(${
                    scrollY * 0.02
                  }deg)`,
                }}
              >
                <Gift className="w-full h-full text-violet-700" />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-violet-900">
                    Want to send gifts like this?
                  </h3>
                  <p className="text-sm sm:text-base text-violet-700 mt-1">
                    Join thousands of marketing teams using Delightloop
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* <Button className="bg-white text-violet-700 hover:bg-violet-100 border border-violet-300 w-full sm:w-auto transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow">
                    Start for Free
                  </Button> */}
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 w-full sm:w-auto transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow text-white"
                    onClick={() =>
                      window.open(
                        "https://www.delightloop.com/bookademo",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Book a Demo{" "}
                    <ArrowUpRight className="ml-2 h-4 w-4 animate-bounce-subtle" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile swipe hint removed - steps are no longer interactive */}
      </main>
    </div>
  );
}
