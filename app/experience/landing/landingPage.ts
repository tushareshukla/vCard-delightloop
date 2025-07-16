export enum END_landing_page_TouchpointType {
  // --- Initial Contact & Engagement (via Campaign Link) ---
  CAMPAIGN_LINK_CLICKED = "END_landing_page_campaign_link_clicked",
  VISITED = "END_landing_page_visited",
  LOADED = "END_landing_page_loaded",

  // --- Core Content & Media Interaction ---
  LOGO_VIEWED = "END_landing_page_logo_viewed",
  HEADLINE_VIEWED = "END_landing_page_headline_viewed",
  DESCRIPTION_VIEWED = "END_landing_page_description_viewed",
  MEDIA_VIEWED = "END_landing_page_media_viewed",
  VIDEO_PLAYED = "END_landing_page_video_played",
  DATE_VIEWED = "END_landing_page_date_viewed",

  // --- Action Button Interaction ---
  PRIMARY_CTA_CLICKED = "END_landing_page_primary_cta_clicked",
  SECONDARY_CTA_CLICKED = "END_landing_page_secondary_cta_clicked",

  // --- Feedback Initiation & Interaction ---
  FEEDBACK_INITIATED = "END_landing_page_feedback_initiated",
  FEEDBACK_TYPE_SELECTED_AUDIO = "END_landing_page_feedback_type_selected_audio",
  FEEDBACK_TYPE_SELECTED_VIDEO = "END_landing_page_feedback_type_selected_video",
  FEEDBACK_TYPE_SELECTED_TEXT = "END_landing_page_feedback_type_selected_text",

  // --- Audio Feedback Lifecycle ---
  AUDIO_RECORDING_STARTED = "END_landing_page_audio_recording_started",
  AUDIO_RECORDING_STOPPED = "END_landing_page_audio_recording_stopped",
  AUDIO_RE_RECORDED = "END_landing_page_audio_re_recorded",
  AUDIO_FEEDBACK_SUBMITTED = "END_landing_page_audio_feedback_submitted",
  AUDIO_FEEDBACK_UPLOAD_FAILED = "END_landing_page_audio_feedback_upload_failed",

  // --- Video Feedback Lifecycle ---
  VIDEO_RECORDING_STARTED = "END_landing_page_video_recording_started",
  VIDEO_RECORDING_STOPPED = "END_landing_page_video_recording_stopped",
  VIDEO_RE_RECORDED = "END_landing_page_video_re_recorded",
  VIDEO_FEEDBACK_SUBMITTED = "END_landing_page_video_feedback_submitted",
  VIDEO_FEEDBACK_UPLOAD_FAILED = "END_landing_page_video_feedback_upload_failed",

  // --- Text Feedback Lifecycle ---
  TEXT_FEEDBACK_TYPED = "END_landing_page_text_feedback_typed",
  TEXT_FEEDBACK_SUBMITTED = "END_landing_page_text_feedback_submitted",

  // --- Direct Feedback Reaction ---
  DIRECT_FEEDBACK_LIKED = "END_landing_page_direct_feedback_liked",
  DIRECT_FEEDBACK_DISLIKED = "END_landing_page_direct_feedback_disliked",

  // --- Post-Feedback Actions (Conditional) ---
  EMAIL_FORM_INITIATED = "END_landing_page_email_form_initiated",
  EMAIL_FORM_SUBMITTED = "END_landing_page_email_form_submitted",
  EMAIL_FORM_SKIPPED = "END_landing_page_email_form_skipped",
  SUCCESS_MODAL_VIEWED = "END_landing_page_success_modal_viewed",
  SUCCESS_MODAL_CLOSED = "END_landing_page_success_modal_closed",

  // --- User Identity & Tracking ---
  RECIPIENT_IDENTIFIED = "END_landing_page_recipient_identified",
  RECIPIENT_STATUS_UPDATED = "END_landing_page_recipient_status_updated",

  // --- System & Data Fetching Events ---
  CAMPAIGN_DATA_FETCHED = "END_landing_page_campaign_data_fetched",
  RECIPIENT_DATA_FETCHED = "END_landing_page_recipient_data_fetched",
}

// Helper functions (assuming these are available)
const getDeviceType = (
  userAgent: string
): "mobile" | "desktop" | "tablet" | "other" => {
  // Simple device detection logic
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return /iPad/.test(userAgent) ? "tablet" : "mobile";
  }
  if (/Tablet/.test(userAgent)) {
    return "tablet";
  }
  return "desktop";
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // From .env

export const logTouchpoint = async (payload: {
  recipientId: string;
  campaignId: string;
  touchpointType: END_landing_page_TouchpointType;
  touchpointData: Array<{
    data: Record<string, any>; // Touchpoint-specific data
    metadata?: {
      // Metadata can be optional if not provided externally
      userAgent?: string;
      source?: string;
      deviceType?: "mobile" | "desktop" | "tablet" | "other";
    };
  }>;
}): Promise<void> => {
  const API_ENDPOINT = `${API_BASE_URL}/v1/recipient-timeline`;

  try {
    const userAgent = navigator.userAgent || "";
    const deviceType = getDeviceType(userAgent);

    // Enrich payload with common metadata if it's not already provided in touchpointData
    const enrichedPayload: typeof payload = {
      ...payload,
      touchpointData: payload.touchpointData.map((item) => ({
        ...item,
        metadata: {
          ...(item.metadata || {}), // Merge any provided metadata
          userAgent: item.metadata?.userAgent || userAgent,
          source: item.metadata?.source || window.location.host,
          deviceType: item.metadata?.deviceType || deviceType,
        },
      })),
    };

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any necessary auth headers if required for this API
        // 'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!response.ok) {
      console.error(
        `Failed to log touchpoint ${payload.touchpointType}:`,
        response.status,
        await response.text()
      );
    } else {
      console.log(`Touchpoint logged successfully: ${payload.touchpointType}`);
    }
  } catch (error) {
    console.error(
      `Error sending tracking data for ${payload.touchpointType}:`,
      error
    );
  }
};
// --- Touchpoint Logging Functions ---

// --- Initial Contact & Engagement ---
export const trackCampaignLinkClick = async (
  recipientId: string,
  campaignId: string,
  url: string,
  referrer?: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.CAMPAIGN_LINK_CLICKED,
    touchpointData: [
      { data: { url, referrer }, metadata: { source: "external_link" } },
    ],
  });
};

export const trackLandingPageVisit = async (
  recipientId: string,
  campaignId: string,
  url: string,
  referrer?: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VISITED,
    touchpointData: [
      { data: { url, referrer }, metadata: { source: "campaign_link" } },
    ],
  });
};

export const trackLandingPageLoaded = async (
  recipientId: string,
  campaignId: string,
  url: string,
  pageLoadTimeMs: number
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.LOADED,
    touchpointData: [
      { data: { url, pageLoadTimeMs }, metadata: { source: "page_render" } },
    ],
  });
};

// --- Core Content & Media Interaction ---
export const trackLogoViewed = async (
  recipientId: string,
  campaignId: string,
  logoUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.LOGO_VIEWED,
    touchpointData: [
      { data: { logoUrl }, metadata: { source: "page_content" } },
    ],
  });
};

export const trackHeadlineViewed = async (
  recipientId: string,
  campaignId: string,
  headlineText: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.HEADLINE_VIEWED,
    touchpointData: [
      { data: { headlineText }, metadata: { source: "page_content" } },
    ],
  });
};

export const trackDescriptionViewed = async (
  recipientId: string,
  campaignId: string,
  descriptionText: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.DESCRIPTION_VIEWED,
    touchpointData: [
      { data: { descriptionText }, metadata: { source: "page_content" } },
    ],
  });
};

export const trackMediaViewed = async (
  recipientId: string,
  campaignId: string,
  mediaType: "image" | "video",
  mediaUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.MEDIA_VIEWED,
    touchpointData: [
      { data: { mediaType, mediaUrl }, metadata: { source: "page_content" } },
    ],
  });
};

export const trackVideoPlayed = async (
  recipientId: string,
  campaignId: string,
  videoUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VIDEO_PLAYED,
    touchpointData: [
      { data: { videoUrl }, metadata: { source: "media_section" } },
    ],
  });
};

export const trackDateViewed = async (
  recipientId: string,
  campaignId: string,
  date: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.DATE_VIEWED,
    touchpointData: [{ data: { date }, metadata: { source: "page_content" } }],
  });
};

// --- Action Button Interaction ---
export const trackPrimaryCTAClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.PRIMARY_CTA_CLICKED,
    touchpointData: [
      {
        data: { buttonText, buttonUrl, buttonType: "primary_cta" },
        metadata: { source: "action_buttons" },
      },
    ],
  });
};

export const trackSecondaryCTAClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.SECONDARY_CTA_CLICKED,
    touchpointData: [
      {
        data: { buttonText, buttonUrl, buttonType: "secondary_cta" },
        metadata: { source: "action_buttons" },
      },
    ],
  });
};

// --- Feedback Initiation & Interaction ---
export const trackFeedbackInitiated = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.FEEDBACK_INITIATED,
    touchpointData: [
      {
        data: { targetElement: "feedback_button" },
        metadata: { source: "landing_page_interaction" },
      },
    ],
  });
};

export const trackFeedbackTypeSelected = async (
  recipientId: string,
  campaignId: string,
  feedbackType: "audio" | "video" | "text"
) => {
  let type: END_landing_page_TouchpointType;
  if (feedbackType === "audio")
    type = END_landing_page_TouchpointType.FEEDBACK_TYPE_SELECTED_AUDIO;
  else if (feedbackType === "video")
    type = END_landing_page_TouchpointType.FEEDBACK_TYPE_SELECTED_VIDEO;
  else type = END_landing_page_TouchpointType.FEEDBACK_TYPE_SELECTED_TEXT;

  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: type,
    touchpointData: [{ data: {}, metadata: { source: "feedback_modal" } }],
  });
};

// --- Audio Feedback Lifecycle ---
export const trackAudioRecordingStarted = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.AUDIO_RECORDING_STARTED,
    touchpointData: [
      {
        data: { recordingDurationSeconds: 0 },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackAudioRecordingStopped = async (
  recipientId: string,
  campaignId: string,
  recordingDurationSeconds: number,
  blobType: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.AUDIO_RECORDING_STOPPED,
    touchpointData: [
      {
        data: { recordingDurationSeconds, blobType },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackAudioReRecorded = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.AUDIO_RE_RECORDED,
    touchpointData: [{ data: {}, metadata: { source: "feedback_modal" } }],
  });
};

export const trackAudioFeedbackSubmitted = async (
  recipientId: string,
  campaignId: string,
  audioUrl: string,
  recordingDurationSeconds: number,
  mimeType: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.AUDIO_FEEDBACK_SUBMITTED,
    touchpointData: [
      {
        data: { audioUrl, recordingDurationSeconds, mimeType },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackAudioFeedbackUploadFailed = async (
  recipientId: string,
  campaignId: string,
  errorDetails: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType:
      END_landing_page_TouchpointType.AUDIO_FEEDBACK_UPLOAD_FAILED,
    touchpointData: [
      { data: { errorDetails }, metadata: { source: "feedback_modal" } },
    ],
  });
};

// --- Video Feedback Lifecycle ---
export const trackVideoRecordingStarted = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VIDEO_RECORDING_STARTED,
    touchpointData: [
      {
        data: { recordingDurationSeconds: 0 },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackVideoRecordingStopped = async (
  recipientId: string,
  campaignId: string,
  recordingDurationSeconds: number,
  blobType: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VIDEO_RECORDING_STOPPED,
    touchpointData: [
      {
        data: { recordingDurationSeconds, blobType },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackVideoReRecorded = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VIDEO_RE_RECORDED,
    touchpointData: [{ data: {}, metadata: { source: "feedback_modal" } }],
  });
};

export const trackVideoFeedbackSubmitted = async (
  recipientId: string,
  campaignId: string,
  videoUrl: string,
  recordingDurationSeconds: number,
  mimeType: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.VIDEO_FEEDBACK_SUBMITTED,
    touchpointData: [
      {
        data: { videoUrl, recordingDurationSeconds, mimeType },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

export const trackVideoFeedbackUploadFailed = async (
  recipientId: string,
  campaignId: string,
  errorDetails: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType:
      END_landing_page_TouchpointType.VIDEO_FEEDBACK_UPLOAD_FAILED,
    touchpointData: [
      { data: { errorDetails }, metadata: { source: "feedback_modal" } },
    ],
  });
};

// --- Text Feedback Lifecycle ---
export const trackTextFeedbackTyped = async (
  recipientId: string,
  campaignId: string,
  currentTextLength: number
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.TEXT_FEEDBACK_TYPED,
    touchpointData: [
      { data: { currentTextLength }, metadata: { source: "feedback_modal" } },
    ],
  });
};

export const trackTextFeedbackSubmitted = async (
  recipientId: string,
  campaignId: string,
  feedbackTextLength: number,
  isUserIdentified: boolean
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.TEXT_FEEDBACK_SUBMITTED,
    touchpointData: [
      {
        data: { feedbackTextLength, isUserIdentified },
        metadata: { source: "feedback_modal" },
      },
    ],
  });
};

// --- Direct Feedback Reaction ---
export const trackDirectFeedbackLike = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.DIRECT_FEEDBACK_LIKED,
    touchpointData: [
      {
        data: {
          question: "Was this experience delightful?",
          answer: "thumbs_up",
        },
        metadata: { source: "landing_page_interaction" },
      },
    ],
  });
};

export const trackDirectFeedbackDislike = async (
  recipientId: string,
  campaignId: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.DIRECT_FEEDBACK_DISLIKED,
    touchpointData: [
      {
        data: {
          question: "Was this experience delightful?",
          answer: "thumbs_down",
        },
        metadata: { source: "landing_page_interaction" },
      },
    ],
  });
};

// --- Post-Feedback Actions (Conditional) ---
export const trackEmailFormInitiated = async (
  recipientId: string,
  campaignId: string,
  triggeredAfter: "video_feedback" | "audio_feedback" | "text_feedback"
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.EMAIL_FORM_INITIATED,
    touchpointData: [
      { data: { triggeredAfter }, metadata: { source: "feedback_flow" } },
    ],
  });
};

export const trackEmailFormSubmitted = async (
  recipientId: string,
  campaignId: string,
  userName: string,
  userEmail: string,
  triggeredAfter: "video_feedback" | "audio_feedback" | "text_feedback"
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.EMAIL_FORM_SUBMITTED,
    touchpointData: [
      {
        data: { userName, userEmail, triggeredAfter },
        metadata: { source: "feedback_flow" },
      },
    ],
  });
};

export const trackEmailFormSkipped = async (
  recipientId: string,
  campaignId: string,
  skippedAfter: "video_feedback" | "audio_feedback" | "text_feedback"
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.EMAIL_FORM_SKIPPED,
    touchpointData: [
      { data: { skippedAfter }, metadata: { source: "feedback_flow" } },
    ],
  });
};

export const trackSuccessModalViewed = async (
  recipientId: string,
  campaignId: string,
  messageContext: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.SUCCESS_MODAL_VIEWED,
    touchpointData: [
      { data: { messageContext }, metadata: { source: "completion_message" } },
    ],
  });
};

export const trackSuccessModalClosed = async (
  recipientId: string,
  campaignId: string,
  messageContext: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.SUCCESS_MODAL_CLOSED,
    touchpointData: [
      { data: { messageContext }, metadata: { source: "completion_message" } },
    ],
  });
};

// --- User Identity & Tracking ---
export const trackRecipientIdentified = async (
  recipientId: string,
  campaignId: string,
  isNew: boolean
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.RECIPIENT_IDENTIFIED,
    touchpointData: [
      { data: { recipientId, isNew }, metadata: { source: "user_management" } },
    ],
  });
};

export const trackRecipientStatusUpdated = async (
  recipientId: string,
  campaignId: string,
  oldStatus: string,
  newStatus: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.RECIPIENT_STATUS_UPDATED,
    touchpointData: [
      {
        data: { oldStatus, newStatus },
        metadata: { source: "user_management" },
      },
    ],
  });
};

// --- System & Data Fetching Events ---
export const trackCampaignDataFetched = async (
  recipientId: string,
  campaignId: string,
  success: boolean,
  errorDetails?: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.CAMPAIGN_DATA_FETCHED,
    touchpointData: [
      {
        data: { success, errorDetails },
        metadata: { source: "data_fetching" },
      },
    ],
  });
};

export const trackRecipientDataFetched = async (
  recipientId: string,
  campaignId: string,
  success: boolean,
  errorDetails?: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: END_landing_page_TouchpointType.RECIPIENT_DATA_FETCHED,
    touchpointData: [
      {
        data: { success, errorDetails },
        metadata: { source: "data_fetching" },
      },
    ],
  });
};
