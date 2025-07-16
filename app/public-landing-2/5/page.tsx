"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { verifyTemplateToken } from "@/utils/templateToken";
import confetti from "canvas-confetti";
import BookingModal from "@/components/common/BookingModal";

// Add required CSS for animations (moved to top-level and injected in useEffect)
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

// Add cookie management functions
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

      // Verify cookie was set
      const savedId = getCookie("recipientId");
      if (savedId !== result.data._id) {
        console.error("Failed to save recipient ID to cookie");
        return null;
      }

      return result.data._id;
    }

    return null;
  } catch (error) {
    console.error("Error creating initial recipient:", error);
    return null;
  }
};

// Add FooterMessage component
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

interface PlaybookData {
  template?: {
    logoLink?: string;
    videoLink?: string;
    description?: string;
    buttonText1?: string;
    buttonText2?: string;
    buttonLink1?: string;
    buttonLink2?: string;
  };
  recipient?: {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
    recipient_email?: string;
    name?: string;
    acknowledgedAt?: Date | null;
  };
}

export default function Page() {
  const searchParams = useSearchParams();
  const [playbook, setPlaybook] = useState<PlaybookData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<
    Array<{ question: string; response: string }>
  >([]);
  const [textResponse, setTextResponse] = useState("");
  const [animationState, setAnimationState] = useState<
    "initial" | "exit" | "enter"
  >("initial");
  const [isAnimating, setIsAnimating] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);

  // New states for links and email
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [pdfLink, setPdfLink] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalType, setModalType] = useState<"drive" | "pdf" | "video" | null>(
    null
  );
  const [tempLink, setTempLink] = useState("");

  // Add state to store recipient ID
  const [savedRecipientId, setSavedRecipientId] = useState<string | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Array of questions to display sequentially
  const questions = [
    "Was this experience delightfull?",
    "Leave a message to the host & we will plant a tree on your behalf!",
  ];

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

  // Video recording functions
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
      // alert(
      //   "Unable to access camera. Please ensure you have granted camera permissions and try again."
      // );
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

      // Start recording timer
      let duration = 0;
      recordingIntervalRef.current = setInterval(() => {
        duration += 1;
        setRecordingDuration(duration);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      //alert("Failed to start recording. Please try again.");
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

  const handleReaction = (type: "like" | "dislike" | string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationState("exit");

    setUserResponses((prev) => [
      ...prev,
      {
        question: questions[currentQuestionIndex],
        response: type,
      },
    ]);

    sendFeedback(type);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeout(() => {
          setAnimationState("enter");
          setTimeout(() => {
            setAnimationState("initial");
            setIsAnimating(false);
          }, 450);
        }, 50);
      }, 400);
    } else {
      setTimeout(() => {
        setIsAnimating(false);
      }, 450);
    }
  };

  const handleTextSubmit = () => {
    if (textResponse.trim()) {
      handleReaction(textResponse);
      setTextResponse("");
    }
  };

  const sendFeedback = (type: string) => {
    // Use saved recipient ID if available, otherwise try to get from token
    let recipientId = savedRecipientId;

    if (!recipientId) {
      if (!searchParams) {
        console.error("No search params available");
        return;
      }

      const token = searchParams.get("token");
      if (!token) {
        console.error("No token found in URL and no saved recipient ID");
        return;
      }

      try {
        const decodedURIToken = decodeURIComponent(token);
        const decodedToken = verifyTemplateToken(decodedURIToken);

        if (!decodedToken || !decodedToken.recipient_id) {
          console.error("Invalid token or missing recipient_id");
          return;
        }

        recipientId = decodedToken.recipient_id;
      } catch (error) {
        console.error("Error handling reaction:", error);
        return;
      }
    }

    let payload: Record<string, any> = {};

    if (currentQuestionIndex === 0) {
      const reactionType = type === "like" ? "thumbs_up" : "thumbs_down";
      payload = {
        question1: questions[currentQuestionIndex],
        reaction1: reactionType,
      };
    } else if (currentQuestionIndex === 1) {
      payload = {
        question1: questions[0],
        reaction1:
          userResponses.find((r) => r.question === questions[0])?.response ===
          "like"
            ? "thumbs_up"
            : "thumbs_down",
        question2: questions[currentQuestionIndex],
        reaction2: type,
      };
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "/v1/";
    const apiUrl = `${apiBaseUrl}/recipients/${recipientId}/feedback`;

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            try {
              const errorData = JSON.parse(text);
              throw new Error(
                `Server responded with ${response.status}: ${
                  errorData.error_message || text
                }`
              );
            } catch (e) {
              throw new Error(
                `Server responded with ${response.status}: ${text}`
              );
            }
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Feedback saved successfully:`, data);
        setFeedbackSaved(true);
        triggerConfetti();
      })
      .catch((error) => {
        console.error(`Error saving feedback:`, error);
      });
  };

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  const handleVideoUpload = async () => {
    if (!recordedVideo) return;

    setIsUploading(true);
    try {
      console.log("Starting video upload with type:", recordedVideo.type);

      // If the recorded video is WebM, we need to inform the user
      if (recordedVideo.type.includes("webm")) {
        // For now, we'll try to upload as MP4 and let the server handle it
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

      // Trigger confetti celebration
      triggerConfetti();

      // Close video modal
      closeVideoModal();

      // Ask if user wants to provide details or save anonymously
      const wantsToProvideDetails = true;
      console.log(campaignData);
      if (wantsToProvideDetails) {
        if(campaignData?.motion == 'booth_giveaways'){
            setShowEmailForm(true);
        }else{
            setShowSuccessModal(true)
        }
      } else {
        // Save with device identifier
        await saveWithDeviceIdentifier();
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      //alert(error instanceof Error ? error.message : "Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
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

      // Build feedback object that includes both previous responses and video
      let feedbackData: any = undefined;
      if (uploadedVideoUrl || userResponses.length > 0) {
        feedbackData = {};

        // Add video URL if exists
        if (uploadedVideoUrl) {
          feedbackData.message = { mediaUrl: uploadedVideoUrl };
        }

        // Add previous feedback responses
        if (userResponses.length > 0) {
          userResponses.forEach((response, index) => {
            if (index === 0) {
              const reactionType =
                response.response === "like" ? "thumbs_up" : "thumbs_down";
              feedbackData.question1 = response.question;
              feedbackData.reaction1 = reactionType;
            } else if (index === 1) {
              feedbackData.question2 = response.question;
              feedbackData.reaction2 = response.response;
            }
          });
        }
      }

      // Update recipient with video URL if exists
      const recipientData = {
        firstName: userName,
        mailId: userEmail,
        status: "Acknowledged",
        campaignId: campaignData?._id || null,
        acknowledgedAt: new Date().toISOString(),
        feedback: feedbackData,
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

      // Clear states
      setShowEmailForm(false);
      setUserEmail("");
      setUserName("");
      setUploadedVideoUrl(null);

      // Trigger confetti celebration
      triggerConfetti();

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error in submission:", error);
      // alert(
      //   error instanceof Error
      //     ? error.message
      //     : "Failed to save information. Please try again."
      // );
    } finally {
      setIsUploading(false);
    }
  };

  const saveWithDeviceIdentifier = async () => {
    setIsUploading(true);
    try {
      // Get recipient ID from cookie
      const recipientId = savedRecipientId;
      if (!recipientId) {
        throw new Error("No recipient ID found");
      }

      // First, fetch current recipient data to check if they already have real details
      const currentRecipientResponse = await fetch(
        `/api/recipients/${recipientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      let useExistingDetails = false;
      let existingFirstName = "";
      let existingEmail = "";

      if (currentRecipientResponse.ok) {
        const currentRecipient = await currentRecipientResponse.json();
        const currentData = currentRecipient.data;

        // Check if current recipient has real details (not anonymous)
        if (
          currentData &&
          currentData.firstName &&
          currentData.mailId &&
          !currentData.mailId.includes("anonymous_") &&
          !currentData.mailId.includes("@device.local")
        ) {
          useExistingDetails = true;
          existingFirstName = currentData.firstName;
          existingEmail = currentData.mailId;
          console.log("Found existing real user details, preserving them");
        }
      }

      // Build feedback object that includes both previous responses and video
      let feedbackData: any = undefined;
      if (uploadedVideoUrl || userResponses.length > 0) {
        feedbackData = {};

        // Add video URL if exists
        if (uploadedVideoUrl) {
          feedbackData.message = { mediaUrl: uploadedVideoUrl };
        }

        // Add previous feedback responses
        if (userResponses.length > 0) {
          userResponses.forEach((response, index) => {
            if (index === 0) {
              const reactionType =
                response.response === "like" ? "thumbs_up" : "thumbs_down";
              feedbackData.question1 = response.question;
              feedbackData.reaction1 = reactionType;
            } else if (index === 1) {
              feedbackData.question2 = response.question;
              feedbackData.reaction2 = response.response;
            }
          });
        }
      }

      // Use existing details if available, otherwise use device identifier
      const deviceIdentifier = getDeviceIdentifier();
      const recipientData = {
        firstName: useExistingDetails ? existingFirstName : deviceIdentifier,
        mailId: useExistingDetails
          ? existingEmail
          : `anonymous_${Date.now()}@device.local`,
        status: "Acknowledged",
        campaignId: campaignData?._id || null,
        acknowledgedAt: new Date().toISOString(),
        feedback: feedbackData,
      };

      console.log(
        "Sending recipient update:",
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

      // Clear states
      setUploadedVideoUrl(null);
      setShowEmailForm(false);

      // Trigger confetti celebration
      triggerConfetti();

      const displayName = useExistingDetails
        ? existingFirstName
        : deviceIdentifier;
      console.log(
        `Thank you! Your message has been saved${useExistingDetails ? "" : ` as "${displayName}"`}`
      );
    } catch (error) {
      console.error("Error saving submission:", error);
      // alert(
      //   error instanceof Error
      //     ? error.message
      //     : "Failed to save information. Please try again."
      // );
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalSubmit = () => {
    if (modalType === "drive") {
      setGoogleDriveLink(tempLink);
    } else if (modalType === "pdf") {
      setPdfLink(tempLink);
    }
    setShowLinkModal(false);
    setModalType(null);
    setTempLink("");
  };
  const [campaignData, setCampaignData] = useState<any>(null);

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
        setCampaignData(data.data);
        setPlaybook({
          template: data.data.outcomeTemplate,
        });

        // Check for existing recipient ID in cookie

        const existingRecipientId =
          decodedToken.campaign_id == decodedToken.recipient_id
            ? getCookie("recipientId")
            : decodedToken.recipient_id;

        if (existingRecipientId) {
          console.log(
            "Found existing recipient ID in cookie:",
            existingRecipientId
          );
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
      } catch (error) {
        console.error("Error fetching campaign data:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [searchParams]);

  const [userName, setUserName] = useState("");

  const getEmbedUrl = (url: string) => {
    try {
      const videoUrl = new URL(url);
      if (
        videoUrl.hostname.includes("youtube.com") ||
        videoUrl.hostname.includes("youtu.be")
      ) {
        const videoId = url.includes("youtu.be")
          ? url.split("/").pop()
          : new URLSearchParams(videoUrl.search).get("v");
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Function to send stored feedback responses for a specific recipient
  const sendStoredFeedback = async (recipientId: string) => {
    if (userResponses.length === 0) return;

    const payload: Record<string, any> = {};

    // Build payload from stored responses
    userResponses.forEach((response, index) => {
      if (index === 0) {
        const reactionType =
          response.response === "like" ? "thumbs_up" : "thumbs_down";
        payload.question1 = response.question;
        payload.reaction1 = reactionType;
      } else if (index === 1) {
        payload.question2 = response.question;
        payload.reaction2 = response.response;
      }
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "/v1/";
    const apiUrl = `${apiBaseUrl}/recipients/${recipientId}/feedback`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log(`Stored feedback saved successfully:`, data);
      setFeedbackSaved(true);
    } catch (error) {
      console.error(`Error saving stored feedback:`, error);
    }
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen flex flex-col">
        {/* Skeleton for Logo */}
        <div className="w-full flex justify-center md:justify-end items-start md:pt-6">
          <div className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[350px] h-[40px] sm:h-[50px] md:h-[60px] lg:h-[70px] bg-gray-300/30 rounded-lg skeleton-shimmer"></div>
        </div>

        {/* Skeleton for Content and Video */}
        <div className="relative w-full px-4 sm:px-6 md:px-[6%] mx-auto pb-1 flex-grow">
          <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start mt-0 md:mt-10">
            {/* Skeleton for Text Content */}
            <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
              {/* Title skeleton */}
              <div className="space-y-2 md:space-y-4 lg:space-y-6">
                <div className="h-8 sm:h-10 md:h-12 bg-gray-300/30 rounded-lg w-3/4 skeleton-shimmer"></div>
                <div className="space-y-2">
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-full skeleton-shimmer"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-5/6 skeleton-shimmer"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-300/30 rounded-lg w-4/6 skeleton-shimmer"></div>
                </div>
              </div>

              {/* Buttons skeleton */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <div className="h-8 md:h-11 w-24 md:w-32 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
                <div className="h-8 md:h-11 w-36 md:w-44 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
              </div>
            </div>

            {/* Skeleton for Video */}
            <div className="w-full md:w-[55%] mt-10 md:mt-0 relative flex-shrink-0 flex flex-col items-end gap-2 md:gap-4">
              <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gray-300/30 shadow-lg skeleton-shimmer"></div>

              {/* Made with skeleton */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-16 bg-gray-300/30 rounded skeleton-shimmer"></div>
                <div className="h-4 w-20 bg-gray-300/30 rounded skeleton-shimmer"></div>
              </div>

              {/* Leave message button skeleton */}
              <div className="w-full mt-4 mb-12 md:mb-4 flex justify-center">
                <div className="h-10 md:h-11 w-48 md:w-56 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton for Footer */}
        <div className="w-full mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
              <div className="h-4 w-64 sm:w-96 bg-gray-300/30 rounded skeleton-shimmer"></div>
              <div className="h-8 w-48 bg-gray-300/30 rounded-full skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //   if (error) {
  //     return (
  //       <div className="min-h-screen flex items-center justify-center">
  //         <div className="text-red-600">{error}</div>
  //       </div>
  //     );
  //   }

  return (
    <div className="relative bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen flex flex-col">
      {/* Row 1: Logo */}
      <div className="w-full flex justify-center md:justify-end items-start md:pt-6">
        <div className="w-[150px] h-[100px]     lg:w-[150px] md:mr-8 ">
          <Image
            src={`${playbook.template?.logoLink ? playbook?.template?.logoLink : "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748708239/TwinkleShaun_Logo_Cropped_Transparent_gc1nai.png"}`}
            alt="Company Logo"
            width={350}
            height={100}
            className="object-contain h-full w-full"
          />
        </div>
      </div>

      {/* Row 2: Content and Video */}
      <div className="relative w-full px-4 sm:px-6 md:px-[6%] mx-auto pb-1 flex-grow">
        <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start mt-0 md:mt-10">
          {/* Col 1: Text Content */}
          <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
            <div className="space-y-2 md:space-y-4 lg:space-y-6 relative z-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-bold text-[#101828] leading-tight">
                {campaignData?.name?.replace("Booth Giveaways", "") ||
                  "Campaign"}
                {/* [Event Name] */}
              </h1>
              {playbook.template?.description && (
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-[#101828] font-medium">
                  {playbook.template.description}
                </p>
              )}
            </div>

            {/* Feedback Section for Desktop - Center aligned in left column */}
            {savedRecipientId && (
              <div className="hidden md:block w-full">
                <div className="relative h-[180px] sm:h-[200px] w-full">
                  {currentQuestionIndex < questions.length ? (
                    <div className="absolute w-full rounded-lg pl-0 pt-0">
                      <div
                        className={`question-container ${
                          animationState === "exit"
                            ? "question-exit"
                            : animationState === "enter"
                              ? "question-enter"
                              : ""
                        }`}
                      >
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                          {questions[currentQuestionIndex]}
                        </h3>
                      </div>
                      <div
                        className={`options-container ${
                          animationState === "exit"
                            ? "options-exit"
                            : animationState === "enter"
                              ? "options-enter"
                              : ""
                        }`}
                      >
                        {currentQuestionIndex === 0 ? (
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
                          <div className="flex flex-col gap-3 sm:gap-4">
                            <textarea
                              value={textResponse}
                              onChange={(e) => setTextResponse(e.target.value)}
                              placeholder="Type your message here..."
                              className="w-full p-2 sm:p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-xs sm:text-sm"
                              rows={3}
                            />
                            <button
                              onClick={handleTextSubmit}
                              disabled={!textResponse.trim() || isAnimating}
                              className="self-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
                            >
                              Submit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute w-full mt-2 sm:mt-3 rounded-lg pl-0">
                      <div className="question-enter text-center">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-2 sm:mb-4">
                          Thank you for your feedback!
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {feedbackSaved
                            ? "Your feedback has been saved successfully!"
                            : "Your feedback will be saved when you submit your email below."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Video */}
          <div className="w-full md:w-[55%] mt-10 md:mt-0    relative flex-shrink-0 flex flex-col items-end gap-2 md:gap-4">
            {/* Video Section */}
            {playbook.template?.videoLink ? (
              <>
                <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-[#101828] shadow-lg">
                  <iframe
                    src={getEmbedUrl(playbook.template.videoLink)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* <Image
                    src={"/partner-integrations/upload-video.png"}
                    alt="Video"
                    width={1000}
                    height={1000}
                    className="w-full h-full object-cover"
                  /> */}
                </div>
              </>
            ) : (
              <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-[#101828] flex items-center justify-center shadow-lg">
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <Image
                    src="/partner-integrations/upload-video.png"
                    alt="Video Placeholder"
                    width={48}
                    height={48}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12"
                  />
                  <p className="text-white text-xs sm:text-sm">
                    Loading video player...
                  </p>
                </div>
              </div>
            )}

            {/* Video Recording Section */}
            <div className="w-full mt-4 mb-12 md:mb-4">
              <div className="flex flex-col items-center gap-4">
                {!showVideoModal && (
                  <div className="grid gap-2 md:flex md:flex-wrap md:justify-center">
                    <button
                      onClick={initializeCamera}
                      className="whitespace-nowrap md:w-fit rounded-full border border-violet-600 px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all w-full duration-200 bg-primary text-white text-xs md:text-base animate-pulse-attention"
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Leave a Message for Host
                    </button>

                    <a
                      href={
                        playbook.template?.buttonLink1 ||
                        "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620504/Twinkle_Function_Map_wdiowx.pdf"
                      }
                      target="_blank"
                      className="whitespace-nowrap justify-center flex gap-2 items-center rounded-full border border-violet-600 text-violet-600 px-2 py-1.5 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 14 14"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12.5 12.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H9L12.5 4z" />
                          <path d="M5.3 3.517C4.006 3.9 9.4 10.4 9.975 8.913s-7.085.43-5.823 1.487S6.593 3.133 5.3 3.517" />
                        </g>
                      </svg>
                      {!playbook.template?.buttonText1 ||
                      playbook.template.buttonText1 === "Button 1"
                        ? "Venue Map"
                        : playbook.template.buttonText1}
                    </a>
                    <a
                      href={
                        playbook.template?.buttonLink2 ||
                        "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620503/20250517_144033_abplvy.jpg"
                      }
                      target="_blank"
                      className="whitespace-nowrap flex justify-center gap-2 items-center rounded-full border border-violet-600 text-violet-600 px-2 py-1.5 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="m20.017 19.412l1.407-2.583c.387-.71.58-1.067.576-1.451s-.208-.736-.613-1.438l-5.442-9.417c-.43-.743-.644-1.114-1.002-1.319S14.15 3 13.277 3h-2.554c-.872 0-1.308 0-1.666.204c-.358.205-.573.576-1.002 1.319L2.613 13.94c-.405.702-.608 1.053-.613 1.438c-.005.384.189.74.576 1.451l1.408 2.583c.421.774.632 1.16.996 1.374S5.792 21 6.688 21h10.624c.896 0 1.344 0 1.708-.214c.364-.213.575-.6.997-1.374M9 4l7 11M5.5 20.5L12 9m9 6H9"
                          color="currentColor"
                        />
                      </svg>
                      {!playbook.template?.buttonText2 ||
                      playbook.template.buttonText2 === "Button 2"
                        ? "Upload your memories for the couple"
                        : playbook.template.buttonText2}
                    </a>
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
                                <strong>Note:</strong> Your browser doesn't
                                support MP4 recording. The video may not upload
                                successfully.
                              </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                          {!recordedVideo && !isRecording && cameraReady && (
                            <button
                              onClick={startRecording}
                              className="whitespace-nowrap rounded-full bg-red-600 text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
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
                              className="whitespace-nowrap rounded-full bg-gray-600 text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
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
                                className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
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
                                className="whitespace-nowrap rounded-full bg-primary text-white px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
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
                                    Save Video
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
              </div>
            </div>
            {savedRecipientId && (
              <div className=" flex-col flex md:hidden md:flex-row gap-6 md:gap-8 lg:gap-12 w-full mt-8">
                {/* Left column: empty, matches text col width */}
                <div className="w-full md:w-[45%] flex-shrink-0"></div>
                {/* Right column: feedback/questions only */}
                <div className="w-full md:w-[55%] flex-shrink-0">
                  {/* Feedback Section */}
                  <div className="relative h-[180px] sm:h-[200px] w-full">
                    {currentQuestionIndex < questions.length ? (
                      <div className="absolute w-full rounded-lg pl-0 pt-0">
                        <div
                          className={`question-container ${
                            animationState === "exit"
                              ? "question-exit"
                              : animationState === "enter"
                                ? "question-enter"
                                : ""
                          }`}
                        >
                          <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                            {questions[currentQuestionIndex]}
                          </h3>
                        </div>
                        <div
                          className={`options-container ${
                            animationState === "exit"
                              ? "options-exit"
                              : animationState === "enter"
                                ? "options-enter"
                                : ""
                          }`}
                        >
                          {currentQuestionIndex === 0 ? (
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
                            <div className="flex flex-col gap-3 sm:gap-4">
                              <textarea
                                value={textResponse}
                                onChange={(e) =>
                                  setTextResponse(e.target.value)
                                }
                                placeholder="Type your message here..."
                                className="w-full p-2 sm:p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-xs sm:text-sm"
                                rows={3}
                              />
                              <button
                                onClick={handleTextSubmit}
                                disabled={!textResponse.trim() || isAnimating}
                                className="self-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute w-full mt-2 sm:mt-3 rounded-lg pl-0">
                        <div className="question-enter text-center">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-2 sm:mb-4">
                            Thank you for your feedback!
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {feedbackSaved
                              ? "Your feedback has been saved successfully!"
                              : "Your feedback will be saved when you submit your email below."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Footer */}
      <div className="w-full mt-auto">
        <FooterMessage />
      </div>

      {/* Link Input Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowLinkModal(false)}
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
              {modalType === "drive"
                ? "Add Google Drive Link"
                : modalType === "pdf"
                  ? "Add PDF Link"
                  : "Record Video Message"}
            </h3>
            {modalType === "video" ? (
              <div className="space-y-4">
                {!isRecording && !recordedVideo && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setShowLinkModal(false);
                        startRecording();
                      }}
                      className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-4 py-2 md:px-6 md:py-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-base"
                    >
                      Start Recording
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="link"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {modalType === "drive" ? "Drive Link" : "PDF Link"}
                  </label>
                  <input
                    type="url"
                    id="link"
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder={
                      modalType === "drive"
                        ? "https://drive.google.com/..."
                        : "https://example.com/document.pdf"
                    }
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLinkModal(false)}
                    className="whitespace-nowrap rounded-full border border-gray-300 text-gray-700 px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalSubmit}
                    disabled={!tempLink}
                    className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={async () => {
                setShowEmailForm(false);
                // Save with device identifier if video was uploaded
                if (uploadedVideoUrl) {
                  await saveWithDeviceIdentifier();
                }
              }}
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
            {/* <p className="text-sm text-gray-500 mb-4">
              Provide your details to receive event updates, or skip to save
              anonymously.
            </p> */}
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
                  onClick={async () => {
                    setShowEmailForm(false);
                    // Save with device identifier if video was uploaded
                    if (uploadedVideoUrl) {
                      await saveWithDeviceIdentifier();
                    }
                  }}
                  className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-xs md:text-sm"
                  disabled={isUploading}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !userEmail || !userName}
                  className="whitespace-nowrap rounded-full bg-primary text-white px-4 py-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
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
                You're All Set!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                We'll Make Sure You Don't Miss a Beat of the Event.
              </p>
              <button
                onClick={async () =>{
                    if(campaignData?.motion != 'booth_giveaways'){
                         // Save with device identifier if video was uploaded
                    if (uploadedVideoUrl) {
                        await saveWithDeviceIdentifier();
                      }
                    }
                    setShowSuccessModal(false)
                }
                    }
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
