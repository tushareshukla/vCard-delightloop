import { verifyTemplateToken } from '@/utils/templateToken';
import Template1 from '@/components/templates/Template1';
import Template2 from '@/components/templates/Template2';
import Template3 from '@/components/templates/Template3';
import Template4 from '@/components/templates/Template4';
import ErrorPage from '@/components/templates/ErrorPage';
import dbConnect from '@/lib/dbConnect';
import Recipients from '@/models/Recipients';
import Playbook from '@/models/Playbook';

interface Props {
  params: { type: string };
  searchParams: { token: string };
}

// Helper function to serialize MongoDB objects
function serializeData(obj: any) {
  if (!obj) return null;
  return JSON.parse(JSON.stringify(obj));
}

export default async function TemplatePage({ params, searchParams }: Props) {
  const { type } = params;
  const { token } = searchParams;

  try {
    // First verify database connection
    console.log('Attempting database connection...');
    await dbConnect();
    console.log('Database connected successfully');

    // Validate template type
    const validTemplates = ['template1', 'template2', 'template3', 'template4'];
    if (!validTemplates.includes(type)) {
      return <ErrorPage 
        title="Invalid Template"
        message="The template you're trying to access does not exist."
      />;
    }

    // Validate token
    if (!token) {
      return <ErrorPage 
        title="Missing Access Token"
        message="No access token provided. Please use the link exactly as it was sent to you."
      />;
    }

    // Verify token and get template data
    const templateData = verifyTemplateToken(token);
    if (!templateData) {
      return <ErrorPage 
        title="Invalid Access Token"
        message="The access token is invalid or has been tampered with. Please use the link exactly as it was sent to you."
      />;
    }

    console.log('Template Data:', templateData);

    // Get playbook data using Playbook model
    const playbookResult = await Playbook.findById(templateData.playbook_id).lean();
    console.log('Playbook Query Result:', playbookResult);

    if (!playbookResult) {
      return <ErrorPage 
        title="Gift Not Found"
        message="The gift details could not be found. Please contact support."
      />;
    }

    // First get the original recipient record to get the email
    const originalRecipient = await Recipients.findById(templateData.recipient_id).lean();
    console.log('Original Recipient Data:', {
      id: templateData.recipient_id,
      data: originalRecipient
    });

    if (!originalRecipient) {
      return <ErrorPage 
        title="Recipient Not Found"
        message="The recipient details could not be found. Please contact support."
      />;
    }

    // Update recipient acknowledgment if not already acknowledged
    if (!originalRecipient.acknowledgedAt) {
      await Recipients.findByIdAndUpdate(
        originalRecipient._id,
        { 
          $set: { 
            acknowledgedAt: new Date(),
            status: 'Acknowledged'
          } 
        },
        { new: true }
      );
    }

    // Select appropriate template component
    const TemplateComponent = {
      template1: Template1,
      template2: Template2,
      template3: Template3,
      template4: Template4
    }[type];

    // Serialize the data before passing to client component
    const serializedPlaybook = playbookResult ? serializeData(playbookResult) : null;
    const serializedRecipient = originalRecipient ? serializeData(originalRecipient) : null;

    // Log the serialized data for debugging
    console.log('Serialized Playbook:', serializedPlaybook);
    console.log('Serialized Recipient:', serializedRecipient);

    return (
      <TemplateComponent
        playbook={serializedPlaybook}
        recipient={serializedRecipient}
        onAcknowledge={null}
      />
    );

  } catch (error) {
    console.error('Error in template page:', error);
    return <ErrorPage 
      title="Something Went Wrong"
      message="An error occurred while loading the gift acknowledgement page. Please try again later or contact support if the problem persists."
    />;
  }
} 