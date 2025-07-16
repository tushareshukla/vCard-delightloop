import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import InfinityLoader from "../common/InfinityLoader";
import TableRow from "../table/TableRow";
import { CampaignComponentProps } from "@/lib/types/campaign";
import { EnrichStateType, Recipient } from "@/lib/types/recipient";
import Checkbox from "../common/Checkbox";
import RangeSlider from "../common/RangeSlider";
import Cookies from "js-cookie";

export default function ProfileDiscovered({
  setHiddenBlocks,
  hiddenBlocks,
  campaignId,
  setEnrichSelectedRecipients,
  enrichSelectedRecipients,
  goalOfCampaign,
  goalOfCampaignIsDirect,
  setGoalOfCampaignIsDirect,
  IsSimilarProfileClickedInProfileDiscovered,
  setIsSimilarProfileClickedInProfileDiscovered,
  campaignDataForCreateMorePipeline,
}: CampaignComponentProps) {
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  //   const [budget, setBudget] = useState({ min: 0, max: 250 });
  const [targetProfile, setTargetProfile] = useState({ min: 0, max: 100 });
  const [filteredRecipients, setFilteredRecipients] =
    useState<Recipient[]>(recipients);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [cohortGiftRecommendationChecked, setCohortGiftRecommendationChecked] =
    useState(false);
  const [profileDiscoverySelectAll, setProfileDiscoverySelectAll] =
    useState(false);
  const [
    profileDiscoverySelectedRecipients,
    setProfileDiscoverySelectedRecipients,
  ] = useState<Set<string>>(new Set());

  const [enrichState, setEnrichState] = useState<EnrichStateType[]>([]);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [selectFimilarProfile, setSelectFimilarProfile] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  // console.log(profileDiscoverySelectedRecipients,"dskjfkjjgk🥰🥰")
  const handleTargetProfileChange = useCallback((min: number, max: number) => {
    console.log("Setup-Budget handleBudgetChange:", { min, max });
    setTargetProfile({ min, max });
  }, []);

  useEffect(() => {
    if (campaignId) {
      setLoading(true);

      // Check if we have data from previous component
      if (campaignDataForCreateMorePipeline?.type === "contact-lists") {
        // Just fetch the recipients data for display
        const fetchListRecipients = async () => {
          try {
            const response = await fetch(
              `/api/lists/recipients?listIds=${campaignDataForCreateMorePipeline.listIds.join(
                ","
              )}`
            );
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to fetch list recipients");
            }

            setRecipients(data.recipients);
            // Initialize with all recipients selected
            setProfileDiscoverySelectedRecipients(
              new Set(data.recipients.map((r) => r._id || ""))
            );
            setProfileDiscoverySelectAll(true);
          } catch (err) {
            console.error("Error fetching list recipients:", err);
            setError(
              err instanceof Error ? err.message : "Failed to fetch recipients"
            );
          } finally {
            setLoading(false);
          }
        };

        fetchListRecipients();
      } else {
        // Regular fetch for campaign recipients
        const fetchRecipients = async () => {
          try {
            const response = await fetch(
              `/api/recipients?campaignId=${campaignId}`
            );
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to fetch recipients");
            }

            setRecipients(data.recipients);
            // Initialize with all recipients selected
            setProfileDiscoverySelectedRecipients(
              new Set(data.recipients.map((r) => r._id || ""))
            );
            setProfileDiscoverySelectAll(true);
          } catch (err) {
            console.error("Error fetching recipients:", err);
            setError(
              err instanceof Error ? err.message : "Failed to fetch recipients"
            );
          } finally {
            setLoading(false);
          }
        };

        fetchRecipients();
      }
    }
  }, [campaignId, campaignDataForCreateMorePipeline]);

  useEffect(() => {
    if (recipients.length > 0) {
      const allSelected = recipients.every((r) =>
        profileDiscoverySelectedRecipients.has(r._id || "")
      );
      setProfileDiscoverySelectAll(allSelected);
    }
  }, [profileDiscoverySelectedRecipients, recipients]);

  const handleProfileDiscoverySelectAll = () => {
    if (profileDiscoverySelectAll) {
      setProfileDiscoverySelectedRecipients(new Set());
    } else {
      setProfileDiscoverySelectedRecipients(
        new Set(recipients.map((r) => r._id || ""))
      );
    }
    setProfileDiscoverySelectAll((prev) => !prev);
  };

  const handleProfileDiscoveryRecipientSelect = (
    recipientId: string,
    isSelected: boolean
  ) => {
    setProfileDiscoverySelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(recipientId);
      } else {
        newSet.delete(recipientId);
      }
      return newSet;
    });
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

  //------->Search function for Recipient list
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

  useEffect(() => {
    setFilteredRecipients(recipients);
  }, [recipients]);

  const handleEnrich = async () => {
    // Check if any recipients need enrichment (missing LinkedIn URL or address)
    if (
      recipients.some(
        (recipient) => !recipient.linkedinUrl || !recipient.address
      )
    ) {
      // Initialize enrichment state for all recipients that need enrichment
      const recipientsToEnrich = recipients.filter(
        (r) => !r.linkedinUrl || !r.address
      );

      setEnrichState(
        recipientsToEnrich.map((recipient) => ({
          email: recipient.mailId,
          status: "pending",
        }))
      );

      // Process each recipient that needs enrichment
      await Promise.all(
        recipientsToEnrich.map(async (recipient) => {
          if (!recipient.mailId) return;

          try {
            // Call external enrichment service
            const res = await fetch(
              "https://hook.us2.make.com/039h8avvxhytcjuvp39isygtjvjba484",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: recipient.mailId }),
              }
            );

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const responseData = await res.json();
            console.log("Enrichment API response:", responseData); // Debug log

            const updates: {
              mailId: string;
              linkedinUrl?: string;
              address?: string;
            } = {
              mailId: recipient.mailId,
            };

            // Only update fields that are empty and have new data
            if (!recipient.linkedinUrl && responseData.hs_linkedin_url) {
              updates.linkedinUrl = responseData.hs_linkedin_url;
            }

            // Check for address in all possible response fields
            if (!recipient.address) {
              const addressFromAPI =
                responseData.address || responseData.hs_address;
              if (addressFromAPI) {
                updates.address = addressFromAPI;
              }
            }

            // Only make API call if we have updates
            if (updates.linkedinUrl || updates.address) {
              console.log("Sending updates to backend:", updates); // Debug log
              const putRes = await fetch(
                `/api/recipients?campaignId=${campaignId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updates),
                }
              );

              if (!putRes.ok) {
                throw new Error(
                  `Failed to update recipient. Status: ${putRes.status}`
                );
              }

              // Log the response from the update API
              const updateResponse = await putRes.json();
              console.log("Backend update response:", updateResponse);

              setEnrichState((prevState) =>
                prevState.map((item) =>
                  item.email === recipient.mailId
                    ? { ...item, status: "success" }
                    : item
                )
              );
            }
          } catch (error) {
            console.error("Error in enrichment:", error);
            setEnrichState((prevState) =>
              prevState.map((item) =>
                item.email === recipient.mailId
                  ? { ...item, status: "failed" }
                  : item
              )
            );
          }
        })
      );

      // Refresh the recipients list
      try {
        const response = await fetch(
          `/api/recipients?campaignId=${campaignId}`,
          { method: "GET" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch recipients");
        }

        setRecipients(data.recipients);
        setFilteredRecipients(data.recipients);
        setHasEnriched(true);
      } catch (error) {
        console.error("Error refreshing recipients:", error);
      }
    } else {
      console.log("All records have LinkedIn URLs and addresses");
    }
  };

  console.log(recipients, "🙂🙂🙂");

  const updateRecipientCount = async () => {
    try {
      console.log('[Update Recipient Count] Updating recipient count',recipients.length );
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_recipients: recipients.length,
          metrics: {
            totalRecipients: recipients.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipient count");
      }

      console.log("Successfully updated recipient count");
    } catch (error) {
      console.error("Error updating recipient count:", error);
    }
  };

  const handleFindPerfectGift = async () => {
    console.log('[Find Perfect Gift] Starting process');
    
    // Get selected and unselected recipients
    const selectedRecipients = recipients.filter(recipient => profileDiscoverySelectedRecipients.has(recipient._id || ""));
    
    const unselectedRecipients = recipients.filter(recipient => !profileDiscoverySelectedRecipients.has(recipient._id || ""));
    
    console.log('[Find Perfect Gift] Selected Recipients:', {
      count: selectedRecipients.length,
      recipients: selectedRecipients.map(recipient => ({
        id: recipient._id,
        name: `${recipient.firstName} ${recipient.lastName}`,
        email: recipient.mailId
      }))
    });
    
    console.log('[Find Perfect Gift] Unselected Recipients:', {
      count: unselectedRecipients.length,
      recipients: unselectedRecipients.map(recipient => ({
        id: recipient._id,
        name: `${recipient.firstName} ${recipient.lastName}`,
        email: recipient.mailId
      }))
    });

    // Delete unselected recipients
    if (unselectedRecipients.length > 0) {
      console.log('[Find Perfect Gift] Deleting unselected recipients');
      try {
        const deleteResponse = await fetch('/api/recipients/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientIds: unselectedRecipients.map(recipient => recipient._id)
          })
        });

        const data = await deleteResponse.json();
        
        if (!data.success) {
          console.error('[Find Perfect Gift] Failed to delete unselected recipients:', data.error);
          throw new Error(data.error || 'Failed to delete unselected recipients');
        }

        console.log('[Find Perfect Gift] Successfully deleted unselected recipients:', {
          count: data.deletedCount
        });

        // Update all relevant states
        setRecipients(selectedRecipients);
        setFilteredRecipients(selectedRecipients);
        setProfileDiscoverySelectedRecipients(new Set(selectedRecipients.map(r => r._id || "")));
        setProfileDiscoverySelectAll(true); // Since all remaining recipients are selected
        console.log('[Find Perfect Gift] Updated all states with selected recipients only');

        // Update recipient count with selected recipients count
        console.log('[Find Perfect Gift] Updating recipient count with selected recipients:', selectedRecipients.length);
        const updateResponse = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            total_recipients: selectedRecipients.length,
            metrics: {
              totalRecipients: selectedRecipients.length,
            },
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update recipient count");
        }

        console.log('[Find Perfect Gift] Successfully updated recipient count in campaign');
      } catch (error) {
        console.error('[Find Perfect Gift] Error in the process:', error);
        throw error;
      }
    }
    
    // Continue with the existing gift finding logic
    if (goalOfCampaign === "create more pipeline") {
      try {
        if (campaignDataForCreateMorePipeline?.listIds) {
          const response = await fetch("/api/recipients/from-lists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              listIds: campaignDataForCreateMorePipeline.listIds,
              campaignId,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to process lists");
          }
        }
        // Continue with the campaign update

        // setGoalOfCampaignIsDirect(true);
        const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetProfile: targetProfile,
            goal: "Create More Pipeline",
            //   status: "list building",
          }),
        });

        if (campaignResponse.ok) {
          setHiddenBlocks((prev) => ({
            ...prev,
            setupBudget: false,
          }));
          setShouldScrollToBottom(true);
        }
      } catch (error) {
        console.error("Error processing lists:", error);
        // Handle error appropriately
      }
    } else {
      // Handle regular flow without list processing
      setHiddenBlocks((prev) => ({
        ...prev,
        setupBudget: false,
      }));
      setShouldScrollToBottom(true);
    }
  };
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const organizationId = Cookies.get("organization_id");
        const authToken = Cookies.get("auth_token");

        console.log("Checking credentials:", { organizationId, campaignId, authToken });

        if (!organizationId || !authToken) {
          console.log("Missing required data");
          return;
        }

        const response = await fetch(`/api/campaigns/${campaignId}`);
        const data = await response.json();
        console.log("Campaign data fetched:", data?.data);
        setCampaignData(data?.data);
        // if(data?.data?.total_recipients > 0){
        //     console.log("Total recipients:", data?.data?.total_recipients);
        //     setHiddenBlocks((prev) => ({
        //         ...prev,
        //         setupBudget: false,
        //       }));
        //       setShouldScrollToBottom(true);
        // }

      } catch (error) {
        console.error("Error fetching campaign data:", error);
      }
    };

    if (campaignId) {
      console.log("CampaignId changed, fetching new data:", campaignId);
      fetchCampaignData();
    }
  }, [campaignId]); // Fixed closing brackets and dependency array

  const saveCampaignDetails = async () => {
    try {
      // 1. Create a new list with campaign name + date in correct format
      const date = new Date();
      const formattedDate = `${date.getDate()}${date.toLocaleString("default", {
        month: "short",
      })}${date.getFullYear().toString().slice(2)} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}`;
      const listName = `${
        campaignDataForCreateMorePipeline?.name || "Campaign"
      } ${formattedDate} Similar Profile ${date.getDate()}${date.toLocaleString(
        "default",
        { month: "short" }
      )}`;

      const listResponse = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: listName,
          description: "Auto-generated list for similar profiles",
          source: { manual: true, csv: false, crm: { type: null } },
          tags: ["similar-profiles"],
          status: "processing",
        }),
      });

      if (!listResponse.ok) {
        throw new Error("Failed to create list");
      }

      const listData = await listResponse.json();
      const listId = listData.data._id;

      // 2. Start lookalike search job
      const selectedRecipients = recipients.filter((r) =>
        profileDiscoverySelectedRecipients.has(r._id || "")
      );
      const linkedinUrls = selectedRecipients
        .map((recipient) => recipient.linkedinUrl)
        .filter((url) => url);

      if (linkedinUrls.length === 0) {
        throw new Error("Selected recipients must have LinkedIn profiles");
      }

      // First update campaign status to 'list building'
      const initialCampaignUpdate = await fetch(
        `/api/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetProfile: targetProfile,
            goal: "Create More Pipeline",
            status: selectFimilarProfile ? "list building" : "draft",
            total_recipients: targetProfile.max,
            //   status: 'list building',
            listId: listId,
          }),
        }
      );

      if (!initialCampaignUpdate.ok) {
        throw new Error("Failed to update campaign status");
      }

      // Start the lookalike job
      const lookalikesResponse = await fetch(`/api/lists/${listId}/lookalike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkedinUrls,
          count: targetProfile.max,
          vendor:
            process.env.NEXT_PUBLIC_USE_OCEAN_SERVICE === "true"
              ? "ocean"
              : "linkedin",
          campaignId: campaignId,
          onComplete: {
            updateCampaign: true, // Signal to update campaign status on job completion
            status: "ready to launch", // Status to set when job completes
          },
        }),
      });

      if (!lookalikesResponse.ok) {
        throw new Error("Failed to start lookalike search");
      }

      // Update UI to reflect background processing
      setGoalOfCampaignIsDirect(true);
      setHiddenBlocks((prev) => ({
        ...prev,
        // launch: false,
        setupBudget: false,
      }));
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error("Error in saveCampaignDetails:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process similar profiles"
      );
    }
  };

  return (
    <div
      className={`w-full  grid justify-center relative z-10  pt-10  ${
        hiddenBlocks.setupBudget ? "h-[100vh] " : "h-fit"
      }`}
    >
      <div className="w-[1005px] h-fit">
        <div className={`${hiddenBlocks.setupBudget ? "pb-[40px] " : "pb-4 "}`}>
          {/* //? sucessfully enriched and how many enriched */}
          <div>
            {/* 1 */}
            {/* <div className="flex items-center gap-2 justify-center">
              <Image src="svgs/Laugh.svg" alt="tick" width={18} height={18} />
              <p className="text-sm font-medium text-black">
                Your CSV data has been imported successfully.
              </p>
            </div> */}
            {/* 2 */}
            <div className="flex items-center gap-2 justify-center  font-medium bg-[#F1E5FF] border border-[#E3CEFE] rounded-lg p-2 w-fit mx-auto mt-2 mb-[33px]">
              {/* imported */}
              <div className="flex items-center gap-1">
                <Image src="svgs/Tick3.svg" alt="tick" width={20} height={20} />
                <p className="text-sm font-medium ">
                  <span className="font-bold text-[15px]">
                    {recipients.length}
                  </span>
                  <span> Records imported {goalOfCampaign}</span>
                </p>
              </div>
              {/* skipped and errored */}
              {/* <div className="flex items-center gap-1 text-sm ">
                <span className="text-sm font-bold">1</span> Record has
                error
                <Image src="svgs/Alert.svg" alt="tick" width={20} height={20} />
              </div> */}
            </div>
          </div>
          {/* //? attendee list  search and enrich record and filter */}
          <div className="flex items-center justify-between gap-2">
            {/* search */}
            <div className="relative shadow-sm ">
              <input
                type="text"
                placeholder="Search Attendees"
                className="w-[294px] pl-9 h-[36px] rounded-lg border border-[#D0D5DD] px-[14px] py-[8px] focus:outline-none focus:border-primary-light"
                onChange={handleSearch}
              />
              <Image
                src="svgs/search.svg"
                alt="search"
                className="absolute opacity-70  top-[9px] left-3"
                width={18}
                height={18}
              />
            </div>
            {/* this is a container of enrich record and filter */}
            <div className="flex items-center gap-[10px]">
              {!hasEnriched &&
                Cookies.get("user_email") == "harsha@delightloop.com" && (
                  <button
                    className={`font-semibold shadow-sm duration-300 flex items-center px-5 py-1.5 gap-2 rounded-lg
bg-primary text-white hover:bg-opacity-95`}
                    onClick={handleEnrich}
                    disabled={
                      Cookies.get("user_email") == "harsha@delightloop.com"
                    }
                  >
                    <Image
                      src="svgs/Shimmer.svg"
                      alt="enrich"
                      width={26}
                      height={26}
                    />
                    Enrich Records
                  </button>
                )}
              {Cookies.get("user_email") == "harsha@delightloop.com" && (
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border bg-white border-[#D0D5DD] font-medium text-[#344054] hover:bg-gray-50 shadow-sm">
                  <Image
                    src="svgs/Filter.svg"
                    alt="filter"
                    width={18}
                    height={12}
                  />
                  Filters
                </button>
              )}
            </div>
          </div>
          {/* //? Table  */}
          <div
            className={`border-[#D2CEFE] relative   border rounded-lg bg-white mt-4 duration-300  overflow-y-auto ${
              viewMore
                ? "h-[50vh] 2xl:h-[60vh] max-h-fit"
                : filteredRecipients.length === 0
                ? "h-[100px]" // Compact height for no results
                : " h-[40vh] max-h-fit  2xl:h-[50vh]"
            }`}
          >
            <table className="w-full font-medium text-xs">
              <thead className="sticky top-0 border-b-[1px] border-[#D2CEFE] bg-[#F4F3FF] z-10 text-[#101828] uppercase font-semibold text-[12px]">
                <tr>
                  <th className="pl-4">
                    <Checkbox
                      id="profile-discovery-select-all"
                      checked={profileDiscoverySelectAll}
                      onChange={handleProfileDiscoverySelectAll}
                    />
                  </th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">email</th>
                  <th className="p-4 text-left">Linkedin</th>
                  <th className="p-4 text-left">role</th>
                  <th className="p-4 text-left">company name</th>
                  <th className="p-4 text-left">
                    <div className="relative flex items-center gap-2 group">
                      address
                      <Image
                        src="svgs/Alert.svg"
                        alt="info"
                        width={16}
                        height={16}
                      />
                      <div className="absolute top-6 right-8 w-[300px] bg-[#101828] text-white rounded-lg py-3 px-4 group-hover:block hidden text-xs font-normal normal-case">
                        <div className="size-4 bg-[#101828] absolute -top-1.5 right-8 rotate-45"></div>
                        <p className="leading-5">
                          For your privacy and security, the full address is not
                          displayed. Rest assured, all deliveries are handled
                          with utmost confidentiality.
                        </p>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D2CEFE] cursor-pointer">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="h-20">
                      <div className="flex justify-center items-center h-full">
                        <InfinityLoader width={40} height={40} />
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-4 text-center text-red-500 h-20"
                    >
                      {error}
                    </td>
                  </tr>
                ) : recipients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center h-20">
                      No recipients found
                    </td>
                  </tr>
                ) : filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center h-30 text-bold">
                      No results found
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredRecipients?.map((recipient) => (
                      <TableRow
                        key={recipient._id}
                        recipient={recipient}
                        enrichState={enrichState}
                        isSelected={profileDiscoverySelectedRecipients.has(
                          recipient._id || ""
                        )}
                        onSelectChange={(isSelected) =>
                          handleProfileDiscoveryRecipientSelect(
                            recipient._id || "",
                            isSelected
                          )
                        }
                        addressMaskImage="/AddressMask.png"
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div
            onClick={() => setViewMore(true)}
            className={` shadow-sm w-fit mx-auto -mt-4 relative z-10    hover:shadow-md cursor-pointer bg-white text-[#10182880] text-center text-xs font-medium  py-2.5  px-3  rounded-lg ${
              viewMore ? "hidden" : "block"
            }`}
          >
            View More
          </div>
        </div>
        {/* //! cohort gift recommendation */}
        {goalOfCampaign === "create more pipeline" ? (
          <>
            {IsSimilarProfileClickedInProfileDiscovered && (
              <>
                {hiddenBlocks.setupBudget && (
                  <>
                    {selectFimilarProfile && (
                      <>
                        <p className="text-center text-sm font-medium w-full mb-12">
                          How many similar profiles would you like to find? choose a range below.
                        </p>
                        <div className=" px-[221px] opacity-90">
                          <RangeSlider
                            setBudget={handleTargetProfileChange}
                            notMoney={true}
                            initialMin={0}
                            initialMax={100}
                          />
                        </div>
                      </>
                    )}
                    <button
                      className="flex items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-10 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95 "
                      onClick={() => {
                        if (!selectFimilarProfile) {
                          setSelectFimilarProfile(true);
                        } else {
                          saveCampaignDetails();
                        }
                      }}
                    >
                      <Image
                        src="svgs/Shimmer.svg"
                        alt="shimmers"
                        className=""
                        width={22}
                        height={22}
                      />
                      Find {selectFimilarProfile ? "" : "Similar"}
                    </button>
                    <div
                      className={` text-center text-sm font-medium text-gray-500 mt-3 ${
                        selectFimilarProfile ? "hidden" : "block"
                      }`}
                    >
                      OR
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div
            className={`flex items-center gap-2 justify-center text-sm font-medium text-[#101828] ${
              hiddenBlocks.setupBudget ? "flex" : "hidden"
            }`}
          >
            {/* <Checkbox
              id="cohort-gift-recommendation"
              checked={cohortGiftRecommendationChecked}
              onChange={() =>
                setCohortGiftRecommendationChecked(
                  !cohortGiftRecommendationChecked
                )
              }
            />
            <p>Cohort Gift Recommendations</p> */}
          </div>
        )}
        {!IsSimilarProfileClickedInProfileDiscovered && (
          <button
            onClick={handleFindPerfectGift}
            className={`${
              hiddenBlocks.setupBudget ? "flex" : "hidden"
            }  items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-4 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
          >
            <Image
              src="svgs/Shimmer.svg"
              alt="shimmers"
              className=""
              width={22}
              height={22}
            />
            Find the Perfect Gift
          </button>
        )}

        {/* //? container of how may simplica nad slider  */}

        {/* //? button */}
        {!selectFimilarProfile && (
          <button
            onClick={handleFindPerfectGift}
            className={`${
              hiddenBlocks.setupBudget ? "flex" : "hidden"
            }  items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-4 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
          >
            <Image
              src="svgs/Shimmer.svg"
              alt="shimmers"
              className=""
              width={22}
              height={22}
            />
            Find the Perfect Gift
          </button>
        )}

        {/* //! for new pipeline  */}

        {/* //? checkbox */}

        {/* <div className="flex items-center gap-2 mt-4">
          <div className="relative w-4 h-4">
            <input
              type="checkbox"
              className="peer absolute w-4 h-4 opacity-0 cursor-pointer"
            />
            <div className="w-4 h-4 border border-[#D2CEFE] rounded peer-checked:bg-none peer-checked:border-primary"></div>
            <Image
              src="svgs/Tick.svg"
              alt="check"
              width={12}
              height={12}
              className="absolute top-[2.5px] left-[2.5px] pointer-events-none hidden peer-checked:block"
            />
          </div> */}
        {/* <p className="text-xs font-medium text-[#10182880]">
            Keep Building My List in the Background
          </p>
        </div>
        <p className="text-xs font-medium text-primary mt-[26px] border-b-[1px] border-[#D2CEFE] pb-4">
          Continuing to find more profiles… We&apos;ll notify you when new
          profiles are added.
        </p> */}
      </div>
    </div>
  );
}
