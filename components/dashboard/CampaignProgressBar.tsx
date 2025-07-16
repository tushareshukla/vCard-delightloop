import React from 'react';

interface CampaignProgressBarProps {
  totalRecipients: number;
  delivered: number;
  acknowledged: number;
  className?: string;
}

export default function CampaignProgressBar({
  totalRecipients,
  delivered,
  acknowledged,
  className = '',
}: CampaignProgressBarProps) {
  // Calculate percentages
  const deliveredPercentage = (delivered / totalRecipients) * 100;
  const acknowledgedPercentage = (acknowledged / totalRecipients) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Progress Bar */}
      <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden">
        {/* Delivered Layer */}
        <div
          className="absolute h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${deliveredPercentage}%` }}
        />
        {/* Acknowledged Layer */}
        <div
          className="absolute h-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${acknowledgedPercentage}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Delivered: {delivered}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Acknowledged: {acknowledged}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />
          <span>Total: {totalRecipients}</span>
        </div>
      </div>
    </div>
  );
} 