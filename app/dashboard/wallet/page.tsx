"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StripePaymentForm } from "@/components/wallet/StripePaymentForm";
import { toast } from "react-hot-toast";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import PageHeader from "@/components/layouts/PageHeader";
import { Filter, X, Coins, Wallet, Search } from "lucide-react";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import mongoose from "mongoose";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CreditTransaction {
  transaction_type: string;
  credits_before: number;
  credits_used: number;
  credits_after: number;
  updated_at: string;
  reference_id: string;
  description: string;
  _id: string;
  credits_used_for?: {
    id: string;
    type: string;
    details: string;
  };
}

interface CreditsResponse {
  total: number;
  page: number;
  limit: number;
  credits: CreditTransaction[];
}

interface GiftDetail {
  gift_id: string;
  gift_name: string;
  price: number;
  handling_cost: number;
  shipping_cost: number;
}

interface TransactionHistory {
  _id: string;
  transaction_type: "Top-Up" | "Purchase";
  user_id: string;
  balance_before: number;
  transaction_cost: number;
  balance_after: number;
  updated_at: string;
  payment_intent?: string;
  campaign_id?: string;
  description?: string;
  giftDetails?: {
    gift_id: string;
    price: number;
    handlingCost: number;
    shippingCost: number;
    _id: string;
  }[];
}

interface CreditTransactionHistory extends TransactionHistory {
  reference_id?: string;
  credits_used_for?: {
    id: string;
    type: string;
    details: string;
  };
}

interface WalletTransactionDetail {
  _id: string;
  campaign_id: string;
  transaction_type: string;
  balance_before: number;
  transaction_cost: number;
  balance_after: number;
  updated_at: string;
  description: string;
  name: string;
  parent_type: string;
}

interface WalletTransactionResponse {
  transaction: WalletTransactionDetail;
  gift_details: GiftDetail[];
}

interface Wallet {
  _id: string;
  current_balance: number;
  currency: string;
  user_id: string;
  transaction_history: TransactionHistory[];
}

// Add new interface for the transaction API response
interface TransactionHistoryResponse {
  message: string;
  transaction_history: TransactionHistory[];
}

interface TransactionDetailsState {
  transaction: WalletTransactionDetail;
  gift_details: GiftDetail[];
}

// Add new components for skeleton loading
const BalanceSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-[#F2F4F7]">
    <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
    <div className="h-10 w-48 bg-gray-200 rounded"></div>
  </div>
);

const TransactionRowSkeleton = () => (
  <tr className="border-b border-[#F2F4F7]">
    <td className="px-6 py-4">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-20 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
    </td>
  </tr>
);

type TabType = "balance" | "credits";

export default function WalletPage() {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  // Add new state for transaction history
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetailsState | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransactionHistory | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add new state for payment processing
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Filter state for transaction type
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<
    "All" | "Top-Up" | "Debit"
  >("All");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // <-- for header search
  const [totalCredits, setTotalCredits] = useState(0);
  const [activeTab, setActiveTab] = useState<"balance" | "credits">("balance");
  const [creditsData, setCreditsData] = useState<CreditsResponse | null>(null);
  const [creditsPage, setCreditsPage] = useState(1);
  const [creditsLimit] = useState(10);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [isCreditsPayment, setIsCreditsPayment] = useState(false);

  // Update formatTransactionType function
  const formatTransactionType = (type: string) => {
    return type
      .split(/[_\s]+/) // Split by underscore or space
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fetchWalletData = async () => {
    try {
      setDataLoading(true);
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }

      if (!userId) {
        toast.error("Please login to view wallet");
        return;
      }

      // Use the backend API endpoint for consistency
      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/${userId}/wallet/check-balance`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch wallet data");
      }

      const data = await response.json();
      console.log("Fetched wallet data from backend API:", data);

      // Transform the response to match the expected wallet structure
      if (data.wallet) {
        setWallet({
          _id: data.wallet._id || userId,
          current_balance: data.wallet.current_balance || 0,
          currency: data.wallet.currency || "USD",
          user_id: userId,
          transaction_history: data.wallet.transaction_history || []
        });
        console.log("Wallet data set successfully:", data.wallet);
      } else {
        console.log("No wallet found in response");
        setWallet(null);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setDataLoading(false);
    }
  };

  // Add new function to fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }

      if (!userId) {
        toast.error("Please login to view wallet");
        return;
      }

      // Use the new transaction history API endpoint
      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/${userId}/wallet/transactions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }

      const data: TransactionHistoryResponse = await response.json();
      console.log("Fetched transaction history from new API:", data);

      // Set transaction history from the new API response
      setTransactionHistory(data.transaction_history || []);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      toast.error("Failed to load transaction history");
    }
  };

  const fetchCreditsData = async (page: number) => {
    try {
      setCreditsLoading(true);
      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/${userId}/credits?page=${page}&limit=${creditsLimit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch credits data");
      }

      const data = await response.json();
      setCreditsData(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
      toast.error("Failed to load credits data");
    } finally {
      setCreditsLoading(false);
    }
  };

  //fetch credits
  const fetchTotalCredits = async () => {
    try {
      setDataLoading(true);
      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push("/");
        return;
      }

      if (!userId) {
        toast.error("Please login to view wallet");
        return;
      }

      // Fetch credits
      const baseUrl = await getBackendApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/${userId}/credits/available`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch the Credits: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Credit response is `, data);
      setTotalCredits(data.available_credits);
      return data.data;
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch wallet data when auth is available
  useEffect(() => {
    if (!isLoadingCookies && authToken && userId) {
      fetchWalletData();
      fetchTransactionHistory();
      fetchTotalCredits();
    }
  }, [authToken, userId, isLoadingCookies]);

  useEffect(() => {
    if (activeTab === "credits" && userId && authToken) {
      fetchCreditsData(creditsPage);
    }
  }, [activeTab, creditsPage, userId, authToken]);

  useEffect(() => {
    if (!isLoadingCookies) {
      const params = new URLSearchParams(window.location.search);
      const source = params.get("source");

      if (source === "gift_selection") {
        // Store all query parameters except 'source'
        const queryParams = {};
        params.forEach((value, key) => {
          if (key !== "source") {
            queryParams[key] = value;
          }
        });
        localStorage.setItem(
          "giftSelectionParams",
          JSON.stringify(queryParams)
        );
      }

      // Check if we're coming back from a page refresh (after adding funds)
      const savedParams = localStorage.getItem("giftSelectionParams");
      if (savedParams && !source) {
        const params = new URLSearchParams(JSON.parse(savedParams));
        router.replace(`/manage-vcard/wallet?${params.toString()}`);
        localStorage.removeItem("giftSelectionParams"); // Clean up
      }
    }
  }, [router, isLoadingCookies]);

  // Add new useEffect to handle OAuth after payment success redirect
  useEffect(() => {
    if (!isLoadingCookies) {
      const handleOAuthAfterPayment = async () => {
        // Only proceed if we have a wallet with balance
        if (!wallet || wallet.current_balance <= 0) {
          console.log("Skipping OAuth - No wallet or zero balance:", {
            hasWallet: Boolean(wallet),
            balance: wallet?.current_balance,
          });
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");

        console.log("OAuth Check - Parameters:", {
          code,
          state,
          walletBalance: wallet.current_balance,
        });

        // Only proceed if we have OAuth params and wallet has balance
        if (code && state) {
          if (!userId) {
            console.error("No user ID found in cookie");
            return;
          }

          try {
            // Get base URL from environment
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            console.log("Using API base URL:", baseUrl);

            // Make the OAuth completion request
            const response = await fetch(
              `${baseUrl}/v1/partners/users/oauth2/complete`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                credentials: "include",
                body: JSON.stringify({
                  code: code,
                  user_id: userId,
                }),
              }
            );

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);

            if (!response.ok) {
              throw new Error(data.message || "Failed to complete OAuth flow");
            }

            // Show success message
            setShowSuccessMessage(true);
            toast.success(
              "Onboarding successful! Redirecting back to partner app..."
            );

            // Construct redirect URL with code and state from response
            const redirectUrl = new URL(data.redirect_uri);
            redirectUrl.searchParams.set("code", code);
            redirectUrl.searchParams.set("state", data.state);

            console.log(
              "Preparing to redirect in 5 seconds to:",
              redirectUrl.toString()
            );

            // Wait for 5 seconds before redirecting
            setTimeout(() => {
              console.log("Executing redirect to:", redirectUrl.toString());
              window.location.href = redirectUrl.toString();
            }, 5000);
          } catch (error) {
            console.error("Error completing OAuth flow:", error);
            console.error("Error details:", {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
            toast.error("Failed to complete the onboarding process");
          }
        } else {
          console.log(
            "Skipping OAuth completion - no OAuth parameters present"
          );
        }
      };

      handleOAuthAfterPayment();
    }
  }, [wallet, router, isLoadingCookies]);

  const handleBuyCreditsClick = () => {
    setIsCreditsPayment(true);
    setShowCreditsModal(true);
  };

  const handleAddFundClick = () => {
    setIsCreditsPayment(false);
    setShowAmountInput(true);
  };

  const handleCreditsSubmit = async () => {
    if (!creditsAmount || parseInt(creditsAmount) <= 0) {
      toast.error("Please enter a valid number of credits");
      return;
    }
    if (parseInt(creditsAmount) % 10 !== 0) {
      toast.error("Credits must be a multiple of 10");
      return;
    }

    // Calculate USD amount (10 credits = 1 USD)
    const usdAmount = (parseInt(creditsAmount) / 10).toString();
    setAmount(usdAmount);

    try {
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(usdAmount) }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCreditsModal(false);
        setShowPaymentModal(true);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error(error);
    }
  };

  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          organization_id: organizationId,
          user_id: userId
        }),
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
      setIsProcessingPayment(true);

      if (isCreditsPayment) {
        const baseUrl = await getBackendApiBaseUrl();
        const response = await fetch(`${baseUrl}/v1/${userId}/credits/add`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            credits: parseInt(creditsAmount),
            activity_type: "add",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add credits");
        }

        const data = await response.json();
        if (data) {
          toast.success("Credits purchased successfully!");
          setShowPaymentModal(false);
          setCreditsAmount("");
          await fetchTotalCredits();
          await fetchCreditsData(1);
          setPaymentComplete(true);
        } else {
          throw new Error("Failed to process credits payment");
        }
      } else {
        // Process the payment through the success endpoint
        const response = await fetch("/api/stripe/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            payment_intent: paymentIntent,
            organization_id: organizationId,
            user_id: userId,
            amount: parseFloat(amount),
            transaction_history: {
              _id: new mongoose.Types.ObjectId().toString(),
              transaction_type: "Top-Up",
              user_id: userId,
              balance_before: wallet?.current_balance || 0,
              transaction_cost: parseFloat(amount),
              balance_after: (wallet?.current_balance || 0) + parseFloat(amount),
              updated_at: new Date().toISOString(),
              payment_intent: paymentIntent
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Payment processing error:", errorText);
          throw new Error("Failed to process payment");
        }

        const data = await response.json();
        if (data.success) {
          toast.success("Payment processed successfully!");
          setShowPaymentModal(false);
          setAmount("");
          await fetchWalletData();
          await fetchTransactionHistory();
          setPaymentComplete(true);
        } else {
          throw new Error(data.error || "Failed to process payment");
        }
      }
    } catch (error) {
      console.error("Error in payment success handler:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Add new function to fetch transaction details
  const fetchTransactionDetails = async (transactions: TransactionHistory[]) => {
    const details: { [key: string]: string } = {};

    for (const transaction of transactions) {
      try {
        if (transaction.campaign_id) {
          const response = await fetch(
            `/api/campaign/${transaction.campaign_id}`
          );
          const data = await response.json();
          if (data.success) {
            details[transaction._id] = data.campaign.name;
          }
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
      }
    }

    setTransactionDetails({
      transaction: {
        _id: "",
        campaign_id: "",
        transaction_type: "",
        balance_before: 0,
        transaction_cost: 0,
        balance_after: 0,
        updated_at: "",
        description: "",
        name: "",
        parent_type: "",
      },
      gift_details: [],
    });
  };

  // Update useEffect to fetch transaction details when wallet data is loaded
  useEffect(() => {
    if (!isLoadingCookies) {
      if (transactionHistory) {
        fetchTransactionDetails(transactionHistory);
      }
    }
  }, [transactionHistory, isLoadingCookies]);

  // Mock data for UI - replace with real data when available
  const mockTransactions = [
    {
      id: 1,
      date: new Date(),
      type: "Top-Up",
      amount: 100,
      balance: 100,
    },
  ];

  // Update useEffect to set loading false after initial mount
  useEffect(() => {
    if (!isLoadingCookies) {
      setLoading(false);
    }
  }, [isLoadingCookies]);

  // Filter transactions based on filter and search
  const filteredTransactions = transactionHistory
    ? transactionHistory.filter((tx) => {
        // Filter by transaction type
        if (
          transactionTypeFilter === "Top-Up" &&
          tx.transaction_type !== "Top-Up"
        )
          return false;
        if (
          transactionTypeFilter === "Debit" &&
          tx.transaction_type === "Top-Up"
        )
          return false;
        // Filter by search term (case-insensitive, match description, source, or amount)
        if (searchTerm.trim()) {
          const search = searchTerm.trim().toLowerCase();
          const desc =
            (tx.transaction_type === "Top-Up"
              ? "Initial fund deposit"
              : tx._id && transactionDetails && transactionDetails.transaction._id
              ? `${
                  tx.campaign_id
                    ? "Campaign: "
                    : ""
                }${transactionDetails.transaction.name}`
              : tx.campaign_id
              ? "Campaign Execution Transaction"
              : "Transaction") || "";
          const source = tx.campaign_id
            ? "Campaign"
            : tx.transaction_type === "Top-Up"
            ? "Cash"
            : "Other";
          return (
            desc.toLowerCase().includes(search) ||
            source.toLowerCase().includes(search) ||
            String(tx.transaction_cost).includes(search)
          );
        }
        return true;
      })
    : [];

  // Update filterCount based on active filters
  useEffect(() => {
    let count = 0;
    if (transactionTypeFilter !== "All") count++;
    setFilterCount(count);
  }, [transactionTypeFilter]);

  // Get current transactions (filtered)
  const getCurrentTransactions = () => {
    if (!filteredTransactions) return [];
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Calculate total pages
  const getTotalPages = () => {
    if (!filteredTransactions) return 1;
    return Math.ceil(filteredTransactions.length / itemsPerPage);
  };

  const fetchWalletTransactionById = async (transactionId: string) => {
    try {
      if (!authToken || !userId) {
        toast.error("Authentication required");
        return null;
      }

      const baseUrl = await getBackendApiBaseUrl();
      const url = `${baseUrl}/v1/${userId}/wallet/transactions/${transactionId}`;

      console.log('Fetching wallet transaction details from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      console.log('Wallet transaction details response:', data);

      // Set the transaction details in state
      setTransactionDetails({
        transaction: data.transaction,
        gift_details: data.gift_details || []
      });

      return {
        transaction: data.transaction,
        gift_details: data.gift_details || []
      };
    } catch (error) {
      console.error('Error fetching wallet transaction details:', error);
      toast.error('Failed to fetch transaction details');
      return null;
    }
  };

  const handleViewDetails = async (transaction: TransactionHistory) => {
    setSelectedTransaction(transaction);

    if (activeTab === 'balance' && transaction._id) {
      try {
        const details = await fetchWalletTransactionById(transaction._id);
        if (details) {
          setShowDetailsModal(true);
        }
      } catch (error) {
        toast.error('Failed to fetch transaction details');
      }
    }
  };

  // Add animation keyframes for page and micro-interactions
  const animations = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes cardDeal { 0% { opacity: 0; transform: translateY(30px) scale(0.95);} 100% { opacity: 1; transform: translateY(0) scale(1);} }
  .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
  .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
  .animate-card-deal { animation: cardDeal 0.5s ease-out forwards; opacity: 0; }
  .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease;}
  .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);}
  `;

  // Add new state for filter modal in table
  const [showTableFilter, setShowTableFilter] = useState(false);

  // Skeleton for full page loading (matches event-campaign/page.tsx)
  const PageSkeleton = () => (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
              <div className="h-10 w-48 bg-gray-200 rounded-md"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <BalanceSkeleton />
              <BalanceSkeleton />
            </div>
            <div className="bg-white rounded-xl border border-[#F2F4F7] overflow-hidden">
              <div className="p-3 md:p-6 border-b border-[#F2F4F7] flex gap-2 items-center justify-between">
                <div className="h-6 w-40 bg-gray-200 rounded-md"></div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                    <tr>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <th key={i} className="px-6 py-3">
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TransactionRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || dataLoading) {
    return <PageSkeleton />;
  }

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Onboarding Successful!
          </h2>
          <p className="text-gray-600 mb-8">
            You will be redirected back to the partner app in a few seconds...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto flex flex-col">
          <style jsx global>
            {animations}
          </style>
          <div className="flex-1">
            <div
              className="animate-fade-in opacity-0 relative"
              style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
            >
              {/* PageHeader */}
              <PageHeader
                title="Wallet"
                description="Manage and organize your wallet efficiently"
                primaryButton={{
                  text: "Add Balance",
                  icon: Wallet,
                  onClick: handleAddFundClick,
                  variant: "primary"
                }}
                secondaryButton={{
                  text: "Add Credits",
                  icon: Coins,
                  onClick: handleBuyCreditsClick,
                  variant: "secondary"
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
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>
                    
                    {/* Filter Button */}
                    <button
                      onClick={() => setShowFilters((v) => !v)}
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
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilters((v) => !v)}
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

                {/* Filter Dropdown */}
                {showFilters && (
                  <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                    {/* Transaction Type Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Transaction Type
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {["All", "Top-Up", "Debit"].map((type) => (
                          <button
                            key={type}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              transactionTypeFilter === type
                                ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                                : "border-gray-200 text-gray-700 hover:border-primary/20 hover:bg-primary/5"
                            }`}
                            onClick={() => setTransactionTypeFilter(type as any)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Clear Filters Button */}
                    {transactionTypeFilter !== "All" && (
                      <div className="flex justify-end pt-2">
                        <button
                          className="text-xs text-primary hover:underline px-2 py-1"
                          onClick={() => setTransactionTypeFilter("All")}
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content Container */}
              <div className="mx-4 md:mx-6 lg:mx-8">
                {/* Wallet and Credits Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Balance Card */}
                  <div
                    className="bg-white p-6 rounded-xl border border-[#F2F4F7] shadow-sm animate-fade-in-up opacity-0"
                    style={{
                      animationDelay: "200ms",
                      animationFillMode: "forwards",
                    }}
                  >
                    {loading || dataLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-10 w-48 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-[#344054] text-lg font-medium mb-2">
                          Available Balance
                        </h2>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl font-semibold">
                            {wallet?.current_balance || 0} {wallet?.currency}
                          </span>
                          <div className="ml-auto bg-gray-100 p-2 rounded-full">
                            <Wallet className="opacity-80" width={26} height={26} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Credits Card */}
                  <div
                    className="bg-white p-6 rounded-xl border border-[#F2F4F7] shadow-sm animate-fade-in-up opacity-0"
                    style={{
                      animationDelay: "200ms",
                      animationFillMode: "forwards",
                    }}
                  >
                    {loading || dataLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-10 w-48 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-[#344054] text-lg font-medium mb-2">
                          Available Credits
                        </h2>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl font-semibold">
                            {totalCredits || 0}
                          </span>
                          <div className="ml-auto bg-gray-100 p-2 rounded-full">
                            <Coins className="opacity-80" width={26} height={26} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-[#F2F4F7] mb-6">
                  <div className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab("balance")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "balance"
                          ? "border-[#7F56D9] text-[#7F56D9]"
                          : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                      }`}
                    >
                      Balance
                    </button>
                    <button
                      onClick={() => setActiveTab("credits")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "credits"
                          ? "border-[#7F56D9] text-[#7F56D9]"
                          : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                      }`}
                    >
                      Credits
                    </button>
                  </div>
                </div>

                {/* Balance Table */}
                {activeTab === "balance" && (
                  <div
                    className="bg-white rounded-xl border border-[#F2F4F7] overflow-hidden animate-fade-in-up opacity-0"
                    style={{
                      animationDelay: "350ms",
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="p-3 md:p-6 border-b border-[#F2F4F7] flex gap-2 items-center justify-between">
                      <h2 className="text-[#344054]  md:text-lg font-medium">
                        Transaction History
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                          <tr>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Date
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Amount
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Source
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Transaction Type
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Status
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading || dataLoading ? (
                            <>
                              <TransactionRowSkeleton />
                              <TransactionRowSkeleton />
                              <TransactionRowSkeleton />
                            </>
                          ) : getCurrentTransactions().length > 0 ? (
                            getCurrentTransactions().map((transaction, index) => (
                              <tr
                                key={transaction._id}
                                className="hover:bg-primary-xlight border-b border-[#F2F4F7] hover-lift animate-card-deal"
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <td className="px-6 py-4 text-sm text-[#344054]">
                                  {new Date(transaction.updated_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                  <span
                                    className={`${
                                      transaction.balance_after < transaction.balance_before
                                        ? "text-red-600"
                                        : "text-[#027A48]"
                                    }`}
                                  >
                                    {transaction.balance_after < transaction.balance_before ? "-" : "+"}
                                    ${transaction.transaction_cost}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-[#344054]">
                                  {transaction.campaign_id ? "Campaign" : "Cash"}
                                </td>
                                <td className="px-6 py-4 text-sm text-[#344054]">
                                  {formatTransactionType(transaction.transaction_type)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 text-xs font-medium bg-[#ECFDF3] text-[#027A48] rounded-full">
                                    confirmed
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    className="grid items-center gap-0.5 px-3.5 py-2 hover:bg-gray-100 cursor-pointer w-fit rounded-full transition-all"
                                    aria-label="View transaction details"
                                    onClick={async () => {
                                      try {
                                        const details = await fetchWalletTransactionById(transaction._id);
                                        if (details) {
                                          setTransactionDetails(details);
                                          setSelectedTransaction(transaction);
                                          setShowDetailsModal(true);
                                        }
                                      } catch (error) {
                                        console.error('Error fetching transaction details:', error);
                                        toast.error('Failed to fetch transaction details');
                                      }
                                    }}
                                  >
                                    <div className="size-1 bg-black rounded-full"></div>
                                    <div className="size-1 bg-black rounded-full"></div>
                                    <div className="size-1 bg-black rounded-full"></div>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-4 text-gray-500"
                              >
                                No transactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <hr className="mb-3"></hr>
                    {/* Pagination */}
                    <div className="flex justify-between items-center my-2">
                      <button
                        className="flex items-center px-4 py-2 text-[#667085] font-[500] text-[14px]"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <Image
                          src="/svgs/Rarrow.svg"
                          alt="Previous Icon"
                          width={11}
                          height={11}
                          className="mr-2"
                        />
                        Previous
                      </button>

                      <div className="flex space-x-2 text-[#667085] text-[14px] font-[500]">
                        {Array.from({ length: getTotalPages() }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded-full h-[40px] w-[40px] ${
                              currentPage === i + 1
                                ? "bg-[#F9F5FF] text-[#7F56D9]"
                                : ""
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        className="flex items-center px-4  text-[#667085] font-[500] text-[14px]"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, getTotalPages())
                          )
                        }
                        disabled={currentPage === getTotalPages()}
                      >
                        Next
                        <Image
                          src="/svgs/arrow.svg"
                          alt="Next Icon"
                          width={11}
                          height={11}
                          className="ml-2"
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Credits Table */}
                {activeTab === "credits" && (
                  <div className="bg-white rounded-xl border border-[#F2F4F7] overflow-hidden">
                    <div className="p-3 md:p-6 border-b border-[#F2F4F7] flex gap-2 items-center justify-between">
                      <h2 className="text-lg font-semibold text-[#101828]">
                        Credits History
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                          <tr>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Date
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Credits
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Source
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Transaction Type
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3">
                              Status
                            </th>
                            <th className="text-left text-xs font-medium text-[#667085] px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditsLoading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <TransactionRowSkeleton key={i} />
                              ))
                            : creditsData?.credits.map((credit) => (
                                <tr
                                  key={credit._id}
                                  className="hover:bg-primary-xlight border-b border-[#F2F4F7] hover-lift animate-card-deal"
                                >
                                  <td className="px-6 py-4 text-sm text-[#344054]">
                                    {new Date(
                                      credit.updated_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium">
                                    <span
                                      className={`${
                                        credit.credits_after < credit.credits_before
                                          ? "text-red-600"
                                          : "text-[#027A48]"
                                      }`}
                                    >
                                      {credit.credits_after < credit.credits_before ? "-" : "+"}
                                      {credit.credits_used}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-[#344054]">
                                    {credit.credits_used_for?.type || "Card"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-[#344054]">
                                    {formatTransactionType(credit.transaction_type)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-[#ECFDF3] text-[#027A48] rounded-full">
                                      confirmed
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <button
                                      className="grid items-center gap-0.5 px-3.5 py-2 hover:bg-gray-100 cursor-pointer w-fit rounded-full transition-all"
                                      aria-label="View transaction details"
                                      onClick={() => {
                                        handleViewDetails({
                                          _id: credit._id,
                                          transaction_type: credit.transaction_type as "Top-Up" | "Purchase",
                                          balance_before: credit.credits_before,
                                          transaction_cost: credit.credits_used,
                                          balance_after: credit.credits_after,
                                          updated_at: credit.updated_at,
                                          description: credit.description,
                                          campaign_id: credit.credits_used_for?.id,
                                          user_id: userId || ""
                                        });
                                        setShowDetailsModal(true);
                                      }}
                                    >
                                      <div className="size-1 bg-black rounded-full"></div>
                                      <div className="size-1 bg-black rounded-full"></div>
                                      <div className="size-1 bg-black rounded-full"></div>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                        </tbody>
                      </table>
                    </div>
                    {creditsData && (
                      <div className="flex justify-between items-center my-2">
                        <button
                          className="flex items-center px-4 py-2 text-[#667085] font-[500] text-[14px]"
                          onClick={() => setCreditsPage((p) => Math.max(1, p - 1))}
                          disabled={creditsPage === 1}
                        >
                          <Image
                            src="/svgs/Rarrow.svg"
                            alt="Previous Icon"
                            width={11}
                            height={11}
                            className="mr-2"
                          />
                          Previous
                        </button>

                        <div className="flex space-x-2 text-[#667085] text-[14px] font-[500]">
                          {Array.from(
                            { length: Math.ceil(creditsData.total / creditsLimit) },
                            (_, i) => (
                              <button
                                key={i}
                                onClick={() => setCreditsPage(i + 1)}
                                className={`px-3 py-1 rounded-full h-[40px] w-[40px] ${
                                  creditsPage === i + 1
                                    ? "bg-[#F9F5FF] text-[#7F56D9]"
                                    : ""
                                }`}
                              >
                                {i + 1}
                              </button>
                            )
                          )}
                        </div>

                        <button
                          className="flex items-center px-4 text-[#667085] font-[500] text-[14px]"
                          onClick={() => setCreditsPage((p) => p + 1)}
                          disabled={
                            creditsPage * creditsLimit >= (creditsData?.total || 0)
                          }
                        >
                          Next
                          <Image
                            src="/svgs/arrow.svg"
                            alt="Next Icon"
                            width={11}
                            height={11}
                            className="ml-2"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Input Modal */}
              {showAmountInput && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg w-full max-w-md m-4">
                    <h2 className="text-xl font-bold mb-4">
                      Add Funds to Wallet
                    </h2>
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
                        <p className="mt-4">
                          Processing your{" "}
                          {isCreditsPayment ? "credits purchase" : "payment"}
                          ...
                        </p>
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
                              `[Stripe Payment Flow] StripePaymentForm success callback triggered`
                            );
                            handlePaymentSuccess(paymentIntent);
                          }}
                          onClose={() => {
                            console.log(
                              `[Stripe Payment Flow] Payment modal closing`
                            );
                            setShowPaymentModal(false);
                          }}
                        />
                      </Elements>
                    )}
                  </div>
                </div>
              )}

              {/* Credits Purchase Modal */}
              {showCreditsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4 relative animate-fade-in">
                    <button
                      onClick={() => {
                        setShowCreditsModal(false);
                        setCreditsAmount("");
                      }}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2 className="text-2xl font-semibold mb-6">Buy Credits</h2>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter number of credits
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={creditsAmount}
                          onChange={(e) => setCreditsAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter credits (multiple of 10)"
                          min="10"
                          step="10"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        10 credits = $1 USD
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreditsSubmit}
                        disabled={!creditsAmount || parseInt(creditsAmount) <= 0}
                        className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => {
                          setShowCreditsModal(false);
                          setCreditsAmount("");
                        }}
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details Modal - Wallet */}
              {showDetailsModal && selectedTransaction && activeTab === "balance" && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl m-4 relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-8 pt-7 pb-3 border-b border-gray-100 bg-gradient-to-r from-[#F9F5FF] to-[#F4EBFF] rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary rounded-full p-2">
                          <Wallet className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-[#1B1D21]">
                          Wallet Transaction Details
                        </h2>
                      </div>
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    {/* Modal Content */}
                    <div className="px-8 py-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Date</div>
                          <div className="font-medium text-base">
                            {new Date(selectedTransaction.updated_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Amount" : "Credits"}</div>
                          <div className={`font-semibold text-lg ${
                            selectedTransaction.balance_after < selectedTransaction.balance_before
                              ? "text-red-600"
                              : "text-[#027A48]"
                          }`}>
                            {selectedTransaction.balance_after < selectedTransaction.balance_before ? "-" : "+"}
                            {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.transaction_cost}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-6"></div>
                      {/* Balance Details Section */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">{(activeTab as "balance" | "credits") === "balance" ? "Balance Details" : "Credits Details"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Balance Before" : "Credits Before"}</div>
                            <div className="font-medium text-base">
                              {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.balance_before}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Balance After" : "Credits After"}</div>
                            <div className="font-medium text-base">
                              {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.balance_after}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Gift Details Section */}
                      {transactionDetails?.gift_details && transactionDetails.gift_details.length > 0 && (
                        <>
                          <div className="border-t border-dashed border-gray-200 my-6"></div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Gift Details {transactionDetails?.gift_details && `(${transactionDetails.gift_details.length})`}
                            </h4>
                            <div className="overflow-x-auto">
                              <div className="max-h-[300px] overflow-y-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Gift Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Count</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Handling Cost</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Shipping Cost</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const uniqueGifts = transactionDetails.gift_details.reduce((acc, gift) => {
                                        const key = `${gift.gift_name}-${gift.price}-${gift.handling_cost}-${gift.shipping_cost}`;
                                        if (!acc[key]) {
                                          acc[key] = { ...gift, count: 1 };
                                        } else {
                                          acc[key].count += 1;
                                        }
                                        return acc;
                                      }, {} as Record<string, any>);

                                      return Object.values(uniqueGifts).map((gift, index) => {
                                        const total = (gift.price + gift.handling_cost + gift.shipping_cost) * gift.count;
                                        return (
                                          <tr key={index} className="border-b border-gray-100">
                                            <td className="px-4 py-2 text-sm">{gift.gift_name}</td>
                                            <td className="px-4 py-2 text-sm">{gift.count}</td>
                                            <td className="px-4 py-2 text-sm">${gift.price}</td>
                                            <td className="px-4 py-2 text-sm">${gift.handling_cost}</td>
                                            <td className="px-4 py-2 text-sm">${gift.shipping_cost}</td>
                                            <td className="px-4 py-2 text-sm font-medium">${total}</td>
                                          </tr>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details Modal - Credits */}
              {showDetailsModal && selectedTransaction && activeTab === "credits" && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl m-4 relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-8 pt-7 pb-3 border-b border-gray-100 bg-gradient-to-r from-[#F9F5FF] to-[#F4EBFF] rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary rounded-full p-2">
                          <Coins className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-[#1B1D21]">
                          Credits Transaction Details
                        </h2>
                      </div>
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    {/* Modal Content */}
                    <div className="px-8 py-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Date</div>
                          <div className="font-medium text-base">
                            {new Date(selectedTransaction.updated_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Amount" : "Credits"}</div>
                          <div className={`font-semibold text-lg ${
                            selectedTransaction.balance_after < selectedTransaction.balance_before
                              ? "text-red-600"
                              : "text-[#027A48]"
                          }`}>
                            {selectedTransaction.balance_after < selectedTransaction.balance_before ? "-" : "+"}
                            {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.transaction_cost}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-6"></div>
                      {/* Balance Details Section */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">{(activeTab as "balance" | "credits") === "balance" ? "Balance Details" : "Credits Details"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Balance Before" : "Credits Before"}</div>
                            <div className="font-medium text-base">
                              {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.balance_before}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">{(activeTab as "balance" | "credits") === "balance" ? "Balance After" : "Credits After"}</div>
                            <div className="font-medium text-base">
                              {(activeTab as "balance" | "credits") === "balance" ? "$" : ""}{selectedTransaction.balance_after}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Transaction Type</div>
                        <div className="font-medium text-base">
                          {formatTransactionType(selectedTransaction.transaction_type)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
