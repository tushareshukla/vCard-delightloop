export interface CampaignStatusUpdate {
  delivered_count?: number;
  status?: string;
  completedAt?: string;
}

export interface RecipientUpdate {
  recipientId: string;
  status: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  trackingId?: string;
}

export interface DeliveryWebhookItem {
  "0": string;  // recipientId
  "6": string;  // email
  "19": string; // status
  "20": string; // expectedDeliveryDate
  "21": string; // deliveryDate
  "22": string; // trackingId
} 