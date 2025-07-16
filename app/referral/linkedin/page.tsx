"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function LinkedInInputPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralVcr = searchParams?.get("vcr");

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinRegex =
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url) || url.includes("linkedin.com/in/");
  };

  const extractLinkedInUsername = (url: string) => {
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/,
      /linkedin\.com\/in\/([^\/\?]+)\//,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleContinue = async () => {
    setError(null);

    if (!linkedinUrl.trim()) {
      setError("Please enter your LinkedIn profile URL");
      return;
    }

    if (!validateLinkedInUrl(linkedinUrl)) {
      setError("Please enter a valid LinkedIn profile URL");
      return;
    }

    setIsValidating(true);

    try {
      const username = extractLinkedInUsername(linkedinUrl);
      if (!username) {
        throw new Error("Could not extract username from LinkedIn URL");
      }

      const requestBody: any = {
        linkedinUrl: linkedinUrl.trim(),
        username: username,
      };

      if (referralVcr) {
        requestBody.referredByVcr = referralVcr;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/fetchLinkedin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (data.success && data.data?.draft_vcardId) {
        const params = new URLSearchParams();
        params.set("draftId", data.data.draft_vcardId);
        if (referralVcr) {
          params.set("vcr", referralVcr);
        }
        // Pass the LinkedIn URL to the preview page so it can be auto-filled
        params.set("linkedinUrl", encodeURIComponent(linkedinUrl.trim()));
        router.push(`/referral/preview?${params.toString()}`);
      } else {
        setError(
          data.error_message ||
            "Failed to fetch LinkedIn profile. Please check the URL and try again."
        );
      }
    } catch (error) {
      console.error("Error fetching LinkedIn data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to connect to LinkedIn. Please try again."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (referralVcr) {
      params.set("vcr", referralVcr);
      router.push(`/?${params.toString()}`);
    } else {
      router.push("/");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLinkedinUrl(value);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF]">
      <div className="max-w-md mx-auto min-h-screen">
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative pt-6 pb-8 px-6">
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="text-center pt-12">
              {/* Progress Indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">1</span>
                  </div>
                  <div className="w-12 h-1 bg-gray-200 rounded-full">
                    <div className="w-4 h-1 bg-[#7C3AED] rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm font-semibold">
                      2
                    </span>
                  </div>
                  <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm font-semibold">
                      3
                    </span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Let's personalize your card
              </h1>
              <p className="text-gray-600 mb-8">
                We'll use your public LinkedIn profile to generate your smart
                card.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 space-y-6">
            <div>
              <label
                htmlFor="linkedin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                LinkedIn Profile URL
              </label>
              <Input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={handleUrlChange}
                onKeyPress={handleKeyPress}
                placeholder="linkedin.com/in/yourname"
                className={`w-full px-4 py-4 text-lg rounded-xl border-2 ${
                  error
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-[#7C3AED]"
                } focus:outline-none transition-colors`}
                disabled={isValidating}
              />

              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="flex-1 flex flex-col justify-end px-6 py-8">
            <Button
              onClick={handleContinue}
              disabled={isValidating || !linkedinUrl.trim()}
              className={`w-full font-bold py-6 rounded-2xl text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg ${
                isValidating || !linkedinUrl.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white"
              }`}
            >
              {isValidating ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Importing from LinkedIn...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Your LinkedIn data is processed securely and not stored
              permanently
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
