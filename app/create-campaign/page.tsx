"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Image from "next/image";
import Link from "next/link";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { authToken, isLoadingCookies, userId, organizationId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If auth is loaded and user is not authenticated, redirect to login
    if (!isLoadingCookies && (!authToken || !userId || !organizationId)) {
      router.push("/auth/login");
      return;
    }

    // If auth is loaded and user is authenticated, show the page
    if (!isLoadingCookies && authToken && userId && organizationId) {
      setIsLoading(false);
    }
  }, [isLoadingCookies, authToken, userId, organizationId, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading campaign creation...</p>
        </div>
      </div>
    );
  }

  // Main campaign creation interface
  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full">
        <div className="p-6 bg-[#F9FAFB] sm:rounded-tl-3xl h-[100%]">
          {/* Header Section with Border */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#667085] mb-4">
              <Link href="/dashboard">
                <Image
                  src="/svgs/home.svg"
                  alt="Home"
                  width={18}
                  height={18}
                />
              </Link>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#D0D5DD"
                  d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                />
              </svg>
              <Link
                href="/campaigns"
                className="text-[#667085] font-medium hover:text-[#101828]"
              >
                Campaign List
              </Link>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#D0D5DD"
                  d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                />
              </svg>
              <span className="text-[#101828] font-medium">
                Create Campaign
              </span>
            </div>

            {/* Page Title */}
            <h1 className="text-[28px] font-semibold text-[#1B1D21]">
              Create Campaign
            </h1>
            <p className="text-[#667085] text-xs font-medium">
              Start a new campaign
            </p>
          </div>

          {/* Campaign Creation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Create from Event */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4">Create from Event</h2>
              <p className="text-gray-600 mb-6">
                Create a campaign based on an existing event in your organization.
              </p>
              <button
                onClick={() => router.push("/event")}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Select Event
              </button>
            </div>

            {/* Option 2: Create from Scratch */}
            {/* <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Create from Scratch</h2>
              <p className="text-gray-600 mb-6">
                Start a new campaign without an existing event.
              </p>
              <button
                onClick={() => router.push("/create-campaign/new")}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create New
              </button>
            </div> */}

            {/* remove this button code  and uncomment upper button code once the above issue is fixed */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Create from Scratch</h2>
              <p className="text-gray-600 mb-6">
              Start a new campaign without an existing event.
              </p>
              <Link href="/create-campaign/1"
              className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-lg "
              title="Coming soon"
              >
              Create New
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
