"use client"

import { useState } from "react"
import Image from "next/image"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"

interface CampaignGoalSelectionProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
}

export default function CampaignGoalSelection({
  campaignData,
  updateCampaignData,
  onNext,
}: CampaignGoalSelectionProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>("event")

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal)
  }

  const handleContinue = () => {
    // For now, we only support event campaigns
    onNext()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center">
        Let's get started on crafting the perfect gifting strategy for you. 🎁
      </h2>
      <p className="text-[15px] font-medium mb-8 text-center">
        What's the main goal of your campaign today? (Select one of the options below.)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedGoal === "event"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleGoalSelect("event")}
        >
          <div className="absolute -top-3 left-4">
            <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">Recommended</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-3 mb-3">
              <Image src="/svgs/Ticket.svg" alt="Event" width={24} height={24} className="text-primary" />
            </div>
            <h3 className="font-medium text-base mb-2">Delight Event Attendees</h3>
            <p className="text-gray-600 text-sm">
              Create personalized gifts for your event attendees to increase engagement
            </p>
          </div>
          {selectedGoal === "event" && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all opacity-60 ${
            selectedGoal === "pipeline"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleGoalSelect("pipeline")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 rounded-full p-3 mb-3">
              <Image src="/svgs/Handshake.svg" alt="Pipeline" width={24} height={24} className="text-blue-600" />
            </div>
            <h3 className="font-medium text-base mb-2">Create More Pipeline</h3>
            <p className="text-gray-600 text-sm">Generate new opportunities with targeted gifting campaigns</p>
          </div>
          {selectedGoal === "pipeline" && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all opacity-60 ${
            selectedGoal === "deals"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleGoalSelect("deals")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-3">
              <Image src="/svgs/Qr.svg" alt="Deals" width={24} height={24} className="text-green-600" />
            </div>
            <h3 className="font-medium text-base mb-2">Close Deals Faster</h3>
            <p className="text-gray-600 text-sm">Accelerate your sales cycle with strategic gifting</p>
          </div>
          {selectedGoal === "deals" && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all opacity-60 ${
            selectedGoal === "churn"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleGoalSelect("churn")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="bg-orange-100 rounded-full p-3 mb-3">
              <Image src="/svgs/Flame.svg" alt="Churn" width={24} height={24} className="text-orange-600" />
            </div>
            <h3 className="font-medium text-base mb-2">Reduce Churn</h3>
            <p className="text-gray-600 text-sm">Strengthen customer relationships and improve retention</p>
          </div>
          {selectedGoal === "churn" && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-10 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          className="flex items-center justify-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
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

