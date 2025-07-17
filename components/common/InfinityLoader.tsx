"use client";

import dynamic from 'next/dynamic';

// Dynamically import Lottie with a fallback that matches the animation style
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center">
      <svg className="animate-spin" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" stroke="#E9D7FE" strokeWidth="2" fill="none"/>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#6941C6"
          strokeWidth="2"
          fill="none"
          strokeDasharray="20 80"
        />
      </svg>
    </div>
  )
});

interface InfinityLoaderProps {
  width?: number;
  height?: number;
  className?: string;
}

const InfinityLoader = ({
  width = 24,
  height = 24,
  className = "",
}: InfinityLoaderProps) => {
  const style = {
    width,
    height,
  };

  return (
    <div style={style} className={className}>
      <Lottie
        animationData={require('@/public/infinity.json')}
        loop={true}
        autoplay={true}
        style={style}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid slice",
        }}
      />
    </div>
  );
};

export default InfinityLoader;
