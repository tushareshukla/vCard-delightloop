"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Shield,
  CheckCircle,
  Smartphone,
} from "lucide-react";

interface DraftVCardData {
  draft_vcardId: string;
  handle: string;
  fullName: string;
  title?: string;
  company?: string;
  links?: Array<{
    type: string;
    value: string;
    isVisible: boolean;
  }>;
}

type CardType = "digital" | "physical";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftData, setDraftData] = useState<DraftVCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checkout form
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("US");

  // Card selection
  const [selectedCardType, setSelectedCardType] =
    useState<CardType>("physical");

  // Floating button state
  const [isButtonFloating, setIsButtonFloating] = useState(true);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  // Payment form
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardType, setCardType] = useState(""); // To determine payment_method_id

  const draftId = searchParams?.get("draftId");
  const referralVcr = searchParams?.get("vcr");

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Handle card number change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      // 16 digits + 3 spaces
      setCardNumber(formatted);

      // Detect card type and set payment_method_id
      const digits = formatted.replace(/\s/g, "");
      if (digits.length >= 1) {
        if (digits.startsWith("4")) {
          setCardType("pm_card_visa");
        } else if (
          digits.startsWith("5") ||
          (digits.startsWith("2") &&
            digits.length >= 2 &&
            ["22", "23", "24", "25", "26", "27"].some((prefix) =>
              digits.startsWith(prefix)
            ))
        ) {
          setCardType("pm_card_mastercard");
        } else if (digits.startsWith("34") || digits.startsWith("37")) {
          setCardType("pm_card_amex");
        } else if (digits.startsWith("4") && digits.length >= 4) {
          // Some Visa debit cards
          setCardType("pm_card_visa_debit");
        } else {
          setCardType("pm_card_visa"); // Default fallback
        }
      } else {
        setCardType(""); // Clear card type if no digits
      }
    }
  };

  // Handle expiry date change
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  // Handle CVV change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  useEffect(() => {
    if (draftId) {
      fetchDraftVCard(draftId);
    } else {
      setError("No draft ID provided");
      setLoading(false);
    }
  }, [draftId]);

  // Floating button scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!buttonContainerRef.current || loading) return;

      const windowHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;

      // Get the button container's position
      const buttonContainer = buttonContainerRef.current;
      const buttonRect = buttonContainer.getBoundingClientRect();
      const buttonTop = scrollTop + buttonRect.top;

      // Calculate if the original button position is visible
      // Show floating button when original button is more than 100px below viewport
      const shouldFloat = buttonTop - scrollTop > windowHeight - 100;

      setIsButtonFloating(shouldFloat);
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Initial check with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loading]); // Re-run when loading changes to ensure proper calculation

  const fetchDraftVCard = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/${id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDraftData(data.data);

          // Pre-populate name if available
          if (data.data.fullName) {
            const nameParts = data.data.fullName.split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setCardHolder(data.data.fullName); // Pre-populate card holder
          }

          // Pre-populate email and phone if available from card
          if (data.data.links) {
            const emailLink = data.data.links.find(
              (link: any) => link.type === "email"
            );
            const phoneLink = data.data.links.find(
              (link: any) => link.type === "phone"
            );

            if (emailLink) {
              setEmail(emailLink.value);
            }
            if (phoneLink) {
              setPhone(phoneLink.value);
            }
          }
        } else {
          setError(data.error_message || "Failed to load draft VCard");
        }
      } else {
        setError("Failed to fetch draft VCard");
      }
    } catch (error) {
      console.error("Error fetching draft VCard:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!draftData) return;

    setProcessing(true);
    try {
      // Step 1: Save shipping details using the draft shipping API (for both digital and physical)
      const contactAddressPayload = {
        fullName: `${firstName} ${lastName}`,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode: zipCode,
        country,
        phoneNumber: phone,
        email,
        isDefault: true,
        isDeleted: false,
      };

      const shippingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/shipping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft_vcardId: draftData.draft_vcardId,
            ...contactAddressPayload,
            referralVcr,
          }),
        }
      );

      if (!shippingResponse.ok) {
        const errorData = await shippingResponse.json();
        throw new Error(
          errorData.error_message || "Failed to save shipping details"
        );
      }

      // Step 2: Handle card creation differently for digital vs physical cards
      let cardCreationResult: any = null;

      if (selectedCardType === "digital") {
        // Create digital card using the new API endpoint
        const digitalCardResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/${draftData.draft_vcardId}/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referralVcr,
            }),
          }
        );

        if (!digitalCardResponse.ok) {
          const errorData = await digitalCardResponse.json();
          throw new Error(
            errorData.error_message || "Failed to create digital card"
          );
        }

        cardCreationResult = await digitalCardResponse.json();

        // Check if digital card creation was successful
        if (!cardCreationResult.success) {
          throw new Error(
            cardCreationResult.error_message ||
              "Failed to create digital card. Please try again."
          );
        }
      } else {
        // Process payment for physical card
        const paymentPayload = {
          draft_vcardId: draftData.draft_vcardId,
          amount: 29.99,
          payment_method_id: cardType || "pm_card_visa", // Use detected card type
          currency: "USD",
        };

        const paymentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/draft/payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentPayload),
          }
        );

        if (!paymentResponse.ok) {
          const paymentErrorData = await paymentResponse.json();
          throw new Error(
            paymentErrorData.error_message ||
              "Payment failed. Please check your card details and try again."
          );
        }

        const paymentResult = await paymentResponse.json();

        // Check if payment was successful
        if (!paymentResult.success) {
          throw new Error(
            paymentResult.error_message ||
              "Payment was declined. Please try a different card."
          );
        }

        cardCreationResult = paymentResult;
      }

      // Step 3: Navigate to confirmation page
      const params = new URLSearchParams();
      params.set("cardType", selectedCardType);
      if (referralVcr) params.set("vcr", referralVcr);

      // For digital cards, pass the handle if available
      if (selectedCardType === "digital" && cardCreationResult?.data?.handle) {
        params.set("handle", cardCreationResult.data.handle);
      }

      // Pass draft ID for vcard tracking
      if (draftData.draft_vcardId) {
        params.set("draftId", draftData.draft_vcardId);
      }

      router.push(`/referral/confirmation?${params.toString()}`);
    } catch (error) {
      console.error("Error placing order:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (draftId) params.set("draftId", draftId);
    if (referralVcr) params.set("vcr", referralVcr);
    router.push(`/referral/preview?${params.toString()}`);
  };

  const isFormValid =
    selectedCardType === "digital"
      ? email &&
        phone &&
        firstName &&
        lastName &&
        addressLine1 &&
        city &&
        state &&
        zipCode
      : email &&
        phone &&
        firstName &&
        lastName &&
        addressLine1 &&
        city &&
        state &&
        zipCode &&
        cardNumber.replace(/\s/g, "").length >= 16 &&
        expiryDate.length === 5 &&
        cvv.length >= 3 &&
        cardHolder &&
        cardType; // Ensure card type is detected

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !draftData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={handleBack}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF]">
      <div className="max-w-md mx-auto min-h-screen">
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative pt-6 pb-4 px-6">
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
                  <div className="w-12 h-1 bg-[#7C3AED] rounded-full"></div>
                  <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <div className="w-12 h-1 bg-[#7C3AED] rounded-full"></div>
                  <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">3</span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Your card is just one tap away
              </h1>
              <p className="text-gray-600 mb-6">
                Complete your order for {draftData.fullName}
              </p>
            </div>
          </div>

          {/* Card Selection - Clean Mobile Design */}
          <div className="px-4 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              Choose Your Card
            </h3>

            {/* Mobile-First Clean Card Design */}
            <div className="space-y-3">
              {/* Physical Card Option - Now First */}
              <div
                onClick={() => setSelectedCardType("physical")}
                className={`relative cursor-pointer transition-all duration-300 ease-out ${
                  selectedCardType === "physical" ? "scale-[1.01]" : ""
                }`}
              >
                <div
                  className={`relative rounded-2xl p-5 transition-all duration-300 border-2 ${
                    selectedCardType === "physical"
                      ? "bg-gradient-to-br from-purple-50 to-purple-100 border-[#7C3AED] shadow-lg shadow-purple-200/50"
                      : "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  {/* Selection Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Radio Button */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedCardType === "physical"
                            ? "border-[#7C3AED] bg-[#7C3AED]"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedCardType === "physical" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedCardType === "physical"
                            ? "bg-[#7C3AED] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>

                      {/* Title */}
                      <div>
                        <h4 className="font-semibold text-base text-gray-700">
                          Physical Card
                        </h4>
                        <p className="text-xs text-gray-500">Premium NFC</p>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                        selectedCardType === "physical"
                          ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      $29
                    </div>
                  </div>

                  {/* Features */}
                  <div className="pl-8 space-y-1 text-gray-500">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>Premium NFC technology</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>Free shipping</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Card Option - Now Second */}
              <div
                onClick={() => setSelectedCardType("digital")}
                className={`relative cursor-pointer transition-all duration-300 ease-out ${
                  selectedCardType === "digital" ? "scale-[1.01]" : ""
                }`}
              >
                <div
                  className={`relative rounded-2xl p-5 transition-all duration-300 border-2 ${
                    selectedCardType === "digital"
                      ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-400 shadow-lg shadow-slate-200/50"
                      : "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  {/* Selection Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Radio Button */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedCardType === "digital"
                            ? "border-slate-500 bg-slate-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedCardType === "digital" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedCardType === "digital"
                            ? "bg-slate-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>

                      {/* Title */}
                      <div>
                        <h4
                          className={`font-semibold text-base ${
                            selectedCardType === "digital"
                              ? "text-slate-700"
                              : "text-gray-700"
                          }`}
                        >
                          Digital Card
                        </h4>
                        <p
                          className={`text-xs ${
                            selectedCardType === "digital"
                              ? "text-slate-500"
                              : "text-gray-500"
                          }`}
                        >
                          Instant access
                        </p>
                      </div>
                    </div>

                    {/* Price Badge - Gray Fade */}
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                        selectedCardType === "digital"
                          ? "bg-gray-200 text-gray-600 shadow-sm"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      FREE
                    </div>
                  </div>

                  {/* Features */}
                  <div
                    className={`pl-8 space-y-1 ${
                      selectedCardType === "digital"
                        ? "text-slate-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>Share instantly via link</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>Works on any device</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 px-2">
              {selectedCardType === "digital" ? (
                <p className="text-xs text-center text-slate-600 bg-slate-50 rounded-lg py-2 px-3">
                  Get started immediately with your digital card. Perfect for
                  instant networking.
                </p>
              ) : (
                <p className="text-xs text-center text-purple-700 bg-purple-50 rounded-lg py-2 px-3">
                  Premium NFC card with 100% Satisfaction. Tap to share your
                  details instantly.
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="px-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Shipping Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 (Optional)
                </label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State/Province"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="12345"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IN">India</option>
                    <option value="JP">Japan</option>
                    <option value="SG">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method - Only show for Physical Card */}
          {selectedCardType === "physical" && (
            <div className="px-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>

              {/* Card Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="5842 6342 7198 8824"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {cardType === "pm_card_visa" && cardNumber.length > 4 ? (
                      <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">V</span>
                      </div>
                    ) : cardType === "pm_card_mastercard" &&
                      cardNumber.length > 4 ? (
                      <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MC</span>
                      </div>
                    ) : cardType === "pm_card_amex" && cardNumber.length > 4 ? (
                      <div className="w-8 h-5 bg-blue-400 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AE</span>
                      </div>
                    ) : cardType === "pm_card_visa_debit" &&
                      cardNumber.length > 4 ? (
                      <div className="w-8 h-5 bg-blue-700 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VD</span>
                      </div>
                    ) : (
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <Input
                    type="text"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <Input
                    type="text"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <Input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              {/* Security Features */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">
                      Secured by Stripe
                    </h4>
                    <p className="text-sm text-green-700">
                      Your payment is protected with bank-level security
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-green-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>PCI DSS compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Fraud protection</span>
                  </div>
                </div>

                {/* Accepted Cards */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">
                      We accept:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">V</span>
                      </div>
                      <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MC</span>
                      </div>
                      <div className="w-8 h-5 bg-blue-400 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AE</span>
                      </div>
                      <div className="w-8 h-5 bg-orange-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Place Order Button - Original Position */}
          <div ref={buttonContainerRef} className="px-6 pb-8">
            {/* Placeholder div to maintain layout when button is floating */}
            <div
              className={`transition-all duration-300 ${
                isButtonFloating
                  ? "opacity-30 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <Button
                onClick={handlePlaceOrder}
                disabled={processing || !isFormValid}
                className={`w-full font-bold py-6 rounded-2xl text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg border-0 ${
                  processing || !isFormValid
                    ? "text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white"
                }`}
                style={
                  processing || !isFormValid
                    ? { backgroundColor: "#a1b0c4", opacity: 1 }
                    : {}
                }
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {selectedCardType === "digital"
                      ? "Creating Digital Card..."
                      : "Processing Order..."}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {selectedCardType === "digital"
                      ? "Create Digital Card - Free"
                      : "Place Order - $29"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </div>
          </div>

          {/* Floating Button */}
          <div
            className={`fixed bottom-6 left-6 right-6 z-50 transition-all duration-500 transform ${
              isButtonFloating
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
          >
            <div className="max-w-md mx-auto">
              <Button
                onClick={handlePlaceOrder}
                disabled={processing || !isFormValid}
                className={`w-full font-bold py-6 rounded-2xl text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-2xl border-0 ${
                  processing || !isFormValid
                    ? "text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white"
                }`}
                style={
                  processing || !isFormValid
                    ? { backgroundColor: "#a1b0c4", opacity: 1 }
                    : {}
                }
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {selectedCardType === "digital"
                      ? "Creating Digital Card..."
                      : "Processing Order..."}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {selectedCardType === "digital"
                      ? "Create Digital Card - Free"
                      : "Place Order - $29"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
