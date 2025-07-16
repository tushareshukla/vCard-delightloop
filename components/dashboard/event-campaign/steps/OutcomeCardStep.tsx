"use client"

import type React from "react"

import { useState } from "react"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import Image from "next/image"
import { Check, Layout, Upload, Gift } from "lucide-react"

interface OutcomeCardStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
}

interface Template {
  id: string
  name: string
  image: string
  description: string
}

export default function OutcomeCardStep({ campaignData, updateCampaignData, onNext, onBack }: OutcomeCardStepProps) {
  const [message, setMessage] = useState(
    campaignData.message || "We look forward to seeing you at the event. Here is a resource for you:",
  )
  const [logoUrl, setLogoUrl] = useState(campaignData.logoUrl || "/Logo Final.png")
  const [selectedTemplateId, setSelectedTemplateId] = useState(campaignData.templateId || "template1")
  const [isUploading, setIsUploading] = useState(false)

  // Mock templates
  const templates: Template[] = [
    {
      id: "template1",
      name: "Modern Purple",
      image: "/placeholder.svg?height=200&width=300",
      description: "Clean, modern design with purple accents",
    },
    {
      id: "template2",
      name: "Corporate Blue",
      image: "/placeholder.svg?height=200&width=300",
      description: "Professional template with blue color scheme",
    },
    {
      id: "template3",
      name: "Minimalist White",
      image: "/placeholder.svg?height=200&width=300",
      description: "Simple, elegant design with white background",
    },
  ]

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true)

      // Simulate upload delay
      setTimeout(() => {
        // In a real implementation, you would upload the file to your server/cloud storage
        // and get back a URL to use
        setLogoUrl(URL.createObjectURL(e.target.files![0]))
        setIsUploading(false)
      }, 1500)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
  }

  const handleContinue = () => {
    updateCampaignData({
      message,
      logoUrl,
      templateId: selectedTemplateId,
    })
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Customize Outcome Card</h2>
      <p className="text-gray-600 mb-8">
        Personalize the landing page that recipients will see when they receive your gift
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Personal Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={handleMessageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter your personal message to recipients..."
            />
            <p className="mt-1 text-sm text-gray-500">This message will be displayed on the gift landing page.</p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                {logoUrl ? (
                  <Image src={logoUrl || "/placeholder.svg"} alt="Company Logo" fill className="object-contain" />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-gray-400">
                    <Layout className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      <span>Upload Logo</span>
                    </>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
                <p className="mt-1 text-xs text-gray-500">Recommended size: 200x200px</p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Landing Page Template</label>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-16 w-24 relative rounded overflow-hidden">
                      <Image
                        src={template.image || "/placeholder.svg"}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div
                className={`rounded-lg overflow-hidden border border-gray-200 p-6 ${
                  selectedTemplateId === "template1"
                    ? "bg-purple-50"
                    : selectedTemplateId === "template2"
                      ? "bg-blue-50"
                      : "bg-gray-50"
                }`}
              >
                {/* Header with Logo */}
                <div className="flex justify-between items-center mb-6">
                  <div className="h-10 w-10 relative">
                    {logoUrl && (
                      <Image src={logoUrl || "/placeholder.svg"} alt="Company Logo" fill className="object-contain" />
                    )}
                  </div>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      selectedTemplateId === "template1"
                        ? "bg-purple-100 text-purple-800"
                        : selectedTemplateId === "template2"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Gift Inside
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-gray-700 text-sm italic">"{message}"</p>
                </div>

                {/* Gift Preview */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <Gift className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Your Gift</h4>
                      <p className="text-sm text-gray-500">Click to reveal your gift</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-2 rounded-md font-medium text-white ${
                    selectedTemplateId === "template1"
                      ? "bg-purple-600"
                      : selectedTemplateId === "template2"
                        ? "bg-blue-600"
                        : "bg-gray-600"
                  }`}
                >
                  Claim Your Gift
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            This is a preview of how your gift landing page will appear to recipients.
          </p>
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

