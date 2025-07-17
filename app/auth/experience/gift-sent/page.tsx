"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import GiftTrackingProgress from "@/components/ui/GiftTrackingProgress";
import { useRouter, useSearchParams } from "next/navigation";
import { config } from "@/utils/config";

// Add CSS keyframes and styles at the top of the file
const styles = `
  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }

  .shimmer-border {
    position: relative;
    background: linear-gradient(90deg,
      rgba(255,255,255,0) 0%,
      rgba(105,65,198,0.08) 25%,
      rgba(105,65,198,0.08) 50%,
      rgba(105,65,198,0.08) 75%,
      rgba(255,255,255,0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes borderGlow {
    0%, 100% {
      box-shadow: 0 0 0 1px rgba(105, 65, 198, 0.1);
    }
    50% {
      box-shadow: 0 0 0 2px rgba(105, 65, 198, 0.2);
    }
  }

  @keyframes borderFlow {
    0% {
      border-image-source: linear-gradient(
        to right,
        rgba(105, 65, 198, 0.1) 0%,
        rgba(105, 65, 198, 0.1) 100%
      );
    }
    25% {
      border-image-source: linear-gradient(
        to bottom,
        rgba(105, 65, 198, 0.1) 0%,
        rgba(105, 65, 198, 0.2) 100%
      );
    }
    50% {
      border-image-source: linear-gradient(
        to left,
        rgba(105, 65, 198, 0.1) 0%,
        rgba(105, 65, 198, 0.1) 100%
      );
    }
    75% {
      border-image-source: linear-gradient(
        to top,
        rgba(105, 65, 198, 0.1) 0%,
        rgba(105, 65, 198, 0.2) 100%
      );
    }
    100% {
      border-image-source: linear-gradient(
        to right,
        rgba(105, 65, 198, 0.1) 0%,
        rgba(105, 65, 198, 0.1) 100%
      );
    }
  }

  .button-container {
    position: relative;
    transition: all 0.5s ease-in-out;
  }

  .animated-button {
    position: relative;
    border: 1px solid transparent;
    border-image-slice: 1;
    background-clip: padding-box;
    background-color: white;
    transition: all 0.3s ease-in-out;
  }

  .animated-button::before {
    content: '';
    position: absolute;
    inset: -1px;
    z-index: -1;
    border-radius: 8px;
    background: linear-gradient(90deg,
      rgba(105, 65, 198, 0.1),
      rgba(105, 65, 198, 0.2),
      rgba(105, 65, 198, 0.1)
    );
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  .button-container.active .animated-button {
    animation: borderGlow 3s ease-in-out;
  }

  .button-container.active .animated-button::before {
    opacity: 1;
  }
`;

export default function GiftSentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");
  const [activeButton, setActiveButton] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const searchParams = useSearchParams();
  const recipientId = searchParams.get("recipient_id");
  const router = useRouter();
  // Set up the animation sequence

  useEffect(() => {
    const getCookies = async () => {
      const response = await fetch("/api/cookies/get");
      const data = await response.json();
      console.log("get cookiesdata1", data);
      return data;
    };
    getCookies().then((cookies) => {
      setTimeout(() => {
        console.log("get cookiesdata2", cookies.auth_token);
        if (cookies.auth_token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/auth/experience");
        }
      }, 1000);
    });

    const interval = setInterval(() => {
      setActiveButton((prev) => (prev + 1) % 3);
    }, 4000); // Changed from 3000 to 4000ms

    return () => clearInterval(interval);
  }, []);

  // Function to handle referral click
  const handleReferralClick = async () => {
    // You'll need to implement this API route to securely make the API call
    try {
      const response = await fetch("/api/referralcandy/get-referral-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com", // You'll need to pass the actual user email
        }),
      });

      const data = await response.json();
      if (data.referral_link) {
        window.open(data.referral_link, "_blank");
      }
    } catch (error) {
      console.error("Error getting referral link:", error);
    }
  };

  // Add this function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userId = searchParams.get("user_id");
      const token = searchParams.get("token");

      console.log("Request Details:", {
        userId,
        token,
        email,
      });

      if (!userId || !token) {
        setError("Missing authentication details. Please try again.");
        return;
      }

      const response = await fetch(
        `${config.BACKEND_URL}/v1/auth/validate/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workEmail: email,
          }),
        }
      );

      // Get text response first
      const responseText = await response.text();
      console.log("Raw Response:", responseText);

      // Try parsing as JSON
      try {
        const data = JSON.parse(responseText);

        // Check if response contains error
        if (data.error_code) {
          console.error("API Error:", data);
          setError(data.error_message || "An error occurred");
          return;
        }

        // Handle successful response with cookie data
        if (data.cookieData) {
          console.log("Cookie Data:", data.cookieData);
          console.table(data.cookieData);

          // Delete existing cookies first (set expired date)
          const cookiesToDelete = [
            "auth_token",
            "user_id",
            "user_email",
            "organization_id",
          ];
          cookiesToDelete.forEach((cookieName) => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          });

          // Set new cookies with values from response
          Object.entries(data.cookieData).forEach(([key, value]) => {
            // Set cookie with 1 day expiration
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            document.cookie = `${key}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
          });

          // Also store in localStorage as backup
          Object.entries(data.cookieData).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });

          // Close modal and redirect to dashboard
          setIsModalOpen(false);
          router.push("/dashboard");
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setError("Unexpected response from server");
      }
    } catch (error) {
      console.error("Request failed:", error);
      setError("Network error. Please try again.");
    }
  };

  // Helper function to handle errors
  const handleError = (status: number, data: any) => {
    switch (status) {
      case 400:
        setError(data.message || "Invalid email format");
        break;
      case 401:
        setError("Authentication failed");
        break;
      case 404:
        setError("User not found");
        break;
      default:
        setError(data.message || "An error occurred");
    }
  };

  const handleCopyTrackingLink = async () => {
    const trackingLink = `${window.location.origin}/public/gift-tracker/${recipientId}`;
    try {
      await navigator.clipboard.writeText(trackingLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-3 border-b">
        <div className="flex items-center">
          <Image
            src="/Logo Final.png"
            alt="logo"
            className="w-32 md:w-40"
            width={182}
            height={32}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4">
        {/* Success Confirmation */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Your Gift is on the Way!
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            We're preparing your gift. You'll receive updates as it progresses.
          </p>
        </div>

        {/* Gift Tracking Card */}
        <div className="border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="text-lg font-semibold mb-4">Gift Tracking</h2>

          {/* Progress Bar */}
          <GiftTrackingProgress
            currentStatus="processing"
            giftSendPage={true}
          />

          {/* Status Details */}
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-[#7F56D9]/10 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/svgs/box.svg"
                    alt="Processing"
                    width={20}
                    height={20}
                    className="text-[#7F56D9]"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#7F56D9]">
                    Processing
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Our gifting agents are preparing your gift for shipment.
                  </p>
                  <button
                    onClick={handleCopyTrackingLink}
                    className="mt-3 inline-flex items-center px-3 py-1.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#7F56D9]/90 transition-all duration-300 gap-2 w-full justify-center group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Image
                        src="/svgs/box.svg"
                        alt="Track"
                        width={14}
                        height={14}
                        className="brightness-0 invert"
                      />
                      <span className="text-sm font-medium">
                        {isCopied
                          ? "✨ Link Copied!"
                          : "Track My Gift's Journey ✨"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/svgs/calendar.svg"
                    alt="Estimated Delivery"
                    width={20}
                    height={20}
                    className="text-gray-600"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Estimated Delivery
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                  Your gift is expected to arrive in 3-5 business days after the recipient confirms the address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps and Expansion Grid */}
        <div className="mt-8">
          {/* Ready to Delight at scale? Section */}
          <div className="border border-gray-200 rounded-lg p-8 bg-gradient-to-br from-violet-50 to-violet-100 relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
              <div
                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl animate-float"
                style={{ animationDelay: "1s" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Gift Image Section */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <div
                    className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"
                    style={{ animationDuration: "3s" }}
                  />
                  <Image
                    src="/img/Gift.png"
                    alt="Gift Box"
                    width={192}
                    height={192}
                    className="relative z-10 animate-float"
                    style={{ animationDuration: "6s" }}
                  />
                  <div className="absolute -top-2 -right-2 animate-ping-slow">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                        fill="#7F56D9"
                      />
                    </svg>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-lg font-semibold mb-4 text-[#101828] font-sans">
                    One gift sent. Countless connections waiting.
                  </h2>
                  <p className="text-[#475467] text-sm md:text-base mb-6 font-sans">
                    Experience the power of AI-driven gifting that's 6x more
                    likely to generate responses than traditional outreach.
                  </p>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Link
                      href="https://www.delightloop.com/bookademo"
                      className="inline-flex items-center justify-center h-11 px-5 py-2 font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow"
                    >
                      Let's Scale Your Gifting
                      <svg
                        className="ml-2 w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-primary text-white  px-4 py-2  rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200 whitespace-nowrap  items-center gap-2"
                    >
                      Create Campaign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ReferralCandy Section */}
        {/* <div className="mt-5 border border-primary/10 rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Love DelightLoop?
                </h3>
                <p className="text-sm text-gray-600">
                  Share with friends and earn $50 credit for each referral
                </p>
              </div>
              <button
                onClick={handleReferralClick}
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share & Earn
              </button>
            </div>
          </div>
        </div> */}
      </main>

      {/* ReferralCandy Purchase Tracking Script */}
      <Script
        id="refcandy-purchase-js"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(d,s) {
              var rc = "//go.referralcandy.com/purchase/ta5jjqk2bvpu7yb9mmqvlm27f.js";
              var js = d.createElement(s);
              js.src = rc;
              var fjs = d.getElementsByTagName(s)[0];
              fjs.parentNode.insertBefore(js,fjs);
            }(document,"script");
          `,
        }}
      />

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-sm md:text-base font-medium text-gray-900 mb-4">
              Enter your work email to start delighting at scale
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full border border-gray-200 rounded-lg p-2 mb-4"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
