"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { config } from "@/utils/config";

interface UserData {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  organization_id?: string;
  linkedinCreds: {
    linkedinEmail: string;
    pfp: string;
    jobTitle: string;
    companyName: string;
  };
}

export default function ConnectedPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isVcardProcessing, setIsVcardProcessing] = useState(false);
  const [isVcardUser, setIsVcardUser] = useState(false);
  const [vcardEmail, setVcardEmail] = useState<string>("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = searchParams.get("user");
        const token = searchParams.get("token");
        const vcardUserParam = searchParams.get("vcarduser");
        const vcr = searchParams.get("vcr");
        const vid = searchParams.get("vid");
        console.log("vcr:", vcr);
        console.log("vid:", vid);

        if (
          vcr &&
          vid &&
          vcr !== "null" &&
          vid !== "null" &&
          vid != undefined &&
          vcr != undefined &&
          vid != "undefined" &&
          vcr != "undefined"
        ) {
          try {
            const vcardResponse = await fetch(
              `${config.BACKEND_URL}/v1/vcard/authenticate`,
              {
                method: "POST",
                headers: {
                  accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  key: vcr,
                  secret: vid,
                }),
              }
            );

            if (vcardResponse.ok) {
              const vcardData = await vcardResponse.json();
              console.log("VCard Response:", vcardData);

              // Look for email in links
              if (vcardData.success && vcardData.data && vcardData.data.links) {
                const emailLink = vcardData.data.links.find(
                  (link: any) => link.type === "Email" && link.value
                );

                if (emailLink && emailLink.value) {
                  console.log("Found email from vCard:", emailLink.value);
                  setVcardEmail(emailLink.value);
                  setEmail(emailLink.value);
                }
              }
            }
          } catch (vcardError) {
            console.error("VCard authentication error:", vcardError);
          }
        }

        setUserId(userId);
        setToken(token);

        if (vcardUserParam === "true") {
          setIsVcardUser(true);
        }
        // Temporary workaround: Using /api/users endpoint until backend API changes are implemented
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        console.log("User Data:", data);

        // Transform the data to match our needs
        const userData = data.data || data; // Handle both wrapped and unwrapped responses
        setUserData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          organization_id: userData.organization_id,
          linkedinCreds: {
            linkedinEmail: userData.linkedinCreds?.linkedinEmail,
            pfp: userData.linkedinCreds?.pfp,
            jobTitle: userData.linkedinCreds?.jobTitle,
            companyName: userData.linkedinCreds?.companyName,
          },
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [searchParams]);

  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

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

      // If vcard user, skip work email validation but set cookies and redirect
      if (isVcardUser) {
        // Generate new organization ID with all zeros and last digit as 1
        const newOrgId = userId
          ? `${"0".repeat(Math.max(0, userId.length - 1))}1`
          : "00001";

        // Update user's organization_id in database
        try {
          const updateResponse = await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              organization_id: newOrgId,
            }),
          });

          if (updateResponse.ok) {
            console.log("Organization ID updated successfully:", newOrgId);
          } else {
            console.error("Failed to update organization ID");
          }
        } catch (updateError) {
          console.error("Error updating organization ID:", updateError);
        }

        // Delete existing cookies first
        const cookiesToDelete = [
          "auth_token",
          "user_id",
          "user_email",
          "organization_id",
        ];
        cookiesToDelete.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // Set cookies using userData and token from URL
        const cookieData = {
          auth_token: token,
          user_id: userId,
          user_email: userData?.email || vcardEmail,
          organization_id: newOrgId, // Use the new organization ID
        };

        // Set new cookies
        Object.entries(cookieData).forEach(([key, value]) => {
          if (value) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            document.cookie = `${key}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
          }
        });

        // Store in localStorage as backup
        Object.entries(cookieData).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });

        router.push("/manage-vcard?vcarduser=true");
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
          const cookiesToDelete = [
            "auth_token",
            "user_id",
            "user_email",
            "organization_id",
          ];
          cookiesToDelete.forEach((cookieName) => {
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

          // Close modal and redirect to dashboard or profile based on vcard user
          setIsModalOpen(false);
          //   router.push(isVcardUser ? "/profile?tab=vcard" : "/manage-vcard");
          router.push(isVcardUser ? "/manage-vcard" : "/manage-vcard");
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

  if (isVcardProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-primary-xlight">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600 text-lg">Setting up your profile...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-primary-xlight p-4">
      {/* <button
        onClick={() => setIsModalOpen(true)}
        className="absolute right-5 hover:bg-primary-light bottom-5 bg-primary text-white font-medium px-4 py-2 rounded-full"
      >
        Skip..
      </button> */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {vcardEmail ? (
              <h2 className="text-sm md:text-base font-medium text-gray-900 mb-4">
                Confirm your work email to start delighting at scale
              </h2>
            ) : (
              <h2 className="text-sm md:text-base font-medium text-gray-900 mb-4">
                Enter your work email to start delighting at scale
              </h2>
            )}

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
      <div className="flex items-center justify-center mb-4">
        <div className="bg-green-100 rounded-full p-3">
          <svg
            className="w-6 h-6 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
      </div>

      <h1 className="md:text-3xl text-2xl font-bold mb-2 ">
        Successfully Connected
      </h1>
      <p className="md:text-base text-sm text-center text-gray-600 mb-10 font-[450]">
        Your LinkedIn profile has been connected to DelightLoop
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-md border border-gray-200">
        <h2 className="text-xl font-bold mb-1">Your Profile</h2>
        <p className="text-gray-600 text-sm mb-6 font-medium">
          We've imported these details from LinkedIn
        </p>

        <div className="flex items-start mb-6">
          <div className="mr-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              <Image
                src={userData?.linkedinCreds.pfp || "/placeholder-avatar.jpg"}
                alt="Profile picture"
                width={64}
                height={64}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">
              {userData?.firstName} {userData?.lastName}
            </h3>
            <p className="text-gray-600 mb-1 hidden">
              {userData?.linkedinCreds.jobTitle ? (
                <>
                  {userData.linkedinCreds.jobTitle} at{" "}
                  {userData.linkedinCreds.companyName}
                </>
              ) : (
                "Profile details not available"
              )}
            </p>
            <p className="text-gray-500 text-sm">{userData?.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-8">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="text-gray-700">Profile information imported</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="text-gray-700">Account created successfully</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="text-gray-700">Ready to start gifting</span>
          </div>
        </div>

        {isVcardUser ? (
          <button
            onClick={handleSubmit}
            className="w-full font-medium bg-primary text-white py-3 rounded-md flex items-center justify-center hover:bg-opacity-95 transition-colors"
          >
            <span>Manage Your vCard</span>
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </button>
        ) : (
          <Link
            href={`/auth/experience/choose-gift-recipient?user=${userId}&token=${token}`}
            className="w-full font-medium bg-primary text-white py-3 rounded-md flex items-center justify-center hover:bg-opacity-95 transition-colors"
          >
            <span>Start Gifting Now</span>
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
