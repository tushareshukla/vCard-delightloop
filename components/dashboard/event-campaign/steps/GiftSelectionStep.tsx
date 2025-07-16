"use client";

import { useState, useEffect } from "react";
import type { EventCampaignData } from "../EventCampaignWizard";
import { motion } from "framer-motion";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import getBackendApiBaseUrl from "@/utils/apiBaseUrl";
import { useAuth } from "@/app/context/AuthContext";

interface Gift {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  aiMatchScore: number;
  category: string;
}

interface GiftSelectionStepProps {
  campaignData: EventCampaignData;
  updateCampaignData: (data: Partial<EventCampaignData>) => void;
  onNext: () => void;
  onBack: () => void;
  budgetPerRecipient: number;
}

export default function GiftSelectionStep({
  campaignData,
  updateCampaignData,
  onNext,
  onBack,
  budgetPerRecipient,
}: GiftSelectionStepProps) {
  const { authToken, organizationId } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<string[]>(
    campaignData.selectedGiftIds || []
  );
  const [currentGiftIndex, setCurrentGiftIndex] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);

  // Fetch gift recommendations using existing API
  useEffect(() => {
    const fetchGiftRecommendations = async () => {
      try {
        setIsLoading(true);
        setAnalyzing(true);

        // Show loading state for analysis
        setTimeout(() => {
          setAnalyzing(false);
        }, 3000);

        // Get the API base URL
        const baseUrl = await getBackendApiBaseUrl();

        // Construct the API URL for gift recommendations
        const apiUrl = `${baseUrl}/v1/organizations/${organizationId}/gift_recommendations?budget=${budgetPerRecipient}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch gift recommendations: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          // Format gift data from the API response
          const recommendedGifts = data.gifts.map((gift: any) => ({
            _id: gift._id,
            name: gift.name || "Gift Option",
            description: gift.description || "No description available",
            price: gift.price || budgetPerRecipient,
            image: gift.image_url || "/placeholder.svg?height=400&width=400",
            aiMatchScore:
              gift.match_score || Math.floor(Math.random() * 10) + 85, // Default random high score if none provided
            category: gift.category || "General",
          }));

          setGifts(recommendedGifts);
          setAnalysisComplete(true);
        } else {
          throw new Error(data.error || "Failed to fetch gift recommendations");
        }
      } catch (err) {
        console.error("Error fetching gift recommendations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load gift recommendations"
        );

        // Fallback to sample gifts
        const fallbackGifts = [
          {
            _id: "gift_1",
            name: "Premium Tech Gadget Kit",
            description:
              "A collection of essential tech accessories including wireless earbuds, multi-port USB hub, and portable charger.",
            price: 85,
            image:
              "https://via.placeholder.com/400x400.png?text=Tech+Gadget+Kit",
            aiMatchScore: 92,
            category: "Technology",
          },
          {
            _id: "gift_2",
            name: "Leather-Bound Notebook",
            description:
              "Professional leather notebook with premium paper, perfect for capturing ideas and staying organized.",
            price: 65,
            image:
              "https://via.placeholder.com/400x400.png?text=Leather+Notebook",
            aiMatchScore: 87,
            category: "Office",
          },
          {
            _id: "gift_3",
            name: "Modern Desk Organizer",
            description:
              "Sleek desk organizer to maintain a tidy workspace with compartments for stationery and accessories.",
            price: 70,
            image:
              "https://via.placeholder.com/400x400.png?text=Desk+Organizer",
            aiMatchScore: 85,
            category: "Office",
          },
        ];
        setGifts(fallbackGifts);
        setAnalysisComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftRecommendations();
  }, [authToken, organizationId, budgetPerRecipient]);

  const handleGiftSelect = (giftId: string) => {
    setSelectedGifts((prev) => {
      if (prev.includes(giftId)) {
        return prev.filter((id) => id !== giftId);
      } else {
        return [...prev, giftId];
      }
    });
  };

  const handleNextGift = () => {
    if (currentGiftIndex < gifts.length - 1) {
      setCurrentGiftIndex(currentGiftIndex + 1);
    }
  };

  const handlePreviousGift = () => {
    if (currentGiftIndex > 0) {
      setCurrentGiftIndex(currentGiftIndex - 1);
    }
  };

  const handleContinue = () => {
    if (selectedGifts.length > 0) {
      updateCampaignData({ selectedGiftIds: selectedGifts });
      onNext();
    }
  };

  const currentGift = gifts[currentGiftIndex];

  // AI Analysis loading animation
  const renderAnalysisAnimation = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-24 h-24 mb-4">
        <div className="animate-ping absolute h-full w-full rounded-full bg-primary/20"></div>
        <div className="animate-pulse relative flex justify-center items-center rounded-full h-24 w-24 bg-primary/10">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="font-medium text-lg mb-2">AI Gift Analysis in Progress</h3>
      <p className="text-gray-600 animate-pulse text-center max-w-xs">
        Analyzing attendee data to find the perfect gift matches for your
        audience...
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Select Gifts</h2>
      <p className="text-gray-600 mb-8">
        Our AI has analyzed the profiles to curate the perfect gift
        recommendations
      </p>

      {isLoading || analyzing ? (
        renderAnalysisAnimation()
      ) : error && gifts.length === 0 ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Analysis Complete Banner */}
          {analysisComplete && (
            <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Analysis Complete
                    </h3>
                    <p className="text-sm text-gray-600">
                      Based on your budget of ${budgetPerRecipient} per
                      recipient, we've curated personalized gift
                      recommendations.
                    </p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Recommendations Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Gift Carousel */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Gift Image */}
            <div className="md:w-1/2 relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                {currentGift && (
                  <Image
                    src={currentGift.image || "/placeholder.svg"}
                    alt={currentGift.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x400.png?text=Gift+Image";
                    }}
                  />
                )}
                {selectedGifts.includes(currentGift?._id) && (
                  <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* AI Match Score */}
              {currentGift && (
                <div className="flex items-center mt-4">
                  <div className="bg-primary/20 p-2 rounded-md mr-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="font-medium mr-2">AI Match Score:</span>
                      <span className="text-primary font-bold">
                        {currentGift.aiMatchScore}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Arrows */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                <button
                  onClick={handlePreviousGift}
                  disabled={currentGiftIndex === 0}
                  className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-primary transition-colors transform -translate-x-1/2 pointer-events-auto ${
                    currentGiftIndex === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-110 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextGift}
                  disabled={currentGiftIndex === gifts.length - 1}
                  className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-primary transition-colors transform translate-x-1/2 pointer-events-auto ${
                    currentGiftIndex === gifts.length - 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-110 active:scale-95"
                  }`}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Gift Details */}
            <div className="md:w-1/2">
              {currentGift && (
                <motion.div
                  key={currentGiftIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-bold">{currentGift.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {currentGift.category}
                    </span>
                  </div>
                  <p className="text-gray-600">{currentGift.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      ${currentGift.price}
                    </span>
                    <span className="text-gray-500 text-sm">USD</span>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => handleGiftSelect(currentGift._id)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        selectedGifts.includes(currentGift._id)
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {selectedGifts.includes(currentGift._id) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-5 h-5" />
                          Selected
                        </span>
                      ) : (
                        "Select This Gift"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Gift Indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {gifts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentGiftIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentGiftIndex ? "bg-primary" : "bg-gray-300"
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Gifts Summary */}
          {selectedGifts.length > 0 && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">
                Selected Gifts ({selectedGifts.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedGifts.map((giftId) => {
                  const gift = gifts.find((g) => g._id === giftId);
                  return gift ? (
                    <div
                      key={giftId}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200"
                    >
                      <span className="text-sm">{gift.name}</span>
                      <button
                        onClick={() => handleGiftSelect(giftId)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-10 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          <span>Back</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={selectedGifts.length === 0 || isLoading || analyzing}
          className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg transition-colors ${
            selectedGifts.length > 0 && !isLoading && !analyzing
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>Continue</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
