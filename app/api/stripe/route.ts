export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe secret key is not configured" },
      { status: 500 }
    );
  }

  try {
    const { amount } = await req.json();

    // Store amount in payment intent metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        amount: amount.toString(), // Store original amount in metadata
        integration_check: "accept_a_payment",
      },
    });

    // Store amount in localStorage before returning
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount, // Send amount back to client
    });
  } catch (error: any) {
    console.error("Stripe API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error creating payment intent" },
      { status: 500 }
    );
  }
}
