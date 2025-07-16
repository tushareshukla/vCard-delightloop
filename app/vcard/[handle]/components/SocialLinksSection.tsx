"use client";

import { ProfileData } from "../types/vcard.types";
import SocialLinksIcons from "./SocialLinksIcons";
import {
  handleLinkClick,
  getSocialLabel,
  getSocialDescription,
} from "../utils/vcard.utils";

interface SocialLinksSectionProps {
  profile: ProfileData;
}

export default function SocialLinksSection({
  profile,
}: SocialLinksSectionProps) {
  const defaultSections = [
    { type: "LinkedIn", icon: "linkedin" },
    { type: "Email", icon: "email" },
    { type: "WhatsApp", icon: "whatsapp" },
    { type: "Phone", icon: "phone" },
  ];

  // Track which specific links are used in default sections
  const usedLinkIds = new Set();

  return (
    <div className="space-y-3">
      {/* Default Sections */}
      {defaultSections.map((defaultSection, index) => {
        // Check if there's ANY matching link (visible or not) to decide if we should show this default section
        const anyMatchingLink = profile.links?.find(
          (link) =>
            !usedLinkIds.has(link._id) &&
            (link.icon?.toLowerCase() === defaultSection.icon.toLowerCase() ||
              link.type?.toLowerCase() === defaultSection.type.toLowerCase())
        );

        // If there's a matching link but it's not visible (private), don't show this default section at all
        if (anyMatchingLink && !anyMatchingLink.isVisible) {
          return null;
        }

        // Find the visible matching link (for display purposes)
        const matchingLink =
          anyMatchingLink && anyMatchingLink.isVisible ? anyMatchingLink : null;

        // Mark this link as used
        if (matchingLink) {
          usedLinkIds.add(matchingLink._id);
        }

        const hasValue =
          matchingLink &&
          matchingLink.value &&
          matchingLink.value.trim() !== "";

        return (
          <button
            key={index}
            onClick={() => {
              if (hasValue && matchingLink) {
                handleLinkClick(matchingLink);
              } else {
                // Redirect to manage card page
                window.open(`/?vcr=${profile?.key}`, "_blank");
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-500 hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)]"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <SocialLinksIcons
                link={{
                  type: defaultSection.type,
                  icon: defaultSection.icon,
                  value: matchingLink?.value || "",
                  isVisible: true,
                  removedIcon: false,
                }}
              />
            </div>
            <div className="flex-1 text-left">
              <div className="font-normal text-gray-900 text-lg mb-0.5">
                {getSocialLabel(defaultSection.type)}
              </div>
              <div className="text-gray-500 text-sm">
                {hasValue ? (
                  getSocialDescription({
                    type: defaultSection.type,
                    icon: defaultSection.icon,
                  })
                ) : (
                  <div className="flex items-center gap-1 text-purple-600">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>
                      Click to add your {defaultSection.type.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Additional Custom Links */}
      {profile.links &&
        profile.links
          .filter((link) => link.isVisible && !usedLinkIds.has(link._id))
          .map((link, index) => {
            const hasValue = link.value && link.value.trim() !== "";

            return (
              <button
                key={`custom-${index}`}
                onClick={() => {
                  if (hasValue) {
                    handleLinkClick(link);
                  } else {
                    // Redirect to manage card page
                    window.open(`/?vcr=${profile?.key}`, "_blank");
                  }
                }}
                className="w-full flex items-center gap-3 p-3 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-500 hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <SocialLinksIcons link={link} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-normal text-gray-900 text-lg mb-0.5 break-all">
                    {getSocialLabel(link.type)}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {hasValue ? (
                      getSocialDescription(link)
                    ) : (
                      <div className="flex items-center gap-1 text-purple-600">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Click to add your {link.type.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
    </div>
  );
}
