"use client";

import InfinityLoader from "@/components/common/InfinityLoader";

export default function VCardLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
      <div className="text-center">
        <InfinityLoader width={64} height={64} />
      </div>
    </div>
  );
} 