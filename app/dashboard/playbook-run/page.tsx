"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Link from "next/link";
import router from "next/router";
import { useAuth } from "@/app/context/AuthContext";
import { config } from "@/utils/config";
interface Playbook {
  _id: string;
  name: string;
  description: string;
  thumbnail: string;
  budget: number;
}

interface Recipient {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  linkedinProfilePicture?: string;
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
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface Notification {
  type: "success" | "error";
  message: string;
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

const styles = `
  @keyframes scaleCheck {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-scale-check {
    animation: scaleCheck 0.3s ease-out forwards;
  }
`;

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

export default function PlaybookRun() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(
    null
  );
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [giftingMethod, setGiftingMethod] = useState<
    "hyper-personalization" | "manual" | null
  >(null);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [modalGifts, setModalGifts] = useState<any[]>([]);
  const [selectedModalGift, setSelectedModalGift] = useState<string>("");
  const [isLoadingGifts, setIsLoadingGifts] = useState(false);
  const [editingRecipientIndex, setEditingRecipientIndex] = useState<
    number | null
  >(null);
  const [newRecipient, setNewRecipient] = useState<Recipient>({
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
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [linkedinProfile, setLinkedinProfile] =
    useState<LinkedInProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  // Refs for sections
  const playbookSectionRef = useRef<HTMLDivElement>(null);
  const recipientsSectionRef = useRef<HTMLDivElement>(null);
  const giftingMethodSectionRef = useRef<HTMLDivElement>(null);

  // Calculate current step based on completion
  const getCurrentStep = () => {
    if (giftingMethod) return 3;
    if (
      recipients.length > 0 &&
      recipients.every((r) => r.firstName && r.lastName && r.email)
    )
      return 2;
    if (selectedPlaybook) return 1;
    return 0;
  };

  // Fetch playbooks
  useEffect(() => {
    if (!isLoadingCookies) {
    const fetchPlaybooks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSelectedPlaybook(null);

        // Get user data from cookie
        if (!authToken) {
          console.log("No auth token found, redirecting to login...");
          router.push('/');
          return;
        }
        if (!organizationId) {
          throw new Error("Organization ID not found");
        }

        const response = await fetch(
          `${config.BACKEND_URL}/v1/organizations/${organizationId}/playbooks?user_id=${userId}`,
          {
            headers: {
              accept: "application/json",
              "Authorization": `Bearer ${authToken}`
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch playbooks");
        }

        const data = await response.json();
        setPlaybooks(data);

        // If there's exactly one playbook, select it automatically
        if (data.length === 1) {
          setSelectedPlaybook(data[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch playbooks"
        );
        console.error("Error fetching playbooks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaybooks();
    }
  }, [isLoadingCookies]);

  // Function to scroll to a section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (
      recipients.length > 0 &&
      recipients.every((r) => r.firstName && r.lastName && r.email)
    ) {
      scrollToSection(giftingMethodSectionRef);
    }
  }, [recipients]);

  const renderProgressBar = () => {
    const currentStep = getCurrentStep();
    const steps = [
      { number: 1, label: "Select Playbook" },
      { number: 2, label: "Add Recipients" },
      { number: 3, label: "Send Gifts!" },
    ];

    return (
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-[9px] left-0 w-full h-[1px] bg-[#F2F4F7]">
          <div
            className="h-full bg-[#7F56D9] transition-all duration-300"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between relative ">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex flex-col items-center relative"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center z-10
                  ${
                    currentStep > index
                      ? "bg-[#7F56D9] border-[#7F56D9]"
                      : currentStep === index
                      ? "border-[#7F56D9] bg-white"
                      : "bg-white border-[#D0D5DD]"
                  }`}
              >
                {currentStep > index && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {currentStep === index && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7F56D9]" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold whitespace-nowrap
                  ${
                    currentStep >= index ? "text-[#1B1D21]" : "text-[#667085]"
                  }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlaybookSelection = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {isLoading ? (
        <div className="col-span-2 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7F56D9] mx-auto"></div>
        </div>
      ) : error ? (
        <div className="col-span-2 text-center py-8 text-red-500">{error}</div>
      ) : playbooks.length === 0 ? (
        <div className="col-span-2 text-center py-8 text-[#667085]">
          No playbooks available
        </div>
      ) : (
        playbooks.map((playbook, index) => (
          <div
            key={playbook._id || `playbook-${index}`}
            className={`p-6 border rounded-xl cursor-pointer transition-all duration-300 relative ${
              selectedPlaybook?._id === playbook._id
                ? "border-[#7F56D9] bg-[#F9F5FF] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_-1px_rgba(16,24,40,0.1)]"
                : "border-[#EAECF0] bg-white hover:border-[#D6BBFB] hover:bg-[#F9F5FF]/50"
            }`}
            onClick={() => setSelectedPlaybook(playbook)}
          >
            {selectedPlaybook?._id === playbook._id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7F56D9] flex items-center justify-center animate-scale-check">
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
              </div>
            )}
            <div className="space-y-1">
              <div>
                <h3 className="font-semibold text-[#101828] text-lg mb-1">
                  {playbook.name}
                </h3>
                <p className="text-[#667085] text-sm line-clamp-2">
                  {playbook.description}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#EAECF0]">
                <div className="w-5 h-5 rounded-full bg-[#F4EBFF] flex items-center justify-center">
                  <span className="text-[#7F56D9] text-sm font-medium">$</span>
                </div>
                <span className="text-sm font-medium text-[#344054]">
                  Budget per recipient: ${playbook.budget?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const fetchLinkedInProfile = async (linkedinUrl: string) => {
    try {
      setIsLoadingProfile(true);
      setLinkedinError(null);

      // Extract username from full LinkedIn URL if provided
      let username = linkedinUrl;
      const linkedinUrlPattern =
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\s]+)\/?/;
      const match = linkedinUrl.match(linkedinUrlPattern);
      if (match) {
        username = match[1];
      }

      // Remove any trailing slashes and validate username format
      username = username.replace(/\/$/, "");
      if (!username.match(/^[a-zA-Z0-9-]+$/)) {
        setLinkedinError(
          "Invalid LinkedIn username format. Please enter only letters, numbers, and hyphens."
        );
        return;
      }

      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const response = await fetch(
        `${config.BACKEND_URL}/v1/recipients/linkedin-profile?profile=${username}`,
        {
          headers: {
            accept: "*/*",
            "Authorization": `Bearer ${authToken}`
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
        setNewRecipient((prev) => ({
          ...prev,
          firstName: profile.firstName,
          lastName: profile.lastName,
          jobTitle: currentPosition?.title || "",
          company: currentPosition?.companyName || "",
          linkedinUrl: username, // Store the clean username
        }));
      } else {
        setLinkedinError(
          "Hmm... we couldn't find this LinkedIn profile. Please double-check the username or try entering the details manually."
        );
      }
    } catch (error) {
      console.error("Error fetching LinkedIn profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (
        errorMessage.includes("Invalid profile data") ||
        errorMessage.includes("Failed to fetch")
      ) {
        setLinkedinError(
          "Hmm... we couldn't find this LinkedIn profile. Please double-check the username or try entering the details manually."
        );
      } else {
        setLinkedinError(
          "Something went wrong while fetching the profile. Please try again or enter the details manually if the issue persists."
        );
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const renderRecipientForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        {recipients.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-[#EAECF0]">
              <div className="px-6 py-4  border-b border-[#EAECF0]">
                <h3 className="text-sm font-semibold text-[#1B1D21]">
                  Recipients ({recipients.length})
                </h3>
              </div>
              <div className="divide-y divide-[#EAECF0]">
                {recipients.map((recipient, index) => (
                  <div key={index} className="px-3 py-3 md:px-6 md:py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border border-[#EAECF0]">
                          {recipient.linkedinProfilePicture ? (
                            <Image
                              src={recipient.linkedinProfilePicture}
                              alt={`${recipient.firstName} ${recipient.lastName}`}
                              fill
                              className="object-cover"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder.png";
                              }}
                            />
                          ) : (
                            <DefaultAvatar />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#1B1D21]">
                            {`${recipient.firstName} ${recipient.lastName}`}
                          </h3>
                          <p className="text-sm text-[#667085]">
                            {recipient.email}
                          </p>
                          {(recipient.jobTitle || recipient.company) && (
                            <p className="text-sm text-[#667085]">
                              {[recipient.jobTitle, recipient.company]
                                .filter(Boolean)
                                .join(" at ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-2 ">
                        <button
                          onClick={() => handleEditRecipient(index)}
                          className="text-[#667085] hover:text-[#1B1D21] p-2"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.1667 2.5C14.3856 2.28113 14.6454 2.10752 14.9314 1.98855C15.2175 1.86959 15.5238 1.80774 15.8334 1.80774C16.1429 1.80774 16.4493 1.86959 16.7353 1.98855C17.0214 2.10752 17.2812 2.28113 17.5001 2.5C17.7189 2.71887 17.8925 2.97871 18.0115 3.26474C18.1305 3.55077 18.1923 3.85714 18.1923 4.16667C18.1923 4.4762 18.1305 4.78257 18.0115 5.0686C17.8925 5.35463 17.7189 5.61447 17.5001 5.83334L6.25008 17.0833L2.08341 18.3333L3.33341 14.1667L14.1667 2.5Z"
                              stroke="currentColor"
                              strokeWidth="1.67"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const newRecipients = [...recipients];
                            newRecipients.splice(index, 1);
                            setRecipients(newRecipients);
                          }}
                          className="text-[#667085] hover:text-[#1B1D21] p-2"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3333 5V4.33333C13.3333 3.39991 13.3333 2.9332 13.1517 2.57668C12.9919 2.26308 12.7369 2.00811 12.4233 1.84832C12.0668 1.66667 11.6001 1.66667 10.6667 1.66667H9.33333C8.39991 1.66667 7.9332 1.66667 7.57668 1.84832C7.26308 2.00811 7.00811 2.26308 6.84832 2.57668C6.66667 2.9332 6.66667 3.39991 6.66667 4.33333V5M8.33333 9.58333V13.75M11.6667 9.58333V13.75M2.5 5H17.5M15.8333 5V14.3333C15.8333 15.7335 15.8333 16.4335 15.5608 16.9683C15.3212 17.4387 14.9387 17.8212 14.4683 18.0608C13.9335 18.3333 13.2335 18.3333 11.8333 18.3333H8.16667C6.76654 18.3333 6.06647 18.3333 5.53169 18.0608C5.06129 17.8212 4.67883 17.4387 4.43915 16.9683C4.16667 16.4335 4.16667 15.7335 4.16667 14.3333V5"
                              stroke="currentColor"
                              strokeWidth="1.66667"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            resetRecipientForm(); // Reset form before showing modal
            setShowAddRecipientModal(true);
          }}
          className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] flex items-center justify-center gap-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 4.16667V15.8333M4.16667 10H15.8333"
              stroke="currentColor"
              strokeWidth="1.66667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Recipient
        </button>
      </div>
    </div>
  );

  const fetchGifts = async () => {
    try {
      setIsLoadingGifts(true);

      // Get user data from cookie
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      if (!selectedPlaybook?._id) {
        throw new Error("Playbook ID not found");
      }

      const response = await fetch(
        `${config.BACKEND_URL}/v1/organizations/${organizationId}/playbooks/${selectedPlaybook._id}/gifts?user_id=${userId}`,
        {
          headers: {
            accept: "application/json",
            "Authorization": `Bearer ${authToken}`
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch gifts");
      }

      const data = await response.json();
      setModalGifts(data);
    } catch (err) {
      console.error("Error fetching gifts:", err);
    } finally {
      setIsLoadingGifts(false);
    }
  };

  const renderGiftingMethod = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div
          className={`flex-1 p-4 md:p-6 border rounded-xl cursor-pointer transition-all duration-300 relative ${
            giftingMethod === "hyper-personalization"
              ? "border-[#7F56D9] bg-[#F9F5FF] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_-1px_rgba(16,24,40,0.1)]"
              : recipients.some((r) => !r.linkedinUrl)
              ? "border-[#EAECF0] bg-[#F9FAFB] opacity-50 cursor-not-allowed"
              : "border-[#EAECF0] bg-white hover:border-[#D6BBFB] hover:bg-[#F9F5FF]/50"
          }`}
          onClick={() => {
            if (!recipients.some((r) => !r.linkedinUrl)) {
              setGiftingMethod("hyper-personalization");
              setNotification(null);
            }
          }}
        >
          {giftingMethod === "hyper-personalization" && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7F56D9] flex items-center justify-center animate-scale-check">
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
            </div>
          )}
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-full bg-[#F4EBFF] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C12.5523 2 13 2.44772 13 3V4C13 4.55228 12.5523 5 12 5C11.4477 5 11 4.55228 11 4V3C11 2.44772 11.4477 2 12 2Z"
                  fill="#7F56D9"
                />
                <path
                  d="M8 6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V7C16 8.10457 15.1046 9 14 9H10C8.89543 9 8 8.10457 8 7V6Z"
                  fill="#7F56D9"
                />
                <path
                  d="M6 9C6 7.89543 6.89543 7 8 7H16C17.1046 7 18 7.89543 18 9V14C18 15.1046 17.1046 16 16 16H8C6.89543 16 6 15.1046 6 14V9Z"
                  fill="#7F56D9"
                />
                <path
                  d="M10 12C10 11.4477 10.4477 11 11 11H13C13.5523 11 14 11.4477 14 12C14 12.5523 13.5523 13 13 13H11C10.4477 13 10 12.5523 10 12Z"
                  fill="white"
                />
                <path
                  d="M8.5 18C8.5 17.4477 8.94772 17 9.5 17H14.5C15.0523 17 15.5 17.4477 15.5 18V21C15.5 21.5523 15.0523 22 14.5 22H9.5C8.94772 22 8.5 21.5523 8.5 21V18Z"
                  fill="#7F56D9"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[#101828] text-lg">
              AI-Powered Personalization
            </h3>
            <p className="text-[#667085] text-sm">
              Our AI analyzes LinkedIn profiles to select the perfect gift for
              each recipient
            </p>
            {recipients.some((r) => !r.linkedinUrl) && (
              <div className="mt-3 p-2 bg-[#FEF3F2] rounded-lg border border-[#FEE4E2] text-sm text-[#B42318]">
                LinkedIn profiles required for all recipients to use this option
              </div>
            )}
          </div>
        </div>
        <div
          className={`flex-1 p-6 border rounded-xl cursor-pointer transition-all duration-300 relative ${
            giftingMethod === "manual"
              ? "border-[#7F56D9] bg-[#F9F5FF] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_-1px_rgba(16,24,40,0.1)]"
              : "border-[#EAECF0] bg-white hover:border-[#D6BBFB] hover:bg-[#F9F5FF]/50"
          }`}
          onClick={() => {
            setGiftingMethod("manual");
            setNotification(null);
            setShowGiftModal(true);
            fetchGifts();
          }}
        >
          {giftingMethod === "manual" && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7F56D9] flex items-center justify-center animate-scale-check">
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
            </div>
          )}
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-full bg-[#F4EBFF] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 12V16.8C20 17.9201 20 18.4802 19.782 18.908C19.5903 19.2843 19.2843 19.5903 18.908 19.782C18.4802 20 17.9201 20 16.8 20H7.2C6.07989 20 5.51984 20 5.09202 19.782C4.71569 19.5903 4.40973 19.2843 4.21799 18.908C4 18.4802 4 17.9201 4 16.8V12"
                  stroke="#7F56D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 7.5H5.5C4.67157 7.5 4 8.17157 4 9V10C4 10.8284 4.67157 11.5 5.5 11.5H18.5C19.3284 11.5 20 10.8284 20 10V9C20 8.17157 19.3284 7.5 18.5 7.5Z"
                  fill="#7F56D9"
                />
                <path
                  d="M12 7.5V20M12 7.5L7.5 4M12 7.5L16.5 4"
                  stroke="#7F56D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[#101828] text-lg">
              Manual Selection
            </h3>
            <p className="text-[#667085] text-sm">
              Choose gifts yourself from our curated catalog
            </p>
          </div>
        </div>
      </div>

      {/* Gift Selection Modal */}
      <div
        className={`${
          showGiftModal ? "translate-x-0" : "translate-x-full"
        } fixed z-50 right-0 top-0 bottom-0 duration-300 flex items-stretch`}
      >
        <div
          onClick={() => setShowGiftModal(false)}
          className="fixed inset-0 bg-primary-xlight bg-opacity-80"
        ></div>
        <div className="relative w-[604px] bg-white h-full shadow-xl flex flex-col">
          <div className="p-6 flex-1 overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-medium">Select a Gift</div>
              <svg
                onClick={() => setShowGiftModal(false)}
                className="cursor-pointer stroke-black hover:stroke-red-400"
                width="24"
                height="24"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0554 3.94444L3.94434 10.0556M3.94434 3.94444L10.0554 10.0556"
                  strokeWidth="1.01852"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Gift list */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mt-4 text-xs font-medium border border-[#D2CEFE] rounded-lg overflow-auto">
                <div className="sticky top-0 bg-white text-[11px] text-[#101828] font-semibold flex items-center justify-between border-b px-8 border-[#D2CEFE]">
                  <div className="p-[11px]">GIFT ITEMS</div>
                  <div className="p-[11px]">COST</div>
                </div>
                <div className="overflow-y-auto">
                  {isLoadingGifts ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading gifts...
                    </div>
                  ) : modalGifts.length > 0 ? (
                    modalGifts.map((gift) => (
                      <div
                        key={gift._id}
                        className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                      >
                        <div className="flex gap-3 items-center">
                          <input
                            type="radio"
                            name="modalGift"
                            checked={selectedModalGift === gift._id}
                            onChange={() => setSelectedModalGift(gift._id)}
                            className="h-4 w-4 text-primary focus:ring-primary cursor-pointer rounded-full border-gray-300"
                          />
                          <div className="flex gap-2 items-start">
                            <Image
                              src={gift.primaryImgUrl || "/placeholder.png"}
                              alt={gift.name}
                              width={76}
                              height={76}
                              className="object-cover rounded-md"
                              onError={(e: any) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = "/placeholder.png";
                              }}
                            />
                            <div className="grid gap-2">
                              <div className="w-[163px] font-medium">
                                {gift.name}
                              </div>
                              <div className="text-xs opacity-70">
                                {gift.descShort}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 text-xs text-center font-medium">
                          ${gift.price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No gifts available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3 mt-4 place-self-end border-t border-[#EAECF0] pt-4 w-full p-6">
            <button
              onClick={() => {
                if (selectedModalGift) {
                  // Handle gift selection
                  console.log("Selected gift:", selectedModalGift);
                  setShowGiftModal(false);
                }
              }}
              disabled={!selectedModalGift}
              className={`text-white text-xs font-medium px-4 py-2.5 rounded-lg ${
                selectedModalGift
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        {notification && (
          <div
            className={`w-full rounded-lg p-4 ${
              notification.type === "success"
                ? "bg-[#ECFDF3] text-[#027A48] border border-[#6CE9A6]"
                : "bg-[#FEF3F2] text-[#B42318] border border-[#FEE4E2]"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z"
                    stroke="currentColor"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.3334 8.33333L8.75002 12.5L6.66669 10.4167"
                    stroke="currentColor"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z"
                    stroke="currentColor"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 6.66667V10"
                    stroke="currentColor"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 13.3333H10.0083"
                    stroke="currentColor"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleExecutePlaybook}
          disabled={!giftingMethod}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold ${
            giftingMethod
              ? "bg-[#7F56D9] text-white hover:bg-[#6941C6] cursor-pointer"
              : "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed"
          }`}
        >
          <Image
            src="/svgs/Shimmer.svg"
            alt="shimmers"
            width={22}
            height={22}
          />
          Execute Playbook
        </button>
      </div>
    </div>
  );

  const handleEditRecipient = (index: number) => {
    setEditingRecipientIndex(index);
    setNewRecipient(recipients[index]);
    // Set LinkedIn profile if the recipient has one
    if (recipients[index].linkedinProfilePicture) {
      setLinkedinProfile({
        success: true,
        data: {
          firstName: recipients[index].firstName,
          lastName: recipients[index].lastName,
          headline: "",
          profilePicture: recipients[index].linkedinProfilePicture,
          geo: { city: "", full: "" },
          position: [
            {
              title: recipients[index].jobTitle || "",
              companyName: recipients[index].company || "",
              employmentType: "",
            },
          ],
        },
      });
    } else {
      setLinkedinProfile(null);
    }
    setShowAddRecipientModal(true);
  };

  const resetRecipientForm = () => {
    setNewRecipient({
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
    setEditingRecipientIndex(null);
    setLinkedinProfile(null); // Clear LinkedIn profile state
    setLinkedinError(null);
  };

  const handleCloseRecipientModal = () => {
    setShowAddRecipientModal(false);
    resetRecipientForm();
    setLinkedinError(null);
  };

  const handleSubmitRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    const recipientToSave = {
      ...newRecipient,
      linkedinProfilePicture:
        linkedinProfile?.data?.profilePicture || undefined,
    };

    if (editingRecipientIndex !== null) {
      // Update existing recipient
      const updatedRecipients = [...recipients];
      updatedRecipients[editingRecipientIndex] = recipientToSave;
      setRecipients(updatedRecipients);
    } else {
      // Add new recipient
      setRecipients([...recipients, recipientToSave]);
    }
    handleCloseRecipientModal();
    // Clear any existing notifications when recipient is updated/added
    setNotification(null);
  };

  const renderAddRecipientModal = () => {
    if (!showAddRecipientModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-lg w-[872px] relative my-8">
          <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
          <div className="relative z-20">
            <div className="sticky top-0 z-30 bg-white flex justify-between items-center px-6 py-4 border-b border-[#EAECF0]">
              <h2 className="text-xl font-semibold text-[#1B1D21]">
                {editingRecipientIndex !== null
                  ? "Edit Recipient"
                  : "Add New Recipient"}
              </h2>
              <button
                onClick={handleCloseRecipientModal}
                className="text-[#667085] hover:text-[#344054] p-2 rounded-lg hover:bg-[#F9FAFB]"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <form onSubmit={handleSubmitRecipient}>
                <div className="grid grid-cols-2 gap-6">
                  {/* LinkedIn Search Section */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      LinkedIn Profile
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex rounded-lg border border-[#D0D5DD] overflow-hidden focus-within:ring-1 focus-within:ring-[#7F56D9] focus-within:border-[#7F56D9]">
                        <span className="px-3.5 py-2.5 bg-[#F9FAFB] text-[#667085] border-r border-[#D0D5DD] whitespace-nowrap text-sm">
                          linkedin.com/in/
                        </span>
                        <input
                          type="text"
                          value={newRecipient.linkedinUrl}
                          onChange={(e) =>
                            setNewRecipient((prev) => ({
                              ...prev,
                              linkedinUrl: e.target.value,
                            }))
                          }
                          className="flex-1 px-3.5 py-2.5 focus:outline-none text-sm"
                          placeholder="username"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          newRecipient.linkedinUrl &&
                          fetchLinkedInProfile(newRecipient.linkedinUrl)
                        }
                        disabled={isLoadingProfile || !newRecipient.linkedinUrl}
                        className={`px-4 py-2.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm font-semibold ${
                          isLoadingProfile || !newRecipient.linkedinUrl
                            ? "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed"
                            : "bg-[#7F56D9] text-white hover:bg-[#6941C6]"
                        }`}
                      >
                        {isLoadingProfile ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                                stroke="currentColor"
                                strokeWidth="1.66667"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Search
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-sm text-[#667085]">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                          stroke="currentColor"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        Enter username from profile URL (e.g., "johndoe" from
                        linkedin.com/in/johndoe)
                      </span>
                    </div>
                    {linkedinError && (
                      <div className="mt-2 p-3 bg-[#FEF3F2] rounded-lg border border-[#FEE4E2] text-sm text-[#B42318]">
                        {linkedinError}
                      </div>
                    )}
                    {linkedinProfile?.data && (
                      <div className="mt-3 p-4 bg-[#F9F5FF] rounded-lg border border-[#E9D7FE]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 relative rounded-full overflow-hidden border border-[#E9D7FE]">
                            {linkedinProfile.data.profilePicture ? (
                              <Image
                                src={linkedinProfile.data.profilePicture}
                                alt={`${linkedinProfile.data.firstName} ${linkedinProfile.data.lastName}`}
                                fill
                                className="object-cover"
                                onError={(e: any) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.png";
                                }}
                              />
                            ) : (
                              <DefaultAvatar />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-[#7F56D9]">
                              {`${linkedinProfile.data.firstName} ${linkedinProfile.data.lastName}`}
                            </h4>
                            <p className="text-sm text-[#6941C6]">
                              {linkedinProfile.data.position[0]?.title} at{" "}
                              {linkedinProfile.data.position[0]?.companyName}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <svg
                              className="w-5 h-5 text-[#7F56D9]"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 border-t border-[#EAECF0] pt-6 mt-2">
                    <h3 className="text-base font-semibold text-[#344054] mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#344054] mb-1.5">
                          First Name <span className="text-[#F04438]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newRecipient.firstName}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Enter first name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#344054] mb-1.5">
                          Last Name <span className="text-[#F04438]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newRecipient.lastName}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Enter last name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#667085] mb-1.5">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={newRecipient.jobTitle}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              jobTitle: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Enter job title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#667085] mb-1.5">
                          Company
                        </label>
                        <input
                          type="text"
                          value={newRecipient.company}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#344054] mb-1.5">
                          Email <span className="text-[#F04438]">*</span>
                        </label>
                        <input
                          type="email"
                          value={newRecipient.email}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="col-span-2 border-t border-[#EAECF0] pt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                      className="w-full flex items-center justify-between text-sm font-semibold text-[#344054] hover:text-[#7F56D9] transition-colors p-2 rounded-lg hover:bg-[#F9F5FF]"
                    >
                      <span>Shipping Address (Optional)</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          isAddressExpanded ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.8337 8.33333L10.0003 14.1667L4.16699 8.33333"
                          stroke="currentColor"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <div
                      className={`grid grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${
                        isAddressExpanded
                          ? "max-h-[500px] mt-6 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={newRecipient.address?.line1}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                line1: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          value={newRecipient.address?.line2}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                line2: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Apt, suite, etc. (optional)"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={newRecipient.address?.city}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                city: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={newRecipient.address?.state}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                state: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="State / Province"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={newRecipient.address?.zipCode}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                zipCode: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="ZIP / Postal code"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={newRecipient.address?.country}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              address: {
                                ...newRecipient.address,
                                country: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7F56D9] focus:border-[#7F56D9] text-sm"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 z-30 bg-white flex items-center justify-between mt-8 pt-6 border-t border-[#EAECF0]">
                  <p className="text-sm text-[#667085]">
                    <span className="text-[#F04438]">*</span> Required fields
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseRecipientModal}
                      className="px-4 py-2.5 border border-[#D0D5DD] text-[#344054] font-semibold rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#7F56D9] text-white font-semibold rounded-lg hover:bg-[#6941C6] text-sm"
                    >
                      {editingRecipientIndex !== null
                        ? "Save Changes"
                        : "Add Recipient"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the Execute Playbook click handler
  const handleExecutePlaybook = async () => {
    try {
      // Validate LinkedIn URLs if hyper-personalization is selected
      if (giftingMethod === "hyper-personalization") {
        const recipientsWithoutLinkedIn = recipients.filter(
          (r) => !r.linkedinUrl
        );
        if (recipientsWithoutLinkedIn.length > 0) {
          const recipientNames = recipientsWithoutLinkedIn
            .map((r) => `${r.firstName} ${r.lastName}`)
            .join(", ");
          setNotification({
            type: "error",
            message: `LinkedIn URL is required for hyper-personalization. Missing for: ${recipientNames}`,
          });
          return;
        }
      }

      // Validate gift selection for manual method
      if (giftingMethod === "manual" && !selectedModalGift) {
        setNotification({
          type: "error",
          message: "Please select a gift from the catalog",
        });
        setShowGiftModal(true);
        fetchGifts();
        return;
      }

      // Show loading notification
      setNotification({
        type: "success",
        message: "Executing playbook...",
      });

      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const recipientsPayload = recipients.map((recipient) => {
        const payload: any = {
          first_name: recipient.firstName,
          last_name: recipient.lastName,
          mail_id: recipient.email,
          company: recipient.company || "",
          role: recipient.jobTitle || "",
        };

        if (recipient.linkedinUrl) {
          payload.linkedin_url = `https://www.linkedin.com/in/${recipient.linkedinUrl}/`;
        }

        if (
          recipient.address &&
          Object.values(recipient.address).some((value) => value)
        ) {
          payload.address = {
            line1: recipient.address.line1 || "",
            line2: recipient.address.line2 || "",
            city: recipient.address.city || "",
            state: recipient.address.state || "",
            zip: recipient.address.zipCode || "",
            country: recipient.address.country || "",
          };
        }

        return payload;
      });

      const apiPayload: any = {
        recipients: recipientsPayload,
        user_id: userId,
      };

      if (giftingMethod === "manual" && selectedModalGift) {
        apiPayload.gift_id = selectedModalGift;
      }

      const response = await fetch(
        `${config.BACKEND_URL}/v1/organizations/${organizationId}/playbooks/${selectedPlaybook?._id}/run`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify(apiPayload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to execute playbook");
      }

      // Update with success notification
      setNotification({
        type: "success",
        message:
          "Playbook executed successfully! Redirecting to gifting activities...",
      });

      // Wait for notification to be visible
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Redirect to gifting activities
      window.location.href = "/dashboard/gifting-activities";
    } catch (error) {
      console.error("Error executing playbook:", error);
      setNotification({
        type: "error",
        message: "Failed to execute playbook. Please try again.",
      });
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `${styles}` }} />
      <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
        {/* Sidebar */}
        <AdminSidebar />
        {/* Main Content */}
        <div className="sm:pt-3 bg-primary w-full overflow-x-hidden">
          <div className="bg-white sm:rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden pb-16 md:pb-0">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-[#F2F4F7]">
              <div className="max-w-7xl mx-auto pl-8">
                <div className="flex justify-between items-center mt-8">
                  <div className="flex items-center gap-2 text-sm ">
                    <Link href="/dashboard" className="text-[#667085]">
                      <Image
                        src="/svgs/home.svg"
                        alt="Home"
                        width={18}
                        height={18}
                      />
                    </Link>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#D0D5DD"
                        d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                      />
                    </svg>
                    <Link
                      href="/dashboard/playbook-run"
                      className="text-[#1B1D21] font-medium"
                    >
                      Playbook Run
                    </Link>
                  </div>
                </div>

                <div className="md:py-6 py-3 flex items-center md:gap-16">
                  <div className="flex-shrink-0">
                    <h1 className="text-[30px] font-[500] text-[#1B1D21] leading-9 hidden md:block">
                      Send Gifts
                    </h1>
                    <p className="text-[#667085] md:mt-1">
                      Run playbook to send gift
                    </p>
                  </div>
                  <div className="flex-1 max-w-3xl hidden md:block">
                    {renderProgressBar()}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Playbook Selection Section */}
                <section
                  ref={playbookSectionRef}
                  className="scroll-mt-24 bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#EAECF0] hover:border-[#E9D7FE] transition-colors"
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center">
                        <span className="text-[#7F56D9] font-medium">1</span>
                      </div>
                      <h2 className="text-xl font-semibold text-[#1B1D21]">
                        Your Playbook
                      </h2>
                    </div>
                    <p className="text-sm text-[#667085] ml-11">
                      This playbook contains pre-defined settings including
                      budget per gift, gift catalog, and outcome template
                    </p>
                  </div>
                  {renderPlaybookSelection()}
                </section>

                {/* Recipients Section */}
                {selectedPlaybook && (
                  <section
                    ref={recipientsSectionRef}
                    className="scroll-mt-24 bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#EAECF0] hover:border-[#E9D7FE] transition-colors"
                  >
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center">
                          <span className="text-[#7F56D9] font-medium">2</span>
                        </div>
                        <h2 className="text-xl font-semibold text-[#1B1D21]">
                          Add Recipients
                        </h2>
                      </div>
                      <div className="ml-11">
                        <p className="text-sm text-[#667085]">
                          Add recipients by searching their LinkedIn profile or
                          entering their details manually
                        </p>
                      </div>
                    </div>
                    {renderRecipientForm()}
                  </section>
                )}

                {/* Gifting Method Section */}
                {recipients.length > 0 &&
                  recipients.every(
                    (r) => r.firstName && r.lastName && r.email
                  ) && (
                    <section
                      ref={giftingMethodSectionRef}
                      className="scroll-mt-24 bg-white rounded-xl p-8 shadow-sm border border-[#EAECF0] hover:border-[#E9D7FE] transition-colors"
                    >
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center">
                            <span className="text-[#7F56D9] font-medium">
                              3
                            </span>
                          </div>
                          <h2 className="text-xl font-semibold text-[#1B1D21]">
                            Choose Gifting Method
                          </h2>
                        </div>
                        <div className="ml-11">
                          <p className="text-sm text-[#667085]">
                            Choose how you want to select gifts for your
                            recipients
                          </p>
                        </div>
                      </div>
                      {renderGiftingMethod()}
                    </section>
                  )}
              </div>
            </div>
            {renderAddRecipientModal()}
          </div>
        </div>
      </div>
    </>
  );
}
