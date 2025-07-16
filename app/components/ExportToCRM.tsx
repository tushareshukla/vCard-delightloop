import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useRouter } from 'next/navigation';

interface ExportToCRMProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (platform: string, listId?: string) => void;
  exportType: 'contacts' | 'list' | 'list_and_contacts';
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

interface ExportResponse {
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

const ExportToCRM: React.FC<ExportToCRMProps> = ({ isOpen, onClose, onExport, exportType, listGuid, selectedContacts = [] }) => {
  const { authToken, userId, userEmail, organizationId } = useAuth();
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [hubspotLists, setHubspotLists] = useState<HubSpotList[]>([]);
  const [selectedList, setSelectedList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportComplete, setIsExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isControlsDisabled, setIsControlsDisabled] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [baseUrl, setBaseUrl] = useState<string | null | undefined>(null);
  const [listName, setListName] = useState<string>('');
  const [contactIdsInput, setContactIdsInput] = useState<string>('');
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
      fetchHubSpotLists();
    }
  }, [selectedPlatform, authToken]);

  useEffect(() => {
    setIsControlsDisabled(false);
    setError(null);
    setSuccessMessage(null);
    setIsExporting(false);
    setIsExportComplete(false);
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

  useEffect(() => {
    if (isOpen && selectedContacts.length > 0) {
      setContactIdsInput(selectedContacts.join(', '));
    }
  }, [isOpen, selectedContacts]);

  const fetchHubSpotLists = async () => {
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch HubSpot lists');
      }

      if (!data.success) {
        if (data.message?.toLowerCase().includes('integration not found')) {
          setHubspotLists([]);
          return;
        }
        throw new Error(data.message || 'Failed to fetch lists');
      }

      setHubspotLists(data.data?.lists || []);
    } catch (error) {
      console.error('Error fetching HubSpot lists:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch lists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactsExport = async (listId: string) => {
    if (!listGuid) {
      throw new Error('List GUID is required for contacts export');
    }

    const baseUrl = getBackendApiBaseUrl();
    const response = await fetch(`${baseUrl}/v1/integrations/hubspot/lists/${listId}/lists/${listGuid}/contacts/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data: ExportResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to export contacts');
    }

    if (!data.success) {
      throw new Error(data.message || 'Export failed');
    }

    return data;
  };

  const handleListAndContactsExport = async (platform: string, listId: string) => {
    const baseUrl = getBackendApiBaseUrl();
    const response = await fetch(`${baseUrl}/v1/integrations/hubspot/lists/${listId}/export`, {
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

    const data: ExportResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to export list and contacts');
    }

    if (!data.success) {
      throw new Error(data.message || 'Export failed');
    }

    return data;
  };

  const handleCreateList = async () => {
    if (!baseUrl || !authToken) return;
    
    try {
      setIsExporting(true);
      setIsControlsDisabled(true);
      setError(null);

      const response = await fetch(`${baseUrl}/v1/integrations/hubspot/crm/lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: listName,
          description: "List of marketing contacts",
          listType: "STATIC",
          objectTypeId: "0-1",
          processingType: "MANUAL"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create HubSpot list');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create list');
      }

      
      setSuccessMessage('List created successfully');
      fetchHubSpotLists();
      setIsExportComplete(true);
    } catch (error) {
      console.error('Error creating HubSpot list:', error);
      setError(error instanceof Error ? error.message : 'Failed to create list');
    } finally {
      setIsControlsDisabled(false);
      setIsExporting(false);
    }
  };

  const handleExportSelectedContacts = async () => {
    if (!selectedList || !selectedContacts.length) return;

    setIsExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${baseUrl}/v1/integrations/hubspot/crm/add-contacts-to-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hubspotListId: selectedList,
          contactIds: selectedContacts
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Export failed');
      }

      setSuccessMessage('Contacts are being added to the HubSpot list. Processing will continue in the background.');
      setIsExportComplete(true);
      setIsControlsDisabled(true);
      onExport(selectedPlatform, selectedList);
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export contacts');
    } finally {
      setIsExporting(false);
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
          Export to CRM
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
                              fetchHubSpotLists();
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
                    ) : error ? (
                      <div className="text-sm text-red-500">{error}</div>
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
                  {!selectedList && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New List Name
                      </label>
                      <input
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        disabled={isControlsDisabled}
                        className={`w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Enter list name"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Selected Contacts: {selectedContacts.length}
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
                {selectedList ? (
                  <button
                    type="button"
                    onClick={handleExportSelectedContacts}
                    disabled={!selectedContacts.length || isExporting || isControlsDisabled}
                    className="px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? 'Exporting...' : 'Export to Selected List'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateList}
                    disabled={!listName || isExporting || isControlsDisabled}
                    className="px-4 py-2.5 bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? 'Creating...' : 'Create New List'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportToCRM; 