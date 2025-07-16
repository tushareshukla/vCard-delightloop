"use client";

import Image from 'next/image';
import { TemplateProps } from './types';

export default function Template1({ playbook, recipient }: TemplateProps) {
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

  // Function to transform video URL for embedding
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('vimeo.com')) {
      return url.replace('vimeo.com', 'player.vimeo.com/video');
    }
    return url;
  };

  return (
    <div className="relative bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF]">
    {/* Background with gradient and radial effect */}

    {/* Company Logo */}
    {playbook.template?.logoLink && (
      <div className=" w-[248px] h-[48px]  place-self-end absolute top-[6%] right-[10%] 2xl:right-[10%]">
        <Image
          src={playbook.template.logoLink}
          alt="Company Logo"
          fill
          className="object-contain p-1"
        />
      </div>
    )}
    {/* Main Content */}
    <div className="relative w-full min-h-screen flex items-center px-[10%]">
      {/* Left Side Content */}
      <div className="w-full  md:w-[45%] space-y-8 md:pr-8  ">
        <div className="space-y-6 ">
          <h1 className="text-[40px] font-bold text-[#101828] leading-tight">
            Hey {getRecipientName()}
          </h1>
          {playbook.template?.description && (
            <p className="text-2xl text-[#101828] font-medium ">
              {playbook.template.description}
            </p>
          )}
        </div>
      </div>

      {/* Right Side Video */}
      <div className="w-full md:w-[55%] mt-8 md:mt-0 relative">
        {playbook.template?.videoLink ? (
          <>
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#101828]">
            <iframe
              src={getEmbedUrl(playbook.template.videoLink)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              />
          </div>
           <p className="text-sm text-[#475467] flex items-center justify-end mt-4 gap-1.5">
          <span className="font-semibold">Made with</span>{" "}
          ❤️
           <Image src="/Logo Final.png" alt="heart" width={96} height={16} />{" "}
         </p>
              </>
        ) : (
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#101828] flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src="/svgs/video-placeholder.svg"
                alt="Video Placeholder"
                width={48}
                height={48}
              />
              <p className="text-white text-sm">Loading video player...</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Footer */}

  </div>
  );
}
