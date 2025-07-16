import React, { useState, useEffect, useMemo } from 'react';
import { Gift, ThumbsUp, Wallet, Plus, TrendingUp, GiftIcon, Award, CoinsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  trend?: {
    value: number;
    label: string;
  };
  decorativeIcon?: React.ReactNode;
}

const MetricCard = ({ icon, value, label, action, trend, decorativeIcon }: MetricCardProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  console.log("MetricCard received value:", value, typeof value);
  
  // Parse the value correctly whether it's a string, number, or formatted currency
  const targetValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle currency strings like "$75"
      if (value.startsWith('$')) {
        return parseFloat(value.replace(/[$,]/g, '')) || 0;
      }
      // Handle percentage strings like "62.07%"
      if (value.endsWith('%')) {
        return parseFloat(value.replace(/%/g, '')) || 0;
      }
      return parseFloat(value) || 0;
    }
    return 0;
  }, [value]);

  console.log("MetricCard parsed targetValue:", targetValue);

  useEffect(() => {
    // When component mounts or targetValue changes, set the animatedValue directly
    // This ensures immediate display without animation on first render
    if (targetValue > 0) {
      setAnimatedValue(targetValue);
      console.log("MetricCard setting animatedValue to", targetValue);
      return;
    }
    
    // Start from 0
    setAnimatedValue(0);
    
    // Ticker animation
    const steps = 30; // More steps for smoother animation
    const duration = 1200; // Longer duration for more visible counting
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Easing function for natural motion - easeOutExpo
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      // Add some randomness to make it feel more like a ticker
      const randomness = Math.random() * 0.1 - 0.05; // ±5% randomness
      const easedValue = targetValue * (easeOutExpo + randomness);
      
      setAnimatedValue(Math.min(easedValue, targetValue));
      console.log("MetricCard animation step:", currentStep, "value:", Math.min(easedValue, targetValue));

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedValue(targetValue); // Ensure we land on the exact target
        console.log("MetricCard animation complete, final value:", targetValue);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [targetValue]);

  // Format the animated value with proper rounding and handling of decimals
  const displayValue = useMemo(() => {
    console.log("MetricCard calculating displayValue from:", animatedValue, "original value:", value);
    
    if (typeof value === 'string' && value.includes('%')) {
      return `${Math.round(animatedValue)}%`;
    }
    if (typeof value === 'string' && value.includes('$')) {
      return `$${Math.round(animatedValue).toLocaleString()}`;
    }
    // For regular numbers, show one decimal during animation, but round at the end
    const isAnimating = animatedValue !== targetValue;
    return isAnimating 
      ? Math.round(animatedValue * 10) / 10
      : Math.round(animatedValue);
  }, [animatedValue, targetValue, value]);

  console.log("MetricCard final displayValue:", displayValue);

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col border border-gray-200 hover:border-primary/10 transition-all duration-300 group relative overflow-hidden" style={{
      boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
      borderColor: '#EAECF0'
    }}>
      {/* Large decorative icon */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 text-primary/[0.04] group-hover:text-primary/[0.06] pointer-events-none transition-all duration-700 group-hover:translate-x-1/3">
        {decorativeIcon}
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold text-gray-900 tracking-tight tabular-nums">
              {displayValue}
            </div>
            {trend && (
              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                {trend.value}%
              </div>
            )}
            {action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
              >
                <Plus className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                {action.label}
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
};

interface MetricsCardsProps {
  metrics: {
    giftsDelivered: number;
    acknowledgementRate: number;
    walletBalance: number;
    deliveredGrowth?: number;
    acknowledgedGrowth?: number;
  };
  onAddCredits: () => void;
}

export default function MetricsCards({ metrics, onAddCredits }: MetricsCardsProps) {
  // Log the metrics received by the component
  console.log("MetricsCards received data:", metrics);
  
  const formatCurrency = (amount: number) => {
    console.log("Formatting currency amount:", amount, typeof amount);
    
    // Ensure amount is a number
    const numericAmount = Number(amount) || 0;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const LOW_BALANCE_THRESHOLD = 100;
  
  // Calculate the formatted values for direct display
  const walletValue = formatCurrency(metrics.walletBalance);
  console.log("Formatted wallet balance:", walletValue);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <MetricCard
        icon={<Gift className="h-5 w-5" />}
        value={metrics.giftsDelivered}
        label="Gifts Delivered in last 30 days"
        trend={{ value: metrics.deliveredGrowth || 0, label: 'vs last month' }}
        decorativeIcon={<GiftIcon className="w-32 h-32" />}
      />
      <MetricCard
        icon={<ThumbsUp className="h-5 w-5" />}
        value={`${metrics.acknowledgementRate}%`}
        label="Acknowledgement Rate in last 30 days"
        trend={{ value: metrics.acknowledgedGrowth || 0, label: 'vs last month' }}
        decorativeIcon={<Award className="w-32 h-32" />}
      />
      
      {/* Skip animation for wallet display by using direct DOM instead of MetricCard */}
      <div className="bg-white rounded-lg p-6 flex flex-col border border-gray-200 hover:border-primary/10 transition-all duration-300 group relative overflow-hidden" style={{
        boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
        borderColor: '#EAECF0'
      }}>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 text-primary/[0.04] group-hover:text-primary/[0.06] pointer-events-none transition-all duration-700 group-hover:translate-x-1/3">
          <CoinsIcon className="w-32 h-32" />
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-semibold text-gray-900 tracking-tight tabular-nums">
                {walletValue}
              </div>
              {metrics.walletBalance < LOW_BALANCE_THRESHOLD && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddCredits}
                  className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  <Plus className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Add more funds
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Wallet Balance</div>
          </div>
        </div>
      </div>
      
    </div>
  );
} 