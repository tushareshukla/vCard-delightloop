import { Gift } from "./gift";

export interface Recipient {
  email(email: any): unknown;
  _id: string;
  firstName?: string;
  lastName?: string;
  mailId?: string;
  phoneNumber?: string;
  companyName?: string;
  jobTitle?: string;
  address?: string;
  confidenceScore?: number;
  strokeDasharray?: string;
  assignedGiftId?: string;
  campaignId: string;
  updatedAt?: Date;
  linkedinUrl?:string;
}

export interface RecipientWithGift extends Recipient {
  assignedGift: Gift & {
    id: string;
    price: number;
  };
}

export interface EnrichStateType  {
  email: string;
  status: "pending" | "success" | "failed";
};