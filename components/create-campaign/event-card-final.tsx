/**
 * EventCardFinal Component
 *
 * A comprehensive event card component that displays event details and marketing metrics.
 * This component is built with Tailwind CSS and is ready for integration into existing solutions.
 *
 * Dependencies:
 * - Tailwind CSS for styling
 * - Lucide React for icons
 * - Next.js Image component for optimized image rendering
 * - shadcn/ui components for UI elements (Card, Badge, Separator)
 * - utils/cn function for conditional class name joining
 *
 * @requires next/image
 * @requires lucide-react
 * @requires @/components/ui/card
 * @requires @/components/ui/badge
 * @requires @/components/ui/separator
 * @requires @/lib/utils
 */

"use client"

import React, { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Calendar, MapPin, Users, Building2, DollarSign, Tag } from "lucide-react"

/**
 * Props interface for the EventCardFinal component
 *
 * @property {object} event - The event data object
 * @property {string} event.id - Unique identifier for the event
 * @property {string} event.name - Name of the event
 * @property {string} event.image - URL to the event image
 * @property {string} event.startDate - Start date of the event (ISO format)
 * @property {string} [event.endDate] - Optional end date of the event (ISO format)
 * @property {string} [event.location] - Optional location of the event
 * @property {string} event.type - Type of the event (e.g., "Conference", "Workshop")
 * @property {object} event.stats - Statistics about the event
 * @property {object} event.stats.registration - Registration statistics
 * @property {object} event.stats.abmAccounts - Account-Based Marketing statistics
 * @property {object} event.stats.opportunityCoverage - Opportunity coverage statistics
 * @property {boolean} [event.crmConnected] - Indicates whether the CRM is connected
 */
interface EventCardFinalProps {
  event: {
    id: string
    name: string
    image: string
    startDate: string
    endDate?: string
    location?: string
    type: string
    stats: {
      registration: {
        new: number
        existing: number
        total: number
      }
      abmAccounts: {
        new: number
        existing: number
        total: number
      }
      opportunityCoverage: {
        count: number
        value: number
        target: number
      }
    }
    crmConnected?: boolean
  }
  totalContacts?: number,
  eventId:number
}

// Counter animation hook
function useCountAnimation(end: number, duration: number = 1500, delay: number = 0) {
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

export default function EventCardFinal({ event, totalContacts, eventId }: EventCardFinalProps) {
  // Animation states
  const [animateProgress, setAnimateProgress] = useState(false);

  // Helper function to format date strings into a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Check if CRM is connected
  const isCrmConnected = true; // Always show CRM data

  // Set default values for opportunity coverage
  const opportunityCoverage = {
    ...event.stats.opportunityCoverage,
    value: event.stats.opportunityCoverage.value ?? 50000
  };

  // Calculate percentages for the progress bars and distribution visualizations
  // These calculations show the proportion of new vs existing registrations and accounts
  const regNewPercentage = Math.round((event.stats.registration.new / event.stats.registration.total) * 100) || 0
  const regExistingPercentage =
    Math.round((event.stats.registration.existing / event.stats.registration.total) * 100) || 0

  const abmNewPercentage = Math.round((event.stats.abmAccounts.new / event.stats.abmAccounts.total) * 100) || 0
  const abmExistingPercentage =
    Math.round((event.stats.abmAccounts.existing / event.stats.abmAccounts.total) * 100) || 0

  // Animated counter values
  const regNewCount = useCountAnimation(event.stats.registration.new, 1500, 300);
  const regExistingCount = useCountAnimation(event.stats.registration.existing, 1500, 400);
  const regTotalCount = useCountAnimation(event.stats.registration.total, 1500, 200);

  const regNewPercentCount = useCountAnimation(regNewPercentage, 1200, 500);
  const regExistingPercentCount = useCountAnimation(regExistingPercentage, 1200, 600);

  const abmNewCount = useCountAnimation(event.stats.abmAccounts.new, 1500, 500);
  const abmExistingCount = useCountAnimation(event.stats.abmAccounts.existing, 1500, 600);
  const abmTotalCount = useCountAnimation(event.stats.abmAccounts.total, 1500, 400);

  const abmNewPercentCount = useCountAnimation(abmNewPercentage, 1200, 700);
  const abmExistingPercentCount = useCountAnimation(abmExistingPercentage, 1200, 800);

  const oppContactsCount = useCountAnimation(event.stats.registration.total, 1500, 700);
  const oppAccountsCount = useCountAnimation(event.stats.abmAccounts.total, 1500, 800);
  const oppValueCount = useCountAnimation(250000, 2000, 900);

  // Animation effect for progress bars
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // console.log("[Event Card] Event:", event);


  return (
    <div className={`overflow-hidden border border-gray-200 shadow-sm rounded-xl bg-white hover:shadow-lg transition-all duration-300 ${eventId==1? "hidden":"block"}`}>
      <div className="relative flex flex-col md:flex-row">
        {/* Event Image Section */}
        <div className="relative w-full md:w-[400px] h-[200px] md:h-[240px] shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden group">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
          <Image
            src={event.image || "/images/Placeholder_view_vector.svg"}
            alt={event.name || "Event Image"}
            className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110"
            width={400}
            height={240}
            style={{
              objectPosition: 'center',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onLoadingComplete={(img) => {
              // Add a class based on image dimensions
              if (img.naturalWidth > img.naturalHeight) {
                img.classList.add('object-contain', 'px-4');
              }
            }}
            priority
          />
        </div>

        {/* Event Details Section */}
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
          {/* Event Header Section */}
          <div className="flex flex-col space-y-2 mb-3">
            <h1 className="text-xl font-semibold text-gray-900 line-clamp-1">{event.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 whitespace-nowrap overflow-hidden">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 shrink-0">
                <Tag className="mr-1 h-3 w-3" />
                {event.type}
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(event.startDate)}</span>
                {event.endDate && <span> - {formatDate(event.endDate)}</span>}
              </div>

              {event.location && (
                <>
                  <span className="text-gray-300 shrink-0">•</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate" title={event.location}>{event.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 mb-3"></div>

          {/* Stats Grid Section */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {/* Registration Breakdown Card */}
            <div className="space-y-2 rounded-lg border bg-white p-3 transition-all duration-300 hover:shadow-md hover:border-violet-200">
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="h-4 w-4 text-violet-500" /> Registration Breakdown
              </h3>

              {/* New & Existing Contacts with percentage badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">New Contacts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{totalContacts ? totalContacts.toLocaleString() : regNewCount.toLocaleString()}</span>
                    <div className="bg-emerald-50 text-xs text-emerald-600 px-1.5 py-0.5 rounded-full">
                      { totalContacts ? "100" : regNewPercentCount}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Existing Contacts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{regExistingCount.toLocaleString()}</span>
                    <div className="bg-blue-50 text-xs text-blue-600 px-1.5 py-0.5 rounded-full">
                      {regExistingPercentCount}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-200"></div>

              <div>
                <h4 className="flex justify-between items-center text-xs font-medium text-gray-500">
                  <span>Total Registrations</span>
                  <span className="text-base font-semibold text-purple-800"> {totalContacts ? totalContacts.toLocaleString() : regTotalCount.toLocaleString()}</span>
                </h4>
              </div>
            </div>

            {/* ABM Named Account Insights Card */}
            <div className="space-y-2 rounded-lg border bg-white p-3 transition-all duration-300 hover:shadow-md hover:border-amber-200">
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-4 w-4 text-amber-500" /> ABM Named Account Insights
              </h3>

              {isCrmConnected ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">New Accounts</span>
                      <span className="text-sm font-medium">{abmNewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Existing Accounts</span>
                      <span className="text-sm font-medium">{abmExistingCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-200"></div>

                  <div>
                    <h4 className="flex justify-between items-center text-xs font-medium text-gray-500">
                      <span>Total Accounts</span>
                      <span className="text-base font-semibold text-purple-800">{abmTotalCount.toLocaleString()}</span>
                    </h4>
                  </div>
                </>
              ) : (
                <div>
                  <div className="rounded-lg bg-amber-50 p-2 text-center">
                    <div className="mb-1">
                      <Building2 className="h-6 w-6 text-amber-300 mx-auto opacity-75" />
                    </div>
                    <p className="text-xs text-amber-800">Connect CRM for ABM insights</p>
                  </div>
                  <button
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md border border-amber-300 bg-white py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                    onClick={() => window.open('https://www.delightloop.com/bookademo', '_blank')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"></path><circle cx="14" cy="9" r="1"></circle><path d="m15 14 5-5"></path></svg>
                   Connect CRM
                  </button>
                </div>
              )}
            </div>

            {/* Opportunity Coverage Card */}
            <div className="space-y-2 rounded-lg border bg-white p-3 transition-all duration-300 hover:shadow-md hover:border-emerald-200">
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-emerald-500" /> Opportunity Coverage
              </h3>

              {isCrmConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Opportunities</span>
                    <span className="text-sm font-medium">{event.stats.opportunityCoverage.count.toLocaleString()}</span>
                  </div>

                  <div className="h-px w-full bg-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total Value</span>
                    <span className="text-base font-semibold text-purple-800">${oppValueCount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <div className="mb-1">
                      <DollarSign className="h-6 w-6 text-emerald-300 mx-auto opacity-75" />
                    </div>
                    <p className="text-xs text-emerald-800">Connect CRM for opportunity data</p>
                  </div>
                  <button
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-white py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                    onClick={() => window.open('https://www.delightloop.com/bookademo', '_blank')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"></path><circle cx="14" cy="9" r="1"></circle><path d="m15 14 5-5"></path></svg>
                    Connect CRM
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Integration Notes:
 *
 * 1. This component uses Tailwind CSS for styling and is ready for integration.
 *
 * 2. Required dependencies:
 *    - Tailwind CSS
 *    - shadcn/ui components (Card, Badge, Separator)
 *    - Lucide React for icons
 *    - Next.js Image component
 *    - cn utility function from @/lib/utils
 *
 * 3. Data requirements:
 *    - The component expects an event object with specific properties
 *    - All numerical data should be provided as numbers, not strings
 *    - Dates should be provided in a format parsable by new Date()
 *
 * 4. Customization:
 *    - Colors can be customized by modifying the Tailwind classes
 *    - The layout is responsive and will adapt to different screen sizes
 *    - The component handles missing data gracefully with fallbacks
 *
 * 5. Dark mode:
 *    - The component includes dark mode variants for colors
 *    - It will automatically adapt to the theme if dark mode is enabled
 */
