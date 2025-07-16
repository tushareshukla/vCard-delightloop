"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Gift, X } from "lucide-react";
import { createPortal } from "react-dom";

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmail: () => void;
  onAddPhysicalNudge: () => void;
  isAddingEmail?: boolean;
  isAddingPhysicalNudge?: boolean;
}

const AddStepModal: React.FC<AddStepModalProps> = ({
  isOpen,
  onClose,
  onAddEmail,
  onAddPhysicalNudge,
  isAddingEmail = false,
  isAddingPhysicalNudge = false,
}) => {
  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const optionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.4 },
    }),
    hover: {
      scale: 1.03,
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.97 },
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Modal content
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[1000] pointer-events-auto"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Centered Modal Wrapper */}
          <div className="fixed inset-0 z-[1050] flex items-center justify-center pointer-events-none">
            <motion.div
              className="bg-white rounded-xl p-6 shadow-xl w-[500px] max-w-[95vw] pointer-events-auto relative"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Modal content */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Add to Sequence
                </h2>
                <p className="text-gray-600 mt-1">
                  Choose what type of step to add to your sequence
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Option */}
                <motion.div
                  className={`border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-primary bg-white transition-all ${
                    isAddingEmail ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  variants={optionVariants}
                  initial="initial"
                  animate="animate"
                  whileHover={!isAddingEmail ? "hover" : {}}
                  whileTap={!isAddingEmail ? "tap" : {}}
                  custom={0}
                  onClick={() => {
                    if (!isAddingEmail) {
                      onAddEmail();
                    }
                  }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {isAddingEmail ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      ) : (
                        <Mail className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 ml-3">
                      {isAddingEmail ? "Adding Email..." : "Delight Email"}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Add a personalized email to your sequence. Perfect for
                    initial outreach and follow-ups.
                  </p>
                </motion.div>

                {/* Physical Nudge Option */}
                <motion.div
                  className={`border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-primary bg-white transition-all ${
                    isAddingPhysicalNudge ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  variants={optionVariants}
                  initial="initial"
                  animate="animate"
                  whileHover={!isAddingPhysicalNudge ? "hover" : {}}
                  whileTap={!isAddingPhysicalNudge ? "tap" : {}}
                  custom={1}
                  onClick={() => {
                    if (!isAddingPhysicalNudge) {
                      onAddPhysicalNudge();
                    }
                  }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      {isAddingPhysicalNudge ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      ) : (
                        <Gift className="h-6 w-6 text-purple-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 ml-3">
                      {isAddingPhysicalNudge
                        ? "Adding Physical Nudge..."
                        : "Physical Nudge"}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Send a physical gift or postcard to make a tangible
                    impression and stand out.
                  </p>
                </motion.div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  disabled={isAddingEmail || isAddingPhysicalNudge}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal in portal for perfect centering
  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default AddStepModal;
