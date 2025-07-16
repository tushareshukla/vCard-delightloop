import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";


export default function CampaignTableRow({campaign,authToken,index}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const router = useRouter();
  const handleDraftClick = () => {
    if (campaign.status === "draft") {
      router.push(`/create-your-campaign?campaignId=${campaign._id}`);
    }
    else{
        router.push(`/campaign-detail/${campaign._id}`);
    }
  };

  useEffect(() => {
    if (!authToken) {
      console.log("No auth token found, redirecting to login...");
      router.push('/');
      return;
    }
    setTotalPrice(0);
    fetchTotalGiftCosts(campaign._id);
  }, [campaign._id]);

  const fetchTotalGiftCosts = async (campaignId:any) => {
    try {
      const baseUrl = await getBackendApiBaseUrl();
    if(campaign.status !== "draft"){
      const giftsTotalPriceResponse = await fetch(`${baseUrl}/v1/campaigns/${campaignId}/gifts-price`,{
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (giftsTotalPriceResponse.ok) {
        const data = await giftsTotalPriceResponse.json();
        console.log("campaignId", campaignId);
        console.log("data?.totalPrice", data?.totalPrice);
        console.log("data?.totalShippingCost", data?.totalShippingCost);
        console.log("data?.totalHandlingCost", data?.totalHandlingCost);
        //setTotalPrice(data?.totalPrice || 0 + data?.totalShippingCost || 0 + data?.totalHandlingCost || 0);
        const totalPrice = data?.totalPrice + data?.totalShippingCost + data?.totalHandlingCost;
        setTotalPrice(totalPrice);
      } 
      else{
        setTotalPrice(0);
      }
    } 
    } catch (error) {
      console.error("Error in fetchWalletBalance:", error);
    }
  };

  return (
    <tr className="border-t bg-[#FFFFFF] cursor-pointer hover:bg-[#f2f4f7] duration-300 ">
      {/* campaign name */}
      <td className="px-4 py-4  h-[20px] text-[14px] text-[#101828]  "  onClick={handleDraftClick}>
        <div
          className="text-[14px] text-[#101828] font-[400] max-w-[300px] line-clamp-1"
          title={campaign?.name}
        >
          {campaign?.name}
        </div>
        <div className="text-[14px] text-[#667085] font-[400]">
          {
            campaign?.goal === "delight_event_attendees" ? "Delight Event Attendees"
          : campaign?.goal === "create_more_pipeline" ? "Create More Pipeline"
          : campaign?.goal === "close_deal_faster" ? "Close Deal Faster"
          : campaign?.goal === "reduce_churn" ? "Reduce Churn"
          : campaign?.goal
          }
        </div>
      </td>

      {/* campaign status */}
      <td className="px-4 py-4">
        <div className="">
          <span
            className={`inline-flex items-center px-2  py-1 rounded-full w-fit text-xs ${
              campaign.name == "Takeout Campaign - Citrix"
                ? "bg-[#F9F5FF] text-[#6941C6] font-medium text-[12px]"
                : campaign.status === "live"
                ? "bg-[#ECFDF3] text-[#027A48] font-medium text-[12px]"
                : campaign.status === "completed"
                ? "bg-[#F9F5FF] text-[#6941C6] font-medium text-[12px]"
                : campaign.status === "draft"
                ? "bg-[#F2F4F7] text-[#344054] font-medium text-[12px] "
                : campaign.status === "waiting_for_approval" || campaign.status === "list_building"
                ? "bg-[#FEF6EE] text-[#B93815] font-medium text-[12px]"
                : campaign.status === "matching_gifts"
                ? "bg-[#FFF8E6] text-[#E67F05] font-medium text-[12px] flex items-center gap-1 "
                : campaign.status === "rejected"
                ? "bg-red-50 text-[#B93815] font-medium text-[12px]"
                : campaign.status === "ready_for_launch"
                ? "bg-[#EFF8FF] text-[#175CD3] font-medium text-[12px]"
                : "bg-pink-600"
            }`}
          >

            {
              <span
                className={`w-2 h-2 ${
                    // || campaign.status === "list building"
                  campaign.status == "waiting_for_approval"
                    ? "bg-red-500"
                    : campaign.status == "live"
                    ? "bg-[#12B76A]"
                    : "hidden"
                } rounded-full mr-2`}
              ></span>
            }
            <span className="capitalize">
            {
                campaign.status === "matching_gifts" || campaign.status === "list_building"
              ? <>
                  {campaign.status === "matching_gifts" ? "Matching Gifts" : "List Building"}
                  <span className="inline-flex gap-[2px] ml-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-[#E67F05] animate-[dot-loading_1.4s_ease-in-out_infinite]"
                        style={{
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </span>
                </>
              : campaign.status === "ready_for_launch" ? "Ready for Launch"
              : campaign.status === "waiting_for_approval" ? "Waiting for Approval"
              : campaign.status === "live" ? "Live"
              : campaign.status === "completed" ? "Completed"
              : campaign.status === "draft" ? "Draft"
              : campaign.status === "rejected" ? "Rejected"
              : campaign.status === "cancelled" ? "Cancelled"
              : campaign.status
              }
            </span>
          </span>
        </div>
      </td>

      {/* campaign start date */}
      <td className="px-4 py-2  text-sm font-normal whitespace-nowrap text-[#667085]">
        {campaign?.approvedAt && campaign?.approvedAt
          ? new Date(campaign?.approvedAt).toLocaleDateString(
              "en-US",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
          : ""}
      </td>

      {/* campaign end date */}
      <td className="px-4 py-2  text-sm font-normal whitespace-nowrap text-[#667085]">
        {campaign.campaignEndDate && campaign?.approvedAt
          ? new Date(campaign.campaignEndDate).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : ""}
      </td>

      {/* total recipients */}
      <td className="px-8 py-2  text-sm font-normal whitespace-nowrap text-[#667085] ">
        {campaign.total_recipients}
      </td>

      {/* progress bar */}
      <td className="px-4 py-2 ml-6">
        {campaign.status !== "list_building_notused" && (
        <div className="flex items-center justify-start ">
          <div className="flex items-center">
            <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
              <div
                className="h-full bg-purple-500 rounded-full animate-progressBar transition-all duration-1000 ease-in-out"
                style={{
                  width: `${
                    ((campaign.recipientSummary.statusCounts?.delivered + campaign.recipientSummary.statusCounts?.acknowledged) / campaign.total_recipients) * 100 || 0
                  }%`,
                }}
              ></div>
            </div>
            <span className="text-[#344054] text-sm font-normal">
              {campaign.recipientSummary.statusCounts?.delivered + campaign.recipientSummary.statusCounts?.acknowledged || 0}
              /{campaign.total_recipients}
            </span>
          </div>
          <div className={`text-xs ml-2 rounded-full px-2 py-1 `}>
            {Math.round(((campaign.recipientSummary.statusCounts?.delivered + campaign.recipientSummary.statusCounts?.acknowledged) / campaign.total_recipients) * 100) || 0}%
          </div>
        </div>
        )}
      </td>

      {/* total budget */}
      <td className="text-right whitespace-nowrap text-[#667085] text-sm font-normal">
        {/*{campaign.budget?.totalBudget > 0 ? `$ ${campaign.budget?.totalBudget}` : "---"}*/}
        {campaign.status !== "draft" ? `$${totalPrice}` : "---"}
      </td>

      {/* Menu Button */}
      <td className="relative px-4 py-2  text-[#101828] text-sm font-medium">
        { campaign.status !== "draft" ||
        campaign.name == "Takeout Campaign - Citrix" ? (
          <button
            onClick={toggleMenu}
            className={`w-[25px] h-[25px] rounded-lg
            ${
              menuVisible
                ? "bg-[#D1C4ED] text-blue-600"
                : "hover:bg-[#D1C4ED] hover:text-blue-600"
            }`}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <span
                key={i}
                className={`block h-1 w-1 rounded-full ${
                  menuVisible
                    ? "bg-[#6941C6]"
                    : campaign.status === "matching gifts"
                    ? "bg-[#F79009] animate-[dot-loading_1.4s_ease-in-out_infinite]"
                    : "bg-[#98A2B3]"
                } my-0.5 mx-auto`}
                style={{
                  animationDelay: campaign.status === "matching gifts" ? `${i * 0.2}s` : '0s'
                }}
              />
            ))}
          </button>
        ) : (
          <div></div>
        )}
        {menuVisible && (
          <div className="absolute w-[180px] text-sm right-0 bg-white shadow-lg rounded-md border p-2 space-y-2 z-10">

              <Link
                href={`/campaign-detail/${campaign._id}`}
                className="flex items-center w-full px-2 py-1  text-[#101828] hover:bg-gray-100 rounded"
                onClick={() => console.log("Details clicked")}
              >
                <span className="mr-1">
                  <Image
                    src="/svgs/eye.svg"
                    alt="Details Icon"
                    className="h-[13px] w-[18px]"
                    width={13}
                    height={18}
                  />
                </span>
                Campaign Detail
              </Link>
          </div>
        )}
      </td>
    </tr>
  );
}
