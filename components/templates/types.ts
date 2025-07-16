import { Recipient as BaseRecipient } from '@/models/Recipient';

export interface Recipient extends BaseRecipient {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  recipient_email?: string;
}

export interface Playbook {
  _id: string;
  template: {
    type: 'template1' | 'template2' | 'template3' | 'template4';
    description: string;
    date?: Date;
    videoLink?: string;
    logoLink?: string;
    buttonText?: string;
    buttonLink?: string;
    mediaUrl?: string;
  };
  budget: number;
  sending_mode: 'direct' | 'permission_based';
  hyper_personalization: boolean;
}

export interface TemplateProps {
  playbook: Playbook;
  recipient: Recipient;
  onAcknowledge: () => Promise<void>;
} 