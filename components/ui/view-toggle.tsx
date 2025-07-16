"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ViewToggleOption {
  value: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}

interface ViewToggleProps {
  options: ViewToggleOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function ViewToggle({ 
  options, 
  value, 
  onValueChange,
  className 
}: ViewToggleProps) {
  return (
    <div className={cn(
      "flex items-center border border-gray-300 rounded-lg p-1 bg-gray-50",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "p-2 rounded-md transition-all duration-200",
            value === option.value
              ? "bg-white text-gray-900 shadow-md border border-gray-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
          )}
          title={option.title}
        >
          <option.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
} 