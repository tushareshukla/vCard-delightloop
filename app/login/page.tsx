"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import InfinityLoader from "@/components/common/InfinityLoader";
import { HelpCircle, ExternalLink, Calendar } from "lucide-react";
import { config } from "@/utils/config";
import TempLogo from "@/components/ui/TempLogo";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [vCardData, setVCardData] = useState<string | null>(null);
  const [isLoadingVCard, setIsLoadingVCard] = useState(false);
  const [vCardError, setVCardError] = useState<string | null>(null);
  const [showVCardSection, setShowVCardSection] = useState(false);
  const [isValidatingVCardKey, setIsValidatingVCardKey] = useState(false);
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [showLoginSection, setShowLoginSection] = useState(
    !searchParams.get("vcr") && !searchParams.get("vid")
  );
  const [vCardExists, setVCardExists] = useState(false);
  const [vCardHasOwner, setVCardHasOwner] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(
    !!searchParams.get("vcr") || !!searchParams.get("vid")
  );
  const [dataWithoutSecret, setDataWithoutSecret] = useState<string | null>(
    null
  );
  const [
    bothVCRandVidCorrectButUserHaventRegistered,
    setBothVCRandVidCorrectButUserHaventRegistered,
  ] = useState(false);
  const [referralCardUser, setReferralCardUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ----------- VCard & Main Page Logic -----

  const vcr = searchParams.get("vcr");
  const vid = searchParams.get("vid");
  const vcardsignupuser = searchParams.get("vcardsignupuser");
  const errorMessage = searchParams.get("error");
//   for new user who comes from / page to register we are showing only linkedin and signup button
const newUser= searchParams.get("newUser");
  useEffect(() => {
    if (vcardsignupuser) {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(true);
      setIsInitialLoading(false);
      return;
    }
    // if this is new user we are hiding inputs fields and showing only linkedin and signup button
    if(newUser)
    {
        setShowVCardSection(false);
        setShowLoginSection(true);
        setBothVCRandVidCorrectButUserHaventRegistered(true);
        setReferralCardUser(true);
    }

    if (vcr) {
      setIsInitialLoading(true);
      if (vid) {
        setShowVCardSection(false);
        setShowLoginSection(true);
        setVCardExists(true);
        setIsInitialLoading(false);
      } else {
        validateVCardKey(vcr);
      }
    } else {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(false);
    }
    if (errorMessage) {
      console.log("errorMessage", errorMessage);
    }
    // eslint-disable-next-line
  }, [searchParams]);

  // ----------- VCard Key Validate
  const validateVCardKey = async (key: string) => {
    if (!key) {
      setShowVCardSection(false);
      setShowLoginSection(true);
      setVCardExists(false);
      return;
    }
    setIsValidatingVCardKey(true);
    try {
      const res = await fetch(`${config.BACKEND_URL}/v1/vcard/key/${key}`);
      const data = await res.json();
      if (data.success && !data.data.userId) {
        setVCardExists(true);
        setShowVCardSection(true);
        setShowLoginSection(false);
        fetchVcardDataWithoutSecret(key);
      } else if (data.success && data.data.userId) {
        setVCardExists(true);
        setVCardHasOwner(true);
        setShowVCardSection(true);
        setShowLoginSection(false);
        fetchVcardDataWithoutSecret(key);
      } else {
        setVCardExists(false);
        setShowVCardSection(false);
        setShowLoginSection(true);
        setIsInitialLoading(false);
      }
    } catch (error) {
      setVCardExists(false);
      setShowVCardSection(false);
      setShowLoginSection(true);
      setIsInitialLoading(false);
    } finally {
      setIsValidatingVCardKey(false);
    }
  };

  const fetchVcardDataWithoutSecret = async (key: string) => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/v1/vcard/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) setDataWithoutSecret(data.data.fullName);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // ----------- VCard Code Input Handlers
  const handleCodeInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  const handleCodeInputKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };
  const handleCodeInputPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("").filter((char) => /\d/.test(char));
    if (digits.length === 6) {
      setCodeInputs(digits);
      const lastInput = document.getElementById(`code-input-5`);
      if (lastInput) lastInput.focus();
    }
  };
  const handleClaimCard = () => {
    const fullCode = codeInputs.join("");
    if (fullCode.length === 6) fetchVCardData(fullCode);
  };

  // ----------- VCard Authentication (by code)
  const fetchVCardData = async (secret: string) => {
    const vcr = searchParams.get("vcr");
    if (!vcr || !secret) {
      setVCardError("Both key and secret are required");
      return;
    }
    setIsLoadingVCard(true);
    setVCardError(null);

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/v1/vcard/authenticate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: vcr, secret }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setVCardData(data.data.fullName);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("vid", secret.toUpperCase());
        window.history.replaceState({}, "", currentUrl.toString());
        setShowVCardSection(false);
        setShowLoginSection(true);
        setVCardExists(true);
        setBothVCRandVidCorrectButUserHaventRegistered(true);
      } else {
        setVCardError(data.error_message || "Authentication failed");
        setVCardData(null);
      }
    } catch {
      setVCardError("Failed to authenticate VCard");
      setVCardData(null);
    } finally {
      setIsLoadingVCard(false);
    }
  };

  // ----------- Login Submit Handler
  const setCookies = (
    auth_token: string,
    user_email: string,
    user_id: string,
    organization_id: string
  ) => {
    const cookieOptions = {
      expires: 2,
      sameSite: "Lax" as const,
      secure: true,
    };
    Cookies.set("auth_token", auth_token, cookieOptions);
    Cookies.set("user_email", user_email, cookieOptions);
    Cookies.set("user_id", user_id, cookieOptions);
    Cookies.set("organization_id", organization_id, cookieOptions);
  };

  const [emailError, setEmailError] = useState("");
  const [showResendButton, setShowResendButton] = useState(false);

  // ----------- Resend Verification Handler
  const handleResendVerification = async () => {
    try {
      const emailToUse = email;
      console.log("Attempting to resend verification to:", emailToUse);

      setIsLoading(true);
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToUse?.trim().toLowerCase() || "",
        }),
      });

      const data = await response.json();
      console.log("Resend verification response:", data);

      if (data.success) {
        setEmailError(
          "Verification email sent successfully! Please check your inbox."
        );
        setShowResendButton(false);
      } else {
        setEmailError(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setEmailError("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    // Remove error param from URL if it exists
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLocaleLowerCase(), password }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setCookies(
        data.data?.session_token,
        data.data?.email,
        data.data?.id,
        data.data?.organizationId
      );

      if (searchParams.get("vcr") || searchParams.get("vid")) {
        router.push(`/manage-vcard?vcarduser=true`);
      } else {
        router.push("/manage-vcard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
      setIsLoading(false);
    }
  };

  // ----------- Session Ended UI
  useEffect(() => {
    const sessionEnded = searchParams.get("session_ended");
    if (sessionEnded === "true") {
      setError("Your session has ended because of a new login in another tab.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // ----------- RENDER STARTS
  return (
    <div className="grid items-center justify-center min-h-screen w-full relative bg-gradient-to-b from-white to-primary-xlight p-4 ">
      {/* Logo Section */}
      <div className="mb-4 px-4 md:px-8">
        {!dataWithoutSecret && (
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-center"
          >
            {/* <Image
              src="/svgs/Logo.svg"
              alt="Logo"
              className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
              width={189}
              height={48}
              priority
            /> */}
          </Link>

        )}

        <div className="w-full grid place-items-center mt-10">
          {/* --- INITIAL LOADING --- */}
          {isInitialLoading ? (
            <div className="text-center">
              <h1 className="text-3xl font-semibold mb-2 text-[#101828] text-center">
                Welcome to Delighto
              </h1>
              <p className="font-normal text-base text-[#667085] mb-8 text-center">
                Verifying VCard details...
              </p>
              <div className="flex items-center justify-center">
                <InfinityLoader width={64} height={64} />
                {/* <svg
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
                  />
                </svg> */}
              </div>
            </div>
          ) : dataWithoutSecret || vCardData ? (
            <>
              <h1
                className={`text-3xl font-semibold mb-2 text-[#101828] text-center capitalize ${
                  referralCardUser ? "w-[80vw]" : ""
                }`}
              >
                Welcome{referralCardUser ? " " : vCardHasOwner ? " back" : ","}{" "}
                {referralCardUser ? "" : dataWithoutSecret || vCardData}
              </h1>
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
                {/* Welcome to DelightLoop */}
              </h1>
              {showLoginSection && (
                <p className="font-normal text-base text-[#667085] mb-5  text-center">
                  {/* Sign in to start sending personalized AI-powered gifts */}
                </p>
              )}
            </>
          )}

          {/* --- LOGIN FORM --- */}
          {!isInitialLoading && showLoginSection && (
            <div className="bg-white mx-auto p-6 rounded-lg shadow-sm w-full max-w-md">
              <a
                href={`${
                  config.BACKEND_URL
                }/v1/auth/linkedin?vcardflow=true&${searchParams.toString()}`}
                className="w-full font-medium bg-primary/95 hover:bg-primary text-white py-3 rounded-md flex items-center justify-center"
                onClick={(e) => {
                  // Remove error param from URL if it exists
                  const url = new URL(window.location.href);
                  url.searchParams.delete("error");
                  window.history.replaceState({}, "", url.toString());

                  e.preventDefault();
                  setIsLoading(true);
                  window.location.href = `${
                    config.BACKEND_URL
                  }/v1/auth/linkedin?vcardflow=true&${searchParams.toString()}`;
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
                    />
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
              <form
                className={`space-y-4 ${
                  bothVCRandVidCorrectButUserHaventRegistered ? "hidden" : ""
                }`}
                onSubmit={handleSubmit}
              >
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
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[#344054] text-sm font-medium mb-1"
                  >
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && !emailError && (
                  <div className="text-sm text-red-500">
                    {error.includes("Reset your password") ? (
                      <>
                        We couldn’t log you in. Please verify your credentials
                        or{" "}
                        <Link
                          href={`/auth/forgot-password${
                            searchParams.toString()
                              ? `?${searchParams.toString()}`
                              : ""
                          }`}
                          className="text-primary hover:text-primary-dark underline transition-colors duration-200"
                        >
                          Reset your password
                        </Link>
                        .
                      </>
                    ) : (
                      error
                    )}
                  </div>
                )}

                {emailError && (
                  <div className="text-green-500 text-sm ">{emailError} </div>
                )}
                {error.includes(
                  "Please verify your email before logging in"
                ) && (
                  <button
                    onClick={handleResendVerification}
                    className="font-medium inline-block text-primary w-full text-center text-sm hover:text-primary-dark hover:underline"
                  >
                    Resend Verification Link
                  </button>
                )}

                <div className="flex items-center justify-center font-[450]">
                  <Link
                    onClick={() => {
                      // Remove error param from URL if it exists
                      const url = new URL(window.location.href);
                      url.searchParams.delete("error");
                      window.history.replaceState({}, "", url.toString());
                    }}
                    href={`/auth/forgot-password${
                      searchParams.toString()
                        ? `?${searchParams.toString()}`
                        : ""
                    }`}
                    className="text-sm text-primary hover:text-primary-dark hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                >
                  Sign in
                </button>
              </form>
              {errorMessage && (
                <div className="text-red-500 mt-2 text-sm ">
                  {errorMessage
                    ? "Email already registered. Log in with email and password instead of LinkedIn."
                    : ""}{" "}
                </div>
              )}
              {bothVCRandVidCorrectButUserHaventRegistered && (
                <Link
                  href={`/auth/register${
                    searchParams.toString() && !searchParams.get('newUser') ? `?${searchParams.toString()}` : ""
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
                <p
                  className={`text-sm text-[#667085] font-[500] ${
                    vCardHasOwner ? "hidden" : ""
                  }`}
                >
                  Don&apos;t have an account?{" "}
                  <Link
                    onClick={() => {
                      // Remove error param from URL if it exists
                      const url = new URL(window.location.href);
                      url.searchParams.delete("error");
                      window.history.replaceState({}, "", url.toString());
                    }}
                    href={`/auth/register${
                      searchParams.toString()
                        ? `?${searchParams.toString()}`
                        : ""
                    }`}
                    className="text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* --- VCARD FLOW --- */}
          {!isInitialLoading && showVCardSection && (
            <div className="mt-6">
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
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Validating VCard...
                    </span>
                  </div>
                </div>
              )}

              {showVCardSection && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  {vCardHasOwner ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Sign in to manage your card, Update your profile anytime
                      </p>
                      <button
                        onClick={() => {
                          // Remove error param from URL if it exists
                          const url = new URL(window.location.href);
                          url.searchParams.delete("error");
                          window.history.replaceState({}, "", url.toString());
                          setShowVCardSection(false);
                          setShowLoginSection(true);
                        }}
                        className="w-full px-4 py-2 bg-[#7F56D9] text-white rounded-md hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                      >
                        Sign In
                      </button>
                      {errorMessage && (
                        <div className="text-red-500 mt-2 text-sm ">
                          {errorMessage
                            ? "Email already registered. Log in with email and password instead of LinkedIn."
                            : ""}{" "}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Enter the 6-digit code to register and manage your
                        digital information
                      </p>
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
                              className="size-10 sm:size-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent text-lg font-medium"
                              maxLength={1}
                              pattern="\d"
                              inputMode="numeric"
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleClaimCard();
                          // Remove error param from URL if it exists
                          const url = new URL(window.location.href);
                          url.searchParams.delete("error");
                          window.history.replaceState({}, "", url.toString());
                        }}
                        disabled={
                          codeInputs.join("").length !== 6 || isLoadingVCard
                        }
                        className="w-full px-4 py-2 bg-[#7F56D9] text-white rounded-md hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoadingVCard && (
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
                            />
                          </svg>
                        )}
                        Link My Card
                      </button>
                      {vCardError && (
                        <p className="mt-2 text-sm text-red-600">
                          {vCardError}
                        </p>
                      )}
                      {errorMessage && (
                        <div className="text-red-500 mt-2 text-sm ">
                          {errorMessage
                            ? "Email already registered. Log in with email and password instead of LinkedIn."
                            : ""}{" "}
                        </div>
                      )}
                      {vCardData && (
                        <>
                          <p className="mt-2 text-sm text-green-600">
                            Welcome {vCardData}! VCard verified successfully.
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
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">
                  {searchParams?.get("vcr")
                    ? `Not ${dataWithoutSecret}?`
                    : "No, but I want one!"}
                </h3>
                <button
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
        </div>
        {showLoginSection && (
          <div className=" text-sm text-[#667085] mt-6  flex items-center gap-1 justify-center">
            Powered By <TempLogo  />

          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3  text-primary place-self-end w-screen px-4">
        <p className="font-[400] text-[14px] text-[#667085] order-2 sm:order-1">
          © 2025 Delighto
        </p>

        <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2 ">
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
      </div>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <InfinityLoader width={56} height={56} />
        </div>
      )}
    </div>
  );
}
