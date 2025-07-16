"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { verifyTemplateToken } from "@/utils/templateToken";
import confetti from "canvas-confetti";
import { CalendarIcon, ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  trackLandingPageVisit,
  trackLandingPageLoaded,
  trackLogoViewed,
  trackHeadlineViewed,
  trackDescriptionViewed,
  trackMediaViewed,
  trackVideoPlayed,
  trackDateViewed,
  trackPrimaryCTAClick,
  trackSecondaryCTAClick,
  trackFeedbackInitiated,
  trackFeedbackTypeSelected,
  trackAudioRecordingStarted,
  trackAudioRecordingStopped,
  trackAudioReRecorded,
  trackAudioFeedbackSubmitted,
  trackAudioFeedbackUploadFailed,
  trackVideoRecordingStarted,
  trackVideoRecordingStopped,
  trackVideoReRecorded,
  trackVideoFeedbackSubmitted,
  trackVideoFeedbackUploadFailed,
  trackTextFeedbackTyped,
  trackTextFeedbackSubmitted,
  trackDirectFeedbackLike,
  trackDirectFeedbackDislike,
  trackEmailFormInitiated,
  trackEmailFormSubmitted,
  trackEmailFormSkipped,
  trackSuccessModalViewed,
  trackSuccessModalClosed,
  trackRecipientIdentified,
  trackRecipientStatusUpdated,
  trackCampaignDataFetched,
  trackRecipientDataFetched,
  END_landing_page_TouchpointType
} from "./landingPage";

// Add required CSS for animations
const styles = `
.question-container, .options-container {
  transition: all 0.3s ease-in-out;
}

.question-exit {
  opacity: 0;
  transform: translateY(-10px);
}

.question-enter {
  opacity: 1;
  transform: translateY(0);
}

.options-exit {
  opacity: 0;
  transform: translateY(10px);
}

.options-enter {
  opacity: 1;
  transform: translateY(0);
}

/* Shimmer effect for skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(156, 163, 175, 0.2) 0%,
    rgba(156, 163, 175, 0.3) 50%,
    rgba(156, 163, 175, 0.2) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* Pulse attention animation for CTA button */
@keyframes pulse-attention {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
}

.animate-pulse-attention {
  animation: pulse-attention 2s ease-in-out 3;
  position: relative;
}

/* Stop animation on hover */
.animate-pulse-attention:hover {
  animation: none;
}`;

if (typeof document !== "undefined") {
  if (!document.getElementById("custom-landing-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "custom-landing-styles";
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}

// Landing page configuration interface (from landing-page-designer)
interface LandingPageConfig {
  logo: {
    type: "upload" | "url";
    url: string;
  };
  background: {
    type: "solid" | "gradient";
    color: string;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: "to-r" | "to-br" | "to-b" | "to-bl";
  };
  content: {
    headline: string;
    headlineColor: string;
    description: string;
    descriptionColor: string;
  };
  media: {
    type: "image" | "video";
    imageUrl: string;
    videoUrl: string;
  };
  actionButtons: {
    primary: {
      enabled: boolean;
      text: string;
      color: string;
      url: string;
    };
    secondary: {
      enabled: boolean;
      text: string;
      color: string;
      url: string;
    };
  };
  date: {
    enabled: boolean;
    value: Date | string | undefined;
    color: string;
  };
}

// Cookie management functions
const getDeviceIdentifier = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect OS
  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "Mac";
  else if (userAgent.includes("iPhone")) os = "iPhone";
  else if (userAgent.includes("iPad")) os = "iPad";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Linux")) os = "Linux";

  // Detect Browser
  let browser = "Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";

  // Create timestamp for uniqueness
  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${os} ${browser} User - ${timestamp}`;
};

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const createInitialRecipient = async (campaignId: string | null) => {
  try {
    const deviceIdentifier = getDeviceIdentifier();
    const recipientData = {
      firstName: deviceIdentifier,
      mailId: `anonymous_${Date.now()}@device.local`,
      campaignId: campaignId,
      status: "Acknowledged",
      acknowledgedAt: new Date().toISOString(),
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(recipientData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.data && result.data._id) {
      // Save recipient ID to cookie
      setCookie("recipientId", result.data._id, 30); // Store for 30 days
      return result.data._id;
    }

    return null;
  } catch (error) {
    console.error("Error creating initial recipient:", error);
    return null;
  }
};

// FooterMessage component
const FooterMessage = () => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sticky md:absolute bottom-0 left-0 right-0 ">
      <div className=" grid gap-3 pt-3  border-t-[1px] border-gray-400 border-dotted">
        <div className="">
          <div className="flex flex-col sm:flex-row text-xs md:text-sm items-center gap-4 sm:justify-between text-center sm:text-left">
            <div>
              <span className="font-semibold"> Made with</span> ❤️{" "}
              <span className="font-medium">
                {" "}
                delightl<span className="text-primary">oo</span>p{" "}
              </span>{" "}
              🎁 Loved this experience? Discover how leading teams create
              moments like this — at scale, with AI.
            </div>

            <a
              href="https://www.delightloop.com/bookademo"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-3 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200  text-[10px] md:text-xs "
            >
              Get Started →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video player component for handling embedded videos
const VideoPlayer = ({
  url,
  className,
  onPlay,
}: {
  url: string;
  className?: string;
  onPlay?: () => void;
}) => {
  const [videoContent, setVideoContent] = useState<{
    embedUrl: string;
    type: "iframe" | "video";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractVideoContent = async (
    url: string
  ): Promise<{ embedUrl: string; type: "iframe" | "video" } | null> => {
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("watch?v=")
          ? url.split("watch?v=")[1].split("&")[0]
          : url.split("youtu.be/")[1].split("?")[0];
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          type: "iframe",
        };
      }
      if (url.includes("vimeo.com")) {
        const videoId = url.split("vimeo.com/")[1].split("?")[0];
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          type: "iframe",
        };
      }
      if (url.includes("dailymotion.com") || url.includes("dai.ly")) {
        const videoId = url.includes("dai.ly/")
          ? url.split("dai.ly/")[1].split("?")[0]
          : url.split("dailymotion.com/video/")[1].split("_")[0];
        return {
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
          type: "iframe",
        };
      }
      // For other URLs, try to use as direct video
      return { embedUrl: url, type: "video" };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadVideo = async () => {
      if (!url) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const content = await extractVideoContent(url);
        if (content) {
          setVideoContent(content);
        } else {
          setError("No video content found");
        }
      } catch (error) {
        setError("Error loading video content");
      } finally {
        setLoading(false);
      }
    };
    loadVideo();
  }, [url]);

  if (!url) {
    return (
      <div
        className={`bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white">
          <Play className="mx-auto mb-2 w-8 h-8" />
          <p className="text-sm">No video URL provided</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoContent) {
    return (
      <div
        className={`bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white">
          <Play className="mx-auto mb-2 w-8 h-8" />
          <p className="text-sm">{error || "Video Player"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {videoContent.type === "iframe" ? (
        <iframe
          src={videoContent.embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      ) : (
        <video
          src={videoContent.embedUrl}
          controls
          className="w-full h-full object-cover"
          onPlay={onPlay}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

interface CampaignData {
  _id: string;
  name: string;
  landingPageConfig?: LandingPageConfig;
  motion?: string;
}

export default function Page() {
  const searchParams = useSearchParams();
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [landingPageConfig, setLandingPageConfig] =
    useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipientId, setSavedRecipientId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string>("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "video" | "text" | "audio" | null
  >(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  // Audio recording states
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const audioMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0);
  const audioRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [audioRecordingMimeType, setAudioRecordingMimeType] =
    useState<string>("");
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Array of questions to display sequentially
  const questions = ["Was this experience delightful?"];

  // Confetti animation function
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 1000,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Left side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      // Right side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  };

  // Video recording functionsisValidUrl
  const initializeCamera = async () => {
    try {
      // Check if browser supports MP4 recording
      const supportsMp4 = MediaRecorder.isTypeSupported("video/mp4");
      if (!supportsMp4) {
        const userChoice = confirm(
          "Your browser doesn't support MP4 video recording, which is required by our system. " +
            "The recording may not upload successfully.\n\n" +
            "For best results, please use:\n" +
            "• Chrome or Edge on desktop\n" +
            "• Safari on iOS\n" +
            "• Chrome on Android\n\n" +
            "Do you want to continue anyway?"
        );

        if (!userChoice) {
          return;
        }
      }

      // Show modal first
      setShowVideoModal(true);
      setCameraReady(false);

      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;

      // Wait for modal to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setCameraReady(true);
          };
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowVideoModal(false);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      // Check for supported formats in order of preference for backend compatibility
      let mimeType = "video/webm"; // Default fallback
      let fileExtension = "webm";

      // Try MP4 first (best compatibility with backend)
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
        fileExtension = "mp4";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
        // WebM with H264 codec might be convertible
        mimeType = "video/webm;codecs=h264";
        fileExtension = "webm";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
        fileExtension = "webm";
      }

      console.log("Recording with MIME type:", mimeType);
      setRecordingMimeType(mimeType); // Store for later use

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedVideo(blob);
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        setIsRecording(false);

        // Track video recording stop
        if (savedRecipientId && campaignData) {
          trackVideoRecordingStopped(
            savedRecipientId,
            campaignData._id,
            recordingDuration,
            mimeType
          ).catch(error => {
            console.log('Failed to track video recording stop:', error);
          });
        }

        // Stop recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingDuration(0);

        // Clear the video element to prepare for playback
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          // Force video element to update
          videoRef.current.load();
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Track video recording start
      if (savedRecipientId && campaignData) {
        trackVideoRecordingStarted(savedRecipientId, campaignData._id)
          .catch(error => {
            console.log('Failed to track video recording start:', error);
          });
      }

      // Start recording timer
      let duration = 0;
      recordingIntervalRef.current = setInterval(() => {
        duration += 1;
        setRecordingDuration(duration);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleReRecord = () => {
    // Track video re-recording
    if (savedRecipientId && campaignData) {
      trackVideoReRecorded(savedRecipientId, campaignData._id)
        .catch(error => {
          console.log('Failed to track video re-recording:', error);
        });
    }
    
    // Clear previous recording
    setRecordedVideo(null);
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
      setVideoURL(null);
    }

    // Reset video element to show camera preview
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  };

  const closeVideoModal = () => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear recording state
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Clear recording timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Reset all states
    setShowVideoModal(false);
    setIsRecording(false);
    setCameraReady(false);
    setRecordedVideo(null);
    setRecordingDuration(0);
    setFeedbackType(null); // Reset feedback type so modal options show again
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
      setVideoURL(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoUpload = async () => {
    if (!recordedVideo) return;

    setIsUploading(true);
    try {
      console.log("Starting video upload with type:", recordedVideo.type);

      // If the recorded video is WebM, we need to inform the user
      if (recordedVideo.type.includes("webm")) {
        console.warn(
          "Recording is in WebM format, which may not be supported by the server"
        );
      }

      const formData = new FormData();

      // Determine the file extension based on the blob type
      let fileName = "recorded-video";
      if (recordedVideo.type.includes("mp4")) {
        fileName += ".mp4";
      } else if (recordedVideo.type.includes("quicktime")) {
        fileName += ".mov";
      } else {
        // Default to mp4 extension even for webm to try to get server to accept it
        fileName += ".mp4";
      }

      // Create a new blob with mp4 mime type if it's webm
      let uploadBlob = recordedVideo;
      if (recordedVideo.type.includes("webm")) {
        // Try to create a new blob with mp4 mime type
        uploadBlob = new Blob([recordedVideo], { type: "video/mp4" });
      }

      formData.append("file", uploadBlob, fileName);

      console.log("Sending video upload request with filename:", fileName);
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/public/upload/video`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Video upload failed:", errorText);

        // Parse error to show user-friendly message
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error_code === "ERR_INVALID_FILE_TYPE") {
            throw new Error(
              "Your browser doesn't support recording in MP4 format. Please try using a different browser (Chrome or Edge recommended) or use a mobile device."
            );
          }
        } catch (parseError) {
          // If not JSON or no specific error code, use generic message
        }

        throw new Error("Video upload failed: " + errorText);
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload successful, result:", uploadResult);

      if (!uploadResult.videoUrl) {
        throw new Error("No video URL received from upload");
      }

      console.log("Setting video URL:", uploadResult.videoUrl);
      setUploadedVideoUrl(uploadResult.videoUrl);

      // Save video feedback immediately after upload
      await saveVideoFeedback(uploadResult.videoUrl);

      // Trigger confetti celebration
      triggerConfetti();

      // Close video modal
      closeVideoModal();

      // Reset feedback modal states
      setFeedbackType(null);
      setShowFeedbackModal(false);

      // Ask if user wants to provide details or save anonymously
      if (campaignData?.motion == "booth_giveaways") {
        if (savedRecipientId && campaignData) {
          trackEmailFormInitiated(savedRecipientId, campaignData._id, 'video_feedback');
        }
        setShowEmailForm(true);
      } else {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveVideoFeedback = async (videoUrl: string) => {
    try {
      const recipientId = savedRecipientId;
      if (!recipientId) {
        throw new Error("No recipient ID found");
      }

      console.log("Saving video feedback:", videoUrl);

      // Use the dedicated feedback endpoint that properly merges feedback
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: {
              type: "video",
              mediaUrl: videoUrl,
              timestamp: new Date().toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to save video feedback: " + errorText);
      }

      const result = await response.json();
      console.log("Video feedback saved successfully:", result);
      trackVideoFeedbackSubmitted(recipientId, campaignData?._id || "", videoUrl, recordingDuration, "video/webm");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving video feedback:", error);
      if (campaignData && savedRecipientId) {
        trackVideoFeedbackUploadFailed(savedRecipientId, campaignData._id, error instanceof Error ? error.message : String(error));
      }
    }
  };

  const handleTextFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;

    setIsUploading(true);
    try {
      const recipientId = savedRecipientId;
      if (!recipientId) {
        throw new Error("No recipient ID found");
      }

      console.log("Saving text feedback:", feedbackText.trim());

      // Use the dedicated feedback endpoint that properly merges feedback
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: {
              type: "text",
              content: feedbackText.trim(),
              timestamp: new Date().toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to save text feedback: " + errorText);
      }

      const result = await response.json();
      console.log("Text feedback saved successfully:", result);

      // Track successful text feedback submission
      if (campaignData) {
        trackTextFeedbackSubmitted(recipientId, campaignData._id, feedbackText.trim().length, false);
      }

      // Clear all feedback states and close all modals
      setFeedbackText("");
      setFeedbackType(null);
      setShowFeedbackModal(false);

      // Add a small delay before showing success modal to ensure text modal is fully closed
      setTimeout(() => {
        setShowSuccessModal(true);
        triggerConfetti();
      }, 100);
    } catch (error) {
      console.error("Error saving text feedback:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Audio recording functions
  const initializeAudioRecording = async () => {
    try {
      setAudioReady(false);

      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;
      setAudioReady(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(
        "Could not access microphone. Please check permissions and try again."
      );
      // Reset to show the feedback type selection tabs again
      setFeedbackType(null);
    }
  };

  const startAudioRecording = async () => {
    if (!audioStreamRef.current) return;

    try {
      // Check for supported audio formats
      let mimeType = "audio/webm"; // Default fallback
      let fileExtension = "webm";

      // Try different audio formats in order of preference
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
        fileExtension = "m4a";
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
        fileExtension = "webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
        fileExtension = "ogg";
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        mimeType = "audio/wav";
        fileExtension = "wav";
      }

      console.log("Recording audio with MIME type:", mimeType);
      setAudioRecordingMimeType(mimeType);

      const mediaRecorder = new MediaRecorder(audioStreamRef.current, {
        mimeType: mimeType,
      });

      audioMediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudio(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setIsRecordingAudio(false);

        // Track audio recording stop
        if (savedRecipientId && campaignData) {
          trackAudioRecordingStopped(
            savedRecipientId, 
            campaignData._id, 
            audioRecordingDuration, 
            mimeType
          ).catch(error => {
            console.log('Failed to track audio recording stop:', error);
          });
        }

        // Stop recording timer
        if (audioRecordingIntervalRef.current) {
          clearInterval(audioRecordingIntervalRef.current);
          audioRecordingIntervalRef.current = null;
        }
        setAudioRecordingDuration(0);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecordingAudio(true);

      // Track audio recording start
      if (savedRecipientId && campaignData) {
        trackAudioRecordingStarted(savedRecipientId, campaignData._id)
          .catch(error => {
            console.log('Failed to track audio recording start:', error);
          });
      }

      // Start recording timer
      let duration = 0;
      audioRecordingIntervalRef.current = setInterval(() => {
        duration += 1;
        setAudioRecordingDuration(duration);
      }, 1000);
    } catch (err) {
      console.error("Error starting audio recording:", err);
    }
  };

  const stopAudioRecording = () => {
    if (
      audioMediaRecorderRef.current &&
      audioMediaRecorderRef.current.state !== "inactive"
    ) {
      audioMediaRecorderRef.current.stop();
    }
  };

  const handleAudioReRecord = () => {
    // Track audio re-recording
    if (savedRecipientId && campaignData) {
      trackAudioReRecorded(savedRecipientId, campaignData._id)
        .catch(error => {
          console.log('Failed to track audio re-recording:', error);
        });
    }
    
    // Clear previous recording
    setRecordedAudio(null);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
  };

  const closeAudioModal = () => {
    // Stop all tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Clear recording state
    if (
      audioMediaRecorderRef.current &&
      audioMediaRecorderRef.current.state !== "inactive"
    ) {
      audioMediaRecorderRef.current.stop();
    }

    // Clear recording timer
    if (audioRecordingIntervalRef.current) {
      clearInterval(audioRecordingIntervalRef.current);
      audioRecordingIntervalRef.current = null;
    }

    // Reset all states
    setShowAudioModal(false);
    setIsRecordingAudio(false);
    setAudioReady(false);
    setRecordedAudio(null);
    setAudioRecordingDuration(0);
    setFeedbackType(null); // Reset feedback type so modal options show again
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
  };

  const handleAudioUpload = async () => {
    if (!recordedAudio) return;

    setIsUploading(true);
    try {
      console.log("Starting audio upload with type:", recordedAudio.type);

      const formData = new FormData();

      // Determine the file extension based on the blob type
      let fileName = "recorded-audio";
      if (recordedAudio.type.includes("mp4")) {
        fileName += ".m4a";
      } else if (recordedAudio.type.includes("webm")) {
        fileName += ".webm";
      } else if (recordedAudio.type.includes("ogg")) {
        fileName += ".ogg";
      } else if (recordedAudio.type.includes("wav")) {
        fileName += ".wav";
      } else {
        // Default to mp3 extension
        fileName += ".mp3";
      }

      formData.append("file", recordedAudio, fileName);

      console.log("Sending audio upload request with filename:", fileName);
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/public/upload/audio`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Audio upload failed:", errorText);

        // Parse error to show user-friendly message
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error_code === "ERR_INVALID_FILE_TYPE") {
            throw new Error(
              "Audio format not supported. Please try using a different browser."
            );
          }
        } catch (parseError) {
          // If not JSON or no specific error code, use generic message
        }

        throw new Error("Audio upload failed: " + errorText);
      }

      const uploadResult = await uploadResponse.json();
      console.log("Audio upload successful, result:", uploadResult);

      if (!uploadResult.audioUrl) {
        throw new Error("No audio URL received from upload");
      }

      console.log("Setting audio URL:", uploadResult.audioUrl);
      setUploadedAudioUrl(uploadResult.audioUrl);

      // Save audio feedback immediately after upload
      await saveAudioFeedback(uploadResult.audioUrl);

      // Trigger confetti celebration
      triggerConfetti();

      // Clean up audio state and close feedback modal
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      setIsRecordingAudio(false);
      setRecordedAudio(null);
      setAudioReady(false);
      setFeedbackType(null);
      setShowFeedbackModal(false);

      // Ask if user wants to provide details or save anonymously
      if (campaignData?.motion == "booth_giveaways") {
        if (savedRecipientId && campaignData) {
          trackEmailFormInitiated(savedRecipientId, campaignData._id, 'audio_feedback');
        }
        setShowEmailForm(true);
      } else {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveAudioFeedback = async (audioUrl: string) => {
    try {
      const recipientId = savedRecipientId;
      if (!recipientId) {
        throw new Error("No recipient ID found");
      }

      console.log("Saving audio feedback:", audioUrl);

      // Use the dedicated feedback endpoint that properly merges feedback
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: {
              type: "audio",
              mediaUrl: audioUrl,
              timestamp: new Date().toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to save audio feedback: " + errorText);
      }

      const result = await response.json();
      console.log("Audio feedback saved successfully:", result);

      // Track audio feedback submission
      if (savedRecipientId && campaignData) {
        trackAudioFeedbackSubmitted(
          savedRecipientId,
          campaignData._id,
          audioUrl,
          audioRecordingDuration,
          recordedAudio?.type || 'audio/unknown'
        ).catch(error => {
          console.log('Failed to track audio feedback submission:', error);
        });
      }
    } catch (error) {
      console.error("Error saving audio feedback:", error);
      
      // Track audio feedback upload failure
      if (savedRecipientId && campaignData) {
        trackAudioFeedbackUploadFailed(
          savedRecipientId,
          campaignData._id,
          error instanceof Error ? error.message : 'Unknown error'
        ).catch(trackError => {
          console.log('Failed to track audio feedback upload failure:', trackError);
        });
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userName) return;

    setIsUploading(true);
    try {
      // Get recipient ID from cookie
      const recipientId = getCookie("recipientId");
      if (!recipientId) {
        throw new Error("No recipient ID found");
      }

      console.log("Starting email submit with video URL:", uploadedVideoUrl);

      // First, get the current recipient data to preserve existing feedback
      const getCurrentRecipient = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      let existingFeedback = {};
      if (getCurrentRecipient.ok) {
        const currentData = await getCurrentRecipient.json();
        existingFeedback = currentData.data?.feedback || {};
        console.log("Existing feedback before email submit:", existingFeedback);
      }

      // Update recipient name and email, preserving existing feedback
      const recipientData = {
        firstName: userName,
        mailId: userEmail,
        status: "Acknowledged",
        campaignId: campaignData?._id || null,
        acknowledgedAt: new Date().toISOString(),
        feedback: existingFeedback, // Preserve existing feedback structure
      };

      console.log(
        "Sending recipient update data:",
        JSON.stringify(recipientData, null, 2)
      );

      const recipientResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(recipientData),
        }
      );

      const responseText = await recipientResponse.text();
      console.log("Raw response:", responseText);

      if (!recipientResponse.ok) {
        throw new Error("Failed to update recipient: " + responseText);
      }

      const recipientResult = JSON.parse(responseText);
      console.log("Recipient updated successfully:", recipientResult);

      // Track email form submission
      if (campaignData) {
        const feedbackType = uploadedVideoUrl ? 'video_feedback' : uploadedAudioUrl ? 'audio_feedback' : 'text_feedback';
        trackEmailFormSubmitted(recipientId, campaignData._id, userName, userEmail, feedbackType);
      }

      // Clear states
      setShowEmailForm(false);
      setUserEmail("");
      setUserName("");
      setUploadedVideoUrl(null);
      setUploadedAudioUrl(null);

      // Reset feedback modal states
      setFeedbackType(null);
      setShowFeedbackModal(false);
      setFeedbackText("");

      // Trigger confetti celebration
      triggerConfetti();

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error in submission:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Dynamic text replacement function
  const renderDynamicText = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      const sampleData: Record<string, string> = {
        "first-name": userName,
        "last-name": "Johnson",
        company: "Acme Corp",
        "gift-name": "Premium Package",
      };
      return sampleData[field] || `[${field}]`;
    });
  };

  // Get background style based on configuration
  const getBackgroundStyle = () => {
    if (!landingPageConfig) return { backgroundColor: "#FFFFFF" };

    if (landingPageConfig.background.type === "gradient") {
      const direction =
        landingPageConfig.background.gradientDirection || "to-br";
      return {
        background: `linear-gradient(${
          direction === "to-r"
            ? "to right"
            : direction === "to-br"
            ? "to bottom right"
            : direction === "to-b"
            ? "to bottom"
            : "to bottom left"
        }, ${landingPageConfig.background.gradientFrom || "#7C3AED"}, ${
          landingPageConfig.background.gradientTo || "#A855F7"
        })`,
      };
    }
    return { backgroundColor: landingPageConfig.background.color };
  };

  const handleReaction = (type: "like" | "dislike") => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Track direct feedback reaction
    if (savedRecipientId && campaignData) {
      if (type === "like") {
        trackDirectFeedbackLike(savedRecipientId, campaignData._id)
          .catch(error => {
            console.log('Failed to track direct feedback like:', error);
          });
      } else {
        trackDirectFeedbackDislike(savedRecipientId, campaignData._id)
          .catch(error => {
            console.log('Failed to track direct feedback dislike:', error);
          });
      }
    }

    // Simply save the like/dislike feedback without moving to next question
    sendFeedback(type);

    setTimeout(() => {
      setIsAnimating(false);
      setFeedbackSaved(true);
    }, 450);
  };

  const sendFeedback = async (type: "like" | "dislike") => {
    const recipientId = savedRecipientId;
    if (!recipientId) {
      console.error("No recipient ID available");
      return;
    }
    try {
      const reactionType = type === "like" ? "thumbs_up" : "thumbs_down";

      // Use the dedicated feedback endpoint that properly merges feedback
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${recipientId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            question1: "Was this experience delightful?",
            reaction1: reactionType,
          }),
        }
      );
      setFeedbackSaved(true);
      triggerConfetti();
    } catch (error) {
      console.error("Error saving like/dislike feedback:", error);
    }
  };

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        if (!searchParams) {
          setError("No search parameters");
          setLoading(false);
          return;
        }

        const token = searchParams.get("token");
        if (!token) {
          setError("No token provided");
          setLoading(false);
          return;
        }

        const decodedURIToken = decodeURIComponent(token);
        const decodedToken = verifyTemplateToken(decodedURIToken);

        if (!decodedToken) {
          console.error("Token verification failed");
          setError("Invalid token");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/campaigns/${decodedToken.campaign_id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("campaign data", data);
        console.log(
          "landingPageConfig from database:",
          data.data.landingPageConfig
        );
        setCampaignData(data.data);

        // Track campaign data fetch
        if (decodedToken.recipient_id && decodedToken.campaign_id) {
          trackCampaignDataFetched(
            decodedToken.recipient_id,
            decodedToken.campaign_id,
            true
          ).catch(error => {
            console.log('Failed to track campaign data fetch:', error);
          });
        }

        // Set landing page configuration with fallback
        if (data.data.landingPageConfig) {
          console.log("✅ Found landingPageConfig in database");

          // Transform the landingPageConfig to ensure date.value is properly converted
          const transformedConfig = {
            ...data.data.landingPageConfig,
            date: {
              ...data.data.landingPageConfig.date,
              value: data.data.landingPageConfig.date?.value
                ? new Date(data.data.landingPageConfig.date.value)
                : undefined,
            },
          };

          setLandingPageConfig(transformedConfig);
        } else {
          console.log("❌ No landingPageConfig found, creating default config");
          // Create default landing page config as fallback
          const defaultConfig = {
            logo: {
              type: "url" as const,
              url: "/Logo Final.png",
            },
            background: {
              type: "gradient" as const,
              color: "#FFFFFF",
              gradientFrom: "#7C3AED",
              gradientTo: "#A855F7",
              gradientDirection: "to-br" as const,
            },
            content: {
              headline: "Hello {{first-name}}, You've Got a Special Gift!",
              headlineColor: "#111827",
              description:
                "We're excited to share something special with you, {{first-name}}. Your gift is on its way!",
              descriptionColor: "#6B7280",
            },
            media: {
              type: "image" as const,
              imageUrl: "/partner-integrations/gift.png",
              videoUrl: "",
            },
            actionButtons: {
              primary: {
                enabled: true,
                text: "",
                color: "#7C3AED",
                url: "",
              },
              secondary: {
                enabled: false,
                text: "",
                color: "",
                url: "",
              },
            },
            date: {
              enabled: false,
              value: undefined,
              color: "#7C3AED",
            },
          };
          setLandingPageConfig(defaultConfig);
        }

        // Check for existing recipient ID in cookie
        const existingRecipientId =
          decodedToken.campaign_id == decodedToken.recipient_id
            ? getCookie("recipientId")
            : decodedToken.recipient_id;

        if (existingRecipientId) {
          console.log("Found existing recipient ID:", existingRecipientId);
          setSavedRecipientId(existingRecipientId);
        } else {
          // Create new recipient if none exists
          console.log("No existing recipient found, creating new one...");
          const newRecipientId = await createInitialRecipient(data.data._id);
          if (newRecipientId) {
            console.log("Created new recipient with ID:", newRecipientId);
            setSavedRecipientId(newRecipientId);
          } else {
            console.error("Failed to create new recipient");
          }
        }

        setLoading(false);

        // Track landing page visit and load after all data is ready
        if (decodedToken.recipient_id && decodedToken.campaign_id) {
          trackLandingPageVisit(
            decodedToken.recipient_id,
            decodedToken.campaign_id,
            window.location.href,
            document.referrer
          ).catch(error => {
            console.log('Failed to track landing page visit:', error);
          });

          trackLandingPageLoaded(
            decodedToken.recipient_id,
            decodedToken.campaign_id,
            window.location.href,
            performance.now()
          ).catch(error => {
            console.log('Failed to track landing page loaded:', error);
          });
        }
      } catch (error) {
        console.error("Error fetching campaign data:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    const fetchRecipientData = async () => {
        const token = searchParams.get("token");
        if (!token) {
          setError("No token provided");
          setLoading(false);
          return;
        }

        const decodedURIToken = decodeURIComponent(token);
        const decodedToken = verifyTemplateToken(decodedURIToken);

        if (!decodedToken) {
          console.error("Token verification failed");
          setError("Invalid token");
          setLoading(false);
          return;
        }

        const recipientId = decodedToken.recipient_id;
        const response = await fetch(`/api/recipients/${recipientId}`);
        const recipientData = await response.json();
        console.log("recipientData", recipientData);
        setUserName(recipientData.data.firstName);

        // Track recipient data fetch
        trackRecipientDataFetched(
          recipientId,
          decodedToken.campaign_id,
          true
        ).catch(error => {
          console.log('Failed to track recipient data fetch:', error);
        });

        if(recipientData.data.status !== "Acknowledged"  ) {
          const oldStatus = recipientData.data.status;
          const updateUserStatus = await fetch(`/api/recipients/${recipientId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "Acknowledged", acknowledgedAt: new Date().toISOString() }),
          });
          if(updateUserStatus.ok) {
            console.log("User status updated successfully");
            // Track recipient status update
            trackRecipientStatusUpdated(
              recipientId,
              decodedToken.campaign_id,
              oldStatus,
              "Acknowledged"
            ).catch(error => {
              console.log('Failed to track recipient status update:', error);
            });
          } else {
            console.error("Failed to update user status");
          }

        }
    };


    fetchCampaignData();
    fetchRecipientData();
  }, [searchParams]);

  // Track content viewing when page is loaded and data is available
  useEffect(() => {
    if (!loading && savedRecipientId && campaignData && landingPageConfig) {
      const campaignId = campaignData._id;

      // Track logo viewed
      if (landingPageConfig.logo.url && landingPageConfig.logo.url.trim()) {
        trackLogoViewed(savedRecipientId, campaignId, landingPageConfig.logo.url)
          .catch(error => console.log('Failed to track logo view:', error));
      }

      // Track headline viewed
      if (landingPageConfig.content.headline) {
        trackHeadlineViewed(savedRecipientId, campaignId, landingPageConfig.content.headline)
          .catch(error => console.log('Failed to track headline view:', error));
      }

      // Track description viewed
      if (landingPageConfig.content.description) {
        trackDescriptionViewed(savedRecipientId, campaignId, landingPageConfig.content.description)
          .catch(error => console.log('Failed to track description view:', error));
      }

      // Track date viewed
      if (landingPageConfig.date.enabled && landingPageConfig.date.value) {
        const dateString = landingPageConfig.date.value instanceof Date
          ? landingPageConfig.date.value.toISOString()
          : new Date(landingPageConfig.date.value).toISOString();
        
        trackDateViewed(savedRecipientId, campaignId, dateString)
          .catch(error => console.log('Failed to track date view:', error));
      }

      // Track media viewed
      if (landingPageConfig.media.type === "image" && landingPageConfig.media.imageUrl?.trim()) {
        trackMediaViewed(savedRecipientId, campaignId, "image", landingPageConfig.media.imageUrl)
          .catch(error => console.log('Failed to track image media view:', error));
      } else if (landingPageConfig.media.type === "video" && landingPageConfig.media.videoUrl?.trim()) {
        trackMediaViewed(savedRecipientId, campaignId, "video", landingPageConfig.media.videoUrl)
          .catch(error => console.log('Failed to track video media view:', error));
      }
    }
  }, [loading, savedRecipientId, campaignData, landingPageConfig]);

  // Track success modal when it's shown
  useEffect(() => {
    if (showSuccessModal && savedRecipientId && campaignData) {
      const messageContext = "feedback_completion"; // Generic context for all feedback types
      trackSuccessModalViewed(savedRecipientId, campaignData._id, messageContext)
        .catch(error => console.log('Failed to track success modal view:', error));
    }
  }, [showSuccessModal, savedRecipientId, campaignData]);

  if (loading) {
    return (
      <div className="relative bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen flex flex-col">
        {/* Skeleton loading */}
        <div className="w-full flex justify-center md:justify-end items-start md:pt-6">
          <div className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[350px] h-[40px] sm:h-[50px] md:h-[60px] lg:h-[70px] bg-gray-300/30 rounded-lg skeleton-shimmer"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 md:px-[6%] mx-auto pb-1 flex-grow">
          <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start mt-0 md:mt-10">
            <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
              <div className="space-y-2 md:space-y-4 lg:space-y-6">
                <div className="h-8 sm:h-10 md:h-12 bg-gray-300/30 rounded-lg w-3/4 skeleton-shimmer"></div>
                <div className="space-y-2">
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-full skeleton-shimmer"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-5/6 skeleton-shimmer"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-4/6 skeleton-shimmer"></div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <div className="h-8 md:h-11 w-24 md:w-32 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
                <div className="h-8 md:h-11 w-36 md:w-44 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
              </div>
            </div>
            <div className="w-full md:w-[55%] mt-10 md:mt-0 relative flex-shrink-0 flex flex-col items-end gap-2 md:gap-4">
              <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gray-300/30 shadow-lg skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !landingPageConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          {error || "No landing page configuration found"}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative shadow-lg min-h-screen flex flex-col"
      style={getBackgroundStyle()}
    >
      {/* Main Content */}
      <div className="relative w-full px-4 sm:px-6 md:px-[6%] mx-auto pb-1 flex-grow">
        <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start mt-6 md:mt-10">
          {/* Left Side - Text Content */}
          <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
            {/* Logo above headline, top-left aligned with headline */}
            {landingPageConfig.logo.url && landingPageConfig.logo.url.trim() && (
              <div className="mb-4">
                <img
                  src={landingPageConfig.logo.url}
                  alt="Company Logo"
                  className="h-8 md:h-10 object-contain"
                  onError={(e) => {
                    // Hide the logo container if image fails to load
                    const logoContainer = e.currentTarget.parentElement;
                    if (logoContainer) {
                      logoContainer.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}

            <div className="space-y-2 md:space-y-4 lg:space-y-6 relative z-10">
              <h1
                className="text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-bold leading-tight"
                style={{ color: landingPageConfig.content.headlineColor }}
              >
                {renderDynamicText(landingPageConfig.content.headline)}
              </h1>
              <p
                className="text-sm sm:text-base md:text-lg lg:text-2xl font-medium"
                style={{ color: landingPageConfig.content.descriptionColor }}
              >
                {renderDynamicText(landingPageConfig.content.description)}
              </p>
            </div>

            {/* Date Field */}
            {landingPageConfig.date.enabled && (
              <div
                className="flex items-center gap-2 font-medium text-base"
                style={{ color: landingPageConfig.date.color }}
              >
                <CalendarIcon className="w-5 h-5" />
                {landingPageConfig.date.value
                  ? landingPageConfig.date.value instanceof Date
                    ? landingPageConfig.date.value.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : new Date(landingPageConfig.date.value).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                  : "June 5, 2025"}
              </div>
            )}

            {/* Action buttons below content if no media */}
            {!((landingPageConfig.media.type === "image" && landingPageConfig.media.imageUrl && landingPageConfig.media.imageUrl.trim()) ||
              (landingPageConfig.media.type === "video" && landingPageConfig.media.videoUrl && landingPageConfig.media.videoUrl.trim())) &&
              savedRecipientId && (
              <div className="w-full">
                <div className="flex flex-col md:flex-row gap-3 justify-start">
                  {landingPageConfig.actionButtons.primary.enabled &&
                   landingPageConfig.actionButtons.primary.text &&
                   landingPageConfig.actionButtons.primary.text.trim() &&
                   landingPageConfig.actionButtons.primary.url &&
                   landingPageConfig.actionButtons.primary.url.trim() && (
                    <button
                      className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 animate-pulse-attention rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor:
                          landingPageConfig.actionButtons.primary.color,
                      }}
                      onClick={() => {
                        if (landingPageConfig.actionButtons.primary.url) {
                          // Track primary CTA click
                          if (savedRecipientId && campaignData) {
                            trackPrimaryCTAClick(
                              savedRecipientId,
                              campaignData._id,
                              landingPageConfig.actionButtons.primary.text,
                              landingPageConfig.actionButtons.primary.url
                            ).catch(error => {
                              console.log('Failed to track primary CTA click:', error);
                            });
                          }
                          
                          window.open(
                            landingPageConfig.actionButtons.primary.url,
                            "_blank"
                          );
                        }
                      }}
                    >
                      {landingPageConfig.actionButtons.primary.text}
                    </button>
                  )}
                  {landingPageConfig.actionButtons.secondary.enabled &&
                   landingPageConfig.actionButtons.secondary.text &&
                   landingPageConfig.actionButtons.secondary.text.trim() &&
                   landingPageConfig.actionButtons.secondary.url &&
                   landingPageConfig.actionButtons.secondary.url.trim() && (
                    <button
                      className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor:
                          landingPageConfig.actionButtons.secondary.color,
                      }}
                      onClick={() => {
                        if (landingPageConfig.actionButtons.secondary.url) {
                          // Track secondary CTA click
                          if (savedRecipientId && campaignData) {
                            trackSecondaryCTAClick(
                              savedRecipientId,
                              campaignData._id,
                              landingPageConfig.actionButtons.secondary.text,
                              landingPageConfig.actionButtons.secondary.url
                            ).catch(error => {
                              console.log('Failed to track secondary CTA click:', error);
                            });
                          }
                          
                          window.open(
                            landingPageConfig.actionButtons.secondary.url,
                            "_blank"
                          );
                        }
                      }}
                    >
                      {landingPageConfig.actionButtons.secondary.text}
                    </button>
                  )}
                  {/* Leave Message Button */}
                  <button
                      onClick={() => {
                        // Track feedback initiation
                        if (savedRecipientId && campaignData) {
                          trackFeedbackInitiated(savedRecipientId, campaignData._id)
                            .catch(error => {
                              console.log('Failed to track feedback initiation:', error);
                            });
                        }
                        
                        // Ensure complete reset of all feedback-related states
                        setFeedbackText("");
                        setRecordedVideo(null);
                        setRecordedAudio(null);

                        // Set audio as default feedback type immediately
                        setFeedbackType("audio");
                        setShowFeedbackModal(true);

                        // Track feedback type selection
                        if (savedRecipientId && campaignData) {
                          trackFeedbackTypeSelected(savedRecipientId, campaignData._id, "audio")
                            .catch(error => {
                              console.log('Failed to track feedback type selection:', error);
                            });
                        }

                        // Initialize audio recording after modal opens
                        setTimeout(() => {
                          initializeAudioRecording();
                        }, 100);
                      }}
                      className="flex-1 md:flex-none px-6 py-2 border border-primary text-primary hover:opacity-90 animate-pulse-attention rounded-lg bg-transparent transition-all duration-200"
                    >
                      Leave your message to Host
                    </button>
                </div>
              </div>
            )}

            {/* Feedback Section for Desktop - Left side (only when no action buttons shown above) */}
            {savedRecipientId && ((landingPageConfig.media.type === "image" && landingPageConfig.media.imageUrl && landingPageConfig.media.imageUrl.trim()) ||
              (landingPageConfig.media.type === "video" && landingPageConfig.media.videoUrl && landingPageConfig.media.videoUrl.trim())) && (
              <div className="hidden md:block w-full">
                <div className="relative h-[180px] sm:h-[200px] w-full">
                  <div className="absolute w-full rounded-lg pl-0 pt-0">
                    <div className="question-container">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                        {questions[0]}
                      </h3>
                    </div>
                    <div className="options-container">
                      {!feedbackSaved ? (
                        <div className="flex items-center gap-3 sm:gap-4 justify-center">
                          <button
                            onClick={() => handleReaction("like")}
                            disabled={isAnimating}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            >
                              <path d="M7 10v12"></path>
                              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReaction("dislike")}
                            disabled={isAnimating}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            >
                              <path d="M17 14V2"></path>
                              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Thank you for your feedback!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Section for Desktop - Left side (when no media is present) */}
            {savedRecipientId && !((landingPageConfig.media.type === "image" && landingPageConfig.media.imageUrl && landingPageConfig.media.imageUrl.trim()) ||
              (landingPageConfig.media.type === "video" && landingPageConfig.media.videoUrl && landingPageConfig.media.videoUrl.trim())) && (
              <div className="hidden md:block w-full">
                <div className="relative h-[180px] sm:h-[200px] w-full">
                  <div className="absolute w-full rounded-lg pl-0 pt-0">
                    <div className="question-container">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                        {questions[0]}
                      </h3>
                    </div>
                    <div className="options-container">
                      {!feedbackSaved ? (
                        <div className="flex items-center gap-3 sm:gap-4 justify-center">
                          <button
                            onClick={() => handleReaction("like")}
                            disabled={isAnimating}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            >
                              <path d="M7 10v12"></path>
                              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReaction("dislike")}
                            disabled={isAnimating}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            >
                              <path d="M17 14V2"></path>
                              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Thank you for your feedback!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Media and Action Buttons (when media is present) */}
          {((landingPageConfig.media.type === "image" && landingPageConfig.media.imageUrl && landingPageConfig.media.imageUrl.trim()) ||
            (landingPageConfig.media.type === "video" && landingPageConfig.media.videoUrl && landingPageConfig.media.videoUrl.trim())) && (
            <div className="w-full md:w-[55%] mt-4 md:mt-20 relative flex-shrink-0 flex flex-col gap-4">
              {/* Media Section */}
              <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                {landingPageConfig.media.type === "image" ? (
                  landingPageConfig.media.imageUrl && landingPageConfig.media.imageUrl.trim() ? (
                    <img
                      src={landingPageConfig.media.imageUrl}
                      alt="Resource"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide the media container if image fails to load
                        const mediaContainer = e.currentTarget.closest('div[class*="aspect-video"]');
                        if (mediaContainer) {
                          (mediaContainer as HTMLElement).style.display = 'none';
                        }
                      }}
                    />
                  ) : null
                ) : (
                  landingPageConfig.media.videoUrl && landingPageConfig.media.videoUrl.trim() && (
                    <VideoPlayer
                      url={landingPageConfig.media.videoUrl}
                      className="w-full h-full"
                      onPlay={() => {
                        if (savedRecipientId && campaignData) {
                          trackVideoPlayed(savedRecipientId, campaignData._id, landingPageConfig.media.videoUrl!)
                            .catch(error => console.log('Failed to track video play:', error));
                        }
                      }}
                    />
                  )
                )}
              </div>

              {/* Action buttons below media on the right */}
              {savedRecipientId && (
                <div className="w-full">
                  <div className="flex flex-col md:flex-row gap-3 justify-center">
                    {landingPageConfig.actionButtons.primary.enabled &&
                     landingPageConfig.actionButtons.primary.text &&
                     landingPageConfig.actionButtons.primary.text.trim() &&
                     landingPageConfig.actionButtons.primary.url &&
                     landingPageConfig.actionButtons.primary.url.trim() && (
                      <button
                        className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 animate-pulse-attention rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor:
                            landingPageConfig.actionButtons.primary.color,
                        }}
                        onClick={() => {
                          if (landingPageConfig.actionButtons.primary.url) {
                            window.open(
                              landingPageConfig.actionButtons.primary.url,
                              "_blank"
                            );
                          }
                        }}
                      >
                        {landingPageConfig.actionButtons.primary.text}
                      </button>
                    )}
                    {landingPageConfig.actionButtons.secondary.enabled &&
                     landingPageConfig.actionButtons.secondary.text &&
                     landingPageConfig.actionButtons.secondary.text.trim() &&
                     landingPageConfig.actionButtons.secondary.url &&
                     landingPageConfig.actionButtons.secondary.url.trim() && (
                      <button
                        className="flex-1 md:flex-none px-6 py-2 text-white hover:opacity-90 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor:
                            landingPageConfig.actionButtons.secondary.color,
                        }}
                        onClick={() => {
                          if (landingPageConfig.actionButtons.secondary.url) {
                            window.open(
                              landingPageConfig.actionButtons.secondary.url,
                              "_blank"
                            );
                          }
                        }}
                      >
                        {landingPageConfig.actionButtons.secondary.text}
                      </button>
                    )}
                    {/* Leave Message Button */}
                    <button
                      onClick={() => {
                        // Ensure complete reset of all feedback-related states
                        setFeedbackText("");
                        setRecordedVideo(null);
                        setRecordedAudio(null);

                        // Set audio as default feedback type immediately
                        setFeedbackType("audio");
                        setShowFeedbackModal(true);

                        // Initialize audio recording after modal opens
                        setTimeout(() => {
                          initializeAudioRecording();
                        }, 100);
                      }}
                      className="flex-1 md:flex-none px-6 py-2 border border-primary text-primary hover:opacity-90 animate-pulse-attention rounded-lg bg-transparent transition-all duration-200"
                    >
                      Leave your message to Host
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Mobile Feedback Section */}
            {savedRecipientId && (
              <div className="block md:hidden w-full mt-4">
                <div className="backdrop-blur-sm p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-3 text-center">
                    {questions[0]}
                  </h3>
                  {!feedbackSaved ? (
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => handleReaction("like")}
                        disabled={isAnimating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-xs text-gray-600 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="M7 10v12"></path>
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReaction("dislike")}
                        disabled={isAnimating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-xs text-gray-600 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="M17 14V2"></path>
                          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-gray-600">
                        Thank you for your feedback!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full mt-auto">
        <FooterMessage />
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackType(null);
                setFeedbackText("");
                // Clean up audio recording state if active
                if (audioStreamRef.current) {
                  audioStreamRef.current.getTracks().forEach((track) => track.stop());
                  audioStreamRef.current = null;
                }
                if (audioMediaRecorderRef.current?.state !== "inactive") {
                  audioMediaRecorderRef.current?.stop();
                }
                setIsRecordingAudio(false);
                setRecordedAudio(null);
                setAudioReady(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Leave your message to Host
            </h3>

            {/* Feedback Type Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  // Clean up any existing audio state first
                  if (audioStreamRef.current) {
                    audioStreamRef.current.getTracks().forEach((track) => track.stop());
                    audioStreamRef.current = null;
                  }
                  if (audioMediaRecorderRef.current?.state !== "inactive") {
                    audioMediaRecorderRef.current?.stop();
                  }
                  setIsRecordingAudio(false);
                  setRecordedAudio(null);
                  setAudioReady(false);
                  setFeedbackType("audio");
                  
                  // Track feedback type selection
                  if (savedRecipientId && campaignData) {
                    trackFeedbackTypeSelected(savedRecipientId, campaignData._id, "audio")
                      .catch(error => {
                        console.log('Failed to track audio feedback type selection:', error);
                      });
                  }
                  
                  // Initialize audio recording after a short delay
                  setTimeout(() => {
                    initializeAudioRecording();
                  }, 100);
                }}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-all duration-200 ${
                  feedbackType === "audio"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Audio
              </button>
              <button
                onClick={() => {
                  // Clean up audio state before switching
                  if (audioStreamRef.current) {
                    audioStreamRef.current.getTracks().forEach((track) => track.stop());
                    audioStreamRef.current = null;
                  }
                  if (audioMediaRecorderRef.current?.state !== "inactive") {
                    audioMediaRecorderRef.current?.stop();
                  }
                  setIsRecordingAudio(false);
                  setRecordedAudio(null);
                  setAudioReady(false);
                  setFeedbackType("video");
                  
                  // Track feedback type selection
                  if (savedRecipientId && campaignData) {
                    trackFeedbackTypeSelected(savedRecipientId, campaignData._id, "video")
                      .catch(error => {
                        console.log('Failed to track video feedback type selection:', error);
                      });
                  }
                  
                  setShowFeedbackModal(false);
                  initializeCamera();
                }}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-all duration-200 ${
                  feedbackType === "video"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Video
              </button>
              <button
                onClick={() => {
                  // Clean up audio state before switching
                  if (audioStreamRef.current) {
                    audioStreamRef.current.getTracks().forEach((track) => track.stop());
                    audioStreamRef.current = null;
                  }
                  if (audioMediaRecorderRef.current?.state !== "inactive") {
                    audioMediaRecorderRef.current?.stop();
                  }
                  setIsRecordingAudio(false);
                  setRecordedAudio(null);
                  setAudioReady(false);
                  setFeedbackType("text");
                  
                  // Track feedback type selection
                  if (savedRecipientId && campaignData) {
                    trackFeedbackTypeSelected(savedRecipientId, campaignData._id, "text")
                      .catch(error => {
                        console.log('Failed to track text feedback type selection:', error);
                      });
                  }
                }}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-all duration-200 ${
                  feedbackType === "text"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Text
              </button>
            </div>

            {/* Content Area */}
            {feedbackType === "audio" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    {recordedAudio
                      ? "Review Your Audio Message"
                      : isRecordingAudio
                      ? "Recording Audio..."
                      : "Record Your Audio Message"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {recordedAudio
                      ? "Listen to your recording and submit or record again"
                      : isRecordingAudio
                      ? "Speak clearly into your microphone"
                      : "Click the button below to start recording"}
                  </p>
                </div>

                {/* Audio Recording Interface */}
                <div className="relative">
                  {!recordedAudio ? (
                    // Recording interface
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                        {isRecordingAudio ? (
                          <div className="w-12 h-12 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <svg
                            className="w-12 h-12 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        )}
                      </div>

                      {isRecordingAudio && (
                        <div className="mb-4">
                          <div className="text-primary font-semibold text-lg">
                            {formatDuration(audioRecordingDuration)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Recording in progress...
                          </div>
                        </div>
                      )}

                      {!isRecordingAudio && !recordedAudio && audioReady && (
                        <div className="mb-4">
                          <div className="text-gray-700 font-medium">
                            Ready to record
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Click the button below to start recording
                          </div>
                        </div>
                      )}

                      {!audioReady && (
                        <div className="mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                          <div className="text-gray-600">
                            Initializing microphone...
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Audio playback interface
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-green-700 font-medium mb-4">
                        Recording completed!
                      </div>
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <audio
                          src={audioURL || ""}
                          controls
                          className="w-full"
                          style={{ maxWidth: "100%" }}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  {!recordedAudio && !isRecordingAudio && audioReady && (
                    <button
                      onClick={startAudioRecording}
                      className="flex items-center gap-2 rounded-full bg-primary text-white px-6 py-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-sm font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <circle cx="10" cy="10" r="8" />
                      </svg>
                      Start Recording
                    </button>
                  )}

                  {isRecordingAudio && (
                    <button
                      onClick={stopAudioRecording}
                      className="flex items-center gap-2 rounded-full bg-red-600 text-white px-6 py-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-sm font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <rect x="6" y="6" width="8" height="8" />
                      </svg>
                      Stop Recording
                    </button>
                  )}

                  {recordedAudio && (
                    <>
                      <button
                        onClick={handleAudioReRecord}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                      >
                        Record Again
                      </button>
                      <button
                        onClick={handleAudioUpload}
                        disabled={isUploading}
                        className="px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isUploading ? (
                          <>
                            <span className="inline-block animate-spin mr-2">
                              ⏳
                            </span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 md:w-5 md:h-5 inline-block mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Submit
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {feedbackType === "text" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="feedback-text"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your message
                  </label>
                  <textarea
                    id="feedback-text"
                    value={feedbackText}
                    onChange={(e) => {
                      setFeedbackText(e.target.value);
                      if (savedRecipientId && campaignData && e.target.value.length > 0) {
                        trackTextFeedbackTyped(savedRecipientId, campaignData._id, e.target.value.length);
                      }
                    }}
                    placeholder="Type your message to the host here..."
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleTextFeedbackSubmit}
                    disabled={!feedbackText.trim() || isUploading}
                    className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isUploading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">
                          ⏳
                        </span>
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </div>
              </div>
            )}

            {feedbackType === "video" && (
              <div className="text-center py-8">
                <div className="text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Opening video recorder...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Recording Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 relative">
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {recordedVideo
                ? "Review Your Message"
                : isRecording
                ? "Recording in Progress"
                : "Record Your Message for the Host!"}
            </h3>

            <div className="space-y-4">
              <div className="relative">
                {!recordedVideo ? (
                  // Camera preview
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[70vh] md:h-auto aspect-video rounded-lg border-2 border-gray-300 bg-gray-900 object-cover"
                  />
                ) : (
                  // Recorded video playback
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    src={videoURL || undefined}
                    className="w-full h-[70vh] md:h-auto aspect-video rounded-lg border-2 border-gray-300 bg-gray-900 object-cover"
                  />
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      REC {formatDuration(recordingDuration)}
                    </span>
                  </div>
                )}

                {/* Format warning */}
                {!recordedVideo &&
                  !isRecording &&
                  cameraReady &&
                  !MediaRecorder.isTypeSupported("video/mp4") && (
                    <div className="absolute bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-xs">
                      <strong>Note:</strong> Your browser doesn't support MP4
                      recording. The video may not upload successfully.
                    </div>
                  )}
              </div>

              <div className="flex justify-center gap-4">
                {!recordedVideo && !isRecording && cameraReady && (
                  <button
                    onClick={startRecording}
                    className="rounded-full bg-red-600 text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 inline-block mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                    Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="rounded-full bg-gray-600 text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 inline-block mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect
                        x="6"
                        y="6"
                        width="12"
                        height="12"
                        strokeWidth={2}
                      />
                    </svg>
                    Stop Recording
                  </button>
                )}

                {recordedVideo && (
                  <>
                    <button
                      onClick={handleReRecord}
                      className="rounded-full border border-violet-600 text-violet-600 px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                    >
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Re-record
                    </button>
                    <button
                      onClick={handleVideoUpload}
                      disabled={isUploading}
                      className="rounded-full bg-primary text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                    >
                      {isUploading ? (
                        <>
                          <span className="inline-block animate-spin mr-2">
                            ⏳
                          </span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 inline-block mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Submit
                        </>
                      )}
                    </button>
                  </>
                )}

                {!cameraReady && !recordedVideo && (
                  <div className="text-center text-gray-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600 mx-auto mb-2"></div>
                    <p className="text-sm">Initializing camera...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowEmailForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 z-10"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pr-8">
              Get personalized updates and let the host see your name!
            </h3>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    // Track email form skip
                    if (savedRecipientId && campaignData) {
                      const feedbackType = uploadedVideoUrl ? 'video_feedback' : uploadedAudioUrl ? 'audio_feedback' : 'text_feedback';
                      trackEmailFormSkipped(savedRecipientId, campaignData._id, feedbackType);
                    }
                    
                    setShowEmailForm(false);
                    // Reset feedback modal states when skipping email form
                    setFeedbackType(null);
                    setShowFeedbackModal(false);
                    setFeedbackText("");
                    setShowSuccessModal(true);
                  }}
                  className="rounded-full border border-violet-600 text-violet-600 px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-sm"
                  disabled={isUploading}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !userEmail || !userName}
                  className="rounded-full bg-primary text-white px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  {isUploading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      Get Updates
                      <svg
                        className="ml-1.5 -mr-1 w-3.5 h-3.5 inline-block"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your message has been sent to the host successfully.
              </p>
              <button
                onClick={() => {
                  // Track success modal close
                  if (savedRecipientId && campaignData) {
                    const messageContext = "feedback_completion";
                    trackSuccessModalClosed(savedRecipientId, campaignData._id, messageContext)
                      .catch(error => console.log('Failed to track success modal close:', error));
                  }
                  
                  setShowSuccessModal(false);
                  // Reset all feedback states when closing success modal
                  setFeedbackType(null);
                  setFeedbackText("");
                  setShowFeedbackModal(false);
                }}
                className="w-full rounded-full bg-primary text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
