import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useRouter } from 'next/navigation';

interface ImportFromCRMProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (platform: string, listId?: string) => void;
  importType: 'contacts' | 'list_and_contacts';
  listGuid?: string | null;
  selectedContacts?: string[];
}

interface HubSpotList {
  portalId: number;
  listId: number;
  name: string;
  listType: string;
  metaData: {
    size: number;
  };
}

interface ImportResponse {
  success: boolean;
  data: {
    list: {
      id: string;
      name: string;
      status: string;
    };
  };
  message: string;
  error?: string;
}

interface Integration {
  name: string;
  code: string;
  authToken: string;
  refreshToken: string;
  expiresIn: string;
  _id: string;
}

const ImportFromCRM: React.FC<ImportFromCRMProps> = ({ isOpen, onClose, onImport, importType, listGuid, selectedContacts = [] }) => {
  const { authToken, userId, organizationId } = useAuth();
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [hubspotLists, setHubspotLists] = useState<HubSpotList[]>([]);
  const [selectedList, setSelectedList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isControlsDisabled, setIsControlsDisabled] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [baseUrl, setBaseUrl] = useState<string | null | undefined>(null);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);

  useEffect(() => {
    const initializeBaseUrl = async () => {
      const url = await getBackendApiBaseUrl();
      setBaseUrl(url);
    };
    initializeBaseUrl();
  }, []);

  useEffect(() => {
    if (selectedPlatform === 'HubSpot') {
      fetchHubspotLists();
    }
  }, [selectedPlatform, authToken]);

  useEffect(() => {
    setIsControlsDisabled(false);
    setError(null);
    setSuccessMessage(null);
    setIsImporting(false);
    setIsImportComplete(false);
    setSelectedPlatform('');
    setSelectedList('');
  }, [isOpen]);

  useEffect(() => {
    const checkIntegrations = async () => {
      if (!baseUrl || !authToken) return;
      
      try {
        const response = await fetch(`${baseUrl}/v1/organizations/${organizationId}/users/${userId}/integrations`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setIntegrations(data.data);
        }
      } catch (error) {
        console.error('Error checking integrations:', error);
      }
    };

    if (isOpen) {
      checkIntegrations();
    }
  }, [baseUrl, organizationId, userId, isOpen, authToken]);

  const fetchHubspotLists = async () => {
    if (!baseUrl || !authToken) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/v1/integrations/hubspot/lists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        // If integration not found, call auth API
        const authResponse = await fetch(`${baseUrl}/v1/integrations/hubspot/auth`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        const authData = await authResponse.json();
        if (authData.success && authData.data?.url) {
          const width = 600;
          const height = 600;
          const left = (window.screen.width - width) / 2;
          const top = Math.max(50, (window.screen.height - height) / 4);
          window.open(authData.data.url, 'authPopup', `width=${width},height=${height},left=${left},top=${top},popup=yes,chrome=yes`);
          onClose();
        }
        return;
      }

      setHubspotLists(data.data?.lists || []);
    } catch (error) {
      console.error('Error fetching HubSpot lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactsImport = async (listId: string) => {
    if ( !authToken || !listGuid) {
      throw new Error('Required parameters missing for contacts import');
    }

    const baseUrl = getBackendApiBaseUrl();
    if (!baseUrl) {
      throw new Error('Base URL is required for contacts import');
    }
    const response = await fetch(`${baseUrl}/v1/integrations/hubspot/lists/${listId}/lists/${listGuid}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data: ImportResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to import contacts');
    }

    if (!data.success) {
      throw new Error(data.message || 'Import failed');
    }

    return data;
  };

  const handleListAndContactsImport = async (platform: string, listId: string) => {
    if (!baseUrl || !authToken) return;
    
    try {
      const response = await fetch(`${baseUrl}/v1/integrations/hubspot/lists/${listId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          platform,
          listId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import list and contacts');
      }

      if (!data.success) {
        throw new Error(data.message || 'Import failed');
      }

      return data;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  const handleImport = async () => {
    if (!selectedPlatform || !selectedList) return;

    try {
      setIsImporting(true);
      setIsControlsDisabled(true);
      setError(null);

      let data;
      if (importType === 'contacts') {
        data = await handleContactsImport(selectedList);
      } else {
        data = await handleListAndContactsImport(selectedPlatform, selectedList);
      }
      
      setSuccessMessage('Contacts are being imported. Processing will continue in the background.');
      setIsImportComplete(true);
      onImport(selectedPlatform, selectedList);
      
      // Keep the button disabled after successful import
      setIsControlsDisabled(true);
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import contacts');
      // Re-enable controls only on error
      setIsControlsDisabled(false);
    } finally {
      setIsImporting(false);
    }
  };

  const isIntegrationActive = (name: string) => {
    return integrations.some(integration => integration.name.toLowerCase() === name.toLowerCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[480px] relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-[#101828] mb-6">
          Import from CRM
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Platform
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-left flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {selectedPlatform ? (
                      <>
                        <Image
                          src={`/svgs/${selectedPlatform.toLowerCase()}.svg`}
                          alt={selectedPlatform}
                          width={24}
                          height={24}
                        />
                        <span>{selectedPlatform}</span>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isIntegrationActive(selectedPlatform.toLowerCase()) 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-red-500 bg-red-50'
                        }`}>
                          {isIntegrationActive(selectedPlatform.toLowerCase()) ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">Select a platform</span>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPlatformDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setSelectedPlatform('HubSpot');
                          setIsPlatformDropdownOpen(false);
                          try {
                            const response = await fetch(`${baseUrl}/v1/integrations/hubspot/status`, {
                              headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            const data = await response.json();
                            
                            if (!data.success) {
                              const authResponse = await fetch(`${baseUrl}/v1/integrations/hubspot/auth`, {
                                headers: {
                                  'Authorization': `Bearer ${authToken}`,
                                  'Content-Type': 'application/json'
                                }
                              });
                              const authData = await authResponse.json();
                              if (authData.success && authData.data?.url) {
                                const width = 600;
                                const height = 600;
                                const left = (window.screen.width - width) / 2;
                                const top = Math.max(50, (window.screen.height - height) / 4);
                                window.open(authData.data.url, 'authPopup', `width=${width},height=${height},left=${left},top=${top},popup=yes,chrome=yes`);
                                onClose();
                              }
                            } else {
                              fetchHubspotLists();
                            }
                          } catch (error) {
                            console.error('Error checking HubSpot status:', error);
                          }
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-50"
                      >
                        <Image
                          src="/svgs/hubspot.svg"
                          alt="HubSpot"
                          width={24}
                          height={24}
                        />
                        <span>HubSpot</span>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isIntegrationActive('hubspot') 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-red-500 bg-red-50'
                        }`}>
                          {isIntegrationActive('hubspot') ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatform('Salesforce');
                          setIsPlatformDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-50"
                      >
                        <Image
                          src="/svgs/salesforce.svg"
                          alt="Salesforce"
                          width={24}
                          height={24}
                        />
                        <span>Salesforce</span>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isIntegrationActive('salesforce') 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-red-500 bg-red-50'
                        }`}>
                          {isIntegrationActive('salesforce') ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedPlatform === 'HubSpot' && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select HubSpot List
                </label>
                <div className="space-y-4">
                  <div>
                    {isLoading ? (
                      <div className="text-sm text-gray-500">Loading lists...</div>
                    ) : (
                      <select
                        value={selectedList}
                        onChange={(e) => setSelectedList(e.target.value)}
                        disabled={isControlsDisabled}
                        className={`w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="">Select a list</option>
                        {hubspotLists.map((list) => (
                          <option key={list.listId} value={list.listId}>
                            {list.name} ({list.metaData.size} contacts)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {successMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="text-sm font-medium">{successMessage}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!selectedList || isImporting || isControlsDisabled}
                  className="px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportFromCRM; 