"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";

interface PlaybookTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
}

export default function PlaybookTemplateModal({
  isOpen,
  onClose,
  template,
}: PlaybookTemplateModalProps) {
  // Convert template data to the format expected by TemplateModal
  const selectedTemplate = {
    template1: template?.type === "template1",
    template2: template?.type === "template2", 
    template3: template?.type === "template3",
    template4: template?.type === "template4",
    template5: template?.type === "template5",
  };

  const templateData = {
    type: template?.type || "template1",
    description: template?.description || "",
    date: template?.date ? new Date(template.date) : null,
    videoLink: template?.videoLink || "",
    logoLink: template?.logoLink || "",
    buttonText: template?.buttonText || "Select Gift",
    buttonLink: template?.buttonLink || "",
    mediaUrl: template?.mediaUrl || "",
    buttonText1: template?.buttonText1 || "Button 1",
    buttonLink1: template?.buttonLink1 || "",
    buttonText2: template?.buttonText2 || "Button 2", 
    buttonLink2: template?.buttonLink2 || "",
    buttonName1: template?.buttonName1 || "Button 1",
    buttonName2: template?.buttonName2 || "Button 2",
  };

  const handleClose = () => {
    onClose();
  };

  const handleTemplateDataChange = () => {
    // No-op for view-only mode
  };

  if (!isOpen) return null;

  return (
    <TemplateModal
      selectedTemplate={selectedTemplate}
      setSelectedTemplate={handleClose}
      onTemplateDataChange={handleTemplateDataChange}
      initialData={templateData}
      viewOnly={true}
    />
  );
}
