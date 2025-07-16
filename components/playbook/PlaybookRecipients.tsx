"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Recipient {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  linkedin?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    isVerified?: boolean;
    confidenceScore?: number;
  };
  selected?: boolean;
  enrichment?: {
    job_company_name?: string;
    job_title?: string;
    location_locality?: string;
    location_region?: string;
    location_country?: string;
  };
}

interface ContactList {
  _id: string;
  name: string;
  description?: string;
  recipientCount: number;
  createdAt: string;
  tags?: string[];
  status?: string;
}

interface PlaybookRecipientsProps {
  authToken: string;
  userId: string;
  organizationId: string;
  playbookId: string;
  onRecipientsSelected: (selectedRecipients: Recipient[]) => void;
  selectedRecipients?: Recipient[];
}

interface FormData {
  recipientSource: string;
  recipients: Recipient[];
  selectedContactListId: string;
}

const PlaybookRecipients: React.FC<PlaybookRecipientsProps> = ({
  authToken,
  userId,
  organizationId,
  playbookId,
  onRecipientsSelected,
  selectedRecipients = [],
}): JSX.Element => {
  const [formData, setFormData] = useState<FormData>({
    recipientSource: "contact-list",
    recipients: [],
    selectedContactListId: "",
  });

  const [errors, setErrors] = useState({
    recipients: "",
  });

  // Contact list states
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [isLoadingContactLists, setIsLoadingContactLists] = useState(false);
  const [contactListError, setContactListError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tags: [] as string[],
    company: "",
    title: "",
  });

  // State to toggle between showing contact selection and recipients list
  const [showContactSelection, setShowContactSelection] = useState(true);

  // State to manage selection
  const [selectedRecipientsSet, setSelectedRecipientsSet] = useState<
    Set<string>
  >(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // State to track enrichment loading
  const [isEnriching, setIsEnriching] = useState(false);

  // Fetch contact lists on component mount
  useEffect(() => {
    fetchContactLists();
  }, []);

  // Initialize selected recipients
  useEffect(() => {
    if (selectedRecipients.length > 0) {
      const selectedNames = new Set(selectedRecipients.map((r) => r.name));
      setSelectedRecipientsSet(selectedNames);
    }
  }, [selectedRecipients]);

  // Function to fetch contact lists
  const fetchContactLists = async () => {
    try {
      setIsLoadingContactLists(true);
      setContactListError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contact lists: ${response.status}`);
      }

      const data = await response.json();
      const lists = data.lists || data.data?.lists || data.data || [];

      if (!Array.isArray(lists)) {
        throw new Error("Invalid response format: lists is not an array");
      }

      const activeLists = lists.map((list) => ({
        _id: list._id || list.id || "",
        name: list.name || "Unnamed List",
        description: list.description || "",
        recipientCount:
          list.metrics?.totalContacts ||
          list.contacts?.length ||
          list.metrics?.totalRecipients ||
          list.recipients?.length ||
          list.recipientCount ||
          0,
        createdAt: list.createdAt || new Date().toISOString(),
        tags: list.tags || [],
        status: list.status || "active",
      }));

      setContactLists(activeLists);
    } catch (error) {
      setContactListError(
        error instanceof Error ? error.message : "Failed to fetch contact lists"
      );
    } finally {
      setIsLoadingContactLists(false);
    }
  };

  // Function to load recipients from a contact list
  const loadFromContactList = async (contactListId: string) => {
    setIsLoading(true);
    try {
      setSelectedRecipientsSet(new Set());
      setSelectAll(false);
      setFormData((prev) => ({
        ...prev,
        recipientSource: "contact-list",
        selectedContactListId: contactListId,
        recipients: [],
      }));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${contactListId}/contacts/details`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }
      const data = await response.json();
      // Debug: Log contact data structure
      console.log("📋 Contact data received:", data.contacts.slice(0, 2));

      const transformedRecipients: Recipient[] = data.contacts.map(
        (contact: any) => {
          // Debug log for each contact
          console.log(
            `📋 Processing contact ${contact.firstName} ${contact.lastName}:`,
            {
              originalAddress: contact.address,
              enrichment: contact.enrichment
                ? {
                    location_locality: contact.enrichment.location_locality,
                    location_region: contact.enrichment.location_region,
                    location_country: contact.enrichment.location_country,
                  }
                : null,
            }
          );

          return {
            id: contact._id,
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.mailId,
            company:
              contact.companyName || contact.enrichment?.job_company_name || "",
            title: contact.jobTitle || contact.enrichment?.job_title || "",
            linkedin: contact.linkedinUrl
              ? contact.linkedinUrl.split("/in/")[1]
              : "",
            address: {
              line1: contact.address?.line1 || "",
              line2: contact.address?.line2 || "",
              city:
                contact.address?.city ||
                contact.enrichment?.location_locality ||
                "",
              state:
                contact.address?.state ||
                contact.enrichment?.location_region ||
                "",
              zip: contact.address?.zip || "",
              country:
                contact.address?.country ||
                contact.enrichment?.location_country ||
                "",
              isVerified: contact.address?.isVerified || false,
              confidenceScore: contact.address?.confidenceScore || null,
            },
            selected: false,
            enrichment: contact.enrichment
              ? {
                  job_company_name: contact.enrichment.job_company_name,
                  job_title: contact.enrichment.job_title,
                  location_locality: contact.enrichment.location_locality,
                  location_region: contact.enrichment.location_region,
                  location_country: contact.enrichment.location_country,
                }
              : undefined,
          };
        }
      );
      setFormData((prev) => ({
        ...prev,
        recipients: transformedRecipients,
      }));
      setShowContactSelection(false);
    } catch (error) {
      setErrors({
        ...errors,
        recipients: `Failed to load contacts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChange = (source: string) => {
    setFormData({
      ...formData,
      recipientSource: source,
    });
  };

  // Function to filter recipients based on search term and filters
  const filterRecipients = (recipients: Recipient[]) => {
    return recipients.filter((recipient) => {
      const searchMatch =
        searchTerm === "" ||
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipient.company &&
          recipient.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (recipient.title &&
          recipient.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const companyMatch =
        filters.company === "" ||
        (recipient.company &&
          recipient.company
            .toLowerCase()
            .includes(filters.company.toLowerCase()));
      const titleMatch =
        filters.title === "" ||
        (recipient.title &&
          recipient.title.toLowerCase().includes(filters.title.toLowerCase()));
      return searchMatch && companyMatch && titleMatch;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const resetFilters = () => {
    setFilters({
      tags: [],
      company: "",
      title: "",
    });
    setSearchTerm("");
  };

  const removeRecipient = (id: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(
        (recipient) => recipient.id !== id
      ),
    });
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      const visibleRecipients = filterRecipients(formData.recipients).map(
        (r) => r.name
      );
      setSelectedRecipientsSet(new Set(visibleRecipients));
      onRecipientsSelected(
        formData.recipients.filter((r) => visibleRecipients.includes(r.name))
      );
    } else {
      setSelectedRecipientsSet(new Set());
      onRecipientsSelected([]);
    }
  };

  const toggleRecipientSelection = (name: string) => {
    setSelectedRecipientsSet((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(name)) {
        newSelected.delete(name);
      } else {
        newSelected.add(name);
      }
      onRecipientsSelected(
        formData.recipients.filter((r) => newSelected.has(r.name))
      );
      return newSelected;
    });
  };

  const formatAddressMasked = (
    address?: Recipient["address"]
  ): React.ReactNode => {
    if (!address) return <strong>---</strong>;
    const formatField = (value: any): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (value === true) return "";
      return String(value);
    };
    const formattedAddress = {
      ...address,
      city: formatField(address.city),
      state: formatField(address.state),
      country: formatField(address.country),
    };
    const parts: string[] = [];
    if (formattedAddress.line1) parts.push(formattedAddress.line1);
    if (formattedAddress.line2) parts.push(formattedAddress.line2);
    if (formattedAddress.city) parts.push(formattedAddress.city);
    if (formattedAddress.state) parts.push(formattedAddress.state);
    if (formattedAddress.country) parts.push(formattedAddress.country);
    if (parts.length > 0) {
      const displayText = parts.join(", ");
      const visiblePart = displayText.substring(0, 3);
      return (
        <>
          {visiblePart}
          <strong>****</strong>
        </>
      );
    }
    return <strong>---</strong>;
  };

  // Enrichment logic (replicated from Recipients.tsx, adapted for playbook context)
  const enrichRecipients = async () => {
    if (selectedRecipientsSet.size === 0) {
      setErrors({
        ...errors,
        recipients: "Please select at least one recipient to enrich",
      });
      return;
    }
    setIsEnriching(true);
    let successCount = 0;
    let failureCount = 0;
    // Get the recipients that are selected
    const selectedRecipientsList = formData.recipients.filter((recipient) =>
      selectedRecipientsSet.has(recipient.name)
    );
    for (const recipient of selectedRecipientsList) {
      try {
        // Skip if no LinkedIn profile
        if (!recipient.linkedin) {
          console.log(
            `Skipping ${recipient.name} - No LinkedIn profile available`
          );
          continue;
        }

        console.log(
          `Enriching data for ${recipient.name} with LinkedIn: ${recipient.linkedin}`
        );

        // Construct the LinkedIn URL
        const linkedinUrl = encodeURIComponent(
          `https://www.linkedin.com/in/${recipient.linkedin}/`
        );

        // Call the People Data Labs API
        const pdlResponse = await fetch(
          `https://api.peopledatalabs.com/v5/person/enrich?profile=${linkedinUrl}&pretty=false&min_likelihood=2&include_if_matched=false&titlecase=false`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key":
                "6c283018a3273acc73e97280c3986677a7f9fe28e36ad8830e21dfc1ffe884be",
              Accept: "application/json",
            },
          }
        );

        if (!pdlResponse.ok) {
          throw new Error(`PDL API error: ${pdlResponse.status}`);
        }

        const pdlData = await pdlResponse.json();
        console.log(`✅ PDL Raw data for ${recipient.name}:`, pdlData);
        console.log(`✅ PDL Location data:`, {
          locality: pdlData.data?.location_locality,
          region: pdlData.data?.location_region,
          country: pdlData.data?.location_country,
        });

        // Save enrichment data to our database
        const enrichmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${formData.selectedContactListId}/contacts/${recipient.id}/enrich`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              enrichmentData: {
                data: pdlData.data,
                likelihood: pdlData.likelihood,
              },
            }),
          }
        );

        if (!enrichmentResponse.ok) {
          throw new Error(
            `Failed to save enrichment data: ${enrichmentResponse.status}`
          );
        }

        const enrichmentResult = await enrichmentResponse.json();
        console.log(
          `✅ Enrichment API response for ${recipient.name}:`,
          enrichmentResult
        );

        // Update the recipient data in the local state
        setFormData((prev) => {
          const updatedRecipients = prev.recipients.map((r) => {
            if (r.id === recipient.id) {
              const updatedRecipient = {
                ...r,
                company: pdlData.data?.job_company_name || r.company,
                title: pdlData.data?.job_title || r.title,
                address: {
                  ...r.address,
                  line1: r.address?.line1 || "",
                  line2: r.address?.line2 || "",
                  city:
                    typeof pdlData.data?.location_locality === "string"
                      ? pdlData.data.location_locality
                      : r.address?.city || "",
                  state:
                    typeof pdlData.data?.location_region === "string"
                      ? pdlData.data.location_region
                      : r.address?.state || "",
                  country:
                    typeof pdlData.data?.location_country === "string"
                      ? pdlData.data.location_country
                      : r.address?.country || "",
                  isVerified: r.address?.isVerified || false,
                  confidenceScore: r.address?.confidenceScore,
                },
              };
              return updatedRecipient;
            }
            return r;
          });
          return {
            ...prev,
            recipients: updatedRecipients,
          };
        });

        successCount++;
        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failureCount++;
        console.error(`❌ Error enriching ${recipient.name}:`, error);
      }
    }
    setIsEnriching(false);
    setErrors({
      ...errors,
      recipients: `✓ Completed enrichment: ${successCount} successful, ${failureCount} failed out of ${selectedRecipientsList.length} total`,
    });
    setTimeout(() => {
      setErrors({ ...errors, recipients: "" });
    }, 5000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Playbook Recipients</h2>
        {formData.selectedContactListId && !showContactSelection && (
          <button
            type="button"
            onClick={() => setShowContactSelection(true)}
            className="px-4 py-2 bg-white border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Change Contact List
          </button>
        )}
      </div>
      <p className="text-gray-600 mb-8">
        {showContactSelection
          ? "Select a contact list to add recipients to your playbook run."
          : "Recipients for your playbook run are shown below."}
      </p>
      {showContactSelection && (
        <div className="mb-8">
          {isLoadingContactLists ? (
            <div className="flex items-center justify-center p-4 border border-gray-200 rounded-md">
              <svg
                className="animate-spin h-5 w-5 text-primary mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-gray-500">Loading contact lists...</span>
            </div>
          ) : contactListError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <div className="flex items-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Error loading contact lists</span>
              </div>
              <p className="mb-3">{contactListError}</p>
              <button
                onClick={fetchContactLists}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
              >
                Try Again
              </button>
            </div>
          ) : contactLists.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Contact Lists Found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You don't have any contact lists yet. Create a contact list in
                the Contacts section before setting up your playbook run.
              </p>
              <a
                href="/contact-lists"
                className="inline-flex items-center px-5 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create a Contact List
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="contact-list-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Choose from your contact lists
                </label>
                <div className="relative">
                  <select
                    id="contact-list-select"
                    className="block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-primary focus:border-primary"
                    value={formData.selectedContactListId}
                    onChange={(e) => {
                      if (e.target.value) {
                        loadFromContactList(e.target.value);
                      } else {
                        setFormData({
                          ...formData,
                          recipients: [],
                          selectedContactListId: "",
                        });
                      }
                    }}
                  >
                    <option value="">-- Select a contact list --</option>
                    {contactLists
                      .filter((list) => {
                        const searchMatch =
                          searchTerm === "" ||
                          list.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (list.description &&
                            list.description
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()));
                        const tagsMatch =
                          filters.tags.length === 0 ||
                          (list.tags &&
                            filters.tags.every((tag) =>
                              list.tags?.includes(tag)
                            ));
                        return searchMatch && tagsMatch;
                      })
                      .map((list) => (
                        <option key={list._id} value={list._id}>
                          {list.name} ({list.recipientCount || 0} recipients)
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-grow max-w-sm">
                  <input
                    type="text"
                    placeholder="Search contact lists..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary pl-10"
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
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
                    className="mr-2"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  Filters{" "}
                  {filters.tags.length > 0 && `(${filters.tags.length})`}
                </button>
                {(filters.tags.length > 0 ||
                  filters.company ||
                  filters.title) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-primary"
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
                      className="mr-2"
                    >
                      <path d="M3 3v18h18"></path>
                      <path d="M18.4 3a9.9 9.9 0 0 0-13.4 13.4"></path>
                      <path d="M21 21H3"></path>
                    </svg>
                    Reset Filters
                  </button>
                )}
              </div>
              {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-3">Filter Contact Lists</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (
                            e.target.value &&
                            !filters.tags.includes(e.target.value)
                          ) {
                            setFilters({
                              ...filters,
                              tags: [...filters.tags, e.target.value],
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select a tag</option>
                        {Array.from(
                          new Set(
                            contactLists.flatMap((list) => list.tags || [])
                          )
                        ).map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                      {filters.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {filters.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() =>
                                  setFilters({
                                    ...filters,
                                    tags: filters.tags.filter((t) => t !== tag),
                                  })
                                }
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!showContactSelection && formData.selectedContactListId && (
        <div className="mb-8">
          {(() => {
            const selectedList = contactLists.find(
              (list) => list._id === formData.selectedContactListId
            );
            return (
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">
                      Selected Contact List:
                    </span>
                    <h3 className="text-lg font-semibold text-primary">
                      {selectedList?.name || ""}
                    </h3>
                  </div>
                  <div className="text-sm font-medium bg-primary-50 text-primary px-3 py-1 rounded-full">
                    {formData.recipients.length}{" "}
                    {formData.recipients.length === 1
                      ? "recipient"
                      : "recipients"}
                  </div>
                </div>
                {selectedList?.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedList.description}
                  </p>
                )}
                {selectedList?.tags && selectedList.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedList.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {formData.selectedContactListId && !showContactSelection && (
        <div className="mb-8">
          {errors.recipients && (
            <div
              className={`mb-4 p-3 ${
                errors.recipients.startsWith("✓")
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700"
              } rounded-md text-sm`}
            >
              {errors.recipients.startsWith("✓") && (
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errors.recipients}</span>
                </div>
              )}
              {!errors.recipients.startsWith("✓") && errors.recipients}
            </div>
          )}
          {formData.recipients.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between gap-3">
                  <div className="relative flex-grow max-w-md">
                    <input
                      type="text"
                      placeholder="Search recipients..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isEnriching || selectedRecipientsSet.size === 0}
                      onClick={enrichRecipients}
                      className={`flex items-center px-3 py-2 text-sm border border-primary rounded-md hover:bg-gray-50 text-primary ${
                        isEnriching || selectedRecipientsSet.size === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isEnriching && (
                        <svg
                          className="animate-spin h-4 w-4 mr-2 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      Enrich Recipients
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
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
                        className="mr-2"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      Filters
                    </button>
                    {(filters.company || filters.title) && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-primary"
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
                          className="mr-2"
                        >
                          <path d="M3 3v18h18"></path>
                          <path d="M18.4 3a9.9 9.9 0 0 0-13.4 13.4"></path>
                          <path d="M21 21H3"></path>
                        </svg>
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                {showFilters && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by company"
                        value={filters.company}
                        onChange={(e) =>
                          setFilters({ ...filters, company: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by job title"
                        value={filters.title}
                        onChange={(e) =>
                          setFilters({ ...filters, title: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="pl-3 pr-0 py-3 w-10 text-center"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                      >
                        Company
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8"
                      >
                        LinkedIn
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                      >
                        Address
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filterRecipients(formData.recipients).map((recipient) => (
                      <tr
                        key={recipient.name}
                        className={
                          selectedRecipientsSet.has(recipient.name)
                            ? "bg-purple-50"
                            : undefined
                        }
                      >
                        <td className="pl-3 pr-0 py-3 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedRecipientsSet.has(recipient.name)}
                            onChange={() =>
                              toggleRecipientSelection(recipient.name)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate">
                          {recipient.name}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 truncate">
                          {recipient.company || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 truncate">
                          {recipient.title || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 truncate">
                          <span title={recipient.email}>{recipient.email}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 truncate">
                          {recipient.linkedin ? (
                            <a
                              href={`https://linkedin.com/in/${recipient.linkedin}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 truncate"
                              title={`linkedin.com/in/${recipient.linkedin}`}
                            >
                              <svg
                                className="h-4 w-4 flex-shrink-0 mr-1"
                                viewBox="0 0 24 24"
                                fill="#0A66C2"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              <span className="truncate">
                                {recipient.linkedin}
                              </span>
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-500 truncate"
                          title={
                            recipient.address
                              ? `${[
                                  recipient.address.city,
                                  recipient.address.state,
                                  recipient.address.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}`
                              : ""
                          }
                        >
                          {formatAddressMasked(recipient.address)}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove recipient"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filterRecipients(formData.recipients).length === 0 && (
                <div className="py-4 text-center text-gray-500">
                  No recipients match your search criteria
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No recipients found in this list
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                The selected contact list appears to be empty. Choose a
                different list or add contacts to this list.
              </p>
              <button
                type="button"
                onClick={() => setShowContactSelection(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Select a Different List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaybookRecipients;
