"use client";

import Image from 'next/image';

interface ErrorPageProps {
  title?: string;
  message?: string;
}

export default function ErrorPage({ 
  title = "Invalid or Expired Link",
  message = "The link you're trying to access is either invalid or has expired. Please contact the sender for a valid link."
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mb-6 inline-block">
            <Image
              src="/svgs/error.svg"
              alt="Error"
              width={64}
              height={64}
              className="mx-auto"
            />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            {title}
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-8">
            {message}
          </p>

          {/* Contact Support Link */}
          <a
            href="mailto:support@delightloop.com"
            className="text-primary hover:text-primary-dark underline text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
} 