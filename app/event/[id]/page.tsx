"use client";

import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Edit } from "lucide-react";



export default function EventDetailsPage() {
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
  const params = useParams();
  const eventId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!authToken || !organizationId || !eventId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch event data");
        }

        const responseData = await response.json();
        console.log("API Response structure:", Object.keys(responseData));

        // Extract data properly handling nested event structure
        const data = responseData.event || responseData;
        console.log("Fetched event data:", data);

        setEventData(data);
        toast.success("Event data loaded successfully");
      } catch (error: any) {
        console.error("Error fetching event data:", error);
        setError(error.message || "Failed to load event data");
        toast.error("Failed to load event data");
      } finally {
        setIsLoading(false);
      }
    };

    if (authToken && organizationId && eventId) {
      fetchEventData();
    }
  }, [authToken, organizationId, eventId]);

  // Format date to readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-[#F9FAFB]">
        {/* Sidebar: sticky on sm+, static on mobile */}
        <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto static w-full sm:w-auto">
          <AdminSidebar />
        </div>
        {/* Main Content - scrollable */}
        <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-6 bg-gray-50 rounded-tl-3xl min-h-screen border-l border-gray-200 sm:border-l-0 sm:border-t sm:border-r border-gray-100 shadow-lg overflow-y-auto">
            <PageHeader
              backLink={{
                href: "/event",
                text: "Back to Events"
              }}
              title="Event Details"
              description={eventId ? `Event ID: ${eventId}` : "Loading Event ID..."}
              primaryButton={!isLoading && !error && eventData ? {
                text: "Edit Event",
                icon: Edit,
                href: `/event/${eventId}/edit`,
                variant: "primary"
              } : undefined}
              showDivider={true}
            />

            {isLoading ? (
              // Skeleton Loading State
              <div className="space-y-6 mx-4 md:mx-6 lg:mx-8">
                {/* Assets Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-72"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-48 bg-gray-200 rounded-md w-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>

                {/* Event URL Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-5 bg-gray-200 rounded"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  </div>
                </div>

                {/* Event Info Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-56"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-40"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-36"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-18 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-28"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-44"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-20 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>

                {/* Audience Targeting Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 rounded w-36 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-80"></div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-52"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="flex flex-wrap gap-2">
                        <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                        <div className="h-6 bg-gray-200 rounded-md w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-md w-24"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
                        <div className="h-20 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-20 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-8"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-36 mb-1"></div>
                      <div className="h-20 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              // Error state
              <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">
                      Error Loading Event
                    </h3>
                    <p className="mt-2 text-red-700">{error}</p>
                    <div className="mt-4">
                      <Link
                        href="/event"
                        className="bg-white text-red-800 px-4 py-2 border border-red-300 rounded-md hover:bg-red-50"
                      >
                        Back to Events
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : eventData ? (
              <div className="space-y-6 mx-4 md:mx-6 lg:mx-8">
                {/* Assets Section - Moved to top */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#1B1D21]">
                      Assets
                    </h2>
                    <p className="text-sm text-[#667085]">
                      Visual assets and additional information for your event
                    </p>
                  </div>

                  <div className="space-y-6">
                    {eventData.media?.banner && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Banner Image
                        </h3>
                        <div className="relative h-48 w-full bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={eventData.media.banner}
                            alt="Event Banner"
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-banner.jpg";
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {eventData.eventHashtag && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Event Hashtag
                        </h3>
                        <p className="mt-1 text-base">
                          {eventData.eventHashtag}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event URL Section */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <h3 className="text-lg font-medium mb-2">Event URL</h3>
                  <div className="flex items-center gap-2">
                    <a
                      href={eventData.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary-dark break-all"
                    >
                      {eventData.eventUrl}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(eventData.eventUrl);
                        toast.success("URL copied to clipboard");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy URL"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Event Info Section */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#1B1D21]">
                      Event Info
                    </h2>
                    <p className="text-sm text-[#667085]">
                      Basic information about your event
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Event Name
                        </h3>
                        <p className="mt-1 text-base">{eventData.name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Event Type
                        </h3>
                        <p className="mt-1 text-base">{eventData.type}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Event Date
                        </h3>
                        <p className="mt-1 text-base">
                          {formatDate(eventData.eventDate)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Location
                        </h3>
                        <p className="mt-1 text-base">{eventData.location}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Organizer / Host
                      </h3>
                      <p className="mt-1 text-base">{eventData.hostCompany}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Description
                      </h3>
                      <div className="mt-1 text-base whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                        {eventData.eventDesc}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audience Targeting Section */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#1B1D21]">
                      Audience Targeting
                    </h2>
                    <p className="text-sm text-[#667085]">
                      Information about your target audience and event context
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Target Person
                      </h3>
                      <p className="mt-1 text-base">
                        {eventData.targetAudience}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Tags / Topics
                      </h3>
                      {eventData.eventTopic &&
                      eventData.eventTopic.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {eventData.eventTopic.map(
                            (tag: string, index: number) => (
                              <span
                                key={index}
                                className="bg-gray-100 px-2 py-1 rounded-md text-sm"
                              >
                                {tag}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-base text-gray-400">
                          No tags added
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Agenda Summary
                        </h3>
                        <div className="mt-1 text-base bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                          {Array.isArray(eventData.agendaSummary)
                            ? eventData.agendaSummary.join("\n")
                            : eventData.agendaSummary ||
                              "No agenda summary provided"}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Speakers
                        </h3>
                        <div className="mt-1 text-base bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                          {Array.isArray(eventData.speakers)
                            ? eventData.speakers.join("\n")
                            : eventData.speakers || "No speakers listed"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Number of Registrants
                      </h3>
                      <p className="mt-1 text-base">
                        {eventData.registrants || "0"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Product/Service Focus
                      </h3>
                      <div className="mt-1 text-base bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                        {eventData.serviceFocus ||
                          "No product/service focus specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No data state
              <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No event data found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Event data could not be loaded
                  </p>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
  );
}
