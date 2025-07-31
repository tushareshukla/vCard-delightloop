"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PasswordReset() {
  const searchParams = useSearchParams();
  const partner = searchParams.get('partner');

  return (
    <div className="flex h-screen w-full relative">
      {/* Logo Section */}
      <div className="absolute top-5 left-1/2 opacity-0 transform -translate-x-1/2 lg:left-5 lg:transform-none z-10">
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
            {/* Success Icon */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-[#ECFDF3] rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#12B76A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="text-[32px] font-semibold mb-2 text-[#101828]">Password reset</h1>
            <p className="text-base text-[#667085] mb-8">
              Your password has been successfully reset.<br />
              Click below to log in magically.
            </p>

            {/* Continue Button */}
            <Link
              href="/login"
              className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center mb-6"
            >
              Continue
            </Link>

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
        © Delighto 2025
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
