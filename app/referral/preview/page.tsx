"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import Image from "next/image";

// Import brand icons from react-icons
import { FaPhone, FaLinkedinIn } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

interface DraftVCardData {
  draft_vcardId: string;
  handle: string;
  fullName: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme: string;
  links: Array<{
    type: string;
    value: string;
    isVisible: boolean;
  }>;
  userData?: {
    position?: Array<{
      title?: string;
      companyName?: string;
    }>;
    headline?: string;
    [key: string]: any;
  };
}

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftData, setDraftData] = useState<DraftVCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable contact fields (required for onboarding)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  // Track if fields were pre-populated from LinkedIn
  const [emailFromLinkedIn, setEmailFromLinkedIn] = useState(false);
  const [phoneFromLinkedIn, setPhoneFromLinkedIn] = useState(false);
  const [linkedinFromLinkedIn, setLinkedinFromLinkedIn] = useState(false);

  // Track if fields are being edited (optional fields)
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingLinkedin, setIsEditingLinkedin] = useState(false);

  // Image validation states
  const [validAvatarUrl, setValidAvatarUrl] = useState<string | null>(null);
  const [validCompanyLogoUrl, setValidCompanyLogoUrl] = useState<string | null>(
    null
  );
  const [validCoverImageUrl, setValidCoverImageUrl] = useState<string | null>(
    null
  );

  const draftId = searchParams?.get("draftId");
  const referralVcr = searchParams?.get("vcr");
  const linkedinUrlFromParams = searchParams?.get("linkedinUrl"); // Get LinkedIn URL from URL params

  useEffect(() => {
    if (draftId) {
      fetchDraftVCard(draftId);
    } else {
      setError("No draft ID provided");
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    // Auto-fill LinkedIn URL from URL params if available
    if (linkedinUrlFromParams && !linkedinUrl) {
      console.log(
        "Auto-filling LinkedIn URL from params:",
        linkedinUrlFromParams
      );
      setLinkedinUrl(decodeURIComponent(linkedinUrlFromParams));
      setLinkedinFromLinkedIn(true);
    }
  }, [linkedinUrlFromParams, linkedinUrl]);

  const fetchDraftVCard = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDraftData(data.data);

          // Initialize valid image URLs (excluding cover image - always use default theme)
          setValidAvatarUrl(data.data.avatarUrl || null);
          setValidCompanyLogoUrl(data.data.companyLogoUrl || null);
          // Don't set cover image - always use default purple theme gradient
          setValidCoverImageUrl(null);

          // Pre-populate contact info if available
          const emailLink = data.data.links?.find(
            (link: any) => link.type === "email"
          );
          const phoneLink = data.data.links?.find(
            (link: any) => link.type === "phone"
          );
          const linkedinLink = data.data.links?.find(
            (link: any) => link.type === "linkedin"
          );

          if (emailLink) {
            setEmail(emailLink.value);
            setEmailFromLinkedIn(true);
            setIsEditingEmail(false); // Don't auto-edit if from LinkedIn
          }
          if (phoneLink) {
            setPhone(phoneLink.value);
            setPhoneFromLinkedIn(true);
            setIsEditingPhone(false); // Don't auto-edit if from LinkedIn
          }
          if (linkedinLink) {
            setLinkedinUrl(linkedinLink.value);
            setLinkedinFromLinkedIn(true);
            setIsEditingLinkedin(false); // Don't auto-edit if from LinkedIn
          } else if (linkedinUrlFromParams && !linkedinUrl) {
            // If no linkedin link in draft data but we have it from params, use that
            console.log(
              "Using LinkedIn URL from params since not found in draft data:",
              linkedinUrlFromParams
            );
            setLinkedinUrl(decodeURIComponent(linkedinUrlFromParams));
            setLinkedinFromLinkedIn(true);
            setIsEditingLinkedin(false);
          }
        } else {
          setError(data.error_message || "Failed to load draft VCard");
        }
      } else if (response.status === 404) {
        setError("Your session has expired. Please start over from LinkedIn.");
      } else {
        setError("Failed to fetch draft VCard. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching draft VCard:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle image load errors
  const handleAvatarError = () => {
    setValidAvatarUrl(null);
  };

  const handleCompanyLogoError = () => {
    setValidCompanyLogoUrl(null);
  };

  const handleCoverImageError = () => {
    setValidCoverImageUrl(null);
  };

  const validateFields = () => {
    let isValid = true;

    // Email and phone are now optional since they'll be collected in address form
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (
      phone.trim() &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
    ) {
      setPhoneError("Please enter a valid phone number");
      isValid = false;
    } else {
      setPhoneError(null);
    }

    // LinkedIn URL validation
    if (linkedinUrl.trim() && !linkedinUrl.includes("linkedin.com/in/")) {
      setLinkedinError("Please enter a valid LinkedIn profile URL");
      isValid = false;
    } else {
      setLinkedinError(null);
    }

    return isValid;
  };

  // Handle focus events to prevent flickering
  const handleEmailFocus = () => {
    setIsEditingEmail(true);
  };

  const handleEmailBlur = () => {
    setIsEditingEmail(false);
  };

  const handlePhoneFocus = () => {
    setIsEditingPhone(true);
  };

  const handlePhoneBlur = () => {
    setIsEditingPhone(false);
  };

  const handleLinkedinFocus = () => {
    setIsEditingLinkedin(true);
  };

  const handleLinkedinBlur = () => {
    setIsEditingLinkedin(false);
  };

  const updateDraftVCard = async () => {
    if (!draftData) return false;

    try {
      const updatedLinks = [...(draftData.links || [])];

      // Helper function to update or add link
      const updateLink = (type: string, value: string) => {
        const index = updatedLinks.findIndex((link) => link.type === type);
        if (value.trim()) {
          const link = { type, value: value.trim(), isVisible: true };
          if (index >= 0) {
            updatedLinks[index] = link;
          } else {
            updatedLinks.push(link);
          }
        } else if (index >= 0) {
          // Remove the link if value is empty
          updatedLinks.splice(index, 1);
        }
      };

      // Update contact links (only if they have values)
      updateLink("email", email);
      updateLink("phone", phone);
      updateLink("linkedin", linkedinUrl);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/${draftData.draft_vcardId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: draftData.fullName,
            title: draftData.title,
            company: draftData.company,
            links: updatedLinks,
          }),
        }
      );

      if (response.ok) {
        setDraftData((prev) =>
          prev
            ? {
                ...prev,
                links: updatedLinks,
              }
            : null
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating draft VCard:", error);
      return false;
    }
  };

  const handleGetMyCard = async () => {
    // Validate only if fields have values (they're optional now)
    if (!validateFields()) return;

    const success = await updateDraftVCard();
    if (success) {
      const params = new URLSearchParams();
      if (draftId) params.set("draftId", draftId);
      if (referralVcr) params.set("vcr", referralVcr);
      router.push(`/referral/checkout?${params.toString()}`);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (referralVcr) params.set("vcr", referralVcr);
    router.push(`/referral/linkedin?${params.toString()}`);
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case "modern-blue":
        return {
          gradient: "from-blue-500 to-blue-600",
          accent: "bg-blue-500 hover:bg-blue-600",
          text: "text-blue-600",
        };
      case "elegant-black":
        return {
          gradient: "from-gray-800 to-gray-900",
          accent: "bg-gray-800 hover:bg-gray-900",
          text: "text-gray-800",
        };
      case "vibrant-red":
        return {
          gradient: "from-red-500 to-red-600",
          accent: "bg-red-500 hover:bg-red-600",
          text: "text-red-600",
        };
      default: // classic-purple
        return {
          gradient: "from-[#7C3AED] to-[#A855F7]",
          accent: "bg-[#7C3AED] hover:bg-[#6D28D9]",
          text: "text-[#7C3AED]",
        };
    }
  };

  // Get social icon for contact fields - matches VCard handle page
  const getSocialIcon = (type: string, isActive: boolean = false) => {
    const iconColorClass = isActive ? "text-white" : "text-gray-400";

    // Match VCard handle page colors exactly
    const getBackgroundColor = (contactType: string) => {
      if (!isActive) return "bg-gray-300";

      switch (contactType.toLowerCase()) {
        case "linkedin":
          return "bg-[#0077B5]";
        case "email":
          return "bg-[#D44638]";
        case "phone":
          return "bg-[#0088FF]";
        default:
          return "bg-gray-500";
      }
    };

    const bgColorClass = getBackgroundColor(type);

    switch (type.toLowerCase()) {
      case "linkedin":
        return (
          <div
            className={`${bgColorClass} rounded-lg p-1.5 w-10 h-10 flex items-center justify-center transition-colors duration-200`}
          >
            <FaLinkedinIn className={`w-6 h-6 ${iconColorClass}`} />
          </div>
        );
      case "email":
        return (
          <div
            className={`${bgColorClass} rounded-lg p-1.5 w-10 h-10 flex items-center justify-center transition-colors duration-200`}
          >
            <MdEmail className={`w-6 h-6 ${iconColorClass}`} />
          </div>
        );
      case "phone":
        return (
          <div
            className={`${bgColorClass} rounded-lg p-1.5 w-10 h-10 flex items-center justify-center transition-colors duration-200`}
          >
            <FaPhone className={`w-6 h-6 ${iconColorClass}`} />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your card preview...</p>
        </div>
      </div>
    );
  }

  if (error || !draftData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error?.includes("session has expired")
              ? "Session Expired"
              : "Something went wrong"}
          </h3>
          <p className="text-red-600 mb-6 text-sm leading-relaxed">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                const params = new URLSearchParams();
                if (referralVcr) params.set("vcr", referralVcr);
                router.push(`/referral/linkedin?${params.toString()}`);
              }}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              Start Over from LinkedIn
            </Button>
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const themeColors = getThemeColors(draftData.theme);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button and Progress */}
        <div className="relative pt-4 pb-2 px-6 bg-white">
          <button
            onClick={handleBack}
            className="absolute top-4 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="text-center pt-10 pb-3">
            {/* Progress Indicator */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">1</span>
                </div>
                <div className="w-12 h-1 bg-[#7C3AED] rounded-full"></div>
                <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">2</span>
                </div>
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-semibold">3</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Preview Your Card
            </h1>
            <p className="text-gray-600 mb-3">
              This is how your contacts will see you when they tap your Delight
              Card.
            </p>
          </div>
        </div>

        {/* VCard Preview - Replicating the exact design from /vcard/[handle] */}
        <div className="bg-white overflow-hidden pb-6">
          {/* Cover Image */}
          <div
            className={`h-32 pt-2 bg-gradient-to-r ${themeColors.gradient} relative`}
          >
            {validCoverImageUrl && (
              <Image
                src={validCoverImageUrl}
                alt="Cover"
                fill
                className="object-cover w-full h-full"
                onError={handleCoverImageError}
              />
            )}

            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden">
                {validAvatarUrl ? (
                  <Image
                    src={validAvatarUrl}
                    alt={draftData.fullName}
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                    onError={handleAvatarError}
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {draftData?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {validCompanyLogoUrl && (
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white p-1 rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <Image
                    src={validCompanyLogoUrl}
                    alt={draftData.company || ""}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    onError={handleCompanyLogoError}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 pb-4 px-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {draftData.fullName}
            </h2>
            {/* Prioritize position title from LinkedIn userData */}
            {(draftData.userData?.position?.[0]?.title || draftData.title) && (
              <p className={`${themeColors.text} text-lg font-medium mb-1`}>
                {draftData.userData?.position?.[0]?.title || draftData.title}
              </p>
            )}
            {(draftData.userData?.position?.[0]?.companyName ||
              draftData.company) && (
              <p className="text-gray-600 text-base mb-4">
                {draftData.userData?.position?.[0]?.companyName ||
                  draftData.company}
              </p>
            )}

            {/* Contact Fields Section - Exactly matching VCard handle page design and behavior */}
            <div className="space-y-3 mb-6">
              {/* LinkedIn Field - First */}
              <button
                onClick={() => setIsEditingLinkedin(true)}
                disabled={isEditingLinkedin}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-500 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)]`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {getSocialIcon("linkedin", !!linkedinUrl)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-normal text-gray-900 text-lg mb-0.5">
                    LinkedIn
                  </div>
                  {isEditingLinkedin ? (
                    <div>
                      <Input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          setLinkedinError(null);
                        }}
                        onFocus={handleLinkedinFocus}
                        onBlur={handleLinkedinBlur}
                        placeholder="linkedin.com/in/yourprofile"
                        className="border-0 bg-transparent p-0 h-auto text-gray-900 placeholder-gray-400 focus:ring-0 text-sm"
                        autoFocus
                      />
                      {linkedinError && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {linkedinError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      {linkedinUrl ? (
                        "Connect professionally"
                      ) : (
                        <div className="flex items-center gap-1 text-purple-600">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Click to add your linkedin</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Email Field - Second */}
              <button
                onClick={() => setIsEditingEmail(true)}
                disabled={isEditingEmail}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-500 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)]`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {getSocialIcon("email", !!email)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-normal text-gray-900 text-lg mb-0.5">
                    Email
                  </div>
                  {isEditingEmail ? (
                    <div>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(null);
                        }}
                        onFocus={handleEmailFocus}
                        onBlur={handleEmailBlur}
                        placeholder="your@email.com"
                        className="border-0 bg-transparent p-0 h-auto text-gray-900 placeholder-gray-400 focus:ring-0 text-sm"
                        autoFocus
                      />
                      {emailError && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {emailError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      {email ? (
                        "Send a message"
                      ) : (
                        <div className="flex items-center gap-1 text-purple-600">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Click to add your email</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Phone Field - Third */}
              <button
                onClick={() => setIsEditingPhone(true)}
                disabled={isEditingPhone}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-500 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)]`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {getSocialIcon("phone", !!phone)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-normal text-gray-900 text-lg mb-0.5">
                    Phone
                  </div>
                  {isEditingPhone ? (
                    <div>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setPhoneError(null);
                        }}
                        onFocus={handlePhoneFocus}
                        onBlur={handlePhoneBlur}
                        placeholder="+1 (555) 123-4567"
                        className="border-0 bg-transparent p-0 h-auto text-gray-900 placeholder-gray-400 focus:ring-0 text-sm"
                        autoFocus
                      />
                      {phoneError && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {phoneError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      {phone ? (
                        "Start a conversation"
                      ) : (
                        <div className="flex items-center gap-1 text-purple-600">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Click to add your phone</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Get My Card Button - Styled like Save Contact in VCard */}
            <Button
              onClick={handleGetMyCard}
              className={`w-full ${themeColors.accent} text-white font-bold py-5 rounded-full mb-5 text-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex items-center justify-center">
                Get My Card
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </Button>

            {/* Supporting Text */}
            <div className="text-center space-y-1 mb-4">
              <p className="text-sm text-gray-500">
                Free shipping • Premium NFC card • 5-7 day delivery
              </p>
              <p className="text-xs text-gray-400">
                100% satisfaction guarantee • Lifetime updates included
              </p>
            </div>

            {/* Powered by Delightloop - Integrated */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">Powered by Delightloop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
