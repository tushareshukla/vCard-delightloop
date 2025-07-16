"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import GiftCard from "@/components/setup-budget/Gift-Card";
import PageHeader from "@/components/layouts/PageHeader";
import { ArrowLeft } from "lucide-react";
import { EditableCardPreview } from "@/components/shared/EditableCardPreview";
import { motion, AnimatePresence } from "framer-motion";
import PlaybookTemplateModal from "@/components/playbook/PlaybookTemplateModal";
import PlaybookRecipients from "@/components/playbook/PlaybookRecipients";
import {
  User,
  Users,
  Info,
  Sparkles,
  Eye,
  ExternalLink,
  Gift,
  Mail,
  LayoutTemplate,
} from "lucide-react";

// Animation keyframes for the page
const animations = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardDeal {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(127, 86, 217, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(127, 86, 217, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(127, 86, 217, 0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-card-deal {
  animation: cardDeal 0.5s ease-out forwards;
  opacity: 0;
}

.animate-pulse-border {
  animation: pulse 2s infinite;
}
`;

// Helper for date formatting
const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RunPlaybook() {
  const params = useParams();
  const playbookId = params?.id as string;
  const { authToken, userId, organizationId, isLoadingCookies } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playbook, setPlaybook] = useState<any>(null);
  const [bundles, setBundles] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [selectedContactList, setSelectedContactList] = useState<string>("");
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set()
  );
  const [selectedRecipientsForPlaybook, setSelectedRecipientsForPlaybook] =
    useState<any[]>([]);
  const [runningPlaybook, setRunningPlaybook] = useState(false);
  const router = useRouter();
  const [showPostcardModal, setShowPostcardModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const owner = playbook?.ownerName || playbook?.userEmail || "N/A";
  const lastUpdated = playbook?.updatedAt || playbook?.createdAt || "";
  const recipientCount = recipients.length;
  const selectedCount = selectedRecipients.size;
  const totalGiftValue = useMemo(() => {
    if (!playbook?.bundleIds || !bundles.length) return 0;
    let sum = 0;
    bundles.forEach((b) => {
      if (playbook.bundleIds.includes(b._id) && b.giftsList) {
        b.giftsList.forEach((g) => {
          sum += g.price || 0;
        });
      }
    });
    return sum;
  }, [playbook, bundles]);

  useEffect(() => {
    if (!isLoadingCookies) {
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }

      const fetchPlaybook = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbooks/${playbookId}?user_id=${userId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch playbook details");
          }

          const data = await response.json();
          setPlaybook(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching playbook:", error);
          setLoading(false);
          toast.error("Failed to load playbook details");
        }
      };

      // Fetch all bundles
      const fetchBundles = async () => {
        try {
          const res = await fetch("/api/bundles");
          const data = await res.json();
          setBundles(data.bundles || []);
        } catch (err) {
          setBundles([]);
        }
      };

      // Fetch contact lists
      const fetchContactLists = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists?user_id=${userId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch contact lists");
          }

          const data = await response.json();
          setContactLists(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching contact lists:", error);
          setContactLists([]);
        }
      };

      fetchPlaybook();
      fetchBundles();
      fetchContactLists();
    }
  }, [isLoadingCookies, authToken, organizationId, userId, playbookId, router]);

  const handleContactListChange = async (listId: string) => {
    setSelectedContactList(listId);
    if (!listId) {
      setRecipients([]);
      return;
    }

    try {
      setLoadingRecipients(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${listId}/recipients?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recipients");
      }

      const data = await response.json();
      setRecipients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      setRecipients([]);
      toast.error("Failed to load recipients");
    } finally {
      setLoadingRecipients(false);
    }
  };

  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(recipientId)) {
        newSelection.delete(recipientId);
      } else {
        newSelection.add(recipientId);
      }
      return newSelection;
    });
  };

  const selectAllRecipients = () => {
    if (selectedRecipients.size === recipients.length) {
      // If all are selected, deselect all
      setSelectedRecipients(new Set());
    } else {
      // Otherwise, select all
      setSelectedRecipients(new Set(recipients.map((r) => r._id)));
    }
  };

  const handleRunPlaybook = async () => {
    if (selectedRecipientsForPlaybook.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    try {
      setRunningPlaybook(true);

      // Debug: Log selected recipients data before mapping
      console.log(
        "Selected recipients for playbook:",
        selectedRecipientsForPlaybook
      );

      // Prepare recipients data for API
      const recipients = selectedRecipientsForPlaybook.map((recipient) => {
        // Extract name parts if needed
        const nameParts = recipient.name ? recipient.name.split(" ") : [];
        const firstName =
          recipient.firstName || recipient.first_name || nameParts[0] || "";
        const lastName =
          recipient.lastName ||
          recipient.last_name ||
          nameParts.slice(1).join(" ") ||
          "";

        // Handle LinkedIn URL - ensure it's the full URL format
        let linkedinUrl =
          recipient.linkedin ||
          recipient.linkedinUrl ||
          recipient.linkedin_url ||
          "";
        if (linkedinUrl && !linkedinUrl.startsWith("http")) {
          linkedinUrl = `https://www.linkedin.com/in/${linkedinUrl}/`;
        }

        return {
          first_name: firstName,
          last_name: lastName,
          mail_id: recipient.email || recipient.mail_id || "",
          linkedin_url: linkedinUrl,
          company: recipient.company || recipient.companyName || "",
          role: recipient.title || recipient.jobTitle || recipient.role || "",
          address: {
            line1: recipient.address?.line1 || "",
            line2: recipient.address?.line2 || "",
            city: recipient.address?.city || "",
            state: recipient.address?.state || "",
            zip: recipient.address?.zip || "",
            country: recipient.address?.country || "",
          },
        };
      });

      console.log("Running playbook with data:", {
        recipients,
        user_id: userId,
        playbook_id: playbookId,
      });

      // Debug: Log recipient address data
      recipients.forEach((recipient, index) => {
        console.log(
          `Recipient ${index + 1} (${recipient.first_name} ${
            recipient.last_name
          }) address:`,
          recipient.address
        );
      });

      // Call the actual playbook run API (Fixed URL with /v1/)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbooks/${playbookId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            recipients,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_message || "Failed to run playbook");
      }

      const data = await response.json();

      // Handle response based on whether approval is required
      if (data.requires_approval) {
        toast.success(
          `Playbook "${playbook.name}" has been submitted for approval! You'll receive an email notification once it's approved.`,
          { duration: 6000 }
        );

        // Redirect to approval queue page
        router.push(`/playbook/approval-queue`);
      } else {
        toast.success(
          `Playbook "${playbook.name}" is now running for ${selectedRecipientsForPlaybook.length} recipients!`,
          { duration: 4000 }
        );

        // Redirect to gifting activities page to track progress
        router.push(`/dashboard/gifting-activities`);
      }
    } catch (error) {
      console.error("Error running playbook:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to run playbook. Please try again."
      );
    } finally {
      setRunningPlaybook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-3 md:p-6 bg-[#F9FAFB] rounded-tl-3xl h-full overflow-y-auto">
                          {/* Header Skeleton */}
            <div className="px-6 md:px-8 w-full mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-4 w-80 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              
              <div className="h-px bg-gray-200 w-full"></div>
            </div>

            {/* Content Container */}
            <div className="mx-4 md:mx-6 lg:mx-8">
              {/* Playbook Summary Skeleton */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
                <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Executive Summary Card Skeleton */}
                  <div className="bg-gradient-to-br from-primary/10 to-white border border-primary/20 rounded-2xl shadow-lg p-6 h-[280px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  {/* Gift Catalogs Card Skeleton */}
                  <div className="bg-white border border-primary/10 rounded-2xl shadow-lg p-6 h-[280px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 w-28 bg-gray-200 rounded"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="min-w-[140px] bg-gray-100 rounded-xl p-3">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="min-w-[140px] bg-gray-100 rounded-xl p-3">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Gift Message Card Skeleton */}
                  <div className="rounded-2xl shadow-lg h-[280px] bg-gray-200"></div>

                  {/* Landing Page Template Card Skeleton */}
                  <div className="rounded-2xl shadow-lg h-[280px] bg-gray-200"></div>
                </div>
              </div>

              {/* Recipients Section Skeleton */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
                <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
                
                {/* Contact List Selector Skeleton */}
                <div className="mb-6">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 rounded"></div>
                </div>

                {/* Recipients Table Skeleton */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-4 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Button Skeleton */}
              <div className="flex justify-center mt-8 mb-12">
                <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="w-full flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg text-gray-700">Playbook not found</p>
            <Link
              href="/playbook"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Back to Playbooks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      {/* Sidebar - sticky */}
      <AdminSidebar />
      {/* Main Content - scrollable */}
      <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-[#F9FAFB] rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <PageHeader
            backLink={{
              href: "/playbook",
              text: "Back to Playbooks"
            }}
            title="Run Playbook"
            description={`Execute "${playbook.name}" for your selected recipients`}
            chips={[{ text: playbook.status || "Active", color: playbook.status === "Active" ? "green" : "gray" }]}
            showDivider={true}
            className="pt-2"
          />
          
          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            {/* Playbook Summary Section */}
            <div
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 animate-fade-in-up opacity-0"
              style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
            >
            <h2 className="text-xl font-semibold mb-4">Playbook Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {/* Executive Summary Card */}
              <motion.div
                className="relative group bg-gradient-to-br from-primary/10 to-white border border-primary/20 rounded-2xl shadow-lg p-6 h-[280px] flex flex-col justify-between overflow-hidden hover:shadow-2xl transition-all duration-300"
                whileHover={{ y: -6, scale: 1.03 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-pulse text-yellow-400" />{" "}
                    Executive Summary
                  </span>
                  <motion.span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md border border-primary/30 bg-white/80 backdrop-blur-sm ${
                      playbook.status === "Active"
                        ? "text-green-700 bg-green-50 animate-pulse-border"
                        : playbook.status === "Draft"
                        ? "text-gray-700 bg-gray-100"
                        : "text-yellow-700 bg-yellow-50"
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {playbook.status || "Active"}
                  </motion.span>
                </div>
                <div className="space-y-2 mt-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-primary" /> Owner:{" "}
                    <span className="font-medium">{owner}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Info className="w-4 h-4 text-primary" /> Last Updated:{" "}
                    <span className="font-medium">
                      {formatDate(lastUpdated)}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="w-4 h-4 text-primary" /> Recipients:{" "}
                    <span className="font-medium">{recipientCount}</span>
                  </div> */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="inline-block w-3 h-3 rounded-full bg-primary" />{" "}
                    Budget:{" "}
                    <span className="font-medium">${playbook.budget || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="inline-block w-3 h-3 rounded-full bg-pink-400" />{" "}
                    Personalization:{" "}
                    <span className="font-medium">
                      {playbook.hyper_personalization ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <AnimatePresence>
                  <motion.div
                    className="mt-2 text-xs text-primary/80 bg-primary/5 rounded-lg p-2 shadow-inner hidden group-hover:block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <span>Created: {formatDate(playbook.createdAt)}</span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Gift Catalogs Card */}
              <motion.div
                className="relative group bg-white/90 border border-primary/10 rounded-2xl shadow-lg p-6 h-[280px] flex flex-col overflow-hidden hover:shadow-2xl transition-all duration-300"
                whileHover={{ y: -6, scale: 1.03 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-primary flex items-center gap-2">
                    <Gift className="w-5 h-5 text-pink-400" /> Gift Catalogs
                  </span>
                  <span className="text-xs text-gray-500">
                    Total Value:{" "}
                    <span className="font-semibold text-primary">
                      ${totalGiftValue}
                    </span>
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
                  {playbook.bundleIds && playbook.bundleIds.length > 0 ? (
                    bundles
                      .filter((bundle) =>
                        playbook.bundleIds.includes(bundle._id)
                      )
                      .map((bundle, idx) => (
                        <motion.div
                          key={bundle._id}
                          className="relative min-w-[140px] max-w-[180px] bg-gradient-to-br from-primary/10 to-white border border-primary/20 rounded-xl shadow-md p-3 flex flex-col items-center justify-between group-hover:scale-105 transition-transform duration-200 cursor-pointer hover:z-20 hover:shadow-xl"
                          whileHover={{ scale: 1.08, rotate: 2 }}
                          title={bundle.name}
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                            <Image
                              src={
                                bundle.imageUrl ||
                                bundle.imgUrl ||
                                "/img/image.png"
                              }
                              alt={bundle.name}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="w-full text-center mt-1 mb-1">
                            <span className="block text-base font-bold text-primary bg-white/80 rounded px-2 py-1 shadow-sm border border-primary/10">
                              {bundle.name}
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1 mt-2 w-full">
                            <span className="text-xs text-gray-600 font-medium">
                              {bundle.giftsList?.length || 0} gifts
                            </span>
                            <span className="text-xs text-primary font-semibold">
                              $
                              {bundle.giftsList?.reduce(
                                (sum, g) => sum + (g.price || 0),
                                0
                              )}
                            </span>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center justify-center flex-1">
                      No catalogs selected
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Gift Message Card - Updated */}
              <motion.div
                className="relative group rounded-2xl shadow-lg h-[280px] flex flex-col justify-between overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                whileHover={{ y: -6, scale: 1.03 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowPostcardModal(true)}
              >
                {/* Container that maintains proper aspect ratio and scaling */}
                <div className="w-full h-full flex items-center justify-center">
                  {/* Scale container for the gift message card */}
                  <div
                    className="transform scale-[0.58] origin-center"
                    style={{
                      width: "900px", // Original width
                      height: "380px", // Original height
                    }}
                  >
                    <EditableCardPreview
                      customMessage={
                        playbook.outcomeCard?.message ||
                        "We have reserved a seat for you!"
                      }
                      logoUrl={
                        playbook.outcomeCard?.logoLink || "/Logo Final.png"
                      }
                      editable={false}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Landing Page Template Card - Updated */}
              <motion.div
                className="relative group rounded-2xl shadow-lg h-[280px] overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                whileHover={{ y: -6, scale: 1.03 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setShowTemplateModal(true)}
              >
                {playbook.template ? (
                  <div className="w-full h-full relative bg-gradient-to-br from-primary/5 to-purple/5">
                    <Image
                      src={`/partner-integrations/${playbook.template.type}.png`}
                      alt={`Template ${playbook.template.type}`}
                      fill
                      className="object-fit rounded-2xl"
                    />
                    {/* Enhanced hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-2xl flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
                        <Eye className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          View Full Template
                        </span>
                      </div>
                    </div>
                    {/* Template type badge */}
                    <div className="absolute top-3 left-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      {playbook.template.type.replace("template", "Template ")}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white rounded-2xl">
                    <LayoutTemplate className="w-12 h-12 mb-2 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      No template selected
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Playbook Recipients Section - now in a card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 animate-fade-in-up opacity-0">
            {playbookId && authToken && userId && organizationId && (
              <PlaybookRecipients
                authToken={authToken}
                userId={userId}
                organizationId={organizationId}
                playbookId={playbookId}
                onRecipientsSelected={setSelectedRecipientsForPlaybook}
                selectedRecipients={selectedRecipientsForPlaybook}
              />
            )}
          </div>

          {/* Run Button */}
          <div className="flex justify-center mt-8 mb-12">
            <button
              onClick={handleRunPlaybook}
              disabled={
                selectedRecipientsForPlaybook.length === 0 || runningPlaybook
              }
              className={`flex items-center gap-3 bg-primary text-white font-semibold px-12 py-4 rounded-lg hover:bg-primary/90 transition-all shadow-lg animate-pulse-border ${
                selectedRecipientsForPlaybook.length === 0 || runningPlaybook
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {runningPlaybook ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Running...
                </>
              ) : (
                <>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 3L19 12L5 21V3Z"
                      fill="white"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Run Playbook
                </>
              )}
            </button>
          </div>
          </div>

          {/* Postcard Modal - Updated for better full-size view */}
          <AnimatePresence>
            {showPostcardModal && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900"></h3>
                    <button
                      onClick={() => setShowPostcardModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close modal"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <EditableCardPreview
                      customMessage={
                        playbook.outcomeCard?.message ||
                        "We have reserved a seat for you!"
                      }
                      logoUrl={
                        playbook.outcomeCard?.logoLink || "/Logo Final.png"
                      }
                      editable={false}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Template Modal */}
          <PlaybookTemplateModal
            isOpen={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            template={playbook.template}
          />
        </div>
      </div>
    </div>
  );
}
