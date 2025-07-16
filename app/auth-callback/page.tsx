"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';
  const isError = status === 'error';

  useEffect(() => {
    if (status) {
      router.refresh();
    }
  }, [status, router]);

  useEffect(() => {
    if (status) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'refresh';
      meta.content = '3;url=javascript:window.close()';
      document.head.appendChild(meta);
    }
  }, [status]);

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome
          </h1>
          
          <p className="text-gray-600 mb-8">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {isSuccess ? (
            <svg 
              className="mx-auto h-16 w-16 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg 
              className="mx-auto h-16 w-16 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isSuccess ? 'Success!' : 'Error!'}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message || (isSuccess ? 'Operation completed successfully!' : 'Something went wrong. Please try again.')}
        </p>
        <p className="text-sm text-gray-500">This window will close automatically in 3 seconds...</p>
      </div>
    </div>
  );
} 