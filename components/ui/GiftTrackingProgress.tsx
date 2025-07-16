'use client';

import React from 'react';
import Image from 'next/image';

interface GiftTrackingProgressProps {
  currentStatus: 'processing' | 'shipping' | 'delivered' | 'acknowledged';
  giftSendPage?: boolean;
}

export default function GiftTrackingProgress({ currentStatus, giftSendPage }: GiftTrackingProgressProps) {
  const stages = [
    { id: 'processing', label: 'Processing', icon: '/svgs/gift-box.svg' },
    { id: 'shipping', label: 'Shipping', icon: '/svgs/truck.svg' },
    { id: 'delivered', label: 'Delivered', icon: '/svgs/check-circle.svg' },
    {
      id: 'acknowledged',
      label: 'Acknowledged',
      icon: '/svgs/Heart-Black.svg'
    },
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === currentStatus);
  };

  const isStageComplete = (stageId: string) => {
    const currentIndex = getCurrentStageIndex();
    const stageIndex = stages.findIndex(stage => stage.id === stageId);
    return stageIndex <= currentIndex;
  };

  const isCurrentStage = (stageId: string) => {
    return stageId === currentStatus;
  };

  return (
    <div className={` items-center justify-between w-full max-w-3xl mx-auto flex`}>
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center">
            <div
              className={` ${giftSendPage ? 'size-9 sm:size-12' : 'size-12'} rounded-full flex items-center justify-center relative
                ${isStageComplete(stage.id)
                  ? 'bg-primary'
                  : 'bg-gray-100'}
                ${isCurrentStage(stage.id)
                  ? 'animate-float shadow-lg'
                  : ''}
              `}
            >
              <Image
                src={stage.icon}
                alt={stage.label}
                width={24}
                height={24}
                className={`${isStageComplete(stage.id) ? 'brightness-0 invert' : 'text-gray-400'} ${giftSendPage ? 'size-4 sm:size-6' : ''}`}
              />
            </div>
            <span className={`mt-2 text-sm
              ${isCurrentStage(stage.id)
                ? 'text-primary font-semibold'
                : isStageComplete(stage.id)
                  ? 'text-primary'
                  : 'text-gray-500'
              } ${giftSendPage ? 'text-xs sm:text-sm' : ''}`}
            >
              {stage.label}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={`flex-1 h-[2px]
              ${isStageComplete(stages[index + 1].id)
                ? 'bg-primary'
                : 'bg-gray-200'
              } ${giftSendPage ? 'mx-2 sm:mx-4' : 'mx-4'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
