"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import { verifyTemplateToken } from "@/utils/templateToken";
import confetti from "canvas-confetti";
import { useRef } from "react";
import {
  logTouchpoint,
  TouchpointType
} from "./receipentTracking";

// Google Maps types declaration
declare global {
  interface Window {
    google: any;
  }
}

// CSS animations for the PLG section
const floatAnimation = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

const pingSlow = `
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-ping-slow {
    animation: ping-slow 2s ease-in-out infinite;
  }
`;

const fadeInUp = `
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 1s ease-out;
  }
`;

const modalFadeIn = `
  @keyframes modal-slide-up {
    0% {
      opacity: 0;
      transform: translateY(50px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-modal-slide-up {
    opacity: 0;
    animation: modal-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    animation-delay: 0.1s;
    animation-fill-mode: both;
  }

  @keyframes gift-selection-fade-out {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  .animate-gift-selection-fade-out {
    animation: gift-selection-fade-out 0.25s ease-in forwards;
  }

  @keyframes backdrop-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .animate-backdrop-fade-in {
    animation: backdrop-fade-in 0.3s ease-out;
  }
`;

const googlePlacesStyles = `
  .pac-container {
    background-color: white;
    border: 1px solid #D0D5DD;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-top: 4px;
    z-index: 9999;
  }
  .pac-item {
    padding: 8px 12px;
    border-bottom: 1px solid #F3F4F6;
    cursor: pointer;
    font-size: 14px;
  }
  .pac-item:hover {
    background-color: #F9FAFB;
  }
  .pac-item-selected {
    background-color: #EEF2FF;
  }
  .pac-matched {
    font-weight: 600;
    color: #7F56D9;
  }
`;

interface Gift {
  _id: string;
  name: string;
  descShort: string;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl?: string;
  };
  price: number;
  descFull: string;
  status?: string;
  isActive?: boolean;
}

interface Organization {
  _id: string;
  name: string;
  domain?: string;
  branding: {
    logo_url: string;
    primary_color?: string;
  };
  status: string;
}

// Google Maps Script Loader
const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById("googleMaps");

  if (!existingScript) {
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.id = "googleMaps";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  } else {
    callback();
  }
};

// Footer Message Component
const FooterMessage = () => {
  return (
    <div className="w-full mt-auto">
      {/* Separator line */}
      <div className="w-full px-4 sm:px-8 mt-6">
        <div className="border-t border-gray-200 opacity-50"></div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 mt-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between text-center sm:text-left">
          <p className="text-sm text-gray-600">
            🎁 Loved this experience? Discover how leading teams create moments
            like this — at scale, with AI.
          </p>
          <a
            href="https://www.delightloop.com/bookademo"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-2 py-1.3 hover:bg-violet-50 transition-colors duration-200"
          >
            Book a 20-min strategy call →
          </a>
        </div>
      </div>
    </div>
  );
};

// Address Form Modal Component
interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGift: Gift | undefined;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  setAddress: React.Dispatch<
    React.SetStateAction<{
      line1: string;
      line2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }>
  >;
  onSubmit: () => Promise<void>;
  loading: boolean;
  error: boolean;
  isReadOnly: boolean;
  recipientStatus?: string;
  shouldShowSaveAddress: boolean;
}

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);
  const [error, setError] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [currentGiftIndex, setCurrentGiftIndex] = useState(0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<string>("");
  const [recipientHadInitialAddress, setRecipientHadInitialAddress] =
    useState(false);
  const [recipientFirstName, setRecipientFirstName] = useState<string>("");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  // Simple validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Tracking URL copy state
  const [isUrlCopied, setIsUrlCopied] = useState(false);

  // Modal state for media content
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    type: "video" | "media" | "link";
    url: string;
    title: string;
  } | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isGiftSelectionFadingOut, setIsGiftSelectionFadingOut] = useState(false);

  // Helper function to check if address is complete
  const isAddressComplete = (addressData: any) => {
    return (
      addressData &&
      addressData.line1 &&
      addressData.city &&
      addressData.state &&
      addressData.zip &&
      addressData.country
    );
  };

  // Helper function to check if gift is assigned
  const isGiftAssigned = (recipientData: any) => {
    return recipientData && recipientData.assignedGiftId;
  };

  // Helper function to check if editing is allowed
  const canEdit = () => {
    // For single gifts, allow editing if not read-only (no need for explicit edit mode)
    if (gifts.length === 1) {
      return !isReadOnly;
    }
    // For multiple gifts, require explicit edit mode
    return !isReadOnly && isEditMode;
  };

  // Simple validation - just check if required fields are not empty
  const validateAddress = () => {
    const errors: string[] = [];

    if (!address.line1.trim()) {
      errors.push("Address Line 1 is required");
    }
    if (!address.city.trim()) {
      errors.push("City is required");
    }
    if (!address.state.trim()) {
      errors.push("State is required");
    }
    if (!address.zip.trim()) {
      errors.push("ZIP Code is required");
    }
    if (!address.country.trim()) {
      errors.push("Country is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    loadGoogleMapsScript(() => {
      console.log("Google Maps script loaded");
    });
  }, []);

  // Initialize autocomplete when address form becomes visible
  useEffect(() => {
    if (
      selectedGiftId &&
      !isEditMode &&
      window.google &&
      addressInputRef.current
    ) {
      console.log("Initializing autocomplete for address input");
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["address"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.address_components) {
          console.log("Place selected:", place);
          const streetNumber =
            place.address_components.find((comp) =>
              comp.types.includes("street_number")
            )?.long_name || "";

          const route =
            place.address_components.find((comp) =>
              comp.types.includes("route")
            )?.long_name || "";

          setAddress({
            line1: `${streetNumber} ${route}`.trim(),
            line2: "",
            city:
              place.address_components.find((comp) =>
                comp.types.includes("locality")
              )?.long_name || "",
            state:
              place.address_components.find((comp) =>
                comp.types.includes("administrative_area_level_1")
              )?.short_name || "",
            zip:
              place.address_components.find((comp) =>
                comp.types.includes("postal_code")
              )?.long_name || "",
            country:
              place.address_components.find((comp) =>
                comp.types.includes("country")
              )?.long_name || "",
          });
        }
      });
    }
  }, [selectedGiftId, isEditMode]);

  const [campaignData, setCampaignData] = useState<any>(null);
  const [availableGiftCount, setAvailableGiftCount] = useState(0);
  const [creatorName, setCreatorName] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  // Fetch data and verify token
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsVerifying(true);
        console.log("Starting data fetch and token verification");

        const token = searchParams.get("token");
        if (!token) {
          console.error("No token found in URL");
          toast.error("No authentication token found");
          //router.push('/error');
          return;
        }

        // Decode and verify token
        const decodedURIToken = decodeURIComponent(token);
        const decodedToken = verifyTemplateToken(decodedURIToken);

        console.log("Decoded token", decodedToken);

        if (
          !decodedToken ||
          !decodedToken.recipient_id ||
          !decodedToken.campaign_id
        ) {
          console.error("Invalid token or missing required IDs");
          toast.error("Invalid authentication token");
          //router.push('/error');
          return;
        }

        setRecipientId(decodedToken.recipient_id);
        setCampaignId(decodedToken.campaign_id);

        console.log("Token verified successfully", {
          campaignId: decodedToken.campaign_id,
        });

        // Fetch recipient data
        console.log("Fetching recipient data...");
        let storedRecipientData: any = null;

        const recipientResponse = await fetch(
          `/api/recipients/${decodedToken.recipient_id}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
          }
        );

        if (recipientResponse.ok) {
          const recipientData = await recipientResponse.json();
          console.log("Recipient data fetched successfully:", recipientData);

          // Set recipient status
          if (recipientData?.data?.status) {
            setRecipientStatus(recipientData.data.status);
            console.log("Recipient status:", recipientData.data.status);
          }

          // Set recipient first name
          if (recipientData?.data?.firstName) {
            setRecipientFirstName(recipientData.data.firstName);
            console.log("Recipient first name:", recipientData.data.firstName);
          }

          // Store recipient data for later processing after gifts are loaded
          storedRecipientData = recipientData;
        } else {
          console.error(
            "Failed to fetch recipient data:",
            await recipientResponse.text()
          );
          // Continue anyway since this is not critical for the flow
        }

        // Fetch campaign data
        const campaignResponse = await fetch(
          `/api/campaigns/${decodedToken.campaign_id}?public=true`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
          }
        );

        if (!campaignResponse.ok) {
          console.error(
            "Campaign fetch failed:",
            await campaignResponse.text()
          );
          throw new Error("Failed to fetch campaign data");
        }

        const campaignData = await campaignResponse.json();
        setCampaignData(campaignData.data);

        console.log("Campaign Data fetched successfully:", campaignData);

        // Fetch user data using creatorUserId from campaign
        if (campaignData?.data?.creatorUserId) {
          try {
            const userResponse = await fetch(
              `/api/users/${campaignData.data.creatorUserId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                },
              }
            );

            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log("User data fetched successfully:", userData);
              setCreatorName(userData?.data?.firstName);
            } else {
              console.error(
                "Failed to fetch user data:",
                await userResponse.text()
              );
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }

        // Fetch event data using eventId from campaign
        if (campaignData?.data?.eventId) {
          try {
            const eventResponse = await fetch(
              `/api/events/${campaignData.data.eventId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                },
              }
            );

            if (eventResponse.ok) {
              const eventData = await eventResponse.json();
              const eventName =
                eventData?.data?.event?.name || eventData?.data?.name;
              console.log("Event data fetched successfully:", eventName);
              setEventName(eventName || "");
            } else {
              console.error(
                "Failed to fetch event data:",
                await eventResponse.text()
              );
            }
          } catch (error) {
            console.error("Error fetching event data:", error);
          }
        }

        // Fetch organization data using organization_id from campaign
        if (campaignData?.data?.organization_id) {
          try {
            const orgResponse = await fetch(
              `/api/organization/${campaignData.data.organization_id}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                },
              }
            );

            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              console.log("Organization data fetched successfully:", orgData);
              setOrganization(orgData.data);
            } else {
              console.error(
                "Failed to fetch organization data:",
                await orgResponse.text()
              );
            }
          } catch (error) {
            console.error("Error fetching organization data:", error);
          }
        }

        // Extract gifts from campaign data - updated path
        let giftsList: Gift[] = [];

        // First try to get from giftCatalogs.selectedGift
        if (campaignData?.data?.giftCatalogs?.[0]?.selectedGift?.length > 0) {
          const giftIds = campaignData.data.giftCatalogs[0].selectedGift;
          console.log("Found gift IDs in selectedGift:", giftIds);

          // Fetch details for each gift
          for (const giftId of giftIds) {
            try {
              const giftResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${giftId}`,
                {
                  method: "GET",
                  headers: {
                    accept: "application/json",
                  },
                }
              );

              if (giftResponse.ok) {
                const giftData = await giftResponse.json();
                // Gift data is directly in the response
                if (giftData) {
                  giftsList.push(giftData);
                }
              } else {
                console.error(
                  `Failed to fetch gift ${giftId}:`,
                  await giftResponse.text()
                );
              }
            } catch (error) {
              console.error(`Error fetching gift ${giftId}:`, error);
            }
          }
        }
        // Fallback to availableGifts if no gifts found in giftCatalogs
        else if (campaignData?.data?.availableGifts?.length > 0) {
          giftsList = campaignData.data.availableGifts;
        }

        // If no gifts found in campaign, check if recipient has an assigned gift (hyper-personalize mode)
        if (!giftsList.length && storedRecipientData?.data?.assignedGiftId) {
          console.log(
            "No gifts in campaign, checking recipient's assigned gift for hyper-personalize mode"
          );
          try {
            const giftResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${storedRecipientData.data.assignedGiftId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                },
              }
            );

            if (giftResponse.ok) {
              const giftData = await giftResponse.json();
              if (giftData) {
                giftsList.push(giftData);
                console.log("Found gift from recipient data:", giftData);
              }
            } else {
              console.error(
                `Failed to fetch recipient's assigned gift:`,
                await giftResponse.text()
              );
            }
          } catch (error) {
            console.error("Error fetching recipient's assigned gift:", error);
          }
        }

        console.log("Final extracted gifts:", giftsList);

        if (!giftsList.length) {
          console.error("No gifts found in campaign data or recipient data");
          toast.error("No gifts available");
          return;
        }

        setGifts(giftsList);
        setAvailableGiftCount(giftsList.length);

        // Update recipient status based on number of gifts available - only if current status is "inviteSent"
        if (
          storedRecipientData?.data?.status === "InvitationSend" &&
          storedRecipientData?.data?.status !== "OrderPlaced"
        ) {
          try {
            const statusToUpdate =
              giftsList.length == 1
                ? "AwaitingAddressConfirmation"
                : "AwaitingGiftSelection";

            console.log(statusToUpdate);

            const statusUpdateResponse = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipients/${decodedToken.recipient_id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: statusToUpdate,
                }),
              }
            );

            if (statusUpdateResponse.ok) {
              console.log(
                `Recipient status updated from inviteSent to ${statusToUpdate}`
              );
              setRecipientStatus(statusToUpdate);
            } else {
              console.error(
                "Failed to update recipient status:",
                await statusUpdateResponse.text()
              );
            }
          } catch (error) {
            console.error("Error updating recipient status:", error);
          }
        } else {
          console.log(
            `Status not updated - current status is ${storedRecipientData?.data?.status}, not inviteSent`
          );
        }

        // Process recipient data after gifts are set
        if (storedRecipientData) {
          const recipientData = storedRecipientData;

          // Pre-populate address if it exists and set the initial address flag
          if (recipientData?.data?.address) {
            const existingAddress = recipientData.data.address;
            const hasExistingAddress =
              existingAddress.line1 ||
              existingAddress.city ||
              existingAddress.state ||
              existingAddress.zip ||
              existingAddress.country;

            console.log("Pre-populating address:", existingAddress);
            console.log("Recipient had initial address:", hasExistingAddress);

            setAddress({
              line1: existingAddress.line1 || "",
              line2: existingAddress.line2 || "",
              city: existingAddress.city || "",
              state: existingAddress.state || "",
              zip: existingAddress.zip || "",
              country: existingAddress.country || "",
            });

            // Set flag based on whether recipient initially had an address
            setRecipientHadInitialAddress(hasExistingAddress);
            console.log("Pre-populated address from recipient data");
          } else {
            // No address in recipient data
            setRecipientHadInitialAddress(false);
            console.log("No initial address found for recipient");
          }

          // Pre-select gift if already assigned
          if (recipientData?.data?.assignedGiftId) {
            setSelectedGiftId(recipientData.data.assignedGiftId);
            console.log(
              "Pre-selected assigned gift:",
              recipientData.data.assignedGiftId
            );
          } else {
                      // If there's only one gift and no assigned gift, auto-select it
          if (giftsList.length === 1) {
            setSelectedGiftId(giftsList[0]._id);
            console.log("Auto-selected single gift:", giftsList[0]._id);
            // For single gift, don't start in edit mode - go directly to address form
            setIsEditMode(false);
            setShowAddressForm(true);
          }
          }

          // Determine read-only state based on recipient data and status
          const hasCompleteAddress = isAddressComplete(
            recipientData?.data?.address
          );
          const hasAssignedGift = isGiftAssigned(recipientData?.data);
          const currentStatus = recipientData?.data?.status;

          console.log("Address complete:", hasCompleteAddress);
          console.log("Gift assigned:", hasAssignedGift);
          console.log("Recipient status:", currentStatus);

          // Show submitted state if:
          // 1. User has complete address and assigned gift
          // 2. OR if status is DonatedToCharity
          if (
            (hasCompleteAddress &&
              hasAssignedGift &&
              (currentStatus === "OrderPlaced" || currentStatus === "InTransit" || currentStatus === "Delivered")) ||
            currentStatus === "DonatedToCharity"
          ) {
            console.log(
              "User has complete setup or donated to charity, showing submitted state"
            );
            setIsSubmitted(true);
          }

          // Set read-only based on status - allow editing for new recipients and those who can still make changes
        } else {
                  // If no recipient data, handle single gift auto-selection
        if (giftsList.length === 1) {
          setSelectedGiftId(giftsList[0]._id);
          console.log("Auto-selected single gift:", giftsList[0]._id);
          // For single gift, don't start in edit mode - go directly to address form
          setIsEditMode(false);
          setShowAddressForm(true);
        }
        }

        // Additional check for single gift scenario with complete address
        // This handles cases where recipient data might not have assignedGiftId but has address
        setTimeout(() => {
          if (giftsList.length === 1 && storedRecipientData?.data?.address) {
            const hasCompleteAddress = isAddressComplete(
              storedRecipientData.data.address
            );
            // Only set submitted if status is explicitly "OrderPlaced" - otherwise show address form for review
            if (hasCompleteAddress && storedRecipientData.data.status === "OrderPlaced") {
              console.log(
                "Single gift with complete address and OrderPlaced status, showing submitted state"
              );
              setIsSubmitted(true);
            } else {
              // Show address form for single gift
              setShowAddressForm(true);
            }
          }
        }, 100); // Small delay to ensure state is set

        // Track landing visit after successful data loading
        if (decodedToken.recipient_id && decodedToken.campaign_id) {
          // Track page load completion
          logTouchpoint({
            recipientId: decodedToken.recipient_id,
            campaignId: decodedToken.campaign_id,
            touchpointType: TouchpointType.CLAIM_PAGE_LOADED,
            touchpointData: [{
              data: { 
                loadTimestamp: new Date().toISOString(),
                availableGiftCount: giftsList.length,
                url: window.location.href
              }
            }]
          }).catch(error => {
            console.log('Failed to track page load completion:', error);
          });

          // Track campaign info fetched
          logTouchpoint({
            recipientId: decodedToken.recipient_id,
            campaignId: decodedToken.campaign_id,
            touchpointType: TouchpointType.CAMPAIGN_INFO_FETCHED,
            touchpointData: [{
              data: { 
                campaignName: campaignData?.data?.name || 'Unknown Campaign',
                organizationName: organization?.name || 'Unknown Organization',
                eventName: eventName || '',
                fetchTimestamp: new Date().toISOString()
              }
            }]
          }).catch(error => {
            console.log('Failed to track campaign info fetch:', error);
          });

          // Track recipient info fetched
          if (storedRecipientData) {
            logTouchpoint({
              recipientId: decodedToken.recipient_id,
              campaignId: decodedToken.campaign_id,
              touchpointType: TouchpointType.RECIPIENT_INFO_FETCHED,
              touchpointData: [{
                data: { 
                  recipientFirstName: recipientFirstName || '',
                  recipientStatus: recipientStatus || '',
                  hasExistingAddress: recipientHadInitialAddress,
                  fetchTimestamp: new Date().toISOString()
                }
              }]
            }).catch(error => {
              console.log('Failed to track recipient info fetch:', error);
            });
          }

          // Track gift info fetched
          logTouchpoint({
            recipientId: decodedToken.recipient_id,
            campaignId: decodedToken.campaign_id,
            touchpointType: TouchpointType.GIFT_INFO_FETCHED,
            touchpointData: [{
              data: { 
                availableGiftCount: giftsList.length,
                giftIds: giftsList.map(gift => gift._id),
                giftNames: giftsList.map(gift => gift.name),
                fetchTimestamp: new Date().toISOString()
              }
            }]
          }).catch(error => {
            console.log('Failed to track gift info fetch:', error);
          });

          // Track page visit
          logTouchpoint({
            recipientId: decodedToken.recipient_id,
            campaignId: decodedToken.campaign_id,
            touchpointType: TouchpointType.CLAIM_PAGE_VISITED,
            touchpointData: [{
              data: { 
                url: window.location.href,
                isVisible: false // Landing visits are analytics data, not visible in UI
              }
            }]
          }).catch(error => {
            console.log('Failed to track landing visit:', error);
          });
        }
      } catch (error) {
        console.error("Error processing token or fetching data:", error);
        toast.error("Failed to load gift options");
        //router.push('/error');
      } finally {
        setIsVerifying(false);
      }
    };

    fetchData();
  }, [searchParams, router]);

  // Separate useEffect to handle address population after all data is loaded
  useEffect(() => {
    // This ensures address population happens after component is fully mounted
    // and all async operations are complete
    if (!isVerifying && recipientId) {
      console.log("Checking if address needs to be populated...");
      console.log("Current address state:", address);

      // Only check if address is empty (meaning it hasn't been populated yet)
      const isAddressEmpty =
        !address.line1 &&
        !address.city &&
        !address.state &&
        !address.zip &&
        !address.country;

      if (isAddressEmpty) {
        console.log(
          "Address is empty, attempting to re-fetch recipient data for address population"
        );

        // Re-fetch recipient data if address is empty
        fetch(`/api/recipients/${recipientId}`)
          .then((response) => response.json())
          .then((recipientData) => {
            if (recipientData?.data?.address) {
              const existingAddress = recipientData.data.address;
              console.log(
                "Re-populating address from recipient data:",
                existingAddress
              );
              setAddress({
                line1: existingAddress.line1 || "",
                line2: existingAddress.line2 || "",
                city: existingAddress.city || "",
                state: existingAddress.state || "",
                zip: existingAddress.zip || "",
                country: existingAddress.country || "",
              });
            }
          })
          .catch((error) => {
            console.error("Error re-fetching recipient data:", error);
          });
      }
    }
  }, [
    isVerifying,
    recipientId,
    address.line1,
    address.city,
    address.state,
    address.zip,
    address.country,
  ]);

  // Track campaign message view when component is loaded and data is available
  useEffect(() => {
    if (!isVerifying && recipientId && campaignId && campaignData) {
      const messageData = getCampaignMessage();
      if (messageData.title || messageData.message) {
        logTouchpoint({
          recipientId,
          campaignId,
          touchpointType: TouchpointType.MESSAGE_VIEWED_ON_CLAIM,
          touchpointData: [{
            data: {
              messageId: `campaign_message_${campaignData?.motion || 'default'}`,
              messageType: campaignData?.motion || 'default',
              messageTitle: messageData.title,
              messageContent: messageData.message,
              viewTimestamp: new Date().toISOString(),
              pageUrl: window.location.href
            }
          }]
        }).catch(error => {
          console.log('Failed to track message view:', error);
        });
      }
    }
  }, [isVerifying, recipientId, campaignId, campaignData]);

  const handleGiftSelect = (giftId: string) => {
    setSelectedGiftId(giftId);

    // Track gift selection
    const selectedGift = gifts.find(gift => gift._id === giftId);
    if (selectedGift && recipientId && campaignId) {
      logTouchpoint({
        recipientId,
        campaignId,
        touchpointType: TouchpointType.GIFT_SELECTED_ON_CLAIM,
        touchpointData: [{
          data: {
            giftId,
            giftName: selectedGift.name,
            eventDescription: "User selected gift from available options",
            isVisible: true // Gift selection should be visible - important user action
          }
        }]
      }).catch(error => {
        console.log('Failed to track gift selection:', error);
      });
    }

    // Exit edit mode after gift selection
    setIsEditMode(false);

    // For multiple gifts, show address form with animation
    if (gifts.length > 1) {
      console.log("Transitioning to address form for multiple gifts");
      console.log("Current address state:", address);
      console.log("Current isReadOnly state:", isReadOnly);

      // Start both animations simultaneously for smooth transition
      setIsGiftSelectionFadingOut(true);
      setShowAddressForm(true);
    } else {
      // For single gift, show address form immediately
      setShowAddressForm(true);
    }
  };

  const handleDonateToCharity = async () => {
    try {
      setDonateLoading(true);

      if (!recipientId) {
        toast.error("Recipient ID is required");
        setDonateLoading(false);
        return;
      }

      //   if (!selectedGiftId) {
      //     toast.error("Please select a gift first");
      //     setDonateLoading(false);
      //     return;
      //   }

      // Track charity donation before API call
      if (recipientId && campaignId) {
        logTouchpoint({
          recipientId,
          campaignId,
          touchpointType: TouchpointType.GIFT_DONATED_TO_CHARITY,
          touchpointData: [{
            data: { 
              donationTimestamp: new Date().toISOString() 
            }
          }]
        }).catch(error => {
          console.log('Failed to track charity donation:', error);
        });
      }

      // Update recipient status to DonatedToCharity
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipients/${recipientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // assignedGiftId: selectedGiftId,
            status: "DonatedToCharity", // Update status to DonatedToCharity
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error("Failed to update recipient:", errorData);
        setDonateLoading(false);
        setError(true);
        toast.error(
          errorData.message || "Failed to process donation to charity"
        );
        return;
      }

      // Trigger confetti animation for successful donation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1000,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Left side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        // Right side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Clear form and show success state
      setAddress({
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
      setDonateLoading(false);
      setError(false);
      setShowAddressModal(false);
      setIsEditMode(false);
      setIsSubmitted(true);
      setRecipientStatus("DonatedToCharity");
      toast.success("Thank you for donating your gift to charity!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process your request");
      setDonateLoading(false);
      setError(true);
    }
  };

  const handleAddressSubmit = async () => {
    try {
      setLoading(true);

      // Simple validation - check if required fields are not empty
      if (!validateAddress()) {
        // Track address validation error
        if (recipientId && campaignId) {
          logTouchpoint({
            recipientId,
            campaignId,
            touchpointType: TouchpointType.ADDRESS_FORM_VALIDATION_ERROR,
            touchpointData: [{
              data: {
                validationErrors: validationErrors,
                addressData: {
                  line1: address.line1,
                  city: address.city,
                  state: address.state,
                  zip: address.zip,
                  country: address.country
                },
                errorTimestamp: new Date().toISOString()
              }
            }]
          }).catch(error => {
            console.log('Failed to track address validation error:', error);
          });
        }
        setLoading(false);
        return;
      }

      if (!recipientId) {
        toast.error("Recipient ID is required");
        setLoading(false);
        return;
      }

      if (!selectedGiftId) {
        toast.error("Please select a gift first");
        setLoading(false);
        return;
      }

      // Update recipient with both address and selected gift
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipients/${recipientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: {
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              zip: address.zip,
              country: address.country,
              isVerified: true,
            },
            assignedGiftId: selectedGiftId,
            status: "OrderPlaced", // Update status to OrderPlaced as per RecipientStatus enum
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error("Failed to update recipient:", errorData);
        setLoading(false);
        setError(true);
        toast.error(
          errorData.message || "Failed to update address and gift selection"
        );
        return;
      }

      // Track address confirmation after successful submission
      logTouchpoint({
        recipientId,
        campaignId,
        touchpointType: TouchpointType.ADDRESS_FORM_SUBMITTED,
        touchpointData: [{
          data: {
            addressLine1: address.line1,
            city: address.city,
            state: address.state,
            zipCode: address.zip,
            country: address.country,
            isComplete: true,
            submissionTimestamp: new Date().toISOString(),
            isVisible: true // Address confirmation should be visible - important milestone
          }
        }]
      }).catch(error => {
        console.log('Failed to track address confirmation:', error);
      });

      // Trigger confetti animation for successful address submission
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1000,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Left side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        // Right side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Clear form and show success state
      setAddress({
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
      setLoading(false);
      setError(false);
      setShowAddressModal(false);
      setIsEditMode(false); // Exit edit mode after successful submission
      setIsSubmitted(true);
      toast.success(
        "Your gift selection and shipping address have been confirmed!"
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process your request");
      setLoading(false);
      setError(true);
    }
  };

  const selectedGift = gifts.find((gift) => gift._id === selectedGiftId);

  // Function to replace template variables in text
  const replaceTemplateVariables = (text: string) => {
    if (!text) return text;

    return text.replace(/\{\{first-name\}\}/gi, recipientFirstName || "there");
  };

  // Function to get campaign message based on status
  const getCampaignMessage = () => {
    const recipientName = recipientFirstName || "there";
    const companyName = organization?.name || "our organization";
    const senderName = creatorName || "someone";
    // Check for both null/undefined and empty string
    const event = eventName && eventName.trim() ? eventName : "our event";

    let title = "";
    let message = "";

    if (availableGiftCount === 1) {
      // Special messages for single gift scenarios
      switch (campaignData?.motion) {
        case "boost-registration":
          title = `${recipientName}, ${companyName} would love to see you at ${event}`;
          message = `We've already picked a surprise gift just for you. 🎁 Claim it now and reserve your spot — no pressure, just a little joy.`;
          break;

        case "ensure-attendance":
          title = `Hey ${recipientName}, your seat at ${event} is almost yours`;
          message = `Confirm now and unwrap a surprise gift from ${companyName} — curated just for you. ✨`;
          break;

        case "set-up-meeting":
          title = `Let's connect, ${recipientName}. Just you and ${companyName}`;
          message = `Say yes to a quick 1:1 at ${event}, and we'll send a surprise your way — thoughtful, just like the invite. 🤝🎁`;
          break;

        case "express-send":
          title = `🎁 A Small Gesture From ${companyName}`;
          message = `Just something thoughtful we'd love to send your way - your address stays private and is deleted after shipping. 📫`;
          break;

        case "vip-box-pickup":
        case "booth-giveaways":
          title = `We loved meeting you at ${event}!`;
          message = `${companyName} has already lined up a surprise gift for you — just tell us where to send it. 🚚💜`;
          break;

        case "thank-you":
          title = `Thank you, ${recipientName}`;
          message = `${companyName} truly appreciated your time at ${event} — and we've sent a little surprise your way to show it. 🎁`;
          break;

        default:
          title = `Thank you for being a valued customer${
            companyName ? ` of ${companyName}` : ""
          }`;
          message = "We have a special surprise waiting for you!";
      }
    } else {
      // Original messages for multiple gifts
      switch (campaignData?.motion) {
        case "boost-registration":
          title = `${recipientName}, we'd love to see you at ${event}`;
          message = `${companyName} picked out a gift just for you — no strings, just good vibes. Claim yours and reserve your spot today. ✨`;
          break;

        case "ensure-attendance":
          title = `${recipientName}, you're on our list for ${event}`;
          message = `Let's make it official. Confirm your spot and choose a small thank-you gift from ${companyName}. 🎁`;
          break;

        case "set-up-meeting":
          title = `${recipientName}, we'd love a moment with you`;
          message = `${companyName} is inviting you for a quick 1:1 at ${event} — and yes, there's a thoughtful gift waiting for you. 💬🎁`;
          break;

        case "express-send":
          title = `🎁 A Small Gesture From ${companyName}`;
          message = `Pick your gift and let us know where to send it. your address stays private and is deleted after shipping. 📫`;
          break;

        case "vip-box-pickup":
        case "booth-giveaways":
          title = "Thanks for stopping by!";
          message = `Let's make this moment last. ${companyName} has a gift for you from ${event} — pick one and we'll deliver it right to your door. 🚚`;
          break;

        case "thank-you":
          title = `Thank you, ${recipientName}`;
          message = `Your time at ${event} meant a lot to ${companyName}. Here's a little something to show our appreciation. 🎁`;
          break;

        default:
          title = `Thank you for being a valued customer${
            companyName ? ` of ${companyName}` : ""
          }`;
          message = "and attending our annual summit!";
      }
    }

    return { title, message };
  };

  // Media Modal Component
  const MediaModal = () => {
    if (!showMediaModal || !modalContent) return null;

    const handleClose = () => {
      setShowMediaModal(false);
      setModalContent(null);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };

    const isYouTube =
      modalContent.url.includes("youtube.com") ||
      modalContent.url.includes("youtu.be");
    const isVimeo = modalContent.url.includes("vimeo.com");
    const isDirectVideo = modalContent.url.match(/\.(mp4|webm|ogg)$/i);

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {modalContent.title}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          <div className="p-6">
            {modalContent.type === "video" && (
              <div className="aspect-video w-full">
                {isYouTube && (
                  <iframe
                    src={modalContent.url
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                )}
                {isVimeo && (
                  <iframe
                    src={modalContent.url.replace(
                      "vimeo.com/",
                      "player.vimeo.com/video/"
                    )}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                )}
                {isDirectVideo && (
                  <video
                    controls
                    className="w-full h-full rounded-lg"
                    src={modalContent.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {!isYouTube && !isVimeo && !isDirectVideo && (
                  <iframe
                    src={modalContent.url}
                    className="w-full h-full rounded-lg"
                  />
                )}
              </div>
            )}

            {modalContent.type === "media" && (
              <div className="flex justify-center">
                <Image
                  src={
                    modalContent.url == "/partner-integrations/gift.png"
                      ? "/partner-integrations/upload-video.png"
                      : modalContent.url
                  }
                  alt={modalContent.url}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  width={1000}
                  height={1000}
                />
              </div>
            )}

            {modalContent.type === "link" && (
              <div className="aspect-video w-full">
                <iframe
                  src={modalContent.url}
                  className="w-full h-full rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-3 sm:py-6 px-4 sm:px-8 flex flex-col">
        <style jsx global>{`
          ${floatAnimation}${pingSlow}${fadeInUp}${googlePlacesStyles}
        `}</style>

        <div className="flex flex-col items-center justify-center mt-2 min-h-[50vh]">
          <div className="w-full max-w-6xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                      stroke="#7F56D9"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1B1D21] mb-2">
                {recipientFirstName
                  ? `All Set, ${recipientFirstName}!`
                  : "All Set!"}
              </h1>
              <p className="text-[#475467] text-base sm:text-lg">
                {recipientStatus === "DonatedToCharity"
                  ? `Your gift from ${
                      organization?.name || "our organization"
                    } has been donated to charity.`
                  : `Your gift from ${
                      organization?.name || "our organization"
                    } is on its way.`}
              </p>
            </div>

            {/* Gift Details Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 mb-6 overflow-hidden">
              {(selectedGift || recipientStatus === "DonatedToCharity") && (
                <div className="space-y-6">
                  {/* Mobile: Compact Card, Desktop: Separate Cards */}
                  {recipientStatus !== "DonatedToCharity" ? (
                    <>
                      {/* Mobile Compact Card */}
                      <div className="sm:hidden bg-gray-50 rounded-lg p-4 overflow-hidden">
                        <div className="space-y-4">
                          {/* Gift Section */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex-shrink-0">
                              {availableGiftCount > 1 ? (
                                <Image
                                  src={
                                    selectedGift?.images?.primaryImgUrl ||
                                    selectedGift?.images?.secondaryImgUrl ||
                                    "/placeholder-gift.png"
                                  }
                                  alt={selectedGift?.name || "Gift"}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              ) : (
                                <Image
                                  src={"/svgs/gift-icon.svg"}
                                  alt={selectedGift?.name || "Gift"}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-[#1B1D21] mb-1">
                                {availableGiftCount > 1
                                  ? selectedGift?.name
                                  : "Your Surprise Gift"}
                              </h3>
                              <p className="text-xs text-gray-500">Gift confirmed</p>
                            </div>
                          </div>

                          {/* Shipping Address Section */}
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                className="text-primary opacity-80"
                                height="14"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M12 19.35q3.05-2.8 4.525-5.087T18 10.2q0-2.725-1.737-4.462T12 4T7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35m0 1.975q-.35 0-.7-.125t-.625-.375Q9.05 19.325 7.8 17.9t-2.087-2.762t-1.275-2.575T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 1.125-.437 2.363t-1.275 2.575T16.2 17.9t-2.875 2.925q-.275.25-.625.375t-.7.125M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12"
                                />
                              </svg>
                              <h4 className="text-xs font-medium text-gray-500 uppercase">Shipping to</h4>
                            </div>
                            <div className="text-sm text-[#1B1D21] font-medium">
                              <div className="truncate">{address.line1 ? (
                                <>
                                  <span>{address.line1.substring(0, 4)}</span>
                                  <span>{'*'.repeat(Math.max(0, address.line1.length - 4))}</span>
                                </>
                              ) : (
                                <span>**** **** ****</span>
                              )}</div>
                              <div className="truncate">{address.city && address.state ? `${address.city}, ${address.state}` : 'City, State'}</div>
                              <div className="truncate">{address.country || 'Country'}</div>
                            </div>
                          </div>

                          {/* Tracking Section */}
                          <div className="border-t border-gray-200 pt-3">
                            <a
                              href={`https://sandbox-app.delightloop.ai/public/gift-tracker/${recipientId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between w-full text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-lg p-2 border border-primary"
                              onClick={() => {
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.TRACKING_LINK_CLICKED,
                                    touchpointData: [{
                                      data: {
                                        buttonText: "Track Your Gift",
                                        buttonUrl: `https://sandbox-app.delightloop.ai/public/gift-tracker/${recipientId}`,
                                        buttonType: "tracking_link",
                                        isVisible: true // Tracking link clicks are analytics data
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track gift tracking button click:', error);
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  className="opacity-80"
                                  height="14"
                                  viewBox="0 0 32 32"
                                >
                                  <path
                                    fill="currentColor"
                                    d="m29.92 16.61l-3-7A1 1 0 0 0 26 9h-3V7a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h2.14a4 4 0 0 0 7.72 0h6.28a4 4 0 0 0 7.72 0H29a1 1 0 0 0 1-1v-7a1 1 0 0 0-.08-.39M23 11h2.34l2.14 5H23ZM9 26a2 2 0 1 1 2-2a2 2 0 0 1-2 2m10.14-3h-6.28a4 4 0 0 0-7.72 0H4V8h17v12.56A4 4 0 0 0 19.14 23M23 26a2 2 0 1 1 2-2a2 2 0 0 1-2 2m5-3h-1.14A4 4 0 0 0 23 20v-2h5Z"
                                  />
                                </svg>
                                <span className="text-xs font-medium">Track Your Gift</span>
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7Z"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Separate Cards */}
                      <div className="hidden sm:grid grid-cols-3 gap-4">
                        {/* Gift Card */}
                        <div className="bg-gray-50 rounded-lg p-4 h-32 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <Image
                              src="/svgs/gift-icon.svg"
                              alt="gift"
                              width={16}
                              className="opacity-80"
                              height={16}
                            />
                            <h2 className="text-xs font-medium text-gray-500 uppercase">
                              Your Gift
                            </h2>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex-shrink-0">
                              {availableGiftCount > 1 ? (
                                <Image
                                  src={
                                    selectedGift?.images?.primaryImgUrl ||
                                    selectedGift?.images?.secondaryImgUrl ||
                                    "/placeholder-gift.png"
                                  }
                                  alt={selectedGift?.name || "Gift"}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              ) : (
                                <Image
                                  src={"/svgs/gift-icon.svg"}
                                  alt={selectedGift?.name || "Gift"}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-[#1B1D21] line-clamp-2">
                                {availableGiftCount > 1
                                  ? selectedGift?.name
                                  : "Your Surprise Gift"}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address Card */}
                        <div className="bg-gray-50 rounded-lg p-4 h-32 flex flex-col justify-between overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              className="text-primary opacity-80"
                              height="16"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 19.35q3.05-2.8 4.525-5.087T18 10.2q0-2.725-1.737-4.462T12 4T7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35m0 1.975q-.35 0-.7-.125t-.625-.375Q9.05 19.325 7.8 17.9t-2.087-2.762t-1.275-2.575T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 1.125-.437 2.363t-1.275 2.575T16.2 17.9t-2.875 2.925q-.275.25-.625.375t-.7.125M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12"
                              />
                            </svg>
                            <h3 className="text-xs font-medium text-gray-500 uppercase">
                              Shipping to
                            </h3>
                          </div>
                          <div className="text-sm text-[#475467] space-y-1">
                            <div className="flex items-center">
                              <span className="text-[#1B1D21] font-medium truncate">
                                {address.line1 ? (
                                  <>
                                    <span className="text-[#1B1D21]">{address.line1.substring(0, 4)}</span>
                                    <span className="text-[#1B1D21]">{'*'.repeat(Math.max(0, address.line1.length - 4))}</span>
                                  </>
                                ) : (
                                  <span className="text-[#1B1D21]">**** **** ****</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-[#1B1D21] font-medium truncate">
                                {address.city && address.state ? `${address.city}, ${address.state}` : (
                                  <span className="text-gray-400">City, State</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-[#1B1D21] font-medium truncate">
                                {address.country || (
                                  <span className="text-gray-400">Country</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tracking Card */}
                        <div className="bg-gray-50 rounded-lg p-4 h-32 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              className="text-primary opacity-80"
                              height="16"
                              viewBox="0 0 32 32"
                            >
                              <path
                                fill="currentColor"
                                d="m29.92 16.61l-3-7A1 1 0 0 0 26 9h-3V7a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h2.14a4 4 0 0 0 7.72 0h6.28a4 4 0 0 0 7.72 0H29a1 1 0 0 0 1-1v-7a1 1 0 0 0-.08-.39M23 11h2.34l2.14 5H23ZM9 26a2 2 0 1 1 2-2a2 2 0 0 1-2 2m10.14-3h-6.28a4 4 0 0 0-7.72 0H4V8h17v12.56A4 4 0 0 0 19.14 23M23 26a2 2 0 1 1 2-2a2 2 0 0 1-2 2m5-3h-1.14A4 4 0 0 0 23 20v-2h5Z"
                              />
                            </svg>
                            <h3 className="text-xs font-medium text-gray-500 uppercase">
                              Track Shipment
                            </h3>
                          </div>
                          <div className="flex flex-col items-center justify-center flex-1">
                            <a
                              href={`https://sandbox-app.delightloop.ai/public/gift-tracker/${recipientId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-2 rounded-lg flex items-center gap-1 text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-200"
                              onClick={() => {
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.TRACKING_LINK_CLICKED,
                                    touchpointData: [{
                                      data: {
                                        buttonText: "Track Your Gift",
                                        buttonUrl: `https://sandbox-app.delightloop.ai/public/gift-tracker/${recipientId}`,
                                        buttonType: "tracking_link",
                                        isVisible: false // Tracking link clicks are analytics data
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track gift tracking button click:', error);
                                  });
                                }
                              }}
                            >
                              Track Your Gift
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7Z"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Charity Donation Card - spans full width when active */
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
                      <h3 className="font-semibold text-green-800 uppercase mb-4 text-sm flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          className="text-green-600 w-6 h-6"
                          height="24"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35Z"
                          />
                        </svg>
                        <span className="bg-green-100 px-3 py-1 rounded-full">Donated to Charity</span>
                      </h3>
                      <div className="text-base text-green-700 font-medium leading-relaxed break-words">
                        Thank you for your generous decision to donate your
                        gift to charity. Your kindness will make a meaningful
                        difference in someone's life.
                      </div>
                    </div>
                  )}
                  {/* New Landing Page Config Content */}
                  {campaignData?.landingPageConfig?.content && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/80 backdrop-blur-sm relative">
                      {/* Message Title - positioned to break the border */}
                      <div className="absolute -top-3 left-4 bg-white px-3 py-1 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-primary w-4 h-4"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zm-8-7H7m10 4H7"
                          />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          A Message from {organization?.name}
                        </span>
                      </div>

                      {/* Content Layout - Text on left, Media on right */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        {/* Content Section */}
                        <div className="space-y-4 min-w-0">
                          {/* Description only - removed headline */}
                          {campaignData.landingPageConfig.content.description && (
                            <p className="text-sm text-[#475467] leading-relaxed break-words">
                              {replaceTemplateVariables(campaignData.landingPageConfig.content.description)}
                            </p>
                          )}
                        </div>

                        {/* Media and CTA Section */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                          {/* Media Section */}
                          {campaignData.landingPageConfig.media && (
                            <div className="w-full flex justify-center">
                              {campaignData.landingPageConfig.media.type === "image" && campaignData.landingPageConfig.media.imageUrl && (
                                <Image
                                  src={campaignData.landingPageConfig.media.imageUrl}
                                  alt="Campaign media"
                                  width={400}
                                  height={300}
                                  className="rounded-lg object-cover max-w-full h-auto max-h-64"
                                />
                              )}
                              {campaignData.landingPageConfig.media.type === "video" && campaignData.landingPageConfig.media.videoUrl && (
                                <div className="w-full max-w-md">
                                  <div className="aspect-video w-full max-h-64 rounded-lg overflow-hidden">
                                    {(() => {
                                      const videoUrl = campaignData.landingPageConfig.media.videoUrl;
                                      const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
                                      const isVimeo = videoUrl.includes("vimeo.com");
                                      const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i);

                                      if (isYouTube) {
                                        return (
                                          <iframe
                                            src={videoUrl
                                              .replace("watch?v=", "embed/")
                                              .replace("youtu.be/", "youtube.com/embed/")}
                                            className="w-full h-full rounded-lg"
                                            allowFullScreen
                                            title="Campaign Video"
                                          />
                                        );
                                      } else if (isVimeo) {
                                        return (
                                          <iframe
                                            src={videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
                                            className="w-full h-full rounded-lg"
                                            allowFullScreen
                                            title="Campaign Video"
                                          />
                                        );
                                      } else if (isDirectVideo) {
                                        return (
                                          <video
                                            controls
                                            className="w-full h-full rounded-lg object-cover"
                                            title="Campaign Video"
                                          >
                                            <source src={videoUrl} />
                                            Your browser does not support the video tag.
                                          </video>
                                        );
                                      } else {
                                        return (
                                          <iframe
                                            src={videoUrl}
                                            className="w-full h-full rounded-lg"
                                            title="Campaign Video"
                                          />
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          {campaignData.landingPageConfig.actionButtons && (
                            <div className={`w-full flex gap-3 ${
                              campaignData.landingPageConfig.actionButtons.primary?.enabled && campaignData.landingPageConfig.actionButtons.secondary?.enabled
                                ? 'flex-col lg:flex-row' // Both buttons - stack on mobile, side by side on desktop
                                : 'justify-center' // Single button - centered
                            }`}>
                              {/* Primary Button */}
                              {campaignData.landingPageConfig.actionButtons.primary?.enabled && (
                                <a
                                  href={campaignData.landingPageConfig.actionButtons.primary.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200 min-w-0 ${
                                    !campaignData.landingPageConfig.actionButtons.secondary?.enabled ? 'w-auto' : 'flex-1'
                                  }`}
                                  title={campaignData.landingPageConfig.actionButtons.primary.text}
                                  onClick={() => {
                                    if (recipientId && campaignId) {
                                      logTouchpoint({
                                        recipientId,
                                        campaignId,
                                        touchpointType: TouchpointType.LANDING_PAGE_CTA_CLICKED,
                                        touchpointData: [{
                                          data: {
                                            buttonText: campaignData.landingPageConfig.actionButtons.primary.text,
                                            buttonUrl: campaignData.landingPageConfig.actionButtons.primary.url,
                                            buttonType: "primary_cta",
                                            pageUrl: window.location.href
                                          }
                                        }]
                                      }).catch(error => {
                                        console.log('Failed to track primary CTA button click:', error);
                                      });
                                    }
                                  }}
                                >
                                  <span className="truncate block">
                                    {campaignData.landingPageConfig.actionButtons.primary.text}
                                  </span>
                                </a>
                              )}

                              {/* Secondary Button */}
                              {campaignData.landingPageConfig.actionButtons.secondary?.enabled && (
                                <a
                                  href={campaignData.landingPageConfig.actionButtons.secondary.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200 flex-1 min-w-0"
                                  title={campaignData.landingPageConfig.actionButtons.secondary.text}
                                  onClick={() => {
                                    if (recipientId && campaignId) {
                                      logTouchpoint({
                                        recipientId,
                                        campaignId,
                                        touchpointType: TouchpointType.LANDING_PAGE_CTA_CLICKED,
                                        touchpointData: [{
                                          data: {
                                            buttonText: campaignData.landingPageConfig.actionButtons.secondary.text,
                                            buttonUrl: campaignData.landingPageConfig.actionButtons.secondary.url,
                                            buttonType: "secondary_cta",
                                            pageUrl: window.location.href
                                          }
                                        }]
                                      }).catch(error => {
                                        console.log('Failed to track secondary CTA button click:', error);
                                      });
                                    }
                                  }}
                                >
                                  <span className="truncate block">
                                    {campaignData.landingPageConfig.actionButtons.secondary.text}
                                  </span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}



                  {/* Fallback to old schema if landingPageConfig doesn't exist */}
                  {!campaignData?.landingPageConfig && campaignData?.outcomeTemplate?.description && (
                    <div className={`border border-gray-300 rounded-lg p-3  flex flex-col gap-2 sm:flex-row justify-between items-center overflow-hidden`}>
                      <div className="text-sm text-[#475467] space-y-1 sm:w-[60%] min-w-0">
                        <div className="flex  justify-start">
                          <div className=" flex justify-start gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-primary"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zm-8-7H7m10 4H7"
                              />
                            </svg>
                            <p className="text-xs text-[#475467] font-semibold uppercase">
                              Message from {organization?.name}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[#475467] break-words">
                          {replaceTemplateVariables(
                            campaignData?.outcomeTemplate?.description
                          )}
                        </p>
                      </div>
                      {(campaignData?.outcomeTemplate?.videoLink ||
                        campaignData?.outcomeTemplate?.mediaUrl ||
                        campaignData?.outcomeTemplate?.buttonLink1 ||
                        campaignData?.outcomeTemplate?.buttonLink2) && (
                        <div className="flex justify-center h-fit">
                          <button
                            onClick={() => {
                              if (campaignData?.outcomeTemplate?.videoLink) {
                                setModalContent({
                                  type: "video",
                                  url: campaignData.outcomeTemplate.videoLink,
                                  title:
                                    campaignData.outcomeTemplate.videoTitle ||
                                    "Video",
                                });
                                setShowMediaModal(true);
                                // Track video media interaction
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.MEDIA_INTERACTED,
                                    touchpointData: [{
                                      data: {
                                        mediaType: "video",
                                        mediaUrl: campaignData.outcomeTemplate.videoLink,
                                        mediaTitle: campaignData.outcomeTemplate.videoTitle || "Video",
                                        interactionType: "modal_opened",
                                        timestamp: new Date().toISOString()
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track video media interaction:', error);
                                  });
                                }
                              } else if (
                                campaignData?.outcomeTemplate?.mediaUrl
                              ) {
                                setModalContent({
                                  type: "media",
                                  url: campaignData.outcomeTemplate.mediaUrl,
                                  title:
                                    campaignData.outcomeTemplate.mediaTitle ||
                                    "Media",
                                });
                                setShowMediaModal(true);
                                // Track media interaction
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.MEDIA_INTERACTED,
                                    touchpointData: [{
                                      data: {
                                        mediaType: "media",
                                        mediaUrl: campaignData.outcomeTemplate.mediaUrl,
                                        mediaTitle: campaignData.outcomeTemplate.mediaTitle || "Media",
                                        interactionType: "modal_opened",
                                        timestamp: new Date().toISOString()
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track media interaction:', error);
                                  });
                                }
                              } else if (
                                campaignData?.outcomeTemplate?.buttonLink1
                              ) {
                                setModalContent({
                                  type: "link",
                                  url: campaignData.outcomeTemplate.buttonLink1,
                                  title:
                                    campaignData.outcomeTemplate.buttonText1 ||
                                    "Link",
                                });
                                setShowMediaModal(true);
                                // Track link interaction
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.MEDIA_INTERACTED,
                                    touchpointData: [{
                                      data: {
                                        mediaType: "link",
                                        mediaUrl: campaignData.outcomeTemplate.buttonLink1,
                                        mediaTitle: campaignData.outcomeTemplate.buttonText1 || "Link",
                                        interactionType: "modal_opened",
                                        timestamp: new Date().toISOString()
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track link interaction:', error);
                                  });
                                }
                              } else if (
                                campaignData?.outcomeTemplate?.buttonLink2
                              ) {
                                setModalContent({
                                  type: "link",
                                  url: campaignData.outcomeTemplate.buttonLink2,
                                  title:
                                    campaignData.outcomeTemplate.buttonText2 ||
                                    "Link",
                                });
                                setShowMediaModal(true);
                                // Track second link interaction
                                if (recipientId && campaignId) {
                                  logTouchpoint({
                                    recipientId,
                                    campaignId,
                                    touchpointType: TouchpointType.MEDIA_INTERACTED,
                                    touchpointData: [{
                                      data: {
                                        mediaType: "link",
                                        mediaUrl: campaignData.outcomeTemplate.buttonLink2,
                                        mediaTitle: campaignData.outcomeTemplate.buttonText2 || "Link",
                                        interactionType: "modal_opened",
                                        timestamp: new Date().toISOString()
                                      }
                                    }]
                                  }).catch(error => {
                                    console.log('Failed to track second link interaction:', error);
                                  });
                                }
                              }
                            }}
                            className="bg-primary flex animate-network-pulse-1 gap-2 hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
                          >
                            <Image
                              src="/svgs/Shimmer.svg"
                              alt="play"
                              width={20}
                              height={20}
                            />
                            {campaignData?.outcomeTemplate?.videoLink
                              ? "Watch Video"
                              : campaignData?.outcomeTemplate?.mediaUrl
                              ? "View Media"
                              : campaignData?.outcomeTemplate?.buttonLink1
                              ? campaignData?.outcomeTemplate?.buttonText1
                              : campaignData?.outcomeTemplate?.buttonText2}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Footer Message - Full Width */}
        <FooterMessage />

        {/* Media Modal */}
        <MediaModal />
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-3 sm:py-6 px-4 sm:px-8 flex flex-col">
      <style jsx global>{`
        ${floatAnimation}${pingSlow}${fadeInUp}${modalFadeIn}${googlePlacesStyles}
      `}</style>

      {/* Loading State */}
      {isVerifying && (
        <div className="flex flex-col items-center justify-center mt-2 min-h-[50vh]">
          <div className="w-full max-w-6xl mx-auto px-4">
            {/* Header Section Skeleton */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-36 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded-lg w-64 sm:w-96 mx-auto animate-pulse"></div>
            </div>

            {/* Gift Cards Skeleton */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top opacity-5"></div>

              <div className="relative z-10">
                <div className="h-6 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-64 mb-6 animate-pulse"></div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center place-items-center">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-4 animate-pulse w-full min-w-[200px] max-w-[240px]"
                    >
                      {/* Gift image skeleton */}
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>

                      <div className="text-center">
                        {/* Gift name skeleton */}
                        <div className="h-5 bg-gray-200 rounded-lg w-3/4 mx-auto mb-2"></div>
                        {/* Description skeleton */}
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded-lg w-full"></div>
                          <div className="h-3 bg-gray-200 rounded-lg w-2/3 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isVerifying && (
        <>
          {/* Main Content - Gift Selection or Address Form */}
          <div className="flex flex-col items-center justify-center mt-2 min-h-[50vh]">
            <div className="w-full max-w-6xl mx-auto px-4 transition-all duration-500 ease-in-out text-center sm:text-left">
              {/* Header Section */}
              <div className="text-center mb-6">
                {/* Organization/DelightLoop Logo */}
                <div className="flex justify-center mb-4">
                  <Image
                    src={organization?.branding?.logo_url || "/Logo Final.png"}
                    alt={organization?.name || "DelightLoop"}
                    width={60}
                    height={60}
                    className="w-36 h-16 object-contain"
                  />
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-[#1B1D21] mb-4">
                  {/* {availableGiftCount} */}
                  {/* {campaignData?.motion} */}
                  {/* {campaignData?.motion} */}
                  {getCampaignMessage().title}
                </h1>
                <p className="text-[#475467] text-base sm:text-lg">
                  {getCampaignMessage().message}
                </p>
              </div>

              {/* Gift Selection - Show when no gift selected or in edit mode */}
              {(!selectedGiftId || isEditMode) && !isReadOnly && (
                <div className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden ${
                  isGiftSelectionFadingOut ? 'animate-gift-selection-fade-out' : ''
                }`}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top opacity-5"></div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4">
                    <div className="animate-ping-slow">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                          fill="#D6BBFB"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="text-center sm:text-left mb-6">
                      <h2 className="text-xl sm:text-2xl font-semibold text-[#1B1D21] mb-2">
                        Choose Your Gift
                      </h2>
                      <p className="text-[#475467]">
                        Select one of the options below
                      </p>
                    </div>

                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 justify-items-center place-items-center">
                      {gifts.map((gift) => (
                        <div
                          key={gift._id}
                          className={`relative bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06),0px_0px_0px_1px_rgba(25,28,33,0.1),0px_0px_20px_rgba(107,114,128,0.15)] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0px_8px_25px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.06),0px_0px_0px_1px_rgba(139,92,246,0.3),0px_0px_30px_rgba(107,114,128,0.25)] hover:-translate-y-1 hover:scale-105 w-full min-w-[200px] max-w-[240px] h-[320px] flex flex-col ${
                            selectedGiftId === gift._id
                              ? "ring-2 ring-[#7F56D9] bg-purple-50 scale-105 shadow-[0px_10px_30px_-2px_rgba(0,0,0,0.1),0px_6px_8px_-1px_rgba(0,0,0,0.06),0px_0px_0px_2px_rgba(139,92,246,0.5),0px_0px_40px_rgba(107,114,128,0.3)] -translate-y-1"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleGiftSelect(gift._id)}
                        >
                          {/* Selection indicator */}
                          {selectedGiftId === gift._id && (
                            <div className="absolute top-3 right-3 bg-[#7F56D9] text-white rounded-full p-1.5 z-10 animate-pulse">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="none"
                              >
                                <path
                                  d="M16.6666 5L7.49992 14.1667L3.33325 10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}

                          {/* Gift image container - 70% of card height */}
                          <div className="w-full h-[224px] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                gift.images.primaryImgUrl ||
                                gift.images.secondaryImgUrl ||
                                "/placeholder-gift.png"
                              }
                              alt={gift.name}
                              width={220}
                              height={176}
                              className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
                            />
                          </div>

                          <div className="p-2 text-center transition-all duration-300 hover:scale-105 flex-1 flex flex-col justify-start">
                            <h3 className="font-semibold text-[#1B1D21] mb-1 text-sm transition-colors duration-300 hover:text-[#7F56D9] line-clamp-2">
                              {gift.name}
                            </h3>
                            <p className="text-xs text-[#475467] line-clamp-2 leading-relaxed">
                              {gift.descShort}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div
                        onClick={handleDonateToCharity}
                        className="relative bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06),0px_0px_0px_1px_rgba(25,28,33,0.1),0px_0px_20px_rgba(107,114,128,0.15)] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0px_8px_25px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.06),0px_0px_0px_1px_rgba(34,197,94,0.3),0px_0px_30px_rgba(107,114,128,0.25)] hover:-translate-y-1 hover:scale-105 hover:bg-gray-50 w-full min-w-[200px] max-w-[240px] h-[320px] flex flex-col"
                      >
                        <div className="w-full h-[224px] bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {donateLoading ? (
                            <div className="animate-spin">
                              <svg className="w-12 h-12 text-[#7F56D9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          ) : (
                            <Image
                              src="/svgs/donation.svg"
                              alt="Donate to charity"
                              width={220}
                              height={176}
                              className="object-contain w-full h-full transition-transform duration-300 hover:scale-110"
                            />
                          )}
                        </div>

                                                <div className="p-2 text-center transition-all duration-300 hover:scale-105 flex-1 flex flex-col justify-start">
                          <h3 className="font-semibold text-[#1B1D21] mb-1 text-sm transition-colors duration-300 hover:text-green-600 line-clamp-2">
                          Give It Forward
                          </h3>
                                                     <p className="text-xs text-[#475467] line-clamp-2 leading-relaxed">
                          Donate your gift's value to a charity and make someone's day
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Form - Show after gift selection */}
              {selectedGiftId && !isEditMode && (showAddressForm || gifts.length === 1) && (
                <div className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden mt-8 ${
                  gifts.length > 1 ? 'animate-modal-slide-up' : ''
                }`}>
                  {/* Background pattern */}
                  {/* <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top opacity-5"></div> */}

                  {/* Selected gift display */}
                  <div className="relative z-10 mb-6">
                    {gifts.length > 1 && (
                      <div className="flex items-center justify-end font-medium gap-2 mb-4">
                        <button
                          onClick={() => {
                            setIsEditMode(true);
                            setShowAddressForm(false);
                            setIsGiftSelectionFadingOut(false);
                            // Track back to gifts navigation
                            if (recipientId && campaignId) {
                              logTouchpoint({
                                recipientId,
                                campaignId,
                                touchpointType: TouchpointType.NAVIGATION_EVENT,
                                touchpointData: [{
                                  data: {
                                    navigationLabel: "Back to Gifts",
                                    fromPage: window.location.href,
                                    toPageType: "gift-selection"
                                  }
                                }]
                              }).catch(error => {
                                console.log('Failed to track back to gifts navigation:', error);
                              });
                            }
                          }}
                          className="flex items-center gap-2 text-[#7F56D9] hover:text-[#6941C6] transition-colors text-sm"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                          Back to Gifts
                        </button>
                      </div>
                    )}

                    {selectedGift && (
                      <div className="flex items-center gap-2 md:gap-4 md:p-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="size-16 relative rounded-lg overflow-hidden">
                          {availableGiftCount > 1 ? (
                            <Image
                              src={
                                selectedGift.images.primaryImgUrl ||
                                selectedGift.images.secondaryImgUrl ||
                                "/placeholder-gift.png"
                              }
                              alt={selectedGift.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src={"/svgs/gift-icon.svg"}
                              alt={selectedGift.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="w-[70%] md:w-full min-w-0 text-start">
                          <h3 className="font-semibold text-[#1B1D21] truncate">
                            {availableGiftCount > 1
                              ? selectedGift.name
                              : "Suprise Gift"}
                          </h3>
                          <p className="text-sm text-[#475467] line-clamp-2">
                            {availableGiftCount > 1
                              ? selectedGift.descShort
                              : "We have a surprise gift for you"}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <div className="bg-[#7F56D9] text-white rounded-full p-1 md:p-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M16.6666 5L7.49992 14.1667L3.33325 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-[#1B1D21] mb-2 text-center sm:text-left">
                    {isReadOnly ? "Your Confirmed Address" : "Shipping Address"}
                  </h2>
                  <p className="text-[#475467] mb-6 text-center sm:text-left">
                    {isReadOnly
                      ? "Your shipping address details"
                      : "Please provide your shipping details"}
                  </p>

                  <div className="space-y-4 text-start">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                              Please fill in all required fields:
                            </h4>
                            <ul className="text-sm text-red-700 space-y-1">
                              {validationErrors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div> */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                        <span className="text-xs text-[#7F56D9] ml-2">
                          • Start typing for suggestions
                        </span>
                      </label>
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={address.line1}
                        onChange={(e) =>
                          setAddress((prev) => ({
                            ...prev,
                            line1: e.target.value,
                          }))
                        }
                        placeholder="123 Main St"
                        className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={address.line2}
                        onChange={(e) =>
                          setAddress((prev) => ({
                            ...prev,
                            line2: e.target.value,
                          }))
                        }
                        placeholder="Apt 4B"
                        className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) =>
                            setAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          placeholder="New York"
                          className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) =>
                            setAddress((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          placeholder="NY"
                          className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZipCode
                        </label>
                        <input
                          type="text"
                          value={address.zip}
                          onChange={(e) =>
                            setAddress((prev) => ({
                              ...prev,
                              zip: e.target.value,
                            }))
                          }
                          placeholder="10001"
                          className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={address.country}
                          onChange={(e) =>
                            setAddress((prev) => ({
                              ...prev,
                              country: e.target.value,
                            }))
                          }
                          placeholder="USA"
                          className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1  gap-4">
                      {/* <button
                        onClick={handleDonateToCharity}
                        disabled={loading || donateLoading}
                        className="bg-[#7F56D9] text-white hover:bg-[#6941C6] font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {donateLoading ? "Processing..." : "Donate to charity"}
                      </button> */}
                      <button
                        onClick={handleAddressSubmit}
                        disabled={loading || donateLoading}
                        className="w-full bg-[#7F56D9] text-white hover:bg-[#6941C6] font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          "Submitting..."
                        ) : (
                          <>
                            Confirm & Ship My Gift
                            <svg
                              className="ml-2 w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm text-center">
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Disclaimer outside main container - very subtle */}
          {(!isSubmitted && recipientStatus !== "DonatedToCharity" && showAddressForm)  && (
            <div className="mt-4 px-2">
              <div className="flex items-start gap-2 justify-center">
                <p className="text-sm text-gray-700 text-center">
                🔒 We never store or share your address. It's used only to ship this gift, then deleted.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Message - Full Width */}
      {!isVerifying && <FooterMessage />}

      {/* Media Modal */}
      <MediaModal />
    </main>
  );
}
