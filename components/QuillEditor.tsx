import React, { useEffect, useState } from 'react';
import 'quill/dist/quill.snow.css';

type Mode = 'view' | 'raw';

export interface QuillEditorProps {
  content: string;
  onChange: (html: string) => void;
  className?: string;
}

const QuillEditor = ({ content, onChange, className = '' }: QuillEditorProps) => {
  const [mode, setMode] = useState<Mode>('view');
  const [rawHtml, setRawHtml] = useState(content);

  // Sync rawHtml with content when content prop changes
  useEffect(() => {
    if (content !== rawHtml) {
      setRawHtml(content);
    }
  }, [content]);

  // Handle mode change and sync raw HTML if needed
  const handleToggle = () => {
    if (mode === 'raw') {
      onChange(rawHtml);
      setMode('view');
    } else {
      setMode('raw');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Email Editor</h3>
        </div>
        {/* Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${mode === 'view' ? 'text-primary' : 'text-gray-500'}`}>View HTML</span>
          <button
            type="button"
            aria-pressed={mode === 'raw'}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full border-2 border-primary transition-colors duration-200 focus:outline-none ${mode === 'raw' ? 'bg-primary' : 'bg-white'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${mode === 'raw' ? 'translate-x-7 border border-primary' : 'translate-x-1 border border-primary'}`}
            />
          </button>
          <span className={`text-sm font-medium ${mode === 'raw' ? 'text-primary' : 'text-gray-500'}`}>Add HTML</span>
        </div>
      </div>

      <div className="p-4">
        {mode === 'view' && (
          <div
            className="html-preview bg-white rounded-lg border border-gray-200 p-6 min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
        {mode === 'raw' && (
          <textarea
            value={rawHtml}
            onChange={e => {
              setRawHtml(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full min-h-[300px] p-4 font-mono text-sm bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your HTML here..."
          />
        )}
      </div>
    </div>
  );
};

export default QuillEditor; 