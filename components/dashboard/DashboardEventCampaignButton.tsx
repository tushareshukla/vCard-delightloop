"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, ChevronRight } from "lucide-react"

export default function DashboardEventCampaignButton() {
  const router = useRouter()

  const handleClick = () => {
    router.push("/dashboard/event-campaign")
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 p-2 rounded-full">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Create Event Campaign</h3>
          <p className="text-gray-600 text-sm">
            Send personalized gifts to your event attendees with our AI-powered gifting platform
          </p>
        </div>
        <div className="flex items-center justify-center bg-primary text-white rounded-full p-2">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}

