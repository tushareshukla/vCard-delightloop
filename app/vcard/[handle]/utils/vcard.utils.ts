import { ProfileData, ThemeColors } from "../types/vcard.types";

// Alert helper functions
export const isAlertExpired = (expiryDate?: Date) => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

export const getAlertIconName = (iconName?: string): string | null => {
  switch (iconName) {
    case "megaphone":
      return "megaphone";
    case "warning":
      return "warning";
    case "info":
      return "info";
    case "success":
      return "success";
    case "bell":
      return "bell";
    case "zap":
      return "zap";
    case "star":
      return "star";
    case "link":
      return "link";
    default:
      return null;
  }
};

export const getThemeColors = (theme: string): ThemeColors => {
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

// Helper function to format link URLs properly
export const formatLinkUrl = (link: { type: string; value: string }) => {
  const url = link.value;
  switch (link.type.toLowerCase()) {
    case "linkedin":
      return link.value.startsWith("http")
        ? link.value
        : `https://linkedin.com/in/${link.value}`;
    case "instagram":
      return link.value.startsWith("http")
        ? link.value
        : `https://instagram.com/${link.value}`;
    case "github":
      return link.value.startsWith("http")
        ? link.value
        : `https://github.com/${link.value}`;
    case "facebook":
      return link.value.startsWith("http")
        ? link.value
        : `https://facebook.com/${link.value}`;
    case "youtube":
      return link.value.startsWith("http")
        ? link.value
        : `https://youtube.com/@${link.value}`;
    case "twitter":
      return link.value.startsWith("http")
        ? link.value
        : `https://twitter.com/${link.value}`;
    case "email":
      return `mailto:${link.value}`;
    case "whatsapp":
      return `https://wa.me/${link.value.replace(/[^0-9]/g, "")}`;
    case "website":
      return link.value.startsWith("http")
        ? link.value
        : `https://${link.value}`;
    default:
      return url;
  }
};

// Handle social link clicks
export const handleLinkClick = (link: {
  type: string;
  value: string;
  icon?: string;
}) => {
  let url = link.value;

  // Use iconType if available, otherwise fall back to type
  const actionType = (link.icon || link.type).toLowerCase();

  // Format URLs properly
  switch (actionType) {
    case "linkedin":
      url = link.value.startsWith("http")
        ? link.value
        : `https://linkedin.com/in/${link.value}`;
      break;
    case "instagram":
      url = link.value.startsWith("http")
        ? link.value
        : `https://instagram.com/${link.value}`;
      break;
    case "github":
      url = link.value.startsWith("http")
        ? link.value
        : `https://github.com/${link.value}`;
      break;
    case "facebook":
      url = link.value.startsWith("http")
        ? link.value
        : `https://facebook.com/${link.value}`;
      break;
    case "youtube":
      url = link.value.startsWith("http")
        ? link.value
        : `https://youtube.com/@${link.value}`;
      break;
    case "twitter":
      url = link.value.startsWith("http")
        ? link.value
        : `https://twitter.com/${link.value}`;
      break;
    case "email":
      url = `mailto:${link.value}`;
      break;
    case "whatsapp":
      // Extract only numbers from phone number for WhatsApp
      const whatsappNumber = link.value.replace(/[^0-9]/g, "");
      url = `https://wa.me/${whatsappNumber}`;
      break;
    case "phone":
      // Use tel: protocol for phone calls
      url = `tel:${link.value}`;
      break;
    case "website":
      url = link.value.startsWith("http")
        ? link.value
        : `https://${link.value}`;
      break;
    case "sms":
      // Use sms: protocol for SMS
      // Remove non-numeric chars for phone number
      const smsNumber = link.value.replace(/[^0-9+]/g, "");
      url = `sms:${smsNumber}`;
      break;
    case "book-meeting":
    case "book a meeting":
      // Handle meeting booking links (Calendly, Zoom, etc.)
      url = link.value.startsWith("http")
        ? link.value
        : `https://${link.value}`;
      break;
    default:
      // For custom types, assume it's a URL
      url = link.value.startsWith("http")
        ? link.value
        : `https://${link.value}`;
      break;
  }

  // For phone calls and SMS, try to initiate directly without opening new window
  if (actionType === "phone" || actionType === "sms") {
    window.location.href = url;
  } else {
    window.open(url, "_blank");
  }
};

export const getSocialLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case "linkedin":
      return "LinkedIn";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
    case "phone":
      return "Phone";
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
    case "message":
      return "Message";
    case "address":
      return "Address";
    case "book-meeting":
    case "book a meeting":
      return "Book a Meeting";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export const getSocialDescription = (link: { type: string; icon?: string }) => {
  // Use iconType if available, otherwise fall back to type
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
    case "message":
      return "Send a direct message";
    case "address":
      return "Meet in person";
    case "book-meeting":
    case "book a meeting":
      return "Schedule a meeting";
    default:
      return `Connect via ${link.type}`;
  }
};

// Create vCard content
export const createVCard = (profile: ProfileData): string => {
  let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
  vcard += `FN:${profile.fullName}\n`;

  if (profile.title) {
    vcard += `TITLE:${profile.title}\n`;
  }

  if (profile.company) {
    vcard += `ORG:${profile.company}\n`;
  }

  // Add ALL visible links (including empty ones for future use)
  profile.links.forEach((link) => {
    if (link.isVisible) {
      const actionType = (link.icon || link.type).toLowerCase();
      const hasValue = link.value && link.value.trim() !== "";
      const formattedUrl = hasValue ? formatLinkUrl(link) : "";

      switch (actionType) {
        case "email":
          if (hasValue) {
            vcard += `EMAIL;type=INTERNET:${link.value}\n`;
          } else {
            vcard += `EMAIL;type=INTERNET:\n`;
          }
          break;
        case "phone":
          if (hasValue) {
            vcard += `TEL;type=CELL:${link.value}\n`;
          } else {
            vcard += `TEL;type=CELL:\n`;
          }
          break;
        case "whatsapp":
          if (hasValue) {
            vcard += `TEL;type=CELL:${link.value}\n`;
            vcard += `X-SOCIALPROFILE;type=whatsapp:${formattedUrl}\n`;
          } else {
            vcard += `TEL;type=CELL:\n`;
            vcard += `X-SOCIALPROFILE;type=whatsapp:\n`;
          }
          break;
        case "sms":
          if (hasValue) {
            vcard += `TEL;type=CELL:${link.value}\n`;
            vcard += `X-SOCIALPROFILE;type=sms:${formattedUrl}\n`;
          } else {
            vcard += `TEL;type=CELL:\n`;
            vcard += `X-SOCIALPROFILE;type=sms:\n`;
          }
          break;
        case "linkedin":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=linkedin:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=linkedin:\n`;
          }
          break;
        case "instagram":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=instagram:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=instagram:\n`;
          }
          break;
        case "twitter":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=twitter:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=twitter:\n`;
          }
          break;
        case "facebook":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=facebook:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=facebook:\n`;
          }
          break;
        case "youtube":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=youtube:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=youtube:\n`;
          }
          break;
        case "github":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=github:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=github:\n`;
          }
          break;
        case "website":
          if (hasValue) {
            vcard += `URL;type=WORK:${formattedUrl}\n`;
          } else {
            vcard += `URL;type=WORK:\n`;
          }
          break;
        case "book-meeting":
        case "book a meeting":
          if (hasValue) {
            vcard += `URL;type=WORK:${formattedUrl}\n`;
          } else {
            vcard += `URL;type=WORK:\n`;
          }
          break;
        case "address":
          if (hasValue) {
            vcard += `ADR;type=WORK:;;${link.value};;;;\n`;
          } else {
            vcard += `ADR;type=WORK:;;;;;;\n`;
          }
          break;
        case "message":
          if (hasValue) {
            vcard += `X-SOCIALPROFILE;type=message:${formattedUrl}\n`;
          } else {
            vcard += `X-SOCIALPROFILE;type=message:\n`;
          }
          break;
        default:
          // For custom types, add as URL
          if (hasValue) {
            vcard += `URL;type=WORK:${formattedUrl}\n`;
          } else {
            vcard += `URL;type=WORK:\n`;
          }
          break;
      }
    }
  });

  // Add note if available and visible
  if (
    profile.note &&
    profile.note.isVisible &&
    profile.note.value.trim() !== ""
  ) {
    vcard += `NOTE:${profile.note.value.replace(/\n/g, "\\n")}\n`;
  }

  // Add profile photo if available
  if (profile.avatarUrl) {
    vcard += `PHOTO;VALUE=URL:${profile.avatarUrl}\n`;
  }

  // Add company logo as additional info if available
  if (profile.companyLogoUrl) {
    vcard += `X-COMPANY-LOGO:${profile.companyLogoUrl}\n`;
  }

  // Add last updated timestamp
  if (profile.lastUpdatedAt) {
    vcard += `REV:${profile.lastUpdatedAt}\n`;
  }

  vcard += "END:VCARD";
  return vcard;
};
