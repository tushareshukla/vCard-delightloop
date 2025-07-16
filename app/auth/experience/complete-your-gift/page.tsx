"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Caveat } from "next/font/google";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import GiftSelectionProgress from "@/components/ui/GiftSelectionProgress";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StripePaymentForm } from "@/components/wallet/StripePaymentForm";
import { toast } from "react-hot-toast";
import { env } from "process";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface TabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab = ({ id, label, isActive, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 rounded-md text-sm font-medium flex-1 ${
        isActive
          ? "bg-white text-gray-800 shadow-[0_3px_10px_rgb(0,0,0,0.2)]"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
};

interface GiftData {
  _id: string;
  name: string;
  price: number;
  descShort: string;
  descFull: string;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl: string;
  };
  category: string;
  subCat: string;
  tags: string[];
  shippingCost: number;
  handlingCost: number;
  isDigital: boolean;
  sku: string;
}

interface TemplateData {
  description: string;
  date: string;
  videoLink: string;
  logoLink: string;
  buttonLink: string;
  isEdited: boolean;
  type: string;
  buttonText: string;
  mediaUrl: string;
}

interface FormData {
  email: string;
  phoneNumber: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  message: string;
  addressLine1: string;
  addressLine2: string;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById("googleMaps");

  if (!existingScript) {
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.id = "googleMaps";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  } else {
    callback();
  }
};

export default function CompleteYourGiftPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"shipping" | "message">(
    "shipping"
  );

  const [formData, setFormData] = useState<FormData>({
    email: "",
    phoneNumber: "",
    streetAddress: "",
    streetAddress2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    message: "",
    addressLine1: "",
    addressLine2: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [cardDetailsActive, setCardDetailsActive] = useState({
    description: false,
    logoLink: false,
  });
  const [cardDetails, setCardDetails] = useState({
    description:
      "We look forward to seeing you at the event. Here is a resource for you:",
    logoLink: "/Logo Final.png",
  });
  const [selectedTemplate, setSelectedTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [templateData, setTemplateData] = useState<TemplateData>({
    description:
      "",
    date: new Date().toISOString(),
    videoLink: "",
    logoLink: "/Logo Final.png",
    buttonLink: "https://www.delightloop.com/bookademo",
    isEdited: false,
    type: "",
    buttonText: "Book a Demo",
    mediaUrl: "",
  });
  const [savedContent, setSavedContent] = useState({
    description: "",
    date: "",
    videoLink: "",
    logoLink: "",
    buttonLink: "",
    isEdited: false,
  });
  const [giftData, setGiftData] = useState<GiftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const [campaignId, setCampaignId] = useState<string>("");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const { userId, authToken } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [initialLogoLink, setInitialLogoLink] = useState("/Logo Final.png");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [focusTemplate, setFocusTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const fetchWalletData = async () => {
    try {
      console.log("[Wallet] Starting wallet balance fetch");
      const baseUrl = await getBackendApiBaseUrl();
      const userId = searchParams.get("user_id");
      const token = searchParams.get("token");

      if (!userId) {
        console.warn("[Wallet] No user ID found, aborting balance fetch");
        return;
      }

      console.log("[Wallet] Making API request", {
        url: `${baseUrl}/v1/${userId}/wallet/check-balance`,
        userId,
      });

      const walletBalanceResponse = await fetch(
        `${baseUrl}/v1/${userId}/wallet/check-balance`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "[Wallet] Balance API response status:",
        walletBalanceResponse.status
      );

      if (walletBalanceResponse.ok) {
        const data = await walletBalanceResponse.json();
        console.log("[Wallet] Balance data received:", {
          currentBalance: data.wallet?.current_balance,
          fullData: data,
        });
        setWalletBalance(data.wallet?.current_balance || 0);
      } else {
        console.error("[Wallet] Failed to fetch balance:", {
          status: walletBalanceResponse.status,
          statusText: walletBalanceResponse.statusText,
        });
      }
    } catch (error) {
      console.error("[Wallet] Error in fetchWalletBalance:", {
        error,
        message: error.message,
        stack: error.stack,
      });
    }
  };

  const handleAddFundClick = () => {
    console.log("[Payment Flow] Add Fund button clicked");
    setShowAmountInput(true);
  };

  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const userId = searchParams.get("user_id");
      const token = searchParams.get("token");
      const organizationId = "000000000000000000000000";

      const cookieConfig = {
        path: "/",
        maxAge: 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
      };

      document.cookie = `auth_token=${token};${Object.entries(cookieConfig)
        .map(([k, v]) => `${k}=${v}`)
        .join(";")}`;
      document.cookie = `user_id=${userId};${Object.entries(cookieConfig)
        .map(([k, v]) => `${k}=${v}`)
        .join(";")}`;
      document.cookie = `organization_id=${organizationId};${Object.entries(
        cookieConfig
      )
        .map(([k, v]) => `${k}=${v}`)
        .join(";")}`;

      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowAmountInput(false);
        setShowPaymentModal(true);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error(error);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: string) => {
    try {
      console.log("Payment success handler started");

      const userId = searchParams.get("user_id");
      const token = searchParams.get("token");
      const organizationId = "000000000000000000000000";

      setIsProcessingPayment(true);

      const response = await fetch("/api/stripe/success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_intent: paymentIntent,
          organization_id: organizationId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment processed successfully!");
        setShowPaymentModal(false);
        setAmount("");
        await fetchWalletData();
        setPaymentComplete(true);
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error in payment success handler:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (paymentComplete) {
      console.log("[Payment Flow] Payment completion detected in useEffect");
      setPaymentComplete(false);
      console.log("[Payment Flow] Refreshing wallet balance");
      fetchWalletData();
    }
  }, [paymentComplete]);

  const handleTemplateSelect = (templateNumber: number) => {
    const newSelectedTemplate = {
      template1: false,
      template2: false,
      template3: false,
      template4: false,
      [`template${templateNumber}`]: true,
    };
    setFocusTemplate({
      template1: templateNumber === 1,
      template2: templateNumber === 2,
      template3: templateNumber === 3,
      template4: templateNumber === 4,
    });
    setSelectedTemplate({ ...selectedTemplate, ...newSelectedTemplate });
    console.log("newSelectedTemplate", newSelectedTemplate);
    console.log("selectedTemplate", selectedTemplate);
    console.log("templateNumber", templateNumber);

    if (templateNumber === 4) {
      setTemplateData((prev) => ({
        ...prev,
        description:
          "Thank you for your interest! Click below to book a demo and learn more about our solutions.",
        buttonLink: "https://www.delightloop.com/bookademo",
        mediaUrl: "/partner-integrations/meeting.png",
        buttonText: "Book a Demo",
        type: "template4",
      }));
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = document.querySelector(".carousel-container");
    if (container) {
      const scrollAmount = 300;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };
  const handleTemplateDataChange = (data: any) => {
    setTemplateData(data);
    setSavedContent({
      description: data.description,
      date: data.date,
      videoLink: data.videoLink,
      logoLink: data.logoLink,
      buttonLink: data.buttonLink,
      isEdited: true,
    });
  };

  useEffect(() => {
    const fetchGiftData = async () => {
      try {
        const giftId = searchParams.get("gift_id");

        if (!giftId) {
          throw new Error("Missing gift_id");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts/${giftId}`
        );

        if (!response.ok) throw new Error("Failed to fetch gift data");
        const data = await response.json();
        setGiftData(data);
      } catch (error) {
        console.error("Error fetching gift data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftData();
  }, [searchParams]);

  useEffect(() => {
    const createCampaign = async () => {
      try {
        const userId = searchParams.get("user_id");
        const token = searchParams.get("token");
        const organizationId = "000000000000000000000000";
        const firstName = searchParams.get("first_name");
        const lastName = searchParams.get("last_name");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/users/${userId}/campaigns`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: `${firstName} Onboarding Experience`,
            }),
          }
        );

        const data = await response.json();
        console.log("Campaign created successfully:", data);

        if (data.campaign_id) {
          setCampaignId(data.campaign_id);
          console.log("Campaign ID saved:", data.campaign_id);
        } else {
          console.error("Campaign ID missing from response:", data);
          throw new Error("Campaign ID not found in response");
        }
      } catch (error) {
        console.error("Error creating campaign:", error);
      }
    };

    if (searchParams.get("user_id")) {
      createCampaign();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchWalletData();
  }, [userId, authToken]);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (window.google && addressInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ["address"],
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.address_components) {
            const streetNumber =
              place.address_components.find((comp) =>
                comp.types.includes("street_number")
              )?.long_name || "";

            const route =
              place.address_components.find((comp) =>
                comp.types.includes("route")
              )?.long_name || "";

            setFormData((prev) => ({
              ...prev,
              addressLine1: `${streetNumber} ${route}`.trim(),
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
            }));
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    // if (!isAuthenticated) return;

    const fetchUserData = async () => {
      try {
        const userId = searchParams.get("user_id");
        const token = searchParams.get("token");
        console.log("Token:", token);
        const organizationId = "000000000000000000000000";

        if (!userId || !token) return;

        const response = await fetch(
          `${getBackendApiBaseUrl()}/v1/organizations/${organizationId}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          linkedinCreds: {
            linkedinEmail: data.linkedinCreds.linkedinEmail,
            pfp: data.linkedinCreds.pfp,
            jobTitle: data.linkedinCreds.jobTitle,
            companyName: data.linkedinCreds.companyName,
          },
        });

        console.log("Fetched user data:", data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [searchParams, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const selectedGift = {
    id: giftData?._id || "",
    title: giftData?.name || "Gift Not Found",
    price: `$${(giftData?.price || 0).toFixed(2)}`,
    description: giftData?.descShort || "",
    image: giftData?.images?.primaryImgUrl || "/images/premium-coffee-set.jpg",
    fullDescription: giftData?.descFull || "",
    category: giftData?.category || "",
    shippingCost: giftData?.shippingCost || 0,
    handlingCost: giftData?.handlingCost || 0,
    totalCost: (
      (giftData?.price || 0) +
      (giftData?.shippingCost || 0) +
      (giftData?.handlingCost || 0)
    ).toFixed(2),
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = async () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      console.log(process.env.NEXT_PUBLIC_ABSTRACT_EMAIL_VERIFICATION_API_KEY);
      try {
        const emailValidationResponse = await fetch(
          `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.NEXT_PUBLIC_ABSTRACT_EMAIL_VERIFICATION_API_KEY}&email=${formData.email}`
        );
        const data = await emailValidationResponse.json();
        console.log("Email validation response:", data);
        if (data.deliverability === "UNDELIVERABLE") {
          errors.email = "Please enter a valid email address";
          setFormErrors(errors);
          return false;
        }
        if (data.error) {
          if (data.error.code === "quota_reached") {
            console.log("Quota exhausted", data.error.message);
            return true;
          } else {
            console.error("Email validation API error:", data.error);
            errors.email = "Unable to verify email at this time";
            return false;
          }
        }

        if (data.deliverability === "DELIVERABLE") {
          errors.email = "";
          return true;
        } else {
          errors.email = "Please enter a valid email address";
          console.error("Email validation failed:", data);
          return false;
        }
      } catch (error) {
        console.error("Error validating email:", error);
        errors.email = "Unable to verify email at this time";
        return false;
      }
    }
    if(templateData.type === "" || templateData.description === "" ){
       errors.email= "Please choose a landing page and customise the content."
    }
    if (cardDetailsActive.description && !cardDetails.description.trim()) {
      errors.cardDescription = "Message is required";
    }
    if (cardDetailsActive.logoLink && !cardDetails.logoLink.trim()) {
      errors.cardLogo = "Logo URL is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isValid = await validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      const token = searchParams.get("token");
      const organizationId = "000000000000000000000000";
      const giftId = searchParams.get("gift_id");
      const userId = searchParams.get("user_id");
      const firstName = searchParams.get("first_name");
      const lastName = searchParams.get("last_name");

      // Generate template URL
      const baseUrl = window.location.origin;
      const templateNumber = templateData.type?.replace("template", "") || "1";
      const templateUrl = `${baseUrl}/public-landing-2/${templateNumber}`;
      //debugger;
      // 1. Update Campaign
      const updateData = {
        total_recipients: 1,
        status: "matching gifts",
        giftSelectionMode: "manual",
        cta_link: templateUrl,
        outcomeCard: {
          message:
            cardDetails.description ||
            "We look forward to seeing you at the event. Here is a resource for you:",
          logoLink: cardDetails.logoLink || "/img/company-logo-default.png",
        },
        outcomeTemplate: {
          type: templateData.type || "",
          description: templateData.description || "",
          date: new Date().toISOString(),
          videoLink: templateData.videoLink || "",
          logoLink: templateData.logoLink || "",
          buttonText: templateData.buttonText || "",
          buttonLink: templateData.buttonLink || "",
          mediaUrl:
            templateData.mediaUrl || "/partner-integrations/meeting.png",
        },
        giftCatalogs: [
          {
            catalogId: "67ce2054e04f14d6638c7b6c",
            selectedGift: [giftId],
          },
        ],
        eventStartDate: new Date().toISOString(),
              deliverByDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };
      // debugger;

      const campaignResponse = await fetch(
        // `https://sandbox-api.delightloop.ai/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!campaignResponse.ok) throw new Error("Failed to update campaign");

      // 2. Create Recipient
      const recipientData = {
        firstName,
        lastName,
        mailId: formData.email,
        phoneNumber: formData.phoneNumber,
        linkedinUrl: decodeURIComponent(searchParams.get("linkedin_url") || ""),
        companyName: searchParams.get("company_name") || "",
        jobTitle: searchParams.get("position_title") || "",
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
          country: formData.country,
        },
      };
      console.log("recipientData", recipientData);
      const recipientResponse = await fetch(
        // `https://sandbox-api.delightloop.ai/v1/users/${userId}/quick-send/recipients`,
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/users/${userId}/quick-send/recipients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(recipientData),
        }
      );

      if (!recipientResponse.ok) throw new Error("Failed to create recipient");
      const recipientDatafull = await recipientResponse.json();
      const recipientId = recipientDatafull.recipient._id;
      // 3. Assign Campaign to Recipient
      const assignResponse = await fetch(
        // `https://sandbox-api.delightloop.ai/v1/recipients/${recipientId}/assign-campaign`,
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}/assign-campaign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ campaignId }),
        }
      );

      if (!assignResponse.ok)
        throw new Error("Failed to assign campaign to recipient");

      // 3. Select Gift
      const selectGiftResponse = await fetch(
        // `https://sandbox-api.delightloop.ai/v1/organizations/${organizationId}/campaigns/${campaignId}/gift-selection`,
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/gift-selection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          //   body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!selectGiftResponse.ok) {
        const errorData = await selectGiftResponse.json().catch(() => null);
        console.error("Select Gift Error:", {
          status: selectGiftResponse.status,
          statusText: selectGiftResponse.statusText,
          error: errorData,
          campaignId,
          userId,
        });
        throw new Error(
          `Failed to select gift: ${
            errorData?.message || selectGiftResponse.statusText
          }`
        );
      }

      // 4. Run Campaign
      const runCampaignResponse = await fetch(
        // `https://sandbox-api.delightloop.ai/v1/organizations/${organizationId}/campaigns/${campaignId}/run`,
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const runCampaignData = await runCampaignResponse.json();
      console.log("runCampaignResponse", runCampaignData);

      if (!runCampaignResponse.ok) {
        if (runCampaignData.error_code === "ERR_INSUFFICIENT_FUNDS") {
          throw new Error(
            "Oops! You need more funds in your wallet to send this gift. Click 'Add Funds' to top up your balance."
          );
        } else {
          throw new Error(
            runCampaignData.error_message || "Failed to run campaign"
          );
        }
      }

      // Success - redirect to gift sent page
      router.push(
        `/auth/experience/gift-sent?user_id=${userId}&token=${token}&first_name=${firstName}&last_name=${lastName}&recipient_id=${recipientId}`
      );
    } catch (error) {
      console.error("Error in submit process:", error);
      setFormErrors((prev) => ({
        ...prev,
        submit: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b">
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
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Complete Your Gift</h1>
        <p className="text-gray-600 mb-8">
          Add shipping details and a personal message
        </p>

        {/* Progress Steps */}
        <div className="mb-8">
          <GiftSelectionProgress currentStep={2} />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Gift Summary */}
          <div className="md:w-2/5">
            <div className="border rounded-lg p-5">
              <div className="flex items-center mb-4">
                <div className="text-primary mr-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path
                      fillRule="evenodd"
                      d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold">Gift Summary</h2>
              </div>

              <div className="mb-4">
                <Image
                  src={selectedGift.image}
                  alt={selectedGift.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23f3f4f6'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Cpath d='M148 150.5L188 110.5L228 150.5L268 110.5L308 150.5L348 110.5V210.5H108V110.5L148 150.5Z' fill='%23d1d5db'/%3E%3Ccircle cx='138' cy='95' r='20' fill='%23d1d5db'/%3E%3C/svg%3E";
                  }}
                />
              </div>

              <h3 className="font-semibold text-lg mb-1">
                {selectedGift.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {selectedGift.description}
              </p>
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span>Gift Price:</span>
                  <span>${giftData?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping & Handling:</span>
                  <span>
                    $
                    {(
                      selectedGift.shippingCost + (giftData?.handlingCost || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${selectedGift.totalCost}</span>
                  </div>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div
                    className="flex justify-between text-sm font-semibold"
                    style={{
                      color:
                        walletBalance < parseFloat(selectedGift.totalCost)
                          ? "#EF4444"
                          : "#6B46C1",
                    }}
                  >
                    <span>Wallet Balance:</span>
                    <span>${walletBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold mb-1">Recipient</h3>
                  <button
                    onClick={handleAddFundClick}
                    className={`flex items-center w-fit font-medium text-sm gap-2 text-white shadow-sm px-3 py-1.5 rounded-lg bg-primary ${
                      walletBalance < parseFloat(selectedGift.totalCost)
                        ? "animate-pulse shadow-lg"
                        : ""
                    } hover:opacity-95`}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.4719 9.70671C18.6135 9.70671 18.6905 9.61266 18.7028 9.42454C18.7643 8.66581 18.8321 8.03249 18.906 7.52458C18.9798 7.0104 19.0814 6.59342 19.2107 6.27362C19.3401 5.94756 19.5125 5.6936 19.728 5.51176C19.9373 5.32991 20.2082 5.1951 20.5407 5.10731C20.8671 5.01325 21.2704 4.94114 21.7506 4.89098C21.843 4.87844 21.9076 4.85336 21.9446 4.81573C21.9815 4.77184 22 4.72481 22 4.67465C22 4.61194 21.9815 4.55551 21.9446 4.50534C21.9076 4.45518 21.843 4.42696 21.7506 4.42069C21.2642 4.36426 20.8578 4.29215 20.5315 4.20436C20.199 4.11657 19.9281 3.98803 19.7187 3.81873C19.5032 3.64942 19.3339 3.41741 19.2107 3.1227C19.0814 2.82799 18.9798 2.44862 18.906 1.98461C18.8321 1.51432 18.7643 0.937438 18.7028 0.253955C18.6905 0.153627 18.6658 0.0877868 18.6289 0.0564344C18.5858 0.0188115 18.5334 0 18.4719 0C18.4226 0 18.3764 0.0188115 18.3333 0.0564344C18.2841 0.0877868 18.2564 0.150492 18.2502 0.244549C18.1948 0.934302 18.1301 1.51432 18.0563 1.98461C17.9762 2.44862 17.8746 2.83112 17.7515 3.13211C17.6222 3.42682 17.4528 3.65883 17.2435 3.82813C17.028 3.99743 16.7571 4.12598 16.4307 4.21377C16.0982 4.29528 15.6919 4.36426 15.2116 4.42069C15.1192 4.42696 15.0546 4.45518 15.0176 4.50534C14.9745 4.55551 14.953 4.61194 14.953 4.67465C14.953 4.72481 14.9745 4.77184 15.0176 4.81573C15.0546 4.85336 15.1192 4.87844 15.2116 4.89098C15.6919 4.94114 16.0982 5.01325 16.4307 5.10731C16.7571 5.1951 17.028 5.32991 17.2435 5.51176C17.4528 5.6936 17.6222 5.94756 17.7515 6.27362C17.8808 6.59342 17.9824 7.0104 18.0563 7.52458C18.1301 8.03249 18.1948 8.66581 18.2502 9.42454C18.2564 9.61266 18.3303 9.70671 18.4719 9.70671ZM8.09992 20.8525C8.16149 20.8525 8.21998 20.8306 8.2754 20.7867C8.33081 20.7428 8.36468 20.6675 8.37699 20.5609C8.48783 19.4009 8.61097 18.3788 8.74643 17.4947C8.87573 16.6042 9.03275 15.833 9.21746 15.1808C9.39603 14.5287 9.61461 13.9738 9.87322 13.516C10.1318 13.0583 10.4428 12.6758 10.806 12.3685C11.1632 12.055 11.588 11.7979 12.0806 11.5973C12.567 11.3966 13.1335 11.2304 13.78 11.0988C14.4265 10.9671 15.1685 10.8479 16.0059 10.7413C16.1167 10.7288 16.1968 10.6943 16.246 10.6379C16.2953 10.5814 16.3199 10.5219 16.3199 10.4592C16.3199 10.2961 16.2152 10.2021 16.0059 10.177C15.033 10.0516 14.1864 9.9105 13.466 9.75374C12.7456 9.59071 12.1268 9.38378 11.6096 9.13296C11.0924 8.87587 10.6583 8.5404 10.3073 8.12655C9.95634 7.7127 9.66695 7.19538 9.43913 6.5746C9.20515 5.94756 9.0112 5.18569 8.85726 4.28901C8.69717 3.39233 8.55556 2.32949 8.43241 1.10047C8.4201 0.987602 8.38931 0.906085 8.34005 0.855921C8.28463 0.805757 8.22306 0.780676 8.15533 0.780676C7.99524 0.780676 7.90288 0.887274 7.87825 1.10047C7.74279 2.32949 7.5981 3.39233 7.44416 4.28901C7.28407 5.18569 7.09012 5.94756 6.8623 6.5746C6.62832 7.19538 6.33585 7.7127 5.98489 8.12655C5.63392 8.53413 5.20291 8.86647 4.69185 9.12356C4.1808 9.38065 3.56507 9.59071 2.84467 9.75374C2.12427 9.9105 1.27764 10.0516 0.304785 10.177C0.101595 10.2021 0 10.2961 0 10.4592C0 10.5219 0.0246296 0.5814 0.0738869 10.6379C0.116989 10.6943 0.193954 10.7288 0.304785 10.7413C1.14218 10.8479 1.88413 10.9671 2.53065 11.0988C3.17101 11.2304 3.7344 11.3966 4.22082 11.5973C4.70725 11.7979 5.12594 12.055 5.47691 12.3685C5.82788 12.6758 6.12958 13.0583 6.38203 13.516C6.63448 13.9738 6.84691 14.5287 7.01931 15.1808C7.19172 15.833 7.34257 16.6042 7.47187 17.4947C7.59502 18.3788 7.71201 19.4009 7.82284 20.5609C7.82899 20.6675 7.85978 20.7428 7.9152 20.7867C7.96446 20.8306 8.02603 20.8525 8.09992 20.8525Z"
                        fill="#F4F3FF"
                      />
                    </svg>
                    Add Funds
                  </button>
                </div>
                <p className="text-gray-800 font-medium">
                  {searchParams.get("first_name")}{" "}
                  {searchParams.get("last_name")}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="md:w-3/5">
            <div className="bg-white rounded-lg border p-5 space-y-6">
              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="text-primary mr-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {searchParams.get("first_name")
                      ? `${searchParams.get("first_name")}'s`
                      : "Recipient's"}{" "}
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your email"
                  />
                  {/* {formErrors.email && (
                    <p className="mt-1 text-red-500 text-xs">{formErrors.email}</p>
                  )} */}
                  <p className="text-xs text-gray-500 mt-1">
                    Awesome is on the way to{" "}
                    {searchParams.get("first_name")
                      ? `${searchParams.get("first_name")}'s`
                      : "recipient's"}{" "}
                    mail
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {searchParams.get("first_name")
                      ? `${searchParams.get("first_name")}'s`
                      : "Recipient's"}{" "}
                    Phone Number
                  </label>
                  <input
                    type="email"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your phone number"
                  />
                  {/* {formErrors.email && (
                    <p className="mt-1 text-red-500 text-xs">{formErrors.email}</p>
                  )} */}
                </div>
              </div>

              {/* Shipping Address Section - Collapsible */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setIsShippingExpanded(!isShippingExpanded)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center">
                    <div className="text-primary mr-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold    ">
                      {searchParams.get("first_name")
                        ? `${searchParams.get("first_name")}'s`
                        : "Recipient's"}{" "}
                      Shipping Address
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      &nbsp;&nbsp;(Optional)
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      isShippingExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Collapsible Content */}
                <div
                  className={`space-y-4 overflow-hidden transition-all duration-300 ${
                    isShippingExpanded ? "max-h-[500px] mt-4" : "max-h-0"
                  }`}
                >
                  <div>
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1 || ""}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2 || ""}
                      onChange={handleInputChange}
                      placeholder="Apt, Suite, etc."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                    />
                    {formErrors.addressLine2 && (
                      <p className="mt-1 text-red-500 text-xs">
                        {formErrors.addressLine2}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className={`w-full px-3 py-2 border ${
                          formErrors.city ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-primary`}
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-red-500 text-xs">
                          {formErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className={`w-full px-3 py-2 border ${
                          formErrors.state
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-primary`}
                      />
                      {formErrors.state && (
                        <p className="mt-1 text-red-500 text-xs">
                          {formErrors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                        className={`w-full px-3 py-2 border ${
                          formErrors.country
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-primary`}
                      />
                      {formErrors.country && (
                        <p className="mt-1 text-red-500 text-xs">
                          {formErrors.country}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                        className={`w-full px-3 py-2 border ${
                          formErrors.zipCode
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-primary`}
                      />
                      {formErrors.zipCode && (
                        <p className="mt-1 text-red-500 text-xs">
                          {formErrors.zipCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Message Section */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <div className="text-primary mr-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Personal Message</h3>
                </div>

                <div
                  className="pb-24 pl-[47px] py-[24px] bg-primary-light bg-opacity-5 rounded-lg mx-auto border-primary-xlight shadow-sm border-[1px]"
                  style={{
                    backgroundImage: "url(/img/ticketBackground.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="flex flex-col-reverse md:flex-row justify-between items-start pr-[19px]">
                    <div className={`text-2xl ${caveat.className}`}>
                      Dear [Attendee Name],
                      <br />
                      <div
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            description: true,
                            logoLink: false,
                          })
                        }
                        className={`cursor-pointer flex items-start gap-2 ${
                          cardDetailsActive.description ? "hidden" : ""
                        }`}
                      >
                        <Image
                          src="/svgs/Edit.svg"
                          width={24}
                          height={24}
                          alt="message"
                        />
                        <div className="break-words max-w-[250px] sm:max-w-[300px] md:max-w-[350px] overflow-hidden">
                          {cardDetails.description
                            ? cardDetails.description.length > 150
                              ? cardDetails.description.substring(0, 150) +
                                "..."
                              : cardDetails.description
                            : "We look forward to seeing you at the event. Here is a resource for you:"}
                        </div>
                      </div>
                      {cardDetailsActive.description && (
                        <div className="w-full sm:w-[300px] md:w-[350px] max-w-full">
                          <textarea
                            value={cardDetails.description}
                            placeholder="We have reserved a seat for you!"
                            rows={3}
                            onChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                description: e.target.value,
                              })
                            }
                            className={`w-full border-2 resize-none rounded-lg p-2 overflow-y-auto ${
                              formErrors.cardDescription
                                ? "border-red-500 focus:border-red-500"
                                : "border-gray-300 focus:border-primary"
                            }`}
                          />
                          {formErrors.cardDescription && (
                            <p className="mt-1 text-red-500 text-xs">
                              {formErrors.cardDescription}
                            </p>
                          )}
                          <div
                            className={`text-xs mt-1 flex justify-between items-center ${
                              cardDetails.description.length > 200
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                          >
                            <span className="font-sans font-medium">
                              {cardDetails.description.length}/200 characters
                            </span>
                            {cardDetails.description.length > 200 && (
                              <span className="font-sans font-medium">
                                Text is too long
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end font-medium mt-1">
                            <button
                              onClick={() =>
                                setCardDetailsActive({
                                  ...cardDetailsActive,
                                  description: false,
                                })
                              }
                              className="bg-white border border-gray-300 text-gray-500 text-sm px-4 py-2.5 hover:bg-gray-100 duration-300 rounded-lg font-sans"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                setCardDetailsActive({
                                  ...cardDetailsActive,
                                  description: false,
                                })
                              }
                              disabled={cardDetails.description.length > 200}
                              className={`text-white text-sm px-4 py-2.5 duration-300 rounded-lg font-sans ${
                                cardDetails.description.length > 200
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-primary hover:opacity-90"
                              }`}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Company Logo Upload Section */}
                    <div className="-mt-[7px]">
                      <div
                        onClick={() =>
                          setCardDetailsActive({
                            ...cardDetailsActive,
                            logoLink: true,
                            description: false,
                          })
                        }
                        className={`cursor-pointer text-center ${
                          cardDetailsActive.logoLink ? "hidden" : ""
                        }`}
                      >
                        {cardDetails.logoLink ? (
                          <div className="relative w-[84px] h-[84px]">
                            <Image
                              src={cardDetails.logoLink}
                              alt="Company Logo"
                              width={84}
                              height={84}
                              className="object-contain hover:scale-105 duration-300 rounded-lg"
                              onError={(e: any) => {
                                e.target.src = "/img/upload.png";
                                console.error(
                                  "Failed to load image:",
                                  cardDetails.logoLink
                                );
                              }}
                            />
                          </div>
                        ) : (
                          <label
                            htmlFor="company-logo"
                            className="cursor-pointer"
                          >
                            <Image
                              src={"/img/upload.png"}
                              alt="upload"
                              className="hover:scale-105 duration-300"
                              width={84}
                              height={84}
                            />
                          </label>
                        )}
                      </div>
                      {cardDetailsActive.logoLink && (
                        <div className="grid gap-1 w-[200px]">
                          <div className="flex h-fit">
                            <div className="text-[#667085] py-1.5 px-2 bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0 text-xs">
                              https://
                            </div>
                            <input
                              type="url"
                              value={cardDetails.logoLink || ""}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  logoLink: e.target.value,
                                })
                              }
                              placeholder="Enter URL"
                              className={`border w-full ${
                                formErrors.cardLogo
                                  ? "border-red-500"
                                  : "border-[#D0D5DD]"
                              } focus:outline-none focus:border-primary rounded-lg rounded-l-none px-2 py-1.5 text-xs placeholder:text-[#667085] placeholder:font-medium`}
                            />
                          </div>
                          {formErrors.cardLogo && (
                            <p className="mt-1 text-red-500 text-xs">
                              {formErrors.cardLogo}
                            </p>
                          )}
                          <div className="flex gap-2 justify-end font-medium">
                            <button
                              onClick={() =>
                                setCardDetailsActive({
                                  ...cardDetailsActive,
                                  logoLink: false,
                                })
                              }
                              className="bg-white border border-gray-300 text-gray-500 px-3 py-1 hover:bg-gray-100 duration-300 rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                setCardDetailsActive({
                                  ...cardDetailsActive,
                                  logoLink: false,
                                })
                              }
                              className="bg-primary text-white px-3 py-1 hover:opacity-90 duration-300 rounded-lg text-xs"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold mx-auto mt-10 lg:w-[800px] flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary size-6"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <rect width="18" height="7" x="3" y="3" rx="1" />
            <rect width="9" height="7" x="3" y="14" rx="1" />
            <rect width="5" height="7" x="16" y="14" rx="1" />
          </svg>
          Select and Customise Template
        </h3>
        <div className="relative max-w-[1000px] mx-auto mt-4">
          {/* Left Arrow */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute -left-2 top-1/2 -translate-y-1/2 flex-shrink-0 bg-primary-xlight opacity-40 p-4 rounded-lg hover:opacity-80 duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Carousel Container */}
          <div className="lg:w-[800px] mx-auto">
            <div className="flex gap-4 overflow-x-auto carousel-container scroll-smooth p-2 scrollbar-hide">
              <Image
                src="/partner-integrations/template1.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template1
                    ? "outline outline-2 outline-primary"
                    : ""
                }`}
                width={266}
                height={158}
                onClick={() => {
                  handleTemplateSelect(1);
                }}
              />

              <Image
                src="/partner-integrations/template2.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template2
                    ? "outline outline-2 outline-primary"
                    : ""
                }`}
                width={266}
                height={158}
                onClick={() => {
                  handleTemplateSelect(2);
                }}
              />
              <Image
                src="/partner-integrations/template3.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template3
                    ? "outline outline-2 outline-primary"
                    : ""
                }`}
                width={266}
                height={158}
                onClick={() => {
                  handleTemplateSelect(3);
                }}
              />
              <Image
                src="/partner-integrations/template4.png"
                alt="carousel"
                className={`hover:scale-105 cursor-pointer duration-300 ${
                  focusTemplate.template4
                    ? "outline outline-2 outline-primary"
                    : ""
                }`}
                width={266}
                height={158}
                onClick={() => {
                  handleTemplateSelect(4);
                }}
              />
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => handleScroll("right")}
            className="absolute -right-2 top-1/2 -translate-y-1/2 flex-shrink-0 bg-primary-xlight opacity-40 p-4 rounded-lg hover:opacity-80 duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Template Modal */}
        <TemplateModal
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          onTemplateDataChange={handleTemplateDataChange}
          initialLogoLink={initialLogoLink}
        />
        {formErrors.template && (
          <p className="mt-4 text-red-500 text-sm text-center">
            {formErrors.template}
          </p>
        )}
        {formErrors.cardDescription ||
          (formErrors.cardLogo && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-500 text-sm">
                Please complete card details:
              </p>
              {formErrors.cardDescription && (
                <p className="text-red-500 text-xs">
                  {formErrors.cardDescription}
                </p>
              )}
              {formErrors.cardLogo && (
                <p className="text-red-500 text-xs">{formErrors.cardLogo}</p>
              )}
            </div>
          ))}

        {(formErrors.templateDescription || formErrors.templateLogo) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-500 text-sm">
              Please complete template details:
            </p>
            {formErrors.templateDescription && (
              <p className="text-red-500 text-xs">
                {formErrors.templateDescription}
              </p>
            )}
            {formErrors.templateLogo && (
              <p className="text-red-500 text-xs">{formErrors.templateLogo}</p>
            )}
          </div>
        )}
        {formErrors.email && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-500 text-sm">{formErrors.email}</p>
          </div>
        )}
        {formErrors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-500 text-sm">{formErrors.submit}</p>
          </div>
        )}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || walletBalance < parseFloat(selectedGift.totalCost)
            }
            className={`${
              walletBalance < parseFloat(selectedGift.totalCost)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:opacity-90"
            } text-white px-4 py-2.5 rounded-md flex items-center text-sm duration-300 font-semibold`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                </svg>
                Send Gift Now
              </>
            )}
          </button>
        </div>
        <p className="text-center text-xs sm:text-sm text-[#667085] mt-2">
          You'll be notified once{" "}
          {searchParams.get("first_name")
            ? `${searchParams.get("first_name")}`
            : "recipient"}{" "}
          accepts the gift
        </p>
        {walletBalance < parseFloat(selectedGift.totalCost) && (
          <p className="text-center text-red-500 text-sm mt-2">
            Insufficient funds. Please add funds to your wallet.
          </p>
        )}
      </main>

      {/* Amount Input Modal */}
      {showAmountInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">Add Funds to Wallet</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                min="1"
                step="0.01"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAmountSubmit}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowAmountInput(false);
                  setAmount("");
                }}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
            {isProcessingPayment ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Processing your payment...</p>
              </div>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <StripePaymentForm
                  amount={parseFloat(amount)}
                  onSuccess={(paymentIntent) => {
                    console.log(
                      "[Payment Flow] StripePaymentForm success callback triggered"
                    );
                    handlePaymentSuccess(paymentIntent);
                  }}
                  onClose={() => {
                    console.log("[Payment Flow] Payment modal closing");
                    setShowPaymentModal(false);
                  }}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
