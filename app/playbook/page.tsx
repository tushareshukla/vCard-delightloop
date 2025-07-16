"use client";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/playbook/Card";
import { useState, useEffect } from "react";
import router from "next/router";
import { useAuth } from "@/app/context/AuthContext";
import PageHeader from "@/components/layouts/PageHeader";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";

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
`;

interface Playbook {
  id: string;
  _id?: string;
  name: string;
  description: string;
  budget: number;
  bundleIds: string[];
  status: string;
  user_id: string;
  organization_id: string;
  cta_link?: string;
  sending_mode?: string;
  hyper_personalization?: boolean;
  template?: {
    type: string;
    description: string;
    date: string;
    videoLink?: string;
    logoLink?: string;
    buttonText?: string;
    buttonLink?: string;
    mediaUrl?: string;
  };
  // Add any other fields from your API response
}

export default function Playbook() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [selectedPlaybooks, setSelectedPlaybooks] = useState(0);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCookies) {
      // Get user and organization IDs from cookies

      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }
    }
  }, [isLoadingCookies]);

  useEffect(() => {
    if (!isLoadingCookies) {
      const fetchPlaybooks = async () => {
        if (!organizationId || !userId) return;

        try {
          setLoading(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbooks?user_id=${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                //   "Authorization": `Bearer ${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_KEY}`,
              },
              mode: "cors", // Explicitly set CORS mode
              credentials: "same-origin", // Change this from 'include' to 'same-origin'
            }
          );

          if (!response.ok) {
            throw new Error(`Error fetching playbooks: ${response.statusText}`);
          }

          const data = await response.json();
          // Map _id to id for each playbook
          const mapped = (Array.isArray(data) ? data : []).map((pb) => ({
            ...pb,
            id: pb._id,
          }));
          setPlaybooks(mapped);
        } catch (error) {
          console.error("Failed to fetch playbooks:", error);
        } finally {
          setLoading(false);
        }
      };

      if (organizationId && userId) {
        fetchPlaybooks();
      }
    }
  }, [organizationId, userId, isLoadingCookies]);

  // Filter playbooks based on search term
  const filteredPlaybooks = playbooks.filter(
    (playbook) =>
      playbook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playbook.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      {/* //todo ------------------  Sidebar ------------------ */}
      <AdminSidebar />
      {/* //todo ------------------  Main Content ------------------ */}
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <div
            className="animate-fade-in opacity-0"
            style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
          >
            <PageHeader
              title="Playbook"
              description="Create and manage your campaign playbooks"
              primaryButton={{
                text: "New Playbook",
                icon: Plus,
                href: "/playbook/create",
                variant: "primary"
              }}
              showDivider={true}
              className="pt-2"
            />
            
            {/* Search and Filter Controls */}
            <div className="mx-4 md:mx-6 lg:mx-8 mb-6 rounded-xl px-3 md:px-4 py-3 md:py-4 -mt-2" style={{ backgroundColor: '#F9FAFB' }}>
              {/* Mobile: Single row layout */}
              <div className="block md:hidden">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search playbooks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline text-sm">Filters</span>
                    {filterCount > 0 && (
                      <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop: Single row layout */}
              <div className="hidden md:flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search playbooks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {filterCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Dropdown - placeholder for future filter options */}
            {showFilters && (
              <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <p className="text-sm text-gray-500">Filter options coming soon...</p>
                </div>
              </div>
            )}
          </div>

          {/* //! Playbook List */}
          <div
            className="mx-4 md:mx-6 lg:mx-8 mt-4 animate-fade-in-up opacity-0"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {/* //! Playbook List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md pt-5 p-6 relative"
                    style={{
                      border: '1px solid #F3F4F6'
                    }}
                  >
                    {/* Card Header - title and three dots */}
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="w-5 h-5 bg-gray-200 rounded" />
                    </div>

                    {/* Card Body */}
                    <div className="pt-2.5">
                      {/* Individual Gift Budget */}
                      <div className="text-sm">
                        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </div>

                      {/* Features section */}
                      <div className="grid gap-3.5 mt-4">
                        {/* Hyper-personalization */}
                        <div className="text-sm">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                        </div>

                        {/* Delivery Type with Status Badge */}
                        <div className="text-sm flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-6 bg-gray-200 rounded-full w-16" />
                        </div>
                      </div>

                      {/* Run Button */}
                      <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                        <div className="h-9 bg-gray-200 rounded-md w-16" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredPlaybooks.length > 0 ? (
                filteredPlaybooks.map((playbook, index) => (
                  <div
                    key={playbook.id + playbook.name + index}
                    className="rounded-lg bg-white shadow-sm hover:shadow-lg hover:bg-gray-50/40 hover:border-gray-300/60 transition-all duration-200 ease-out overflow-visible z-10 group animate-card-deal"
                    style={{
                      border: '1px solid #F3F4F6',
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <Card
                      title={playbook.name}
                      budget={playbook.budget || 0}
                      categories={playbook.bundleIds || []}
                      personalization={playbook?.hyper_personalization || false}
                      deliveryType={playbook?.sending_mode || "direct"}
                      ctaTracking={playbook.cta_link || ""}
                      printOptions={"Default"}
                      onClick={() => setSelectedPlaybooks(index + 1)}
                      selected={selectedPlaybooks === index + 1}
                      status={playbook.status}
                      onView={() =>
                        router.push(`/playbook/view/${playbook._id}`)
                      }
                      onEdit={() =>
                        router.push(`/playbook/edit/${playbook._id}`)
                      }
                      onRun={() => router.push(`/playbook/run/${playbook._id}`)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">
                    No playbooks found. Create your first playbook!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
