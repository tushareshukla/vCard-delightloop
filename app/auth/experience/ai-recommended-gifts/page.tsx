"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface GiftRecommendation {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  aiMatchScore: number;
  selected?: boolean;
}

export default function AIRecommendedGiftsPage() {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [currentGiftIndex, setCurrentGiftIndex] = useState(0);

  // Recipient details from the previous step
  const recipient = {
    name: "Alex Johnson",
    position: "Marketing Director",
    company: "TechCorp Inc.",
  };

  // Gift recommendations
  const giftRecommendations: GiftRecommendation[] = [
    {
      id: "tech-gadget-kit",
      title: "Tech Gadget Kit",
      price: "$85",
      description:
        "This tech gadget kit includes a multi-port USB hub, wireless earbuds, and a smart portable charger. These essential accessories are designed for professionals who are always on the go and need reliable tech solutions to stay connected and productive.",
      image: "/images/tech-gadget-kit.jpg",
      aiMatchScore: 87,
    },
    {
      id: "premium-notebook",
      title: "Premium Leather Notebook",
      price: "$65",
      description:
        "A professional leather-bound notebook with premium paper, perfect for capturing ideas and staying organized. Includes a built-in pen holder and business card slots.",
      image: "/images/premium-notebook.jpg",
      aiMatchScore: 78,
    },
    {
      id: "desk-organizer",
      title: "Modern Desk Organizer",
      price: "$70",
      description:
        "This sleek desk organizer helps maintain a tidy workspace with compartments for stationery, devices, and accessories. Perfect for productivity-focused professionals.",
      image: "/images/desk-organizer.jpg",
      aiMatchScore: 75,
    },
  ];

  // Automatically select the current gift when it changes
  useEffect(() => {
    setSelectedGift(giftRecommendations[currentGiftIndex].id);
  }, [currentGiftIndex, giftRecommendations]);

  const handleNextGift = () => {
    if (currentGiftIndex < giftRecommendations.length - 1) {
      setCurrentGiftIndex(currentGiftIndex + 1);
    }
  };

  const handlePreviousGift = () => {
    if (currentGiftIndex > 0) {
      setCurrentGiftIndex(currentGiftIndex - 1);
    }
  };

  const currentGift = giftRecommendations[currentGiftIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <Image
            src="/Logo Final.png"
            alt="logo"
            className="w-32 md:w-40"
            width={182}
            height={32}
          />
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">AI-Recommended Gifts</h1>
        <p className="text-gray-600 mb-8">
          Based on {recipient.name}'s LinkedIn profile, our AI has selected
          these gifts
        </p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between text-sm">
            <div className="font-medium text-primary">Choose Recipient</div>
            <div className="font-medium text-primary">Select Gift</div>
            <div className="text-gray-400">Send Gift</div>
          </div>
          <div className="flex items-center my-2 ">
            <div className="flex-1 h-2 bg-gray-200 relative rounded-full">
              <div
                className="h-full bg-primary absolute left-0 top-0 rounded-full"
                style={{ width: "66.66%" }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center mt-1">
            <span className="text-xs text-gray-500">Step 2 of 3</span>
          </div>
        </div>
        {/* AI Insights Card */}
        <div className="bg-primary text-white p-4 rounded-lg mb-8">
          <div className="flex items-center mb-3">
            <div className="bg-purple-400/10 rounded-full p-1.5 mr-2">
              <svg
                className="w-5 h-5 text-purple-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">AI Insights</div>
              <p className=" text-purple-100 mb-1 text-xs">
                Analysis for {recipient.name}, {recipient.position} at{" "}
                {recipient.company}
              </p>
            </div>
          </div>

          <p className="text-sm font-medium text-white mt-3 bg-red-50/10 rounded-lg p-3">
            {recipient.name}'s network connections suggest a preference for
            premium professional products that enhance productivity and
            work-life balance.
          </p>
        </div>

        {/* Gift Recommendation Display */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Gift Image */}
          <div className="md:w-1/2 relative">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 relative">
              <Image
                src={currentGift.image}
                alt={currentGift.title}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23f3f4f6'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Cpath d='M148 150.5L188 110.5L228 150.5L268 110.5L308 150.5L348 110.5V210.5H108V110.5L148 150.5Z' fill='%23d1d5db'/%3E%3Ccircle cx='138' cy='95' r='20' fill='%23d1d5db'/%3E%3C/svg%3E";
                }}
              />
              {selectedGift === currentGift.id && (
                <div className="absolute top-3 right-3 bg-purple-600 text-white rounded-full p-1">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex items-center  mt-4">
              <div className="bg-primary/20 p-2 rounded-md mr-3">
                <svg
                  className="w-5 h-5 text-primary/90"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center  mb-1">
                  <span className="font-medium mr-2">AI Match Score:</span>
                  <span className="text-primary font-bold">
                    {currentGift.aiMatchScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gift Details */}
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold mb-1">{currentGift.title}</h2>
            <p className="text-gray-600 mb-3 text-xs">
              {currentGift.price} - Essential tech accessories for professionals
            </p>

            <p className="text-gray-600 mb-6 text-sm">
              {currentGift.description}
            </p>
            {/* Navigation Arrows */}
            <div className="flex mb-6 space-x-2">
              <button
                onClick={handlePreviousGift}
                disabled={currentGiftIndex === 0}
                className={`p-2 border rounded-full hover:rotate-6 duration-300 ${
                  currentGiftIndex === 0
                    ? "text-gray-300 border-gray-200"
                    : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleNextGift}
                disabled={currentGiftIndex === giftRecommendations.length - 1}
                className={`p-2 border rounded-full hover:-rotate-6 duration-300 ${
                  currentGiftIndex === giftRecommendations.length - 1
                    ? "text-gray-300 border-gray-200"
                    : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Gift selection status indicator */}
            {/* <div className="flex items-center justify-center mb-6 text-primary">
              <div className="flex space-x-1">
                {giftRecommendations.map((gift, index) => (
                  <div
                    key={gift.id}
                    className={`w-2 h-2 rounded-full ${
                      index === currentGiftIndex ? "bg-primary" : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
            </div> */}

            <Link
              href={selectedGift ? "/user-onboarding/new/configure-gift" : "#"}
              onClick={(e) => !selectedGift && e.preventDefault()}
              className={`px-4   bg-primary text-sm font-medium w-fit text-white py-2.5 rounded-md flex items-center justify-end place-self-end ${
                selectedGift
                  ? "hover:bg-primary/95"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Continue with Selected Gift
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
