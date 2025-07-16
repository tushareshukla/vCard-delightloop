"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import ListPageHeader from "@/components/layouts/ListPageHeader";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";

interface PlaybookRun {
  _id: string;
  playbook_id: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Rejected";
  run_timestamp: string;
  recipient_ids: string[];
  total_count: number;
  success_count: number;
  organization_id: string;
  user_id: string;
  message: string;
  updatedAt?: string;
  // Additional fields from populated data
  playbookName?: string;
  playbookBudget?: number;
  ownerName?: string;
  ownerEmail?: string;
}

const animations = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
`;

export default function ApprovalQueue() {
  const { authToken, userId, organizationId, isLoadingCookies } = useAuth();
  const [allRuns, setAllRuns] = useState<PlaybookRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingApproval, setProcessingApproval] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterCount, setFilterCount] = useState(0);
  const router = useRouter();

  // Update filter count
  useEffect(() => {
    setFilterCount(statusFilter.length);
  }, [statusFilter]);

  useEffect(() => {
    if (!isLoadingCookies) {
      if (!authToken) {
        router.push("/");
        return;
      }
      fetchApprovalRequests();
    }
  }, [isLoadingCookies, authToken, organizationId, userId]);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);

      // Fetch both pending and rejected runs
      const [pendingResponse, rejectedResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbook-runs/pending?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbook-runs/rejected?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        ).catch(() => ({ ok: false, json: () => Promise.resolve([]) })), // Fallback if rejected endpoint doesn't exist
      ]);

      if (!pendingResponse.ok) {
        throw new Error("Failed to fetch pending approvals");
      }

      const pendingData = await pendingResponse.json();
      const rejectedData = rejectedResponse.ok
        ? await rejectedResponse.json()
        : [];

      const pendingRuns = Array.isArray(pendingData) ? pendingData : [];
      const rejectedRuns = Array.isArray(rejectedData) ? rejectedData : [];

      // Combine and sort by latest updated/created timestamp
      const combinedRuns = [...pendingRuns, ...rejectedRuns].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.run_timestamp).getTime();
        const bTime = new Date(b.updatedAt || b.run_timestamp).getTime();
        return bTime - aTime; // Latest first
      });

      console.log("Found approval requests from API:", combinedRuns);
      setAllRuns(combinedRuns);
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      toast.error("Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (runId: string) => {
    try {
      setProcessingApproval(runId);

      // Call the approve API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbook-runs/${runId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            user_id: userId,
            notes: "Approved from approval queue",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error_message || "Failed to approve playbook run"
        );
      }

      const data = await response.json();

      toast.success(
        "Playbook run approved successfully! Processing has started."
      );

      // Remove the approved run from the list
      setAllRuns((prev) => prev.filter((run) => run._id !== runId));
    } catch (error) {
      console.error("Error approving playbook run:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve playbook run"
      );
    } finally {
      setProcessingApproval(null);
    }
  };

  const handleReject = async (runId: string) => {
    try {
      setProcessingApproval(runId);

      // Call the reject API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbook-runs/${runId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            user_id: userId,
            reason: "Rejected from approval queue",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error_message || "Failed to reject playbook run"
        );
      }

      const data = await response.json();

      toast.success("Playbook run rejected successfully.");

      // Update the run status to rejected instead of removing it
      setAllRuns((prev) =>
        prev
          .map((run) =>
            run._id === runId
              ? {
                  ...run,
                  status: "Rejected" as const,
                  updatedAt: new Date().toISOString(),
                }
              : run
          )
          .sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.run_timestamp).getTime();
            const bTime = new Date(b.updatedAt || b.run_timestamp).getTime();
            return bTime - aTime; // Keep latest first after update
          })
      );
    } catch (error) {
      console.error("Error rejecting playbook run:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject playbook run"
      );
    } finally {
      setProcessingApproval(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper for creative chip UI
  const Chip = ({
    label,
    selected,
    onClick,
    icon,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium shadow-sm
        ${
          selected
            ? "bg-primary text-white border-primary scale-105 shadow-lg"
            : "bg-white border-gray-300 text-gray-700 hover:bg-primary/10 hover:scale-105"
        }
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30
      `}
      style={{
        boxShadow: selected ? "0 4px 16px 0 rgba(127,86,217,0.10)" : undefined,
        transform: selected ? "scale(1.07)" : undefined,
      }}
      aria-pressed={selected}
    >
      {icon}
      <span>{label}</span>
      {selected && (
        <svg
          className="ml-1 w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="8" cy="8" r="8" fill="#7F56D9" />
          <path
            d="M5 8l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  // Filter runs based on search and status filter
  const getFilteredRuns = () => {
    return allRuns.filter((run) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        run.playbookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(run.status);

      return matchesSearch && matchesStatus;
    });
  };

  const filteredRuns = getFilteredRuns();

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>

          <div
            className="animate-fade-in opacity-0 relative z-50"
            style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
          >
            <ListPageHeader
              parentPageName="Playbook"
              parentPageLink="/playbook"
              pageName="Approval Queue"
              pageTitle="Playbook Approval Queue"
              pageDescription="Review and approve pending playbook runs"
              createButtonLabel="Back to Playbooks"
              createButtonLink="/playbook"
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((v) => !v)}
              filterCount={filterCount}
            >
              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-0 top-12 z-[9999] w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2 py-1">
                      <Chip
                        label="Pending"
                        selected={statusFilter.includes("Pending")}
                        onClick={() =>
                          setStatusFilter((prev) =>
                            prev.includes("Pending")
                              ? prev.filter((s) => s !== "Pending")
                              : [...prev, "Pending"]
                          )
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block animate-pulse"></span>
                        }
                      />
                      <Chip
                        label="Rejected"
                        selected={statusFilter.includes("Rejected")}
                        onClick={() =>
                          setStatusFilter((prev) =>
                            prev.includes("Rejected")
                              ? prev.filter((s) => s !== "Rejected")
                              : [...prev, "Rejected"]
                          )
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                        }
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {statusFilter.length > 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        className="text-xs text-primary hover:underline px-2 py-1"
                        onClick={() => setStatusFilter([])}
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ListPageHeader>
          </div>

          <div
            className="mt-6 animate-fade-in-up opacity-0 relative z-10"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredRuns.length > 0 ? (
              <div className="space-y-4">
                {filteredRuns.map((run, index) => (
                  <motion.div
                    key={run._id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            {run.status === "Pending" ? (
                              <>
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                  Pending Approval
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-500" />
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  Rejected
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(run.updatedAt || run.run_timestamp)}
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {run.playbookName ||
                            `Playbook ${run.playbook_id.slice(-6)}`}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {run.total_count || run.recipient_ids.length}{" "}
                              recipients
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* <DollarSign className="w-4 h-4 text-gray-400" /> */}
                            <span className="text-gray-600">
                              ${run.playbookBudget || 0} budget
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Run ID: {run._id.slice(-8)}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            Owner:{" "}
                            {run.ownerName || run.ownerEmail || "Unknown"}
                          </div>
                        </div>

                        {run.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              {run.message}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-6">
                        <button
                          onClick={() =>
                            router.push(`/playbook/view/${run.playbook_id}`)
                          }
                          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Playbook
                        </button>

                        {run.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleReject(run._id)}
                              disabled={processingApproval === run._id}
                              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>

                            <button
                              onClick={() => handleApprove(run._id)}
                              disabled={processingApproval === run._id}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {processingApproval === run._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter.length > 0
                    ? "No Matching Requests"
                    : "No Approval Requests"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter.length > 0
                    ? "Try adjusting your search or filters"
                    : "All playbook runs have been processed or no runs require approval."}
                </p>
                {(searchTerm || statusFilter.length > 0) && (
                  <button
                    className="mt-4 text-primary hover:underline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter([]);
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
