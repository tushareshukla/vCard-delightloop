import { ObjectId } from 'mongodb';
import dbConnect from './dbConnect';
import { generateTemplateToken } from '@/utils/templateToken';

export async function generateAndSaveTemplateUrl(
  recipientId: string,
  playbookId: string,
  playbookRunId: string,
  templateType: string
) {
  const db = await dbConnect();
  
  // Generate secure token
  const token = generateTemplateToken({
    recipient_id: recipientId,
    playbook_id: playbookId,
    playbook_run_id: playbookRunId
  });

  // Create the complete template URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const templateUrl = `${baseUrl}/templates/${templateType}?token=${token}`;

  // Update recipient with template URL
  const result = await db.collection('recipients').findOneAndUpdate(
    { _id: new ObjectId(recipientId) },
    {
      $set: {
        template_url: templateUrl,
        status: 'Pending',
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  return result;
} 