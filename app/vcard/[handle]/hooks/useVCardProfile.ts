"use client";

import { useState, useEffect } from "react";
import { ProfileData } from "../types/vcard.types";

interface UseVCardProfileReturn {
  profile: ProfileData | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  nfcDisabled: boolean;
}

export const useVCardProfile = (handle: string): UseVCardProfileReturn => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfcDisabled, setNfcDisabled] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!handle) {
          setNotFound(true);
          return;
        }

        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.delightloop.ai";
        const response = await fetch(
          `${apiBaseUrl}/v1/vcard/handle/${handle.toLowerCase()}`
        );
        const data = await response.json();

        if (response.ok) {
          if (data?.data?.nfcEnabled === false) {
            setProfile(data?.data);
            setNfcDisabled(true);
            setNotFound(false);
            setError("NFC sharing is not enabled for this profile");
          } else {
            setProfile(data?.data);
            setNotFound(false);
            setNfcDisabled(false);
          }
        } else {
          setProfile(null);
          setNotFound(true);
          setNfcDisabled(false);
          setError(data.error || "Profile not found");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setNotFound(true);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [handle]);

  return {
    profile,
    loading,
    notFound,
    error,
    nfcDisabled,
  };
};
