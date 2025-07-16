'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'contacts' | 'crm' | 'finder'>('csv');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        setUploadedFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Simulate upload progress
          const interval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 100) {
                clearInterval(interval);
                setIsUploading(false);
                return 100;
              }
              return prev + 10;
            });
          }, 100);

          // In a real implementation, you would parse the CSV file here
          // For now, we'll just simulate it with a timeout
          setTimeout(() => {
            // Mock data
            const mockData = {
              fileName: file.name,
              size: file.size,
              contacts: [
                { name: 'John Doe', email: 'john@example.com', company: 'Acme Inc', title: 'CEO' },
                { name: 'Jane Smith', email: 'jane@example.com', company: 'Widget Co', title: 'CTO' },
                { name: 'Bob Brown', email: 'bob@example.com', company: 'ABC Corp', title: 'CMO' },
              ]
            };
            
            onImport(mockData);
            onClose();
          }, 1200);
          
        } catch (error) {
          console.error("Error reading file:", error);
          alert("Error reading file. Please try again.");
          setIsUploading(false);
        }
      } else {
        alert("File size should be less than 10MB");
      }
    } else {
      alert("Please upload a .csv, .xls, or .xlsx file");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[580px] max-w-[95vw] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Import Contacts</h2>
          <p className="text-gray-600 text-sm mb-4">Add recipients to your gifting campaign</p>
          
          <div className="bg-gray-50 rounded-lg mb-6">
            <div className="flex">
              <button
                className={`flex items-center gap-2 py-3 px-4 ${activeTab === 'csv' ? 'bg-white rounded-t-lg border-t border-l border-r border-gray-200' : ''}`}
                onClick={() => setActiveTab('csv')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>CSV Upload</span>
              </button>
              
              <button
                className={`flex items-center gap-2 py-3 px-4 ${activeTab === 'contacts' ? 'bg-white rounded-t-lg border-t border-l border-r border-gray-200' : ''}`}
                onClick={() => setActiveTab('contacts')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Contacts</span>
              </button>
              
              <button
                className={`flex items-center gap-2 py-3 px-4 ${activeTab === 'crm' ? 'bg-white rounded-t-lg border-t border-l border-r border-gray-200' : ''}`}
                onClick={() => setActiveTab('crm')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>CRM Connect</span>
              </button>
              
              <button
                className={`flex items-center gap-2 py-3 px-4 ${activeTab === 'finder' ? 'bg-white rounded-t-lg border-t border-l border-r border-gray-200' : ''}`}
                onClick={() => setActiveTab('finder')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Gift Finder</span>
              </button>
            </div>
            
            <div className="bg-white border-t border-gray-200 p-6 rounded-b-lg">
              {activeTab === 'csv' && (
                <div>
                  {!uploadedFile ? (
                    <label
                      htmlFor="csv-file-upload"
                      className={`flex flex-col mt-4 mx-auto group text-primary-light items-center justify-center w-full border border-dashed border-[#D6BBFB] rounded-lg cursor-pointer bg-[#FCFAFF] py-8 hover:bg-primary/5 transition-all duration-300 ${dragActive ? "border-primary bg-primary/5" : ""}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center w-full">
                        <div className="rounded-full bg-purple-100 p-3 mb-3">
                          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="mb-2 text-sm font-medium text-primary">
                          <span className="underline">Upload a file</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">CSV up to 10MB</p>
                      </div>
                      <input
                        id="csv-file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".csv,.xls,.xlsx"
                      />
                    </label>
                  ) : (
                    <div className="mt-4 flex gap-3 items-start bg-white rounded-lg p-4 border border-primary">
                      <div className="bg-purple-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-center gap-3">
                            <div className="grid">
                              <span className="text-sm font-medium">
                                {uploadedFile.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(uploadedFile.size / 1024)} KB
                              </span>
                            </div>
                          </div>
                          {isUploading ? (
                            <div></div>
                          ) : (
                            <div className="bg-primary rounded-full text-white h-fit p-0.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14 5L7.125 12L4 8.81818"
                                  stroke="#ffffff"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex w-full items-center gap-2.5">
                          <div className="w-[85%] bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'contacts' && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium mb-2">Select from your contact lists</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Choose recipients from your existing contact lists
                  </p>
                  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    View Contact Lists
                  </button>
                </div>
              )}
              
              {activeTab === 'crm' && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium mb-2">Connect your CRM</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Import your contacts directly from your CRM
                  </p>
                  <div className="flex justify-center gap-4">
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      HubSpot
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      Salesforce
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      Pipedrive
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'finder' && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium mb-2">Use Gift Prospect Finder</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Find potential recipients based on your target criteria
                  </p>
                  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Open Prospect Finder
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md mr-3 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                if (uploadedFile) {
                  // Process file and import
                  handleFile(uploadedFile);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={activeTab === 'csv' && !uploadedFile}
            >
              Import Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal; 