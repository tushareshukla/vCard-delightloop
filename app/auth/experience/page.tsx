"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { config } from "@/utils/config";

export default function AuthPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const returning = searchParams.get("returning");
    if (returning) {
      setIsModalOpen(true);
    }
    const linkedin=searchParams.get("li");
    const signature=searchParams.get("sig");
    const source=searchParams.get("src");
    if (linkedin&&signature&&source) {
            // Save the entire current URL
    const currentUrl = window.location.href;
     // Set cookie with 7 days expiration
     const expiryDate = new Date();
     expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiration

     // Set cookie with SameSite and Secure flags
     document.cookie = `promoLink=${encodeURIComponent(currentUrl)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;

    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userId = searchParams.get("user");
      const token = searchParams.get("token");

      console.log("Request Details:", {
        userId,
        token,
        email,
      });

      if (!userId || !token) {
        setError("Missing authentication details. Please try again.");
        return;
      }

      const response = await fetch(
        `${config.BACKEND_URL}/v1/auth/validate/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workEmail: email,
          }),
        }
      );

      // Get text response first
      const responseText = await response.text();
      console.log("Raw Response:", responseText);

      // Try parsing as JSON
      try {
        const data = JSON.parse(responseText);

        // Check if response contains error
        if (data.error_code) {
          console.error("API Error:", data);
          setError(data.error_message || "An error occurred");
          return;
        }

        // Handle successful response with cookie data
        if (data.cookieData) {
          console.log("Cookie Data:", data.cookieData);
          console.table(data.cookieData);

          // Delete existing cookies first (set expired date)
        const cookiesToDelete = ["auth_token", "user_id", "user_email", "organization_id"];
        cookiesToDelete.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

          // Set new cookies with values from response
          Object.entries(data.cookieData).forEach(([key, value]) => {
            // Set cookie with 1 day expiration
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            document.cookie = `${key}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
          });

            // Also store in localStorage as backup
        Object.entries(data.cookieData).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });

          // Close modal and redirect to dashboard
          setIsModalOpen(false);
          router.push("/dashboard");
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setError("Unexpected response from server");
      }
    } catch (error) {
      console.error("Request failed:", error);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-primary-xlight p-4">
      <Image
        src="/Logo Final.png"
        alt="DelightLoop Logo"
        className="w-40 md:w-48 mb-8"
        width={200}
        height={100}
      />

      <h1 className="md:text-3xl text-2xl font-bold mb-2">
        Welcome to DelightLoop
      </h1>
      <p className="md:text-base text-sm text-center text-gray-600 mb-6 font-medium">
        Sign in to start sending personalized AI-powered gifts
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-md">
        {!showEmailForm ? (
          <>
            <a
              href={`${config.BACKEND_URL}/v1/auth/linkedin`}
              className="w-full font-medium bg-primary hover:bg-opacity-95 text-white py-3 rounded-md flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                setIsLoading(true);
                window.location.href =
                  `${config.BACKEND_URL}/v1/auth/linkedin`;
              }}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  Sign in with LinkedIn
                </>
              )}
            </a>

            {/* <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="px-4 text-gray-500 text-sm">OR</div>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div> */}

            <button
              className="w-full  hidden border hover:bg-gray-50 font-medium border-gray-300 text-gray-700 py-3 rounded-md  items-center justify-center"
              onClick={() => setShowEmailForm(true)}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Sign in with Email
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button className="w-full  font-medium  bg-primary hover:bg-opacity-95 text-white py-3 rounded-md mb-3">
              Sign In with Email
            </button>

            <button
              className="w-full text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmailForm(false)}
            >
              Back to sign in options
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-6 text-center">
        By signing in, you agree to our{" "}
        <Link href="#" className="text-blue-600 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-blue-600 hover:underline">
          Privacy Policy
        </Link>
      </p>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-sm md:text-base font-medium text-gray-900 mb-4">
              Enter your work email to start delighting at scale
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full border border-gray-200 rounded-lg p-2 mb-4"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}
