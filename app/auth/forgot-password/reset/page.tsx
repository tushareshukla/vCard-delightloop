"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import { config } from "@/utils/config";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'expired' | 'invalid' | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const partner = searchParams.get('partner');

  useEffect(() => {
    const validateToken = async () => {
      console.log('[Reset Password] Starting token validation');
      if (!token) {
        console.log('[Reset Password] No token found, redirecting to forgot password page');
        router.push('/auth/forgot-password');
        return;
      }

      try {
        setIsValidating(true);
        const response = await fetch(`${config.BACKEND_URL}/v1/password-reset/validate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        console.log('[Reset Password] Token validation response:', data);

        if (!response.ok) {
          if (data.error === 'Token expired') {
            setTokenStatus('expired');
          } else {
            setTokenStatus('invalid');
          }
          return;
        }

        setTokenStatus('valid');
      } catch (error) {
        console.error('[Reset Password] Token validation error:', error);
        setTokenStatus('invalid');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Reset Password] Starting password reset process');
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      console.log('[Reset Password] Passwords do not match');
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('[Reset Password] Password does not meet strength requirements');
      setError("Password must be at least 8 characters long and contain letters, numbers, and special characters");
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Reset Password] Sending reset request to API');
      const response = await fetch(`${config.BACKEND_URL}/v1/password-reset/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password })
      });

      console.log('[Reset Password] Received response:', response.status);
      const data = await response.json();
      console.log('[Reset Password] Response data:', data);

      if (!response.ok) {
        console.error('[Reset Password] API error:', data.error);
        throw new Error(data.error || 'Failed to reset password');
      }

      if (!data.success) {
        console.error('[Reset Password] API returned unsuccessful:', data.error);
        throw new Error(data.error || 'Failed to reset password');
      }

      // Navigate to success page
      console.log('[Reset Password] Password reset successful, navigating to success page');
      const params = new URLSearchParams();
      if (partner) {
        params.append('partner', partner);
      }
      router.push(`/auth/forgot-password/reset-success?${params.toString()}`);

    } catch (err) {
      console.error('[Reset Password] Error:', err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <InfinityLoader width={56} height={56} />
      </div>
    );
  }

  if (tokenStatus === 'expired') {
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
          <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-[32px] font-semibold text-[#101828]">Reset Link Expired</h1>
            <p className="text-base text-[#667085]">
              This password reset link has expired. Please request a new password reset link.
            </p>
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
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="flex h-screen w-full relative">
        {/* Logo Section */}
        <div className="absolute top-5 opacity-0 left-1/2 transform -translate-x-1/2 lg:left-5 lg:transform-none z-10">
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
          <div className="flex flex-col items-center space-y-6 w-full max-w-[450px] mx-auto text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-[32px] font-semibold text-[#101828]">Invalid Reset Link</h1>
            <p className="text-base text-[#667085]">
              This password reset link is invalid or has already been used. Please request a new password reset link.
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-4 text-[#6941C6] hover:text-[#5a35b1] font-medium inline-flex items-center"
            >
              Request New Reset Link
            </Link>
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
      </div>
    );
  }

  console.log('[Reset Password] Rendering reset form');
  return (
    <div className="flex h-screen w-full relative">
      {/* Logo Section */}
      <div className="absolute top-5 opacity-0 pointer-events-none left-1/2 transform -translate-x-1/2 lg:left-5 lg:transform-none z-10">
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
          <div className="w-full">
            {/* Lock Icon */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-[#F4EBFF] rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#7F56D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#7F56D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="text-[32px] font-semibold mb-2 text-[#101828] text-center">Set new password</h1>
            <p className="font-normal text-base text-[#667085] mb-8 text-center">
              Must be at least 8 characters and contain letters, numbers, and special characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-[#344054] text-sm font-medium mb-1"
                >
                  New password*
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    console.log('[Reset Password] Password input changed');
                    setPassword(e.target.value);
                  }}
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                  placeholder="Enter your new password"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-[#344054] text-sm font-medium mb-1"
                >
                  Confirm new password*
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    console.log('[Reset Password] Confirm password input changed');
                    setConfirmPassword(e.target.value);
                  }}
                  className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:bg-[#6941C6] focus:outline-none focus:ring-2 focus:ring-[#7F56D9] flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? <InfinityLoader width={24} height={24} /> : "Reset password"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/"
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-70 flex items-center justify-center z-50">
          <InfinityLoader width={56} height={56} />
        </div>
      )}

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
