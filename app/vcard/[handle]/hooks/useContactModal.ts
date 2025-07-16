"use client";

import { useState, useCallback } from "react";
import {
  ContactModalState,
  ContactModalActions,
} from "../components/ContactModal/ContactModal.types";

export const useContactModal = (): ContactModalState & ContactModalActions => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingError, setSendingError] = useState<string | null>(null);

  const resetModalState = useCallback(() => {
    setEmailAddress("");
    setEmailError(null);
    setSendingError(null);
    setEmailSent(false);
    setIsValidatingEmail(false);
    setIsSendingEmail(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowContactModal(false);
    resetModalState();
  }, [resetModalState]);

  const handleOpenModal = useCallback(() => {
    setShowContactModal(true);
    resetModalState();
  }, [resetModalState]);

  return {
    // State
    showContactModal,
    emailAddress,
    isValidatingEmail,
    emailError,
    isSendingEmail,
    emailSent,
    sendingError,

    // Actions
    setShowContactModal,
    setEmailAddress,
    setIsValidatingEmail,
    setEmailError,
    setIsSendingEmail,
    setEmailSent,
    setSendingError,
    resetModalState,

    // Convenience methods
    closeModal: handleCloseModal,
    openModal: handleOpenModal,
  } as ContactModalState &
    ContactModalActions & {
      closeModal: () => void;
      openModal: () => void;
    };
};
