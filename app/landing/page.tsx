"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

interface Recipient {
  firstName: string;
  lastName: string;
  assignedGift?: {
    name: string;
    price: number;
    primaryImgUrl?: string;
    descShort: string;
  };
  acknowledgedTime?: string;
}

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // Adjust speed here (lower number = faster)
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className="relative">
      {displayedText}
      {currentIndex < text.length && (
        <span className="border-r-2 border-primary-xlight animate-blink" />
      )}
    </span>
  );
};

export default function LandingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActualLandingPage />
    </Suspense>
  );
}

function ActualLandingPage() {
  const searchParams = useSearchParams();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // Use shorter parameter names
  const recipientId = searchParams.get("r");
  const campaignId = searchParams.get("c");

  useEffect(() => {
    console.log("Landing page mounted", { recipientId, campaignId });
    
    // If no query parameters, don't try to fetch
    if (!recipientId || !campaignId) {
      console.log("No query parameters - showing test view");
      setLoading(false);
      return;
    }

    const fetchRecipientAndAcknowledge = async () => {
      try {
        // First fetch campaign to check status
        console.log("Fetching campaign details...");
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
        console.log("Campaign API response status:", campaignRes.status);
        
        if (!campaignRes.ok) {
          const errorText = await campaignRes.text();
          console.error("Campaign API Error Response:", errorText);
          throw new Error("Failed to fetch campaign");
        }
        
        const campaignData = await campaignRes.json();
        console.log("Campaign data:", campaignData);
        
        if (!campaignData.success) {
          throw new Error(campaignData.error || "Failed to fetch campaign");
        }

        // Check if campaign is live
        if (campaignData.data.status.toLowerCase() !== "live") {
          throw new Error("This campaign is not currently active");
        }

        // Then fetch recipient
        console.log("Fetching recipient details...");
        const res = await fetch(`/api/recipients/${recipientId}`);
        console.log("Recipient API response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error Response:", errorText);
          throw new Error("Failed to fetch recipient");
        }
        
        const data = await res.json();
        console.log("Recipient data:", data);
        
        if (!data.success) throw new Error(data.error || "Failed to fetch recipient");

        // Validate recipient belongs to campaign
        if (data.data.campaignId !== campaignId) {
          throw new Error("Invalid recipient for this campaign");
        }
        
        setRecipient(data.data);

        // Update acknowledgment time if not already acknowledged
        if (!data.data.acknowledgedTime) {
          console.log("Acknowledging gift...");
          const ackRes = await fetch(`/api/recipients/${recipientId}/acknowledge`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ campaignId }),
          });

          console.log("Acknowledge API response status:", ackRes.status);
          if (ackRes.ok) {
            setAcknowledged(true);
          }
        } else {
          console.log("Gift already acknowledged");
          setAcknowledged(true);
        }
      } catch (err) {
        console.error("Error in fetchRecipientAndAcknowledge:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        console.log("Finished loading");
        setLoading(false);
      }
    };

    fetchRecipientAndAcknowledge();
  }, [recipientId, campaignId]);

  console.log("Rendering with state:", { loading, error, recipient, acknowledged });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show test view when no query parameters
  if (!recipientId || !campaignId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary px-6 py-8 text-white text-center">
              <Image
                src="/img/bigHeaderFromDashboard.png"
                alt="DelightLoop"
                width={200}
                height={40}
                className="mx-auto mb-6"
              />
              <h1 className="text-3xl font-bold">
                Gift Landing Page Test View
              </h1>
              <p className="mt-2 text-primary-xlight">
                Add query parameters to see recipient details
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-yellow-800">How to Test</h2>
                  <p className="mt-2 text-yellow-700">
                    Add the following query parameters to the URL:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-yellow-700">
                    <li>r - The ID of the recipient</li>
                    <li>c - The ID of the campaign</li>
                  </ul>
                  <p className="mt-2 text-yellow-700">
                    Example URL: /landing?r=xxx&c=yyy
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800">Current Status</h2>
                  <pre className="mt-2 text-blue-700 whitespace-pre-wrap">
                    {JSON.stringify({ r: recipientId, c: campaignId }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-center">
          <h1 className="text-2xl font-bold mb-2">Recipient Not Found</h1>
          <p>The requested recipient could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-gray-50">
      <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Background Image and Logo */}
        <div className="relative h-40 rounded-xl overflow-hidden mb-8 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/img/bigHeaderFromDashboard.png")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95" />
          </div>
          <div className="relative h-full flex items-center justify-center">
            <Image
              src="/img/bigHeaderFromDashboard.png"
              alt="DelightLoop"
              width={240}
              height={48}
              className="animate-float"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-slideUp">
          {/* Main Content */}
          <div className="bg-primary px-6 py-12 text-white text-center">
            <h1 className="text-4xl font-bold mb-6 animate-slideInLeft">
              Welcome, {recipient.firstName}!
            </h1>
            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-primary-xlight">
                <TypewriterText text="As you explore this thoughtful gift, we wanted to introduce you to DelightLoop - an AI-powered platform that's transforming how B2B companies build and nurture customer relationships at scale." />
              </p>
            </div>
          </div>

          {/* Gift Section */}
          {recipient.assignedGift && (
            <div className="p-8 animate-slideInRight">
              <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl mx-auto">
                <div className="relative w-56 h-56 flex-shrink-0 transform hover:animate-spin3D">
                  <Image
                    src={recipient.assignedGift.primaryImgUrl || "/placeholder-gift.png"}
                    alt={recipient.assignedGift.name}
                    fill
                    className="object-cover rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    {recipient.assignedGift.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {recipient.assignedGift.descShort}
                  </p>
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 animate-pulse">
                    {acknowledged ? "Gift Acknowledged" : "Gift Received"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Access Content Button */}
          <div className="bg-white px-6 py-8 text-center">
            <div className="animate-slideInRight">
              <a
                href="https://www.delightloop.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 hover:scale-105"
              >
                Access My Exclusive Content
              </a>
            </div>
          </div>

          {/* Gifty AI Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-8 text-center">
            <div className="max-w-2xl mx-auto animate-slideInLeft">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎁</span>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Meet Gifty
              </h2>
              <p className="text-gray-600 mb-6">
                Your AI Digital Worker who builds meaningful relationships through personalized corporate gifting.
              </p>
            </div>
          </div>

          {/* Book Demo Button */}
          <div className="bg-white px-6 py-8 text-center">
            <div className="animate-slideInRight">
              <a
                href="https://www.delightloop.com/bookademo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 hover:scale-105 animate-glow"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 