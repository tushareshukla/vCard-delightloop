"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  MoreVertical,
  Building,
  User,
  MapPin,
} from "lucide-react";

export default function PaymentsPage() {
  const router = useRouter();
  const { authToken, userEmail, isLoadingCookies } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "methods" | "subscriptions" | "history" | "billing"
  >("methods");

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showNotification = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (!isLoadingCookies) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          if (!authToken) {
            router.push("/");
            return;
          }
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Error fetching payment data:", err);
          setError("Failed to load payment data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isLoadingCookies, authToken, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col sm:flex-row">
        <AdminSidebar />
        <div className="sm:pt-3 sm:bg-primary w-full overflow-x-hidden sm:pb-0">
          <div className="min-h-[100vh] sm:rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 w-full pt-2">
              <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                <div className="flex flex-col gap-1">
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-80 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-full mb-6"></div>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-32 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col sm:flex-row">
        <AdminSidebar />
        <div className="sm:pt-3 sm:bg-primary w-full overflow-x-hidden sm:pb-0">
          <div className="min-h-screen sm:rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
            <p className="text-red-500 text-center p-4 text-sm sm:text-base">
              {error}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      <AdminSidebar />
      <div className="sm:pt-3 sm:bg-primary w-full overflow-x-hidden sm:pb-0">
        <div className="overflow-y-auto h-full sm:rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="pb-3 sm:space-y-1">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">
              Payments & Billing
            </h1>
            <p className="text-sm text-gray-500">
              Manage your payment methods, subscriptions, and billing
              information
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: "methods", label: "Payment Methods", icon: CreditCard },
                {
                  key: "subscriptions",
                  label: "Subscriptions",
                  icon: Calendar,
                },
                { key: "history", label: "Transaction History", icon: Clock },
                { key: "billing", label: "Billing Info", icon: User },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
            {/* Payment Methods Tab */}
            {activeTab === "methods" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Payment Methods
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage your saved payment methods
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Sample Payment Method */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            •••• •••• •••• 4242
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires 12/2025
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        Default
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          MC
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            •••• •••• •••• 0005
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires 08/2026
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === "subscriptions" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Active Subscriptions
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage your recurring payments and subscriptions
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            Pro Plan
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-50">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Advanced features and priority support
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium">$29.99</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Billing</p>
                            <p className="font-medium">Monthly</p>
                          </div>

                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            Storage Add-on
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-50">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Additional 100GB storage
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium">$9.99</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Billing</p>
                            <p className="font-medium">Monthly</p>
                          </div>
                         
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History Tab */}
            {activeTab === "history" && (
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Transaction History
                    </h3>
                    <p className="text-sm text-gray-500">
                      View all your payment transactions
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate w-20 sm:w-full">
                          Pro Plan - Monthly subscription
                        </p>
                        <p className="text-sm text-gray-500">Nov 15, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">$29.99</p>
                        <span className="text-xs px-2 py-1 rounded-full text-green-600 bg-green-50">
                          Completed
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate w-20 sm:w-full">
                          Storage Add-on - Monthly subscription
                        </p>
                        <p className="text-sm text-gray-500">Nov 15, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">$9.99</p>
                        <span className="text-xs px-2 py-1 rounded-full text-green-600 bg-green-50">
                          Completed
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate w-20 sm:w-full">
                          Pro Plan - Monthly subscription
                        </p>
                        <p className="text-sm text-gray-500">Oct 15, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">$29.99</p>
                        <span className="text-xs px-2 py-1 rounded-full text-red-600 bg-red-50">
                          Failed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Information Tab */}
            {activeTab === "billing" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Billing Information
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage your billing details and tax information
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      showNotification(
                        "Billing information updated successfully",
                        "success"
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <p className="text-gray-900">Acme Corporation</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax ID
                        </label>
                        <p className="text-gray-900">12-3456789</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <p className="text-gray-900">John Smith</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900">
                          {userEmail || "john@acme.com"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <p className="text-gray-900">+1 (555) 123-4567</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Billing Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1
                        </label>
                        <p className="text-gray-900">123 Business Ave</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <p className="text-gray-900">Suite 100</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <p className="text-gray-900">San Francisco</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <p className="text-gray-900">CA</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <p className="text-gray-900">94107</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <p className="text-gray-900">United States</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toastType === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toastType === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
