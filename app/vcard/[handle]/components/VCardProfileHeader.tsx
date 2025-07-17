"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { ProfileData } from "../types/vcard.types";
import AlertIcon from "./AlertIcon";

interface VCardProfileHeaderProps {
  profile: ProfileData;
  validCoverImageUrl: string | null;
  validAvatarUrl: string | null;
  validCompanyLogoUrl: string | null;
  hideAlert: boolean;
  setHideAlert: (hide: boolean) => void;
  showPulseAnimation: boolean;
  onCoverImageError: () => void;
  onAvatarError: () => void;
  onCompanyLogoError: () => void;
  children?: React.ReactNode;
}

export default function VCardProfileHeader({
  profile,
  validCoverImageUrl,
  validAvatarUrl,
  validCompanyLogoUrl,
  hideAlert,
  setHideAlert,
  showPulseAnimation,
  onCoverImageError,
  onAvatarError,
  onCompanyLogoError,
  children,
}: VCardProfileHeaderProps) {
  const isAlertExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    return new Date() > new Date(expiryDate);
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case "modern-blue":
        return {
          gradient: "from-blue-500 to-blue-600",
          accent: "bg-blue-500 hover:bg-blue-600",
          text: "text-blue-600",
        };
      case "elegant-black":
        return {
          gradient: "from-gray-800 to-gray-900",
          accent: "bg-gray-800 hover:bg-gray-900",
          text: "text-gray-800",
        };
      case "vibrant-red":
        return {
          gradient: "from-red-500 to-red-600",
          accent: "bg-red-500 hover:bg-red-600",
          text: "text-red-600",
        };
      default: // classic-purple
        return {
          gradient: "from-[#7C3AED] to-[#A855F7]",
          accent: "bg-[#7C3AED] hover:bg-[#6D28D9]",
          text: "text-[#7C3AED]",
        };
    }
  };

  const themeColors = getThemeColors(profile.theme);

  return (
    <>
      {/* Cover Image */}
      <div
        className={`h-40 pt-3 bg-gradient-to-r ${themeColors.gradient} relative`}
      >
        {validCoverImageUrl && (
          <Image
            src={validCoverImageUrl}
            alt="Cover"
            fill
            className="object-contain"
            onError={onCoverImageError}
          />
        )}

        {/* Alert Display */}
        {profile.alert &&
          profile.alert.text &&
          !isAlertExpired(profile.alert.expiryDate) &&
          !hideAlert && (
            <div
              className={`mx-auto ${
                showPulseAnimation ? "animate-pulse" : ""
              } p-2 bg-white/50 z-10 relative backdrop-blur-md rounded-xl w-fit`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {profile.alert.icon && (
                  <div className={`flex-shrink-0 text-white`}>
                    <div className="">
                      <AlertIcon iconName={profile.alert.icon} />
                    </div>
                  </div>
                )}
                <div className="font-medium">
                  {profile.alert.type === "link" ? (
                    <a
                      href={
                        profile.alert.linkName?.startsWith("http")
                          ? profile.alert.linkName
                          : `https://${profile.alert.linkName}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white inline-block pb-1 underline"
                    >
                      {profile.alert.text}
                    </a>
                  ) : (
                    <p className="text-sm text-white break-words">
                      {profile.alert.text}
                    </p>
                  )}
                </div>
                <X
                  height={20}
                  width={20}
                  onClick={() => setHideAlert(true)}
                  className="bg-red-50/10 cursor-pointer hover:bg-red-50/20 rounded-full p-1"
                />
              </div>
            </div>
          )}

        <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2">
          <div className="w-48 h-48 bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden">
            {validAvatarUrl ? (
              <Image
                src={validAvatarUrl}
                alt={profile.fullName}
                width={192}
                height={192}
                className="w-full h-full object-contain"
                onError={onAvatarError}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                {profile?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {validCompanyLogoUrl && (
            <div
              className={`absolute -bottom-2 -right-2 w-16 h-16 bg-white p-1 rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center overflow-hidden`}
            >
              <Image
                src={validCompanyLogoUrl}
                alt={profile.company || ""}
                width={64}
                height={64}
                className="w-full h-full object-contain"
                onError={onCompanyLogoError}
              />
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-28 pb-8 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {profile.fullName}
        </h2>
        {profile.title && (
          <p className={`${themeColors.text} text-xl font-medium mb-1.5`}>
            {profile.title}
          </p>
        )}
        {profile.company && (
          <p className="text-gray-600 text-lg mb-6">{profile.company}</p>
        )}

        {/* Note */}
        {profile.note && profile.note.value.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-gray-700">{profile.note.value}</p>
          </div>
        )}

        {/* Save Contact Button and Social Links */}
        {children}
      </div>
    </>
  );
}
