import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Wallet from "@/models/wallet";
import mongoose from "mongoose";
import Stripe from "stripe";
import { getUserFromRequestCookie } from "@/utils/getUserFromCookie";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  try {
    const { payment_intent, organization_id } = await req.json();

    // Get user data from cookie
    const userData = getUserFromRequestCookie(req);
    if (!userData?.userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Log the values for debugging
    console.log("Processing payment with:", {
      payment_intent,
      organization_id,
      userId: userData.userId,
    });

    // Fetch the payment intent to get the actual amount
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    const amount = paymentIntent.amount / 100; // Convert from cents back to dollars

    await dbConnect();

    // Ensure valid ObjectIds
    const userObjectId = new mongoose.Types.ObjectId(userData.userId);
    const orgObjectId = new mongoose.Types.ObjectId(organization_id);

    // Generate a unique transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex');

    // Find existing wallet or create new one
    let wallet = await Wallet.findOne({
      organization_id: orgObjectId,
      user_id: userObjectId, // Add this to ensure we find the correct wallet
    });

    if (!wallet) {
      // Create new wallet if doesn't exist
      const newWallet = new Wallet({
        organization_id: orgObjectId,
        user_id: userObjectId,
        current_balance: amount,
        currency: "USD",
        transaction_history: [
          {
            _id: transactionId,
            transaction_type: "Top-Up",
            user_id: userObjectId,
            balance_before: 0,
            transaction_cost: amount,
            balance_after: amount,
            updated_at: new Date(),
            payment_intent: payment_intent,
          },
        ],
      });

      try {
        wallet = await newWallet.save();
        console.log("Created new wallet:", wallet._id);
        return NextResponse.json({ success: true, wallet });
      } catch (createError) {
        console.error("Error creating wallet:", createError);
        throw createError;
      }
    }

    // Update existing wallet
    const balanceBefore = wallet.current_balance;
    const balanceAfter = balanceBefore + amount;

    try {
      // Update using findOneAndUpdate to ensure atomicity
      const updatedWallet = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          user_id: userObjectId,
        },
        {
          $set: { current_balance: balanceAfter },
          $push: {
            transaction_history: {
              _id: transactionId,
              transaction_type: "Top-Up",
              user_id: userObjectId,
              balance_before: balanceBefore,
              transaction_cost: amount,
              balance_after: balanceAfter,
              updated_at: new Date(),
              payment_intent: payment_intent,
            },
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedWallet) {
        throw new Error("Failed to update wallet");
      }

      console.log("Updated existing wallet:", updatedWallet._id);

      return NextResponse.json({
        success: true,
        current_balance: balanceAfter,
      });
    } catch (updateError) {
      console.error("Error updating wallet:", updateError);
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating wallet:", error);
    // Include more detailed error information in development
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update wallet";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
