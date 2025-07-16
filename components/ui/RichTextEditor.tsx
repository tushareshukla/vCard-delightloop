"use client";

import React, { useRef, useEffect, useState } from "react";

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = "",
  onChange,
  placeholder = "Type your email content here...",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  };

  // This ensures editor commands work with the focused editor
  useEffect(() => {
    const handleDocumentExecCommand = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { command, value } = event.detail;
        document.execCommand(command, false, value || "");
      }
    };

    document.addEventListener("execCommand", handleDocumentExecCommand);

    return () => {
      document.removeEventListener("execCommand", handleDocumentExecCommand);
    };
  }, []);

  // Create a custom event to execute commands
  const execCommand = (command: string, value?: string) => {
    const event = new CustomEvent("execCommand", {
      detail: { command, value },
    });
    document.dispatchEvent(event);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
      }
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      dir="ltr"
      className="p-4 min-h-[300px] max-h-[500px] outline-none overflow-y-auto"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder={content === "" ? placeholder : undefined}
      style={content === "" ? { color: "#aaa" } : {}}
    >
      {/* No children, content is managed by contentEditable */}
    </div>
  );
};

export default RichTextEditor;
