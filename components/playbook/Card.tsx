"use client";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Play } from "lucide-react";

interface CardProps {
  title: string;
  budget: number;
  categories: string[];
  personalization: boolean;
  deliveryType: string;
  ctaTracking: string;
  printOptions: string;
  onClick: () => void;
  selected: boolean;
  status?: string;
  onView?: () => void;
  onEdit?: () => void;
  onRun?: () => void;
}

export default function Card({
  title,
  budget,
  categories,
  personalization,
  deliveryType,
  ctaTracking,
  printOptions,
  onClick,
  selected,
  status = "Active",
  onView,
  onEdit,
  onRun,
}: CardProps) {
  return (
    <div className=" bg-white rounded-lg  border-[#D2CEFE] border-[1px] pt-5 p-6 relative">
      {/* //! --------- Card Header --------- */}
      <div className="flex items-center justify-between ">
        <h1 className="font-semibold">{title}</h1>
        {/* three dots */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid gap-0.5 cursor-pointer hover:bg-[#F9F5FF] duration-300 px-3.5 -mr-2.5 -mb-1.5 py-2 rounded-full ">
              <MoreVertical className="w-5 h-5 text-[#101828]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem
              onClick={onView}
              className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onEdit}
              className="dl-dropdown-item hover:bg-gray-100 transition-colors duration-200"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* //! --------- Card Body --------- */}
      <div className="pt-2.5">
        {/* //? ------ 1 ------ */}
        <div className="text-sm font-semibold text-[#667085D6]">
          Individual Gift Budget:{" "}
          <span className="text-[#101828]">${budget}</span>
        </div>
        {/* //? ------ 2 ------ */}
        {/* <div className="text-sm font-semibold text-[#667085D6] grid gap-2.5 mt-4">
          Gift Catalog:
          <div className="flex items-center font-medium text-xs gap-2">
            {categories.map((category, index) => (
              <div key={index} className={`${index === 0 ? "bg-[#FEF3F2] text-[#B42318]" : index === 1 ? "bg-[#F8F9FC] text-[#363F72]" : "bg-[#ECFDF3] text-[#027A48]"} rounded-full px-3 py-1`}>
                {category}
              </div>
            ))}
          </div>
        </div> */}
        {/* //? ------ 3 ------ */}
        <div className="grid gap-3.5 mt-4">
          {/* 1 */}
          <div className="text-sm font-semibold text-[#667085D6]">
            Hyper-personalization:{" "}
            <span className="text-[#101828]">
              {personalization ? "Yes" : "No"}
            </span>
          </div>
          {/* 2 - Delivery Type with Status Badge */}
          <div className="text-sm font-semibold text-[#667085D6] flex justify-between items-center">
            <div>
              Delivery Type:{" "}
              <span className="text-[#101828]">{deliveryType}</span>
            </div>
            <div
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                status === "Active"
                  ? "bg-[#ECFDF3] text-[#027A48]"
                  : status === "Pending"
                  ? "bg-[#FFF8EB] text-[#B54708]"
                  : status === "Draft"
                  ? "bg-[#F9FAFB] text-[#344054]"
                  : "bg-[#EEF4FF] text-[#175CD3]"
              }`}
            >
              {status}
            </div>
          </div>
          {/* 3 - CTA Tracking - Hidden */}
          {/* <div className="text-sm font-semibold text-[#667085D6]">
            CTA Tracking: <span className="text-[#101828]">{ctaTracking}</span>
          </div> */}
          {/* 4 - Print Options - Hidden */}
          {/* <div className="text-sm font-semibold text-[#667085D6]">
            Print Options: <span className="text-[#101828]">{printOptions}</span>
          </div> */}
        </div>

        {/* Status Badge - Removed as it's now on the same line as Delivery Type */}

        {/* //? ------ 4 - Run Button ------ */}
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onRun}
            className="group relative flex items-center gap-2 bg-primary text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
          >
            <Play className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform duration-200" />
            <span className="tracking-wide">Run</span>
          </button>
        </div>

        {/* //? ------ Original Eye icon and Select button - Hidden 
        <div className="flex items-center justify-between gap-2 mt-2  ">
          <Image
            src="/partner-integrations/eye.svg"
            alt="eye"
            className="cursor-pointer hover:scale-110 duration-300"
            width={20}
            height={20}
          />
          <button className={`text-sm font-medium  mr-2 px-6 py-2  rounded-md ${selected ? "bg-[#7F56D9]   hover:bg-[#6941C6]  text-white" : "border border-[#D0D5DD]   hover:bg-gray-50    text-[#344054]  " }`} onClick={onClick}>
            {selected ? "Selected" : "Select"}
          </button>
        </div>
        */}
      </div>
    </div>
  );
}
