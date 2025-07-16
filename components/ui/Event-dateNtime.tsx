"use client";

import Image from "next/image";
import Calendar from "../Gift-Recommendations/Calendar";
import { HiddenBlocks } from "@/lib/types/campaign";
import { Caveat } from "next/font/google";
import { use, useEffect, useState } from "react";
import TemplateModal from "../partner-integrations/select-gift/Template-modal";
import { toast } from "react-hot-toast";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
interface EventDateAndTimeProps {
  setHiddenBlocks: (blocks: any) => void;
  hiddenBlocks: any;
  campaignId: string;
  goalOfCampaign: string;
  goalOfCampaignIsDirect: boolean;
  IsSimilarProfileClickedInProfileDiscovered: boolean;
  templateData: any;
  setTemplateData: (data: any) => void;
  selectedTemplate: any;
  setSelectedTemplate: (data: any) => void;
  initialLogoLinkForTemplateModal: string;
  setInitialLogoLinkForTemplateModal: (data: string) => void;
}
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function EventDateAndTime({
  setHiddenBlocks,
  hiddenBlocks,
  campaignId,
  goalOfCampaign,
  goalOfCampaignIsDirect,
  IsSimilarProfileClickedInProfileDiscovered,
  templateData,
  setTemplateData,
  selectedTemplate,
  setSelectedTemplate,
  initialLogoLinkForTemplateModal,
  setInitialLogoLinkForTemplateModal,
}: EventDateAndTimeProps) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [includePhysicalQR, setIncludePhysicalQR] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [eventDate, setEventDate] = useState(new Date());
  const [approvedDate, setApprovedDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [urlEntered, setUrlEntered] = useState("");
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [error, setError] = useState("");
  const [campaignData, setCampaignData] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!isLoadingCookies) {
      getOrganizationData();
    }
  }, [isLoadingCookies]);

  const getOrganizationData = async () => {
    try {
      if (!organizationId) {
        router.push("/");
        return;
      }
      const response = await fetch(`/api/organization/${organizationId}`);
      const data = await response.json();
      console.log("Organization Data:", data);

      // Only set the logo if we don't already have one in cardDetails
      if (
        data.success &&
        data.data?.branding?.logo_url &&
        !cardDetails.logoLink
      ) {
        setCardDetails((prev) => ({
          ...prev,
          logoLink: data.data?.branding?.logo_url,
        }));
        setInitialLogoLinkForTemplateModal(data.data?.branding?.logo_url);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const [focusTemplate, setFocusTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [savedContent, setSavedContent] = useState({
    description: "",
    date: new Date(),
    videoLink: "",
    logoLink: "",
    buttonLink: "",
    isEdited: false,
  });
  const [templateError, setTemplateError] = useState("");
  const [cardDetails, setCardDetails] = useState({
    description: "",
    logoLink: "",
  });
  const [cardDetailsActive, setCardDetailsActive] = useState({
    description: false,
    logoLink: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCookies) {
      if (campaignId) {
        console.log("CampaignId changed, fetching new data:", campaignId);
        fetchCampaignData();
      }
    }
  }, [campaignId, isLoadingCookies]);

  const fetchCampaignData = async () => {
    try {
      console.log("Checking credentials:", {
        organizationId,
        campaignId,
        authToken,
      });

      if (!organizationId || !authToken) {
        console.log("Missing required data");
        return;
      }

      // Update campaign with organization's logo
      const updateResponse = await fetch(`/api/campaign/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organizationId,
        }),
      });

      if (!updateResponse.ok) {
        console.error(
          "Failed to update campaign logo:",
          await updateResponse.text()
        );
      } else {
        const updateData = await updateResponse.json();
        console.log("Campaign logo updated successfully:", updateData);
      }

      // Fetch campaign data
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();
      console.log("Campaign data fetched:", data?.data);
      setCampaignData(data?.data);
      console.log("campaignData", campaignData?.status);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    if (shouldScrollToBottom) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
      setShouldScrollToBottom(false); // Reset the state
    }
  }, [shouldScrollToBottom]);

  const handleSendForApproval = async () => {
    setSubmitLoading(true);
    try {
      // Validate template data
      if (!templateData.type || !templateData.description) {
        // toast.error("Please complete the template details");
        setSubmitLoading(false);
        setError(
          "To ensure your leads have a great experience, please select and customize a landing page template."
        );
        return;
      }

      //   if (!cardDetails.description || !cardDetails.logoLink) {
      // toast.error("Please complete the card details");
      //     setError("Please complete the card details");
      //     return;
      //   }
      if (!templateData.type) {
        // toast.error("Please select a template");
        setError("Please select a template");
        setSubmitLoading(false);
        return;
      }

      if (!eventDate || !endDate) {
        // toast.error("Please select a date");
        setError("Please select a date");
        setSubmitLoading(false);
        return;
      }

      // Convert dates to timestamps for accurate comparison
      // const startTimestamp = new Date().setHours(0, 0, 0, 0);
      // const eventTimestamp = new Date(eventDate).setHours(0, 0, 0, 0);
      // const deliverByTimestamp = new Date(deliverByDate).setHours(0, 0, 0, 0);

      // Check if dates are the same
      // if (eventTimestamp === deliverByTimestamp) {
      //   setError("Deliver by date cannot be the same as Event Start date");
      //   return;
      // }

      // if (deliverByTimestamp > eventTimestamp) {
      //   setError("Deliver By Date cannot be after Event Start Date");
      //   return;
      // }

      // if (deliverByTimestamp === startTimestamp) {
      //   setError("Deliver By Date cannot be today");
      //   return;
      // }
      // if (eventTimestamp === startTimestamp) {
      //   setError("Event Start Date cannot be today");
      //   return;
      // }

      const baseUrl = window.location.origin;
      const templateNumber = templateData.type.replace("template", "");
      const templateUrl = `${baseUrl}/public-landing-2/${templateNumber}`;

      // Get user data from cookie
      if (!userId) {
        toast.error("Please login to continue");
        setSubmitLoading(false);
        return;
      }

      // Make API call to select-gift endpoint without waiting for response
      //   fetch(
      //     `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${userData.organization_id}/campaigns/${campaignId}/select-gift`,
      //     {
      //       method: "POST",
      //       headers: {
      //         accept: "application/json",
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify({
      //         user_id: userData.userId,
      //       }),
      //     }
      //   );

      // Continue with the existing campaign update
      console.log("Sending data to API:", {
        eventStartDate: eventDate,
        deliverByDate: endDate,
        outcomeTemplate: {
          type: templateData.type,
          description: templateData.description,
          date: templateData.date,
          videoLink: templateData.videoLink,
          logoLink: templateData.logoLink,
          buttonText: getButtonText(templateData.type),
          buttonLink: templateData.buttonLink,
          mediaUrl: getMediaUrl(templateData.type),
        },
        outcomeCard: {
          message: cardDetails.description,
          logoLink: cardDetails.logoLink,
        },
        cta_link: templateUrl,
        //   template: templateData,
      });

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventStartDate: eventDate.toISOString(),
          deliverByDate: endDate.toISOString(),
          // Use dot notation for all nested fields
          "outcomeTemplate.type": templateData.type || "",
          "outcomeTemplate.description": templateData.description || "",
          "outcomeTemplate.date": (
            templateData.date || new Date()
          ).toISOString(),
          "outcomeTemplate.videoLink": templateData.videoLink || "",
          "outcomeTemplate.logoLink": templateData.logoLink || "",
          "outcomeTemplate.buttonText": getButtonText(templateData.type),
          "outcomeTemplate.buttonLink": templateData.buttonLink || "",
          "outcomeTemplate.mediaUrl": getMediaUrl(templateData.type),
          "outcomeCard.message": cardDetails.description || "",
          "outcomeCard.logoLink": cardDetails.logoLink || "",
          // Use "matching gifts" since that's what worked in your previous request

          status: goalOfCampaignIsDirect
            ? "list_building"
            : campaignData?.giftSelectionMode === "manual"
            ? "waiting_for_approval"
            : "matching_gifts",
          cta_link: templateUrl,
        }),
      });
      //   dateRange: { startDate,eventDate, approvedDate, endDate },
      //   cardDetails: {
      //     description: cardDetails.description,
      //     logoLink: cardDetails.logoLink,
      //   },
      //   url: urlEntered,
      //   includeQr: includePhysicalQR,
      if (!response.ok) {
        setSubmitLoading(false);
        throw new Error("Failed to update campaign");
      }
      const data = await response.json();
      console.log("API Response:", data);

      toast.success("Campaign updated successfully!");

      // Backend API for gift-selection - true fire-and-forget since page redirects
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        // Fire and forget without waiting for response or handling promises
        // since the page will redirect anyway
        fetch(
          `${apiBaseUrl}/v1/organizations/${organizationId}/campaigns/${campaignId}/gift-selection`,
          // ` http://localhost:5500/v1/organizations/${userData.organization_id}/campaigns/${campaignId}/gift-selection`,
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
        console.log("Gift selection API call initiated in background");
      } catch (error) {
        setSubmitLoading(false);
        console.error("Error setting up gift-selection API call:", error);
        // Don't show error toast as the main campaign update was successful
      }

      if (data?.data?.status === "waiting_for_approval") {
        setSubmitLoading(false);
        router.push(`/dashboard`);
      }
      setHiddenBlocks((prev: HiddenBlocks) => ({
        ...prev,
        launch: false,
      }));
      setShouldScrollToBottom(true);
    } catch (error) {
      setSubmitLoading(false);
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  // Helper functions
  const getButtonText = (templateType: string) => {
    switch (templateType) {
      case "template1":
        return "Watch Video";
      case "template2":
        return "Register For Webinar";
      case "template3":
        return "Download the Report";
      case "template4":
        return "Book a Meeting";
      default:
        return "Select Gift";
    }
  };

  const getMediaUrl = (templateType: string) => {
    switch (templateType) {
      case "template2":
        return "/partner-integrations/seat.png";
      case "template3":
        return "/partner-integrations/report.png";
      case "template4":
        return "/partner-integrations/meeting.png";
      default:
        return "/partner-integrations/gift.png";
    }
  };

  const handleTemplateSelect = (templateNumber: number) => {
    const newTemplate = {
      template1: false,
      template2: false,
      template3: false,
      template4: false,
    };
    newTemplate[`template${templateNumber}`] = true;
    setSelectedTemplate(newTemplate);
    setTemplateData((prev) => ({
      ...prev,
      type: `template${templateNumber}` as
        | "template1"
        | "template2"
        | "template3"
        | "template4",
    }));
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = document.querySelector(".carousel-container");
    if (container) {
      const scrollAmount = 300;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  const handleTemplateDataChange = (data: any) => {
    setTemplateData(data);
    setSavedContent({
      description: data.description,
      date: data.date,
      videoLink: data.videoLink,
      logoLink: data.logoLink,
      buttonLink: data.buttonLink,
      isEdited: true,
    });
  };

  return (
    <div
      className={`w-full  grid justify-center relative z-10  pt-10  ${
        hiddenBlocks.eventDateAndTime ? "h-[90vh] " : "h-[160vh]"
      }`}
    >
      <div className="w-[1005px] h-fit">
        <div className="bg-white rounded-lg  shadow-sm  mx-auto  w-[651px] border-[#D2CEFE] border-[1px]">
          {/* //! (3.1) quick snapshot */}
          <div className="text-center flex justify-between p-10  font-medium text-sm  border-b-[#D2CEFE] border-b-[1px] border-dashed relative">
            {/* Here&apos;s a Quick Snapshot of Your Campaign */}
            {/* //? calendar button */}
            <div className="grid justify-end h-fit ">
              <div className="text-sm font-medium text-start  text-[#344054] mb-1.5 ">
                Event Start Date
              </div>
              <Calendar
                selectedDate={eventDate}
                onChange={(date) => setEventDate(date)}
              />
            </div>
            <div className="grid justify-end h-fit ">
              <div className="text-sm font-medium text-end text-[#344054] mb-1.5 pr-1">
                Deliver By
              </div>
              <Calendar
                selectedDate={endDate}
                onChange={(date) => setEndDate(date)}
                customDate={3}
              />
            </div>
            {/* //* (3.1.1) left circle */}
            <div className="bg-primary-xlight rounded-full size-5 border-t-[#D2CEFE] border-r-[#D2CEFE] rotate-45 border border-primary-xlight absolute -left-[11px] -bottom-[10px]"></div>
            {/* //* (3.1.2) right circle */}
            <div className="bg-primary-xlight rounded-full size-5 border-t-[#D2CEFE] border-r-[#D2CEFE] -rotate-[135deg] border border-primary-xlight absolute -right-[11px] -bottom-[10px]"></div>
          </div>
          <Image
            src="/img/preview.png"
            className="mx-auto my-7"
            alt="lastgift"
            height={97}
            width={513}
          />
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
                <div
                  onClick={() =>
                    setCardDetailsActive({
                      ...cardDetailsActive,
                      description: true,
                      logoLink: false,
                    })
                  }
                  className={`cursor-pointer w-72 flex items-start -ml-8 gap-2 ${
                    cardDetailsActive.description ? "hidden" : ""
                  }`}
                >
                  <Image
                    src="/svgs/Edit.svg"
                    width={24}
                    height={24}
                    alt="message"
                  />
                  <div className="break-words max-w-[250px] overflow-hidden">
                    {cardDetails.description
                      ? cardDetails.description.length > 150
                        ? cardDetails.description.substring(0, 150) + "..."
                        : cardDetails.description
                      : "We look forward to seeing you at the event. Here is a resource for you:"}
                  </div>
                </div>
                {cardDetailsActive.description && (
                  <div className="w-72">
                    <textarea
                      value={cardDetails.description}
                      placeholder="We have reserved a seat for you!"
                      rows={3}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          description: e.target.value,
                        })
                      }
                      className={`w-full border-2 resize-none rounded-lg p-2 overflow-y-auto ${
                        cardDetails.description.length > 200
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        cardDetails.description.length > 200
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span className="font-sans font-medium">
                        {cardDetails.description.length}/200 characters
                      </span>
                      {cardDetails.description.length > 200 && (
                        <span className="font-sans font-medium">
                          Text is too long
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end font-medium mt-1">
                      <button
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            description: false,
                          })
                        }
                        className="bg-white border border-gray-300 text-gray-500 text-sm px-4 py-2.5 hover:bg-gray-100 duration-300 rounded-lg font-sans"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            description: false,
                          })
                        }
                        disabled={cardDetails.description.length > 200}
                        className={`text-white text-sm px-4 py-2.5 duration-300 rounded-lg font-sans ${
                          cardDetails.description.length > 200
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Company Logo Upload Section */}
              <div className="-mt-[7px]">
                <div
                  onClick={() =>
                    setCardDetailsActive({
                      ...cardDetailsActive,
                      logoLink: true,
                      description: false,
                    })
                  }
                  className={`cursor-pointer text-center ${
                    cardDetailsActive.logoLink ? "hidden" : ""
                  }`}
                >
                  {cardDetails.logoLink ? (
                    <div className="relative w-[84px] h-[84px]">
                      <Image
                        src={cardDetails.logoLink}
                        alt="Company Logo"
                        width={84}
                        height={84}
                        className="object-contain hover:scale-105 duration-300 rounded-lg"
                        onError={(e: any) => {
                          e.target.src = "/img/upload.png";
                          console.error(
                            "Failed to load image:",
                            cardDetails.logoLink
                          );
                        }}
                      />
                    </div>
                  ) : (
                    <label htmlFor="company-logo" className="cursor-pointer">
                      <Image
                        src={"/img/upload.png"}
                        alt="upload"
                        className="hover:scale-105 duration-300"
                        width={84}
                        height={84}
                      />
                    </label>
                  )}
                </div>
                {cardDetailsActive.logoLink && (
                  <div className="grid gap-1 w-[200px]">
                    <div className="flex h-fit">
                      <div className="text-[#667085] py-1.5 px-2 bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0 text-xs">
                        https://
                      </div>
                      <input
                        type="url"
                        value={cardDetails.logoLink || ""}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            logoLink: e.target.value,
                          })
                        }
                        placeholder="Enter URL"
                        className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-2 py-1.5 text-xs placeholder:text-[#667085] placeholder:font-medium"
                      />
                    </div>
                    <div className="flex gap-2 justify-end font-medium">
                      <button
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            logoLink: false,
                          })
                        }
                        className="bg-white border border-gray-300 text-gray-500 px-3 py-1 hover:bg-gray-100 duration-300 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            logoLink: false,
                          })
                        }
                        className="bg-primary text-white px-3 py-1 hover:opacity-90 duration-300 rounded-lg text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR code section remains the same */}
            <div
              className={`text-[#344054] duration-1000 w-fit mt-2 text-sm font-medium text-center grid gap-[6px] ${
                urlEntered.length > 0 ? "opacity-100" : "opacity-0"
              }`}
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

          {/* //! container of multiple buttons  */}
          <div className=" px-[78px] mt-4 pb-8">
            {/* <div>
              <div className="text-[#344054] text-sm font-medium mb-1.5 pl-1">
                Update QR Code for Campaign Outcome
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="flex flex-1">
                    <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                      https://
                    </div>
                    <input
                      type="url"
                      onChange={(e) => setUrlEntered(e.target.value)}
                      placeholder="Enter URL"
                      className="flex-1 border border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border bg-white border-[#D0D5DD] font-medium text-[#344054] hover:bg-gray-50 shadow-sm whitespace-nowrap">Generate QR Code</button>
                </div>
              </div>
            </div> */}
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
        {/* Add QR Card checkbox */}
        <div className=" items-center gap-3 ml-48 mt-3 hidden">
          <input
            type="checkbox"
            id="physical-qr"
            checked={includePhysicalQR}
            onChange={(e) => setIncludePhysicalQR(e.target.checked)}
            className="w-4 h-4 rounded border-[#D0D5DD] text-primary focus:ring-primary"
          />
          <label htmlFor="physical-qr" className="flex flex-col">
            <span className="text-sm text-[#344054] font-medium">
              Include a physical QR card in the package.
            </span>
            <span className="text-sm text-[#101828] font-semibold">
              (Additional Pricing: $1 per card)
            </span>
          </label>
        </div>
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
                  focusTemplate.template1
                    ? "outline outline-2 outline-primary"
                    : ""
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
                  handleTemplateSelect(1);
                }}
              />

              <Image
                src="/partner-integrations/template2.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template2
                    ? "outline outline-2 outline-primary"
                    : ""
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
                  handleTemplateSelect(2);
                }}
              />
              <Image
                src="/partner-integrations/template3.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template3
                    ? "outline outline-2 outline-primary"
                    : ""
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
                  handleTemplateSelect(3);
                }}
              />
              <Image
                src="/partner-integrations/template4.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template4
                    ? "outline outline-2 outline-primary"
                    : ""
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
                  handleTemplateSelect(4);
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

        {/* Template Modal */}
        <TemplateModal
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          onTemplateDataChange={handleTemplateDataChange}
        />

        {templateError && (
          <p className="text-red-500 text-sm font-medium text-center mt-2">
            {templateError}
          </p>
        )}

        {/* Approval Button */}
        <button
          disabled={submitLoading}
          onClick={handleSendForApproval}
          className={`flex items-center w-fit font-semibold text-xl gap-2 text-white shadow-sm mt-14 px-3 py-1.5 rounded-lg bg-primary  mx-auto ${
            submitLoading ? "opacity-50 cursor-not-allowed" : "hover:opacity-95"
          }`}
        >
          <Image
            src="svgs/Shimmer.svg"
            alt="Shimmers"
            className=""
            width={22}
            height={22}
          />
          {submitLoading
            ? "Submitting..."
            : goalOfCampaignIsDirect
            ? "Submit"
            : campaignData?.giftSelectionMode === "manual"
            ? "Send for Approval"
            : "Submit"}
        </button>
        {submitLoading && (
          <p className="text-gray-500 text-sm font-medium text-center mt-2">
            Submitting your campaign
          </p>
        )}

        <p className="text-red-500 z-20 relative text-sm font-medium text-center mt-2">
          {error}
        </p>
      </div>
    </div>
  );
}
