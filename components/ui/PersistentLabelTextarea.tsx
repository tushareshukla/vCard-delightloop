"use client";

import React, { useState, useRef, useEffect } from "react";

interface PersistentLabelTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PersistentLabelTextarea: React.FC<PersistentLabelTextareaProps> = ({
  label,
  value,
  onChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the content only once
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      const labelSpan = containerRef.current.querySelector("span");
      if (labelSpan) {
        // Clear any existing content after the label
        while (labelSpan.nextSibling) {
          labelSpan.nextSibling.remove();
        }

        // Add the initial value if it exists
        if (value) {
          const textNode = document.createTextNode(value);
          containerRef.current.appendChild(textNode);
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update content when value changes externally (but only after initialization)
  useEffect(() => {
    if (containerRef.current && isInitialized) {
      const labelSpan = containerRef.current.querySelector("span");
      if (labelSpan) {
        // Get current text content after the label
        const currentText = labelSpan.nextSibling?.textContent || "";

        // Only update if the value is different from what's currently displayed
        if (currentText !== value) {
          // Clear existing text nodes after the label
          while (labelSpan.nextSibling) {
            labelSpan.nextSibling.remove();
          }

          // Add the new value
          if (value) {
            const textNode = document.createTextNode(value);
            containerRef.current.appendChild(textNode);
          }
        }
      }
    }
  }, [value, isInitialized]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const labelSpan = containerRef.current.querySelector("span");
      let textContent = "";

      if (labelSpan && labelSpan.nextSibling) {
        // Get all text content after the label span
        let node = labelSpan.nextSibling;
        while (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            textContent += node.textContent || "";
          }
          node = node.nextSibling;
        }
      }

      // Call the onChange prop with just the user-entered text
      onChange(textContent);
    }
  };

  // Handle focus to position cursor at end of text
  const handleFocus = () => {
    if (containerRef.current) {
      const labelSpan = containerRef.current.querySelector("span");
      if (labelSpan && labelSpan.nextSibling) {
        // Position cursor at the end of the text content
        const range = document.createRange();
        const sel = window.getSelection();

        // Find the last text node
        let lastTextNode = labelSpan.nextSibling;
        while (lastTextNode && lastTextNode.nextSibling) {
          lastTextNode = lastTextNode.nextSibling;
        }

        if (lastTextNode && lastTextNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
          range.setEnd(lastTextNode, lastTextNode.textContent?.length || 0);
        } else {
          // If no text node exists, position after the label
          range.setStartAfter(labelSpan);
          range.setEndAfter(labelSpan);
        }

        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // Handle key events to prevent deleting the label
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const selection = window.getSelection();
      const labelSpan = containerRef.current.querySelector("span");

      if (selection && labelSpan) {
        const range = selection.getRangeAt(0);

        // Prevent backspace/delete from removing the label
        if (
          ((e.key === "Backspace" || e.key === "Delete") &&
            range.startContainer === labelSpan) ||
          (range.startContainer === containerRef.current &&
            range.startOffset === 0)
        ) {
          e.preventDefault();

          // Position cursor after the label
          const newRange = document.createRange();
          newRange.setStartAfter(labelSpan);
          newRange.setEndAfter(labelSpan);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px] ${className}`}
      style={{ cursor: "text" }}
    >
      <span style={{ color: "#666", fontWeight: "500" }}>{label}</span>
    </div>
  );
};

export default PersistentLabelTextarea;
