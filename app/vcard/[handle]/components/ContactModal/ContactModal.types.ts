export interface ContactModalState {
  showContactModal: boolean;
  emailAddress: string;
  isValidatingEmail: boolean;
  emailError: string | null;
  isSendingEmail: boolean;
  emailSent: boolean;
  sendingError: string | null;
}

export interface ContactModalActions {
  setShowContactModal: (show: boolean) => void;
  setEmailAddress: (email: string) => void;
  setIsValidatingEmail: (validating: boolean) => void;
  setEmailError: (error: string | null) => void;
  setIsSendingEmail: (sending: boolean) => void;
  setEmailSent: (sent: boolean) => void;
  setSendingError: (error: string | null) => void;
  resetModalState: () => void;
}

export interface EmailFormProps {
  emailAddress: string;
  emailError: string | null;
  sendingError: string | null;
  isValidatingEmail: boolean;
  isSendingEmail: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}

export interface SuccessStateProps {
  profileName: string;
}

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  profileData: any; // Will be typed more specifically later
}

export interface EmailValidationResult {
  is_valid_format?: {
    value: boolean;
  };
  deliverability?: string;
}

export interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: EmailAttachment[];
}
