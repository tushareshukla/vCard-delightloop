"use client";
import { useState, useEffect } from "react";

interface GiftStatusAnimationProps {
  delivered: number;
  inTransits: number;
  total: number;
  hide?: boolean;
}

export default function GiftStatusAnimation({
  delivered,
  inTransits,
  total,
  hide,
}: GiftStatusAnimationProps) {
  // Add state for animated values
  const [animatedDelivered, setAnimatedDelivered] = useState(0);
  const [animatedInTransits, setAnimatedInTransits] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedSuccess, setAnimatedSuccess] = useState(0);
  const [animatedWidth, setAnimatedWidth] = useState({
    delivered: 0,
    inTransits: 0,
    background: 0,
  });

  // Add animation effect with smoother timing
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

      // Animate numbers
      setAnimatedDelivered(Math.round(easedProgress * delivered));
      setAnimatedInTransits(Math.round(easedProgress * inTransits));
      setAnimatedTotal(Math.round(easedProgress * total));
      setAnimatedSuccess(Math.round(easedProgress * 98)); // Animate success percentage

      // Animate widths including background
      setAnimatedWidth({
        delivered: ((easedProgress * delivered) / total) * 100,
        inTransits: ((easedProgress * inTransits) / total) * 100,
        background: easedProgress * 100,
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [delivered, inTransits, total]);

  return (
    <div className={`rounded-lg grid ${hide ? "py-4" : "border-[1px] p-4 border-[#D2CEFE] w-[458px] h-[193px] justify-center "}    items-center `}>
      {/* //! main text */}
      {!hide && (
      <div className="flex justify-between items-center">
        <p className="text-[16px] font-[600] ">Gifts Status</p>
        <p className="   text-[24px] font-[700]">{animatedTotal}</p>
      </div>
      )}

      {/* //! Progress Bar */}
      <div className="relative min-w-[421px]  h-4 overflow-hidden rounded-full">
        {/* Background container with animation */}
        <div
          style={{ width: `${animatedWidth.background}%` }}
          className="absolute inset-0 bg-[#DBCDFA] transition-all duration-300 ease-out rounded-full"
        ></div>

        {/* //? delivered */}
        <div
          style={{ width: `${animatedWidth.delivered}%` }}
          className={`h-2.5 rounded-full z-10 absolute top-[3px] left-[3px] bg-[linear-gradient(270deg,#43D774_8.82%,#E3F2FF_95.29%)] transition-all duration-300 ease-out`}
        ></div>
        {/* //? inTransits */}
        <div
          style={{ width: `${animatedWidth.inTransits}%` }}
          className={`absolute h-4 rounded-full bg-[linear-gradient(270deg,#6941C6_8.82%,#43A7FF_95.29%)] transition-all duration-300 ease-out`}
        ></div>
      </div>

      {/* //! Status Indicators */}
      {!hide && (
      <div className="flex gap-4 mb-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-green-500"></div>
          <span className="text-black font-medium">Delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[#6941C6]"></div>
          <span className="text-black font-medium">In Transits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[#D2CEFE]"></div>
          <span className="text-black font-medium">Total</span>
        </div>
        </div>
      )}

      {/* //! Delivery success with animated arrow and percentage */}
      {!hide && (
      <div className="flex items-center justify-center gap-2">
        <svg
          className={`size-4 text-[#027A48] transition-all duration-1000 ease-out ${
            animatedSuccess > 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
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
              animatedSuccess > 0 ? 'stroke-dashoffset-0' : 'stroke-dashoffset-100'
            }`}
          />
        </svg>
        <span className="text-[#027A48] text-[14px] font-[500] transition-all duration-300">
          Delivery success: {animatedSuccess}%
          </span>
        </div>
      )}
    </div>
  );
}
