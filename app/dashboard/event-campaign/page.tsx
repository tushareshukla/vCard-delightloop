"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Image from "next/image";
import Link from "next/link";
import EventCampaignWizard from "@/components/dashboard/event-campaign/EventCampaignWizard";
import { useAuth } from "@/app/context/AuthContext";

export default function EventCampaignPage() {
  const { authToken, isLoadingCookies } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCookies && !authToken) {
      router.push("/");
    }
  }, [authToken, isLoadingCookies, router]);

  if (isLoadingCookies) {
    return (
      <div className="flex h-screen flex-col sm:flex-row">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto pb-10 sm:pb-0">
            <div className="flex justify-center items-center h-[80vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden">
        <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto pb-10 sm:pb-0">
          <EventCampaignWizard />
        </div>
      </div>
    </div>
  );
}
