import Image from "next/image";
import Checkbox from "../common/Checkbox";
import { useEffect, useRef, useState } from "react";
import RoundedCheckbox from "../common/RoundedCheckbox";
import InfinityLoader from "../common/InfinityLoader";
import { HiddenBlocks } from "@/lib/types/campaign";
// import { Campaign } from "@/lib/types/campaign";
import { Recipient } from "@/lib/types/recipient";
import { Gift } from "@/lib/types/gift";
import ScoreCardAnimation from "../Gift-Recommendations/ScoreCardAnimation";
import { toast } from "react-hot-toast";
import { ApiResponseData } from "@/lib/types/bundles";
import Calendar from "../Gift-Recommendations/Calendar";
const TEST_GIFT_IDS = [
  "676b98a2d1f4415227e373f7",
  "676ba2f4d1f4415227e373ff",
  "6752e5a674f4b735613e12d9",
  "676ba2f4d1f4415227e37403",
  "6752e5a674f4b735613e12de",
  "676ba2f4d1f4415227e37442",
  "676ba2f4d1f4415227e3741f",
  "6752e5a674f4b735613e12de",
  "6752e5a674f4b735613e12db",
  "676ba2f4d1f4415227e37439",
  "676ba2f4d1f4415227e37425",
  "676ba2f4d1f4415227e37406",
];
const giftRationales = [
  "This Ocean Bottle is perfect for Strauss's active lifestyle and passion for cycling, providing a sustainable and practical hydration solution during his rides and beyond.",
  "This smart coffee mug is perfect for Rich's role as a CEO and his love for coffee, ensuring his favorite brew stays at the ideal temperature—thoughtful and practical for his busy day.",
  "This handcrafted candle, made with natural essential oils, is a perfect gift for Kathryn, combining her love for crafts and art with a touch of relaxation and creativity.",
  "This Ember Smart Mug is an elegant and innovative companion for Crystal's reading sessions, inspired by her focus on must-read books, combining exceptional design and functionality to keep her beverages at the perfect temperature while she immerses herself in her books.",
  "This Amazon gift card is a thoughtful and versatile choice for Paige, allowing her to use it for a cause she cares about or donate it as a gift, aligning with her philanthropic interests and professional role.",
  "This On-The-Go Travel Pack is a perfect gift for Ericka, catering to her frequent travels as Chief Operating Officer, combining convenience and practicality for her busy lifestyle.",
  "This Broome Sticky Notes Book is an ideal gift for John, combining high quality and practicality to support his organized and efficient note-taking as a marketing manager at Citibank.",
  "This Amazon gift card is a versatile and thoughtful choice for Denise, offering her the flexibility to select something she truly values while recognizing her role as SVP of Strategy and Marketing at Cisco.",
  "This leather wallet is a sophisticated and practical gift for Raja, reflecting his professional stature as a Corporate VP at AMD while adding a touch of elegance to his daily essentials.",
  "This fully custom Puff Puff Yoga Tote Bag is an ideal gift for Robin, combining practicality and style to complement her role as a CPO and her passion for yoga and volunteering in yoga programs.",
  "This Econscious Bamboo Notebook is a thoughtful gift for Karen, aligning perfectly with her eco-friendly lifestyle and marking her recent career transition with a sustainable and practical accessory.",
  "The BlendJet 2 is the perfect gift for Pinkesh, combining exceptional performance and sleek design to support his creative pursuits, role as a Chief Product Officer, and commitment to a healthier lifestyle.",
  "Curated to offer something meaningful for everyone, this bundle is a versatile choice.",
  "Discover the perfect balance of style, functionality, and thoughtfulness in this gift.",
  "This bundle is designed to enhance your daily routine with ease and sophistication.",
  "With this thoughtful gift, every moment becomes a little more special.",
  "Make every day brighter and more convenient with this carefully curated bundle.",
  "This versatile gift bundle is the perfect blend of utility and charm for any lifestyle.",
  "Elevate daily experiences with this well-rounded and thoughtfully designed collection.",
  "This gift is crafted to bring a blend of innovation, comfort, and style to every day.",
];

interface RecipientWithGift extends Recipient {
  assignedGift: Gift & {
    id?: string;
    _id?: string;
    price: number;
    rationale?: string;
  };
  id: string;
}

interface GiftRecommendationsProps {
  setHiddenBlocks: React.Dispatch<React.SetStateAction<HiddenBlocks>>;
  hiddenBlocks: HiddenBlocks;
  campaignId: string;
  enrichSelectedRecipients: Set<string>;
  goalOfCampaign: string;
  onSuccessfulSubmit?: () => void;
  sendForApprovalButton?: boolean;
}

interface Campaign {
  budget?: {
    total?: number;
    perGift?: {
      min: number;
      max: number;
    };
  };
  dataRange?: {
    startDate: string;
    endDate: string;
  };
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 90000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.log("Request timed out after 90 seconds");

      const fallbackObjectId = "6752e5a674f4b735613e12d7";

      const fallbackGift = {
        id: fallbackObjectId,
        _id: { $oid: fallbackObjectId },
        price: 14.99,
        name: "Photo Frame",
        descShort: "Wooden photo frame for family pictures",
        rationale:
          "This gift card offers flexibility and choice for the recipient",
        images: {
          primaryImgUrl:
            "https://m.media-amazon.com/images/I/61-3HhGRLXL._SL1300_.jpg",
        },
      };

      console.log("Creating fallback gift:", fallbackGift);

      // Note: recipient needs to be passed as a parameter to access it here
      return {
        ok: true,
        async json() {
          return {
            recommendations: [
              {
                _id: { $oid: fallbackObjectId },
                ...fallbackGift,
              },
            ],
          };
        },
      } as Response;
    }
    throw error;
  }
};

export default function GiftRecommendations({
  setHiddenBlocks,
  hiddenBlocks,
  campaignId,
  goalOfCampaign,
  enrichSelectedRecipients,
  onSuccessfulSubmit,
  sendForApprovalButton,
}: GiftRecommendationsProps) {
  //   const [closeTooltip, setCloseTooltip] = useState(false);
  const [modal, setModal] = useState(false);
  const [modal2, setModal2] = useState(false);
  const [notification, setNotification] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [recipients, setRecipients] = useState<RecipientWithGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientBudgets, setRecipientBudgets] = useState<{
    [key: string]: number;
  }>({});

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [availableGifts, setAvailableGifts] = useState<Gift[]>([]);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<
    string | null
  >(null);
  const [selectedModalGift, setSelectedModalGift] = useState<string | null>(
    null
  );
  const [likedGifts, setLikedGifts] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<
    number | string | null
  >(null);
  const [loadedRows, setLoadedRows] = useState<number[]>([]);
  const [filteredRecipients, setFilteredRecipients] =
    useState<RecipientWithGift[]>(recipients);

  const [sendModes, setSendModes] = useState<{
    [key: string]: "direct" | "permission";
  }>({});

  const [isTestMode] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  console.log("enrichSelectedRecipients", enrichSelectedRecipients);
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        console.log("Fetching campaign:", campaignId);
        const response = await fetch(`/api/campaigns/${campaignId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch campaign");
        }

        console.log("Campaign data:", data.data);
        setCampaign(data.data);
      } catch (err) {
        console.error("Error fetching campaign:", err);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  // Add this ref at component level
  const effectRan = useRef(false);

  useEffect(() => {
    // Only run in development
    if (effectRan.current === true) {
      return;
    }

    const fetchRecipients = async () => {
      try {
        setLoading(true);
        console.log("Starting fetchRecipients for campaign:", campaignId);

        const recipientsRes = await fetch(`/api/recipients?campaignId=${campaignId}`);
        const recipientsData = await recipientsRes.json();
        const fetchedRecipients = recipientsData.recipients || [];

        // Fetch gift details for each recipient that has an assignedGiftId
        const recipientsWithGifts = await Promise.all(
          fetchedRecipients.map(async (recipient) => {
            if (recipient.assignedGiftId) {
              try {
                const giftRes = await fetch(`/api/gifts/${recipient.assignedGiftId}`);
                const giftData = await giftRes.json();
                const gift = giftData.data || giftData;

                return {
                  ...recipient,
                  assignedGift: {
                    id: recipient.assignedGiftId,
                    _id: recipient.assignedGiftId,
                    price: gift.price || 0,
                    name: gift.name || "Unnamed Gift",
                    descShort: gift.descShort || "No description available",
                    images: {
                      primaryImgUrl: gift.images?.primaryImgUrl || "/placeholder-gift.png"
                    },
                    rationale: recipient.whyGift || "This gift was chosen based on the recipient's profile"
                  }
                };
              } catch (error) {
                console.error(`Error fetching gift details for recipient ${recipient._id}:`, error);
                // Return recipient with placeholder gift data if gift fetch fails
                return {
                  ...recipient,
                  assignedGift: {
                    id: recipient.assignedGiftId,
                    _id: recipient.assignedGiftId,
                    price: 0,
                    name: "Gift data unavailable",
                    descShort: "Unable to load gift details",
                    images: {
                      primaryImgUrl: "/placeholder-gift.png"
                    },
                    rationale: "Gift information is currently unavailable"
                  }
                };
              }
            }
            // Return recipient without gift data if no assignedGiftId
            return {
              ...recipient,
              assignedGift: {
                id: "",
                _id: "",
                price: 0,
                name: "No gift assigned",
                descShort: "No gift has been assigned yet",
                images: {
                  primaryImgUrl: "/placeholder-gift.png"
                },
                rationale: "No gift has been assigned yet"
              }
            };
          })
        );

        setRecipients(recipientsWithGifts);
        setFilteredRecipients(recipientsWithGifts);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching recipients:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch recipients");
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchRecipients();
    }
    // Set ref to true after first run
    effectRan.current = true;
  }, [campaignId, enrichSelectedRecipients]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedRecipients((prev: string[]) =>
      prev.length === recipients.length
        ? []
        : recipients.map((recipient) => recipient._id || "")
    );
  };

  useEffect(() => {
    if (shouldScrollToBottom) {
      const currentScroll = window.pageYOffset;
      window.scrollTo({
        top: currentScroll + 800, // Adjust this value as needed
        behavior: "smooth",
      });
      setShouldScrollToBottom(false); // Reset the state
    }
  }, [shouldScrollToBottom]);

  const calculateStrokeDasharray = (percentage: number) => {
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeLength = (percentage * circumference) / 100;
    return `${strokeLength} ${circumference}`;
  };

  let assignmentsToSave = [];
  const handleSendApproval = async () => {
    try {
      // Validate recipient selection first
      if (selectedRecipients.length === 0) {
        setValidationError("Please select at least one recipient");
        return;
      }
      setValidationError(null);
      setIsSaving(true);
      toast.loading("Saving assignments...");

      // Map assignments with the correct ID field, only for selected recipients
      assignmentsToSave = recipients
        .filter((recipient) => selectedRecipients.includes(recipient._id))
        .map((recipient) => {
          console.log("Processing recipient:", recipient);
          // Try both id and _id properties
          const giftId =
            recipient.assignedGift?.id || recipient.assignedGift?._id;
          console.log(
            "Assigned gift ID:",
            giftId,
            "Full gift object:",
            recipient.assignedGift
          );
          if (!giftId) {
            console.warn(
              "No valid gift assigned for recipient:",
              recipient._id
            );
          }
          const whyGift =
            recipient.assignedGift?.rationale ||
            giftRationales[
              recipients.indexOf(recipient) % giftRationales.length
            ];
          const sendMode = sendModes[recipient._id] || "direct";
          const assignment = {
            recipientId: recipient._id,
            giftId: giftId,
            campaignId: campaignId,
            whyGift: whyGift,
            sendMode: sendMode,
          };

          console.log("Created assignment:", assignment);
          return assignment;
        })
        .filter((assignment) => {
          const isValid = Boolean(assignment.giftId);
          if (!isValid) {
            console.log("Filtered out invalid assignment:", assignment);
          }
          return isValid;
        });

      console.log("Final assignments to save:", assignmentsToSave);

      if (assignmentsToSave.length === 0) {
        throw new Error(
          "No valid assignments to save - please ensure gifts are assigned to selected recipients"
        );
      }

      // Save recipient assignments
      const response = await fetch("/api/save-recipient-with-giftid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignments: assignmentsToSave,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Failed to save assignments"
        );
      }

      // Only update campaign status if we're in the modal flow (not create-your-campaign)
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
      const campaign = await campaignRes.json();
      //   alert(campaign?.data?.status)
      //   if (goalOfCampaign !== "create more pipeline") {
      if (campaign?.data?.status === "draft") {
        const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "waiting for approval",
          }),
        });

        const campaignData = await campaignResponse.json();

        if (!campaignResponse.ok || !campaignData.success) {
          throw new Error(
            campaignData.message ||
              campaignData.error ||
              "Failed to update campaign status"
          );
        }
      }
      if (campaign?.data?.status === "ready to launch") {
        const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "waiting for approval",
          }),
        });

        const campaignData = await campaignResponse.json();

        if (!campaignResponse.ok || !campaignData.success) {
          throw new Error(
            campaignData.message ||
              campaignData.error ||
              "Failed to update campaign status"
          );
        }
      }

      toast.dismiss();
      toast.success(
        `Successfully saved ${assignmentsToSave.length} gift assignments!`
      );

      // Close the modal and refresh the page if we're in the modal flow
      if (goalOfCampaign !== "create more pipeline") {
        // Call the success handler if provided
        if (onSuccessfulSubmit) {
          onSuccessfulSubmit();
        }
      }
    } catch (error) {
      console.error("Error saving assignments:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        sampleRecipient: recipients[0],
        sampleGift: recipients[0]?.assignedGift,
        assignmentsToSave,
        campaignId,
        goalOfCampaign,
      });
      toast.dismiss();
      setValidationError(
        error instanceof Error ? error.message : "Failed to save assignments"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Clear validation error when recipients are selected
  useEffect(() => {
    if (selectedRecipients.length > 0) {
      setValidationError(null);
    }
  }, [selectedRecipients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.trim() === "") {
      setFilteredRecipients(recipients);
      return;
    }

    const filtered = recipients.filter((recipient) =>
      `${recipient.firstName} ${recipient.lastName}`
        .toLowerCase()
        .includes(searchTerm)
    );

    setFilteredRecipients(filtered);
  };

  const handleFilterClick = (percentage: string | number) => {
    setSelectedPercentage(percentage);

    if (percentage === "All") {
      setFilteredRecipients(recipients);
      return;
    }

    // Filter based on exact percentage match
    const filtered = recipients.filter((item) => {
      const giftPricePercentage = Math.floor(item.assignedGift?.price || 0);
      return giftPricePercentage === percentage;
    });

    setFilteredRecipients(filtered);
  };

  useEffect(() => {
    if (!loading && filteredRecipients.length > 0) {
      filteredRecipients.forEach((_, index) => {
        setTimeout(() => {
          setLoadedRows((prev) => [...prev, index]);
        }, 2000 * index);
      });
    }
  }, [loading, filteredRecipients]);

  // Add default selection for all recipients when they are loaded
  useEffect(() => {
    if (recipients.length > 0) {
      const allRecipientIds = recipients.map(
        (recipient) => recipient._id || ""
      );
      setSelectedRecipients(allRecipientIds);
    }
  }, [recipients]);

  return (
    <>
      <div
        className={`w-full grid justify-center relative py-8 z-10  ${
          hiddenBlocks.launch ? " min-h-screen max-h-fit " : "h-fit"
        }`}
      >
        <div className="mt-4 w-[1205px]">
          {loading && (
            <div className="flex gap-2 items-center text-[15px]">
              <InfinityLoader width={24} height={24} />
              <div className="font-medium animate-pulse text-primary-light">
                Analyzing profiles and finding the best gifts...
              </div>
            </div>
          )}
          <div className="flex flex-col justify-between mt-2 gap-1">
            <div className="flex items-center gap-2">
              <Image src="/svgs/Laugh.svg" alt="gift" width={24} height={24} />
              <div className="text-[15px] font-medium flex items-center gap-2">
                <ScoreCardAnimation total={recipients.length} />
                <div>
                  out of {recipients.length} attendees matched with a perfect
                  gift.
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-[14px] mt-2">
              <div className="relative shadow-sm">
                <input
                  type="text"
                  placeholder="Search"
                  onChange={handleSearch}
                  className="w-[294px] pl-9 rounded-lg border border-[#D0D5DD] px-[14px] py-[8px] focus:outline-none focus:border-primary-light"
                />
                <Image
                  src="/svgs/search.svg"
                  alt="search"
                  className="absolute opacity-70 top-[11px] left-3"
                  width={18}
                  height={18}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border bg-white border-[#D0D5DD] font-medium text-[#344054] hover:bg-gray-50 shadow-sm">
                <Image
                  src="/svgs/Filter.svg"
                  alt="filter"
                  width={18}
                  height={12}
                />
                Filter
              </button>
            </div>
          </div>
          {/* //? gift cards table */}
          <div
            className={`overflow-x-auto rounded-lg border border-[#D2CEFE] mt-2 ${
              viewMore ? "h-[600px]" : 
              filteredRecipients.length === 0 ? "h-[200px]" : // Compact height for no results
              "h-[400px]"
            }`}
          >
            <table className="w-full bg-white relative">
              <thead className="border-b sticky top-0 bg-white z-10  border-[#D2CEFE] text-[#101828] text-xs">
                <tr className="uppercase ">
                  <th className="flex gap-4 p-[11px] pt-[19px]  text-left pl-4">
                    <Checkbox
                      id="select-all"
                      checked={selectedRecipients.length === recipients.length}
                      onChange={toggleSelectAll}
                    />
                    Attendee name
                  </th>
                  <th className="p-[11px] text-left pl-4 w-[140px]">Role</th>
                  <th className="p-[11px] text-left pl-4 w-[120px]">
                    company name
                  </th>

                  <th className=" p-[11px] text-left  pl-4 w-[240px]">
                    Matched Gift
                  </th>
                  <th className="p-[11px] text-left pl-9 w-[180px]">
                    {/* Delivery confidence */}
                    why this gift?
                  </th>
                  <th className="p-[11px] text-left w-[200px] ">Send mode</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <tr
                      key={`loading-row-${index}`}
                      className="border-b border-[#D2CEFE]"
                    >
                      <td className="">
                        <div className="h-2 w-20 bg-gray-200 animate-pulse rounded-lg ml-12"></div>
                        <div className="h-2 w-10 bg-gray-200 animate-pulse rounded-lg ml-12 mt-2"></div>
                      </td>
                      <td className="">
                        <div className="h-2 w-20 bg-gray-200 animate-pulse rounded-lg"></div>
                      </td>
                      <td className="">
                        <div className="h-2 mb-2 bg-gray-200 animate-pulse rounded-lg"></div>
                        <div className="h-2 w-20 bg-gray-200 animate-pulse rounded-lg"></div>
                      </td>
                      <td className="">
                        <div className="flex  justify-center items-center h-full gap-4 py-4">
                          <Image
                            src="/loading.png"
                            alt="Loading"
                            width={80}
                            height={80}
                            className="animate-pulse"
                          />
                          <p className="bg-gradient-to-r from-[#E3CEFE] via-[#6941C6] to-[#D2CEFE] bg-clip-text text-transparent font-semibold text-sm animate-pulse">
                            Finding the best gifts...
                          </p>
                        </div>
                      </td>
                      <td className="">
                        <div className="h-2 w-20 bg-gray-200 animate-pulse rounded-lg ml-12"></div>
                      </td>
                      <td className="">
                        <div className="h-5 w-28 bg-gray-200 animate-pulse rounded-md ml-4"></div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center">
                      No recipients found
                    </td>
                  </tr>
                ) : (
                  filteredRecipients.map(
                    (item: RecipientWithGift, index: number) => (
                      <tr
                        key={item._id || `temp-${Math.random()}`}
                        className="border-b border-[#D2CEFE] text-[#101828]  text-sm last:border-b-0"
                      >
                        {/* //? attendee name */}
                        <td className="p-4 w-[190px] align-top">
                          <div className="flex gap-3 items-start">
                            <Checkbox
                              id={`recipient-${item._id || ""}`}
                              checked={selectedRecipients.includes(
                                item._id || ""
                              )}
                              onChange={() => toggleRecipient(item._id || "")}
                            />
                            <div className="text-sm grid gap-4 -mt-0.5 ">
                              <div className="font-medium">
                                {item.lastName} {item.firstName}
                              </div>
                              {/* {Math.random() * 2 > 1 && (
                              <div className="flex items-center  gap-1 font-medium ">
                                <Image
                                  src="svgs/RealGift.svg"
                                  alt="location"
                                  width={18}
                                  height={18}
                                />
                                <div className="text-xs underline text-primary w-36">
                                  Hyper-personalized
                                </div>
                              </div>
                            )} */}
                            </div>
                          </div>
                        </td>
                        {/* //? role */}
                        <td className=" text-left  pl-4  text-sm font-medium align-top  pt-4 ">
                          {item.jobTitle || "---"}
                        </td>
                        {/* //? company name */}
                        <td className=" text-left pl-4  text-sm font-medium align-top pt-4  ">
                          {item.companyName || "---"}
                        </td>
                        {/* //? matched gift */}
                        <td className="p-4">
                          {!loadedRows.includes(index) ? (
                            <div className="flex justify-center items-center h-full gap-4 ">
                              <Image
                                src="/loading.png"
                                alt="Loading"
                                width={80}
                                height={80}
                                className="animate-pulse"
                              />
                              <p className="bg-gradient-to-r from-[#E3CEFE] via-[#6941C6] to-[#D2CEFE] bg-clip-text text-transparent font-semibold text-sm animate-pulse">
                                Finding the best gifts...
                              </p>
                            </div>
                          ) : (
                            <div className={`grid grid-flow-col gap-3  `}>
                              <div className="relative flex justify-start items-center  size-[76px]  overflow-hidden">
                                <Image
                                  src={
                                    item.assignedGift?.images?.primaryImgUrl ||
                                    "/loading.png"
                                  }
                                  width={76}
                                  height={76}
                                  alt={item.assignedGift?.name || "Gift"}
                                  style={{
                                    objectFit: "cover",
                                    objectPosition: "center",
                                  }}
                                  onError={(
                                    e: React.SyntheticEvent<
                                      HTMLImageElement,
                                      Event
                                    >
                                  ) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = " /loading.png";
                                  }}
                                  className={` object-cover  w-full h-full  ${
                                    item?.assignedGift?.images?.primaryImgUrl
                                      ? ""
                                      : "animate-pulse "
                                  }`}
                                />
                              </div>
                              {item.assignedGift?.name ? (
                                <div className="grid gap-3">
                                  <div className="font-medium text-xs">
                                    <div className="">
                                      {item.assignedGift?.name}
                                    </div>
                                    <div className="text-xs opacity-70 font-normal ">
                                      {item.assignedGift?.descShort ||
                                        "Loading..."}
                                    </div>

                                    <div className="font-semibold mt-1 ">
                                      ${item.assignedGift?.price}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div>
                                      <svg
                                        width="18"
                                        id={`recipient-${item._id || ""}svg`}
                                        className="text-white mx-auto  cursor-pointer"
                                        onClick={() => {
                                          document
                                            .getElementById(
                                              `recipient-${item._id || ""}svg`
                                            )
                                            ?.classList.toggle("text-primary");
                                          document
                                            .getElementById(
                                              `recipient-${item._id || ""}svg`
                                            )
                                            ?.classList.toggle("text-white");
                                        }}
                                        height="15"
                                        viewBox="0 0 20 18"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M10.5415 16.1824C10.4715 16.2555 10.3874 16.3136 10.2944 16.3533C10.2013 16.393 10.1012 16.4135 10 16.4135C9.89883 16.4135 9.79869 16.393 9.70564 16.3533C9.61258 16.3136 9.52852 16.2555 9.45852 16.1824L2.32926 8.74566C1.6558 8.07196 1.2113 7.2035 1.05867 6.26322C0.906035 5.32294 1.05301 4.35847 1.47879 3.50634C1.80078 2.86341 2.27092 2.30618 2.85047 1.88056C3.43003 1.45493 4.10241 1.1731 4.81223 1.05826C5.52206 0.943421 6.24901 0.998872 6.9332 1.22004C7.61739 1.44121 8.23925 1.82177 8.74754 2.33038L10 3.58283L11.2525 2.33038C11.761 1.82188 12.383 1.44149 13.0673 1.22054C13.7517 0.999597 14.4787 0.944418 15.1886 1.05955C15.8984 1.17469 16.5707 1.45684 17.1502 1.88276C17.7296 2.30868 18.1995 2.86619 18.5212 3.50934C18.947 4.36147 19.094 5.32594 18.9413 6.26622C18.7887 7.2065 18.3442 8.07495 17.6707 8.74866L10.5415 16.1824Z"
                                          stroke="#6941C6"
                                          strokeWidth="1.6"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                    <div
                                      onClick={() => {
                                        if (item._id) {
                                          setSelectedRecipientIndex(item._id);
                                          setModal(true);
                                        }
                                      }}
                                      className="text-xs hover:underline text-primary-dark cursor-pointer font-medium"
                                    >
                                      <span className="text-primary-dark">
                                        |
                                      </span>{" "}
                                      More like this
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="bg-gradient-to-r from-[#E3CEFE] via-[#6941C6] to-[#D2CEFE] items-center mt-5 bg-clip-text text-transparent  font-semibold animate-pulse">
                                  Finding the best gifts...
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        {/* //? delivery confidence */}
                        <td className="text-xs   px-4 flex mt-4 text-start font-medium">
                          {!loadedRows.includes(index) ||
                          item.assignedGift === null ? (
                            <div className="bg-slate-200 w-28 mx-auto mt-3 h-2 animate-pulse rounded-lg"></div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <Image
                                src="/svgs/Shimmers.svg"
                                alt="Gift Rationales"
                                width={24}
                                height={24}
                              />
                              <div className="group relative">
                                <div className="line-clamp-5">
                                  {item.assignedGift?.rationale ||
                                    giftRationales[
                                      index % giftRationales.length
                                    ]}
                                </div>
                                {/* Tooltip */}
                                <div className="absolute hidden group-hover:block z-[100] bg-[#101828] text-white text-xs py-2 px-3 rounded-lg -top-2 left-full ml-2 w-[300px]">
                                  {item.assignedGift?.rationale ||
                                    giftRationales[
                                      index % giftRationales.length
                                    ]}
                                  {/* Triangle */}
                                  <div className="absolute -left-2 top-4">
                                    <div className="border-[6px] -rotate-90 border-transparent border-r-[#101828]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 border border-[#F2F4F7] bg-[#F9FAFB] rounded-lg p-1 font-medium text-xs w-fit">
                            <button
                              className={`py-1 px-3 rounded-md ${
                                sendModes[item._id] !== "permission"
                                  ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                                  : "text-[#667085] hover:bg-white/50"
                              }`}
                              onClick={() =>
                                setSendModes((prev) => ({
                                  ...prev,
                                  [item._id]: "direct",
                                }))
                              }
                            >
                              Direct
                            </button>
                            <button
                              className={`py-1 px-3 rounded-md ${
                                sendModes[item._id] === "permission"
                                  ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                                  : "text-[#667085] hover:bg-white/50"
                              }`}
                              onClick={() =>
                                setSendModes((prev) => ({
                                  ...prev,
                                  [item._id]: "permission",
                                }))
                              }
                            >
                              Permission
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
              <tfoot className="h-14 sticky bottom-0 border-t border-[#D2CEFE]  w-[294px]  bg-white">
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="pr-2">
                    <div
                      onClick={() => setModal2(true)}
                      className="text-[14px] border border-[#D0D5DD] w-fit rounded-lg py-2 shadow-sm px-4 bg-white flex items-center gap-2 font-medium cursor-pointer hover:bg-gray-50 "
                    >
                      <Image
                        src="/img/Donation.png"
                        alt="gift"
                        width={24}
                        height={24}
                      />
                      <div>Customise Gifts</div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* //! container of buttons */}
          <div className="grid gap-4 mt-[30px]">
            {validationError && (
              <div className="text-red-500 text-sm text-center font-medium">
                {validationError}
              </div>
            )}
            <button
              onClick={() => {
                setHiddenBlocks((prev: HiddenBlocks) => ({
                  ...prev,
                  eventDateAndTime: false,
                }));
                setShouldScrollToBottom(true);
                handleSendApproval();
              }}
              className="flex items-center w-fit font-semibold text-xl gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg bg-primary hover:opacity-95 mx-auto"
            >
              <Image
                src="/svgs/Shimmer.svg"
                alt="Submit"
                width={22}
                height={22}
              />

              {sendForApprovalButton
                ? "Send for Approval"
                : "Set Campaign Outcome"}
            </button>
          </div>
        </div>
      </div>
      {/* //! modal */}
      <div
        className={`${
          modal ? "translate-x-0" : "translate-x-full"
        } fixed z-50 right-0 top-0 bottom-0 left-0 duration-300 flex items-center justify-center`}
      >
        <div
          onClick={() => setModal(false)}
          className="absolute inset-0 bg-primary-xlight bg-opacity-80"
        ></div>
        <div className="relative w-[604px] bg-white rounded-lg shadow max-h-[90vh] flex flex-col">
          <div className="p-6">
            {/* //? similar gifts header */}
            <div className="flex items-center justify-between">
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
            <div className="mt-4 text-xs font-medium border border-[#D2CEFE] rounded-lg overflow-auto">
              <div className="sticky top-0 bg-white text-[11px] text-[#101828] font-semibold flex items-center justify-between border-b px-8 border-[#D2CEFE]">
                <div className="p-[11px]">GIFT ITEMS</div>
                <div className="p-[11px]">COST</div>
              </div>
              <div className="overflow-y-auto">
                {availableGifts.length === 0 ? ( recipients
      .filter(recipient => recipient.assignedGift && recipient.assignedGift.id)
      .slice(0, 5)
      .map((recipient) => (
        <div
          key={recipient.assignedGift.id}
          className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
        >
          <div className="flex gap-3 items-center">
            <RoundedCheckbox
              item={recipient.assignedGift.id}
              checked={selectedModalGift === recipient.assignedGift.id}
              onChange={() => {
                setSelectedModalGift(recipient.assignedGift.id);
              }}
            />
            <div className="flex gap-2 items-start">
              <Image
                src={recipient.assignedGift.images?.primaryImgUrl || "/img/image.png"}
                alt={recipient.assignedGift.name || "Gift"}
                width={76}
                height={76}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/img/image.png";
                }}
              />
               <div className="grid gap-2">
                <div className="w-[163px]">
                  {recipient.assignedGift.name}
                </div>
                <svg
                  width="20"
                  className={`cursor-pointer mt-6 ${
                    likedGifts[recipient.assignedGift.id]
                      ? "text-primary"
                      : "text-white"
                  }`}
                  onClick={() => {
                    setLikedGifts((prev) => ({
                      ...prev,
                      [recipient.assignedGift.id]: !prev[recipient.assignedGift.id],
                    }));
                  }}
                  height="18"
                  viewBox="0 0 20 18"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                     <path
                    d="M10.5415 16.1824C10.4715 16.2555 10.3874 16.3136 10.2944 16.3533C10.2013 16.393 10.1012 16.4135 10 16.4135C9.89883 16.4135 9.79869 16.393 9.70564 16.3533C9.61258 16.3136 9.52852 16.2555 9.45852 16.1824L2.32926 8.74566C1.6558 8.07196 1.2113 7.2035 1.05867 6.26322C0.906035 5.32294 1.05301 4.35847 1.47879 3.50634C1.80078 2.86341 2.27092 2.30618 2.85047 1.88056C3.43003 1.45493 4.10241 1.1731 4.81223 1.05826C5.52206 0.943421 6.24901 0.998872 6.9332 1.22004C7.61739 1.44121 8.23925 1.82177 8.74754 2.33038L10 3.58283L11.2525 2.33038C11.761 1.82188 12.383 1.44149 13.0673 1.22054C13.7517 0.999597 14.4787 0.944418 15.1886 1.05955C15.8984 1.17469 16.5707 1.45684 17.1502 1.88276C17.7296 2.30868 18.1995 2.86619 18.5212 3.50934C18.947 4.36147 19.094 5.32594 18.9413 6.26622C18.7887 7.2065 18.3442 8.07495 17.6707 8.74866L10.5415 16.1824Z"
                    stroke="#6941C6"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="px-6 text-xs text-center font-medium">
            ${recipient.assignedGift.price}
          </div>
        </div>
      ))
              ):(
availableGifts.slice(0, 5).map((gift: Gift) => (
                  <div
                    key={gift?._id || Math.random().toString()}
                    className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                  >
                    <div className="flex gap-3 items-center">
                      <RoundedCheckbox
                        item={gift?._id || ""}
                        checked={selectedModalGift === gift?._id}
                        onChange={() => {
                          setSelectedModalGift(gift?._id || "");
                        }}
                      />
                      <div className="flex gap-2 items-start">
                        <Image
                          src={gift?.images?.primaryImgUrl || "/img/image.png"}
                          alt={gift?.name || "Gift"}
                          width={76}
                          height={76}
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement, Event>
                          ) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/img/image.png";
                          }}
                        />
                        <div className="grid gap-2">
                          <div className="w-[163px]">
                            {gift?.name || "Unnamed Gift"}
                          </div>
                          <svg
                            width="20"
                            className={`cursor-pointer mt-6 ${
                              likedGifts[gift?._id || ""]
                                ? "text-primary"
                                : "text-white"
                            }`}
                            onClick={() => {
                              setLikedGifts((prev) => ({
                                ...prev,
                                [gift?._id || ""]: !prev[gift?._id || ""],
                              }));
                            }}
                            height="18"
                            viewBox="0 0 20 18"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10.5415 16.1824C10.4715 16.2555 10.3874 16.3136 10.2944 16.3533C10.2013 16.393 10.1012 16.4135 10 16.4135C9.89883 16.4135 9.79869 16.393 9.70564 16.3533C9.61258 16.3136 9.52852 16.2555 9.45852 16.1824L2.32926 8.74566C1.6558 8.07196 1.2113 7.2035 1.05867 6.26322C0.906035 5.32294 1.05301 4.35847 1.47879 3.50634C1.80078 2.86341 2.27092 2.30618 2.85047 1.88056C3.43003 1.45493 4.10241 1.1731 4.81223 1.05826C5.52206 0.943421 6.24901 0.998872 6.9332 1.22004C7.61739 1.44121 8.23925 1.82177 8.74754 2.33038L10 3.58283L11.2525 2.33038C11.761 1.82188 12.383 1.44149 13.0673 1.22054C13.7517 0.999597 14.4787 0.944418 15.1886 1.05955C15.8984 1.17469 16.5707 1.45684 17.1502 1.88276C17.7296 2.30868 18.1995 2.86619 18.5212 3.50934C18.947 4.36147 19.094 5.32594 18.9413 6.26622C18.7887 7.2065 18.3442 8.07495 17.6707 8.74866L10.5415 16.1824Z"
                              stroke="#6941C6"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 text-xs text-center font-medium">
                      ${gift?.price || 0}
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>
          {/* //? save button */}
          <div
            className={`flex justify-end gap-3 mt-4 place-self-end border-t border-[#EAECF0] pt-4 w-full p-6 `}
          >
            <button
              onClick={() => setModal(false)}
              className=" border border-[#D0D5DD] hover:bg-slate-50 text-xs font-medium text-[#344054] px-4 py-2.5 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedRecipientIndex !== null && selectedModalGift) {
                  const newGift = availableGifts.find(
                    (g) => g._id === selectedModalGift
                  );
                  if (newGift) {
                    setRecipients((prev: RecipientWithGift[]) =>
                      prev.map((recipient) =>
                        recipient._id === selectedRecipientIndex
                          ? {
                              ...recipient,
                              assignedGift: {
                                ...newGift,
                                price: newGift.price || 0, // Use the selected gift's price
                              },
                            }
                          : recipient
                      )
                    );

                    // Update the budget with the new gift's price
                    setRecipientBudgets((prev) => ({
                      ...prev,
                      [selectedRecipientIndex]: newGift.price || 0,
                    }));
                  }
                }
                setSelectedModalGift(null);
                setSelectedRecipientIndex(null);
                setModal(false);
                setNotification(true);
              }}
              disabled={!selectedModalGift}
              className={`text-white text-xs font-medium px-4 py-2.5 rounded-lg ${
                selectedModalGift
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {/* //! modal 2 */}
      <div
        onClick={() => setModal2(false)}
        className={`${
          modal2 ? "translate-y-0" : "translate-y-[200%]"
        } fixed bg-[#0D01296E]  place-items-center grid inset-0 duration-300 z-50`}
      >
        <Image
          src="/img/DiscoveryCall.png"
          alt="gift"
          width={877}
          height={786}
        />
      </div>
      {/* //! notification */}
      <div
        className={`bg-[#FCFAFF] fixed  top-10 shadow-sm left-0 right-0 translate-x-[26%] border border-[#D6BBFB] rounded-lg p-4 w-[978px] grid grid-flow-col justify-between items-center ${
          notification ? "translate-y-0" : "-translate-y-[200%]"
        } duration-300 z-20`}
      >
        <div></div>
        <div className="text-sm font-medium text-primary">
          Customizations saved! Your dynamic gifts are now ready for review.
        </div>
        <svg
          onClick={() => setNotification(false)}
          width="18"
          height="18"
          className="stroke-[#9E77ED] hover:stroke-black cursor-pointer"
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
    </>
  );
}
