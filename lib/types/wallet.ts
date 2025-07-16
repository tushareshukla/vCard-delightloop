import { ObjectId } from "mongodb";

export interface Transaction {
  transaction_type: "Top-Up" | "Purchase";
  balance_before: number;
  transaction_cost: number;
  balance_after: number;
  updated_at: Date;
  payment_intent?: string;
  _id?: ObjectId;
}

export interface Wallet {
  _id?: ObjectId;
  organization_id: ObjectId;
  current_balance: number;
  currency: string;
  transaction_history: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}
