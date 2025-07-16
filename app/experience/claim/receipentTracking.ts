// src/utils/receipentTracking.ts
/**
 * Defines all possible touchpoint types that can be tracked for recipient interactions
 * within the claim experience, specific to the user's journey after clicking an invite.
 * These should be concise, descriptive strings.
 */
export enum TouchpointType {
  // --- Initial Contact & Engagement (via Claim Link) ---
  CLAIM_LINK_CLICKED = 'claim_link_clicked', // User clicked the link to access the claim page
  CLAIM_PAGE_VISITED = 'claim_page_visited', // User successfully landed on the claim page
  CLAIM_PAGE_LOADED = 'claim_page_loaded',   // When the page data is fully loaded

  // --- Gift Lifecycle on Claim Page ---
  GIFT_SELECTED_ON_CLAIM = 'gift_selected_on_claim', // User selected a gift from the claim page
  GIFT_SELECTION_SKIPPED = 'gift_selection_skipped', // User skipped gift selection (if applicable)
  GIFT_DONATED_TO_CHARITY = 'gift_donated_to_charity', // User chose to donate the gift

  // --- Address & Confirmation on Claim Page ---
  ADDRESS_FORM_SUBMITTED = 'address_confirmed', // User submitted their shipping address
  ADDRESS_FORM_VALIDATION_ERROR = 'address_form_validation_error', // User submitted with errors
  ADDRESS_FORM_EDITED = 'address_form_edited',   // User went back to edit address

  // --- Message & Content Interaction on Claim Page ---
  MESSAGE_VIEWED_ON_CLAIM = 'message_viewed_on_claim',
  MESSAGE_BUTTON_CLICKED_ON_CLAIM = 'message_button_clicked_on_claim',
  MESSAGE_LINK_CLICKED_ON_CLAIM = 'message_link_clicked_on_claim',

  // --- Landing Page / Outcome Interaction ---
  LANDING_PAGE_CTA_CLICKED = 'landing_page_cta_clicked', // CTA on the final claim outcome page
  MEDIA_INTERACTED = 'media_interacted', // User watched video, viewed image etc.

  // --- Tracking and Navigation ---
  TRACKING_LINK_CLICKED = 'tracking_link_clicked', // User clicked a link to view shipment tracking
  NAVIGATION_EVENT = 'navigation_event', // General navigation actions like "Back to Gifts"

  // --- Campaign/System Events ---
  CAMPAIGN_INFO_FETCHED = 'campaign_info_fetched', // Campaign details successfully loaded
  RECIPIENT_INFO_FETCHED = 'recipient_info_fetched', // Recipient details successfully loaded
  GIFT_INFO_FETCHED = 'gift_info_fetched', // Gift details successfully loaded
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Helper to detect device type
const getDeviceType = (userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'other' => {
  if (!userAgent) return 'other';
  const mobileRegex = /Mobi|Android|iPhone|iPad|iPod/i;
  const tabletRegex = /Tablet/i;

  if (tabletRegex.test(userAgent)) return 'tablet';
  if (mobileRegex.test(userAgent)) return 'mobile';
  return 'desktop';
};

// --- Core Function to Log Touchpoints ---
export const logTouchpoint = async (payload: {
  recipientId: string;
  campaignId: string;
  touchpointType: TouchpointType;
  touchpointData: Array<{
    data: Record<string, any>; // Touchpoint-specific data
    metadata?: { // Metadata can be optional if not provided externally
      userAgent?: string;
      source?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet' | 'other';
    };
  }>;
}): Promise<void> => {
  const API_ENDPOINT = `${API_BASE_URL}/v1/recipient-timeline`;

  try {
    const userAgent = navigator.userAgent || '';
    const deviceType = getDeviceType(userAgent);

    // Enrich payload with common metadata if it's not already provided in touchpointData
    const enrichedPayload: typeof payload = {
      ...payload,
      touchpointData: payload.touchpointData.map(item => ({
        ...item,
        metadata: {
          ...(item.metadata || {}), // Merge any provided metadata
          userAgent: item.metadata?.userAgent || userAgent,
          source: item.metadata?.source || window.location.host,
          deviceType: item.metadata?.deviceType || deviceType,
        }
      }))
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any necessary auth headers if required for this API
        // 'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!response.ok) {
      console.error(`Failed to log touchpoint ${payload.touchpointType}:`, response.status, await response.text());
    } else {
      console.log(`Touchpoint logged successfully: ${payload.touchpointType}`);
    }
  } catch (error) {
    console.error(`Error sending tracking data for ${payload.touchpointType}:`, error);
  }
};

// --- Specific Trackers (now delegate to logTouchpoint) ---

export const trackLandingVisit = async (
  recipientId: string,
  campaignId: string,
  url: string,
  isVisible: boolean
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.CLAIM_PAGE_VISITED, // Use a more specific type for landing
    touchpointData: [{
      data: { url, isVisible },
      metadata: { source: 'claim_page_load' } // Source indicates where the visit was logged
    }],
  });
};

export const trackGiftSelection = async (
  recipientId: string,
  campaignId: string,
  giftId: string,
  giftName: string,
  eventDescription: string,
  isVisible: boolean
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.GIFT_SELECTED_ON_CLAIM, // Specific to claim page
    touchpointData: [{
      data: { giftId, giftName, eventDescription, isVisible },
      metadata: { source: 'gift_selection_ui' }
    }],
  });
};

export const trackAddressConfirmation = async (
  recipientId: string,
  campaignId: string,
  addressData: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isComplete: boolean;
    submissionTimestamp: string;
  },
  isVisible: boolean
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.ADDRESS_FORM_SUBMITTED, // Specific to claim page
    touchpointData: [{
      data: { ...addressData, isVisible },
      metadata: { source: 'address_form_submission' }
    }],
  });
};

export const trackButtonClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonType: string, // e.g., 'tracking_link', 'video_preview'
  url?: string,
  isVisible?: boolean
) => {
  let touchpointType: TouchpointType;
  switch (buttonType) {
    case 'tracking_link':
      touchpointType = TouchpointType.TRACKING_LINK_CLICKED;
      break;
    case 'video_preview':
      touchpointType = TouchpointType.MESSAGE_BUTTON_CLICKED_ON_CLAIM; // Assuming video is part of message on claim page
      break;
    case 'media_preview':
      touchpointType = TouchpointType.MEDIA_INTERACTED; // Specific for media on claim/landing page
      break;
    default:
      touchpointType = TouchpointType.LANDING_PAGE_CTA_CLICKED; // Generic fallback for other buttons
  }

  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: touchpointType,
    touchpointData: [{
      data: { buttonText, buttonUrl: url, buttonType, isVisible },
      metadata: { source: 'button_interaction' }
    }],
  });
};

export const trackMessageView = async (
  recipientId: string,
  campaignId: string,
  messageId: string,
  messageType: string,
  viewTimestamp: string,
  pageUrl?: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.MESSAGE_VIEWED_ON_CLAIM,
    touchpointData: [{
      data: { messageId, messageType, viewTimestamp, pageUrl },
      metadata: { source: 'message_viewer' }
    }],
  });
};

export const trackMessageButtonClicked = async (
  recipientId: string,
  campaignId: string,
  messageId: string,
  buttonText: string,
  buttonUrl: string,
  buttonTarget: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.MESSAGE_BUTTON_CLICKED_ON_CLAIM,
    touchpointData: [{
      data: { messageId, buttonText, buttonUrl, buttonTarget },
      metadata: { source: 'message_interaction' }
    }],
  });
};

export const trackMessageLinkClicked = async (
  recipientId: string,
  campaignId: string,
  messageId: string,
  linkText: string,
  linkUrl: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.MESSAGE_LINK_CLICKED_ON_CLAIM,
    touchpointData: [{
      data: { messageId, linkText, linkUrl },
      metadata: { source: 'message_interaction' }
    }],
  });
};


export const trackCharityDonation = async (
  recipientId: string,
  campaignId: string,
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.GIFT_DONATED_TO_CHARITY,
    touchpointData: [{
      data: { donationTimestamp: new Date().toISOString() },
      metadata: { source: 'donation_action' }
    }],
  });
};

export const trackNavigation = async (
  recipientId: string,
  campaignId: string,
  navigationLabel: string,
  fromPage: string,
  toPageType: string
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.NAVIGATION_EVENT,
    touchpointData: [{
      data: { navigationLabel, fromPage, toPageType },
      metadata: { source: 'navigation' }
    }],
  });
};

export const trackCTAButtonClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonUrl: string,
  buttonType: 'primary_cta' | 'secondary_cta'
) => {
  await logTouchpoint({
    recipientId,
    campaignId,
    touchpointType: TouchpointType.LANDING_PAGE_CTA_CLICKED,
    touchpointData: [{
      data: { buttonText, buttonUrl, buttonType, pageUrl: window.location.href },
      metadata: { source: 'landing_page_cta' }
    }],
  });
};