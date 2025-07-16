import { useState, useCallback, useEffect } from "react";
import RangeSlider from "@/components/common/RangeSlider";
import GiftCard from "@/components/setup-budget/Gift-Card";
import Checkbox from "@/components/common/Checkbox";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import TemplateModal from "../select-gift/Template-modal";
import { toast } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

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

type SelectGiftProps = {
  block: {
    giftVisible: boolean;
    giftStrategyVisible: boolean;
  };
  setBlock: (block: {
    giftVisible: boolean;
    giftStrategyVisible: boolean;
  }) => void;
  playbookId: string;
};

export default function SelectGift({
  block,
  setBlock,
  playbookId,
}: SelectGiftProps) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();

  const [budget, setBudget] = useState<{ min: number; max: number }>({
    min: 0,
    max: 20,
  });
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(
    new Set()
  );
  const [selectedGiftsByBundle, setSelectedGiftsByBundle] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [modal, setModal] = useState(false);
  const [bundleGifts, setBundleGifts] = useState<Gift[]>([]);
  const [currentBundle, setCurrentBundle] = useState<Bundle | null>(null);
  const [selectedGiftsInModal, setSelectedGiftsInModal] = useState<Set<string>>(
    new Set()
  );
  const [focusTemplate, setFocusTemplate] = useState<{
    template1: boolean;
    template2: boolean;
    template3: boolean;
    template4: boolean;
  }>({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sendMode, setSendMode] = useState<"direct" | "permission">("direct");

  const [scrollPosition, setScrollPosition] = useState(0);
  const [errorforPowerUpWallet, setErrorforPowerUpWallet] = useState<
    string | null
  >(null);

  const [selectedTemplate, setSelectedTemplate] = useState<{
    template1: boolean;
    template2: boolean;
    template3: boolean;
    template4: boolean;
  }>({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });

  const [playbook, setPlaybook] = useState<any>(null);

  const [templateData, setTemplateData] = useState({
    type: "template1" as "template1" | "template2" | "template3" | "template4",
    description: "",
    date: null as Date | null,
    videoLink: "",
    logoLink: "",
    buttonText: "Select Gift",
    buttonLink: "",
    mediaUrl: "/partner-integrations/gift.png"
  });

  const [hyperPersonalization, setHyperPersonalization] = useState(false);

  const handleBudgetChange = useCallback((min: number, max: number) => {
    setBudget({ min, max });
  }, []);

  useEffect(() => {
    console.log("Current selectedGiftsByBundle:", {
      size: selectedGiftsByBundle.size,
      entries: Array.from(selectedGiftsByBundle.entries()),
    });
  }, [selectedGiftsByBundle]);

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundles();
  }, []);

  const fetchPlaybook = async () => {
    try {
      if (!userId) {
        toast.error("Please login to view playbook");
        return;
      }

      console.log("Fetching playbook with ID:", playbookId);
      const response = await fetch(`/api/playbooks/${playbookId}`);
      const data = await response.json();

      console.log("Full playbook data received:", data.playbook);

      if (data.playbook) {
        // Set budget directly from playbook data
        const savedBudget = data.playbook.budget || 20;
        console.log("Setting budget to:", savedBudget);
        setBudget({
          min: 0,
          max: savedBudget
        });

        // Set other states from playbook data
        console.log("Setting selected bundles:", data.playbook.bundleIds);
        setSelectedBundles(new Set(data.playbook.bundleIds || []));

        const mode = data.playbook.sending_mode === "permission_based" ? "permission" : "direct";
        console.log("Setting send mode to:", mode);
        setSendMode(mode);

        // Set hyper_personalization from playbook
        const isHyperPersonalized = data.playbook.hyper_personalization === true;
        console.log("Setting hyper-personalization to:", isHyperPersonalized);
        setHyperPersonalization(isHyperPersonalized);
      }
    } catch (error) {
      console.error("Error fetching playbook:", error);
      toast.error("Failed to fetch playbook details");
    }
  };

  useEffect(() => {
    if (playbookId) {
      fetchPlaybook();
    }
  }, [playbookId]);

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
        newSelected.add(bundle._id);
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

  const handleGiftSelect = (bundleId: string, giftId: string) => {
    console.log("Selecting individual gift:", { bundleId, giftId });

    setSelectedGiftsInModal((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(giftId)) {
        newSelected.delete(giftId);
      } else {
        newSelected.add(giftId);
      }
      return newSelected;
    });

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
  };

  const handleEyeClick = async (bundle: Bundle) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentBundle(bundle);

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

      setBundleGifts(gifts);
      const existingSelections =
        selectedGiftsByBundle.get(bundle._id) || new Set();
      setSelectedGiftsInModal(existingSelections);
      setModal(true);
    } catch (err) {
      console.error("Error in handleEyeClick:", err);
      setError(err instanceof Error ? err.message : "Failed to load gifts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = document.querySelector(".carousel-container");
    if (container) {
      const scrollAmount = 300; // Adjust this value as needed
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
      setScrollPosition(container.scrollLeft);
    }
  };

  const handlePowerUpWallet = async () => {
    // Check for bundle selection
    if (selectedBundles.size === 0) {
      setErrorforPowerUpWallet("Please select at least one Gift Catalog");
      return;
    }

    // Check if template is selected and has required fields
    const templateType = templateData.type;
    const requiredFields = {
      template1: templateData.description && templateData.videoLink,
      template2: templateData.description && templateData.date,
      template3: templateData.description && templateData.buttonLink,
      template4: templateData.description && templateData.buttonLink,
    };

    if (!templateType || !requiredFields[templateType]) {
      setErrorforPowerUpWallet(
        !templateType
          ? "Please select a template"
          : "Please customize the selected template with required fields"
      );
      return;
    }

    try {
      if (!userId) {
        toast.error("Please login to continue");
        return;
      }

      // Get values from selected bundles
      const selectedBundleObjects = Array.from(selectedBundles).map(bundleId =>
        bundles.find(b => b._id === bundleId)
      ).filter(bundle => bundle !== undefined) as Bundle[];

      console.log("Selected bundles for saving:", selectedBundleObjects);
      console.log("Current hyperPersonalization toggle state:", hyperPersonalization);
      console.log("Current template data:", templateData);

      // Generate template URL
      const baseUrl = window.location.origin;
      const templateNumber = templateData.type.replace('template', '');
      const templateUrl = `${baseUrl}/public-landing-2/${templateNumber}`;

      // Update existing playbook with all the data
      const updateData = {
        bundleIds: Array.from(selectedBundles),
        budget: budget.max,
        sending_mode: sendMode === "permission" ? "permission_based" : "direct",
        hyper_personalization: hyperPersonalization,
        template: templateData,
        cta_link: templateUrl,  // Add the template URL here
        status: "Active",
      };

      console.log("Saving playbook data:", updateData);
      console.log("Saving to playbook ID:", playbookId);

      const response = await fetch(`/api/playbooks/${playbookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      console.log("Save response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please login to save changes");
          return;
        }
        throw new Error(data.error || "Failed to save playbook data");
      }

      // Verify the saved data
      console.log("Verifying saved playbook data:", {
        saved_hyper_personalization: data.playbook.hyper_personalization,
        current_state: hyperPersonalization,
        match: data.playbook.hyper_personalization === hyperPersonalization,
        saved_template_url: data.playbook.cta_link,
        expected_template_url: templateUrl
      });

      console.log("Playbook updated successfully:", data.playbook);
      toast.success("Playbook settings saved successfully!");

      // Get all current query parameters
      const currentParams = new URLSearchParams(searchParams.toString());
      // Add a source parameter to indicate we're coming from gift selection
      currentParams.append('source', 'gift_selection');

      // Redirect to wallet page with existing query parameters and source
      router.push(`/dashboard/wallet?${currentParams.toString()}`);

      setBlock({
        giftVisible: false,
        giftStrategyVisible: false,
      });
    } catch (error) {
      console.error("Error saving playbook:", error);
      toast.error("Failed to save playbook settings");
    }
  };

  // Add effect to monitor hyper-personalization changes
  useEffect(() => {
    console.log("Hyper-personalization state changed:", hyperPersonalization);
  }, [hyperPersonalization]);

  // Add effect to log RangeSlider props
  useEffect(() => {
    console.log("RangeSlider props:", {
      initialMin: budget.min,
      initialMax: budget.max,
      currentBudget: budget
    });
  }, [budget]);

  // Add effect to log bundle selection changes
  useEffect(() => {
    if (bundles.length > 0 && selectedBundles.size > 0) {
      const selectedBundleObjects = Array.from(selectedBundles)
        .map(id => bundles.find(b => b._id === id))
        .filter(bundle => bundle !== undefined);

      console.log("Selected bundles changed:", {
        bundles: selectedBundleObjects.map(b => ({
          id: b?._id,
          personalization: b?.isAvailable
        }))
      });
    }
  }, [selectedBundles, bundles]);

  return (
    <div className={`${block.giftVisible ? "block h-fit pt-72" : "hidden"}`}>
      {/* //!-------------------------------- slider container -------------------------------- */}
      <div className="w-[800px] mx-auto">
        <p className="text-lg font-semibold ">Individual Gift Budget:</p>
        {/* container of slider */}
        <div className="mt-10 px-24">
          <RangeSlider
            key={`slider-${playbookId}-${budget.max}`} // Force re-render when playbook or budget changes
            setBudget={handleBudgetChange}
            initialMin={0}
            initialMax={budget.max}
          />
        </div>
      </div>
      {/* //!-------------------------------- Gift catalog -------------------------------- */}
      <div className="w-[800px] mx-auto mt-10">
      <p className="text-lg font-semibold ">Select Gift Catalog:</p>
        <div className="w-[800px] grid grid-cols-4 gap-x-[30px] gap-y-[8px] mx-auto mt-4">
          {bundles.slice(0, 4).map((bundle) => (
            <GiftCard
              key={bundle._id}
              bundle={bundle}
              isSelected={selectedBundles.has(bundle._id)}
              onCheckboxChange={() => handleCheckboxChange(bundle)}
              onEyeClick={() => handleEyeClick(bundle)}
            />
          ))}
        </div>
        {/* //!-------------------------------- Toggle Switch -------------------------------- */}
        <div className="flex items-center justify-between mt-10">
          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={hyperPersonalization}
                  onChange={(e) => {
                    setHyperPersonalization(e.target.checked);
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <span className="text-base font-semibold">
              Hyper-personalization:
            </span>
          </div>

          {/* Delivery Type */}
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold">Delivery Type:</span>
            <div className="flex gap-2">
              <div className="flex gap-2 border border-[#F2F4F7] bg-[#F9FAFB] rounded-lg p-1 font-medium text-xs w-fit">
                <button
                  className={`py-1 px-3 rounded-md ${
                    sendMode !== "permission"
                      ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                      : "text-[#667085] hover:bg-white/50"
                  }`}
                  onClick={() => setSendMode("direct")}
                >
                  Direct
                </button>
                <button
                  className={`py-1 px-3 rounded-md ${
                    sendMode === "permission"
                      ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                      : "text-[#667085] hover:bg-white/50"
                  }`}
                  onClick={() => setSendMode("permission")}
                >
                  Permission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* //!-------------------------------- Carousel of Modal -------------------------------- */}
      <hr className="w-[800px] mx-auto mt-14 bg-[#E5E7EB] h-[2px]" />
      <h3 className="text-lg font-semibold mx-auto mt-10 w-[800px]">
        Select and Customise Template
      </h3>
      <div className="relative max-w-[1000px] mx-auto mt-4">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll("left")}
          className="absolute -left-2 top-1/2 -translate-y-1/2 flex-shrink-0 bg-primary-xlight opacity-40 p-4 rounded-lg hover:opacity-80 duration-300"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Carousel Container */}
        <div className="w-[800px] mx-auto">
          <div className="flex gap-4 overflow-x-auto carousel-container scroll-smooth p-2 scrollbar-hide">
            <Image
              src="/partner-integrations/template1.png"
              alt="carousel"
              className={`hover:scale-105 cursor-pointer duration-300 ${
                focusTemplate.template1 ? "outline outline-2 outline-primary" : ""
              }`}
              width={266}
              height={158}
              onClick={() => {
                setFocusTemplate({
                  template1: true,
                  template2: false,
                  template3: false,
                  template4: false,
                });
                setSelectedTemplate({
                  template1: true,
                  template2: false,
                  template3: false,
                  template4: false,
                });
                setTemplateData(prev => ({
                  ...prev,
                  type: "template1"
                }));
              }}
            />

            <Image
              src="/partner-integrations/template2.png"
              alt="carousel"
              className={`hover:scale-105 cursor-pointer duration-300 ${
                focusTemplate.template2 ? "outline outline-2 outline-primary" : ""
              }`}
              width={266}
              height={158}
              onClick={() => {
                setFocusTemplate({
                  template1: false,
                  template2: true,
                  template3: false,
                  template4: false,
                });
                setSelectedTemplate({
                  template1: false,
                  template2: true,
                  template3: false,
                  template4: false,
                });
                setTemplateData(prev => ({
                  ...prev,
                  type: "template2"
                }));
              }}
            />
            <Image
              src="/partner-integrations/template3.png"
              alt="carousel"
              className={`hover:scale-105 cursor-pointer duration-300 ${
                focusTemplate.template3 ? "outline outline-2 outline-primary" : ""
              }`}
              width={266}
              height={158}
              onClick={() => {
                setFocusTemplate({
                  template1: false,
                  template2: false,
                  template3: true,
                  template4: false,
                });
                setSelectedTemplate({
                  template1: false,
                  template2: false,
                  template3: true,
                  template4: false,
                });
                setTemplateData(prev => ({
                  ...prev,
                  type: "template3"
                }));
              }}
            />
            <Image
              src="/partner-integrations/template4.png"
              alt="carousel"
              className={`hover:scale-105 cursor-pointer duration-300 ${
                focusTemplate.template4 ? "outline outline-2 outline-primary" : ""
              }`}
              width={266}
              height={158}
              onClick={() => {
                setFocusTemplate({
                  template1: false,
                  template2: false,
                  template3: false,
                  template4: true,
                });
                setSelectedTemplate({
                  template1: false,
                  template2: false,
                  template3: false,
                  template4: true,
                });
                setTemplateData(prev => ({
                  ...prev,
                  type: "template4"
                }));
              }}
            />
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll("right")}
          className="absolute -right-2 top-1/2 -translate-y-1/2 flex-shrink-0 bg-primary-xlight opacity-40 p-4 rounded-lg hover:opacity-80 duration-300"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <hr className="w-[800px] mx-auto mt-10 bg-[#E5E7EB] h-[2px]" />
      <button
        onClick={handlePowerUpWallet}
        className="flex mx-auto mt-16 hover:opacity-95 text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg"
      >
        <Image src="/svgs/Shimmer.svg" alt="Shimmer" width={24} height={24} />
        Power Up Wallet
      </button>
      {errorforPowerUpWallet && (
        <p className="text-red-500 text-sm font-medium text-center mt-2">
          {errorforPowerUpWallet}
        </p>
      )}
      {/* //todo Modal -------------------------------- Carosel Template modal -------------------------------- */}
      <TemplateModal
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        onTemplateDataChange={setTemplateData}
      />
      {/*//todo Modal -------------------------------- Modal for gift selection -------------------------------- */}
      <div
        className={`${
          modal ? "translate-x-0" : "translate-x-full"
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
              {bundleGifts.map((gift, index) => (
                <div
                  key={gift._id + index}
                  className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                >
                  <div className="flex gap-3 items-center">
                    <Checkbox
                      id={`gift-card-${gift.name}`}
                      checked={selectedGiftsInModal.has(gift._id)}
                      onChange={() =>
                        handleGiftSelect(currentBundle?._id || "", gift._id)
                      }
                    />
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
              ))}
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
    </div>
  );
}
