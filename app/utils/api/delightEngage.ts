const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface DelightEngageList {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DelightEngageRecipient {
  _id: string;
  firstName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  listId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const getDelightEngageLists = async (): Promise<DelightEngageList[]> => {
  // TODO: Implement API call when ready
  return [];
};

export const getDelightEngageList = async (id: string): Promise<DelightEngageList> => {
  const response = await fetch(`/api/lists/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch delight-engage list');
  }
  const data = await response.json();
  return data.data;
};

export const createDelightEngageList = async (name: string, description?: string): Promise<DelightEngageList> => {
  const response = await fetch(`/api/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) {
    throw new Error('Failed to create delight-engage list');
  }
  const data = await response.json();
  return data.data;
};

export const updateDelightEngageList = async (id: string, name: string, description?: string): Promise<DelightEngageList> => {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) {
    throw new Error('Failed to update delight-engage list');
  }
  const data = await response.json();
  return data.data;
};

export const deleteDelightEngageList = async (id: string): Promise<void> => {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete delight-engage list');
  }
};

export const getDelightEngageRecipients = async (listId: string): Promise<DelightEngageRecipient[]> => {
  const response = await fetch(`/api/lists/${listId}/recipients`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch delight-engage recipients');
  }
  const data = await response.json();
  return data.data;
};

export const createDelightEngageRecipient = async (
  listId: string,
  recipient: Omit<DelightEngageRecipient, '_id' | 'listId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<DelightEngageRecipient> => {
  const response = await fetch(`/api/lists/${listId}/recipients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ contacts: [recipient], source: 'manual' }),
  });
  if (!response.ok) {
    throw new Error('Failed to create delight-engage recipient');
  }
  const data = await response.json();
  return data.data;
};

export const updateDelightEngageRecipient = async (
  id: string,
  recipient: Partial<Omit<DelightEngageRecipient, '_id' | 'listId' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<DelightEngageRecipient> => {
  const response = await fetch(`/api/recipients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(recipient),
  });
  if (!response.ok) {
    throw new Error('Failed to update delight-engage recipient');
  }
  const data = await response.json();
  return data.data;
};

export const deleteDelightEngageRecipient = async (id: string): Promise<void> => {
  const response = await fetch(`/api/recipients/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete delight-engage recipient');
  }
}; 