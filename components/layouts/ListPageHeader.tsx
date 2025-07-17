import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ListPageHeaderProps {
  homeIcon?: React.ReactNode;
  pageIcon?: React.ReactNode;
  parentPageName?: string;
  parentPageLink?: string;
  pageName: string;
  pageTitle: string;
  pageDescription: string;
  createButtonLabel: string;
  createButtonLink: string;
  createButtonOnClick?: () => void;
  createButtonIcon?: React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterCount?: number;
  children?: React.ReactNode;
  secondaryButtonLabel?: string;
  secondaryButtonLink?: string;
  secondaryButtonOnClick?: () => void;
  secondaryButtonIcon?: React.ReactNode;
  hideFilters?: boolean;
}

export default function ListPageHeader({
  homeIcon,
  pageIcon,
  parentPageName,
  parentPageLink,
  pageName,
  pageTitle,
  pageDescription,
  createButtonLabel,
  createButtonLink,
  createButtonOnClick,
  createButtonIcon,
  searchValue,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterCount,
  children,
  secondaryButtonLabel,
  secondaryButtonLink,
  secondaryButtonOnClick,
  secondaryButtonIcon,
  hideFilters,
}: ListPageHeaderProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm mb-4 sm:mb-6 hover:shadow-md transition-shadow ">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#667085] mb-3 sm:mb-4">
        <Link href="/manage-vcard">
          <span className="flex items-center">
            {homeIcon || (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 20V14H15V20H19V12H22L12 3L2 12H5V20H9Z"
                  fill="#667085"
                />
              </svg>
            )}
          </span>
        </Link>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="#D0D5DD"
            d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
          />
        </svg>
        {parentPageName && parentPageLink ? (
          <>
            <Link href={parentPageLink}>
              <span className="text-[#667085] hover:text-[#101828] transition-colors cursor-pointer">
                {parentPageName}
              </span>
            </Link>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#D0D5DD"
                d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
              />
            </svg>
            <span className="text-[#101828] font-medium">{pageName}</span>
          </>
        ) : (
          <span className="text-[#101828] font-medium">{pageName}</span>
        )}
      </div>

      {/* Page Title and Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-0">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1B1D21] flex items-center">
            {pageIcon && (
              <span className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-primary">
                {pageIcon}
              </span>
            )}
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{pageDescription}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {createButtonOnClick ? (
            <Button
              className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
              style={{
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                transform: "translateY(0)",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                cursor: "pointer",
              }}
              onClick={createButtonOnClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
              }}
            >
              <span className="mr-3">
                {createButtonIcon || <Plus className="h-4 w-4" />}
              </span>
              {createButtonLabel}
            </Button>
          ) : (
            <Link href={createButtonLink} className="w-full sm:w-auto">
              <Button
                className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
                style={{
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: "translateY(0)",
                  boxShadow:
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                }}
              >
                <span className="mr-3">
                  {createButtonIcon || <Plus className="h-4 w-4" />}
                </span>
                {createButtonLabel}
              </Button>
            </Link>
          )}

          {secondaryButtonLabel &&
            (secondaryButtonOnClick ? (
              <Button
                className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                style={{
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: "translateY(0)",
                  boxShadow:
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                  cursor: "pointer",
                }}
                onClick={secondaryButtonOnClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                }}
              >
                <span className="mr-3">
                  {secondaryButtonIcon || <Plus className="h-4 w-4" />}
                </span>
                {secondaryButtonLabel}
              </Button>
            ) : (
              <Link
                href={secondaryButtonLink || "#"}
                className="w-full sm:w-auto"
              >
                <Button
                  className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                  style={{
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    transform: "translateY(0)",
                    boxShadow:
                      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
                  }}
                >
                  <span className="mr-3">
                    {secondaryButtonIcon || <Plus className="h-4 w-4" />}
                  </span>
                  {secondaryButtonLabel}
                </Button>
              </Link>
            ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-3">
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {!hideFilters && (
            <div className="relative w-full sm:w-[300px] md:w-[350px] lg:w-[400px] ">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          )}

          <div className="relative">
            {!hideFilters && (
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 border border-[#D0D5DD] rounded-md hover:bg-gray-50 transition-all ${
                  showFilters ? "bg-gray-50 border-primary/30 text-primary" : ""
                }`}
                onClick={onToggleFilters}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${
                    showFilters ? "text-primary" : "text-gray-500"
                  }`}
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span className="text-sm">Filter</span>
                {filterCount && filterCount > 0 && (
                  <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {filterCount}
                  </span>
                )}
              </button>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
