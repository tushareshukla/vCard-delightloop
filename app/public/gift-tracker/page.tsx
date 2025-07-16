"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowUpRight,
  Gift,
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
} from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

// Update the Animations component to include font imports and scroll reveal animation
const Animations = () => {
  useEffect(() => {
    const styleEl = document.createElement("style")

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
    `

    document.head.appendChild(styleEl)

    return () => {
      document.head.removeChild(styleEl)
    }
  }, [])

  return null
}

// Add a ScrollReveal component to handle scroll animations
function ScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      root: null, // use viewport as root
      rootMargin: "0px",
      threshold: 0.15, // trigger when 15% of the element is visible
    }

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed")
          // Once revealed, stop observing to avoid re-triggering
          observer.unobserve(entry.target)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, observerOptions)

    // Select all elements with the scroll-reveal class
    const elements = document.querySelectorAll(".scroll-reveal")
    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
      observer.disconnect()
    }
  }, [])

  return null
}

// Simple Button component if you don't have it
const Button = ({ children, className = "", variant = "default", size = "default", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  }

  const sizeClasses = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// Card components
const Card = ({ className = "", children, ...props }) => {
  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardContent = ({ className = "", children, ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Badge component
const Badge = ({ className = "", variant = "default", children, ...props }) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"

  const variantClasses = {
    default: "border-transparent bg-primary text-white hover:bg-opacity-80",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "border-gray-200 text-gray-900 hover:bg-gray-100",
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}

// Avatar components
const Avatar = ({ className = "", children, ...props }) => {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
      {children}
    </div>
  )
}

// PageLoadAnimation Component
function PageLoadAnimation() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

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
  )
}

// MobileSwipeHint Component
function MobileSwipeHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg animate-pulse sm:hidden z-50 backdrop-blur-sm">
      <ChevronLeft className="h-4 w-4 animate-bounce-x" />
      <span>Swipe to see all steps</span>
      <ChevronRight className="h-4 w-4 animate-bounce-x" />
    </div>
  )
}

// StickyStatusHeader Component
function StickyStatusHeader() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header after scrolling past 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-violet-100 shadow-sm py-2 px-4 z-50 sm:hidden animate-slide-in-top">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-violet-100 to-violet-200 p-1.5 rounded-full">
            <Truck className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-sm font-medium">Premium Coffee Set</span>
        </div>
        <Badge className="bg-gradient-to-r from-violet-600 to-violet-500 hover:bg-violet-700 text-[10px]">
          In Transit
        </Badge>
      </div>
    </div>
  )
}

// ContactFooter Component
function ContactFooter() {
  return (
    <Card className="bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 transform transition-all duration-500 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 mr-1.5 sm:mr-2" />
              <h3 className="text-sm sm:text-base font-medium">Need help? Contact Delightloop</h3>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Email Sarah</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>LinkedIn</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center hover:bg-violet-50 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Help</span>
                <ExternalLink className="ml-1.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          </div>

          {/* Marketing actions - with prioritized CTA */}
          <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-1 sm:mt-2">
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Marketing Actions</h3>

            {/* Primary action */}
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs text-white sm:text-sm h-9 mb-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-white" />
              Schedule Follow-up
            </Button>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs sm:text-sm h-8 sm:h-9 transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100"
              >
                <Database className="h-3.5 w-3.5 mr-1.5" />
                Add to CRM
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs sm:text-sm h-8 sm:h-9 transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Update DeliveryDetails to accept props
function DeliveryDetails({ giftData }: { giftData: GiftTrackingResponse['data'] }) {
  return (
    <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 p-4 sm:p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold">Delivery Information</h2>
          </div>
          <div className="h-7 sm:h-8 w-14 sm:w-16 bg-white rounded-md shadow-sm flex items-center justify-center border border-gray-100 hover:shadow transition-all duration-300">
            {giftData.shippingInfo.carrier ? (
              <img
                src={`/img/${giftData.shippingInfo.carrier.toLowerCase()}.svg`}
                alt={giftData.shippingInfo.carrier}
                className="h-3 sm:h-4 object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">Carrier</span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 pt-3 sm:pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded-lg border border-gray-100 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
            <p className="text-sm sm:text-base font-medium">
              {giftData.shippingInfo.trackingId || (
                <span className="text-gray-400">Pending</span>
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-2.5 rounded-lg border border-violet-100 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-sm">
            <p className="text-xs text-gray-500 mb-1">
              {giftData.status.toLowerCase() === "delivered" ? "Delivered On" : "Estimated Delivery"}
            </p>
            <p className="text-sm sm:text-base font-medium text-violet-700">
              {giftData.expectedDeliveryDate ? (
                <>
                  {new Date(giftData.expectedDeliveryDate).toLocaleDateString()}
                  {giftData.status.toLowerCase() !== "delivered" && (
                    <span className="text-xs ml-1">
                      ({Math.ceil((new Date(giftData.expectedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-violet-400">To be determined</span>
              )}
            </p>
          </div>
        </div>

        <a
          href={giftData.shippingInfo.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="default"
            className="w-full text-xs text-white sm:text-sm h-9 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            disabled={!giftData.shippingInfo.trackingUrl}
          >
            Track via Carrier <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}

// Update GiftSummaryCard to accept props
function GiftSummaryCard({ giftData }: { giftData: GiftTrackingResponse['data'] }) {
  return (
    <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
      <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600 p-4 sm:p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="h-32 w-32 text-white" />
        </div>
        <div className="flex flex-col relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 fill-white" />
            <h2 className="text-lg sm:text-xl font-semibold">Recipient & Gift Summary</h2>
          </div>
          <Badge
            variant="secondary"
            className="bg-white/20 backdrop-blur-sm text-white border-white/10 text-xs hover:bg-white/30 transition-colors duration-300 w-fit"
          >
            Campaign: {giftData.parent.name}
          </Badge>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Gift Info - 7 columns on desktop, now on the left */}
          <div className="md:col-span-7 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 order-2 md:order-1">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Full-width image on mobile */}
              <div className="w-full sm:w-1/3 aspect-square sm:aspect-auto sm:h-32 bg-white rounded-lg border overflow-hidden flex items-center justify-center shadow-sm group">
                <img
                  src={giftData.gift.primaryImgUrl}
                  alt={giftData.gift.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-base sm:text-lg">{giftData.gift.name}</h3>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 text-xs"
                  >
                    ${giftData.gift.price.toFixed(2)}
                  </Badge>
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
                  {giftData.gift.descShort}
                </p>
              </div>
            </div>
          </div>

          {/* Recipient Info - 5 columns on desktop, now on the right */}
          <div className="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-l border-gray-100 bg-gradient-to-br from-white to-gray-50 order-1 md:order-2">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-violet-200 shadow-sm">
                <div className="bg-gradient-to-br from-violet-100 to-violet-200 text-violet-600 h-full w-full flex items-center justify-center text-base sm:text-lg font-semibold">
                  {giftData.firstName[0]}{giftData.lastName[0]}
                </div>
              </Avatar>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">{giftData.firstName} {giftData.lastName}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {giftData.mailId}
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {giftData.address && giftData.address.line1 ? (
                <div className="flex items-center gap-2.5 transform transition-all duration-300 hover:translate-x-1">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  <span>
                    {giftData.address.line1[0]}{'*'.repeat(5)}
                    {giftData.address.country && `, ${giftData.address.country}`}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-2.5 transform transition-all duration-300 hover:translate-x-1">
                <User className="h-4 w-4 text-violet-500" />
                <div className="flex flex-col">
                  <div>
                    <span className="text-gray-500">Sent By:</span> {giftData.parent.createdBy.firstName} {giftData.parent.createdBy.lastName}
                  </div>
                  <span className="text-xs text-gray-400">{giftData.parent.createdBy.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Update the GiftStepper component to fix the progress bar
function GiftStepper({ giftData }: { giftData: GiftTrackingResponse['data'] }) {
  // Mock data for the stepper
  const stepperData = {
    giftId: giftData._id,
    currentStep: getStepFromStatus(giftData.status),
    steps: [
      {
        id: 1,
        name: giftData.status === "Awaiting Address Confirmation" ? "Awaiting Address Confirmation" : "Address Confirmed",
        icon: giftData.status === "Awaiting Address Confirmation" ? Package : CheckCheck,
        details: giftData.status === "Awaiting Address Confirmation"
          ? `We've sent an email to ${giftData.mailId} to collect the delivery address. Once confirmed, we'll begin processing your gift.`
          : "Recipient address verified and confirmed for delivery.",
        location: giftData.status === "Awaiting Address Confirmation" ? "" :
          (giftData.address.city && giftData.address.state ?
            `${giftData.address.city}, ${giftData.address.state}` :
            "Pending Address"),
      },
      {
        id: 2,
        name: "Processing",
        icon: Package,
        details: "Your gift will be packaged and prepared for shipping.",
        location: giftData.status === "Awaiting Address Confirmation" ? "" : "Delightloop Fulfillment Center",
      },
      {
        id: 3,
        name: "In Transit",
        icon: Truck,
        details: `Your ${giftData.gift.name} will be on its way to the recipient.`,
        location: giftData.status === "Awaiting Address Confirmation" ? "" :
          (giftData.shippingInfo.carrier ?
            `${giftData.shippingInfo.carrier} Facility` :
            "Shipping Facility"),
      },
      {
        id: 4,
        name: "Delivered",
        icon: CheckCircle2,
        details: giftData.status.toLowerCase() === "delivered"
          ? "Your gift has been successfully delivered to the recipient. We're waiting for their acknowledgment."
          : "Your gift will be delivered to the recipient's address.",
        location: giftData.status.toLowerCase() === "delivered"
          ? "Awaiting Acknowledgment"
          : "Pending Delivery",
      },
      {
        id: 5,
        name: "Acknowledged",
        icon: ThumbsUp,
        details: "The recipient will acknowledge receiving your thoughtful gift.",
        location: giftData.status === "Awaiting Address Confirmation" ? "" : "Recipient's Location",
      },
    ],
  }

  const [activeStep, setActiveStep] = useState(stepperData.currentStep)
  const progressRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate progress percentage based on current step
  const progressPercentage = ((stepperData.currentStep - 1) / (stepperData.steps.length - 1)) * 100

  useEffect(() => {
    // Set initial animation state
    setIsAnimating(true)

    // Reset animation state after animation completes
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleStepClick = (stepId) => {
    setActiveStep(stepId)
  }

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleNextStep = () => {
    if (activeStep < stepperData.steps.length) {
      setActiveStep(activeStep + 1)
    }
  }

  const activeStepData = stepperData.steps.find((step) => step.id === activeStep) || stepperData.steps[0]

  // Helper function to determine step status
  const getStepStatus = (step) => {
    if (step.id < stepperData.currentStep) return "completed"
    if (step.id === stepperData.currentStep) return "current"
    return "upcoming"
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6 transform transition-all duration-500 hover:shadow-md">
      <h2 className="text-lg font-semibold mb-4 sm:mb-6 flex items-center">
        Gift Tracking
        <Badge className="ml-2 bg-gradient-to-r from-violet-400 to-violet-500 text-white hover:from-violet-500 hover:to-violet-600 text-[10px] shadow-sm">
          <span className="mr-1">ID</span>
          <span className="font-mono bg-white/20 px-1 rounded">{stepperData.giftId}</span>
        </Badge>
      </h2>

      {/* Horizontal stepper - optimized for mobile with touch interaction */}
      <div className="relative mb-6 sm:mb-8">
        {/* Desktop stepper */}
        <div className="hidden sm:flex items-center justify-between relative">
          {/* Steps */}
          {stepperData.steps.map((step, index) => {
            const status = getStepStatus(step)
            const StepIcon = step.icon

            return (
              <div
                key={step.id}
                className="flex flex-col items-center z-10 cursor-pointer transition-all duration-500 ease-in-out hover:opacity-90 group relative"
                style={{
                  width: '20%',
                  transform: index === 0 ? 'translateY(0)' : 'translateY(-4px)'
                }}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-all duration-500 ease-in-out
                    ${
                      status === "completed"
                        ? "bg-violet-500 text-white"
                        : status === "current"
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }
                    ${step.id === activeStep ? "ring-4 ring-violet-100" : ""}
                    ${status === "current" ? "animate-ripple" : ""}
                    transform group-hover:scale-110 shadow-sm`}
                >
                  <StepIcon className={`h-6 w-6 ${status === "current" ? "animate-float-rotate" : ""}`} />
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
                </div>
              </div>
            )
          })}

          {/* Connecting lines between steps */}
          {stepperData.steps.map((_, index) => {
            // Skip last step
            if (index === stepperData.steps.length - 1) return null;

            return (
              <div
                key={`line-${index}`}
                className={`absolute h-[1px]
                  ${getStepFromStatus(giftData.status) > index + 1 ? 'bg-violet-500' : 'bg-gray-200'}`}
                style={{
                  left: `calc(${(index * 20)}% + 60px)`,
                  right: `calc(${80 - ((index + 1) * 20)}% + 60px)`,
                  top: index === 0 ? '24px' : '20px'
                }}
              />
            );
          })}
        </div>

        {/* Mobile stepper */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevStep}
              disabled={activeStep === 1}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-40 transition-all duration-300 active:scale-95 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-violet-600">{activeStepData.name}</p>
            </div>

            <button
              onClick={handleNextStep}
              disabled={activeStep === stepperData.steps.length}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-40 transition-all duration-300 active:scale-95 shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative h-10 mb-4">
            {/* Mobile connecting lines */}
            {stepperData.steps.map((_, index) => {
              // Skip last step
              if (index === stepperData.steps.length - 1) return null;

              return (
                <div
                  key={`line-${index}`}
                  className={`absolute top-1/2 -translate-y-1/2 h-[1px]
                    ${getStepFromStatus(giftData.status) > index + 1 ? 'bg-violet-500' : 'bg-gray-200'}`}
                  style={{
                    left: `calc(${(index * 20)}% + 35px)`,
                    right: `calc(${80 - ((index + 1) * 20)}% + 35px)`,
                    transform: 'translateY(0)'  // Ensure no vertical offset
                  }}
                />
              );
            })}

            {/* Step icons */}
            {stepperData.steps.map((step, index) => {
              const status = getStepStatus(step)
              const StepIcon = step.icon

              return (
                <div
                  key={step.id}
                  className="absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ease-in-out"
                  style={{
                    left: `${index * 25}%`,
                    transform: 'translateY(-50%)'  // Keep vertical centering consistent
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ease-in-out
                      ${
                        status === "completed"
                          ? "bg-violet-500 text-white"
                          : status === "current"
                            ? "bg-violet-500 text-white"
                            : "bg-gray-100 text-gray-400"
                      }
                      ${step.id === activeStep ? "ring-2 ring-violet-100 scale-110" : ""}
                      ${status === "current" ? "animate-ripple" : ""} shadow-sm`}
                  >
                    <StepIcon className={`h-3.5 w-3.5 ${status === "current" ? "animate-float-rotate" : ""}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status details - enhanced for mobile */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3.5 sm:p-4 rounded-lg border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg flex-shrink-0 ${
              activeStep === stepperData.currentStep
                ? "bg-violet-100"
                : "bg-gray-200"
            } shadow-sm`}
          >
            <activeStepData.icon
              className={`h-5 w-5 ${activeStep === stepperData.currentStep ? "text-violet-600" : "text-gray-600"}`}
            />
          </div>
          <div>
            <p
              className={`font-medium text-sm sm:text-base ${activeStep === stepperData.currentStep ? "text-violet-600" : ""}`}
            >
              {activeStepData.name}
              {activeStepData.location && <span className="text-xs text-gray-500 ml-2">• {activeStepData.location}</span>}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{activeStepData.details}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Update PostcardPreview to accept props
function PostcardPreview({ giftData }: { giftData: GiftTrackingResponse['data'] }) {
  return (
    <Card className="overflow-hidden transform transition-all duration-500 hover:shadow-md">
      <div className="bg-gradient-to-r from-violet-500 via-violet-600 to-violet-500 p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white mr-2" />
          <h2 className="text-base sm:text-lg font-semibold text-white">Message Preview</h2>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] sm:text-xs bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
        >
          {giftData.parent.name}
        </Badge>
      </div>

      <CardContent className="p-0">
        <div className="bg-[url('/placeholder.svg?height=200&width=400')] bg-cover bg-center">
          <div className="backdrop-blur-sm backdrop-brightness-[1.02] p-4 sm:p-5 bg-gradient-to-br from-white/70 to-white/80">
            <div className="bg-white/95 p-4 sm:p-5 rounded-lg mb-3 sm:mb-4 text-gray-700 italic text-xs sm:text-sm shadow-sm border border-gray-100 relative transform transition-all duration-500 hover:shadow-md hover:scale-[1.01]">
              {/* Decorative elements with animations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"></div>
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full animate-sparkle"
                style={{ animationDelay: "1.5s" }}
              ></div>

              <p className="leading-relaxed">
                "Hi {giftData.firstName},
                <br />
                <br />
                {giftData.whyGift}
                <br />
                <br />
                Best regards,
                <br />
                {giftData.parent.createdBy.firstName} {giftData.parent.createdBy.lastName}"
              </p>
            </div>

            <div className="flex justify-end">
              <div className="h-16 sm:h-20 w-16 sm:w-20 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:rotate-3 hover:shadow-md">
                <img
                  src="/img/qr.png"
                  alt="QR Code"
                  className="h-12 sm:h-16 w-12 sm:w-16 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add getApiBaseUrl function
const getApiBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env === 'sandbox') {
    return 'https://sandbox-api.delightloop.ai';
  } else if (env === 'production') {
    return 'https://api.delightloop.ai';
  }
  return 'https://sandbox-api.delightloop.ai'; // default to development
};

// Add interface for API response
interface GiftTrackingResponse {
  status: string;
  data: {
    _id: string;
    mailId: string;
    firstName: string;
    lastName: string;
    status: string;
    ctaLink: string;
    whyGift: string;
    expectedDeliveryDate: string | null;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    shippingInfo: {
      carrier: string;
      trackingId: string;
      trackingUrl: string;
    };
    gift: {
      _id: string;
      sku: string;
      name: string;
      descShort: string;
      descFull: string;
      primaryImgUrl: string;
      price: number;
    };
    parent: {
      _id: string;
      name: string;
      parentType: string;
      createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
}

// Helper function to convert status to step number
function getStepFromStatus(status: string): number {
  switch (status.toLowerCase()) {
    case "awaiting address confirmation":
      return 1;
    case "address confirmed":
      return 2;
    case "processing":
      return 2;
    case "intransit":
      return 3;
    case "in transit":
      return 3;
    case "delivered":
      return 4;
    case "acknowledged":
      return 5;
    default:
      return 1;
  }
}

// Update the main component to fetch and use real data
export default function GiftTrackingPage() {
  const [pageLoaded, setPageLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [giftData, setGiftData] = useState<GiftTrackingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchGiftData = async () => {
      try {
        const id = searchParams.get('id')
        if (!id) {
          setError('No gift ID provided')
          setLoading(false)
          return
        }

        const baseUrl = getApiBaseUrl()
        const response = await fetch(`${baseUrl}/v1/public/track/${id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch gift data')
        }

        const data = await response.json()
        setGiftData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGiftData()

    // Set page as loaded after a short delay
    const timer = setTimeout(() => {
      setPageLoaded(true)
    }, 2000)

    // Add scroll listener for parallax effects
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [searchParams])

  if (loading) {
    return <PageLoadAnimation />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!giftData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">No Gift Found</h1>
          <p className="text-gray-500">The requested gift could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Animation component to inject all animations */}
      <Animations />

      {/* Scroll reveal observer */}
      <ScrollReveal />

      {/* Page load animation */}
      {!pageLoaded && <PageLoadAnimation />}

      {/* Sticky header for mobile */}
      <StickyStatusHeader />

      <main
        className={`container max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ${pageLoaded ? "animate-page-reveal" : "opacity-0"}`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="mb-3 sm:mb-4 w-[150px] sm:w-[180px] h-[35px] sm:h-[40px] relative">
            <Image
              src="/Logo%20Final.png"
              alt="Delightloop Logo"
              width={180}
              height={40}
              className="w-full h-auto"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-violet-700 to-violet-500 bg-clip-text text-transparent animate-scale-in">
            Track Gift Status 
          </h1>
        </div>

        {/* Gift Status Timeline - Now at the top for immediate visibility */}
        <div className="mb-8 sm:mb-10 scroll-reveal">
          <GiftStepper giftData={giftData.data} />
        </div>

        {/* Gift Summary Card */}
        <div className="mb-8 sm:mb-10 scroll-reveal">
          <GiftSummaryCard giftData={giftData.data} />
        </div>

        {/* Delivery Information */}
        <div className="mb-8 sm:mb-10 scroll-reveal">
          <DeliveryDetails giftData={giftData.data} />
        </div>

        {/* Footer CTA */}
        <Card className="mt-10 sm:mt-12 bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 overflow-hidden scroll-reveal">
          <CardContent className="p-0">
            <div className="p-4 sm:p-6 relative overflow-hidden">
              {/* Decorative element with animation */}
              <div
                className="absolute top-0 right-0 w-24 h-24 opacity-10 animate-float-rotate"
                style={{
                  transform: `translateY(${scrollY * 0.05}px) rotate(${scrollY * 0.02}deg)`,
                }}
              >
                <Gift className="w-full h-full text-violet-700" />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-violet-900">Want to send gifts like this?</h3>
                  <p className="text-sm sm:text-base text-violet-700 mt-1">
                    Join thousands of marketing teams using Delightloop
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 w-full sm:w-auto transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow text-white"
                    onClick={() => window.location.href = 'https://www.delightloop.com/bookademo'}
                  >
                    Book a Demo <ArrowUpRight className="ml-2 h-4 w-4 animate-bounce-subtle" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile swipe hint */}
        <MobileSwipeHint />
      </main>
    </div>
  )
}
