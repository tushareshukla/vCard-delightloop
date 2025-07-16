import Radio from "../common/Radio";
import Image from "next/image";
import Logo from "../common/Logo";
import { useEffect, useRef, useState } from "react";
import InfinityLoader from "../common/InfinityLoader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from 'next/link';


type SidebarProps = {
  hiddenBlocks: {
    campaignDetails?: boolean;
    profileDiscovered?: boolean;
    setupBudget?: boolean;
    giftRecommendations?: boolean;
    launch?: boolean;
  };
  setCampaignId: (id: string) => void;
  campaignId: string;
  giftassigned: boolean;
};

export default function Sidebar({
  hiddenBlocks,
  setCampaignId,
  campaignId,
  giftassigned,
}: SidebarProps) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth();
  const [campaignName, setCampaignName] = useState<string>("");
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const hasInitialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCookies) {
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push('/');
        return;
      }
    }
  }, [authToken, router, isLoadingCookies]);

  const handleSaveCampaignName = async (name: string) => {
    setLoading(true);

    try {
      if (!organizationId || !userId) {
        throw new Error("Missing organization ID or user ID");
      }

      let response;

      // If we have a campaign ID, update the existing campaign
      if (campaignId) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              name: name,
            }),
          }
        );
      }
      // Otherwise create a new campaign
      else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/users/${userId}/campaigns`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              name: name,
            }),
          }
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to ${campaignId ? "update" : "create"} campaign: ${response.statusText
          }`
        );
      }

      const data = await response.json();

      // For new campaigns, set the campaign ID from the response
      if (!campaignId) {
        setCampaignId(data.campaign_id);
      }

      setIsSaved(true);
      setShowSaveButton(false);
      console.log(
        `Campaign ${campaignId ? "updated" : "created"} successfully`
      );
    } catch (error) {
      console.error(
        `Error ${campaignId ? "updating" : "creating"} campaign:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCampaignName(value);
    setIsSaved(false);
    setShowSaveButton(value.trim().length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && campaignName.trim()) {
      handleSaveCampaignName(campaignName);
    }
  };

  useEffect(() => {
    if (!isLoadingCookies) {

      initializeCampaign();
    }
  }, [isLoadingCookies]);

  const generateCampaignName = async (): Promise<string> => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
  
    const currentUser = userId;
  
    if (!currentUser) {
      return "Guest User";
    }
  
    let userName = "";
  
    try {
      const response = await fetch(`/api/users/${currentUser}`);
      const data = await response.json();
      if (data.success) {
        userName = `${data.data.firstName} ${data.data.lastName}`;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  
    return `${userName || currentUser
      } ${date}${month}${year} ${hours}-${minutes}`;
  };
  

  const initializeCampaign = async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const urlCampaignId = params.get("campaignId");
   
    if (!organizationId) {
      console.error("Missing organization ID or user ID");
      return;
    }

    // If we have a campaign ID in URL, fetch that campaign
    if (urlCampaignId) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${urlCampaignId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch campaign");

        const data = await response.json();
        console.log(data.campaign.name, "🥰🥰🥰 data in initializeCampaign");
        setCampaignName(data.campaign.name || "");
        setCampaignId(urlCampaignId);
        setIsSaved(true);
      } catch (error) {
        console.error("Error fetching campaign:", error);
      }
    }
    // If no campaign ID in URL, create new campaign
    else {
      try {
        const generatedName = await generateCampaignName();
        setCampaignName(generatedName);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/users/${userId}/campaigns`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ name: generatedName }),
          }
        );

        if (!response.ok) throw new Error("Failed to create campaign");

        const data = await response.json();
        console.log(data, "🥰🥰🥰 data in initializeCampaign");
        setCampaignId(data.campaign_id);
        setIsSaved(true);
      } catch (error) {
        console.error("Error creating campaign:", error);
      }
    }
  };

  return (
    // border-r border-gray-200 bg-white border-r border-gray-200
    <aside
      className={` z-40 grid grid-flow-col fixed top-0 inset-x-0 bg-primary-xlight bg-opacity-[0.98] `}
    >
      {/* //! (1) -------- Logo ----------- */}
      <div className="pl-10 w-fit">
        {/* //? (1) -------- logo ----------- */}
        <div className="mt-8 ml-1.5">
          <Logo />
        </div>
        {/*//? (2) -------- campaign name ----------- */}
        <div className="font-semibold ml-1.5 text-sm flex mt-[26px]  items-center gap-2 w-60">
          <input
            type="text"
            className="outline-none bg-transparent border-b-[1px] border-primary-light border-dotted placeholder-[#10182880]"
            placeholder="Campaign Name (Auto)"
            value={campaignName}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          {showSaveButton &&
            (loading ? (
              <InfinityLoader />
            ) : (
              <button
                onClick={() => handleSaveCampaignName(campaignName)}
                className="bg-primary-light text-white hover:bg-primary  text-xs font-semibold px-2 py-[3px]  rounded-md"
              >
                SAVE
              </button>
            ))}
          {isSaved && (
            <button
              onClick={() => {
                setIsSaved(false);
                setShowSaveButton(true);
              }}
            >
              <Image
                src="svgs/Edit.svg"
                alt="edit"
                className=""
                height={16}
                width={16}
              />
            </button>
          )}
        </div>
      </div>
      {/*//!-------- (2) container of all radio buttons ----------- */}
      <div
        className={` grid-flow-col gap-1 w-fit mt-11 -ml-[10%]  ${!giftassigned
            ? "grid"
            : hiddenBlocks.profileDiscovered
              ? "hidden"
              : "grid"
          }`}
      >
        <Radio
          mainText="Campaign details"
          status={
            !giftassigned
              ? "completed"
              : hiddenBlocks.campaignDetails
                ? "inactive"
                : hiddenBlocks.profileDiscovered
                  ? "active"
                  : "completed"
          }
          showLine={false}
        />
        <Radio
          mainText="Setting Target Goals"
          status={
            !giftassigned
              ? "completed"
              : hiddenBlocks.profileDiscovered
                ? "inactive"
                : hiddenBlocks.setupBudget
                  ? "active"
                  : "completed"
          }
          showLine={false}
        />
        <Radio
          mainText="Setting Up Budget"
          status={
            hiddenBlocks.setupBudget
              ? "inactive"
              : hiddenBlocks.giftRecommendations
                ? "active"
                : "completed"
          }
          showLine={false}
        />
        <Radio
          mainText="Gift Recommendations"
          status={
            hiddenBlocks.giftRecommendations
              ? "inactive"
              : hiddenBlocks.launch
                ? "active"
                : "completed"
          }
          showLine={true}
        />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <Link href="/delight-engage">
          <Image src="/svgs/Mail.svg" alt="Delight Engage" width={32} height={32} className="cursor-pointer hover:scale-110 transition-transform" />
        </Link>
      </div>
    </aside>
  );
}
