"use client"

import { useState } from "react"
import { TiptapEditor } from "../../components/tiptap-editor/TiptapEditor"

export default function EditorPage() {
  const [content, setContent] = useState('<p>Hello World! This is a <strong>TipTap</strong> editor.</p>')

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">TipTap Editor Example</h1>
      <div className="mb-6">
        <TiptapEditor 
          content={content} 
          onChange={setContent} 
          className="min-h-[400px]"
        />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">HTML Output:</h2>
        <div className="bg-gray-100 p-4 rounded-md overflow-auto">
          <pre className="text-sm text-gray-800">{content}</pre>
        </div>
      </div>
    </div>
  )
} 