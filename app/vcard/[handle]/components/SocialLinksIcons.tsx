"use client";

import { ExternalLink, MessageCircle, MapPin } from "lucide-react";
import {
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaPhone,
  FaGlobe,
  FaGithub,
  FaFacebookF,
  FaYoutube,
  FaTwitter,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { ProfileLink } from "../types/vcard.types";

interface SocialLinksIconsProps {
  link: ProfileLink;
}

export default function SocialLinksIcons({ link }: SocialLinksIconsProps) {
  // If removedIcon is true, show default icon
  if (link.removedIcon === true) {
    return (
      <div className="bg-gray-500 rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
        <ExternalLink className="w-6 h-6 text-white" />
      </div>
    );
  }

  // Use iconType if available, otherwise fall back to type
  const iconKey = (link.icon || link.type).toLowerCase();
  
  switch (iconKey) {
    case "linkedin":
      return (
        <div className="bg-[#0077B5] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaLinkedinIn className="w-6 h-6 text-white" />
        </div>
      );
    case "instagram":
      return (
        <div className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaInstagram className="w-6 h-6 text-white" />
        </div>
      );
    case "whatsapp":
      return (
        <div className="bg-[#25D366] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaWhatsapp className="w-6 h-6 text-white" />
        </div>
      );
    case "phone":
      return (
        <div className="bg-[#0088FF] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaPhone className="w-6 h-6 text-white" />
        </div>
      );
    case "email":
      return (
        <div className="bg-[#D44638] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <MdEmail className="w-6 h-6 text-white" />
        </div>
      );
    case "website":
      return (
        <div className="bg-[#0088FF] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaGlobe className="w-6 h-6 text-white" />
        </div>
      );
    case "github":
      return (
        <div className="bg-[#333333] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaGithub className="w-6 h-6 text-white" />
        </div>
      );
    case "facebook":
      return (
        <div className="bg-[#1877F2] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaFacebookF className="w-6 h-6 text-white" />
        </div>
      );
    case "youtube":
      return (
        <div className="bg-[#FF0000] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaYoutube className="w-6 h-6 text-white" />
        </div>
      );
    case "twitter":
      return (
        <div className="bg-[#1DA1F2] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <FaTwitter className="w-6 h-6 text-white" />
        </div>
      );
    case "message":
      return (
        <div className="bg-[#8A3FFC] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
      );
    case "sms":
      return (
        <div className="bg-[#8A3FFC] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
      );
    case "address":
      return (
        <div className="bg-[#8A3FFC] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
      );
    case "book-meeting":
    case "book a meeting":
      return (
        <div className="bg-[#0F766E] rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      );
    default:
      return (
        <div className="bg-gray-500 rounded-lg p-1.5 w-10 h-10 flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-white" />
        </div>
      );
  }
} 