"use client";

import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

// Animation keyframes for skeleton loading
const animations = `


.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
`;

/**
 * Calculates the appropriate event status based on event date
 *
 * @param eventDate - The event date string in YYYY-MM-DD format
 * @returns The appropriate status: "draft", "upcoming", "active", "completed", or "archived"
 */
const calculateEventStatus = (
  eventDate: string
): "draft" | "upcoming" | "active" | "completed" | "archived" => {
  if (!eventDate) return "draft";

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time part to start of day

  // Create date object from the event date string and set it to midnight
  const eventDateObj = new Date(eventDate + "T00:00:00.000Z");
  eventDateObj.setHours(0, 0, 0, 0);

  // Event is in the past
  if (eventDateObj < now) {
    return "completed";
  }

  // Event is today
  if (eventDateObj.getTime() === now.getTime()) {
    return "active";
  }

  // Event is within the next day (tomorrow)
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (eventDateObj.getTime() === tomorrow.getTime()) {
    return "active";
  }

  // Event is in the future (beyond tomorrow)
  return "upcoming";
};

export default function EditEventPage() {
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
  const params = useParams();
  const eventId = params.id as string;
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    eventUrl: "",
    location: "",
    hostCompany: "",
    eventDesc: "",
    targetAudience: "",
    agendaSummary: "",
    speakers: "",
    serviceFocus: "",
    eventHashtag: "",
    registrants: "0",
    logoUrl: "",
    bannerUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(
    "Processing your data..."
  );
  const [registrantFile, setRegistrantFile] = useState<File | null>(null);
  const [registrantCount, setRegistrantCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [autoFillStatus, setAutoFillStatus] = useState<string>("");

  const eventTypes = ["Webinar", "Conference", "Workshop", "Meetup"];
  const router = useRouter();

  // Helper function to safely extract properties from event data
  const extractEventData = (data) => {
    // For API responses that might be nested
    const eventData = data.event || data;

    return {
      name: eventData.name || "",
      eventUrl: eventData.eventUrl || "",
      location: eventData.location || "",
      hostCompany: eventData.hostCompany || "",
      eventDesc: eventData.eventDesc || "",
      targetAudience: eventData.targetAudience || "",
      agendaSummary: Array.isArray(eventData.agendaSummary)
        ? eventData.agendaSummary.join("\n")
        : eventData.agendaSummary || "",
      speakers: Array.isArray(eventData.speakers)
        ? eventData.speakers.join("\n")
        : eventData.speakers || "",
      serviceFocus: eventData.serviceFocus || "",
      eventHashtag: eventData.eventHashtag || "",
      registrants: eventData.registrants?.toString() || "0",
      logoUrl: eventData.media?.eventLogo || "",
      bannerUrl: eventData.media?.banner || "",
      type: eventData.type || "",
      eventDate: eventData.eventDate
        ? new Date(eventData.eventDate).toISOString().split("T")[0]
        : "",
      eventTopic: Array.isArray(eventData.eventTopic)
        ? eventData.eventTopic
        : [],
    };
  };

  // Monitor formData changes for debugging
  useEffect(() => {
    console.log("Form data updated:", formData);

    // Check if all form fields have values
    const formCheck = {
      name: !!formData.name,
      eventUrl: !!formData.eventUrl,
      location: !!formData.location,
      hostCompany: !!formData.hostCompany,
      eventDesc: !!formData.eventDesc,
      targetAudience: !!formData.targetAudience,
      agendaSummary: !!formData.agendaSummary,
      speakers: !!formData.speakers,
      serviceFocus: !!formData.serviceFocus,
      eventHashtag: !!formData.eventHashtag,
      logoUrl: !!formData.logoUrl,
      bannerUrl: !!formData.bannerUrl,
    };

    console.log("Form fields populated:", formCheck);
    console.log("Other state values:", {
      selectedType: selectedType,
      selectedDate: selectedDate,
      tags: tags,
    });
  }, [formData, selectedType, selectedDate, tags]);

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!authToken || !organizationId || !eventId) return;

      try {
        setIsLoading(true);

        // Reset all state values to ensure clean form
        setFormData({
          name: "",
          eventUrl: "",
          location: "",
          hostCompany: "",
          eventDesc: "",
          targetAudience: "",
          agendaSummary: "",
          speakers: "",
          serviceFocus: "",
          eventHashtag: "",
          registrants: "0",
          logoUrl: "",
          bannerUrl: "",
        });
        setTags([]);
        setSelectedType("");
        setSelectedDate("");

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

        // Debug the response structure
        console.log("Event data structure:", {
          hasEventProperty: "event" in responseData,
          responseKeys: Object.keys(responseData),
          eventDataKeys: Object.keys(responseData.event || responseData),
        });

        // Get processed data using our helper
        const processedData = extractEventData(responseData);
        console.log("Processed event data:", processedData);

        // Set the form data
        setFormData({
          name: processedData.name,
          eventUrl: processedData.eventUrl,
          location: processedData.location,
          hostCompany: processedData.hostCompany,
          eventDesc: processedData.eventDesc,
          targetAudience: processedData.targetAudience,
          agendaSummary: processedData.agendaSummary,
          speakers: processedData.speakers,
          serviceFocus: processedData.serviceFocus,
          eventHashtag: processedData.eventHashtag,
          registrants: processedData.registrants,
          logoUrl: processedData.logoUrl,
          bannerUrl: processedData.bannerUrl,
        });

        // Set related state values
        setSelectedType(processedData.type);
        setSelectedDate(processedData.eventDate);
        setTags(processedData.eventTopic);

        toast.success("Event data loaded successfully");
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event data");
      } finally {
        setIsLoading(false);
      }
    };

    if (authToken && organizationId && eventId) {
      fetchEventData();
    }
  }, [authToken, organizationId, eventId]);

  const updateEvent = async () => {
    if (!authToken || !userId || !organizationId || !eventId) {
      setErrors({ auth: "Missing authentication or event ID" });
      return;
    }

    // Reset errors
    setErrors({});

    // Validate all required fields
    const newErrors: Record<string, string> = {};

    // Required field validations
    // if (!formData.eventUrl) newErrors.eventUrl = "Event URL is required";
    if (!formData.name) newErrors.name = "Event name is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!selectedType) newErrors.type = "Event type is required";
    if (!selectedDate) newErrors.date = "Event date is required";
    if (!formData.eventDesc) newErrors.eventDesc = "Description is required";
    if (!formData.targetAudience)
      newErrors.targetAudience = "Target audience is required";
    if (!formData.serviceFocus)
      newErrors.serviceFocus = "Service focus is required";

    // If there are any errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the error messages
      document
        .querySelector(".error-messages")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const status = calculateEventStatus(selectedDate);

      const eventData = {
        name: formData.name,
        type: selectedType,
        eventDate: new Date(selectedDate + "T10:00:00.000Z").toISOString(),
        location: formData.location,
        eventUrl: formData.eventUrl,
        status: status, // Use calculated status instead of hardcoded "upcoming"
        hostCompany: formData.hostCompany,
        eventDesc: formData.eventDesc,
        targetAudience: formData.targetAudience,
        eventTopic: tags,
        agendaSummary: formData.agendaSummary.split("\n").filter(Boolean),
        speakers: formData.speakers.split("\n").filter(Boolean),
        serviceFocus: formData.serviceFocus,
        media: {
          eventLogo: formData.logoUrl || "https://example.com/logo.png",
          banner: formData.bannerUrl || "https://example.com/banner.png",
        },
        eventHashtag: formData.eventHashtag,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Handle success
      toast.success("Event updated successfully");
      console.log("Event updated successfully");
      router.push(`/event`);
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to update event" });
      toast.error(error.message || "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles drag enter/leave/over events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragleave") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handles file drop event
  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setErrors({});
      await handleRegistrantsUpload(file);
    }
  };

  // Handles file selection via input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.name.split(".").pop()?.toLowerCase();

      if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
        if (file.size <= 5 * 1024 * 1024) {
          // 5MB limit
          setErrors({});
          await handleRegistrantsUpload(file);
        } else {
          setErrors({ file: "File size should be less than 5MB" });
        }
      } else {
        setErrors({ file: "Please upload a .csv, .xls, or .xlsx file" });
      }
    }
  };

  // Handles file upload processing
  const handleRegistrantsUpload = async (file: File) => {
    if (!eventId) {
      setErrors({ campaign: "Event ID not found" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setRegistrantFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignId", eventId);

    try {
      const xhr = new XMLHttpRequest();

      // Add progress handler
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Add load handler
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log("Response:", response);
          setProcessingMessage(
            `Successfully imported ${response.savedContacts} recipients`
          );
          setProcessingComplete(true);
          setIsUploading(false);
          setErrors({});
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setErrors({ file: errorData.error || "Upload failed" });
          setIsUploading(false);
        }
      });

      // Add error handler
      xhr.addEventListener("error", () => {
        setErrors({ file: "Network error occurred during upload" });
        setIsUploading(false);
      });

      // Make the request
      xhr.open(
        "POST",
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/upload`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setErrors({ file: "Failed to upload file" });
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Download CSV template
    const link = document.createElement("a");
    link.href = "/templates/EventRegistrants_Template.csv";
    link.download = "EventRegistrants_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scrape event details from public URL
  const handleScrapeEvent = async () => {
    setScrapeError(null);
    if (!formData.eventUrl || !organizationId || !authToken) {
      setScrapeError("Please enter a valid event URL.");
      return;
    }
    setIsScraping(true);
    setAutoFillStatus("Fetching event details…");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/workflow/scrapes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ url: formData.eventUrl }),
        }
      );

      if (response.ok) {
        const eventData = await response.json();
        console.log("Event data:", eventData);

        // Map WorkflowAI response fields to form fields
        setFormData((prev) => ({
          ...prev,
          // Event Info section
          name: eventData.data.eventName || prev.name,
          eventUrl: prev.eventUrl, // Keep the URL that was entered
          location: eventData.data.location || prev.location,
          hostCompany: eventData.data.eventHost || prev.hostCompany,
          eventDesc: eventData.data.eventDescription || prev.eventDesc,

          // Audience Targeting section
          targetAudience:
            eventData.data.targetAudience?.description ||
            eventData.data.targetAudience ||
            prev.targetAudience,
          agendaSummary: eventData.data.shortAgenda || prev.agendaSummary,
          speakers: Array.isArray(eventData.data.speakers)
            ? eventData.data.speakers.join("\n")
            : eventData.data.speakers || prev.speakers,
          serviceFocus: eventData.data.productsOrServices || prev.serviceFocus,

          // Assets section
          eventHashtag: prev.eventHashtag, // Keep existing hashtag
          logoUrl: prev.logoUrl, // Keep existing logo URL
          bannerUrl: eventData.data.eventImageUrl || prev.bannerUrl, // Use eventImageUrl for banner if available
        }));

        // Set event type
        if (eventData.data.eventType) {
          const type = eventData.data.eventType;
          if (eventTypes.includes(type)) {
            setSelectedType(type);
          }
        }

        // --- Enhanced event date parsing ---
        try {
          if (eventData.data.eventDate) {
            // Try to parse as ISO or Date first
            const parsedDate = new Date(eventData.data.eventDate);
            if (!isNaN(parsedDate.getTime())) {
              setSelectedDate(parsedDate.toISOString().split("T")[0]);
            } else {
              // Try to extract a date like "April 22", "Apr 22", "2025-04-22", etc.
              // Prefer the first date found in the string
              const dateStr = eventData.data.eventDate.replace(/\n/g, " ");
              console.log("Parsing date from:", dateStr);

              // Match formats like "Tuesday, April 22", "April 22", "Apr 22", "2025-04-22"
              const dateRegexes = [
                /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s+([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/, // e.g. Tuesday, April 22 or April 22
                /\b([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/, // e.g. April 22, 2025 or Apr 22
                /\b(\d{4})-(\d{2})-(\d{2})\b/, // e.g. 2025-04-22
              ];

              let foundDate: string | null = null;

              for (const regex of dateRegexes) {
                const match = dateStr.match(regex);
                if (match) {
                  console.log("Date regex match:", match);

                  if (regex === dateRegexes[0] || regex === dateRegexes[1]) {
                    // Month name, day, optional year format
                    const monthIdx = match.findIndex(
                      (_, i) =>
                        i > 0 && match[i] && /[A-Za-z]/.test(match[i][0])
                    );
                    const monthName = match[monthIdx];
                    const dayIdx = monthIdx + 1;
                    const day = parseInt(match[dayIdx]);
                    const yearIdx = dayIdx + 1;
                    const year = match[yearIdx]
                      ? parseInt(match[yearIdx])
                      : new Date().getFullYear();

                    const monthIndex = [
                      "january",
                      "february",
                      "march",
                      "april",
                      "may",
                      "june",
                      "july",
                      "august",
                      "september",
                      "october",
                      "november",
                      "december",
                    ].findIndex(
                      (m) =>
                        m.startsWith(monthName.toLowerCase()) ||
                        monthName.toLowerCase().startsWith(m.slice(0, 3))
                    );

                    if (monthIndex !== -1) {
                      const dateObj = new Date(year, monthIndex, day);
                      console.log("Constructed date:", dateObj);
                      if (!isNaN(dateObj.getTime())) {
                        // Fix: Preserve the local date without timezone conversion
                        const localDateStr = `${dateObj.getFullYear()}-${String(
                          dateObj.getMonth() + 1
                        ).padStart(2, "0")}-${String(
                          dateObj.getDate()
                        ).padStart(2, "0")}`;
                        foundDate = localDateStr;
                        break;
                      }
                    }
                  } else if (regex === dateRegexes[2]) {
                    // YYYY-MM-DD
                    foundDate = `${match[1]}-${match[2]}-${match[3]}`;
                    break;
                  }
                }
              }

              if (foundDate) {
                console.log("Setting date to:", foundDate);
                setSelectedDate(foundDate);
              } else {
                console.log("No valid date format found in:", dateStr);
              }
            }
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }

        // Set tags from the response
        if (
          Array.isArray(eventData.data.tags) &&
          eventData.data.tags.length > 0
        ) {
          setTags(eventData.data.tags);
        }

        // Show success toast
        toast.success(
          `Event details scraped successfully using ${
            eventData.data.metrics?.model || "WorkflowAI"
          }`
        );
      } else {
        throw new Error("Failed to scrape event details.");
      }
    } catch (err: any) {
      setScrapeError(err.message || "Failed to scrape event details.");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <style jsx global>
        {animations}
      </style>
      <div className="flex flex-col sm:flex-row h-screen bg-[#F9FAFB]">
        {/* Sidebar: sticky on sm+, static on mobile */}
        <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto static w-full sm:w-auto">
          <AdminSidebar />
        </div>
        {/* Main Content - scrollable */}
        <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-6 bg-gray-50 rounded-tl-3xl min-h-screen border-l border-gray-200 sm:border-l-0 sm:border-t sm:border-r border-gray-100 shadow-lg overflow-y-auto">
            <PageHeader
              backLink={{
                href: "/event",
                text: "Back to Events"
              }}
              title="Edit Event"
              description={eventId ? `Event ID: ${eventId}` : "Loading Event ID..."}
              primaryButton={{
                text: isSubmitting ? "Updating Event..." : "Update Event",
                icon: Save,
                onClick: updateEvent,
                variant: "primary"
              }}
              secondaryButton={{
                text: "Cancel",
                variant: "secondary",
                href: "/event"
              }}
              showDivider={true}
            />

            {isLoading ? (
              // Skeleton Loading State
              <div className="space-y-6 mx-4 md:mx-6 lg:mx-8">
                {/* Event URL Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-20 mb-1"></div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    <div className="h-10 w-24 bg-gray-200 skeleton-shimmer rounded-md"></div>
                  </div>
                  <div className="h-3 bg-gray-200 skeleton-shimmer rounded w-64 mt-1"></div>
                </div>

                {/* Event Info Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 skeleton-shimmer rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-56"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                        <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                        <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                        <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                        <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-28 mb-1"></div>
                      <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                      <div className="h-24 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Audience Targeting Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 skeleton-shimmer rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-72"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-28 mb-1"></div>
                      <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md mb-1"></div>
                      <div className="h-3 bg-gray-200 skeleton-shimmer rounded w-48"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                      <div className="flex gap-2 mb-2">
                        <div className="h-10 flex-1 bg-gray-200 skeleton-shimmer rounded-md"></div>
                        <div className="h-10 w-16 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-28 mb-1"></div>
                        <div className="h-24 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-20 mb-1"></div>
                        <div className="h-24 bg-gray-200 skeleton-shimmer rounded-md"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-32 mb-1"></div>
                      <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-36 mb-1"></div>
                      <div className="h-24 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Assets Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="h-6 bg-gray-200 skeleton-shimmer rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-64"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-24 mb-1"></div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                          <div className="h-10 w-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                        </div>
                        <div className="h-3 bg-gray-200 skeleton-shimmer rounded w-40 mt-1"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 skeleton-shimmer rounded w-28 mb-1"></div>
                      <div className="h-10 bg-gray-200 skeleton-shimmer rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Footer Skeleton */}
                <div className="p-6 border-t-2 border-gray-100 mt-8 bg-gray-50/50 rounded-b-xl">
                  <div className="flex justify-end">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="h-10 w-20 bg-gray-200 skeleton-shimmer rounded-lg"></div>
                      <div className="h-10 w-32 bg-gray-200 skeleton-shimmer rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 mx-4 md:mx-6 lg:mx-8">
                {/* Event URL Section */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <label className="block text-sm font-medium mb-1">
                    Event URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={formData.eventUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, eventUrl: e.target.value })
                      }
                      placeholder="https://example.com/event"
                      className={`flex-1 rounded-md border ${
                        errors.eventUrl ? "border-red-500" : "border-gray-300"
                      } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                      disabled={isScraping}
                    />
                    <button
                      type="button"
                      onClick={handleScrapeEvent}
                      disabled={isScraping || !formData.eventUrl}
                      className={`bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-center text-sm sm:text-base sm:px-4 sm:py-2 ${
                        isScraping ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      style={{ minWidth: "120px" }}
                    >
                      {isScraping && (
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      Auto-Fill
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter a public event URL to automatically update event
                    details
                  </p>
                  {errors.eventUrl && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.eventUrl}
                    </p>
                  )}
                  {scrapeError && (
                    <div className="mt-2 text-red-600 text-sm">
                      {scrapeError}
                    </div>
                  )}
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

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Event Name*
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Tech Conference 2023"
                          className={`w-full rounded-md border ${
                            errors.name ? "border-red-500" : "border-gray-300"
                          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium mb-1">
                          Event Type*
                        </label>
                        <button
                          onClick={() => setIsTypeOpen(!isTypeOpen)}
                          className={`w-full text-left rounded-md border ${
                            errors.type ? "border-red-500" : "border-gray-300"
                          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        >
                          {selectedType || "Select event type"}
                        </button>
                        {errors.type && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.type}
                          </p>
                        )}
                        {isTypeOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                            {eventTypes.map((type) => (
                              <div
                                key={type}
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsTypeOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Event Date*
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className={`w-full rounded-md border ${
                            errors.date ? "border-red-500" : "border-gray-300"
                          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        />
                        {errors.date && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.date}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Location*
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          placeholder="Online or physical location"
                          className={`w-full rounded-md border ${
                            errors.location
                              ? "border-red-500"
                              : "border-gray-300"
                          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                        />
                        {errors.location && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Organizer / Host
                      </label>
                      <input
                        type="text"
                        value={formData.hostCompany}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hostCompany: e.target.value,
                          })
                        }
                        placeholder="Company or individual hosting the event"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description*
                      </label>
                      <textarea
                        rows={4}
                        value={formData.eventDesc}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventDesc: e.target.value,
                          })
                        }
                        placeholder="Provide a detailed description of the event"
                        className={`w-full rounded-md border ${
                          errors.eventDesc
                            ? "border-red-500"
                            : "border-gray-300"
                        } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                      />
                      {errors.eventDesc && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.eventDesc}
                        </p>
                      )}
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

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Target Person*
                      </label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetAudience: e.target.value,
                          })
                        }
                        placeholder="Who is this event for?"
                        className={`w-full rounded-md border ${
                          errors.targetAudience
                            ? "border-red-500"
                            : "border-gray-300"
                        } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                      />
                      {errors.targetAudience && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.targetAudience}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Used to generate gifting tone and messaging
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Tags / Topics
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && currentTag.trim()) {
                              e.preventDefault();
                              setTags([...tags, currentTag.trim()]);
                              setCurrentTag("");
                            }
                          }}
                          placeholder="Add a tag"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <button
                          onClick={() => {
                            if (currentTag.trim()) {
                              setTags([...tags, currentTag.trim()]);
                              setCurrentTag("");
                            }
                          }}
                          className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                          Add
                        </button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() =>
                                  setTags(tags.filter((_, i) => i !== index))
                                }
                                className="hover:text-red-500 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Agenda Summary
                        </label>
                        <textarea
                          rows={4}
                          value={formData.agendaSummary}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agendaSummary: e.target.value,
                            })
                          }
                          placeholder="Brief overview of the event agenda"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Speakers
                        </label>
                        <textarea
                          rows={4}
                          value={formData.speakers}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              speakers: e.target.value,
                            })
                          }
                          placeholder="List of speakers (one per line)"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Number of Registrants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.registrants}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registrants: e.target.value,
                          })
                        }
                        placeholder="0"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product/Service Focus*
                      </label>
                      <textarea
                        rows={4}
                        value={formData.serviceFocus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceFocus: e.target.value,
                          })
                        }
                        placeholder="What products or services are being featured?"
                        className={`w-full rounded-md border ${
                          errors.serviceFocus
                            ? "border-red-500"
                            : "border-gray-300"
                        } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                      />
                      {errors.serviceFocus && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.serviceFocus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assets Section */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#1B1D21]">
                      Assets
                    </h2>
                    <p className="text-sm text-[#667085]">
                      Visual assets and additional information for your event
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Banner Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.bannerUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bannerUrl: e.target.value,
                              })
                            }
                            placeholder="Banner Image URL or upload"
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <input
                            type="file"
                            id="bannerUpload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // TODO: Replace with your actual upload logic
                                const fakeUrl = URL.createObjectURL(file);
                                setFormData({
                                  ...formData,
                                  bannerUrl: fakeUrl,
                                });
                              }
                            }}
                          />
                          <button
                            onClick={() =>
                              document.getElementById("bannerUpload")?.click()
                            }
                            className="p-2 border rounded-md hover:bg-gray-50"
                          >
                            <UploadIcon className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Enter a URL or upload an image
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Event Hashtag
                      </label>
                      <input
                        type="text"
                        value={formData.eventHashtag}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventHashtag: e.target.value,
                          })
                        }
                        placeholder="#TechConf2023"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Messages */}
                {/* <div
                  className="animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: "650ms",
                    animationFillMode: "forwards",
                  }}
                >
                  {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 error-messages mb-6">
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
                          <h3 className="text-sm font-medium text-red-800">
                            Please fix the following errors:
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <ul className="list-disc pl-5 space-y-1">
                              {Object.entries(errors).map(([key, value]) => (
                                <li key={key}>{value}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div> */}
              </div>
            )}

            {/* Footer with Cancel and Update Button */}
            <div className="p-6 border-t-2 border-gray-100 mt-8 mx-4 md:mx-6 lg:mx-8 bg-gray-50/50 rounded-b-xl">
              <div className="flex justify-end">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => router.push("/event")}
                    className="bg-white border border-gray-300 text-gray-700 shadow-xs hover:bg-gray-50 flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateEvent}
                    disabled={isSubmitting || isLoading}
                    className={`bg-primary border border-primary text-white shadow-xs hover:bg-primary/90 flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg text-sm font-medium transition-colors ${
                      isSubmitting || isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{ minWidth: "140px" }}
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    {isSubmitting ? "Updating Event..." : "Update Event"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
