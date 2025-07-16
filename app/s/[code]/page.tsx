"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function ShortUrlRedirect() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shortCode = params.code as string;

  useEffect(() => {
    const fetchLongUrl = async () => {
      try {
        if (!shortCode) {
          setError("Invalid short URL");
          setLoading(false);
          return;
        }

        // Call our API to get the long URL
        const response = await fetch(`/api/short-url/${shortCode}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to resolve short URL");
        }
        
        const data = await response.json();
        
        // Redirect to the long URL
        if (data.longUrl) {
          window.location.href = data.longUrl;
        } else {
          setError("Invalid short URL");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error resolving short URL:", err);
        setError(err.message || "Error resolving short URL");
        setLoading(false);
      }
    };

    fetchLongUrl();
  }, [shortCode]);

  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-9 px-11">
      <div className="mb-8">
        <Image src="/Logo Final.png" alt="DelightLoop" width={157} height={50} />
      </div>
      <div className="flex flex-col items-center justify-center h-[80vh]">
        {loading && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-primary mb-4">Redirecting...</h1>
            <p className="text-gray-700">Please wait while we redirect you to your destination.</p>
          </div>
        )}
        
        {error && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              If you believe this is a mistake, please contact support.
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 