"use client";

import { useState, useEffect } from "react";
import type { EventCampaignData } from "../EventCampaignWizard";
import { motion } from "framer-motion";
import {
  Search,
  AlertCircle,
  Check,
  X,
  Linkedin,
  ExternalLink,
  Lock,
} from "lucide-react";
import Image from "next/image";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useAuth } from "@/app/context/AuthContext";

interface LinkedInProfile {
  id: string;
  name: string;
  profileUrl: string;
  imageUrl: string;
  position?: string;
  company?: string;
  connectionDegree?: number;
}

interface LinkedInConnectionsStepProps {
  campaignData: EventCampaignData;
  updateCampaignData: (data: Partial<EventCampaignData>) => void;
  onNext: () => void;
  onBack: () => void;
  onRecipientCountUpdate: (count: number) => void;
}

export default function LinkedInConnectionsStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
  onRecipientCountUpdate,
}: LinkedInConnectionsStepProps) {
  const { authToken, organizationId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<LinkedInProfile[]>(
    campaignData.linkedInProfiles || []
  );
  const [searchResults, setSearchResults] = useState<LinkedInProfile[]>([]);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState<
    boolean | null
  >(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Check if LinkedIn is connected
  useEffect(() => {
    const checkLinkedInConnection = async () => {
      setIsCheckingConnection(true);
      try {
        const baseUrl = await getBackendApiBaseUrl();
        const response = await fetch(
          `${baseUrl}/v1/organizations/${organizationId}/social/linkedin/status`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to check LinkedIn connection: ${response.statusText}`
          );
        }

        const data = await response.json();
        setIsLinkedInConnected(data.isConnected || false);
      } catch (err) {
        console.error("Error checking LinkedIn connection:", err);
        setIsLinkedInConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    if (authToken && organizationId) {
      checkLinkedInConnection();
    }
  }, [authToken, organizationId]);

  // Update recipient count whenever selected profiles change
  useEffect(() => {
    onRecipientCountUpdate(selectedProfiles.length);
  }, [selectedProfiles, onRecipientCountUpdate]);

  const connectToLinkedIn = async () => {
    try {
      const baseUrl = await getBackendApiBaseUrl();
      // In a real app, this would redirect to LinkedIn OAuth flow
      window.location.href = `${baseUrl}/v1/organizations/${organizationId}/social/linkedin/connect`;
    } catch (err) {
      setError("Failed to connect to LinkedIn. Please try again.");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    if (!isLinkedInConnected) {
      setError("Please connect your LinkedIn account first.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const baseUrl = await getBackendApiBaseUrl();
      const apiUrl = `${baseUrl}/v1/organizations/${organizationId}/social/linkedin/search?query=${encodeURIComponent(
        searchTerm
      )}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to search LinkedIn connections: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Format connection data from the API response
        const connections = data.connections.map((conn: any) => ({
          id: conn.id,
          name: conn.name || "LinkedIn Connection",
          profileUrl:
            conn.profileUrl || `https://linkedin.com/in/user-${conn.id}`,
          imageUrl: conn.imageUrl || "/placeholder.svg?height=80&width=80",
          position: conn.position || "",
          company: conn.company || "",
          connectionDegree: conn.connectionDegree || 1,
        }));

        setSearchResults(connections);

        if (connections.length === 0) {
          setError("No LinkedIn connections found matching your search term.");
        }
      } else {
        throw new Error(data.error || "Failed to search LinkedIn connections");
      }
    } catch (err) {
      console.error("Error searching LinkedIn connections:", err);
      setError("Failed to search LinkedIn connections. Please try again.");

      // Fallback to mock data for demonstration purposes
      const mockResults = [
        {
          id: `li-${Date.now()}-1`,
          name: `${searchTerm} Smith`,
          profileUrl: `https://linkedin.com/in/${searchTerm
            .toLowerCase()
            .replace(/\s+/g, "-")}smith`,
          imageUrl: "https://via.placeholder.com/80x80.png?text=JS",
          position: "Marketing Director",
          company: "Acme Inc",
          connectionDegree: 1,
        },
        {
          id: `li-${Date.now()}-2`,
          name: `John ${searchTerm}`,
          profileUrl: `https://linkedin.com/in/john${searchTerm
            .toLowerCase()
            .replace(/\s+/g, "")}`,
          imageUrl: "https://via.placeholder.com/80x80.png?text=JD",
          position: "Software Engineer",
          company: "Tech Solutions",
          connectionDegree: 2,
        },
        {
          id: `li-${Date.now()}-3`,
          name: `${searchTerm} Jones`,
          profileUrl: `https://linkedin.com/in/${searchTerm
            .toLowerCase()
            .replace(/\s+/g, "-")}jones`,
          imageUrl: "https://via.placeholder.com/80x80.png?text=RJ",
          position: "Product Manager",
          company: "Innovation Labs",
          connectionDegree: 1,
        },
      ];
      setSearchResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfileSelect = (profile: LinkedInProfile) => {
    setSelectedProfiles((prev) => {
      const isAlreadySelected = prev.some((p) => p.id === profile.id);

      if (isAlreadySelected) {
        return prev.filter((p) => p.id !== profile.id);
      } else {
        return [...prev, profile];
      }
    });
  };

  const handleContinue = () => {
    if (selectedProfiles.length > 0) {
      updateCampaignData({
        linkedInProfiles: selectedProfiles,
      });
      onNext();
    }
  };

  // Handle key press events for search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Checking LinkedIn connection status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Select LinkedIn Connections</h2>
      <p className="text-gray-600 mb-8">
        Search and select LinkedIn connections to send gifts to
      </p>

      {/* LinkedIn Connection Status */}
      {!isLinkedInConnected && (
        <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Linkedin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Connect your LinkedIn Account
              </h3>
              <p className="text-blue-700 mb-4">
                To search and select your LinkedIn connections, you need to
                connect your LinkedIn account first.
              </p>
              <button
                onClick={connectToLinkedIn}
                className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
              >
                <Linkedin className="w-4 h-4" />
                <span>Connect LinkedIn Account</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn URL or Search Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`block w-full pl-10 pr-12 py-2 border ${
                !isLinkedInConnected
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              } rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                !isLinkedInConnected ? "cursor-not-allowed" : ""
              }`}
              placeholder="Search by name or paste LinkedIn profile URL"
              disabled={!isLinkedInConnected}
            />
            {!isLinkedInConnected && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim() || !isLinkedInConnected}
            className={`px-4 py-2 rounded-md font-medium flex items-center ${
              isSearching || !searchTerm.trim() || !isLinkedInConnected
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Searching...</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Selected Connections */}
      {selectedProfiles.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">
            Selected Connections ({selectedProfiles.length})
          </h3>
          <motion.div
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={
                          profile.imageUrl ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {profile.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile.position && profile.company
                          ? `${profile.position} at ${profile.company}`
                          : profile.profileUrl}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleProfileSelect(profile)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Search Results</h3>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {searchResults.map((profile) => {
              const isSelected = selectedProfiles.some(
                (p) => p.id === profile.id
              );

              return (
                <motion.div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={
                          profile.imageUrl ||
                          "/placeholder.svg?height=48&width=48"
                        }
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                      {profile.connectionDegree &&
                        profile.connectionDegree > 1 && (
                          <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                            {profile.connectionDegree}
                          </div>
                        )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {profile.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile.position && profile.company
                          ? `${profile.position} at ${profile.company}`
                          : profile.profileUrl}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected
                        ? "bg-primary text-white"
                        : "border border-gray-300 text-transparent"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          <span>Back</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={selectedProfiles.length === 0}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            selectedProfiles.length > 0
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>Continue</span>
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
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
