import { ObjectId } from 'mongodb';

export interface Recipient {
  _id: ObjectId;
  playbook_id: ObjectId;
  playbook_run_id: ObjectId;
  recipient_email: string;
  status: 'Pending' | 'Acknowledged';
  acknowledgedAt?: Date;
  template_url: string;
  created_at: Date;
  updated_at: Date;
}

// Type guard to check if an object is a Recipient
export function isRecipient(obj: any): obj is Recipient {
  return (
    obj &&
    typeof obj === 'object' &&
    obj._id instanceof ObjectId &&
    obj.playbook_id instanceof ObjectId &&
    obj.playbook_run_id instanceof ObjectId &&
    typeof obj.recipient_email === 'string' &&
    (obj.status === 'Pending' || obj.status === 'Acknowledged') &&
    typeof obj.template_url === 'string' &&
    obj.created_at instanceof Date &&
    obj.updated_at instanceof Date
  );
} 