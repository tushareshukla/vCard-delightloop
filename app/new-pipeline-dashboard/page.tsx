"use client";
import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";

// Static data for the table
const insightsData = [
  {
    _id: "1",
    insightName: "Holiday Gifting Campaign..",
    insightType: "Event",
    status: "Completed",
    records: 200,
    associatedCampaign: "1",
  },
  {
    _id: "2",
    insightName: "Every Gifting 2024.",
    insightType: "ICP Expansions",
    status: "In Queue",
    records: 400,
    associatedCampaign: "2",
  },
  {
    _id: "3",
    insightName: "Command+R",
    insightType: "Reduce Churn",
    status: "Draft",
    records: 250,
    associatedCampaign: "--",
    blurPlaybook: true,
  },
  {
    _id: "4",
    insightName: "Hourglass",
    insightType: "Event",
    status: "Live",
    records: 600,
    associatedCampaign: "2",
  },
  {
    _id: "5",
    insightName: "Layers",
    insightType: "ICP Expansions",
    status: "Live",
    records: 1200,
    associatedCampaign: "-",
  },
  {
    _id: "6",
    insightName: "Quotient",
    insightType: "Reduce Churn",
    status: "Completed",
    records: 600,
    associatedCampaign: "-",
  },
  {
    _id: "7",
    insightName: "Sisyphus",
    insightType: "Event",
    status: "Draft",
    records: 1600,
    associatedCampaign: "-",
    blurPlaybook: true,
  },
];

// Helper for status pill styling
function getStatusPillClasses(status: string) {
  const lower = status.toLowerCase();

  // Base pill classes (shared across all statuses)
  const base = "px-2 py-0.5 rounded-lg text-[12px]";

  // Dot classes (added only if you want a dot)
  const dot =
    " inline-flex items-center gap-1 before:content-[''] before:block before:w-[6px] before:h-[6px] before:rounded-full";

  switch (lower) {
    case "completed":
      // Includes dot
      return base + dot + " bg-[#ECFDF3] text-[#175CD3] before:bg-[#2E90FA]";

    case "live":
      // Includes dot
      return base + dot + " bg-[#ECFDF3] text-[#027A48] before:bg-[#12B76A]";

    case "in queue":
      // No dot
      return base + " bg-[#F9F5FF] text-[#7F56D9]";

    case "draft":
      // No dot
      return base + " bg-[#F2F4F7] text-[#667085]";

    default:
      // Fallback (no dot)
      return base + " bg-gray-100 text-gray-700";
  }
}

export default function Page() {
  return (
    <div className="flex">
      {/* Sidebar (optional) */}
      <AdminSidebar />


      <div className={`pt-3 bg-primary w-full overflow-x-hidden`}>
        <div className=" bg-white rounded-tl-3xl h-[100%]  overflow-x-hidden">
          {/* Header */}
          <div className="bg-white px-6 pt-6 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-[30px] font-semibold text-[#101828]">
                  Delight Sense Insight Dashboard
                </h1>
                <p className="text-[16px] font-[400] text-[#667085]">
                  Track delivery rates, engagement, and ROI in real-time.
                </p>
              </div>

              <Link
                href="#"
                className="bg-[#7F56D9] text-white font-semibold px-4 py-2 rounded-md hover:bg-[#6941C6] duration-300 flex items-center gap-2 text-sm"
              >
                <Image
                  src="/svgs/Shimmer.svg"
                  alt="plus"
                  width={16}
                  height={16}
                />
                New Tracker
              </Link>
            </div>
          </div>
          <hr className="border-gray-100 mx-6" />


          <div className="px-6 py-4 flex justify-between items-center">
              {/* 3 Buttons */}
              <div className="flex flex-row border border-gray-300 rounded-md overflow-hidden divide-x divide-gray-300">
  <button className="px-4 py-2 text-sm font-medium bg-[#F9FAFB] text-[#344054]">
    View all
  </button>
  <button className="px-4 py-2 text-sm font-medium bg-white text-[#344054]">
    In Queue
  </button>
  <button className="px-4 py-2 text-sm font-medium bg-white text-[#344054]">
    Completed
  </button>
</div>

            {/* Search Box */}
            <div className="relative max-w-sm w-full ml-auto">
              <Image
                src="/svgs/search.svg"
                alt="Search"
                width={16}
                height={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-3 py-2 w-full text-sm placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none"
              />
            </div>

            {/* Filters Button */}
            <button className="flex items-center gap-1 text-sm px-3 py-2 border rounded-md bg-white ml-3">
              <Image
                src="/svgs/Filter.svg"
                alt="filter icon"
                width={14}
                height={14}
              />
              Filters
            </button>
          </div>

          {/* Table UI */}
          <div className="px-[24px] py-[12px]">
            <div className="bg-white rounded-md border-y">
              <table className="w-full table-auto text-[12px]">
                <thead className="bg-[#FCFCFD] text-[#667085] border-b">
                  <tr>
                    {/* Insight Name (left-aligned) */}
                    <th className="text-left px-[24px] py-[12px] font-medium">
                      Insight Name
                    </th>
                    {/* The rest (centered) */}
                    <th className="text-center px-[24px] py-[12px] font-medium">
                      Status
                    </th>
                    <th className="text-center px-[24px] py-[12px] font-medium">
                      Records
                    </th>
                    <th className="text-center px-[24px] py-[12px] font-medium">
                      Associated Campaign
                    </th>
                    <th className="text-center px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {insightsData.map((insight) => (
                    <tr key={insight._id} className="hover:bg-gray-50">
                      {/* Insight Name & Sub-label */}
                      <td className="px-[24px] py-3 text-[14px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#1453FF]">
                            {insight.insightName}
                          </span>
                          <span className="text-[14px] text-gray-500">
                            {insight.insightType}
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="px-[24px] py-3 text-center text-[#667085]">
                        <span className={getStatusPillClasses(insight.status)}>
                          {insight.status}
                        </span>
                      </td>

                      {/* Records */}
                      <td className="px-[24px] py-3 text-center text-[#667085]">
                        {insight.records}
                      </td>

                      {/* Associated Campaign */}
                      <td className="px-[24px] py-3 text-center text-[#667085]">
                        {insight.associatedCampaign}
                      </td>

                      {/* Actions */}
                      <td className="px-[24px] items-end py-3">
                        <div className="flex justify-center gap-2">
                          {/* + Playbook */}
                          <button
                            className={`
                              h-[32px]
                              w-[88px]
                              bg-white
                              text-[#7F56D9]
                              border
                              border-[#FFFFFF]
                              rounded-lg
                              text-[12px]
                              font-medium
                              shadow-md
                              ${insight.blurPlaybook ? "opacity-50" : ""}
                            `}
                          >
                            + Playbook
                          </button>

                          {/* + Campaign */}
                          <button
                            className={`
                              h-[32px]
                              w-[88px]
                              bg-[#7F56D9]
                              text-white
                              rounded-lg
                              text-sm
                              font-medium
                              shadow-sm
                              ${insight.blurPlaybook ? "opacity-50" : ""}
                            `}
                          >
                            + Campaign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination UI (purely decorative, no logic) */}
            <div className="flex items-center justify-between mt-4">
              <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600">
                <Image
                  src="/svgs/arrow-left.svg"
                  alt="Prev"
                  width={10}
                  height={10}
                />
                Previous
              </button>
              <div className="flex items-center text-sm text-gray-600 space-x-6">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>...</span>
                <span>9</span>
                <span>10</span>
              </div>

              <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600">
                Next
                <Image src="/svgs/arrow.svg" alt="Next" width={10} height={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
