"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileData } from "../types/vcard.types";
import { getThemeColors, createVCard } from "../utils/vcard.utils";

interface SaveContactButtonProps {
  profile: ProfileData;
}

export default function SaveContactButton({ profile }: SaveContactButtonProps) {
  const [saveContactClicked, setSaveContactClicked] = useState(false);

  const themeColors = getThemeColors(profile.theme);

  const handleSaveContact = () => {
    if (!profile) return;

    try {
      // Create vCard content
      const vCardContent = createVCard(profile);

      // Create blob and download
      const blob = new Blob([vCardContent], { type: "text/vcard" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${profile.fullName.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success state
      setSaveContactClicked(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setSaveContactClicked(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving contact:", error);
      // You could add error handling here if needed
    }
  };

  return (
    <Button
      onClick={handleSaveContact}
      className={`w-full ${
        themeColors.accent
      } text-white font-bold py-6 rounded-full mb-8 text-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
        saveContactClicked
          ? "animate-pulse bg-green-600 hover:bg-green-700"
          : ""
      }`}
    >
      {saveContactClicked ? (
        <div className="flex items-center justify-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Contact Saved!
        </div>
      ) : (
        <div className="flex items-center justify-center">Save Contact</div>
      )}
    </Button>
  );
} 