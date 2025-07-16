// Enum matching the backend TouchpointType
export enum TouchpointType {
  InviteSent = "invite_sent",
  GiftSelected = "gift_selected", 
  AddressConfirmed = "address_confirmed",
  MessageViewed = "message_viewed",
  ButtonClicked = "button_clicked",
  GiftShipped = "gift_shipped",
  GiftDelivered = "gift_delivered",
  GiftAcknowledged = "gift_acknowledged",
  LandingVisited = "landing_visited"
}

// Interface for touchpoint data based on different types
export interface TouchpointData {
  // For invite_sent
  emailAddress?: string;
  sendCount?: number;
  
  // For gift_selected  
  giftId?: string;
  giftName?: string;
  reason?: string;
  
  // For button_clicked
  buttonType?: string;
  buttonText?: string;
  buttonUrl?: string;
  pageUrl?: string;
  
  // For page_visited/landing_visited
  pageType?: string;
  sessionId?: string;
  referrer?: string;
  
  // For address_confirmed
  addressData?: object;
  
  // For shipping/delivery
  carrier?: string;
  trackingId?: string;
  
  // For feedback
  feedbackType?: string;
  content?: string;
  sentiment?: number;
  
  // For charity donations
  giftValue?: number;
}

// Interface for touchpoint metadata
export interface TouchpointMetadata {
  userAgent?: string;
  ipAddress?: string;
  source?: string;
}

// Interface for the complete touchpoint
export interface Touchpoint {
  touchpointId: string;
  touchpointType: TouchpointType;
  timestamp: string;
  isVisible?: boolean; // Whether this touchpoint should be visible in UI
  data?: TouchpointData;
  metadata?: TouchpointMetadata;
}

// Interface for the API request
export interface RecipientTimelineRequest {
  recipientId: string;
  campaignId: string;
  touchpoint: Touchpoint;
}

// API Response interface
export interface RecipientTimelineResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Generate a unique touchpoint ID
 */
export const generateTouchpointId = (type: TouchpointType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `tp_${type}_${timestamp}_${random}`;
};

/**
 * Get browser metadata for tracking
 */
export const getBrowserMetadata = (): TouchpointMetadata => {
  return {
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    source: typeof window !== 'undefined' ? window.location.hostname : '',
  };
};

/**
 * Post recipient timeline data to the API
 */
export const trackRecipientAction = async (
  recipientId: string,
  campaignId: string,
  touchpointType: TouchpointType,
  data?: TouchpointData,
  customMetadata?: TouchpointMetadata,
  isVisible?: boolean
): Promise<RecipientTimelineResponse> => {
  try {
    if (!recipientId || !campaignId) {
      throw new Error('recipientId and campaignId are required');
    }

    const touchpointId = generateTouchpointId(touchpointType);
    const metadata = { ...getBrowserMetadata(), ...customMetadata };

    const requestData: RecipientTimelineRequest = {
      recipientId,
      campaignId,
      touchpoint: {
        touchpointId,
        touchpointType,
        timestamp: new Date().toISOString(),
        isVisible: isVisible !== undefined ? isVisible : false, // Default to false if not specified
        data: data || {},
        metadata
      }
    };

    console.log('Tracking recipient action:', {
      type: touchpointType,
      recipientId,
      campaignId,
      data
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipient-timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('Failed to track recipient action:', errorData);
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    console.log('Successfully tracked recipient action:', result);
    
    return {
      success: true,
      message: result.message,
      data: result.data
    };

  } catch (error) {
    console.error('Error tracking recipient action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Convenience functions for common tracking scenarios
 */

// Track when user visits the landing page
export const trackLandingVisit = async (
  recipientId: string,
  campaignId: string,
  pageUrl?: string,
  isVisible: boolean = false // Default to false - analytics data
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.LandingVisited,
    {
      pageType: 'landing',
      pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      sessionId: generateTouchpointId(TouchpointType.LandingVisited) // Simple session ID
    },
    undefined, // customMetadata
    isVisible
  );
};

// Track when user selects a gift
export const trackGiftSelection = async (
  recipientId: string,
  campaignId: string,
  giftId: string,
  giftName: string,
  reason?: string,
  isVisible: boolean = true // Default to true - important user action
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.GiftSelected,
    {
      giftId,
      giftName,
      reason
    },
    undefined, // customMetadata
    isVisible
  );
};

// Track when user confirms address
export const trackAddressConfirmation = async (
  recipientId: string,
  campaignId: string,
  addressData: object,
  isVisible: boolean = true // Default to true - important milestone
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.AddressConfirmed,
    {
      addressData
    },
    undefined, // customMetadata
    isVisible
  );
};

// Track button clicks
export const trackButtonClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonType?: string,
  buttonUrl?: string,
  isVisible: boolean = false // Default to false - analytics data, override for important buttons
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.ButtonClicked,
    {
      buttonType: buttonType || 'primary',
      buttonText,
      buttonUrl,
      pageUrl: typeof window !== 'undefined' ? window.location.href : ''
    },
    undefined, // customMetadata
    isVisible
  );
};

// Track message/content viewing
export const trackMessageView = async (
  recipientId: string,
  campaignId: string,
  content?: string,
  isVisible: boolean = false // Default to false - analytics data
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.MessageViewed,
    {
      content,
      pageUrl: typeof window !== 'undefined' ? window.location.href : ''
    },
    undefined, // customMetadata
    isVisible
  );
};

/**
 * Additional convenience functions for specific tracking scenarios
 */

// Track important CTA button clicks (visible by default)
export const trackCTAButtonClick = async (
  recipientId: string,
  campaignId: string,
  buttonText: string,
  buttonUrl?: string,
  buttonType: string = 'cta'
) => {
  return trackButtonClick(
    recipientId,
    campaignId,
    buttonText,
    buttonType,
    buttonUrl,
    true // Important CTAs should be visible
  );
};

// Track charity donation action
export const trackCharityDonation = async (
  recipientId: string,
  campaignId: string,
  giftValue?: number
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.ButtonClicked,
    {
      buttonType: 'charity_donation',
      buttonText: 'Donate to Charity',
      giftValue,
      pageUrl: typeof window !== 'undefined' ? window.location.href : ''
    },
    undefined, // customMetadata
    true // Charity donations should be visible - important action
  );
};

// Track navigation actions (usually for analytics)
export const trackNavigation = async (
  recipientId: string,
  campaignId: string,
  navigationAction: string,
  fromPage?: string,
  toPage?: string
) => {
  return trackRecipientAction(
    recipientId,
    campaignId,
    TouchpointType.ButtonClicked,
    {
      buttonType: 'navigation',
      buttonText: navigationAction,
      pageUrl: fromPage || (typeof window !== 'undefined' ? window.location.href : ''),
      buttonUrl: toPage
    },
    undefined, // customMetadata
    false // Navigation tracking is usually for analytics
  );
};
