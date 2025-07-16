"use client"

import { useState, useEffect } from "react"
import type { EventCampaignData } from "../EventCampaignWizard"
import { motion } from "framer-motion"
import { Check, ExternalLink } from "lucide-react"

interface EventbriteEvent {
  id: string
  name: {
    text: string
    html: string
  }
  start: {
    timezone: string
    local: string
    utc: string
  }
  end: {
    timezone: string
    local: string
    utc: string
  }
  status: string
}

interface ConnectEventPlatformStepProps {
  campaignData: EventCampaignData
  updateCampaignData: (data: Partial<EventCampaignData>) => void
  onNext: () => void
  onBack: () => void
  onRecipientCountUpdate: (count: number) => void
}

export default function ConnectEventPlatformStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
  onRecipientCountUpdate,
}: ConnectEventPlatformStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<EventbriteEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [attendeeCount, setAttendeeCount] = useState<number>(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [importMessage, setImportMessage] = useState("")

  // Fetch Eventbrite events on component mount
  useEffect(() => {
    fetchEvents()
  }, [])

  // Update parent component with attendee count
  useEffect(() => {
    onRecipientCountUpdate(attendeeCount)
  }, [attendeeCount, onRecipientCountUpdate])

  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would call your API
      // For demo purposes, we'll simulate the API call
      setTimeout(() => {
        const mockEvents: EventbriteEvent[] = [
          {
            id: "event_123",
            name: {
              text: "Annual Customer Conference 2025",
              html: "<p>Annual Customer Conference 2025</p>",
            },
            start: {
              timezone: "America/Los_Angeles",
              local: "2025-06-15T09:00:00",
              utc: "2025-06-15T16:00:00Z",
            },
            end: {
              timezone: "America/Los_Angeles",
              local: "2025-06-17T17:00:00",
              utc: "2025-06-18T00:00:00Z",
            },
            status: "live",
          },
          {
            id: "event_456",
            name: {
              text: "Product Launch Webinar",
              html: "<p>Product Launch Webinar</p>",
            },
            start: {
              timezone: "America/New_York",
              local: "2025-05-20T11:00:00",
              utc: "2025-05-20T15:00:00Z",
            },
            end: {
              timezone: "America/New_York",
              local: "2025-05-20T12:30:00",
              utc: "2025-05-20T16:30:00Z",
            },
            status: "live",
          },
          {
            id: "event_789",
            name: {
              text: "Partner Workshop Series",
              html: "<p>Partner Workshop Series</p>",
            },
            start: {
              timezone: "Europe/London",
              local: "2025-07-10T10:00:00",
              utc: "2025-07-10T09:00:00Z",
            },
            end: {
              timezone: "Europe/London",
              local: "2025-07-12T16:00:00",
              utc: "2025-07-12T15:00:00Z",
            },
            status: "live",
          },
        ]

        setEvents(mockEvents)
        setIsLoading(false)
      }, 1500)
    } catch (err) {
      setError("Failed to load events. Please try again.")
      setIsLoading(false)
    }
  }

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    updateCampaignData({ eventbriteEventId: eventId })
  }

  const handleImportAttendees = async () => {
    if (!selectedEventId) return

    setIsImporting(true)
    setError(null)

    try {
      // In a real implementation, this would call your API
      // For demo purposes, we'll simulate the API call
      setTimeout(() => {
        // Simulate random number of attendees
        const count = Math.floor(Math.random() * 50) + 20
        setAttendeeCount(count)
        setImportMessage(`Successfully imported ${count} attendees`)
        setImportComplete(true)
        setIsImporting(false)
      }, 2000)
    } catch (err) {
      setError("Failed to import attendees. Please try again.")
      setIsImporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Connect Event Platform</h2>
      <p className="text-gray-600 mb-8">Select an event from Eventbrite to import your attendees</p>

      {/* Instructions */}
      <div className="flex items-start text-sm gap-3 mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex-shrink-0 mt-0.5">
          <Check className="w-5 h-5 text-blue-500" />
        </div>
        <p className="leading-5">
          Select an event from the list below to import your attendees. We'll help you create personalized gifts for
          each attendee based on their profile.
        </p>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
        <table className="w-full bg-white">
          <thead className="border-b sticky top-0 bg-white z-10 border-gray-200 text-gray-700 text-xs">
            <tr className="uppercase">
              <th className="p-3 text-left pl-6 w-[50px]"></th>
              <th className="p-3 text-left pl-6">Event Name</th>
              <th className="p-3 text-left pl-6">Start Date</th>
              <th className="p-3 text-left pl-6">End Date</th>
              <th className="p-3 text-left px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 w-full">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="p-3 pl-6">
                    <input
                      type="radio"
                      name="event"
                      value={event.id}
                      checked={selectedEventId === event.id}
                      onChange={() => handleEventSelect(event.id)}
                      className="h-4 w-4 text-primary focus:ring-primary cursor-pointer rounded-full border-gray-300"
                    />
                  </td>
                  <td className="p-3 pl-6 text-sm text-gray-800 font-medium">
                    <div className="flex flex-col">
                      <span>{event.name.text}</span>
                    </div>
                  </td>
                  <td className="p-3 pl-6 text-sm text-gray-600">{formatDate(event.start.local)}</td>
                  <td className="p-3 pl-6 text-sm text-gray-600">{formatDate(event.end.local)}</td>
                  <td className="p-3 pl-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${event.status === "live" ? "bg-green-500" : "bg-yellow-500"}`}
                      ></div>
                      <span className="capitalize">{event.status}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Import Button */}
      {selectedEventId && !importComplete && (
        <div className="flex justify-center mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleImportAttendees}
            disabled={isImporting}
            className={`flex items-center justify-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-lg transition-colors ${
              isImporting ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90"
            }`}
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Importing Attendees...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Import Attendees</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Import Complete Message */}
      {importComplete && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-700">{importMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
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
          disabled={!importComplete || isImporting}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            importComplete && !isImporting
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

