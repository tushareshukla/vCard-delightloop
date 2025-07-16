"use client";

import Image from 'next/image';
import { TemplateProps } from './types';

export default function Template3({ playbook, recipient }: TemplateProps) {
  // Get recipient's full name
  const getRecipientName = () => {
    if (!recipient) return '{{First Name}}';
    
    // Check both camelCase and snake_case field names
    const firstName = recipient.firstName || recipient.first_name;
    const lastName = recipient.lastName || recipient.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // Fallback to email if name is not available
    const email = recipient.recipient_email || recipient.email;
    if (email) {
      const [emailName] = email.split('@');
      return emailName
        .split(/[._]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    return '{{First Name}}';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          {playbook.template.logoLink && (
            <div className="mb-8">
              <Image 
                src={playbook.template.logoLink} 
                alt="Company Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
          )}

          {/* Recipient Name */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Hey {getRecipientName()}
            </h1>
          </div>

          {/* Media */}
          {playbook.template.mediaUrl && (
            <div className="mb-8">
              <Image
                src={playbook.template.mediaUrl}
                alt="Featured Image"
                width={800}
                height={400}
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <p className="text-xl text-gray-700">{playbook.template.description}</p>
          </div>

          {/* Button - Keep the same style but make it non-interactive */}
          <button
            disabled
            className="w-full py-4 px-6 rounded-lg text-lg font-semibold bg-primary text-white"
          >
            {playbook.template.buttonText || 'Select Gift'}
          </button>

          {/* Additional Info */}
          {playbook.template.buttonLink && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              You will be redirected to select your gift
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 