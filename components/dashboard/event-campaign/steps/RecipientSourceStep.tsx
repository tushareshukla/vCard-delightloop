"use client"

import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import { Upload, Users, Linkedin, Database } from "lucide-react"

interface RecipientSourceStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
}

export default function RecipientSourceStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
}: RecipientSourceStepProps) {
  const handleSourceSelect = (source: "csv" | "eventbrite" | "contactList" | "linkedin") => {
    updateCampaignData({ recipientSource: source })
  }

  const handleContinue = () => {
    if (campaignData.recipientSource) {
      onNext()
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Choose Recipient Source</h2>
      <p className="text-gray-600 mb-8">How would you like to add recipients to your campaign?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
            campaignData.recipientSource === "csv"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleSourceSelect("csv")}
        >
          <div className="flex flex-col items-center text-center h-full">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-base mb-2">Upload CSV</h3>
            <p className="text-gray-600 text-sm flex-grow">Import your attendee list from a CSV file</p>
            {campaignData.recipientSource === "csv" && (
              <div className="mt-4 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
            campaignData.recipientSource === "eventbrite"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleSourceSelect("eventbrite")}
        >
          <div className="flex flex-col items-center text-center h-full">
            <div className="bg-orange-100 rounded-full p-3 mb-4">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-medium text-base mb-2">Connect Event Platform</h3>
            <p className="text-gray-600 text-sm flex-grow">Import attendees directly from Eventbrite</p>
            {campaignData.recipientSource === "eventbrite" && (
              <div className="mt-4 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
            campaignData.recipientSource === "linkedin"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleSourceSelect("linkedin")}
        >
          <div className="flex flex-col items-center text-center h-full">
            <div className="bg-blue-500 rounded-full p-3 mb-4">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-base mb-2">LinkedIn Connections</h3>
            <p className="text-gray-600 text-sm flex-grow">Import recipients from your LinkedIn connections</p>
            {campaignData.recipientSource === "linkedin" && (
              <div className="mt-4 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
            campaignData.recipientSource === "contactList"
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
          }`}
          onClick={() => handleSourceSelect("contactList")}
        >
          <div className="flex flex-col items-center text-center h-full">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium text-base mb-2">From Contact List</h3>
            <p className="text-gray-600 text-sm flex-grow">Use contacts from your existing lists</p>
            {campaignData.recipientSource === "contactList" && (
              <div className="mt-4 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </motion.div>
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
          disabled={!campaignData.recipientSource}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            campaignData.recipientSource
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

