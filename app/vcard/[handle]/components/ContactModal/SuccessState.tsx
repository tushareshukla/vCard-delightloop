"use client";

import { SuccessStateProps } from "./ContactModal.types";

export default function SuccessState({ profileName }: SuccessStateProps) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
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
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Contact Sent!
      </h3>

      <p className="text-gray-600 mb-4">
        Check your email for {profileName}'s contact information.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Open the attached .vcf file to automatically add to your contacts</p>
      </div>
    </div>
  );
}
