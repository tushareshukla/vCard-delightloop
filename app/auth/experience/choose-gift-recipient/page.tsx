"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Briefcase,
  Award,
  MessageSquare,
  Gift,
  BookOpen,
  Check,
  MapPin,
  Heart,
} from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import AIDataProcessor, {
  type CompanyData,
} from "../../../../components/ai-data-processor";
import { useSearchParams } from "next/navigation";
import GiftSelectionProgress from "@/components/ui/GiftSelectionProgress";
import { env } from "process";
import confetti from "canvas-confetti";
//import Cookies from "js-cookie";
import { cookies } from "next/headers";
interface LinkedInContact {
  id: string;
  name: string;
  position: string;
  company: string;
  companyLogo: string;
  connectionDegree: string;
  profilePicture?: string;
}

type AnalysisStepType =
  | "profile"
  | "location"
  | "currentJob"
  | "previousJobs"
  | "skills"
  | "certifications"
  | "education"
  | "posts"
  | "engagement";

interface AnalysisStep {
  icon: any;
  text: string;
  duration: number;
  data?: {
    type: AnalysisStepType;
    content: any;
  };
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
      companyLogo: string;
      companyIndustry?: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    skills: Array<{
      name: string;
      endorsements?: number;
    }>;
    educations: Array<{
      degree: string;
      schoolName: string;
      logo: Array<{
        url: string;
      }>;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    certifications: Array<{
      name: string;
      company: {
        logo: string;
        name: string;
      };
      issueDate: string;
      expiryDate?: string;
    }>;
    languages: Array<{
      name: string;
      proficiency: string;
    }>;
    interests: Array<{
      name: string;
      category: string;
    }>;
    posts?: Array<{
      title: string;
      content: string;
      date: string;
    }>;
    comments?: Array<{
      content: string;
      date: string;
    }>;
    likes?: Array<{
      type: string;
      date: string;
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
  price: number;
}

const ProcessingSignal = () => (
  <motion.div
    className="flex items-center space-x-1.5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-primary rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut",
        }}
      />
    ))}
  </motion.div>
);

const DataFlow = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    className="w-full overflow-hidden mt-3"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  </motion.div>
);

const getAnalysisSteps = (profile: LinkedInProfile): AnalysisStep[] => {
  const totalDuration = 60000; // 60 seconds
  const stepDuration = Math.floor(totalDuration / 9); // 9 steps including gift curation

  const steps: AnalysisStep[] = [
    {
      icon: User,
      text: "Profile Summary",
      duration: stepDuration,
      data: {
        type: "profile",
        content: {
          name: `${profile.data.firstName} ${profile.data.lastName}`,
          headline: profile.data.headline,
          profilePicture: profile.data.profilePicture,
        },
      },
    },
    {
      icon: Briefcase,
      text: "Current Position",
      duration: stepDuration,
      data: {
        type: "currentJob",
        content: {
          position: profile.data.position[0],
        },
      },
    },
    {
      icon: Briefcase,
      text: "Previous Experience",
      duration: stepDuration,
      data: {
        type: "previousJobs",
        content: {
          positions: profile.data.position.slice(1),
        },
      },
    },
    {
      icon: Award,
      text: "Skills & Expertise",
      duration: stepDuration,
      data: {
        type: "skills",
        content: {
          skills: profile.data.skills,
        },
      },
    },
    {
      icon: Award,
      text: "Certifications",
      duration: stepDuration,
      data: {
        type: "certifications",
        content: {
          certifications: profile.data.certifications,
        },
      },
    },
    {
      icon: BookOpen,
      text: "Education",
      duration: stepDuration,
      data: {
        type: "education",
        content: {
          education: profile.data.educations,
        },
      },
    },
    {
      icon: MessageSquare,
      text: "Posts & Articles",
      duration: stepDuration,
      data: {
        type: "posts",
        content: {
          posts: profile.data.posts || [],
        },
      },
    },
    {
      icon: Heart,
      text: "Engagement",
      duration: stepDuration,
      data: {
        type: "engagement",
        content: {
          comments: profile.data.comments || [],
          likes: profile.data.likes || [],
        },
      },
    },
    {
      icon: Gift,
      text: "Curating Personalized Gifts",
      duration: stepDuration,
    },
  ];
  return steps;
};

const getApiBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env === "sandbox") {
    return "https://sandbox-api.delightloop.ai";
  } else if (env === "production") {
    return "https://api.delightloop.ai";
  }
  return "https://sandbox-api.delightloop.ai"; // default to development
};

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

const StepDataDisplay = ({ step }: { step: AnalysisStep }) => {
  if (!step.data) return null;

  const renderLogo = (
    logo: string | undefined,
    name: string,
    size: "sm" | "md" = "sm"
  ) => {
    const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";

    return (
      <div
        className={`${sizeClasses} relative rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0`}
      >
        {logo ? (
          <Image src={logo} alt={name} fill className="object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">
              {name?.charAt(0) || "?"}
            </span>
          </div>
        )}
      </div>
    );
  };

  switch (step.data.type) {
    case "profile":
      const profileData = step.data.content;
      if (!profileData) return null;

      return (
        <DataFlow>
          <div className="flex items-center space-x-4 px-4 md:px-6">
            {renderLogo(
              profileData.profilePicture,
              profileData.name || "User",
              "md"
            )}
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {profileData.name || "Anonymous User"}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {profileData.headline || "No headline available"}
              </div>
            </div>
          </div>
        </DataFlow>
      );

    case "currentJob":
      const currentJob = step.data.content?.position;
      if (!currentJob) return null;

      return (
        <DataFlow>
          <div className="flex items-center space-x-4 px-4 md:px-6">
            {renderLogo(
              currentJob.companyLogo,
              currentJob.companyName || "Company"
            )}
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {currentJob.title || "Position"}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {currentJob.companyName || "Company"}
              </div>
            </div>
          </div>
        </DataFlow>
      );

    case "previousJobs":
      const previousJobs = step.data.content?.positions || [];
      if (previousJobs.length === 0) return null;

      return (
        <DataFlow>
          <div className="flex space-x-4 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
            {previousJobs.map((job, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center space-x-3"
              >
                {renderLogo(job.companyLogo, job.companyName || "Company")}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate max-w-[150px]">
                    {job.companyName || "Company"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.startDate ? job.startDate.split("-")[0] : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataFlow>
      );

    case "skills":
      const skills = step.data.content?.skills || [];
      if (skills.length === 0) return null;

      return (
        <DataFlow>
          <div className="flex flex-wrap gap-2 px-4 md:px-6">
            {skills.slice(0, 5).map((skill, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-primary/10 rounded-full text-sm"
              >
                <span className="text-primary">{skill.name || "Skill"}</span>
                {skill.endorsements && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({skill.endorsements})
                  </span>
                )}
              </div>
            ))}
          </div>
        </DataFlow>
      );

    case "certifications":
      const certifications = step.data.content?.certifications || [];
      if (certifications.length === 0) return null;

      return (
        <DataFlow>
          <div className="flex space-x-4 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center space-x-3"
              >
                {renderLogo(
                  cert.company?.logo,
                  cert.company?.name || "Company"
                )}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate max-w-[150px]">
                    {cert.name || "Certificate"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cert.company?.name || "Company"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataFlow>
      );

    case "education":
      const education = step.data.content?.education || [];
      if (education.length === 0) return null;

      return (
        <DataFlow>
          <div className="flex space-x-4 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide">
            {education.map((edu, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center space-x-3"
              >
                {renderLogo(edu.logo?.[0]?.url, edu.schoolName || "School")}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate max-w-[150px]">
                    {edu.schoolName || "School"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {edu.degree || "Degree"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataFlow>
      );

    case "posts":
      const posts = step.data.content?.posts || [];
      if (posts.length === 0) return null;

      return (
        <DataFlow>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-6">
            {posts.slice(0, 3).map((post, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2 truncate">
                  {post.title || "Untitled Post"}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {post.content}
                </div>
                <div className="text-xs text-gray-500 mt-2">{post.date}</div>
              </div>
            ))}
          </div>
        </DataFlow>
      );

    case "engagement":
      const { comments = [], likes = [] } = step.data.content || {};
      if (comments.length === 0 && likes.length === 0) return null;

      return (
        <DataFlow>
          <div className="flex items-center justify-center space-x-8 px-4 md:px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-lg font-medium text-gray-900">
                {comments.length}
              </div>
              <div className="text-sm text-gray-500">Comments</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="text-lg font-medium text-gray-900">
                {likes.length}
              </div>
              <div className="text-sm text-gray-500">Likes</div>
            </div>
          </div>
        </DataFlow>
      );

    default:
      return null;
  }
};

const AnalysisStep = ({
  step,
  index,
  currentStep,
  totalSteps,
}: {
  step: AnalysisStep;
  index: number;
  currentStep: number;
  totalSteps: number;
}) => {
  return (
    <motion.div
      className="relative py-4 border-b last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: index <= currentStep ? 1 : 0.5,
        y: 0,
      }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex items-center px-4 md:px-6">
        <div className="w-10 flex-shrink-0">
          <AnimatePresence>
            {index < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <step.icon
                  className={`w-6 h-6 ${
                    index === currentStep ? "text-primary" : "text-gray-300"
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 ml-4">
          <div className="flex items-center">
            <span
              className={`font-medium ${
                index < currentStep
                  ? "text-green-500"
                  : index === currentStep
                  ? "text-primary"
                  : "text-gray-400"
              }`}
            >
              {step.text}
            </span>
            {index === currentStep && <ProcessingSignal />}
          </div>

          {index === currentStep && step.data && (
            <StepDataDisplay step={step} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CompanyTimeline = ({
  positions,
}: {
  positions: LinkedInProfile["data"]["position"];
}) => (
  <div className="flex items-center space-x-2 overflow-x-auto py-2">
    {positions?.map((pos, idx) => (
      <motion.div
        key={idx}
        className="flex flex-col items-center min-w-[80px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.2 }}
      >
        <div className="w-12 h-12 relative mb-2">
          {pos.companyLogo ? (
            <Image
              src={pos.companyLogo}
              alt={pos.companyName || "Company logo"}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs font-medium">
                {pos.companyName?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-center">
          <div className="font-medium truncate">
            {pos.companyName || "Unknown Company"}
          </div>
          <div className="text-gray-500">
            {pos.startDate ? pos.startDate.split("-")[0] : "Present"}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const SkillCloud = ({
  skills,
}: {
  skills: LinkedInProfile["data"]["skills"];
}) => (
  <div className="flex flex-wrap gap-2">
    {skills?.map((skill, idx) => (
      <motion.div
        key={idx}
        className="px-3 py-1 bg-primary/10 rounded-full text-sm"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.1 }}
      >
        <span className="text-primary">{skill.name || "Unknown Skill"}</span>
        {skill.endorsements && (
          <span className="ml-1 text-xs text-gray-500">
            ({skill.endorsements})
          </span>
        )}
      </motion.div>
    ))}
  </div>
);

const ParticleItem = ({
  type,
  content,
}: {
  type: "logo" | "text";
  content: string;
}) => {
  const randomPosition = () => ({
    x: Math.random() * 80 + 10, // Keep particles within 10-90% of the screen
    y: Math.random() * 80 + 10,
  });

  const randomDuration = () => 15 + Math.random() * 10; // 15-25 seconds
  const randomDelay = () => Math.random() * -15;

  const [position] = useState(randomPosition);
  const duration = useMemo(() => randomDuration(), []);
  const delay = useMemo(() => randomDelay(), []);

  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{
        opacity: 0,
        x: `${position.x}%`,
        y: `${position.y}%`,
        scale: 0.5,
      }}
      animate={{
        opacity: [0, 0.8, 0],
        x: [`${position.x}%`, `${(position.x + 20) % 100}%`],
        y: [`${position.y}%`, `${(position.y + 15) % 100}%`],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {type === "logo" ? (
        <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-white shadow-lg">
          <Image
            src={content}
            alt="Logo particle"
            fill
            className="object-contain p-2"
          />
        </div>
      ) : (
        <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <span className="text-sm font-medium text-primary">{content}</span>
        </div>
      )}
    </motion.div>
  );
};

const BackgroundParticles = ({ profile }: { profile: LinkedInProfile }) => {
  // Extract all logos and keywords from the profile
  const particles = useMemo(() => {
    const items: { type: "logo" | "text"; content: string }[] = [];

    // Add company logos and titles
    profile.data.position?.forEach((pos) => {
      if (pos.companyLogo) {
        items.push({ type: "logo", content: pos.companyLogo });
      }
      if (pos.title) {
        items.push({ type: "text", content: pos.title });
      }
    });

    // Add education logos and degrees
    profile.data.educations?.forEach((edu) => {
      if (edu.logo?.[0]?.url) {
        items.push({ type: "logo", content: edu.logo[0].url });
      }
      if (edu.degree) {
        items.push({ type: "text", content: edu.degree });
      }
    });

    // Add certification logos and names
    profile.data.certifications?.forEach((cert) => {
      if (cert.company?.logo) {
        items.push({ type: "logo", content: cert.company.logo });
      }
      if (cert.name) {
        items.push({ type: "text", content: cert.name });
      }
    });

    // Add top skills
    profile.data.skills?.slice(0, 8)?.forEach((skill) => {
      if (skill.name) {
        items.push({ type: "text", content: skill.name });
      }
    });

    // Shuffle array and limit to 40 particles
    return items.sort(() => Math.random() - 0.5).slice(0, 40);
  }, [profile]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10" />
      {particles.map((particle, index) => (
        <ParticleItem
          key={index}
          type={particle.type}
          content={particle.content}
        />
      ))}
    </div>
  );
};

const BrainVisualization = ({
  profile,
  currentStep,
}: {
  profile: LinkedInProfile;
  currentStep: number;
}) => {
  const [particles, setParticles] = useState<
    { type: "input" | "output"; content: string }[]
  >([]);

  useEffect(() => {
    const items: { type: "input" | "output"; content: string }[] = [];

    // Add input items (logos and keywords)
    profile.data.position?.forEach((pos) => {
      if (pos.companyLogo) {
        items.push({ type: "input", content: pos.companyLogo });
      }
      if (pos.title) {
        items.push({ type: "input", content: pos.title });
      }
    });

    profile.data.skills?.slice(0, 5)?.forEach((skill) => {
      if (skill.name) {
        items.push({ type: "input", content: skill.name });
      }
    });

    // Add gift items
    const giftSymbols = ["/gift-box.png", "/idea-bulb.png", "/confetti.png"];
    giftSymbols.forEach((symbol) => {
      items.push({ type: "output", content: symbol });
    });

    setParticles(items);
  }, [profile]);

  return (
    <div className="relative w-full h-[400px] bg-[#1E1B4B] rounded-xl overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#312E81] via-[#1E1B4B] to-[#312E81] opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
      </div>

      {/* Brain SVG in Center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <motion.div
          className="relative w-32 h-32"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Multiple layered glows for depth */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 via-primary/30 to-primary/40 blur-2xl opacity-40" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 blur-xl opacity-30" />
          <div className="absolute inset-0 rounded-full bg-[#312E81]/60 blur-lg" />

          {/* Processing Rings */}
          <motion.div
            className="absolute -inset-4 rounded-full border-2 border-primary/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.1, 0.3],
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Brain SVG */}
          <svg
            width="128"
            height="128"
            viewBox="0 0 48 48"
            className="text-primary relative z-10"
          >
            <defs>
              <style>
                {`.cls-1, .cls-2 {
                  fill: none;
                  stroke: currentColor;
                  stroke-linecap: round;
                  stroke-width: 2px;
                }
                .cls-1 {
                  stroke-linejoin: round;
                }
                .cls-2 {
                  stroke-miterlimit: 10;
                }
                .cls-3 {
                  fill: currentColor;
                }`}
              </style>
            </defs>
            <g>
              <path
                className="cls-1"
                d="M17.30639,11.25243a5.29412,5.29412,0,1,0-10.58824,0,5.23707,5.23707,0,0,0,.584,2.37007A5.27955,5.27955,0,0,0,8.8358,23.95831"
              />
              <path
                className="cls-2"
                d="M3.58191,21.56266a7.00047,7.00047,0,1,0,11.32225,6.78321V28"
              />
              <path
                className="cls-1"
                d="M8.43086,42.32855A6.21606,6.21606,0,0,1,5.108,36.82494a6.14985,6.14985,0,0,1,.68573-2.78316"
              />
              <path className="cls-2" d="M19,16a5,5,0,0,1-5,5" />
              <g>
                <polyline
                  className="cls-2"
                  points="19 16.01 30.5 16.01 32.521 13.99"
                />
                <polyline
                  className="cls-2"
                  points="25.5 20.01 31.5 20.01 33.521 17.99 39 17.99"
                />
                <polyline
                  className="cls-2"
                  points="24.917 31.99 30.5 31.99 32.521 34.01"
                />
                <polyline
                  className="cls-2"
                  points="24.917 27.99 31.5 27.99 33.521 30.01 39 30.01"
                />
                <path
                  className="cls-2"
                  d="M39,38.01018H31.52094l-1.52061-2.02061-4.95867.00011v6.05209a5,5,0,0,1-10,0"
                />
              </g>
              <path
                className="cls-2"
                d="M17.04167,4.13392a4.05277,4.05277,0,0,1,8,.91833V12.01l4.45868.00013L31.521,9.98956H39"
              />
              <line className="cls-2" x1="36" x2="25.04167" y1="24" y2="24" />
              <circle className="cls-3" cx="11" cy="20" r="1" />
              <circle className="cls-3" cx="11.79167" cy="43.5" r="1" />
            </g>
            <circle className="cls-2" cx="41.47922" cy="10" r="2" />
            <circle className="cls-2" cx="41.47922" cy="18" r="2" />
            <circle className="cls-2" cx="41.47922" cy="30" r="2" />
            <circle className="cls-2" cx="41.47922" cy="38" r="2" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Particles */}
      {particles.map((particle, index) => {
        const isInput = particle.type === "input";
        const pathProgress = currentStep / 8; // 8 total steps

        // Calculate dynamic paths based on type
        const startX = isInput ? -10 : 50;
        const endX = isInput ? 50 : 110;
        const startY = 20 + (index % 5) * 15;
        const controlY = 50 + Math.sin(index) * 10;

        return (
          <motion.div
            key={index}
            className="absolute"
            initial={{
              x: `${startX}%`,
              y: `${startY}%`,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: [`${startX}%`, `${(startX + endX) / 2}%`, `${endX}%`],
              y: [`${startY}%`, `${controlY}%`, `${startY}%`],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 5,
              delay: index * 0.3,
              repeat: Infinity,
              repeatDelay: 1,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
          >
            {isInput ? (
              particle.content.startsWith("http") ? (
                <div className="w-12 h-12 bg-[#312E81]/90 backdrop-blur-sm rounded-xl shadow-lg p-2 border border-primary/30">
                  <Image
                    src={particle.content}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="px-4 py-2 bg-[#312E81]/90 backdrop-blur-sm rounded-full shadow-lg border border-primary/30">
                  <span className="text-sm font-medium text-primary/90">
                    {particle.content}
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-[#312E81]/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center border border-primary/30">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <motion.div
                  animate={{
                    rotate: [-10, 10, -10],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ✨
                </motion.div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

const GiftRecommendationDisplay = ({
  gifts,
  linkedinProfileUrl,
  linkedinProfile,
}: {
  gifts: Gift[];
  linkedinProfileUrl: string;
  linkedinProfile: LinkedInProfile | null;
}) => {
  const [selectedGiftIndex, setSelectedGiftIndex] = useState(0);
  const router = useRouter();
  const topGifts = gifts.slice(0, 3);
  const searchParams = useSearchParams();

  const handleNext = () => {
    setSelectedGiftIndex((prev) => (prev + 1) % topGifts.length);
  };

  const handlePrev = () => {
    setSelectedGiftIndex(
      (prev) => (prev - 1 + topGifts.length) % topGifts.length
    );
  };

  const handleContinueWithGift = () => {
    const selectedGift = topGifts[selectedGiftIndex];

    // Extract profile ID from LinkedIn URL
    const profileId = linkedinProfileUrl
      .replace("https://www.linkedin.com/in/", "")
      .replace("http://www.linkedin.com/in/", "")
      .replace("www.linkedin.com/in/", "")
      .replace(/\/$/, "");

    // Get the profile data
    const firstName = linkedinProfile?.data?.firstName || "";
    const lastName = linkedinProfile?.data?.lastName || "";

    const queryParams = new URLSearchParams({
      user_id: searchParams.get("user") || "",
      gift_id: selectedGift.giftId,
      token: searchParams.get("token") || "",
      first_name: firstName,
      last_name: lastName,
      company_name: linkedinProfile?.data?.position?.[0]?.companyName || "",
      position_title: linkedinProfile?.data?.position?.[0]?.title || "",
      linkedin_url: linkedinProfileUrl,
    });

    router.push(
      `/auth/experience/complete-your-gift?${queryParams.toString()}`
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Stack Container */}
          <div className="relative w-full md:w-1/2 aspect-square">
            {/* Stacked Images */}
            <div className="relative w-full h-full">
              {topGifts.map((gift, index) => {
                // Calculate the position in the stack relative to the selected index
                const position =
                  (index - selectedGiftIndex + topGifts.length) %
                  topGifts.length;

                // Reduce rotation angles and adjust offsets
                const rotation = position === 0 ? 0 : position === 1 ? 5 : -5;
                const xOffset = position === 0 ? 0 : position === 1 ? 20 : -20;
                const yOffset = position === 0 ? 0 : 15;
                const scale = position === 0 ? 1 : 0.9;

                return (
                  <motion.div
                    key={gift.giftId}
                    className="absolute inset-0 origin-bottom cursor-pointer"
                    initial={false}
                    animate={{
                      scale,
                      zIndex: topGifts.length - position,
                      opacity: position === 0 ? 1 : 0.5,
                      y: yOffset,
                      x: xOffset,
                      rotate: rotation,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    onClick={() => {
                      if (position === 1) handleNext();
                      if (position === 2) handlePrev();
                    }}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-lg">
                      <Image
                        src={gift.primaryImgUrl}
                        alt={gift.name}
                        fill
                        className="object-contain p-4"
                      />
                      {position === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-4 left-4 bg-[#F9F5FF] text-[#6941C6] font-semibold px-3 py-1.5 rounded-full text-sm"
                        >
                          {Math.round(gift.confidence)}% AI Match
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 -left-2 sm:-left-4 -right-2 sm:-right-4 flex items-center justify-between pointer-events-none">
              <button
                onClick={handlePrev}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-[#6941C6] transition-colors transform -translate-x-1/2 pointer-events-auto hover:scale-110 active:scale-95"
              >
                <svg
                  width="16"
                  height="16"
                  className="sm:w-6 sm:h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-[#6941C6] transition-colors transform translate-x-1/2 pointer-events-auto hover:scale-110 active:scale-95"
              >
                <svg
                  width="16"
                  height="16"
                  className="sm:w-6 sm:h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Gift Details */}
          <div className="flex-1 relative z-10 bg-white">
            <motion.div
              key={selectedGiftIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-semibold text-gray-900">
                  {topGifts[selectedGiftIndex].name}
                </h4>
              </div>
              <p className="text-gray-600">
                {topGifts[selectedGiftIndex].descShort}
              </p>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Why this gift?</h5>
                <p className="text-gray-600 text-sm">
                  {topGifts[selectedGiftIndex].rationale}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    ${topGifts[selectedGiftIndex].price}
                  </span>
                  <span className="text-gray-500 text-sm">USD</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinueWithGift}
                className="w-full bg-[#7F56D9] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#6941C6] transition-colors"
              >
                Continue with Selected Gift →
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisOverlay = ({
  isAnalyzing,
  linkedinProfile,
  currentStep,
  apiError,
  analysisComplete,
  giftRecommendations,
  profileUrl,
}) => {
  if (!isAnalyzing) return null;

  // Add null check for linkedinProfile
  if (!linkedinProfile?.data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full bg-[#F9F5FF] rounded-xl p-6"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-2"></div>
          <h2 className="text-lg font-semibold mb-1 text-[#6941C6]">
            Initializing Analysis
          </h2>
          <p className="text-[#6941C6]/70 text-sm">
            Please wait while we prepare your experience...
          </p>
        </div>
      </motion.div>
    );
  }

  // Parse LinkedIn data for AIDataProcessor
  const parseLinkedInData = () => {
    // Extract companies from the positions
    const companies: CompanyData[] =
      linkedinProfile.data.position?.map((position) => ({
        name: position.companyName || "",
        logo: position.companyLogo || "/placeholder.svg?height=40&width=40",
        title: position.title || "",
      })) || [];

    // Initialize a Map to store keywords with their weights
    const keywordMap = new Map<string, number>();

    // Helper function to add keyword with weight
    const addKeyword = (keyword: string, weight: number) => {
      if (keyword && keyword.length > 2) {
        keywordMap.set(keyword.trim(), (keywordMap.get(keyword) || 0) + weight);
      }
    };

    // 1. Add skills (highest priority, weight: 10)
    linkedinProfile.data.skills?.forEach((skill) => {
      if (skill.name) {
        addKeyword(skill.name, 10 + (skill.endorsements || 0));
      }
    });

    // 2. Add job titles (weight: 8)
    linkedinProfile.data.position?.forEach((position) => {
      if (position.title) addKeyword(position.title, 8);
      if (position.companyIndustry) addKeyword(position.companyIndustry, 7);
    });

    // 3. Add certifications (weight: 7)
    linkedinProfile.data.certifications?.forEach((cert) => {
      if (cert.name) addKeyword(cert.name, 7);
    });

    // 4. Add education (weight: 6)
    linkedinProfile.data.educations?.forEach((edu) => {
      if (edu.degree) addKeyword(edu.degree, 6);
      if (edu.schoolName) addKeyword(edu.schoolName, 6);
    });

    // 5. Add languages (weight: 5)
    linkedinProfile.data.languages?.forEach((lang) => {
      if (lang.name) addKeyword(`${lang.name} (${lang.proficiency})`, 5);
    });

    // 6. Add interests (weight: 4)
    linkedinProfile.data.interests?.forEach((interest) => {
      if (interest.name) addKeyword(interest.name, 4);
    });

    // 7. Extract keywords from job descriptions
    linkedinProfile.data.position?.forEach((position) => {
      if (position.description) {
        const words = position.description.split(/[\s,\.]+/).filter(
          (word) =>
            word.length > 3 && // Filter out short words
            !/^(and|the|for|with|this|that|have|from)$/i.test(word) // Filter out common words
        );

        // Take first 3 significant words from each description
        words.slice(0, 3).forEach((word) => addKeyword(word, 3));
      }
    });

    // Sort keywords by weight and take top 15
    const keywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([keyword]) => keyword)
      .slice(0, 15);

    return {
      companies,
      keywords,
    };
  };

  // If we have gift recommendations, show the new display
  if (giftRecommendations?.length > 0) {
    return (
      <div className="space-y-4">
        {/* Signal Processing Section */}
        <div className="bg-[#F9F5FF] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#6941C6]">
              Analysis Complete
            </h3>
            <div className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              ✨ Recommendations Ready
            </div>
          </div>
          <p className="text-[#6941C6]/70 text-sm">
            Based on our AI analysis of the LinkedIn profile, we've curated
            personalized gift recommendations.
          </p>
        </div>

        {/* New Gift Recommendations Display */}
        <GiftRecommendationDisplay
          gifts={giftRecommendations}
          linkedinProfileUrl={profileUrl}
          linkedinProfile={linkedinProfile}
        />
      </div>
    );
  }

  const { companies, keywords } = parseLinkedInData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full space-y-4"
    >
      {/* Signal Processing Section */}
      <div className="relative bg-[#F9F5FF] rounded-xl p-4 overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-base font-semibold text-[#6941C6] mb-3">
            Signal Processing
          </h3>
          <div className="space-y-2">
            {getAnalysisSteps(linkedinProfile).map((step, index) => (
              <motion.div
                key={index}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  index === currentStep
                    ? "bg-[#F4EBFF] border border-primary/20"
                    : ""
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: index <= currentStep ? 1 : 0.4,
                  x: 0,
                }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="w-6 flex-shrink-0">
                  <AnimatePresence>
                    {index < currentStep ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <step.icon
                          className={`w-5 h-5 ${
                            index === currentStep
                              ? "text-primary"
                              : "text-[#6941C6]/40"
                          }`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 ml-3">
                  <div className="flex items-center">
                    <span
                      className={`text-sm ${
                        index < currentStep
                          ? "text-primary"
                          : index === currentStep
                          ? "text-primary"
                          : "text-[#6941C6]/60"
                      }`}
                    >
                      {step.text}
                    </span>
                    {index === currentStep && (
                      <div className="ml-2">
                        <ProcessingSignal />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Data Processor Visualization */}
      <div className="relative bg-[#F9F5FF] rounded-xl p-4 overflow-hidden hidden">
        <AIDataProcessor
          companies={companies}
          keywords={keywords}
          title="AI Profile Analysis"
          statusText="Processing"
          transitionSpeed={2000}
        />
      </div>
    </motion.div>
  );
};

const WalletAnimation = ({
  onComplete,
  userName,
  voucherAmount,
}: {
  onComplete: () => void;
  userName: string;
  voucherAmount: number;
}) => {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    // Trigger confetti when the component mounts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Show card after a brief delay
    setTimeout(() => setShowCard(true), 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative max-w-md w-full mx-4">
        <AnimatePresence>
          {showCard && (
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              {/* Card Container */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white w-full max-w-md">
                {/* Top Section - Animated Gradient */}
                <div className="relative h-40 p-6">
                  {/* Animated Gradient Background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  />

                  {/* Welcome Text */}
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm mb-1">Welcome</p>
                    <h2 className="text-2xl font-bold text-white">
                      {userName}
                    </h2>
                  </div>
                </div>

                {/* Bottom Section - Solid Color */}
                <div className="relative bg-[#4A2B8C] p-6">
                  <div className="flex justify-between items-center">
                    {/* Balance Section */}
                    <div>
                      <p className="text-white/60 text-sm mb-1">
                        Your Wallet Balance
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-white">
                          ${voucherAmount}
                        </span>
                        <span className="text-white/60 text-sm">USD</span>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="relative w-8 h-8">
                      <Image
                        src="/img/favicon-logo.png"
                        alt="Delightloop"
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message below card */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white text-lg font-medium mb-6">
                  Congratulations! We've added ${voucherAmount} to your wallet
                  <br />
                  so you can send your first gift right away.
                </p>
                <motion.button
                  onClick={onComplete}
                  className="bg-white text-[#4A2B8C] px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105 inline-flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Let's Get Started
                  <span className="ml-2">→</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function ChooseGiftRecipientPage() {
  // Add isAuthenticated state at the top with other states
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // States
  const [activeTab, setActiveTab] = useState("myConnections"); // "myConnections" or "findOnLinkedIn"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [sendToSelf, setSendToSelf] = useState(true); // Set to true by default
  const [expandedSection, setExpandedSection] = useState<"self" | "connection">(
    "self"
  ); // New state for tracking expanded section
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<LinkedInContact[]>([]);
  const [inputError, setInputError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [linkedinProfile, setLinkedinProfile] =
    useState<LinkedInProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [connections, setConnections] = useState<LinkedInContact[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [animationController, setAnimationController] =
    useState<AbortController | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [giftRecommendations, setGiftRecommendations] = useState<Gift[]>([]);

  // Add this state for self LinkedIn URL
  const [selfLinkedInUrl, setSelfLinkedInUrl] = useState("");
  const [selfUrlError, setSelfUrlError] = useState("");
  const [isSelfLoading, setIsSelfLoading] = useState(false);
  const router = useRouter();

  // Add new state for wallet animation
  const [showWalletAnimation, setShowWalletAnimation] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const searchParams = useSearchParams();
  const [voucherAmount, setVoucherAmount] = useState(0);

  // Add these new states at the top with other states
  const [selfSearchResults, setSelfSearchResults] = useState<LinkedInContact[]>(
    []
  );
  const [connectionSearchResults, setConnectionSearchResults] = useState<
    LinkedInContact[]
  >([]);
  const [selfSearchMode, setSelfSearchMode] = useState(false);
  const [connectionSearchMode, setConnectionSearchMode] = useState(false);
  const [selfSearchQuery, setSelfSearchQuery] = useState("");
  const [connectionSearchQuery, setConnectionSearchQuery] = useState("");

  const userName =
    (userData && `${userData.firstName} ${userData.lastName}`) || "Loading...";

  useEffect(() => {
    // Add a flag to prevent double calls
    let isFirstCall = true;

    const fetchPromoDetails = async (promoLinkValue) => {
      try {
        const userId = searchParams.get("user");
        const token = searchParams.get("token");

        if (!userId || !token) {
          console.log("❌ No user_id or token found");
          return;
        }

        // Only proceed if this is the first call
        if (!isFirstCall) {
          console.log("🚫 Preventing duplicate API call");
          return;
        }
        isFirstCall = false;

        console.log("🔄 Sending promo link to API:", promoLinkValue);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/promos/decrypt-link`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              promoLink: promoLinkValue,
              user_id: userId,
            }),
          }
        );

        const data = await response.json();
        console.log("🎁 Promo API Response:", data);
        if(data?.error_code === "ERR_SERVER_ERROR"){
          setShowWalletAnimation(false);
        }

        if (data?.success) {
            const amount = data.data?.voucherAmount || 0;
            setVoucherAmount(amount);
            console.log("🎁 Promo API Response:", amount);

            // Only show wallet animation if amount is greater than 0
            setShowWalletAnimation(amount > 0);
          // After successful fetchPromoDetails:
          setTimeout(() => {
            if (promoLink) {
              const deleteCookie = (name: string) => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
              };
              deleteCookie("promoLink");
            }
          }, 10000);
        } else if (data.error_code === "ERR_PROMO_ALREADY_USED") {
          // Handle already used promo code
          console.log("⚠️ Promo already used");
        }
      } catch (error) {
        setVoucherAmount(0);
        setShowWalletAnimation(false);
        console.error("❌ Error fetching promo details:", error);
      }
    };
    const isReturningUser = searchParams.get("returning") === "true";

    if (isReturningUser) {
      setShowWalletAnimation(false);
    }

    // Get promoLink from cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(";").shift() || "");
      }
      return null;
    };

    const promoLink = getCookie("promoLink");

    if (promoLink) {
      console.log("🎯 Found PromoLink:", promoLink);
      fetchPromoDetails(promoLink);
    }
    if(!promoLink){
      setShowWalletAnimation(false);
    }


    // Cleanup function to prevent memory leaks
    return () => {
      isFirstCall = false;
    };
  }, [voucherAmount]); // Empty dependency array

  // Modify the auth check useEffect to set isAuthenticated
  // useEffect(() => {

  //   const checkAuthToken = () => {
  //     console.log("[Auth Flow] Starting auth token check");

  //     try {
  //       // Step 1: Check if auth_token is present in cookies
  //       const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  //       console.log("All Cookies:", cookies);
  //       const authTokenCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
  //       console.log("[Auth Flow] Auth token in cookies:", authTokenCookie ? "Present" : "Not present");

  //       // If auth_token is not in cookies, redirect
  //       if (!authTokenCookie) {
  //         console.log("[Auth Flow] No auth_token in cookies, redirecting to login");
  //         router.push("/auth/experience");
  //         setIsAuthenticated(false);
  //         return false;
  //       }

  //       // Extract token from cookie
  //       const cookieToken = authTokenCookie.split('=')[1];

  //       // Step 2: Compare cookie value with query string token
  //       const queryToken = searchParams.get("token");
  //       console.log("[Auth Flow] Query token:", queryToken ? "Present" : "Not present");

  //       // Step 3-4: If tokens match, proceed; otherwise redirect
  //       if (cookieToken && queryToken && cookieToken === queryToken) {
  //         console.log("[Auth Flow] Cookie token matches query token, authentication successful");
  //         setIsAuthenticated(true);
  //         return true;
  //       } else {
  //         console.log("[Auth Flow] Token mismatch or missing query token, redirecting to login");
  //         router.push("/auth/experience");
  //         setIsAuthenticated(false);
  //         return false;
  //       }
  //     } catch (error) {
  //       console.error("[Auth Flow] Error during authentication check:", error);
  //       router.push("/auth/experience");
  //       setIsAuthenticated(false);
  //       return false;
  //     }
  //   };

  //   // Execute the check after a short delay to ensure cookies are loaded
  //   console.log("[Auth Flow] Setting timeout for auth check");
  //   const timer = setTimeout(() => {
  //     console.log("[Auth Flow] Executing auth check");
  //     const isAuth = checkAuthToken();
  //     console.log("[Auth Flow] Authentication result:", isAuth);
  //   }, 500);

  //   return () => {
  //     console.log("[Auth Flow] Cleaning up auth check timeout");
  //     clearTimeout(timer);
  //   };
  // }, [router, searchParams]);

  // Modify the user data fetch useEffect to depend on isAuthenticated
  useEffect(() => {
    // if (!isAuthenticated) return;


    const fetchUserData = async () => {
      try {
        const userId = searchParams.get("user");
        const token = searchParams.get("token");
        console.log("Token:", token);
        const organizationId = "000000000000000000000000";

        if (!userId || !token) return;

        const response = await fetch(
          `${getApiBaseUrl()}/v1/organizations/${organizationId}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          linkedinCreds: {
            linkedinEmail: data.linkedinCreds.linkedinEmail,
            pfp: data.linkedinCreds.pfp,
            jobTitle: data.linkedinCreds.jobTitle,
            companyName: data.linkedinCreds.companyName,
          },
        });

        console.log("Fetched user data:", data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [searchParams, isAuthenticated, voucherAmount]);

  // Add a check at the start of the component to prevent rendering if not authenticated
  //   if (!isAuthenticated) {
  //     return (
  //       <div className="min-h-screen bg-white flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //       </div>
  //     );
  //   }

  const validateAndFormatLinkedInUrl = (input: string): string | null => {
    // Remove any whitespace
    input = input.trim();

    // If it's just a profile name/handle
    if (!input.includes("/") && !input.includes(".")) {
      return `https://www.linkedin.com/in/${input}/`;
    }

    // Create a URL object to parse the input (add https if missing)
    let url;
    try {
      url = new URL(input.startsWith("http") ? input : `https://${input}`);
    } catch {
      return null;
    }

    // Check if it's a LinkedIn URL
    if (!url.hostname.includes("linkedin.com")) {
      return null;
    }

    // Ensure the path starts with /in/
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts[0] !== "in") {
      return null;
    }

    // Extract just the profile name/handle, removing any trailing slashes or query parameters
    const profileName = pathParts[1].replace(/\/$/, "");

    // Construct the standardized URL
    return `https://www.linkedin.com/in/${profileName}/`;
  };

  const fetchLinkedInProfile = async (profileUrl: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(
        `${getApiBaseUrl()}/v1/recipients/linkedin-profile?profile=${profileUrl}`,
        {
          headers: {
            accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        console.log("LinkedIn API response not OK:", response.status);
        setInputError(
          "🔍 Hmm... We couldn't find this profile. Could you check if the URL is correct or try a different profile?"
        );
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        console.log("LinkedIn API returned unsuccessful:", data);
        setInputError(
          "✨ Almost there! Double-check the profile URL – our AI is eager to work its magic!"
        );
        return null;
      }

      setLinkedinProfile(data);
      // Convert LinkedIn profile to our contact format
      const contact: LinkedInContact = {
        id: profileUrl,
        name: `${data.data.firstName} ${data.data.lastName}`,
        position: data.data.position[0]?.title || "",
        company: data.data.position[0]?.companyName || "",
        companyLogo: data.data.position[0]?.companyLogo || "",
        connectionDegree: "2nd",
        profilePicture: data.data.profilePicture,
      };
      setSearchResults([contact]);
      return data;
    } catch (error) {
      console.log("Error in fetchLinkedInProfile:", error);
      setInputError(
        "🌟 Oops! Our AI took a coffee break. Let's try that again in a moment!"
      );
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;

    setInputError("");
    setLinkedinProfile(null);
    setSearchMode(true);
    setIsSearching(true);
    setLastSearchQuery(searchQuery);

    const formattedUrl = validateAndFormatLinkedInUrl(searchQuery);
    if (!formattedUrl) {
      setInputError(
        "Hmm... 🤔 That doesn't quite look like a LinkedIn profile. Try something like 'johndoe' or 'linkedin.com/in/johndoe'"
      );
      setIsSearching(false);
      return;
    }

    try {
      const profile = await fetchLinkedInProfile(formattedUrl);
      if (profile) {
        const contact = {
          id: formattedUrl,
          name: `${profile.data.firstName} ${profile.data.lastName}`,
          position: profile.data.position[0]?.title || "",
          company: profile.data.position[0]?.companyName || "",
          companyLogo: profile.data.position[0]?.companyLogo || "",
          connectionDegree: "2nd",
          profilePicture: profile.data.profilePicture,
        };
        setSearchResults([contact]);
        setLinkedinProfile(profile);

        // Store the profile data in localStorage to persist it
        localStorage.setItem("searchedProfile", JSON.stringify(profile));
        localStorage.setItem("searchResults", JSON.stringify([contact]));
        localStorage.setItem("userLinkedInUrl", formattedUrl);
      }
    } catch (error) {
      console.error("Error during search:", error);
      setInputError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle contact selection
  const handleContactSelection = (contactId: string) => {
    if (selectedContact === contactId) {
      setSelectedContact(null);
    } else {
      setSelectedContact(contactId);
      setSendToSelf(false);
    }
  };

  // Modify the handleSelfSelection function
  const handleSelfSelection = () => {
    setSendToSelf(true);
    setExpandedSection("self");
    setSelectedContact(null);
  };

  // Add new handler for connection section
  const handleConnectionSectionClick = () => {
    setExpandedSection("connection");
    setSendToSelf(false);
  };

  // Add this function to handle self profile search
  const handleSelfProfileSearch = async () => {
    setSelfUrlError("");
    setIsSelfLoading(true);

    const formattedUrl = validateAndFormatLinkedInUrl(selfLinkedInUrl);
    if (!formattedUrl) {
      setSelfUrlError("Please enter a valid LinkedIn profile URL");
      setIsSelfLoading(false);
      return;
    }

    try {
      const profile = await fetchLinkedInProfile(formattedUrl);
      if (profile) {
        setLinkedinProfile(profile);
        localStorage.setItem("userLinkedInUrl", formattedUrl);
      }
    } catch (error) {
      setSelfUrlError("Failed to fetch profile. Please try again.");
    } finally {
      setIsSelfLoading(false);
    }
  };

  // Render company logo icon
  const renderCompanyLogo = (company: string, companyLogo: string) => {
    if (companyLogo) {
      return (
        <div className="w-5 h-5 relative">
          <Image
            src={companyLogo}
            alt={`${company} logo`}
            fill
            className="object-contain rounded"
          />
        </div>
      );
    }

    // Fallback to the color-based logo if no company logo is available
    const logoMap: { [key: string]: string } = {
      "InnoTech Solutions": "bg-blue-500",
      "CodeCraft Inc.": "bg-green-500",
      "BrandWave Media": "bg-red-500",
      GrowthForce: "bg-blue-400",
      "TechCorp Inc.": "bg-gray-500",
    };

    // Generate a consistent color based on company name
    const getColorFromString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = hash % 360;
      return `hsl(${hue}, 70%, 50%)`;
    };

    const bgClass = logoMap[company] || `bg-[${getColorFromString(company)}]`;

    return (
      <div
        className={`w-5 h-5 rounded ${bgClass} flex items-center justify-center text-white text-xs`}
        style={{
          backgroundColor: !logoMap[company]
            ? getColorFromString(company)
            : undefined,
        }}
      >
        {company.charAt(0)}
      </div>
    );
  };

  const startAnalysis = async () => {
    if (!selectedContact && !sendToSelf) return;

    setIsAnalyzing(true);
    setApiError(null);
    setCurrentStep(0);
    setGiftRecommendations([]);

    // Create an AbortController for the animation
    const controller = new AbortController();
    setAnimationController(controller);

    // Start the animation immediately
    const animationPromise = (async () => {
      try {
        for (
          let i = 0;
          i <
          getAnalysisSteps(
            linkedinProfile || {
              success: true,
              data: {
                firstName: "",
                lastName: "",
                headline: "",
                profilePicture: "",
                geo: { city: "", full: "" },
                position: [],
                skills: [],
                educations: [],
                certifications: [],
                languages: [],
                interests: [],
                posts: [],
                comments: [],
                likes: [],
              },
            }
          ).length;
          i++
        ) {
          if (controller.signal.aborted) {
            break;
          }
          setCurrentStep(i);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 7500); // Distribute 60 seconds across 8 steps
            controller.signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("Animation aborted"));
            });
          });
        }
      } catch (error) {
        if (error.message !== "Animation aborted") {
          throw error;
        }
      }
    })();

    try {
      // Get the profile URL
      const profileUrl = sendToSelf
        ? localStorage.getItem("userLinkedInUrl")
        : selectedContact;
      if (!profileUrl) throw new Error("Profile URL not found");

      console.log("Starting API calls with profile URL:", profileUrl);

      // Make API calls in parallel
      // Make API calls in parallel
      const [profileResponse, giftResponse] = await Promise.all([
        // Fetch LinkedIn profile if not already loaded
        linkedinProfile
          ? Promise.resolve(linkedinProfile)
          : fetch(
              `${getApiBaseUrl()}/v1/recipients/linkedin-profile?profile=${profileUrl}`,
              {
                headers: {
                  accept: "*/*",
                },
              }
            ).then((res) => res.json()),

        // Fetch gift recommendations
        fetch(`${getApiBaseUrl()}/v1/gift-recommendation/hyper-personalized`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkedinUrl: profileUrl,
            giftingContext: {
              maxBudget: 100,
              bundleIds: ["67b6ec37baa1bd5aba465a45"],
            },
          }),
        }).then((res) => res.json()),
      ]);

      // Validate responses
      if (!profileResponse.success || !giftResponse.success) {
        throw new Error("Failed to fetch data");
      }

      // Set the profile and gift recommendations
      if (!linkedinProfile) {
        setLinkedinProfile(profileResponse);
      }
      console.log("Gift response:", giftResponse.data);
      setGiftRecommendations(giftResponse.data);

      // Wait for animation to complete (minimum 60 seconds)
      await Promise.all([
        animationPromise,
        new Promise((resolve) => setTimeout(resolve, 600000)),
      ]);

      // Show completion state
      setAnalysisComplete(true);

      // Smooth scroll to recommendations section
      const recommendationsSection = document.getElementById(
        "recommendations-section"
      );
      if (recommendationsSection) {
        recommendationsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (error) {
      // Handle error - stop animation immediately
      controller.abort();
      setApiError(
        "✨ Our gift-finding elves are taking a quick tea break! Their magic wands need a moment to recharge with extra sparkle. ✨"
      );
      console.error("Error:", error);
    } finally {
      setIsAnalyzing(false);
      setAnimationController(null);
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    if (!selectedContact && !sendToSelf) {
      e.preventDefault();
      return;
    }
    setIsAnalyzing(true);
    // Smooth scroll to analysis section
    const analysisSection = document.getElementById("analysis-section");
    if (analysisSection) {
      analysisSection.scrollIntoView({ behavior: "smooth" });
    }
    startAnalysis();
  };

  const LinkedInProfileCard = ({
    profile,
    className = "",
  }: {
    profile: LinkedInProfile;
    className?: string;
  }) => {
    if (!profile?.data) return null;

    const { firstName, lastName, headline, profilePicture, position } =
      profile.data;
    const currentPosition = position[0];

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
      >
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt={`${firstName} ${lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{headline}</p>
              {currentPosition && (
                <div className="flex items-center space-x-2">
                  {currentPosition.companyLogo && (
                    <div className="w-5 h-5 relative">
                      <Image
                        src={currentPosition.companyLogo}
                        alt={currentPosition.companyName || ""}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-sm text-gray-700">
                    {currentPosition.title} at {currentPosition.companyName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle wallet animation completion
  const handleWalletAnimationComplete = () => {
    setShowWalletAnimation(false);
  };

  const handleSelfSearch = async () => {
    if (selfSearchQuery.trim() === "") return;

    setInputError("");
    setLinkedinProfile(null);
    setSelfSearchMode(true);
    setIsSearching(true);

    const formattedUrl = validateAndFormatLinkedInUrl(selfSearchQuery);
    if (!formattedUrl) {
      setInputError(
        "Hmm... 🤔 That doesn't quite look like a LinkedIn profile. Try something like 'johndoe' or 'linkedin.com/in/johndoe'"
      );
      setIsSearching(false);
      return;
    }

    try {
      const profile = await fetchLinkedInProfile(formattedUrl);
      if (profile) {
        const contact = {
          id: formattedUrl,
          name: `${profile.data.firstName} ${profile.data.lastName}`,
          position: profile.data.position[0]?.title || "",
          company: profile.data.position[0]?.companyName || "",
          companyLogo: profile.data.position[0]?.companyLogo || "",
          connectionDegree: "Self",
          profilePicture: profile.data.profilePicture,
        };
        setSelfSearchResults([contact]);
        setLinkedinProfile(profile);
        localStorage.setItem("userLinkedInUrl", formattedUrl);
      }
    } catch (error) {
      console.error("Error during search:", error);
      setInputError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnectionSearch = async () => {
    if (connectionSearchQuery.trim() === "") return;

    setInputError("");
    setLinkedinProfile(null);
    setConnectionSearchMode(true);
    setIsSearching(true);

    const formattedUrl = validateAndFormatLinkedInUrl(connectionSearchQuery);
    if (!formattedUrl) {
      setInputError(
        "Hmm... 🤔 That doesn't quite look like a LinkedIn profile. Try something like 'johndoe' or 'linkedin.com/in/johndoe'"
      );
      setIsSearching(false);
      return;
    }

    try {
      const profile = await fetchLinkedInProfile(formattedUrl);
      if (profile) {
        const contact = {
          id: formattedUrl,
          name: `${profile.data.firstName} ${profile.data.lastName}`,
          position: profile.data.position[0]?.title || "",
          company: profile.data.position[0]?.companyName || "",
          companyLogo: profile.data.position[0]?.companyLogo || "",
          connectionDegree: "2nd",
          profilePicture: profile.data.profilePicture,
        };
        setConnectionSearchResults([contact]);
        setLinkedinProfile(profile);
      }
    } catch (error) {
      console.error("Error during search:", error);
      setInputError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/auth/validate/${userId}`,
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
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {showWalletAnimation && (
          <WalletAnimation
            onComplete={handleWalletAnimationComplete}
            userName={userName}
            voucherAmount={voucherAmount}
          />
        )}
      </AnimatePresence>

      {/* Only show main content when wallet animation is complete */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showWalletAnimation ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b relative z-20">
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
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {isAnalyzing ? "Select Your Gift" : "Start Your Gifting Journey"}
            </h1>
            <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">
              {isAnalyzing
                ? "Our AI is analyzing the profile to curate the perfect gift recommendations."
                : "Experience the joy of meaningful professional gifting. Choose to try it yourself or delight a LinkedIn connection."}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <GiftSelectionProgress currentStep={isAnalyzing ? 1 : 0} />
          </div>

          {/* Step 1: Recipient Selection (hidden during analysis) */}
          {!isAnalyzing && (
            <>
              {/* Quick Value Props */}

              {/* Options */}
              <div className="space-y-4">
                {/* Send to Yourself - Highlighted Option */}
                <div
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    expandedSection === "self"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                  }`}
                  onClick={handleSelfSelection}
                >
                  {/* Recommended Badge */}
                  <div className="absolute -top-3 left-4">
                    <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-primary/10 rounded-full p-3 mr-4">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1">
                        Try it yourself first
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Experience the magic of AI-powered gifting firsthand!
                      </p>
                    </div>
                    {sendToSelf && (
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add LinkedIn URL input when section is expanded */}
                  {expandedSection === "self" && (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          To find your LinkedIn profile URL:
                        </p>
                        <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                          <li>
                            Go to{" "}
                            <a
                              href="https://www.linkedin.com/in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              linkedin.com/in/
                            </a>
                          </li>
                          <li>
                            Copy your profile URL from the browser address bar
                          </li>
                          <li>Paste it below</li>
                        </ol>
                      </div>
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Enter your LinkedIn profile URL or username..."
                          className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          value={selfSearchQuery}
                          onChange={(e) => {
                            setSelfSearchQuery(e.target.value);
                            setInputError("");
                          }}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSelfSearch()
                          }
                        />
                        <svg
                          className="w-5 h-5 absolute left-3 top-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          ></path>
                        </svg>
                        <button
                          className="absolute right-2 top-1.5 bg-primary hover:bg-opacity-95 font-medium text-white px-4 py-1.5 rounded-md text-sm"
                          onClick={handleSelfSearch}
                          disabled={isLoadingProfile}
                        >
                          {isLoadingProfile ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            "Search"
                          )}
                        </button>
                      </div>

                      {selfUrlError && (
                        <div className="mt-2 text-red-500 text-sm">
                          {selfUrlError}
                        </div>
                      )}

                      {/* Show success state when profile is loaded */}
                      {/* {linkedinProfile && sendToSelf && (
                        <div className="mt-2 text-green-500 text-sm flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Profile verified successfully
                        </div>
                      )} */}
                      {expandedSection === "self" && (
                        <div className="mt-4">
                          {/* Error Message */}
                          {inputError && (
                            <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-3 mb-4 mt-5">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg
                                    className="h-5 w-5 text-[#F04438]"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-[#B42318]">
                                    {inputError}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Search Results */}
                          {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : selfSearchResults.length > 0 ? (
                            <div className="space-y-4 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Profile Found
                              </div>
                              {selfSearchResults.map((contact) => (
                                <div
                                  key={contact.id}
                                  className={`flex items-center p-4 bg-white border rounded-lg cursor-pointer transition-all ${
                                    selectedContact === contact.id
                                      ? "border-primary border-2 shadow-sm"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() =>
                                    handleContactSelection(contact.id)
                                  }
                                >
                                  <div className="mr-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                      {contact.profilePicture ? (
                                        <Image
                                          src={contact.profilePicture}
                                          alt={contact.name}
                                          width={40}
                                          height={40}
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                                          {contact.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        {contact.name}
                                      </span>
                                      <span className="ml-2 bg-blue-50 text-blue-700 text-xs font-medium px-1.5 rounded">
                                        {contact.connectionDegree}
                                      </span>
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center">
                                      <span>{contact.position}</span>
                                      {contact.company && (
                                        <>
                                          <span className="mx-1">at</span>
                                          {contact.companyLogo && (
                                            <div className="w-5 h-5 relative mr-1">
                                              <Image
                                                src={contact.companyLogo}
                                                alt={contact.company}
                                                width={20}
                                                height={20}
                                                className="object-contain"
                                              />
                                            </div>
                                          )}
                                          <span>{contact.company}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {selectedContact === contact.id && (
                                    <div className="ml-3">
                                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-primary" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            selfSearchMode &&
                            !isSearching && (
                              <div className="text-center py-8">
                                <div className="bg-white rounded-lg p-6">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <h3 className="text-gray-900 font-medium mb-1">
                                    No Profile Found
                                  </h3>
                                  <p className="text-gray-500 text-sm">
                                    Try searching with a different LinkedIn
                                    profile URL or username
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LinkedIn Contact Option */}
                <div
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    expandedSection === "connection"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                  }`}
                  onClick={handleConnectionSectionClick}
                >
                  <div className="p-6 border-b bg-white">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-3 mr-4">
                        <svg
                          className="w-6 h-6 text-[#0A66C2]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1">
                          Send to a LinkedIn Connection
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Strengthen your professional relationships with a
                          thoughtful gift
                        </p>
                      </div>
                      {expandedSection === "connection" && (
                        <div className="ml-4">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-primary"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn Search Section - Only show when expanded */}
                  {expandedSection === "connection" && (
                    <div className="bg-gray-50 p-6">
                      {/* Search Input */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Enter LinkedIn profile URL or username..."
                          className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                          value={connectionSearchQuery}
                          onChange={(e) => {
                            setConnectionSearchQuery(e.target.value);
                            setInputError("");
                          }}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleConnectionSearch()
                          }
                        />
                        <svg
                          className="w-5 h-5 absolute left-3 top-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          ></path>
                        </svg>
                        <button
                          className="absolute right-2 top-1.5 bg-primary hover:bg-opacity-95 font-medium text-white px-4 py-1.5 rounded-md text-sm"
                          onClick={handleConnectionSearch}
                          disabled={isLoadingProfile}
                        >
                          {isLoadingProfile ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            "Search"
                          )}
                        </button>
                      </div>

                      {/* Search Examples */}
                      <div className="text-sm text-gray-600 ">
                        <span className="mr-1 text-xs">Examples:</span>
                        <span className="font-medium mr-1">johndoe</span>
                        <span className="mr-1">or</span>
                        <span className="text-gray-500 text-xs">
                          linkedin.com/in/johndoe
                        </span>
                      </div>
                      {expandedSection === "connection" && (
                        <div>
                          {/* Error Message */}
                          {inputError && (
                            <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-3 mb-4 mt-5">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg
                                    className="h-5 w-5 text-[#F04438]"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-[#B42318]">
                                    {inputError}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Search Results */}
                          {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : connectionSearchResults.length > 0 ? (
                            <div className="space-y-4 mt-4 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Profile Found
                              </div>
                              {connectionSearchResults.map((contact) => (
                                <div
                                  key={contact.id}
                                  className={`flex items-center p-4 bg-white border rounded-lg cursor-pointer transition-all ${
                                    selectedContact === contact.id
                                      ? "border-primary border-2 shadow-sm"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() =>
                                    handleContactSelection(contact.id)
                                  }
                                >
                                  <div className="mr-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                      {contact.profilePicture ? (
                                        <Image
                                          src={contact.profilePicture}
                                          alt={contact.name}
                                          width={40}
                                          height={40}
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                                          {contact.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        {contact.name}
                                      </span>
                                      <span className="ml-2 bg-blue-50 text-blue-700 text-xs font-medium px-1.5 rounded">
                                        {contact.connectionDegree}
                                      </span>
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center">
                                      <span>{contact.position}</span>
                                      {contact.company && (
                                        <>
                                          <span className="mx-1">at</span>
                                          {contact.companyLogo && (
                                            <div className="w-5 h-5 relative mr-1">
                                              <Image
                                                src={contact.companyLogo}
                                                alt={contact.company}
                                                width={20}
                                                height={20}
                                                className="object-contain"
                                              />
                                            </div>
                                          )}
                                          <span>{contact.company}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {selectedContact === contact.id && (
                                    <div className="ml-3">
                                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-primary" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            connectionSearchMode &&
                            !isSearching && (
                              <div className="text-center py-8">
                                <div className="bg-white rounded-lg p-6">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <h3 className="text-gray-900 font-medium mb-1">
                                    No Profile Found
                                  </h3>
                                  <p className="text-gray-500 text-sm">
                                    Try searching with a different LinkedIn
                                    profile URL or username
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button - Only show if not analyzing */}
              {!isAnalyzing && (
                <div className="flex justify-between items-center mt-8">
                  <p className="text-sm text-gray-500">
                    {selectedContact || (sendToSelf && linkedinProfile) ? (
                      <span className="flex items-center text-green-600">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Ready to proceed
                      </span>
                    ) : (
                      "Select a recipient to continue"
                    )}
                  </p>
                  <button
                    onClick={handleContinue}
                    className={`flex items-center py-3 px-6 rounded-md transition-all ${
                      selectedContact || (sendToSelf && linkedinProfile)
                        ? "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={
                      !selectedContact && !(sendToSelf && linkedinProfile)
                    }
                  >
                    Continue to Gift Selection
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
                      ></path>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Gift Selection */}
          {isAnalyzing && (
            <div className="space-y-6">
              {/* LinkedIn Profile Card */}

              {linkedinProfile && (
                <LinkedInProfileCard
                  profile={linkedinProfile}
                  className="mb-8"
                />
              )}

              {/* Analysis Section */}
              <AnalysisOverlay
                isAnalyzing={isAnalyzing}
                linkedinProfile={linkedinProfile}
                currentStep={currentStep}
                apiError={apiError}
                analysisComplete={analysisComplete}
                giftRecommendations={giftRecommendations}
                profileUrl={
                  sendToSelf
                    ? localStorage.getItem("userLinkedInUrl")
                    : selectedContact
                }
              />
            </div>
          )}
        </main>
      </motion.div>
      <button onClick={() => setIsModalOpen(true)} className="fixed right-5 hover:bg-primary-light bottom-5 bg-primary text-white font-medium px-4 py-2 rounded-full">
    Skip..
        </button>
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
