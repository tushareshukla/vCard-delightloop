"use client";

import { useCallback } from "react";
import { ProfileData } from "../../types/vcard.types";
import { EmailService } from "../../services/email.service";
import { useContactModal } from "../../hooks/useContactModal";
import EmailForm from "./EmailForm";
import SuccessState from "./SuccessState";

interface ContactModalWithHookProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  setSaveContactClicked: (clicked: boolean) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  profile,
  setSaveContactClicked,
}: ContactModalWithHookProps) {
  const {
    emailAddress,
    emailError,
    sendingError,
    isValidatingEmail,
    isSendingEmail,
    emailSent,
    setEmailAddress,
    setEmailError,
    setSendingError,
    setIsValidatingEmail,
    setIsSendingEmail,
    setEmailSent,
    resetModalState,
  } = useContactModal();

  const handleEmailChange = useCallback(
    (email: string) => {
      setEmailAddress(email);
      setEmailError(null);
      setSendingError(null);
    },
    [setEmailAddress, setEmailError, setSendingError]
  );

  const handleSubmit = useCallback(async () => {
    if (!emailAddress.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    try {
      setIsValidatingEmail(true);
      setEmailError(null);
      setSendingError(null);

      // Validate email first
      const validationResult = await EmailService.validateEmail(emailAddress);

      if (!EmailService.isEmailValid(validationResult)) {
        setEmailError("Please enter a valid email address");
        return;
      }

      setIsValidatingEmail(false);
      setIsSendingEmail(true);

      // Send email
      await EmailService.sendContactEmail(emailAddress, profile);

      // Success - show success state
      setEmailSent(true);
      setSaveContactClicked(true);

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setTimeout(() => setSaveContactClicked(false), 500);
      }, 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      setSendingError(
        error instanceof Error
          ? error.message
          : "Failed to send contact information. Please try again."
      );
    } finally {
      setIsValidatingEmail(false);
      setIsSendingEmail(false);
    }
  }, [
    emailAddress,
    profile,
    setEmailError,
    setEmailSent,
    setIsValidatingEmail,
    setIsSendingEmail,
    setSendingError,
    setSaveContactClicked,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    onClose();
    resetModalState();
  }, [onClose, resetModalState]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        } max-w-md w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">
          {emailSent ? (
            <SuccessState profileName={profile.fullName} />
          ) : (
            <EmailForm
              emailAddress={emailAddress}
              emailError={emailError}
              sendingError={sendingError}
              isValidatingEmail={isValidatingEmail}
              isSendingEmail={isSendingEmail}
              onEmailChange={handleEmailChange}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
