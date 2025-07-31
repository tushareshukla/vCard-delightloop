"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import { config } from "@/utils/config";
import TempLogo from "@/components/ui/TempLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const partner = searchParams.get("partner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Forgot Password] Starting password reset request");
    setError("");
    setIsLoading(true);

    try {
      console.log("[Forgot Password] Sending request to API");
      const response = await fetch(
        `${config.BACKEND_URL}/v1/password-reset/request?vcardflow=true`,
        {
          // const response = await fetch(`http://localhost:5500/v1/password-reset/request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );
      //
      console.log("[Forgot Password] Received response:", response.status);
      const data = await response.json();
      console.log("[Forgot Password] Response data:", data);

      if (!data.success) {
        console.error('[Forgot Password] API error:', data.error);
        const errorMessage = data.error === "Invalid email format"
          ? "That doesn't look like a valid email. Missing something?"
          : data.error || 'Failed to process request';
        throw new Error(errorMessage);
      }

      // Navigate to check-mail page with email parameter
      console.log(
        "[Forgot Password] Request successful, navigating to check-mail page"
      );
      const params = new URLSearchParams();
      params.append("email", email);
      // Append all existing URL parameters
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      router.push(`/auth/forgot-password/check-mail-page?${params.toString()}`);
    } catch (err) {
      console.error("[Forgot Password] Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [emailError, setEmailError] = useState("");

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
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
  const [isEmailSent, setIsEmailSent] = useState(false);

  if (isEmailSent) {
    console.log("[Forgot Password] Rendering success state");
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Check your email
            </h1>
            <p className="text-gray-600">
              We have sent a password reset link to {email}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="text-[#6941C6] hover:text-[#5a35b1] font-medium"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-[40%] h-screen relative">
          <Image
            src="/img/LoginPhoto.jpg"
            alt="LOGIN IMAGE"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
      </div>
    );
  }

  console.log("[Forgot Password] Rendering form");
  return (
    <div className="flex h-screen w-full relative">
      {/* Logo Section */}
      <div className="absolute top-5  left-1/2 transform -translate-x-1/2 lg:left-5 lg:transform-none z-10">
        {partner === "get-replies" ? (
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/partner-integrations/g-replies.png"
              alt="Logo"
              className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
              width={189}
              height={48}
              priority
            />
          </Link>
        ) : (
            <TempLogo   />
        )}
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-2/3 flex items-start lg:items-center justify-center bg-white px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8 h-full overflow-y-auto">
        <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto">
          <div className="w-full">
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-[#F4EBFF] rounded-full flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M20 8V14M23 11H17M12.5 7C12.5 9.20914 10.7091 11 8.5 11C6.29086 11 4.5 9.20914 4.5 7C4.5 4.79086 6.29086 3 8.5 3C10.7091 3 12.5 4.79086 12.5 7Z"
                    stroke="#7F56D9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-[32px] font-semibold mb-2 text-[#101828] text-center">
              Forgot password?
            </h1>
            <p className="font-normal text-base text-[#667085] mb-5 text-center">
              No worries, we'll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => {
                    console.log("[Forgot Password] Email input changed");
                    setEmail(e.target.value.trim());
                  }}
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {!emailError && error && (
                <div className="text-red-500 text-sm">
                  {error ==
                  "Email not verified. Please verify your email first to reset password." ? (
                    <p>
                      This email hasn’t been verified yet.{" "}
                      <button
                        className="text-primary font-medium hover:text-primary/90"
                        onClick={(e) => handleResendVerification(e)}
                      >
                        {" "}
                        [Resend Verification Link]
                      </button>
                    </p>
                  ) : (
                    error
                  )}
                </div>
              )}

              {emailError && (
                <div className="text-green-500 text-sm">{emailError}</div>
              )}

              <button
                type="submit"
                className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <InfinityLoader width={24} height={24} />
                ) : (
                  "Reset password"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href={`/login${
                  searchParams.toString() ? `?${searchParams.toString()}` : ""
                }`}
                className="text-[#6941C6] hover:text-[#5a35b1] font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.66667 3.33333L2 8M2 8L6.66667 12.6667M2 8H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to log in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="hidden lg:flex lg:w-[40%] h-screen relative">
        <Image
          src="/img/LoginPhoto.jpg"
          alt="LOGIN IMAGE"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <InfinityLoader width={56} height={56} />
        </div>
      )}

      <p className="absolute bottom-5 left-5 font-[400] text-[14px] text-[#667085]">
        © Delighto 2025
      </p>
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
