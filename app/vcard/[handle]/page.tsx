"use client";

import { use } from "react";
import { useVCardProfile } from "./hooks/useVCardProfile";
import VCardLoadingState from "./components/VCardLoadingState";
import VCardErrorState from "./components/VCardErrorState";
import VCardContent from "./components/VCardContent";

export default function VCardProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const { profile, loading, notFound, error, nfcDisabled } =
    useVCardProfile(handle);

  // Loading state
  if (loading) {
    return <VCardLoadingState />;
  }

  // Profile not found or NFC disabled state
  if (notFound || nfcDisabled || !profile) {
    return (
      <VCardErrorState
        nfcDisabled={nfcDisabled}
        profile={profile}
        error={error}
        handle={handle}
      />
    );
  }

  // Main content
  return <VCardContent profile={profile} />;
}
