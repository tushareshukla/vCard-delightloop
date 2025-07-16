"use client";

import React from 'react';
import CampaignProgressStepper from '@/components/ui/CampaignProgressStepper';

interface AnimatedCampaignStepperProps {
  currentStep: 'plan' | 'leads' | 'craft' | 'deliver';
  onStepClick?: (stepId: string) => void;
}

const AnimatedCampaignStepper: React.FC<AnimatedCampaignStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="relative">
      {/* Add the animation keyframes */}
      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes subtle-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(127, 86, 217, 0.2);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 6px 2px rgba(127, 86, 217, 0.3);
            transform: scale(1.05);
          }
        }

        @keyframes line-glow {
          0%, 100% { box-shadow: 0 0 2px 0 rgba(127, 86, 217, 0.5); }
          50% { box-shadow: 0 0 4px 0 rgba(127, 86, 217, 0.8); }
        }

        @keyframes progress-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        .active-step-number {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .active-step-circle {
          animation: subtle-pulse 2s ease-in-out infinite;
          border: 1px solid rgba(127, 86, 217, 0.5);
          transition: all 0.3s ease;
        }

        .completed-step-circle {
          border: 1px solid rgba(127, 86, 217, 0.7);
          transition: all 0.3s ease;
        }

        .completed-line {
          background: linear-gradient(90deg, #7F56D9, #9E77ED, #7F56D9);
          background-size: 200% 100%;
          animation: progress-flow 3s linear infinite, line-glow 2s ease-in-out infinite;
          height: 3px !important;
          border-radius: 2px;
        }

        /* Hover effects for step elements */
        .step-circle {
          transition: all 0.2s ease-in-out;
        }

        .step-item:hover .step-circle:not(.active-step-circle) {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(127, 86, 217, 0.2);
        }

        .step-item:hover .step-number {
          color: #7F56D9;
        }

        .step-item:hover .step-label {
          color: #7F56D9;
        }

        /* Remove bounce animation from entire step, keep only on the number */
        .active-step {
          /* animation removed */
        }
      `}</style>
      
      {/* Custom styling for the CampaignProgressStepper */}
      <style jsx>{`
        :global(.active-step) {
          /* animation removed */
        }
        
        :global(.active-step) :global(.step-circle) {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Original stepper component */}
      <CampaignProgressStepper currentStep={currentStep} onStepClick={onStepClick} />
    </div>
  );
};

export default AnimatedCampaignStepper; 