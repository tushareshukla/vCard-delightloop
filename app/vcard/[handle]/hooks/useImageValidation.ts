"use client";

import { useState, useEffect } from "react";

interface UseImageValidationReturn {
  validAvatarUrl: string | null;
  validCompanyLogoUrl: string | null;
  validCoverImageUrl: string | null;
  handleAvatarError: () => void;
  handleCompanyLogoError: () => void;
  handleCoverImageError: () => void;
}

export const useImageValidation = (
  avatarUrl?: string,
  companyLogoUrl?: string,
  coverImageUrl?: string
): UseImageValidationReturn => {
  const [validAvatarUrl, setValidAvatarUrl] = useState<string | null>(null);
  const [validCompanyLogoUrl, setValidCompanyLogoUrl] = useState<string | null>(
    null
  );
  const [validCoverImageUrl, setValidCoverImageUrl] = useState<string | null>(
    null
  );

  // Initialize valid image URLs when URLs change
  useEffect(() => {
    setValidAvatarUrl(avatarUrl || null);
  }, [avatarUrl]);

  useEffect(() => {
    setValidCompanyLogoUrl(companyLogoUrl || null);
  }, [companyLogoUrl]);

  useEffect(() => {
    setValidCoverImageUrl(coverImageUrl || null);
  }, [coverImageUrl]);

  const handleAvatarError = () => {
    setValidAvatarUrl(null);
  };

  const handleCompanyLogoError = () => {
    setValidCompanyLogoUrl(null);
  };

  const handleCoverImageError = () => {
    setValidCoverImageUrl(null);
  };

  return {
    validAvatarUrl,
    validCompanyLogoUrl,
    validCoverImageUrl,
    handleAvatarError,
    handleCompanyLogoError,
    handleCoverImageError,
  };
};
