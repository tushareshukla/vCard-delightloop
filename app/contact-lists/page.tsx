"use client";
import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import PageHeader from "@/components/layouts/PageHeader";
import { Megaphone, Search, Filter, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import ImportFromCRM from "@/app/components/ImportFromCRM";
import ExportToCRM from "../components/ExportToCRM";
import { DelightDiscoverIcon } from "@/components/delight-discover";

// Animation keyframes for the page
const animations = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
  }
}

@keyframes cardDeal {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes skeletonPulse {
  0% {
    background-color: rgba(226, 232, 240, 0.6);
  }
  50% {
    background-color: rgba(226, 232, 240, 0.9);
  }
  100% {
    background-color: rgba(226, 232, 240, 0.6);
  }
}

@keyframes fadeInContent {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeInCard {
  0% {
    opacity: 0;
    transform: translateY(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-card-deal {
  animation: cardDeal 0.4s ease-out forwards;
  opacity: 0;
}

.animate-skeleton-pulse {
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.animate-content {
  animation: fadeInContent 0.3s ease-out forwards;
}

.animate-fade-in-card {
  animation: fadeInCard 0.5s ease-out forwards;
  opacity: 0;
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
`;

interface ContactList {
  _id: string;
  name: string;
  description: string;
  source: {
    manual: boolean;
    csv: boolean;
    discover: boolean;
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
    totalContacts: any;
    totalRecipients: number;
    campaignsUsed: number;
    playbooksUsed: number;
  };
  status: string;
  usage: {
    campaignIds: string[];
    playbookIds: string[];
  };
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  company: string;
  linkedinUrl: string;
  notes: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// Add validation types
interface ValidationErrors {
  email: string;
  phone: string;
}

export default function ContactLists() {
  const { authToken, organizationId, isLoadingCookies } =
    useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListData, setNewListData] = useState({
    name: "",
    description: "",
    tags: "",
    currentTag: "",
    source: "manual", // Added source field with default value "manual"
  });

  // Helper function to create a fresh list data object
  const createEmptyListData = (source: string = "manual") => ({
    name: "",
    description: "",
    tags: "",
    currentTag: "",
    source,
  });

  // Helper function to reset list data
  const resetListData = () => {
    setNewListData(createEmptyListData("manual"));
    setSelectedSourceType(null);
  };


  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(
    null
  );
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddContactModalEdit, setShowAddContactModalEdit] = useState(false);
  const [showImportCSVModal, setShowImportCSVModal] = useState(false);
  const [showImportCRMModal, setShowImportCRMModal] = useState(false);
  const [showImportToExistingListModal, setShowImportToExistingListModal] =
    useState(false);
  const [selectedListForImport, setSelectedListForImport] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Convert contactLists to state
  const [contactLists, setContactLists] = useState<ContactList[]>([]);

  // Add pagination state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Change itemsPerPage to be stateful and updatable
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [showRenameListModal, setShowRenameListModal] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Array<any>>([]);
  const [hasNewContacts, setHasNewContacts] = useState(false);
  const [contactsEdit, setContactsEdit] = useState<Contact[]>([]);
  // Add new filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    source: {
      manual: false,
      csv: false,
      crm: false,
      discover: false,
    },
    status: {
      active: false,
      inactive: false,
    },
    recipientCountMin: 0,
    recipientCountMax: 1000,
    tags: [] as string[],
    dateRange: {
      start: "",
      end: "",
    },
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newContact, setNewContact] = useState({
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

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: "",
    phone: "",
  });

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
    // Required fields validation
    if (
      !newContact.firstName ||
      !newContact.lastName ||
      !newContact.email ||
      !newContact.jobTitle ||
      !newContact.company ||
      !newContact.linkedinUrl
    ) {
      return false;
    }

    // Field format validation
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

  // First, add a state for multiple contacts
  const [contacts, setContacts] = useState<
    Array<{
      firstName: string;
      lastName: string;
      email: string;
      jobTitle: string;
      company: string;
      linkedinUrl: string;
      notes: string;
      phone: string;
      address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
    }>
  >([]);

  // Add these state variables at the top with other states
  const [syncData, setSyncData] = useState({
    platform: "",
    syncPreference: "",
  });
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSyncCRMModal, setShowSyncCRMModal] = useState(false);
  const [selectedCRMPlatform, setSelectedCRMPlatform] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Add these constants
  const platforms = ["HubSpot", "Salesforce", "Pipedrive"];
  const syncPreferences = [
    "All Contacts",
    "Selected Lists",
    "New Contacts Only",
  ];

  // Add these state variables with other states
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState<
    Array<{
      id: string;
      name: { text: string; html: string };
      start: { timezone: string; local: string; utc: string };
      end: { timezone: string; local: string; utc: string };
      status: string;
    }>
  >([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  // Add these state variables at the top with other states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Add this state for upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Add these state variables at the top with other states
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [renameListName, setRenameListName] = useState("");
  const [selectedListName, setSelectedListName] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Add these states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateListName, setDuplicateListName] = useState("");
  const [listToDuplicate, setListToDuplicate] = useState<string>("");

  // Add this state for tracking the list to delete
  const [listToDelete, setListToDelete] = useState<string>("");

  // Add a new state for list name error message
  const [listNameError, setListNameError] = useState<string>("");

  // Add a state for duplicate list name error
  const [duplicateListNameError, setDuplicateListNameError] =
    useState<string>("");

  // Add a state for rename list error
  const [renameListError, setRenameListError] = useState<string>("");

  // Add states for status change modal
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [listToChangeStatus, setListToChangeStatus] = useState<{
    id: string;
    name: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);

  const router = useRouter();

  // Add these handler functions before the return statement
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Add these handler functions before the return statement
  const handleDragEdit = (e: React.DragEvent) => {
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
      handleFileEdit(file);
    }
  };

  const handleDropEdit = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileEdit(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFileChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileEdit(file);
    }
  };

  const handleFile = async (file: File) => {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
      if (file.size <= 2 * 1024 * 1024) {
        setUploadedFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
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

          if (fileType === "csv") {
            const text = await file.text();
            console.log("CSV Content:", text);
            // TODO: Parse CSV data
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            console.log("Excel Content:", data);

            // Transform the data to match your contact structure
            const transformedContacts = data.map((row: any) => ({
              firstName: row.firstName || "",
              lastName: row["last name"] || "", // Handle different field names
              email: row.mailId || "",
              jobTitle: row.job || "",
              company: row.company || "",
              linkedinUrl: row.linkedinUrl || "",
              notes: row.notes || "",
              address: {
                line1: row.addressLine1 || "",
                line2: row.addressLine2 || "",
                city: row.city || "",
                state: row.state || "",
                zip: row.zip || "",
                country: row.country || "",
              },
            }));
            console.log("Transformed Contacts:", transformedContacts);

            setParsedContacts(transformedContacts);
          }
        } catch (error) {
          console.error("Error reading file:", error);
          // alert("Error reading file. Please try again.");
        }
      } else {
        // alert("File size should be less than 2MB");
      }
    } else {
      // alert("Please upload a .csv or .xls file");
    }
  };

  const handleFileEdit = async (file: File) => {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
      if (file.size <= 2 * 1024 * 1024) {
        setUploadedFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
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

          if (fileType === "csv") {
            const text = await file.text();
            console.log("CSV Content:", text);
            // TODO: Parse CSV data
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            console.log("CSV Content:", data);

            // Transform the data to match your contact structure
            const transformedContacts = data.map((row: any) => ({
              name: `${row.firstName || ""} ${row["last name"] || ""}`.trim(),
              email: row.mailId || row.email || "",
              phone: row.phoneNumber || row.phone || "",
              company: row.company || row.companyName || "",
              jobtitle: row.job || row.jobTitle || "",
              linkedin: row.linkedinUrl || row.linkedin || "",
              address: {
                line1: row.addressLine1 || "",
                line2: row.addressLine2 || "",
                city: row.city || "",
                state: row.state || "",
                zip: row.zip || "",
                country: row.country || "",
              },
            }));
            console.log("Transformed Contacts:", transformedContacts);

            setParsedContacts(transformedContacts);
          }
        } catch (error) {
          console.error("Error reading file:", error);
          // alert("Error reading file. Please try again.");
        }
      } else {
        // alert("File size should be less than 2MB");
      }
    } else {
      // alert("Please upload a .csv or .xls file");
    }
  };

  const handleImportToExistingList = async (file: File) => {
    try {
      if (file && selectedListForImport) {
        if (file.size > 2 * 1024 * 1024) {
          setCsvError("File size should be less than 2MB");
          return;
        }

        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (
          fileExtension !== "csv" &&
          fileExtension !== "xls" &&
          fileExtension !== "xlsx"
        ) {
          setCsvError("Please upload a .csv or .xls file");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${selectedListForImport.id}/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              accept: "application/json",
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to import contacts");
        }

        setShowImportToExistingListModal(false);
        setSelectedListForImport(null);
        setUploadedFile(null);
        setCsvError(null);
        fetchLists(); // Refresh the lists
      }
    } catch (error) {
      console.error("Error importing contacts:", error);
      setCsvError(
        error instanceof Error
          ? error.message
          : "Failed to import contacts. Please try again."
      );
    }
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newListData.currentTag.trim()) return;

    const existingTags = newListData.tags
      ? newListData.tags.split(",").filter((t) => t.trim())
      : [];
    if (existingTags.includes(newListData.currentTag.trim())) return;

    const newTags =
      existingTags.length > 0
        ? `${newListData.tags},${newListData.currentTag.trim()}`
        : newListData.currentTag.trim();

    setNewListData({
      ...newListData,
      tags: newTags,
      currentTag: "",
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const tags = newListData.tags
      .split(",")
      .filter((tag) => tag.trim() !== tagToRemove.trim());
    setNewListData({
      ...newListData,
      tags: tags.join(","),
    });
  };

  // Handle tag input keypress
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  useEffect(() => {
    if (!isLoadingCookies) {
      fetchLists();
    }
  }, [isLoadingCookies]);

  // Add this to useEffect after fetching lists
  useEffect(() => {
    if (!isLoadingCookies) {
      fetchLists();
    }
  }, [isLoadingCookies]);

  // Update fetchLists to calculate total pages
  const fetchLists = async () => {
    try {
      setIsLoading(true);
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch lists");
      }

      // Filter out deleted lists but keep inactive lists
      const visibleLists = data.data.filter(
        (list: ContactList) => list.status !== "deleted"
      );

      // Extract all unique tags for filter options
      const allTags = new Set<string>();
      visibleLists.forEach((list: ContactList) => {
        if (list.tags && list.tags.length > 0) {
          list.tags.forEach((tag) => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags));

      // Set the filtered lists to state
      setContactLists(visibleLists);

      // Calculate total pages
      setTotalPages(Math.ceil(visibleLists.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching lists:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch lists"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoreClick = (listId: string) => {
    setActiveDropdown(activeDropdown === listId ? null : listId);
  };

  const handleAction = (action: string, listId: string) => {
    console.log(`${action} for list ${listId}`);
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setActiveDropdown(null);
  };
  const handleCreateList = async (formData: FormEvent) => {
    formData.preventDefault();
    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      // Reset error message before submitting
      setListNameError("");

      const isDiscoverSource = newListData.source === "discover";

      // For Delight Discover lists, create a dummy list for UI validation
      if (isDiscoverSource) {
        const dummyDiscoverList = {
          _id: `${Date.now()}`,
          name: newListData.name,
          description:
            newListData.description || "Created with Delight Discover",
          source: {
            manual: false,
            csv: false,
            discover: true,
            crm: { type: null },
          },
          recipients: [],
          tags: newListData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
          metrics: {
            totalContacts: 0,
            totalRecipients: 0,
            campaignsUsed: 0,
            playbooksUsed: 0,
          },
          status: "active",
          usage: {
            campaignIds: [],
            playbookIds: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          organizationId: organizationId || "",
        };

        // Save list info to localStorage for discover page
        try {
          const recentLists = JSON.parse(
            localStorage.getItem("recentDiscoverLists") || "[]"
          );
          const listInfo = {
            id: dummyDiscoverList._id,
            name: newListData.name,
            createdAt: new Date().toISOString(),
          };
          recentLists.unshift(listInfo);
          // Keep only last 10 lists
          if (recentLists.length > 10) {
            recentLists.splice(10);
          }
          localStorage.setItem(
            "recentDiscoverLists",
            JSON.stringify(recentLists)
          );
        } catch (e) {
          console.log("Failed to save to localStorage:", e);
        }

        // Add new dummy discover list to the array
        setContactLists((prevLists) => [dummyDiscoverList, ...prevLists]);

        // Close modal and reset form before redirecting
        setShowNewListModal(false);
        setNewListData(createEmptyListData("manual"));
        setSelectedSourceType(null);
        setListNameError("");

        // Redirect to the detail page with auto-open discover drawer
        router.push(
          `/contact-lists/${dummyDiscoverList._id}?openDiscover=true`
        );
      } else {
        // For non-discover lists, use the original API logic
        const requestBody: any = {
          name: newListData.name,
          description: newListData.description,
          tags: newListData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
              accept: "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.status === 401) {
          router.push("/");
          return;
        }

        const data = await response.json();
        if (!data.success) {
          // Check for specific error message about name already existing
          if (
            data.error ===
            "A list with this name already exists in your organization"
          ) {
            setListNameError(data.error);
            return;
          }
          throw new Error(data.error);
        }

        // Refresh the contact lists to get updated data from server
        await fetchLists();

        // Close modal and reset form (only for non-discover lists)
        setShowNewListModal(false);
        setNewListData(createEmptyListData("manual"));
        setSelectedSourceType(null);
        setListNameError("");
      }
    } catch (error) {
      console.error("Error creating list:", error);
      // Here you might want to show an error message to the user
      // alert("Failed to create list. Please try again.");
    }
  };

  // Modify handleSaveContact to handle multiple contacts
  const handleSaveContact = async (contactData: FormEvent) => {
    contactData.preventDefault();
    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      // Add the new contact to contacts array first
      const allContacts = [...contacts, newContact];

      // Format tags from comma-separated string to array
      const formattedTags = newListData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      // Step 1: Create the list first
      const createListBody = {
        name: newListData.name,
        description: newListData.description,
        tags: formattedTags,
      };

      console.log("Creating list with:", JSON.stringify(createListBody));

      // Call the Delightloop API to create a list
      const listResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify(createListBody),
        }
      );

      const listData = await listResponse.json();

      if (!listResponse.ok) {
        throw new Error(listData.message || "Failed to create contact list");
      }

      console.log("List created successfully:", listData);

      // Extract the list ID from the response
      const listId = listData.data._id;

      // Step 2: Add contacts to the newly created list
      // Format the contacts according to the Delightloop API requirements
      const formattedContacts = allContacts.map((contact) => ({
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        jobtitle: contact.jobTitle || "",
        linkedin: contact.linkedinUrl || "",
        address: {
          line1: contact.address.line1 || "",
          line2: contact.address.line2 || "",
          city: contact.address.city || "",
          state: contact.address.state || "",
          zip: contact.address.zip || "",
          country: contact.address.country || "",
        },
      }));

      const addContactsBody = {
        contacts: formattedContacts,
        source: "manual",
      };

      console.log("Adding contacts:", JSON.stringify(addContactsBody));

      // Call the Delightloop API to add contacts to the list
      const contactsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${listId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify(addContactsBody),
        }
      );

      const contactsData = await contactsResponse.json();

      if (!contactsResponse.ok) {
        throw new Error(
          contactsData.message || "Failed to add contacts to list"
        );
      }

      console.log("Contacts added successfully:", contactsData);

      // Refresh the contact lists to get updated data from server
      await fetchLists();

      // Close modals and reset forms
      setShowAddContactModal(false);
      setShowAddContactModalEdit(false);
      setShowNewListModal(false);
      resetListData();
      setNewContact({
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
      setContacts([]); // Clear contacts array
    } catch (error) {
      console.error("Error creating contact list or adding contacts:", error);
      // alert("Failed to create contact list. Please try again.");
    }
  };

  // Update the menu click handler to set the selected list
  const handleAddContactClick = (
    e: React.MouseEvent,
    listId: string,
    listName: string
  ) => {
    e.stopPropagation();
    setSelectedListId(listId);
    setSelectedListName(listName);
    setShowAddContactModalEdit(true);

    console.log("Selected list ID:", listId);
    console.log("Selected list Name:", listName);
  };

  // Update the menu click handler to set the selected list
  const handleCRMClick = (
    e: React.MouseEvent,
    listId: string,
    listName: string
  ) => {
    e.stopPropagation();
    setSelectedListId(listId);
    setSelectedListName(listName);
    setShowSyncCRMModal(true);

    console.log("Selected list ID:", listId);
    console.log("Selected list Name:", listName);
  };

  const handleSaveContactEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Starting to save contact to list:", {
        selectedListId,
        selectedListName,
        contactData: newContact,
        allContacts: [...contacts, newContact],
      });

      if (!selectedListId) {
        console.error("No list ID selected");
        throw new Error("No list selected");
      }

      // Combine current form data with previously saved contacts
      const allContactsToSubmit = [...contacts, newContact].map((contact) => ({
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        jobtitle: contact.jobTitle || "",
        linkedin: contact.linkedinUrl
          ? `https://linkedin.com/in/${contact.linkedinUrl}`
          : "",
        address: {
          line1: contact.address.line1 || "",
          line2: contact.address.line2 || "",
          city: contact.address.city || "",
          state: contact.address.state || "",
          zip: contact.address.zip || "",
          country: contact.address.country || "",
        },
      }));

      const formattedData = {
        contacts: allContactsToSubmit,
        source: "manual",
      };

      console.log("Formatted data for API:", formattedData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${selectedListId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify(formattedData),
        }
      );

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API error response:", errorData);
        throw new Error(`Failed to add contact: ${errorData}`);
      }

      const result = await response.json();
      console.log("API success response:", result);

      if (result.success) {
        setShowAddContactModalEdit(false);
        setNewContact({
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
        setContacts([]); // Clear the contacts array after successful submission
        console.log("Contact added successfully, refreshing lists");
        await fetchLists();
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      // alert(error instanceof Error ? error.message : "Failed to add contact");
    }
  };

  // Add a "Save & Add New" handler
  const handleSaveAndAddNew = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields and format
    const emailError = validateEmail(newContact.email);
    const phoneError = validatePhone(newContact.phone);

    setValidationErrors({
      email: emailError,
      phone: phoneError,
    });

    if (emailError || phoneError || !isFormValid()) {
      return;
    }

    // Add current contact to contacts array
    setContacts((prevContacts) => [...prevContacts, newContact]);

    // Reset new contact form
    setNewContact({
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

  // Modify the handleSync function
  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

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
      const transformedContacts = data.map((item: any) => ({
        firstName: item.properties.firstName || item.properties.firstname || "",
        lastName: item.properties.lastName || item.properties.lastname || "",
        email: item.properties.email || "",
        company: item.properties.company || item.properties.companyName || "",
        jobTitle: item.properties.jobTitle || item.properties.jobtitle || "",
        linkedinUrl:
          item.properties.linkedinUrl || item.properties.hs_linkedin_url || "",
        notes: item.properties.notes || "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        },
      }));

      // Create list with contacts
      const listResponse = await fetch("/api/lists/with-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newListData.name,
          description: newListData.description,
          tags: newListData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
          contacts: transformedContacts,
          source: {
            manual: false,
            csv: false,
            crm: {
              type: syncData.platform,
            },
          },
        }),
      });

      const listData = await listResponse.json();

      if (!listData.success) {
        throw new Error(
          listData.error || "Failed to create list with contacts"
        );
      }

      // Refresh the contact lists to get updated data from server
      await fetchLists();

      // Close modals and reset forms
      setShowSyncModal(false);
      setShowNewListModal(false);
      setSyncData({ platform: "", syncPreference: "" });
      setNewListData({
        name: "",
        description: "",
        tags: "",
        currentTag: "",
        source: "manual",
      });
      setContacts([]);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      // alert("Failed to sync contacts. Please try again.");
    }
  };

  // Update the handleEventPlatformSync function
  const handleEventPlatformSync = async () => {
    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      const response = await fetch(
        "https://hook.eu2.make.com/kt1u2u1367ib7ov8sfy8xtk3364bjhd2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventbright: "delightloop" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      console.log("Event Platform Data:", data);
      setEventData(data);
      setShowEventModal(true);
    } catch (error) {
      console.error("Error fetching event platform data:", error);
    }
  };

  // Update the handleEventContinue function
  const handleEventContinue = async () => {
    if (!selectedEventId) return;

    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      const response = await fetch(
        "https://hook.eu2.make.com/6bs5299mk4ssmdcly5rum7bhckdhv8xe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "event-id": selectedEventId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      console.log("Event Attendees Data:", data);

      // Transform attendees data to match the required format
      const transformedContacts = data.map((attendee: any) => ({
        firstName: attendee.profile.first_name || attendee.name || "",
        lastName: attendee.profile.last_name || attendee.surname || "",
        email: attendee.email || attendee.profile.email || "",
        jobTitle: "", // Event platform doesn't provide job title
        company: "", // Event platform doesn't provide company
        linkedinUrl: "", // Event platform doesn't provide LinkedIn URL
        notes: `Event Status: ${attendee.status || ""}`, // Store attendance status in notes
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
        },
      }));

      // Create list with contacts
      const listResponse = await fetch("/api/lists/with-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newListData.name,
          description: newListData.description,
          tags: newListData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
          contacts: transformedContacts,
          source: {
            manual: false,
            csv: false,
            crm: {
              type: "Event Platform",
            },
          },
        }),
      });

      const listData = await listResponse.json();

      if (!listData.success) {
        throw new Error(
          listData.error || "Failed to create list with contacts"
        );
      }

      // Refresh the contact lists to get updated data from server
      await fetchLists();

      // Close modals and reset forms
      setShowEventModal(false);
      setShowNewListModal(false);
      setSelectedEventId("");
      setNewListData({
        name: "",
        description: "",
        tags: "",
        currentTag: "",
        source: "manual",
      });
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  // Update the handleRenameClick function
  const handleRenameClick = (
    e: React.MouseEvent,
    listId: string,
    currentName: string
  ) => {
    e.stopPropagation(); // Stop event bubbling
    setSelectedListId(listId);
    setRenameListName(currentName);
    setShowRenameListModal(true);
    setActiveDropdown(null);
    console.log("Renaming list:", { listId, currentName });
  };

  // Add this function with other handlers
  const handleRenameSubmit = async () => {
    try {
      console.log("Rename list:", {
        listId: selectedListId,
        oldName: contactLists.find((l) => l._id === selectedListId)?.name,
        newName: renameListName,
      });

      // Reset error before submitting
      setRenameListError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${selectedListId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({ name: renameListName }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        // Check for specific error message about name already existing
        if (
          data.error ===
          "A list with this name already exists in your organization"
        ) {
          setRenameListError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to rename list");
      }

      // Update the list name in the UI
      setContactLists((prevLists) =>
        prevLists.map((list) =>
          list._id === selectedListId ? { ...list, name: renameListName } : list
        )
      );

      // Close modal and reset states
      setShowRenameListModal(false);
      setRenameListName("");
      setSelectedListId("");
      setRenameListError("");
    } catch (error) {
      console.error("Error renaming list:", error);
      // alert("Failed to rename list. Please try again.");
    }
  };

  // Add this handler function for status change
  const handleStatusClick = (
    e: React.MouseEvent,
    listId: string,
    listName: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    setListToChangeStatus({
      id: listId,
      name: listName,
      currentStatus: currentStatus,
      newStatus: newStatus,
    });

    setShowStatusChangeModal(true);
    setActiveDropdown(null);
  };

  // Add this handler function for status change submission
  const handleStatusChangeSubmit = async () => {
    try {
      if (!authToken || !organizationId || !listToChangeStatus) {
        router.push("/");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${listToChangeStatus.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({ status: listToChangeStatus.newStatus }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update list status");
      }

      // Update the list status in the UI
      setContactLists((prevLists) =>
        prevLists.map((list) =>
          list._id === listToChangeStatus.id
            ? { ...list, status: listToChangeStatus.newStatus }
            : list
        )
      );

      // Close modal and reset states
      setShowStatusChangeModal(false);
      setListToChangeStatus(null);
    } catch (error) {
      console.error("Error updating list status:", error);
      // You might want to show an error message to the user here
    }
  };

  // Add this handler function
  const handleDuplicateClick = (
    e: React.MouseEvent,
    listId: string,
    currentName: string
  ) => {
    e.stopPropagation();
    setListToDuplicate(listId);
    setDuplicateListName(`${currentName} (Copy)`);
    setShowDuplicateModal(true);
    setActiveDropdown(null);
  };

  // Add the duplicate submit handler
  const handleDuplicateSubmit = async () => {
    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      // Reset error before submitting
      setDuplicateListNameError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: JSON.stringify({
            sourceListId: listToDuplicate,
            newName: duplicateListName,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        // Check for specific error message about name already existing
        if (
          data.error ===
          "A list with this name already exists in your organization"
        ) {
          setDuplicateListNameError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to duplicate list");
      }

      // Refresh the contact lists to get updated data from server
      await fetchLists();

      // Close modal and reset states
      setShowDuplicateModal(false);
      setDuplicateListName("");
      setListToDuplicate("");
      setDuplicateListNameError("");
    } catch (error) {
      console.error("Error duplicating list:", error);
      // alert("Failed to duplicate list. Please try again.");
    }
  };

  // Add this handler function
  const handleDeleteClick = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    setListToDelete(listId);

    // Get list details from existing contactLists state
    const listToDelete = contactLists.find((list) => list._id === listId);

    console.log("Deleting list:", {
      id: listId,
      name: listToDelete?.name,
    });

    setShowDeleteListModal(true);
    setActiveDropdown(null);
  };

  // Add this handler function
  const handleDeleteSubmit = async () => {
    try {
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/${listToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete list");
      }

      // Remove the list from UI
      setContactLists((prevLists) =>
        prevLists.filter((list) => list._id !== listToDelete)
      );

      // Close modal and reset state
      setShowDeleteListModal(false);
      setListToDelete("");
    } catch (error) {
      console.error("Error deleting list:", error);
      // alert("Failed to delete list. Please try again.");
    }
  };

  const handleSyncCRM = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncError("");

    try {
      // Validate user authentication
      if (!authToken || !organizationId) {
        router.push("/");
        return;
      }

      // Validate list selection
      if (!selectedListId) {
        setSyncError("Please select a list first");
        setIsSyncing(false);
        return;
      }

      // Fetch contacts from CRM
      const response = await fetch(
        "https://hook.eu2.make.com/56v54hsgwkk1n4eknqh3b93omgojy5v5",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platform: selectedCRMPlatform }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contacts from CRM");
      }

      const data = await response.json();
      console.log("Synced Contacts:", data);

      // Transform CRM data to match the recipients endpoint format
      const transformedContacts = data.map((item: any) => ({
        name: `${
          item.properties.firstName || item.properties.firstname || ""
        } ${item.properties.lastName || item.properties.lastname || ""}`.trim(),
        email: item.properties.email || "",
        jobTitle: item.properties.jobTitle || item.properties.jobtitle || "",
        company: item.properties.company || "",
        linkedin: item.properties.hs_linkedin_url || "",
        notes: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        },
      }));

      // Add contacts to the existing list
      const listResponse = await fetch(
        `/api/lists/${selectedListId}/recipients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contacts: transformedContacts,
            source: "crm",
          }),
        }
      );

      const listData = await listResponse.json();
      if (!listData.success) {
        throw new Error(listData.error || "Failed to add contacts to list");
      }

      // Refresh the lists to show updated data
      await fetchLists();

      // Close modal and reset state
      setShowSyncCRMModal(false);
      setSelectedCRMPlatform("");
      setIsSyncing(false);
      setSyncData({ platform: "", syncPreference: "" });

      // Show success message
      // alert("Contacts synced successfully!");
    } catch (error) {
      console.error("Error syncing contacts:", error);
      setSyncError(
        error instanceof Error ? error.message : "Failed to sync contacts"
      );
      setIsSyncing(false);
    }
  };

  // Add filter toggle function
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Add function to handle page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };



  // Function to filter contact lists based on search and filter criteria
  const getFilteredLists = () => {
    // First filter the lists based on search term and filter criteria
    const filteredLists = contactLists.filter((list) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (list.tags &&
          list.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ));

      if (!matchesSearch) return false;

      // Only apply additional filters if filters are shown
      if (!showFilters) return true;

      // Source filter
      const sourceFilter = filterCriteria.source;
      const sourceFilterActive =
        sourceFilter.manual || sourceFilter.csv || sourceFilter.crm || sourceFilter.discover;

      if (sourceFilterActive) {
        let sourceMatch = false;
        if (sourceFilter.manual && list.source.manual) sourceMatch = true;
        if (sourceFilter.csv && list.source.csv) sourceMatch = true;
        if (sourceFilter.crm && list.source.crm.type) sourceMatch = true;
        if (sourceFilter.discover && list.source.discover) sourceMatch = true;
        if (!sourceMatch) return false;
      }

      // Status filter
      const statusFilter = filterCriteria.status;
      const statusFilterActive = statusFilter.active || statusFilter.inactive;

      if (statusFilterActive) {
        let statusMatch = false;
        if (statusFilter.active && (list.status === 'active' || !list.status)) statusMatch = true;
        if (statusFilter.inactive && list.status === 'inactive') statusMatch = true;
        if (!statusMatch) return false;
      }

      return true;
    });

    // Update total pages based on filtered results
    const newTotalPages = Math.ceil(filteredLists.length / itemsPerPage);
    if (totalPages !== newTotalPages) {
      setTotalPages(newTotalPages);

      // Reset to first page if current page is out of range
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      lists: filteredLists.slice(startIndex, endIndex),
      totalCount: filteredLists.length,
    };
  };

  // Calculate filter count
  const getFilterCount = () => {
    const sourceFilter = filterCriteria.source;
    const statusFilter = filterCriteria.status;
    return Object.values(sourceFilter).filter(Boolean).length +
           Object.values(statusFilter).filter(Boolean).length;
  };

  // Helper for creative chip UI (copied/adapted from event page)
  const Chip = ({
    label,
    selected,
    onClick,
    color = "primary",
    icon,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
    color?: string;
    icon?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium shadow-sm
        ${
          selected
            ? "bg-primary text-white border-primary scale-105 shadow-lg"
            : "bg-white border-gray-300 text-gray-700 hover:bg-primary/10 hover:scale-105"
        }
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30
      `}
      style={{
        boxShadow: selected ? "0 4px 16px 0 rgba(127,86,217,0.10)" : undefined,
        transform: selected ? "scale(1.07)" : undefined,
      }}
      aria-pressed={selected}
    >
      {icon}
      <span>{label}</span>
      {selected && (
        <svg
          className="ml-1 w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="8" cy="8" r="8" fill="#7F56D9" />
          <path
            d="M5 8l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  // Add this function after the other handle* functions, for example after handleSaveAndAddNew
  const handleCsvUpload = async () => {
    setCsvError(null); // Clear any previous errors

    if (!uploadedFile || !newListData.name) {
      if (!newListData.name) {
        setCsvError("Please enter a list name first");
      }
      return false;
    }

    try {
      if (!authToken || !organizationId) {
        setCsvError("Authentication error. Please try logging in again.");
        router.push("/");
        return false;
      }

      console.log("Uploading CSV to create list:", newListData.name);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("listName", newListData.name);

      // Add description if available
      if (newListData.description) {
        formData.append("description", newListData.description);
      }

      // Add tags if available
      const formattedTags = newListData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      if (formattedTags.length > 0) {
        formData.append("tags", JSON.stringify(formattedTags));
      }

      // Call the Delightloop API to upload CSV and create list
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}/lists/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create list with contacts");
      }

      // Refresh the contact lists to get updated data from server
      await fetchLists();

      // Close modal and reset forms
      setShowImportCSVModal(false);
      setUploadedFile(null);
      setParsedContacts([]);
      setNewListData(createEmptyListData());

      return true;
    } catch (error) {
      console.error("Error creating list with contacts:", error);
      setCsvError(
        error instanceof Error
          ? error.message
          : "Failed to create list with contacts. Please try again."
      );
      return false;
    }
  };

  const handleCRMImport = async (platform: string, listId?: string) => {
    try {
      // Handle the import based on the selected platform
      console.log(
        `Importing from ${platform}`,
        listId ? `List ID: ${listId}` : ""
      );

      // Refresh the contact lists after successful import
      await fetchLists();

      // Close the modal
      setShowImportCRMModal(false);
    } catch (error) {
      console.error("Error refreshing lists after CRM import:", error);
    }
  };

  return (
    <div
      className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]"
      onClick={handleClickOutside}
    >
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto flex flex-col">
          <style jsx global>
            {animations}
          </style>
          <div className="flex-1">
            <div
              className="animate-fade-in opacity-0 relative"
              style={{ animationDelay: "50ms", animationFillMode: "forwards" }}
            >
            <PageHeader
              title="Contact Lists"
              description="Manage and organize your contacts efficiently"
              primaryButton={{
                text: "New Contact List",
                icon: Plus,
                onClick: () => setShowNewListModal(true),
                variant: "primary"
              }}
              chips={getFilterCount() > 0 ? [{ text: `${getFilterCount()} filter${getFilterCount() > 1 ? 's' : ''} applied`, color: "blue" }] : []}
              showDivider={true}
              className="pt-2"
            />
            
            {/* Search and Filter Controls */}
            <div className="mx-4 md:mx-6 lg:mx-8 mb-6 rounded-xl px-3 md:px-4 py-3 md:py-4 -mt-2" style={{ backgroundColor: '#F9FAFB' }}>
              {/* Mobile: Single row layout */}
              <div className="block md:hidden">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contact lists..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={toggleFilters}
                    className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline text-sm">Filters</span>
                    {getFilterCount() > 0 && (
                      <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {getFilterCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop: Single row layout */}
              <div className="hidden md:flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contact lists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={toggleFilters}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {getFilterCount() > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getFilterCount()}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Dropdown */}
              {showFilters && (
                <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Source
                    </label>
                    <div className="flex flex-wrap gap-2 py-1">
                      <Chip
                        label="Manual"
                        selected={filterCriteria.source.manual}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            source: {
                              ...prev.source,
                              manual: !prev.source.manual,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        }
                      />
                      <Chip
                        label="CSV"
                        selected={filterCriteria.source.csv}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            source: {
                              ...prev.source,
                              csv: !prev.source.csv,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        }
                      />
                      <Chip
                        label="CRM"
                        selected={filterCriteria.source.crm}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            source: {
                              ...prev.source,
                              crm: !prev.source.crm,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                        }
                      />
                      <Chip
                        label="Delight Discover"
                        selected={filterCriteria.source.discover}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            source: {
                              ...prev.source,
                              discover: !prev.source.discover,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2 py-1">
                      <Chip
                        label="Active"
                        selected={filterCriteria.status.active}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            status: {
                              ...prev.status,
                              active: !prev.status.active,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        }
                      />
                      <Chip
                        label="Inactive"
                        selected={filterCriteria.status.inactive}
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            status: {
                              ...prev.status,
                              inactive: !prev.status.inactive,
                            },
                          }))
                        }
                        icon={
                          <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
                        }
                      />
                    </div>
                  </div>
                  {/* Add more filter sections here if needed */}
                  {(filterCriteria.source.manual ||
                    filterCriteria.source.csv ||
                    filterCriteria.source.crm ||
                    filterCriteria.source.discover ||
                    filterCriteria.status.active ||
                    filterCriteria.status.inactive) && (
                    <div className="flex justify-end pt-2">
                      <button
                        className="text-xs text-primary hover:underline px-2 py-1"
                        onClick={() =>
                          setFilterCriteria((prev) => ({
                            ...prev,
                            source: {
                              manual: false,
                              csv: false,
                              crm: false,
                              discover: false,
                            },
                            status: {
                              active: false,
                              inactive: false,
                            },
                          }))
                        }
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lists Display */}
          <div
            className="animate-fade-in-up opacity-0 mx-4 md:mx-6 lg:mx-8"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="p-3 md:p-6 bg-white shadow-md rounded-lg relative animate-fade-in-card"
                    style={{ 
                      border: '1px solid #F3F4F6',
                      animationDelay: `${index * 50}ms` 
                    }}
                  >
                    {/* 1st Row: List name and actions */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4 animate-skeleton-pulse"></div>
                      <div className="h-8 w-8 rounded-full bg-gray-200 animate-skeleton-pulse"></div>
                    </div>

                    {/* 2nd Row: Source and Updated timestamp */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-skeleton-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-skeleton-pulse"></div>
                    </div>

                    {/* 3rd Row: Tags */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-skeleton-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-20 animate-skeleton-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-14 animate-skeleton-pulse"></div>
                    </div>

                    {/* 4th Row: Contacts, Campaigns and Status */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-gray-200 rounded-full animate-skeleton-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-20 animate-skeleton-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-gray-200 rounded-full animate-skeleton-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-24 animate-skeleton-pulse"></div>
                        </div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-skeleton-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-500 text-center my-8">{error}</div>
            ) : getFilteredLists().lists.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-[#667085]">
                No contact lists found. Create your first list by clicking the
                "New Contact List" button.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {getFilteredLists().lists.map((list, index) => (
                  <div
                    key={list._id}
                    onClick={() => {
                      // Route to detail page and add query param to auto-open discover drawer
                      if (list.source?.discover) {
                        router.push(
                          `/contact-lists/${list._id}?openDiscover=true`
                        );
                      } else {
                        router.push(`/contact-lists/${list._id}`);
                      }
                    }}
                    className={`
                      p-3 md:p-6 bg-white shadow-sm hover:shadow-lg 
                      hover:bg-gray-50/40 hover:border-gray-300/60
                      transition-all duration-200 ease-out cursor-pointer
                      relative hover-lift animate-fade-in-card rounded-lg
                      ${activeDropdown === list._id ? "z-20" : "z-0"}
                    `}
                    style={{ 
                      border: '1px solid #F3F4F6',
                      animationDelay: `${index * 50}ms` 
                    }}
                  >
                    {/* 1st Row: List name and actions */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm md:text-lg font-semibold text-[#101828]">
                        {list.name}
                      </h3>
                      <div className="relative cursor-pointer">
                        <button
                          className="px-3.5 hover:opacity-90 py-2 rounded-full hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoreClick(list._id);
                          }}
                        >
                          <div className="grid gap-0.5">
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                            <div className="size-1 rounded-full bg-[#101828]"></div>
                          </div>
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === list._id && (
                          <div className="absolute right-0 mt-2 w-[250px] bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
                            <div className="py-1">
                              <button
                                onClick={(e) =>
                                  handleAddContactClick(e, list._id, list.name)
                                }
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <Image
                                    src="/svgs/AddContact.svg"
                                    alt="Add"
                                    width={16}
                                    height={16}
                                  />
                                </div>
                                <span className="ml-3">Add Contact</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListForImport({
                                    id: list._id,
                                    name: list.name,
                                  });
                                  setShowImportToExistingListModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <Image
                                    src="/svgs/Import.svg"
                                    alt="Import"
                                    width={16}
                                    height={16}
                                  />
                                </div>
                                <span className="ml-3">
                                  Import Contacts from CSV
                                </span>
                              </button>
                              {/*<button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListId(list._id);
                                  setIsExportModalOpen(true);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <Image
                                    src="/svgs/Export.svg"
                                    alt="Export"
                                    width={16}
                                    height={16}
                                  />
                                </div>
                                <span className="ml-3">
                                  Export to CRM
                                </span>
                              </button>*/}
                              {Cookies.get("user_email") ==
                                "harsha@delightloop.com" && (
                                <button
                                  onClick={(e) =>
                                    handleCRMClick(e, list._id, list.name)
                                  }
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                                >
                                  <div className="flex items-center min-w-[24px]">
                                    <Image
                                      src="/svgs/Sync.svg"
                                      alt="Sync"
                                      width={16}
                                      height={16}
                                    />
                                  </div>
                                  <span className="ml-3">
                                    Sync from CRM/Platform
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleRenameClick(e, list._id, list.name)
                                }
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <svg
                                    width="16"
                                    height="17"
                                    viewBox="0 0 16 17"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M8 13.8333H14M11 2.83334C11.2652 2.56813 11.6249 2.41913 12 2.41913C12.1857 2.41913 12.3696 2.45571 12.5412 2.52678C12.7128 2.59785 12.8687 2.70202 13 2.83334C13.1313 2.96466 13.2355 3.12057 13.3066 3.29215C13.3776 3.46373 13.4142 3.64762 13.4142 3.83334C13.4142 4.01906 13.3776 4.20296 13.3066 4.37454C13.2355 4.54612 13.1313 4.70202 13 4.83334L4.66667 13.1667L2 13.8333L2.66667 11.1667L11 2.83334Z"
                                      stroke="#000000"
                                      strokeOpacity="1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <span className="ml-3">Rename List</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleDuplicateClick(e, list._id, list.name)
                                }
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <Image
                                    src="/svgs/Duplicate.svg"
                                    alt="Duplicate"
                                    width={16}
                                    height={16}
                                  />
                                </div>
                                <span className="ml-3">Duplicate List</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleStatusClick(e, list._id, list.name, list.status)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M8 1.33334C4.32 1.33334 1.33334 4.32 1.33334 8C1.33334 11.68 4.32 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.32 11.68 1.33334 8 1.33334ZM8 13.3333C5.06 13.3333 2.66667 10.94 2.66667 8C2.66667 5.06 5.06 2.66667 8 2.66667C10.94 2.66667 13.3333 5.06 13.3333 8C13.3333 10.94 10.94 13.3333 8 13.3333ZM8 4C6.9 4 6 4.9 6 6H7.33334C7.33334 5.63334 7.63334 5.33334 8 5.33334C8.36667 5.33334 8.66667 5.63334 8.66667 6C8.66667 6.36667 8.36667 6.66667 8 6.66667C7.26667 6.66667 6.66667 7.26667 6.66667 8V9.33334H8V8.66667C9.1 8.66667 10 7.76667 10 6.66667C10 5.56667 9.1 4.66667 8 4.66667V4Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </div>
                                <span className="ml-3">
                                  Mark as {list.status === 'active' ? 'Inactive' : 'Active'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, list._id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 whitespace-nowrap"
                              >
                                <div className="flex items-center min-w-[24px]">
                                  <Image
                                    src="/svgs/delete.svg"
                                    alt="Delete"
                                    width={16}
                                    height={16}
                                  />
                                </div>
                                <span className="ml-3">Delete List</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2nd Row: Source and Updated timestamp */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-[#667085]">
                        <span className="text-[#667085D6] font-semibold">
                          Source:{" "}
                        </span>
                        {list?.source?.manual
                          ? "Manual"
                          : list.source.csv
                          ? "CSV"
                          : list.source.discover
                          ? "Delight Discover"
                          : list.source.crm.type
                          ? "CRM"
                          : "No source yet"}
                      </div>
                      <div className="text-[#101828D6] font-semibold text-[10px] md:text-xs">
                        Updated{" "}
                        {(() => {
                          const now = new Date();
                          const updated = new Date(list.updatedAt);
                          const diffInHours = Math.floor(
                            (now.getTime() - updated.getTime()) /
                              (1000 * 60 * 60)
                          );

                          if (diffInHours < 1) {
                            return "just now";
                          } else if (diffInHours < 24) {
                            return `${diffInHours} hour${
                              diffInHours > 1 ? "s" : ""
                            } ago`;
                          } else {
                            const diffInDays = Math.floor(diffInHours / 24);
                            return `${diffInDays} day${
                              diffInDays > 1 ? "s" : ""
                            } ago`;
                          }
                        })()}
                      </div>
                    </div>

                    {/* 3rd Row: Tags */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {list.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={`md:px-3 md:py-1 py-0.5 px-2.5 capitalize text-[10px] md:text-xs font-medium rounded-full
                            ${
                              tag == "marketing" || index == 0
                                ? "text-[#B42318] bg-[#FEF3F2]"
                                : tag == "leads" || index == 1
                                ? "bg-[#F8F9FC] text-[#363F72]"
                                : tag == "events" || index == 2
                                ? "bg-[#ECFDF3] text-[#027A48]"
                                : tag == "new leads" || index == 3
                                ? "bg-[#F0F9FF] text-[#026AA2]"
                                : "bg-[#F8F9FC] text-[#363F72]"
                            }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 4th Row: Contacts, Campaigns and Status */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/svgs/users.svg"
                            alt="Contacts"
                            width={20}
                            height={20}
                          />
                          <span className="text-[#101828D6] font-semibold text-xs sm:text-sm">
                            {(() => {
                              if (process.env.NODE_ENV === "development") {
                                //console.log("Contact List Data:", list);
                              }
                              return null;
                            })()}
                            {list?.metrics?.totalContacts > 0
                              ? list.metrics.totalContacts.toLocaleString()
                              : list?.recipients?.length > 0
                              ? list.recipients.length.toLocaleString()
                              : "0"}{" "}
                            contacts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="text-[#101828D6] font-semibold text-xs sm:text-sm">
                            {list.metrics.campaignsUsed}{" "}
                            {list.metrics.campaignsUsed === 1
                              ? "campaign"
                              : "campaigns"}
                          </span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`px-3 py-1 capitalize text-[10px] md:text-xs font-medium rounded-full
                          ${
                            list.status === "List building.."
                              ? "text-[#B42318] bg-[#FEF3F2]" // Red
                              : list.status === "inactive"
                              ? "text-[#B42318] bg-[#FEF3F2]" // Red for inactive
                              : list.status === "active"
                              ? "bg-[#ECFDF3] text-[#027A48]" // Green for active
                              : "bg-[#F8F9FC] text-[#363F72]" // Default/Yellow
                          }`}
                      >
                        {list.status || "active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
          </div>

          {/* Pagination */}
          {!isLoading && !error && getFilteredLists().totalCount > 0 && (
            <div className="flex justify-between items-center mt-3 md:mt-4 border-t pt-3 border-gray-100">
              <button
                className={`flex items-center px-2 py-1.5 md:px-4 md:py-2 text-[#667085] font-[500] text-xs md:text-[14px] border border-gray-200 rounded-md ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Image
                  src="/svgs/Rarrow.svg"
                  alt="Previous Icon"
                  width={8}
                  height={8}
                  className="mr-1 md:mr-2 w-2 h-2 md:w-3 md:h-3"
                />
                Prev
              </button>

              <div className="flex items-center">
                <span className="text-xs md:text-sm text-gray-500 mr-2 hidden sm:inline">
                  Page
                </span>
                <div className="flex space-x-1 md:space-x-2 text-[#667085] text-xs md:text-[14px] font-[500]">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-1 rounded-md h-[30px] w-[30px] md:h-[36px] md:w-[36px] ${
                          currentPage === pageNum
                            ? "bg-[#F9F5FF] text-[#7F56D9] border border-[#7F56D9]"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <span className="flex items-center justify-center px-2">
                      ...
                    </span>
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-500 ml-2 hidden sm:inline">
                  of {totalPages}
                </span>
              </div>

              <button
                className={`flex items-center px-2 py-1.5 md:px-4 md:py-2 text-[#667085] font-[500] text-xs md:text-[14px] border border-gray-200 rounded-md ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <Image
                  src="/svgs/arrow.svg"
                  alt="Next Icon"
                  width={8}
                  height={8}
                  className="ml-1 md:ml-2 w-2 h-2 md:w-3 md:h-3"
                />
              </button>
            </div>
          )}

          {/* Mobile pagination info */}
          {!isLoading && !error && getFilteredLists().totalCount > 0 && (
            <div className="flex justify-center mt-2 mb-10 text-xs text-gray-500 md:hidden">
              Page {currentPage} of {totalPages}
            </div>
          )}

          {/* //! ----New List Modal---- */}
          {showNewListModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10 "></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-start mb-5 border-b-[1px] border-[#EAECF0] pb-5">
                    <div>
                      <h2 className="text-xl font-semibold text-[#101828] mb-1">
                        Create New Contact List
                      </h2>
                      <p className="text-sm text-[#667085] ">
                        You're on the following teams. You can create a new team
                        here.
                      </p>
                    </div>
                    {/* Close button */}
                    <button
                      onClick={() => setShowNewListModal(false)}
                      className=" text-gray-400 hover:text-gray-600"
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

                  <form onSubmit={handleCreateList} className="space-y-6 ">
                    <div>
                      <label
                        htmlFor="list-name"
                        className="block text-sm font-medium text-[#344054] mb-1"
                      >
                        List Name
                      </label>
                      <input
                        id="list-name"
                        type="text"
                        value={newListData.name}
                        onChange={(e) =>
                          setNewListData({
                            ...newListData,
                            name: e.target.value,
                          })
                        }
                        className={`w-full p-2.5 border ${
                          listNameError ? "border-red-500" : "border-[#D0D5DD]"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9]`}
                        placeholder="Enter list name"
                        required
                      />
                      {listNameError && (
                        <p className="mt-1 text-sm text-red-500">
                          {listNameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="tags"
                        className="block text-sm font-medium text-[#344054] mb-1"
                      >
                        Tags (optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="tags"
                          type="text"
                          value={newListData.currentTag}
                          onChange={(e) =>
                            setNewListData({
                              ...newListData,
                              currentTag: e.target.value,
                            })
                          }
                          onKeyPress={handleTagKeyPress}
                          className="flex-1 p-2.5 border bg-white border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                          placeholder="Enter Tag Name"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6]"
                          onClick={handleAddTag}
                        >
                          Add
                        </button>
                      </div>
                      {/* Display added tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newListData.tags
                          .split(",")
                          .filter((tag) => tag.trim())
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex font-medium items-center px-3 py-1 bg-[#F9F5FF] text-[#6941C6] text-sm rounded-full"
                            >
                              {tag.trim()}
                              <button
                                type="button"
                                className="ml-2 text-[#6941C6] hover:text-[#6941C6]"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-base font-medium text-[#344054] mb-2">
                        Add Contacts
                      </h3>
                      <p className="text-sm text-[#667085] mb-5">
                        You're on the following teams. You can create a new team
                        here.
                      </p>

                      <div className="grid grid-cols-2 gap-4 border-t-[1px] border-[#EAECF0] pt-4">
                        <div
                          onClick={() => {
                            if (newListData.name) {
                              setShowAddContactModal(true);
                              setShowNewListModal(false);
                            }
                          }}
                          className={`p-4 border border-[#EAECF0] rounded-lg ${
                            newListData.name
                              ? "cursor-pointer hover:bg-primary-xlight hover:border-primary-xlight"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-[#F9F5FF] rounded-full">
                              <Image
                                src="/svgs/users.svg"
                                alt="Add Contact"
                                width={16}
                                height={16}
                              />
                            </div>
                            <span className="font-medium">
                              Add your first contact
                            </span>
                          </div>
                          <p className="text-sm text-[#667085]">
                            Add yourself or manually add contact
                          </p>
                        </div>

                        <div
                          onClick={() => {
                            if (newListData.name) {
                              setShowImportCSVModal(true);
                              setShowNewListModal(false);
                            }
                          }}
                          className={`p-4 border border-[#EAECF0] rounded-lg ${
                            newListData.name
                              ? "cursor-pointer hover:bg-primary-xlight hover:border-primary-xlight"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-[#F9F5FF] rounded-full">
                              <Image
                                src="/svgs/Import.svg"
                                alt="Import"
                                width={16}
                                height={16}
                              />
                            </div>
                            <span className="font-medium">Import from csv</span>
                          </div>
                          <p className="text-sm text-[#667085]">
                            Import from existing CSV file
                          </p>
                        </div>

                        <div
                          onClick={() => {
                            setShowImportCRMModal(true);
                            setShowNewListModal(false);
                          }}
                          className="p-4 border border-[#EAECF0] rounded-lg cursor-pointer hover:bg-primary-xlight hover:border-primary-xlight"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-[#F9F5FF] rounded-full">
                              <Image
                                src="/svgs/crm.svg"
                                alt="CRM"
                                width={16}
                                height={16}
                              />
                            </div>
                            <span className="font-medium">Import from CRM</span>
                          </div>
                          <p className="text-sm text-[#667085]">
                            Import contacts from your CRM
                          </p>
                        </div>

                        <div
                          onClick={() => {
                            if (newListData.name) {
                              // Set source to discover and update selection state
                              setNewListData({
                                ...newListData,
                                source: "discover",
                              });
                              setSelectedSourceType("discover");
                              // Highlight the selection visually
                              toast.success(
                                "Delight Discover selected as source type"
                              );
                            }
                          }}
                          className={`p-4 border rounded-lg transition-all ${
                            selectedSourceType === "discover"
                              ? "border-primary bg-primary/10"
                              : "border-[#EAECF0]"
                          } ${
                            newListData.name
                              ? "cursor-pointer hover:bg-primary/5 hover:border-primary/30"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-[#F9F5FF] rounded-full">
                              <DelightDiscoverIcon size={16} />
                            </div>
                            <span className="font-medium">
                              Delight Discover
                            </span>
                          </div>
                          <p className="text-sm text-[#667085]">
                            Find more leads
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewListModal(false);
                          resetListData();
                          setSelectedSourceType(null);
                        }}
                        className=" w-fit px-4 ml-10 py-2.5 border border-[#D0D5DD] text-[#344054] rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className=" px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6]"
                      >
                        Create List & Add Contacts
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* //! --- Add Contact Modal---- */}
          {showAddContactModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative max-h-[90vh] overflow-y-auto">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-semibold">Add New Contact</h2>
                    {/* Close button */}
                    <button
                      onClick={() => setShowAddContactModal(false)}
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

                  <form onSubmit={handleSaveContact} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter first name"
                          value={newContact.firstName}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          value={newContact.lastName}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={newContact.email}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            email: e.target.value,
                          })
                        }
                        onBlur={() =>
                          handleFieldBlur("email", newContact.email)
                        }
                        className={`w-full p-2.5 border ${
                          validationErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={newContact.phone}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            phone: e.target.value,
                          })
                        }
                        onBlur={() =>
                          handleFieldBlur("phone", newContact.phone)
                        }
                        className={`w-full p-2.5 border ${
                          validationErrors.phone
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter job title"
                        value={newContact.jobTitle}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            jobTitle: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        value={newContact.company}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            company: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-2.5">
                          <Image
                            src="/svgs/Linkedin.svg"
                            alt="LinkedIn"
                            width={24}
                            height={24}
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="in/johndoe"
                          className="flex-1 p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={newContact.linkedinUrl}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              linkedinUrl: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        placeholder="Enter address line 1"
                        value={newContact.address.line1}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            address: {
                              ...newContact.address,
                              line1: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        placeholder="Enter address line 2"
                        value={newContact.address.line2}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            address: {
                              ...newContact.address,
                              line2: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="Enter city"
                          value={newContact.address.city}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                city: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="Enter state"
                          value={newContact.address.state}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                state: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zip
                        </label>
                        <input
                          type="text"
                          placeholder="Enter zip"
                          value={newContact.address.zip}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                zip: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          placeholder="Enter country"
                          value={newContact.address.country}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                country: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        placeholder="Enter a description..."
                        rows={3}
                        className="w-full p-2.5 resize-none border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newContact.notes}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            notes: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddContactModal(false);
                          setNewContact({
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
                          setContacts([]); // Clear contacts array when canceling
                        }}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
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
                      <button
                        type="submit"
                        className={`px-4 py-2.5 bg-purple-600 text-white rounded-lg ${
                          !isFormValid()
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-purple-700"
                        }`}
                        disabled={!isFormValid()}
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  {/* Add a list of current contacts */}
                  {contacts.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Added Contacts ({contacts.length})
                      </h3>
                      <div className="space-y-2">
                        {contacts.map((contact, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contact.email}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setContacts(
                                  contacts.filter((_, i) => i !== index)
                                );
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* //! --- Add Contact Modal---- */}
          {showAddContactModalEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative max-h-[90vh] overflow-y-auto">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-semibold  ">Add New Contact</h2>
                    {/* Close button */}
                    <button
                      onClick={() => setShowAddContactModalEdit(false)}
                      className=" text-gray-400 hover:text-gray-600"
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

                  <form onSubmit={handleSaveContactEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter first name"
                          value={newContact.firstName}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          value={newContact.lastName}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={newContact.email}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            email: e.target.value,
                          })
                        }
                        onBlur={() =>
                          setValidationErrors({
                            ...validationErrors,
                            email: validateEmail(newContact.email),
                          })
                        }
                        className={`w-full p-2.5 border ${
                          validationErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={newContact.phone}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            phone: e.target.value,
                          })
                        }
                        onBlur={() =>
                          setValidationErrors({
                            ...validationErrors,
                            phone: validatePhone(newContact.phone),
                          })
                        }
                        className={`w-full p-2.5 border ${
                          validationErrors.phone
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter job title"
                        value={newContact.jobTitle}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            jobTitle: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        value={newContact.company}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            company: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL<span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-2.5">
                          <Image
                            src="/svgs/Linkedin.svg"
                            alt="LinkedIn"
                            width={24}
                            height={24}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="in/johndoe"
                          className="flex-1 p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={newContact.linkedinUrl}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              linkedinUrl: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        placeholder="Enter address line 1"
                        value={newContact.address.line1}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            address: {
                              ...newContact.address,
                              line1: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        placeholder="Enter address line 2"
                        value={newContact.address.line2}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            address: {
                              ...newContact.address,
                              line2: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="Enter city"
                          value={newContact.address.city}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                city: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="Enter state"
                          value={newContact.address.state}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                state: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zip
                        </label>
                        <input
                          type="text"
                          placeholder="Enter zip"
                          value={newContact.address.zip}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                zip: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          placeholder="Enter country"
                          value={newContact.address.country}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              address: {
                                ...newContact.address,
                                country: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        placeholder="Enter a description..."
                        rows={3}
                        className="w-full p-2.5 resize-none border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newContact.notes}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            notes: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddContactModalEdit(false);
                          setNewContact({
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
                          setContacts([]); // Clear contacts array when canceling
                        }}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
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
                      <button
                        type="submit"
                        className={`px-4 py-2.5 bg-purple-600 text-white rounded-lg ${
                          !isFormValid()
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-purple-700"
                        }`}
                        disabled={!isFormValid()}
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  {/* Add a list of current contacts */}
                  {contacts.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Added Contacts ({contacts.length})
                      </h3>
                      <div className="space-y-2">
                        {contacts.map((contact, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contact.email}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setContacts(
                                  contacts.filter((_, i) => i !== index)
                                );
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        {/* container of file name and right svg */}
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
                          {/* this will show percentage of file uploading or both if all completed */}
                          {isUploading ? (
                            <div></div>
                          ) : (
                            <div className="bg-primary rounded-full text-white h-fit p-0.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14 5L7.125 12L4 8.81818"
                                  stroke="#ffffff"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
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
                        await handleCsvUpload();
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
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-semibold">
                      Rename Contact List
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRenameListModal(false);
                        setRenameListName("");
                        setSelectedListId("");
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit();
                    }}
                  >
                    <div className="text-sm text-[#667085] font-medium mb-2">
                      New List Name
                    </div>
                    <input
                      type="text"
                      value={renameListName}
                      onChange={(e) => setRenameListName(e.target.value)}
                      placeholder="Enter new list name"
                      required // Add required to prevent empty submissions
                      className={`w-full p-2.5 border ${
                        renameListError ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {renameListError && (
                      <p className="mt-1 text-sm text-red-500">
                        {renameListError}
                      </p>
                    )}
                    <div className="flex justify-center gap-3 pt-4 mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRenameListModal(false);
                          setRenameListName("");
                          setSelectedListId("");
                        }}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Rename List
                      </button>
                    </div>
                  </form>
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
                    This action cannot be undone. This will permanently delete
                    the contact list and remove the data from our servers.
                  </div>
                  {/* //? Footer */}
                  <div className="flex justify-center gap-3 pt-4 mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteListModal(false);
                        setListToDelete("");
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSubmit}
                      className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* //! --- Sync Modal ---- */}
          {showSyncModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[480px] relative">
                {/* Close button */}
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  ×
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
          {/* //! --- Event Modal ---- */}
          {showEventModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[480px] relative">
                {/* Close button */}
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEventId("");
                  }}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>

                <h2 className="text-xl font-semibold text-[#101828] mb-4">
                  Select Event
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">
                      Event Name
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full p-2.5 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white"
                      required
                    >
                      <option value="">Select an event</option>
                      {eventData.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name.text}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEventId && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2">Event Details</h3>
                      {eventData.map(
                        (event) =>
                          event.id === selectedEventId && (
                            <div key={event.id} className="space-y-2 text-sm">
                              <p>
                                <span className="font-medium">Start:</span>{" "}
                                {new Date(event.start.utc).toLocaleString()}
                              </p>
                              <p>
                                <span className="font-medium">End:</span>{" "}
                                {new Date(event.end.utc).toLocaleString()}
                              </p>
                              <p>
                                <span className="font-medium">Status:</span>{" "}
                                {event.status}
                              </p>
                              <p>
                                <span className="font-medium">Timezone:</span>{" "}
                                {event.start.timezone}
                              </p>
                            </div>
                          )
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventModal(false);
                        setSelectedEventId("");
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedEventId}
                      onClick={handleEventContinue}
                      className="flex-1 px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* //! --- Duplicate List Modal ---- */}
          {showDuplicateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-semibold">
                      Duplicate Contact List
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDuplicateModal(false);
                        setDuplicateListName("");
                        setListToDuplicate("");
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDuplicateSubmit();
                    }}
                  >
                    <div className="text-sm text-[#667085] font-medium mb-2">
                      New List Name
                    </div>
                    <input
                      type="text"
                      value={duplicateListName}
                      onChange={(e) => setDuplicateListName(e.target.value)}
                      placeholder="Enter list name"
                      required
                      className={`w-full p-2.5 border ${
                        duplicateListNameError
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {duplicateListNameError && (
                      <p className="mt-1 text-sm text-red-500">
                        {duplicateListNameError}
                      </p>
                    )}
                    <div className="flex justify-center gap-3 pt-4 mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDuplicateModal(false);
                          setDuplicateListName("");
                          setListToDuplicate("");
                        }}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Duplicate
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* Import to Existing List Modal */}
          {showImportToExistingListModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-semibold">Import from CSV</h2>
                    <button
                      onClick={() => {
                        setShowImportToExistingListModal(false);
                        setSelectedListForImport(null);
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
                      onDragEnter={handleDragEdit}
                      onDragLeave={handleDragEdit}
                      onDragOver={handleDragEdit}
                      onDrop={handleDropEdit}
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
                        onChange={handleFileChangeEdit}
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
                        {/* container of file name and right svg */}
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
                          {/* this will show percentage of file uploading or both if all completed */}
                          {isUploading ? (
                            <div></div>
                          ) : (
                            <div className="bg-primary rounded-full text-white h-fit p-0.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14 5L7.125 12L4 8.81818"
                                  stroke="#ffffff"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
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
                        setShowImportToExistingListModal(false);
                        setSelectedListForImport(null);
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (uploadedFile && selectedListForImport) {
                          await handleImportToExistingList(uploadedFile);
                        } else {
                          setCsvError("Please select a file to upload");
                        }
                      }}
                      className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
          {/* //! --- Sync CRM Modal ---- */}
          {showSyncCRMModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[480px] relative">
                {/* Close button */}
                <button
                  onClick={() => setShowSyncCRMModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>

                <h2 className="text-xl font-semibold text-[#101828] mb-1">
                  Sync Contacts from CRM
                </h2>
                <form onSubmit={handleSyncCRM} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">
                      Platform
                    </label>
                    <select
                      value={selectedCRMPlatform}
                      onChange={(e) => setSelectedCRMPlatform(e.target.value)}
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

                  {syncError && (
                    <div className="text-red-600 text-sm">{syncError}</div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSyncCRMModal(false)}
                      className="flex-1 px-4 py-2.5 border border-[#D0D5DD] text-[#344054] rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="flex-1 px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? "Syncing..." : "Start Sync"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <ImportFromCRM
            isOpen={showImportCRMModal}
            onClose={() => setShowImportCRMModal(false)}
            onImport={handleCRMImport}
            importType="list_and_contacts"
            listGuid={null}
          />
          <ExportToCRM
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onExport={(platform, listId) => {
              console.log("Exporting to", platform, "list:", listId);
            }}
            exportType="list"
            listGuid={selectedListId}
          />

          {/* //! --- Status Change Modal ---- */}
          {showStatusChangeModal && listToChangeStatus && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[572px] relative">
                <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10"></div>
                <div className="relative z-20">
                  {/* //? Title */}
                  <div className="flex justify-between items-center mb-6 border-b-[1px] border-[#EAECF0] pb-4">
                    <h2 className="text-xl font-medium">
                      Mark List as {listToChangeStatus.newStatus === 'active' ? 'Active' : 'Inactive'}?
                    </h2>
                    <button
                      onClick={() => {
                        setShowStatusChangeModal(false);
                        setListToChangeStatus(null);
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
                  {/* //? Body */}
                  <div className="text-sm font-medium text-center">
                    {listToChangeStatus.newStatus === 'active' ? (
                      <>
                        Are you sure you want to mark "<strong>{listToChangeStatus.name}</strong>" as active?
                        <br />
                        This will make the list available for campaigns and other operations.
                      </>
                    ) : (
                      <>
                        Are you sure you want to mark "<strong>{listToChangeStatus.name}</strong>" as inactive?
                        <br />
                        Inactive lists will remain visible but won't be available for new campaigns.
                      </>
                    )}
                  </div>
                  {/* //? Footer */}
                  <div className="flex justify-center gap-3 pt-4 mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusChangeModal(false);
                        setListToChangeStatus(null);
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStatusChangeSubmit}
                      className={`px-4 py-2.5 text-white rounded-lg ${
                        listToChangeStatus.newStatus === 'active'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      Mark as {listToChangeStatus.newStatus === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
