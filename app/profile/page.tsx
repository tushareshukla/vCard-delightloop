"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Bell,
  Zap,
  MessageCircle,
  Star,
  Trash2,
  Link,
} from "lucide-react";
import PageHeader from "@/components/layouts/PageHeader";
import { Button } from "@/components/ui/button";
import { config } from "@/utils/config";
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
    isVisible: boolean;
    lastUpdated: Date;
    iconType?: string;
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

// Add new interfaces for admin vCard management
interface AdminVCard extends VCard {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AdminVCardFormData {
  _id?: string;
  handle: string;
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
    isVisible: boolean;
    lastUpdated: Date;
    iconType?: string;
  }>;
  note: {
    value: string;
    isVisible: boolean;
    lastUpdated: Date;
  };
  alert?: IVCardAlert; // Add alert property
  nfcEnabled: boolean;
  isActive: boolean;
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

const getSocialIcon = (link: { type: string; iconType?: string }) => {
  // Use iconType if available, otherwise fall back to type
  const iconKey = (link.iconType || link.type).toLowerCase();
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

const getSocialDescription = (link: { type: string; iconType?: string }) => {
  // Use iconType if available, otherwise fall back to type
  const actionType = (link.iconType || link.type).toLowerCase();
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
  {
    type: "Book a meeting",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } =
    useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vCard, setVCard] = useState<VCard | null>(null);
  const [hasVCard, setHasVCard] = useState<boolean>(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const [showLogoUrlInput, setShowLogoUrlInput] = useState<boolean>(false);

  // Password change state
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Add these states for the toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);

  // Edit API Key state
  const [showEditKeyModal, setShowEditKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [editKeyLabel, setEditKeyLabel] = useState("");
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKey, setDeletingKey] = useState<any>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  // Initialize activeTab based on URL parameter
  const getInitialTab = () => {
    const tabParam = searchParams.get("tab");
    return tabParam === "vcard" ? "v-card" : "personal-info";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Key visibility state
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>(
    {}
  );

  // Add state for links
  const [newLink, setNewLink] = useState({
    type: "",
    value: "",
    isVisible: true,
    iconType: "", // Track original social media type for icon
  });
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [isCustomLinkType, setIsCustomLinkType] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);

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

  // New state for admin vCard management
  const [adminVCards, setAdminVCards] = useState<AdminVCard[]>([]);
  const [adminVCardSearch, setAdminVCardSearch] = useState("");
  const [adminVCardLoading, setAdminVCardLoading] = useState(false);
  const [showAdminVCardModal, setShowAdminVCardModal] = useState(false);
  const [editingAdminVCard, setEditingAdminVCard] =
    useState<AdminVCardFormData | null>(null);
  const [adminVCardForm, setAdminVCardForm] = useState<AdminVCardFormData>({
    handle: "",
    fullName: "",
    title: "",
    company: "",
    theme: "classic-purple",
    links: [],
    note: {
      value: "",
      isVisible: true,
      lastUpdated: new Date(),
    },
    nfcEnabled: true,
    isActive: true,
  });

  // Additional state for admin VCard link management
  const [showAdminAddLinkModal, setShowAdminAddLinkModal] = useState(false);
  const [editingAdminLinkIndex, setEditingAdminLinkIndex] = useState<
    number | null
  >(null);
  const [adminNewLink, setAdminNewLink] = useState({
    type: "",
    value: "",
    isVisible: true,
    iconType: "",
  });
  const [isCustomAdminLinkType, setIsCustomAdminLinkType] = useState(false);

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
  const [alertValidationErrors, setAlertValidationErrors] = useState<{
    text?: string;
    linkName?: string;
    expiryDate?: string;
  }>({});

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

    // Clear validation errors when opening modal
    setAlertValidationErrors({});
    setShowAlertModal(true);
  };

  const handleAlertChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    let newData = {
      ...alertData,
      [name]: value,
    };

    // Clear text field when type changes
    if (name === "type") {
      newData = {
        ...newData,
        text: "",
      };
    }

    setAlertData(newData);

    // Real-time validation
    const errors = { ...alertValidationErrors };

    if (name === "text") {
      errors.text = validateAlertText(value, newData.type);
    } else if (name === "linkName") {
      errors.linkName = validateLinkName(value, newData.type);
    } else if (name === "type") {
      // Re-validate both text and linkName when type changes
      errors.text = validateAlertText(newData.text, value);
      errors.linkName = validateLinkName(newData.linkName || "", value);
    }

    setAlertValidationErrors(errors);
  };

  const handleAlertDateChange = (date: Date | null) => {
    // If a date is provided, set the time to 12 PM (noon)
    let dateWithTime = date;
    if (date) {
      dateWithTime = new Date(date);
      dateWithTime.setHours(12, 0, 0, 0); // Set to 12:00 PM
    }

    setAlertData((prev) => ({
      ...prev,
      expiryDate: dateWithTime || undefined,
    }));

    // Validate expiry date
    const errors = { ...alertValidationErrors };
    errors.expiryDate = validateExpiryDate(dateWithTime || undefined);
    setAlertValidationErrors(errors);
  };

  const saveAlert = () => {
    if (!vCard) return;

    // Validate form before saving
    if (!validateAlertForm()) {
      return;
    }

    setVCard((prev) => ({
      ...prev!,
      alert: alertData.text ? alertData : undefined,
    }));
    setShowAlertModal(false);

    // Clear validation errors
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

  // Alert validation functions
  const validateAlertText = (text: string, type: string) => {
    if (!text.trim()) {
      return "This field is required";
    }

    if (type === "link") {
      // For link type, validate URL format
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(text.trim())) {
        return "Please enter a valid URL (e.g., https://example.com)";
      }
    } else {
      // For text type, limit to 40 characters
      if (text.length > 40) {
        return "Text must be 40 characters or less";
      }
    }

    return undefined;
  };

  const validateLinkName = (linkName: string, type: string) => {
    if (type === "link") {
      if (!linkName.trim()) {
        return "Link name is required for clickable links";
      }
      if (linkName.length > 30) {
        return "Link name must be 30 characters or less";
      }
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
    errors.linkName = validateLinkName(
      alertData.linkName || "",
      alertData.type
    );
    errors.expiryDate = validateExpiryDate(alertData.expiryDate);

    setAlertValidationErrors(errors);

    // Return true if no errors
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
      link: <Link className="w-4 h-4" />,
    };

    return iconMap[iconName.toLowerCase()] || iconMap.megaphone;
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeyIds((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  // Function to show toast notification
  const showNotification = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto-hide the toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const [userHandleName, setUserHandleName] = useState("");

  // Detect tab parameter changes and update active tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "vcard") {
      setActiveTab("v-card");
    }
  }, [searchParams]);

  // Fetch user and organization data
  useEffect(() => {
    if (!isLoadingCookies) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          if (!authToken) {
            console.log("No auth token found, redirecting to login...");
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

          if (!orgResponse.ok) {
            throw new Error(
              `Error fetching organization data: ${orgResponse.status}`
            );
          }

          const orgData = await orgResponse.json();

          // Update state with fetched data
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

            if (vCardResponse.ok) {
              const vCardData = await vCardResponse.json();
              if (vCardData.success) {
                setVCard(vCardData.data);
                setHasVCard(true);
                setUserHandleName(vCardData.data.handle);
              }
            } else if (vCardResponse.status === 404) {
              // VCard doesn't exist yet - that's okay
              setHasVCard(false);
              setVCard(null);
            } else {
              console.warn("Error fetching VCard:", vCardResponse.status);
            }
          } catch (vCardError) {
            console.warn("Error fetching VCard:", vCardError);
            // Don't throw error, VCard is optional
          }

          // Fetch admin vCards if user is delightloop admin
          if (userData.email?.endsWith("@delightloop.com")) {
            fetchAllVCards();
          }
        } catch (err) {
          console.error("Error fetching data:", err);
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

  const [hideSaveButton, setHideSaveButton] = useState(false);
  // Utility functions for validation
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true; // Empty URLs are optional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidHandle = (handle: string) => {
    if (!handle.trim()) return true; // Empty handle is optional
    // Allow alphanumeric, underscore, hyphen, and dot
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    return (
      handleRegex.test(handle) && handle.length >= 3 && handle.length <= 30
    );
  };

  const isValidPhone = (phone: string) => {
    if (!phone.trim()) return true; // Empty phone is optional

    // Remove all non-digit characters to count actual digits
    const digitsOnly = phone.replace(/\D/g, "");

    // Check minimum and maximum digit count
    if (digitsOnly.length < 10) return false; // Minimum 10 digits
    if (digitsOnly.length > 15) return false; // Maximum 15 digits (international standard)

    // Allow digits, spaces, +, -, (), but must start with + or digit
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]+$/;
    if (!phoneRegex.test(phone)) return false;

    // Must not have consecutive special characters
    if (/[\-\s\(\)\.]{2,}/.test(phone)) return false;

    // If starts with +, must have country code (1-4 digits after +)
    if (phone.startsWith("+")) {
      const afterPlus = phone.substring(1).replace(/\D/g, "");
      if (afterPlus.length < 10 || afterPlus.length > 15) return false;
    }

    return true;
  };

  const isValidDomain = (domain: string) => {
    if (!domain.trim()) return true; // Empty domain is optional for non-admins
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
    return domainRegex.test(domain);
  };

  const isValidName = (name: string) => {
    if (!name.trim()) return false; // Names are required
    // Allow letters, spaces, apostrophes, hyphens, and dots (for initials)
    const nameRegex = /^[a-zA-Z\s\'\-\.]+$/;
    return (
      nameRegex.test(name) &&
      name.trim().length >= 2 &&
      name.trim().length <= 50
    );
  };

  const isValidTitle = (title: string) => {
    if (!title.trim()) return true; // Title is optional
    // Allow letters, numbers, spaces, common punctuation for job titles
    const titleRegex = /^[a-zA-Z0-9\s\&\-\(\)\,\.\/]+$/;
    return titleRegex.test(title) && title.trim().length <= 100;
  };

  const isValidCompanyName = (company: string) => {
    if (!company.trim()) return true; // Company is optional
    // Allow letters, numbers, spaces, and common business punctuation
    const companyRegex = /^[a-zA-Z0-9\s\&\-\(\)\,\.\'\!]+$/;
    return companyRegex.test(company) && company.trim().length <= 100;
  };

  // Check if handle is unique
  const checkHandleUniqueness = async (handle: string) => {
    if (!handle.trim() || !isValidHandle(handle)) {
      return; // Don't check if handle is empty or invalid format
    }

    // Skip check if it's the same as current handle
    console.log("handle", handle);
    console.log("userHandleName", userHandleName);
    if (handle === userHandleName) {
      return;
    }

    try {
      setIsCheckingHandle(true);
      setIsSaveDisabled(true); // Disable save button while checking

      // First check in recipients
      //   const recipientResponse = await fetch(
      //     `${config.BACKEND_URL}/v1/recipients/check-handle/${encodeURIComponent(handle)}`,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${authToken}`,
      //       },
      //     }
      //   );

      //   if (recipientResponse.ok) {
      //     const recipientData = await recipientResponse.json();
      //     if (recipientData.exists) {
      //       setValidationErrors((prev) => ({
      //         ...prev,
      //         handle: "This handle is already taken by a recipient",
      //       }));
      //       return;
      //     }
      //   }

      // Check handle availability using VCard API
      const validateResponse = await fetch(
        `${config.BACKEND_URL}/v1/vcard/validate-handle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            handle: handle,
            excludeId: vCard?._id, // Exclude current VCard from validation
          }),
        }
      );

      if (validateResponse.ok) {
        const validateData = await validateResponse.json();
        if (validateData.success) {
          if (validateData.available) {
            setHideSaveButton(false);
            setIsSaveDisabled(false);
            // Handle is available, clear any existing handle error
            setValidationErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.handle;
              return newErrors;
            });
          } else {
            // Handle is taken
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
      // Don't show error to user for network issues, just log it
    } finally {
      setIsCheckingHandle(false);
      setIsSaveDisabled(false); // Re-enable save button after check
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors: any = {};

    // Required fields
    if (!userProfile?.firstName?.trim()) {
      errors.firstName = "First name is required";
    } else if (!isValidName(userProfile.firstName)) {
      errors.firstName =
        "First name must contain only letters and be 2-50 characters";
    }

    if (!userProfile?.lastName?.trim()) {
      errors.lastName = "Last name is required";
    } else if (!isValidName(userProfile.lastName)) {
      errors.lastName =
        "Last name must contain only letters and be 2-50 characters";
    }

    // Optional but format-validated fields
    if (userProfile?.mobile && !isValidPhone(userProfile.mobile)) {
      errors.mobile = "Please enter a valid phone number";
    }

    // V-Card validations
    if (vCard?.handle && !isValidHandle(vCard.handle)) {
      errors.handle =
        "Handle must be 3-30 characters, alphanumeric with ._- only";
    }

    if (vCard?.fullName && !isValidName(vCard.fullName)) {
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

    if (vCard?.companyLogoUrl && !isValidUrl(vCard.companyLogoUrl)) {
      errors.companyLogoUrl = "Please enter a valid URL";
    }

    if (vCard?.avatarUrl && !isValidUrl(vCard.avatarUrl)) {
      errors.avatarUrl = "Please enter a valid URL";
    }

    if (vCard?.coverImageUrl && !isValidUrl(vCard.coverImageUrl)) {
      errors.coverImageUrl = "Please enter a valid URL";
    }

    // Organization validations (only for admins)
    if (userProfile?.roles?.includes("admin")) {
      if (!organization?.name?.trim()) {
        errors.orgName = "Organization name is required";
      } else if (!isValidCompanyName(organization.name)) {
        errors.orgName =
          "Organization name contains invalid characters or is too long";
      }

      if (!organization?.domain?.trim()) {
        errors.orgDomain = "Organization domain is required";
      } else if (!isValidDomain(organization.domain)) {
        errors.orgDomain = "Please enter a valid domain";
      }

      if (logoUrlInput && !isValidUrl(logoUrlInput)) {
        errors.orgLogoUrl = "Please enter a valid URL";
      }
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Handle user data changes
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!userProfile) return;

    setUserProfile({
      ...userProfile,
      [name]: value,
    });

    // Clear validation errors when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }
  };

  // Handle organization data changes
  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!organization) return;

    if (name === "name" || name === "domain") {
      setOrganization({
        ...organization,
        [name]: value,
      });

      // Clear validation errors when user starts typing
      const errorKey = name === "name" ? "orgName" : "orgDomain";
      if (validationErrors[errorKey as keyof typeof validationErrors]) {
        setValidationErrors({
          ...validationErrors,
          [errorKey]: undefined,
        });
      }
    }
  };

  // Handle logo change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logo URL change
  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    console.log("Logo URL changed to:", newUrl);
    setLogoUrlInput(newUrl);

    // Clear validation errors when user starts typing
    if (validationErrors.orgLogoUrl) {
      setValidationErrors({
        ...validationErrors,
        orgLogoUrl: undefined,
      });
    }
  };

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Toggle between file upload and URL input
  const toggleLogoInputMethod = () => {
    setShowLogoUrlInput(!showLogoUrlInput);
    // Reset the other input method when switching
    if (!showLogoUrlInput) {
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      setLogoUrlInput("");
    }
  };

  // Handle V-Card data changes
  const handleVCardChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
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
      [name]: value,
      lastUpdatedAt: new Date(),
    });

    // Clear validation errors when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }

    // Special handling for handle field - check uniqueness with debounce
    if (name === "handle") {
      // Clear any existing timeout
      if (handleCheckTimeout) {
        clearTimeout(handleCheckTimeout);
      }

      // Set a new timeout to check handle uniqueness after user stops typing
      const newTimeout = setTimeout(() => {
        checkHandleUniqueness(value);
      }, 800); // Wait 800ms after user stops typing

      setHandleCheckTimeout(newTimeout);
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
    console.log("=== addLink called ===");
    console.log("userProfile:", !!userProfile);
    console.log("vCard:", !!vCard);
    console.log("newLink:", newLink);

    if (!userProfile || !vCard) {
      console.log("❌ Early return: missing userProfile or vCard");
      return;
    }

    // Validate the link before adding/updating
    if (!newLink.type || !newLink.value) {
      console.log("❌ Validation failed: missing type or value");
      const fieldName =
        newLink.iconType === "WhatsApp" ||
        newLink.iconType === "Phone" ||
        newLink.iconType === "SMS"
          ? "phone number"
          : "URL";
      setValidationErrors({
        ...validationErrors,
        linkValue: `Link type and ${fieldName} are required`,
      });
      return;
    }

    // Validate based on icon type
    if (
      newLink.iconType === "WhatsApp" ||
      newLink.iconType === "Phone" ||
      newLink.iconType === "SMS"
    ) {
      if (!isValidPhone(newLink.value)) {
        // Get more specific error message
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
    } else if (newLink.iconType === "Email") {
      // Validate email
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
      // Edit mode - update existing link
      updatedLinks = [...(vCard.links || [])];
      updatedLinks[editingLinkIndex] = {
        type: newLink.type,
        value: newLink.value,
        isVisible: newLink.isVisible,
        iconType: newLink.iconType,
        lastUpdated: new Date(),
      };
    } else {
      // Add mode - add new link
      updatedLinks = [
        ...(vCard.links || []),
        {
          type: newLink.type,
          value: newLink.value,
          isVisible: newLink.isVisible,
          iconType: newLink.iconType,
          lastUpdated: new Date(),
        },
      ];
    }

    setVCard({
      ...vCard,
      links: updatedLinks,
      lastUpdatedAt: new Date(),
    });
    setNewLink({ type: "", value: "", isVisible: true, iconType: "" });
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
    setNewLink({
      type: linkToEdit.type,
      value: linkToEdit.value,
      isVisible: linkToEdit.isVisible,
      iconType: linkToEdit.iconType || "",
    });
    setIsCustomLinkType(!linkToEdit.iconType);
    setShowAddLinkModal(true);
  };

  // Save profile changes
  const handleSave = async () => {
    if (isSaveDisabled || isCheckingHandle || validationErrors.handle) {
      return; // Don't allow save while checking handle, if disabled, or if handle has errors
    }
    if (!userProfile || !organization) return;

    // Validate form before saving
    if (!validateForm()) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSaving(true);
    console.log("Saving with logo URL:", logoUrlInput);
    console.log("Saving VCard:", JSON.stringify(vCard, null, 2));

    try {
      const userId = userProfile._id;
      const orgId = organization._id;

      // Update user info first (without VCard data)
      const userUpdateResponse = await fetch(
        `${config.BACKEND_URL}/v1/organizations/${orgId}/users/${userId}/update-user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            mobile: userProfile.mobile,
            state: userProfile.state,
            country: userProfile.country,
          }),
        }
      );

      if (!userUpdateResponse.ok) {
        throw new Error(`Error updating user: ${userUpdateResponse.status}`);
      }

      // Handle VCard creation or update
      if (vCard && vCard.handle) {
        console.log("=== VCard Save Operation Debug ===");
        console.log("Checking if VCard exists for user:", userId);

        let vCardResponse;

        try {
          // First, check if VCard exists by calling the GET API
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

          console.log("VCard check response status:", checkResponse.status);

          if (checkResponse.ok) {
            // VCard exists - UPDATE
            console.log("✅ VCard exists - will UPDATE");

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
            console.log("UPDATE response status:", vCardResponse.status);
          } else if (checkResponse.status === 404) {
            // VCard doesn't exist - CREATE
            console.log("🆕 VCard not found - will CREATE");

            vCardResponse = await fetch(
              `${config.BACKEND_URL}/v1/vcard`,
              {
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
              }
            );
            console.log("CREATE response status:", vCardResponse.status);
          } else {
            // Unexpected error from check API
            throw new Error(
              `Error checking VCard existence: ${checkResponse.status}`
            );
          }

          if (!vCardResponse.ok) {
            const errorData = await vCardResponse.json();
            console.error("VCard save error:", errorData);
            throw new Error(
              `Error saving VCard: ${
                errorData.error_message || vCardResponse.status
              }`
            );
          }

          const vCardResult = await vCardResponse.json();
          console.log("VCard save result:", vCardResult);

          if (vCardResult.success) {
            console.log("✅ VCard saved successfully");
            setVCard(vCardResult.data);
            setHasVCard(true);
          } else {
            console.error("❌ VCard save failed - success flag is false");
          }
        } catch (error) {
          console.error("Error in VCard save operation:", error);
          throw error;
        }

        console.log("=== End VCard Save Debug ===");
      }

      // Only update org if user has admin role
      if (userProfile.roles.includes("admin")) {
        // Create the request body with the current input value
        const orgUpdateBody = {
          name: organization.name,
          domain: organization.domain,
          branding: {
            logo_url: logoUrlInput, // Use the current input value
          },
        };

        console.log(
          "Sending organization update with:",
          JSON.stringify(orgUpdateBody)
        );

        const orgUpdateResponse = await fetch(
          `${config.BACKEND_URL}/v1/organizations/${orgId}/users/${userId}/update-org`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(orgUpdateBody),
          }
        );

        if (!orgUpdateResponse.ok) {
          const errorText = await orgUpdateResponse.text();
          console.error("Organization update error:", errorText);
          throw new Error(
            `Error updating organization: ${orgUpdateResponse.status}`
          );
        }

        try {
          const responseData = await orgUpdateResponse.json();
          console.log(
            "Organization update response:",
            JSON.stringify(responseData)
          );
        } catch (e) {
          console.log("Could not parse response as JSON");
        }

        // Update local state immediately
        setOrganization({
          ...organization,
          branding: {
            ...organization.branding,
            logo_url: logoUrlInput,
          },
        });

        console.log("Updated organization logo URL to:", logoUrlInput);
      }

      // Show success notification
      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      // Show error notification
      showNotification(
        `Failed to update profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    setIsSaving(true);
    try {
      const userId = userProfile._id;
      const orgId = userProfile.organization_id;

      // In a real implementation, you'd verify the current password on the server
      // and handle password updates through a dedicated endpoint
      const response = await fetch(
        `${config.BACKEND_URL}/v1/organizations/${orgId}/users/${userId}/update-user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            password: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating password: ${response.status}`);
      }

      // Reset form and close
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
      alert("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel - reset to original values
  //   const handleCancel = () => {
  // Since we're always in edit mode, cancel should reset to original values
  // You might want to fetch the original data again or keep a backup
  // setLogoPreview(null);
  // setLogoFile(null);
  // setValidationErrors({});
  // Optionally reload the page or refetch data
  //     window.location.reload();
  //   };

  // Handle logout

  useEffect(() => {
    if (!isLoadingCookies) {
      if (organization?.branding?.logo_url !== undefined) {
        setLogoUrlInput(organization.branding.logo_url);
        console.log(
          "Setting logo URL input from organization:",
          organization.branding.logo_url
        );
      }
    }
  }, [organization, isLoadingCookies]);

  // Fetch API Keys
  const fetchApiKeys = async () => {
    try {
      setIsLoadingKeys(true);

      const response = await fetch(
        `${config.BACKEND_URL}/v1/apikeys`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching API keys: ${response.status}`);
      }

      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      showNotification(
        `Failed to load API keys: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Create API Key
  const createApiKey = async () => {
    if (!newKeyLabel.trim()) {
      showNotification("API key label is required", "error");
      return;
    }

    try {
      setIsCreatingKey(true);

      const response = await fetch(
        `${config.BACKEND_URL}/v1/apikeys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            label: newKeyLabel,
            scopes: ["send_gift"], // Default scope
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating API key: ${response.status}`);
      }

      const data = await response.json();

      // Close modal and reset form
      setShowCreateKeyModal(false);
      setNewKeyLabel("");

      // Refresh the list and automatically show the new key
      await fetchApiKeys();

      // Set visibility for the new key
      if (data.data && data.data._id) {
        setVisibleKeyIds((prev) => ({
          ...prev,
          [data.data._id]: true,
        }));

        // Copy to clipboard
        if (data.data.key) {
          //navigator.clipboard.writeText(data.data.key);
          showNotification(
            "API key created and copied to clipboard",
            "success"
          );
        } else {
          showNotification("API key created successfully", "success");
        }
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      showNotification(
        `Failed to create API key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (key: any) => {
    setDeletingKey(key);
    setShowDeleteModal(true);
  };

  // Revoke API Key
  const revokeApiKey = async () => {
    if (!deletingKey) return;

    try {
      setIsRevoking(true);

      const response = await fetch(
        `${config.BACKEND_URL}/v1/apikeys/${deletingKey._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            revoked: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error revoking API key: ${response.status}`);
      }

      // Close modal
      setShowDeleteModal(false);
      setDeletingKey(null);

      // Refresh the list
      fetchApiKeys();

      showNotification("API key revoked successfully", "success");
    } catch (error) {
      console.error("Error revoking API key:", error);
      showNotification(
        `Failed to revoke API key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsRevoking(false);
    }
  };

  // Load API keys when page loads
  useEffect(() => {
    if (!isLoadingCookies && authToken) {
      fetchApiKeys();
    }
  }, [authToken, isLoadingCookies]);

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (handleCheckTimeout) {
        clearTimeout(handleCheckTimeout);
      }
    };
  }, [handleCheckTimeout]);

  // Validate form when editing starts
  useEffect(() => {
    if (userProfile) {
      validateForm();
    }
  }, [userProfile]);

  // Open Edit API Key Modal
  const openEditKeyModal = (key: any) => {
    setEditingKey(key);
    setEditKeyLabel(key.label);
    setShowEditKeyModal(true);
  };

  // Update API Key
  const updateApiKey = async () => {
    if (!editingKey || !editKeyLabel.trim()) {
      showNotification("API key label is required", "error");
      return;
    }

    try {
      setIsUpdatingKey(true);

      const response = await fetch(
        `${config.BACKEND_URL}/v1/apikeys/${editingKey._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            label: editKeyLabel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating API key: ${response.status}`);
      }

      // Close modal
      setShowEditKeyModal(false);
      setEditingKey(null);

      // Refresh the list
      fetchApiKeys();

      showNotification("API key updated successfully", "success");
    } catch (error) {
      console.error("Error updating API key:", error);
      showNotification(
        `Failed to update API key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsUpdatingKey(false);
    }
  };

  // Helper function to check if user is delightloop admin
  const isDelightloopAdmin = () => {
    return userProfile?.email?.endsWith("@delightloop.com") || false;
  };

  // New functions for admin vCard management
  const fetchAllVCards = async () => {
    if (!authToken || !isDelightloopAdmin()) return;

    setAdminVCardLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/vcard/admin/all`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdminVCards(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching admin vCards:", error);
      showNotification("Failed to fetch vCards", "error");
    } finally {
      setAdminVCardLoading(false);
    }
  };

  const createAdminVCard = async () => {
    if (!authToken || !isDelightloopAdmin()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/vcard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(adminVCardForm),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification("VCard created successfully", "success");
          setShowAdminVCardModal(false);
          resetAdminVCardForm();
          fetchAllVCards();
        }
      } else {
        const errorData = await response.json();
        showNotification(
          errorData.error_message || "Failed to create vCard",
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating vCard:", error);
      showNotification("Failed to create vCard", "error");
    }
  };

  const updateAdminVCard = async () => {
    if (!authToken || !isDelightloopAdmin() || !editingAdminVCard?._id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/vcard/${editingAdminVCard._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(adminVCardForm),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification("VCard updated successfully", "success");
          setShowAdminVCardModal(false);
          setEditingAdminVCard(null);
          resetAdminVCardForm();
          fetchAllVCards();
        }
      } else {
        const errorData = await response.json();
        showNotification(
          errorData.error_message || "Failed to update vCard",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating vCard:", error);
      showNotification("Failed to update vCard", "error");
    }
  };

  const deleteAdminVCard = async (vCardId: string) => {
    if (!authToken || !isDelightloopAdmin()) return;

    if (!confirm("Are you sure you want to delete this vCard?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/vcard/${vCardId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        showNotification("VCard deleted successfully", "success");
        fetchAllVCards();
      } else {
        const errorData = await response.json();
        showNotification(
          errorData.error_message || "Failed to delete vCard",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting vCard:", error);
      showNotification("Failed to delete vCard", "error");
    }
  };

  const resetAdminVCardForm = () => {
    setAdminVCardForm({
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
      alert: undefined,
      nfcEnabled: true,
      isActive: true,
    });
  };

  const openEditAdminVCard = (vcard: AdminVCard) => {
    setEditingAdminVCard(vcard);
    setAdminVCardForm({
      _id: vcard._id,
      handle: vcard.handle,
      fullName: vcard.fullName || "",
      title: vcard.title || "",
      company: vcard.company || "",
      companyLogoUrl: vcard.companyLogoUrl || "",
      avatarUrl: vcard.avatarUrl || "",
      coverImageUrl: vcard.coverImageUrl || "",
      theme: vcard.theme,
      links: vcard.links || [],
      note: vcard.note || {
        value: "",
        isVisible: true,
        lastUpdated: new Date(),
      },
      alert: vcard.alert || undefined,
      nfcEnabled: vcard.nfcEnabled || true,
      isActive: vcard.isActive,
    });
    setShowAdminVCardModal(true);
  };

  const openCreateAdminVCard = () => {
    setEditingAdminVCard(null);
    resetAdminVCardForm();
    setShowAdminVCardModal(true);
  };

  const handleAdminVCardFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setAdminVCardForm({
      ...adminVCardForm,
      [name]: value,
    });
  };

  const filteredAdminVCards = adminVCards.filter(
    (vcard) =>
      vcard.handle.toLowerCase().includes(adminVCardSearch.toLowerCase()) ||
      vcard.fullName?.toLowerCase().includes(adminVCardSearch.toLowerCase()) ||
      vcard.user?.email?.toLowerCase().includes(adminVCardSearch.toLowerCase())
  );

  // Load admin VCards when tab becomes active
  useEffect(() => {
    if (
      activeTab === "manage-vcard" &&
      isDelightloopAdmin() &&
      adminVCards.length === 0
    ) {
      fetchAllVCards();
    }
  }, [activeTab]);

  // Admin VCard link management functions
  const addAdminLink = () => {
    if (!adminNewLink.type || !adminNewLink.value) return;

    const newLinks = [...(adminVCardForm.links || [])];

    if (editingAdminLinkIndex !== null) {
      // Update existing link
      newLinks[editingAdminLinkIndex] = {
        type: adminNewLink.type,
        value: adminNewLink.value,
        isVisible: adminNewLink.isVisible,
        lastUpdated: new Date(),
        iconType: adminNewLink.iconType || adminNewLink.type,
      };
    } else {
      // Add new link
      newLinks.push({
        type: adminNewLink.type,
        value: adminNewLink.value,
        isVisible: adminNewLink.isVisible,
        lastUpdated: new Date(),
        iconType: adminNewLink.iconType || adminNewLink.type,
      });
    }

    setAdminVCardForm({
      ...adminVCardForm,
      links: newLinks,
    });

    // Reset modal state
    setShowAdminAddLinkModal(false);
    setAdminNewLink({
      type: "",
      value: "",
      isVisible: true,
      iconType: "",
    });
    setIsCustomAdminLinkType(false);
    setEditingAdminLinkIndex(null);
  };

  const removeAdminLink = (index: number) => {
    const newLinks = adminVCardForm.links.filter((_, i) => i !== index);
    setAdminVCardForm({
      ...adminVCardForm,
      links: newLinks,
    });
  };

  const openEditAdminLinkModal = (index: number) => {
    const link = adminVCardForm.links[index];
    setAdminNewLink({
      type: link.type,
      value: link.value,
      isVisible: link.isVisible,
      iconType: link.iconType || link.type,
    });
    setEditingAdminLinkIndex(index);
    setIsCustomAdminLinkType(
      !SOCIAL_MEDIA_OPTIONS.find((option) => option.type === link.iconType)
    );
    setShowAdminAddLinkModal(true);
  };

  const toggleAdminLinkVisibility = (index: number) => {
    const newLinks = [...adminVCardForm.links];
    newLinks[index] = {
      ...newLinks[index],
      isVisible: !newLinks[index].isVisible,
      lastUpdated: new Date(),
    };
    setAdminVCardForm({
      ...adminVCardForm,
      links: newLinks,
    });
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 sm:pt-3 bg-primary w-full overflow-x-hidden">
        {isLoading ? (
          <div className="min-h-[100vh] rounded-tl-3xl bg-white p-4 sm:p-6 lg:p-8">
            {/* Simple Skeleton Loading */}
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="space-y-3">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-72 bg-gray-200 rounded"></div>
              </div>

              {/* Content Skeleton */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-10 w-full bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-10 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : error || !userProfile || !organization ? (
          <div className="min-h-screen bg-primary-xlight p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
            <p className="text-red-500 text-center p-4 text-sm sm:text-base">
              {error || "Unable to load profile data"}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-4 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto pb-20 sm:pb-0">
            <PageHeader
              backLink={{
                href: "/dashboard",
                text: "Dashboard",
              }}
              title="Profile"
              description="Manage your personal and organization settings"
              primaryButton={{
                text: isSaving
                  ? "Saving..."
                  : isCheckingHandle
                  ? "Checking handle..."
                  : "Save Changes",
                onClick: handleSave,
                variant: "primary",
              }}
              showDivider={true}
            />

            {/* //! ----- tabs -------  */}
            <div className="border-b border-[#F2F4F7] mb-4 sm:mb-6 overflow-x-auto">
              <div className="flex space-x-4 sm:space-x-6 lg:space-x-8 min-w-max px-1">
                <button
                  onClick={() => {
                    setActiveTab("personal-info");
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "personal-info"
                      ? "border-[#7F56D9] text-[#7F56D9]"
                      : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                  }`}
                >
                  My details
                </button>
                {/* <button
                  onClick={() => {
                    setActiveTab("v-card");
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "v-card"
                      ? "border-[#7F56D9] text-[#7F56D9]"
                      : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                  }`}
                >
                  V-Card
                </button> */}
                <button
                  onClick={() => {
                    setActiveTab("organization-info");
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "organization-info"
                      ? "border-[#7F56D9] text-[#7F56D9]"
                      : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                  }`}
                >
                  Organization
                </button>
                <button
                  onClick={() => {
                    setActiveTab("account-security");
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "account-security"
                      ? "border-[#7F56D9] text-[#7F56D9]"
                      : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => {
                    setActiveTab("api");
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "api"
                      ? "border-[#7F56D9] text-[#7F56D9]"
                      : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                  }`}
                >
                  API Keys
                </button>
                {isDelightloopAdmin() && (
                  <button
                    onClick={() => {
                      setActiveTab("manage-vcard");
                    }}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === "manage-vcard"
                        ? "border-[#7F56D9] text-[#7F56D9]"
                        : "border-transparent text-[#667085] hover:text-[#7F56D9]"
                    }`}
                  >
                    Manage VCard
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2">
              {/* //! ---- tab content ------ */}
              <div className="flex-1">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                  <div className="">
                    {/* Personal Information */}

                    {/* Basic Information Box */}
                    {activeTab === "personal-info" && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                          <h4 className="text-base font-medium text-gray-800 flex items-center gap-2">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Basic Information
                          </h4>
                          <p className="text-xs text-gray-500">
                            <span className="text-red-500">*</span> Required
                            fields
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={userProfile.firstName}
                                  onChange={handleUserChange}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                                    validationErrors.firstName
                                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                      : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                  }`}
                                  placeholder="Enter your first name"
                                />
                                {validationErrors.firstName && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <svg
                                      className="w-4 h-4 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="break-words">
                                      {validationErrors.firstName}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={userProfile.lastName}
                                  onChange={handleUserChange}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                                    validationErrors.lastName
                                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                      : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                  }`}
                                  placeholder="Enter your last name"
                                />
                                {validationErrors.lastName && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <svg
                                      className="w-4 h-4 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="break-words">
                                      {validationErrors.lastName}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900">
                                {userProfile.email}
                              </p>
                              {userProfile.emailVerified ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  Not verified
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <div>
                              <input
                                type="tel"
                                name="mobile"
                                value={userProfile.mobile || ""}
                                onChange={handleUserChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                  validationErrors.mobile
                                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                }`}
                                placeholder="Enter phone number"
                              />
                              {validationErrors.mobile && (
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
                                  {validationErrors.mobile}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Location Information
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  State
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  value={userProfile.state || ""}
                                  onChange={handleUserChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                                  placeholder="State"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Country
                                </label>
                                <input
                                  type="text"
                                  name="country"
                                  value={userProfile.country || ""}
                                  onChange={handleUserChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                                  placeholder="Country"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === "v-card" && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1 lg:w-[60%]">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-base font-medium text-gray-800 flex items-center gap-2">
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
                                Public Profile Card{" "}
                                {/* <Link
                                  href={`/vcard/${userProfile?.publicProfileCard?.handle}`}
                                  className="text-xs underline ml-3 text-gray-500 hover:text-gray-700"
                                >
                                  View
                                </Link> */}
                              </h4>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UserName
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
                                            : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
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
                                  <div>
                                    <input
                                      type="text"
                                      name="fullName"
                                      value={vCard?.fullName || ""}
                                      onChange={handleVCardChange}
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        validationErrors.fullName
                                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                      }`}
                                      placeholder="Full Name"
                                    />
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
                                  <div>
                                    <input
                                      type="text"
                                      name="title"
                                      value={vCard?.title || ""}
                                      onChange={handleVCardChange}
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                                        validationErrors.title
                                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                      }`}
                                      placeholder="Job Title"
                                    />
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
                                  <div>
                                    <input
                                      type="text"
                                      name="company"
                                      value={vCard?.company || ""}
                                      onChange={handleVCardChange}
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        validationErrors.company
                                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                      }`}
                                      placeholder="Company Name"
                                    />
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

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Company Logo URL
                                </label>
                                <div>
                                  <input
                                    type="url"
                                    name="companyLogoUrl"
                                    value={vCard?.companyLogoUrl || ""}
                                    onChange={handleVCardChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                      validationErrors.companyLogoUrl
                                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                        : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                    }`}
                                    placeholder="https://example.com/logo.png"
                                  />
                                  {validationErrors.companyLogoUrl && (
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
                                      {validationErrors.companyLogoUrl}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Avatar URL
                                  </label>
                                  <div>
                                    <input
                                      type="url"
                                      name="avatarUrl"
                                      value={vCard?.avatarUrl || ""}
                                      onChange={handleVCardChange}
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                                        validationErrors.avatarUrl
                                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                      }`}
                                      placeholder="https://example.com/avatar.png"
                                    />
                                    {validationErrors.avatarUrl && (
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
                                        {validationErrors.avatarUrl}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cover Image URL
                                  </label>
                                  <div>
                                    <input
                                      type="url"
                                      name="coverImageUrl"
                                      value={vCard?.coverImageUrl || ""}
                                      onChange={handleVCardChange}
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        validationErrors.coverImageUrl
                                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                      }`}
                                      placeholder="https://example.com/cover.png"
                                    />
                                    {validationErrors.coverImageUrl && (
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
                                        {validationErrors.coverImageUrl}
                                      </p>
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                  <option value="classic-purple">
                                    Classic Purple
                                  </option>
                                  <option value="modern-blue">
                                    Modern Blue
                                  </option>
                                  <option value="elegant-black">
                                    Elegant Black
                                  </option>
                                  <option value="vibrant-red">
                                    Vibrant Red
                                  </option>
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
                                            (option) =>
                                              option.type === link.iconType
                                          )?.icon) ||
                                          // Fallback for existing links without iconType
                                          SOCIAL_MEDIA_OPTIONS.find(
                                            (option) =>
                                              option.type === link.type
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
                                          {link.isVisible
                                            ? "Public"
                                            : "Private"}
                                        </span>
                                        <button
                                          onClick={() =>
                                            toggleLinkVisibility(index)
                                          }
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
                                          onClick={() =>
                                            openEditLinkModal(index)
                                          }
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
                                {/* Alert Display Section */}
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
                                                vCard.alert.text.startsWith(
                                                  "http"
                                                )
                                                  ? vCard.alert.text
                                                  : `https://${vCard.alert.text}`
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm text-gray-700 hover:text-indigo-800 underline break-words"
                                            >
                                              {vCard.alert.linkName ||
                                                vCard.alert.text}
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="w-[80%] mx-auto lg:w-[40%] lg:mx-0">
                            <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
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
                              Mobile Preview
                            </h2>

                            {/* Mobile Phone Frame */}
                            <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] h-[500px] sm:h-[550px] bg-black rounded-[2.5rem] p-2">
                              <div className="w-full h-full bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] rounded-[2rem] overflow-hidden">
                                <div className="max-w-md mx-auto h-full">
                                  {/* Profile Card Preview */}
                                  <div className="bg-white h-full shadow-lg overflow-hidden">
                                    {/* Cover Image */}
                                    <div
                                      className={`h-24 pt-2  bg-gradient-to-r ${
                                        getThemeColors(
                                          vCard?.theme || "classic-purple"
                                        ).gradient
                                      } relative`}
                                    >
                                      {/* Alert Display in Mobile Preview */}
                                      {vCard?.alert &&
                                        vCard.alert.text &&
                                        !isAlertExpired(
                                          vCard.alert.expiryDate
                                        ) && (
                                          <div className="mx-auto mb-3 p-2 bg-white/50 z-10 relative backdrop-blur-md   rounded-xl w-fit">
                                            <div className="flex items-start gap-3">
                                              {vCard.alert.icon && (
                                                <div className="flex-shrink-0 text-white ">
                                                  <div className="w-3 h-3">
                                                    {getAlertIcon(
                                                      vCard.alert.icon
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                              <div className="flex-1 min-w-0">
                                                {vCard.alert.type === "link" ? (
                                                  <a
                                                    href={
                                                      vCard.alert.text.startsWith(
                                                        "http"
                                                      )
                                                        ? vCard.alert.text
                                                        : `https://${vCard.alert.text}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-white hover:text-gray-500 underline break-words block"
                                                  >
                                                    {vCard.alert.linkName ||
                                                      vCard.alert.text}
                                                  </a>
                                                ) : (
                                                  <p className="text-xs text-white break-words">
                                                    {vCard.alert.text}
                                                  </p>
                                                )}
                                              </div>
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
                                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-lg overflow-hidden">
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
                                              {vCard?.fullName
                                                ?.charAt(0)
                                                .toUpperCase() || "U"}
                                            </div>
                                          )}
                                        </div>
                                        {vCard?.companyLogoUrl && (
                                          <div
                                            className={`absolute -bottom-1 -right-1 w-4 h-4  bg-white rounded-full border-2 border-white flex items-center justify-center overflow-hidden`}
                                          >
                                            <Image
                                              src={vCard?.companyLogoUrl || ""}
                                              alt={vCard?.company || ""}
                                              width={16}
                                              height={16}
                                              className="w-full h-full object-contain"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="pt-8 pb-4 px-3 text-center">
                                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                        {vCard?.fullName || "Your Name"}
                                      </h3>
                                      {vCard?.title && (
                                        <p
                                          className={`${
                                            getThemeColors(
                                              vCard?.theme || "classic-purple"
                                            ).text
                                          } font-medium mb-0.5 text-xs`}
                                        >
                                          {vCard.title}
                                        </p>
                                      )}
                                      {vCard?.company && (
                                        <p className="text-gray-600 mb-2 text-xs">
                                          {vCard.company}
                                        </p>
                                      )}

                                      {/* Note */}
                                      {vCard?.note?.isVisible &&
                                        vCard.note.value && (
                                          <div className="bg-gray-50 rounded-lg p-2 mb-3 text-left">
                                            <p className="text-gray-700 text-xs">
                                              {vCard.note.value}
                                            </p>
                                          </div>
                                        )}

                                      {/* Save Contact Button */}
                                      <div
                                        className={`w-full ${
                                          getThemeColors(
                                            vCard?.theme || "classic-purple"
                                          ).accent
                                        } text-white font-medium py-2 rounded-full mb-4 text-xs cursor-pointer flex items-center justify-center`}
                                      >
                                        Save Contact
                                      </div>

                                      {/* Social Links */}
                                      {vCard?.links &&
                                        vCard.links.length > 0 && (
                                          <div className="max-h-72 overflow-y-auto space-y-2 pb-4 p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            {vCard.links
                                              .filter((link) => link.isVisible)
                                              .map((link, index) => (
                                                <div
                                                  key={index}
                                                  className="w-full flex items-center gap-2 p-2 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-300 hover:shadow-[0_2px_8px_rgb(0,0,0,0.15)] rounded-lg cursor-pointer transition-all"
                                                >
                                                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                    {getSocialIcon(link)}
                                                  </div>
                                                  <div className="flex-1 text-left">
                                                    <div className="font-semibold text-gray-900 text-xs">
                                                      {getSocialLabel(
                                                        link.type
                                                      )}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                      {getSocialDescription(
                                                        link
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            <div className="text-gray-500  px-4 py-2 shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-2xl font-medium bg-white flex justify-center w-fit mx-auto text-xs">
                                              Create Your Own Card
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "organization-info" && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
                        <h4 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
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
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          Organization Information
                        </h4>
                        <div className="space-y-4">
                          {/* Organization Logo */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                            <div className="relative w-32 h-20 bg-white border border-gray-200 rounded-lg overflow-hidden mx-auto sm:mx-0 flex-shrink-0">
                              {organization?.branding?.logo_url ? (
                                <Image
                                  src={organization.branding.logo_url}
                                  alt="Organization Logo"
                                  fill
                                  className="object-contain p-2"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 sm:h-10 w-8 sm:w-10"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 w-full sm:w-auto">
                              {userProfile.roles.includes("admin") && (
                                <div className="space-y-2">
                                  <input
                                    type="url"
                                    value={logoUrlInput}
                                    onChange={handleLogoUrlChange}
                                    placeholder="https://example.com/logo.png"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                      validationErrors.orgLogoUrl
                                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                        : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                    }`}
                                  />
                                  {validationErrors.orgLogoUrl && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
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
                                      {validationErrors.orgLogoUrl}
                                    </p>
                                  )}
                                  {logoUrlInput && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <div className="w-12 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                        <Image
                                          src={logoUrlInput}
                                          alt="Logo preview"
                                          width={48}
                                          height={32}
                                          className="object-contain p-1"
                                        />
                                      </div>
                                      <span>Logo preview</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Organization Name{" "}
                              {userProfile.roles.includes("admin") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            {userProfile.roles.includes("admin") ? (
                              <div>
                                <input
                                  type="text"
                                  name="name"
                                  value={organization.name}
                                  onChange={handleOrgChange}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                    validationErrors.orgName
                                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                      : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                  }`}
                                  placeholder="Enter organization name"
                                />
                                {validationErrors.orgName && (
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
                                    {validationErrors.orgName}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-900">
                                {organization.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Domain{" "}
                              {userProfile.roles.includes("admin") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            {userProfile.roles.includes("admin") ? (
                              <div>
                                <input
                                  type="text"
                                  name="domain"
                                  value={organization.domain}
                                  onChange={handleOrgChange}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                    validationErrors.orgDomain
                                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                      : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
                                  }`}
                                  placeholder="example.com"
                                />
                                {validationErrors.orgDomain && (
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
                                    {validationErrors.orgDomain}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-900">
                                {organization.domain}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <p className="text-gray-900">{userProfile.role}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {userProfile.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Security */}
                    {activeTab === "account-security" && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
                        <div className="space-y-4">
                          {!isChangingPassword ? (
                            <button
                              onClick={() => setIsChangingPassword(true)}
                              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center sm:justify-start gap-2 transition-colors text-sm sm:text-base"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="flex-shrink-0"
                              >
                                <path
                                  d="M15.8333 9.16667H4.16667C3.72464 9.16667 3.30072 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5.83331 9.16667V5.83334C5.83331 4.72827 6.27229 3.66846 7.05372 2.88704C7.83514 2.10561 8.89495 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10561 12.9463 2.88704C13.7277 3.66846 14.1666 4.72827 14.1666 5.83334V9.16667"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Change Password
                            </button>
                          ) : (
                            <form
                              onSubmit={handlePasswordSubmit}
                              className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50"
                            >
                              <h4 className="font-medium mb-3">
                                Change Password
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showPassword ? "text" : "password"}
                                      name="currentPassword"
                                      value={passwordData.currentPassword}
                                      onChange={handlePasswordChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                      required
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                      onClick={() =>
                                        setShowPassword(!showPassword)
                                      }
                                    >
                                      {showPassword ? "Hide" : "Show"}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                  </label>
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                  </label>
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsChangingPassword(false)}
                                  className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:border-gray-400"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70 transition-all duration-300"
                                  disabled={isSaving}
                                >
                                  {isSaving ? "Saving..." : "Update Password"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                    {/* API Keys Section */}
                    {activeTab === "api" &&
                      !isLoading &&
                      !error &&
                      userProfile &&
                      organization && (
                        <div className=" bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                              API Keys
                            </h3>
                            <Button
                              onClick={() => setShowCreateKeyModal(true)}
                              variant="secondary"
                              className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
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
                              <span className="hidden sm:inline">
                                Create API Key
                              </span>
                              <span className="sm:hidden">Create Key</span>
                            </Button>
                          </div>

                          {/* Create API Key Modal */}
                          {showCreateKeyModal && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    Create New API Key
                                  </h3>
                                  <button
                                    onClick={() => setShowCreateKeyModal(false)}
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

                                <div className="px-6 py-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label
                                  </label>
                                  <input
                                    id="newKeyInput"
                                    type="text"
                                    value={newKeyLabel}
                                    onChange={(e) =>
                                      setNewKeyLabel(e.target.value)
                                    }
                                    placeholder="e.g., Production API Key"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                  <p className="mt-2 text-sm text-gray-500">
                                    Give your API key a name to help you
                                    identify it later.
                                  </p>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
                                  <button
                                    onClick={() => setShowCreateKeyModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={createApiKey}
                                    disabled={
                                      isCreatingKey || !newKeyLabel.trim()
                                    }
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                                  >
                                    {isCreatingKey ? (
                                      <>
                                        <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                        Creating...
                                      </>
                                    ) : (
                                      "Create"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Edit API Key Modal */}
                          {showEditKeyModal && editingKey && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    Edit API Key
                                  </h3>
                                  <button
                                    onClick={() => setShowEditKeyModal(false)}
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

                                <div className="px-6 py-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editKeyLabel}
                                    onChange={(e) =>
                                      setEditKeyLabel(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
                                  <button
                                    onClick={() => setShowEditKeyModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={updateApiKey}
                                    disabled={
                                      isUpdatingKey || !editKeyLabel.trim()
                                    }
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                                  >
                                    {isUpdatingKey ? (
                                      <>
                                        <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                        Updating...
                                      </>
                                    ) : (
                                      "Save Changes"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delete Confirmation Modal */}
                          {showDeleteModal && deletingKey && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    Revoke API Key
                                  </h3>
                                  <button
                                    onClick={() => setShowDeleteModal(false)}
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

                                <div className="px-6 py-4">
                                  <p className="text-sm text-gray-700">
                                    Are you sure you want to revoke the API key{" "}
                                    <span className="font-semibold">
                                      {deletingKey.label}
                                    </span>
                                    ? This action cannot be undone.
                                  </p>
                                  <p className="mt-3 text-sm text-red-500 flex items-start gap-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 flex-shrink-0"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Revoking this key will immediately
                                    invalidate it and any services using it will
                                    stop working.
                                  </p>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
                                  <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={revokeApiKey}
                                    disabled={isRevoking}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                                  >
                                    {isRevoking ? (
                                      <>
                                        <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                        Revoking...
                                      </>
                                    ) : (
                                      "Revoke Key"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Desktop view - Table */}
                          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg transition-all duration-300 hover:border-gray-300">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Label
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Key Hash
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Created
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Last Used
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Status
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingKeys ? (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                      <div className="flex justify-center">
                                        <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                                        <span className="ml-3 font-medium">
                                          Loading API keys...
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ) : apiKeys.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                      <div className="text-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-10 w-10 mx-auto text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                          />
                                        </svg>
                                        <p className="mt-2 font-medium">
                                          No API keys found
                                        </p>
                                        <p className="mt-1">
                                          Create your first API key to get
                                          started.
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  apiKeys.map((key) => (
                                    <tr
                                      key={key._id}
                                      className="hover:bg-gray-50 transition-colors duration-200"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {key.label}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 font-mono max-w-xs">
                                        <div className="flex items-start gap-2">
                                          <p
                                            className={`text-xs ${
                                              visibleKeyIds[key._id]
                                                ? "break-all whitespace-normal"
                                                : "truncate"
                                            }`}
                                          >
                                            {visibleKeyIds[key._id]
                                              ? key.keyHash
                                              : key.keyHash
                                              ? `${key.keyHash.substring(
                                                  0,
                                                  16
                                                )}...`
                                              : "—"}
                                          </p>
                                          {key.keyHash && (
                                            <button
                                              onClick={() =>
                                                toggleKeyVisibility(key._id)
                                              }
                                              className="text-gray-400 hover:text-indigo-600 focus:outline-none flex-shrink-0 mt-0.5"
                                              title={
                                                visibleKeyIds[key._id]
                                                  ? "Hide key"
                                                  : "Show full key"
                                              }
                                            >
                                              {visibleKeyIds[key._id] ? (
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
                                                    strokeWidth="2"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                                                    strokeWidth="2"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                  />
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                  />
                                                </svg>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(
                                          key.createdAt
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {key.lastUsedAt
                                          ? new Date(
                                              key.lastUsedAt
                                            ).toLocaleDateString()
                                          : "Never"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            key.revoked
                                              ? "bg-red-100 text-red-800"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {key.revoked ? "Revoked" : "Active"}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center space-x-3">
                                        {!key.revoked && (
                                          <>
                                            <button
                                              title="Edit"
                                              className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                              onClick={() =>
                                                openEditKeyModal(key)
                                              }
                                            >
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
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                              </svg>
                                            </button>
                                            <button
                                              title="Revoke"
                                              className="text-red-600 hover:text-red-900 focus:outline-none"
                                              onClick={() =>
                                                openDeleteModal(key)
                                              }
                                            >
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
                                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                />
                                              </svg>
                                            </button>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile view - Card format */}
                          <div className="md:hidden">
                            {isLoadingKeys ? (
                              <div className="flex justify-center items-center py-8">
                                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                                <span className="ml-3 font-medium text-gray-500">
                                  Loading API keys...
                                </span>
                              </div>
                            ) : apiKeys.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-10 w-10 mx-auto text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                  />
                                </svg>
                                <p className="mt-2 font-medium text-gray-800">
                                  No API keys found
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                  Create your first API key to get started.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {apiKeys.map((key) => (
                                  <div
                                    key={key._id}
                                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300"
                                  >
                                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                      <h4 className="font-medium text-gray-900 flex items-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-5 w-5 text-gray-500 mr-2"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                          />
                                        </svg>
                                        {key.label}
                                      </h4>
                                      <span
                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          key.revoked
                                            ? "bg-red-100 text-red-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {key.revoked ? "Revoked" : "Active"}
                                      </span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                          Key Hash
                                        </p>
                                        <div className="flex items-start gap-2">
                                          <p
                                            className={`text-xs font-mono text-gray-700 ${
                                              visibleKeyIds[key._id]
                                                ? "break-all whitespace-normal"
                                                : "truncate"
                                            }`}
                                          >
                                            {visibleKeyIds[key._id]
                                              ? key.keyHash
                                              : key.keyHash
                                              ? `${key.keyHash.substring(
                                                  0,
                                                  16
                                                )}...`
                                              : "—"}
                                          </p>
                                          {key.keyHash && (
                                            <button
                                              onClick={() =>
                                                toggleKeyVisibility(key._id)
                                              }
                                              className="text-gray-400 hover:text-indigo-600 focus:outline-none flex-shrink-0 mt-0.5"
                                            >
                                              {visibleKeyIds[key._id] ? (
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
                                                    strokeWidth="2"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                                                    strokeWidth="2"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                  />
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                  />
                                                </svg>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">
                                            Created
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            {new Date(
                                              key.createdAt
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">
                                            Last Used
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            {key.lastUsedAt
                                              ? new Date(
                                                  key.lastUsedAt
                                                ).toLocaleDateString()
                                              : "Never"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {!key.revoked && (
                                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                                        <button
                                          className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm focus:outline-none"
                                          onClick={() => openEditKeyModal(key)}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                          Edit
                                        </button>
                                        <button
                                          className="text-red-600 hover:text-red-900 flex items-center text-sm focus:outline-none"
                                          onClick={() => openDeleteModal(key)}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                            />
                                          </svg>
                                          Revoke
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Manage VCard Section - Admin Only */}
                    {activeTab === "manage-vcard" &&
                      isDelightloopAdmin() &&
                      !isLoading &&
                      !error &&
                      userProfile &&
                      organization && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                              Manage VCards
                            </h3>
                            <Button
                              onClick={openCreateAdminVCard}
                              variant="secondary"
                              className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
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
                              <span className="hidden sm:inline">
                                Create VCard
                              </span>
                              <span className="sm:hidden">Create</span>
                            </Button>
                          </div>

                          {/* Search Bar */}
                          <div className="mb-4">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                              </div>
                              <input
                                type="text"
                                value={adminVCardSearch}
                                onChange={(e) =>
                                  setAdminVCardSearch(e.target.value)
                                }
                                placeholder="Search by handle, name, or user email..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* VCards List */}
                          {adminVCardLoading ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                            </div>
                          ) : filteredAdminVCards.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
                                />
                              </svg>
                              {adminVCardSearch
                                ? "No VCards found matching your search."
                                : "No VCards created yet."}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredAdminVCards.map((vcard) => (
                                <div
                                  key={vcard._id}
                                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300"
                                >
                                  {/* Card Header */}
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                      {vcard.fullName
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                        vcard.handle.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 truncate">
                                        @{vcard.handle}
                                      </h4>
                                      <div className="flex gap-2 mt-1">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            vcard.isActive
                                              ? "bg-green-100 text-green-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {vcard.isActive
                                            ? "Active"
                                            : "Inactive"}
                                        </span>
                                        {vcard.nfcEnabled && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                            NFC
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Content */}
                                  <div className="space-y-3 mb-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {vcard.fullName || "No name set"}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {vcard.title || "No title set"}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                      </svg>
                                      <p className="text-sm text-gray-600 truncate">
                                        {vcard.company || "No company"}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z"
                                        />
                                      </svg>
                                      <p className="text-sm text-gray-600 capitalize">
                                        {vcard.theme}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                        />
                                      </svg>
                                      <p className="text-sm text-gray-600">
                                        {vcard.links?.length || 0} links
                                      </p>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100">
                                      <p className="text-xs text-gray-500 truncate">
                                        <strong>Owner:</strong>{" "}
                                        {vcard.user?.firstName}{" "}
                                        {vcard.user?.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {vcard.user?.email}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Card Actions */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `${window.location.origin}/vcard/${vcard.handle}`,
                                          "_blank"
                                        )
                                      }
                                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                      title="View VCard"
                                    >
                                      <svg
                                        className="h-4 w-4"
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
                                      View
                                    </button>
                                    <button
                                      onClick={() => openEditAdminVCard(vcard)}
                                      className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                                      title="Edit VCard"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteAdminVCard(vcard._id!)
                                      }
                                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                      title="Delete VCard"
                                    >
                                      <svg
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
                          )}

                          {/* Admin VCard Modal */}
                          {showAdminVCardModal && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {editingAdminVCard
                                      ? "Edit VCard"
                                      : "Create New VCard"}
                                  </h3>
                                  <button
                                    onClick={() => {
                                      setShowAdminVCardModal(false);
                                      setEditingAdminVCard(null);
                                      resetAdminVCardForm();
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

                                <div className="px-6 py-4">
                                  <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Form Section */}
                                    <div className="flex-1 lg:w-[60%] space-y-4">
                                      {/* Basic Fields */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Handle
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </label>
                                          <input
                                            type="text"
                                            name="handle"
                                            value={adminVCardForm.handle}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="unique-handle"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                          </label>
                                          <input
                                            type="text"
                                            name="fullName"
                                            value={adminVCardForm.fullName}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="John Doe"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title
                                          </label>
                                          <input
                                            type="text"
                                            name="title"
                                            value={adminVCardForm.title}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="Software Engineer"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company
                                          </label>
                                          <input
                                            type="text"
                                            name="company"
                                            value={adminVCardForm.company}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="Delightloop"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Image URLs */}
                                      <div className="grid grid-cols-1 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Logo URL
                                          </label>
                                          <input
                                            type="url"
                                            name="companyLogoUrl"
                                            value={
                                              adminVCardForm.companyLogoUrl
                                            }
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="https://example.com/logo.png"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Avatar URL
                                          </label>
                                          <input
                                            type="url"
                                            name="avatarUrl"
                                            value={adminVCardForm.avatarUrl}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="https://example.com/avatar.jpg"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cover Image URL
                                          </label>
                                          <input
                                            type="url"
                                            name="coverImageUrl"
                                            value={adminVCardForm.coverImageUrl}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            placeholder="https://example.com/cover.jpg"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Theme and Settings */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Theme
                                          </label>
                                          <select
                                            name="theme"
                                            value={adminVCardForm.theme}
                                            onChange={
                                              handleAdminVCardFormChange
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          >
                                            <option value="classic-purple">
                                              Classic Purple
                                            </option>
                                            <option value="modern-blue">
                                              Modern Blue
                                            </option>
                                            <option value="elegant-black">
                                              Elegant Black
                                            </option>
                                            <option value="vibrant-red">
                                              Vibrant Red
                                            </option>
                                          </select>
                                        </div>
                                        <div className="flex items-end">
                                          <label className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              name="nfcEnabled"
                                              checked={
                                                adminVCardForm.nfcEnabled
                                              }
                                              onChange={(e) =>
                                                setAdminVCardForm({
                                                  ...adminVCardForm,
                                                  nfcEnabled: e.target.checked,
                                                })
                                              }
                                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                              NFC Enabled
                                            </span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Links Section */}
                                      <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <label className="block text-sm font-medium text-gray-700">
                                            Links
                                          </label>
                                          <button
                                            onClick={() =>
                                              setShowAdminAddLinkModal(true)
                                            }
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
                                          {adminVCardForm.links?.map(
                                            (link, index) => (
                                              <div
                                                key={index}
                                                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                                              >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  {(link.iconType &&
                                                    SOCIAL_MEDIA_OPTIONS.find(
                                                      (option) =>
                                                        option.type ===
                                                        link.iconType
                                                    )?.icon) ||
                                                    SOCIAL_MEDIA_OPTIONS.find(
                                                      (option) =>
                                                        option.type ===
                                                        link.type
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
                                                  <button
                                                    onClick={() =>
                                                      toggleAdminLinkVisibility(
                                                        index
                                                      )
                                                    }
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
                                                    onClick={() =>
                                                      openEditAdminLinkModal(
                                                        index
                                                      )
                                                    }
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
                                                    onClick={() =>
                                                      removeAdminLink(index)
                                                    }
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
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Note Section */}
                                      <div className="border-t border-gray-200 pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Note
                                        </label>
                                        <textarea
                                          name="note"
                                          value={adminVCardForm.note.value}
                                          onChange={(e) =>
                                            setAdminVCardForm({
                                              ...adminVCardForm,
                                              note: {
                                                ...adminVCardForm.note,
                                                value: e.target.value,
                                              },
                                            })
                                          }
                                          rows={3}
                                          placeholder="Add a note..."
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Mobile Preview Section */}
                                    <div className="w-[80%] mx-auto lg:w-[40%] lg:mx-0">
                                      <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
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
                                        Mobile Preview
                                      </h2>

                                      {/* Mobile Phone Frame */}
                                      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] h-[500px] sm:h-[550px] bg-black rounded-[2.5rem] p-2">
                                        <div className="w-full h-full bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF] rounded-[2rem] overflow-hidden">
                                          <div className="max-w-md mx-auto h-full">
                                            {/* Profile Card Preview */}
                                            <div className="bg-white h-full shadow-lg overflow-hidden">
                                              {/* Cover Image */}
                                              <div
                                                className={`h-24 bg-gradient-to-r ${
                                                  getThemeColors(
                                                    adminVCardForm.theme
                                                  ).gradient
                                                } relative`}
                                              >
                                                {adminVCardForm.coverImageUrl && (
                                                  <img
                                                    src={
                                                      adminVCardForm.coverImageUrl
                                                    }
                                                    alt="Cover"
                                                    className="w-full h-full object-cover"
                                                  />
                                                )}
                                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                                                  <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-lg overflow-hidden">
                                                    {adminVCardForm.avatarUrl ? (
                                                      <img
                                                        src={
                                                          adminVCardForm.avatarUrl
                                                        }
                                                        alt={
                                                          adminVCardForm.fullName ||
                                                          "Avatar"
                                                        }
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ) : (
                                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold ">
                                                        {adminVCardForm.fullName
                                                          ?.charAt(0)
                                                          .toUpperCase() || "U"}
                                                      </div>
                                                    )}
                                                  </div>
                                                  {adminVCardForm.companyLogoUrl && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                                                      <img
                                                        src={
                                                          adminVCardForm.companyLogoUrl
                                                        }
                                                        alt={
                                                          adminVCardForm.company ||
                                                          ""
                                                        }
                                                        className="w-full h-full object-cover"
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Content */}
                                              <div className="pt-8 px-4 text-center">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                  {adminVCardForm.fullName ||
                                                    "Your Name"}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-1">
                                                  {adminVCardForm.title ||
                                                    "Your Title"}
                                                </p>
                                                <p className="text-sm text-gray-500 mb-4">
                                                  {adminVCardForm.company ||
                                                    "Your Company"}
                                                </p>

                                                {/* Links Preview */}
                                                <div className="space-y-2">
                                                  {adminVCardForm.links
                                                    ?.filter(
                                                      (link) => link.isVisible
                                                    )
                                                    .slice(0, 3)
                                                    .map((link, index) => (
                                                      <div
                                                        key={index}
                                                        className={`flex items-center gap-3 p-2 rounded-lg ${
                                                          getThemeColors(
                                                            adminVCardForm.theme
                                                          ).linkBg
                                                        }`}
                                                      >
                                                        <div className="w-6 h-6 flex-shrink-0">
                                                          {(link.iconType &&
                                                            SOCIAL_MEDIA_OPTIONS.find(
                                                              (option) =>
                                                                option.type ===
                                                                link.iconType
                                                            )?.icon) ||
                                                            SOCIAL_MEDIA_OPTIONS.find(
                                                              (option) =>
                                                                option.type ===
                                                                link.type
                                                            )?.icon}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 truncate">
                                                          {link.type}
                                                        </span>
                                                      </div>
                                                    ))}
                                                </div>

                                                {/* Note Preview */}
                                                {adminVCardForm.note?.value && (
                                                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                    {adminVCardForm.note.value.slice(
                                                      0,
                                                      50
                                                    )}
                                                    {adminVCardForm.note.value
                                                      .length > 50 && "..."}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
                                  <button
                                    onClick={() => {
                                      setShowAdminVCardModal(false);
                                      setEditingAdminVCard(null);
                                      resetAdminVCardForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={
                                      editingAdminVCard
                                        ? updateAdminVCard
                                        : createAdminVCard
                                    }
                                    disabled={!adminVCardForm.handle.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                  >
                                    {editingAdminVCard
                                      ? "Update VCard"
                                      : "Create VCard"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Admin Add Link Modal */}
                          {showAdminAddLinkModal && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {editingAdminLinkIndex !== null
                                      ? "Edit Link"
                                      : "Add New Link"}
                                  </h3>
                                  <button
                                    onClick={() => {
                                      setShowAdminAddLinkModal(false);
                                      setAdminNewLink({
                                        type: "",
                                        value: "",
                                        isVisible: true,
                                        iconType: "",
                                      });
                                      setIsCustomAdminLinkType(false);
                                      setEditingAdminLinkIndex(null);
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

                                <div className="px-4 sm:px-6 py-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                    {SOCIAL_MEDIA_OPTIONS.filter(
                                      (option) =>
                                        !adminVCardForm.links?.some(
                                          (link) =>
                                            link.iconType === option.type
                                        )
                                    ).map((option) => (
                                      <button
                                        key={option.type}
                                        onClick={() => {
                                          const wasPhoneType =
                                            adminNewLink.iconType ===
                                              "WhatsApp" ||
                                            adminNewLink.iconType === "Phone";
                                          const isNewPhoneType =
                                            option.type === "WhatsApp" ||
                                            option.type === "Phone";

                                          setAdminNewLink({
                                            ...adminNewLink,
                                            type: option.type,
                                            iconType: option.type,
                                            value:
                                              wasPhoneType !== isNewPhoneType
                                                ? ""
                                                : adminNewLink.value,
                                          });
                                          setIsCustomAdminLinkType(false);
                                        }}
                                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                                          adminNewLink.iconType === option.type
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        }`}
                                      >
                                        <span className="text-current">
                                          {option.icon}
                                        </span>
                                        <span className="text-sm font-medium">
                                          {option.type}
                                        </span>
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => {
                                        setAdminNewLink({
                                          ...adminNewLink,
                                          type: "Custom",
                                          iconType: "",
                                        });
                                        setIsCustomAdminLinkType(true);
                                      }}
                                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                                        isCustomAdminLinkType
                                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
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
                                      <span className="text-sm font-medium">
                                        Custom
                                      </span>
                                    </button>
                                  </div>

                                  {(adminNewLink.type ||
                                    adminNewLink.iconType ||
                                    isCustomAdminLinkType) && (
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Link Title
                                      </label>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                          {(adminNewLink.iconType &&
                                            SOCIAL_MEDIA_OPTIONS.find(
                                              (option) =>
                                                option.type ===
                                                adminNewLink.iconType
                                            )?.icon) || (
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
                                          )}
                                        </div>
                                        <input
                                          type="text"
                                          value={adminNewLink.type}
                                          onChange={(e) => {
                                            setAdminNewLink({
                                              ...adminNewLink,
                                              type: e.target.value,
                                            });
                                          }}
                                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Link title"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {(adminNewLink.type ||
                                    adminNewLink.iconType) && (
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {adminNewLink.iconType === "Phone" ||
                                        adminNewLink.iconType === "WhatsApp"
                                          ? "Phone Number"
                                          : adminNewLink.iconType === "Email"
                                          ? "Email Address"
                                          : "URL"}
                                      </label>
                                      <input
                                        type={
                                          adminNewLink.iconType === "Email"
                                            ? "email"
                                            : adminNewLink.iconType ===
                                                "Phone" ||
                                              adminNewLink.iconType ===
                                                "WhatsApp"
                                            ? "tel"
                                            : "url"
                                        }
                                        value={adminNewLink.value}
                                        onChange={(e) => {
                                          setAdminNewLink({
                                            ...adminNewLink,
                                            value: e.target.value,
                                          });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={
                                          adminNewLink.iconType === "Email"
                                            ? "john@example.com"
                                            : adminNewLink.iconType === "Phone"
                                            ? "+1 (555) 123-4567"
                                            : adminNewLink.iconType ===
                                              "WhatsApp"
                                            ? "+1 (555) 123-4567"
                                            : "https://example.com"
                                        }
                                      />
                                    </div>
                                  )}

                                  {(adminNewLink.type ||
                                    adminNewLink.iconType) && (
                                    <div className="mb-4">
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={adminNewLink.isVisible}
                                          onChange={(e) => {
                                            setAdminNewLink({
                                              ...adminNewLink,
                                              isVisible: e.target.checked,
                                            });
                                          }}
                                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                          Make this link visible to visitors
                                        </span>
                                      </label>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
                                  <button
                                    onClick={() => {
                                      setShowAdminAddLinkModal(false);
                                      setAdminNewLink({
                                        type: "",
                                        value: "",
                                        isVisible: true,
                                        iconType: "",
                                      });
                                      setIsCustomAdminLinkType(false);
                                      setEditingAdminLinkIndex(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={addAdminLink}
                                    disabled={
                                      !adminNewLink.type || !adminNewLink.value
                                    }
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    {editingAdminLinkIndex !== null
                                      ? "Update Link"
                                      : "Add Link"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
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
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
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
                    iconType: "",
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

            <div className="px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {SOCIAL_MEDIA_OPTIONS.filter(
                  (option) =>
                    !vCard?.links?.some((link) => link.iconType === option.type)
                ).map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      const wasPhoneType =
                        newLink.iconType === "WhatsApp" ||
                        newLink.iconType === "Phone";
                      const isNewPhoneType =
                        option.type === "WhatsApp" || option.type === "Phone";

                      setNewLink({
                        ...newLink,
                        type: option.type,
                        iconType: option.type,
                        // Clear value if switching between phone and URL types
                        value:
                          wasPhoneType !== isNewPhoneType ? "" : newLink.value,
                      });
                      setIsCustomLinkType(false);
                      setValidationErrors({
                        ...validationErrors,
                        linkValue: undefined,
                      });
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      newLink.iconType === option.type
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="text-current">{option.icon}</span>
                    <span className="text-sm font-medium">{option.type}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setNewLink({ ...newLink, type: "Custom", iconType: "" });
                    setIsCustomLinkType(true);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    isCustomLinkType
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
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

              {(newLink.type || newLink.iconType || isCustomLinkType) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      {(newLink.iconType &&
                        SOCIAL_MEDIA_OPTIONS.find(
                          (option) => option.type === newLink.iconType
                        )?.icon) || (
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
                        // If user starts typing and it was Custom, keep isCustomLinkType true
                      }}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={
                        newLink.iconType
                          ? `e.g., My ${newLink.iconType}, Business ${newLink.iconType}, etc.`
                          : "e.g., My Link, Portfolio, Blog, etc."
                      }
                    />
                  </div>
                  {newLink.iconType && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>Using</span>
                        <span className="font-medium text-gray-700">
                          {newLink.iconType}
                        </span>
                        <span>icon</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setNewLink({ ...newLink, iconType: "" })}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        Remove icon
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                {newLink.iconType === "WhatsApp" ||
                newLink.iconType === "Phone" ||
                newLink.iconType === "SMS" ? (
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
                          : "border-gray-300 focus:ring-indigo-500"
                      }`}
                      placeholder={
                        newLink.iconType === "WhatsApp"
                          ? "+1 (555) 123-4567 or 5551234567"
                          : newLink.iconType === "SMS"
                          ? "+1 (555) 123-4567 for SMS"
                          : "+1 (555) 123-4567"
                      }
                      maxLength={20}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter 10-15 digits. Include country code for international
                      numbers (e.g., +1 for US/Canada)
                    </p>
                  </>
                ) : newLink.iconType === "Email" ? (
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
                          : "border-gray-300 focus:ring-indigo-500"
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
                          : "border-gray-300 focus:ring-indigo-500"
                      }`}
                      placeholder="https://example.com"
                    />
                  </>
                )}
                {validationErrors.linkValue && (
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
                    {validationErrors.linkValue}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={newLink.isVisible}
                  onChange={(e) =>
                    setNewLink({ ...newLink, isVisible: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Public</label>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLink({
                    type: "",
                    value: "",
                    isVisible: true,
                    iconType: "",
                  });
                  setIsCustomLinkType(false);
                  setEditingLinkIndex(null);
                  setValidationErrors({
                    ...validationErrors,
                    linkValue: undefined,
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addLink}
                disabled={
                  !newLink.type ||
                  !newLink.value ||
                  (isCustomLinkType && newLink.type === "Custom")
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
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
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
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

              {alertData.type === "text" && (
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
                    rows={2}
                    maxLength={40}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                      alertValidationErrors.text
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              {alertData.type === "link" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                    <span className="text-gray-500 text-xs ml-1">
                      "URL required"
                    </span>
                  </label>
                  <textarea
                    name="text"
                    value={alertData.text}
                    onChange={handleAlertChange}
                    required
                    rows={2}
                    maxLength={undefined}
                    className={`w-full px-3 py-2 border rounded-lg  focus:outline-none focus:ring-2 resize-none ${
                      alertValidationErrors.text
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                    placeholder={"https://example.com"}
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
              {/* Link Name Field - Only shown when type is 'link' */}
              {alertData.type === "link" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Name
                    <span className="text-gray-500 text-xs ml-1">
                      ({(alertData.linkName || "").length}/30 characters)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="linkName"
                    value={alertData.linkName || ""}
                    onChange={handleAlertChange}
                    required={alertData.type === "link"}
                    maxLength={30}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      alertValidationErrors.linkName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                    placeholder="e.g., Click here to learn more (max 30 chars)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be shown as the clickable text instead of the URL
                  </p>
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
                      icon: <Link className="w-5 h-5" />,
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
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
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
                <input
                  type="date"
                  value={
                    alertData.expiryDate
                      ? new Date(alertData.expiryDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = e.target.value
                      ? new Date(e.target.value + "T00:00:00")
                      : null;
                    handleAlertDateChange(date);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    alertValidationErrors.expiryDate
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
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
                    !!alertValidationErrors.expiryDate
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
    </div>
  );
}
