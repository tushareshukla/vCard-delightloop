"use client";
import { config } from "@/utils/config";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckMailPage() {

  //const userData = getUserFromCookie();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const partner = searchParams.get('partner');
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      console.log('[Resend Email] Starting resend process for:', email);
      const response = await fetch(`${config.BACKEND_URL}/v1/password-reset/request?vcardflow=true`, {
        //const response = await fetch(`http://localhost:5500/v1/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'//,
          // "Authorization": `Bearer ${userData.authToken}`
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('[Resend Email] Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email');
      }

      setResendSuccess(true);
      console.log('[Resend Email] Successfully resent email');
    } catch (error: any) {
      console.error('[Resend Email] Error:', error);
      setResendError(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex h-screen w-full relative">
      {/* Logo Section */}
      <div className="absolute top-5 left-1/2 transform opacity-0 -translate-x-1/2 lg:left-5 lg:transform-none z-10">
        {partner === "get-replies" ? (
          <Link href="https://www.delightloop.com/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/partner-integrations/g-replies.png"
              alt="Logo"
              className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
              width={189}
              height={48}
              priority
            />
          </Link>
        ) : (
          <Link href="https://www.delightloop.com/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/svgs/Logo.svg"
              alt="Logo"
              className="w-[120px] sm:w-[150px] lg:w-[189px] h-auto"
              width={189}
              height={48}
              priority
            />
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-2/3 flex items-start lg:items-center justify-center bg-white px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8 h-full overflow-y-auto">
        <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto">
          <div className="w-full text-center">
            {/* Email Icon */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-[#F4EBFF] rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6M22 6L12 13L2 6" stroke="#7F56D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="text-[32px] font-semibold mb-2 text-[#101828]">Check your email</h1>
            <p className="text-base text-[#667085] mb-8">
              We sent a password reset link to<br />
              <span className="text-[#101828] font-medium">{email}</span>
            </p>

            {/* Open Email App Button */}
            {/* <button
              onClick={() => window.location.href = "mailto:"}
              className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center mb-6"
            >
              Open email app
            </button> */}

            {/* Didn't receive email section */}
            <p className="text-sm text-[#667085]">
              Didn't receive the email?{" "}
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className={`text-[#6941C6] hover:text-[#5a35b1] hover:underline font-medium ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isResending ? 'Sending...' : 'Click to resend'}
              </button>
            </p>

            {/* Error Message */}
            {resendError && (
              <p className="text-sm text-red-500 mt-2">
                {resendError}
              </p>
            )}

            {/* Success Message */}
            {resendSuccess && (
              <p className="text-sm text-green-500 mt-2">
                Reset link has been sent to your inbox.Still can’t find it? Check spam or promotions folder.
              </p>
            )}

            {/* Back to login */}
            <div className="mt-8">
              <Link
                href="/login"
                className="text-[#6941C6] hover:text-[#5a35b1] font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.66667 3.33333L2 8M2 8L6.66667 12.6667M2 8H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to log in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="hidden lg:flex lg:w-[40%] h-screen relative">
        <Image
          src="/img/LoginPhoto.jpg"
          alt="LOGIN IMAGE"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      <p className="absolute bottom-5 left-5 font-[400] text-[14px] text-[#667085]">
        © DelightLoop 2025
      </p>
      {partner === "get-replies" && (
        <p className="absolute bottom-5 right-[45%] font-[400] text-[14px] text-[#667085] flex items-center gap-2">
          Powered by{" "}
          <Link
            href="https://www.delightloop.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/Logo Final.png"
              alt="Logo"
              width={103}
              height={26}
              priority
            />
          </Link>
        </p>
      )}
    </div>
  );
}
