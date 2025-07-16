"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import InfinityLoader from "@/components/common/InfinityLoader";
import Link from "next/link";
import GiftStatusAnimation from "@/components/dashboard/GiftStatusAnimation";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { ReactNode } from "react";
import { headers } from "next/headers";
import RangeSlider from "@/components/common/RangeSlider";
import GiftRecommendations from "@/components/ui/Gift-Recommendations";
import { HiddenBlocks } from "@/lib/types/campaign";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { validateUser } from "@/middleware/authMiddleware";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { Gift } from "@/lib/types/gift";
import { toast } from "react-hot-toast";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useAuth } from "@/app/context/AuthContext";

const DEFAULT_IMAGE = "/placeholder-gift.png";

interface Recipient {
  expectedDeliveryDate: string;
  status: string;
  _id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isVerified?: boolean;
    confidenceScore?: number | null;
  };
  mailId?: string;
  phoneNumber?: string;
  assignedGiftId?: string;
  deliveryDate?: string;
  acknowledgedAt?: string | Date;
  assignedGift?: {
    _id: string;
    name: string;
    price: number;
    primaryImgUrl?: string;
    descShort: string;
  };
  whyGift?: string;
  sendMode?: string;
  trackingId?: string;
  campaignName?: string;
}

interface Campaign {
  _id: string;
  name: string;
  status: string;
  recipients: Recipient[];
  availableGifts: Array<{
    _id: string;
    name: string;
    price: number;
    primaryImgUrl?: string;
  }>;
  budget: {
    total: number;
    perGift: {
      max: number;
      min: number;
    };
  };
  dateRange: {
    startDate: string;
    eventDate: string;
    endDate: string;
  };
  goal?: string;
  childCampaignIds?: string[];
  childCampaigns?: Array<{
    _id: string;
    name: string;
    status: string;
    recipients?: Recipient[];
  }>;
  parentCampaignId?: string;
  giftCatalogs?: Array<{
    catalogId: string;
    selectedGift: string;
  }>;
  bundleIds?: string[]; // Keep for backward compatibility but mark as optional
  organization_id: string;
  giftIds?: string[];
  total_recipients?: number; // Add this to fix linter errors
  approvedAt?: string;
  deliverByDate?: string;
}

const countRecipientsByStatus = (
  recipients: Recipient[] = [],
  status: string
): number => {
  // Debug: Log all recipient statuses
  console.log(
    "All recipient statuses:",
    recipients.map((r) => r.status)
  );

  if (status === "Delivered") {
    // STRICTLY count ONLY recipients with status "Delivered" OR "Acknowledged"
    // Ignore any special display transformations
    const deliveredCount =
      recipients?.filter((recipient) => recipient.status === "Delivered")
        .length || 0;

    const acknowledgedCount =
      recipients?.filter((recipient) => recipient.status === "Acknowledged")
        .length || 0;

    const totalCount = deliveredCount + acknowledgedCount;

    console.log(
      `Delivered count: ${deliveredCount}, Acknowledged count: ${acknowledgedCount}, Total: ${totalCount}`
    );

    return totalCount;
  } else if (status === "Acknowledged") {
    // Count only recipients with status EXACTLY "Acknowledged"
    const count =
      recipients?.filter((recipient) => recipient.status === "Acknowledged")
        .length || 0;

    console.log(`Acknowledged count: ${count}`);

    return count;
  }

  // For all other statuses, count recipients with that exact status
  const count =
    recipients?.filter((recipient) => recipient.status === status).length || 0;
  console.log(`Count for status "${status}": ${count}`);

  return count;
};

const calculateTotalEstimatedCost = (recipients: Recipient[]): number => {
  const total = recipients?.reduce((total, recipient) => {
    return total + (recipient.assignedGift?.price || 0);
  }, 0);
  return Math.ceil(total); // Round up to nearest whole number
};

// Add this loading component at the top of the file
const LoadingSpinner = () => (
  <div className="rounded-tl-3xl bg-white h-full w-full">
    <div className="flex  justify-center items-center h-screen flex-col gap-4">
      <div className="scale-[3]">
        <InfinityLoader />
      </div>
      {/* <p className="text-gray-500 font-medium">Loading campaign details...</p> */}
    </div>
  </div>
);

export default function Page() {
  // Move userData outside function scope to make it accessible throughout the page
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();

  const [sidebaropen, setSidebaropen] = useState(true);
  const [giftSummaryOpen, setGiftSummaryOpen] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recipientSendModes, setRecipientSendModes] = useState<{
    [key: string]: string;
  }>({});
  const [boostClicked, setBoostClicked] = useState(false);
  const [boostRange, setBoostRange] = useState({ min: 0, max: 100 });
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedChildCampaigns, setSelectedChildCampaigns] = useState<
    Set<string>
  >(new Set());
  const router = useRouter();
  const [sendModes, setSendModes] = useState<{
    [key: string]: string;
  }>({});

  const [modal, setModal] = useState(false);
  const [modalGifts, setModalGifts] = useState<Gift[]>([]);
  const [selectedModalGifts, setSelectedModalGifts] = useState<string>("");
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<
    string | null
  >(null);
  const [preloadedGifts, setPreloadedGifts] = useState<Gift[]>([]);
  const [allPageLoading, setAllPageLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [insufficientFundsModalOpen, setInsufficientFundsModalOpen] =
    useState(false);
  const [isApproving, setIsApproving] = useState(false);

  //for gift price range
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalShippingCost, setTotalShippingCost] = useState(0);
  const [totalHandlingCost, setTotalHandlingCost] = useState(0);

  // Update loading state to be more comprehensive
  const [isLoading, setIsLoading] = useState({
    campaign: true,
    gifts: false,
    delivery: false,
  });

  // Add this state near other state declarations
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set()
  );
  const [isCRMConnected, setIsCRMConnected] = useState(false); // Add this state variable

  // Add this state near other state declarations
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Add these state variables
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    addressUpdated: true,
    shipmentInitiated: true,
    giftDelivered: true,
    giftAcknowledged: false,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const [CampaignDoesntExixts, setCampaignDoesntExixts] = useState(false);
  const handleBoostRange = useCallback((min: number, max: number) => {
    setBoostRange({ min, max });
  }, []);

  useEffect(() => {
    if (!isLoadingCookies) {
      fetchWalletBalance();
    }
  }, [isLoadingCookies]);

  useEffect(() => {
    if (!isLoadingCookies) {
      fetchTotalGiftCosts();
    }
  }, [isLoadingCookies]);

  // Function to handle child campaign selection
  const handleChildCampaignSelection = (childId: string, checked: boolean) => {
    setSelectedChildCampaigns((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(childId);
      } else {
        newSet.delete(childId);
      }
      return newSet;
    });
  };

  // Function to get all recipients (parent + selected children)
  const getAllRecipients = useCallback(() => {
    if (!campaign) return [];

    let allRecipients = [...campaign.recipients];

    // Add recipients from selected child campaigns
    campaign.childCampaigns?.forEach((childCampaign) => {
      if (selectedChildCampaigns.has(childCampaign._id)) {
        // Add child campaign recipients if they exist
        childCampaign.recipients?.forEach((recipient) => {
          allRecipients.push({
            ...recipient,
            campaignName: childCampaign.name, // Add campaign name for identification
          });
        });
      }
    });

    return allRecipients;
  }, [campaign, selectedChildCampaigns]);

  const fetchWalletBalance = async () => {
    try {
      const baseUrl = await getBackendApiBaseUrl();
      if (!userId) {
        console.log("No user data found, redirecting to login...");
        router.push("/");
        return;
      }
      const walletBalanceResponse = await fetch(
        `${baseUrl}/v1/${userId}/wallet/check-balance`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (walletBalanceResponse.ok) {
        const data = await walletBalanceResponse.json();
        console.log("Wallet balance:", data);
        setWalletBalance(data.wallet?.current_balance || 0);
      } else {
        console.error("Failed to fetch wallet balance");
      }
    } catch (error) {
      console.error("Error in fetchWalletBalance:", error);
    }
  };

  const fetchTotalGiftCosts = async () => {
    try {
      const baseUrl = await getBackendApiBaseUrl();
      const pathParts = window.location.pathname.split("/");
      const campaignId = pathParts[pathParts.length - 1];
      console.log("Campaign ID from URL:", campaignId);

      const giftsTotalPriceResponse = await fetch(
        `${baseUrl}/v1/campaigns/${campaignId}/gifts-price`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (giftsTotalPriceResponse.ok) {
        const data = await giftsTotalPriceResponse.json();
        setTotalPrice(data.totalPrice);
        setTotalShippingCost(data.totalShippingCost);
        setTotalHandlingCost(data.totalHandlingCost);
      } else {
        console.error("Failed to fetch wallet balance");
      }
    } catch (error) {
      console.error("Error in fetchWalletBalance:", error);
    }
  };

  // Function to fetch delivery details and update recipients
  const fetchAndUpdateDeliveryDetails = async (campaignId: string) => {
    // Show loading state to user
    toast.loading("Updating delivery statuses...", { id: "delivery-update" });

    try {
      // Fetch delivery details
      const deliveryRes = await fetch(
        `${
          process.env.MAKE_WEBHOOK_ORDERS_READ_URL ||
          "https://hook.eu2.make.com/vefw13salmnedp91ld65jeiljyxt3ai2"
        }?campaign_id=${campaignId}`
      );

      if (!deliveryRes.ok) {
        toast.error("Failed to fetch delivery updates", {
          id: "delivery-update",
        });
        return;
      }

      const deliveryData = await deliveryRes.json();

      console.log("Webhook response data:", deliveryData);

      // Track how many recipients were updated to "Delivered" status
      let newlyDeliveredCount = 0;
      let updatedRecipientIds: string[] = [];

      // Process each recipient's delivery details
      const updatePromises = deliveryData.map(async (item: any) => {
        // Get recipient ID and email
        const recipientId = item["0"];
        const recipientEmail = item["6"];
        const status = item["19"] || "";

        // Normalize status for database storage (camelCase format)
        let dbStatus = status;

        // Handle specific status normalizations for database storage
        if (status === "OrderPlaced" || status === "Order Placed")
          dbStatus = "OrderPlaced";
        if (status === "In Transit" || status === "In-Transit")
          dbStatus = "InTransit";

        console.log(
          `Processing recipient ${recipientId}: Webhook status: "${status}", DB Status: "${dbStatus}"`
        );

        try {
          // First, get the current recipient data to check acknowledgment status
          const recipientRes = await fetch(
            `/api/recipients/${recipientId}?email=${recipientEmail}`
          );
          const recipientData = await recipientRes.json();

          console.log(
            `Current recipient status: "${recipientData.data?.status}"`
          );

          // Never overwrite acknowledged status
          if (recipientData.data?.status === "Acknowledged") {
            console.log(
              `Skipping update for acknowledged recipient ${recipientId}`
            );
            // Don't update anything for acknowledged recipients
            return;
          }

          // Always update if the webhook has a valid status, regardless of current recipient status
          if (
            ["Processing", "InTransit", "Delivered", "OrderPlaced"].includes(
              dbStatus
            )
          ) {
            // Check if we need to update - only update if the status is different or if there's new tracking info
            const currentStatus = recipientData.data?.status || "";
            const currentTrackingId = recipientData.data?.trackingId || "";
            const newTrackingId = item["22"] || "";

            // Special case: If current status is "OrderPlaced", always update to the new status
            const shouldUpdate =
              currentStatus !== dbStatus ||
              currentTrackingId !== newTrackingId ||
              currentStatus === "OrderPlaced";

            if (shouldUpdate) {
              console.log(
                `Updating recipient ${recipientId} from "${currentStatus}" to "${dbStatus}"`
              );

              // Use the new update-by-id endpoint
              const updateRes = await fetch(`/api/recipients/update-by-id`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recipientId: recipientId,
                  status: dbStatus,
                  expectedDeliveryDate: item["20"] || "",
                  deliveryDate: item["21"] || "",
                  trackingId: newTrackingId,
                }),
              });

              if (!updateRes.ok) {
                const errorData = await updateRes.json();
                console.error(
                  `Error updating recipient ${recipientId}:`,
                  errorData
                );
              } else {
                console.log(`Successfully updated recipient ${recipientId}`);
                updatedRecipientIds.push(recipientId);

                // Track newly delivered recipients for a single batch update later
                if (dbStatus === "Delivered" && currentStatus !== "Delivered") {
                  newlyDeliveredCount++;
                }
              }
            } else {
              console.log(
                `No update needed for recipient ${recipientId} - status already "${currentStatus}"`
              );
            }
          } else {
            console.log(
              `Skipping update for recipient ${recipientId} - status "${dbStatus}" not in allowed list`
            );
          }
        } catch (error) {
          console.error(`Error processing recipient ${recipientId}:`, error);
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // If any recipients were newly delivered, update the campaign's delivered count in a single operation
      if (newlyDeliveredCount > 0) {
        try {
          console.log(
            `Updating campaign recipientSummary.delivered count by ${newlyDeliveredCount}`
          );

          const updateCampaignRes = await fetch(
            `/api/campaigns/${campaignId}/update-summary`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                field: "delivered",
                increment: newlyDeliveredCount,
              }),
            }
          );

          if (!updateCampaignRes.ok) {
            const errorData = await updateCampaignRes.json();
            console.error(
              `Error updating campaign recipientSummary: ${errorData}`
            );
          } else {
            console.log(
              `Successfully updated campaign recipientSummary.delivered count`
            );
          }
        } catch (error) {
          console.error("Error updating campaign recipientSummary:", error);
        }
      }

      // Refresh campaign data to show updated statuses
      const refreshRes = await fetch(`/api/campaigns/${campaignId}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          // Check if all recipients are either Delivered or Acknowledged
          const allRecipients = refreshData.data.recipients || [];
          const allDeliveredOrAcknowledged = allRecipients.every(
            (recipient) =>
              recipient.status === "Delivered" ||
              recipient.status === "Acknowledged"
          );

          // If all recipients are Delivered or Acknowledged and campaign is not already completed
          if (
            allDeliveredOrAcknowledged &&
            allRecipients.length > 0 &&
            refreshData.data.status !== "completed"
          ) {
            console.log(
              "All recipients are Delivered or Acknowledged. Updating campaign status to completed."
            );

            // Find the latest delivery date
            let latestDeliveryDate = null;
            for (const recipient of allRecipients) {
              if (recipient.deliveryDate) {
                const deliveryDate = new Date(recipient.deliveryDate);
                if (!latestDeliveryDate || deliveryDate > latestDeliveryDate) {
                  latestDeliveryDate = deliveryDate;
                }
              }
            }

            // If no delivery dates found, use current date
            if (!latestDeliveryDate) {
              latestDeliveryDate = new Date();
            }

            // Update campaign status to completed
            try {
              const updateCampaignRes = await fetch(
                `/api/campaigns/${campaignId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    status: "completed",
                    completedAt: latestDeliveryDate.toISOString(),
                  }),
                }
              );

              if (!updateCampaignRes.ok) {
                const errorData = await updateCampaignRes.json();
                console.error(
                  `Error updating campaign status to completed: ${errorData}`
                );
              } else {
                console.log(
                  "Successfully updated campaign status to completed"
                );
                toast.success(
                  "Campaign completed! All gifts have been delivered or acknowledged."
                );

                // Update the local campaign state
                refreshData.data.status = "completed";
                refreshData.data.completedAt = latestDeliveryDate.toISOString();
              }
            } catch (error) {
              console.error(
                "Error updating campaign status to completed:",
                error
              );
            }
          }

          // Preserve acknowledged recipients' data
          setCampaign((prevCampaign) => {
            if (!prevCampaign) return refreshData.data;

            const newRecipients = refreshData.data.recipients.map(
              (newRecipient) => {
                // Find matching recipient in previous state
                const prevRecipient = prevCampaign.recipients.find(
                  (r) => r._id === newRecipient._id
                );

                // If recipient was previously acknowledged, preserve that status
                if (prevRecipient?.status === "Acknowledged") {
                  return {
                    ...newRecipient,
                    status: "Acknowledged",
                    acknowledgedAt: prevRecipient.acknowledgedAt,
                  };
                }

                return newRecipient;
              }
            );

            return {
              ...refreshData.data,
              recipients: newRecipients,
            };
          });

          // Show success message with count of updated recipients
          if (updatedRecipientIds.length > 0) {
            toast.success(
              `Updated ${updatedRecipientIds.length} recipient(s) with latest delivery status`,
              { id: "delivery-update" }
            );
          } else {
            toast.success("All recipients are already up to date", {
              id: "delivery-update",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchAndUpdateDeliveryDetails:", error);
      toast.error("Failed to update delivery statuses", {
        id: "delivery-update",
      });
    }
  };

  const fetchCampaignDetails = async () => {

    try {
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }
      setIsLoading((prev) => ({ ...prev, campaign: true }));
      console.log("Starting campaign details fetch...");

      // Get user data and validate
      //const userData = getUserFromCookie();
      console.log("User data from cookie:", userId);

      if (!userId) {
        console.log("No user data found, redirecting to login...");
        router.push("/");
        return;
      }

      // Fetch user details to get organization_id
      console.log("Fetching user details for ID:", userId);
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        console.error("Failed to fetch user details:", userResponse.status);
        router.push("/");
        return;
      }

      const userDetails = await userResponse.json();
      console.log("User details fetched:", userDetails);

      const userOrgId = userDetails.data.organization_id;
      console.log("User organization ID:", userOrgId);

      const pathParts = window.location.pathname.split("/");
      const campaignId = pathParts[pathParts.length - 1];
      console.log("Campaign ID from URL:", campaignId);

      // Fetch campaign details
      const response = await fetch(`/api/campaigns/${campaignId}`);
      console.log("Campaign API response status:", response.status);

      if (response.status === 401) {
        console.log("Unauthorized access, redirecting...");
        router.push("/");
        return;
      }

      const data = await response.json();
      console.log("Campaign data received:", data);

      //debugger;

      if (!data.success) {
        setCampaignDoesntExixts(true)
        console.log("Failed to fetch campaign:", data.error);
        // router.push("/dashboard");
        return;
      }
      // Validate organization access using fetched organization ID
      if (data.data.organization_id !== userOrgId) {
        console.error("Organization mismatch:", {
          campaignOrg: data.data.organization_id,
          userOrg: userOrgId,
        });
        router.push("/dashboard");
        return;
      }

      // Get unique gift IDs to avoid duplicate fetches
      const uniqueGiftIds = [
        ...new Set(
          data.data?.recipients
            ?.filter((r: Recipient) => r.assignedGiftId)
            .map((r: Recipient) => r.assignedGiftId)
        ),
      ];

      // Fetch all unique gifts in parallel
      const giftMap = new Map();
      if (uniqueGiftIds?.length > 0) {
        const giftPromises = uniqueGiftIds.map(async (giftId) => {
          try {
            const giftRes = await fetch(`/api/gifts/${giftId}`);
            if (giftRes.ok) {
              const giftData = await giftRes.json();
              giftMap.set(giftId, giftData);
            }
          } catch (error) {
            console.error(`Error fetching gift ${giftId}:`, error);
          }
        });
        await Promise.all(giftPromises);
      }

      // Map the gifts to recipients
      const recipientsWithGifts = data.data?.recipients?.map(
        (recipient: Recipient) => {
          if (
            recipient.assignedGiftId &&
            giftMap.has(recipient.assignedGiftId)
          ) {
            const giftData = giftMap.get(recipient.assignedGiftId);
            return {
              ...recipient,
              assignedGift: {
                _id: giftData._id,
                name: giftData.name || "Unnamed Gift",
                price: Number(giftData.price) || 0,
                primaryImgUrl: giftData.images?.primaryImgUrl || DEFAULT_IMAGE,
                descShort: giftData.descShort || "No description available",
              },
            };
          }
          return recipient;
        }
      );

      // Process campaign data
      const campaignWithGifts = data.data;

      // If campaign is live, first get current data to preserve acknowledged statuses
      if (campaignWithGifts.status === "live") {
        console.log("Campaign is live, setting initial data");
        setCampaign(campaignWithGifts);
        // Then fetch delivery details which will preserve acknowledged statuses
        //debugger;
        console.log("Fetching delivery details...");
        fetchAndUpdateDeliveryDetails(campaignId);
      } else {
        console.log("Setting campaign data");
        setCampaign(campaignWithGifts);
      }
    } catch (err) {
      console.error("Error in fetchCampaignDetails:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch campaign");
    } finally {
      setIsLoading((prev) => ({ ...prev, campaign: false }));
    }
  };

  // First useEffect to fetch campaign details
  useEffect(() => {
    if (!isLoadingCookies) {
      setAllPageLoading(true);
      fetchCampaignDetails();
      setAllPageLoading(false);
    }
  }, [router, isLoadingCookies]);

  // Second useEffect to preload gifts when campaign data is available
  useEffect(() => {
    if (!isLoadingCookies) {
      const loadGifts = async () => {
        console.log("Campaign data for gift loading:", campaign);
        if (campaign?.giftIds && campaign.giftIds.length > 0) {
          console.log("Starting to preload gifts for campaign:", campaign.name);
          await preloadGifts(campaign.giftIds);
        }
      };

      if (campaign) {
        loadGifts();
      }
    }
  }, [campaign, isLoadingCookies]);

  // Add this useEffect to initialize the send modes from the database values
  useEffect(() => {
    if (!isLoadingCookies) {
      if (campaign?.recipients) {
        // Debug: Log a sample recipient to check if acknowledgedAt is present
        if (campaign.recipients.length > 0) {
          console.log("Sample recipient data:", campaign.recipients[0]);
          console.log(
            "Has acknowledgedAt:",
            "acknowledgedAt" in campaign.recipients[0]
          );
        }

        const initialSendModes = campaign.recipients.reduce(
          (acc, recipient) => ({
            ...acc,
            [recipient._id]: recipient.sendMode || "direct", // fallback to 'direct' if no value
          }),
          {}
        );
        setRecipientSendModes(initialSendModes);
      }
    }
  }, [campaign?.recipients, isLoadingCookies]);

  const calculateStrokeDasharray = (percentage: number) => {
    const radius = 14; // radius of the circle
    const circumference = 2 * Math.PI * radius; // total length of the circle
    const strokeLength = (percentage * circumference) / 100; // length of the colored stroke
    return `${strokeLength} ${circumference}`; // format: "colored-length total-length"
  };
  const handleApprove = async () => {
    try {
      // Check if wallet balance is sufficient
      const estimatedCost = totalPrice + totalShippingCost + totalHandlingCost;

      if (walletBalance <= 0 || walletBalance < estimatedCost) {
        // Instead of setting error, open the modal
        setInsufficientFundsModalOpen(true);
        return;
      }

      // Set loading state to true
      setIsApproving(true);

      const pathParts = window.location.pathname.split("/");
      const campaignId = pathParts[pathParts.length - 1];

      // Get user data from cookie
      if (!userId) {
        throw new Error("User authentication required");
      }

      // Get the organization ID
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user details");
      }
      const userDetails = await userResponse.json();
      const organizationId = userDetails.data.organization_id;

      // Call the new API endpoint
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(
        `${baseUrl}/v1/organizations/${organizationId}/campaigns/${campaignId}/run`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to approve campaign: ${errorData}`);
      }

      // Update local state to reflect the changes
      setCampaign((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "live",
          recipients: prev.recipients.map((recipient) => ({
            ...recipient,
            status: "Processing",
          })),
        };
      });

      console.log("Successfully approved campaign");
      toast.success("Campaign approved successfully! It is now live.");
    } catch (err) {
      console.error("Error approving campaign:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve campaign"
      );
      toast.error(
        err instanceof Error ? err.message : "Failed to approve campaign"
      );
    } finally {
      // Set loading state back to false
      setIsApproving(false);
    }
  };

  // Add function to filter recipients
  const filteredRecipients = campaign?.recipients.filter((recipient) => {
    if (!searchTerm) return true;

    const fullName =
      `${recipient.firstName} ${recipient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
  const calculateTotalGiftCost = (recipients: Recipient[]): number => {
    return recipients?.reduce((total, recipient) => {
      return total + (recipient.assignedGift?.price || 0);
    }, 0);
  };

  // Modify the loadGiftsForModal function to use preloaded data
  const loadGiftsForModal = (recipientId: string) => {
    try {
      console.log("Budget", campaign?.budget);
      setSelectedRecipientIndex(recipientId);

      // Get the max per gift budget
      // Fix how we access the budget structure
      const maxPerGift =
        campaign?.budget?.maxPerGift || campaign?.budget?.perGift?.max || 0;
      console.log("Max per gift budget:", maxPerGift);

      // Filter gifts by the budget constraint
      const filteredGifts = preloadedGifts.filter(
        (gift) => gift.price <= maxPerGift
      );
      console.log("Filtered gifts within budget:", filteredGifts);

      // Set the filtered gifts to the modal
      setModalGifts(filteredGifts);
      setModal(true);
    } catch (error) {
      console.error("Error in loadGiftsForModal:", error);
    }
  };

  // Add this function to preload gifts
  const preloadGifts = async (giftIds: string[]) => {
    //debugger;
    try {
      console.log("Starting to preload gifts with IDs:", giftIds);

      if (!giftIds || giftIds.length === 0) {
        console.error("No gift IDs provided for preloading");
        return;
      }

      const giftPromises = giftIds.map(async (giftId) => {
        console.log("Preloading gift with ID:", giftId);
        const response = await fetch(`/api/gifts/${giftId}`);

        if (!response.ok) {
          console.error(
            `Failed to fetch gift with ID ${giftId}:`,
            response.status
          );
          return null;
        }

        const responseData = await response.json();
        console.log("Raw API response for gift", giftId, ":", responseData);

        if (responseData && responseData._id) {
          const giftData = {
            _id: responseData._id,
            name: responseData.name || "Unnamed Gift",
            price: responseData.price || 0,
            descShort: responseData.descShort || "No description available",
            images: {
              primaryImgUrl:
                responseData.images?.primaryImgUrl || "/img/image.png",
            },
          };
          console.log("Processed gift data:", giftData);
          return giftData;
        }

        console.log("No valid data found for gift:", giftId);
        return null;
      });

      console.log("Waiting for all gift promises to resolve...");
      const fetchedGifts = await Promise.all(giftPromises);
      console.log("All gifts fetched, raw results:", fetchedGifts);

      const validGifts = fetchedGifts.filter((gift) => gift !== null);
      console.log("Filtered valid gifts:", validGifts);

      if (validGifts.length === 0) {
        console.warn("No valid gifts found after filtering");
      }

      setPreloadedGifts(validGifts);
      console.log("Gifts preloaded successfully:", validGifts);
    } catch (error) {
      console.error("Error in preloadGifts:", error);
    }
  };

  // Show loading state while fetching initial data
  //   if (allPageLoading || isLoading.campaign) {
  //     return <LoadingSpinner />;
  //   }

  // Add this function to fetch preloaded gifts
  const fetchPreloadedGifts = async () => {
    try {
      // Get campaign ID from URL path
      const pathParts = window.location.pathname.split("/");
      const campaignId = pathParts[pathParts.length - 1];
      console.log("[fetchPreloadedGifts] Campaign ID from URL:", campaignId);

      if (!campaignId) {
        console.error("[fetchPreloadedGifts] No campaign ID found in URL");
        return;
      }

      // First fetch the campaign to get gift catalogs
      console.log("[fetchPreloadedGifts] Fetching campaign data...");
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`);
      if (!campaignResponse.ok) {
        setCampaignDoesntExixts(true)
        console.error(
          "[fetchPreloadedGifts] Campaign fetch failed:",
          campaignResponse.status
        );
        throw new Error("Failed to fetch campaign");
      }
      const campaignData = await campaignResponse.json();

      if (!campaignData.data?.giftCatalogs?.length) {
        console.log(
          "[fetchPreloadedGifts] No gift catalogs found in campaign data"
        );
        return;
      }

      // Get the current bundle's gift catalog
      const currentCatalog = campaignData.data.giftCatalogs[0]; // Get first catalog for now
      console.log("[fetchPreloadedGifts] Processing catalog:", currentCatalog);

      if (!currentCatalog || !currentCatalog.catalogId) {
        console.log("[fetchPreloadedGifts] No catalog ID found");
        return;
      }

      // Get all gifts for this catalog
      try {
        console.log(
          "[fetchPreloadedGifts] Fetching gifts for catalog:",
          currentCatalog.catalogId
        );

        // Fetch all gifts from the bundle
        const bundleResponse = await fetch(`/api/bundles`);
        if (!bundleResponse.ok) {
          throw new Error("Failed to fetch bundles");
        }
        const bundlesData = await bundleResponse.json();

        // Find the current bundle
        const currentBundle = bundlesData.bundles.find(
          (bundle: any) => bundle._id === currentCatalog.catalogId
        );

        if (!currentBundle) {
          console.log(
            "[fetchPreloadedGifts] Bundle not found:",
            currentCatalog.catalogId
          );
          return;
        }

        console.log("[fetchPreloadedGifts] Found bundle:", {
          id: currentBundle._id,
          name: currentBundle.bundleName,
          giftCount: currentBundle.giftsList?.length,
        });

        // Get valid gift IDs from the bundle
        const validGiftIds = currentBundle.giftsList.filter(
          ({ giftId }: { giftId: string }) => giftId && giftId.length > 0
        );

        if (validGiftIds.length === 0) {
          console.log("[fetchPreloadedGifts] No valid gifts found in bundle");
          return;
        }

        // Fetch all gifts in parallel
        const giftPromises = validGiftIds.map(
          async ({ giftId }: { giftId: string }) => {
            try {
              console.log("[fetchPreloadedGifts] Fetching gift:", giftId);
              const giftResponse = await fetch(`/api/gifts/${giftId}`);
              if (!giftResponse.ok) {
                if (giftResponse.status === 404) {
                  console.warn(
                    `[fetchPreloadedGifts] Gift ${giftId} not found, skipping...`
                  );
                  return null;
                }
                throw new Error(`Failed to fetch gift ${giftId}`);
              }
              const giftData = await giftResponse.json();
              console.log("[fetchPreloadedGifts] Gift fetched:", giftData.name);
              return giftData;
            } catch (error) {
              console.error(
                `[fetchPreloadedGifts] Error fetching gift ${giftId}:`,
                error
              );
              return null;
            }
          }
        );

        const gifts = (await Promise.all(giftPromises)).filter(
          (gift) => gift !== null
        );
        console.log("[fetchPreloadedGifts] Final gifts array:", {
          totalGifts: gifts.length,
          gifts: gifts.map((g) => ({ id: g._id, name: g.name })),
        });

        setPreloadedGifts(gifts);
      } catch (error) {
        console.error("[fetchPreloadedGifts] Error fetching gifts:", error);
      }
    } catch (error) {
      console.error("[fetchPreloadedGifts] Error:", error);
    }
  };

  // Add useEffect to fetch preloaded gifts when component mounts
  useEffect(() => {
    if (!isLoadingCookies) {
      fetchPreloadedGifts();
    }
  }, [isLoadingCookies]);

  // Add this function to handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(new Set(getAllRecipients().map((r) => r._id)));
    } else {
      setSelectedRecipients(new Set());
    }
  };

  // Add this function to handle individual selection
  const handleSelectRecipient = (recipientId: string, checked: boolean) => {
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(recipientId);
      } else {
        newSet.delete(recipientId);
      }
      return newSet;
    });
  };

  // Add this function near other state declarations
  const handleDeleteSelected = async () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      console.log("[Delete Selected] Starting deletion process");
      console.log("[Delete Selected] Recipients to delete:", {
        count: selectedRecipients.size,
        ids: Array.from(selectedRecipients),
      });

      const response = await fetch("/api/recipients/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientIds: Array.from(selectedRecipients),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipients");
      }

      const data = await response.json();
      console.log("[Delete Selected] Successfully deleted recipients:", {
        deletedCount: data.deletedCount,
      });

      // Update campaign's total recipients count
      const updateResponse = await fetch(`/api/campaigns/${campaign?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_recipients:
            (campaign?.recipients?.length || 0) - selectedRecipients.size,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update recipient count");
      }

      // Clear selection and refresh page
      setSelectedRecipients(new Set());
      setShowDeleteConfirmation(false);
      window.location.reload();
    } catch (error) {
      console.error("[Delete Selected] Error:", error);
      setShowDeleteConfirmation(false);
    }
  };

  // Add this useEffect for handling clicks outside the notification menu
  useEffect(() => {
    if (!isLoadingCookies) {
      function handleClickOutside(event: MouseEvent) {
        if (
          notificationMenuRef.current &&
          !notificationMenuRef.current.contains(event.target as Node)
        ) {
          setNotificationMenuOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isLoadingCookies]);

  // Add these functions to handle notification preferences
  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  // Update the saveNotificationPreferences function
  const saveNotificationPreferences = async () => {
    if (!campaign) return;

    setIsSavingNotifications(true);

    try {
      // Get the campaign ID
      const campaignId = campaign._id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/update-notification-prefs`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            campaignId: campaignId,
            notificationPrefs: {
              addressUpdated: notifications.addressUpdated,
              shipmentInitiated: notifications.shipmentInitiated,
              giftDelivered: notifications.giftDelivered,
              giftAcknowledged: notifications.giftAcknowledged,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }

      const data = await response.json();
      console.log("Notification preferences updated:", data);

      // Show success message with the number of updated recipients
      const updatedCount = data.updatedCount || 0;
      setNotificationMenuOpen(false);

      // Show a toast notification instead of an alert
      toast({
        title: "Notification preferences updated",
        description: `Successfully updated preferences for ${updatedCount} recipient${
          updatedCount !== 1 ? "s" : ""
        }.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);

      // Show error toast
      toast({
        title: "Error updating preferences",
        description: "Failed to save notification settings. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Add a toast component if you don't already have one
  const toast = ({
    title,
    description,
    status,
    duration,
    isClosable,
  }: {
    "use client";
    title: string;
    description: string;
    status: "success" | "error";
    duration: number;
    isClosable: boolean;
  }) => {
    // Create a div for the toast
    const toastDiv = document.createElement("div");
    toastDiv.className = `fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity duration-500 ${
      status === "success"
        ? "bg-green-50 border border-green-200"
        : "bg-red-50 border border-red-200"
    }`;

    // Add content to the toast
    toastDiv.innerHTML = `
      <div class="flex items-start">
        <div class="${
          status === "success" ? "text-green-500" : "text-red-500"
        } flex-shrink-0">
          ${
            status === "success"
              ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
              : '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium ${
            status === "success" ? "text-green-800" : "text-red-800"
          }">${title}</p>
          <p class="mt-1 text-sm ${
            status === "success" ? "text-green-700" : "text-red-700"
          }">${description}</p>
        </div>
        ${
          isClosable
            ? `<button class="ml-4 text-gray-400 hover:text-gray-900" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>`
            : ""
        }
      </div>
    `;

    // Add the toast to the document
    document.body.appendChild(toastDiv);

    // Auto-remove after duration
    if (duration) {
      setTimeout(() => {
        toastDiv.style.opacity = "0";
        setTimeout(() => toastDiv.remove(), 500);
      }, duration);
    }
  };

  // Add a function to check if all recipients have gifts assigned
  const allRecipientsHaveGifts = (): boolean => {
    if (!campaign?.recipients || campaign.recipients.length === 0) return false;
    return campaign.recipients.every((recipient) => recipient.assignedGiftId);
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showTrackStatusModal, setShowTrackStatusModal] = useState<
    string | null
  >(null);
  const trackStatusModalRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Add click outside handler to close the menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add useEffect for track status modal click outside handler
  useEffect(() => {
    if (!isLoadingCookies) {
      function handleClickOutside(event: MouseEvent) {
        if (
          trackStatusModalRef.current &&
          !trackStatusModalRef.current.contains(event.target as Node)
        ) {
          setShowTrackStatusModal(null);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isLoadingCookies]);

  // Toggle menu handler
  const handleMenuToggle = (id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  // Modify the track status handler to show modal instead of navigating
  const handleTrackStatus = (recipientId: string) => {
    setOpenMenuId(null); // Close the dropdown menu
    setShowTrackStatusModal(recipientId); // Open the track status modal
  };

  return (
    <>
      <div className="flex bg-[#FFFFFF]">
        {/* Sidebar */}
        <AdminSidebar />
        {/* //todo ------------------  p-3 for that purple color  ------------------ */}

        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          {/* //todo ------------------  Main menu ------------------ */}
          {allPageLoading || isLoading.campaign ? (
            <LoadingSpinner />
          ) : (
            <>
            {!CampaignDoesntExixts ? (
              <div className="p-6  bg-white rounded-tl-3xl h-[100%]  overflow-y-scroll overflow-x-hidden">
                {/* //todo (1) --- Header --- */}
                <div className="grid gap-5">
                {/* //! (1) Breadcrumb */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                      <Image
                        src="/svgs/home.svg"
                        alt="arrow"
                        width={20}
                        height={20}
                      />
                    </Link>
                    <Image
                      src="/svgs/arr.svg"
                      alt="arrow"
                      width={4}
                      height={8}
                    />
                    <Link href="/dashboard">
                      <div className="text-sm font-medium leading-6 text-[#667085] px-1 hover:text-primary">
                        Campaign List
                      </div>
                    </Link>
                    <Image
                      src="/svgs/arr.svg"
                      alt="arrow"
                      width={4}
                      height={8}
                    />
                    <div className="text-sm font-medium leading-6 text-[#1b1d21] px-1">
                      {campaign?.name}
                    </div>
                  </div>

                  {/* Commenting out New Campaign button for now
                <Link
                  href="/create-your-campaign"
                  className="bg-primary font-semibold text-white px-4 py-2 rounded-lg text-xl hover:bg-primary-dark duration-300 flex items-center gap-2"
                >
                  <Image
                    src="/svgs/Shimmer.svg"
                    alt="plus"
                    width={20}
                    height={20}
                  />
                  New Campaign
                </Link>
                */}
                  {campaign?.status === "waiting_for_approval" ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {/* Reject button commented out as per request - not needed for now
                        <button className="border-[#F04438] hover:bg-[#F04438] hover:text-white duration-300 shadow-sm border text-[#F04438] px-5 py-1 rounded-md  font-semibold">
                          Reject
                        </button>
                        */}
                        <button
                          onClick={handleApprove}
                          disabled={isApproving}
                          className={`border-primary shadow-sm border px-5 py-1 rounded-md font-semibold flex items-center justify-center min-w-[100px] ${
                            isApproving
                              ? "bg-primary/80 text-white cursor-not-allowed"
                              : "bg-primary text-white hover:text-primary hover:bg-white duration-300"
                          }`}
                        >
                          {isApproving ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* //! (2) campaign details */}
                <div className="flex items-center justify-between">
                  {/* //? (1) campaign name */}
                  <div>
                    {/* // (1) campaign name with tooltip */}
                    <div className="flex gap-8 text-sm font-semibold mb-2 ">
                            <button className="border-b-2 border-primary pb-1">
                                Campaign Details
                            </button>
                            <Link href={`/campaign-detail/${campaign?._id}/templates`} className="pb-1 hover:border-b-2 hover:border-primary-light ">
                                Templates
                            </Link>
                        </div>
                    <div className="relative group">

                      <div className="text-3xl font-medium text-[#101828] cursor-help">
                        {campaign?.name}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute hidden group-hover:block bg-[#101828] text-white text-xs py-2 px-3 rounded-lg top-0.5 -right-[17rem] whitespace-nowrap">
                        Campaign ID: {campaign?._id}
                        {/* triangle */}
                        <div className="absolute -left-2.5 top-2.5">
                          <div className="border-[6px] -rotate-90 border-transparent border-b-[#101828]" />
                        </div>
                      </div>
                    </div>
                    {/* // container of  campaign status and campaign type */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="inline-flex items-center px-4 py-1.5 rounded-full w-fit text-xs bg-primary-light text-white font-medium">
                        {campaign?.goal === "delight_event_attendees"
                          ? "Delight Event Attendees"
                          : campaign?.goal === "create_more_pipeline"
                          ? "Create More Pipeline"
                          : campaign?.goal === "close_deal_faster"
                          ? "Close Deal Faster"
                          : campaign?.goal === "reduce_churn"
                          ? "Reduce Churn"
                          : campaign?.goal}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full w-fit text-xs ${
                          !campaign?.parentCampaignId
                            ? campaign?.childCampaigns &&
                              campaign.childCampaigns.length > 0
                              ? "bg-[#F9F5FF] text-[#6941C6] border-purple-500 border-[1px] font-medium text-[12px]" // Completed style for parent with child campaigns
                              : campaign?.status === "live"
                              ? "bg-[#ECFDF3] text-[#027A48] border-green-500 border-[1px] font-medium text-[12px]"
                              : campaign?.status === "completed"
                              ? "bg-[#F9F5FF] text-[#6941C6] border-purple-500 border-[1px] font-medium text-[12px]"
                              : campaign?.status === "draft"
                              ? "bg-[#F2F4F7] text-[#344054] border-gray-500 border-[1px] font-medium text-[12px]"
                              : campaign?.status === "waiting_for_approval" ||
                                campaign?.status === "list_building"
                              ? "bg-[#FEF6EE] text-[#B93815] border-red-500 border-[1px] font-medium text-[12px]"
                              : campaign?.status === "matching_gifts"
                              ? "bg-[#FFF8E6] text-[#E67F05] font-medium text-[12px] flex items-center gap-1 border-[#E67F05] border-[1px] "
                              : campaign?.status === "rejected"
                              ? "bg-red-50 text-[#B93815] border-red-500 border-[1px] font-medium text-[12px]"
                              : campaign?.status === "ready_for_launch"
                              ? "bg-[#EFF8FF] text-[#175CD3] font-medium text-[12px] border-blue-500 border-[1px]"
                              : ""
                            : // Child campaign status styles remain unchanged
                            campaign?.status === "live"
                            ? "bg-[#ECFDF3] text-[#027A48] border-green-500 border-[1px] font-medium text-[12px]"
                            : campaign?.status === "completed"
                            ? "bg-[#F9F5FF] text-[#6941C6] border-purple-500 border-[1px] font-medium text-[12px]"
                            : campaign?.status === "draft"
                            ? "bg-[#F2F4F7] text-[#344054] border-gray-500 border-[1px] font-medium text-[12px]"
                            : campaign?.status === "waiting_for_approval" ||
                              campaign?.status === "list_building" ||
                              campaign?.status === "matching gifts"
                            ? "bg-[#FEF6EE] text-[#B93815] border-red-500 border-[1px] font-medium text-[12px]"
                            : campaign?.status === "rejected"
                            ? "bg-red-50 text-[#B93815] border-red-500 border-[1px] font-medium text-[12px]"
                            : campaign?.status === "ready_for_launch"
                            ? "bg-[#EFF8FF] text-[#175CD3] border-blue-500 border-[1px] font-medium text-[12px]"
                            : ""
                        }`}
                      >
                        {
                          <span
                            className={`w-2 h-2 ${
                              campaign?.status == "waiting_for_approval"
                                ? "bg-red-500"
                                : // : campaign.name == "Takeout Campaign - Citrix"
                                //  "bg-white"
                                campaign?.status == "live"
                                ? "bg-[#12B76A]"
                                : "hidden"
                            } rounded-full mr-2`}
                          ></span>
                        }

                        <span className="capitalize">
                          {!campaign?.parentCampaignId &&
                          campaign?.childCampaigns &&
                          campaign?.childCampaigns.length > 0
                            ? "completed"
                            : campaign.status === "matching_gifts"
                            ? "Matching Gifts"
                            : campaign.status === "list_building"
                            ? "List Building"
                            : campaign?.status === "ready_for_launch"
                            ? "Ready for Launch"
                            : campaign?.status === "waiting_for_approval"
                            ? "Waiting for Approval"
                            : campaign?.status === "live"
                            ? "Live"
                            : campaign?.status === "completed"
                            ? "Completed"
                            : campaign?.status === "draft"
                            ? "Draft"
                            : campaign?.status === "rejected"
                            ? "Rejected"
                            : campaign?.status === "cancelled"
                            ? "Cancelled"
                            : campaign?.status}
                        </span>

                        {(campaign?.status === "matching gifts" ||
                          campaign?.status === "list_building") && (
                          <>
                            <span className="inline-flex gap-[2px] ml-1">
                              {Array.from({ length: 3 }, (_, i) => (
                                <span
                                  key={i}
                                  className="w-1 h-1 rounded-full bg-[#E67F05] animate-[dot-loading_1.4s_ease-in-out_infinite] mt-1"
                                  style={{
                                    animationDelay: `${i * 0.2}s`,
                                  }}
                                />
                              ))}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* //? (2) Reject and select button */}
                  {campaign?.status === "waiting_for_approval" ||
                  campaign?.status === "ready_for_launch" ||
                  campaign?.status === "matching gifts" ? (
                    <>
                      {/* Show button for parent campaign without child campaigns in ready to launch state */}
                      {!campaign?.parentCampaignId &&
                        (!campaign?.childCampaigns ||
                          campaign.childCampaigns.length === 0) &&
                        campaign?.status === "ready_for_launch" &&
                        (campaign?.giftCatalogs &&
                        campaign.giftCatalogs.length > 0 ? (
                          <button
                            onClick={async () => {
                              try {
                                console.log(
                                  "[Send for Approval] Updating campaign status"
                                );
                                const response = await fetch(
                                  `/api/campaigns/${campaign._id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      status: "waiting_for_approval",
                                      total_recipients:
                                        getAllRecipients().length,
                                    }),
                                  }
                                );

                                if (!response.ok) {
                                  throw new Error(
                                    "Failed to update campaign status"
                                  );
                                }

                                console.log(
                                  "[Send for Approval] Successfully updated campaign status"
                                );
                                window.location.reload();
                              } catch (error) {
                                console.error(
                                  "[Send for Approval] Error:",
                                  error
                                );
                              }
                            }}
                            disabled={!allRecipientsHaveGifts()}
                            className={`flex items-center font-semibold  gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg ${
                              allRecipientsHaveGifts()
                                ? "bg-primary hover:opacity-95"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              !allRecipientsHaveGifts()
                                ? "All recipients must have a gift assigned"
                                : ""
                            }
                          >
                            <Image
                              src="/svgs/Shimmer.svg"
                              alt="shimmers"
                              width={18}
                              height={18}
                            />
                            Send for Approval
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              router.push(
                                `/create-your-campaign?campaignId=${campaign._id}&giftassigned=false`
                              )
                            }
                            className="flex items-center font-semibold text-xl gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg bg-primary hover:opacity-95"
                          >
                            <Image
                              src="/svgs/Shimmer.svg"
                              alt="shimmers"
                              width={22}
                              height={22}
                            />
                            Let's Find the Perfect Gift
                          </button>
                        ))}
                      {/* Show button for selected child campaigns in ready to launch state */}
                      {campaign?.childCampaigns &&
                        campaign.childCampaigns.length > 0 &&
                        campaign.childCampaigns.some(
                          (child) =>
                            selectedChildCampaigns.has(child._id) &&
                            child.status === "ready_for_launch"
                        ) && (
                          <button
                            onClick={() => {
                              const selectedReadyChild =
                                campaign.childCampaigns?.find(
                                  (child) =>
                                    selectedChildCampaigns.has(child._id) &&
                                    child.status === "ready_for_launch"
                                );
                              if (selectedReadyChild) {
                                setCampaign((prevCampaign) => ({
                                  ...prevCampaign,
                                  ...selectedReadyChild,
                                  recipients:
                                    selectedReadyChild.recipients || [],
                                  childCampaigns: prevCampaign?.childCampaigns,
                                  availableGifts:
                                    prevCampaign?.availableGifts || [],
                                  budget: prevCampaign?.budget || {
                                    total: 0,
                                    perGift: { min: 0, max: 0 },
                                  },
                                  dateRange: prevCampaign?.dateRange || {
                                    startDate: new Date().toISOString(),
                                    eventDate: new Date().toISOString(),
                                    endDate: new Date().toISOString(),
                                  },
                                }));
                                setShowGiftModal(true);
                              }
                            }}
                            className={`flex items-center font-semibold text-xl gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
                          >
                            <Image
                              src="/svgs/Shimmer.svg"
                              alt="shimmers"
                              width={22}
                              height={22}
                            />
                            Let's Find the Perfect Gift
                          </button>
                        )}
                    </>
                  ) : (
                    <div className="font-semibold flex gap-12">
                      {/* sent on */}
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/svgs/cursor-arrow.svg"
                            alt="calendar"
                            width={14}
                            height={14}
                          />
                          Sent on
                        </div>
                        <div className="text-xl">
                          {campaign?.approvedAt
                            ? new Date(campaign?.approvedAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </div>
                      </div>
                      {/* end date */}
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/svgs/flag.svg"
                            alt="calendar"
                            width={14}
                            height={14}
                          />
                          End Date
                        </div>
                        <div className="text-xl">
                          {campaign?.deliverByDate
                            ? new Date(
                                campaign?.deliverByDate
                              ).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </div>
                      </div>
                      {/* //! --------------------- Boost Button For Completed campaigns only-------------- */}
                      {/* Feature not ready yet - Boost functionality commented out */}
                      {/* {campaign?.status === "completed" && (
                        <div className="flex items-center relative">
                          <button
                            onClick={() => {
                              setBoostClicked(!boostClicked);
                            }}
                            className="text-white font-semibold bg-primary hover:bg-primary/95  px-4 py-1 rounded-lg "
                          >
                            Boost
                          </button>
                          <div
                            className={`absolute top-12 shadow-sm right-0 border border-[#D2CEFE] bg-white rounded-lg w-[590px] h-[298px] ${
                              boostClicked ? "block" : "hidden"
                            }`}
                          >
                            <div className="py-[32px] px-[21px]">
                              <div className="text-lg font-medium text-center">
                                How many similar profiles would you like to
                                find?
                              </div>
                              <div className="text-sm text-[#667085]  text-center">
                                You can choose a range below.
                              </div>
                              <div className="mt-16 px-5">
                                <RangeSlider
                                  initialMin={0}
                                  initialMax={100}
                                  setBudget={handleBoostRange}
                                  notMoney={true}
                                />
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-[#667085]">0</div>
                                  <div className="text-sm text-[#667085]">500+</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>
                  )}
                </div>
              </div>
              {/* //todo (2) --- campaign description ---- */}
              <div
                className={`${
                  campaign?.childCampaigns && campaign.childCampaigns.length > 0
                    ? "px-4 py-[18px] border-[#D2CEFE] border rounded-lg bg-[#F4F3FF] mt-10"
                    : "mt-10"
                }`}
              >
                {/* First section - visible for waiting_for_approval, list_building, ready_for_launch, matching gifts, and anything not in second section list */}
                {(campaign?.status === "waiting_for_approval" ||
                  campaign?.status === "matching gifts" ||
                  campaign?.status === "ready_for_launch" ||
                  campaign?.status === "list_building" ||
                  (campaign?.status !== "live" &&
                    campaign?.status !== "completed" &&
                    campaign?.status !== "rejected" &&
                    campaign?.status !== "cancelled")) && (
                  <>
                    <div className="border-[#D2CEFE] border px-12  pt-12 pb-16 rounded-lg grid grid-flow-col bg-white">
                      {/* //? (1) Total Attendees */}
                      <div className="grid gap-2 border border-y-0 border-l-0 w-fit pr-6">
                        <div className="font-semibold text-[#101828D6]">
                          Total Attendees
                        </div>
                        <div className="text-3xl font-semibold">
                          {campaign?.recipients?.length || 0}
                        </div>
                      </div>
                      {/* //? (3) Estimated Cost */}
                      <div className="grid gap-2 border border-y-0 border-l-0 w-fit pr-6">
                        <div className="font-semibold text-[#101828D6]">
                          Estimated Cost
                        </div>
                        <div className="text-3xl font-semibold text-end">
                          $
                          {totalPrice + totalShippingCost + totalHandlingCost ||
                            0}
                        </div>
                      </div>
                      {/* //? (4) start date */}
                      <div className="grid gap-2 border border-y-0 border-l-0 w-fit pr-6">
                        <div className="font-semibold text-[#101828D6]">
                          Start Date
                        </div>
                        <div className="text-3xl font-semibold text-end">
                          {campaign?.dateRange?.startDate
                            ? new Date(
                                campaign?.dateRange?.startDate
                              ).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </div>
                      </div>
                      {/* //? (5) Running Time */}
                      <div className="grid gap-2 border border-y-0 border-l-0 w-fit pr-6">
                        <div className="font-semibold text-[#101828D6]">
                          Running Time
                        </div>
                        <div className="flex items-center justify-start ">
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-full bg-purple-500 rounded-full animate-progressBar transition-all duration-1000 ease-in-out"
                                style={{ width: `0%` }}
                              ></div>
                            </div>
                            <span className="text-[#344054] text-sm font-normal">
                              0/{campaign?.recipients?.length || 0}
                            </span>
                          </div>
                          <div className="text-xs ml-2 rounded-full px-2 py-1">
                            0%
                          </div>
                        </div>
                      </div>
                      {/* //? (6) Opportunity */}
                      <div className="grid gap-2 border border-y-0 border-l-0 w-fit pr-6">
                        <div className="font-semibold text-[#101828D6]">
                          Opportunity
                        </div>
                        <div className="text-3xl font-semibold text-center">
                          0
                        </div>
                      </div>
                      {/* //? (7) Accounts */}
                      <div className="grid gap-2">
                        <div className="font-semibold text-[#101828D6]">
                          Accounts
                        </div>
                        <div className="text-3xl font-semibold text-center">
                          {campaign?.recipients?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Info box in next row */}
                    <div className="bg-[#F4F3FF] border px-6 py-2 rounded-lg w-full">
                      <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                setDetailsModalOpen(!detailsModalOpen)
                              }
                              className="px-3 py-0.5 bg-white border border-[#D0D5DD] text-[#344054] text-sm font-medium rounded-md hover:bg-gray-50"
                            >
                              Details
                            </button>
                            <p className="text-[#7F56D9] text-sm">
                              Current Wallet Balance{" "}
                              <span className="text-red-500 font-bold">
                                ${walletBalance}
                              </span>
                            </p>
                          </div>
                          <Link
                            href="/dashboard/wallet"
                            className="px-3 py-0.5 bg-[#7F56D9] hover:bg-[#6941C6] text-white text-sm font-medium rounded-md"
                          >
                            Add Funds
                          </Link>
                        </div>
                        <div className="relative">
                          <button
                            className="text-sm text-[#7F56D9] font-semibold hover:bg-gray-50 border border-[#f3f3f3] bg-white px-3 py-1 rounded-md"
                            onClick={() =>
                              setNotificationMenuOpen(!notificationMenuOpen)
                            }
                          >
                            Notification Preferences
                          </button>

                          {/* Notification Preferences Popup */}
                          {notificationMenuOpen && (
                            <div
                              ref={notificationMenuRef}
                              className="absolute right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 w-72 z-50"
                            >
                              <div className="p-4">
                                <h3 className="font-medium text-gray-900 mb-2">
                                  Notification Settings
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                  Choose which notifications you want to receive
                                  for this campaign
                                </p>

                                <div className="space-y-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notifications.addressUpdated}
                                      onChange={() =>
                                        toggleNotification("addressUpdated")
                                      }
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">
                                      Recipient Address Updated
                                    </span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notifications.shipmentInitiated}
                                      onChange={() =>
                                        toggleNotification("shipmentInitiated")
                                      }
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">
                                      Shipment Initiated
                                    </span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notifications.giftDelivered}
                                      onChange={() =>
                                        toggleNotification("giftDelivered")
                                      }
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">
                                      Delivered
                                    </span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notifications.giftAcknowledged}
                                      onChange={() =>
                                        toggleNotification("giftAcknowledged")
                                      }
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">
                                      Acknowledged
                                    </span>
                                  </label>
                                </div>

                                <div className="mt-4 flex justify-end">
                                  <button
                                    onClick={saveNotificationPreferences}
                                    disabled={isSavingNotifications}
                                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center"
                                  >
                                    {isSavingNotifications ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        Saving...
                                      </>
                                    ) : (
                                      "Save Settings"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Modal */}
                    {detailsModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
                        <div
                          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out"
                          style={{
                            animation: "slideIn 0.3s ease-out forwards",
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Campaign Cost Details
                            </h3>
                            <button
                              onClick={() => setDetailsModalOpen(false)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mb-6">
                            <div className="bg-gray-50 p-4 rounded-md mb-4">
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-600">
                                  Gift Cost:
                                </span>
                                <span className="font-semibold text-[#7F56D9]">
                                  ${totalPrice || 0}
                                </span>
                              </div>
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-600">
                                  Shipping and Handling:
                                </span>
                                <span className="font-semibold text-[#7F56D9]">
                                  ${totalShippingCost + totalHandlingCost || 0}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-600">
                                  Your total estimated cost:
                                </span>
                                <span className="font-semibold text-[#7F56D9]">
                                  $
                                  {totalPrice +
                                    totalShippingCost +
                                    totalHandlingCost || 0}
                                </span>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md">
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-600">
                                  Wallet Balance:
                                </span>
                                <span className="font-semibold text-[#7F56D9]">
                                  ${walletBalance || 0}
                                </span>
                              </div>
                              {walletBalance <
                                totalPrice +
                                  totalShippingCost +
                                  totalHandlingCost && (
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                  <span className="text-gray-600">
                                    Shortfall:
                                  </span>
                                  <span className="font-semibold text-red-500">
                                    $
                                    {Math.max(
                                      0,
                                      totalPrice +
                                        totalShippingCost +
                                        totalHandlingCost -
                                        walletBalance
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setDetailsModalOpen(false)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Close
                            </button>
                            <Link
                              href="/dashboard/wallet"
                              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                            >
                              Add Funds
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Second section - visible only for live, completed, rejected, cancelled */}
                {(campaign?.status === "live" ||
                  campaign?.status === "completed" ||
                  campaign?.status === "rejected" ||
                  campaign?.status === "cancelled") && (
                  <div className="grid grid-cols-2 gap-10">
                    <div className="border-[#D2CEFE] border px-12 pt-6 pb-10 rounded-lg bg-white">
                      {/* //? (1) campaign description */}
                      <div className=" uppercase flex items-center justify-between gap-2 text-[#101828D6] font-semibold text-sm mb-5">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/svgs/RealGift.svg"
                            alt="campaign-description"
                            width={27}
                            height={27}
                          />
                          gift summary
                        </div>
                      </div>
                      <div>
                        <div className="grid justify-evenly grid-flow-col gap-6 mt-10 ">
                          {/* // (1) Target Audience */}
                          <div className="grid gap-3 h-fit">
                            <div className="text-6xl font-[800] text-center ">
                              {campaign?.recipients?.length || 0}
                            </div>
                            <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Target
                            </div>
                          </div>

                          <div className="h-20 bg-[#E3CEFE] w-[1px]"></div>
                          {/* // (2) Max Gift Budget */}
                          <div className="grid gap-3 h-fit">
                            <div className="text-6xl font-[800] text-center ">
                              {countRecipientsByStatus(
                                campaign?.recipients || [],
                                "Delivered"
                              )}
                            </div>
                            {campaign?.status === "completed" && (
                              <div className="text-primary text-center font-semibold ">
                                {Math.round(
                                  (countRecipientsByStatus(
                                    campaign?.recipients || [],
                                    "Delivered"
                                  ) /
                                    (campaign?.recipients?.length || 1)) *
                                    100
                                )}
                                %
                              </div>
                            )}
                            <div className="text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Delivered
                            </div>
                          </div>

                          <div className="h-20 bg-[#E3CEFE] w-[1px]"></div>
                          {/* // (3) Estimated Cost */}

                          <div className="grid gap-3 h-fit">
                            <div
                              id="delivered"
                              className="text-6xl font-[800] text-center "
                            >
                              {countRecipientsByStatus(
                                campaign?.recipients || [],
                                "Acknowledged"
                              )}
                            </div>
                            {campaign?.status === "completed" && (
                              <div className="text-primary text-center font-semibold ">
                                {Math.round(
                                  (countRecipientsByStatus(
                                    campaign?.recipients || [],
                                    "Acknowledged"
                                  ) /
                                    (campaign?.recipients?.length || 1)) *
                                    100
                                )}
                                %
                              </div>
                            )}
                            <div className="text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Acknowledged
                            </div>
                          </div>
                          <div className="h-20 bg-[#E3CEFE] w-[1px]"></div>
                          <div className="grid gap-3 h-fit">
                            <div
                              id="delivered"
                              className="text-6xl font-[800] text-center "
                            >
                              {" "}
                              {/*${calculateTotalGiftCost(campaign?.recipients || []).toFixed(0)} */}
                              $
                              {totalPrice +
                                totalShippingCost +
                                totalHandlingCost}
                            </div>
                            <div className="text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Cost
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-[#D2CEFE] border px-12 pt-6 pb-10 rounded-lg bg-white">
                      {/* //? (1) campaign description */}
                      <div className=" uppercase flex items-center justify-between gap-2 text-[#101828D6] font-semibold text-sm mb-5">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/svgs/smily-love.svg"
                            alt="campaign-description"
                            width={27}
                            height={27}
                          />
                          gift roi
                        </div>
                      </div>

                      {isCRMConnected ? (
                        <div className="grid grid-flow-col justify-evenly mt-10 -mx-10 ">
                          {/* // (1) Target Audience */}
                          <div className="grid gap-3 h-fit">
                            <div className="text-6xl font-[800] text-center ">
                              {campaign?.recipients?.length || 0}
                            </div>
                            <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Account
                            </div>
                          </div>
                          <div className="h-16 bg-[#E3CEFE] w-[1px] "></div>
                          {/* // (2) Max Gift Budget */}
                          <div className="grid gap-3 h-fit">
                            <div className="text-6xl font-[800] text-center ">
                              {Math.round(
                                (campaign?.recipients?.length || 0) * 0.96
                              )}
                            </div>
                            <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Opportunities
                            </div>
                          </div>
                          <div className="h-16 bg-[#E3CEFE] w-[1px] "></div>
                          {/* // (3) Estimated Cost */}
                          <div className="grid gap-3 h-fit">
                            <div className="text-6xl font-[800]  text-center ">
                              $
                              {Math.floor(
                                calculateTotalGiftCost(
                                  campaign?.recipients || []
                                ) * 3
                              )}
                              k
                            </div>
                            <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                              Influenced
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="grid grid-flow-col justify-evenly mt-10 -mx-10 filter blur-sm opacity-60">
                            {/* // (1) Target Audience */}
                            <div className="grid gap-3 h-fit">
                              <div className="text-6xl font-[800] text-center ">
                                {campaign?.recipients?.length || 42}
                              </div>
                              <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                                Account
                              </div>
                            </div>
                            <div className="h-16 bg-[#E3CEFE] w-[1px] "></div>
                            {/* // (2) Max Gift Budget */}
                            <div className="grid gap-3 h-fit">
                              <div className="text-6xl font-[800] text-center ">
                                {Math.round(
                                  (campaign?.recipients?.length || 0) * 0.96
                                ) || 38}
                              </div>
                              <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                                Opportunities
                              </div>
                            </div>
                            <div className="h-16 bg-[#E3CEFE] w-[1px] "></div>
                            {/* // (3) Estimated Cost */}
                            <div className="grid gap-3 h-fit">
                              <div className="text-6xl font-[800]  text-center ">
                                $
                                {Math.floor(
                                  calculateTotalGiftCost(
                                    campaign?.recipients || []
                                  ) * 3
                                ) || 320}
                                k
                              </div>
                              <div className=" text-center font-semibold leading-6 text-[#101828] text-opacity-80">
                                Influenced
                              </div>
                            </div>
                          </div>

                          {/* Overlay with CRM connection message */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 rounded-lg p-4 shadow-md text-center max-w-md">
                              <div className="flex items-center justify-center mb-2">
                                <Image
                                  src="/svgs/lock.svg"
                                  alt="Locked"
                                  width={24}
                                  height={24}
                                  className="mr-2"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/svgs/smily-love.svg";
                                  }}
                                />
                                <h3 className="text-lg font-semibold text-[#101828]">
                                  CRM Connection Required
                                </h3>
                              </div>
                              <p className="text-[#667085] text-sm mb-3">
                                Connect your CRM to unlock these ROI metrics and
                                track campaign performance.
                              </p>
                              <a
                                href="https://www.delightloop.com/bookademo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-white bg-[#7F56D9] hover:bg-[#6941C6] transition-colors px-4 py-2 rounded-md font-medium"
                              >
                                Let us help you connect your CRM
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Related Campaigns Section */}
                {campaign?.childCampaigns &&
                  campaign.childCampaigns.length > 0 && (
                    <div className="mt-10">
                      <h2 className="text-lg font-semibold mb-6">
                        Related Campaigns
                      </h2>
                      <div className="grid grid-cols-3 gap-4">
                        {campaign.childCampaigns.map((childCampaign, index) => (
                          <div
                            key={childCampaign._id}
                            className="border bg-white border-[#D2CEFE] rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedChildCampaigns.has(
                                  childCampaign._id
                                )}
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                                onChange={(e) =>
                                  handleChildCampaignSelection(
                                    childCampaign._id,
                                    e.target.checked
                                  )
                                }
                              />
                              <Link
                                href={`/campaign-detail/${childCampaign._id}`}
                                className="text-[#101828] hover:text-primary"
                              >
                                {childCampaign.name}
                              </Link>
                            </div>
                            <div className="text-sm text-[#667085] mb-1">
                              Campaign ID: {childCampaign._id}
                            </div>
                            <div
                              className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${
                                childCampaign.status === "live"
                                  ? "bg-[#ECFDF3] text-[#027A48]"
                                  : childCampaign.status === "completed"
                                  ? "bg-[#F9F5FF] text-[#6941C6]"
                                  : childCampaign.status === "draft"
                                  ? "bg-[#F2F4F7] text-[#344054]"
                                  : childCampaign.status ===
                                      "waiting_for_approval" ||
                                    childCampaign.status === "list_building" ||
                                    childCampaign.status === "matching gifts"
                                  ? "bg-[#FEF6EE] text-[#B93815]"
                                  : childCampaign.status === "rejected"
                                  ? "bg-red-50 text-[#B93815]"
                                  : childCampaign.status === "ready_for_launch"
                                  ? "bg-[#EFF8FF] text-[#175CD3]"
                                  : ""
                              }`}
                            >
                              {childCampaign.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              {/* //todo ------------------ real deep campaign details ------------------ */}
              <div
                className={`border-[#D2CEFE] border rounded-lg mt-10 duration-300  overflow-hidden ${
                  giftSummaryOpen ? "h-[800px] " : "h-[70px]"
                }`}
              >
                {/* //! opening  button */}
                <div
                  onClick={() => {
                    const isParentWithoutChildren =
                      !campaign?.parentCampaignId &&
                      (!campaign?.childCampaigns ||
                        campaign.childCampaigns.length === 0);
                    const shouldDisable =
                      isParentWithoutChildren &&
                      campaign?.status === "list_building";

                    if (!shouldDisable) {
                      setGiftSummaryOpen(!giftSummaryOpen);
                    }
                  }}
                  className={`text-lg font-semibold px-6 py-5 relative duration-300 cursor-pointer flex items-center justify-between gap-2 ${
                    !campaign?.parentCampaignId &&
                    (!campaign?.childCampaigns ||
                      campaign.childCampaigns.length === 0) &&
                    campaign?.status === "list_building"
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-primary-xlight"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {campaign?.status === "ready_for_launch"
                      ? "Review Gifts & Recipients"
                      : campaign?.status === "waiting_for_approval" ||
                        campaign?.status === "matching gifts"
                      ? "Gift Summary"
                      : "Campaign Tracking"}
                    {/* Show status for parent without children */}
                    {!campaign?.parentCampaignId &&
                      (!campaign?.childCampaigns ||
                        campaign.childCampaigns.length === 0) &&
                      campaign?.status === "list_building" && (
                        <div className="flex items-center gap-2 ">
                          <div className="inline-flex items-center px-4 py-1 rounded-full text-base font-medium bg-[#FEF6EE] text-[#B93815]">
                            <div className="flex items-center gap-3">
                              <div className="size-2.5 ring-4 ring-[#B9381550] rounded-full bg-[#B93815] animate-pulse" />
                              <span>List building in Progress...</span>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${
                      giftSummaryOpen ? "-rotate-90" : "rotate-90"
                    } duration-300`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="m9.55 12l7.35 7.35q.375.375.363.875t-.388.875t-.875.375t-.875-.375l-7.7-7.675q-.3-.3-.45-.675t-.15-.75t.15-.75t.45-.675l7.7-7.7q.375-.375.888-.363t.887.388t.375.875t-.375.875z"
                    />
                  </svg>
                </div>
                {/* Campaign tracking content */}
                {giftSummaryOpen && (
                  <div className="px-6 py-5">
                    {/* Table header and content */}
                    <div className="overflow-x-auto overflow-y-scroll rounded-sm border border-[#D2CEFE] mx-6 h-[600px]">
                      <table className="w-full bg-white">
                        <thead className="border-b sticky top-0 bg-white z-10 border-[#D2CEFE] text-[#101828] text-xs">
                          <tr className="uppercase">
                            {campaign?.status === "ready_for_launch" && (
                              <th className="p-[11px] pt-[19px] text-left pl-4 w-[40px]">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-primary border-gray-300 rounded cursor-pointer"
                                  checked={
                                    selectedRecipients.size ===
                                    getAllRecipients().length
                                  }
                                  onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                  }
                                />
                              </th>
                            )}

                            <th className="flex gap-4 p-[11px] pt-[19px] text-left pl-4 w-[160px]">
                              Attendee name
                            </th>
                            <th
                              className={`p-[11px] text-left pl-4 ${
                                campaign?.status === "ready_for_launch" ||
                                campaign?.status === "matching_gifts" ||
                                campaign?.status === "live"
                                  ? "w-[100px]"
                                  : "w-[160px]"
                              }`}
                            >
                              Company
                            </th>
                            <th
                              className={`p-[11px] text-left pl-4 ${
                                campaign?.status === "ready_for_launch" ||
                                campaign?.status === "matching_gifts" ||
                                campaign?.status === "live"
                                  ? "w-[80px]"
                                  : "w-[140px]"
                              }`}
                            >
                              Role
                            </th>
                            <th className="p-[11px] text-left pl-4 w-[340px]">
                              Matched Gift
                            </th>
                            {(campaign?.status === "ready_for_launch" ||
                              campaign?.status === "matching_gifts") && (
                              <th
                                className={`p-[11px] text-left pl-4 ${
                                  campaign?.status === "ready_for_launch" ||
                                  campaign?.status === "matching_gifts"
                                    ? "w-[300px]"
                                    : "w-[180px]"
                                }`}
                              >
                                Why this Gift
                              </th>
                            )}
                            {campaign?.status === "live" && (
                              <th className="p-[11px] text-left pl-4 w-[150px]">
                                Status
                              </th>
                            )}
                            {campaign?.status !== "matching_gifts" &&
                              campaign?.status !== "live" &&
                              campaign?.status !== "completed" && (
                                <th className="p-[11px] text-left pl-4 w-[160px]">
                                  Delivery Address
                                </th>
                              )}
                            {![
                              "waiting_for_approval",
                              "ready_for_launch",
                              "matching_gifts",
                            ].includes(campaign?.status) && (
                              <>
                                <th className="p-[11px] text-left pl-4 w-[120px]">
                                  Expected Delivery Date
                                </th>
                                <th className="p-[11px] text-left pl-4 w-[120px]">
                                  Delivery Date
                                </th>
                                <th className="p-[11px] text-left pl-4 w-[120px]">
                                  Acknowledged Date
                                </th>
                                {campaign?.status === "live" && (
                                  <th className="p-[11px] text-left pl-4 w-[150px]">
                                    Actions
                                  </th>
                                )}
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {getAllRecipients().map((recipient, index) => (
                            <tr
                              key={recipient._id}
                              className={`border-b border-[#D2CEFE] text-sm ${
                                index % 2 === 0 ? "bg-[#FCFCFD]" : ""
                              }`}
                            >
                              {campaign?.status === "ready_for_launch" && (
                                <td className="p-4 w-[40px]">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary border-gray-300 rounded cursor-pointer"
                                    checked={selectedRecipients.has(
                                      recipient._id
                                    )}
                                    onChange={(e) =>
                                      handleSelectRecipient(
                                        recipient._id,
                                        e.target.checked
                                      )
                                    }
                                  />
                                </td>
                              )}
                              {/* Attendee name */}
                              <td className="p-4 w-[190px]">
                                <div className="flex gap-3 items-start">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {recipient.lastName} {recipient.firstName}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Company name */}
                              <td className="text-left pl-4 font-medium pt-4">
                                {recipient.companyName || "---"}
                              </td>

                              {/* Role/Job Title */}
                              <td className="text-left pl-4 font-medium pt-4">
                                {recipient.jobTitle || "---"}
                              </td>

                              {/* Gift cell */}
                              <td className="p-4">
                                {recipient.assignedGift ? (
                                  <div className="grid grid-flow-col gap-3 justify-start">
                                    <div className="relative flex justify-start items-center  size-[76px]  overflow-hidden">
                                      <Image
                                        src={
                                          recipient.assignedGift
                                            ?.primaryImgUrl || "/loading.png"
                                        }
                                        alt={
                                          recipient.assignedGift?.name ||
                                          "Gift image"
                                        }
                                        width={76}
                                        height={76}
                                        className="object-cover rounded-md size-[76px]"
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLImageElement;
                                          if (target.src !== DEFAULT_IMAGE) {
                                            target.src = DEFAULT_IMAGE;
                                            target.onerror = null;
                                          }
                                        }}
                                        priority={true}
                                        loading="eager"
                                      />
                                    </div>
                                    <div className="grid gap-2 max-w-[360px]">
                                      <div className="font-medium text-xs">
                                        <div className="flex items-center justify-between">
                                          <div className="line-clamp-1">
                                            {recipient.assignedGift.name}
                                          </div>
                                        </div>
                                        <div className="text-xs opacity-70 font-normal relative group">
                                          <div className="line-clamp-2">
                                            {recipient.assignedGift.descShort}
                                          </div>
                                        </div>
                                        <div className="font-semibold mt-1">
                                          ${recipient.assignedGift.price}
                                        </div>
                                        {campaign?.status ===
                                          "ready_for_launch" && (
                                          <div className="flex items-center gap-1.5">
                                            <div
                                              className="text-primary cursor-pointer"
                                              onClick={() => {
                                                if (preloadedGifts.length > 0) {
                                                  loadGiftsForModal(
                                                    recipient._id
                                                  );
                                                } else {
                                                  fetchPreloadedGifts();
                                                }
                                              }}
                                            >
                                              More like this
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">
                                    {campaign?.status === "matching_gifts" ? (
                                      <div className="bg-[#FFF8E6] text-[#E67F05] font-medium text-[12px] flex items-center gap-1 w-fit px-2 py-1 rounded-full">
                                        Matching Gifts{" "}
                                        <span className="inline-flex gap-[2px] ml-1">
                                          {Array.from({ length: 3 }, (_, i) => (
                                            <span
                                              key={i}
                                              className="w-1 h-1 rounded-full bg-[#E67F05] animate-[dot-loading_1.4s_ease-in-out_infinite]"
                                              style={{
                                                animationDelay: `${i * 0.2}s`,
                                              }}
                                            />
                                          ))}
                                        </span>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <div
                                            className="text-primary cursor-pointer font-semibold"
                                            onClick={() => {
                                              if (preloadedGifts.length > 0) {
                                                loadGiftsForModal(
                                                  recipient._id
                                                );
                                              } else {
                                                fetchPreloadedGifts();
                                              }
                                            }}
                                          >
                                            Let's pick a gift together!
                                          </div>
                                        </div>
                                        <div className="text-xs">
                                          Manual selection recommended
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Why this Gift */}
                              {(campaign?.status === "ready_for_launch" ||
                                campaign?.status === "matching_gifts") && (
                                <td className="relative group">
                                  <div className="flex items-start gap-2 h-full">
                                    {recipient.whyGift && (
                                      <Image
                                        src="/svgs/Shimmers.svg"
                                        alt="Gift Rationales"
                                        width={24}
                                        height={24}
                                        className="mt-1"
                                      />
                                    )}
                                    <span className="text-sm text-gray-600 line-clamp-5 min-h-[40px]">
                                      {recipient.whyGift || "---"}
                                    </span>
                                  </div>

                                  {recipient.whyGift && (
                                    <div className="absolute hidden group-hover:block bg-white border border-[#D2CEFE] p-3 rounded-lg shadow-lg z-20 left-4 min-w-[300px] max-w-[400px] whitespace-normal">
                                      <div className="text-sm text-gray-600">
                                        {recipient.whyGift}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )}
                              {campaign?.status === "live" && (
                                <td className="p-4 w-[150px]">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full w-fit text-xs font-medium ${
                                      recipient.status === "Pending"
                                        ? "bg-[#F2F4F7] text-[#344054]"
                                        : recipient.status === "Processing"
                                        ? // Check if address is empty or not verified
                                          !recipient.address ||
                                          Object.values(recipient.address).some(
                                            (val) => val === ""
                                          ) ||
                                          recipient.address.isVerified === false
                                          ? "bg-[#F4F3FF] text-[#6941C6] px-4" // Style for Awaiting Address Confirmation
                                          : "bg-[#FEF6EE] text-[#B93815]" // Original Processing style
                                        : recipient.status === "GiftSelected"
                                        ? "bg-[#FFF8E6] text-[#E67F05]"
                                        : recipient.status ===
                                          "AwaitingAddressConfirmation"
                                        ? "bg-[#F4F3FF] text-[#6941C6] px-4"
                                        : recipient.status === "OrderPlaced"
                                        ? "bg-[#EFF8FF] text-[#175CD3]"
                                        : recipient.status === "InTransit"
                                        ? "bg-[#FFF8E6] text-[#E67F05]"
                                        : recipient.status === "Delivered"
                                        ? "bg-[#E0F5F5] text-[#0E7490]"
                                        : recipient.status === "Acknowledged"
                                        ? "bg-[#ECFDF3] text-[#027A48]"
                                        : recipient.status === "Failed"
                                        ? "bg-red-50 text-[#B93815]"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {recipient.status === "Processing" &&
                                    (!recipient.address ||
                                      Object.values(recipient.address).some(
                                        (val) => val === ""
                                      ) ||
                                      recipient.address.isVerified === false)
                                      ? "Awaiting Address Confirmation"
                                      : recipient.status ===
                                        "AwaitingAddressConfirmation"
                                      ? "Awaiting Address Confirmation"
                                      : recipient.status === "OrderPlaced"
                                      ? "Order Placed"
                                      : recipient.status === "InTransit"
                                      ? "In Transit"
                                      : recipient.status === "Delivered"
                                      ? "Delivered"
                                      : recipient.status === "Acknowledged"
                                      ? "Acknowledged"
                                      : recipient.status || "---"}
                                  </span>
                                </td>
                              )}
                              {campaign?.status !== "matching_gifts" &&
                                campaign?.status !== "live" &&
                                campaign?.status !== "completed" && (
                                  <td className="p-4">
                                    {recipient.address?.country &&
                                    recipient.address?.city &&
                                    recipient.address?.state &&
                                    recipient.address?.zip ? (
                                      <Image
                                        src="/AddressMask.png"
                                        alt="delivery-at"
                                        width={146}
                                        height={86}
                                        className="object-contain"
                                      />
                                    ) : (
                                      "---"
                                    )}
                                  </td>
                                )}

                              {/* Conditional columns */}
                              {![
                                "waiting_for_approval",
                                "ready_for_launch",
                                "matching_gifts",
                              ].includes(campaign?.status) && (
                                <>
                                  <td className="p-4 font-medium w-[120px]">
                                    {recipient.expectedDeliveryDate
                                      ? new Date(recipient.expectedDeliveryDate)
                                          .toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                          .replace(",", "")
                                      : "---"}
                                  </td>
                                  <td className="p-4 font-medium w-[120px]">
                                    {recipient.deliveryDate
                                      ? new Date(recipient.deliveryDate)
                                          .toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                          .replace(",", "")
                                      : "---"}
                                  </td>
                                  <td className="p-4 w-[120px]">
                                    {recipient.acknowledgedAt
                                      ? (() => {
                                          try {
                                            console.log(
                                              "Acknowledged date value:",
                                              recipient.acknowledgedAt
                                            );
                                            const date = new Date(
                                              recipient.acknowledgedAt
                                            );
                                            console.log("Parsed date:", date);
                                            return date.toLocaleDateString(
                                              "en-US",
                                              {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              }
                                            );
                                          } catch (error) {
                                            console.error(
                                              "Error formatting date:",
                                              error
                                            );
                                            return "Date error";
                                          }
                                        })()
                                      : "---"}
                                  </td>
                                  {campaign?.status === "live" && (
                                    <td className="p-4 w-[150px] relative">
                                      <div
                                        className="grid gap-0.5 cursor-pointer hover:bg-slate-100 py-1.5 px-3 rounded-full w-fit"
                                        onClick={() =>
                                          handleMenuToggle(recipient._id)
                                        }
                                      >
                                        <div className="size-1 rounded-full bg-[#101828]"></div>
                                        <div className="size-1 rounded-full bg-[#101828]"></div>
                                        <div className="size-1 rounded-full bg-[#101828]"></div>
                                      </div>

                                      {openMenuId === recipient._id && (
                                        <div
                                          ref={menuRef}
                                          className="absolute z-[9999] right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 grid gap-1 min-w-[150px]"
                                        >
                                          <button
                                            className="flex gap-2 items-center text-gray-700 px-3 py-2 rounded-lg hover:bg-slate-50 w-full text-left"
                                            onClick={() =>
                                              handleTrackStatus(recipient._id)
                                            }
                                          >
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                                stroke="#667085"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M12 16L16 12L12 8"
                                                stroke="#667085"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M8 12H16"
                                                stroke="#667085"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                            Track Status
                                          </button>
                                        </div>
                                      )}

                                      {/* Track Status Modal - Only show when showTrackStatusModal matches */}
                                      {showTrackStatusModal ===
                                        recipient._id && (
                                        <div
                                          ref={trackStatusModalRef}
                                          className="absolute z-[9999] right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 w-72"
                                        >
                                          <div className="p-4">
                                            <h3 className="font-medium text-gray-900 mb-2">
                                              Gift Tracking
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-4">
                                              Track the status of your gift for{" "}
                                              {recipient.firstName}{" "}
                                              {recipient.lastName}
                                            </p>

                                            <div className="mb-4">
                                              <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">
                                                  Status:
                                                </span>
                                                <span
                                                  className={`font-medium ${
                                                    recipient.status ===
                                                    "Delivered"
                                                      ? "text-emerald-600"
                                                      : recipient.status ===
                                                        "InTransit"
                                                      ? "text-amber-600"
                                                      : recipient.status ===
                                                        "Acknowledged"
                                                      ? "text-emerald-600"
                                                      : "text-gray-800"
                                                  }`}
                                                >
                                                  {recipient.status ===
                                                  "InTransit"
                                                    ? "In Transit"
                                                    : recipient.status}
                                                </span>
                                              </div>
                                              {recipient.expectedDeliveryDate && (
                                                <div className="flex justify-between text-sm">
                                                  <span className="text-gray-600">
                                                    Expected delivery:
                                                  </span>
                                                  <span className="font-medium">
                                                    {new Date(
                                                      recipient.expectedDeliveryDate
                                                    ).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex justify-end">
                                              <Link
                                                href={`/public/gift-tracker/${recipient._id}/`}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                              >
                                                <svg
                                                  width="16"
                                                  height="16"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  xmlns="http://www.w3.org/2000/svg"
                                                >
                                                  <path
                                                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                  <path
                                                    d="M12 16L16 12L12 8"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                  <path
                                                    d="M8 12H16"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                </svg>
                                                View Detailed Tracking
                                              </Link>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Add fixed footer for delete button */}
                    {campaign?.status === "ready_for_launch" &&
                      selectedRecipients.size > 0 && (
                        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-[#D2CEFE] p-4 mt-4 flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {selectedRecipients.size} recipient
                            {selectedRecipients.size !== 1 ? "s" : ""} selected
                          </div>
                          <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1.5 3H10.5M4.5 1H7.5M5 5V8M7 5V8M2.5 3L3 10C3 10.2652 3.10536 10.5196 3.29289 10.7071C3.48043 10.8946 3.73478 11 4 11H8C8.26522 11 8.51957 10.8946 8.70711 10.7071C8.89464 10.5196 9 10.2652 9 10L9.5 3"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Delete Selected
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>):(
                <div className="p-6  bg-white rounded-tl-3xl h-[100%]  overflow-y-scroll overflow-x-hidden">
                    <div className="grid gap-5 place-items-center  mt-[25%]">
                        <h1 className="text-2xl font-medium">Campaign does not exist</h1>
                    </div>
                </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Gift Recommendations Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowGiftModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[90%] sm:w-full">
              <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
              <div className="bg-white">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 border-opacity-25">
                  <h3 className="text-lg font-medium">Recommended Gifts</h3>
                  <button
                    onClick={() => setShowGiftModal(false)}
                    className="text-gray-400 hover:text-gray-500 relative z-20"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className=" pb-4 max-h-[85vh] overflow-y-auto">
                  {campaign && (
                    <GiftRecommendations
                      setHiddenBlocks={() => {}}
                      hiddenBlocks={{
                        campaignDetails: false,
                        profileDiscovered: false,
                        setupBudget: false,
                        giftRecommendations: false,
                        eventDateAndTime: false,
                        launch: false,
                      }}
                      sendForApprovalButton={true}
                      campaignId={campaign._id}
                      goalOfCampaign={campaign.goal || ""}
                      enrichSelectedRecipients={
                        new Set(campaign.recipients.map((r) => r._id))
                      }
                      onSuccessfulSubmit={async () => {
                        setShowGiftModal(false);
                        // Refresh both parent and child campaign data
                        try {
                          const pathParts = window.location.pathname.split("/");
                          const parentCampaignId =
                            pathParts[pathParts.length - 1];

                          const res = await fetch(
                            `/api/campaigns/${parentCampaignId}`
                          );
                          if (!res.ok)
                            throw new Error(
                              `HTTP error! status: ${res.status}`
                            );

                          const data = await res.json();
                          if (data.success) {
                            setCampaign(data.data);
                          }
                        } catch (error) {
                          console.error(
                            "Error refreshing campaign data:",
                            error
                          );
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* //! modal */}
      <div
        className={`${
          modal ? "translate-x-0" : "translate-x-full"
        } fixed z-50 right-0 top-0 bottom-0 duration-300 flex items-stretch`}
      >
        <div
          onClick={() => setModal(false)}
          className="fixed inset-0 bg-primary-xlight bg-opacity-80"
        ></div>
        <div className="relative w-[604px] bg-white h-full shadow-xl flex flex-col">
          <div className="p-6 flex-1 overflow-hidden flex flex-col">
            {/* //? similar gifts header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-medium">Similar Gifts</div>
              <svg
                onClick={() => setModal(false)}
                className="cursor-pointer stroke-black hover:stroke-red-400"
                width="24"
                height="24"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0554 3.94444L3.94434 10.0556M3.94434 3.94444L10.0554 10.0556"
                  strokeWidth="1.01852"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* //?  table */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mt-4 text-xs font-medium border border-[#D2CEFE] rounded-lg overflow-auto">
                <div className="sticky top-0 bg-white text-[11px] text-[#101828] font-semibold flex items-center justify-between border-b px-8 border-[#D2CEFE]">
                  <div className="p-[11px]">GIFT ITEMS</div>
                  <div className="p-[11px]">COST</div>
                </div>
                <div className="overflow-y-auto">
                  {modalGifts.length > 0 ? (
                    modalGifts.map((gift) => (
                      <div
                        key={gift._id}
                        className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                      >
                        <div className="flex gap-3 items-center">
                          <input
                            type="radio"
                            name="modalGift"
                            checked={selectedModalGifts === gift._id}
                            onChange={() => {
                              setSelectedModalGifts(gift._id);
                            }}
                            className="h-4 w-4 text-primary focus:ring-primary cursor-pointer rounded-full border-gray-300"
                          />
                          <div className="flex gap-2 items-start">
                            <Image
                              src={
                                gift.images?.primaryImgUrl || "/img/image.png"
                              }
                              alt={gift.name}
                              width={76}
                              height={76}
                              className="object-cover rounded-md"
                              onError={(e: any) => {
                                e.target.src = "/img/image.png";
                              }}
                            />
                            <div className="grid gap-2">
                              <div className="w-[163px] font-medium">
                                {gift.name}
                              </div>
                              <div className="text-xs opacity-70">
                                {gift.descShort}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 text-xs text-center font-medium">
                          ${gift.price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Loading similar gifts...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* //? save button */}
          <div
            className={`flex justify-end gap-3 mt-4 place-self-end border-t border-[#EAECF0] pt-4 w-full p-6 `}
          >
            <button
              onClick={async () => {
                if (selectedModalGifts && selectedRecipientIndex) {
                  try {
                    if (!userEmail) {
                      toast.error("Please login to continue");
                      router.push("/");
                      return;
                    }
                    // Update the gift assignment
                    const response = await fetch(
                      "/api/save-recipient-with-giftid",
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          recipientId: selectedRecipientIndex,
                          giftId: selectedModalGifts,
                          campaignId: campaign._id,
                          whyGift: "Handpicked by " + userEmail,
                          sendMode: "direct",
                        }),
                      }
                    );

                    if (!response.ok) {
                      throw new Error("Failed to update gift");
                    }
                    setModal(false);
                    // Fetch updated campaign data
                    await fetchCampaignDetails();
                    // Update the total gift costs to reflect the new selection
                    await fetchTotalGiftCosts();
                    // // Refresh the recipients data
                    // const recipientsRes = await fetch(`/api/recipients?campaignId=${campaign._id}`);
                    // const recipientsData = await recipientsRes.json();

                    // // Update the recipients state with new data
                    // const updatedRecipients = await Promise.all(
                    //   recipientsData.recipients.map(async (recipient) => {
                    //     if (recipient.assignedGiftId) {
                    //       const giftRes = await fetch(`/api/gifts/${recipient.assignedGiftId}`);
                    //       const giftData = await giftRes.json();
                    //       return {
                    //         ...recipient,
                    //         assignedGift: {
                    //           ...giftData.data,
                    //           id: recipient.assignedGiftId,
                    //           _id: recipient.assignedGiftId,
                    //         }
                    //       };
                    //     }
                    //     return recipient;
                    //   })
                    // );

                    // Close modal and reset selection
                    setSelectedModalGifts("");
                    setSelectedRecipientIndex(null);

                    // Show success notification
                    toast.success("Gift updated successfully");
                  } catch (error) {
                    console.error("Error updating gift:", error);
                    toast.error("Failed to update gift");
                  }
                }
              }}
              disabled={!selectedModalGifts}
              className={`text-white text-xs font-medium px-4 py-2.5 rounded-lg ${
                selectedModalGifts
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete {selectedRecipients.size} selected
              recipient{selectedRecipients.size !== 1 ? "s" : ""}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Funds Modal */}
      {insufficientFundsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out"
            style={{
              animation: "slideIn 0.3s ease-out forwards",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Insufficient Funds
              </h3>
              <button
                onClick={() => setInsufficientFundsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <p className="text-gray-700 mb-4">
                {walletBalance <= 0
                  ? "Your wallet balance is zero. Please add funds to your wallet to approve this campaign."
                  : `Your wallet balance ($${walletBalance}) is less than the estimated cost ($${
                      totalPrice + totalShippingCost + totalHandlingCost
                    }). Please add funds to your wallet.`}
              </p>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold">${walletBalance}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-semibold">
                    ${totalPrice + totalShippingCost + totalHandlingCost}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Shortfall:</span>
                  <span className="font-semibold text-red-500">
                    $
                    {Math.max(
                      0,
                      totalPrice +
                        totalShippingCost +
                        totalHandlingCost -
                        walletBalance
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setInsufficientFundsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setInsufficientFundsModalOpen(false);
                  router.push("/dashboard/wallet");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
              >
                Top Up Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
