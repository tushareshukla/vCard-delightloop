"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import Image from "next/image"
import { Upload, Check, AlertCircle } from "lucide-react"

interface UploadCSVStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
  onRecipientCountUpdate: (count: number) => void
}

export default function UploadCSVStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
  onRecipientCountUpdate,
}: UploadCSVStepProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("Processing your data...")
  const [error, setError] = useState<string | null>(null)
  const [recipientCount, setRecipientCount] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Update parent component with recipient count
  useEffect(() => {
    onRecipientCountUpdate(recipientCount)
  }, [recipientCount, onRecipientCountUpdate])

  // Handles drag enter/leave/over events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handles file drop event
  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      setError(null)
      await handleUpload(file)
    }
  }

  // Handles file selection via input
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const fileType = file.name.split(".").pop()?.toLowerCase()

      if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
        if (file.size <= 5 * 1024 * 1024) {
          // 5MB limit
          setError(null)
          await handleUpload(file)
        } else {
          setError("File size should be less than 5MB")
        }
      } else {
        setError("Please upload a .csv, .xls, or .xlsx file")
      }
    }
  }

  // Simulates file upload and processing
  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    updateCampaignData({ csvFile: file })

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 100)

    // Simulate file processing
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      setIsUploading(false)

      // Parse CSV to get recipient count (simulated here)
      const simulatedCount = Math.floor(Math.random() * 50) + 10 // Random count between 10-60
      setRecipientCount(simulatedCount)
      setProcessingMessage(`Successfully imported ${simulatedCount} recipients`)
      setProcessingComplete(true)
    }, 2500)
  }

  const handleDownloadTemplate = () => {
    // In a real implementation, this would download a CSV template
    const link = document.createElement("a")
    link.href = "/templates/RecepientsTemplate.xlsx"
    link.download = "EventAttendees_Template.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Import Recipients</h2>
      <p className="text-gray-600 mb-4">Upload your attendee list to create personalized gifts for each recipient</p>

      {/* Download Template Link */}
      <div className="flex items-center gap-2 justify-center cursor-pointer mb-6">
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <Image src="/svgs/Grid.svg" alt="download" width={13} height={13} />
          <span>Download Template</span>
        </button>
      </div>

      {/* Upload Instructions */}
      <div className="flex items-start text-sm gap-3 mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex-shrink-0 mt-0.5">
          <Image src="/svgs/ThumbUp.svg" alt="Thumb up" width={20} height={22} />
        </div>
        <p className="leading-5">
          Drag and drop your CSV file, XLS file or click to upload it. Make sure it includes details like first name,
          last name, email, and LinkedIn URL for best results.
        </p>
      </div>

      {/* File Upload Area */}
      {!campaignData.csvFile ? (
        <label
          htmlFor="file-upload"
          className={`flex flex-col mt-6 mx-auto group text-primary-light items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 py-8 px-4 hover:bg-primary/5 transition-all duration-300 ${
            dragActive ? "border-primary bg-primary/5" : "border-gray-300"
          } ${error ? "border-red-300" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center w-full">
            <Upload
              className={`w-10 h-10 mb-3 text-gray-400 ${
                dragActive ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
              } transition-all duration-300`}
            />
            <p className="mb-2 text-sm">
              <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">.xls, .xlsx, or .csv file (max 5MB)</p>
          </div>
          <input
            id="file-upload"
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".csv,.xls,.xlsx"
          />
        </label>
      ) : (
        <div className="mt-6 w-full">
          <div className="flex gap-3 items-start bg-white rounded-lg p-4 border border-primary">
            <Image src="/svgs/FileUpload.svg" alt="file upload icon" width={34} height={34} />

            <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
              {/* File name and size */}
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-3">
                  <div className="grid">
                    <span className="text-sm font-medium">{campaignData.csvFile.name}</span>
                    <span className="text-xs text-gray-500">{Math.round(campaignData.csvFile.size / 1024)} KB</span>
                  </div>
                </div>
                {/* Status indicator */}
                {isUploading ? (
                  <div></div>
                ) : error ? (
                  <button
                    onClick={() => {
                      updateCampaignData({ csvFile: null })
                      setError(null)
                      setUploadProgress(0)
                      setProcessingComplete(false)
                    }}
                    className="text-red-500 hover:text-red-600 p-1 rounded"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : (
                  <div className="bg-primary rounded-full text-white h-fit p-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex w-full items-center gap-2.5">
                <div className="w-[85%] bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${error ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{uploadProgress}%</span>
              </div>
            </div>
          </div>

          {/* Success message */}
          {uploadProgress === 100 && !isUploading && !error && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm font-medium text-green-600">
              <Check className="w-4 h-4" />
              Your file has been imported successfully
            </div>
          )}

          {/* Processing message */}
          {processingComplete && (
            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">{processingMessage}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-700">{error}</span>
          </div>
        </div>
      )}

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
          onClick={onNext}
          disabled={!processingComplete || isUploading || !!error}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            processingComplete && !isUploading && !error
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

