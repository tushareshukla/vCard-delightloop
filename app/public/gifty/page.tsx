'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Briefcase, Award, MessageSquare, Gift, BookOpen, Check, X } from "lucide-react";
import { tsParticles } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

interface Gift {
  giftId: string;
  sku: string;
  name: string;
  descShort: string;
  confidence: number;
  rationale: string;
  primaryImgUrl: string;
}

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
    }>;
  };
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

const getApiBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env === 'sandbox') {
    return 'https://sandbox-api.delightloop.ai';
  } else if (env === 'production') {
    return 'https://api.delightloop.ai';
  }
  return 'https://sandbox-api.delightloop.ai'; // default to development
 //return 'http://localhost:5500';
};

const analysisSteps = [
  { icon: Search, text: 'Scanning LinkedIn profile...', duration: 10000 },
  { icon: User, text: 'Analyzing user data...', duration: 10000 },
  { icon: Briefcase, text: 'Examining job history...', duration: 10000 },
  { icon: Award, text: 'Evaluating skills and recommendations...', duration: 10000 },
  { icon: MessageSquare, text: 'Reviewing posts and comments...', duration: 10000 },
  { icon: Gift, text: 'Curating personalized gifts...', duration: 5000 },
  { icon: BookOpen, text: 'Finalizing recommendations...', duration: 5000 },
];

export default function GiftyPage() {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [animationController, setAnimationController] = useState<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

   useCallback(async (container: Container | undefined) => {
    if (container) {
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
    }
  }, []);

  const validateAndFormatLinkedInUrl = (input: string): string | null => {
    // Remove any whitespace
    input = input.trim();

    // If it's just a profile name/handle
    if (!input.includes('/') && !input.includes('.')) {
      return `https://www.linkedin.com/in/${input}/`;
    }

    // Create a URL object to parse the input (add https if missing)
    let url;
    try {
      url = new URL(input.startsWith('http') ? input : `https://${input}`);
    } catch {
      return null;
    }

    // Check if it's a LinkedIn URL
    if (!url.hostname.includes('linkedin.com')) {
      return null;
    }

    // Ensure the path starts with /in/
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts[0] !== 'in') {
      return null;
    }

    // Extract just the profile name/handle, removing any trailing slashes or query parameters
    const profileName = pathParts[1].replace(/\/$/, '');

    // Construct the standardized URL
    return `https://www.linkedin.com/in/${profileName}/`;
  };

  const handleLinkedInUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setLinkedinUrl(input);
    setInputError('');
    setLinkedinProfile(null); // Reset profile when URL changes
  };

  const fetchLinkedInProfile = async (profileUrl: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(
        `${getApiBaseUrl()}/v1/recipients/linkedin-profile?profile=${profileUrl}`,
        {
          headers: {
            accept: '*/*'
          },
        }
      );
      
      if (!response.ok) {
        console.log('LinkedIn API response not OK:', response.status);
        setInputError("🔍 Hmm... We couldn't find this profile. Could you check if the URL is correct or try a different profile? Sometimes profiles can be tricky to find!");
        return null;
      }

      const data = await response.json();
      if (!data.success) {
        console.log('LinkedIn API returned unsuccessful:', data);
        setInputError("✨ Almost there! Double-check the profile URL – our AI is eager to work its magic!");
        return null;
      }

      setLinkedinProfile(data);
      return data;
    } catch (error) {
      console.log('Error in fetchLinkedInProfile:', error);
      setInputError("🌟 Oops! Our AI took a coffee break. Let's try that again in a moment!");
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');
    setApiError(null);

    const formattedUrl = validateAndFormatLinkedInUrl(linkedinUrl);

    if (!formattedUrl) {
      setInputError("Hmm... 🤔 That doesn't quite look like a LinkedIn profile. Try something like 'johndoe' or 'linkedin.com/in/johndoe'");
      return;
    }

    if (!linkedinProfile) {
      const profile = await fetchLinkedInProfile(formattedUrl);
      if (!profile) {
        // Error already set in fetchLinkedInProfile
        return;
      }
    }

    setIsAnalyzing(true);
    setShowResults(false);
    setCurrentStep(0);
    setShowCelebration(false);

    // Create an AbortController for the animation
    const controller = new AbortController();
    setAnimationController(controller);

    // Start the animation immediately
    const animationPromise = (async () => {
      try {
        for (let i = 0; i < analysisSteps.length; i++) {
          if (controller.signal.aborted) {
            break;
          }
          setCurrentStep(i);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, analysisSteps[i].duration);
            controller.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Animation aborted'));
            });
          });
        }
      } catch (error) {
        if (error.message !== 'Animation aborted') {
          throw error;
        }
      }
    })();

    // Make API call in parallel
    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/gift-recommendation/hyper-personalized`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkedinUrl: formattedUrl,
          giftingContext: {
            maxBudget: 100,
            bundleIds: [
              "67b6ec37baa1bd5aba465a45"
            ]
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle error - stop animation immediately
        controller.abort();
        setApiError("✨ Our gift-finding elves are taking a quick tea break! Their magic wands need a moment to recharge with extra sparkle. ✨");
        console.error('Failed to fetch gift recommendations:', result.error);
        return;
      }

      // On success, speed up remaining animation steps
      if (result.data) {
        // Abort current animation
        controller.abort();

        // Create new controller for quick completion
        const completionController = new AbortController();
        setAnimationController(completionController);

        // Quickly complete remaining steps
        const remainingSteps = analysisSteps.length - currentStep;
        for (let i = currentStep; i < analysisSteps.length; i++) {
          if (completionController.signal.aborted) {
            break;
          }
          setCurrentStep(i);
          // Use much shorter duration for remaining steps
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 200); // 200ms per step for quick completion
            completionController.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Animation aborted'));
            });
          });
        }

        // Show results
        setGifts(result.data);
        setShowResults(true);
        setShowCelebration(true);
      }
    } catch (error) {
      // Handle error - stop animation immediately
      controller.abort();
      setApiError("🌟 Our magical gift-finding compass is recalibrating! Give it a moment to find its sparkle again. ✨");
      console.error('Error fetching gift recommendations:', error);
    } finally {
      setIsAnalyzing(false);
      setAnimationController(null);
    }
  };

  useEffect(() => {
    let container: Container | undefined;

    const initParticles = async () => {
      await loadSlim(tsParticles);
      if (showCelebration) {
        container = await tsParticles.load("confetti", {
          particles: {
            number: {
              value: 40,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: ["#7F56D9", "#9E77ED", "#F4EBFF", "#FFD700", "#FF69B4"]
            },
            shape: {
              type: ["circle", "square", "star"]
            },
            opacity: {
              value: 1,
              random: false,
              anim: {
                enable: true,
                speed: 0.2,
                opacity_min: 0,
                sync: false
              }
            },
            size: {
              value: 6,
              random: {
                enable: true,
                minimumValue: 3
              }
            },
            move: {
              enable: true,
              speed: 3,
              direction: "bottom",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              gravity: {
                enable: true,
                acceleration: 0.2
              }
            },
            life: {
              duration: {
                value: 8,
                sync: false
              },
              count: 1,
              delay: {
                random: {
                  enable: true,
                  minimumValue: 0.5
                }
              }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: true,
                mode: "repulse"
              }
            },
            modes: {
              repulse: {
                distance: 100,
                duration: 0.4
              }
            }
          },
          retina_detect: true
        });
      }
    };

    initParticles();

    // Longer duration for particles to settle and fade
    const timer = setTimeout(() => {
      if (container) {
        // Gradually fade out particles by updating their properties
        container.options.particles.opacity.value = 0;
        container.options.particles.move.speed = 1;

        // Allow existing particles to settle and fade
        setTimeout(() => {
          container.destroy();
          setShowCelebration(false);
        }, 3000);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.destroy();
      }
    };
  }, [showCelebration]);

  // Cleanup animation controller on unmount
  useEffect(() => {
    return () => {
      if (animationController) {
        animationController.abort();
      }
    };
  }, [animationController]);

  useEffect(() => {
    if (showResults) {
      // Check for text truncation after the content is rendered
      const checkTruncation = () => {
        // Check rationale truncation
        const rationaleElements = document.querySelectorAll('.line-clamp-3');
        rationaleElements.forEach((element) => {
          const isTextTruncated = element.scrollHeight > element.clientHeight;
          element.parentElement?.style.setProperty('--show-tooltip', isTextTruncated ? 'block' : 'none');
        });

        // Check title truncation
        const titleElements = document.querySelectorAll('.line-clamp-1');
        titleElements.forEach((element) => {
          const isTextTruncated = element.scrollWidth > element.clientWidth;
          element.parentElement?.style.setProperty('--show-tooltip', isTextTruncated ? 'block' : 'none');
        });
      };

      checkTruncation();
      // Also check on window resize
      window.addEventListener('resize', checkTruncation);
      return () => window.removeEventListener('resize', checkTruncation);
    }
  
  }, [showResults, gifts]);

  return (
    <main className="bg-[#FDF4FF] min-h-screen py-6 sm:py-9 px-4 sm:px-11 relative overflow-hidden">
      {showCelebration && (
        <>
          <div id="confetti" className="absolute inset-0 pointer-events-none" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                ease: "easeOut",
                times: [0, 0.5, 1],
              }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        </>
      )}

      <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} className="w-32 sm:w-auto mb-16" />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F4EBFF] text-[#7F56D9] text-sm font-medium mb-4">
            AI-Powered Gift Recommendations
          </span>
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl sm:text-5xl font-semibold bg-gradient-to-r from-[#7F56D9] to-[#9E77ED] inline-block text-transparent bg-clip-text">
              Find Perfect Gifts
            </h1>
            <span className="text-4xl sm:text-5xl animate-bounce">🎁</span>
          </div>
          <p className="font-medium mt-6 text-[#475467] max-w-xl mx-auto text-lg">
            Experience thoughtfully curated, personalized gift recommendations powered by advanced AI insights.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={handleLinkedInUrlChange}
                    placeholder="Enter LinkedIn profile name or URL (e.g., johndoe)"
                    className="w-full px-4 py-2.5 pl-11 border border-r-0 border-[#E4E7EC] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-[#101828]"
                    aria-invalid={!!inputError}
                    aria-describedby={inputError ? "linkedin-error" : undefined}
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Image
                      src="/svgs/Linkedin.svg"
                      alt="LinkedIn"
                      width={20}
                      height={20}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setInputError('');
                    setApiError(null);
                    setLinkedinProfile(null); // Clear recipient card
                    setShowResults(false); // Clear gift results if visible
                    setGifts([]); // Clear gifts array
                    const formattedUrl = validateAndFormatLinkedInUrl(linkedinUrl);
                    if (!formattedUrl) {
                      setInputError('Hmm... 🤔 That doesn\'t quite look like a LinkedIn profile. Try something like "johndoe" or "linkedin.com/in/johndoe"');
                      return;
                    }
                    const profile = await fetchLinkedInProfile(formattedUrl);
                    // No need to handle error here as it's handled in fetchLinkedInProfile
                  }}
                  disabled={isLoadingProfile}
                  className="px-4 py-2.5 bg-[#7F56D9] text-white rounded-r-lg hover:bg-[#6941C6] transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2 border border-[#7F56D9]"
                >
                  {isLoadingProfile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
              {inputError && (
                <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-[#F04438]" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-[#B42318]">{inputError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Recipient Card */}
          {linkedinProfile && (
            <div className="mt-8 space-y-4">
              <div className="bg-white rounded-xl border border-[#EAECF0] p-4 sm:p-6">
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
                          <p className="text-xs sm:text-sm text-[#667085]">
                            {`${linkedinProfile.data.position[0].title} at ${linkedinProfile.data.position[0].companyName}`}
                          </p>
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

              {/* Delight Me Button */}
              {!showResults && (
                <button
                  onClick={handleSubmit}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-3 font-medium bg-[#7F56D9] text-white rounded-lg hover:bg-[#6941C6] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Finding Perfect Gifts...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      <span>Delight Me!</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {apiError && !isAnalyzing && (
            <div className="mt-6 bg-[#F4EBFF] border border-[#E4DAEC] rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Gift className="h-5 w-5 text-[#7F56D9]" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-[#7F56D9]">{apiError}</p>
                  <p className="mt-2 text-sm text-[#9E77ED]">✨ Come back in a moment when our elves have recharged their wands!</p>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-8 relative z-0">
              {analysisSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm absolute w-full"
                  initial={{ opacity: 0, y: 100 }}
                  animate={{
                    opacity: index < currentStep ? 0 : 1,
                    y: index < currentStep
                      ? -120 // Float up behind the button
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
          )}

          {showResults && (
            <div className="mt-8 space-y-4 sm:space-y-6 max-w-6xl mx-auto -mx-4 sm:-mx-11 px-4 sm:px-11">
              <div className="space-y-4 sm:space-y-6">
                {gifts.map((gift, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-xl hover:bg-white/95 transition-all duration-300 relative overflow-visible"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <motion.div
                        className="w-full sm:w-28 aspect-square sm:h-28 relative rounded-lg overflow-hidden group flex-shrink-0 cursor-pointer border border-[#F4EBFF]"
                        whileHover={{
                          scale: 1.15,
                          transition: { type: "spring", stiffness: 400, damping: 10 }
                        }}
                        onClick={() => setSelectedImage({ url: gift.primaryImgUrl, alt: gift.name })}
                      >
                        <Image
                          src={gift.primaryImgUrl}
                          alt={gift.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-125"
                        />
                        <div className="absolute inset-0 bg-[#7F56D9] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      </motion.div>
                      <div className="flex-1 min-w-0 overflow-visible">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                          <div className="group relative flex-1">
                            <h4
                              className="font-semibold text-[#101828] text-base sm:text-lg truncate cursor-help max-w-full line-clamp-1"
                            >
                              {gift.name}
                            </h4>
                            <div 
                              className="absolute left-0 bottom-full mb-2 bg-black text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] whitespace-normal max-w-md"
                              style={{
                                display: 'var(--show-tooltip, block)'
                              }}
                            >
                              {gift.name}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 overflow-hidden">{gift.descShort}</p>
                        <div className="group relative mt-2">
                          <p className="text-sm text-[#7F56D9] line-clamp-3">
                            {gift.rationale}
                          </p>
                          <div 
                            className="absolute left-0 bottom-full mb-2 bg-black text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] whitespace-normal max-w-md"
                            style={{
                              display: 'var(--show-tooltip, block)'
                            }}
                          >
                            {gift.rationale}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[#7F56D9] font-semibold bg-[#F4EBFF] px-2 py-1 rounded-full text-xs">
                            #{index + 1} Match
                          </span>

                          <motion.div
                            className="group cursor-pointer relative"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/?quicksend=true&user_id=${linkedinUrl}&gift_id=${gift.giftId}`)}
                          >
                            <motion.div
                              className="flex items-center gap-1 text-sm font-medium bg-gradient-to-r from-[#FF3366] to-[#FF6B4E] bg-clip-text text-transparent"
                              animate={{
                                y: [0, -2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <span>Send this gift</span>
                              <motion.div
                                animate={{
                                  x: [0, 3, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                ✨
                              </motion.div>
                            </motion.div>
                            <div className="absolute h-0.5 w-0 bg-gradient-to-r from-[#FF3366] to-[#FF6B4E] bottom-0 left-0 transition-all duration-300 group-hover:w-full" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[95vw] sm:max-w-[90vw] max-h-[95vh] sm:max-h-[90vh] rounded-lg overflow-hidden bg-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full h-full min-h-[60vh] sm:min-h-[80vh]">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 95vw, 90vw"
                  priority
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
