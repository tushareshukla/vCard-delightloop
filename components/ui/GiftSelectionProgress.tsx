'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface GiftSelectionProgressProps {
  currentStep: number;
}

export default function GiftSelectionProgress({ currentStep }: GiftSelectionProgressProps) {
  const stages = [
    { id: 0, label: 'Choose Recipient', icon: '/svgs/search.svg' },
    { id: 1, label: 'Select Gift', icon: '/svgs/gift-box.svg' },
    { id: 2, label: 'Send Gift', icon: '/svgs/box.svg' },
  ];

  const isStageComplete = (stageId: number) => {
    return stageId < currentStep;
  };

  const isCurrentStage = (stageId: number) => {
    return stageId === currentStep;
  };

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
        
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center relative
                ${isStageComplete(stage.id)
                  ? 'bg-primary'
                  : isCurrentStage(stage.id)
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-100'}
                ${isCurrentStage(stage.id)
                  ? 'animate-float shadow-lg'
                  : ''}
              `}
            >
              {isStageComplete(stage.id) ? (
                <Image
                  src={stage.icon}
                  alt={stage.label}
                  width={24}
                  height={24}
                  className="brightness-0 invert"
                />
              ) : (
                <Image
                  src={stage.icon}
                  alt={stage.label}
                  width={24}
                  height={24}
                  className={`${isStageComplete(stage.id) ? 'brightness-0 invert' : 'text-gray-400'}`}
                />
              )}
            </div>
            <span className={`mt-2 text-sm
              ${isCurrentStage(stage.id)
                ? 'text-primary font-semibold'
                : isStageComplete(stage.id)
                  ? 'text-primary'
                  : 'text-gray-500'
              }`}
            >
              {stage.label}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={`flex-1 h-[2px] mx-4
              ${isStageComplete(stages[index + 1].id)
                ? 'bg-primary'
                : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
