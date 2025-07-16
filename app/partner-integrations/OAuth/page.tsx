"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface OAuthParams {
  code: string;
  state: string;
}

interface PartnerData {
  company_name: string;
  website: string;
  contact_email: string;
  callback_url: string;
  client_id: string;
  status: string;
  logo_url?: string;
}

export default function OAuth() {
  // const[hideButton, setHideButton] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oAuthParams, setOAuthParams] = useState<OAuthParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  useEffect(() => {
    // Verify both code and state parameters exist in URL
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const partner_id = searchParams.get("partner_id");
    const auth = searchParams.get("auth");

    if (!code || !state) {
      setError("Missing required OAuth parameters");
      return;
    }
    console.log(code, state, partner_id);

    // Store parameters securely in component state
    setOAuthParams({ code, state });
    setIsAuthenticated(auth === "true");

    // Fetch partner data if partner_id exists
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

    // Redirect with preserved OAuth parameters
    if (auth === "true") {
      setTimeout(() => {
        const params = new URLSearchParams({
          partner_id: partner_id || "empty",
          code: code,
          state: state,
          // Optionally include partner data in URL if needed
          partner_name: partnerData?.company_name || "",
        });
        router.push(`gift-strategy?${params.toString()}`);
      }, 3000);
    }
  }, [searchParams, router]);

  const handleRegister = () => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const partner_id = searchParams.get("partner_id");

    // Construct URL with all necessary parameters
    // Update redirect to point to login page with preserved OAuth parameters
    const loginRedirect = encodeURIComponent(
      `/?${new URLSearchParams({
        partner_id: partner_id || "empty",
        code: code || "",
        state: state || "",
        redirect: "/partner-integrations/OAuth",
      }).toString()}`
    );

    const registerUrl = `/auth/register?${new URLSearchParams({
      redirect: loginRedirect,
      code: code || "",
      state: state || "",
      partner_id: partner_id || "empty",
    }).toString()}`;

    router.push(registerUrl);
  };

  const handleLogin = () => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const partner_id = searchParams.get("partner_id");

    // Construct login URL with OAuth parameters and redirect
    const loginUrl = `/?${new URLSearchParams({
      partner_id: partner_id || "empty",
      code: code || "",
      state: state || "",
      redirect: "/partner-integrations/OAuth",
    }).toString()}`;

    router.push(loginUrl);
  };

  // Show error state if parameters are missing
  if (error) {
    return (
      <main className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-primary text-white rounded-md px-8 py-2 text-sm"
          >
            Return to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <div className="-mt-[10%]">
        {/* //! --------- Header --------- */}
        <div className="flex items-center justify-between w-fit gap-7 mx-auto ">
          {/* Partner Photo */}
          {partnerData?.logo_url && (
            <>
              <Image
                src={partnerData.logo_url}
                alt={`${partnerData.company_name} logo`}
                width={100}
                height={100}
            />


          <div className="flex gap-2.5">
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-1"></div>
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-2"></div>
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-3"></div>
              <div className="bg-primary rounded-full size-2.5 animate-network-pulse-4"></div>
            </div>
          </>
        )}
          {/* Delightloop Logo */}
          <Image src="/Logo Final.png" alt="logo" width={188} height={48} />
        </div>
        {/* //! --------- Body --------- */}
        <p className="text-center text-lg font-medium py-10">
          Connecting your DelightLoop account to {partnerData?.company_name}
        </p>
        {/* //! --------- Buttons --------- */}
        {/* {!hideButton && ( */}
        <div className="grid gap-4 w-fit mx-auto">
          {!isAuthenticated && (
            <>
              <button
                onClick={handleLogin}
                className="bg-primary text-white rounded-md px-16 py-2.5 border border-primary hover:bg-white hover:text-[#344054] text-sm font-medium duration-300 shadow-sm"
              >
                Sign in to your DelightLoop Account
              </button>
              <button
                onClick={handleRegister}
                className="bg-white text-[#344054] rounded-md px-16 py-2.5 border border-primary hover:bg-primary hover:text-white text-sm font-medium duration-300 shadow-sm"
              >
                Create a new DelightLoop Account
              </button>
            </>
          )}
        </div>
        {/* )} */}
      </div>
      {isLoadingPartner && <div>Loading partner data...</div>}

      {partnerError && (
        <div className="text-red-500">Error: {partnerError}</div>
      )}


    </main>
  );
}
