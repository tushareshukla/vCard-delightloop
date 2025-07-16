"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type React from "react";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Calendar,
  Save,
  X,
  Plus,
  Edit,
  Trash,
  Bold,
  Italic,
  Underline,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Type,
  ChevronDown,
  ChevronRight,
  Search,
  Mail,
  Sparkles,
  Settings,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import PageHeader from "@/components/layouts/PageHeader";
import { ArrowLeft } from "lucide-react";
import debounce from "lodash/debounce";
import AddStepModal from "@/components/delight-engage/AddStepModal";
import DeleteStepModal from "@/components/delight-engage/DeleteStepModal";
import PhysicalNudgeExperience from "@/components/delight-engage/PhysicalNudgeExperience";
import InfinityLoader from "@/components/common/InfinityLoader";

// Rich text editor with client-side only rendering
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full border rounded-lg bg-gray-50 animate-pulse"></div>
  ),
});

interface EventDetails {
  _id: string;
  name: string;
  type: string;
  eventDate: string;
  location: string;
  eventUrl: string;
  hostCompany: string;
  eventDesc: string;
  targetAudience: string;
  eventTopic: string[];
  agendaSummary: string[];
  speakers: string[];
  serviceFocus: string;
  media: {
    eventLogo: string;
    banner: string;
  };
  eventHashtag: string;
  campaignIds: string[];
  creatorUserId: string;
  organizationId: string;
}

interface EventApiResponse {
  event: EventDetails;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL;

async function fetchSequence(organizationId, sequenceId, authToken) {
  const res = await fetch(
    `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch sequence");
  return (await res.json()).sequence;
}

async function fetchSteps(organizationId, sequenceId, authToken) {
  const res = await fetch(
    `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}/steps`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch steps");
  return (await res.json()).steps;
}

async function createStep(organizationId, sequenceId, authToken, step) {
  // Force channel to be 'gift' for physical nudges to prevent incorrect mapping
  if (step.channel === "physical-nudge") {
    console.log("Converting channel from 'physical-nudge' to 'gift'");
    step.channel = "gift";
  }

  // Ensure required fields are present with proper validation
  const requiredFields = [
    "title",
    "channel",
    "order",
    "send_day_offset",
    "from",
    "content",
  ];
  const missingFields = requiredFields.filter((field) => !step[field]);

  if (missingFields.length > 0) {
    const errorMessage = `Missing required step fields: ${missingFields.join(
      ", "
    )}`;
    console.error(errorMessage, step);
    throw new Error(errorMessage);
  }

  // Ensure content is valid HTML
  if (typeof step.content !== "string" || !step.content.trim()) {
    step.content = "<div><p>Default content</p></div>";
  }

  // Ensure metadata is an object
  if (!step.metadata || typeof step.metadata !== "object") {
    step.metadata = {};
  }

  const requestBody = { steps: [step] };
  console.log(
    "Creating step with request body:",
    JSON.stringify(requestBody, null, 2)
  );

  try {
    const res = await fetch(
      `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}/steps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    // Clone the response so we can read it twice
    const clone = res.clone();
    const responseText = await clone.text();
    console.log("API Response status:", res.status);
    console.log("API Response text:", responseText);

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { message: responseText };
      }

      const errorMessage =
        (errorData as any).error_message ||
        (errorData as any).message ||
        `HTTP ${res.status}`;
      console.error("Error creating step:", errorMessage, errorData);
      throw new Error(`Failed to create step: ${errorMessage}`);
    }

    try {
      const responseData = JSON.parse(responseText);
      const stepId = responseData.step_ids && responseData.step_ids[0];
      if (!stepId) {
        throw new Error("No step ID returned from API");
      }
      console.log("Step created successfully with ID:", stepId);
      return stepId;
    } catch (parseError) {
      console.error("Failed to parse success response:", parseError);
      throw new Error("Failed to parse API response");
    }
  } catch (error) {
    console.error("Network or parsing error:", error);
    throw error;
  }
}

async function updateStep(organizationId, sequenceId, stepId, authToken, step) {
  const res = await fetch(
    `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}/steps/${stepId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(step),
    }
  );
  if (!res.ok) throw new Error("Failed to update step");
  return (await res.json()).step;
}

async function deleteStep(organizationId, sequenceId, stepId, authToken) {
  try {
    console.log("Deleting step:", { organizationId, sequenceId, stepId });

    const res = await fetch(
      `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}/steps/${stepId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("Delete response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error deleting step:", res.status, errorText);
      throw new Error(`Failed to delete step: ${res.status} - ${errorText}`);
    }

    console.log("Step deleted successfully");
    return true;
  } catch (error) {
    console.error("Network error deleting step:", error);
    throw error;
  }
}

async function updateSequence(organizationId, sequenceId, authToken, data) {
  const res = await fetch(
    `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to update sequence");
  return (await res.json()).sequence;
}

// Function to update step orders in bulk after drag-and-drop reordering
async function updateStepOrders(organizationId, sequenceId, authToken, steps) {
  const orderUpdates = steps.map((step, index) => ({
    step_id: step._id || step.id,
    order: index + 1,
    // Keep send_day_offset as-is to preserve scheduling logic
    // send_day_offset should represent days after sequence start, not display order
    send_day_offset: step.send_day_offset || index + 1, // Use existing or fallback
  }));

  console.log("Updating step orders:", orderUpdates);

  try {
    // Update each step individually since there might not be a bulk update endpoint
    const updatePromises = orderUpdates.map(async (update) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/organizations/${organizationId}/sequences/${sequenceId}/steps/${update.step_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            order: update.order,
            send_day_offset: update.send_day_offset,
          }),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to update step ${update.step_id} order`);
      }
      return await res.json();
    });

    const results = await Promise.all(updatePromises);
    console.log("All step orders updated successfully");
    return results.map((result) => result.step); // Return updated step data
  } catch (error) {
    console.error("Error updating step orders:", error);
    throw error;
  }
}

// 1. Add AI template generation logic
async function generateAITemplates(eventData, sequence, authToken) {
  // Prepare API request data using event details if available
  const apiRequestData = {
    event_name: eventData?.name || sequence?.name || "Product Launch Sequence",
    event_type: eventData?.type || "Webinar",
    event_url: eventData?.eventUrl || "",
    event_description:
      eventData?.eventDesc ||
      sequence?.description ||
      "Email sequence for new product launch",
    event_hosts: eventData?.hostCompany ? [eventData.hostCompany] : [],
    event_speakers: eventData?.speakers || [],
    event_topics: eventData?.eventTopic || [],
    agenda_summary: eventData?.agendaSummary?.[0] || "",
    target_audience_description: eventData?.targetAudience
      ? [eventData.targetAudience]
      : ["Potential customers interested in our product"],
    outreach_outcome: "Registration Boost - Net New",
  };
  const response = await fetch("/api/email-sequence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(apiRequestData),
  });
  if (!response.ok) throw new Error("Failed to generate AI templates");
  const { data } = await response.json();
  return data?.email_content_sequence || [];
}

// 1. Extend the template type to include optional fields
type TemplateType = {
  id: string;
  _id?: string; // Add this for server compatibility
  name: string;
  subject: string;
  day: number;
  content: string;
  category: string;
  metadata?: any;
  type?: string;
  displayType?: string;
  channel?: string;
  isOptimistic?: boolean; // Add this for optimistic updates
};

export default function DelightEmails() {
  // console.log('[DelightEmails] Component Initializing');
  const searchParams = useSearchParams();
  const sequenceId = searchParams?.get("sequenceId") || "";
  const eventId = searchParams?.get("eventId") || "";
  const listId = searchParams?.get("listId") || "";
  // console.log('[DelightEmails] URL Params:', { sequenceId, eventId, listId });

  const { authToken, organizationId, isLoadingCookies } = useAuth();
  // console.log('[DelightEmails] Auth Context:', { hasAuthToken: !!authToken, organizationId, isLoadingCookies });

  const [isLoading, setIsLoading] = useState(true);
  const [sequence, setSequence] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [senderEmail] = useState("gifty@mail.delightloop.ai");
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [editingTabValue, setEditingTabValue] = useState("");
  const [editingTimelineName, setEditingTimelineName] = useState<string | null>(
    null
  );
  const [editingTimelineValue, setEditingTimelineValue] = useState("");
  const timelineInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTemplatesTerm, setSearchTemplatesTerm] = useState("");
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [showTemplateSearch, setShowTemplateSearch] = useState(false);

  // Pagination for templates in timeline
  const [currentTimelinePage, setCurrentTimelinePage] = useState(1);
  const templatesPerPage = 5;

  // Tab pagination
  const [visibleTabsStart, setVisibleTabsStart] = useState(0);
  const maxVisibleTabs = 5; // Maximum number of visible tabs

  // Animation states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Tabs state - Start with empty templates array to show skeleton until AI content loads
  const [templates, setTemplates] = useState<TemplateType[]>([]);

  // Template category options
  const templateCategories = [
    "All",
    "Onboarding",
    "Engagement",
    "Conversion",
    "Nurture",
    "Retention",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add toggleable category sections for timeline
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    Onboarding: true,
    Engagement: true,
    Conversion: true,
    Nurture: true,
    Retention: true,
  });

  // Save state management for manual save button
  const [saveStates, setSaveStates] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<
    Record<string, boolean>
  >({});
  const [lastSaveTime, setLastSaveTime] = useState<Record<string, Date | null>>(
    {}
  );

  // Manual save function
  const handleManualSave = async (templateId?: string) => {
    const targetTemplateId = templateId || activeTemplate?.id;
    if (!targetTemplateId || !editorContents[targetTemplateId]) {
      console.warn("Cannot save: no active template or content");
      return;
    }

    setSaveStates((prev) => ({ ...prev, [targetTemplateId]: "saving" }));

    try {
      await updateStep(
        organizationId,
        sequenceId,
        targetTemplateId,
        authToken,
        {
          content: editorContents[targetTemplateId],
        }
      );

      setSaveStates((prev) => ({ ...prev, [targetTemplateId]: "saved" }));
      setHasUnsavedChanges((prev) => ({ ...prev, [targetTemplateId]: false }));
      setLastSaveTime((prev) => ({ ...prev, [targetTemplateId]: new Date() }));

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [targetTemplateId]: "idle" }));
      }, 2000);
    } catch (error) {
      console.error("Error saving template:", error);
      setSaveStates((prev) => ({ ...prev, [targetTemplateId]: "error" }));
      setError("Failed to save template. Please try again.");

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [targetTemplateId]: "idle" }));
      }, 3000);
    }
  };

  // 2. Debounced and optimistic update helpers
  const debouncedUpdateStep = useRef({});

  const getDebouncedUpdate = useCallback(
    (stepId, field) => {
      if (!debouncedUpdateStep.current[`${stepId}_${field}`]) {
        debouncedUpdateStep.current[`${stepId}_${field}`] = debounce(
          async (value) => {
            setSavingFields((prev) => ({
              ...prev,
              [`${stepId}_${field}`]: true,
            }));
            try {
              await updateStep(organizationId, sequenceId, stepId, authToken, {
                [field]: value,
              });
            } catch (err) {
              setError(err.message);
            } finally {
              setSavingFields((prev) => ({
                ...prev,
                [`${stepId}_${field}`]: false,
              }));
            }
          },
          500
        );
      }
      return debouncedUpdateStep.current[`${stepId}_${field}`];
    },
    [organizationId, sequenceId, authToken]
  );

  const [error, setError] = useState<string | null>(null);

  const [editorContents, setEditorContents] = useState({}); // { [templateId]: content }

  // When templates change (on load or template switch), sync editorContents
  useEffect(() => {
    if (templates.length > 0) {
      const newContents = {};
      templates.forEach((t) => {
        if (t && t.id) {
          newContents[t.id] = t.content;
        }
      });
      setEditorContents(newContents);
      if (
        !activeTemplate ||
        !activeTemplate.id ||
        !newContents[activeTemplate.id]
      ) {
        const validTemplates = templates.filter((t) => t && t.id);
        if (validTemplates.length > 0) {
          setActiveTemplate(validTemplates[0]);
        }
      }
    }
  }, [templates]);

  // When switching activeTemplate, ensure editor shows correct content
  useEffect(() => {
    if (
      activeTemplate &&
      activeTemplate.id &&
      editorContents[activeTemplate.id] !== undefined
    ) {
      setEditorContent(editorContents[activeTemplate.id]);
    }
  }, [activeTemplate, editorContents]);

  // Local state for the current editor content
  const [editorContent, setEditorContent] = useState("");

  // Keyboard shortcut for save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTemplate?.id) {
          handleManualSave(activeTemplate.id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTemplate?.id]);

  // Update editorContent and editorContents on change, and debounce save
  const handleContentChange = (newContent) => {
    if (!activeTemplate?.id) {
      console.warn("Cannot update content: no active template");
      return;
    }

    setEditorContent(newContent);
    setEditorContents((prev) => ({
      ...prev,
      [activeTemplate.id]: newContent,
    }));

    // Mark as having unsaved changes
    setHasUnsavedChanges((prev) => ({ ...prev, [activeTemplate.id]: true }));

    getDebouncedUpdate(activeTemplate.id, "content")(newContent);
  };

  useEffect(() => {
    if (!isLoadingCookies && sequenceId && organizationId && authToken) {
      // console.log('[DelightEmails] Starting sequence and steps fetch');
      setIsLoading(true);
      Promise.all([
        fetchSequence(organizationId, sequenceId, authToken),
        fetchSteps(organizationId, sequenceId, authToken),
      ])
        .then(async ([seq, steps]) => {
          // console.log('[DelightEmails] Sequence fetched:', seq);
          // console.log('[DelightEmails] Event ID from sequence:', seq.event_id);
          setSequence(seq);

          if (seq.event_id) {
            // console.log('[DelightEmails] Setting event ID from sequence:', seq.event_id);
            const eventDetailsObj: EventDetails = {
              _id: seq.event_id,
              name: "",
              type: "",
              eventDate: "",
              location: "",
              eventUrl: "",
              hostCompany: "",
              eventDesc: "",
              targetAudience: "",
              eventTopic: [],
              agendaSummary: [],
              speakers: [],
              serviceFocus: "",
              media: {
                eventLogo: "",
                banner: "",
              },
              eventHashtag: "",
              campaignIds: [],
              creatorUserId: "",
              organizationId: organizationId,
            };
            setEventDetails(eventDetailsObj);

            try {
              const eventData = await fetchEventDetails(seq.event_id);
              if (eventData) {
                // console.log('[DelightEmails] Full event details fetched:', eventData);
                setEventDetails(eventData);
              }
            } catch (error) {
              console.error(
                "[DelightEmails] Error fetching full event details:",
                error
              );
            }
          }

          // Process steps
          if (steps.length === 0) {
            console.log(
              "[DelightEmails] No steps found, generating AI templates"
            );

            // Set AI generation loading state
            setIsGeneratingAITemplates(true);

            // No steps: generate AI templates and save as steps
            let eventData: EventDetails | null = null;
            if (seq.event_id) {
              console.log(
                "[DelightEmails] Fetching event details using sequence event_id:",
                seq.event_id
              );
              eventData = await fetchEventDetails(seq.event_id);
              console.log("[DelightEmails] Event details fetched:", eventData);
            } else if (eventId) {
              console.log(
                "[DelightEmails] Fetching event details using URL param eventId:",
                eventId
              );
              eventData = await fetchEventDetails(eventId);
              console.log("[DelightEmails] Event details fetched:", eventData);
            }

            // Check if we already have saved AI templates in localStorage to avoid regeneration
            const cacheKey = `ai_templates_${sequenceId}`;
            const savedToDatabaseKey = `ai_templates_saved_${sequenceId}`;
            let aiTemplates = [];

            try {
              const cachedTemplates = localStorage.getItem(cacheKey);
              const savedToDatabase = localStorage.getItem(savedToDatabaseKey);

              if (
                cachedTemplates &&
                JSON.parse(cachedTemplates).length > 0 &&
                savedToDatabase === "true"
              ) {
                console.log(
                  "[DelightEmails] AI templates already saved to database, skipping regeneration"
                );
                aiTemplates = [];
              } else if (
                cachedTemplates &&
                JSON.parse(cachedTemplates).length > 0
              ) {
                console.log("[DelightEmails] Using cached AI templates");
                aiTemplates = JSON.parse(cachedTemplates);
              } else {
                console.log("[DelightEmails] Generating new AI templates");
                aiTemplates = await generateAITemplates(
                  eventData,
                  seq,
                  authToken
                );
                // Cache the templates
                localStorage.setItem(cacheKey, JSON.stringify(aiTemplates));
              }
            } catch (error) {
              console.error(
                "[DelightEmails] Error with AI template caching:",
                error
              );
              aiTemplates = await generateAITemplates(
                eventData,
                seq,
                authToken
              );
            }

            console.log("[DelightEmails] AI templates to create:", aiTemplates);

            // Save each AI template as a step only if we have templates to create
            if (aiTemplates.length > 0) {
              for (let i = 0; i < aiTemplates.length; i++) {
                const email = aiTemplates[i];
                console.log(
                  "[DelightEmails] Creating step for AI template:",
                  i + 1
                );
                try {
                  await createStep(organizationId, sequenceId, authToken, {
                    title: (email as any).subject_line || `Email ${i + 1}`,
                    channel: "email",
                    order: i + 1,
                    send_day_offset: i + 1,
                    from: senderEmail,
                    subject: (email as any).subject_line || `Email ${i + 1}`,
                    content: (email as any).email_body || "",
                    metadata: {},
                  });
                } catch (stepError) {
                  console.error(
                    `[DelightEmails] Error creating step ${i + 1}:`,
                    stepError
                  );
                }
              }

              // Mark as saved to database
              localStorage.setItem(savedToDatabaseKey, "true");
            }

            // Refetch steps
            console.log(
              "[DelightEmails] Refetching steps after AI template creation"
            );
            const newSteps = await fetchSteps(
              organizationId,
              sequenceId,
              authToken
            );
            console.log("[DelightEmails] New steps fetched:", newSteps);
            setTemplates(
              newSteps
                .filter((step) => step._id) // Filter out steps without IDs
                .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order field
                .map((step, idx) => ({
                  id: step._id,
                  name: step.title,
                  subject: step.subject || "",
                  day: step.order || idx + 1, // Use order field for day, fallback to index
                  content: step.content,
                  category:
                    step.channel === "email" ? "Engagement" : step.channel,
                  ...step,
                }))
                .filter((template) => template.id) // Ensure all mapped templates have valid IDs
            );

            // Reset AI generation loading state
            setIsGeneratingAITemplates(false);
          } else {
            // console.log('[DelightEmails] Mapping existing steps to templates');
            setTemplates(
              steps
                .filter((step) => step._id) // Filter out steps without IDs
                .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order field
                .map((step, idx) => {
                  // Determine if this is a physical nudge step
                  const isPhysicalNudge =
                    step.channel === "gift" ||
                    (step.metadata &&
                      (step.metadata.type === "physical-nudge" ||
                        step.metadata.displayType === "physical-nudge"));

                  return {
                    id: step._id,
                    name: step.title,
                    subject: step.subject || "",
                    day: step.order || idx + 1, // Use order field for day, fallback to index
                    content: step.content,
                    category: isPhysicalNudge
                      ? "physical-nudge"
                      : step.channel === "email"
                      ? "Engagement"
                      : step.channel,
                    type: isPhysicalNudge ? "physical-nudge" : step.channel,
                    displayType: isPhysicalNudge
                      ? "physical-nudge"
                      : step.channel,
                    channel: step.channel,
                    ...step,
                  };
                })
                .filter((template) => template.id) // Ensure all mapped templates have valid IDs
            );
          }

          return [seq, steps]; // Return the values to maintain the Promise chain
        })
        .catch((error) => {
          console.error(
            "[DelightEmails] Error in sequence/steps fetch:",
            error
          );
          setError(error.message);
          setIsGeneratingAITemplates(false); // Reset AI generation loading state on error
        })
        .finally(() => {
          setIsLoading(false);
          setIsGeneratingAITemplates(false); // Ensure AI generation loading state is reset
        });
    }
  }, [sequenceId, isLoadingCookies, organizationId, authToken]);

  async function fetchEventDetails(eventId: string) {
    // console.log('[DelightEmails] fetchEventDetails called with eventId:', eventId);
    if (!organizationId || !authToken) {
      // console.log('[DelightEmails] fetchEventDetails aborted - missing organizationId or authToken');
      return null;
    }
    try {
      // console.log('[DelightEmails] Making API call to fetch event details');
      const res = await fetch(
        `${API_BASE_URL}/v1/organizations/${organizationId}/events/${eventId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!res.ok) {
        console.error(
          "[DelightEmails] Failed to fetch event details:",
          res.status,
          res.statusText
        );
        throw new Error("Failed to fetch event details");
      }
      const data = await res.json();
      // console.log('[DelightEmails] Event details API response:', data);
      return data.event;
    } catch (error) {
      console.error("[DelightEmails] Error in fetchEventDetails:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (templates.length > 0 && !activeTemplate) {
      setActiveTemplate(templates[0]);
    }
  }, [templates, activeTemplate]);

  useEffect(() => {
    // Focus the input when editing timeline name
    if (editingTimelineName && timelineInputRef.current) {
      timelineInputRef.current.focus();
    }
  }, [editingTimelineName]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        searchTemplatesTerm === "" ||
        template.name
          .toLowerCase()
          .includes(searchTemplatesTerm.toLowerCase()) ||
        template.subject
          .toLowerCase()
          .includes(searchTemplatesTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTemplatesTerm, selectedCategory]);

  // Group templates by category for timeline view
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, typeof templates> = {};

    filteredTemplates.forEach((template) => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });

    return grouped;
  }, [filteredTemplates]);

  // Calculate pagination for timeline
  const paginatedTimelineTemplates = useMemo(() => {
    // When filter/search is applied, just show all matching templates on one page
    if (searchTemplatesTerm || selectedCategory !== "All") {
      return filteredTemplates;
    }

    const startIndex = (currentTimelinePage - 1) * templatesPerPage;
    const endIndex = startIndex + templatesPerPage;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [
    filteredTemplates,
    currentTimelinePage,
    searchTemplatesTerm,
    selectedCategory,
  ]);

  const totalTimelinePages = useMemo(
    () => Math.ceil(filteredTemplates.length / templatesPerPage),
    [filteredTemplates.length]
  );

  // Helper to get the page number for a given template index
  function getPageForIndex(index) {
    return Math.floor(index / templatesPerPage) + 1;
  }

  const handleTemplateChange = (value: string) => {
    const selected = templates.find((t) => t.id === value);
    if (selected && selected.id) {
      setActiveTemplate(selected);
      // Update visible timeline page if needed
      const index = templates.findIndex((t) => t.id === value);
      const page = getPageForIndex(index);
      if (page !== currentTimelinePage) {
        setCurrentTimelinePage(page);
      }
    }
  };

  // 3. Optimistic + debounced editing for subject/content/title
  const handleSubjectChange = (e) => {
    const updatedTemplate = { ...activeTemplate, subject: e.target.value };
    setActiveTemplate(updatedTemplate);
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
    getDebouncedUpdate(updatedTemplate.id, "subject")(e.target.value);
  };

  const handleEditTabName = (id: string, currentName: string) => {
    setEditingTabName(id);
    setEditingTabValue(currentName);
  };

  const handleSaveTabName = async (id) => {
    if (!editingTabValue.trim()) return;
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editingTabValue } : t))
    );
    // Update activeTemplate if this is the active one
    if (activeTemplate && activeTemplate.id === id) {
      setActiveTemplate({ ...activeTemplate, name: editingTabValue });
    }
    setEditingTabName(null);
    setEditingTabValue("");
    getDebouncedUpdate(id, "title")(editingTabValue);
  };

  const handleEditTimelineName = (
    id: string,
    currentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingTimelineName(id);
    setEditingTimelineValue(currentName);
  };

  const handleSaveTimelineName = async (id) => {
    if (!editingTimelineValue.trim()) return;
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editingTimelineValue } : t))
    );
    // Update activeTemplate if this is the active one
    if (activeTemplate && activeTemplate.id === id) {
      setActiveTemplate({ ...activeTemplate, name: editingTimelineValue });
    }
    setEditingTimelineName(null);
    setEditingTimelineValue("");
    getDebouncedUpdate(id, "title")(editingTimelineValue);
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    if (templates.length <= 1) {
      setError("You must have at least one step in the sequence.");
      return;
    }

    // Find the template to get its name and day for the modal
    const template = templates.find((t) => t && t.id === id);
    if (!template) return;

    // Set the step to delete and open the modal
    setStepToDelete({
      id,
      name: template.name || template.subject || "Untitled Step",
      day: template.day,
    });
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!deletingStepId) {
      // Only allow closing if not currently deleting
      setDeleteModalOpen(false);
      setStepToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!stepToDelete) return;

    const { id } = stepToDelete;

    try {
      setDeletingStepId(id);
      setError(null); // Clear any previous errors

      // Optimistically remove the step from UI immediately
      const optimisticTemplates = templates.filter(
        (t) => t && t.id && t.id !== id
      );
      setTemplates(optimisticTemplates);

      // If the deleted template was active, set the first remaining template as active
      if (activeTemplate && activeTemplate.id === id) {
        const validTemplates = optimisticTemplates.filter((t) => t && t.id);
        if (validTemplates.length > 0) {
          setActiveTemplate(validTemplates[0]);
        } else {
          setActiveTemplate(null);
        }
      }

      // Call API to delete the step
      console.log(`Attempting to delete step with ID: ${id}`);
      await deleteStep(organizationId, sequenceId, id, authToken);
      console.log(`Step ${id} deleted successfully`);

      // Refresh the steps from the server to ensure we have the latest state
      const updatedSteps = await fetchSteps(
        organizationId,
        sequenceId,
        authToken
      );

      // Update templates with proper mapping for physical nudges and maintain backend order
      const newTemplates = updatedSteps
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order field
        .map((step, idx) => {
          // Determine if this is a physical nudge step
          const isPhysicalNudge =
            step.channel === "gift" ||
            (step.metadata &&
              (step.metadata.type === "physical-nudge" ||
                step.metadata.displayType === "physical-nudge"));

          return {
            id: step._id,
            name: step.title,
            subject: step.subject || "",
            day: step.order || idx + 1, // Use order field for day, fallback to index
            content: step.content,
            category: isPhysicalNudge
              ? "physical-nudge"
              : step.channel === "email"
              ? "Engagement"
              : step.channel,
            type: isPhysicalNudge ? "physical-nudge" : step.channel,
            displayType: isPhysicalNudge ? "physical-nudge" : step.channel,
            channel: step.channel,
            metadata: step.metadata,
            ...step,
          };
        });

      setTemplates(newTemplates);

      // Update step orders in the backend to ensure sequential numbering (1, 2, 3, ...)
      // This is important because after deletion, we need to close any gaps in the order
      if (newTemplates.length > 0) {
        console.log(
          "Updating step orders after deletion to ensure sequential numbering..."
        );
        const updatedStepsWithOrder = await updateStepOrders(
          organizationId,
          sequenceId,
          authToken,
          newTemplates
        );
        console.log("Step orders updated successfully after deletion");

        // Refresh templates with the updated order numbers from backend
        const finalTemplates = updatedStepsWithOrder
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((step, idx) => {
            // Determine if this is a physical nudge step
            const isPhysicalNudge =
              step.channel === "gift" ||
              (step.metadata &&
                (step.metadata.type === "physical-nudge" ||
                  step.metadata.displayType === "physical-nudge"));

            return {
              id: step._id,
              name: step.title,
              subject: step.subject || "",
              day: step.order || idx + 1, // Use updated order field for day
              content: step.content,
              category: isPhysicalNudge
                ? "physical-nudge"
                : step.channel === "email"
                ? "Engagement"
                : step.channel,
              type: isPhysicalNudge ? "physical-nudge" : step.channel,
              displayType: isPhysicalNudge ? "physical-nudge" : step.channel,
              channel: step.channel,
              metadata: step.metadata,
              ...step,
            };
          });

        setTemplates(finalTemplates);

        // Set active template to first remaining step if the deleted step was active
        if (
          finalTemplates.length > 0 &&
          (!activeTemplate || activeTemplate.id === id)
        ) {
          setActiveTemplate(finalTemplates[0]);
        } else if (finalTemplates.length === 0) {
          setActiveTemplate(null);
        }

        // Check if current page is now empty after deletion and navigate to page 1 if needed
        const totalPagesAfterDeletion = Math.ceil(
          finalTemplates.length / templatesPerPage
        );
        if (
          currentTimelinePage > totalPagesAfterDeletion &&
          totalPagesAfterDeletion > 0
        ) {
          setCurrentTimelinePage(1);
          console.log(
            `Navigated to page 1 because page ${currentTimelinePage} is now empty after deletion`
          );
        } else if (finalTemplates.length === 0) {
          setCurrentTimelinePage(1);
          console.log("Reset to page 1 because no templates remain");
        }
      }
      setDeletingStepId(null);
      setDeleteModalOpen(false);
      setStepToDelete(null);
    } catch (error) {
      console.error("Error deleting step:", error);
      setError(`Failed to delete step: ${(error as Error).message}`);

      // Restore the original templates on error
      setTemplates(templates);
      if (activeTemplate && activeTemplate.id === id) {
        setActiveTemplate(activeTemplate);
      }

      setDeletingStepId(null);
    }
  };

  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSequence = async () => {
    // console.log('[DelightEmails] Starting sequence save');
    setIsSaving(true);
    try {
      await updateSequence(organizationId, sequenceId, authToken, {
        name: sequence.name,
      });
      // console.log('[DelightEmails] Sequence updated successfully');
      // Optionally refetch sequence
      const seq = await fetchSequence(organizationId, sequenceId, authToken);
      // console.log('[DelightEmails] Sequence refetched:', seq);
      setSequence(seq);

      // Show success toast as before
      const successToast = document.getElementById("success-toast");
      if (successToast) {
        successToast.classList.remove("opacity-0", "translate-y-2");
        successToast.classList.add("opacity-100", "translate-y-0");
        setTimeout(() => {
          successToast.classList.add("opacity-0", "translate-y-2");
          successToast.classList.remove("opacity-100", "translate-y-0");
        }, 1000);
      }
      // Navigate back to Delight Engage page after save
      setTimeout(() => {
        // console.log('[DelightEmails] Navigating back to Delight Engage page');
        router.push("/delight-engage");
      }, 1200);
    } catch (err) {
      console.error("[DelightEmails] Error saving sequence:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle category expansion in timeline
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  // Handle drag start for reordering
  const handleDragStart = (id: string) => {
    setIsDragging(true);
    setDraggedItem(id);
  };

  // Handle drag over for reordering
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === id) return;

    const draggedIndex = templates.findIndex((t) => t.id === draggedItem);
    const targetIndex = templates.findIndex((t) => t.id === id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTemplates = [...templates];
    const [removed] = newTemplates.splice(draggedIndex, 1);
    newTemplates.splice(targetIndex, 0, removed);

    // Update day numbers based on new order
    const updatedTemplates = newTemplates.map((template, index) => ({
      ...template,
      day: index + 1,
    }));

    setTemplates(updatedTemplates);
  };

  // Handle drag end
  const handleDragEnd = async () => {
    setIsDragging(false);
    const draggedItemId = draggedItem;
    setDraggedItem(null);

    // Only save if there was actually a drag operation
    if (!draggedItemId) return;

    try {
      console.log("Saving step order after drag-and-drop...");

      // Update step orders in the backend
      await updateStepOrders(organizationId, sequenceId, authToken, templates);

      console.log("Step order saved successfully!");
    } catch (error) {
      console.error("Error saving step order:", error);
      // Could optionally set a general error state here if needed
    }
  };

  // Navigation controls for tabs
  const handleTabsScroll = (direction: -1 | 1) => {
    const newStart = Math.max(
      0,
      Math.min(templates.length - maxVisibleTabs, visibleTabsStart + direction)
    );
    setVisibleTabsStart(newStart);
  };

  // Determine if a template should be shown in the timeline based on pagination and filtering
  const isTemplateVisibleInTimeline = (template: any) => {
    if (searchTemplatesTerm || selectedCategory !== "All") {
      return true; // Show all filtered templates
    }

    const templateIndex = templates.indexOf(template);
    const startIndex = (currentTimelinePage - 1) * templatesPerPage;
    const endIndex = startIndex + templatesPerPage;

    return templateIndex >= startIndex && templateIndex < endIndex;
  };

  // Handle category change for filtering
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset to first page when changing categories
    setCurrentTimelinePage(1);
  };

  // 4. Show saving indicator in the UI (for subject/content/title fields)
  // Example: {savingFields[`${template.id}_subject`] && <span>Saving...</span>}
  const [savingFields, setSavingFields] = useState({});

  // Add state for showing add step modal
  const [showAddStepModal, setShowAddStepModal] = useState(false);

  // Add state for managing physical nudges
  const [showPhysicalNudgeEditor, setShowPhysicalNudgeEditor] = useState(false);
  const [activePhysicalNudge, setActivePhysicalNudge] = useState<any>(null);
  const [physicalNudges, setPhysicalNudges] = useState<any[]>([]);

  // Add granular loading states to avoid full page reloads
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isAddingPhysicalNudge, setIsAddingPhysicalNudge] = useState(false);
  const [isSavingPhysicalNudge, setIsSavingPhysicalNudge] = useState(false);

  // Track individual step deletion instead of global state
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<{
    id: string;
    name: string;
    day: number;
  } | null>(null);

  // Add specific loading state for AI template generation
  const [isGeneratingAITemplates, setIsGeneratingAITemplates] = useState(false);

  // Functions to handle adding different types of steps
  const handleAddStepModalOpen = () => {
    setShowAddStepModal(true);
  };

  const handleAddEmail = async () => {
    if (!organizationId || !sequenceId || !authToken) {
      console.error("Missing required parameters for creating email step");
      setError("Missing required parameters. Please try again.");
      return;
    }

    const newStep = {
      title: `Email ${templates.length + 1}`,
      channel: "email",
      order: templates.length + 1,
      send_day_offset: templates.length + 1,
      from: senderEmail,
      subject: "New Email Subject",
      content: "<div>Enter your email content here...</div>",
      metadata: {},
    };

    try {
      setIsAddingEmail(true); // Only set email loading state
      setError(null); // Clear any previous errors
      console.log("Creating new email step:", newStep);

      // Optimistically add the step to UI first
      const tempId = `temp-${Date.now()}`;
      const optimisticStep = {
        id: tempId,
        _id: tempId,
        name: newStep.title,
        subject: newStep.subject,
        day: newStep.send_day_offset,
        content: newStep.content,
        category: "Engagement",
        type: "email",
        displayType: "email",
        channel: "email",
        metadata: newStep.metadata,
        title: newStep.title,
        order: newStep.order,
        send_day_offset: newStep.send_day_offset,
        from: newStep.from,
        isOptimistic: true,
      };

      setTemplates([...templates, optimisticStep]);

      // Create the step via API
      const stepId = await createStep(
        organizationId,
        sequenceId,
        authToken,
        newStep
      );
      console.log("Created email step with ID:", stepId);

      // Fetch all steps to get updated data
      const steps = await fetchSteps(organizationId, sequenceId, authToken);
      console.log("Fetched steps after email creation:", steps);

      // Find the newly created step from server
      const createdStep = steps.find((step) => step._id === stepId);

      if (createdStep) {
        // Update the optimistic step with real server data instead of replacing entire array
        setTemplates((prevTemplates) =>
          prevTemplates.map((template) => {
            if (template.isOptimistic && template._id === tempId) {
              // Update the optimistic step with real data
              const isPhysicalNudge =
                createdStep.channel === "gift" ||
                (createdStep.metadata &&
                  (createdStep.metadata.type === "physical-nudge" ||
                    createdStep.metadata.displayType === "physical-nudge"));

              return {
                id: createdStep._id,
                _id: createdStep._id,
                name: createdStep.title,
                subject: createdStep.subject || "",
                day: steps.findIndex((s) => s._id === createdStep._id) + 1, // Use position in steps array
                content: createdStep.content,
                category: isPhysicalNudge
                  ? "physical-nudge"
                  : createdStep.channel === "email"
                  ? "Engagement"
                  : createdStep.channel,
                type: isPhysicalNudge ? "physical-nudge" : createdStep.channel,
                displayType: isPhysicalNudge
                  ? "physical-nudge"
                  : createdStep.channel,
                channel: createdStep.channel,
                metadata: createdStep.metadata,
                ...createdStep,
                isOptimistic: false, // Remove optimistic flag
              };
            }
            return template;
          })
        );

        // Set the newly created step as active
        const updatedStep = {
          id: createdStep._id,
          _id: createdStep._id,
          name: createdStep.title,
          subject: createdStep.subject || "",
          day: steps.findIndex((s) => s._id === createdStep._id) + 1,
          content: createdStep.content,
          category:
            createdStep.channel === "email"
              ? "Engagement"
              : createdStep.channel,
          type: createdStep.channel,
          displayType: createdStep.channel,
          channel: createdStep.channel,
          metadata: createdStep.metadata,
          ...createdStep,
        };
        setActiveTemplate(updatedStep);

        // Navigate to the page containing the new step
        const newStepIndex = steps.findIndex((s) => s._id === createdStep._id);
        const targetPage = Math.ceil((newStepIndex + 1) / templatesPerPage);
        if (targetPage !== currentTimelinePage) {
          setCurrentTimelinePage(targetPage);
          console.log(
            `Navigated to page ${targetPage} for new step at index ${newStepIndex}`
          );
        }
      } else {
        // Fallback: refresh entire list if step not found
        const newTemplates = steps
          .map((step, idx) => {
            const isPhysicalNudge =
              step.channel === "gift" ||
              (step.metadata &&
                (step.metadata.type === "physical-nudge" ||
                  step.metadata.displayType === "physical-nudge"));

            return {
              id: step._id,
              name: step.title,
              subject: step.subject || "",
              day: idx + 1,
              content: step.content,
              category: isPhysicalNudge
                ? "physical-nudge"
                : step.channel === "email"
                ? "Engagement"
                : step.channel,
              type: isPhysicalNudge ? "physical-nudge" : step.channel,
              displayType: isPhysicalNudge ? "physical-nudge" : step.channel,
              channel: step.channel,
              metadata: step.metadata,
              ...step,
            };
          })
          .filter((template) => template.id);

        setTemplates(newTemplates);

        // Focus on the newly created step
        const added = newTemplates.find((t) => t._id === stepId);
        if (added && added.id) {
          setActiveTemplate(added);

          // Navigate to the page containing the new step
          const newStepIndex = newTemplates.findIndex((t) => t._id === stepId);
          const targetPage = Math.ceil((newStepIndex + 1) / templatesPerPage);
          if (targetPage !== currentTimelinePage) {
            setCurrentTimelinePage(targetPage);
            console.log(
              `Navigated to page ${targetPage} for new step (fallback) at index ${newStepIndex}`
            );
          }
        }
      }

      setIsAddingEmail(false);
      setShowAddStepModal(false); // Close the modal on success
    } catch (err) {
      console.error("Error creating email step:", err);
      setError(`Failed to create email step: ${(err as Error).message}`);

      // Remove optimistic update on error
      setTemplates(templates.filter((t) => !t.isOptimistic));

      setIsAddingEmail(false);
    }
  };

  const handleAddPhysicalNudge = async () => {
    if (!organizationId || !sequenceId || !authToken) {
      console.error("Missing required parameters for creating physical nudge");
      setError("Missing required parameters. Please try again.");
      return;
    }

    // Ensure we're using the correct channel value and format for physical nudges
    const newStep = {
      title: `Physical Nudge ${templates.length + 1}`,
      channel: "gift", // "gift" is the backend enum value for physical gifts
      order: templates.length + 1,
      send_day_offset: templates.length + 1,
      from: senderEmail,
      subject: "A Special Gift For You",
      content: "<div><p>We have a special gift for you!</p></div>", // Ensure proper HTML format
      metadata: {
        giftType: "manual", // Required by the backend
        message: "We have a special gift for you!",
        templateId: "template1",
        logoUrl: "/Logo Final.png",
        customMessage: "We have reserved a special gift for you!",
        type: "physical-nudge", // Add this for UI consistency
        displayType: "physical-nudge", // Add this for frontend display
      },
    };

    try {
      console.log(
        "Creating physical nudge with data:",
        JSON.stringify(newStep, null, 2)
      );
      console.log("Channel value being sent:", newStep.channel);

      setIsAddingPhysicalNudge(true); // Use granular loading state instead of setIsLoading(true)
      setError(null); // Clear any previous errors

      // Optimistically add the physical nudge step to UI first
      const tempId = `temp-${Date.now()}`;
      const optimisticStep = {
        id: tempId,
        _id: tempId,
        name: newStep.title,
        subject: newStep.subject,
        day: newStep.send_day_offset,
        content: newStep.content,
        category: "physical-nudge",
        type: "physical-nudge",
        displayType: "physical-nudge",
        channel: "gift",
        metadata: newStep.metadata,
        title: newStep.title,
        order: newStep.order,
        send_day_offset: newStep.send_day_offset,
        from: newStep.from,
        isOptimistic: true, // Flag to indicate this is an optimistic update
      };

      // Add optimistic step to templates immediately
      const optimisticTemplates = [...templates, optimisticStep];
      setTemplates(optimisticTemplates);
      setActiveTemplate(optimisticStep);
      setActivePhysicalNudge(optimisticStep);
      setShowPhysicalNudgeEditor(true);

      // Move pagination to show the new step
      const index = optimisticTemplates.length - 1;
      const page = getPageForIndex(index);
      setCurrentTimelinePage(page);

      // Now create the step on the server
      const stepId = await createStep(
        organizationId,
        sequenceId,
        authToken,
        newStep
      );
      console.log("Physical nudge created successfully with ID:", stepId);

      // Fetch the updated steps from the server and replace optimistic update
      const steps = await fetchSteps(organizationId, sequenceId, authToken);
      console.log("Fetched steps after physical nudge creation:", steps);

      // Add the new physical nudge to state
      const newNudge = steps.find((step) => step._id === stepId);
      if (newNudge) {
        setPhysicalNudges([...physicalNudges, newNudge]);

        // Update the optimistic step with real server data instead of replacing entire array
        setTemplates((prevTemplates) =>
          prevTemplates.map((template) => {
            if (template.isOptimistic && template._id === tempId) {
              // Update the optimistic step with real data
              const isPhysicalNudge =
                newNudge.channel === "gift" ||
                (newNudge.metadata &&
                  (newNudge.metadata.type === "physical-nudge" ||
                    newNudge.metadata.displayType === "physical-nudge"));

              return {
                id: newNudge._id,
                _id: newNudge._id,
                name: newNudge.title,
                subject: newNudge.subject || "",
                day: steps.findIndex((s) => s._id === newNudge._id) + 1, // Use position in steps array
                content: newNudge.content || "",
                category: isPhysicalNudge
                  ? "physical-nudge"
                  : newNudge.channel === "email"
                  ? "Engagement"
                  : newNudge.channel,
                type: isPhysicalNudge ? "physical-nudge" : newNudge.channel,
                displayType: isPhysicalNudge
                  ? "physical-nudge"
                  : newNudge.channel,
                channel: newNudge.channel,
                metadata: newNudge.metadata,
                ...newNudge,
                isOptimistic: false, // Remove optimistic flag
              };
            }
            return template;
          })
        );

        // Set the newly created step as active
        const updatedStep = {
          id: newNudge._id,
          _id: newNudge._id,
          name: newNudge.title,
          subject: newNudge.subject || "",
          day: steps.findIndex((s) => s._id === newNudge._id) + 1,
          content: newNudge.content || "",
          category: "physical-nudge",
          type: "physical-nudge",
          displayType: "physical-nudge",
          channel: newNudge.channel,
          metadata: newNudge.metadata,
          ...newNudge,
        };
        setActiveTemplate(updatedStep);
        setActivePhysicalNudge(updatedStep);
        setShowPhysicalNudgeEditor(true);
      } else {
        // Fallback: refresh entire list if step not found
        const newTemplates = steps.map((step, idx) => {
          const isPhysicalNudge =
            step.channel === "gift" ||
            (step.metadata &&
              (step.metadata.type === "physical-nudge" ||
                step.metadata.displayType === "physical-nudge"));

          return {
            id: step._id,
            name: step.title,
            subject: step.subject || "",
            day: idx + 1,
            content: step.content || "",
            category: isPhysicalNudge
              ? "physical-nudge"
              : step.channel === "email"
              ? "Engagement"
              : step.channel,
            type: isPhysicalNudge ? "physical-nudge" : step.channel,
            displayType: isPhysicalNudge ? "physical-nudge" : step.channel,
            channel: step.channel,
            metadata: step.metadata,
            ...step,
          };
        });

        setTemplates(newTemplates);

        // Set the new physical nudge as active
        const added = newTemplates.find((t) => t._id === stepId);
        if (added && added.id) {
          setActiveTemplate(added);
          setActivePhysicalNudge(added);
          setShowPhysicalNudgeEditor(true);
        }
      }

      setIsAddingPhysicalNudge(false);
      setShowAddStepModal(false); // Close the modal on success
    } catch (err) {
      console.error("Error creating physical nudge:", err);
      setError(`Failed to create physical nudge: ${(err as Error).message}`);

      // Remove optimistic update on error
      setTemplates(templates.filter((t) => !t.isOptimistic));
      setShowPhysicalNudgeEditor(false);

      setIsAddingPhysicalNudge(false);
    }
  };

  // 1. Update handleSavePhysicalNudge to accept a nudgeId
  const handleSavePhysicalNudge = async (nudgeData: any) => {
    if (!activeTemplate?.id || !organizationId || !sequenceId || !authToken) {
      console.error(
        "[DelightEmails] Missing required data to save physical nudge"
      );
      setError("Missing required data to save physical nudge");
      return;
    }

    try {
      //console.log('[DelightEmails] Starting physical nudge save:', { nudgeData, nudgeId: activeTemplate.id });
      setIsSavingPhysicalNudge(true); // Use granular loading state instead of setIsLoading(true)

      // Remove redundant nested metadata - extract only the metadata fields that aren't
      // already at the top level of the step object
      const {
        type,
        displayType,
        category,
        channel,
        title,
        day,
        send_day_offset,
        content,
        metadata,
        ...cleanedNudgeData
      } = nudgeData;

      // Find the correct nudge by id
      if (!activeTemplate?.id) {
        console.error("[DelightEmails] No active template with valid id");
        setError("No active template to update");
        setIsSavingPhysicalNudge(false);
        return;
      }

      const nudgeToUpdate = templates.find((t) => t.id === activeTemplate.id);
      if (!nudgeToUpdate) {
        console.error(
          "[DelightEmails] Could not find nudge to update:",
          activeTemplate.id
        );
        setError("Could not find the nudge to update");
        setIsSavingPhysicalNudge(false);
        return;
      }

      const updatedStep = {
        ...nudgeToUpdate,
        channel: "gift",
        subject: "A Special Gift For You",
        metadata: {
          ...nudgeToUpdate.metadata,
          ...cleanedNudgeData,
          type: "physical-nudge",
          displayType: "physical-nudge",
          metadata: undefined,
        },
        type: "physical-nudge",
        displayType: "physical-nudge",
        category: "physical-nudge",
      };

      // console.log('[DelightEmails] Updating step with data:', updatedStep);
      await updateStep(
        organizationId,
        sequenceId,
        activeTemplate.id,
        authToken,
        updatedStep
      );

      // Fetch the updated steps
      // console.log('[DelightEmails] Fetching updated steps');
      const steps = await fetchSteps(organizationId, sequenceId, authToken);
      const newTemplates = steps
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order field
        .map((step, idx) => ({
          id: step._id,
          name: step.title,
          subject: step.subject || "",
          day: step.order || idx + 1, // Use order field for day, fallback to index
          content: step.content || "",
          category: step.channel,
          type: step.type,
          displayType: step.displayType,
          channel: step.channel,
          metadata: step.metadata,
          ...step,
        }))
        .filter((template) => template.id); // Ensure all mapped templates have valid IDs

      // console.log('[DelightEmails] Setting new templates');
      setTemplates(newTemplates);

      // Preserve the same active tab
      if (activeTemplate?.id) {
        const updatedNudge = newTemplates.find(
          (t) => t.id === activeTemplate.id
        );
        if (updatedNudge) {
          // console.log('[DelightEmails] Updating active template');
          setActiveTemplate(updatedNudge);
          setActivePhysicalNudge(updatedNudge);
        }
      }

      setShowPhysicalNudgeEditor(false);
    } catch (error) {
      console.error("[DelightEmails] Error saving physical nudge:", error);
      setError(error.message);
    } finally {
      setIsSavingPhysicalNudge(false); // Use granular loading state
    }
  };

  // Check if the active template is a physical nudge
  const isPhysicalNudge =
    activeTemplate &&
    (activeTemplate.channel === "gift" ||
      activeTemplate.type === "physical-nudge" ||
      activeTemplate.displayType === "physical-nudge" ||
      activeTemplate.category === "physical-nudge" ||
      (activeTemplate.metadata &&
        (activeTemplate.metadata.type === "physical-nudge" ||
          activeTemplate.metadata.displayType === "physical-nudge")));

  // Add state for campaign recipients and LinkedIn check
  const [allRecipientsHaveLinkedin, setAllRecipientsHaveLinkedin] =
    useState<boolean>(true);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Fetch campaign recipients and check LinkedIn URLs
  const fetchCampaignRecipients = useCallback(
    async (campaignId: string) => {
      if (!campaignId || !authToken) return;
      setRecipientsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/campaigns/${campaignId}/recipients`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            method: "GET",
          }
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const allHaveLinkedinUrl = data.data.every(
            (recipient: any) =>
              recipient.linkedinUrl && recipient.linkedinUrl.trim() !== ""
          );
          setAllRecipientsHaveLinkedin(allHaveLinkedinUrl);
        } else {
          setAllRecipientsHaveLinkedin(false);
        }
      } catch (error) {
        setAllRecipientsHaveLinkedin(false);
      } finally {
        setRecipientsLoading(false);
      }
    },
    [authToken]
  );

  // Fetch recipients when event/campaign changes
  useEffect(() => {
    if (eventDetails?.campaignIds?.[0]) {
      fetchCampaignRecipients(eventDetails.campaignIds[0]);
    }
  }, [eventDetails, fetchCampaignRecipients]);

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF] overflow-hidden">
      {/* Add Step Modal */}
      <AddStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onAddEmail={handleAddEmail}
        onAddPhysicalNudge={handleAddPhysicalNudge}
        isAddingEmail={isAddingEmail}
        isAddingPhysicalNudge={isAddingPhysicalNudge}
      />

      {/* Delete Step Modal */}
      <DeleteStepModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        stepName={stepToDelete?.name || ""}
        stepNumber={stepToDelete?.day || 0}
        isDeleting={!!deletingStepId}
      />

      <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto w-auto">
        <AdminSidebar />
      </div>
      <div className="pt-3 bg-primary w-full overflow-hidden">
        <div className="p-6 bg-white rounded-tl-3xl h-screen overflow-y-auto">
          {/* Notification Toasts */}
          <div
            id="saving-toast"
            className="fixed top-6 right-6 bg-white shadow-lg rounded-lg px-4 py-3 flex items-center transition-all duration-300 opacity-0 translate-y-2 z-50"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
            <span className="text-gray-700">Saving changes...</span>
          </div>

          <div
            id="success-toast"
            className="fixed top-6 right-6 bg-green-50 shadow-lg rounded-lg px-4 py-3 flex items-center transition-all duration-300 opacity-0 translate-y-2 z-50"
          >
            <svg
              className="h-5 w-5 text-green-500 mr-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700">Sequence saved successfully!</span>
          </div>

          {/* Header Section using PageHeader */}
          <PageHeader
            backLink={{
              href: "/delight-engage",
              text: "Back to Delight Engage"
            }}
            title="Sequence Builder"
            description="Create, edit, and organize your automated email sequence for campaigns."
            chips={
              eventDetails?.name
                ? [{ text: eventDetails.name, color: "blue" }]
                : []
            }
            primaryButton={{
              text: isSaving ? "Saving..." : "Save Sequence",
              icon: Save,
              onClick: handleSaveSequence,
              variant: "primary"
            }}
            showDivider={true}
            className="pt-2"
          />

          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            {(isLoading || isGeneratingAITemplates) && templates.length === 0 ? ( // Show skeleton during initial loading or AI generation
            <div className="grid grid-cols-3 gap-6">
              {/* Left Sidebar - Timeline Skeleton */}
              <div className="col-span-1 border border-[#EAECF0] rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Header skeleton */}
                <div className="p-4 border-b border-[#EAECF0] bg-gradient-to-r from-purple-50 to-white">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>

                {/* Timeline content skeleton */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>

                  {/* Timeline items skeleton */}
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2 ml-7">
                          <div className="w-3 h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add button skeleton */}
                  <div className="mt-6 space-y-2">
                    <div className="h-9 bg-gray-200 rounded w-full"></div>
                    <div className="h-9 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>

              {/* Right Side - Email Content Skeleton */}
              <div className="col-span-2 border border-[#EAECF0] rounded-lg overflow-hidden bg-white shadow-sm relative">
                {/* Content generation overlay */}
                {isGeneratingAITemplates && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <InfinityLoader width={48} height={48} className="mb-4" />
                    <div className="text-lg font-medium text-gray-700 mb-2">
                      Generating Email Content
                    </div>
                    <div className="text-sm text-gray-500 text-center max-w-md">
                      Please wait while we create personalized email
                      templates...
                    </div>
                  </div>
                )}

                {/* Header skeleton */}
                <div className="p-4 border-b border-[#EAECF0] bg-gradient-to-r from-blue-50 to-white">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>

                {/* Email editor content skeleton */}
                <div className="p-4 space-y-4">
                  {/* Action buttons skeleton */}
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 bg-gray-200 rounded w-20"></div>
                      <div className="h-7 bg-gray-200 rounded w-16"></div>
                      <div className="h-7 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>

                  {/* Editor toolbar skeleton */}
                  <div className="border border-[#D0D5DD] rounded-lg overflow-hidden">
                    <div className="p-2 bg-gray-50 border-b border-[#D0D5DD]">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 8 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Editor content area skeleton */}
                    <div className="p-4 space-y-3 min-h-[300px]">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="mt-6 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>

                  {/* Settings sections skeleton */}
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-3 gap-6">
                {/* Left Sidebar - Template Timeline */}
                <div
                  className={`col-span-1 border border-[#EAECF0] rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${
                    isTimelineCollapsed ? "col-span-1" : "col-span-1"
                  }`}
                >
                  <div className="p-4 border-b border-[#EAECF0] bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex justify-between items-center">
                      <h2 className="font-medium text-gray-900">
                        Email Sequence
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500">
                      Manage your sequence of emails
                    </p>

                    {/* Search and filter templates in timeline */}
                    {showTemplateSearch && (
                      <div className="mt-3 space-y-2">
                        <div className="relative">
                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTemplatesTerm}
                            onChange={(e) =>
                              setSearchTemplatesTerm(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {templateCategories.map((category) => (
                            <button
                              key={category}
                              onClick={() => handleCategoryChange(category)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                selectedCategory === category
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Email Timeline</span>
                        <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Drag to reorder
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {filteredTemplates.length} emails
                      </span>
                    </h3>

                    {/* Timeline content */}
                    <div className="space-y-2">
                      {/* No results state */}
                      {filteredTemplates.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Mail className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm font-medium">
                            No email templates found
                          </p>
                          <p className="text-xs mt-1">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      )}

                      {/* Regular timeline list - show when not filtering */}
                      {searchTemplatesTerm === "" &&
                        selectedCategory === "All" && (
                          <div className="space-y-4">
                            <AnimatePresence>
                              {paginatedTimelineTemplates.map(
                                (template, index) => (
                                  <motion.div
                                    key={template.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                      activeTemplate?.id === template.id
                                        ? template.category === "physical-nudge"
                                          ? "border-purple-500 bg-purple-50"
                                          : "border-primary bg-primary/5"
                                        : "border-gray-200 hover:border-gray-300"
                                    } ${
                                      isDragging && draggedItem === template.id
                                        ? "opacity-50"
                                        : "opacity-100"
                                    }`}
                                    onClick={() =>
                                      handleTemplateChange(template.id)
                                    }
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: index * 0.05,
                                    }}
                                    draggable
                                    onDragStart={() =>
                                      handleDragStart(template.id)
                                    }
                                    onDragOver={(e) =>
                                      handleDragOver(e, template.id)
                                    }
                                    onDragEnd={handleDragEnd}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                          className={`flex items-center justify-center w-5 h-5 text-white text-xs rounded-full flex-shrink-0 relative ${
                                            template.type === "physical-nudge"
                                              ? "bg-purple-600"
                                              : "bg-primary"
                                          }`}
                                        >
                                          {/* Background icon based on type */}
                                          {template.type ===
                                          "physical-nudge" ? (
                                            <Gift
                                              size={10}
                                              className="absolute opacity-20"
                                            />
                                          ) : (
                                            <Mail
                                              size={10}
                                              className="absolute opacity-20"
                                            />
                                          )}
                                          {template.day}
                                        </span>
                                        {editingTimelineName === template.id ? (
                                          <div className="flex-1 min-w-0">
                                            <input
                                              ref={timelineInputRef}
                                              type="text"
                                              value={editingTimelineValue}
                                              onChange={(e) =>
                                                setEditingTimelineValue(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={() =>
                                                handleSaveTimelineName(
                                                  template.id
                                                )
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                  handleSaveTimelineName(
                                                    template.id
                                                  );
                                                if (e.key === "Escape")
                                                  setEditingTimelineName(null);
                                              }}
                                              className="w-full px-2 py-1 text-sm border border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex items-center flex-1 min-w-0 group">
                                            <span className="font-medium text-gray-900 text-sm truncate">
                                              {template.name}
                                            </span>
                                            <button
                                              className="ml-1 p-1 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={(e) =>
                                                handleEditTimelineName(
                                                  template.id,
                                                  template.name,
                                                  e
                                                )
                                              }
                                            >
                                              <Edit size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <motion.button
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={(e) =>
                                          handleDeleteTemplate(template.id, e)
                                        }
                                        disabled={
                                          deletingStepId === template.id
                                        }
                                        whileHover={
                                          deletingStepId !== template.id
                                            ? { scale: 1.1 }
                                            : {}
                                        }
                                        whileTap={
                                          deletingStepId !== template.id
                                            ? { scale: 0.9 }
                                            : {}
                                        }
                                      >
                                        {deletingStepId === template.id ? (
                                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-500"></div>
                                        ) : (
                                          <Trash size={14} />
                                        )}
                                      </motion.button>
                                    </div>
                                    <div className="flex items-center justify-between text-xs ml-7">
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={12} />
                                        <span>Day {template.day}</span>
                                        {template.category ===
                                          "physical-nudge" ||
                                        template.type === "physical-nudge" ||
                                        template.displayType ===
                                          "physical-nudge" ||
                                        template.channel === "gift" ||
                                        (template.metadata &&
                                          (template.metadata.type ===
                                            "physical-nudge" ||
                                            template.metadata.displayType ===
                                              "physical-nudge")) ? (
                                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-purple-700 bg-purple-100 flex items-center">
                                            <Gift size={10} className="mr-1" />
                                            Gift
                                          </span>
                                        ) : (
                                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-primary bg-primary/10 flex items-center">
                                            <Mail size={10} className="mr-1" />
                                            Email
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              )}
                            </AnimatePresence>

                            {/* Pagination for timeline */}
                            {totalTimelinePages > 1 && (
                              <div className="flex justify-center items-center gap-1 mt-3">
                                <button
                                  onClick={() =>
                                    setCurrentTimelinePage((p) =>
                                      Math.max(1, p - 1)
                                    )
                                  }
                                  disabled={currentTimelinePage === 1}
                                  className="p-1 text-gray-500 hover:text-primary disabled:opacity-30"
                                >
                                  &laquo;
                                </button>
                                {Array.from(
                                  { length: totalTimelinePages },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentTimelinePage(page)}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors ${
                                      currentTimelinePage === page
                                        ? "bg-primary text-white"
                                        : "text-gray-500 hover:bg-gray-100"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                                <button
                                  onClick={() =>
                                    setCurrentTimelinePage((p) =>
                                      Math.min(totalTimelinePages, p + 1)
                                    )
                                  }
                                  disabled={
                                    currentTimelinePage === totalTimelinePages
                                  }
                                  className="p-1 text-gray-500 hover:text-primary disabled:opacity-30"
                                >
                                  &raquo;
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Categorized timeline view - show when filtering */}
                      {(searchTemplatesTerm !== "" ||
                        selectedCategory !== "All") && (
                        <div className="space-y-2">
                          {Object.entries(templatesByCategory).map(
                            ([category, templatesInCategory]) => (
                              <div key={category} className="mb-2">
                                <div
                                  className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded cursor-pointer"
                                  onClick={() =>
                                    toggleCategoryExpansion(category)
                                  }
                                >
                                  <span className="text-xs font-medium text-gray-700">
                                    {category}
                                  </span>
                                  <button className="p-1 text-gray-500">
                                    {expandedCategories[category] ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                  </button>
                                </div>

                                {expandedCategories[category] && (
                                  <div className="space-y-2 mt-2 pl-2">
                                    <AnimatePresence>
                                      {templatesInCategory.map(
                                        (template, index) => (
                                          <motion.div
                                            key={template.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                              activeTemplate?.id === template.id
                                                ? template.category ===
                                                  "physical-nudge"
                                                  ? "border-purple-500 bg-purple-50"
                                                  : "border-primary bg-primary/5"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() =>
                                              handleTemplateChange(template.id)
                                            }
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{
                                              duration: 0.2,
                                              delay: index * 0.03,
                                            }}
                                            draggable
                                            onDragStart={() =>
                                              handleDragStart(template.id)
                                            }
                                            onDragOver={(e) =>
                                              handleDragOver(e, template.id)
                                            }
                                            onDragEnd={handleDragEnd}
                                          >
                                            <div className="flex justify-between items-center mb-1">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span
                                                  className={`flex items-center justify-center w-5 h-5 text-white text-xs rounded-full flex-shrink-0 relative ${
                                                    template.type ===
                                                    "physical-nudge"
                                                      ? "bg-purple-600"
                                                      : "bg-primary"
                                                  }`}
                                                >
                                                  {/* Background icon based on type */}
                                                  {template.type ===
                                                  "physical-nudge" ? (
                                                    <Gift
                                                      size={10}
                                                      className="absolute opacity-20"
                                                    />
                                                  ) : (
                                                    <Mail
                                                      size={10}
                                                      className="absolute opacity-20"
                                                    />
                                                  )}
                                                  {template.day}
                                                </span>
                                                <div className="flex items-center flex-1 min-w-0 group">
                                                  <span className="font-medium text-gray-900 text-sm truncate">
                                                    {template.name}
                                                  </span>
                                                  <button
                                                    className="ml-1 p-1 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) =>
                                                      handleEditTimelineName(
                                                        template.id,
                                                        template.name,
                                                        e
                                                      )
                                                    }
                                                  >
                                                    <Edit size={12} />
                                                  </button>
                                                </div>
                                              </div>
                                              <motion.button
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={(e) =>
                                                  handleDeleteTemplate(
                                                    template.id,
                                                    e
                                                  )
                                                }
                                                disabled={
                                                  deletingStepId === template.id
                                                }
                                                whileHover={
                                                  deletingStepId !== template.id
                                                    ? { scale: 1.1 }
                                                    : {}
                                                }
                                                whileTap={
                                                  deletingStepId !== template.id
                                                    ? { scale: 0.9 }
                                                    : {}
                                                }
                                              >
                                                {deletingStepId ===
                                                template.id ? (
                                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-500"></div>
                                                ) : (
                                                  <Trash size={14} />
                                                )}
                                              </motion.button>
                                            </div>
                                            <div className="flex items-center justify-between text-xs ml-7">
                                              <div className="flex items-center gap-2 text-gray-500">
                                                <Calendar size={12} />
                                                <span>Day {template.day}</span>
                                                {template.category ===
                                                  "physical-nudge" ||
                                                template.type ===
                                                  "physical-nudge" ||
                                                template.displayType ===
                                                  "physical-nudge" ||
                                                template.channel === "gift" ||
                                                (template.metadata &&
                                                  (template.metadata.type ===
                                                    "physical-nudge" ||
                                                    template.metadata
                                                      .displayType ===
                                                      "physical-nudge")) ? (
                                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-purple-700 bg-purple-100 flex items-center">
                                                    <Gift
                                                      size={10}
                                                      className="mr-1"
                                                    />
                                                    Gift
                                                  </span>
                                                ) : (
                                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-primary bg-primary/10 flex items-center">
                                                    <Mail
                                                      size={10}
                                                      className="mr-1"
                                                    />
                                                    Email
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </motion.div>
                                        )
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <motion.button
                      onClick={handleAddStepModalOpen}
                      disabled={isAddingEmail || isAddingPhysicalNudge}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={
                        !(isAddingEmail || isAddingPhysicalNudge)
                          ? { scale: 1.02, borderColor: "#7F56D9" }
                          : {}
                      }
                      whileTap={
                        !(isAddingEmail || isAddingPhysicalNudge)
                          ? { scale: 0.98 }
                          : {}
                      }
                    >
                      {isAddingEmail || isAddingPhysicalNudge ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <span>Adding Step...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Add Step</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Right Side - Template Editor */}
                <div
                  className={`col-span-2 border border-[#EAECF0] rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${
                    isTimelineCollapsed ? "col-span-2" : "col-span-2"
                  }`}
                >
                  {/* Custom Header for Active Email Name */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-gradient-to-r from-indigo-50 to-blue-50">
                    {editingTabName === activeTemplate?.id ? (
                      <div className="flex items-center w-full max-w-lg">
                        <input
                          type="text"
                          value={editingTabValue}
                          onChange={(e) => setEditingTabValue(e.target.value)}
                          onBlur={() =>
                            activeTemplate?.id &&
                            handleSaveTabName(activeTemplate.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && activeTemplate?.id)
                              handleSaveTabName(activeTemplate.id);
                            if (e.key === "Escape") setEditingTabName(null);
                          }}
                          className="flex-1 px-3 py-2 text-lg font-semibold border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
                          autoFocus
                        />
                        <motion.button
                          onClick={() =>
                            activeTemplate?.id &&
                            handleSaveTabName(activeTemplate.id)
                          }
                          className="ml-2 p-2 text-gray-500 hover:text-primary rounded transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Save size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => setEditingTabName(null)}
                          className="ml-1 p-2 text-gray-500 hover:text-red-500 rounded transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={18} />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full max-w-lg">
                        <span className="text-2xl font-bold text-primary truncate">
                          {activeTemplate?.name}
                        </span>
                        <button
                          onClick={() => {
                            if (activeTemplate?.id) {
                              setEditingTabName(activeTemplate.id);
                              setEditingTabValue(activeTemplate.name);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-primary rounded-full transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    )}

                    {/* Schedule moved to header for all templates */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-[#F9F5FF] text-primary px-3 py-1.5 rounded-md">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">
                          Day {activeTemplate?.day} after campaign start
                        </span>
                      </div>
                      <select
                        value={activeTemplate?.day}
                        onChange={(e) => {
                          const day = Number.parseInt(e.target.value);
                          // Optimistically update UI
                          const updatedTemplate = { ...activeTemplate, day };
                          setActiveTemplate(updatedTemplate);
                          setTemplates((prev) =>
                            prev.map((t) =>
                              t.id === updatedTemplate.id ? updatedTemplate : t
                            )
                          );
                          // Debounced backend update for send_day_offset
                          getDebouncedUpdate(
                            updatedTemplate.id,
                            "send_day_offset"
                          )(day);
                        }}
                        className="px-3 py-1.5 border border-[#D0D5DD] rounded-md text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 28].map((day) => (
                          <option key={day} value={day}>
                            T+{day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Conditional rendering of Email Content or Physical Nudge Experience */}
                  <motion.div
                    className="p-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    {/* Email Header Fields - Only show for email type */}
                    {!isPhysicalNudge && (
                      <div className="space-y-4 mb-6 border-b pb-6 border-[#EAECF0]">
                        <div className="flex items-start gap-3">
                          <div className="w-20 pt-2 flex-shrink-0 text-sm font-medium text-[#344054]">
                            From:
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                              <span className="text-gray-700">
                                {senderEmail}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-20 text-sm font-medium text-[#344054]">
                            Subject:
                          </div>
                          <input
                            type="text"
                            value={activeTemplate?.subject}
                            onChange={handleSubjectChange}
                            className="flex-1 px-3 py-2 border border-[#D0D5DD] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Email subject line"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional rendering of Email Content or Physical Nudge Experience */}
                    {isPhysicalNudge ? (
                      <div className="space-y-4">
                        {activeTemplate && activeTemplate.id && (
                          <PhysicalNudgeExperience
                            key={activeTemplate.id} // Force remount when switching between physical nudge steps
                            nudgeId={activeTemplate.id}
                            authToken={authToken || ""}
                            userId={sequence?.creatorUserId || ""}
                            organizationId={organizationId || ""}
                            eventId={sequence?.event_id || eventId || ""} // Ensure it's never null
                            maxBudget={0}
                            onSave={handleSavePhysicalNudge}
                            initialData={activeTemplate.metadata || {}}
                            campaignId={sequence?.campaignId || ""}
                            allRecipientsHaveLinkedin={
                              allRecipientsHaveLinkedin
                            }
                          />
                        )}
                      </div>
                    ) : (
                      /* Email Content with Rich Text Editor */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            Email Content
                          </h3>
                          <div className="flex items-center gap-2">
                            <motion.button
                              className="px-3 py-1.5 text-xs flex items-center gap-1 text-violet-700 bg-violet-50 rounded-md hover:bg-violet-100"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Sparkles size={14} />
                              <span>AI Suggestion</span>
                            </motion.button>
                            <motion.button
                              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Preview
                            </motion.button>
                            <motion.button
                              className="px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-md hover:bg-primary/20"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Test Send
                            </motion.button>
                          </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div className="border border-[#D0D5DD] rounded-lg overflow-hidden">
                          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-[#D0D5DD]">
                            {/* Fixed rich text editor toolbar with functionality */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-wrap gap-1">
                                {/* Text formatting */}
                                <div className="flex items-center gap-1 mr-2">
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Bold"
                                    onClick={() => document.execCommand("bold")}
                                  >
                                    <Bold size={16} />
                                  </button>
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Italic"
                                    onClick={() =>
                                      document.execCommand("italic")
                                    }
                                  >
                                    <Italic size={16} />
                                  </button>
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Underline"
                                    onClick={() =>
                                      document.execCommand("underline")
                                    }
                                  >
                                    <Underline size={16} />
                                  </button>
                                </div>

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Alignment */}
                                <div className="flex items-center gap-1 mr-2">
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Align Left"
                                    onClick={() =>
                                      document.execCommand("justifyLeft")
                                    }
                                  >
                                    <AlignLeft size={16} />
                                  </button>
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Align Center"
                                    onClick={() =>
                                      document.execCommand("justifyCenter")
                                    }
                                  >
                                    <AlignCenter size={16} />
                                  </button>
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Align Right"
                                    onClick={() =>
                                      document.execCommand("justifyRight")
                                    }
                                  >
                                    <AlignRight size={16} />
                                  </button>
                                </div>

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Lists */}
                                <div className="flex items-center gap-1 mr-2">
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Bullet List"
                                    onClick={() =>
                                      document.execCommand(
                                        "insertUnorderedList"
                                      )
                                    }
                                  >
                                    <List size={16} />
                                  </button>
                                  <button
                                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                    title="Numbered List"
                                    onClick={() =>
                                      document.execCommand("insertOrderedList")
                                    }
                                  >
                                    <ListOrdered size={16} />
                                  </button>
                                </div>

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Link */}
                                <button
                                  className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                  title="Insert Link"
                                  onClick={() => {
                                    const url = prompt("Enter the URL:");
                                    if (url)
                                      document.execCommand(
                                        "createLink",
                                        false,
                                        url
                                      );
                                  }}
                                >
                                  <LinkIcon size={16} />
                                </button>

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                              </div>

                              {/* Font controls */}
                              <div className="flex items-center gap-2">
                                <select
                                  className="text-xs p-1 border border-gray-300 rounded"
                                  onChange={(e) => {
                                    const format = e.target.value;
                                    if (format === "p")
                                      document.execCommand(
                                        "formatBlock",
                                        false,
                                        "p"
                                      );
                                    if (format === "h1")
                                      document.execCommand(
                                        "formatBlock",
                                        false,
                                        "h1"
                                      );
                                    if (format === "h2")
                                      document.execCommand(
                                        "formatBlock",
                                        false,
                                        "h2"
                                      );
                                    if (format === "h3")
                                      document.execCommand(
                                        "formatBlock",
                                        false,
                                        "h3"
                                      );
                                  }}
                                >
                                  <option value="p">Normal text</option>
                                  <option value="h1">Heading 1</option>
                                  <option value="h2">Heading 2</option>
                                  <option value="h3">Heading 3</option>
                                </select>

                                <select
                                  className="text-xs p-1 border border-gray-300 rounded"
                                  onChange={(e) => {
                                    document.execCommand(
                                      "fontName",
                                      false,
                                      e.target.value
                                    );
                                  }}
                                >
                                  <option value="Arial">Arial</option>
                                  <option value="Times New Roman">
                                    Times New Roman
                                  </option>
                                  <option value="Helvetica">Helvetica</option>
                                  <option value="Verdana">Verdana</option>
                                  <option value="Georgia">Georgia</option>
                                  <option value="Courier New">
                                    Courier New
                                  </option>
                                  <option value="Tahoma">Tahoma</option>
                                </select>

                                <div className="flex items-center border border-gray-300 rounded">
                                  <button
                                    className="p-1 flex items-center"
                                    onClick={() => {
                                      const color = prompt(
                                        "Enter a color (e.g., #ff0000, red):"
                                      );
                                      if (color)
                                        document.execCommand(
                                          "foreColor",
                                          false,
                                          color
                                        );
                                    }}
                                  >
                                    <Type size={14} />
                                    <span className="ml-1 text-xs">Color</span>
                                  </button>
                                </div>

                                <button className="p-1.5 rounded hover:bg-gray-200 transition-colors">
                                  <Settings size={16} />
                                </button>

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Manual Save Button */}
                                <button
                                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                                    !activeTemplate?.id
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : saveStates[activeTemplate.id] ===
                                        "saving"
                                      ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                                      : saveStates[activeTemplate.id] ===
                                        "saved"
                                      ? "bg-green-100 text-green-600"
                                      : saveStates[activeTemplate.id] ===
                                        "error"
                                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                                      : hasUnsavedChanges[activeTemplate.id]
                                      ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                  onClick={() =>
                                    activeTemplate?.id &&
                                    handleManualSave(activeTemplate.id)
                                  }
                                  disabled={
                                    !activeTemplate?.id ||
                                    saveStates[activeTemplate?.id] === "saving"
                                  }
                                  title={
                                    !activeTemplate?.id
                                      ? "No template selected"
                                      : saveStates[activeTemplate.id] ===
                                        "saving"
                                      ? "Saving..."
                                      : saveStates[activeTemplate.id] ===
                                        "saved"
                                      ? `Saved ${
                                          lastSaveTime[activeTemplate.id]
                                            ? new Intl.DateTimeFormat("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                              }).format(
                                                lastSaveTime[activeTemplate.id]!
                                              )
                                            : ""
                                        }`
                                      : saveStates[activeTemplate.id] ===
                                        "error"
                                      ? "Save failed - click to retry"
                                      : hasUnsavedChanges[activeTemplate.id]
                                      ? "Save changes (Ctrl+S)"
                                      : "Save template (Ctrl+S)"
                                  }
                                >
                                  {saveStates[activeTemplate?.id] ===
                                  "saving" ? (
                                    <>
                                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Saving</span>
                                    </>
                                  ) : saveStates[activeTemplate?.id] ===
                                    "saved" ? (
                                    <>
                                      <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                                        <div className="w-1.5 h-1 bg-white rounded-full"></div>
                                      </div>
                                      <span>Saved</span>
                                    </>
                                  ) : saveStates[activeTemplate?.id] ===
                                    "error" ? (
                                    <>
                                      <X size={12} />
                                      <span>Retry</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save size={12} />
                                      <span>
                                        {hasUnsavedChanges[activeTemplate?.id]
                                          ? "Save*"
                                          : "Save"}
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {activeTemplate && activeTemplate.id && (
                            <RichTextEditor
                              key={activeTemplate.id}
                              initialContent={
                                editorContents[activeTemplate.id] || ""
                              }
                              onChange={handleContentChange}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
