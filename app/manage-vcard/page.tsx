"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CustomCalendar from "@/components/ui/calendar";
import {
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Bell,
  Zap,
  MessageCircle,
  Star,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Calendar,
  HelpCircle,
  Pencil,
  User,
  AtSign,
  Briefcase,
  Building2,
} from "lucide-react";
import PageHeader from "@/components/layouts/PageHeader";
import { config } from "@/utils/config";
import Cookies from "js-cookie";

// User interface (without publicProfileCard)
interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  state?: string;
  country?: string;
  role: string;
  roles: string[];
  organization_id: string;
  isActive: boolean;
  isDeleted: boolean;
  emailVerified: boolean;
  unipile?: {
    add_email_link: string;
    add_email_link_error: string;
    account_id: string;
  };
  password?: string;
}

// Add VCard Alert interface
interface IVCardAlert {
  text: string;
  type: "text" | "link";
  linkName?: string;
  icon?: string; // Icon name or URL
  expiryDate?: Date; // Optional expiry date
}

// Separate VCard interface
interface VCard {
  _id?: string;
  userId: string;
  handle: string;
  key?: string;
  secret?: string;
  fullName?: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme: string;
  links: Array<{
    type: string;
    value: string;
    icon?: string;
    removedIcon?: boolean;
    isVisible: boolean;
    lastUpdated: Date;
  }>;
  note: {
    value: string;
    isVisible: boolean;
    lastUpdated: Date;
  };
  alert?: IVCardAlert; // Add alert property
  nfcEnabled: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedAt: Date;
}

// Add organization interface
interface Organization {
  _id: string;
  name: string;
  domain: string;
  branding: {
    logo_url: string;
  };
  status: string;
  isDeleted: boolean;
}

// Helper functions for mobile preview (matching NFC page functionality)
const getThemeColors = (theme: string) => {
  switch (theme) {
    case "modern-blue":
      return {
        gradient: "from-blue-500 to-blue-600",
        accent: "bg-blue-500 hover:bg-blue-600",
        text: "text-blue-600",
        linkBg: "bg-blue-50",
      };
    case "elegant-black":
      return {
        gradient: "from-gray-800 to-gray-900",
        accent: "bg-gray-800 hover:bg-gray-900",
        text: "text-gray-800",
        linkBg: "bg-gray-50",
      };
    case "vibrant-red":
      return {
        gradient: "from-red-500 to-red-600",
        accent: "bg-red-500 hover:bg-red-600",
        text: "text-red-600",
        linkBg: "bg-red-50",
      };
    default: // classic-purple
      return {
        gradient: "from-[#7C3AED] to-[#A855F7]",
        accent: "bg-[#7C3AED] hover:bg-[#6D28D9]",
        text: "text-[#7C3AED]",
        linkBg: "bg-purple-50",
      };
  }
};
const RESERVED_HANDLES = [
  "wallet",
  "vcard",
  "referral",
  "profile",
  "manage-vcard",
  "auth",
  "api",
  "context",
  "components",
  "clientinterceptor",
  "login",
  "logout",
];

const getSocialIcon = (link: {
  type: string;
  icon?: string;
  removedIcon?: boolean;
}) => {
  // If removedIcon is true, always show generic link icon
  if (link.removedIcon) {
    return (
      <svg
        className="w-5 h-5 text-gray-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    );
  }

  // Use icon if available, otherwise fall back to type
  const iconKey = (link.icon || link.type).toLowerCase();
  switch (iconKey) {
    case "linkedin":
      return (
        <svg
          className="w-4 h-4 text-blue-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          className="w-4 h-4 text-pink-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg
          className="w-4 h-4 text-green-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
        </svg>
      );
    case "phone":
      return (
        <svg
          className="w-4 h-4 text-blue-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      );
    case "sms":
      return (
        <svg
          className="w-4 h-4 text-green-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      );
    case "email":
      return (
        <svg
          className="w-4 h-4 text-blue-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      );
    case "website":
      return (
        <svg
          className="w-4 h-4 text-blue-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z" />
        </svg>
      );
    case "github":
      return (
        <svg
          className="w-4 h-4 text-gray-800"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          className="w-4 h-4 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          className="w-4 h-4 text-red-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
        </svg>
      );
    case "twitter":
      return (
        <svg
          className="w-4 h-4 text-blue-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-4 h-4 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      );
  }
};

const getSocialLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case "linkedin":
      return "LinkedIn";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
    case "phone":
      return "Phone";
    case "sms":
      return "SMS";
    case "email":
      return "Email";
    case "website":
      return "Website";
    case "github":
      return "GitHub";
    case "facebook":
      return "Facebook";
    case "youtube":
      return "YouTube";
    case "twitter":
      return "Twitter";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const getSocialDescription = (link: { type: string; icon?: string }) => {
  // Use icon if available, otherwise fall back to type
  const actionType = (link.icon || link.type).toLowerCase();
  switch (actionType) {
    case "linkedin":
      return "Connect professionally";
    case "instagram":
      return "Follow my updates";
    case "whatsapp":
      return "Chat with me";
    case "phone":
      return "Call me";
    case "sms":
      return "Send me a text";
    case "email":
      return "Send me an email";
    case "website":
      return "Visit my website";
    case "github":
      return "View my code";
    case "facebook":
      return "Connect on Facebook";
    case "youtube":
      return "Watch my content";
    case "twitter":
      return "Follow my tweets";
    default:
      return `Connect via ${link.type}`;
  }
};

// Add this after the imports
const SOCIAL_MEDIA_OPTIONS = [
  {
    type: "LinkedIn",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    type: "Twitter",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
      </svg>
    ),
  },
  {
    type: "Instagram",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
      </svg>
    ),
  },
  {
    type: "Facebook",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    ),
  },
  {
    type: "GitHub",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    type: "YouTube",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
      </svg>
    ),
  },
  {
    type: "Website",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    type: "WhatsApp",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
      </svg>
    ),
  },
  {
    type: "Phone",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    ),
  },
  {
    type: "SMS",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
      </svg>
    ),
  },
  {
    type: "Email",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
];

export default function ManageVCard() {
  const router = useRouter();
  const {
    authToken,
    userId,
    userEmail,
    organizationId: orgId,
    isLoadingCookies,
  } = useAuth();
  const organizationId =
    orgId === "000000000000000000000000" ? "000000000000000000000001" : orgId;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vCard, setVCard] = useState<VCard | null>(null);
  const [hasVCard, setHasVCard] = useState<boolean>(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add these states for the toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Add state for links
  const [newLink, setNewLink] = useState({
    type: "",
    value: "",
    isVisible: true,
    icon: "", // Track original social media type for icon
    removedIcon: false, // Track if user wants to hide platform icon
  });
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [isCustomLinkType, setIsCustomLinkType] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);

  // Add states for image uploads
  const [imageUploads, setImageUploads] = useState({
    profilePhoto: { uploading: false, error: null as string | null },
    companyLogo: { uploading: false, error: null as string | null },
    coverImage: { uploading: false, error: null as string | null },
  });

  // Add states for photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<
    "profilePhoto" | "companyLogo" | "coverImage" | null
  >(null);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
    mobile?: string;
    handle?: string;
    fullName?: string;
    title?: string;
    company?: string;
    companyLogoUrl?: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    orgName?: string;
    orgDomain?: string;
    orgLogoUrl?: string;
    linkValue?: string;
  }>({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleCheckTimeout, setHandleCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Add this state at the top of the component with other states
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  // Alert section state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState<IVCardAlert>({
    text: "",
    type: "text",
    linkName: "",
    icon: "",
    expiryDate: undefined,
  });
  const [showAlert, setShowAlert] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertValidationErrors, setAlertValidationErrors] = useState<{
    text?: string;
    linkName?: string;
    expiryDate?: string;
  }>({});

  const [userHandleName, setUserHandleName] = useState("");
  const [hideSaveButton, setHideSaveButton] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [originalVCard, setOriginalVCard] = useState<VCard | null>(null);

  // Edit mode functions
  const enterEditMode = () => {
    // Store current vCard state as original before editing
    setOriginalVCard(vCard ? { ...vCard } : null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    // Clear any pending handle check timeout
    if (handleCheckTimeout) {
      clearTimeout(handleCheckTimeout);
      setHandleCheckTimeout(null);
    }
    // Stop any checking state
    setIsCheckingHandle(false);
    // Restore original values
    if (originalVCard) {
      setVCard(originalVCard);
    }
    // Clear validation errors
    setValidationErrors({});
    // Exit edit mode
    setEditMode(false);
    setOriginalVCard(null);
  };

  // Alert section functions
  const openAlertModal = () => {
    if (vCard?.alert) {
      setAlertData(vCard.alert);
    } else {
      setAlertData({
        text: "",
        type: "text",
        linkName: "",
        icon: "",
        expiryDate: undefined,
      });
    }
    setAlertValidationErrors({});
    setShowAlertModal(true);
  };

  const handleAlertChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const newData = {
      ...alertData,
      [name]: value,
    };

    setAlertData(newData);

    const errors = { ...alertValidationErrors };
    if (name === "text") {
      errors.text = validateAlertText(value, newData.type);
    } else if (name === "type") {
      errors.text = validateAlertText(newData.text, value);
    }

    setAlertValidationErrors(errors);
  };

  const handleAlertDateChange = (date: Date | null) => {
    let dateWithTime = date;
    if (date) {
      dateWithTime = new Date(date);
      dateWithTime.setHours(12, 0, 0, 0);
    }

    setAlertData((prev) => ({
      ...prev,
      expiryDate: dateWithTime || undefined,
    }));

    const errors = { ...alertValidationErrors };
    errors.expiryDate = validateExpiryDate(dateWithTime || undefined);
    setAlertValidationErrors(errors);
  };

  const saveAlert = () => {
    if (!vCard) return;

    if (!validateAlertForm()) {
      return;
    }

    setVCard((prev) => ({
      ...prev!,
      alert: alertData.text ? alertData : undefined,
    }));
    setShowAlertModal(false);
    setAlertValidationErrors({});
  };

  const removeAlert = () => {
    if (!vCard) return;

    setVCard((prev) => ({
      ...prev!,
      alert: undefined,
    }));
    setShowAlert(false);
  };

  const isAlertExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    return new Date() > new Date(expiryDate);
  };

  const validateAlertText = (text: string, type: string) => {
    if (!text.trim()) {
      return "This field is required";
    }

    if (text.length > 40) {
      return "Text must be 40 characters or less";
    }

    return undefined;
  };

  const validateExpiryDate = (expiryDate?: Date) => {
    if (expiryDate) {
      const now = new Date();
      if (expiryDate <= now) {
        return "Expiry date must be in the future";
      }
    }
    return undefined;
  };

  const validateAlertForm = () => {
    const errors: typeof alertValidationErrors = {};

    errors.text = validateAlertText(alertData.text, alertData.type);
    // errors.linkName = validateLinkName(
    //   alertData.linkName || "",
    //   alertData.type
    // );
    errors.expiryDate = validateExpiryDate(alertData.expiryDate);

    setAlertValidationErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const getAlertIcon = (iconName?: string) => {
    if (!iconName) return null;

    const iconMap: Record<string, JSX.Element> = {
      megaphone: <Megaphone className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />,
      success: <CheckCircle className="w-4 h-4" />,
      bell: <Bell className="w-4 h-4" />,
      zap: <Zap className="w-4 h-4" />,
      message: <MessageCircle className="w-4 h-4" />,
      star: <Star className="w-4 h-4" />,
      link: <LinkIcon className="w-4 h-4" />,
    };

    return iconMap[iconName.toLowerCase()] || iconMap.megaphone;
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Image upload functions
  const uploadImage = async (
    file: File,
    imageType: "profilePhoto" | "companyLogo" | "coverImage"
  ) => {
    const folderMap = {
      profilePhoto: "vcard/profile_photo",
      companyLogo: "vcard/company_logo",
      coverImage: "vcard/cover_image",
    };

    const fieldMap = {
      profilePhoto: "avatarUrl",
      companyLogo: "companyLogoUrl",
      coverImage: "coverImageUrl",
    } as const;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setImageUploads((prev) => ({
        ...prev,
        [imageType]: {
          uploading: false,
          error: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
        },
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageUploads((prev) => ({
        ...prev,
        [imageType]: {
          uploading: false,
          error: "File size must be less than 10MB",
        },
      }));
      return;
    }

    try {
      setImageUploads((prev) => ({
        ...prev,
        [imageType]: { uploading: true, error: null },
      }));

      const formData = new FormData();
      formData.append("file", file);

      const folder = folderMap[imageType];
      const entityId = userProfile?._id || userId;

      const response = await fetch(
        `${
          config.BACKEND_URL
        }/v1/public/upload/image?folder=${encodeURIComponent(folder)}${
          entityId ? `&entityId=${entityId}` : ""
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_message || "Failed to upload image");
      }

      const result = await response.json();

      if (result.success && result.imageUrl) {
        // Update vCard with the new image URL
        if (!userProfile) return;

        const currentVCard = vCard || {
          userId: userProfile._id,
          handle: "",
          fullName: "",
          title: "",
          company: "",
          companyLogoUrl: "",
          avatarUrl: "",
          coverImageUrl: "",
          theme: "classic-purple",
          links: [],
          note: {
            value: "",
            isVisible: true,
            lastUpdated: new Date(),
          },
          nfcEnabled: true,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUpdatedAt: new Date(),
        };

        setVCard({
          ...currentVCard,
          [fieldMap[imageType]]: result.imageUrl,
          lastUpdatedAt: new Date(),
        });

        setImageUploads((prev) => ({
          ...prev,
          [imageType]: { uploading: false, error: null },
        }));

        showNotification(
          `${
            imageType === "profilePhoto"
              ? "Profile photo"
              : imageType === "companyLogo"
              ? "Company logo"
              : "Cover image"
          } uploaded successfully!`,
          "success"
        );

        // Keep modal open to show the uploaded image
        // Modal will stay open so user can see the result
      } else {
        throw new Error("Upload failed - no image URL returned");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setImageUploads((prev) => ({
        ...prev,
        [imageType]: {
          uploading: false,
          error: error instanceof Error ? error.message : "Upload failed",
        },
      }));
      showNotification(
        `Failed to upload ${
          imageType === "profilePhoto"
            ? "profile photo"
            : imageType === "companyLogo"
            ? "company logo"
            : "cover image"
        }`,
        "error"
      );
    }
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "profilePhoto" | "companyLogo" | "coverImage"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file, imageType);
    }
  };

  // Open photo modal
  const openPhotoModal = (
    photoType: "profilePhoto" | "companyLogo" | "coverImage"
  ) => {
    setCurrentPhotoType(photoType);
    setShowPhotoModal(true);
  };

  // Close photo modal
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setCurrentPhotoType(null);
  };

  // Delete photo
  const deletePhoto = (
    photoType: "profilePhoto" | "companyLogo" | "coverImage"
  ) => {
    if (!userProfile || !vCard) return;

    const fieldMap = {
      profilePhoto: "avatarUrl",
      companyLogo: "companyLogoUrl",
      coverImage: "coverImageUrl",
    } as const;

    setVCard({
      ...vCard,
      [fieldMap[photoType]]: "",
      lastUpdatedAt: new Date(),
    });

    showNotification(
      `${
        photoType === "profilePhoto"
          ? "Profile photo"
          : photoType === "companyLogo"
          ? "Company logo"
          : "Cover image"
      } deleted successfully!`,
      "success"
    );
    closePhotoModal();
  };

  // Utility functions for validation
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidHandle = (handle: string) => {
    if (!handle.trim()) return true;
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    return (
      handleRegex.test(handle) && handle.length >= 3 && handle.length <= 30
    );
  };

  const isValidPhone = (phone: string) => {
    if (!phone.trim()) return true;
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) return false;
    if (digitsOnly.length > 15) return false;
    return /^[\+]?[\d\s\-\(\)\.]+$/.test(phone);
  };

  const isValidName = (name: string) => {
    if (!name.trim()) return false;
    const nameRegex = /^[a-zA-Z\s\'\-\.]+$/;
    return (
      nameRegex.test(name) &&
      name.trim().length >= 2 &&
      name.trim().length <= 50
    );
  };

  const isValidTitle = (title: string) => {
    if (!title.trim()) return true;
    const titleRegex = /^[a-zA-Z0-9\s\&\-\(\)\,\.\/]+$/;
    return titleRegex.test(title) && title.trim().length <= 100;
  };

  const isValidCompanyName = (company: string) => {
    if (!company.trim()) return true;
    const companyRegex = /^[a-zA-Z0-9\s\&\-\(\)\,\.\'\!]+$/;
    return companyRegex.test(company) && company.trim().length <= 100;
  };

  const checkHandleUniqueness = async (handle: string) => {
    if (RESERVED_HANDLES.includes(handle.toLowerCase())) {
      return;
    }

    if (!handle.trim() || !isValidHandle(handle)) {
      return;
    }

    if (handle === userHandleName) {
      return;
    }

    try {
      setIsCheckingHandle(true);
      setIsSaveDisabled(true);

      const validateResponse = await fetch(
        `${config.BACKEND_URL}/v1/vcard/validate-handle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            handle: handle,
            excludeId: vCard?._id,
          }),
        }
      );

      if (validateResponse.ok) {
        const validateData = await validateResponse.json();
        if (validateData.success) {
          if (validateData.available) {
            setHideSaveButton(false);
            setIsSaveDisabled(false);
            setValidationErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.handle;
              return newErrors;
            });
          } else {
            setValidationErrors((prev) => ({
              ...prev,
              handle: "This handle is already taken by another user",
            }));
            setHideSaveButton(true);
          }
        }
      } else {
        console.error("Error validating handle:", validateResponse.status);
      }
    } catch (error) {
      console.error("Error checking handle uniqueness:", error);
    } finally {
      setIsCheckingHandle(false);
      setIsSaveDisabled(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors: any = {};

    // Handle is required
    if (!vCard?.handle || !vCard.handle.trim()) {
      errors.handle = "Handle is required";
    } else if (!isValidHandle(vCard.handle)) {
      errors.handle =
        "Handle must be 3-30 characters, alphanumeric with ._- only";
    }

    // Full name is required
    if (!vCard?.fullName || !vCard.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (!isValidName(vCard.fullName)) {
      errors.fullName =
        "Full name must contain only letters and be 2-50 characters";
    }

    if (vCard?.title && !isValidTitle(vCard.title)) {
      errors.title = "Title contains invalid characters or is too long";
    }

    if (vCard?.company && !isValidCompanyName(vCard.company)) {
      errors.company =
        "Company name contains invalid characters or is too long";
    }

    // Image URL validation removed as they are now handled by file uploads

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Handle V-Card data changes
  const handleVCardChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!userProfile) return;

    // Convert only handle to lowercase, keep other fields as is
    const processedValue = name === "handle" ? value.toLowerCase() : value;

    const currentVCard = vCard || {
      userId: userProfile._id,
      handle: "",
      fullName: "",
      title: "",
      company: "",
      companyLogoUrl: "",
      avatarUrl: "",
      coverImageUrl: "",
      theme: "classic-purple",
      links: [],
      note: {
        value: "",
        isVisible: true,
        lastUpdated: new Date(),
      },
      nfcEnabled: true,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    setVCard({
      ...currentVCard,
      [name]: processedValue,
      lastUpdatedAt: new Date(),
    });

    // Real-time frontend validation
    if (name === "handle") {
      const errors = { ...validationErrors };

      // Clear any existing handle error first
      delete errors.handle;

      // Frontend validation for handle
      if (!processedValue.trim()) {
        errors.handle = "Handle is required";
      } else if (processedValue.length < 3) {
        errors.handle = "Handle must be at least 3 characters long";
      } else if (RESERVED_HANDLES.includes(processedValue)) {
        errors.handle = "This handle name is reserved and cannot be used";
      } else if (processedValue.length > 30) {
        errors.handle = "Handle cannot be longer than 30 characters";
      } else if (!isValidHandle(processedValue)) {
        errors.handle =
          "Handle can only contain letters, numbers, dots, underscores, and hyphens";
      }

      setValidationErrors(errors);

      // Only check uniqueness if frontend validation passes AND handle is at least 3 characters
      if (!errors.handle && processedValue.trim().length >= 3) {
        if (handleCheckTimeout) {
          clearTimeout(handleCheckTimeout);
        }

        const newTimeout = setTimeout(() => {
          checkHandleUniqueness(processedValue);
        }, 800);

        setHandleCheckTimeout(newTimeout);
      }
    } else if (name === "fullName") {
      const errors = { ...validationErrors };
      delete errors.fullName;

      if (!processedValue.trim()) {
        errors.fullName = "Full name is required";
      } else if (!isValidName(processedValue)) {
        errors.fullName =
          "Full name must contain only letters and be 2-50 characters";
      }

      setValidationErrors(errors);
    } else {
      // Clear validation errors for other fields when user starts typing
      if (validationErrors[name as keyof typeof validationErrors]) {
        setValidationErrors({
          ...validationErrors,
          [name]: undefined,
        });
      }
    }
  };

  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!userProfile) return;

    const currentVCard = vCard || {
      userId: userProfile._id,
      handle: "",
      fullName: "",
      title: "",
      company: "",
      companyLogoUrl: "",
      avatarUrl: "",
      coverImageUrl: "",
      theme: "classic-purple",
      links: [],
      note: {
        value: "",
        isVisible: true,
        lastUpdated: new Date(),
      },
      nfcEnabled: true,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    setVCard({
      ...currentVCard,
      theme: e.target.value,
      lastUpdatedAt: new Date(),
    });
  };

  // Handle note changes
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!userProfile || !vCard) return;

    setVCard({
      ...vCard,
      note: {
        ...vCard.note,
        value: e.target.value,
        lastUpdated: new Date(),
      },
      lastUpdatedAt: new Date(),
    });
  };

  // Handle link visibility toggle
  const toggleLinkVisibility = (index: number) => {
    if (!vCard?.links) return;

    const updatedLinks = [...vCard.links];
    updatedLinks[index] = {
      ...updatedLinks[index],
      isVisible: !updatedLinks[index].isVisible,
      lastUpdated: new Date(),
    };

    setVCard({
      ...vCard,
      links: updatedLinks,
      lastUpdatedAt: new Date(),
    });
  };

  // Add new link or update existing link
  const addLink = () => {
    if (!userProfile || !vCard) {
      return;
    }

    // Validate link name/type
    if (!newLink.type || !newLink.type.trim()) {
      setValidationErrors({
        ...validationErrors,
        linkValue: "Link title is required",
      });
      return;
    }

    if (newLink.type.trim().length > 30) {
      setValidationErrors({
        ...validationErrors,
        linkValue: "Link title cannot exceed 30 characters",
      });
      return;
    }

    // Validate link value
    if (!newLink.value) {
      const fieldName =
        newLink.icon === "WhatsApp" ||
        newLink.icon === "Phone" ||
        newLink.icon === "SMS"
          ? "phone number"
          : "URL";
      setValidationErrors({
        ...validationErrors,
        linkValue: `${fieldName} is required`,
      });
      return;
    }

    // Validate based on icon type (always use icon field for validation)
    if (
      newLink.icon === "WhatsApp" ||
      newLink.icon === "Phone" ||
      newLink.icon === "SMS"
    ) {
      if (!isValidPhone(newLink.value)) {
        const digitsOnly = newLink.value.replace(/\D/g, "");
        let errorMessage = "Please enter a valid phone number";

        if (digitsOnly.length < 10) {
          errorMessage = "Phone number must have at least 10 digits";
        } else if (digitsOnly.length > 15) {
          errorMessage = "Phone number cannot exceed 15 digits";
        } else if (!/^[\+]?[\d\s\-\(\)\.]+$/.test(newLink.value)) {
          errorMessage = "Phone number contains invalid characters";
        } else if (/[\-\s\(\)\.]{2,}/.test(newLink.value)) {
          errorMessage = "Phone number has invalid formatting";
        }

        setValidationErrors({
          ...validationErrors,
          linkValue: errorMessage,
        });
        return;
      }
    } else if (newLink.icon === "Email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newLink.value)) {
        setValidationErrors({
          ...validationErrors,
          linkValue: "Please enter a valid email address",
        });
        return;
      }
    } else {
      if (!isValidUrl(newLink.value)) {
        setValidationErrors({
          ...validationErrors,
          linkValue: "Please enter a valid URL",
        });
        return;
      }
    }

    let updatedLinks;

    if (editingLinkIndex !== null) {
      updatedLinks = [...(vCard.links || [])];
      updatedLinks[editingLinkIndex] = {
        type: newLink.type,
        value: newLink.value,
        isVisible: newLink.isVisible,
        icon: newLink.icon,
        removedIcon: newLink.removedIcon,
        lastUpdated: new Date(),
      };
    } else {
      updatedLinks = [
        ...(vCard.links || []),
        {
          type: newLink.type,
          value: newLink.value,
          isVisible: newLink.isVisible,
          icon: newLink.icon,
          removedIcon: newLink.removedIcon,
          lastUpdated: new Date(),
        },
      ];
    }

    setVCard({
      ...vCard,
      links: updatedLinks,
      lastUpdatedAt: new Date(),
    });
    setNewLink({
      type: "",
      value: "",
      isVisible: true,
      icon: "",
      removedIcon: false,
    });
    setIsCustomLinkType(false);
    setEditingLinkIndex(null);
    setValidationErrors({ ...validationErrors, linkValue: undefined });
    setShowAddLinkModal(false);
  };

  // Remove link
  const removeLink = (index: number) => {
    if (!vCard?.links) return;

    const updatedLinks = vCard.links.filter((_, i) => i !== index);

    setVCard({
      ...vCard,
      links: updatedLinks,
      lastUpdatedAt: new Date(),
    });
  };

  // Open edit link modal (reuse add modal)
  const openEditLinkModal = (index: number) => {
    if (!vCard?.links) return;

    const linkToEdit = vCard.links[index];
    setEditingLinkIndex(index);

    // Check if the link type matches any predefined social media option
    const matchingSocialOption = SOCIAL_MEDIA_OPTIONS.find(
      (option) =>
        option.type === linkToEdit.icon || option.type === linkToEdit.type
    );

    if (matchingSocialOption) {
      // It's a predefined social media type
      setNewLink({
        type: linkToEdit.type,
        value: linkToEdit.value,
        isVisible: linkToEdit.isVisible,
        icon: matchingSocialOption.type, // Use the matching option type
        removedIcon: linkToEdit.removedIcon || false,
      });
      setIsCustomLinkType(false);
    } else {
      // It's a custom link type
      setNewLink({
        type: linkToEdit.type,
        value: linkToEdit.value,
        isVisible: linkToEdit.isVisible,
        icon: linkToEdit.icon || "",
        removedIcon: linkToEdit.removedIcon || false,
      });
      setIsCustomLinkType(true);
    }

    setShowAddLinkModal(true);
  };

  // Save profile changes
  const handleSave = async () => {
    if (isSaveDisabled || isCheckingHandle || validationErrors.handle) {
      return;
    }
    if (vCard?.handle && RESERVED_HANDLES.includes(vCard?.handle.toLowerCase())) {
      showNotification("This handle is reserved and cannot be used", "error");
      setValidationErrors((prev) => ({
        ...prev,
        handle: "This handle is reserved and cannot be used",
      }));
      return;
    }
    // Check if any image is uploading
    const isAnyImageUploading = Object.values(imageUploads).some(
      (upload) => upload.uploading
    );
    if (isAnyImageUploading) {
      showNotification("Please wait for images to finish uploading", "error");
      return;
    }

    if (!userProfile || !organization) return;

    if (!validateForm()) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSaving(true);

    try {
      const userId = userProfile._id;
      const orgId = organization._id;

      // Handle VCard creation or update
      if (vCard && vCard.handle) {
        let vCardResponse;

        try {
          const checkResponse = await fetch(
            `${config.BACKEND_URL}/v1/organizations/${orgId}/users/${userId}/vcard`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          // Handle unauthorized/token expired
          if (checkResponse.status === 401) {
            // Clear cookies
            Cookies.remove("auth_token");
            Cookies.remove("user_id");
            Cookies.remove("organization_id");
            Cookies.remove("user_email");

            // Redirect to login with session expired flag
            router.push("/");
            return;
          }

          if (checkResponse.ok) {
            vCardResponse = await fetch(
              `${config.BACKEND_URL}/v1/organizations/${orgId}/users/${userId}/vcard`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(vCard),
              }
            );
          } else if (checkResponse.status === 404) {
            vCardResponse = await fetch(`${config.BACKEND_URL}/v1/vcard`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                ...vCard,
                userId: userId,
                organizationId: orgId,
              }),
            });
          } else {
            throw new Error(
              `Error checking VCard existence: ${checkResponse.status}`
            );
          }

          if (!vCardResponse.ok) {
            const errorData = await vCardResponse.json();

            // Handle duplicate handle error specifically
            if (errorData.error_code === "ERR_DUPLICATE_HANDLE") {
              showNotification(
                "This handle is already taken. Please choose a different handle.",
                "error"
              );
              return;
            }

            throw new Error(
              `Error saving VCard: ${
                errorData.error_message || vCardResponse.status
              }`
            );
          }

          // Handle unauthorized/token expired
          if (vCardResponse.status === 401) {
            // Clear cookies
            Cookies.remove("auth_token");
            Cookies.remove("user_id");
            Cookies.remove("organization_id");
            Cookies.remove("user_email");

            // Redirect to login with session expired flag
            router.push("/");
            return;
          }

          const vCardResult = await vCardResponse.json();

          if (vCardResult.success) {
            setVCard(vCardResult.data);
            setHasVCard(true);
            showNotification("VCard saved successfully!", "success");
          }
          setEditMode(false);
          setOriginalVCard(null); // Clear stored original since we've saved
        } catch (error) {
          console.error("Error in VCard save operation:", error);
          throw error;
        }
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      showNotification("Failed to save changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch user and VCard data
  useEffect(() => {
    if (!isLoadingCookies) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          if (!authToken) {
            router.push("/");
            return;
          }

          if (!userId || !organizationId) {
            throw new Error("User ID or Organization ID not found in cookies.");
          }

          // Fetch user data
          const userResponse = await fetch(
            `${config.BACKEND_URL}/v1/organizations/${organizationId}/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          // Handle unauthorized/token expired
          if (userResponse.status === 401) {
            // Clear cookies
            Cookies.remove("auth_token");
            Cookies.remove("user_id");
            Cookies.remove("organization_id");
            Cookies.remove("user_email");

            // Redirect to login with session expired flag
            router.push("/");
            return;
          }

          if (!userResponse.ok) {
            throw new Error(`Error fetching user data: ${userResponse.status}`);
          }

          const userData = await userResponse.json();

          // Fetch organization data
          const orgResponse = await fetch(
            `${config.BACKEND_URL}/v1/organizations/${organizationId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          // Handle unauthorized for org fetch
          if (orgResponse.status === 401) {
            // Clear cookies
            Cookies.remove("auth_token");
            Cookies.remove("user_id");
            Cookies.remove("organization_id");
            Cookies.remove("user_email");

            // Redirect to login with session expired flag
            router.push("/");
            return;
          }

          if (!orgResponse.ok) {
            throw new Error(
              `Error fetching organization data: ${orgResponse.status}`
            );
          }

          const orgData = await orgResponse.json();

          setUserProfile(userData);
          setOrganization(orgData);

          // Fetch VCard data separately
          try {
            const vCardResponse = await fetch(
              `${config.BACKEND_URL}/v1/organizations/${organizationId}/users/${userId}/vcard`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            // Handle unauthorized for vCard fetch
            if (vCardResponse.status === 401) {
              // Clear cookies
              Cookies.remove("auth_token");
              Cookies.remove("user_id");
              Cookies.remove("organization_id");
              Cookies.remove("user_email");

              // Redirect to login with session expired flag
              router.push("/");
              return;
            }

            if (vCardResponse.ok) {
              const vCardData = await vCardResponse.json();
              if (vCardData.success) {
                setVCard(vCardData.data);
                setHasVCard(true);
                setUserHandleName(vCardData.data.handle);
              }
            } else if (vCardResponse.status === 404) {
              setHasVCard(false);
              setVCard(null);
            } else {
              console.warn("Error fetching VCard:", vCardResponse.status);
            }
          } catch (vCardError) {
            console.warn("Error fetching VCard:", vCardError);
            // Check if vCard error is due to unauthorized
            if (vCardError.response?.status === 401) {
              // Clear cookies
              Cookies.remove("auth_token");
              Cookies.remove("user_id");
              Cookies.remove("organization_id");
              Cookies.remove("user_email");

              // Redirect to login with session expired flag
              router.push("/");
              return;
            }
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          // Check if error is due to unauthorized
          if (err.response?.status === 401) {
            // Clear cookies
            Cookies.remove("auth_token");
            Cookies.remove("user_id");
            Cookies.remove("organization_id");
            Cookies.remove("user_email");

            // Redirect to login with session expired flag
            router.push("/");
            return;
          }
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load profile data. Please try again."
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [isLoadingCookies]);

  return (
    <div className="flex h-screen flex-col sm:flex-row ">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden pb-6 sm:pb-0 ">
        {isLoading ? (
          <div className="min-h-[100vh]  sm:rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8">
            {/* PageHeader Skeleton */}
            <div className="flex flex-col gap-6  w-full pt-2">
              <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-48 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-80 bg-gray-200 rounded"></div>
                </div>
                <div className=" items-center gap-3 hidden sm:flex">
                  <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-full mb-6 "></div>
            </div>

            {/* VCard Content Skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Mobile Preview Skeleton */}
                <div className=" mx-auto  w-full lg:mx-0">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-4 mx-auto"></div>
                  {/* Phone Frame */}
                  <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] h-[500px] sm:h-[550px] bg-black rounded-[2.5rem] p-2">
                    <div className="w-full h-full bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] rounded-[2rem] overflow-hidden">
                      <div className="max-w-md mx-auto h-full">
                        <div className="bg-white h-full shadow-lg overflow-y-scroll scrollbar-hide">
                          {/* Cover Area */}
                          <div className="h-24 bg-gray-200 rounded mb-6"></div>

                          {/* Profile Info */}
                          <div className="pt-8 pb-4 px-3 text-center">
                            <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-1"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded mx-auto mb-0.5"></div>
                            <div className="h-3 w-28 bg-gray-200 rounded mx-auto mb-2"></div>

                            {/* Save Contact Button */}
                            <div className="h-10 w-full bg-gray-200 rounded-full mb-4"></div>

                            {/* Links */}
                            <div className="space-y-2 p-1">
                              {[1, 2, 3].map((item) => (
                                <div
                                  key={item}
                                  className="h-12 w-full bg-gray-200 rounded-lg"
                                ></div>
                              ))}
                              <div className="h-8 w-32 bg-gray-200 rounded-2xl mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : error || !userProfile || !organization ? (
          <div className="min-h-screen bg-primary-xlight p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
            <p className="text-red-500 text-center p-4 text-sm sm:text-base">
              {error || "Unable to load VCard data"}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto h-full sm:rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* //! ----- Header -------  */}
            <PageHeader
              title="Manage VCard"
              description="Create and customize your digital business card"
              //   primaryButton={
              //     !hideSaveButton
              //       ? {
              //           text: isSaving
              //             ? "Saving..."
              //             : isCheckingHandle
              //             ? "Checking..."
              //             : Object.values(imageUploads).some(
              //                 (upload) => upload.uploading
              //               )
              //             ? "Uploading..."
              //             : editMode
              //             ? "Save Changes"
              //             : "Edit",
              //           onClick:
              //             isSaving ||
              //             isSaveDisabled ||
              //             isCheckingHandle ||
              //             hideSaveButton ||
              //             Object.values(imageUploads).some(
              //               (upload) => upload.uploading
              //             )
              //               ? undefined
              //               : editMode
              //               ? handleSave
              //               : enterEditMode,
              //           variant: "primary",
              //           className: `${
              //             isSaving ||
              //             isSaveDisabled ||
              //             isCheckingHandle ||
              //             hideSaveButton ||
              //             Object.values(imageUploads).some(
              //               (upload) => upload.uploading
              //             )
              //               ? "opacity-50 cursor-not-allowed"
              //               : ""
              //           } hidden sm:block`,
              //         }
              //       : undefined
              //   }
              //   secondaryButton={
              //     editMode
              //       ? {
              //           text: "Cancel",
              //           className: "hidden sm:block",
              //           onClick: cancelEdit,
              //           variant: "secondary",
              //         }
              //       : undefined
              //   }
              showDivider={true}
              className="pt-2  "
            />

            {/* //! ----- Content -------  */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* <div className="flex-1 lg:w-[60%]">
                  <div className="flex items-center justify-between mb-4 w-full">
                    <h4 className="text-base font-medium text-gray-800 flex  w-full items-center justify-between md:gap-2">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Public Vcard
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/vcard/${vCard?.handle}`}
                          className="text-xs underline ml-3 text-gray-500 hover:text-gray-700"
                        >
                          View Your Vcard
                        </Link>
                        <button
                          className="text-xs underline ml-3 text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${process.env.NEXT_PUBLIC_APP_URL}/vcard/${vCard?.handle}`
                            );
                            showNotification(
                              "Link copied to clipboard!",
                              "success"
                            );
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <div>
                          <div className="relative">
                            <input
                              type="text"
                              name="handle"
                              value={vCard?.handle || ""}
                              onChange={handleVCardChange}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                                validationErrors.handle
                                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                  : isCheckingHandle
                                  ? "border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500"
                                  : "border-gray-300 focus:ring-primary focus:border-transparent"
                              }`}
                              placeholder="username"
                            />
                            {isCheckingHandle && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="w-4 h-4 border-t-2 border-b-2 border-yellow-500 rounded-full animate-spin"></div>
                              </div>
                            )}
                            {!isCheckingHandle &&
                              vCard?.handle &&
                              vCard.handle.trim() !== "" &&
                              !validationErrors.handle &&
                              isValidHandle(vCard.handle) && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <svg
                                    className="w-4 h-4 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                          </div>
                          {validationErrors.handle && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {validationErrors.handle}
                            </p>
                          )}
                          {isCheckingHandle && (
                            <div className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                              <div className="w-4 h-4 border-t-2 border-b-2 border-yellow-500 rounded-full animate-spin"></div>
                              Checking handle availability...
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="fullName"
                            value={vCard?.fullName || ""}
                            onChange={handleVCardChange}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                              validationErrors.fullName
                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 focus:ring-primary focus:border-transparent"
                            }`}
                            placeholder="Full Name"
                          />
                          {editMode && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg
                                className="w-4 h-4 text-gray-400"
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
                            </div>
                          )}
                          {validationErrors.fullName && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {validationErrors.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="title"
                            value={vCard?.title || ""}
                            onChange={handleVCardChange}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                              validationErrors.title
                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 focus:ring-primary focus:border-transparent"
                            }`}
                            placeholder="Job Title"
                          />
                          {editMode && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg
                                className="w-4 h-4 text-gray-400"
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
                            </div>
                          )}
                          {validationErrors.title && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {validationErrors.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="company"
                            value={vCard?.company || ""}
                            onChange={handleVCardChange}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                              validationErrors.company
                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 focus:ring-primary focus:border-transparent"
                            }`}
                            placeholder="Company Name"
                          />
                          {editMode && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg
                                className="w-4 h-4 text-gray-400"
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
                            </div>
                          )}
                          {validationErrors.company && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {validationErrors.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>



                    <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
                    <div className="col-span-2 2xl:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Profile Photo
                        </label>
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={(e) =>
                                handleImageUpload(e, "profilePhoto")
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              disabled={imageUploads.profilePhoto.uploading}
                              id="profilePhoto-upload"
                            />
                            <div
                              className={`
                              relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
                              ${
                                imageUploads.profilePhoto.uploading
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer"
                              }
                            `}
                            >
                              {imageUploads.profilePhoto.uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-sm text-indigo-600 font-medium">
                                    Uploading...
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium text-indigo-600">
                                        Click to Upload
                                      </span>{" "}

                                        or take photo

                                    </p>
                                    <p className="text-xs text-gray-400 hidden sm:block">
                                      PNG, JPG, GIF up to 10MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {vCard?.avatarUrl && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg justify-between">
                              <div className="flex-shrink-0">
                                <Image
                                  src={vCard.avatarUrl}
                                  alt="Profile photo preview"
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover border border-gray-200"
                                />
                              </div>

                              <div className="">
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}

                          {imageUploads.profilePhoto.error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                              <svg
                                className="w-5 h-5 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-sm text-red-600">
                                {imageUploads.profilePhoto.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Company Logo
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) =>
                              handleImageUpload(e, "companyLogo")
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={imageUploads.companyLogo.uploading}
                            id="companyLogo-upload"
                          />
                          <div
                            className={`
                            relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
                            ${
                              imageUploads.companyLogo.uploading
                                ? "border-indigo-300 bg-indigo-50"
                                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer"
                            }
                          `}
                          >
                            {imageUploads.companyLogo.uploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-indigo-600 font-medium">
                                  Uploading...
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium text-indigo-600">
                                      Click to upload{" "}
                                      <span className="sm:hidden inline-block">
                                        Company logo
                                      </span>
                                    </span>{" "}
                                    <span className="sm:inline-block hidden">
                                      or drag and drop
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-400 hidden sm:block">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {vCard?.companyLogoUrl && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg justify-between">
                            <div className="flex-shrink-0">
                              <Image
                                src={vCard.companyLogoUrl}
                                alt="Company logo preview"
                                width={48}
                                height={48}
                                className="rounded-lg object-cover border border-gray-200"
                              />
                            </div>

                            <div className="flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}

                        {imageUploads.companyLogo.error && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm text-red-600">
                              {imageUploads.companyLogo.error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Cover Image
                        </label>
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={(e) =>
                                handleImageUpload(e, "coverImage")
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              disabled={imageUploads.coverImage.uploading}
                              id="coverImage-upload"
                            />
                            <div
                              className={`
                              relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
                              ${
                                imageUploads.coverImage.uploading
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer"
                              }
                            `}
                            >
                              {imageUploads.coverImage.uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-sm text-indigo-600 font-medium">
                                    Uploading...
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium text-indigo-600">
                                        Click to upload
                                      Cover image
                                      </span>{" "}
                                    </p>
                                    <p className="text-xs text-gray-400 sm:block hidden">
                                      PNG, JPG, GIF up to 10MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {vCard?.coverImageUrl && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg justify-between">
                              <div className="flex-shrink-0">
                                <Image
                                  src={vCard.coverImageUrl}
                                  alt="Cover image preview"
                                  width={64}
                                  height={32}
                                  className="rounded-lg object-cover border border-gray-200"
                                />
                              </div>

                              <div className="flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}

                          {imageUploads.coverImage.error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                              <svg
                                className="w-5 h-5 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-sm text-red-600">
                                {imageUploads.coverImage.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Theme
                      </label>
                      <select
                        name="theme"
                        value={vCard?.theme || "classic-purple"}
                        onChange={handleThemeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="classic-purple">Classic Purple</option>
                        <option value="modern-blue">Modern Blue</option>
                        <option value="elegant-black">Elegant Black</option>
                        <option value="vibrant-red">Vibrant Red</option>
                      </select>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Links
                        </label>
                        <button
                          onClick={() => setShowAddLinkModal(true)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add Link
                        </button>
                      </div>
                      <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
                        {vCard?.links?.map((link, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {(link.iconType &&
                                SOCIAL_MEDIA_OPTIONS.find(
                                  (option) => option.type === link.iconType
                                )?.icon) ||
                                // Fallback for existing links without iconType
                                SOCIAL_MEDIA_OPTIONS.find(
                                  (option) => option.type === link.type
                                )?.icon || (
                                  <svg
                                    className="w-5 h-5 text-gray-500 flex-shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    />
                                  </svg>
                                )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {link.type}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                  {link.value}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm ${
                                  link.isVisible
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {link.isVisible ? "Public" : "Private"}
                              </span>
                              <button
                                onClick={() => toggleLinkVisibility(index)}
                                className={`text-sm ${
                                  link.isVisible
                                    ? "text-green-600"
                                    : "text-gray-400"
                                } hover:opacity-80`}
                                title={
                                  link.isVisible
                                    ? "Make Private"
                                    : "Make Public"
                                }
                              >
                                {link.isVisible ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => openEditLinkModal(index)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit Link"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-[17px]"
                                  width="32"
                                  height="32"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM21.41 6.34l-3.75-3.75l-2.53 2.54l3.75 3.75z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeLink(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Link"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alert
                        </label>
                        <button
                          onClick={openAlertModal}
                          className="inline-flex items-center gap-1  py-1.5 text-sm font-medium text-indigo-600  rounded-lg transition-colors"
                        >
                          {vCard?.alert ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="size-4"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          )}

                          {vCard?.alert ? "Edit Alert" : "Add Alert"}
                        </button>
                      </div>

                      {vCard?.alert &&
                        vCard.alert.text &&
                        !isAlertExpired(vCard.alert.expiryDate) && (
                          <div className="p-2 bg-gray-50 rounded-lg ">
                            <div className="flex items-start  gap-3 mt-0.5">
                              {vCard.alert.icon && (
                                <div className="flex-shrink-0 text-gray-500 mt-1">
                                  {getAlertIcon(vCard.alert.icon)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {vCard.alert.type === "link" ? (
                                  <a
                                    href={
                                      vCard.alert.linkName?.startsWith("http")
                                        ? vCard.alert.linkName
                                        : `https://${vCard.alert.linkName}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-700 hover:text-indigo-800 underline break-words"
                                  >
                                    {vCard.alert.text}
                                  </a>
                                ) : (
                                  <p className="text-sm text-gray-700 break-words">
                                    {vCard.alert.text}
                                  </p>
                                )}
                                {vCard.alert.expiryDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Expires:{" "}
                                    {new Date(
                                      vCard.alert.expiryDate
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={removeAlert}
                                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        About
                      </label>
                      <textarea
                        name="note"
                        value={vCard?.note?.value || ""}
                        onChange={handleNoteChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        rows={3}
                        placeholder="Write something about yourself..."
                      />
                    </div>

                    <div className=" items-center gap-2 hidden">
                      <label className="block text-sm font-medium text-gray-700">
                        NFC Enabled
                      </label>
                      <input
                        type="checkbox"
                        name="nfcEnabled"
                        checked={true}
                        onChange={(e) => {
                          if (!vCard) return;
                          setVCard({
                            ...vCard,
                            nfcEnabled: e.target.checked,
                            lastUpdatedAt: new Date(),
                          });
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div> */}
                <div className=" w-full">
                  <h2 className="text-base w-full sm:w-fit mx-auto md:w-[310px]  font-medium justify-between  text-gray-800 mb-4 md:mb-6 flex  items-center gap-2  ">
                    <div className="flex items-center gap-1 text-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 18h.01M8 21h8a3 3 0 003-3V6a3 3 0 00-3-3H8a3 3 0 00-3 3v12a3 3 0 003 3z"
                        />
                      </svg>
                      Preview
                    </div>
                    <div className="  gap-3 justify-end  text-sm  flex  ">
                      {editMode && (
                        <button
                          className={`bg-white text-gray-500 font-medium border border-gray-300 px-2 py-1.5 rounded-md hover:bg-gray-100  `}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className={` font-medium  bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/95   ${
                          isSaving ||
                          isSaveDisabled ||
                          isCheckingHandle ||
                          hideSaveButton ||
                          Object.values(imageUploads).some(
                            (upload) => upload.uploading
                          )
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={editMode ? handleSave : enterEditMode}
                        disabled={
                          isSaving ||
                          isSaveDisabled ||
                          isCheckingHandle ||
                          hideSaveButton ||
                          Object.values(imageUploads).some(
                            (upload) => upload.uploading
                          )
                        }
                      >
                        {isSaving ? (
                          "Saving"
                        ) : isCheckingHandle ? (
                          "Checking"
                        ) : Object.values(imageUploads).some(
                            (upload) => upload.uploading
                          ) ? (
                          "Uploading"
                        ) : editMode ? (
                          <div className="flex items-center gap-2  ">
                            {/* <Save className="size-3" /> */}
                            Save
                          </div>
                        ) : (
                          <div className="flex items-center gap-2  ">
                            Edit <Pencil className="size-3" />
                          </div>
                        )}
                      </button>
                    </div>
                  </h2>

                  {/* Mobile Phone Frame */}
                  <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[310px] h-[500px] sm:h-[550px] bg-black rounded-[2.5rem] p-2">
                    <div className="w-full h-full bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] rounded-[2rem] overflow-hidden">
                      <div className="max-w-md mx-auto h-full">
                        {/* Profile Card Preview */}
                        <div className="bg-white h-full shadow-lg overflow-y-scroll scrollbar-hide">
                          {/* Cover Image */}
                          <div
                            className={`h-28 pt-2 px-4 bg-gradient-to-r ${
                              getThemeColors(vCard?.theme || "classic-purple")
                                .gradient
                            } relative group cursor-pointer`}
                            onClick={() => {
                              if (editMode) {
                                openPhotoModal("coverImage");
                              }
                            }}
                          >
                            {/* Alert Display in Mobile Preview */}
                            {(editMode ||
                              (vCard?.alert &&
                                vCard.alert.text &&
                                !isAlertExpired(vCard.alert.expiryDate))) && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editMode) {
                                    openAlertModal();
                                  }
                                }}
                                className={`mx-auto  mb-3 p-2 z-10 relative backdrop-blur-md  rounded-xl w-fit ${
                                  editMode &&
                                  (!vCard?.alert ||
                                    !vCard.alert.text ||
                                    isAlertExpired(vCard?.alert?.expiryDate))
                                    ? "bg-[#FCFAFF] border-2 border-dashed border-white/50 cursor-pointer hover:bg-[#FCFAFF]/80 "
                                    : "bg-[#FCFAFF] "
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {editMode &&
                                  (!vCard?.alert ||
                                    !vCard.alert.text ||
                                    isAlertExpired(
                                      vCard?.alert?.expiryDate
                                    )) ? (
                                    <>
                                      <div className="flex-shrink-0 text-[#6941C6]">
                                        <div className="size-4">
                                          <svg
                                            className="w-full h-full"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[#6941C6] italic">
                                          Click to add alert
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {vCard?.alert?.icon && (
                                        <div className="flex-shrink-0 text-[#6941C6] ">
                                          <div className="w-3 h-3">
                                            {getAlertIcon(vCard.alert.icon)}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        {vCard?.alert?.type === "link" ? (
                                          <a
                                            href={
                                              vCard.alert.linkName?.startsWith(
                                                "http"
                                              )
                                                ? vCard.alert.linkName
                                                : `https://${vCard.alert.linkName}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs pt-[1px] text-[#6941C6] hover:text-[#6941C6]/80 underline break-words block break-all"
                                          >
                                            {vCard.alert?.text}
                                          </a>
                                        ) : (
                                          <p className="text-xs pt-[1px] text-[#6941C6] hover:text-[#6941C6]/80 break-words">
                                            {vCard?.alert?.text}
                                          </p>
                                        )}
                                      </div>
                                      {/* Edit Alert Icon */}
                                      {editMode && (
                                        <div className="flex-shrink-0 ">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openAlertModal();
                                            }}
                                            className="w-5 h-5 bg-[#6941C6]/20  hover:bg-[#6941C6]/10 rounded-full flex items-center justify-center transition-colors"
                                          >
                                            <svg
                                              className="size-3 text-[#6941C6]"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            {vCard?.coverImageUrl && (
                              <Image
                                src={vCard.coverImageUrl}
                                alt="Cover"
                                fill
                                className="object-contain"
                              />
                            )}
                            {/* Cover Image Edit Overlay */}
                            {editMode && (
                              <div
                                className={`absolute inset-0 bg-black bg-opacity-30 transition-all duration-200 grid place-content-end p-1`}
                              >
                                <div className="opacity-100 transition-opacity duration-200 ">
                                  <svg
                                    className="size-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                              <div
                                className="size-16 bg-gray-200 rounded-full border-2 border-white shadow-lg overflow-hidden group cursor-pointer relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editMode) {
                                    openPhotoModal("profilePhoto");
                                  }
                                }}
                              >
                                {vCard?.avatarUrl ? (
                                  <Image
                                    src={vCard.avatarUrl}
                                    alt={vCard.fullName || "Avatar"}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold ">
                                    {vCard?.fullName?.charAt(0).toUpperCase() ||
                                      "U"}
                                  </div>
                                )}
                                {/* Profile Photo Edit Overlay */}
                                {editMode && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-200 flex items-center justify-center rounded-full">
                                    <div className="opacity-100 transition-opacity duration-200">
                                      <svg
                                        className="size-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {vCard?.companyLogoUrl && (
                                <div
                                  className={`absolute -bottom-1 -right-1 size-8  bg-white rounded-full border-2 border-white flex items-center justify-center overflow-hidden group cursor-pointer`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (editMode) {
                                      openPhotoModal("companyLogo");
                                    }
                                  }}
                                >
                                  <Image
                                    src={vCard?.companyLogoUrl || ""}
                                    alt={vCard?.company || ""}
                                    width={16}
                                    height={16}
                                    className="w-full h-full object-contain"
                                  />
                                  {/* Company Logo Edit Overlay */}
                                  {editMode && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-200 flex items-center justify-center rounded-full">
                                      <div className="opacity-100 transition-opacity duration-200">
                                        <svg
                                          className="size-2 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Add Company Logo button when no logo exists */}
                              {!vCard?.companyLogoUrl && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                  <svg
                                    className="w-2 h-2 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="pt-8 pb-4 px-3 text-center">
                            {/* Handle and Theme */}
                            {editMode && (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {/* Handle */}
                                <div className="col-span-2 text-start">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      name="handle"
                                      value={vCard?.handle || ""}
                                      onChange={handleVCardChange}
                                      placeholder="username"
                                      className={`w-full text-xs text-gray-700  bg-white pl-6 border rounded-md  pr-5 py-1 focus:outline-none focus:ring-2  focus:border-transparent transition-all ${
                                        validationErrors.handle
                                          ? "border-red-300 focus:ring-red-500"
                                          : isCheckingHandle
                                          ? "border-yellow-300 focus:ring-yellow-500"
                                          : "border-gray-200 focus:ring-primary"
                                      }`}
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                      <AtSign className="size-3 text-gray-400" />
                                    </div>
                                    {isCheckingHandle && (
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <div className="w-3 h-3 border-t-2 border-b-2 border-yellow-500 rounded-full animate-spin"></div>
                                      </div>
                                    )}
                                    {!isCheckingHandle &&
                                      vCard?.handle &&
                                      vCard.handle.trim() !== "" &&
                                      !validationErrors.handle &&
                                      isValidHandle(vCard.handle) && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                          <svg
                                            className="w-3 h-3 text-green-500"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                  </div>
                                  {validationErrors.handle && (
                                    <p className="text-xs text-red-600 mt-1 text-left">
                                      {validationErrors.handle}
                                    </p>
                                  )}
                                  {isCheckingHandle && (
                                    <p className="text-xs text-yellow-600 mt-1 text-left">
                                      Checking...
                                    </p>
                                  )}
                                </div>

                                {/* Theme */}
                                <div className="col-span-1">
                                  <select
                                    name="theme"
                                    value={vCard?.theme || "classic-purple"}
                                    onChange={handleThemeChange}
                                    className="w-full text-xs text-gray-700 text-center bg-white border border-gray-200 rounded-md px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  >
                                    <option value="classic-purple">
                                      Purple
                                    </option>
                                    <option value="modern-blue">Blue</option>
                                    <option value="elegant-black">Black</option>
                                    <option value="vibrant-red">Red</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Full Name */}
                            {editMode ? (
                              <div className="mb-2">
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="fullName"
                                    value={vCard?.fullName || ""}
                                    onChange={handleVCardChange}
                                    placeholder="Enter full name"
                                    className="w-full text-sm  text-gray-900 pl-6 bg-white border border-gray-200 rounded-md px-2 py-1  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                    <User className="size-3 text-gray-400" />
                                  </div>
                                </div>
                                {validationErrors.fullName && (
                                  <p className="text-xs text-red-600 text-start mt-1">
                                    {validationErrors.fullName}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                {vCard?.fullName || "Your Name"}
                              </h3>
                            )}

                            {/* Title */}
                            {editMode ? (
                              <div className="mb-2">
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="title"
                                    value={vCard?.title || ""}
                                    onChange={handleVCardChange}
                                    placeholder="Enter job title"
                                    className={`w-full text-xs   bg-white border border-gray-200 rounded-md px-2 py-1 pl-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent `}
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Briefcase className="size-3 text-gray-400" />
                                  </div>
                                </div>
                                {validationErrors.title && (
                                  <p className="text-xs text-red-600 text-start mt-1">
                                    {validationErrors.title}
                                  </p>
                                )}
                              </div>
                            ) : (
                              vCard?.title && (
                                <p
                                  className={`${
                                    getThemeColors(
                                      vCard?.theme || "classic-purple"
                                    ).text
                                  } font-medium mb-0.5 text-xs`}
                                >
                                  {vCard.title}
                                </p>
                              )
                            )}

                            {/* Company */}
                            {editMode ? (
                              <div className="mb-2">
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="company"
                                    value={vCard?.company || ""}
                                    onChange={handleVCardChange}
                                    placeholder="Enter company name"
                                    className="w-full text-xs text-gray-600  bg-white border border-gray-200 rounded-md px-2 py-1 pl-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Building2 className="size-3 text-gray-400" />
                                  </div>
                                </div>
                                {validationErrors.company && (
                                  <p className="text-xs text-red-600 text-start mt-1">
                                    {validationErrors.company}
                                  </p>
                                )}
                              </div>
                            ) : (
                              vCard?.company && (
                                <p className="text-gray-600 mb-2 text-xs">
                                  {vCard.company}
                                </p>
                              )
                            )}

                            {/* Note */}
                            {editMode ? (
                              <div className="mb-3 pb-1.5 focus-within:border-primary relative border-2 border-gray-200 rounded-lg bg-gray-50">
                                <textarea
                                  name="note"
                                  value={vCard?.note?.value || ""}
                                  onChange={handleNoteChange}
                                  placeholder="Write something about yourself..."
                                  rows={3}
                                  maxLength={200}
                                  className="w-full text-xs text-gray-700 text-left bg-gray-50  rounded-lg p-2 focus:outline-none   resize-none scrollbar-hide"
                                />
                                <div className="absolute  -bottom-1 right-1  ">
                                  <span className="text-[10px] text-gray-500">
                                    {vCard?.note?.value?.length || 0}/200
                                  </span>
                                </div>
                              </div>
                            ) : (
                              vCard?.note?.isVisible &&
                              vCard.note.value && (
                                <div className="bg-gray-50 rounded-lg p-2 mb-3 text-left">
                                  <p className="text-gray-700 text-xs break-words">
                                    {vCard.note.value}
                                  </p>
                                </div>
                              )
                            )}

                            {/* Save Contact Button */}
                            {!editMode && (
                              <div
                                className={`w-full ${
                                  getThemeColors(
                                    vCard?.theme || "classic-purple"
                                  ).accent
                                } text-white font-medium py-2 rounded-full mb-4 text-xs cursor-pointer flex items-center justify-center`}
                              >
                                Save Contact
                              </div>
                            )}

                            {/* Social Links */}
                            {vCard?.links && vCard.links.length > 0 && (
                              <div className="space-y-2 p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {(editMode
                                  ? vCard.links
                                  : vCard.links.filter((link) => link.isVisible)
                                ).map((link, index) => {
                                  // Get original index for edit mode operations
                                  const originalIndex = editMode
                                    ? index
                                    : vCard.links.findIndex((l) => l === link);

                                  return (
                                    <div
                                      key={index}
                                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                                        editMode
                                          ? "border border-gray-200 bg-gray-50"
                                          : "shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-300 hover:shadow-[0_2px_8px_rgb(0,0,0,0.15)] cursor-pointer"
                                      }`}
                                    >
                                      <div
                                        className={` ${
                                          editMode ? "size-4" : "size-5"
                                        } bg-white rounded-full flex items-center justify-center shadow-sm`}
                                      >
                                        {getSocialIcon(link)}
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div
                                          className={`font-semibold ${
                                            editMode ? "max-w-28 truncate" : ""
                                          } break-all text-xs flex items-center gap-1 ${
                                            editMode && !link.isVisible
                                              ? "text-gray-400"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {getSocialLabel(link.type)}
                                          {editMode && !link.isVisible && (
                                            <span className="text-[8px] text-gray-400">
                                              (Hidden)
                                            </span>
                                          )}
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            editMode ? "max-w-28 truncate" : ""
                                          } break-all ${
                                            editMode && !link.isVisible
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {getSocialDescription(link)}
                                        </div>
                                      </div>

                                      {/* Edit Mode Actions */}
                                      {editMode && (
                                        <div className="flex items-center gap-1">
                                          {/* Visibility Toggle */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleLinkVisibility(
                                                originalIndex
                                              );
                                            }}
                                            className={`p-1 rounded-full transition-colors ${
                                              link.isVisible
                                                ? "text-green-600 hover:bg-green-50"
                                                : "text-gray-400 hover:bg-gray-100"
                                            }`}
                                            title={
                                              link.isVisible
                                                ? "Make Private"
                                                : "Make Public"
                                            }
                                          >
                                            {link.isVisible ? (
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
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                              </svg>
                                            ) : (
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
                                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                              </svg>
                                            )}
                                          </button>

                                          {/* Edit Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditLinkModal(originalIndex);
                                            }}
                                            className="p-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                                            title="Edit Link"
                                          >
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
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                              />
                                            </svg>
                                          </button>

                                          {/* Delete Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeLink(originalIndex);
                                            }}
                                            className="p-1 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                            title="Delete Link"
                                          >
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Add Link Button - Only in Edit Mode */}
                                {editMode && (
                                  <button
                                    onClick={() => setShowAddLinkModal(true)}
                                    className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                    <span className="text-xs font-medium">
                                      Add Link
                                    </span>
                                  </button>
                                )}

                                {/* Create Your Own Card - Only in View Mode */}
                                {/* {!editMode && (
                                  <div className="text-gray-500 px-4 py-2 shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-2xl font-medium hidden bg-white  justify-center w-fit mx-auto text-xs">
                                    Create Your Own Card
                                  </div>
                                )} */}
                              </div>
                            )}

                            {/* Add Link Button - When No Links Exist and in Edit Mode */}
                            {editMode &&
                              (!vCard?.links || vCard.links.length === 0) && (
                                <div className="space-y-2 p-1">
                                  <button
                                    onClick={() => setShowAddLinkModal(true)}
                                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium">
                                      Add Your First Link
                                    </span>
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 mt-5">
                    <div className="flex items-center gap-2 justify-start text-sm font-medium text-gray-500">
                      Your Vcard URL
                    </div>

                    <div className="relative flex items-center ">
                      <Link
                        href={`/${vCard?.handle}`}
                        className="px-4 py-2 bg-gray-50 border truncate max-w-[260px] sm:max-w-full   border-gray-200 rounded-lg text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {`${config.FRONTEND_URL}${vCard?.handle}`}
                      </Link>

                      <div className="relative group ml-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${config.FRONTEND_URL}${vCard?.handle}`
                            );
                            showNotification(
                              "Link copied to clipboard!",
                              "success"
                            );
                          }}
                        >
                          <Copy className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          Copy URL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-end mt-4 sm:mb-0 mb-9 items-center justify-between gap-3  text-primary  px-4">
              <div className="flex items-center gap-6 order-1 sm:order-2 flex-wrap justify-center ">
                <a
                  href="mailto:success@delightloop.com"
                  className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                  title="Support"
                >
                  {/* <HelpCircle className="w-4 h-4 sm:hidden" /> */}
                  <span className="flex items-center gap-1">
                    <HelpCircle className="size-4" />
                    Support
                  </span>
                </a>
                <Link
                  href="https://delightloop.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                  title="About us"
                >
                  {/* <ExternalLink className="w-4 h-4 sm:hidden" /> */}
                  <span className="flex items-center gap-1">
                    <ExternalLink className="size-4" />
                    About us
                  </span>
                </Link>
                <Link
                  href="https://www.delightloop.com/bookademo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#7F56D9] transition-colors text-[14px] font-[400]"
                  title="Book a meeting"
                >
                  {/* <Calendar className="w-4 h-4 sm:hidden" /> */}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    Book a meeting
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-1 right-1 sm:top-4 sm:right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toastType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } transition-opacity duration-300 flex items-center gap-2`}
        >
          {toastType === "success" ? (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-auto text-gray-700 hover:text-gray-900"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center bg-primary-xlight rounded-t-lg border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingLinkIndex !== null ? "Edit Link" : "Add New Link"}
              </h3>
              <button
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLink({
                    type: "",
                    value: "",
                    isVisible: true,
                    icon: "",
                    removedIcon: false,
                  });
                  setIsCustomLinkType(false);
                  setEditingLinkIndex(null);
                  setValidationErrors({
                    ...validationErrors,
                    linkValue: undefined,
                  });
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 max-h-[80vh] overflow-scroll scrollbar-hide ">
              {/* Show selection grid only when adding new link */}
              {editingLinkIndex === null && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  {SOCIAL_MEDIA_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => {
                        const wasPhoneType =
                          newLink.icon === "WhatsApp" ||
                          newLink.icon === "Phone";
                        const isNewPhoneType =
                          option.type === "WhatsApp" || option.type === "Phone";

                        setNewLink({
                          ...newLink,
                          type: option.type,
                          icon: option.type,
                          // Clear value if switching between phone and URL types
                          value:
                            wasPhoneType !== isNewPhoneType
                              ? ""
                              : newLink.value,
                        });
                        setIsCustomLinkType(false);
                        setValidationErrors({
                          ...validationErrors,
                          linkValue: undefined,
                        });
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        newLink.icon === option.type
                          ? "border-primary bg-primary-xlight text-primary"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="text-current">{option.icon}</span>
                      <span className="text-sm font-medium">{option.type}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setNewLink({ ...newLink, type: "Custom", icon: "" });
                      setIsCustomLinkType(true);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isCustomLinkType
                        ? "border-primary bg-primary-xlight text-primary"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <span className="text-sm font-medium">Custom</span>
                  </button>
                </div>
              )}

              {/* Show current link info when editing */}
              {editingLinkIndex !== null && newLink.icon && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-600">
                      {newLink.removedIcon || !newLink.icon ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      ) : (
                        SOCIAL_MEDIA_OPTIONS.find(
                          (option) => option.type === newLink.icon
                        )?.icon
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Editing{" "}
                      <span className="font-medium text-gray-800">
                        {newLink.icon}
                      </span>{" "}
                      link
                      {newLink.removedIcon && " (generic icon)"}
                    </div>
                  </div>
                </div>
              )}

              {(newLink.type || newLink.icon || isCustomLinkType) && (
                <div className="">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      {newLink.removedIcon || !newLink.icon ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      ) : (
                        SOCIAL_MEDIA_OPTIONS.find(
                          (option) => option.type === newLink.icon
                        )?.icon
                      )}
                    </div>
                    <input
                      type="text"
                      value={newLink.type}
                      onChange={(e) => {
                        // Only update the type, preserve the iconType
                        setNewLink({
                          ...newLink,
                          type: e.target.value,
                          // iconType is preserved
                        });
                        // Clear validation errors when user starts typing
                        if (validationErrors.linkValue) {
                          setValidationErrors({
                            ...validationErrors,
                            linkValue: undefined,
                          });
                        }
                      }}
                      maxLength={30}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={
                        newLink.icon
                          ? `e.g., My ${newLink.icon}, Business ${newLink.icon}, etc.`
                          : "e.g., My Link, Portfolio, Blog, etc."
                      }
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1 ">
                      {/* {newLink.icon && (
                        <div className="flex items-center gap-1">
                          {newLink.removedIcon ? (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span>Using</span>
                              <span className="font-medium text-gray-700">
                                {newLink.icon}
                              </span>
                              <span>validation, generic link icon</span>
                            </p>
                          ) : (
                            <p className={`text-xs text-gray-500 flex items-center gap-1  `}>
                              <span>Using</span>
                              <span className="font-medium text-gray-700">
                                {newLink.icon}
                              </span>
                              <span>icon</span>
                            </p>
                          )}

                          {editingLinkIndex === null && (
                            <>
                              {!newLink.removedIcon ? (
                                <button
                                  onClick={() => {
                                    setNewLink({
                                      ...newLink,
                                      removedIcon: true,
                                    });
                                  }}
                                  className="text-xs text-red-500  hover:text-red-700 ml-1 px-1 py-0.5 rounded-full hover:bg-red-50"
                                  title="Remove icon"
                                >
                                  ✕
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setNewLink({
                                      ...newLink,
                                      removedIcon: false,
                                    });
                                  }}
                                  className="text-xs text-green-500 hover:text-green-700 ml-1 px-1 py-0.5 rounded-full hover:bg-green-50"
                                  title="Restore icon"
                                >
                                  ↻
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )} */}
                    </div>
                    <span className="text-xs text-gray-500">
                      {newLink.type.length}/30
                    </span>
                  </div>
                </div>
              )}

              {newLink.type && (
                <>
                  <div>
                    {newLink.icon === "WhatsApp" ||
                    newLink.icon === "Phone" ||
                    newLink.icon === "SMS" ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newLink.value}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Allow only valid phone characters
                            value = value.replace(/[^+\d\s\-\(\)\.]/g, "");

                            setNewLink({ ...newLink, value: value });
                            // Clear validation errors when user starts typing
                            if (validationErrors.linkValue) {
                              setValidationErrors({
                                ...validationErrors,
                                linkValue: undefined,
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            validationErrors.linkValue
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-primary"
                          }`}
                          placeholder={
                            newLink.icon === "WhatsApp"
                              ? "+1 (555) 123-4567 or 5551234567"
                              : newLink.icon === "SMS"
                              ? "+1 (555) 123-4567 for SMS"
                              : "+1 (555) 123-4567"
                          }
                          maxLength={20}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter 10-15 digits. Include country code for
                          international numbers (e.g., +1 for US/Canada)
                        </p>
                      </>
                    ) : newLink.icon === "Email" ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newLink.value}
                          onChange={(e) => {
                            setNewLink({ ...newLink, value: e.target.value });
                            // Clear validation errors when user starts typing
                            if (validationErrors.linkValue) {
                              setValidationErrors({
                                ...validationErrors,
                                linkValue: undefined,
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            validationErrors.linkValue
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-primary"
                          }`}
                          placeholder="example@email.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter a valid email address
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link URL
                        </label>
                        <input
                          type="url"
                          value={newLink.value}
                          onChange={(e) => {
                            setNewLink({ ...newLink, value: e.target.value });
                            // Clear validation errors when user starts typing
                            if (validationErrors.linkValue) {
                              setValidationErrors({
                                ...validationErrors,
                                linkValue: undefined,
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            validationErrors.linkValue
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-primary"
                          }`}
                          placeholder="https://example.com"
                        />
                      </>
                    )}
                    {validationErrors.linkValue && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {validationErrors.linkValue}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      checked={newLink.isVisible}
                      onChange={(e) =>
                        setNewLink({ ...newLink, isVisible: e.target.checked })
                      }
                      className="h-4 w-4  focus:ring-primary border-gray-300 rounded accent-primary"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Make this link visible on profile
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLink({
                    type: "",
                    value: "",
                    isVisible: true,
                    icon: "",
                    removedIcon: false,
                  });
                  setIsCustomLinkType(false);
                  setEditingLinkIndex(null);
                  setValidationErrors({
                    ...validationErrors,
                    linkValue: undefined,
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={addLink}
                className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {editingLinkIndex !== null ? "Update Link" : "Add Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed   inset-0 bg-gray-600 bg-opacity-75  overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative bg-white  rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex bg-primary-xlight rounded-t-lg justify-between items-center border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                {vCard?.alert ? "Edit Alert" : "Add Alert"}
              </h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveAlert();
              }}
              className="px-6 py-4 space-y-4 overflow-y-auto max-h-[85vh]"
            >
              {/* Show expiry warning if alert is expired */}

              {(alertData.type === "text" || alertData.type === "link") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Text
                    <span className="text-gray-500 text-xs ml-1">
                      {`${alertData.text.length}/40 characters`}
                    </span>
                  </label>
                  <textarea
                    name="text"
                    value={alertData.text}
                    onChange={handleAlertChange}
                    required
                    rows={1}
                    maxLength={40}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                      alertValidationErrors.text
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary"
                    }`}
                    placeholder={"Enter your alert message (max 40 chars)..."}
                  />
                  {alertValidationErrors.text && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {alertValidationErrors.text}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type
                </label>
                <select
                  name="type"
                  value={alertData.type}
                  onChange={handleAlertChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="text">Text Only</option>
                  <option value="link">Clickable Link</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {alertData.type === "link"
                    ? "Alert will be clickable as a link"
                    : "Alert will be displayed as plain text"}
                </p>
              </div>

              {/* Link Name Field - Only shown when type is 'link' */}
              {alertData.type === "link" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                  </label>
                  <input
                    type="url"
                    name="linkName"
                    value={alertData.linkName || ""}
                    onChange={handleAlertChange}
                    required={alertData.type === "link"}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      alertValidationErrors.linkName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary"
                    }`}
                    placeholder="https://example.com"
                  />

                  {alertValidationErrors.linkName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {alertValidationErrors.linkName}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: "", icon: null, label: "No Icon" },
                    {
                      name: "megaphone",
                      icon: <Megaphone className="w-5 h-5" />,
                      label: "Announcement",
                    },
                    {
                      name: "warning",
                      icon: <AlertTriangle className="w-5 h-5" />,
                      label: "Warning",
                    },
                    {
                      name: "info",
                      icon: <Info className="w-5 h-5" />,
                      label: "Info",
                    },
                    {
                      name: "success",
                      icon: <CheckCircle className="w-5 h-5" />,
                      label: "Success",
                    },
                    {
                      name: "bell",
                      icon: <Bell className="w-5 h-5" />,
                      label: "Notification",
                    },
                    {
                      name: "zap",
                      icon: <Zap className="w-5 h-5" />,
                      label: "Important",
                    },
                    {
                      name: "link",
                      icon: <LinkIcon className="w-5 h-5" />,
                      label: "Featured",
                    },
                  ].map((iconOption) => (
                    <button
                      key={iconOption.name}
                      type="button"
                      onClick={() =>
                        setAlertData((prev) => ({
                          ...prev,
                          icon: iconOption.name,
                        }))
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                        alertData.icon === iconOption.name
                          ? "border-primary bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {iconOption.icon || (
                        <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded"></div>
                      )}
                      {/* <span className="text-xs  mt-1 text-center">
                        {iconOption.label}
                      </span> */}
                    </button>
                  ))}
                </div>
              </div>
              {alertData.expiryDate && isAlertExpired(alertData.expiryDate) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">
                      Alert Expired
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This alert expired on{" "}
                      <span className="font-medium">
                        {new Date(alertData.expiryDate).toLocaleString()}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <div className="relative inline-block w-full">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={
                        alertData.expiryDate
                          ? new Date(alertData.expiryDate).toLocaleDateString()
                          : ""
                      }
                      placeholder="Select expiry date"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer ${
                        alertValidationErrors.expiryDate
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  {showCalendar && (
                    <CustomCalendar
                      selectedDate={
                        alertData.expiryDate
                          ? new Date(alertData.expiryDate)
                          : null
                      }
                      onChange={handleAlertDateChange}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Alert will be hidden after this date
                </p>
                {alertValidationErrors.expiryDate && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {alertValidationErrors.expiryDate}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !alertData.text.trim() ||
                    (alertData.type === "link" &&
                      !alertData.linkName?.trim()) ||
                    !!alertValidationErrors.text ||
                    !!alertValidationErrors.linkName ||
                    !!alertValidationErrors.expiryDate ||
                    (alertData.expiryDate &&
                      new Date(alertData.expiryDate).setHours(0, 0, 0, 0) <
                        new Date().setHours(0, 0, 0, 0))
                  }
                  className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {vCard?.alert ? "Update Alert" : "Add Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && currentPhotoType && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex justify-between items-center bg-primary-xlight rounded-t-lg border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                {currentPhotoType === "profilePhoto"
                  ? "Profile Photo"
                  : currentPhotoType === "companyLogo"
                  ? "Company Logo"
                  : "Cover Image"}
              </h3>
              <button
                onClick={closePhotoModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Current Photo Display */}
              <div className="text-center">
                <div className="inline-block relative ">
                  {currentPhotoType === "profilePhoto" && vCard?.avatarUrl ? (
                    <Image
                      src={vCard.avatarUrl}
                      alt="Profile photo"
                      width={120}
                      height={120}
                      className="rounded-full object-contain size-32 border-2 border-gray-200"
                    />
                  ) : currentPhotoType === "companyLogo" &&
                    vCard?.companyLogoUrl ? (
                    <Image
                      src={vCard.companyLogoUrl}
                      alt="Company logo"
                      width={120}
                      height={120}
                      className="rounded-lg object-contain size-32 border-2 border-gray-200"
                    />
                  ) : currentPhotoType === "coverImage" &&
                    vCard?.coverImageUrl ? (
                    <Image
                      src={vCard.coverImageUrl}
                      alt="Cover image"
                      width={240}
                      height={120}
                      className="rounded-lg object-contain size-32 border-2 border-gray-200"
                    />
                  ) : (
                    <div
                      className={`
                       ${
                         currentPhotoType === "coverImage"
                           ? "w-72 h-32"
                           : "w-72 h-32"
                       }
                       ${
                         currentPhotoType === "profilePhoto"
                           ? "rounded-lg"
                           : "rounded-lg"
                       }
                       bg-primary-xlight border border-primary-light  flex items-center justify-center
                     `}
                    >
                      <div className="text-center text-primary-light">
                        <svg
                          className="w-8 h-8 text-primary-light mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <p className="text-sm ">
                          No{" "}
                          {currentPhotoType === "profilePhoto"
                            ? "profile photo"
                            : currentPhotoType === "companyLogo"
                            ? "company logo"
                            : "cover image"}
                        </p>
                        {/* Upload Guidelines */}
                        <div className="text-xs  mt-2">
                          <p className="">
                            Supported formats: PNG, JPG, GIF, WebP • Max size:
                            10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Status */}
              {/* {imageUploads[currentPhotoType].uploading && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-indigo-600 font-medium">
                      Uploading...
                    </span>
                  </div>
                </div>
              )} */}

              {/* Upload Error */}
              {imageUploads[currentPhotoType].error && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-red-600">
                      {imageUploads[currentPhotoType].error}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                {/* Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e, currentPhotoType)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={imageUploads[currentPhotoType].uploading}
                    id={`${currentPhotoType}-modal-upload`}
                  />
                  <button
                    disabled={imageUploads[currentPhotoType].uploading}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors
                      ${
                        imageUploads[currentPhotoType].uploading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    `}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {imageUploads[currentPhotoType].uploading
                      ? "Uploading..."
                      : (currentPhotoType === "profilePhoto" &&
                          vCard?.avatarUrl) ||
                        (currentPhotoType === "companyLogo" &&
                          vCard?.companyLogoUrl) ||
                        (currentPhotoType === "coverImage" &&
                          vCard?.coverImageUrl)
                      ? "Change Photo"
                      : "Upload Photo"}
                  </button>
                </div>

                {/* Delete Button - Only show if photo exists */}
                {((currentPhotoType === "profilePhoto" && vCard?.avatarUrl) ||
                  (currentPhotoType === "companyLogo" &&
                    vCard?.companyLogoUrl) ||
                  (currentPhotoType === "coverImage" &&
                    vCard?.coverImageUrl)) && (
                  <button
                    onClick={() => deletePhoto(currentPhotoType)}
                    disabled={imageUploads[currentPhotoType].uploading}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors
                      ${
                        imageUploads[currentPhotoType].uploading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    `}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
