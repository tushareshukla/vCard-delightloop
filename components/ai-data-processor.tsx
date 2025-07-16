import { motion } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"

export interface CompanyData {
  name: string
  logo: string
  title: string
}

interface AIDataProcessorProps {
  companies: CompanyData[]
  keywords: string[]
  title: string
  statusText: string
  transitionSpeed?: number
}

type AnalysisItem = {
  type: 'company' | 'keyword'
  content: CompanyData | string
}

export default function AIDataProcessor({
  companies,
  keywords,
  title,
  statusText,
  transitionSpeed = 2000 // Default 2 seconds per item
}: AIDataProcessorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasShownCompanies, setHasShownCompanies] = useState(false)
  const [queue, setQueue] = useState<AnalysisItem[]>([])

  useEffect(() => {
    // Initialize the queue with companies first
    const initialQueue = [
      ...companies.map(company => ({ type: 'company', content: company } as AnalysisItem)),
      ...keywords.map(keyword => ({ type: 'keyword', content: keyword } as AnalysisItem))
    ]
    setQueue(initialQueue)
  }, [companies, keywords])

  useEffect(() => {
    if (queue.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1
        
        // If we've shown all companies and current item is the last company
        if (!hasShownCompanies && queue[prevIndex]?.type === 'company' && nextIndex >= companies.length) {
          setHasShownCompanies(true)
          // Skip to keywords
          return companies.length
        }
        
        // If we've finished showing companies, cycle through keywords
        if (hasShownCompanies) {
          // Start from first keyword if we've reached the end
          if (nextIndex >= queue.length) {
            return companies.length // Reset to first keyword
          }
        }
        
        return nextIndex
      })
    }, transitionSpeed)

    return () => clearInterval(timer)
  }, [queue, transitionSpeed, hasShownCompanies, companies.length])

  const currentItem = queue[currentIndex]

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{statusText}</p>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[120px] flex items-center justify-center">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          {currentItem?.type === 'company' ? (
            // Company display
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 relative mb-2">
                <Image
                  src={(currentItem.content as CompanyData).logo}
                  alt={(currentItem.content as CompanyData).name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-sm font-medium text-gray-900">
                {(currentItem.content as CompanyData).name}
              </div>
              <div className="text-xs text-gray-500">
                {(currentItem.content as CompanyData).title}
              </div>
            </div>
          ) : (
            // Keyword display
            <div className="flex flex-col items-center">
              <div className="text-base font-medium text-primary mb-2">
                {currentItem?.content as string}
              </div>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: transitionSpeed / 1000 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 