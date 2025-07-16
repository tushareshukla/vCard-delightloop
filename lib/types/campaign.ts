export interface HiddenBlocks {
  campaignDetails: boolean;
  profileDiscovered: boolean;
  setupBudget: boolean;
  eventDateAndTime: boolean;
  giftRecommendations: boolean;
  launch: boolean;
}

// This is the base interface that can be used by all campaign components
export interface CampaignComponentProps {
  setHiddenBlocks: React.Dispatch<React.SetStateAction<HiddenBlocks>>;
  hiddenBlocks: HiddenBlocks;
  campaignId: string;
  setEnrichSelectedRecipients?: any;
  enrichSelectedRecipients?: any;
  setCampaignId?: any;
  goalOfCampaign?: string;
  setGoalOfCampaign?: any;
  setCampaignDataForCreateMorePipeline?: any;
  campaignDataForCreateMorePipeline?: any;
  goalOfCampaignIsDirect?: boolean;
  setGoalOfCampaignIsDirect?: any;
  IsSimilarProfileClickedInProfileDiscovered?: boolean;
  setIsSimilarProfileClickedInProfileDiscovered?: any;
}

// This is an alias for backward compatibility
export type CampaignDetailsProps = CampaignComponentProps;

export interface Campaign {
  _id: string;
  name: string;
  status: string;
  goal?: string;
  total_recipients?: number;
  budget: {
    totalBudget: number;
    maxPerGift: number;
    currency: string;
    spent: number;
  };
  giftCatalogs?: Array<{
    catalogId: string;
    selectedGift: string;
  }>;
  giftSelectionMode?: string;
  template?: {
    type: "template1" | "template2" | "template3" | "template4";
    description: string;
    date: Date;
    videoLink: string;
    logoLink: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl: string;
  };
  cta_link?: string;
}
