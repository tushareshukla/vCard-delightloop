import { ObjectId } from 'mongodb';
import dbConnect from './dbConnect';

export async function getRecipient(recipientId: string) {
  const db = await dbConnect();
  return await db.collection('recipients').findOne({ 
    _id: new ObjectId(recipientId) 
  });
}

export async function updateRecipientAcknowledgement(recipientId: string) {
  const db = await dbConnect();
  return await db.collection('recipients').findOneAndUpdate(
    { 
      _id: new ObjectId(recipientId),
      status: "Pending" // Only update if still pending
    },
    {
      $set: {
        status: "Acknowledged",
        acknowledgedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
} 