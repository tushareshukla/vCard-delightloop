'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import InfinityLoader from '@/components/common/InfinityLoader';

interface VerifyEmailClientProps {
  token: string;
}

export default function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [needsResend, setNeedsResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const quicksend = searchParams.get('quicksend');
  const user_id = searchParams.get('user_id');
  const gift_id = searchParams.get('gift_id');
  const isVerifying = useRef(false);
  const email = searchParams.get('email');

  useEffect(() => {
    console.log("email", email);
    const verifyEmail = async () => {
      if (!token || isVerifying.current) return;

      try {
        isVerifying.current = true;
        const response = await fetch(`/api/verify-email/${token}`);
        const data = await response.json();
        console.log("verify email data", data);

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Close tab after showing success message
          setTimeout(() => {
            console.log("searchParams", searchParams.toString());
            const params = new URLSearchParams(searchParams.toString());
            params.delete('email');
            router.push(`/login?${params.toString()}`);
            // window.close();
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
          if (data.userId) {
            setUserId(data.userId);
            setNeedsResend(data.resend || false);
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email');
        console.error('Verification error:', error);
      } finally {
        isVerifying.current = false;
      }
    };

    verifyEmail();

    // Cleanup function
    return () => {
      isVerifying.current = false;
    };
  }, [token, router]);

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'verifying' && (
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
            <div className="mt-4">
              <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {message}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This tab will close automatically in 3 seconds...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-6 space-y-4 flex flex-col items-center">
              { email && (
                <>

                <button
                  onClick={async () => {
                    try {
                      setIsResending(true);
                      // Get user details using stored userId
                      console.log('user id ',userId);


                      const response = await fetch('/api/resend-verification', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          email: email
                        })
                      });
                      const data = await response.json();
                      if (data.success) {
                        setError(null);
                        setMessage('Verification email resent successfully! Please check your inbox.');
                      } else {
                        setError(data.error || 'Failed to resend verification email');
                      }
                    } catch (error) {
                      setMessage(error.message || 'Failed to resend verification email');
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending}
                  className="text-primary hover:text-primary/95 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <InfinityLoader width={16} height={16} />
                      <span>Sending verification email...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span>Resend Verification Link</span>
                    </>
                  )}
                </button>
                {
                    error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )
                }
                </>
              )}
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
