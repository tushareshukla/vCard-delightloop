"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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

interface RecipientsProps {
  data: {
    recipientSource: string;
    recipients: Recipient[];
    selectedContactListId?: string;
    budget?: number;
    motion?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
  campaignId: string;
  authToken: string;
  userId: string;
  organizationId: string;
  eventId?: string;
}

interface FormData {
  recipientSource: string;
  recipients: Recipient[];
  selectedContactListId: string;
  motion: string;
}

const Recipients: React.FC<RecipientsProps> = ({
  data,
  onNext,
  onBack,
  campaignId,
  authToken,
  userId,
  organizationId,
  eventId,
}): JSX.Element => {
  const [formData, setFormData] = useState<FormData>({
    recipientSource: "contact-list",
    recipients: data.recipients || [],
    selectedContactListId: data.selectedContactListId || "",
    motion: data.motion || "",
  });

  const [errors, setErrors] = useState({
    recipients: "",
    recipientCount: "",
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
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);

  const [budget] = useState(25); // Fixed budget at $25

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // State to track if a default contact list has been checked
  const [defaultListChecked, setDefaultListChecked] = useState(false);

  // State to track enrichment loading
  const [isEnriching, setIsEnriching] = useState(false);
  const [allCampaignData, setAllCampaignData] = useState<any | null>(null);

  // Fetch contact lists on component mount
  useEffect(() => {
    fetchContactLists();
  }, []);

  // Load saved selections when mounted
  useEffect(() => {
    const loadSavedSelections = async () => {
      setIsLoading(true);
      try {
        // First try to load from localStorage
        const savedData = localStorage.getItem(
          `campaign_${campaignId}_recipients`
        );
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Set the contact list ID first
          if (parsedData.selectedContactListId) {
            setFormData((prev) => ({
              ...prev,
              selectedContactListId: parsedData.selectedContactListId,
              motion: parsedData.motion || prev.motion, // Preserve motion from either source
            }));

            // Load contacts for this list
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${parsedData.selectedContactListId}/contacts/details`,
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

            // Transform API contacts to match our Recipient interface
            const transformedRecipients: Recipient[] = data.contacts.map(
              (contact: any) => ({
                id: contact._id,
                name: `${contact.firstName} ${contact.lastName}`,
                email: contact.mailId,
                company: contact.companyName || "",
                title: contact.jobTitle || "",
                linkedin: contact.linkedinUrl
                  ? contact.linkedinUrl.split("/in/")[1]
                  : "",
                address: {
                  line1: contact.address?.line1 || "",
                  line2: contact.address?.line2 || "",
                  city: contact.address?.city || "",
                  state: contact.address?.state || "",
                  zip: contact.address?.zip || "",
                  country: contact.address?.country || "",
                },
                selected: false,
              })
            );

            // Update form data with the recipients
            setFormData((prev) => ({
              ...prev,
              recipients: transformedRecipients,
              motion: prev.motion, // Preserve the motion when updating form data
            }));

            // Restore selected recipients
            if (parsedData.selectedRecipients) {
              setSelectedRecipients(new Set(parsedData.selectedRecipients));
            }

            // Hide contact selection since we're loading a saved list
            setShowContactSelection(false);
          }

          // Budget is now fixed at $25 - no need to restore
        }

        // Also fetch campaign data to ensure we have the latest
        const campaignResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (campaignResponse.ok) {
          const campaignData = await campaignResponse.json();

          // Check for boostRegistration first, then fall back to budget
          setAllCampaignData(campaignData?.campaign);

          // Always set recipient count if available
          if (campaignData.campaign.total_recipients) {
            setDesiredRecipientCount(campaignData.campaign.total_recipients);
          }

          // Budget is now fixed at $25 - no need to set from campaign data

          // If campaign has recipients, make sure they're selected
          if (campaignData.campaign.total_recipients > 0) {
            const recipientsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/campaigns/${campaignId}/recipients`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
            if (recipientsResponse.ok) {
              const responseData = await recipientsResponse.json();

              if (responseData.success && responseData.data?.length > 0) {
                console.log("responseData", responseData);
                // Create a Set of full names from the API response
                const campaignRecipientNames = new Set(
                  responseData.data.map(
                    (recipient) =>
                      `${recipient.firstName} ${recipient.lastName}`
                  )
                );

                // Update selected recipients using names
                setSelectedRecipients(
                  new Set<string>(
                    Array.from(campaignRecipientNames) as string[]
                  )
                );

                // Update form data to mark these recipients as selected
                setFormData((prev) => ({
                  ...prev,
                  recipients: prev.recipients.map((recipient) => ({
                    ...recipient,
                    selected: campaignRecipientNames.has(recipient.name),
                  })),
                  motion: prev.motion, // Preserve the motion when updating form data
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved selections:", error);
        setErrors({
          recipients: `Failed to load saved selections: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          recipientCount: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSelections();
  }, [campaignId, authToken, organizationId]);

  // Add a new useEffect to check for event-specific contact lists
  useEffect(() => {
    // Only run this if we have an eventId and haven't checked for default lists yet
    if (eventId && !defaultListChecked) {
      checkForEventContactList();
    }
  }, [eventId, defaultListChecked]);

  // Function to check if there's a default contact list for an event
  const checkForEventContactList = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);

      // Check if user has a saved selection first
      const savedData = localStorage.getItem(
        `campaign_${campaignId}_recipients`
      );
      const hasSavedSelection =
        savedData && JSON.parse(savedData).selectedContactListId;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}/lists`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch event contact lists: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.lists) {
        throw new Error("Invalid response format");
      }

      // Transform the event lists to match our ContactList interface
      const activeLists = data.lists.map((list) => ({
        _id: list._id,
        name: list.name,
        description: list.description || "",
        recipientCount:
          list.metrics?.totalContacts ||
          list.contacts?.length ||
          list.metrics?.totalRecipients ||
          list.recipients?.length ||
          0,
        createdAt: list.createdAt,
        tags: list.tags || [],
        status: list.status,
      }));

      // Mark that we've checked for default lists
      setDefaultListChecked(true);

      // If there are event lists, add them to our contact lists
      if (activeLists.length > 0) {
        setContactLists((prevLists) => {
          const existingListIds = new Set(prevLists.map((list) => list._id));
          const newLists = activeLists.filter(
            (list) => !existingListIds.has(list._id)
          );
          return [...prevLists, ...newLists];
        });

        // ONLY auto-select an event list if there's no saved selection
        if (!hasSavedSelection) {
          // Check if the current selectedContactListId matches any of the event lists
          const matchingList = activeLists.find(
            (list) => list._id === formData.selectedContactListId
          );

          // If the selected list matches one of the event lists, load it
          if (matchingList) {
            console.log(
              "Found matching default contact list:",
              matchingList.name
            );
            await loadFromContactList(matchingList._id);
          } else if (
            activeLists.length === 1 &&
            !formData.selectedContactListId
          ) {
            // If there's exactly one event list and no list is selected, auto-select it
            console.log(
              "Auto-selecting the only event contact list:",
              activeLists[0].name
            );
            await loadFromContactList(activeLists[0]._id);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for event contact lists:", error);
      // Don't show an error to the user, just log it
    } finally {
      setIsLoading(false);
    }
  };

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
      console.log("API response data:", data); // Log the response for debugging

      // Check if the data has the expected structure
      // Allow for different API response formats
      const lists = data.lists || data.data?.lists || data.data || [];

      if (!Array.isArray(lists)) {
        throw new Error("Invalid response format: lists is not an array");
      }

      // Filter out deleted lists and get correct recipient count
      const activeLists = lists.map((list) => ({
        _id: list._id || list.id || "",
        name: list.name || "Unnamed List",
        description: list.description || "",
        // Check all possible places where recipient count might be stored
        recipientCount:
          list.metrics?.totalContacts || // Check metrics first
          list.contacts?.length || // Then check contacts array length
          list.metrics?.totalRecipients || // Then check totalRecipients
          list.recipients?.length || // Then check recipients array length
          list.recipientCount || // Direct property
          0, // Default to 0 if none found
        createdAt: list.createdAt || new Date().toISOString(),
        tags: list.tags || [],
        status: list.status || "active",
      }));

      console.log(
        "Transformed lists with correct recipient counts:",
        activeLists
      );

      // Set contact lists while preserving any event-specific lists
      setContactLists((prevLists) => {
        // If we haven't fetched event lists yet, just use the new lists
        if (prevLists.length === 0 || !eventId) {
          return activeLists;
        }

        // Create a map of existing list IDs that might have come from the event API
        const existingListIds = new Set(prevLists.map((list) => list._id));

        // Find lists that exist in both sets
        const overlappingLists = activeLists.filter((list) =>
          existingListIds.has(list._id)
        );

        // Find lists unique to the new fetch
        const uniqueNewLists = activeLists.filter(
          (list) => !existingListIds.has(list._id)
        );

        // Find lists unique to the previous set (likely from event API)
        const uniquePrevLists = prevLists.filter(
          (list) => !activeLists.some((newList) => newList._id === list._id)
        );

        // Combine everything, prioritizing overlapping lists from the new fetch
        return [...overlappingLists, ...uniqueNewLists, ...uniquePrevLists];
      });
    } catch (error) {
      console.error("Error fetching contact lists:", error);
      setContactListError(
        error instanceof Error ? error.message : "Failed to fetch contact lists"
      );
    } finally {
      setIsLoadingContactLists(false);
    }
  };

  // Function to load recipients from a contact list
  const loadFromContactList = async (contactListId: string) => {
    console.log("Loading contacts for list:", contactListId);
    setIsLoading(true);

    try {
      // Clear previous selections when changing lists
      setSelectedRecipients(new Set());
      setSelectAll(false);

      // Update form state
      setFormData((prev) => ({
        ...prev,
        recipientSource: "contact-list",
        selectedContactListId: contactListId,
        recipients: [], // Clear while loading
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

      // Transform API contacts with no selections (all unselected by default)
      const transformedRecipients: Recipient[] = data.contacts.map(
        (contact: any) => ({
          id: contact._id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.mailId,
          company: contact.companyName || "",
          title: contact.jobTitle || "",
          linkedin: contact.linkedinUrl
            ? contact.linkedinUrl.split("/in/")[1]
            : "",
          address: {
            line1: contact.address?.line1 || "",
            line2: contact.address?.line2 || "",
            city: contact.address?.city || "",
            state: contact.address?.state || "",
            zip: contact.address?.zip || "",
            country: contact.address?.country || "",
          },
          selected: false, // All unselected by default when changing lists
        })
      );

      // Update form data with recipients
      setFormData((prev) => ({
        ...prev,
        recipients: transformedRecipients,
      }));

      // Save to localStorage with empty selections
      localStorage.setItem(
        `campaign_${campaignId}_recipients`,
        JSON.stringify({
          recipientSource: "contact-list",
          selectedContactListId: contactListId,
          recipients: transformedRecipients,
          selectedRecipients: [],
          motion: formData.motion,
          ...(formData.motion === "boost_registration"
            ? {
                boostRegistration: {
                  perGiftCost: budget,
                },
                budget: {
                  totalBudget: budget,
                  maxPerGift: budget,
                  currency: "USD",
                  spent: 0,
                },
              }
            : {
                budget: {
                  totalBudget: budget,
                  maxPerGift: budget,
                  currency: "USD",
                  spent: 0,
                },
              }),
        })
      );

      // Hide contact list selection
      setShowContactSelection(false);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setErrors({
        recipients: `Failed to load contacts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        recipientCount: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVE FOR PRODUCTION: Helper function for debugging
  const loadDummyRecipientsForList = (contactListId: string) => {
    console.log("DEBUG: Loading dummy data for list ID:", contactListId);

    // Generate different dummy data based on the list ID
    const generateDummyRecipients = () => {
      // Use last character of ID to vary count (fallback to 5)
      const baseCount = parseInt(contactListId.slice(-1)) || 5;

      const dummyRecipients: Recipient[] = [];

      const firstNames = ["John", "Sarah", "Michael", "Emma", "David"];
      const lastNames = ["Smith", "Johnson", "Chen", "Williams", "Rodriguez"];
      const companies = [
        "Acme Inc",
        "TechCorp",
        "Innovative Solutions",
        "Global Media",
        "Fintech Enterprises",
      ];
      const domains = [
        "example.com",
        "company.co",
        "enterprise.org",
        "business.net",
        "corp.io",
      ];
      const titles = [
        "CEO",
        "CTO",
        "Director of Marketing",
        "Product Manager",
        "Senior Developer",
      ];
      const linkedinHandles = [
        "johnsmith",
        "sarahjohnson",
        "michaelchen",
        "emmawilliams",
        "davidrodriguez",
      ];

      // Cities and states for addresses
      const cities = [
        "San Francisco",
        "New York",
        "Chicago",
        "Austin",
        "Seattle",
      ];
      const states = ["CA", "NY", "IL", "TX", "WA"];
      const countries = ["USA", "Canada", "UK", "Australia", "Germany"];

      // Generate 5-15 recipients
      const count = 5 + baseCount;

      for (let i = 0; i < count; i++) {
        const firstNameIndex = i % firstNames.length;
        const lastNameIndex = (i + 2) % lastNames.length;
        const companyIndex = (i + 1) % companies.length;
        const domainIndex = (i + 3) % domains.length;
        const titleIndex = (i + 4) % titles.length;
        const cityIndex = (i + 2) % cities.length;

        const firstName = firstNames[firstNameIndex];
        const lastName = lastNames[lastNameIndex];
        const linkedinHandle = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(
          Math.random() * 100
        )}`;

        dummyRecipients.push({
          id: `dummy-${contactListId}-${i}`,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${
            domains[domainIndex]
          }`,
          company: companies[companyIndex],
          title: titles[titleIndex],
          linkedin: linkedinHandle,
          address: {
            line1: `${1000 + i} Main St`,
            line2: i % 3 === 0 ? `Suite ${100 + i}` : "",
            city: cities[cityIndex],
            state: states[cityIndex],
            zip: `${90000 + i * 100}`,
            country: countries[i % countries.length],
          },
          selected: false,
        });
      }

      return dummyRecipients;
    };

    const dummyData = generateDummyRecipients();
    console.log("Generated dummy data:", dummyData);

    return dummyData;
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
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipient.company &&
          recipient.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (recipient.title &&
          recipient.title.toLowerCase().includes(searchTerm.toLowerCase()));

      // Company filter
      const companyMatch =
        filters.company === "" ||
        (recipient.company &&
          recipient.company
            .toLowerCase()
            .includes(filters.company.toLowerCase()));

      // Title filter
      const titleMatch =
        filters.title === "" ||
        (recipient.title &&
          recipient.title.toLowerCase().includes(filters.title.toLowerCase()));

      return searchMatch && companyMatch && titleMatch;
    });
  };

  // Function to handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Function to reset filters
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

  // Function to toggle select all
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      // Select all visible/filtered recipients
      const visibleRecipients = filterRecipients(formData.recipients).map(
        (r) => r.name
      );
      setSelectedRecipients(new Set(visibleRecipients));
    } else {
      // Deselect all
      setSelectedRecipients(new Set());
    }
  };

  // Function to toggle selection of a single recipient
  const toggleRecipientSelection = (name: string) => {
    setSelectedRecipients((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(name)) {
        newSelected.delete(name);
      } else {
        newSelected.add(name);
      }
      return newSelected;
    });
  };

  // Format address for display (masked version)
  const formatAddressMasked = (
    address?: Recipient["address"]
  ): React.ReactNode => {
    if (!address) {
      return <strong>---</strong>;
    }

    // Helper function to format address field
    const formatField = (value: any): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (value === true) return "";
      return String(value);
    };

    // Convert any values to proper strings
    const formattedAddress = {
      ...address,
      city: formatField(address.city),
      state: formatField(address.state),
      country: formatField(address.country),
    };

    // Create a display string from available parts
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

  const formatBudget = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const [submitLoading, setSubmitLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    // Validation
    let hasError = false;
    const newErrors = { recipients: "", recipientCount: "" };

    // Check recipient count for booth_giveaways
    if (
      allCampaignData?.motion === "booth_giveaways" &&
      desiredRecipientCount <= 0
    ) {
      newErrors.recipientCount = "Recipient count must be greater than 0";
      hasError = true;
    }

    // Budget is fixed at $25 - no validation needed

    const selectedContacts = formData.recipients.filter((recipient) =>
      selectedRecipients.has(recipient.name)
    );

    // Check selected contacts for non-booth_giveaways
    if (
      allCampaignData?.motion !== "booth_giveaways" &&
      selectedContacts.length === 0
    ) {
      newErrors.recipients = "Please select at least one contact to continue";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      setSubmitLoading(false);
      return;
    }

    try {
      // First get current campaign data
      const currentCampaignResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!currentCampaignResponse.ok) {
        throw new Error(
          `Failed to fetch current campaign: ${currentCampaignResponse.status}`
        );
      }

      const currentCampaign = await currentCampaignResponse.json();

      // Then save the budget to the campaign
      const updatePayload = {
        total_recipients:
          allCampaignData?.motion === "booth_giveaways"
            ? desiredRecipientCount
            : selectedContacts.length,

        ...(formData.motion === "boost_registration"
          ? {
              boostRegistration: {
                ...currentCampaign.campaign.boostRegistration, // Preserve existing values
                perGiftCost: budget, // Only update perGiftCost
              },
              budget: {
                totalBudget: budget * selectedContacts.length,
                maxPerGift: budget,
                currency: "USD",
                spent: 0,
              },
            }
          : {
              budget: {
                totalBudget: budget * selectedContacts.length,
                maxPerGift: budget,
                currency: "USD",
                spent: 0,
              },
            }),
      };

      const budgetResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!budgetResponse.ok) {
        setSubmitLoading(false);
        throw new Error(`Failed to save budget: ${budgetResponse.status}`);
      }

      if (allCampaignData?.motion !== "booth_giveaways") {
        // Then save the recipients
        const recipientsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}/contacts/recipients`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contactIds: selectedContacts.map((contact) => contact.id),
            }),
          }
        );

        if (!recipientsResponse.ok) {
          setSubmitLoading(false);
          const errorData = await recipientsResponse.json().catch(() => null);
          throw new Error(
            `Failed to add recipients: ${recipientsResponse.status}${
              errorData ? ` - ${errorData.message}` : ""
            }`
          );
        }
      }

      // Clear any existing errors
      setErrors({ recipients: "", recipientCount: "" });

      // Call onNext with the selected recipients and budget
      setSubmitLoading(false);
      onNext({
        ...formData,
        recipients: selectedContacts,
        ...(formData.motion === "boost_registration"
          ? {
              boostRegistration: {
                ...currentCampaign.campaign.boostRegistration,
                perGiftCost: budget,
              },
            }
          : {
              budget: budget,
            }),
      });
    } catch (error) {
      console.error("Error saving campaign data:", error);
      setErrors({
        recipients: `Failed to save campaign data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        recipientCount: "",
      });
    }
  };

  // Function to enrich recipient data
  const enrichRecipients = async () => {
    // Only process selected recipients
    if (selectedRecipients.size === 0) {
      setErrors({
        recipients: "Please select at least one recipient to enrich",
        recipientCount: "",
      });
      return;
    }

    // Set loading state
    setIsEnriching(true);

    // Get the recipients that are selected
    const selectedRecipientsList = formData.recipients.filter((recipient) =>
      selectedRecipients.has(recipient.name)
    );

    console.log(
      `Starting enrichment for ${selectedRecipientsList.length} recipient(s)`
    );

    let successCount = 0;
    let failureCount = 0;

    // Process each recipient
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

        // Log current recipient data before update
        console.log(`Current recipient data before update:`, {
          id: recipient.id,
          currentAddress: recipient.address,
          newLocationData: {
            city: pdlData.data?.location_locality,
            state: pdlData.data?.location_region,
            country: pdlData.data?.location_country,
          },
        });

        // Update the recipient data in the local state
        setFormData((prev) => {
          console.log("Previous formData:", prev);

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
              console.log("Updating recipient:", {
                id: r.id,
                oldAddress: r.address,
                newAddress: updatedRecipient.address,
                pdlLocation: {
                  locality: pdlData.data?.location_locality,
                  region: pdlData.data?.location_region,
                  country: pdlData.data?.location_country,
                },
              });
              return updatedRecipient;
            }
            return r;
          });

          const newFormData: FormData = {
            ...prev,
            recipients: updatedRecipients,
            motion: prev.motion,
          };

          console.log("New formData:", newFormData);
          return newFormData;
        });

        successCount++;
        console.log(
          `✅ Successfully enriched and saved data for ${recipient.name}`
        );

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failureCount++;
        console.error(`❌ Error enriching ${recipient.name}:`, error);
      }
    }

    // Reset loading state
    setIsEnriching(false);

    // Show final status message
    // const totalProcessed = successCount + failureCount;
    // setErrors({
    //   ...errors,
    //   recipients: `✓ Completed enrichment: ${successCount} successful, ${failureCount} failed out of ${totalProcessed} total`
    // });

    // Clear success message after 5 seconds
    setTimeout(() => {
      setErrors({
        recipients: "",
        recipientCount: "",
      });
    }, 5000);
  };

  const [desiredRecipientCount, setDesiredRecipientCount] = useState(100);

  // Function to update recipient count
  const updateRecipientCount = (count: number) => {
    if (count < 0) return; // Don't allow less than 0 recipient
    console.log("Updating recipient count to:", count);
    setDesiredRecipientCount(count);

    // Clear recipient count error when updating
    if (errors.recipientCount) {
      setErrors((prev) => ({ ...prev, recipientCount: "" }));
    }
  };

  // Budget is fixed at $25 - no validation needed

  return (
    <div>
      {/* { allCampaignData?.motion} */}
      {allCampaignData?.motion !== "booth_giveaways" ? (
        <div className={``}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Campaign Recipients</h2>

            {/* Add Recipients button - only show when a list is selected and contact selection is hidden */}
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
              ? "Select a contact list to add recipients to your campaign."
              : "Recipients for your campaign are shown below."}
          </p>

          {/* Contact List Selection - Only show when showContactSelection is true */}
          {showContactSelection && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Select Contact List</h3>

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
                  <span className="text-gray-500">
                    Loading contact lists...
                  </span>
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
                    <span className="font-medium">
                      Error loading contact lists
                    </span>
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
                    You don't have any contact lists yet. Create a contact list
                    in the Contacts section before setting up your campaign.
                  </p>
                  <Link
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
                  </Link>
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
                            // Filter by search term
                            const searchMatch =
                              searchTerm === "" ||
                              list.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              (list.description &&
                                list.description
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase()));

                            // Filter by tags
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
                              {list.name} ({list.recipientCount || 0}{" "}
                              recipients)
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
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

                  {/* REMOVE FOR PRODUCTION: Debug buttons */}
                  <div className="mt-4 flex gap-2 hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (contactLists.length > 0) {
                          const firstListId = contactLists[0]._id;
                          console.log(
                            "Debug: Loading dummy data for first list:",
                            firstListId
                          );
                          loadFromContactList(firstListId);
                        } else {
                          alert(
                            "No contact lists available. Please create one first."
                          );
                        }
                      }}
                      className="px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-mono text-xs"
                    >
                      DEBUG: Load First List With Dummy Data
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const dummyListId = "debug-list-123";
                        console.log(
                          "Debug: Loading direct dummy data with ID:",
                          dummyListId
                        );
                        setFormData({
                          recipientSource: "contact-list",
                          selectedContactListId: dummyListId,
                          recipients: loadDummyRecipientsForList(dummyListId),
                          motion: formData.motion,
                        });
                        setShowContactSelection(false);
                        setErrors({
                          recipients:
                            "⚠️ DEVELOPMENT MODE: Using direct debug data.",
                          recipientCount: "",
                        });
                      }}
                      className="px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-mono text-xs"
                    >
                      DEBUG: Direct Load Dummy Data
                    </button>
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

                  {/* Filters */}
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
                                        tags: filters.tags.filter(
                                          (t) => t !== tag
                                        ),
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
                                      <line
                                        x1="18"
                                        y1="6"
                                        x2="6"
                                        y2="18"
                                      ></line>
                                      <line
                                        x1="6"
                                        y1="6"
                                        x2="18"
                                        y2="18"
                                      ></line>
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

          {/* Show selected contact list info when contact selection is hidden */}
          {!showContactSelection && formData.selectedContactListId && (
            <div className="mb-6">
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

          {/* Recipients List - Only show if a contact list is selected and contact selection is hidden */}
          {formData.selectedContactListId && !showContactSelection && (
            <div className="mb-8">
              {errors.recipients &&
                errors.recipients.includes("DEVELOPMENT MODE") && (
                  <div className="mb-4 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 rounded-md overflow-hidden">
                    <div className="bg-amber-500 text-white py-1 px-3 text-sm font-bold">
                      DEVELOPMENT MODE - SAMPLE DATA
                    </div>
                    <div className="p-3 flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 mt-0.5 text-amber-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">
                          Using sample recipients data
                        </p>
                        <p className="text-sm mt-1">
                          Showing randomly generated recipients since we
                          couldn't connect to the API. You can continue with
                          these sample recipients for testing purposes.
                        </p>
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-amber-700 border border-amber-200">
                          <p className="font-mono">
                            {/* TODO: Remove dummy data implementation before production */}
                          </p>
                          <p className="mt-1 font-mono">
                            {/* Error: */}
                            {errors.recipients.split("API error:")[1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* {errors.recipients &&
                !errors.recipients.includes("DEVELOPMENT MODE") && (
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
                )} */}

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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={enrichRecipients}
                          disabled={
                            isEnriching || selectedRecipients.size === 0
                          }
                          className={`flex items-center px-3 py-2 text-sm border border-primary rounded-md hover:bg-gray-50 text-primary ${
                            isEnriching || selectedRecipients.size === 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isEnriching ? (
                            <>
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
                              Enriching...
                            </>
                          ) : (
                            "Enrich Recipients"
                          )}
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

                    {/* Filter options */}
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
                              setFilters({
                                ...filters,
                                company: e.target.value,
                              })
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
                  <div className="max-h-[500px] overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed ">
                      <thead className="bg-gray-50 sticky top-0">
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
                      <tbody className="bg-white divide-y divide-gray-200 h-fit max-h-[300px] overflow-y-auto">
                        {filterRecipients(formData.recipients).map(
                          (recipient) => (
                            <tr
                              key={recipient.name}
                              className={
                                selectedRecipients.has(recipient.name)
                                  ? "bg-purple-50"
                                  : undefined
                              }
                            >
                              <td className="pl-3 pr-0 py-3 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={selectedRecipients.has(
                                    recipient.name
                                  )}
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
                                <span title={recipient.email}>
                                  {recipient.email}
                                </span>
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
                                {/* {(recipient.address?.country ||
                            recipient.address?.state ||
                            recipient.address?.city) } */}
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
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Show when no recipients match filters */}
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
      ) : (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                updateRecipientCount(Math.max(0, desiredRecipientCount - 1))
              }
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="relative w-32">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* <span className="text-gray-500 sm:text-sm">$</span> */}
              </div>
              <input
                type="number"
                value={desiredRecipientCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 0) {
                    updateRecipientCount(value);
                  } else if (e.target.value === "") {
                    updateRecipientCount(0);
                  }
                }}
                min="0"
                max="250"
                step="1"
                className="block w-full pl-7 pr-3 py-2 text-center border-gray-300 rounded-md focus:ring-primary focus:border-primary text-lg"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                updateRecipientCount(Math.min(250, desiredRecipientCount + 1))
              }
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 text-sm text-gray-500 text-center">
            Select Total Recepient count
          </div>
        </div>
      )}

      {/* Budget is fixed at $25 - no slider needed */}

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 h-fit border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        <div className="flex flex-col items-end">
          {/* Show validation errors */}

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center ${
              // Disable button conditions
              submitLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>Continue</>
            )}
            {allCampaignData?.motion !== "booth_giveaways" &&
              selectedRecipients.size > 0 && (
                <span className="ml-2 text-sm">
                  ({selectedRecipients.size} selected)
                </span>
              )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {(errors.recipients || errors.recipientCount) && (
            <div className="mt-2 text-right">
              {errors.recipients && (
                <p className="text-sm w-fit text-red-600 mb-1 bg-red-100 p-2 rounded-md border border-red-300">
                  {errors.recipients}
                </p>
              )}
              {errors.recipientCount && (
                <p className="text-sm w-fit text-red-600 mb-1 bg-red-100 p-2 rounded-md border border-red-300">
                  {errors.recipientCount}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipients;
