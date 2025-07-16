"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: string) => void;
  onClose: () => void;
}

export function StripePaymentForm({
  amount,
  onSuccess,
  onClose,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe.js hasn't loaded yet");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred");
      } else if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          onSuccess(paymentIntent.id);
        } else {
          setErrorMessage("Payment failed. Please try again.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[60vh] sm:max-h-none sm:overflow-visible px-1">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            Add ${amount} to Wallet
          </h3>
          <PaymentElement
            options={{
              layout: "tabs",
              wallets: {
                applePay: "never",
                googlePay: "never",
              },
            }}
          />
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
        )}
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : `Pay $${amount}`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
