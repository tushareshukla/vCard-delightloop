"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import ListPageHeader from "@/components/layouts/ListPageHeader";
import {
  getDelightEngageList,
  getDelightEngageRecipients,
  updateDelightEngageRecipient,
  deleteDelightEngageRecipient,
} from "../../utils/api/delightEngage";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

// Extend DelightEngageList to include source
interface DelightEngageList {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  source?: {
    manual?: boolean;
    csv?: boolean;
    crm?: {
      type: string | null;
    };
  };
  metrics?: {
    totalContacts?: number;
  };
}

// Extend DelightEngageRecipient to include all required fields
interface DelightEngageRecipient {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  linkedinUrl?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  notes?: string;
}

export default function DelightEngageListDetail() {
  const { authToken, organizationId, isLoadingCookies } = useAuth();
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";
  const [list, setList] = useState<DelightEngageList | null>(null);
  const [recipients, setRecipients] = useState<DelightEngageRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] =
    useState<DelightEngageRecipient | null>(null);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    hasEmail: false,
    hasLinkedIn: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingCookies && id && organizationId && authToken)
      fetchListAndRecipients();
    // eslint-disable-next-line
  }, [id, isLoadingCookies, organizationId, authToken]);

  const fetchListAndRecipients = async () => {
    setIsLoading(true);
    try {
      const listRes = await getDelightEngageList(id);
      setList(listRes);
      const apiUrl = `https://sandbox-api.delightloop.ai/v1/organizations/${organizationId}/lists/${id}/contacts/details`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.contacts) {
        const formattedContacts = data.contacts.map((contact: any) => ({
          _id: contact._id,
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.mailId || "",
          phone: contact.phoneNumber || "",
          jobTitle: contact.jobTitle || "",
          company: contact.companyName || "",
          linkedinUrl: contact.linkedinUrl || "",
          address: contact.address || {
            line1: "",
            line2: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
          notes: contact.notes || "",
        }));
        setRecipients(formattedContacts);
      } else {
        setRecipients([]);
      }
    } catch (err) {
      setError("Failed to fetch list and recipients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRecipient = async (recipient: DelightEngageRecipient) => {
    try {
      await updateDelightEngageRecipient(recipient._id, {
        firstName: recipient.firstName,
        email: recipient.email,
        phone: recipient.phone,
        jobTitle: recipient.jobTitle,
        company: recipient.company,
      });
      setEditingRecipient(null);
      await fetchListAndRecipients();
    } catch (err) {
      setError("Failed to update recipient");
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipient?")) return;
    try {
      await deleteDelightEngageRecipient(id);
      await fetchListAndRecipients();
    } catch (err) {
      setError("Failed to delete recipient");
    }
  };

  // Filtered contacts logic
  const filteredContacts = recipients.filter((contact) => {
    const matchesSearch =
      !searchTerm ||
      (contact.firstName + " " + (contact.lastName || ""))
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany =
      !filters.company ||
      contact.company?.toLowerCase().includes(filters.company.toLowerCase());
    const matchesRole =
      !filters.role ||
      contact.jobTitle?.toLowerCase().includes(filters.role.toLowerCase());
    const matchesEmail = !filters.hasEmail || !!contact.email;
    const matchesLinkedIn = !filters.hasLinkedIn || !!contact.linkedinUrl;
    return (
      matchesSearch &&
      matchesCompany &&
      matchesRole &&
      matchesEmail &&
      matchesLinkedIn
    );
  });

  // Add these handlers for checkbox functionality
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(
        new Set(recipients.map((recipient) => recipient._id))
      );
    }
    setSelectAll(!selectAll);
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
    setSelectAll(newSelected.size === recipients.length);
  };

  const handleMenuToggle = (contactId: string) => {
    setOpenMenuId(openMenuId === contactId ? null : contactId);
  };

  // Toggle filters function
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#FFFFFF]">
        <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto static w-full sm:w-auto">
          <AdminSidebar />
        </div>
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="p-6 bg-white rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden">
            {/* Header Skeleton */}
            <div className="animate-pulse mb-8">
              {/* Breadcrumb skeleton */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
              </div>

              {/* Title and description skeleton */}
              <div className="mb-3">
                <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="flex gap-4">
                  <div className="h-5 w-36 bg-gray-200 rounded"></div>
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Search and filter skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="w-[350px] h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Table skeleton */}
            <div className="border border-[#D2CEFE] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F4F3FF]">
                  <tr>
                    {/* Checkbox column */}
                    <th className="w-[40px] px-3 py-3">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </th>
                    {/* Create 15 header columns to match all the fields */}
                    {Array(15)
                      .fill(0)
                      .map((_, i) => (
                        <th key={`header-${i}`} className="px-3 py-3">
                          <div className="h-4 bg-gray-200 rounded w-full max-w-[80px] mx-auto"></div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2CEFE]">
                  {/* Create 5 skeleton rows */}
                  {Array(5)
                    .fill(0)
                    .map((_, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="animate-pulse">
                        {/* Checkbox cell */}
                        <td className="w-[40px] px-3 py-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        </td>
                        {/* First name */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-20 bg-gray-200 rounded"></div>
                        </td>
                        {/* Last name */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-20 bg-gray-200 rounded"></div>
                        </td>
                        {/* Email */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-32 bg-gray-200 rounded"></div>
                        </td>
                        {/* Phone */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        </td>
                        {/* Job Title */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-28 bg-gray-200 rounded"></div>
                        </td>
                        {/* Company */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        </td>
                        {/* LinkedIn */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                        {/* Address Line 1 */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-28 bg-gray-200 rounded"></div>
                        </td>
                        {/* Address Line 2 */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        </td>
                        {/* City */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </td>
                        {/* State */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-12 bg-gray-200 rounded"></div>
                        </td>
                        {/* Zip */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-14 bg-gray-200 rounded"></div>
                        </td>
                        {/* Country */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-20 bg-gray-200 rounded"></div>
                        </td>
                        {/* Notes */}
                        <td className="px-3 py-2">
                          <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2">
                          <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex bg-[#FFFFFF]">
        <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto static w-full sm:w-auto">
          <AdminSidebar />
        </div>
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="p-6 bg-white rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden">
            <div className="max-w-7xl mx-auto text-red-500">
              {error || "List not found"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getSourceText = () => {
    if (list?.source?.manual) return "Manual";
    if (list?.source?.csv) return "CSV";
    if (list?.source?.crm?.type) return list.source.crm.type;
    return "Manual";
  };

  return (
    <div className="flex bg-[#FFFFFF]">
      <div className="sm:sticky sm:top-0 sm:h-screen sm:flex-shrink-0 sm:z-30 h-auto static w-full sm:w-auto">
        <AdminSidebar />
      </div>
      <div className="pt-3 bg-primary w-full overflow-x-hidden">
        <div className="p-6 bg-white rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden">
          {/* Use ListPageHeader component */}
          <ListPageHeader
            pageIcon={
              <Image
                src="/svgs/Mail.svg"
                alt="Delight Engage"
                width={28}
                height={28}
              />
            }
            pageName="Delight Engage"
            pageTitle={list.name}
            pageDescription={`${
              recipients.length
            } contacts • Source: ${getSourceText()}`}
            createButtonLabel="Delight Emails"
            createButtonLink=""
            createButtonOnClick={() =>
              router.push(`/delight-engage/emails?listId=${id}`)
            }
            searchValue={searchTerm}
            onSearchChange={(value) => setSearchTerm(value)}
            showFilters={showFilters}
            onToggleFilters={toggleFilters}
            filterCount={Object.values(filters).filter(Boolean).length}
          >
            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={filters.company}
                      onChange={(e) =>
                        setFilters({ ...filters, company: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Filter by company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Filter by role"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasEmail}
                      onChange={() =>
                        setFilters({
                          ...filters,
                          hasEmail: !filters.hasEmail,
                        })
                      }
                      className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                    />
                    <span className="text-sm">Has Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasLinkedIn}
                      onChange={() =>
                        setFilters({
                          ...filters,
                          hasLinkedIn: !filters.hasLinkedIn,
                        })
                      }
                      className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                    />
                    <span className="text-sm">Has LinkedIn</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setFilters({
                          company: "",
                          role: "",
                          hasEmail: false,
                          hasLinkedIn: false,
                        });
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ListPageHeader>

          {/* Additional actions */}
          <div className="flex items-center justify-between mt-4 mb-6">
            {selectedContacts.size > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                <Image
                  src="/img/delete.png"
                  width={16}
                  height={16}
                  alt="delete pic"
                />
                Delete Selected ({selectedContacts.size})
              </button>
            )}
          </div>

          {/* Contact Table - Improved UI - all columns */}
          <div className="border border-[#D2CEFE] rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4F3FF] border-b border-[#EAECF0] text-left text-xs uppercase font-medium text-[#101828]">
                <tr>
                  <th className="w-[40px] px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    First Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    LinkedIn
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address Line 1
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address Line 2
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    State
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zip
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Country
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2CEFE]">
                {recipients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={16}
                      className="px-6 py-8 text-center text-[#667085]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {searchTerm || Object.values(filters).some(Boolean)
                          ? "No contacts match your search criteria"
                          : "No contacts in this list."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((recipient) => (
                    <tr
                      key={recipient._id}
                      className="hover:bg-[#F9FAFB] relative"
                    >
                      <td className="w-[40px] px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(recipient._id)}
                          onChange={() => handleSelectContact(recipient._id)}
                          className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[#101828]">
                        {recipient.firstName}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[#101828]">
                        {recipient.lastName || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        <a
                          href={`mailto:${recipient.email}`}
                          className="font-medium hover:underline"
                        >
                          {recipient.email ? recipient.email : "---"}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.phone || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.jobTitle || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.company || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.linkedinUrl ? (
                          <div className="flex items-center gap-1">
                            <Image
                              src="/svgs/Linkedin.svg"
                              alt="linkedin"
                              width={16}
                              height={16}
                            />
                            {recipient.linkedinUrl.replace(
                              /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i,
                              ""
                            )}
                          </div>
                        ) : (
                          "---"
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.line1 || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.line2 || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.city || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.state || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.zip || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.address?.country || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm text-[#101828]">
                        {recipient.notes || "---"}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[#101828] relative">
                        <div className="relative">
                          <div
                            className="grid gap-0.5 cursor-pointer hover:bg-slate-100 py-1.5 px-3 rounded-full three-dots w-fit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuToggle(recipient._id);
                            }}
                          >
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                          </div>
                          {openMenuId === recipient._id && (
                            <div
                              className="absolute z-[9999] contact-menu"
                              style={{
                                right: "calc(100% + 8px)",
                                top: "10%",
                                transform: "translateY(-50%)",
                              }}
                            >
                              <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 grid gap-1 min-w-[120px]">
                                <button
                                  className="flex gap-3 items-center text-[#101828] px-4 py-2 rounded-lg hover:bg-slate-50 whitespace-nowrap w-full text-left"
                                  onClick={() => {
                                    if (recipient) {
                                      setEditingRecipient(recipient);
                                    }
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="15"
                                    viewBox="0 0 16 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M8 13.9999H14.75M11.375 1.62493C11.6734 1.32656 12.078 1.15894 12.5 1.15894C12.7089 1.15894 12.9158 1.20009 13.1088 1.28004C13.3019 1.36 13.4773 1.47719 13.625 1.62493C13.7727 1.77266 13.8899 1.94805 13.9699 2.14108C14.0498 2.33411 14.091 2.54099 14.091 2.74993C14.091 2.95886 14.0498 3.16574 13.9699 3.35877C13.8899 3.5518 13.7727 3.72719 13.625 3.87493L4.25 13.2499L1.25 13.9999L2 10.9999L11.375 1.62493Z"
                                      stroke="#667085"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  className="flex gap-3 items-center text-red-700 px-4 py-2 rounded-lg hover:bg-slate-50 whitespace-nowrap w-full text-left"
                                  onClick={() => {
                                    handleDeleteRecipient(recipient._id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Image
                                    src="/img/delete.png"
                                    width={16}
                                    height={16}
                                    alt="delete pic"
                                  />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
