import { CampaignStatusUpdate, DeliveryWebhookItem, RecipientUpdate } from './types';

export const normalizeStatus = (status: string): string => {
  switch (status.trim()) {
    case "OrderPlaced":
    case "Order Placed":
      return "OrderPlaced";
    case "In Transit":
    case "In-Transit":
      return "InTransit";
    default:
      return status;
  }
};

export const isValidStatus = (status: string): boolean => {
  const validStatuses = ["Processing", "InTransit", "Delivered", "OrderPlaced"];
  return validStatuses.includes(status);
};

export const shouldUpdateRecipient = (
  newStatus: string,
  currentData: any,
  webhookData: DeliveryWebhookItem
): boolean => {
  if (!isValidStatus(newStatus)) return false;

  const currentStatus = currentData?.status || "";
  const currentTrackingId = currentData?.trackingId || "";
  const newTrackingId = webhookData["22"] || "";

  return (
    currentStatus !== newStatus ||
    currentTrackingId !== newTrackingId ||
    currentStatus === "OrderPlaced"
  );
};

export const processWebhookItem = (item: DeliveryWebhookItem): RecipientUpdate => {
  return {
    recipientId: item["0"],
    status: normalizeStatus(item["19"] || ""),
    expectedDeliveryDate: item["20"] || undefined,
    deliveryDate: item["21"] || undefined,
    trackingId: item["22"] || undefined,
  };
};

export const updateCampaignStatus = async (
  campaignId: string,
  recipients: any[]
): Promise<any> => {
  try {
    // Calculate delivered count
    const deliveredCount = recipients.filter(
      (r) => r.status === "Delivered" || r.status === "Acknowledged"
    ).length;

    // Check if campaign should be completed
    const allDeliveredOrAcknowledged = recipients.every(
      (recipient) =>
        recipient.status === "Delivered" || recipient.status === "Acknowledged"
    );

    // Find latest delivery date if needed
    let latestDeliveryDate = null;
    if (allDeliveredOrAcknowledged) {
      latestDeliveryDate = recipients.reduce((latest, recipient) => {
        if (!recipient.deliveryDate) return latest;
        const deliveryDate = new Date(recipient.deliveryDate);
        return !latest || deliveryDate > latest ? deliveryDate : latest;
      }, null as Date | null);
    }

    // Prepare update payload
    const updatePayload: CampaignStatusUpdate = {
      delivered_count: deliveredCount,
    };

    if (allDeliveredOrAcknowledged && recipients.length > 0) {
      updatePayload.status = "completed";
      updatePayload.completedAt = latestDeliveryDate?.toISOString() || new Date().toISOString();
    }

    // Make atomic update to campaign
    const response = await fetch(`/api/campaigns/${campaignId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      throw new Error("Failed to update campaign status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating campaign status:", error);
    throw error;
  }
}; 