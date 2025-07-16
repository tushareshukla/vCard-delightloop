"use client"

import { useState } from "react"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import { Calendar } from "lucide-react"

interface EventDetailsStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
}

export default function EventDetailsStep({ campaignData, updateCampaignData, onNext, onBack }: EventDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
     const newErrors: Record<string, string> = {}
   
     if (!campaignData.campaignName.trim()) {
       newErrors.campaignName = "Campaign name is required"
     }
   
     if (!campaignData.eventName.trim()) {
       newErrors.eventName = "Event name is required"
     }
   
     if (!campaignData.eventDate) {
       newErrors.eventDate = "Event date is required"
     }
   
     setErrors(newErrors)
     return Object.keys(newErrors).length === 0
   }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Event Details</h2>
      <p className="text-gray-600 mb-8">
        Tell us about your event so we can help you create the perfect gifting campaign
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">
            Campaign Name
          </label>
          <input
            type="text"
            id="campaignName"
            value={campaignData.campaignName}
            onChange={(e) => updateCampaignData({ campaignName: e.target.value })}
            placeholder="e.g., Q2 Customer Conference Gifts"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              errors.campaignName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.campaignName && <p className="text-red-500 text-xs mt-1">{errors.campaignName}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            id="eventName"
            value={campaignData.eventName}
            onChange={(e) => updateCampaignData({ eventName: e.target.value })}
            placeholder="e.g., Annual Customer Conference 2025"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              errors.eventName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
            Event Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="eventDate"
              value={campaignData.eventDate}
              onChange={(e) => updateCampaignData({ eventDate: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.eventDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
            Event Type
          </label>
          <select
            id="eventType"
            value={campaignData.eventType}
            onChange={(e) => updateCampaignData({ eventType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="conference">Conference</option>
            <option value="webinar">Webinar</option>
            <option value="workshop">Workshop</option>
            <option value="tradeshow">Trade Show</option>
            <option value="networking">Networking Event</option>
            <option value="other">Other</option>
          </select>
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
          onClick={handleSubmit}
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

