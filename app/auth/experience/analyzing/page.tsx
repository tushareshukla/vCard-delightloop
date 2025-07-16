"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Briefcase, Award, MessageSquare, Gift, BookOpen, Check } from "lucide-react";

interface LinkedInProfile {
  success: boolean;
  data: {
    firstName: string;
    lastName: string;
    headline: string;
    profilePicture: string;
    geo: {
      city: string;
      full: string;
    };
    position: Array<{
      title: string;
      companyName: string;
      employmentType: string;
      companyLogo: string;
    }>;
  };
}

interface Gift {
  giftId: string;
  sku: string;
  name: string;
  descShort: string;
  confidence: number;
  rationale: string;
  primaryImgUrl: string;
}

const DefaultAvatar = () => (
  <div className="w-full h-full bg-[#F4EBFF] flex items-center justify-center">
    <svg
      className="w-1/2 h-1/2 text-[#7F56D9]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const analysisSteps = [
  { icon: Search, text: 'Scanning LinkedIn profile...', duration: 1000 },
  { icon: User, text: 'Analyzing user data...', duration: 1000 },
  { icon: Briefcase, text: 'Examining job history...', duration: 1000 },
  { icon: Award, text: 'Evaluating skills and recommendations...', duration: 1000 },
  { icon: MessageSquare, text: 'Reviewing posts and comments...', duration: 1000 },
  { icon: Gift, text: 'Curating personalized gifts...', duration: 1000 },
  { icon: BookOpen, text: 'Finalizing recommendations...', duration: 1000 },
];

const getApiBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env === 'sandbox') {
    return 'https://sandbox-api.delightloop.ai';
  } else if (env === 'production') {
    return 'https://api.delightloop.ai';
  }
  return 'https://sandbox-api.delightloop.ai'; // default to development
};

export default function AnalyzingProfilePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [animationController, setAnimationController] = useState<AbortController | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfile | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Get LinkedIn profile URL from localStorage
    const profileUrl = localStorage.getItem('linkedinProfileUrl');
    if (!profileUrl) return;

    const fetchProfileAndAnalyze = async () => {
      try {
        // Fetch LinkedIn profile
        const response = await fetch(
          `${getApiBaseUrl()}/v1/recipients/linkedin-profile?profile=${profileUrl}`,
          {
            headers: {
              accept: '*/*'
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch LinkedIn profile');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error('LinkedIn API returned unsuccessful');
        }

        setLinkedinProfile(data);

        // Start the animation
        const controller = new AbortController();
        setAnimationController(controller);

        // Start analysis steps
        for (let i = 0; i < analysisSteps.length; i++) {
          if (controller.signal.aborted) break;
          
          setCurrentStep(i);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, analysisSteps[i].duration);
            controller.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Animation aborted'));
            });
          });
        }

        // Fetch gift recommendations
        const giftResponse = await fetch(`${getApiBaseUrl()}/v1/gift-recommendation/hyper-personalized`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            linkedinUrl: profileUrl,
            giftingContext: {
              maxBudget: 100,
              bundleIds: [
                "67b6ec37baa1bd5aba465a45"
              ]
            }
          })
        });

        const giftData = await giftResponse.json();
        if (!giftResponse.ok || !giftData.success) {
          throw new Error('Failed to fetch gift recommendations');
        }

        setGifts(giftData.data);
        setAnalysisComplete(true);

      } catch (error) {
        console.error('Error:', error);
        setApiError(error.message);
        if (animationController) {
          animationController.abort();
        }
      }
    };

    fetchProfileAndAnalyze();

    return () => {
      if (animationController) {
        animationController.abort();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF4FF] p-4">
      <div className="max-w-2xl w-full mx-auto">
        <h1 className="text-xl font-bold mb-1 mt-2 text-center">
          Analyzing LinkedIn Profile
        </h1>
        <p className="text-gray-600 mb-8 font-medium text-sm text-center">
          Our AI is processing signals from the profile
        </p>

        {/* LinkedIn Profile Card */}
        {linkedinProfile && (
          <div className="bg-white rounded-xl border border-[#EAECF0] p-4 sm:p-6 mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] relative rounded-full overflow-hidden flex-shrink-0 border border-[#EAECF0]">
                {linkedinProfile.data.profilePicture ? (
                  <Image
                    src={linkedinProfile.data.profilePicture}
                    alt={`${linkedinProfile.data.firstName} ${linkedinProfile.data.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1B1D21]">
                      {`${linkedinProfile.data.firstName} ${linkedinProfile.data.lastName}`}
                    </h3>
                    {linkedinProfile.data.position[0] && (
                      <div className="flex items-center text-xs sm:text-sm text-[#667085] mt-1">
                        <span>{linkedinProfile.data.position[0].title}</span>
                        <span className="mx-1">at</span>
                        {linkedinProfile.data.position[0].companyLogo ? (
                          <div className="w-4 h-4 relative mx-1">
                            <Image
                              src={linkedinProfile.data.position[0].companyLogo}
                              alt={linkedinProfile.data.position[0].companyName}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : null}
                        <span>{linkedinProfile.data.position[0].companyName}</span>
                      </div>
                    )}
                  </div>
                  {linkedinProfile.data.geo && (
                    <div className="flex items-center text-xs sm:text-sm text-[#667085]">
                      <svg 
                        className="w-4 h-4 mr-1" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{linkedinProfile.data.geo.full}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Steps Animation */}
        <div className="relative z-0 mb-8 bg-white rounded-lg p-6 shadow-sm">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-3 bg-white rounded-lg p-4 absolute w-full left-0"
              initial={{ opacity: 0, y: 100 }}
              animate={{
                opacity: index < currentStep ? 0 : 1,
                y: index < currentStep
                  ? -120
                  : Math.max(0, (index - currentStep) * 76),
                transition: {
                  opacity: index < currentStep
                    ? { duration: 0.8, ease: "easeOut" }
                    : { duration: 0.5, delay: index * 0.2 },
                  y: index < currentStep
                    ? { duration: 0.8, ease: "easeInOut" }
                    : { duration: 0.5, delay: index * 0.2, ease: "easeOut" }
                }
              }}
            >
              <div className="relative w-6 h-6">
                <AnimatePresence>
                  {index < currentStep ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-6 h-6 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{
                          scale: index === currentStep ? [1, 1.2, 1] : 1,
                          rotate: index === currentStep ? [0, 360, 0] : 0,
                        }}
                        transition={{
                          duration: 3,
                          ease: "easeInOut",
                          times: [0, 0.5, 1],
                          repeat: index === currentStep ? Number.POSITIVE_INFINITY : 0,
                        }}
                      >
                        {<step.icon className={`w-6 h-6 ${
                          index === currentStep ? 'text-[#7F56D9]' : 'text-gray-300'
                        }`} />}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={`${
                index < currentStep ? 'text-green-500' :
                index === currentStep ? 'text-[#7F56D9]' :
                'text-gray-400'
              }`}>
                {step.text.replace('...', '')}
                {index === currentStep && (
                  <motion.span
                    animate={{
                      opacity: [0, 1, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      times: [0, 0.25, 0.5, 0.75, 1]
                    }}
                  >
                    <motion.span
                      animate={{ opacity: [0, 1] }}
                      transition={{ duration: 0.4, delay: 0 }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1] }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1] }}
                      transition={{ duration: 0.4, delay: 1 }}
                    >.</motion.span>
                  </motion.span>
                )}
                {index < currentStep && '...'}
                {index > currentStep && '...'}
              </span>
            </motion.div>
          ))}
          {/* Spacer div to maintain container height */}
          <div style={{ height: `${analysisSteps.length * 76}px` }} />
        </div>

        {apiError && (
          <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#F04438]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-[#B42318]">{apiError}</p>
                <p className="mt-2 text-sm text-[#B42318]">Please try again in a moment.</p>
              </div>
            </div>
          </div>
        )}

        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Analysis Complete!</h1>
            <p className="text-gray-600 mb-8">
              We've identified the perfect gifts
            </p>

            <Link
              href="/auth/experience/ai-recommended-gifts"
              className="bg-[#7F56D9] text-white py-3 px-6 rounded-md flex items-center justify-center hover:bg-[#6941C6] transition-colors inline-flex"
            >
              <span>View Gift Recommendations</span>
              <svg
                className="w-5 h-5 ml-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
