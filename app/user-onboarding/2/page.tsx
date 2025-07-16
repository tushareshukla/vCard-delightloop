"use client";

import Stars from "@/components/common/Stars";
import Image from "next/image";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import router from "next/router";
import { useAuth } from "@/app/context/AuthContext";



// Gift interface
interface GiftImage {
  primaryImgUrl: string;
  secondaryImgUrl: string;
}

interface Gift {
  _id: string;
  sku: number;
  name: string;
  descShort: string;
  descFull: string;
  category: string;
  subCat: string;
  tags: string;
  price: number;
  minOrder: number;
  manufacturer: string;
  leadTime: number | null;
  personalizationOpts: string;
  images: GiftImage;
  stock: boolean;
  shippingCost: number;
  handlingCost: number;
  isDigital: boolean;
}

// Add these interfaces for recipient data
interface RecipientAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface RecipientData {
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  mailId: string;
  companyName?: string;
  jobTitle?: string;
  address?: RecipientAddress;
}

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  selected: boolean;
}

export default function UserOnboarding2() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth(); 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gifts on component mount
  useEffect(() => {
    if(!isLoadingCookies){
    if (!authToken) {
      console.log("No auth token found, redirecting to login...");
      router.push('/');
      return;
    }
    const fetchGifts = async () => {
      try {
        setIsLoading(true);
        // Replace with actual user ID in production
        const userId= Cookies.get('user_id');
        console.log(userId)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/users/${userId}/quick-send/gifts`,
          {
            headers: {
              "Authorization": `Bearer ${authToken}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setGifts(data.giftsQS || []);
      } catch (err) {
        console.error("Error fetching gifts:", err);
        setError("Failed to load gifts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifts();
  }
  }, [isLoadingCookies]);

  // Update recipients state to match our new interface
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState<RecipientData>({
    firstName: "",
    lastName: "",
    mailId: "",
    linkedinUrl: "",
    companyName: "",
    jobTitle: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // Toggle recipient selection
  const toggleRecipientSelection = (id: string) => {
    setRecipients(
      recipients.map((recipient) =>
        recipient.id === id
          ? { ...recipient, selected: !recipient.selected }
          : recipient
      )
    );
  };

  const openAddRecipientModal = () => {
    setNewRecipient({
      firstName: "",
      lastName: "",
      mailId: "",
      linkedinUrl: "",
      companyName: "",
      jobTitle: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section?: string
  ) => {
    const { name, value } = e.target;

    if (section === "address") {
      setNewRecipient({
        ...newRecipient,
        address: {
          ...newRecipient.address!,
          [name]: value,
        },
      });
    } else {
      setNewRecipient({ ...newRecipient, [name]: value });
    }
  };

  const saveNewRecipient = async () => {
    // Validate form
    if (
      !newRecipient.firstName ||
      !newRecipient.lastName ||
      !newRecipient.mailId
    ) {
      alert("First name, last name, and email are required");
      return;
    }

    setIsSaving(true);

    try {
      // Make API call to create recipient
      const userId = "67cec15f4d14cb32b6cef60b"; // Example user ID - replace with actual user ID
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/users/${userId}/quick-send/recipients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify(newRecipient),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add the new recipient to our state
      const recipientToAdd: Recipient = {
        id: data.recipient,
        firstName: newRecipient.firstName,
        lastName: newRecipient.lastName,
        email: newRecipient.mailId,
        address: newRecipient.address
          ? `${newRecipient.address.line1}, ${newRecipient.address.city}, ${newRecipient.address.state}`
          : undefined,
        selected: false,
      };

      setRecipients([...recipients, recipientToAdd]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving recipient:", error);
      alert("Failed to save recipient. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gifts.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % gifts.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gifts.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + gifts.length) % gifts.length);
    }
  };

  const selectImage = (index: number) => {
    if (index >= 0 && index < gifts.length) {
      setCurrentImageIndex(index);
    }
  };

  return (
    <main className="bg-primary-xlight px-4 py-6 md:py-9 md:px-11">
      <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} />

      {/* Carousel Section */}
      <div className="flex relative flex-col items-center justify-center mt-8">
        <div className="flex gap-4">
          {/* Carousel and side view */}
          <div className="flex w-full md:w-[293px] bg-white flex-col border border-[#D2CEFE] rounded-2xl">
            {/* Main image with navigation */}
            <div className="relative p-5">
              {isLoading ? (
                <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-2xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-2xl">
                  <p className="text-red-500 text-center p-4">{error}</p>
                </div>
              ) : gifts.length > 0 ? (
                <div className="aspect-square relative rounded-2xl">
                  <Image
                    src={
                      gifts[currentImageIndex]?.images.primaryImgUrl ||
                      "/img/placeholder.png"
                    }
                    alt={gifts[currentImageIndex]?.name || "Product image"}
                    fill
                    className="object-cover rounded-2xl"
                    priority
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-2xl">
                  <p className="text-gray-500">No gifts available</p>
                </div>
              )}

              {/* Navigation buttons - only show if we have gifts */}
              {gifts.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Indicator dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/70 px-3 py-2 rounded-full">
                    {gifts.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          currentImageIndex === index
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Product info */}
            <div className="p-4">
              {!isLoading && gifts.length > 0 && (
                <>
                  <h2 className="font-semibold text-lg text-gray-900">
                    {gifts[currentImageIndex]?.name || "Product Name"}
                  </h2>
                  <p className="font-semibold mt-3">
                    ${gifts[currentImageIndex]?.price || 0} + shipping
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {gifts[currentImageIndex]?.descShort || ""}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail gallery on the right */}
          <div className="flex flex-col gap-3 mt-2">
            {!isLoading &&
              gifts.slice(0, 3).map((gift, index) => (
                <div
                  key={gift._id}
                  className={`w-20 h-24 rounded-lg bg-white p-[2px] overflow-hidden border ${
                    currentImageIndex === index
                      ? "border-indigo-600"
                      : "border-[#D2CEFE]"
                  } cursor-pointer`}
                  onClick={() => selectImage(index)}
                >
                  <Image
                    src={gift.images.primaryImgUrl || "/img/placeholder.png"}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recipients Form Section */}
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="font-semibold mb-4">Select Recipients</h2>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#D2CEFE]">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center p-4 border-b border-gray-100">
            <div className="pr-4">
              <div className="w-5 h-5 border border-gray-300 rounded"></div>
            </div>
            <div className="font-medium">Name</div>
            <div className="font-medium">Email ID</div>
            <div className="font-medium">Address</div>
          </div>

          {/* Recipients list */}
          {recipients.length > 0 ? (
            recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="grid grid-cols-[auto_1fr_1fr_1fr] items-center p-4 border-b border-gray-100"
              >
                <div className="pr-4">
                  <div
                    className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${
                      recipient.selected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                    onClick={() => toggleRecipientSelection(recipient.id)}
                  >
                    {recipient.selected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="font-medium text-gray-900">
                  {recipient.firstName} {recipient.lastName}
                </div>
                <div className="text-gray-500">{recipient.email}</div>
                <div className="text-gray-500">{recipient.address || "—"}</div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recipients added yet. Click the button below to add recipients.
            </div>
          )}
        </div>

        {/* Add more recipients button */}
        <button
          onClick={openAddRecipientModal}
          className="mt-4 flex items-center gap-2 text-gray-700 font-medium py-2 px-5 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 4V16M4 10H16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add More Recipients
        </button>
        {/* //! Cost Summary Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden relative">
            {/* Scalloped edge at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-4 -mb-[7px]">
              <div className="flex justify-between ">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="size-6 bg-primary-xlight rounded-full -mb-10"
                  ></div>
                ))}
              </div>
            </div>

            <div className="p-8 pb-20 shadow-2xl">
              <h2 className="font-medium text-center mb-2">
                Your total estimated cost
              </h2>
              <p className="text-4xl font-bold text-center mb-8">
                $
                {!isLoading && gifts.length > 0
                  ? (
                      gifts[currentImageIndex]?.price +
                      gifts[currentImageIndex]?.shippingCost +
                      gifts[currentImageIndex]?.handlingCost
                    ).toFixed(2)
                  : "0.00"}
              </p>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300 my-6"></div>

              {/* Cost breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">Gift Cost</p>
                  <p className="text-lg font-medium">
                    $
                    {!isLoading && gifts.length > 0
                      ? gifts[currentImageIndex]?.price.toFixed(2)
                      : "0.00"}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <p className="text-lg font-medium mr-2">
                      Shipping & Handling
                    </p>
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-800">
                      <span className="text-sm font-bold">i</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium">
                    $
                    {!isLoading && gifts.length > 0
                      ? (
                          gifts[currentImageIndex]?.shippingCost +
                          gifts[currentImageIndex]?.handlingCost
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="border-t border-dashed border-gray-300 mt-6"></div>
              </div>
            </div>
          </div>
        </div>
        {/* //! ---- Button --- */}
        <button
          className={`
flex items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-10 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
        >
          <Image
            src="/svgs/Shimmer.svg"
            alt="shimmers"
            className=""
            width={22}
            height={22}
          />
          Send Gift
        </button>
      </div>

      {/* Add Recipient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Recipient</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={newRecipient.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={newRecipient.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mailId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email ID *
                </label>
                <input
                  type="email"
                  id="mailId"
                  name="mailId"
                  value={newRecipient.mailId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Email address"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="linkedinUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={newRecipient.linkedinUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={newRecipient.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="jobTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={newRecipient.jobTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Job title"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Address Information</h4>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="line1"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="line1"
                      name="line1"
                      value={newRecipient.address?.line1}
                      onChange={(e) => handleInputChange(e, "address")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="line2"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="line2"
                      name="line2"
                      value={newRecipient.address?.line2}
                      onChange={(e) => handleInputChange(e, "address")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Apt, suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={newRecipient.address?.city}
                        onChange={(e) => handleInputChange(e, "address")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={newRecipient.address?.state}
                        onChange={(e) => handleInputChange(e, "address")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="zip"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        value={newRecipient.address?.zip}
                        onChange={(e) => handleInputChange(e, "address")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="ZIP code"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={newRecipient.address?.country}
                        onChange={(e) => handleInputChange(e, "address")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNewRecipient}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Recipient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
