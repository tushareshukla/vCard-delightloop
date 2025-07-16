"use client"

import { useState, useEffect } from "react"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import { DollarSign, AlertCircle } from "lucide-react"

interface BudgetConfigurationStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
  recipientCount: number
  walletBalance: number
}

export default function BudgetConfigurationStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
  recipientCount,
  walletBalance,
}: BudgetConfigurationStepProps) {
  const [perRecipientBudget, setPerRecipientBudget] = useState(campaignData.budget.perRecipient)
  const [totalBudget, setTotalBudget] = useState(campaignData.budget.total || 0)
  const [error, setError] = useState<string | null>(null)

  // Update total budget when recipient count or per-recipient budget changes
  useEffect(() => {
    if (recipientCount > 0 && perRecipientBudget > 0) {
      const newTotal = recipientCount * perRecipientBudget
      setTotalBudget(newTotal)
    }
  }, [recipientCount, perRecipientBudget])

  const handleBudgetChange = (value: number) => {
    if (value < 10) {
      setError("Minimum budget per recipient is $10")
    } else if (value > 500) {
      setError("Maximum budget per recipient is $500")
    } else {
      setError(null)
    }

    setPerRecipientBudget(value)
  }

  const handleContinue = () => {
    if (error) return

    updateCampaignData({
      budget: {
        perRecipient: perRecipientBudget,
        total: totalBudget,
      },
    })

    onNext()
  }

  const insufficientFunds = totalBudget > walletBalance

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Set Your Budget</h2>
      <p className="text-gray-600 mb-8">Configure your campaign budget based on the number of recipients</p>

      {/* Budget Configuration Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="bg-primary/10 p-2 rounded-full mr-3">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Budget Settings</h3>
        </div>

        <div className="space-y-6">
          {/* Recipient Count */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Number of Recipients:</span>
            <span className="font-semibold">{recipientCount}</span>
          </div>

          {/* Per Recipient Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="perRecipientBudget" className="text-gray-700">
                Budget per Recipient:
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input
                  type="number"
                  id="perRecipientBudget"
                  value={perRecipientBudget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  min="10"
                  max="500"
                  step="5"
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right"
                />
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={perRecipientBudget}
              onChange={(e) => handleBudgetChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$10</span>
              <span>$50</span>
              <span>$100</span>
              <span>$150</span>
              <span>$200</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Total Budget */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total Campaign Budget:</span>
              <span className="text-xl font-bold text-primary">${totalBudget.toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Current Wallet Balance:</span>
              <span className={`font-semibold ${insufficientFunds ? "text-red-500" : "text-green-600"}`}>
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Insufficient Funds Warning */}
          {insufficientFunds && (
            <div className="bg-red-50 border border-red-100 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Insufficient funds</p>
                <p className="text-red-600 text-sm">
                  You'll need to add ${(totalBudget - walletBalance).toFixed(2)} more to your wallet before launching
                  this campaign.
                </p>
              </div>
            </div>
          )}
        </div>
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!!error || perRecipientBudget < 10}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            !error && perRecipientBudget >= 10
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>Continue</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

