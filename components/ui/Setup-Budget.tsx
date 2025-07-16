import Image from "next/image";
import RangeSlider from "@/components/common/RangeSlider";
import { useState, useEffect, useCallback, useMemo } from "react";
import InfinityLoader from "../common/InfinityLoader";
import { Campaign, HiddenBlocks } from "@/lib/types/campaign";
import GiftCard from "@/components/setup-budget/Gift-Card";
import PersonalizationModeCard from "../setup-budget/PersonalizationModeCard";
import Checkbox from "../common/Checkbox";
import RoundedCheckbox from "../common/RoundedCheckbox";
import Cookies from "js-cookie";

interface Bundle {
  _id: string;
  bundleName: string;
  imgUrl: string;
  description: string;
  isAvailable: boolean;
  giftsList: Array<{
    giftId: string;
    vendorId: string;
  }>;
}

interface Gift {
  _id: string;
  name: string;
  price: number;
  images?: {
    primaryImgUrl: string;
  };
}

interface SetupBudgetProps {
  setHiddenBlocks: React.Dispatch<React.SetStateAction<HiddenBlocks>>;
  hiddenBlocks: HiddenBlocks;
  campaignId: string;
}

export default function SetupBudget({
  setHiddenBlocks,
  hiddenBlocks,
  campaignId,
}: SetupBudgetProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [budget, setBudget] = useState<{ min: number; max: number }>({
    min: 0,
    max: 250,
  });
  const [campaignData, setCampaignData] = useState<any>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(
    new Set()
  );

  const [modal, setModal] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGiftsByBundle, setSelectedGiftsByBundle] = useState<
    Map<string, Set<string>>
  >(new Map());

  // Debug: Log initial state setup
  const [selectedGiftsInModal, setSelectedGiftsInModal] = useState<Set<string>>(
    new Set()
  );
  const [bundleGifts, setBundleGifts] = useState<Gift[]>([]);
  const [currentBundle, setCurrentBundle] = useState<Bundle | null>(null);
  const [personalizationMode, setPersonalizationMode] = useState<{
    hyperPersonalize: boolean;
    fastTrack: boolean;
  }>({ hyperPersonalize: true, fastTrack: false });

  // Add new state for storing all gifts
  const [allBundleGifts, setAllBundleGifts] = useState<Map<string, Gift[]>>(new Map());

  // Add a modalLoading state
  const [modalLoading, setModalLoading] = useState(false);
  // Debug call stack tracking
  const [lastFunctionCall, setLastFunctionCall] = useState<string>("");

  console.log("selectedBundles", selectedBundles);
  //   useEffect(() => {
  //     console.log("Budget updated:", budget);
  //   }, [budget]);
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const organizationId = Cookies.get("organization_id");
        const authToken = Cookies.get("auth_token");

        console.log("Checking credentials:", {
          organizationId,
          campaignId,
          authToken,
        });

        if (!organizationId || !authToken) {
          console.log("Missing required data");
          return;
        }

        const response = await fetch(`/api/campaigns/${campaignId}`);
        const data = await response.json();
        console.log("Campaign data fetched:", data?.data);
        setCampaignData(data?.data);
        // If campaign has gift catalogs, pre-select them
        if (data?.data?.giftCatalogs && data.data.giftCatalogs.length > 0) {
          console.log("Found existing gift catalogs:", data.data.giftCatalogs);

          // Set selected bundles
          const bundleIds = data.data.giftCatalogs.map(
            (catalog: any) => catalog.catalogId
          );
          setSelectedBundles(new Set(bundleIds));
          // Set selected gifts for each bundle
          const giftMap = new Map();
          data.data.giftCatalogs.forEach((catalog: any) => {
            if (catalog.selectedGift) {
              giftMap.set(catalog.catalogId, new Set([catalog.selectedGift]));
            }
          });
          setSelectedGiftsByBundle(giftMap);

          console.log("Pre-selected bundles:", bundleIds);
          console.log("Pre-selected gifts:", giftMap);
        }
        if (data?.data?.giftSelectionMode) {
          setPersonalizationMode({
            hyperPersonalize:
              data?.data?.giftSelectionMode === "hyper_personalize",
            fastTrack: data?.data?.giftSelectionMode === "fast_track",
          });
        }
        if (data?.data?.budget?.maxPerGift) {
          const maxValue = data.data.budget.maxPerGift;
          console.log("Setting max budget to:", maxValue);
          setBudget((prev) => ({ ...prev, max: maxValue }));
          console.log("budget", budget.max);
        }
      } catch (error) {
        console.error("Error fetching campaign data:", error);
      }
    };

    if (campaignId) {
      console.log("CampaignId changed, fetching new data:", campaignId);
      fetchCampaignData();
    }
  }, [campaignId]);

  useEffect(() => {
    if (personalizationMode.fastTrack && bundles.length > 0) {
      const firstBundle = bundles[0];
      setCurrentBundle(firstBundle);

      // First fetch the gift details for the bundle
      const fetchGiftDetails = async () => {
        try {
          const validGiftIds = firstBundle.giftsList.filter(
            ({ giftId }) => giftId && giftId.length > 0
          );

          if (validGiftIds.length === 0) {
            throw new Error("No valid gifts found in this bundle");
          }

          const giftPromises = validGiftIds.map(async ({ giftId }) => {
            const res = await fetch(`/api/gifts/${giftId}`);
            if (!res.ok) {
              if (res.status === 404) {
                console.warn(`Gift ${giftId} not found, skipping...`);
                return null;
              }
              throw new Error(`Failed to fetch gift ${giftId}`);
            }
            return res.json();
          });

          const gifts = (await Promise.all(giftPromises)).filter(
            (gift) => gift !== null
          );

          if (gifts.length === 0) {
            throw new Error("No gifts could be loaded for this bundle");
          }

          // Filter gifts based on budget
          const filteredGifts = gifts.filter(gift => gift.price <= budget.max);
          console.log(`%c[DEBUG] Setting filtered gifts in initial useEffect: ${filteredGifts.length}/${gifts.length} items`, 'background:#4b0082;color:#fff');
          setBundleGifts(filteredGifts);

          // Store the unfiltered gifts for later use
          setAllBundleGifts(prev => new Map(prev).set(firstBundle._id, gifts));
        } catch (error) {
          console.error("Error fetching gift details:", error);
        }
      };

      fetchGiftDetails();
    }
  }, [personalizationMode.fastTrack, bundles, budget.max]);
  // Debug: Log state changes
  useEffect(() => {
    console.log("Current selectedGiftsByBundle:", {
      size: selectedGiftsByBundle.size,
      entries: Array.from(selectedGiftsByBundle.entries()),
    });
  }, [selectedGiftsByBundle]);

  // Debug logs for budget changes
  useEffect(() => {
    console.log(`%c[DEBUG] Budget changed: ${JSON.stringify(budget)}`, 'background:#ffd700;color:#000');
  }, [budget]);

  // Debug logs for modal state
  useEffect(() => {
    console.log(`%c[DEBUG] Modal state changed: ${modal}`, 'background:#ff69b4;color:#000');
  }, [modal]);

  // Debug logs for bundleGifts changes
  useEffect(() => {
    console.log(`%c[DEBUG] bundleGifts changed: ${bundleGifts.length} items`, 'background:#87ceeb;color:#000');
    bundleGifts.forEach(gift => console.log(`  - ${gift.name}: $${gift.price}`));
  }, [bundleGifts]);

  // Add debug logs
  const handleBudgetChange = useCallback((min: number, max: number) => {
    console.log(`%c[DEBUG] handleBudgetChange called: min=${min}, max=${max}`, 'background:#32cd32;color:#000');
    setLastFunctionCall("handleBudgetChange");
    setBudget({ min, max });
  }, []);
  // Fetch campaign data with loading state
  useEffect(() => {
    const fetchCampaign = async () => {
      setIsLoading(true);
      try {
        if (!campaignId) return;

        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("All data", data);
        setCampaign(data.data);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setError("Failed to load campaign data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);
  // ! fetch bundles
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const response = await fetch("/api/bundles");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bundles");
        }
        setBundles(data.bundles);
      } catch (err) {
        console.error("Error fetching bundles:", err);
      }
    };
    fetchBundles();
  }, []);
  //  !  handle bundle selection
  const handleCheckboxChange = (bundle: Bundle) => {
    console.log("Bundle checkbox changed:", bundle._id);

    setSelectedBundles((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(bundle._id)) {
        newSelected.delete(bundle._id);
        setSelectedGiftsByBundle((prev) => {
          const newMap = new Map(prev);
          newMap.delete(bundle._id);
          return newMap;
        });
      } else {
        // If selecting bundle, pre-select all its gifts
        newSelected.add(bundle._id);
        // Pre-select all gifts from this bundle
        if (bundle.giftsList && bundle.giftsList.length > 0) {
          setSelectedGiftsByBundle((prev) => {
            const newMap = new Map(prev);
            const allGiftIds = new Set(bundle.giftsList.map((g) => g.giftId));
            newMap.set(bundle._id, allGiftIds);
            return newMap;
          });
        }
      }
      return newSelected;
    });
  };
  // ! Debug handleGiftSelect
  const handleGiftSelect = (bundleId: string, giftId: string) => {
    console.log("Selecting individual gift:", { bundleId, giftId });

    // Update modal selections
    if (personalizationMode.fastTrack) {
      // Replace old selection with new one in modal
      setSelectedGiftsInModal(new Set([giftId]));
      // setBundles([]);
      // Replace old selection with new one in bundle
      setSelectedGiftsByBundle((prev) => {
        const newMap = new Map(prev);
        newMap.set(bundleId, new Set([giftId]));
        return newMap;
      });
    } else {
      setSelectedGiftsInModal((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(giftId)) {
          newSelected.delete(giftId);
        } else {
          newSelected.add(giftId);
        }
        return newSelected;
      });

      // Update the main gift selections
      setSelectedGiftsByBundle((prev) => {
        const newMap = new Map(prev);
        const bundleGifts = new Set(newMap.get(bundleId) || []);

        if (bundleGifts.has(giftId)) {
          bundleGifts.delete(giftId);
        } else {
          bundleGifts.add(giftId);
        }

        if (bundleGifts.size > 0) {
          newMap.set(bundleId, bundleGifts);
        } else {
          newMap.delete(bundleId);
        }

        return newMap;
      });
    }
  };
  // ! Calculate estimated costs
  const calculateEstimates = useCallback(() => {
    const recipients = campaign?.total_recipients || 0;
    const minTotal = budget.min * recipients;
    const maxTotal = budget.max * recipients;
    const averageTotal = (minTotal + maxTotal) / 2;

    return {
      minTotal,
      maxTotal,
      averageTotal,
    };
  }, [campaign?.total_recipients, budget.min, budget.max]);

  const estimates = useMemo(() => calculateEstimates(), [calculateEstimates]);

  // ! Save budget with loading state and validation
  const saveBudgetToCampaign = async () => {
    try {
      // Check if any bundle is selected
      if (selectedBundles.size === 0 && !personalizationMode.fastTrack) {
        setError("Please select at least one gift catalog");
        return;
      }
      if (personalizationMode.fastTrack && selectedGiftsInModal.size === 0) {
        setError("Please select at least one gift from the catalog");
        return;
      }

      // Get all selected gifts from selectedGiftsByBundle
      const selectedGiftIds = Array.from(selectedGiftsByBundle.values())
        .flatMap((giftSet) => Array.from(giftSet))
        .filter((giftId) => giftId);

      // Check if any gifts are selected
      if (selectedGiftIds.length === 0) {
        setError("Please select at least one gift from the catalog");
        return;
      }

      setIsSaving(true);
      setError(null);

      if (!campaignId) throw new Error("No campaign ID provided");

      const budgetData = {
        // budget: {
        //   total: estimates.averageTotal,
        //   perGift: {
        //     min: budget.min,
        //     max: budget.max,
        //   },
        //   spent: 0,
        // },
        // giftIds: selectedGiftIds,
        // bundleIds: Array.from(selectedBundles),

        budget: {
          totalBudget: estimates.maxTotal,
          maxPerGift: budget.max,
          currency: "USD",
          spent: 0,
        },
        giftCatalogs: Array.from(selectedGiftsByBundle.entries()).map(
          ([bundleId, giftIds]) => ({
            catalogId: bundleId,
            selectedGift: Array.from(giftIds), // Take first selected gift for each bundle
          })
        ),

        giftSelectionMode: personalizationMode.hyperPersonalize
          ? "hyper_personalize"
          : "manual",
      };

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save budget");
      }

      const data = await response.json();
      console.log("Budget and gifts saved successfully:", data);

      // Update hiddenBlocks to show EventDateAndTime and hide SetupBudget
      setHiddenBlocks((prev) => ({
        ...prev,
        giftRecommendations: true, // Hide SetupBudget
        eventDateAndTime: false, // Show EventDateAndTime
      }));

      setShouldScrollToBottom(true);
    } catch (error) {
      console.error("Error saving budget:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save budget"
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (shouldScrollToBottom) {
      setTimeout(() => {
        setHiddenBlocks((prev) => ({
          ...prev,
          giftRecommendations: false,
        }));
      }, 500);
      setTimeout(() => {
        const currentScroll = window.pageYOffset;
        window.scrollTo({
          top: currentScroll + 800, // Adjust this value as needed
          behavior: "smooth",
        });
        setShouldScrollToBottom(false); // Reset the state
      }, 500);
    }
  }, [shouldScrollToBottom, setHiddenBlocks]);

  // Modify handleEyeClick to add debug
  const handleEyeClick = async (bundle: Bundle) => {
    console.log(`%c[DEBUG] handleEyeClick called for bundle: ${bundle.bundleName}`, 'background:#ff8c00;color:#000');
    setLastFunctionCall("handleEyeClick");
    try {
      setIsLoading(true);
      setModalLoading(true);
      setError(null);
      setCurrentBundle(bundle);
      setModal(true);

      // Check if we already have gifts for this bundle
      if (allBundleGifts.has(bundle._id)) {
        console.log(`%c[DEBUG] Using cached gifts for bundle: ${bundle.bundleName}`, 'background:#ff8c00;color:#000');
        const gifts = allBundleGifts.get(bundle._id) || [];

        // Filter gifts based on current budget
        const filteredGifts = gifts.filter(gift => gift.price <= budget.max);
        console.log(`%c[DEBUG] Setting filtered bundleGifts in handleEyeClick: ${filteredGifts.length}/${gifts.length} items`, 'background:#ff8c00;color:#000');

        setBundleGifts(filteredGifts);
        const existingSelections = selectedGiftsByBundle.get(bundle._id) || new Set();
        setSelectedGiftsInModal(existingSelections);
        setModalLoading(false);
        return;
      }

      const validGiftIds = bundle.giftsList.filter(
        ({ giftId }) => giftId && giftId.length > 0
      );

      if (validGiftIds.length === 0) {
        throw new Error("No valid gifts found in this bundle");
      }

      const giftPromises = validGiftIds.map(async ({ giftId }) => {
        const res = await fetch(`/api/gifts/${giftId}`);
        if (!res.ok) {
          if (res.status === 404) {
            console.warn(`Gift ${giftId} not found, skipping...`);
            return null;
          }
          throw new Error(`Failed to fetch gift ${giftId}`);
        }
        return res.json();
      });

      const gifts = (await Promise.all(giftPromises)).filter(
        (gift) => gift !== null
      );

      if (gifts.length === 0) {
        throw new Error("No gifts could be loaded for this bundle");
      }

      // Store all gifts in state
      setAllBundleGifts(prev => new Map(prev).set(bundle._id, gifts));

      // Filter gifts based on budget
      const filteredGifts = gifts.filter(gift => gift.price <= budget.max);
      console.log(`%c[DEBUG] Setting filtered bundleGifts in handleEyeClick (new fetch): ${filteredGifts.length}/${gifts.length} items`, 'background:#ff8c00;color:#000');

      setBundleGifts(filteredGifts);
      const existingSelections = selectedGiftsByBundle.get(bundle._id) || new Set();
      setSelectedGiftsInModal(existingSelections);
      setModalLoading(false);
    } catch (err) {
      console.error("Error in handleEyeClick:", err);
      setError(err instanceof Error ? err.message : "Failed to load gifts");
      setModalLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify PersonalizationModeCard click handler to add debug
  const handlePersonalizationModeClick = () => {
    console.log(`%c[DEBUG] handlePersonalizationModeClick called`, 'background:#9370db;color:#000');
    setLastFunctionCall("handlePersonalizationModeClick");

    // Check if any bundle is selected
    if (selectedBundles.size === 0) {
      setError("Please select at least one gift catalog first");
      return;
    }

    // Get the first selected bundle if currentBundle is not set
    let targetBundle = currentBundle;
    if (!targetBundle) {
      const firstSelectedBundleId = Array.from(selectedBundles)[0];
      targetBundle = bundles.find(b => b._id === firstSelectedBundleId) || null;

      if (!targetBundle) {
        setError("Unable to find the selected bundle");
        return;
      }

      setCurrentBundle(targetBundle);
    }

    // Open modal first with loading state
    setModalLoading(true);
    setModal(true);

    // Fetch gifts for the bundle if not already fetched
    const fetchAndFilterGifts = async (bundle: Bundle) => {
      console.log(`%c[DEBUG] fetchAndFilterGifts called for bundle: ${bundle.bundleName}`, 'background:#9370db;color:#000');
      try {
        setIsLoading(true);

        // Check if we already have gifts for this bundle
        if (allBundleGifts.has(bundle._id)) {
          console.log(`%c[DEBUG] Using cached gifts for bundle in fetchAndFilterGifts`, 'background:#9370db;color:#000');
          const gifts = allBundleGifts.get(bundle._id) || [];
          const filteredGifts = gifts.filter(gift => gift.price <= budget.max);

          console.log(`%c[DEBUG] Filtered ${gifts.length} gifts to ${filteredGifts.length} items based on budget max=${budget.max}`, 'background:#9370db;color:#000');

          if (filteredGifts.length === 0) {
            setError("No gifts found within your selected budget range");
            setIsLoading(false);
            setModalLoading(false);
            return;
          }

          console.log(`%c[DEBUG] Setting bundleGifts in fetchAndFilterGifts: ${filteredGifts.length} items`, 'background:#9370db;color:#000');
          setBundleGifts(filteredGifts);
          setPersonalizationMode({
            hyperPersonalize: false,
            fastTrack: true,
          });
          setIsLoading(false);
          setModalLoading(false);
          return;
        }

        // If we don't have gifts yet, fetch them
        const validGiftIds = bundle.giftsList.filter(
          ({ giftId }) => giftId && giftId.length > 0
        );

        if (validGiftIds.length === 0) {
          throw new Error("No valid gifts found in this bundle");
        }

        const giftPromises = validGiftIds.map(async ({ giftId }) => {
          const res = await fetch(`/api/gifts/${giftId}`);
          if (!res.ok) {
            if (res.status === 404) {
              console.warn(`Gift ${giftId} not found, skipping...`);
              return null;
            }
            throw new Error(`Failed to fetch gift ${giftId}`);
          }
          return res.json();
        });

        const gifts = (await Promise.all(giftPromises)).filter(
          (gift) => gift !== null
        );

        if (gifts.length === 0) {
          throw new Error("No gifts could be loaded for this bundle");
        }

        // Store all gifts in state
        setAllBundleGifts(prev => new Map(prev).set(bundle._id, gifts));

        // Filter gifts based on budget
        const filteredGifts = gifts.filter(gift => gift.price <= budget.max);

        if (filteredGifts.length === 0) {
          throw new Error("No gifts found within your selected budget range");
        }

        setBundleGifts(filteredGifts);
        setPersonalizationMode({
          hyperPersonalize: false,
          fastTrack: true,
        });
      } catch (err) {
        console.error("Error in handlePersonalizationModeClick:", err);
        setError(err instanceof Error ? err.message : "Failed to load gifts");
      } finally {
        setIsLoading(false);
        setModalLoading(false);
      }
    };

    if (targetBundle) {
      fetchAndFilterGifts(targetBundle);
    }
  };

  // Add a useEffect to filter gifts when budget changes while modal is open
  useEffect(() => {
    if (modal && currentBundle && allBundleGifts.has(currentBundle._id)) {
      console.log(`%c[DEBUG] Budget/modal/currentBundle useEffect triggered`, 'background:#ff6347;color:#000');
      console.log(`%c[DEBUG] Last function call: ${lastFunctionCall}`, 'background:#ff6347;color:#000');
      console.log(`%c[DEBUG] Current budget: ${JSON.stringify(budget)}`, 'background:#ff6347;color:#000');

      // Skip the first filter after specific function calls to prevent double filtering
      if (
        (lastFunctionCall === "handleBudgetChange") ||
        (lastFunctionCall === "handlePersonalizationModeClick" && personalizationMode.fastTrack) ||
        (lastFunctionCall === "handleEyeClick")
      ) {
        console.log(`%c[DEBUG] Skipping filtering after ${lastFunctionCall}`, 'background:#ff6347;color:#000');
        setLastFunctionCall("");  // Reset so next time it will filter
        return;
      }

      setModalLoading(true);
      const gifts = allBundleGifts.get(currentBundle._id) || [];

      console.log(`%c[DEBUG] Refiltering gifts on budget change: ${gifts.length} total gifts with budget.max=${budget.max}`, 'background:#ff6347;color:#000');
      const filteredGifts = gifts.filter(gift => gift.price <= budget.max);

      console.log(`%c[DEBUG] Filtered to ${filteredGifts.length} gifts`, 'background:#ff6347;color:#000');

      if (filteredGifts.length === 0) {
        setError("No gifts found within your selected budget range");
        setModalLoading(false);
        return;
      }

      console.log(`%c[DEBUG] Setting bundleGifts in useEffect: ${filteredGifts.length} items`, 'background:#ff6347;color:#000');
      setBundleGifts(filteredGifts);
      setModalLoading(false);
    }
  }, [budget, modal, currentBundle, personalizationMode.fastTrack, allBundleGifts, lastFunctionCall]);

  function formatEstimatedTime(totalRecipients: number): string {
    // Using your formula: for each recipient 1 min + additional 2 minutes
    const minutes = totalRecipients * 2 + 2;
    console.log("totalRecipients", totalRecipients);

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      // Add a leading zero if remaining minutes are less than 10 to match the format "1 hr : 05 min"
      const formattedMinutes =
        remainingMinutes < 10 ? `0${remainingMinutes}` : remainingMinutes;
      return `${hours} hr : ${formattedMinutes} min`;
    }

    return `${minutes} mins`;
  }

  return (
    <>
      <div
        className={`w-full grid relative  justify-center pt-10 z-10  ${hiddenBlocks.giftRecommendations
            ? "h-[180vh] 2xl:h-[180vh] "
            : "h-fit"
          }`}
      >
        <div className="mt-24 w-[855px]">
          {/* //? Gift catalouge and filter */}
          <div className="grid mb-[30px] ">
            {/* //? (1) title */}
            <div className="text-lg font-semibold flex items-center gap-2">
              <Image
                src="/svgs/ThumbUp.svg"
                alt="gift"
                width={20}
                height={22}
              />
              <p>Select the Perfect Gift Catalogs </p>
            </div>
            {/* //? (2) filter */}
            <div className="flex items-center gap-2 justify-between">
              <p className="text-[15px] font-medium ">
                Browse curated collections and set a budget to find the perfect
                gifts.
              </p>
              <button className="hidden items-center gap-2 px-4 py-1.5 rounded-lg border bg-white border-[#D0D5DD] font-medium text-[#344054] hover:bg-gray-50 shadow-sm ">
                <Image
                  src="svgs/Filter.svg"
                  alt="filter"
                  width={18}
                  height={12}
                />
                Filters
              </button>
            </div>
          </div>
          {/* //? Gift Card Container */}
          <div className="grid grid-cols-4 gap-x-[10px] w-fit gap-y-[8px] mx-auto ">
            {bundles.map((bundle) => (
              <GiftCard
                key={bundle._id}
                bundle={bundle}
                isSelected={selectedBundles.has(bundle._id)}
                onCheckboxChange={() => handleCheckboxChange(bundle)}
                onEyeClick={() => handleEyeClick(bundle)}
              />
            ))}
          </div>

          <div className=" mt-[41px]">
            <div className="flex items-center gap-2 mb-14">
              <Image src="/svgs/Laugh.svg" alt="gift" width={20} height={22} />
              <p className="text-[15px] font-medium ">
                Set Maximum Budget Per Gift
              </p>
            </div>
            <div className="border-[#D2CEFE] border  bg-[#F9F3FFBF] rounded-lg px-[221px] pb-[21px] pt-[55px]">
              <RangeSlider
                // key={budget.max}
                setBudget={handleBudgetChange}
                initialMin={0}
                initialMax={budget.max}
              />
            </div>

            <div className="flex font-medium items-center gap-2 justify-center text-[15px] text-center mt-6">
              <Image
                src="/svgs/ThumbUp.svg"
                alt="drag"
                width={18}
                height={18}
              />
              Choose Your Personalization Mode
            </div>

            {/* Budget estimates */}
            {/* <div className="flex items-center gap-2 mt-[37px]">
            <Image
              src="svgs/Infinity.svg"
              alt="logo"
              className="animate-pulse"
              width={24}
              height={24}
            />
            <div className="text-white bg-primary-light rounded-lg px-[14px] py-2.5">
              With {campaign?.metrics?.totalRecipients} profiles at $
              {budget.min} - ${budget.max} per profile, your estimated cost
              range is ${estimates.minTotal.toFixed(2)} - $
              {estimates.maxTotal.toFixed(2)} Average total cost: $
              {estimates.averageTotal.toFixed(2)}
            </div>
          </div> */}

            {/* Success message */}
            {/* <div
            className={`${
              hiddenBlocks.giftRecommendations ? "flex" : "hidden"
            } items-center gap-2 mt-[48px]`}
          >
            <Image src="svgs/Laugh.svg" alt="laugh" width={24} height={24} />
            <div className="text-[14px] font-medium">
              Budget set successfully! Let's move on to gift recommendations.
            </div>
          </div> */}
            {/* //? Personalization Mode Cards container */}
            <div className="flex items-center gap-6 justify-center mt-[30px] ">
              <PersonalizationModeCard
                onClick={() =>
                  setPersonalizationMode({
                    hyperPersonalize: true,
                    fastTrack: false,
                  })
                }
                tick={personalizationMode.hyperPersonalize}
                time={
                  campaign?.total_recipients
                    ? formatEstimatedTime(campaign.total_recipients)
                    : "0 mins"
                }
                image="/svgs/Bulb2.svg"
                mainText="Hyper-Personalize"
                subText="Hyper-personalise every profile across 14 signals to find the perfect match within your budget."
                disabled={selectedBundles.size === 0}
              />
              <PersonalizationModeCard
                onClick={handlePersonalizationModeClick}
                tick={personalizationMode.fastTrack}
                time=""
                image="/svgs/gift-purple.svg"
                mainText="Pick Your Own Gift"
                subText="Browse our hand-picked catalog and choose gift that are just right."
                disabled={selectedBundles.size === 0}
              />
            </div>
            {/* Show gifts button */}
            <div className="flex flex-col items-center mt-10">
              <button
                onClick={saveBudgetToCampaign}
                disabled={isLoading || isSaving}
                className={`${hiddenBlocks.eventDateAndTime ? "flex" : " hidden"} items-center font-semibold text-xl gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg
                  ${isLoading || isSaving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:opacity-95"
                  }`}
              >
                {isLoading ? (
                  "Loading Campaign..."
                ) : isSaving ? (
                  "Saving Budget..."
                ) : (
                  <>
                    <Image
                      src="svgs/Shimmer.svg"
                      alt="shimmers"
                      width={22}
                      height={22}
                    />
                    Set Campaign Outcome
                  </>
                )}
              </button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {/* Loading state */}
            {shouldScrollToBottom && !isLoading && !isSaving && (
              <div
                className={`${hiddenBlocks.giftRecommendations ? "flex" : "hidden"
                  } items-center justify-center gap-2 mt-[23px]`}
              >
                <InfinityLoader width={28} height={28} />
                <div
                  className="text-[15px] font-medium animate-pulse"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #E3CEFE 0%, #6941C6 33.33%, #5816F0 66.67%, #D2CEFE 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    backgroundSize: "100% auto",
                    color: "#6941C6",
                  }}
                >
                  Preparing personalized gift recommendations for your
                  profiles...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* //! modal */}
      <div
        className={`${modal ? "translate-x-0" : "translate-x-full"
          } fixed z-50 right-0 top-0 bottom-0 left-0  duration-300 flex`}
      >
        <div
          onClick={() => setModal(false)}
          className="w-full bg-primary-xlight bg-opacity-80"
        ></div>
        <div className="w-[604px] overflow-y-auto shadow bg-white grid">
          <div className="w-full p-6">
            <div className="flex items-center justify-between h-fit">
              <div className="text-xl font-medium">
                {selectedBundles.size > 0
                  ? "Selected Bundles"
                  : "Select a bundle"}{" "}
                Gifts
              </div>
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

            {/* Gift List */}
            <div className="mt-[21px] text-xs font-medium border border-[#D2CEFE] rounded-lg h-fit">
              <div className="text-[11px] text-[#101828] font-semibold flex items-center justify-between border-b px-8 border-[#D2CEFE]">
                <div className="p-[11px]">GIFT ITEMS</div>
                <div className="p-[11px]">COST</div>
              </div>
              {modalLoading ? (
                <div className="flex justify-center items-center py-10 gap-2">
                  <InfinityLoader width={28} height={28} />
                  <div className="text-[15px] font-medium">
                    Loading gifts for your budget...
                  </div>
                </div>
              ) : bundleGifts.length === 0 ? (
                <div className="flex justify-center items-center py-10">
                  No gifts found for this budget range
                </div>
              ) : (
                bundleGifts.map((gift, index) => (
                  <div
                    key={gift._id + index}
                    className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                  >
                    <div className="flex gap-3 items-center">
                      {personalizationMode.fastTrack ? (
                        <RoundedCheckbox
                          item={gift._id}
                          checked={selectedGiftsInModal.has(gift._id)}
                          onChange={() =>
                            handleGiftSelect(currentBundle?._id || "", gift._id)
                          }
                        />
                      ) : (
                        <Checkbox
                          id={`gift-card-${gift.name}`}
                          checked={selectedGiftsInModal.has(gift._id)}
                          onChange={() =>
                            handleGiftSelect(currentBundle?._id || "", gift._id)
                          }
                        />
                      )}

                      <div className="flex gap-2 items-start">
                        <Image
                          src={gift.images?.primaryImgUrl || "/img/image.png"}
                          alt={gift.name || "gift"}
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
                          <div className="w-[163px]">{gift.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 text-xs text-center font-medium">
                      ${gift.price}
                    </div>
                  </div>
                ))
              )}
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
                  setModal(false);
                }}
                className={`text-white text-xs font-medium px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
