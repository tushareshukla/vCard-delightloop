"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CampaignProgressStepperProps {
  currentStep: "plan" | "leads" | "craft" | "deliver";
  onStepClick?: (stepId: string) => void;
}

export default function CampaignProgressStepper({
  currentStep,
  onStepClick,
}: CampaignProgressStepperProps) {
  const steps = [
    { id: "plan", number: "1", label: "Motion", subLabel: "Campaign details" },
    { id: "leads", number: "2", label: "Recipients", subLabel: "Add contacts" },
    {
      id: "craft",
      number: "3",
      label: "Recipients Experience",
      subLabel: "Design gifting",
    },
    {
      id: "deliver",
      number: "4",
      label: "Summary",
      subLabel: "Review & launch",
    },
  ];

  // Track the furthest step reached in component state
  const [furthestStep, setFurthestStep] = useState(currentStep);

  // Update furthest step when current step changes
  useEffect(() => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    const furthestIndex = steps.findIndex((step) => step.id === furthestStep);

    if (currentIndex > furthestIndex) {
      setFurthestStep(currentStep);
    }
  }, [currentStep, furthestStep]);

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.id === currentStep);
  };

  const getFurthestStepIndex = () => {
    return steps.findIndex((step) => step.id === furthestStep);
  };

  const isStepComplete = (stepId: string) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    return stepIndex < currentIndex; // Only previous steps are complete
  };

  const isCurrentStep = (stepId: string) => {
    return stepId === currentStep;
  };

  const handleStepClick = (stepId: string) => {
    const clickedStepIndex = steps.findIndex((step) => step.id === stepId);
    const furthestStepIndex = getFurthestStepIndex();

    // Allow clicking on any step up to the furthest step reached
    if (clickedStepIndex <= furthestStepIndex) {
      if (onStepClick) {
        onStepClick(stepId);
      }
    }
  };

  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = isStepComplete(step.id);
        const isCurrent = isCurrentStep(step.id);
        const furthestStepIndex = getFurthestStepIndex();
        const isClickable = index <= furthestStepIndex;

        return (
          <React.Fragment key={step.id}>
            <div
              className={`flex flex-col items-center step-item ${
                isCurrent ? "active-step" : ""
              }
                ${
                  isClickable
                    ? "cursor-pointer hover:opacity-100"
                    : "opacity-60"
                }`}
              onClick={() => isClickable && handleStepClick(step.id)}
              role={isClickable ? "button" : undefined}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div
                className={`size-10 rounded-full flex items-center justify-center relative step-circle
                  ${
                    isCompleted
                      ? "bg-purple-100 completed-step-circle"
                      : isCurrent
                      ? "bg-purple-100"
                      : "bg-gray-100"
                  }
                  ${isCurrent ? "active-step-circle" : ""}
                  ${isClickable ? "hover:shadow-md transition-shadow" : ""}
                  ${isCompleted && isClickable ? "hover:bg-purple-200" : ""}
                `}
              >
                {isCompleted ? (
                  <span className="text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    className={`text-lg font-semibold step-number
                    ${
                      isCompleted || isCurrent
                        ? "text-primary"
                        : "text-gray-400"
                    }
                    ${isCurrent ? "active-step-number" : ""}
                  `}
                  >
                    {step.number}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center mt-2">
                <span
                  className={`text-sm font-semibold step-label
                  ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                      ? "text-primary"
                      : "text-gray-500"
                  } ${
                    isClickable
                      ? "hover:text-primary hover:underline transition-colors"
                      : ""
                  }
                `}
                >
                  {step.label}
                </span>
                <span className="text-xs text-gray-500">{step.subLabel}</span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] transition-all duration-300
                ${
                  isStepComplete(steps[index + 1].id)
                    ? "bg-primary completed-line"
                    : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
