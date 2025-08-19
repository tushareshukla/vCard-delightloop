"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Filter, Plus, ArrowUpDown, X } from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";

interface Contact {
  id: string;

  // Contact Info
  prefix?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  preferredName?: string;
  maidenName?: string;
  pronouns?: string;
  accreditations?: string;
  phone?: string;
  email?: string;

  // Work Info
  company: string;
  title: string;
  department?: string;

  // Address Info
  address?: string;
  addressType?: string;

  // Other Info
  tags?: string[];
  card?: string;
  avatar?: string;
  dateAdded: string;
  websites?: string[];
  importantDates?: string[];
  notes?: string[];
}

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>([
    {
      id: "1",
      prefix: "Mr.",
      firstName: "Manu",
      lastName: "Kumar",
      title: "Co-founder & CEO",
      company: "HiHello, Inc.",
      phone: "+91-9876543210",
      email: "manu@example.com",
      tags: ["Founder"],
      card: "Personal",
      avatar: "https://i.pravatar.cc/150?img=3",
      dateAdded: "2025-08-12",
      websites: ["https://hihello.com"],
      notes: ["Met at startup event", "Interested in partnership"],
    },
    {
      id: "2",
      prefix: "Ms.",
      firstName: "Jane",
      lastName: "Doe",
      title: "Product Manager",
      company: "TechFlow",
      phone: "+1-555-123-4567",
      email: "jane.doe@techflow.com",
      tags: ["PM", "Strategy"],
      card: "Work",
      avatar: "https://i.pravatar.cc/150?img=5",
      dateAdded: "2025-07-03",
      websites: ["https://techflow.com"],
    },
    {
      id: "3",
      firstName: "Alex",
      lastName: "Johnson",
      title: "Software Engineer",
      company: "NextGen Apps",
      phone: "+44-7700-900123",
      email: "alex.johnson@nextgen.com",
      tags: ["Developer", "React"],
      card: "Work",
      avatar: "https://i.pravatar.cc/150?img=8",
      dateAdded: "2025-06-15",
      notes: ["Frontend expert", "Looking for remote work"],
    },
  ]);

  const [search, setSearch] = useState("");

  // Filters
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tempCompany, setTempCompany] = useState("");
  const [tempCard, setTempCard] = useState("");
  const [tempTag, setTempTag] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close filter dropdown outside
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
      c.firstName,
      c.lastName,
      c.title,
      c.company,
      c.tags?.join(", "),
      c.card,
      c.email,
      c.phone,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const companyMatch = selectedCompany ? c.company === selectedCompany : true;
    const cardMatch = selectedCard ? c.card === selectedCard : true;
    const tagMatch = selectedTag ? c.tags?.includes(selectedTag) : true;

    return searchText && companyMatch && cardMatch && tagMatch;
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

  // Drawer state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const handleContactSelection = (contact: Contact) => {
    setSelectedContact(contact);
    setIsOpen(true);
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      <AdminSidebar />

      <div className="flex-1 flex flex-col h-screen bg-gray-50 overflow-auto">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-4 bg-white border-b">
          <h1 className="text-lg sm:text-xl font-semibold">Contacts</h1>
        </header>

        {/* Toolbar */}
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
            {/* Download Button */}
            <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-100">
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Filters Dropdown */}
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
                    {/* Company */}
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

                    {/* Card */}
                    <div>
                      <label className="block text-sm mb-1">Card</label>
                      <select
                        className="border px-2 py-1 rounded w-full"
                        value={tempCard}
                        onChange={(e) => setTempCard(e.target.value)}
                      >
                        <option value="">All Cards</option>
                        {[...new Set(contacts.map((c) => c.card || ""))].map(
                          (card) =>
                            card && (
                              <option key={card} value={card}>
                                {card}
                              </option>
                            )
                        )}
                      </select>
                    </div>

                    {/* Tag */}
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

            {/* Add New Contact */}
            <button className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              <Plus size={16} />
              <span className="hidden sm:inline">New Contact</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
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
              {/* Desktop Table */}
              <table className="hidden sm:table w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("firstName")}
                    >
                      Name {getSortIcon("firstName")}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("title")}
                    >
                      Title {getSortIcon("title")}
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
                      onClick={() => requestSort("card")}
                    >
                      Associated Card {getSortIcon("card")}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => requestSort("dateAdded")}
                    >
                      Date Added {getSortIcon("dateAdded")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleContactSelection(c)}
                    >
                      <td className="px-4 py-3 flex items-center gap-2">
                        <img
                          src={c.avatar}
                          alt={c.firstName}
                          className="w-8 h-8 rounded-full"
                        />
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="px-4 py-3">{c.title}</td>
                      <td className="px-4 py-3">{c.company}</td>
                      <td className="px-4 py-3">{c.tags?.join(", ")}</td>
                      <td className="px-4 py-3">{c.card}</td>
                      <td className="px-4 py-3">{c.dateAdded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-4">
                {filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 border rounded-lg bg-white shadow-sm cursor-pointer"
                    onClick={() => handleContactSelection(c)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={c.avatar}
                        alt={c.firstName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{c.title}</p>
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
                    <p className="text-sm">
                      <span className="font-semibold">Card: </span>
                      {c.card}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Added on {c.dateAdded}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Drawer */}
      <div className="relative h-screen flex items-center justify-center">

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Right Slider Panel */}
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
          style={{ width: "65%" }} // 👈 custom width
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Right Panel</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500">
              ✕
            </button>
          </div>

          {/* Content */}

        </div>
      </div>
    </div>
  );
}
