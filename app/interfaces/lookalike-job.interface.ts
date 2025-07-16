export interface LookalikeJob {
  _id?: string;
  listId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  sourceProfiles: string[]; // LinkedIn URLs
  targetCount: number;
  vendor: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  result?: Array<{
    id: string;
    name: string;
    email: string;
    linkedin: string;
    company: string;
    jobtitle: string;
    photo?: string;
    country?: string;
    city?: string;
  }>;
} 