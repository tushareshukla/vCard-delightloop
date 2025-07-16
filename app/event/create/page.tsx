"use client";

import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

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
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
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

export default function CreateEventPage() {
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
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
  const [eventId, setEventId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [autoFillStatus, setAutoFillStatus] = useState<string>("");
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [sampleCompanies, setSampleCompanies] = useState<
    Array<{ company_name: string; location: string }>
  >([]);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const eventTypes = ["Webinar", "Conference", "Workshop", "Meetup"];
  const statusOptions = [
    "Draft",
    "Upcoming",
    "Active",
    "Completed",
    "Archived",
  ]; // <-- update filter options
  const router = useRouter();
  useEffect(() => {
    const initializeCampaign = async () => {
      console.log("Initialize Campaign called with:", {
        authToken: !!authToken,
        userId,
        organizationId,
        isLoadingCookies,
      });

      try {
        setIsInitializing(true);
        console.log("Creating initial campaign...");

        const eventData = {
          name: `Event ${new Date().toISOString()}`,
          type: "default",
          eventDate: new Date().toISOString(),
          location: "lll",
          eventUrl: "lll",
          hostCompany: "",
          eventDesc: "lll",
          targetAudience: "lll",
          eventTopic: [],
          agendaSummary: [],
          speakers: [],
          serviceFocus: "lll",
          media: {
            eventLogo: "",
            banner: "",
          },
          eventHashtag: "",
          campaignIds: [],
        };

        console.log("Making API call to create event...");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventData),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to create initial campaign: ${response.status}`
          );
        }

        const result = await response.json();
        console.log("Campaign created successfully:", result);
        setEventId(result.eventId);
      } catch (error) {
        console.error("Error in campaign creation:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    // Simplified condition - only check if auth is ready
    if (
      !isLoadingCookies &&
      authToken &&
      userId &&
      organizationId &&
      !eventId
    ) {
      console.log("Auth ready, checking if we need to create campaign");
      initializeCampaign();
    }
  }, [isLoadingCookies, authToken, userId, organizationId, eventId]);

  const createEvent = async () => {
    if (!authToken || !userId || !organizationId || !eventId) {
      setErrors({ auth: "Missing authentication or campaign" });
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
      // Calculate the appropriate status based on the selected date
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

      // Add success message to show calculated status
      toast.success(`Event created with status: ${status.toUpperCase()}`);

      // Handle success
      console.log("Event updated successfully");
      router.push(`/event`);
    } catch (error) {
      setErrors({ submit: error.message || "Failed to update event" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles drag enter/leave/over events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
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
      setErrors({ campaign: "Campaign not initialized" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setRegistrantFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", eventId);

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
            `Your file has been uploaded successfully. Successfully imported ${response.savedContacts} recipients.`
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
    link.href = "/templates/RecepientsTemplate.xlsx";
    link.download = "EventRegistrants_Template.xlsx";
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
          name: eventData.data.eventName || "",
          eventUrl: prev.eventUrl, // Keep the URL that was entered
          location: eventData.data.location || "",
          hostCompany: eventData.data.eventHost || "",
          eventDesc: eventData.data.eventDescription || "",

          // Audience Targeting section
          targetAudience:
            eventData.data.targetAudience?.description ||
            eventData.data.targetAudience ||
            "",
          agendaSummary: eventData.data.shortAgenda || "",
          speakers: Array.isArray(eventData.data.speakers)
            ? eventData.data.speakers.join("\n")
            : eventData.data.speakers || "",
          serviceFocus: eventData.data.productsOrServices || "",

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
        // Check for tags directly or use industry sectors as tags
        let eventTags = [];
        if (
          Array.isArray(eventData.data.tags) &&
          eventData.data.tags.length > 0
        ) {
          eventTags = eventData.data.tags;
        } else if (
          Array.isArray(eventData.data.industrySectors) &&
          eventData.data.industrySectors.length > 0
        ) {
          eventTags = eventData.data.industrySectors;
        } else if (
          Array.isArray(eventData.data.skillsFocus) &&
          eventData.data.skillsFocus.length > 0
        ) {
          eventTags = eventData.data.skillsFocus;
        }

        // Set the tags
        if (eventTags.length > 0) {
          setTags(eventTags);
        }

        // Set sample companies from the response
        if (
          eventData.data.targetAudience?.sample_companies &&
          Array.isArray(eventData.data.targetAudience.sample_companies) &&
          eventData.data.targetAudience.sample_companies.length > 0
        ) {
          // Extract and set the sample companies
          setSampleCompanies(eventData.data.targetAudience.sample_companies);
          setShowAllCompanies(false); // Reset to show only top companies initially
        } else {
          setSampleCompanies([]);
        }

        // Show success toast
        toast.success("Event details fetched successfully!");
        setAutoFillStatus("Event details filled! Review & edit below 👇");

        // Clear the status message after 5 seconds
        setTimeout(() => {
          setAutoFillStatus("");
        }, 5000);
      } else {
        throw new Error("Failed to fetch event details");
      }
    } catch (error) {
      console.error("Error scraping event:", error);
      setScrapeError("Failed to fetch event details. Please try again.");
      setAutoFillStatus("");
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
        <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-6 bg-gray-50 rounded-tl-3xl min-h-screen border-l border-gray-200 sm:border-l-0 sm:border-t sm:border-r border-gray-100 shadow-lg overflow-y-auto">
            <div
              className="animate-fade-in opacity-0"
              style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
            >
              <PageHeader
                backLink={{
                  href: "/event",
                  text: "Back to Events"
                }}
                title="Create New Event"
                description={eventId ? `Event ID: ${eventId}` : "Generating Event ID..."}
                primaryButton={{
                  text: isSubmitting ? "Updating Event..." : "+ Add Event",
                  onClick: createEvent,
                  variant: "primary"
                }}
                showDivider={true}
              />
            </div>

            <div className="space-y-6 mx-4 md:mx-6 lg:mx-8">
              {/* Event URL Section */}
              <div
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6 animate-fade-in-up opacity-0"
                style={{
                  animationDelay: "250ms",
                  animationFillMode: "forwards",
                }}
              >
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
                    className={`bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-center text-sm sm:text-base mt-2 sm:mt-0 ${
                      isScraping ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {isScraping && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    {autoFillStatus ? autoFillStatus : "Auto-Fill"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Paste a public event link — we'll auto-fill the details for
                  you!
                </p>
                {errors.eventUrl && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventUrl}</p>
                )}
                {scrapeError && (
                  <div className="mt-2 text-red-600 text-sm">{scrapeError}</div>
                )}
              </div>

              {/* Event Info Section */}
              <div
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6 animate-fade-in-up opacity-0"
                style={{
                  animationDelay: "350ms",
                  animationFillMode: "forwards",
                }}
              >
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
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Online or physical location"
                        className={`w-full rounded-md border ${
                          errors.location ? "border-red-500" : "border-gray-300"
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
                        setFormData({ ...formData, eventDesc: e.target.value })
                      }
                      placeholder="Provide a detailed description of the event"
                      className={`w-full rounded-md border ${
                        errors.eventDesc ? "border-red-500" : "border-gray-300"
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
              <div
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6 animate-fade-in-up opacity-0"
                style={{
                  animationDelay: "450ms",
                  animationFillMode: "forwards",
                }}
              >
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

                  {/* Sample Companies Section */}
                  {sampleCompanies.length > 0 && (
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => setShowAllCompanies(!showAllCompanies)}
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Recommended Target Companies
                          </h3>
                          <p className="text-sm text-gray-600">
                            {sampleCompanies.length} companies that match your
                            event audience
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                          {showAllCompanies ? (
                            <>
                              <span>Show less</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Show all {sampleCompanies.length}</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            These companies are intelligently recommended based
                            on the event type and target audience.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Only show first 10 if not expanded */}
                          {(showAllCompanies
                            ? sampleCompanies
                            : sampleCompanies.slice(0, 8)
                          ).map((company, index) => (
                            <div
                              key={index}
                              className="flex items-start p-3 border border-gray-100 rounded-md bg-gray-50"
                            >
                              <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium mr-3">
                                {company.company_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {company.company_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {company.location}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {!showAllCompanies && sampleCompanies.length > 8 && (
                          <div className="mt-4 flex justify-center">
                            <button
                              onClick={() => setShowAllCompanies(true)}
                              className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                            >
                              <span>
                                View all {sampleCompanies.length} companies
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                          setFormData({ ...formData, speakers: e.target.value })
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

                  {/* Registrants Upload Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium mb-1">
                      Upload Registrants List
                    </label>
                    <p className="text-sm text-[#667085] mb-4">
                      Upload your list of event registrants or target attendees
                    </p>

                    {/* Download Template Link */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 text-primary font-medium hover:underline"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 6.25C3 4.45507 4.45507 3 6.25 3H17.75C19.5449 3 21 4.45507 21 6.25V17.75C21 19.5449 19.5449 21 17.75 21H6.25C4.45507 21 3 19.5449 3 17.75V6.25Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M7 12H17M7 8H17M7 16H13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>Download Template</span>
                      </button>
                    </div>

                    {/* Upload Instructions */}
                    <div className="flex items-start text-sm gap-3 mb-4 bg-blue-50 p-4 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 14a1 1 0 0 1 .64-.94l4-1.5A1 1 0 0 1 10 12.5V17a1 1 0 0 1-.64.94l-4 1.5A1 1 0 0 1 4 18.5v-4.5z"
                            fill="#0066FF"
                          />
                          <path
                            d="M14 12.5a1 1 0 0 1 .64-.94l4-1.5A1 1 0 0 1 20 11v4.5a1 1 0 0 1-.64.94l-4 1.5A1 1 0 0 1 14 17v-4.5z"
                            fill="#0066FF"
                          />
                          <path
                            d="M9 6.5a1 1 0 0 1 .64-.94l4-1.5A1 1 0 0 1 15 5v4.5a1 1 0 0 1-.64.94l-4 1.5A1 1 0 0 1 9 11V6.5z"
                            fill="#0066FF"
                          />
                        </svg>
                      </div>
                      <p className="leading-5">
                        Drag and drop your CSV file, XLS file or click to upload
                        it. Include details like first name, last name, email,
                        and company for best results.
                      </p>
                    </div>

                    {/* File Upload Area */}
                    {!registrantFile ? (
                      <label
                        htmlFor="registrant-file-upload"
                        className={`flex flex-col mt-2 group text-primary-light items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 py-8 px-4 hover:bg-primary/5 transition-all duration-300 ${
                          dragActive
                            ? "border-primary bg-primary/5"
                            : "border-gray-300"
                        } ${errors.file ? "border-red-500" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center w-full">
                          <svg
                            className={`w-10 h-10 mb-3 text-gray-400 ${
                              dragActive
                                ? "text-primary scale-110"
                                : "group-hover:text-primary group-hover:scale-110"
                            } transition-all duration-300`}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="mb-2 text-sm">
                            <span className="font-medium text-gray-900">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            .xls, .xlsx, or .csv file (max 5MB)
                          </p>
                        </div>
                        <input
                          id="registrant-file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".csv,.xls,.xlsx"
                        />
                      </label>
                    ) : (
                      <div className="mt-2 w-full">
                        <div className="flex gap-3 items-start bg-white rounded-lg p-4 border border-primary">
                          <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M13 2v7h7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
                            {/* File name and size */}
                            <div className="flex justify-between items-start w-full">
                              <div className="flex items-center gap-3">
                                <div className="grid">
                                  <span className="text-sm font-medium">
                                    {registrantFile.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(registrantFile.size / 1024)} KB
                                  </span>
                                </div>
                              </div>
                              {/* Status indicator */}
                              {isUploading ? (
                                <div></div>
                              ) : errors.file ? (
                                <button
                                  onClick={() => {
                                    setRegistrantFile(null);
                                    setErrors({});
                                    setUploadProgress(0);
                                    setProcessingComplete(false);
                                  }}
                                  className="text-red-500 hover:text-red-600 p-1 rounded"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                  >
                                    <path
                                      d="M13 1L1 13M1 1L13 13"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </button>
                              ) : (
                                <div className="bg-primary rounded-full text-white h-fit p-0.5">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M20 6L9 17l-5-5"
                                      stroke="white"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="flex w-full items-center gap-2.5">
                              <div className="w-[85%] bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    errors.file ? "bg-red-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">
                                {uploadProgress}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Processing message */}
                        {processingComplete && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M20 6L9 17l-5-5"
                                  stroke="#16a34a"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="font-medium text-green-700">
                                {processingMessage}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error message */}
                    {errors.file && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#ef4444"
                              strokeWidth="2"
                            />
                            <path
                              d="M12 8v4M12 16h.01"
                              stroke="#ef4444"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="font-medium text-red-700">
                            {errors.file}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assets Section */}
              <div
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 p-6 animate-fade-in-up opacity-0"
                style={{
                  animationDelay: "550ms",
                  animationFillMode: "forwards",
                }}
              >
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
                    {/* <div>
                      <label className="block text-sm font-medium mb-1">
                        Logo Upload
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.logoUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              logoUrl: e.target.value,
                            })
                          }
                          placeholder="Logo Upload URL or upload"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <input
                          type="file"
                          id="logoUpload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // TODO: Replace with your actual upload logic
                              const fakeUrl = URL.createObjectURL(file);
                              setFormData({ ...formData, logoUrl: fakeUrl });
                            }
                          }}
                        />
                        <button
                          onClick={() =>
                            document.getElementById("logoUpload")?.click()
                          }
                          className="p-2 border rounded-md hover:bg-gray-50"
                        >
                          <UploadIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Enter a URL or upload an image
                      </p>
                    </div> */}

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
                              setFormData({ ...formData, bannerUrl: fakeUrl });
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
                        <button
                          onClick={() =>
                            setShowBannerPreview(!showBannerPreview)
                          }
                          disabled={!formData.bannerUrl}
                          className={`p-2 border rounded-md hover:bg-gray-50 ${
                            !formData.bannerUrl
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Enter a URL or upload an image
                      </p>

                      {/* Banner Image Preview */}
                      {showBannerPreview && formData.bannerUrl && (
                        <div className="mt-4 border rounded-md overflow-hidden">
                          <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Banner Preview
                            </span>
                            <button
                              onClick={() => setShowBannerPreview(false)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="p-4 flex justify-center">
                            <img
                              src={formData.bannerUrl}
                              alt="Banner Preview"
                              className="max-h-48 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/400x200?text=Invalid+Image+URL";
                              }}
                            />
                          </div>
                        </div>
                      )}
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

            {/* Footer with Submit Button */}
            <div
              className="p-6 border-t-2 border-gray-100 mt-8 mx-4 md:mx-6 lg:mx-8 animate-fade-in-up opacity-0 bg-gray-50/50 rounded-b-xl"
              style={{ animationDelay: "650ms", animationFillMode: "forwards" }}
            >
              <div className="flex justify-end">
                <button
                  onClick={createEvent}
                  disabled={isSubmitting}
                  className={`bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
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
                  {isSubmitting ? "Updating Event..." : "+ Add Event"}
                </button>
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
