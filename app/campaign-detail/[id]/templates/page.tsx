"use client";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Caveat } from "next/font/google";

const caveat = Caveat({
  weight: "400",
  subsets: ["latin"],
});

// First, add the Campaign type at the top of your file to fix TypeScript errors
type Campaign = {
  _id: string;
  name: string;
  goal: string;
  status: string;
  parentCampaignId?: string;
  childCampaigns?: any[];
  outcomeCard?: {
    message: string;
    logoLink: string;
  };
  outcomeTemplate?: {
    type: string;
    description: string;
    videoLink?: string;
    logoLink?: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl: string;
  };
};

export default function TemplatesPage() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [campaignDoesntExixts, setCampaignDoesntExixts] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [edit, setEdit] = useState({
    description: false,
    link: false,
    logoLink: false,
    videoLink: false,
  });
  const [description, setDescription] = useState("");
  const [urlEntered, setUrlEntered] = useState("");
  const [logoLink, setLogoLink] = useState("");
  const [videoLink, setVideoLink] = useState("");

  const { id } = useParams();
  console.log(id);
  useEffect(() => {
    console.log("Fetching campaign details...");
    if (!isLoadingCookies) {
      fetchCampaignDetails();
    }
  }, [isLoadingCookies]);

  const fetchCampaignDetails = async () => {
    try {
      if (!authToken) {
        router.push("/");
        return;
      }

      setIsLoading(true);

      // Get campaign ID from URL
      const pathParts = window.location.pathname.split("/");
      const campaignId = pathParts[pathParts.length - 2];
      console.log("campaignId", campaignId);

      // Fetch campaign details
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setCampaignDoesntExixts(true);
        return;
      }

      // Set campaign data
      setCampaign(data.data);
    } catch (err) {
      console.error("Error fetching campaign:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
  };

  const handleSaveTemplateData = async () => {
    try {
      const updatedTemplate = {
        ...campaign?.outcomeTemplate,
        description: description,
        buttonLink: urlEntered,
        logoLink: logoLink,
        videoLink: videoLink,
      };

      const response = await fetch(`/api/campaigns/${campaign?._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outcomeTemplate: updatedTemplate }),
      });

      if (response.ok) {
        fetchCampaignDetails();
        setEdit({
          description: false,
          link: false,
          logoLink: false,
          videoLink: false,
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  useEffect(() => {
    if (campaign?.outcomeTemplate) {
      setDescription(campaign.outcomeTemplate.description);
      setUrlEntered(campaign.outcomeTemplate.buttonLink);
      setLogoLink(campaign.outcomeTemplate.logoLink || "");
      setVideoLink(campaign.outcomeTemplate.videoLink || "");
    }
  }, [campaign]);

  return (
    <div className="flex bg-[#FFFFFF]">
      {/* Sidebar */}
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden">
        <div className="p-6  bg-white rounded-tl-3xl h-[100%]  overflow-y-scroll overflow-x-hidden">
          {/* //! Breadcrumb */}
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
              <Image src="/svgs/arr.svg" alt="arrow" width={4} height={8} />
              <Link href="/dashboard">
                <div className="text-sm font-medium leading-6 text-[#667085] px-1 hover:text-primary">
                  Campaign List
                </div>
              </Link>
              <Image src="/svgs/arr.svg" alt="arrow" width={4} height={8} />
              <div className="text-sm font-medium leading-6 text-[#1b1d21] px-1">
                {campaign?.name}
              </div>
            </div>
          </div>
          {/* //! Header */}
          <div className="mt-5 mb-6 ">
            {/* // (1) campaign name with tooltip */}
            <div className="flex gap-8 text-sm font-semibold mb-2 ">
              <Link
                href={`/campaign-detail/${campaign?._id}`}
                className="pb-1 hover:border-b-2 hover:border-primary-light"
              >
                Campaign Details
              </Link>
              <button className=" border-b-2 border-primary pb-1">
                Templates
              </button>
            </div>
            <div className="relative group">
              <div className="text-3xl font-medium text-[#101828] ">
                {campaign?.name}
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
                    : campaign?.status === "matching_gifts"
                    ? "Matching Gifts"
                    : campaign?.status === "list_building"
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
          {/* //! campaign data */}
          <div className="grid gap-6">
            {/* //? ------ Outcome Card ------ */}
            <div
              className="w-[497px] h-[276px] pl-[47px] py-[24px] bg-primary-light bg-opacity-5 rounded-lg mx-auto border-primary-xlight shadow-sm border-[1px]"
              style={{
                backgroundImage: "url(/img/ticketBackground.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex justify-between items-start pr-[19px]">
                <div className={`text-2xl ${caveat.className}`}>
                  Dear [Attendee Name],
                  <br />
                  <div className="break-words max-w-[250px] mt-2">
                    {campaign?.outcomeCard?.message ||
                      "We look forward to seeing you at the event. Here is a resource for you:"}
                  </div>
                </div>

                <div className="-mt-[7px]">
                  {campaign?.outcomeCard?.logoLink ? (
                    <Image
                      src={campaign.outcomeCard.logoLink}
                      alt={campaign.outcomeCard.logoLink}
                      width={84}
                      height={84}
                      className="object-contain rounded-lg"
                      onError={(e: any) => {
                        // e.target.src = "/img/upload.png";
                        console.error(
                          "Failed to load logo:",
                          campaign.outcomeCard.logoLink
                        );
                      }}
                    />
                  ) : (
                    <Image
                      src="/Logo Final.png"
                      alt="upload"
                      width={114}
                      height={114}
                    />
                  )}
                </div>
              </div>
            </div>
            {/* //? ------ Template Card ------ */}
            {campaign?.outcomeTemplate && (
              <div className="bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] w-[90%] h-[90%] lg:w-[1300px] lg:h-[800px] mx-auto grid lg:grid-cols-2 px-4 lg:px-24 gap-10 pb-10">
                {/* Text Section */}
                <div className="grid place-items-center">
                  <div className="grid gap-10">
                    {/* Username */}
                    <div className="lg:text-[40px] font-semibold">
                      Hey {"{{First Name}}"}
                    </div>

                    {/* Description */}
                    {edit.description ? (
                      <div className="w-full">
                        <textarea
                          value={description}
                          placeholder="Enter your message"
                          rows={4}
                          onChange={(e) => setDescription(e.target.value)}
                          className={`w-full lg:w-96 border-2 resize-none rounded-lg p-2 ${
                            description.length > 250
                              ? "border-red-500"
                              : "border-gray-300 focus:border-primary"
                          }`}
                        />
                        <div className="text-xs mt-1 text-gray-500">
                          {description.length}/250 characters
                        </div>
                        <div className="flex gap-4 justify-end font-medium mt-2">
                          <button
                            onClick={() =>
                              setEdit({ ...edit, description: false })
                            }
                            className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTemplateData}
                            className="bg-primary text-white px-5 py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEdit({ ...edit, description: true })}
                        className="flex items-center cursor-pointer gap-4 lg:text-[28px] font-semibold"
                      >
                        <Image
                          src="/svgs/Edit.svg"
                          width={24}
                          height={24}
                          alt="edit"
                        />
                        <span>{campaign.outcomeTemplate.description}</span>
                      </div>
                    )}

                    {/* CTA Button */}
                    {edit.link ? (
                      <div className="grid gap-2">
                        <div className="flex">
                          <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] border-r-0">
                            https://
                          </div>
                          <input
                            type="url"
                            value={urlEntered}
                            onChange={(e) => setUrlEntered(e.target.value)}
                            placeholder="Enter URL"
                            className="border w-[400px] border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5"
                          />
                        </div>
                        <div className="flex gap-4 justify-end font-medium">
                          <button
                            onClick={() => setEdit({ ...edit, link: false })}
                            className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTemplateData}
                            className="bg-primary text-white px-5 py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEdit({ ...edit, link: true })}
                        className="flex w-fit items-center gap-3 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg text-xl"
                      >
                        <Image
                          src="/svgs/Shimmer.svg"
                          alt="Shimmer"
                          width={24}
                          height={24}
                        />
                        {campaign.outcomeTemplate.buttonText}
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Section */}
                <div className="grid gap-4">
                  {/* Company Logo */}
                  <div className="place-self-end">
                    <div className="text-center">
                      {edit.logoLink ? (
                        <div className="grid gap-2">
                          <div className="flex">
                            <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] border-r-0">
                              https://
                            </div>
                            <input
                              type="url"
                              value={logoLink}
                              onChange={(e) => setLogoLink(e.target.value)}
                              placeholder="Enter logo URL"
                              className="border w-[300px] border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5"
                            />
                          </div>
                          <div className="flex gap-4 justify-end font-medium">
                            <button
                              onClick={() =>
                                setEdit({ ...edit, logoLink: false })
                              }
                              className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveTemplateData}
                              className="bg-primary text-white px-5 py-1.5 rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-[84px] h-[84px]">
                          <Image
                            src={
                              campaign.outcomeTemplate.logoLink ||
                              "/img/upload.png"
                            }
                            alt="company logo"
                            width={84}
                            height={84}
                            className="object-contain rounded-lg cursor-pointer"
                            onClick={() => setEdit({ ...edit, logoLink: true })}
                          />
                          <Image
                            src="/svgs/Edit.svg"
                            width={16}
                            height={16}
                            alt="edit"
                            className="absolute top-0 right-0 cursor-pointer "
                            onClick={() => setEdit({ ...edit, logoLink: true })}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Media */}
                  <div className="grid w-fit gap-4">
                    {campaign.outcomeTemplate.type === "template1" ? (
                      // Video Template
                      <div className="lg:h-[321px] lg:w-[521px]">
                        {campaign.outcomeTemplate.videoLink ? (
                          <iframe
                            src={getEmbedUrl(
                              campaign.outcomeTemplate.videoLink
                            )}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        ) : (
                          <div
                            onClick={() =>
                              setEdit({ ...edit, videoLink: true })
                            }
                            className="cursor-pointer"
                          >
                            <Image
                              src="/partner-integrations/upload-video.png"
                              alt="upload video"
                              width={521}
                              height={321}
                              className="rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Other Templates (Image)
                      <Image
                        src={`${campaign.outcomeTemplate.type === "template2" ? "/partner-integrations/seat.png" : campaign.outcomeTemplate.type==="template3" ? "/partner-integrations/report.png" : campaign.outcomeTemplate.type==="template4" ? "/partner-integrations/meeting.png" :""}`}
                        width={521}
                        height={321}
                        alt="template media"
                        className="rounded-lg"
                      />
                    )}

                    <Image
                      src="/partner-integrations/made-with-delightloop.png"
                      width={207}
                      height={27}
                      alt="made with delightloop"
                      className="place-self-end"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
