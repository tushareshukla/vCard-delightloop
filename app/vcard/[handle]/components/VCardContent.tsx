"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileData } from "../types/vcard.types";
import { useImageValidation } from "../hooks/useImageValidation";
import { usePulseAnimation } from "../hooks/usePulseAnimation";
import VCardProfileHeader from "./VCardProfileHeader";
import SaveContactButton from "./SaveContactButton";
import SocialLinksSection from "./SocialLinksSection";
import ContactModal from "./ContactModal/ContactModal";

interface VCardContentProps {
  profile: ProfileData;
}

export default function VCardContent({ profile }: VCardContentProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [saveContactClicked, setSaveContactClicked] = useState(false);

  // Custom hooks for managing component state
  const {
    validAvatarUrl,
    validCompanyLogoUrl,
    validCoverImageUrl,
    handleAvatarError,
    handleCompanyLogoError,
    handleCoverImageError,
  } = useImageValidation(
    profile.avatarUrl,
    profile.companyLogoUrl,
    profile.coverImageUrl
  );

  const { showPulseAnimation, hideAlert, setHideAlert } = usePulseAnimation();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r  from-[#ECFCFF] to-[#E8C2FF] ">
        <div className="max-w-md mx-auto  ">
          {/* Profile Card */}
          <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden  pb-10">
            <VCardProfileHeader
              profile={profile}
              validCoverImageUrl={validCoverImageUrl}
              validAvatarUrl={validAvatarUrl}
              validCompanyLogoUrl={validCompanyLogoUrl}
              hideAlert={hideAlert}
              setHideAlert={setHideAlert}
              showPulseAnimation={showPulseAnimation}
              onCoverImageError={handleCoverImageError}
              onAvatarError={handleAvatarError}
              onCompanyLogoError={handleCompanyLogoError}
            >
              <SaveContactButton profile={profile} />
              {/* Social Links */}
              <SocialLinksSection profile={profile} />
            </VCardProfileHeader>
          <Link
            href={`/?vcr=${profile?.key}`}
            className="text-gray-500 px-8 py-3.5 shadow-[0_3px_10px_rgb(0,0,0,0.2)] duration-500  hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-3xl  transition-colors font-medium bg-white flex justify-center w-fit mx-auto  "
          >
            Manage Your Own Card
          </Link>
          </div>

          {/* Manage Card Link */}
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        profile={profile}
        setSaveContactClicked={setSaveContactClicked}
      />
    </>
  );
}
