"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import RangeSlider from "@/components/common/RangeSlider";
import GiftCard from "@/components/setup-budget/Gift-Card";
import ListPageHeader from "@/components/layouts/ListPageHeader";
import PageHeader from "@/components/layouts/PageHeader";
import { ArrowLeft, Edit } from "lucide-react";
import { EditableCardPreview } from "@/components/shared/EditableCardPreview";
import PlaybookTemplateModal from "@/components/playbook/PlaybookTemplateModal";

// Define a type for the params
type PageParams = {
  id: string;
};

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

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
`;

export default function ViewPlaybook() {
  const params = useParams();
  const playbookId = params?.id as string;
  const { authToken, userId, organizationId, isLoadingCookies } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playbook, setPlaybook] = useState<any>(null);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(
    new Set()
  );
  const [focusTemplate, setFocusTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const router = useRouter();

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

          // Set selected template based on playbook data
          if (data.template && data.template.type) {
            const templateType = data.template.type;
            const templateFocus = {
              template1: templateType === "template1",
              template2: templateType === "template2",
              template3: templateType === "template3",
              template4: templateType === "template4",
            };
            setFocusTemplate(templateFocus);
          }

          // Set selected bundles based on bundleIds
          if (data.bundleIds && data.bundleIds.length > 0) {
            setSelectedBundles(new Set(data.bundleIds));
          }

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

      fetchPlaybook();
      fetchBundles();
    }
  }, [isLoadingCookies, authToken, organizationId, userId, playbookId, router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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

  const handleEditPlaybook = () => {
    router.push(`/playbook/edit/${playbookId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
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
                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
              </div>
              
              <div className="h-px bg-gray-200 w-full"></div>
            </div>

            {/* Content Container */}
            <div className="mx-4 md:mx-6 lg:mx-8">
              {/* Group 1 Card Skeleton */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
                <div className="mb-8">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1 min-w-[300px]">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex-1 min-w-[300px]">
                    <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
                    <div className="flex flex-col gap-4">
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2 Card Skeleton */}
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-8">
                <div className="mb-8">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-80 bg-gray-200 rounded"></div>
                </div>

                {/* Gift Catalogs Section */}
                <div className="mb-12">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                  <div className="ml-10 flex gap-4">
                    <div className="w-48 h-32 bg-gray-200 rounded-lg"></div>
                    <div className="w-48 h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>

                {/* Gift Message Section */}
                <div className="mb-12">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="ml-10 w-80 h-48 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Template Section */}
                <div className="mb-12">
                  <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
                  <div className="ml-10">
                    <div className="w-96 h-56 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Email Templates Section */}
                <div className="mb-12">
                  <div className="h-6 w-36 bg-gray-200 rounded mb-4"></div>
                  <div className="ml-10 space-y-4">
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                      <div className="h-24 w-full bg-gray-100 rounded"></div>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-24 w-full bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Approval Required */}
                <div className="ml-10 flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
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
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">


          <PageHeader
            backLink={{
              href: "/playbook",
              text: "Back to Playbooks"
            }}
            title="Playbook Details"
            description={playbook.description || ""}
            chips={[{ text: playbook.status || "Draft", color: playbook.status === "Active" ? "green" : "gray" }]}
            primaryButton={{
              text: "Edit Playbook",
              icon: Edit,
              onClick: handleEditPlaybook,
              variant: "primary"
            }}
            showDivider={true}
            className="pt-2"
          />
          
          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            {/* --- Group 1 Card --- */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
            {/* Playbook Name */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Playbook Name
              </h2>
              <div className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-[#D1D5DB] rounded-lg">
                {playbook.name}
              </div>
            </div>

            {/* Budget Configuration */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Gift Budget Configuration
                </h2>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-[#7F56D9]">
                    ${playbook.budget || 0}
                  </div>
                  <span className="text-sm text-gray-500">per recipient</span>
                </div>
              </div>
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Gift Selection & Delivery Preferences
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        playbook.hyper_personalization
                          ? "bg-primary"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm font-medium">
                      Hyper-personalization:{" "}
                      {playbook.hyper_personalization ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Delivery Type:</span>
                    <span className="text-sm font-medium px-4 py-2 bg-gray-50 rounded-md">
                      {playbook.sending_mode === "direct"
                        ? "Direct"
                        : "Permission"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Group 2 Card --- */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-8">
            {/* Recipients Experience Section Heading */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                Recipients Experience
              </h2>
              <p className="text-gray-600">
                How recipients will experience your gifting campaign.
              </p>
            </div>

            {/* 1. Gift Catalogs */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  1
                </span>
                Selected Gift Catalogs
              </h2>
              <div className="mt-4 ml-10">
                {playbook.bundleIds && playbook.bundleIds.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {bundles
                      .filter((bundle) =>
                        playbook.bundleIds.includes(bundle._id)
                      )
                      .map((bundle) => (
                        <GiftCard
                          key={bundle._id}
                          bundle={bundle}
                          isSelected={true}
                          onCheckboxChange={() => {}}
                          onEyeClick={() => {}}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No gift catalogs selected</p>
                )}
              </div>
            </div>

            {/* 2. Gift Message */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  2
                </span>
                Gift Message
              </h2>
              <div className="mt-4 ml-10">
                <EditableCardPreview
                  customMessage={
                    playbook.outcomeCard?.message ||
                    "We have reserved a seat for you!"
                  }
                  logoUrl={playbook.outcomeCard?.logoLink || "/Logo Final.png"}
                  editable={false}
                />
              </div>
            </div>

            {/* 3. Selected Template */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  3
                </span>
                Template
              </h2>
              <div className="mt-4 ml-10">
                {playbook.template ? (
                  <div className="space-y-4">
                    <div
                      className="relative w-fit cursor-pointer group"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      <Image
                        src={`/partner-integrations/${playbook.template.type}.png`}
                        alt={`Template ${playbook.template.type}`}
                        width={380}
                        height={220}
                        className="rounded-xl border-2 border-[#E5E7EB] hover:border-primary transition-colors duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs">
                        {playbook.template.type}
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">
                            View Full Template
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <span className="font-medium">Description:</span>
                        <span>{playbook.template.description}</span>
                      </div>

                      {playbook.template.date && (
                        <div className="flex gap-2">
                          <span className="font-medium">Date:</span>
                          <span>
                            {new Date(
                              playbook.template.date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {playbook.template.videoLink && (
                        <div className="flex gap-2">
                          <span className="font-medium">Video Link:</span>
                          <span className="text-primary break-all">
                            {playbook.template.videoLink}
                          </span>
                        </div>
                      )}

                      {playbook.template.buttonText && (
                        <div className="flex gap-2">
                          <span className="font-medium">Button Text:</span>
                          <span>{playbook.template.buttonText}</span>
                        </div>
                      )}

                      {playbook.template.buttonLink && (
                        <div className="flex gap-2">
                          <span className="font-medium">Button Link:</span>
                          <span className="text-primary break-all">
                            {playbook.template.buttonLink}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No template selected</p>
                )}
              </div>
            </div>

            {/* 4. Email Templates */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  4
                </span>
                Email Templates
              </h2>
              <div className="mt-4 ml-10 space-y-4">
                {playbook.emailTemplate ? (
                  <>
                    {playbook.emailTemplate.addressConfirmedEmail && (
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          Address Confirmation Email
                        </h4>
                        <div
                          className="border p-3 rounded bg-gray-50 prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              playbook.emailTemplate.addressConfirmedEmail,
                          }}
                        />
                      </div>
                    )}

                    {playbook.emailTemplate.inTransitEmail && (
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">In Transit Email</h4>
                        <div
                          className="border p-3 rounded bg-gray-50 prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: playbook.emailTemplate.inTransitEmail,
                          }}
                        />
                      </div>
                    )}

                    {playbook.emailTemplate.deliveredEmail && (
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Delivered Email</h4>
                        <div
                          className="border p-3 rounded bg-gray-50 prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: playbook.emailTemplate.deliveredEmail,
                          }}
                        />
                      </div>
                    )}

                    {playbook.emailTemplate.acknowledgedEmail && (
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Acknowledged Email</h4>
                        <div
                          className="border p-3 rounded bg-gray-50 prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: playbook.emailTemplate.acknowledgedEmail,
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">No email templates configured</p>
                )}
              </div>
            </div>

            {/* Approval Required */}
            <div className="ml-10 flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded ${
                  playbook.approvalRequired ? "bg-primary" : "bg-gray-300"
                }`}
              ></div>
              <span className="text-sm font-medium">
                Approval Required: {playbook.approvalRequired ? "Yes" : "No"}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <PlaybookTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        template={playbook.template}
      />
    </div>
  );
}
