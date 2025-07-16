"use client";

import { useState, useEffect } from "react";

interface UsePulseAnimationReturn {
  showPulseAnimation: boolean;
  hideAlert: boolean;
  setHideAlert: (hide: boolean) => void;
}

export const usePulseAnimation = (duration: number = 4000): UsePulseAnimationReturn => {
  const [showPulseAnimation, setShowPulseAnimation] = useState(true);
  const [hideAlert, setHideAlert] = useState(false);

  // Control pulse animation - turn off after specified duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulseAnimation(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return {
    showPulseAnimation,
    hideAlert,
    setHideAlert,
  };
}; 