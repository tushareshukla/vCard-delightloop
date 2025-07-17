"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import { config } from "@/utils/config";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showResendButton, setShowResendButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const partner = searchParams.get("partner_id");
  const quicksend = searchParams.get("quicksend");
  const user_id = searchParams.get("user_id");
  const gift_id = searchParams.get("gift_id");
  const verify_email = searchParams.get("verify_email");
  const vcr = searchParams.get("vcr");
  console.log("verify_email", verify_email);

  const [partnerData, setPartnerData] = useState<any>(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState("");
  const [vCardId, setVCardId] = useState<string | null>(null);
  const [vcardData, setVCardData] = useState(null);

  // Function to fetch VCard data using key and secret
  const fetchVCardData = async (key: string, secret: string) => {
    try {
      const response = await fetch(
        `${config.BACKEND_URL}/v1/vcard/authenticate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: key,
            secret: secret,
          }),
        }
      );

      const data = await response.json();
      console.log("VCard data fetched on register page:", data);

      if (data.success) {
        setVCardData(data.data.fullName);
        console.log("VCard fullName:", data.data.fullName);
      } else {
        console.error("VCard authentication failed:", data.error_message);
        setVCardData(null);
      }

      return data;
    } catch (error) {
      console.error("Error fetching VCard data:", error);
      setVCardData(null);
      return null;
    }
  };

  const hasSentEmailRef = useRef(false);

  useEffect(() => {
    const need_mail_verification_login = searchParams.get(
      "need_mail_verification_login"
    );
    if (need_mail_verification_login && !hasSentEmailRef.current) {
      console.log("need_mail_verification_login", verify_email);
      hasSentEmailRef.current = true;
      handleResendVerification();
    }
    if (partner) {
      const fetchPartnerData = async () => {
        if (!partner) return;

        setIsLoadingPartner(true);
        setPartnerError(null);

        try {
          const response = await fetch(`/api/partner/${partner}`, {
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

  const [vcardFlow, setVcardFlow] = useState(false);
  // Fetch VCard data if both vcr and vid parameters are present
  useEffect(() => {
    const vcr = searchParams.get("vcr");
    const vid = searchParams.get("vid");

    if (vcr) {
      setVcardFlow(true);
    }

    if (vcr && vid) {
      console.log("Both vcr and vid found, fetching VCard data...", {
        vcr,
        vid,
      });
      fetchVCardData(vcr, vid);
    }
  }, [searchParams]);

  // Function to construct login URL with all preserved parameters
  const getLoginUrl = () => {
    // Get all current search parameters
    const params = new URLSearchParams();

    // Preserve all existing parameters
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Add vcardsignupuser=true if vcr param exists
    if (searchParams.get("vcr")) {
      params.append("vcardsignupuser", "true");
    }

    // If no parameters exist, return to root
    if (params.toString() === "") return "/";

    return `/?${params.toString()}`;
  };

  const validateEmail = async (email: string) => {
    try {
      const response = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toUpperCase() }),
      });

      const data = await response.json();

      if (!data.isValid) {
        setEmailError(data.message);
        setShowResendButton(data.action === "resend");
        return false;
      }

      setEmailError("");
      setShowResendButton(false);
      return true;
    } catch (error) {
      console.error("Email validation error:", error);
      return false;
    }
  };

  const handleResendVerification = async () => {
    try {
      const emailToUse = registeredEmail || formData.email || verify_email;
      console.log("Attempting to resend verification to:", emailToUse);

      // if (!emailToUse) {
      //   console.error('No email available for resend');
      //   setEmailError('Email address is missing');
      //   return;
      // }

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

  const [EmailTitle, setEmailTitle] = useState("Registration Successful!");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting registration process with form data:", {
      ...formData,
      password: "****",
    });

    setError("");
    setEmailError("");
    setIsLoading(true);

    try {
      // Password validation
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError(
          "Password must be at least 8 characters long, contain at least one letter, one number, and one special character (!@#$%^&*()_+-=) with no other symbols allowed."
        );
        setIsLoading(false);
        return;
      }

      // Validate email first
      const isEmailValid = await validateEmail(formData.email.toUpperCase());
      if (!isEmailValid) {
        setIsLoading(false);
        return;
      }

      // Proceed with registration if email is valid
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, quicksend, user_id, gift_id, vcr }),
      });
      const data = await response.json();
      console.log("Registration response:", data);

      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }
      if (data.success && vcr) {
        console.log("vcr", vcr);
        console.log("userId", data.data.id);

        // fetch vcard data by vcr key - direct API call
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const vCardResponse = await fetch(
            `${backendUrl}/v1/vcard/key/${vcr}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const vCardData = await vCardResponse.json();
          console.log("VCard data fetched:", vCardData);

          if (!vCardResponse.ok) {
            throw new Error("Failed to fetch VCard data");
          }

          if (vCardResponse.ok) {
            console.log("VCard data fetched:", vCardData);

            if (vCardData.success && vCardData.data) {
              // Store the VCard ID in a variable
              const fetchedVCardId = vCardData.data.vcard_id;
              console.log("VCard ID stored:", fetchedVCardId);

              setVCardId(fetchedVCardId);
            }
          }
        } catch (vCardError) {
          console.error("Error fetching VCard data:", vCardError);
        }
      }

      // Store the email before clearing form data
      const emailForVerification = formData.email;
      console.log("Storing email for verification:", emailForVerification);
      setRegisteredEmail(emailForVerification);
      setIsRegistered(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error && err.message === "Email already registered") {
        setEmailTitle("Email already registered. Please verify to continue.");
        setRegisteredEmail(formData.email);
        setIsRegistered(true);
        handleResendVerification();
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (verify_email) {
      setRegisteredEmail(verify_email);
      setIsRegistered(true);
      //   setTimeout(() => {
      //     handleResendVerification();
      //   }, 5000);
    }
  }, [verify_email]);

  if (isRegistered) {
    const displayEmail = registeredEmail || formData.email;
    console.log("Displaying success page with email:", displayEmail);

    return (
      <div className="flex h-screen w-full relative">
        <div className="lg:flex lg:w-2/3 md:w-full items-center justify-center bg-white p-8 h-full">
          <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 capitalize">
              {verify_email
                ? "Please verify your email before logging in"
                : "Registration Successful!"}
            </h1>
            <p className="text-gray-600">
              Please check your email to verify your account. We've sent a
              verification link to {displayEmail}
            </p>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or click below
                to resend.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="text-[#6941C6] hover:text-[#5a35b1] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isLoading ? (
                  <>
                    <InfinityLoader width={16} height={16} />
                    <span>Sending verification email...</span>
                  </>
                ) : (
                  <>
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
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    <span>Resend verification email</span>
                  </>
                )}
              </button>
              {emailError && (
                <p
                  className={`text-sm text-center ${
                    emailError.includes("sent")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {emailError}
                </p>
              )}
            </div>
            <div className="mt-6">
              {quicksend && user_id && gift_id ? (
                <Link
                  href={`/?quicksend=true&user_id=${user_id}&gift_id=${gift_id}`}
                  className="text-[#6941C6] hover:text-[#5a35b1] font-medium"
                >
                  Return to Login
                </Link>
              ) : (
                <Link
                  href={getLoginUrl()}
                  className="text-[#6941C6] hover:text-[#5a35b1] font-medium"
                >
                  Return to Login
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-[40%] h-screen relative">
          <Image
            src="/auth/Register.png"
            alt="Register background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full relative">
      {/* Logo Section */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 lg:left-5 lg:transform-none z-10">
        {partnerData?.logo_url ? (
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
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
          <Link
            href="https://www.delightloop.com/"
            className={`${vcardFlow ? "hidden" : ""}`}
            target="_blank"
            rel="noopener noreferrer"
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
      </div>

      {/* Form Section */}
      <div className="lg:flex lg:w-2/3 w-full items-center justify-center bg-white px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8 h-full overflow-y-auto">
        <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto">
          <div className="w-full">
            <h1 className="text-[32px] font-semibold mb-2 text-[#101828]">
              {vcardData ? `Welcome ${vcardData}!` : "Sign up"}
            </h1>
            <p
              className={`font-normal text-base text-[#667085] mb-5 ${
                vcardFlow ? "hidden" : ""
              }`}
            >
              Start your 30-day free trial with Delightloop
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid  gap-4">
                <div>
                  <label className="block text-[#344054] text-sm font-medium mb-1">
                    First Name*
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#344054] text-sm font-medium mb-1">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#344054] text-sm font-medium mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    // Clear any existing errors when user types
                    setEmailError("");
                    setShowResendButton(false);
                  }}
                  className={`h-11 w-full p-3 border ${
                    emailError ? "border-red-500" : "border-gray-300"
                  } rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]`}
                  required
                />
                {emailError && (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-red-500">{emailError}</span>
                    {showResendButton && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="text-sm text-purple-600 hover:text-purple-700"
                        disabled={isLoading}
                      >
                        Resend verification
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#344054] text-sm font-medium mb-1">
                  Password*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] pr-10"
                    required
                  />
                  <button
                    type="button"
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
                <p className="text-sm text-[#667085] font-[400] mt-1">
                  Password include letters, numbers & a special character
                  (!@#...).
                </p>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <InfinityLoader width={24} height={24} />
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#667085] font-[500]">
                Already have an account?{" "}
                {quicksend && user_id && gift_id ? (
                  <Link
                    href={`/?quicksend=true&user_id=${user_id}&gift_id=${gift_id}`}
                    className="text-[#6941C6] hover:text-[#5a35b1] font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                ) : searchParams.get("vcr") && searchParams.get("vid") ? (
                  <Link
                    href={`/?vcr=${searchParams.get(
                      "vcr"
                    )}&vid=${searchParams.get("vid")}`}
                    className="text-[#6941C6] hover:text-[#5a35b1] font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                ) : searchParams.get("vcr") ? (
                  <Link
                    href={`/?vcr=${searchParams.get("vcr")}`}
                    className="text-[#6941C6] hover:text-[#5a35b1] font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="text-[#6941C6] hover:text-[#5a35b1] font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="hidden lg:flex lg:w-[40%] h-screen relative">
        <Image
          src="/auth/Register.png"
          alt="Register background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0" />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <InfinityLoader width={56} height={56} />
        </div>
      )}

      <p className="absolute bottom-5 left-5 font-[400] text-[14px] text-[#667085] hidden sm:block">
        © DelightLoop 2025
      </p>
      {partner === "get-replies" && (
        <p className="absolute bottom-5 right-[55%] font-[400] text-[14px] text-[#667085] hidden sm:flex items-center gap-2">
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
