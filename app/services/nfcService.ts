// Profile interfaces
export interface ProfileLink {
  type: string;
  url: string;
  label: string;
  subtitle?: string;
}

export interface NFCProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  imageUrl: string;
  verified: boolean;
  links: ProfileLink[];
  email?: string;
  phone?: string;
  handle?: string;
}

/**
 * Fetches NFC profile data based on handle
 * @param handle - The user-editable handle
 * @returns Promise with profile data or null if not found
 */
export async function fetchNFCProfile(handle: string): Promise<NFCProfile | null> {
  try {
    // In a real implementation, this would be an API call to your backend
    // For example:
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/nfc-profiles/${handle}`);
    // if (!response.ok) return null;
    // return await response.json();
    
    // For now, return mock data for demonstration
    return {
      id: `profile-${handle}`,
      name: "Alex Johnson",
      title: "Senior Product Designer",
      company: "Delightloop",
      location: "San Francisco, CA",
      imageUrl: "", // Empty to use placeholder
      verified: true,
      handle: handle,
      links: [
        {
          type: "linkedin",
          url: "https://linkedin.com/in/alexjohnson",
          label: "LinkedIn",
          subtitle: "Connect professionally"
        },
        {
          type: "sms",
          url: "sms:+1234567890",
          label: "Message",
          subtitle: "Send a direct message"
        },
        {
          type: "whatsapp",
          url: "https://wa.me/1234567890",
          label: "WhatsApp",
          subtitle: "Chat with me"
        },
        {
          type: "address",
          url: "https://maps.google.com/?q=San+Francisco",
          label: "Address",
          subtitle: "Meet in person"
        },
        {
          type: "instagram",
          url: "https://instagram.com/alexjohnson",
          label: "Instagram",
          subtitle: "Follow my updates"
        },
        {
          type: "email",
          url: "mailto:alex@delightloop.com",
          label: "Email",
          subtitle: "Send me an email"
        }
      ],
      email: "alex@delightloop.com",
      phone: "+1234567890"
    };
  } catch (error) {
    console.error("Error fetching NFC profile:", error);
    return null;
  }
}

/**
 * Tracks a view of an NFC profile for analytics
 * @param handle - The user-editable handle
 */
export async function trackNFCProfileView(handle: string): Promise<void> {
  try {
    // In a real implementation, this would be an API call to track the view
    // For example:
    // await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/analytics/nfc-view`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ handle })
    // });
    
    // For now, just log the view
    console.log(`View tracked for NFC profile: ${handle}`);
  } catch (error) {
    console.error("Error tracking NFC profile view:", error);
  }
}

/**
 * Creates a vCard string from profile data
 * @param profile - The NFC profile data
 * @returns vCard formatted string
 */
export function createVCardFromProfile(profile: NFCProfile): string {
  return `BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
TITLE:${profile.title}
ORG:${profile.company}
ADR;TYPE=WORK:;;${profile.location};;;;
${profile.email ? `EMAIL:${profile.email}` : ''}
${profile.phone ? `TEL:${profile.phone}` : ''}
URL:${profile.links.find(link => link.type === 'linkedin')?.url || ''}
END:VCARD`;
}

/**
 * Downloads a vCard file for the profile
 * @param profile - The NFC profile data
 */
export function downloadVCard(profile: NFCProfile): void {
  const vcard = createVCardFromProfile(profile);
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${profile.name.replace(/\s+/g, '_').toLowerCase()}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Sends a vCard via SMS
 * @param profile - The NFC profile data
 * @param phoneNumber - The recipient's phone number
 */
export async function sendVCardViaSMS(profile: NFCProfile, phoneNumber: string): Promise<boolean> {
  try {
    // In a real implementation, this would be an API call to your backend service
    // that would handle sending the vCard via SMS
    // For example:
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/send-vcard-sms`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     profileId: profile.id,
    //     phoneNumber: phoneNumber
    //   })
    // });
    // return response.ok;
    
    // For now, simulate a successful API call
    console.log(`Sending vCard for ${profile.name} to ${phoneNumber} via SMS`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error("Error sending vCard via SMS:", error);
    return false;
  }
}

/**
 * Sends a vCard via Email
 * @param profile - The NFC profile data
 * @param emailAddress - The recipient's email address
 */
export async function sendVCardViaEmail(profile: NFCProfile, emailAddress: string): Promise<boolean> {
  try {
    // In a real implementation, this would be an API call to your backend service
    // that would handle sending the vCard via email
    // For example:
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/send-vcard-email`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     profileId: profile.id,
    //     emailAddress: emailAddress
    //   })
    // });
    // return response.ok;
    
    // For now, simulate a successful API call
    console.log(`Sending vCard for ${profile.name} to ${emailAddress} via Email`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error("Error sending vCard via Email:", error);
    return false;
  }
} 