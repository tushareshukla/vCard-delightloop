"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const getApiBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env === "sandbox") {
    return "https://backend-delight.patchup.health";
  } else if (env === "production") {
    return "https://api.delightloop.ai";
  }
  return "https://backend-delight.patchup.health"; // default to sandbox
};

interface Recipient {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface Gift {
  _id: string;
  name: string;
  price: number;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl: string;
    thumbnail: string;
    large: string;
  };
  descShort: string | null;
  descFull: string | null;
  category: string;
  subCat: string;
  is_available: boolean;
  lead_time_days: number;
  minimum_order_quantity: number;
  personalization_options: {
    engraving: boolean;
    color_choice: string[];
  };
}

interface UserData {
  organization_id: string;
}

interface ApiRecipientData {
  linkedin_url: string;
  first_name: string;
  last_name: string;
  mail_id: string;
  company: string;
  role: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface LinkedInProfile {
  success: boolean;
  data: {
    firstName: string;
    lastName: string;
    headline: string;
    profilePicture: string;
    geo: {
      city: string;
      full: string;
    };
    position: Array<{
      title: string;
      companyName: string;
      employmentType: string;
    }>;
  };
}

const DefaultAvatar = () => (
  <div className="w-full h-full bg-[#F4EBFF] flex items-center justify-center">
    <svg
      className="w-1/2 h-1/2 text-[#7F56D9]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById("googleMaps");

  if (!existingScript) {
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDlVFiv69PZGg5UVV5Vs05OTQEiurRHXuM&libraries=places";
    script.id = "googleMaps";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  } else {
    callback();
  }
};

export default function SendQuick() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData>({ organization_id: "" });
  const [uid, setUid] = useState<string>("");
  const [recipient, setRecipient] = useState<Recipient>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    linkedinUrl: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const searchParams = useSearchParams();
  const gift_id = searchParams.get("gift_id");
  const [user_id, setUser_id] = useState(searchParams.get("user_id") || "");
  const [isAddressExpandedMain, setIsAddressExpandedMain] = useState(false);
  const [gift, setGift] = useState<Gift | null>(null);
  const [isLoadingGift, setIsLoadingGift] = useState(true);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [linkedinProfile, setLinkedinProfile] =
    useState<LinkedInProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  const addressInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // debugger;
    if (!isLoadingCookies) {
      if (userId) {
        setUid(userId);
      } else {
        console.log("No user_id found, redirecting to home");
        //router.push('/');
        router.push(`/?quicksend=true&user_id=${user_id}&gift_id=${gift_id}`);
      }
    }
  }, [userId, isLoadingCookies]);

  const validateEmail = async (
    email: string
  ): Promise<{ isValid: boolean; message: string }> => {
    if (!email.trim()) {
      return {
        isValid: false,
        message: "Email address is required",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errors = [];
      if (!email.includes("@")) {
        errors.push("missing @ symbol");
      } else {
        const [localPart, domain] = email.split("@");
        if (!localPart) {
          errors.push("missing username before @");
        }
        if (!domain) {
          errors.push("missing domain after @");
        } else if (!domain.includes(".")) {
          errors.push("invalid domain format");
        }
      }
      return {
        isValid: false,
        message: `Invalid email format: ${errors.join(", ")}`,
      };
    }

    // API validation
    try {
      const emailValidationResponse = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.NEXT_PUBLIC_ABSTRACT_EMAIL_VERIFICATION_API_KEY}&email=${email}`
      );
      const data = await emailValidationResponse.json();
      console.log("Email validation response:", data);

      if (data.deliverability === "UNDELIVERABLE") {
        return {
          isValid: false,
          message: "Please enter a valid email address",
        };
      }
      if (data.error) {
        if (data.error.code === "quota_reached") {
          console.log("Quota exhausted", data.error.message);
          return { isValid: true, message: "" }; // Assuming you want to proceed if quota is reached
        } else {
          console.error("Email validation API error:", data.error);
          return {
            isValid: false,
            message: "Unable to verify email at this time",
          };
        }
      }

      if (data.deliverability === "DELIVERABLE") {
        return { isValid: true, message: "" };
      } else {
        return {
          isValid: false,
          message: "Please enter a valid email address",
        };
      }
    } catch (error) {
      console.error("Error validating email:", error);
      return { isValid: false, message: "Unable to verify email at this time" };
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from cookie
        // const authToken = userDataPer.authToken;
        // if (!authToken) {
        //   console.log("No auth token found, redirecting to login...");
        //   router.push('/');
        //   return;
        // }
        // if (userDataPer?.organization_id) {
        //   setUserData({ organization_id: userDataPer.organization_id });
        // }
        // if (userDataPer?.userId) {
        //   setUid(userDataPer.userId);
        //}

        // If organization_id not in cookie, fetch from API
        // if (!userDataPer?.organization_id) {
        const response = await fetch("/api/organization");
        const data = await response.json();

        if (data.success && data.organization) {
          setUserData({ organization_id: data.organization.id });
        } else {
          console.error("Failed to fetch organization");
        }
        // }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (mounted) {
      fetchUserData();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const fetchGift = async () => {
      if (!gift_id) {
        setIsLoadingGift(false);
        return;
      }

      try {
        setIsLoadingGift(true);
        setGiftError(null);

        const response = await fetch(`${getApiBaseUrl()}/v1/gifts/${gift_id}`, {
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch gift");
        }

        const data = await response.json();
        setGift(data);
      } catch (err) {
        setGiftError(
          err instanceof Error ? err.message : "Failed to fetch gift"
        );
        console.error("Error fetching gift:", err);
      } finally {
        setIsLoadingGift(false);
      }
    };

    fetchGift();
  }, [gift_id, mounted]);

  useEffect(() => {
    if (!mounted || !user_id) return;

    const fetchLinkedInProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await fetch(
          `${getApiBaseUrl()}/v1/recipients/linkedin-profile?profile=${user_id}`,
          {
            headers: {
              accept: "*/*",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch LinkedIn profile");
        }

        const data = await response.json();
        setLinkedinProfile(data);

        if (data.success && data.data) {
          const profile = data.data;
          const currentPosition = profile.position[0];
          setRecipient((prev) => ({
            ...prev,
            firstName: profile.firstName,
            lastName: profile.lastName,
            jobTitle: currentPosition?.title || "",
            company: currentPosition?.companyName || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching LinkedIn profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchLinkedInProfile();
  }, [mounted, user_id]);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (window.google && addressInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "us" }, // Restrict to US if needed
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.address_components) {
            const address = {
              line1:
                place.address_components.find((comp) =>
                  comp.types.includes("street_number")
                )?.long_name || "",
              line2:
                place.address_components.find((comp) =>
                  comp.types.includes("route")
                )?.long_name || "",
              city:
                place.address_components.find((comp) =>
                  comp.types.includes("locality")
                )?.long_name || "",
              state:
                place.address_components.find((comp) =>
                  comp.types.includes("administrative_area_level_1")
                )?.short_name || "",
              zipCode:
                place.address_components.find((comp) =>
                  comp.types.includes("postal_code")
                )?.long_name || "",
              country:
                place.address_components.find((comp) =>
                  comp.types.includes("country")
                )?.long_name || "",
            };

            setRecipient((prev) => ({
              ...prev,
              address,
            }));
          }
        });
      }
    });
  }, []);

  const handleSendGift = async () => {
    try {
      setIsSending(true);
      setNotification(null);

      // Enhanced email validation
      const emailValidation = await validateEmail(recipient.email);
      if (!emailValidation.isValid) {
        setNotification({
          type: "error",
          message: emailValidation.message,
        });
        return;
      }

      // Prepare recipient data
      const recipientData: ApiRecipientData = {
        linkedin_url: recipient.linkedinUrl || "",
        first_name: recipient.firstName,
        last_name: recipient.lastName,
        mail_id: recipient.email,
        company: recipient.company || "",
        role: recipient.jobTitle || "",
      };

      // Add address if required fields exist, regardless of expanded state
      if (recipient.address?.line1) {
        recipientData.address = {
          line1: recipient.address.line1,
          line2: recipient.address.line2 || "",
          city: recipient.address.city || "",
          state: recipient.address.state || "",
          zip: recipient.address.zipCode || "",
          country: recipient.address.country || "",
        };
      }

      const response = await fetch(
        `${getApiBaseUrl()}/v1/organizations/${organizationId}/playbooks/67b6fd4419d2fc03ba766be8/run`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            recipients: [recipientData],
            gift_id: gift_id,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = "";

        // Creative error messaging based on HTTP status
        switch (response.status) {
          case 400:
            errorMessage =
              "✨ Almost there! Let's double-check the gift details to make it perfect for your recipient.";
            break;
          case 401:
            errorMessage =
              "🎁 Oops! Looks like the gifting magic needs a quick refresh. Please reload the page to continue spreading joy!";
            break;
          case 403:
            errorMessage =
              "🌟 Your enthusiasm for gifting is wonderful! Let's make sure you have the right sparkle (permissions) to send this gift.";
            break;
          case 404:
            errorMessage =
              "🎨 We're having trouble finding this special gift in our treasure chest. Let's try selecting it again!";
            break;
          case 429:
            errorMessage =
              "🌈 Wow, you're on a gifting spree! Take a brief moment to catch your breath, and then continue spreading happiness.";
            break;
          case 500:
            errorMessage =
              "🎪 Our gift-wrapping elves are taking a quick break. They'll be back in a moment to help send your thoughtful present!";
            break;
          default:
            errorMessage =
              "🎭 The gift-giving spirits are being playful! Let's try that again in a moment.";
        }

        throw new Error(errorMessage);
      }

      // Handle success
      setNotification({
        type: "success",
        message:
          "🎉 Wonderful! Your thoughtful gift is on its way to brighten someone's day!",
      });
    } catch (error) {
      console.error("Error sending gift:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "🎪 Our gift-wrapping elves need a quick break. Let's try again in a moment!",
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderGift = () => {
    if (isLoadingGift) {
      return (
        <div className="col-span-2 flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7F56D9]"></div>
        </div>
      );
    }

    if (giftError) {
      return (
        <div className="col-span-2 text-center py-8 text-red-500">
          {giftError}
        </div>
      );
    }

    if (!gift) {
      return (
        <div className="col-span-2 text-center py-8 text-[#667085]">
          No gift selected
        </div>
      );
    }

    return (
      <div className="col-span-2 bg-white rounded-xl border border-[#EAECF0] overflow-hidden mb-6">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="w-[100px] h-[100px] relative rounded-lg overflow-hidden flex-shrink-0">
              {gift.images?.primaryImgUrl ? (
                <Image
                  src={gift.images.primaryImgUrl}
                  alt={gift.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#F2F4F7] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#667085]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#1B1D21] mb-1">
                {gift.name}
              </h3>
              <p className="text-[#667085] text-sm">
                {gift.descShort || gift.descFull || "No description available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <main className="bg-[#FDF4FF] min-h-screen py-4 sm:py-6 md:py-9 px-4 sm:px-6 md:px-11 relative overflow-hidden">
        <div className="animate-pulse">
          <div className="w-24 h-8 bg-[#F4EBFF] rounded mb-8" />
          <div className="max-w-2xl mx-auto">
            <div className="h-64 bg-white rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FDF4FF] min-h-screen py-4 sm:py-6 md:py-9 px-4 sm:px-6 md:px-11 relative overflow-hidden">
      <div className="flex justify-center sm:justify-start">
        <Image
          src="/Logo Final.png"
          alt="landing-1"
          width={157}
          height={50}
          className="w-24 sm:w-32 md:w-auto mb-8 sm:mb-12 md:mb-16"
        />
      </div>
      {/*  //! Hero Section */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1 rounded-full bg-[#F4EBFF] text-[#7F56D9] text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Almost There!
          </span>
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#7F56D9] to-[#9E77ED] inline-block text-transparent bg-clip-text">
              Review & Send Gift
            </h1>
          </div>
          <p className="font-medium mt-4 sm:mt-6 text-[#475467] max-w-xl mx-auto text-base sm:text-lg">
            Great choice! Let's get your gift
          </p>
        </div>
      </div>

      {/* //! How it Works Section */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-[#F9F5FF] to-white rounded-xl p-4 sm:p-6 border border-[#E9D7FE]">
          <h4 className="text-base font-semibold text-[#7F56D9] mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span className="text-sm sm:text-base">
              How Gift Delivery Works
            </span>
          </h4>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-xl bg-[#F4EBFF] flex items-center justify-center flex-shrink-0 relative">
                <svg
                  className="w-6 h-6 text-[#7F56D9]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5" />
                  <path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.4-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.7 1.1z" />
                </svg>
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-[#7F56D9] text-white flex items-center justify-center text-xs font-medium">
                  1
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#344054] mb-1">
                  Surprise & Delight
                </h5>
                <p className="text-sm text-[#475467]">
                  We'll craft a delightful email surprise for your recipient,
                  letting them know a thoughtful gift awaits them
                </p>
              </div>
              {/* Connector Line */}
              <div className="absolute left-6 top-16 w-px h-8 bg-gradient-to-b from-[#7F56D9] to-transparent"></div>
            </div>

            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-xl bg-[#F4EBFF] flex items-center justify-center flex-shrink-0 relative">
                <svg
                  className="w-6 h-6 text-[#7F56D9]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-[#7F56D9] text-white flex items-center justify-center text-xs font-medium">
                  2
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#344054] mb-1">
                  Easy Address Collection
                </h5>
                <p className="text-sm text-[#475467]">
                  They'll share their preferred shipping address through our
                  secure form. Address details are kept confidential, used only
                  for this delivery, and destroyed afterwards.
                </p>
              </div>
              {/* Connector Line */}
              <div className="absolute left-6 top-16 w-px h-8 bg-gradient-to-b from-[#7F56D9] to-transparent"></div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F4EBFF] flex items-center justify-center flex-shrink-0 relative">
                <svg
                  className="w-6 h-6 text-[#7F56D9]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-[#7F56D9] text-white flex items-center justify-center text-xs font-medium">
                  3
                </div>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#344054] mb-1">
                  Stay in the Loop
                </h5>
                <p className="text-sm text-[#475467]">
                  You'll get notified the moment they accept their gift, making
                  the experience seamless
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* //! Review Section */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <svg
            className="w-5 h-5 text-[#7F56D9]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base sm:text-lg font-semibold text-[#344054]">
            Review Your Selection
          </h2>
        </div>

        {/* Gift & Recipient Cards */}
        <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden">
          {/* Gift Card */}
          <div className="p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] relative rounded-lg overflow-hidden flex-shrink-0">
                {gift?.images?.primaryImgUrl ? (
                  <Image
                    src={gift.images.primaryImgUrl}
                    alt={gift.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F2F4F7] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#667085]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-[#1B1D21] mb-1">
                  {gift?.name || "No gift selected"}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085]">
                  {gift?.descShort ||
                    gift?.descFull ||
                    "No description available"}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#EAECF0]"></div>

          {/* Recipient Card */}
          <div className="p-4 sm:p-6">
            {/* Recipient Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] relative rounded-full overflow-hidden flex-shrink-0 border border-[#EAECF0]">
                {linkedinProfile?.data?.profilePicture ? (
                  <Image
                    src={linkedinProfile.data.profilePicture}
                    alt={`${linkedinProfile.data.firstName} ${linkedinProfile.data.lastName}`}
                    fill
                    className="object-cover"
                    onError={() => {}}
                  />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1B1D21]">
                      {isLoadingProfile ? (
                        <div className="flex items-center gap-2">
                          <span>Recipient</span>
                          <span className="text-sm text-[#667085]">
                            ({user_id})
                          </span>
                        </div>
                      ) : (
                        `${linkedinProfile?.data?.firstName || ""} ${
                          linkedinProfile?.data?.lastName || ""
                        }`
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#667085]">
                      {isLoadingProfile
                        ? "Loading profile information..."
                        : linkedinProfile?.data?.position[0]
                        ? `${linkedinProfile.data.position[0].title} at ${linkedinProfile.data.position[0].companyName}`
                        : ""}
                    </p>
                  </div>
                  {linkedinProfile?.data?.geo && (
                    <div className="flex items-center text-xs sm:text-sm text-[#667085]">
                      <svg
                        className="w-4 h-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{linkedinProfile.data.geo.full}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#344054] mb-1 sm:mb-1.5">
                  {linkedinProfile?.data?.firstName
                    ? `${linkedinProfile.data.firstName}'s`
                    : "Recipient's"}{" "}
                  Email Address <span className="text-[#F04438]">*</span>
                </label>
                <input
                  type="email"
                  value={recipient.email}
                  onChange={(e) =>
                    setRecipient((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                  placeholder="Enter recipient's email address"
                  required
                />
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[#667085]">
                  Awesome is on the way to{" "}
                  {linkedinProfile?.data?.firstName
                    ? `${linkedinProfile.data.firstName}'s`
                    : "recipient's"}{" "}
                  email
                </p>
              </div>

              <div>
                <button
                  onClick={() =>
                    setIsAddressExpandedMain(!isAddressExpandedMain)
                  }
                  className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-[#667085] hover:text-[#7F56D9] transition-colors hover:bg-[#F9F5FF] p-2 rounded-lg group"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>
                      I know{" "}
                      {linkedinProfile?.data?.firstName
                        ? `${linkedinProfile.data.firstName}'s`
                        : "their"}{" "}
                      shipping address
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-[#667085] mr-2 group-hover:text-[#7F56D9]">
                      Optional
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isAddressExpandedMain ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 transition-all duration-300 mt-2 ${
                    isAddressExpandedMain
                      ? "max-h-[800px] sm:max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <div className="col-span-2 bg-[#FFFAEB] rounded-lg p-3 mb-2">
                    <p className="text-sm text-[#B54708]">
                      If you know the shipping address, we'll skip the email
                      confirmation step and ship directly.
                    </p>
                  </div>

                  {(recipient.address?.line1 ||
                    recipient.address?.line2 ||
                    recipient.address?.city ||
                    recipient.address?.state ||
                    recipient.address?.zipCode ||
                    recipient.address?.country) && (
                    <div className="col-span-2 mb-2">
                      <button
                        type="button"
                        onClick={() =>{

                            setRecipient((prev) => ({
                                ...prev,
                                address: {
                                    line1: "",
                                    line2: "",
                                    city: "",
                                    state: "",
                                    zipCode: "",
                                    country: "",
                                },
                            }))
                            if (addressInputRef.current) {
                                addressInputRef.current.value = "";
                              }
                        }

                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#B42318] bg-[#FEF3F2] hover:bg-[#FEE4E2] transition-colors rounded-lg"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                        </svg>
                        Clear Address
                      </button>
                    </div>
                  )}

                  <div className="col-span-2">
                    <input
                      ref={addressInputRef}
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={recipient.address?.line2 || ""}
                      onChange={(e) =>
                        setRecipient((prev) => ({
                          ...prev,
                          address: { ...prev.address, line2: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Apt, suite, etc. (optional)"
                    />
                  </div>

                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="col-span-1">
                      <input
                        type="text"
                        value={recipient.address?.city || ""}
                        onChange={(e) =>
                          setRecipient((prev) => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                        placeholder="City"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="text"
                        value={recipient.address?.state || ""}
                        onChange={(e) =>
                          setRecipient((prev) => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                        placeholder="State / Province"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="text"
                        value={recipient.address?.zipCode || ""}
                        onChange={(e) =>
                          setRecipient((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              zipCode: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                        placeholder="ZIP / Postal code"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="text"
                        value={recipient.address?.country || ""}
                        onChange={(e) =>
                          setRecipient((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              country: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* //! Send Gift Button */}
      <div className="max-w-2xl mx-auto">
        {notification && (
          <div
            className={`mb-4 p-4 rounded-lg text-sm ${
              notification.type === "success"
                ? "bg-[#ECFDF3] text-[#027A48]"
                : "bg-[#FEF3F2] text-[#B42318]"
            }`}
          >
            {notification.message}
          </div>
        )}
        <button
          onClick={handleSendGift}
          disabled={isSending || !recipient.email}
          className={`w-full ${
            isSending || !recipient.email
              ? "bg-[#7F56D9]/50 cursor-not-allowed"
              : "bg-[#7F56D9] hover:bg-[#7F56D9]/90"
          } text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center`}
        >
          {isSending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Sending...
            </>
          ) : (
            "Send Gift Now"
          )}
        </button>
        <p className="text-center text-xs sm:text-sm text-[#667085] mt-2">
          You'll be notified once{" "}
          {linkedinProfile?.data?.firstName
            ? `${linkedinProfile.data.firstName}`
            : "they"}{" "}
          accepts the gift
        </p>
      </div>
    </main>
  );
}
