// VCard Alert interface
export interface VCardAlert {
  text: string;
  type: "text" | "link";
  linkName?: string;
  icon?: string; // Icon name or URL
  expiryDate?: Date; // Optional expiry date
  removedIcon?: string; // Icon name or URL
}

export interface ProfileLink {
  type: string;
  value: string;
  isVisible: boolean;
  icon?: string;
  _id?: string;
  removedIcon?: boolean;
}

export interface ProfileNote {
  value: string;
  isVisible: boolean;
}

export interface ProfileData {
  handle: string;
  key?: string;
  fullName: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme: string;
  nfcEnabled: boolean;
  links: ProfileLink[];
  note?: ProfileNote | null;
  alert?: VCardAlert; // Add alert property
  lastUpdatedAt: string;
}

export interface ThemeColors {
  gradient: string;
  accent: string;
  text: string;
}

export interface ContactFormData {
  emailAddress: string;
  isValidatingEmail: boolean;
  emailError: string | null;
  isSendingEmail: boolean;
  emailSent: boolean;
  sendingError: string | null;
}
