import { ObjectId } from 'mongodb';
import dbConnect from './dbConnect';

export async function getPlaybook(playbookId: string) {
  const db = await dbConnect();
  return await db.collection('playbooks').findOne({ 
    _id: new ObjectId(playbookId) 
  });
}

// Function to update playbook with template URL
export async function updatePlaybookTemplateUrl(playbookId: string, templateType: string) {
  const db = await dbConnect();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const templateUrl = `${baseUrl}/templates/${templateType}`;
  
  return await db.collection('playbooks').findOneAndUpdate(
    { _id: new ObjectId(playbookId) },
    { 
      $set: { 
        cta_link: templateUrl
      } 
    },
    { returnDocument: 'after' }
  );
} 