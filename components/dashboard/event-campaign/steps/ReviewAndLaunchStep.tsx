"use client"

import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import { Check, AlertCircle, Gift, Users, Calendar, DollarSign, Wallet, PlusCircle, Layout } from "lucide-react"

interface ReviewAndLaunchStepProps {
  campaignData: EventCampaignData
  onBack: () => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
  recipientCount: number
  walletBalance: number
  onAddFunds: () => void
}

export default function ReviewAndLaunchStep({
  campaignData,
  onBack,
  onSubmit,
  isLoading,
  error,
  recipientCount,
  walletBalance,
  onAddFunds,
}: ReviewAndLaunchStepProps) {
  const totalBudget = recipientCount * campaignData.budget.perRecipient
  const insufficientFunds = totalBudget > walletBalance

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Review & Launch Campaign</h2>
      <p className="text-gray-600 mb-8">Review your campaign details before launching</p>

      <div className="space-y-6">
        {/* Campaign Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-primary/5 p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Campaign Summary</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Campaign Name & Event Details */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Event Details</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campaign Name:</span>
                    <span className="font-medium">{campaignData.campaignName || "Untitled Campaign"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Name:</span>
                    <span className="font-medium">{campaignData.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Date:</span>
                    <span className="font-medium">
                      {new Date(campaignData.eventDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type:</span>
                    <span className="font-medium capitalize">{campaignData.eventType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipients */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Recipients</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium">
                      {campaignData.recipientSource === "csv"
                        ? "CSV Upload"
                        : campaignData.recipientSource === "eventbrite"
                          ? "Eventbrite"
                          : "Contact List"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Recipients:</span>
                    <span className="font-medium">{recipientCount}</span>
                  </div>
                  {campaignData.csvFile && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">File:</span>
                      <span className="font-medium">{campaignData.csvFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gifts */}
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Selected Gifts</h4>
                <div className="mt-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Number of Gift Options:</span>
                    <span className="font-medium">{campaignData.selectedGiftIds.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.selectedGiftIds.map((giftId, index) => (
                      <div key={giftId} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                        Gift Option {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Budget</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Recipient:</span>
                    <span className="font-medium">${campaignData.budget.perRecipient.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Budget:</span>
                    <span className="font-medium">${totalBudget.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet Balance:</span>
                    <span className={`font-medium ${insufficientFunds ? "text-red-500" : "text-green-600"}`}>
                      ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Outcome Card */}
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Layout className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Outcome Card</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium">
                      {campaignData.templateId === "template1"
                        ? "Modern Purple"
                        : campaignData.templateId === "template2"
                          ? "Corporate Blue"
                          : "Minimalist White"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-medium text-right max-w-[250px] truncate">{campaignData.message}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {insufficientFunds ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-700">Insufficient Wallet Balance</h4>
                <p className="text-red-600 text-sm mt-1">
                  You need ${(totalBudget - walletBalance).toFixed(2)} more in your wallet to launch this campaign.
                </p>
                <button
                  onClick={onAddFunds}
                  className="mt-3 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Add Funds to Wallet</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-700">Ready to Launch</h4>
                <p className="text-green-600 text-sm mt-1">Your wallet has sufficient funds to launch this campaign.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-700">Error</h4>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span>Back</span>
        </motion.button>

        <div className="flex gap-3">
          {insufficientFunds && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddFunds}
              className="flex items-center justify-center gap-2 border border-primary text-primary font-medium px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add Funds</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            disabled={isLoading || insufficientFunds}
            className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
              !isLoading && !insufficientFunds
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Campaign...</span>
              </>
            ) : (
              <>
                <span>Launch Campaign</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

