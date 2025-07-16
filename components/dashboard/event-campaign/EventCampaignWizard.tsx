"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

// Step components
import CampaignGoalSelection from "./steps/CampaignGoalSelection"
import EventDetailsStep from "./steps/EventDetailsStep"
import RecipientSourceStep from "./steps/RecipientSourceStep"
import UploadCSVStep from "./steps/UploadCSVStep"
import ConnectEventPlatformStep from "./steps/ConnectEventPlatformStep"
import GiftSelectionStep from "./steps/GiftSelectionStep"
import BudgetConfigurationStep from "./steps/BudgetConfigurationStep"
import ReviewAndLaunchStep from "./steps/ReviewAndLaunchStep"
import WalletFundingModal from "./WalletFundingModal"
import OutcomeCardStep from "./steps/OutcomeCardStep"
import LinkedInConnectionsStep from "./steps/LinkedInConnectionsStep"

// Progress indicator component
import StepProgressBar from "./StepProgressBar"

export interface EventCampaignData {
  campaignName: string
  eventName: string
  eventDate: string
  eventType: string
  recipientSource: "csv" | "eventbrite" | "contactList" | "linkedin" | ""
  csvFile: File | null
  eventbriteEventId: string
  contactListIds: string[]
  linkedInProfiles: Array<{ id: string; name: string; profileUrl: string; imageUrl: string }>
  selectedGiftIds: string[]
  budget: {
    perRecipient: number
    total: number
  }
  message: string
  logoUrl: string
  templateId: string
}

const initialCampaignData: EventCampaignData = {
  campaignName: "",
  eventName: "",
  eventDate: "",
  eventType: "conference",
  recipientSource: "",
  csvFile: null,
  eventbriteEventId: "",
  contactListIds: [],
  linkedInProfiles: [],
  selectedGiftIds: [],
  budget: {
    perRecipient: 50,
    total: 0,
  },
  message: "We look forward to seeing you at the event. Here is a resource for you:",
  logoUrl: "/Logo Final.png",
  templateId: "template1",
}

export default function EventCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState<EventCampaignData>(initialCampaignData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [recipientCount, setRecipientCount] = useState(0)
  const router = useRouter()
  const totalSteps = 8 // Updated to include Outcome Card step

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await fetch("/api/wallet")
        const data = await response.json()
        if (data.success) {
          setWalletBalance(data.wallet?.current_balance || 0)
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error)
      }
    }

    fetchWalletBalance()
  }, [showWalletModal])

  // Update total budget when recipient count changes
  useEffect(() => {
    if (recipientCount > 0 && campaignData.budget.perRecipient > 0) {
      setCampaignData((prev) => ({
        ...prev,
        budget: {
          ...prev.budget,
          total: recipientCount * prev.budget.perRecipient,
        },
      }))
    }
  }, [recipientCount, campaignData.budget.perRecipient])

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const updateCampaignData = (data: Partial<EventCampaignData>) => {
    setCampaignData((prev) => ({ ...prev, ...data }))
  }

  const handleRecipientCountUpdate = (count: number) => {
    setRecipientCount(count)
  }

  const handleCreateCampaign = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if wallet balance is sufficient
      if (walletBalance < campaignData.budget.total) {
        setShowWalletModal(true)
        setIsLoading(false)
        return
      }

      // Create campaign API call
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignData.campaignName || `${campaignData.eventName} Campaign`,
          goal: "delight_event_attendees",
          subGoals: [
            {
              level: 1,
              subGoalName: campaignData.recipientSource === "csv" ? "Upload CSV" : "Connect Event Platform",
              description: "delight_event_attendees",
            },
          ],
          eventDetails: {
            name: campaignData.eventName,
            date: campaignData.eventDate,
            type: campaignData.eventType,
          },
          budget: campaignData.budget,
          giftIds: campaignData.selectedGiftIds,
          outcomeCard: {
            message: campaignData.message,
            logoLink: campaignData.logoUrl,
          },
          outcomeTemplate: {
            type: campaignData.templateId,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create campaign")
      }

      // If CSV file exists, upload it
      if (campaignData.csvFile && data.campaignId) {
        const formData = new FormData()
        formData.append("file", campaignData.csvFile)
        formData.append("campaignId", data.campaignId)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || "Failed to upload CSV")
        }
      }

      // If eventbrite event was selected, import attendees
      if (campaignData.recipientSource === "eventbrite" && campaignData.eventbriteEventId && data.campaignId) {
        const eventbriteResponse = await fetch("/api/eventbrite/import-attendees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: campaignData.eventbriteEventId,
            campaignId: data.campaignId,
          }),
        })

        if (!eventbriteResponse.ok) {
          const eventbriteError = await eventbriteResponse.json()
          throw new Error(eventbriteError.error || "Failed to import attendees")
        }
      }

      // If LinkedIn profiles were selected
      if (campaignData.recipientSource === "linkedin" && campaignData.linkedInProfiles.length > 0 && data.campaignId) {
        const linkedinResponse = await fetch("/api/linkedin/import-connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profiles: campaignData.linkedInProfiles,
            campaignId: data.campaignId,
          }),
        })

        if (!linkedinResponse.ok) {
          const linkedinError = await linkedinResponse.json()
          throw new Error(linkedinError.error || "Failed to import LinkedIn connections")
        }
      }

      // If contact lists were selected, import contacts
      if (campaignData.recipientSource === "contactList" && campaignData.contactListIds.length > 0 && data.campaignId) {
        const contactsResponse = await fetch("/api/recipients/from-lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listIds: campaignData.contactListIds,
            campaignId: data.campaignId,
          }),
        })

        if (!contactsResponse.ok) {
          const contactsError = await contactsResponse.json()
          throw new Error(contactsError.error || "Failed to import contacts")
        }
      }

      // Redirect to campaign details page
      router.push(`/campaign-detail/${data.campaignId}`)
    } catch (error) {
      console.error("Error creating campaign:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Determine which step component to render
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignGoalSelection
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <EventDetailsStep
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <RecipientSourceStep
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 4:
        // Render different components based on recipient source
        if (campaignData.recipientSource === "csv") {
          return (
            <UploadCSVStep
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onBack={handleBack}
              onRecipientCountUpdate={handleRecipientCountUpdate}
            />
          )
        } else if (campaignData.recipientSource === "eventbrite") {
          return (
            <ConnectEventPlatformStep
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onBack={handleBack}
              onRecipientCountUpdate={handleRecipientCountUpdate}
            />
          )
        } else if (campaignData.recipientSource === "linkedin") {
          return (
            <LinkedInConnectionsStep
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onBack={handleBack}
              onRecipientCountUpdate={handleRecipientCountUpdate}
            />
          )
        } else {
          // Default to CSV upload if no selection or invalid selection
          return (
            <UploadCSVStep
              campaignData={campaignData}
              updateCampaignData={updateCampaignData}
              onNext={handleNext}
              onBack={handleBack}
              onRecipientCountUpdate={handleRecipientCountUpdate}
            />
          )
        }
      case 5:
        return (
          <BudgetConfigurationStep
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
            onBack={handleBack}
            recipientCount={recipientCount}
            walletBalance={walletBalance}
          />
        )
      case 6:
        return (
          <GiftSelectionStep
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
            onBack={handleBack}
            budgetPerRecipient={campaignData.budget.perRecipient}
          />
        )
      case 7:
        return (
          <OutcomeCardStep
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 8:
        return (
          <ReviewAndLaunchStep
            campaignData={campaignData}
            onBack={handleBack}
            onSubmit={handleCreateCampaign}
            isLoading={isLoading}
            error={error}
            recipientCount={recipientCount}
            walletBalance={walletBalance}
            onAddFunds={() => setShowWalletModal(true)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Create Event Campaign</h1>
        <p className="text-gray-600 mb-8">Create a personalized gifting campaign for your event attendees</p>

        {/* Progress Steps */}
        <div className="mb-8">
          <StepProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Wallet Funding Modal */}
        {showWalletModal && (
          <WalletFundingModal
            currentBalance={walletBalance}
            requiredAmount={campaignData.budget.total}
            onClose={() => setShowWalletModal(false)}
            onSuccess={() => {
              setShowWalletModal(false)
              // Refresh wallet balance
              fetch("/api/wallet")
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setWalletBalance(data.wallet?.current_balance || 0)
                  }
                })
            }}
          />
        )}
      </div>
    </div>
  )
}

