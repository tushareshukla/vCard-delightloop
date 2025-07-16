"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface DeleteStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stepName: string;
  stepNumber: number;
  isDeleting?: boolean;
}

const DeleteStepModal: React.FC<DeleteStepModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stepName,
  stepNumber,
  isDeleting = false,
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
              className="bg-white rounded-xl p-6 shadow-xl w-[480px] max-w-[95vw] pointer-events-auto relative"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>

              {/* Modal content */}
              <div className="flex items-start mb-6">
                {/* Warning Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mr-4">
                  <Image
                    src="/images/exclamation.svg"
                    alt="Warning"
                    width={24}
                    height={24}
                    className="text-red-500"
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Delete Step from Sequence
                  </h2>
                  <p className="text-gray-600">
                    Are you sure you want to delete{" "}
                    <span className="font-medium">
                      Step {stepNumber}: {stepName}
                    </span>{" "}
                    from the sequence? This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Step"
                  )}
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

export default DeleteStepModal;
