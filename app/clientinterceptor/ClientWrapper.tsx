"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import InfinityLoader from "@/components/common/InfinityLoader";
import AuthStateManager from "../components/AuthStateManager";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import("@/utils/fetchIntercepter"); 
  }, []);

  return (
    <>
      <AuthStateManager />
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
            <InfinityLoader width={64} height={64} />
          </div>
        }
      >
        {children}
      </Suspense>
    </>
  );
}
