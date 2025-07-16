import { Wallet, Transaction } from "@/lib/types/wallet";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const walletService = {
  // Create a new wallet
  async createWallet(
    organizationId: string,
    data: {
      initial_balance: number;
      currency: "USD" | "INR" | "EUR";
      payment_method_id: string;
    }
  ): Promise<{ message: string; wallet: Wallet }> {
    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/wallet/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message);
    }

    return response.json();
  },

  // Top up existing wallet
  async topUpWallet(
    organizationId: string,
    data: {
      amount: number;
      currency: "USD" | "INR" | "EUR";
      payment_method_id: string;
    }
  ) {
    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/wallet/top-up`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message);
    }

    return response.json();
  },

  // Get wallet transactions
  async getTransactions(organizationId: string): Promise<{
    message: string;
    transaction_history: Transaction[];
  }> {
    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/wallet/transactions`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message);
    }

    return response.json();
  },
};
