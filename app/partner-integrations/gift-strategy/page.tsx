"use client";
import Stars from "@/components/common/Stars";
import SelectGiftStrategy from "@/components/partner-integrations/ui/Select-Gift-Strategy";
import Image from "next/image";
import SelectGift from "@/components/partner-integrations/ui/Select-Gift";
import Progressbar from "@/components/partner-integrations/layouts/Progressbar";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GiftStrategy() {
  const [playbookId, setPlaybookId] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [partnerData, setPartnerData] = useState(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const [block, setBlock] = useState({
    giftStrategyVisible: true,
    giftVisible: false,
  });

  useEffect(() => {

    const checkActivePlaybook = async () => {
      try {
        const response = await fetch("/api/playbooks/check-active");
        const data = await response.json();

        if (response.ok && data.hasActivePlaybook) {
          // Get all current query parameters
          const currentParams = new URLSearchParams(searchParams.toString());
          // Add a source parameter to indicate we're coming from gift selection
          currentParams.append('source', 'gift_selection');

          // Redirect to wallet page with existing query parameters
          router.push(`/dashboard/wallet?${currentParams.toString()}`);
        }
      } catch (error) {
        console.error("Error checking active playbooks:", error);
      }
    };

    checkActivePlaybook();

    const partner_id = searchParams.get("partner_id");
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (partner_id) {
            const fetchPartnerData = async () => {
                if (!partner_id) return;

                setIsLoadingPartner(true);
                setPartnerError(null);

                try {
                  const response = await fetch(`/api/partner/${partner_id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });

                  if (!response.ok) {
                    throw new Error(
                      `Failed to fetch partner data: ${response.statusText}`
                    );
                  }

                  const data = await response.json();

                  if (!data.success) {
                    throw new Error(data.error || "Failed to fetch partner data");
                  }

                  console.log("Partner data fetched:", data.data);
                  setPartnerData(data.data);
                } catch (err) {
                  console.error("Error fetching partner data:", err);
                  setPartnerError(
                    err instanceof Error ? err.message : "Failed to fetch partner data"
                  );
                } finally {
                  setIsLoadingPartner(false);
                }
              };

              // Call the fetch function
              fetchPartnerData();
        }
  }, [router, searchParams]);

  return (
    <div className="bg-primary-xlight pb-20">
      <main className="z-10 relative ">
        {/* //! --------- Header --------- */}
        <div className="fixed w-full top-0 z-50 bg-primary-xlight opacity-95">
          {/* //? -------------  partenr Image ------------- */}
          <div className="flex items-center justify-between  px-12 pt-10 ">
            {/* <div className="bg-white rounded-lg px-4 py-2 shadow-sm w-fit ">
            <Image src="/Logo Final.png" alt="logo" width={163} height={26} />
          </div> */}
          {partnerData?.logo_url && (
            <Image
              src={partnerData?.logo_url}
              alt="logo"
              width={184}
              height={48}
            />
          )}
          </div>
          {/* //? --------- Progress Bar --------- */}
          <div className="text-center grid gap-14">
            <h1 className="text-lg font-semibold">
              Welcome to DelightLoop! Let's set up your gifting strategy
            </h1>
            <Progressbar block={block} />
          </div>
        </div>
        {/* All Components */}
        <SelectGiftStrategy
          block={block}
          setBlock={setBlock}
          setPlaybookId={setPlaybookId}
        />
        <SelectGift
          block={block}
          setBlock={setBlock}
          playbookId={playbookId}
        />
      </main>

      {/* //! --------- Gradient Image --------- */}
      <Image
        src="/img/Gradient.png"
        alt="bg"
        width={1000}
        height={1000}
        className=" fixed top-40 left-0 w-full h-full  object-cover"
      />
      {/* //! --------- Stars --------- */}
      <Stars />
    </div>
  );
}
