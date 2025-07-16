"use client";
import Stars from "@/components/common/Stars";
import Sidebar from "@/components/layouts/Sidebar";
import GiftRecommendations from "@/components/ui/Gift-Recommendations";
import ProfileDiscovered from "@/components/ui/Profile-Discovered";
import SetupBudget from "@/components/ui/Setup-Budget";
import CampaignDetails from "@/components/ui/Campaign-Details";
import EventDateAndTime from "@/components/ui/Event-dateNtime";
import CampainLive from "@/components/ui/Campain-Live";
import { useEffect, useState } from "react";
import { HiddenBlocks } from "@/lib/types/campaign";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";
import { useAuth } from "@/app/context/AuthContext";

export default function Home() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth();
  const router = useRouter();
  const [
    IsSimilarProfileClickedInProfileDiscovered,
    setIsSimilarProfileClickedInProfileDiscovered,
  ] = useState(true);
  const [hideAllForms, setHideAllForms] = useState(false);
  const [
    campaignDataForCreateMorePipeline,
    setCampaignDataForCreateMorePipeline,
  ] = useState<any>(null);
  const [hiddenBlocks, setHiddenBlocks] = useState<HiddenBlocks>({
    campaignDetails: false,
    profileDiscovered: true,
    setupBudget: true,
    giftRecommendations: true,
    eventDateAndTime: true,
    launch: true,
  });
  const [enrichSelectedRecipients, setEnrichSelectedRecipients] = useState<any>(
    new Set()
  );
  const [initialLogoLinkForTemplateModal, setInitialLogoLinkForTemplateModal] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [goalOfCampaign, setGoalOfCampaign] = useState<string>("");
  const [goalOfCampaignIsDirect, setGoalOfCampaignIsDirect] =
    useState<boolean>(false);
  // gift assigned false for showing where we are in the flow in that create your pipeline
  const [giftassigned, setGiftassigned] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoadingCookies) {
      // Get campaign ID from URL using URLSearchParams
      const params = new URLSearchParams(window.location.search);
      const campaignIdFromUrl = params.get("campaignId");
      const giftassigned = params.get("giftassigned");
      // alert(giftassigned);
    if (giftassigned === "false") {
      setGiftassigned(false);
      setHiddenBlocks((prev) => ({
        ...prev,
        campaignDetails: true,
        profileDiscovered: true,
        setupBudget: false,
      }));

      //   setHiddenBlocks((prev) => ({
      //     ...prev,
      //     campaignDetails: true,
      //     profileDiscovered: true,
      //     setupBudget: false,
      //   }));
    }

    if (campaignIdFromUrl) {
      setCampaignId(campaignIdFromUrl);
    }
  }
  }, [isLoadingCookies]);

  useEffect(() => {
    if (!hiddenBlocks.launch) {
      setTimeout(() => {
        setHideAllForms(true);
      }, 1000);
    }
  }, [hiddenBlocks.launch]);

  const handleCreateCampaign = async (campaignData: any) => {
    try {
      if (!authToken || !organizationId) {
        router.push('/');
        return;
      }
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();

      if (!data.success) {
        if (response.status === 401) {
          // Handle authentication error
          router.push("/"); // Redirect to login
          return;
        }
        throw new Error(data.error);
      }

      // Handle successful campaign creation
      setCampaignId(data.data._id);
      // ... rest of your success handling
    } catch (error) {
      console.error("Error creating campaign:", error);
      // Handle error appropriately
    }
  };


  //   this is for the template modal
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
  const [templateData, setTemplateData] = useState({
    type: "template1" as "template1" | "template2" | "template3" | "template4",
    description: "",
    date: null as Date | null,
    videoLink: "",
    logoLink: "",
    buttonText: "Select Gift",
    buttonLink: "",
    mediaUrl: "/partner-integrations/gift.png",
  });

  return (
    <div className="bg-primary-xlight ">
      {(hiddenBlocks.profileDiscovered || !hiddenBlocks.launch) && (
        <Image
          src="/img/Gradient.png"
          alt="bg"
          width={1000}
          height={1000}
          className=" fixed top-40 left-0 w-full h-full  object-cover"
        />
      )}
      <div
        className={` w-full relative    ${hideAllForms ? "hidden " : "flex"}`}
      >
        <Sidebar
          hiddenBlocks={hiddenBlocks}
          campaignId={campaignId}
          setCampaignId={setCampaignId}
          giftassigned={giftassigned}
        />
        <div className={`w-full   relative`}>
          {!hiddenBlocks.campaignDetails && (
            <CampaignDetails
              setHiddenBlocks={setHiddenBlocks}
              goalOfCampaign={goalOfCampaign}
              setGoalOfCampaign={setGoalOfCampaign}
              setCampaignDataForCreateMorePipeline={
                setCampaignDataForCreateMorePipeline
              }
              hiddenBlocks={hiddenBlocks}
              campaignId={campaignId}
              enrichSelectedRecipients={enrichSelectedRecipients}
              setEnrichSelectedRecipients={setEnrichSelectedRecipients}
              campaignDataForCreateMorePipeline={
                campaignDataForCreateMorePipeline
              }
              setCampaignId={setCampaignId}
            />
          )}
          {!hiddenBlocks.profileDiscovered && (
            <ProfileDiscovered
              setHiddenBlocks={setHiddenBlocks}
              hiddenBlocks={hiddenBlocks}
              campaignId={campaignId}
              goalOfCampaign={goalOfCampaign}
              goalOfCampaignIsDirect={goalOfCampaignIsDirect}
              campaignDataForCreateMorePipeline={
                campaignDataForCreateMorePipeline
              }
              setGoalOfCampaignIsDirect={setGoalOfCampaignIsDirect}
              enrichSelectedRecipients={enrichSelectedRecipients}
              setEnrichSelectedRecipients={setEnrichSelectedRecipients}
              setIsSimilarProfileClickedInProfileDiscovered={
                setIsSimilarProfileClickedInProfileDiscovered
              }
              IsSimilarProfileClickedInProfileDiscovered={
                IsSimilarProfileClickedInProfileDiscovered
              }
            />
          )}
          {!hiddenBlocks.setupBudget && (
            <SetupBudget
              setHiddenBlocks={setHiddenBlocks}
              hiddenBlocks={hiddenBlocks}
              campaignId={campaignId}
            />
          )}
          {/* {!hiddenBlocks.giftRecommendations && (
            <GiftRecommendations
              setHiddenBlocks={setHiddenBlocks}
              hiddenBlocks={hiddenBlocks}
              goalOfCampaign={goalOfCampaign}
              campaignId={campaignId}
              enrichSelectedRecipients={enrichSelectedRecipients}
            />
          )} */}
          {!hiddenBlocks.eventDateAndTime && (
            <EventDateAndTime
              setHiddenBlocks={setHiddenBlocks}
              hiddenBlocks={hiddenBlocks}
              campaignId={campaignId}
              goalOfCampaign={goalOfCampaign}
              goalOfCampaignIsDirect={goalOfCampaignIsDirect}
              IsSimilarProfileClickedInProfileDiscovered={
                IsSimilarProfileClickedInProfileDiscovered
              }
              templateData={templateData}
              setTemplateData={setTemplateData}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              initialLogoLinkForTemplateModal={initialLogoLinkForTemplateModal}
              setInitialLogoLinkForTemplateModal={setInitialLogoLinkForTemplateModal}
            />
          )}
        </div>
      </div>
      {/* //todo Modal -------------------------------- Carosel Template modal -------------------------------- */}
      <TemplateModal
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        onTemplateDataChange={setTemplateData}
        initialLogoLink={initialLogoLinkForTemplateModal}
      />
      {!hiddenBlocks.launch && (
        <CampainLive
          setHiddenBlocks={setHiddenBlocks}
          hiddenBlocks={hiddenBlocks}
          goalOfCampaign={goalOfCampaign}
          goalOfCampaignIsDirect={goalOfCampaignIsDirect}
          setGoalOfCampaignIsDirect={setGoalOfCampaignIsDirect}
          campaignId={campaignId}
          setHideAllForms={setHideAllForms}
          campaignDataForCreateMorePipeline={
            campaignDataForCreateMorePipeline
          }
          IsSimilarProfileClickedInProfileDiscovered={
            IsSimilarProfileClickedInProfileDiscovered
          }
          setIsSimilarProfileClickedInProfileDiscovered={
            setIsSimilarProfileClickedInProfileDiscovered
          }
        />
      )}
      {/* {!hiddenBlocks.launch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <Image
            src="/Logo Final.png"
            alt="landing-1"
            width={197}
            height={180}
            className=" absolute top-8 left-8"
          />

          <Image
            src="/img/streaming.png"
            alt="gift selection"
            width={350}
            height={300}
          />
          <p className=" font-medium mt-4 text-[#101828]">
            {goalOfCampaign === "create more pipeline"
              ? "List Building"
              : "Matching Gifts"}
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
          </p> */}
          {/* {goalOfCampaignIsDirect && (
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
)} */}
          {/* <button
            onClick={() => router.push("/dashboard")}
            className="bg-primary font-semibold text-white px-4 py-2 rounded-lg text-xl hover:bg-primary-dark duration-300 flex items-center gap-2 mt-8"
          >
            Checkout the Queue
          </button>
        </div>
      )} */}
      <Stars />
    </div>
  );
}
