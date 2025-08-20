"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  Filter,
  Plus,
  ArrowUpDown,
  X, // Imported the X icon
  Mail,
  Phone,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { config } from "@/utils/config";

interface Contact {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedIn?: string;
  jobTitle: string;
  company: string;
  tags?: string[];
  avatar?: string;
  handle: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");

  // Filters
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedCard, setSelectedCard] = useState(""); // This state is unused in the filtering logic, consider removing if not needed
  const [selectedTag, setSelectedTag] = useState("");
  const [tempCompany, setTempCompany] = useState("");
  const [tempCard, setTempCard] = useState(""); // This state is unused, consider removing
  const [tempTag, setTempTag] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  // --- NEW: State for the create contact form ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const initialContactState: Contact = {
    _id: "",
    fullName: "",
    email: "",
    phone: "",
    linkedIn: "",
    jobTitle: "",
    company: "",
    tags: [],
    avatar: "",
    handle: "",
    isDeleted: false,
    createdAt: "",
    updatedAt: "",
  };
  const [newContactData, setNewContactData] =
    useState<Contact>(initialContactState);
  // --- END NEW ---

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/v1/vcard/contacts`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.data);
        } else {
          console.error("Failed to fetch contacts:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, []);

  function formatDate(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contact;
    direction: "asc" | "desc";
  } | null>(null);

  let filteredContacts = contacts.filter((c) => {
    const searchText = [
      c.fullName,
      c.jobTitle,
      c.company,
      c.tags?.join(", "),
      c.email,
      c.phone,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const companyMatch = selectedCompany ? c.company === selectedCompany : true;
    const tagMatch = selectedTag ? c.tags?.includes(selectedTag) : true;

    return searchText && companyMatch && tagMatch;
  });

  if (sortConfig) {
    filteredContacts.sort((a, b) => {
      const valA = (a[sortConfig.key] || "").toString().toLowerCase();
      const valB = (b[sortConfig.key] || "").toString().toLowerCase();
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const requestSort = (key: keyof Contact) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Contact) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="inline ml-1 opacity-50" />;
    }
    return (
      <span className="inline ml-1">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleContactSelection = (contact: Contact) => {
    setSelectedContact(contact);
    setIsOpen(true);
  };

  // --- NEW: Handlers for the create contact form ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewContactData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag); // Handle empty tags
    setNewContactData((prev) => ({ ...prev, tags: tagsArray }));
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // setNewContactData((prev) => ({
      //   ...prev,
      //   handle: "",//handle has to pass
      // }));
      console.log("Creating contact with data:", newContactData);
      const response = await fetch(`${config.BACKEND_URL}/v1/vcard/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newContactData),
      });

      if (response.ok) {
        const createdContact = await response.json();
        setContacts((prev) => [createdContact.data, ...prev]);
        setIsCreateOpen(false);
        setNewContactData(initialContactState);
      } else {
        console.error("Failed to create contact:", response.statusText);
        // Here you could show an error message to the user
      }
    } catch (error) {
      console.error("Error creating contact:", error);
    }
  };
  // --- END NEW ---

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      <AdminSidebar />

      <div className="flex-1 flex flex-col h-screen bg-gray-50 overflow-auto">
        <header className="flex justify-between items-center px-4 sm:px-6 py-4 bg-white border-b">
          <h1 className="text-lg sm:text-xl font-semibold">Contacts</h1>
        </header>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b relative">
          <input
            type="text"
            placeholder={`Search ${contacts.length} contacts`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full sm:w-1/3"
          />

          <div
            className="flex items-center gap-2 justify-end relative"
            ref={filterRef}
          >
            <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100">
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg p-4 z-50">
                  <h3 className="font-semibold mb-2">Filter Contacts</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Company</label>
                      <select
                        className="border px-2 py-1 rounded w-full"
                        value={tempCompany}
                        onChange={(e) => setTempCompany(e.target.value)}
                      >
                        <option value="">All Companies</option>
                        {[...new Set(contacts.map((c) => c.company))].map(
                          (comp) => (
                            <option key={comp} value={comp}>
                              {comp}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Tag</label>
                      <select
                        className="border px-2 py-1 rounded w-full"
                        value={tempTag}
                        onChange={(e) => setTempTag(e.target.value)}
                      >
                        <option value="">All Tags</option>
                        {[
                          ...new Set(contacts.flatMap((c) => c.tags || [])),
                        ].map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setTempCompany("");
                        setTempCard("");
                        setTempTag("");
                      }}
                    >
                      Reset
                    </button>
                    <button
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      onClick={() => {
                        setSelectedCompany(tempCompany);
                        setSelectedCard(tempCard);
                        setSelectedTag(tempTag);
                        setFilterOpen(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Contact</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <img
                src="https://cdn.hihello.com/empty-contacts.svg"
                alt="No contacts"
                className="w-48 sm:w-64 mb-4"
              />
              <h2 className="text-base sm:text-lg font-semibold mb-2">
                Add another contact!
              </h2>
              <p className="max-w-md text-sm sm:text-base">
                You don’t have any new contacts within HiHello. Try sharing one
                of your cards, scanning a paper card, or adding your own!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="hidden sm:table w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("fullName")}
                    >
                      Name {getSortIcon("fullName")}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("jobTitle")}
                    >
                      Title {getSortIcon("jobTitle")}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("company")}
                    >
                      Company {getSortIcon("company")}
                    </th>
                    <th className="px-4 py-3">Tags</th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("createdAt")}
                    >
                      Date Added {getSortIcon("createdAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr
                      key={c._id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleContactSelection(c)}
                    >
                      <td className="px-4 py-3 flex items-center gap-2">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                            {c.fullName
                              ? c.fullName.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                        )}
                        {c.fullName}
                      </td>
                      <td className="px-4 py-3">{c.jobTitle}</td>
                      <td className="px-4 py-3">{c.company}</td>
                      <td className="px-4 py-3">{c.tags?.join(", ")}</td>
                      <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sm:hidden space-y-4">
                {filteredContacts.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 border rounded-lg bg-white shadow-sm cursor-pointer"
                    onClick={() => handleContactSelection(c)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                          {c.fullName
                            ? c.fullName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{c.fullName}</p>
                        <p className="text-sm text-gray-500">{c.jobTitle}</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">Company: </span>
                      {c.company}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tags: </span>
                      {c.tags?.join(", ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Added on {formatDate(c.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Drawer */}
      <div className="relative">
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* --- MODIFICATION START --- */}
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out w-full max-w-md sm:w-96 overflow-y-auto
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <div className="flex items-center justify-end p-4 border-b">
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
          </div>

          {selectedContact && (
            <div className="flex flex-col">
              <div className="bg-gray-700 relative h-[200px] sm:h-[300px] overflow-hidden">
                {selectedContact.avatar ? (
                  <img
                    src={selectedContact.avatar}
                    alt={selectedContact.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="absolute bottom-0 left-0 w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 500 150"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M-0.27,97.08 C149.99,150.00 349.20,30.00 500.00,97.08 L500.00,0.00 L0.00,0.00 Z"
                      className="fill-white"
                    ></path>
                  </svg>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedContact.fullName}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="bg-gray-700 text-white p-2 rounded-full">
                      <Mail size={18} />
                    </div>
                    <span className="ml-3 text-gray-700 break-all">
                      {selectedContact.email}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-gray-700 text-white p-2 rounded-full">
                      <Phone size={18} />
                    </div>
                    <span className="ml-3 text-gray-700">
                      {selectedContact.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* --- MODIFICATION END --- */}
      </div>

      {/* --- NEW: Create Contact Drawer --- */}
      <div className="relative">
        {isCreateOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setIsCreateOpen(false)}
          />
        )}
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out w-full max-w-md sm:w-96
          ${isCreateOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <form onSubmit={handleCreateContact} className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Contact</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={newContactData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={newContactData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={newContactData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Job Title
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  id="jobTitle"
                  value={newContactData.jobTitle}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  value={newContactData.company}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="linkedIn"
                  className="block text-sm font-medium text-gray-700"
                >
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedIn"
                  id="linkedIn"
                  value={newContactData.linkedIn}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="avatar"
                  className="block text-sm font-medium text-gray-700"
                >
                  Avatar URL
                </label>
                <input
                  type="url"
                  name="avatar"
                  id="avatar"
                  value={newContactData.avatar}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={newContactData.tags?.join(", ")}
                  onChange={handleTagsChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
              >
                Save Contact
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
