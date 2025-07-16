"use client";

import { ProfileData } from "../types/vcard.types";

interface VCardErrorStateProps {
  nfcDisabled: boolean;
  profile: ProfileData | null;
  error: string | null;
  handle: string;
}

export default function VCardErrorState({
  nfcDisabled,
  profile,
  error,
  handle,
}: VCardErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-r  from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {nfcDisabled ? (
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 2h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {nfcDisabled ? "NFC Not Enabled" : "Profile Not Found"}
          </h1>
          <p className="text-gray-600 mb-6">
            {nfcDisabled
              ? `${profile?.fullName}'s profile exists but NFC sharing is not enabled. Please contact them to enable NFC sharing.`
              : error || `The profile "${handle}" doesn't exist.`}
          </p>
        </div>
      </div>
    </div>
  );
} 