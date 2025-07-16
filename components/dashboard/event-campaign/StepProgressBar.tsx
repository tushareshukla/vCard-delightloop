import React from "react"
import { Check, Target, Calendar, Users, Upload, Gift, Wallet, Layout, Rocket } from "lucide-react"

interface StepProgressBarProps {
  currentStep: number
  totalSteps: number
}

export default function StepProgressBar({ currentStep, totalSteps }: StepProgressBarProps) {
  const stages = [
    { id: 1, label: "Campaign Goal", icon: <Target className="w-5 h-5" /> },
    { id: 2, label: "Event Details", icon: <Calendar className="w-5 h-5" /> },
    { id: 3, label: "Recipient Source", icon: <Users className="w-5 h-5" /> },
    { id: 4, label: "Import Recipients", icon: <Upload className="w-5 h-5" /> },
    { id: 5, label: "Set Budget", icon: <Wallet className="w-5 h-5" /> },
    { id: 6, label: "Select Gifts", icon: <Gift className="w-5 h-5" /> },
    { id: 7, label: "Outcome Card", icon: <Layout className="w-5 h-5" /> },
    { id: 8, label: "Review & Launch", icon: <Rocket className="w-5 h-5" /> },
  ]

  const isStageComplete = (stageId: number) => {
    return stageId < currentStep
  }

  const isCurrentStage = (stageId: number) => {
    return stageId === currentStep
  }

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden md:flex items-center justify-between w-full">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center relative
                  ${
                    isStageComplete(stage.id)
                      ? "bg-primary"
                      : isCurrentStage(stage.id)
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-gray-100"
                  }
                  ${isCurrentStage(stage.id) ? "animate-pulse shadow-md" : ""}
                `}
              >
                {isStageComplete(stage.id) ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <div
                    className={`w-5 h-5 flex items-center justify-center ${isCurrentStage(stage.id) ? "text-primary" : "text-gray-400"}`}
                  >
                    {stage.icon}
                  </div>
                )}
              </div>
              <span
                className={`mt-2 text-xs
                ${
                  isCurrentStage(stage.id)
                    ? "text-primary font-semibold"
                    : isStageComplete(stage.id)
                      ? "text-primary"
                      : "text-gray-500"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-2
                ${isStageComplete(stages[index + 1].id) ? "bg-primary" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-primary">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="text-sm text-gray-500">{stages[currentStep - 1]?.label || "Step"}</div>
        </div>
        <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

