"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useRouter } from "next/navigation";
import { linkedInService } from "@/app/services/linkedin.service";
import { oceanService } from "@/app/services/ocean.service";
import * as XLSX from "xlsx/xlsx.mjs";
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import RangeSlider from "@/components/common/RangeSlider";
import InfinityLoader from "@/components/common/InfinityLoader";
import { Button } from "@/components/ui/button";
import ImportFromCRM from "@/app/components/ImportFromCRM";
import ExportToCRM from "@/app/components/ExportToCRM";
import {
  DelightDiscoverDrawer,
  DelightDiscoverIcon,
} from "@/components/delight-discover";
import PageHeader from "@/components/layouts/PageHeader";
import {
  Users,
  Upload,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  linkedin_url?: string;
  company: string;
  jobtitle: string;
  title?: string; // Add optional title field for API response compatibility
  photo?: string;
  country?: string;
  city?: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  enrichment?: {
    data: any;
    likelihood: number;
  };
}

interface List {
  _id: string;
  name: string;
  description: string;
  source: {
    manual: boolean;
    csv: boolean;
    discover?: boolean;
    crm: {
      type: string | null;
    };
  };
  recipients: Array<{
    recipientId: string;
    addedAt: string;
  }>;
  tags: string[];
  metrics: {
    totalRecipients: number;
    campaignsUsed: number;
    playbooksUsed: number;
  };
  status: string;
  usage: {
    campaignIds: string[];
    playbookIds: string[];
  };
  updatedAt?: string; // Add this to fix the linter error
}

// Add Skeleton Components
const ContactHeaderSkeleton = () => (
  <div >
    <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
    <div className="flex gap-4 mb-6">
      <div className="h-5 w-24 bg-gray-200 rounded"></div>
      <div className="h-5 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ContactRowSkeleton = () => (
  <tr className="border-b border-[#D2CEFE]">
    <td className="w-[40px] px-6 py-4">
      <div className="h-4 w-4 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-32 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-40 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-24 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-32 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-36 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-28 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </td>
  </tr>
);

// Add validation types
interface ValidationErrors {
  email: string;
  phone: string;
}

// Add the formatAddressMasked function
const formatAddressMasked = (
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null
): string => {
  if (!address) {
    return "---";
  }

  // Check if all address fields are empty or null
  const hasAnyValue = Object.values(address).some(
    (value) => value && value.trim() !== "" && value !== "****"
  );

  if (!hasAnyValue) {
    return "---";
  }

  // Build address parts array
  const parts: string[] = [];

  // Add line1 (first 3 chars + mask)
  if (address.line1 && address.line1.trim().length > 0) {
    parts.push(`${address.line1.substring(0, 3)}****`);
  }

  // Add line2 (always masked)
  parts.push("****");

  // Add remaining fields if they exist and aren't empty
  if (address.city && address.city.trim() !== "" && address.city !== "****")
    parts.push(address.city);
  if (address.state && address.state.trim() !== "" && address.state !== "****")
    parts.push(address.state);
  if (
    address.country &&
    address.country.trim() !== "" &&
    address.country !== "****"
  )
    parts.push(address.country);
  if (address.zip && address.zip.trim() !== "" && address.zip !== "****")
    parts.push(address.zip);

  if (parts.length === 0) {
    return "---";
  }

  return parts.join(", ");
};

// Add helper function for address masking at the top of the file
const maskAddress = (address: string | undefined | null): string => {
  if (!address) return "****";
  return `${address.substring(0, 3)}****`;
};

// Update PDL response interface
interface PDLResponse {
  status: number;
  likelihood: number;
  data: {
    work_email?: string;
    emails?: Array<{ address: string; type: string }>;
    job_company_location_street_address?: string | null;
    job_company_location_address_line_2?: string | null;
    job_company_location_locality?: string | null;
    job_company_location_region?: string | null;
    job_company_location_country?: string | null;
    job_company_location_postal_code?: string | null;
  };
}

// Add type definitions at the top of the file
interface EmailFinderResponse {
  result: string;
  valid_email: string | null;
  error: string | null;
}

export default function ContactListDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const resolvedParams = use(params);
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showLookalikeModal, setShowLookalikeModal] = useState(false);
  const [contactsWithErrors, setContactsWithErrors] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncData, setSyncData] = useState({
    platform: "",
    syncPreference: "",
  });
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [showSlider, setShowSlider] = useState(false);
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookAlikeError, setLookAlikeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasNewContacts, setHasNewContacts] = useState(false);
  const [similarContacts, setSimilarContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportCSVModal, setShowImportCSVModal] = useState(false);
  const [showRenameListModal, setShowRenameListModal] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Array<any>>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContactForm, setNewContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    company: "",
    linkedinUrl: "",
    notes: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });
  const [pendingContacts, setPendingContacts] = useState<Array<any>>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    hasEmail: false,
    hasLinkedIn: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [contactsToDelete, setContactsToDelete] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  // Add validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: "",
    phone: "",
  });
  // Add to your state declarations
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingContacts, setEnrichingContacts] = useState<Set<string>>(
    new Set()
  );
  // Add to your state declarations
  const [lookAlikeCount, setLookAlikeCount] = useState<number>(1);

  // Add state for selected look-alike contacts
  const [selectedLookalikeContacts, setSelectedLookalikeContacts] = useState<
    Set<string>
  >(new Set());
  const [selectAllLookalikes, setSelectAllLookalikes] = useState(false);

  // Add state for look-alike filters
  const [lookalikeSearchTerm, setLookalikeSearchTerm] = useState("");
  const [lookalikeFilters, setLookalikeFilters] = useState({
    company: "",
    role: "",
    hasEmail: false,
    hasLinkedIn: false,
  });
  const [showLookalikeFilters, setShowLookalikeFilters] = useState(false);

  // Add state for Delight Discover functionality
  const [showDiscoverDrawer, setShowDiscoverDrawer] = useState(false);
  const [isDiscoverList, setIsDiscoverList] = useState(false);

  const platforms = ["Hubspot", "Salesforce", "Eventbrite"];
  const syncPreferences = ["Real-time", "Scheduled"];

  // Add dummy data
  const [lookalikeContacts, setLookalikeContacts] = useState<Contact[]>([]);

  // Add loading state at the top with other states
  const [isLookalikeSearching, setIsLookalikeSearching] = useState(false);
  const [isSavingLookalikes, setIsSavingLookalikes] = useState(false);

  // At the top, add:
  const [csvError, setCsvError] = useState<string | null>(null);
  const [showImportCRMModal, setShowImportCRMModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingCookies) {
      checkAuthAndFetchList();
    }
  }, [isLoadingCookies]);

  // Add useEffect to handle URL query parameters for auto-opening Delight Discover
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openDiscover = urlParams.get("openDiscover");

    if (openDiscover === "true") {
      setShowDiscoverDrawer(true);
      // Clean up the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleCRMImport = async (platform: string, listId?: string) => {
    try {
      // Handle the import based on the selected platform
      console.log(
        `Importing from ${platform}`,
        listId ? `List ID: ${listId}` : ""
      );

      // Refresh the contact lists after successful import
      await fetchContacts();

      // Close the modal
      setShowImportCRMModal(false);
    } catch (error) {
      console.error("Error refreshing lists after CRM import:", error);
    }
  };

  const handleCRMExport = async (platform: string, listId?: string) => {
    console.log("Exporting to", platform, "list:", listId);
    // Add your export logic here
  };

  const checkAuthAndFetchList = async () => {
    try {
      // Get user data from cookie
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      // Check if this is a dummy discover list (numeric ID only, no prefix)
      const isDummyDiscoverList = /^\d+$/.test(resolvedParams.id);

      if (isDummyDiscoverList) {
        // For UI validation, check localStorage for list name if available
        let listName = "My Delight Discover List";
        try {
          const recentLists = localStorage.getItem("recentDiscoverLists");
          if (recentLists) {
            const parsed = JSON.parse(recentLists);
            const foundList = parsed.find(
              (l: any) => l.id === resolvedParams.id
            );
            if (foundList) {
              listName = foundList.name;
            }
          }
        } catch (e) {
          console.log("No localStorage data available");
        }

        // Create dummy list for UI validation
        const dummyList = {
          _id: resolvedParams.id,
          name: listName,
          description: "Created with Delight Discover",
          source: {
            manual: false,
            csv: false,
            discover: true,
            crm: { type: null },
          },
          recipients: [],
          tags: ["delight-discover"],
          metrics: {
            totalRecipients: 0,
            campaignsUsed: 0,
            playbooksUsed: 0,
          },
          status: "active",
          usage: {
            campaignIds: [],
            playbookIds: [],
          },
        };
        setList(dummyList);
        setIsDiscoverList(true);
        setContacts([]); // Empty contacts for discover list
        setLoading(false);
        return;
      }

      // Fetch list details for real lists
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        console.log("Unauthorized, redirecting to login");
        router.push("/");
        return;
      }

      const data = await response.json();
      console.log("List data:", data);

      if (!data.list) {
        console.log(
          "Failed to fetch list:",
          data.message || "No list data received"
        );
        router.push("/contact-lists");
        return;
      }

      setList(data.list);

      // Check if this is a discover list based on source
      const isDiscoverSource = data.list.source?.discover === true;
      setIsDiscoverList(isDiscoverSource);

      // Auto-open Delight Discover drawer if the source is "Delight Discover"
      if (isDiscoverSource) {
        setShowDiscoverDrawer(true);
      }

      // Use the direct API to fetch contacts instead of the old approach
      await fetchContacts();
      setHasNewContacts(false); // Existing contacts are not new
    } catch (error) {
      console.error("Error fetching list details:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      router.push("/contact-lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        // Get all menus and their trigger buttons
        const menus = document.querySelectorAll(".contact-menu");
        const triggers = document.querySelectorAll(".three-dots");

        // Check if click is outside both menu and trigger
        const isOutsideMenu = Array.from(menus).every(
          (menu) => !menu.contains(event.target as Node)
        );
        const isOutsideTrigger = Array.from(triggers).every(
          (trigger) => !trigger.contains(event.target as Node)
        );

        if (isOutsideMenu && isOutsideTrigger) {
          setOpenMenuId(null);
        }
      }
    };

    // Add event listener to window instead of document for better coverage
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((contact) => contact.id)));
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
    setSelectAll(newSelected.size === contacts.length);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://hook.eu2.make.com/56v54hsgwkk1n4eknqh3b93omgojy5v5",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platform: syncData.platform }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();
      console.log("Synced Contacts:", data);

      // Transform the data to match your Contact interface
      const transformedContacts: Contact[] = data.map((item: any) => ({
        id: item.properties.hs_object_id?.toString() || "",
        name: `${item.properties.firstname} ${item.properties.lastname}`,
        email: item.properties.email || "",
        company: item.properties.company || "",
        jobtitle: item.properties.jobtitle || "",
        phone: item.properties.phone || "",
        linkedin: item.properties.hs_linkedin_url || "",
        country: item.properties.country || "",
        city: item.properties.city || "",
      }));

      // Update contacts state with the new data
      setContacts(transformedContacts);
      setHasNewContacts(true); // Set to true when new contacts are loaded

      // Close modal and reset form
      setShowSyncModal(false);
      setSyncData({ platform: "", syncPreference: "" });
    } catch (error) {
      console.error("Error syncing contacts:", error);
    }
  };

  // Add handler for Delight Discover filters
  const handleApplyDiscoverFilters = async (filters: any) => {
    console.log("Applying Delight Discover filters:", filters);
    // This is a placeholder for future backend integration
    // For now, we'll just simulate some dummy contacts
    const dummyContacts: Contact[] = [
      {
        id: "discover-1",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0123",
        linkedin: "john-smith",
        linkedin_url: "https://linkedin.com/in/john-smith",
        company: "Tech Corp",
        jobtitle: "Software Engineer",
        country: "USA",
        city: "San Francisco",
        address: {
          line1: "123 Main St",
          line2: "Apt 4B",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "USA",
        },
      },
      {
        id: "discover-2",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1-555-0456",
        linkedin: "jane-doe",
        linkedin_url: "https://linkedin.com/in/jane-doe",
        company: "Marketing Inc",
        jobtitle: "Marketing Manager",
        country: "USA",
        city: "New York",
        address: {
          line1: "456 Broadway",
          line2: "Suite 123",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA",
        },
      },
    ];

    setContacts(dummyContacts);
    setHasNewContacts(true);
  };

  const handleSave = async (contactsToSave: Contact[] = contacts) => {
    setActionLoading("saving");
    try {
      if (!contactsToSave || contactsToSave.length === 0) {
        setError("No contacts to save");
        return;
      }

      setIsSaving(true);
      setError(null);

      const response = await fetch(
        `/api/lists/${resolvedParams.id}/recipients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contacts: contactsToSave,
            source: syncData.platform ? "crm" : "manual",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save contacts");
      }

      if (data.success) {
        setList(data.data.list);
        setShowSlider(false);
        setError(null);
        setHasNewContacts(false);
        setSimilarContacts([]); // Clear similar contacts after saving

        // Transform the returned recipients into the correct format
        if (data.data.recipients) {
          const formattedRecipients = data.data.recipients.map(
            (recipient: any) => ({
              id: recipient._id,
              name: `${recipient.firstName} ${recipient.lastName}`,
              email: recipient.mailId || "",
              phone: recipient.phoneNumber || "",
              linkedin: recipient.linkedinUrl || "",
              company: recipient.companyName || "",
              jobtitle: recipient.jobTitle || "",
              country: recipient.country || "",
              city: recipient.city || "",
            })
          );
          setContacts(formattedRecipients);
        }

        // Show success message if there's one
        if (data.data.message) {
          setError(data.data.message); // Using error state to show the message
        }
      } else {
        throw new Error(data.error || "Failed to save contacts");
      }
    } catch (error) {
      console.error("Error saving contacts:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while saving contacts"
      );
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  const handleFindSimilar = async () => {
    setActionLoading("searching");
    try {
      setIsSearching(true);
      setIsBuilding(true);
      setShowSlider(false);
      setShowActionButtons(false);
      setError(null);

      const selectedContactsList = contacts.filter((contact) =>
        selectedContacts.has(contact.id)
      );

      if (selectedContactsList.length === 0) {
        setError("Please select at least one contact to find similar profiles");
        setIsBuilding(false);
        return;
      }

      const linkedinUrls = selectedContactsList
        .map((contact) => contact.linkedin)
        .filter((url) => url);

      if (linkedinUrls.length === 0) {
        setError("Selected contacts must have LinkedIn profiles");
        setIsBuilding(false);
        return;
      }

      // Start the lookalike job
      const response = await fetch(
        `/api/lists/${resolvedParams.id}/lookalike`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkedinUrls,
            count: selectedNumber || 1,
            vendor:
              process.env.NEXT_PUBLIC_USE_OCEAN_SERVICE === "true"
                ? "ocean"
                : "linkedin",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start lookalike search");
      }

      // Redirect to contact lists page
      console.log("Redirecting to contact lists page");
      router.push("/contact-lists");
    } catch (error) {
      console.error("Error in handleFindSimilar:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to find similar contacts"
      );
      setShowActionButtons(true);
    } finally {
      setIsSearching(false);
      setActionLoading(null);
    }
  };

  const handleMenuToggle = (contactId: string) => {
    setOpenMenuId(openMenuId === contactId ? null : contactId);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleFile = async (file: File) => {
    console.log("🚀 Starting handleFile process:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const fileType = file.name.split(".").pop()?.toLowerCase();
    console.log("📁 Detected file type:", fileType);

    if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
      if (file.size <= 2 * 1024 * 1024) {
        setUploadedFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Use the new upload endpoint instead of manual parsing
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                accept: "application/json",
              },
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload file");
          }

          const data = await response.json();

          if (data.success) {
            console.log("✅ File upload successful:", data);
            setUploadProgress(100);

            // Refresh contacts list after successful upload
            await fetchContacts();

            setShowSlider(false);
            setUploadedFile(null);
            setParsedContacts([]);
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (error) {
          console.error("❌ Error uploading file:", error);
          setError(error instanceof Error ? error.message : "Upload failed");
        } finally {
          setIsUploading(false);
        }
      } else {
        console.warn("⚠️ File size exceeds limit:", file.size);
        setError("File size should be less than 2MB");
      }
    } else {
      console.warn("⚠️ Invalid file type:", fileType);
      setError("Please upload a .csv, .xls, or .xlsx file");
    }
  };

  // Add validation functions
  const validateEmail = (email: string): string => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Please enter a valid email address";
  };

  const validatePhone = (phone: string): string => {
    if (!phone) return ""; // Phone is optional
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone) ? "" : "Please enter a valid phone number";
  };

  // Function to validate form
  const isFormValid = (): boolean => {
    // Check required fields
    if (
      !newContactForm.firstName ||
      !newContactForm.lastName ||
      !newContactForm.email ||
      !newContactForm.jobTitle ||
      !newContactForm.company ||
      !newContactForm.linkedinUrl
    ) {
      return false;
    }

    // Check email format even if no error is displayed yet
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactForm.email);
    if (!emailValid) {
      return false;
    }

    // Check phone format if provided
    if (newContactForm.phone && newContactForm.phone.trim() !== "") {
      const phoneRegex =
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(newContactForm.phone)) {
        return false;
      }
    }

    // Check displayed validation errors
    if (validationErrors.email || validationErrors.phone) {
      return false;
    }

    return true;
  };

  // Handle field blur for validation
  const handleFieldBlur = (field: keyof ValidationErrors, value: string) => {
    if (field === "email") {
      setValidationErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else if (field === "phone") {
      setValidationErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  // Modify handleSaveAndAddNew to include validation
  const handleSaveAndAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting handleSaveAndAddNew with form data:", newContactForm);

    // Validate required fields and format
    const emailError = validateEmail(newContactForm.email);
    const phoneError = validatePhone(newContactForm.phone || "");

    setValidationErrors({
      email: emailError,
      phone: phoneError,
    });

    if (emailError || phoneError || !isFormValid()) {
      console.log("Validation failed:", { emailError, phoneError });
      return;
    }

    // Add current contact to pending list
    const newPendingContact = {
      name: `${newContactForm.firstName} ${newContactForm.lastName}`.trim(),
      email: newContactForm.email,
      phone: newContactForm.phone || "",
      company: newContactForm.company,
      jobtitle: newContactForm.jobTitle,
      linkedin: newContactForm.linkedinUrl,
      notes: newContactForm.notes,
    };
    console.log("Adding new pending contact:", newPendingContact);

    setPendingContacts((prev) => {
      const updated = [...prev, newPendingContact];
      console.log("Updated pending contacts:", updated);
      return updated;
    });

    // Reset form for next contact
    console.log("Resetting form fields");
    setNewContactForm({
      firstName: "",
      lastName: "",
      email: "",
      jobTitle: "",
      company: "",
      linkedinUrl: "",
      notes: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
    });

    // Reset validation errors
    setValidationErrors({
      email: "",
      phone: "",
    });
  };

  // Modify handleEditContact to validate existing contact data when loaded
  const handleEditContact = (contact: Contact) => {
    const [firstName, ...lastNameParts] = contact.name.split(" ");
    const linkedinUrl =
      contact.linkedin?.replace(
        /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i,
        ""
      ) || "";

    const formData = {
      firstName: firstName || "",
      lastName: lastNameParts.join(" ") || "",
      email: contact.email || "",
      jobTitle: contact.jobtitle || "",
      company: contact.company || "",
      linkedinUrl: linkedinUrl,
      notes: "",
      phone: contact.phone || "",
      address: {
        line1: contact.address?.line1 || "",
        line2: contact.address?.line2 || "",
        city: contact.address?.city || contact.city || "",
        state: contact.address?.state || "",
        zip: contact.address?.zip || "",
        country: contact.address?.country || contact.country || "",
      },
    };

    // Set form data
    setEditingContact(contact);
    setNewContactForm(formData);
    setShowAddContactModal(true);

    // Silently validate the fields (don't show errors yet)
    setValidationErrors({
      email: "", // Don't show errors initially
      phone: "", // Don't show errors initially
    });
  };

  // Add this function after the useEffect hooks
  const fetchContacts = async () => {
    console.log("Starting fetchContacts with direct API call...");
    try {
      setDataLoading(true);

      // Use the contacts endpoint from your refactored backend
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/details`;

      // Use authorization from the context
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
      console.log("contacts Response:", data);

      if (data.success && data.contacts) {
        // Map the API response to our Contact interface
        const formattedContacts = data.contacts.map((contact: any) => ({
          id: contact._id,
          name:
            contact.name ||
            `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          email: contact.email || contact.mailId || "",
          phone: contact.phone || contact.phoneNumber || "",
          linkedin: contact.linkedin || contact.linkedinUrl || "",
          company: contact.company || contact.companyName || "",
          jobtitle: contact.jobtitle || contact.jobTitle || "",
          address: contact.address || {
            line1: "",
            line2: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
        }));

        console.log("Formatted contacts:", formattedContacts);
        setContacts(formattedContacts);
      } else {
        // Handle empty or error response
        setContacts([]);
        console.error("API returned no contacts or success: false");
      }
    } catch (error) {
      console.error("Error in fetchContacts:", error);
      setError("Failed to fetch contacts from API");
      setContacts([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Add this function to refresh list data
  const refreshListData = async () => {
    try {
      // Get list details
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch list details");
      }
      const data = await response.json();
      if (data.list) {
        setList(data.list);

        // Use the direct API to fetch contacts
        await fetchContacts();
      }
    } catch (error) {
      console.error("Error refreshing list data:", error);
    }
  };

  // Modify handleSaveContacts to include validation
  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting handleSaveContacts with form data:", newContactForm);

    try {
      if (editingContact) {
        // Validate when editing a contact
        const emailError = validateEmail(newContactForm.email);
        const phoneError = validatePhone(newContactForm.phone || "");

        setValidationErrors({
          email: emailError,
          phone: phoneError,
        });

        if (emailError || phoneError || !isFormValid()) {
          return;
        }

        // Prepare update request body
        const updateData = {
          firstName: newContactForm.firstName,
          lastName: newContactForm.lastName,
          mailId: newContactForm.email,
          companyName: newContactForm.company,
          jobTitle: newContactForm.jobTitle,
          phoneNumber: newContactForm.phone || "",
          linkedinUrl: newContactForm.linkedinUrl
            ? `https://linkedin.com/in/${newContactForm.linkedinUrl}`
            : "",
          address: {
            line1: newContactForm.address.line1 || "",
            line2: newContactForm.address.line2 || "",
            city: newContactForm.address.city || "",
            state: newContactForm.address.state || "",
            country: newContactForm.address.country || "",
            zip: newContactForm.address.zip || "",
          },
        };

        console.log("📤 Making API call to update contact:", updateData);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/${editingContact.id}`,
          {
            method: "PUT",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update contact: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✅ Contact update successful:", result);

        // Refresh contacts list
        await fetchContacts();

        // Close modal and reset form
        setShowAddContactModal(false);
        setNewContactForm({
          firstName: "",
          lastName: "",
          email: "",
          jobTitle: "",
          company: "",
          linkedinUrl: "",
          notes: "",
          phone: "",
          address: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
        });
        setEditingContact(null);
        setValidationErrors({ email: "", phone: "" });
      } else {
        // Handle adding new contact(s)
        const contactData = {
          name: `${newContactForm.firstName} ${newContactForm.lastName}`.trim(),
          email: newContactForm.email,
          phone: newContactForm.phone || "",
          company: newContactForm.company,
          jobtitle: newContactForm.jobTitle,
          linkedin: newContactForm.linkedinUrl
            ? `https://linkedin.com/in/${newContactForm.linkedinUrl}`
            : "",
          notes: newContactForm.notes,
          address: newContactForm.address,
        };

        const contactsToSave =
          newContactForm.firstName ||
          newContactForm.lastName ||
          newContactForm.email
            ? [...pendingContacts, contactData]
            : pendingContacts;

        console.log("Saving new contacts:", contactsToSave);

        if (contactsToSave.length === 0) {
          //alert("Please add at least one contact");
          return;
        }

        // Format contacts according to the API requirements
        const formattedContacts = contactsToSave.map((contact) => ({
          name:
            contact.name ||
            `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          email: contact.email,
          phone: contact.phone || "",
          company: contact.company || "",
          jobtitle: contact.jobtitle || contact.jobTitle || "",
          linkedin: contact.linkedin || contact.linkedin_url || "",
          address: contact.address || {
            line1: "",
            line2: "",
            city: contact.city || "",
            state: "",
            zip: "",
            country: contact.country || "",
          },
        }));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
              accept: "application/json",
            },
            body: JSON.stringify({
              contacts: formattedContacts,
              source: "manual",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        console.log("Add contacts response:", data);

        if (!data.success) {
          throw new Error(data.error || "Failed to add contacts");
        }

        // Close modal and reset states
        setShowAddContactModal(false);
        setNewContactForm({
          firstName: "",
          lastName: "",
          email: "",
          jobTitle: "",
          company: "",
          linkedinUrl: "",
          notes: "",
          phone: "",
          address: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
        });
        setPendingContacts([]);
        setValidationErrors({ email: "", phone: "" });

        // Refresh contacts list
        await fetchContacts();
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      //alert("Failed to save contact. Please try again.");
    }
  };

  // CSV Processing function
  const processCSVFile = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split("\n");

          if (lines.length < 2) {
            reject(
              new Error("CSV file must have at least a header and one data row")
            );
            return;
          }

          // Get headers from first row
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          console.log("📋 Original CSV headers:", headers);

          // Field mapping - maps various possible header names to backend expected names
          const fieldMapping: { [key: string]: string[] } = {
            firstName: [
              "firstName",
              "first_name",
              "First Name",
              "FirstName",
              "first name",
              "firstname",
            ],
            lastName: [
              "lastName",
              "last_name",
              "Last Name",
              "LastName",
              "last name",
              "lastname",
              "last name",
            ],
            email: [
              "email",
              "Email",
              "mail",
              "mailId",
              "mail_id",
              "emailId",
              "email_id",
            ],
            phoneNumber: [
              "phoneNumber",
              "phone_number",
              "Phone Number",
              "PhoneNumber",
              "phone number",
              "phone",
            ],
            company: [
              "companyName",
              "company_name",
              "Company Name",
              "CompanyName",
              "company name",
              "company",
            ],
            jobTitle: [
              "jobTitle",
              "job_title",
              "Job Title",
              "JobTitle",
              "job title",
              "jobtitle",
              "title",
              "position",
              "job",
            ],
            linkedinUrl: [
              "linkedinUrl",
              "linkedin_url",
              "LinkedIn URL",
              "LinkedInUrl",
              "linkedin url",
              "linkedin",
            ],
            addressLine1: [
              "addressLine1",
              "address_line_1",
              "Address Line 1",
              "address line 1",
              "line1",
              "Line 1",
            ],
            addressLine2: [
              "addressLine2",
              "address_line_2",
              "Address Line 2",
              "address line 2",
              "line2",
              "Line 2",
            ],
            city: ["city", "City", "town", "Town"],
            state: [
              "state",
              "State",
              "province",
              "Province",
              "region",
              "Region",
            ],
            zip: [
              "zip",
              "Zip",
              "zipcode",
              "postal_code",
              "PostalCode",
              "postalCode",
            ],
            country: ["country", "Country", "nation", "Nation"],
          };

          // Create mapping from original headers to backend expected headers
          const headerMapping: { [key: number]: string } = {};
          const mappedHeaders: string[] = [];

          headers.forEach((originalHeader, index) => {
            let mappedHeader = originalHeader; // Default to original header

            // Try to find a match in our field mapping
            for (const [backendField, possibleHeaders] of Object.entries(
              fieldMapping
            )) {
              if (possibleHeaders.includes(originalHeader)) {
                mappedHeader = backendField;
                break;
              }
            }

            headerMapping[index] = mappedHeader;
            mappedHeaders.push(mappedHeader);
          });

          console.log("🔄 Header mapping:", headerMapping);
          console.log("📝 Mapped headers:", mappedHeaders);

          // Ensure we have required fields
          const requiredFields = ["firstName", "email"];
          const hasRequiredFields = requiredFields.every((field) =>
            mappedHeaders.includes(field)
          );

          if (!hasRequiredFields) {
            console.warn(
              "⚠️ Missing required fields. Available headers:",
              mappedHeaders
            );
            console.warn("📋 Required fields:", requiredFields);
            // Don't reject - let backend handle validation with better error messages
          }

          // Create new CSV with mapped headers
          const newLines = [mappedHeaders.join(",")];

          // Process data rows
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = line
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""));

              // Ensure we have the right number of values
              while (values.length < headers.length) {
                values.push("");
              }

              newLines.push(values.join(","));
            }
          }

          const processedCSV = newLines.join("\n");
          console.log(
            "✅ Processed CSV sample:",
            processedCSV.substring(0, 200) + "..."
          );

          // Create new file with processed CSV
          const blob = new Blob([processedCSV], { type: "text/csv" });
          const processedFile = new File([blob], file.name, {
            type: "text/csv",
          });

          resolve(processedFile);
        } catch (error) {
          console.error("❌ Error processing CSV:", error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Add this function after the other handler functions
  const handleDeleteContacts = async () => {
    try {
      setIsDeleting(true);
      const idsToDelete =
        contactsToDelete.length > 0
          ? contactsToDelete
          : [openMenuId].filter(Boolean);

      if (idsToDelete.length === 0) {
        throw new Error("No contacts selected for deletion");
      }

      // Delete contacts sequentially
      for (const contactId of idsToDelete) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/${contactId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete contact ${contactId}`);
        }
      }

      // After successful deletion, fetch fresh contacts
      await fetchContacts();

      // Reset states
      setSelectedContacts(new Set());
      setSelectAll(false);
      setContactsToDelete([]);
      setShowDeleteContactModal(false);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting contacts:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete contacts"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Add filter function
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !searchTerm ||
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.jobtitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany =
      !filters.company ||
      contact.company?.toLowerCase().includes(filters.company.toLowerCase());
    const matchesRole =
      !filters.role ||
      contact.jobtitle?.toLowerCase().includes(filters.role.toLowerCase());
    const matchesEmail = !filters.hasEmail || contact.email;
    const matchesLinkedIn = !filters.hasLinkedIn || contact.linkedin;

    return (
      matchesSearch &&
      matchesCompany &&
      matchesRole &&
      matchesEmail &&
      matchesLinkedIn
    );
  });

  // Add handleAddTag function
  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    setIsUpdatingTags(true);
    try {
      const updatedTags = [...(list?.tags || []), newTag.trim()];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({
            tags: updatedTags,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setList((prev) => ({
          ...prev!,
          tags: updatedTags,
        }));
        setNewTag("");
        setShowTagInput(false);
      } else {
        throw new Error(data.error || "Failed to add tag");
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      //alert("Failed to add tag. Please try again.");
    } finally {
      setIsUpdatingTags(false);
    }
  };

  // Add handleRemoveTag function
  const handleRemoveTag = async (tagToRemove: string) => {
    setIsUpdatingTags(true);
    try {
      const updatedTags =
        list?.tags?.filter((tag) => tag !== tagToRemove) || [];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({
            tags: updatedTags,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setList((prev) => ({
          ...prev!,
          tags: updatedTags,
        }));
      } else {
        throw new Error(data.error || "Failed to remove tag");
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      //alert("Failed to remove tag. Please try again.");
    } finally {
      setIsUpdatingTags(false);
    }
  };

  // Add the enrichment function
  const enrichContacts = async () => {
    if (selectedContacts.size === 0) {
      return;
    }

    setIsEnriching(true);

    const selectedContactsList = contacts.filter((contact) =>
      selectedContacts.has(contact.id)
    );

    let successCount = 0;
    let failureCount = 0;

    for (const contact of selectedContactsList) {
      try {
        // Add contact to enriching set
        setEnrichingContacts((prev) => new Set([...prev, contact.id]));

        if (!contact.linkedin) {
          console.log(
            `Skipping ${contact.name} - No LinkedIn profile available`
          );
          continue;
        }

        console.log(
          `Enriching data for ${contact.name} with LinkedIn: ${contact.linkedin}`
        );

        const linkedinUrl = encodeURIComponent(
          `https://www.linkedin.com/in/${contact.linkedin}/`
        );

        // Call People Data Labs API
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
        console.log(`✅ PDL Raw data for ${contact.name}:`, pdlData);

        // Save enrichment data to our database
        const enrichmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/${contact.id}/enrich`,
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
          `✅ Enrichment API response for ${contact.name}:`,
          enrichmentResult
        );

        // Update the contact in the local state with proper typing
        const updateContact = async (
          c: Contact,
          updatedFields: Record<string, any>
        ) => {
          try {
            // Split name into first and last name
            const nameParts = c.name.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            // Prepare API request body
            const apiRequestBody = {
              firstName: firstName,
              lastName: lastName,
              mailId: c.email,
              companyName: updatedFields.company || c.company,
              jobTitle: updatedFields.jobtitle || c.jobtitle,
              phoneNumber: c.phone,
              linkedinUrl: c.linkedin,
              address: updatedFields.address || c.address,
            };

            console.log(
              "📤 Making API call to update contact:",
              apiRequestBody
            );

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/${c.id}`,
              {
                method: "PUT",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(apiRequestBody),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to update contact: ${response.statusText}`
              );
            }

            const result = await response.json();
            console.log("✅ API update successful:", result);
          } catch (error) {
            console.error("❌ Error updating contact in API:", error);
          }
        };

        setContacts((prevContacts) =>
          prevContacts.map((c) => {
            if (c.id === contact.id) {
              // Check and update fields if empty
              const updatedFields: Record<string, any> = {};

              // Basic fields
              if (!c.company && pdlData.data?.job_company_name) {
                updatedFields.company = pdlData.data.job_company_name;
              }
              if (!c.jobtitle && pdlData.data?.job_title) {
                updatedFields.jobtitle = pdlData.data.job_title;
              }

              // Address fields
              const updatedAddress = { ...c.address };
              let addressUpdated = false;

              if (!c.address?.city && pdlData.data?.location_locality) {
                updatedAddress.city = pdlData.data.location_locality;
                addressUpdated = true;
              }
              if (!c.address?.state && pdlData.data?.location_region) {
                updatedAddress.state = pdlData.data.location_region;
                addressUpdated = true;
              }
              if (!c.address?.country && pdlData.data?.location_country) {
                updatedAddress.country = pdlData.data.location_country;
                addressUpdated = true;
              }
              if (!c.address?.line1 && pdlData.data?.location_street_address) {
                updatedAddress.line1 = pdlData.data.location_street_address;
                addressUpdated = true;
              }
              if (!c.address?.line2 && pdlData.data?.location_address_line_2) {
                updatedAddress.line2 = pdlData.data.location_address_line_2;
                addressUpdated = true;
              }
              if (!c.address?.zip && pdlData.data?.location_postal_code) {
                updatedAddress.zip = pdlData.data.location_postal_code;
                addressUpdated = true;
              }

              if (addressUpdated) {
                updatedFields.address = updatedAddress;
              }

              // Prepare complete enrichment data
              const enrichmentData = {
                birth_year: pdlData.data?.birth_year,
                countries: pdlData.data?.countries || [],
                education: pdlData.data?.education || [],
                experience: pdlData.data?.experience || [],
                first_name: pdlData.data?.first_name || "",
                full_name: pdlData.data?.full_name || "",
                industry: pdlData.data?.industry || "",
                interests: pdlData.data?.interests || [],
                job_company_name: pdlData.data?.job_company_name || "",
                job_company_industry: pdlData.data?.job_company_industry || "",
                job_company_size: pdlData.data?.job_company_size || "",
                job_title: pdlData.data?.job_title || "",
                job_title_role: pdlData.data?.job_title_role || "",
                job_title_levels: pdlData.data?.job_title_levels || [],
                job_title_sub_role: pdlData.data?.job_title_sub_role || "",
                job_start_date: pdlData.data?.job_start_date || "",
                job_last_updated: pdlData.data?.job_last_updated || "",
                last_name: pdlData.data?.last_name || "",
                linkedin_id: pdlData.data?.linkedin_id || "",
                linkedin_url: pdlData.data?.linkedin_url || "",
                linkedin_username: pdlData.data?.linkedin_username || "",
                location_country: pdlData.data?.location_country || "",
                location_locality: pdlData.data?.location_locality || "",
                location_region: pdlData.data?.location_region || "",
                location_continent: pdlData.data?.location_continent || "",
                location_geo: pdlData.data?.location_geo || "",
                location_metro: pdlData.data?.location_metro || "",
                location_last_updated:
                  pdlData.data?.location_last_updated || "",
                facebook_url: pdlData.data?.facebook_url || "",
                facebook_username: pdlData.data?.facebook_username || "",
                facebook_id: pdlData.data?.facebook_id || "",
                twitter_url: pdlData.data?.twitter_url || "",
                twitter_username: pdlData.data?.twitter_username || "",
                github_url: pdlData.data?.github_url || "",
                github_username: pdlData.data?.github_username || "",
                work_email: pdlData.data?.work_email || "",
                personal_emails: pdlData.data?.personal_emails || [],
                phone_numbers: pdlData.data?.phone_numbers || [],
                skills: pdlData.data?.skills || [],
                job_company_website: pdlData.data?.job_company_website || "",
                job_company_founded: pdlData.data?.job_company_founded || "",
                job_company_linkedin_url:
                  pdlData.data?.job_company_linkedin_url || "",
                sex: pdlData.data?.sex || "",
                status: pdlData.status,
              };

              // Log what fields were updated
              console.log(`🔄 Updating contact ${contact.name}:`, {
                previousData: {
                  company: c.company,
                  jobtitle: c.jobtitle,
                  address: c.address,
                },
                updatedFields: updatedFields,
                enrichmentData: enrichmentData,
              });

              // Only make API call if there are fields to update
              if (Object.keys(updatedFields).length > 0) {
                updateContact(c, updatedFields);
              }

              return {
                ...c,
                ...updatedFields,
                enrichment: {
                  data: enrichmentData,
                  likelihood: pdlData.likelihood || 0,
                },
              };
            }
            return c;
          })
        );

        successCount++;
        console.log(
          `✅ Successfully enriched and saved data for ${contact.name}`
        );

        // Remove contact from enriching set
        setEnrichingContacts((prev) => {
          const next = new Set(prev);
          next.delete(contact.id);
          return next;
        });

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failureCount++;
        console.error(`❌ Error enriching ${contact.name}:`, error);

        // Remove contact from enriching set on error
        setEnrichingContacts((prev) => {
          const next = new Set(prev);
          next.delete(contact.id);
          return next;
        });
      }
    }

    setIsEnriching(false);
    setEnrichingContacts(new Set()); // Clear all enriching states
  };

  // Add helper function to check for missing information
  const hasMissingInformation = (contact: Contact): boolean => {
    return (
      !contact.company ||
      !contact.jobtitle ||
      !contact.linkedin ||
      !contact.email
    );
  };

  const hasMissingLinkedIn = (contact: Contact): boolean => {
    return !contact.linkedin || contact.linkedin.trim() === "";
  };

  const handleFindLookAlike = async () => {
    // Clear any previous errors
    setLookAlikeError(null);
    setContactsWithErrors([]);

    if (selectedContacts.size === 0) {
      setLookAlikeError(
        "Please select at least one contact to find look-alikes."
      );
      return;
    }

    const selectedContactsList = contacts.filter((contact) =>
      selectedContacts.has(contact.id)
    );

    // Check for missing LinkedIn information
    const contactsWithMissingLinkedIn =
      selectedContactsList.filter(hasMissingLinkedIn);

    if (contactsWithMissingLinkedIn.length > 0) {
      // Highlight contacts with missing LinkedIn
      const missingLinkedInIds = contactsWithMissingLinkedIn.map((c) => c.id);
      setContactsWithErrors(missingLinkedInIds);

      // Show error message
      setLookAlikeError(
        "Some selected contacts are missing LinkedIn information. Please add LinkedIn details before finding look-alikes."
      );
      return;
    }

    setIsLoading(true);
    try {
      await fetchLookalikeContacts();
      setShowLookalikeModal(true);
    } catch (error) {
      console.error("Error finding look-alike contacts:", error);
      setLookAlikeError(
        "Failed to find look-alike contacts. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add new function to fetch lookalike contacts
  const fetchLookalikeContacts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/lookalike`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch lookalike contacts");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Transform the data to match the Contact interface
        const transformedContacts = data.data.map((contact: any) => ({
          id: contact._id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.mailId,
          phone: contact.phoneNumber || "",
          linkedin: contact.linkedinUrl
            ?.replace(
              /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i,
              ""
            )
            .replace(/\/$/, ""),
          linkedin_url: contact.linkedinUrl,
          company: contact.companyName,
          jobtitle: contact.jobTitle,
          address: contact.address,
          photo: "",
          enrichment: contact.enrichment,
        }));
        setLookalikeContacts(transformedContacts);
      }
    } catch (error) {
      console.error("Error fetching lookalike contacts:", error);
    }
  };

  // Add useEffect to fetch lookalike contacts on page load
  useEffect(() => {
    if (organizationId && resolvedParams.id && authToken) {
      fetchLookalikeContacts();
    }
  }, [organizationId, resolvedParams.id, authToken]);

  // Add toggle functions for look-alike contacts
  const toggleSelectAllLookalikes = () => {
    if (selectedLookalikeContacts.size === lookalikeContacts.length) {
      setSelectedLookalikeContacts(new Set());
    } else {
      setSelectedLookalikeContacts(
        new Set(lookalikeContacts.map((contact) => contact.id))
      );
    }
  };

  const toggleLookalikeSelection = (contactId: string) => {
    setSelectedLookalikeContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  // Add save function for look-alike contacts
  const handleSaveLookalikeContacts = async () => {
    try {
      setIsSavingLookalikes(true);

      // Get the selected lookalike contact IDs
      const selectedIds = Array.from(selectedLookalikeContacts);
      if (selectedIds.length === 0) {
        throw new Error("No lookalike contacts selected");
      }

      // Make API call to import lookalike contacts
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/contacts/lookalike/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({
            lookalikeContactIds: selectedIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to import lookalike contacts");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to import lookalike contacts");
      }

      // Refresh both regular contacts and lookalike contacts
      await Promise.all([fetchContacts(), fetchLookalikeContacts()]);

      // Reset selection states
      setSelectedLookalikeContacts(new Set());
      setSelectAllLookalikes(false);

      // alert("Selected look-alike contacts have been added to your list successfully");
    } catch (error) {
      console.error("Error saving look-alike contacts:", error);
      //alert("Failed to save look-alike contacts. Please try again.");
    } finally {
      setIsSavingLookalikes(false);
    }
  };

  // Add filter function for look-alike contacts
  const filteredLookalikeContacts = lookalikeContacts.filter((contact) => {
    const matchesSearch =
      !lookalikeSearchTerm ||
      contact.name?.toLowerCase().includes(lookalikeSearchTerm.toLowerCase()) ||
      contact.email
        ?.toLowerCase()
        .includes(lookalikeSearchTerm.toLowerCase()) ||
      contact.company
        ?.toLowerCase()
        .includes(lookalikeSearchTerm.toLowerCase()) ||
      contact.title?.toLowerCase().includes(lookalikeSearchTerm.toLowerCase());

    const matchesCompany =
      !lookalikeFilters.company ||
      contact.company
        ?.toLowerCase()
        .includes(lookalikeFilters.company.toLowerCase());
    const matchesRole =
      !lookalikeFilters.role ||
      contact.title
        ?.toLowerCase()
        .includes(lookalikeFilters.role.toLowerCase());
    const matchesEmail = !lookalikeFilters.hasEmail || contact.email;
    const matchesLinkedIn = !lookalikeFilters.hasLinkedIn || contact.linkedin;

    return (
      matchesSearch &&
      matchesCompany &&
      matchesRole &&
      matchesEmail &&
      matchesLinkedIn
    );
  });

  if (loading) {
    return (
      <div className="flex bg-[#FFFFFF]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden">
          <div className="p-6 bg-white rounded-tl-3xl h-[100%] overflow-y-scroll overflow-x-hidden">
            {/* Breadcrumb skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-5 w-48 bg-gray-200 rounded"></div>
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Header skeleton */}
            <ContactHeaderSkeleton />

            {/* Table skeleton */}
            <div className="border border-[#D2CEFE] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F4F3FF] border-b border-[#EAECF0]">
                  <tr>
                    {Array(8)
                      .fill(null)
                      .map((_, i) => (
                        <th key={i} className="px-6 py-3">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {Array(5)
                    .fill(null)
                    .map((_, i) => (
                      <ContactRowSkeleton key={i} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden">
        {/* //todo ------------------  Main menu ------------------ */}
        <div className="p-6  bg-white rounded-tl-3xl h-[100%]  overflow-y-scroll overflow-x-hidden">
          {/* Page Header */}
          <PageHeader
            backLink={{
              href: "/contact-lists",
              text: "Back to Contact-Lists",
            }}
            title={list?.name || "Loading..."}
            description={`${contacts.length.toLocaleString()} contacts • Source: ${
              list?.source.discover
                ? "Delight Discover"
                : list?.source.manual
                ? "Manual"
                : list?.source.csv
                ? "CSV"
                : list?.source.crm.type
                ? "CRM"
                : "No source yet"
            }`}
            chips={list?.tags.map((tag, index) => ({
              text: tag,
              color:
                tag === "marketing" || index === 0
                  ? "red"
                  : tag === "leads" || index === 1
                  ? "gray"
                  : tag === "events" || index === 2
                  ? "green"
                  : tag === "new leads" || index === 3
                  ? "blue"
                  : "gray",
            }))}
            lastUpdated={list?.updatedAt ? new Date(list.updatedAt) : undefined}
            primaryButton={{
              text: "Add Contact",
              icon: Plus,
              onClick: () => setShowAddContactModal(true),
              variant: "primary",
            }}
            secondaryButton={{
              text: "Import CSV",
              icon: Upload,
              onClick: () => setShowImportCSVModal(true),
              variant: "secondary",
            }}
            tertiaryButton={{
              text: "Delight Discover",
              onClick: () => setShowDiscoverDrawer(true),
              variant: "tertiary",
              className:
                "border border-purple-200 text-purple-700 bg-white hover:bg-purple-50",
            }}
          />

          {/* Secondary Actions Bar - Systematically Optimized for Usability & Accessibility */}
          <div className="bg-gray-50/50 rounded-xl px-4 py-4 mb-6 border border-gray-100">
            {/* Mobile Layout */}
            <div className="block lg:hidden space-y-4">
              {/* Mobile Row 1: Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  aria-label="Search contacts"
                />
                <Search
                  width={20}
                  height={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
              </div>

              {/* Mobile Row 2: Primary Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={enrichContacts}
                  disabled={
                    isEnriching ||
                    selectedContacts.size === 0 ||
                    !contacts
                      .filter((contact) => selectedContacts.has(contact.id))
                      .some(
                        (contact) =>
                          contact.linkedin && contact.linkedin.trim() !== ""
                      )
                  }
                  className={`flex items-center gap-2 px-3 py-2 text-sm border border-primary rounded-lg text-primary hover:bg-primary/5 transition-colors ${
                    isEnriching ||
                    selectedContacts.size === 0 ||
                    !contacts
                      .filter((contact) => selectedContacts.has(contact.id))
                      .some(
                        (contact) =>
                          contact.linkedin && contact.linkedin.trim() !== ""
                      )
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  aria-label={`Enrich contacts ${
                    selectedContacts.size > 0
                      ? `(${selectedContacts.size} selected)`
                      : ""
                  }`}
                >
                  {isEnriching ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"
                        aria-hidden="true"
                      ></div>
                      <span className="hidden sm:inline">Enriching...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Users width={16} height={16} aria-hidden="true" />
                      <span className="hidden sm:inline">Enrich</span>
                      <span className="sm:hidden">Enrich</span>
                      {selectedContacts.size > 0 && (
                        <span
                          className="bg-primary text-white text-xs rounded-full px-2 py-0.5"
                          aria-label={`${selectedContacts.size} contacts selected`}
                        >
                          {selectedContacts.size}
                        </span>
                      )}
                    </>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      showFilters
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    aria-label={`Toggle filters ${
                      Object.values(filters).filter(Boolean).length > 0
                        ? `(${
                            Object.values(filters).filter(Boolean).length
                          } active)`
                        : ""
                    }`}
                    aria-expanded={showFilters}
                  >
                    <Filter width={16} height={16} aria-hidden="true" />
                    <span className="text-sm">Filters</span>
                    {(filters.company ||
                      filters.role ||
                      filters.hasEmail ||
                      filters.hasLinkedIn) && (
                      <span
                        className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                        aria-label={`${
                          Object.values(filters).filter(Boolean).length
                        } filters applied`}
                      >
                        {Object.values(filters).filter(Boolean).length}
                      </span>
                    )}
                  </button>

                  {showFilters && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="company-filter"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Company
                          </label>
                          <input
                            id="company-filter"
                            type="text"
                            value={filters.company}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                company: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Filter by company"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="role-filter"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Role
                          </label>
                          <input
                            id="role-filter"
                            type="text"
                            value={filters.role}
                            onChange={(e) =>
                              setFilters({ ...filters, role: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Filter by role"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setFilters({
                                company: "",
                                role: "",
                                hasEmail: false,
                                hasLinkedIn: false,
                              });
                            }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Clear all
                          </button>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Row 3: CRM Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowImportCRMModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Import contacts from CRM"
                >
                  <Image
                    src="/svgs/crm.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Import CRM</span>
                  <span className="sm:hidden">Import</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Export contacts to CRM"
                >
                  <Download width={16} height={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Export CRM</span>
                  <span className="sm:hidden">Export</span>
                </button>

                {Cookies.get("user_email") == "harsha@delightloop.com" && (
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    aria-label="Sync contacts"
                  >
                    <RefreshCw width={16} height={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Sync</span>
                    <span className="sm:hidden">Sync</span>
                  </button>
                )}
              </div>

              {/* Mobile Row 4: Tag Management */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 min-w-fit">
                    Tags:
                  </span>
                  {showTagInput ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Enter tag name"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isUpdatingTags}
                        autoFocus
                        aria-label="New tag name"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={isUpdatingTags}
                        className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        aria-label="Add tag"
                      >
                        {isUpdatingTags ? "Adding..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag("");
                        }}
                        disabled={isUpdatingTags}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="Cancel adding tag"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                      aria-label="Add new tag"
                    >
                      <Plus width={14} height={14} aria-hidden="true" />
                      Add Tag
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block space-y-4">
              {/* Desktop Row 1: Search and Primary Actions */}
              <div className="flex items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="relative w-96">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    aria-label="Search contacts"
                  />
                  <Search
                    width={20}
                    height={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                </div>

                {/* Right: Action Button Group */}
                <div className="flex items-center gap-3">
                  {/* Primary Action Group */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-white">
                    <button
                      onClick={enrichContacts}
                      disabled={
                        isEnriching ||
                        selectedContacts.size === 0 ||
                        !contacts
                          .filter((contact) => selectedContacts.has(contact.id))
                          .some(
                            (contact) =>
                              contact.linkedin && contact.linkedin.trim() !== ""
                          )
                      }
                      className={`flex items-center gap-2 px-3 py-2 text-sm border-0 rounded-md text-primary hover:bg-primary/10 transition-colors ${
                        isEnriching ||
                        selectedContacts.size === 0 ||
                        !contacts
                          .filter((contact) => selectedContacts.has(contact.id))
                          .some(
                            (contact) =>
                              contact.linkedin && contact.linkedin.trim() !== ""
                          )
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      aria-label={`Enrich contacts ${
                        selectedContacts.size > 0
                          ? `(${selectedContacts.size} selected)`
                          : ""
                      }`}
                    >
                      {isEnriching ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"
                            aria-hidden="true"
                          ></div>
                          Enriching...
                        </>
                      ) : (
                        <>
                          <Users width={16} height={16} aria-hidden="true" />
                          Enrich Contacts
                          {selectedContacts.size > 0 && (
                            <span
                              className="bg-primary text-white text-xs rounded-full px-2 py-0.5"
                              aria-label={`${selectedContacts.size} contacts selected`}
                            >
                              {selectedContacts.size}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secondary Action Group */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-white">
                    <button
                      onClick={() => setShowImportCRMModal(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border-0 rounded-md hover:bg-gray-50 transition-colors"
                      aria-label="Import contacts from CRM"
                    >
                      <Image
                        src="/svgs/crm.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      Import CRM
                    </button>

                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border-0 rounded-md hover:bg-gray-50 transition-colors"
                      aria-label="Export contacts to CRM"
                    >
                      <Download width={16} height={16} aria-hidden="true" />
                      Export CRM
                    </button>
                  </div>

                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                        showFilters
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      aria-label={`Toggle filters ${
                        Object.values(filters).filter(Boolean).length > 0
                          ? `(${
                              Object.values(filters).filter(Boolean).length
                            } active)`
                          : ""
                      }`}
                      aria-expanded={showFilters}
                    >
                      <Filter width={16} height={16} aria-hidden="true" />
                      Filters
                      {(filters.company ||
                        filters.role ||
                        filters.hasEmail ||
                        filters.hasLinkedIn) && (
                        <span
                          className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                          aria-label={`${
                            Object.values(filters).filter(Boolean).length
                          } filters applied`}
                        >
                          {Object.values(filters).filter(Boolean).length}
                        </span>
                      )}
                    </button>

                    {showFilters && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="company-filter-desktop"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Company
                            </label>
                            <input
                              id="company-filter-desktop"
                              type="text"
                              value={filters.company}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  company: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Filter by company"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="role-filter-desktop"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Role
                            </label>
                            <input
                              id="role-filter-desktop"
                              type="text"
                              value={filters.role}
                              onChange={(e) =>
                                setFilters({ ...filters, role: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Filter by role"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setFilters({
                                  company: "",
                                  role: "",
                                  hasEmail: false,
                                  hasLinkedIn: false,
                                });
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Clear all
                            </button>
                            <button
                              onClick={() => setShowFilters(false)}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Row 2: Tag Management and Additional Actions */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
                {/* Left: Tag Management */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Manage Tags:
                  </span>
                  {showTagInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Enter tag name"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isUpdatingTags}
                        autoFocus
                        aria-label="New tag name"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={isUpdatingTags}
                        className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        aria-label="Add tag"
                      >
                        {isUpdatingTags ? "Adding..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag("");
                        }}
                        disabled={isUpdatingTags}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="Cancel adding tag"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                      aria-label="Add new tag"
                    >
                      <Plus width={14} height={14} aria-hidden="true" />
                      Add Tag
                    </button>
                  )}
                </div>

                {/* Right: Additional Actions */}
                <div className="flex items-center gap-3">
                  {Cookies.get("user_email") == "harsha@delightloop.com" && (
                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                      aria-label="Sync contacts"
                    >
                      <RefreshCw width={16} height={16} aria-hidden="true" />
                      Sync Contacts
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Table */}
          <div className="border border-[#D2CEFE] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F4F3FF] border-b border-[#EAECF0] text-left text-xs uppercase font-medium text-[#101828]">
                <tr>
                  <th className="w-[40px] px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                    />
                  </th>
                  <th className="px-6 py-3">NAME</th>
                  <th className="px-6 py-3">COMPANY</th>
                  <th className="px-6 py-3">ROLE</th>
                  <th className="px-6 py-3">EMAIL</th>
                  <th className="px-6 py-3">LINKEDIN</th>
                  <th className="px-6 py-3">ADDRESS</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2CEFE]">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-[#667085]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {searchTerm || Object.values(filters).some(Boolean)
                          ? "No contacts match your search criteria"
                          : "No Contacts"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact, index) => (
                    <tr
                      key={contact.id}
                      className={`border-b ${
                        contactsWithErrors.includes(contact.id)
                          ? "bg-red-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="w-[40px] px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#101828]">
                        {contact.name || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#101828]">
                        {contact.company || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#101828]">
                        {contact.jobtitle || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#101828]">
                        <a
                          href={`mailto:${contact.email}`}
                          className="font-medium hover:underline"
                        >
                          {contact.email || "---"}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#101828]">
                        {contact.linkedin ? (
                          <a
                            href={`https://linkedin.com/in/${contact.linkedin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Image
                              src="/svgs/Linkedin.svg"
                              alt="linkedin"
                              width={16}
                              height={16}
                              className="mr-1"
                            />
                            {contact.linkedin.replace(
                              /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i,
                              ""
                            )}
                          </a>
                        ) : (
                          "---"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#101828]">
                        <span className="font-medium">
                          {formatAddressMasked(contact.address)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#101828] relative">
                        <div className="flex items-center justify-end gap-2">
                          {hasMissingInformation(contact) &&
                            !enrichingContacts.has(contact.id) && (
                              <div className="relative group">
                                <svg
                                  className="w-4 h-4 text-amber-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <div
                                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-[9999]"
                                  style={{ minWidth: "max-content" }}
                                >
                                  <div className="bg-gray-800 text-white text-xs rounded-md py-2 px-3">
                                    Enrich contact
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                      <div className="border-[6px] border-transparent border-t-gray-800"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          {enrichingContacts.has(contact.id) && (
                            <div className="flex items-center ml-2">
                              <InfinityLoader width={20} height={20} />
                            </div>
                          )}
                          <div className="relative">
                            <div
                              className="grid gap-0.5 cursor-pointer hover:bg-slate-100 py-1.5 px-3 rounded-full three-dots w-fit"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(contact.id);
                              }}
                            >
                              <div className="size-1 rounded-full bg-[#101828]"></div>
                              <div className="size-1 rounded-full bg-[#101828]"></div>
                              <div className="size-1 rounded-full bg-[#101828]"></div>
                            </div>

                            {openMenuId === contact.id && (
                              <div className="absolute z-[9999] contact-menu right-full top-0 mr-2">
                                <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 grid gap-1 min-w-[120px]">
                                  <button
                                    className="flex gap-3 items-center text-[#101828] px-4 py-2 rounded-lg hover:bg-slate-50 whitespace-nowrap w-full text-left"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditContact(contact);
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setContactsToDelete([contact.id]);
                                      setShowDeleteContactModal(true);
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {/* Add 2 extra empty rows for dropdown menu space */}
                <tr style={{ height: "60px" }}>
                  <td colSpan={8}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Look-alike Profile Search Section */}
          <div className="mt-8">
            {/* <h2 className="text-xl font-semibold text-[#101828] mb-6">
                Look-alike Profile Search
              </h2> */}
            <div className="bg-white rounded-lg p-6 border border-[#EAECF0]">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-xl font-semibold text-gray-900 p-4">
                  Find Look a like Profile
                </h2>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-48">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={lookAlikeCount}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 10) {
                              setLookAlikeCount(value);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                        />
                      </div>
                      <button
                        onClick={handleFindLookAlike}
                        disabled={
                          selectedContacts.size === 0 || isLookalikeSearching
                        }
                        className={`px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg flex items-center justify-center gap-2 min-w-[150px]
                            ${
                              selectedContacts.size === 0 ||
                              isLookalikeSearching
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-[#6941C6]"
                            }`}
                      >
                        {isLookalikeSearching ? (
                          <>
                            <InfinityLoader width={20} height={20} />
                            <span>Searching...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                            Find Look a like
                            {selectedContacts.size > 0 &&
                              ` (${selectedContacts.size} selected)`}
                          </>
                        )}
                      </button>
                    </div>
                    {lookAlikeError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-2xl text-center">
                        {lookAlikeError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Look-alike Results Table */}
            {lookalikeContacts.length > 0 && (
              <div className="mt-8">
                {/* Search and Filters */}
                <div className="flex items-center justify-between mb-4">
                  <div className="relative w-[350px]">
                    <input
                      type="text"
                      placeholder="Search look-alike contacts..."
                      value={lookalikeSearchTerm}
                      onChange={(e) => setLookalikeSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[#D0D5DD] rounded-lg"
                    />
                    <Image
                      src="/svgs/search.svg"
                      alt="Search"
                      width={20}
                      height={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowLookalikeFilters(!showLookalikeFilters)
                        }
                        className="flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] rounded-lg hover:bg-gray-50"
                      >
                        <Image
                          src="/svgs/Filter.svg"
                          alt="Filter"
                          width={20}
                          height={20}
                        />
                        Filters
                        {(lookalikeFilters.company ||
                          lookalikeFilters.role ||
                          lookalikeFilters.hasEmail ||
                          lookalikeFilters.hasLinkedIn) && (
                          <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {
                              Object.values(lookalikeFilters).filter(Boolean)
                                .length
                            }
                          </span>
                        )}
                      </button>

                      {showLookalikeFilters && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company
                              </label>
                              <input
                                type="text"
                                value={lookalikeFilters.company}
                                onChange={(e) =>
                                  setLookalikeFilters({
                                    ...lookalikeFilters,
                                    company: e.target.value,
                                  })
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
                                value={lookalikeFilters.role}
                                onChange={(e) =>
                                  setLookalikeFilters({
                                    ...lookalikeFilters,
                                    role: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Filter by role"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setLookalikeFilters({
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
                                onClick={() => setShowLookalikeFilters(false)}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table */}
                {lookalikeContacts.length > 0 && (
                  <div className="border border-[#EAECF0] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#F4F3FF] border-b border-[#EAECF0] text-left text-xs uppercase font-medium text-[#101828]">
                        <tr>
                          <th className="w-[40px] px-6 py-3">
                            <input
                              type="checkbox"
                              checked={selectAllLookalikes}
                              onChange={toggleSelectAllLookalikes}
                              className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                            />
                          </th>
                          <th className="px-6 py-3">NAME</th>
                          <th className="px-6 py-3">COMPANY</th>
                          <th className="px-6 py-3">ROLE</th>
                          <th className="px-6 py-3">EMAIL</th>
                          <th className="px-6 py-3">LINKEDIN</th>
                          <th className="px-6 py-3">ADDRESS</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D2CEFE]">
                        {filteredLookalikeContacts.map((contact) => (
                          <tr key={contact.id} className="hover:bg-[#F9FAFB]">
                            <td className="w-[40px] px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedLookalikeContacts.has(
                                  contact.id
                                )}
                                onChange={() =>
                                  toggleLookalikeSelection(contact.id)
                                }
                                className="rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-[#101828]">
                              {contact.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#101828]">
                              {contact.company}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#101828]">
                              {contact.jobtitle || contact.title || "---"}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#101828]">
                              <a
                                href={`mailto:${contact.email}`}
                                className="font-medium hover:underline"
                              >
                                {contact.email}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#101828]">
                              <a
                                href={`https://linkedin.com/in/${contact.linkedin}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <Image
                                  src="/svgs/Linkedin.svg"
                                  alt="linkedin"
                                  width={16}
                                  height={16}
                                  className="mr-1"
                                />
                                {contact.linkedin}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#101828]">
                              <span className="font-medium">
                                {formatAddressMasked(contact.address)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-[#101828] relative">
                              <div className="flex items-center justify-end gap-2">
                                {hasMissingInformation(contact) &&
                                  !enrichingContacts.has(contact.id) && (
                                    <div className="relative group">
                                      <svg
                                        className="w-4 h-4 text-amber-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <div
                                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-[9999]"
                                        style={{ minWidth: "max-content" }}
                                      >
                                        <div className="bg-gray-800 text-white text-xs rounded-md py-2 px-3">
                                          Enrich contact
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                            <div className="border-[6px] border-transparent border-t-gray-800"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                <div className="relative">
                                  <div
                                    className="grid gap-0.5 cursor-pointer hover:bg-slate-100 py-1.5 px-3 rounded-full three-dots w-fit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMenuToggle(contact.id);
                                    }}
                                  >
                                    <div className="size-1 rounded-full bg-[#101828]"></div>
                                    <div className="size-1 rounded-full bg-[#101828]"></div>
                                    <div className="size-1 rounded-full bg-[#101828]"></div>
                                  </div>
                                  {openMenuId === contact.id && (
                                    <div className="absolute z-[9999] contact-menu right-full top-0 mr-2">
                                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-2 grid gap-1 min-w-[120px]">
                                        <button
                                          className="flex gap-3 items-center text-[#101828] px-4 py-2 rounded-lg hover:bg-slate-50 whitespace-nowrap w-full text-left"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditContact(contact);
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setContactsToDelete([contact.id]);
                                            setShowDeleteContactModal(true);
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
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Add 2 extra empty rows for dropdown menu space */}
                        <tr style={{ height: "60px" }}>
                          <td colSpan={8}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleSaveLookalikeContacts}
                    disabled={selectedLookalikeContacts.size === 0}
                    className={`px-6 py-2.5 bg-[#7F56D9] text-white rounded-lg flex items-center gap-2
                        ${
                          selectedLookalikeContacts.size === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#6941C6]"
                        }`}
                  >
                    Save Selected Contacts
                    {selectedLookalikeContacts.size > 0 &&
                      ` (${selectedLookalikeContacts.size})`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Buttons and Slider Section */}
          {contacts.length > 0 &&
            hasNewContacts &&
            !similarContacts.length &&
            showActionButtons && (
              <div className="mt-8 space-y-6">
                {showSlider ? (
                  <>
                    <div className="space-y-2">
                      <label
                        htmlFor="contacts-slider"
                        className="block text-sm font-medium text-[#344054]"
                      >
                        Number of Similar Contacts: {selectedNumber}
                      </label>
                      <div className="border-[#D2CEFE] border  bg-[#F9F3FFBF] rounded-lg px-[221px] pb-[21px] pt-[55px]">
                        <RangeSlider
                          setBudget={(min, max) => {
                            // We only care about the max value here.
                            setSelectedNumber(max);
                          }}
                          initialMin={0} // Use 1 if you want to avoid a zero value (the RangeSlider's minimum is hardcoded to 1)
                          initialMax={selectedNumber || 0} // Default to selectedNumber or 1 to be safe
                          notMoney={true} // so it displays the number as is, without a "$" sign
                        />
                        <div className="flex justify-between text-xs text-[#667085]">
                          <span>0</span>
                          <span>500</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={handleFindSimilar}
                        disabled={actionLoading === "searching"}
                        className={`px-6 py-3 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] font-medium 
                            ${
                              actionLoading === "searching"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                      >
                        {actionLoading === "searching" ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Searching...
                          </div>
                        ) : (
                          "Find Similar"
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleSave()}
                      disabled={actionLoading === "saving"}
                      className={`px-6 py-3 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] font-medium 
                          ${
                            actionLoading === "saving"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                    >
                      {actionLoading === "saving" ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      onClick={() => setShowSlider(true)}
                      className="px-6 py-3 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] font-medium"
                    >
                      Find Similar
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* Similar Contacts Table with Save Button */}
          {similarContacts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-[#101828] mb-4">
                Similar Contacts
              </h2>
              <div className="border border-[#EAECF0] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#667085]">
                        LinkedIn URL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {similarContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                              <Image
                                src={contact.photo || "/default-avatar.png"}
                                alt={contact.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm text-[#101828]">
                              {contact.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          {contact.company}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          {contact.jobtitle}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          {contact.email || "---"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          {contact.country || "---"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          {contact.city || "---"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#101828]">
                          <Image
                            src="svgs/Linkedin.svg"
                            alt="linkedin"
                            width={16}
                            height={16}
                          />
                          {contact?.linkedin_url || contact?.linkedin
                            ? (
                                contact?.linkedin_url || contact?.linkedin
                              )?.replace(
                                /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i,
                                ""
                              )
                            : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => handleSave(similarContacts)}
                  disabled={actionLoading === "saving"}
                  className={`px-6 py-3 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] font-medium 
                      ${
                        actionLoading === "saving"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                >
                  {actionLoading === "saving" ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Similar Contacts"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Sync Modal */}
          {showSyncModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[480px] relative">
                {/* Close button */}
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="absolute top-6 text-lg right-6 text-gray-400 hover:text-gray-600"
                >
                  X
                </button>

                <h2 className="text-xl font-semibold text-[#101828] mb-1">
                  Sync Contacts from CRM/Platform
                </h2>

                <form onSubmit={handleSync} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">
                      Platform
                    </label>
                    <select
                      value={syncData.platform}
                      onChange={(e) =>
                        setSyncData({ ...syncData, platform: e.target.value })
                      }
                      className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white"
                      required
                    >
                      <option value="">Select a platform</option>
                      {platforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">
                      Sync Preference
                    </label>
                    <select
                      value={syncData.syncPreference}
                      onChange={(e) =>
                        setSyncData({
                          ...syncData,
                          syncPreference: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white"
                      required
                    >
                      {syncPreferences.map((preference) => (
                        <option key={preference} value={preference}>
                          {preference}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(false)}
                      className="flex-1 px-4 py-2.5 border border-[#D0D5DD] text-[#344054] rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6]"
                    >
                      Start Sync
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Similar Contacts Table with Save Button */}
          {isBuilding && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
              <Image
                src="/img/streaming.png"
                alt="Building audience"
                width={200}
                height={200}
              />
              <p className="text-lg mt-4 text-[#101828]">
                Audience building in progress....
              </p>
              <button
                onClick={() => router.push("/contact-lists")}
                className="mt-4 px-6 py-3 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] font-medium"
              >
                Checkout the Queue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* //! --- Add Contact Modal---- */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[872px] relative h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
            <div className="relative z-20">
              <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                <h2 className="text-xl font-semibold">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddContactModal(false);
                    setNewContactForm({
                      firstName: "",
                      lastName: "",
                      email: "",
                      jobTitle: "",
                      company: "",
                      linkedinUrl: "",
                      notes: "",
                      phone: "",
                      address: {
                        line1: "",
                        line2: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: "",
                      },
                    });
                    setPendingContacts([]);
                    setEditingContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveContacts} className="">
                {/* Pending Contacts Section */}
                {pendingContacts.length > 0 && (
                  <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg border border-[#EAECF0]">
                    <div className="text-sm font-semibold text-[#344054] mb-3">
                      Pending Contacts ({pendingContacts.length})
                    </div>
                    <div className="grid gap-2">
                      {pendingContacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 bg-white rounded border border-[#EAECF0]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                              <span className="text-sm font-medium text-[#344054]">
                                {contact.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#344054]">
                                {contact.name}
                              </div>
                              <div className="text-xs text-[#667085]">
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Form */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={newContactForm.firstName}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={newContactForm.lastName}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newContactForm.email}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          email: e.target.value,
                        })
                      }
                      onBlur={() =>
                        handleFieldBlur("email", newContactForm.email)
                      }
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        validationErrors.email
                          ? "border-red-500"
                          : "border-[#D0D5DD]"
                      } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]`}
                      placeholder="Enter email address"
                      required
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newContactForm.phone || ""}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          phone: e.target.value,
                        })
                      }
                      onBlur={() =>
                        handleFieldBlur("phone", newContactForm.phone || "")
                      }
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        validationErrors.phone
                          ? "border-red-500"
                          : "border-[#D0D5DD]"
                      } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]`}
                      placeholder="Enter phone number"
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-500">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={newContactForm.jobTitle}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          jobTitle: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter job title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={newContactForm.company}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          company: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      LinkedIn URL <span className="text-red-500">*</span>
                    </label>
                    <div className="flex rounded-lg border border-[#D0D5DD] overflow-hidden focus-within:ring-2 focus-within:ring-[#7F56D9] focus-within:border-[#7F56D9]">
                      <span className="px-3.5 py-2.5 bg-[#F9FAFB] text-[#667085] border-r border-[#D0D5DD]">
                        linkedin.com/in/
                      </span>
                      <input
                        type="text"
                        name="linkedinUrl"
                        value={newContactForm.linkedinUrl}
                        onChange={(e) =>
                          setNewContactForm({
                            ...newContactForm,
                            linkedinUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3.5 py-2.5 focus:outline-none"
                        placeholder="username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="address.line1"
                      value={newContactForm.address.line1}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            line1: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter address line 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="address.line2"
                      value={newContactForm.address.line2}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            line2: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter address line 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={newContactForm.address.city}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={newContactForm.address.state}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Zip
                    </label>
                    <input
                      type="text"
                      name="address.zip"
                      value={newContactForm.address.zip}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            zip: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter zip"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={newContactForm.address.country}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          address: {
                            ...newContactForm.address,
                            country: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9]"
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={newContactForm.notes}
                    onChange={(e) =>
                      setNewContactForm({
                        ...newContactForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-[#7F56D9] resize-none"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContactModal(false);
                      setNewContactForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        jobTitle: "",
                        company: "",
                        linkedinUrl: "",
                        notes: "",
                        phone: "",
                        address: {
                          line1: "",
                          line2: "",
                          city: "",
                          state: "",
                          zip: "",
                          country: "",
                        },
                      });
                      setValidationErrors({ email: "", phone: "" });
                      setPendingContacts([]);
                      setEditingContact(null);
                    }}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {!editingContact && (
                    <button
                      type="button"
                      onClick={handleSaveAndAddNew}
                      className={`px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg ${
                        !isFormValid()
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                      disabled={!isFormValid()}
                    >
                      Save & Add New
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`px-4 py-2.5 bg-[#7F56D9] text-white font-semibold rounded-lg ${
                      !isFormValid()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#6941C6]"
                    }`}
                    disabled={!isFormValid()}
                  >
                    {editingContact ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* //! --- Import CSV Modal---- */}
      {showImportCSVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[572px] relative">
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
            <div className="relative z-20">
              <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                <h2 className="text-xl font-semibold">Import from CSV</h2>
                <button
                  onClick={() => {
                    setShowImportCSVModal(false);
                    setUploadedFile(null);
                    setCsvError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-[#667085] font-medium">
                Upload csv or xls file
              </div>

              {!uploadedFile ? (
                <label
                  htmlFor="csv-file-upload"
                  className={`flex flex-col mt-4 mx-auto group text-primary-light items-center justify-center w-[512px] border border-[#D6BBFB] rounded-lg cursor-pointer bg-[#FCFAFF] py-4 hover:bg-primary/5 transition-all duration-300 ${
                    dragActive ? "border-primary bg-primary/5" : ""
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center w-full">
                    <Image
                      src="/svgs/Upload.svg"
                      className={`${
                        dragActive ? "scale-110" : "group-hover:scale-110"
                      } transition-all duration-300`}
                      alt="upload"
                      width={40}
                      height={40}
                    />
                    <p className="mb-2 text-sm mt-3">
                      <span className="font-medium text-default">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs">.csv, .xls file (max 2MB)</p>
                  </div>
                  <input
                    id="csv-file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.xls,.xlsx"
                  />
                </label>
              ) : (
                <div className="mt-4 w-[512px] flex gap-3 items-start mx-auto bg-white rounded-lg p-4 border border-primary">
                  <Image
                    src="/svgs/FileUpload.svg"
                    alt="file upload icon"
                    width={34}
                    height={34}
                    className=""
                  />

                  <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-3">
                        <div className="grid">
                          <span className="text-sm font-medium">
                            {uploadedFile.name}
                          </span>
                          <span className="text-xs text-[#667085]">
                            {Math.round(uploadedFile.size / 1024)} KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-2.5">
                      <div className="w-[85%] bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportCSVModal(false);
                    setUploadedFile(null);
                    setCsvError(null);
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!uploadedFile}
                  onClick={async () => {
                    console.log("🚀 Starting import process...");
                    setCsvError(null); // Clear any previous errors
                    if (uploadedFile) {
                      try {
                        console.log("📤 Preparing file for upload:", {
                          fileName: uploadedFile.name,
                          fileType: uploadedFile.type,
                          fileSize: uploadedFile.size,
                        });

                        // Process CSV file before uploading
                        let fileToUpload = uploadedFile;

                        // Only process CSV files, let Excel files go through as-is
                        if (uploadedFile.name.toLowerCase().endsWith(".csv")) {
                          try {
                            fileToUpload = await processCSVFile(uploadedFile);
                            console.log("🔄 CSV file processed successfully");
                          } catch (processingError) {
                            console.error(
                              "❌ CSV processing failed:",
                              processingError
                            );
                            setCsvError(
                              `CSV processing failed: ${
                                processingError instanceof Error
                                  ? processingError.message
                                  : "Unknown error"
                              }`
                            );
                            return;
                          }
                        }

                        const formData = new FormData();
                        formData.append("file", fileToUpload);

                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${resolvedParams.id}/upload`,
                          {
                            method: "POST",
                            headers: {
                              accept: "application/json",
                              Authorization: `Bearer ${authToken}`,
                            },
                            body: formData,
                          }
                        );

                        console.log("📡 API Response status:", response.status);

                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error("API Error Response:", errorData);
                          setCsvError(
                            errorData.error ||
                              "Failed to upload file. Please try again."
                          );
                          return;
                        }

                        const data = await response.json();
                        console.log("📥 API Response data:", data);

                        if (!data.success) {
                          setCsvError(
                            data.error || "Failed to add contacts to list"
                          );
                          return;
                        }

                        console.log("🔄 Fetching updated list data...");
                        await refreshListData();
                        console.log("✅ Import process completed successfully");

                        // Reset states
                        setShowImportCSVModal(false);
                        setUploadedFile(null);
                        setParsedContacts([]);
                      } catch (error) {
                        console.error("❌ Error in import process:", error);
                        setCsvError(
                          "An unexpected error occurred. Please try again."
                        );
                      }
                    } else {
                      console.warn("⚠️ No file selected for upload");
                      setCsvError("Please select a file to upload");
                    }
                  }}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
              {csvError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-sm font-medium">{csvError}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* //! --- Rename List Modal ---- */}
      {showRenameListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[572px] relative">
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
            <div className="relative z-20">
              {/* //? ----- Title ----- */}
              <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                <h2 className="text-xl font-semibold ">Rename Contact List</h2>
                <button
                  onClick={() => setShowRenameListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              {/* //? ----- Body ----- */}
              <div className="text-sm text-[#667085] font-medium mb-2">
                New List Name
              </div>
              <input
                type="text"
                placeholder="rename lsit name"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {/* //? ----- Footer ----- */}
              <div className="flex justify-center gap-3 pt-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowRenameListModal(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* //! --- Delete List Modal ---- */}
      {showDeleteListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[572px] relative">
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
            <div className="relative z-20">
              {/* //? Title */}
              <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                <h2 className="text-xl font-medium ">
                  Are you sure you want to delete this list?
                </h2>
                <button
                  onClick={() => setShowDeleteListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              {/* //? Body */}
              <div className="text-sm  font-medium text-center">
                This action cannot be undone. This will permanently delete the
                contact list and remove the data from our servers.
              </div>
              {/* //? Footer */}
              <div className="flex justify-center gap-3 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteListModal(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* //! --- Delete Contact Modal ---- */}
      {showDeleteContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[572px] relative">
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
            <div className="relative z-20">
              <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                <h2 className="text-xl font-medium">
                  {contactsToDelete.length > 1
                    ? `Delete ${contactsToDelete.length} contacts?`
                    : "Delete contact?"}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteContactModal(false);
                    setContactsToDelete([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <div className="text-sm font-medium text-center">
                This action cannot be undone. This will permanently delete the
                {contactsToDelete.length > 1
                  ? " selected contacts"
                  : " contact"}{" "}
                from this list.
              </div>
              <div className="flex justify-center gap-3 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteContactModal(false);
                    setContactsToDelete([]);
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContacts}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showImportCRMModal && (
        <ImportFromCRM
          isOpen={showImportCRMModal}
          onClose={() => setShowImportCRMModal(false)}
          onImport={handleCRMImport}
          importType="contacts"
          listGuid={resolvedParams.id}
        />
      )}

      {(validationErrors.email || validationErrors.phone) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm font-medium">
              {validationErrors.email || validationErrors.phone}
            </span>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <ExportToCRM
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleCRMExport}
          exportType="contacts"
          listGuid={resolvedParams.id}
          selectedContacts={Array.from(selectedContacts)}
        />
      )}

      {/* Delight Discover Drawer */}
      <DelightDiscoverDrawer
        isOpen={showDiscoverDrawer}
        onClose={() => setShowDiscoverDrawer(false)}
        onApplyFilters={handleApplyDiscoverFilters}
      />
    </div>
  );
}
