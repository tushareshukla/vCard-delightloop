/**
 * Campaigns V2 API Utility Functions
 * 
 * Direct utility functions for campaign API calls without class initialization complexity.
 * 
 * @author Migration Assistant
 * @version 2.0.0 - Simplified
 */

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  goal?: string;
  subGoals?: string[];
  source?: string;
}

export interface CampaignUpdateRequest {
  name?: string;
  description?: string;
  motion?: string;
  goal?: string;
  subGoals?: any[];
  status?: string;
  cta_link?: string;
  budget?: {
    totalBudget?: number;
    maxPerGift?: number;
    currency?: string;
    spent?: number;
  };
  giftSelectionMode?: string;
  giftCatalogs?: any[];
  outcomeCard?: any;
  outcomeTemplate?: any;
  landingPageConfig?: any;
  emailTemplate?: any;
  sectionStatus?: any;
  total_recipients?: number;
  [key: string]: any;
}

export interface GiftCatalog {
  catalogId: string;
  selectedGift: string | string[];
}

export interface GiftCatalogWithMultiple {
  catalogId: string;
  selectedGift: string[];
}

export interface LandingPageConfig {
  logo?: string;
  background?: string;
  content?: any;
  media?: any;
  actionButtons?: any[];
  [key: string]: any;
}

export interface GiftCard {
  message: string;
  logoLink: string;
  [key: string]: any;
}

// Utility functions for headers and response handling
function getHeaders(authToken: string) {
  return {
    "Authorization": `Bearer ${authToken}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error_message || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(`${errorMessage}`);
  }
  
  return response.json();
}

// Direct API utility functions - No initialization required!

export async function createCampaign(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignData: CampaignCreateRequest
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew`,
    {
      method: "POST",
      headers: getHeaders(authToken),
      body: JSON.stringify({ campaign: campaignData })
    }
  );
  
  return handleResponse(response);
}

export async function getCampaign(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}`,
    {
      method: "GET",
      headers: getHeaders(authToken)
    }
  );
  
  return handleResponse(response);
}

export async function updateCampaign(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  updateData: CampaignUpdateRequest
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ campaign: updateData })
    }
  );
  
  return handleResponse(response);
}

export async function updateMotion(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  motion: string
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/motion`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ motion })
    }
  );
  
  return handleResponse(response);
}

export async function addRecipients(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  contactIds: string[], 
  recipientMode: string
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/recipients`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ 
        contactIds, 
        recepientMode: recipientMode 
      })
    }
  );
  
  return handleResponse(response);
}

export async function runCampaign(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  sendForApproval: boolean = false
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/run`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ sendForApproval })
    }
  );
  
  return handleResponse(response);
}

// 🎁 Specialized Gift Selection APIs

export async function setSmartMatchGifts(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  giftCatalogs: GiftCatalog[]
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/gifts/smart_match`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ giftCatalogs })
    }
  );
  
  return handleResponse(response);
}

export async function setSingleGift(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  giftCatalog: GiftCatalog
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/gifts/single_gift`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ giftCatalog })
    }
  );
  
  return handleResponse(response);
}

export async function setRecipientsChoiceGifts(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  giftCatalogs: GiftCatalog[]
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/gifts/recipients_choice`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ giftCatalogs })
    }
  );
  
  return handleResponse(response);
}

// 🎨 Landing Page Configuration API
/**
 * Updates the landing page configuration for a campaign
 * 
 * @param baseUrl - API base URL
 * @param organizationId - Organization ID
 * @param authToken - Authentication token
 * @param campaignId - Campaign ID to update
 * @param landingPageConfig - Landing page configuration object
 * @returns Promise with the update result
 * 
 * @example
 * const config = {
 *   logo: "https://example.com/logo.png",
 *   background: "https://example.com/bg.jpg",
 *   content: { title: "Welcome", description: "Join us!" },
 *   media: { videos: [], images: [] },
 *   actionButtons: [{ text: "Register", link: "https://..." }]
 * };
 * await updateLandingPageConfig(apiUrl, orgId, token, campaignId, config);
 */
export async function updateLandingPageConfig(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  landingPageConfig: LandingPageConfig
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/landing_page_config`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ landingPageConfig })
    }
  );
  
  return handleResponse(response);
}

// 🎁 Gift Card (Outcome Card) API
/**
 * Updates the gift card (outcome card) for a campaign
 * 
 * @param baseUrl - API base URL
 * @param organizationId - Organization ID
 * @param authToken - Authentication token
 * @param campaignId - Campaign ID to update
 * @param gift_card - Gift card configuration object
 * @returns Promise with the update result
 * 
 * @example
 * const giftCard = {
 *   message: "Thank you for participating!",
 *   logoLink: "https://example.com/logo.png",
 *   buttonText: "Claim Gift",
 *   backgroundColor: "#ffffff"
 * };
 * await updateGiftCard(apiUrl, orgId, token, campaignId, giftCard);
 */
export async function updateGiftCard(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  gift_card: GiftCard
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/gift_card`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ gift_card })
    }
  );
  
  return handleResponse(response);
}

// 📧 Email Templates API
export interface EmailTemplate {
  enabled: boolean;
  subject: string;
  content: string;
}

export interface CampaignEmailTemplates {
  addressConfirmedEmail?: EmailTemplate;
  inTransitEmail?: EmailTemplate;
  deliveredEmail?: EmailTemplate;
  acknowledgedEmail?: EmailTemplate;
}

/**
 * Updates the email templates for a campaign
 * 
 * @param baseUrl - API base URL
 * @param organizationId - Organization ID
 * @param authToken - Authentication token
 * @param campaignId - Campaign ID to update
 * @param emailTemplates - Email templates configuration object
 * @returns Promise with the update result
 * 
 * @example
 * const emailTemplates = {
 *   addressConfirmedEmail: {
 *     enabled: true,
 *     subject: "🎁 Great! Your address is confirmed",
 *     content: "Thanks for confirming your address! Your gift is on its way."
 *   },
 *   inTransitEmail: {
 *     enabled: true,
 *     subject: "📦 Your gift is on the way!",
 *     content: "Your gift has shipped and is on its way to you!"
 *   }
 * };
 * await updateEmailTemplates(apiUrl, orgId, token, campaignId, emailTemplates);
 */
export async function updateEmailTemplates(
  baseUrl: string, 
  organizationId: string, 
  authToken: string, 
  campaignId: string, 
  emailTemplates: CampaignEmailTemplates
) {
  const response = await fetch(
    `${baseUrl}/v1/organizations/${organizationId}/campaignsNew/${campaignId}/emailTemplates`,
    {
      method: "PUT",
      headers: getHeaders(authToken),
      body: JSON.stringify({ emailTemplates })
    }
  );
  
  return handleResponse(response);
}

// Legacy class-based API for backward compatibility (can be removed later)
export class CampaignsV2API {
  private baseUrl: string;
  private organizationId: string;
  private authToken: string;

  constructor(baseUrl: string, organizationId: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
    this.authToken = authToken;
  }

  async createCampaign(campaignData: CampaignCreateRequest) {
    return createCampaign(this.baseUrl, this.organizationId, this.authToken, campaignData);
  }

  async updateCampaign(campaignId: string, updateData: CampaignUpdateRequest) {
    return updateCampaign(this.baseUrl, this.organizationId, this.authToken, campaignId, updateData);
  }

  async addRecipients(campaignId: string, contactIds: string[], recipientMode: string) {
    return addRecipients(this.baseUrl, this.organizationId, this.authToken, campaignId, contactIds, recipientMode);
  }

  async runCampaign(campaignId: string, sendForApproval: boolean = false) {
    return runCampaign(this.baseUrl, this.organizationId, this.authToken, campaignId, sendForApproval);
  }

  // 🎁 Gift Selection Methods
  async setSmartMatchGifts(campaignId: string, giftCatalogs: GiftCatalog[]) {
    return setSmartMatchGifts(this.baseUrl, this.organizationId, this.authToken, campaignId, giftCatalogs);
  }

  async setSingleGift(campaignId: string, giftCatalog: GiftCatalog) {
    return setSingleGift(this.baseUrl, this.organizationId, this.authToken, campaignId, giftCatalog);
  }

  async setRecipientsChoiceGifts(campaignId: string, giftCatalogs: GiftCatalog[]) {
    return setRecipientsChoiceGifts(this.baseUrl, this.organizationId, this.authToken, campaignId, giftCatalogs);
  }

  // 🎨 Landing Page Configuration Methods
  async updateLandingPageConfig(campaignId: string, landingPageConfig: LandingPageConfig) {
    return updateLandingPageConfig(this.baseUrl, this.organizationId, this.authToken, campaignId, landingPageConfig);
  }

  // 🎁 Gift Card (Outcome Card) Methods
  async updateGiftCard(campaignId: string, gift_card: GiftCard) {
    return updateGiftCard(this.baseUrl, this.organizationId, this.authToken, campaignId, gift_card);
  }

  // 📧 Email Templates Methods
  async updateEmailTemplates(campaignId: string, emailTemplates: CampaignEmailTemplates) {
    return updateEmailTemplates(this.baseUrl, this.organizationId, this.authToken, campaignId, emailTemplates);
  }
}

// Factory function for backward compatibility
export function createCampaignsV2API(baseUrl: string, organizationId: string, authToken: string): CampaignsV2API {
  return new CampaignsV2API(baseUrl, organizationId, authToken);
} 
