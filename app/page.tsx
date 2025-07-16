"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import InfinityLoader from "../components/common/InfinityLoader";
import { getCookieConfig } from "@/utils/cookieConfig";
import { useSearchParams } from "next/navigation";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useAuth } from "./context/AuthContext";
import { HelpCircle, ExternalLink, Calendar } from "lucide-react";

export default function Page() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [partnerData, setPartnerData] = useState<any>(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [vcardData, setVCardData] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [isLoadingVCard, setIsLoadingVCard] = useState(false);
  const [vCardError, setVCardError] = useState<string | null>(null);
  const [showVCardSection, setShowVCardSection] = useState(false);
  const [isValidatingVCardKey, setIsValidatingVCardKey] = useState(false);
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);

  const searchParams = useSearchParams();
  const [showLoginSection, setShowLoginSection] = useState(
    !searchParams.get("vcr") && !searchParams.get("vid")
  );
  const [vCardExists, setVCardExists] = useState(false);
  const [vCardHasOwner, setVCardHasOwner] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(
    !!searchParams.get("vcr") || !!searchParams.get("vid")
  );
  const [
    bothVCRandVidCorrectButUserHaventRegistered,
    setBothVCRandVidCorrectButUserHaventRegistered,
  ] = useState(false);
  const quicksend = searchParams.get("quicksend");
  const user_id = searchParams.get("user_id");
  const gift_id = searchParams.get("gift_id");

  const partner = searchParams.get("partner_id");

  useEffect(() => {
    // Verify both code and state parameters exist in URL
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const partner_id = searchParams.get("partner_id");
    const vcr = searchParams.get("vcr");
    const vcardsignupuser = searchParams.get("vcardsignupuser");

    console.log(code, state, partner_id, vcr);

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

    if (vcardsignupuser) {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(true);
      setIsInitialLoading(false);
      return;
    }

    // Validate VCard key if vcr parameter exists, but skip if already verified (vid exists)
    if (vcr) {
      setIsInitialLoading(true);

      const vid = searchParams.get("vid");
      if (vid) {
        // VCard already verified, show login section
        setShowVCardSection(false);
        setShowLoginSection(true);
        setVCardExists(true);
        setIsInitialLoading(false);
        console.log(
          "VCard already verified with secret, showing login section"
        );
      } else {
        // VCard not yet verified, validate the key
        validateVCardKey(vcr);
      }
    } else {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(false);
    }
  }, [searchParams]);

  const [dataWithoutSecret, setDataWithoutSecret] = useState(null);
  // Function to validate VCard key and check if it has a userId
  const validateVCardKey = async (key: string) => {
    if (!key) {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(false);
      return;
    }

    setIsValidatingVCardKey(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/key/${key}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("VCard key validation result:", data);

      if (data.success && !data.data.userId) {
        // VCard exists but has no userId assigned (unassigned VCard) - show VCard section, hide login
        setVCardExists(true);
        setShowVCardSection(true);
        setShowLoginSection(false);
        console.log("VCard key valid but unassigned - showing VCard section");
        fetchVcardDataWithoutSecret(key);
      } else if (data.success && data.data.userId) {
        // VCard exists and has a userId assigned - show VCard section with "Already the owner?" UI
        setVCardExists(true);
        setVCardHasOwner(true);
        setShowVCardSection(true);
        setShowLoginSection(false);
        console.log(
          "VCard key valid with userId assigned - showing already owner section:",
          data.data.userId
        );
        fetchVcardDataWithoutSecret(key);
      } else {
        // VCard doesn't exist - show login section, hide VCard section
        setVCardExists(false);
        setShowVCardSection(false);
        setShowLoginSection(true);
        setIsInitialLoading(false);

        console.log(
          "VCard key invalid - VCard not found, showing login section"
        );
      }
    } catch (error) {
      console.error("Error validating VCard key:", error);
      setVCardExists(false);
      setShowVCardSection(false);
      setShowLoginSection(true);
      setIsInitialLoading(false);
    } finally {
      setIsValidatingVCardKey(false);
      //   setIsInitialLoading(false);
    }
  };
  const fetchVcardDataWithoutSecret = async (key: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/authenticate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: key,
          }),
        }
      );

      const data = await response.json();
      console.log("vcard data", data);

      if (data.success) {
        setDataWithoutSecret(data.data.fullName);
      }
    } catch (error) {
      console.error("Error fetching VCard data without secret:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Handle claim my card button click
  const handleClaimCard = () => {
    const fullCode = codeInputs.join("");
    if (fullCode.length === 6) {
      // Call the existing fetchVCardData function
      fetchVCardData(fullCode);
    }
  };

  // Handle individual code input changes
  const handleCodeInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single character

    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);

    // Auto-focus to next input if value is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Handle backspace to previous input
  const handleCodeInputKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Handle paste event
  const handleCodeInputPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("").filter((char) => /\d/.test(char));

    if (digits.length === 6) {
      setCodeInputs(digits);
      // Focus the last input
      const lastInput = document.getElementById(`code-input-5`);
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  // Handle create my free card button click
  const handleCreateCard = () => {
    const vcr = searchParams?.get("vcr");

    if (vcr) {
      // If vcr parameter exists, redirect to LinkedIn input page with vcr parameter
      const params = new URLSearchParams();
      params.set("vcr", vcr);
      router.push(`/referral/linkedin?${params.toString()}`);
    } else {
      // Hide VCard section and show login section
      setShowVCardSection(false);
      setShowLoginSection(true);
    }
  };

  const fetchVCardData = async (secret: string) => {
    const vcr = searchParams.get("vcr");

    if (!vcr || !secret) {
      console.error("Both key (vcr) and secret are required");
      setVCardError("Both key and secret are required");
      return;
    }

    setIsLoadingVCard(true);
    setVCardError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/authenticate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: vcr,
            secret: secret,
          }),
        }
      );

      const data = await response.json();
      console.log("vcard data", data);

      if (data.success) {
        setVCardData(data.data.fullName);
        console.log("vcard fullName", data.data.fullName);
        setVCardError(null);

        // Add secret to URL as query parameter on successful authentication
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("vid", secret);
        window.history.replaceState({}, "", currentUrl.toString());

        // Set states to show login section and hide VCard section
        setShowVCardSection(false);
        setShowLoginSection(true);
        setVCardExists(true); // Mark that VCard exists and is now verified
        setIsLoadingVCard(false);
        setBothVCRandVidCorrectButUserHaventRegistered(true);
      } else {
        console.error("VCard authentication failed:", data.error_message);
        setVCardError(data.error_message || "Authentication failed");
        setVCardData(null);
        setIsLoadingVCard(false);
        return null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching VCard data:", error);
      setVCardError("Failed to authenticate VCard");
      setVCardData(null);
      setIsLoadingVCard(false);
      return null;
    }
  };

  // Array of testimonials to cycle through
  const testimonials = [
    {
      text: "Delightloop helps you nurture relationships with hyper-personalized gifts, end-to-end workflow automation, and unlimited gift choices—all driven by GenAI.",
      name: "Alisa Hester",
      role: "CMO",
      rol1: "Graphite",
      rating: 5,
    },
    {
      text: "From finding the right contact to getting their address to sending the perfect gift - this platform automated our entire gifting workflow. The AI recommendations are so personal, one client thought we had a dedicated team studying their preferences!",
      name: "David Johnson",
      role: "VP Marketing",
      rol1: "Accio Robotics",
      rating: 4,
    },
    {
      text: "The ICP finder and permission-based sending changed our outreach game. We can now identify ideal prospects, verify addresses instantly, and let recipients choose how they want to receive gifts.",
      name: "Priya Patel",
      role: "Head of Marketing",
      rol1: "Rapid",
      rating: 5,
    },
    {
      text: "Perfect timing meets perfect personalization. The platform knows exactly when and what to send based on our CRM data. Love how it handles everything from recipient preference capture to address verification - true end-to-end automation.",
      name: "Sara Chen",
      role: "Head of Marketing",
      rol1: "IPL",
      rating: 5,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCardUser, setReferralCardUser] = useState(false);

  const router = useRouter();

  const setCookies = (
    auth_token: string,
    user_email: string,
    user_id: string,
    organization_id: string
  ) => {
    const cookieOptions = {
      expires: 2, // 2 days
      sameSite: "Lax" as const,
      secure: true,
    };

    Cookies.set("auth_token", auth_token, cookieOptions);
    Cookies.set("user_email", user_email, cookieOptions);
    Cookies.set("user_id", user_id, cookieOptions);
    Cookies.set("organization_id", organization_id, cookieOptions);

    console.log("✅ Cookies set using js-cookie");
  };

  // Carousel navigation
  const handlePrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const baseUrl = await getBackendApiBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "NEXT_PUBLIC_BACKEND_API_BASE_URL_WITH_PORT is not defined in environment variables"
        );
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLocaleLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Set cookies
      await setCookies(
        data.data?.session_token,
        data.data?.email,
        data.data?.id,
        data.data?.organizationId
      );
      const isOAuthFlow = !!(
        searchParams.get("code") && searchParams.get("state")
      );

      if (partner) {
        if (isOAuthFlow) {
          const params = new URLSearchParams();
          params.append("partner_id", partner);
          params.append("auth", "true");

          const code = searchParams.get("code");
          const state = searchParams.get("state");
          if (code) params.append("code", code);
          if (state) params.append("state", state);

          router.push(`/partner-integrations/OAuth?${params.toString()}`);
        } else {
          router.push(`/partner-integrations/${partner}?auth=true`);
        }
      } else {
        if (data.login_count === 1) {
          console.log("First-time login detected");
        }

        if (quicksend && user_id && gift_id) {
          router.push(
            `/public/sendquick?quicksend=true&user_id=${user_id}&gift_id=${gift_id}`
          );
        } else if (searchParams.get("vcr") || searchParams.get("vid")) {
          router.push(`/manage-vcard?vcarduser=true`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
      if (
        err instanceof Error &&
        err.message === "Please verify your email before logging in"
      ) {

        // router.push(`/auth/register?verify_email=${email}&need_mail_verification_login=true`);
      }
      console.error("Login error:", err.message);
      setIsLoading(false);
    }
  };

  // Check for session ended message on mount
  useEffect(() => {
    const sessionEnded = searchParams.get("session_ended");

    if (sessionEnded === "true") {
      setError("Your session has ended because of a new login in another tab.");
      // Clear the URL parameters
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Current testimonial data
  const { text, name, role, rol1, rating } = testimonials[currentIndex];
  const [signUpWithEmail, setSignUpWithEmail] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative bg-gradient-to-b from-white to-primary-xlight p-4 ">
      {/* Logo Section */}
      <div className="mb-4">
        {partnerData?.logo_url ? (
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-center"
          >
            <Image
              src={partnerData?.logo_url}
              alt="Logo"
              className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
              width={189}
              height={48}
              priority
            />
          </Link>
        ) : (
          <>
            {!dataWithoutSecret && (
              <Link
                href="https://www.delightloop.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center"
              >
                <Image
                  src="/svgs/Logo.svg"
                  alt="Logo"
                  className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
                  width={189}
                  height={48}
                  priority
                />
              </Link>
            )}
          </>
        )}
        {/* Login Section - Left Side */}

        <div className="w-full grif place-items-center">
          {isInitialLoading ? (
            <div className="text-center">
              <h1 className="text-3xl font-semibold mb-2 text-[#101828] text-center">
                Welcome to DelightLoop
              </h1>
              <p className="font-normal text-base text-[#667085] mb-8 text-center">
                Verifying VCard details...
              </p>
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-[#7F56D9]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          ) : dataWithoutSecret || vcardData ? (
            <>
              <h1
                className={`text-3xl font-semibold mb-2 text-[#101828] text-center capitalize ${
                  referralCardUser ? "w-[80vw]" : ""
                }`}
              >
                Welcome{referralCardUser ? " " : vCardHasOwner ? " back" : ","}{" "}
                {referralCardUser ? "" : dataWithoutSecret || vcardData}{" "}
              </h1>

              {/* <p className="font-normal text-base text-[#667085] mb-5  text-center">
                You're one step away from claiming your smart Delightloop card.
              </p> */}
              {!vCardHasOwner &&
                !bothVCRandVidCorrectButUserHaventRegistered && (
                  <p className="font-normal text-base text-[#667085] mb-5  text-center">
                    Let's Get Your Card Activated!
                  </p>
                )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold mb-2 text-[#101828] text-center">
                Welcome to DelightLoop
              </h1>
              {showLoginSection && (
                <p className="font-normal text-base text-[#667085] mb-5  text-center">
                  Sign in to start sending personalized AI-powered gifts
                </p>
              )}
            </>
          )}

          {/* Login Section - Show based on showLoginSection state */}
          {!isInitialLoading && showLoginSection && (
            <div className="bg-white mx-auto p-6 rounded-lg shadow-sm w-full max-w-md">
              {!signUpWithEmail && (
                <>
                  <a
                    href={`${
                      process.env.NEXT_PUBLIC_API_BASE_URL
                    }/v1/auth/linkedin?${searchParams.toString()}`}
                    className="w-full font-medium bg-primary/95 hover:bg-primary text-white py-3 rounded-md flex items-center justify-center "
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLoading(true);
                      window.location.href = `${
                        process.env.NEXT_PUBLIC_API_BASE_URL
                      }/v1/auth/linkedin?${searchParams.toString()}`;
                    }}
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                        Continue with LinkedIn
                      </>
                    )}
                  </a>
                  <div className="flex items-center my-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4 text-gray-500 text-sm">OR</div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </>
              )}
              {/* Login Form */}
              {/* {signUpWithEmail ? ( */}

              <form
                className={`space-y-4 ${
                  bothVCRandVidCorrectButUserHaventRegistered ? "hidden" : ""
                }`}
                onSubmit={handleSubmit}
              >
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[#344054] text-sm font-medium mb-1"
                  >
                    Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[#344054] text-sm font-medium mb-1"
                  >
                    Password*
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && <div className="text-red-500 text-sm">{error} </div>}


                {error.includes("Please verify your email before logging in") && <Link href={`/auth/register?verify_email=${email}&need_mail_verification_login=true`} className="font-medium inline-block text-primary w-full text-center text-sm hover:text-primary-dark hover:underline">Resend Verification Link</Link>}

                {/* Reminder and Forgot Password */}
                <div className="flex items-center justify-center font-[450]">
                  {/* <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="reminder"
                          name="reminder"
                          className="h-4 w-4 text-[#7F56D9] border-gray-300 rounded-[8px]"
                        />
                        <label
                          htmlFor="reminder"
                          className="ml-2 text-sm text-[#344054] cursor-pointer"
                        >
                          Remember for 30 days
                        </label>
                      </div> */}
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary-dark hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                >
                  Sign in
                </button>
              </form>
              {bothVCRandVidCorrectButUserHaventRegistered && (
                <Link
                  href={`/auth/register${
                    searchParams.toString() ? `?${searchParams.toString()}` : ""
                  }`}
                  className="h-11 w-full bg-white text-primary border border-primary hover:bg-primary hover:text-white font-[500] rounded-[8px] duration-300 focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                >
                  Sign Up With Email
                </Link>
              )}
              <div
                className={`mt-4 text-center ${
                  bothVCRandVidCorrectButUserHaventRegistered ? "hidden" : ""
                }`}
              >
                <p className="text-sm text-[#667085] font-[500]">
                  Don&apos;t have an account?{" "}
                  {quicksend && user_id && gift_id ? (
                    <Link
                      href={`/auth/register?quicksend=true&user_id=${user_id}&gift_id=${gift_id}`}
                      className="text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  ) : searchParams.get("vcr") && searchParams.get("vid") ? (
                    <Link
                      href={`/auth/register?vcr=${searchParams.get(
                        "vcr"
                      )}&vid=${searchParams.get("vid")}`}
                      className="text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  ) : searchParams.get("vcr") ? (
                    <Link
                      href={`/auth/register?vcr=${searchParams.get("vcr")}`}
                      className="text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  ) : (
                    <Link
                      href="/auth/register"
                      className="text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  )}
                </p>
              </div>
              {/* <button
                    className="text-gray-500 mt-3 text-xs w-full text-center hover:text-black duration-300"
                    onClick={() => setSignUpWithEmail(false)}
                  >
                    Back to Sign in options
                  </button> */}

              {/* //   ) :
            //   <button
            //     className="w-full  border hover:bg-gray-50 font-medium border-gray-300 text-gray-700 py-3 rounded-md flex items-center justify-center"
            //     onClick={() => setSignUpWithEmail(true)}
            //   >
            //     <svg
            //       className="w-5 h-5 mr-2"
            //       viewBox="0 0 24 24"
            //       fill="currentColor"
            //     >
            //       <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            //     </svg>
            //     Sign in / Sign up with Email
            //   </button>} */}
            </div>
          )}

          {/* VCard Design - New Implementation - Show based on showVCardSection state */}
          {!isInitialLoading && showVCardSection && (
            <div className="mt-6">
              {/* Header Section */}
              <div className="text-center mb-6">
                {/* <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">✨</span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tap. Claim. Create.
                  </h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Your digital identity starts here — whether you're claiming
                  your card or making your own.
                </p> */}
              </div>

              {/* VCard Key Validation Loading */}
              {isValidatingVCardKey && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-[#7F56D9] mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm text-gray-600">
                      Validating VCard...
                    </span>
                  </div>
                </div>
              )}

              {/* Option 1: I have a card - Only show if VCard exists but unassigned */}
              {showVCardSection && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  {vCardHasOwner ? (
                    <>
                      {/* <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Already the owner?
                      </h3> */}
                      <p className="text-sm text-gray-600 mb-3">
                        Sign in to manage your card, Update your profile anytime
                      </p>

                      <button
                        onClick={() => {
                          setShowVCardSection(false);
                          setShowLoginSection(true);
                        }}
                        className="w-full px-4 py-2 bg-[#7F56D9] text-white rounded-md hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      {/* <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Got a Delightloop card?
                      </h3> */}
                      <p className="text-sm text-gray-600 mb-3">
                        Enter the 6-digit code to register and manage your
                        digital information
                      </p>
                      {/* <p className="text-sm text-gray-600 mb-3">
                        You'll then register to claim and manage your digital
                        identity.
                      </p> */}

                      <div className="mb-3">
                        <div className="flex gap-2 justify-center">
                          {codeInputs.map((value, index) => (
                            <input
                              key={index}
                              id={`code-input-${index}`}
                              type="text"
                              value={value}
                              onChange={(e) =>
                                handleCodeInputChange(index, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleCodeInputKeyDown(index, e)
                              }
                              onPaste={handleCodeInputPaste}
                              placeholder=""
                              className="w-12 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent text-lg font-medium"
                              maxLength={1}
                              pattern="\d"
                              inputMode="numeric"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleClaimCard}
                        disabled={
                          codeInputs.join("").length !== 6 || isLoadingVCard
                        }
                        className="w-full px-4 py-2 bg-[#7F56D9] text-white rounded-md hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoadingVCard ? (
                          <svg
                            className="animate-spin h-4 w-4 text-white mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : null}
                        Link My Card
                      </button>

                      {vCardError && (
                        <p className="mt-2 text-sm text-red-600">
                          {vCardError}
                        </p>
                      )}
                      {vcardData && (
                        <>
                          <p className="mt-2 text-sm text-green-600">
                            Welcome {vcardData}! VCard verified successfully.
                          </p>
                          <p className="mt-2 text-sm text-green-600 font-medium">
                            Proceed with sign in if existing user or sign up if
                            new user
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Option 2: I want a card - Always show when vcr is present */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">
                  {searchParams?.get("vcr")
                    ? `Not ${dataWithoutSecret}?`
                    : "No, but I want one!"}
                </h3>
                {/* <p className="text-sm text-gray-600 mb-3">
                  {searchParams?.get("vcr")
                    ? "Create your smart business card in minutes — powered by NFC magic."
                    : "Get your own NFC-enabled business card to share your contact in one tap."}
                </p> */}

                <button
                  //   onClick={handleCreateCard}
                  onClick={() => {
                    setShowVCardSection(false);
                    setShowLoginSection(true);
                    setBothVCRandVidCorrectButUserHaventRegistered(true);
                    setReferralCardUser(true);
                  }}
                  className="w-full px-4 py-2 bg-white text-[#7F56D9] border border-[#7F56D9] rounded-md hover:bg-[#7F56D9] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7F56D9] transition-colors"
                >
                  {searchParams?.get("vcr")
                    ? "Get My Card"
                    : "Create my free card"}
                </button>
              </div>
            </div>
          )}

          {/* Register Link */}
        </div>
        {/* <p className="text-sm text-gray-600 mt-6 text-center">
          By signing in, you agree to our{" "}
          <Link href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p> */}
      </div>

      {/* Testimonial Section - Right Side */}
      <div className="  lg:w-[50%]  h-screen relative hidden ">
        {/* Fixed Background Image */}
        {partner === "get-replies" ? (
          <Image
            src="/auth/partner-integration.png"
            alt="LOGIN IMAGE"
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src="/img/LoginPhoto.jpg"
            alt="LOGIN IMAGE"
            fill
            className="object-cover"
          />
        )}
        {/* Overlay Panel for the Testimonial */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end">
          <div className="bg-[#FFFFFF4D] bg-opacity-24 text-[#FFFFFF] p-4">
            <p className="text-[22px] mb-7 font-[400] text-[#FFFFFF]">{text}</p>
            <div className="flex justify-between">
              <p className="text-[28px] font-[600] text-[#FFFFFF] mb-0">
                {name}
              </p>
              <div className="flex items-center gap-1 text-[#FFFFFF]">
                {[...Array(rating)].map((_, i) => (
                  <span key={i}>
                    <Image
                      src="/svgs/Star 1.svg"
                      alt="star"
                      width={100}
                      height={100}
                      layout="responsive"
                    />
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[18px] font-[600] text-[#FFFFFF]">{role}</p>
            <p className="text-[16px] font-[400] text-[#FFFFFF]">{rol1}</p>

            {/* Navigation Arrows */}
            <div className="flex items-end justify-end gap-4">
              <button
                onClick={handlePrev}
                className="w-10 h-10 bg-[#FFFFFF4D] rounded-full hover:bg-gray-400 flex items-center justify-center"
              >
                &larr;
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 bg-[#FFFFFF4D] rounded-full hover:bg-gray-400 flex items-center justify-center"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay with Lottie Animation */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center  ">
            <InfinityLoader width={56} height={56} />

            {/* <div className="w-32 h-32 mb-4">
              <Lottie
                animationData={infinityAnimation}
                loop={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div> */}
            {/* <div className="flex items-center space-x-2">
              <p className="text-3xl text-slate-100 font-bold">Welcome to delightloop</p>
            </div> */}
          </div>
        </div>
      )}

      {/* Footer - Mobile responsive with icons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Copyright */}
          <p className="font-[400] text-[14px] text-[#667085] order-2 sm:order-1">
            © 2025
          </p>

          {/* Footer links - always visible except for get-replies partner */}
          {partner !== "get-replies" && (
            <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2">
              <a
                href="mailto:success@delightloop.com"
                className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                title="Support"
              >
                <HelpCircle className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Support</span>
              </a>
              <Link
                href="https://delightloop.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                title="About us"
              >
                <ExternalLink className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">About us</span>
              </Link>
              <Link
                href="https://www.delightloop.com/bookademo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                title="Book a meeting"
              >
                <Calendar className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Book a meeting</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {dataWithoutSecret && (
        <div className="absolute bottom-20 left-5 text-sm text-[#667085] font-[400]">
          Powered By Delightloop
        </div>
      )}
      {partner === "get-replies" && (
        <p className="absolute bottom-5 right-[45%] font-[400] text-[14px] text-[#667085] flex items-center gap-2">
          Powered by{" "}
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/Logo Final.png"
              alt="Logo"
              width={103}
              height={26}
              priority
            />
          </Link>
        </p>
      )}
    </div>
  );
}
