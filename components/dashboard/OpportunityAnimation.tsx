"use client";
import { useState, useEffect } from "react";

interface OpportunityAnimationProps {
  opportunities: number;
  value: number;
}

export default function OpportunityAnimation({
  opportunities,
  value,
}: OpportunityAnimationProps) {
  // Add states for animated values
  const [animatedOpportunities, setAnimatedOpportunities] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const interval = 16;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const easeOutCubic = (t: number) => {
        return 1 - Math.pow(1 - t, 5);
      };

      const easedProgress = easeOutCubic(progress);

      // Animate all numbers
      setAnimatedOpportunities(Math.round(easedProgress * opportunities));
      setAnimatedValue(Math.round(easedProgress * value));
      setAnimatedPercentage(Math.round(easedProgress * 18)); // Assuming 18% is the target

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [opportunities, value]);

  return (
    <div className="rounded-lg grid    border-[1px] border-[#D2CEFE] h-[193px]  w-[350px] p-4  items-center">
        {/* //! opportuninty */}
      <h2 className="text-[16px] font-[600] text-black  mt--3 ">
        Total Opportunities Generated
      </h2>
      {/* //! oportunity and vlause in us  */}
      <div className="flex justify-between items-center  text-[13px]">
      <div className="flex flex-col items-center justify-center">
  <p className="text-[32px] font-[800]">{animatedOpportunities}</p>
  <p className="text-black font-semibold">Opportunities</p>
</div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-[32px] font-[800] mb-1 text-end">${animatedValue.toLocaleString()}</p>
          <p className="text-black  font-semibold text-center ">Value US$</p>
        </div>
      </div>
      {/* //! percentage */}
      <div className=" flex items-center justify-center gap-2 ">
        <svg
          className={`w-4 h-4 text-[#027A48] transition-all duration-1000 ease-out ${
            animatedPercentage > 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M8 4L8 12M8 4L4 8M8 4L12 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              animatedPercentage > 0 ? 'stroke-dashoffset-0' : 'stroke-dashoffset-100'
            }`}
          />
        </svg>
        <span className="text-[#027A48] font-medium">
          {animatedPercentage}%
        </span>
      </div>
    </div>
  );
}
