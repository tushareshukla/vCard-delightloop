"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface PaymentFormProps {
  organizationId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  amount: number;
  currency: string;
}

export function PaymentForm({
  organizationId,
  onSuccess,
  onError,
  amount,
  currency,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/manage-vcard/wallet`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      onSuccess();
    } catch (error: any) {
      setErrorMessage(error.message);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay ${amount} ${currency}`}
      </button>
    </form>
  );
}
