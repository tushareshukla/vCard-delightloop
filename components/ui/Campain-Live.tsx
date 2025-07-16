import Logo from "../common/Logo";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Campaign, HiddenBlocks } from "@/lib/types/campaign";
import { CampaignComponentProps } from "@/lib/types/campaign";
import { Caveat } from "next/font/google";


const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface CampainLiveProps {
  goalOfCampaign: string;
  campaignId: string;
  setHiddenBlocks: React.Dispatch<React.SetStateAction<HiddenBlocks>>;
  hiddenBlocks: HiddenBlocks;
  goalOfCampaignIsDirect: boolean;
  setGoalOfCampaignIsDirect: (value: boolean) => void;
  setHideAllForms: (value: boolean) => void;
  IsSimilarProfileClickedInProfileDiscovered: boolean;
  setIsSimilarProfileClickedInProfileDiscovered: (value: boolean) => void;
  campaignDataForCreateMorePipeline: Campaign;
}

export default function CampainLive({
  goalOfCampaign,
  campaignId,
  goalOfCampaignIsDirect,
  setGoalOfCampaignIsDirect,
  setHiddenBlocks,
  hiddenBlocks,
  setHideAllForms,
  IsSimilarProfileClickedInProfileDiscovered,
  campaignDataForCreateMorePipeline,
  setIsSimilarProfileClickedInProfileDiscovered
}: CampainLiveProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/campaigns/${campaignId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch campaign");
        }
        setCampaign(data.data);
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">Loading...</div>
    );
  }

  const handleFindPerfectGift = async () => {

    // const response = await fetch("/api/recipients/from-lists", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       listIds: campaignDataForCreateMorePipeline?.listIds,
    //       campaignId,
    //     }),
    // });
    setGoalOfCampaignIsDirect(true);
    setHiddenBlocks((prev) => ({
      ...prev,
      launch: true,
      campaignDetails: false,
      profileDiscovered: false,
      setupBudget: false,
    }));
    setIsSimilarProfileClickedInProfileDiscovered(false)
    setHideAllForms(false);
  }

  return (
    <div className="bg-[#F4F3FF] min-h-screen w-full ">
      <div className="h-max">
        <div className="pl-[46px] pt-[32px]">
          <Logo />
        </div>
        {/* {goalOfCampaign === "create more pipeline" ? ( */}
        {campaign?.status === "list_building" ? (
          <div>
            <Image
              src="/img/Streamline.png"
              alt="campaignLive"
              className="mx-auto mt-32"
              width={342}
              height={342}
            />
            <p className="text-center text-sm font-medium mt-5">
              List building in progress
              <span className="inline-flex gap-[2px] ml-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-black animate-[dot-loading_1.4s_ease-in-out_infinite]"
                        style={{
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </span>
            </p>
            {goalOfCampaignIsDirect ? (
              <>
                  <div className="flex justify-center gap-3 mt-[22px] relative z-10">
              <Link
                href="/dashboard"
                className="border bg-white border-[#D0D5DD] hover:bg-slate-50 text-xs font-medium text-[#344054] px-4 py-2.5 rounded-lg"
              >
                View Campaign Status
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-white hover:bg-primary-dark text-xs font-medium bg-primary px-4 py-2.5 rounded-lg"
              >
                Create Another Campaign
              </button>
            </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {


                   handleFindPerfectGift()
                  }}
                  className="flex z-50 relative items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-7 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95 w-fit"
                >
                  <Image
                    src="/svgs/Shimmer.svg"
                    alt="shimmers"
                    className=""
                    width={22}
                    height={22}
                  />
                  Let’s Find the Perfect Gift
                </button>
                <div className="text-center text-sm text-gray-500 font-medium mt-5">
                  OR
                </div>
                <div className="flex justify-center z-20 relative hover:underline ">
                  <Link
                    href="/dashboard"
                    className="text-primary font-medium  mt-2 text-center"
                  >
                    Checkout the Queue
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="relative z-10 hidden">
              {/* //? (1) gift image */}
              {/* <Image
                    src="/img/Gift.png"
                    alt="gift"
                    className="mx-auto"
                    height={117}
                    width={132}
                  /> */}
              {/* //? (2) campaign name & description */}
              {/* <div className="text-center  mt-[38px] grid gap-2">
                    <h1 className=" text-2xl font-medium ">Your Campaign Is Live!</h1>
                    <h2 className="font-medium text-sm">
                      Your gifts are being prepared and delivered to the selected
                      recipients. You can track progress in real-time.
                    </h2>
                  </div> */}
              {/* //? (3) Ticket */}
              <div className="bg-white rounded-lg shadow-sm mt-12 mx-auto  w-[651px] border-[#D2CEFE] border-[1px]">
                {/* //* (3.1) quick snapshot */}
                <div className="text-center font-medium text-sm py-3 border-b-[#D2CEFE] border-b-[1px] border-dashed relative">
                  {/* Here&apos;s a Quick Snapshot of Your Campaign */}
                  <Image
                    src="/svgs/last.svg.svg"
                    alt="gift"
                    className="mx-auto"
                    height={48}
                    width={48}
                  />
                  <p className="w-[455px] h-[40px] mx-auto mt-6 font-[500] text-[14px]">
                    Your gift selections have been sent for approval. We’ll
                    notify you once the approval process is complete.
                  </p>
                  {/* //* (3.1.1) left circle */}
                  <div className="bg-primary-xlight rounded-full size-5 border-t-[#D2CEFE] border-r-[#D2CEFE] rotate-45 border border-primary-xlight absolute -left-[11px] -bottom-[10px]"></div>
                  {/* //* (3.1.2) right circle */}
                  <div className="bg-primary-xlight rounded-full size-5 border-t-[#D2CEFE] border-r-[#D2CEFE] -rotate-[135deg] border border-primary-xlight absolute -right-[11px] -bottom-[10px]"></div>
                </div>

                {/* <Image
                      src="/img/campaignLive.png"
                      className="mx-auto my-7"
                      alt="lastgift"
                      height={274}
                      width={274}
                    /> */}
                <div className="flex justify-between items-center px-[84px] text-sm mt-8 ">
                  {/* campaign id */}
                  <div className="grid gap-2">
                    <div className="font-medium text-[#101828]">
                      {campaign?.name}
                    </div>
                    <div className="text-[#344054]">
                      Campaign ID: {campaign?._id}
                    </div>
                  </div>
                  {/* client logo */}
                  <div>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/svgs/flag.svg"
                          alt="calendar"
                          width={14}
                          height={14}
                        />
                        Delivered by
                      </div>
                      <div className="font-semibold text-base">
                      {campaign.dateRange?.endDate
          ? new Date(campaign.dateRange?.endDate).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : ""}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="w-[497px] h-[276px] pl-[47px] py-[34px] mb-10 mt-5 bg-primary-light bg-opacity-5 rounded-lg mx-auto border-primary-xlight shadow-sm border-[1px]"
                  style={{
                    backgroundImage: "url(/img/ticketBackground.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="flex justify-between items-start pr-[19px]">
                    <p className={` text-2xl ${caveat.className}`}>
                      Dear [Attendee Name],
                      <br />
                      We look forward to seeing you at <br /> the event. Here is
                      a quick <br /> resource for you:
                    </p>

                    {/* Add Company Logo Upload Section */}

                    <div className=" -mt-14 -mr-12  ">
                      <Image
                        src="/img/clientLogo.png"
                        alt="upload"
                        className="cursor-pointer"
                        width={184}
                        height={184}
                      />
                    </div>
                  </div>

                  {/* QR code section remains the same */}
                  <div
                    className={`text-[#344054] duration-1000 w-fit mt-2 text-sm font-medium text-center grid gap-[6px]  `}
                  >
                    <div className="bg-white p-2.5 shadow-sm">
                      <Image
                        src="/img/RealQRcode.png"
                        alt="calendar"
                        width={75}
                        height={75}
                      />
                    </div>
                  </div>
                </div>

                {/* //* (3.2) data */}
                {/* <div className="pt-[23px] px-[24px] pb-[54px]"> */}
                {/* * (3.2.1) campaign name */}
                {/* <div className=" font-medium">
                        <div className="text-xs leading-[27px] uppercase text-[#101828D6]">
                          Campaign Name
                        </div>
                        <div className="text-sm leading-[27px]">
                          {campaign?.name || 'Holiday Gifting Campaign 2024'}
                        </div>
                      </div> */}
                {/* * (3.2.2) targeted and timeline and budget */}
                {/* <div className="flex justify-between  mt-[22px] font-medium"> */}
                {/* 1 */}
                {/* <div>
                          <div className="text-xs leading-[27px] uppercase text-[#101828D6]">
                            Profiles targeted
                          </div>
                          <div className="text-sm leading-[27px]">
                            {campaign?.metrics?.totalRecipients || 0} profiles
                          </div>
                        </div> */}
                {/* 2 */}
                {/* <div className="text-center">
                          <div className="text-xs leading-[27px] uppercase text-[#101828D6]">
                            Estimated Timeline
                          </div>
                          <div className="text-sm leading-[27px]">2-5 days</div>
                        </div> */}
                {/* 3 */}
                {/* <div className="text-right">
                          <div className="text-xs leading-[27px] uppercase text-[#101828D6]">
                            Total Budget
                          </div>
                          <div className="text-sm leading-[27px]">
                            ${campaign?.budget?.total?.toLocaleString() || 0}
                          </div>
                        </div> */}
                {/* </div> */}
                {/* * (3.2.3) total budget */}
                {/* <div className="flex gap-6 mt-[35px]"> */}
                {/* * (3.2.3.1) campaign name */}
                {/* <div className=" font-medium">
                          <div className="text-xs leading-[27px] uppercase text-[#101828D6]">
                            Gift Customization
                          </div>
                          <div className="text-sm leading-[27px]">
                            Logo and recipient names added.
                          </div>
                        </div> */}
                {/* image */}
                {/* <Image
                          src="/img/Tshirts.png"
                          alt="gift-customization"
                          className="mt-2.5"
                          height={136}
                          width={137}
                        /> */}
                {/* </div> */}
                {/* </div> */}
              </div>
            </div>
            <Image
              src="/img/Streamline.png"
              alt="campaignLive"
              className="mx-auto mt-32"
              width={342}
              height={342}
            />
            <p className="text-center text-sm font-medium mt-5">
              Matching Gifts in progress
              <span className="inline-flex gap-[2px] ml-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-black animate-[dot-loading_1.4s_ease-in-out_infinite]"
                        style={{
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </span>
            </p>
            <div className="flex justify-center gap-3 mt-[22px] relative z-10">
              <Link
                href="/dashboard"
                className="border bg-white border-[#D0D5DD] hover:bg-slate-50 text-xs font-medium text-[#344054] px-4 py-2.5 rounded-lg"
              >
                View Campaign Status
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-white hover:bg-primary-dark text-xs font-medium bg-primary px-4 py-2.5 rounded-lg"
              >
                Create Another Campaign
              </button>
            </div>
          </>
        )}


       
      </div>
    </div>
  );
}
