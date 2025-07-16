"use client"

import * as React from "react"
import { EditorContent, useEditor } from "@tiptap/react"

// Core Extensions
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Underline } from "@tiptap/extension-underline"
import { Link } from "@tiptap/extension-link"

// UI and Styling
import { cn } from "../../lib/utils"
import "./tiptap-editor.css"

// Image Upload Button
const ImageUploadButton = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          // Insert the image into the editor
          editor.chain().focus().setImage({ src: result }).run()
        }
      }
      
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          // Create a hidden file input and trigger it
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
          input.click()
        }}
        className={cn(
          "p-1 rounded hover:bg-gray-200"
        )}
        title="Upload Image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-image">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </button>
    </div>
  )
}

// Define the toolbar component
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("bold") ? "bg-gray-200" : ""
        )}
        title="Bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-bold">
          <path d="M14 12a4 4 0 0 0 0-8H6v8"/>
          <path d="M15 20a4 4 0 0 0 0-8H6v8Z"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("italic") ? "bg-gray-200" : ""
        )}
        title="Italic"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-italic">
          <line x1="19" x2="10" y1="4" y2="4"/>
          <line x1="14" x2="5" y1="20" y2="20"/>
          <line x1="15" x2="9" y1="4" y2="20"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("underline") ? "bg-gray-200" : ""
        )}
        title="Underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-underline">
          <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
          <line x1="4" x2="20" y1="20" y2="20"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("strike") ? "bg-gray-200" : ""
        )}
        title="Strike"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-strikethrough">
          <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
          <path d="M14 12a4 4 0 0 1 0 8H6"/>
          <line x1="4" x2="20" y1="12" y2="12"/>
        </svg>
      </button>
      
      <span className="w-px h-6 bg-gray-300"></span>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
        )}
        title="Heading 1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-heading-1">
          <path d="M4 12h8"/>
          <path d="M4 18V6"/>
          <path d="M12 18V6"/>
          <path d="m17 12 3-2v8"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
        )}
        title="Heading 2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-heading-2">
          <path d="M4 12h8"/>
          <path d="M4 18V6"/>
          <path d="M12 18V6"/>
          <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/>
        </svg>
      </button>
      
      <span className="w-px h-6 bg-gray-300"></span>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("bulletList") ? "bg-gray-200" : ""
        )}
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-list">
          <line x1="8" x2="21" y1="6" y2="6"/>
          <line x1="8" x2="21" y1="12" y2="12"/>
          <line x1="8" x2="21" y1="18" y2="18"/>
          <line x1="3" x2="3.01" y1="6" y2="6"/>
          <line x1="3" x2="3.01" y1="12" y2="12"/>
          <line x1="3" x2="3.01" y1="18" y2="18"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("orderedList") ? "bg-gray-200" : ""
        )}
        title="Ordered List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-list-ordered">
          <line x1="10" x2="21" y1="6" y2="6"/>
          <line x1="10" x2="21" y1="12" y2="12"/>
          <line x1="10" x2="21" y1="18" y2="18"/>
          <path d="M4 6h1v4"/>
          <path d="M4 10h2"/>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive("taskList") ? "bg-gray-200" : ""
        )}
        title="Task List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-check-square">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </button>
      
      <span className="w-px h-6 bg-gray-300"></span>

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive({ textAlign: 'left' }) ? "bg-gray-200" : ""
        )}
        title="Align Left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-align-left">
          <line x1="21" x2="3" y1="6" y2="6"/>
          <line x1="15" x2="3" y1="12" y2="12"/>
          <line x1="17" x2="3" y1="18" y2="18"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive({ textAlign: 'center' }) ? "bg-gray-200" : ""
        )}
        title="Align Center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-align-center">
          <line x1="21" x2="3" y1="6" y2="6"/>
          <line x1="17" x2="7" y1="12" y2="12"/>
          <line x1="19" x2="5" y1="18" y2="18"/>
        </svg>
      </button>
      
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={cn(
          "p-1 rounded hover:bg-gray-200",
          editor.isActive({ textAlign: 'right' }) ? "bg-gray-200" : ""
        )}
        title="Align Right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-align-right">
          <line x1="21" x2="3" y1="6" y2="6"/>
          <line x1="21" x2="9" y1="12" y2="12"/>
          <line x1="21" x2="7" y1="18" y2="18"/>
        </svg>
      </button>

      <span className="w-px h-6 bg-gray-300"></span>
      
      <ImageUploadButton editor={editor} />
    </div>
  )
}

interface TiptapEditorProps {
  content?: string
  onChange?: (html: string) => void
  className?: string
}

export function TiptapEditor({ content = '<p>Start typing...</p>', onChange, className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return (
    <div className={cn("border border-gray-200 rounded-md", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  )
} 