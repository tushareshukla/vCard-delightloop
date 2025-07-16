import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface DetailsPageHeaderProps {
  homeIcon?: React.ReactNode;
  pageIcon?: React.ReactNode;
  listPageName: string;
  listPageLink: string;
  pageTitle: string;
  pageDescription?: string;
  entityId?: string;
  motion?: string;
  status?: string;
  launchDate?: string;
  createdBy?: string;
  tags?: Tag[];
  backButtonLabel?: string;
  actionButtons?: React.ReactNode;
  children?: React.ReactNode;
  campaign?: any;
  giftCostModalOpen?: boolean;
  setGiftCostModalOpen?: (open: boolean) => void;
  handleLaunchCampaign?: () => void;
  handleLaunchCampaignLoading?: boolean;
}

export default function DetailsPageHeader({
  homeIcon,
  pageIcon,
  listPageName,
  listPageLink,
  pageTitle,
  pageDescription,
  entityId,
  motion,
  status,
  launchDate,
  createdBy,
  tags = [],
  backButtonLabel = "Back to List",
  actionButtons,
  children,
  campaign,
  giftCostModalOpen,
  setGiftCostModalOpen,
  handleLaunchCampaign,
  handleLaunchCampaignLoading,
}: DetailsPageHeaderProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm mb-4 sm:mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#667085] mb-3 sm:mb-4">
        <Link href="/dashboard">
          <span className="flex items-center">
            {homeIcon || (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 20V14H15V20H19V12H22L12 3L2 12H5V20H9Z" fill="#667085"/>
              </svg>
            )}
          </span>
        </Link>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#D0D5DD" d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"/>
        </svg>
        <Link href={listPageLink}>
          <span className="text-[#667085]">{listPageName}</span>
        </Link>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#D0D5DD" d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"/>
        </svg>
        <span className="text-[#101828] font-medium">{pageTitle}</span>
      </div>

      {/* Page Title with Status Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {pageIcon && <span className="h-6 w-6 sm:h-7 sm:w-7 text-primary">{pageIcon}</span>}
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1B1D21]">
            {pageTitle}
          </h1>
        </div>

<div className="flex items-center gap-2">


        {/* Action Buttons */}
        {campaign?.giftSelectionMode !== "manual" && (
          <div className="flex items-center gap-2">
            {campaign?.status == "ready_for_launch" && (
              <button
                onClick={() => {
                    if (setGiftCostModalOpen) {
                        setGiftCostModalOpen(!giftCostModalOpen);
                    }
                }}
                disabled={handleLaunchCampaignLoading}
                className={`bg-primary text-white px-4 hover:bg-primary/95 text-sm py-2 rounded-md font-semibold flex gap-2 hover:scale-105 transition-all duration-300 ${handleLaunchCampaignLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >

                  <Image
                  src="/svgs/Shimmer.svg"
                  alt="Gift Selection Mode"
                  width={16}
                  height={16}
                  />
                Launch Campaign
                </button>
)}


</div>
)}
        {actionButtons && (
          <div className="flex items-center gap-2">
            {actionButtons}
          </div>
        )}
</div>
      </div>



      {/* Description */}
      {pageDescription && (
        <p className="text-sm text-gray-500 mt-1">{pageDescription}</p>
      )}

      {/* Entity Details Section */}
      {(entityId || motion || status || launchDate || createdBy || tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 border-t border-gray-100 pt-4">
          {/* ID and Motion */}
          <div className="flex flex-wrap items-center gap-3">
            {entityId && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 font-medium">ID:</span>
                <code className="text-sm bg-gray-100 ml-2 px-2 py-1 rounded font-mono">{entityId}</code>
              </div>
            )}

            {motion && (
              <div className="flex items-center">
                <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none px-2 py-1">
                  {motion}
                </Badge>
              </div>
            )}
          </div>

          {/* Status */}
          {status && (
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : status === "draft"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
              }`}>
                {status === "active"
                  ? "Active"
                  : status === "scheduled"
                    ? "Scheduled"
                    : status === "ready_for_launch" ? "Ready For Launch" : status === "matching_gifts" ? "Matching Gifts" : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          )}

          {/* Launch Date and Created By */}
          {(launchDate || createdBy) && (
            <div className="flex items-center gap-4 ml-auto">
              {launchDate && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-1">Launch:</span>
                  <span className="text-sm font-medium">{launchDate}</span>
                </div>
              )}

              {createdBy && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-1">By:</span>
                  <span className="text-sm font-medium">{createdBy}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional content */}
      {children && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
