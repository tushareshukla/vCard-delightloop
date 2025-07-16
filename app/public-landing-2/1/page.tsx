"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyTemplateToken } from "@/utils/templateToken";
import BookingModal from "@/components/common/BookingModal";

// Add FooterMessage component
const FooterMessage = () => {
  return (
    <div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#475467]">
              <span className="font-semibold">Made with</span> ❤️
              <Image
                src="/Logo Final.png"
                alt="heart"
                width={96}
                height={16}
                className="w-12 sm:w-16 md:w-20 lg:w-24"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 sm:mt-0">
              🎁 Loved this experience? Discover how leading teams create moments like this — at scale, with AI.
            </p>
          </div>
          <a
            href="https://www.delightloop.com/bookademo"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full border border-violet-600 text-violet-600 px-2 py-1.3 hover:bg-violet-50 transition-colors duration-200"
          >
            Book a 20-min strategy call →
          </a>
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
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Array<{question: string, response: string}>>([]);
  const [textResponse, setTextResponse] = useState("");
  const [animationState, setAnimationState] = useState<'initial' | 'exit' | 'enter'>('initial');
  const [isAnimating, setIsAnimating] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);

  // Array of questions to display sequentially
  const questions = [
    "Was this experience delightfull?",
    "Leave a message to the host & we will plant a tree on your behalf!"
  ];

  const handleReaction = (type: 'like' | 'dislike' | string) => {
    // Prevent multiple animations from running at once
    if (isAnimating) return;
    setIsAnimating(true);

    // Set animation to exit mode
    setAnimationState('exit');

    // Save the response
    setUserResponses(prev => [...prev, {
      question: questions[currentQuestionIndex],
      response: type
    }]);

    // Handle API call immediately
    sendFeedback(type);

    // Move to next question or finish if all questions are answered
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);

        // Set animation to enter mode after a short delay
        setTimeout(() => {
          setAnimationState('enter');

          // Reset animation state after animation completes
          setTimeout(() => {
            setAnimationState('initial');
            setIsAnimating(false);
          }, 450);
        }, 50);
      }, 400);
    } else {
      // If we're on the last question, just reset animation state after exit completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 450);
    }
  };

  const handleTextSubmit = () => {
    if (textResponse.trim()) {
      handleReaction(textResponse);
      setTextResponse(""); // Clear the text input after submission
    }
  };

  // Separate function for API call to keep handleReaction cleaner
  const sendFeedback = (type: string) => {
    // Get the recipient ID from the decoded token
    const token = searchParams?.get("token");
    if (!token) {
      console.error("No token found in URL");
      return;
    }

    try {
      // Decode the token to get recipient_id
      const decodedURIToken = decodeURIComponent(token);
      const decodedToken = verifyTemplateToken(decodedURIToken);


      if (!decodedToken || !decodedToken.recipient_id) {
        console.error("Invalid token or missing recipient_id");
        return;
      }

      // Create a payload with the exact format expected by the backend
      let payload: Record<string, any> = {};

      // Set the appropriate question and reaction fields
      if (currentQuestionIndex === 0) {
        // For first question, convert like/dislike to thumbs_up/thumbs_down
        const reactionType = type === 'like' ? 'thumbs_up' : 'thumbs_down';
        payload = {
          question1: questions[currentQuestionIndex],
          reaction1: reactionType
        };
      } else if (currentQuestionIndex === 1) {
        // For second question, use the text response
        payload = {
          question1: questions[0],
          reaction1: userResponses.find(r => r.question === questions[0])?.response === 'like' ? 'thumbs_up' : 'thumbs_down',
          question2: questions[currentQuestionIndex],
          reaction2: type // This is now the text message
        };
      }

      console.log(`Sending feedback for question ${currentQuestionIndex + 1}:`, payload);

      // Get the API base URL from environment or use the localhost default
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + '/v1/';
      const apiUrl = `${apiBaseUrl}/recipients/${decodedToken.recipient_id}/feedback`;

      console.log(`Sending feedback to API URL: ${apiUrl}`);

      // Send feedback directly to backend API endpoint
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Failed to save feedback for question ${currentQuestionIndex + 1}:`, response.status);
          return response.text().then(text => {
            try {
              // Try to parse as JSON for structured error messages
              const errorData = JSON.parse(text);
              console.error("Error response:", errorData);
              throw new Error(`Server responded with ${response.status}: ${errorData.error_message || text}`);
            } catch (e) {
              // If not JSON, use as plain text
              console.error("Error response:", text);
              throw new Error(`Server responded with ${response.status}: ${text}`);
            }
          });
        }
        return response.json();
      })
      .then(data => {
        console.log(`Feedback for question ${currentQuestionIndex + 1} saved successfully:`, data);
        // Log the response data to help with debugging
        if (data.recipient && data.recipient.feedback) {
          console.log('Saved feedback data:', data.recipient.feedback);
        }
      })
      .catch(error => {
        console.error(`Error saving feedback for question ${currentQuestionIndex + 1}:`, error);
      });
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  useEffect(() => {
    // Check for specific token and redirect if matched
    const token = searchParams?.get("token");

    if (!token) {
      setError("No token provided");
      setLoading(false);
      return;
    }

    if (token === "eyJyZWNpcGllbnRfaWQiOiI2ODFlNTllNzM5YzU5N2ZhNDYzZWZmNmMiLCJwbGF5Ym9va19pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiIsInBsYXlib29rX3J1bl9pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiJ9.YI966UK4ciZ9swQX/q09zIIxySy/sJ2V8CS8NBf8fK0=" ||
        token === "eyJyZWNpcGllbnRfaWQiOiI2ODFlNTllNzM5YzU5N2ZhNDYzZWZmNmMiLCJwbGF5Ym9va19pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiIsInBsYXlib29rX3J1bl9pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiJ9.YI966UK4ciZ9swQX%2Fq09zIIxySy%2FsJ2V8CS8NBf8fK0%3D" ||
        token.startsWith("eyJyZWNpcGllbnRfaWQiOiI2ODFlNTllNzM5YzU5N2ZhNDYzZWZmNmMiLCJwbGF5Ym9va19pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiIsInBsYXlib29rX3J1bl9pZCI6IjY4MWU1OThjMzljNTk3ZmE0NjNlZmVlNiJ9.YI966UK4ciZ9swQX/q09zIIxySy/sJ2V8CS8NBf8fK0=")) {
      //console.log("Attempting redirect to:", "https://app.delightloop.ai/public-landing-2/5?token=eyJyZWNpcGllbnRfaWQiOiI2ODNjMzFiMzBhMTZmNjRjNjljMDI3ODMiLCJwbGF5Ym9va19pZCI6IjY4M2MzMWIzMGExNmY2NGM2OWMwMjc4MyIsInBsYXlib29rX3J1bl9pZCI6IjY4M2MzMWIzMGExNmY2NGM2OWMwMjc4MyIsImNhbXBhaWduX2lkIjoiNjgzYzMxYjMwYTE2ZjY0YzY5YzAyNzgzIn0%3D.a05ftLIcdpE2GFWd%2BU%2F2oiZa10%2BFEtEL66AbIFUJ6js%3D");
      console.log("Attempting redirect to:", "https://app.delightloop.ai/public-landing-2/5?token=eyJyZWNpcGllbnRfaWQiOiI2ODNmMDQzZmRhZTc2MjczYjZkNDE3NjciLCJwbGF5Ym9va19pZCI6IjY4M2YwNDNmZGFlNzYyNzNiNmQ0MTc2NyIsInBsYXlib29rX3J1bl9pZCI6IjY4M2YwNDNmZGFlNzYyNzNiNmQ0MTc2NyIsImNhbXBhaWduX2lkIjoiNjgzZjA0M2ZkYWU3NjI3M2I2ZDQxNzY3In0%3D.1bI%2B7eSPHlQt35YYAgm7%2BlMHk%2Bdel9iiS4HNaitfqt8%3D");
      try {
        //window.location.href = "https://app.delightloop.ai/public-landing-2/5?token=eyJyZWNpcGllbnRfaWQiOiI2ODNjMzFiMzBhMTZmNjRjNjljMDI3ODMiLCJwbGF5Ym9va19pZCI6IjY4M2MzMWIzMGExNmY2NGM2OWMwMjc4MyIsInBsYXlib29rX3J1bl9pZCI6IjY4M2MzMWIzMGExNmY2NGM2OWMwMjc4MyIsImNhbXBhaWduX2lkIjoiNjgzYzMxYjMwYTE2ZjY0YzY5YzAyNzgzIn0%3D.a05ftLIcdpE2GFWd%2BU%2F2oiZa10%2BFEtEL66AbIFUJ6js%3D";
        window.location.href = "https://app.delightloop.ai/public-landing-2/5?token=eyJyZWNpcGllbnRfaWQiOiI2ODNmMDQzZmRhZTc2MjczYjZkNDE3NjciLCJwbGF5Ym9va19pZCI6IjY4M2YwNDNmZGFlNzYyNzNiNmQ0MTc2NyIsInBsYXlib29rX3J1bl9pZCI6IjY4M2YwNDNmZGFlNzYyNzNiNmQ0MTc2NyIsImNhbXBhaWduX2lkIjoiNjgzZjA0M2ZkYWU3NjI3M2I2ZDQxNzY3In0%3D.1bI%2B7eSPHlQt35YYAgm7%2BlMHk%2Bdel9iiS4HNaitfqt8%3D";
        console.log("Redirect initiated");
      } catch (error) {
        console.error("Error during redirect:", error);
      }
      return;
    }
    else {
      console.log("Redirect failed");
      console.log("token:", token);
    }

    // Helper function to find a recipient by ID
    const findRecipientById = (recipients, recipientId) => {
      if (!recipients || !Array.isArray(recipients) || !recipientId) return null;
      return recipients.find(recipient => recipient._id === recipientId);
    };

    const fetchPlaybookData = async () => {
      try {
        console.log("Raw token from URL:", token);

        if (!token) {
          setError("No token provided");
          setLoading(false);
          return;
        }

        // URL decode the token first
        const decodedURIToken = decodeURIComponent(token);
        console.log("URL decoded token:", decodedURIToken);

        // Verify and decode the token
        const decodedToken = verifyTemplateToken(decodedURIToken);
        console.log("Decoded token result:", decodedToken);
        if (decodedToken) {
            console.log("Decoded token:", decodedToken);
          setTokenData(decodedToken);
          console.log("Token data:", tokenData);
        }

        if (!decodedToken) {
          console.error("Token verification failed");
          setError("Invalid token");
          setLoading(false);
          return;
        }

        console.log("Successfully decoded token:", {
          recipient_id: decodedToken.recipient_id,
          playbook_id: decodedToken.playbook_id,
          playbook_run_id: decodedToken.playbook_run_id,
        });

        // Fetch playbook data using the decoded playbook_id
        console.log("Fetching playbook data for ID:", decodedToken.playbook_id);
        const response = await fetch(
          `/api/playbooks/${decodedToken.playbook_id}`
        );
        if (!response.ok) {
          //   console.error("Playbook fetch failed:", await response.text());
          const campaignResponse = await fetch(
            `/api/campaigns/${decodedToken.playbook_id}?public=true`
          );
          if (!campaignResponse.ok) {
            console.error(
              "Campaign fetch failed:",
              await campaignResponse.text()
            );
            throw new Error("Failed to fetch campaign data");
          }
          const campaignData = await campaignResponse.json();
          console.log("Fetched campaign data:", campaignData);

          // Find the recipient that matches the token's recipient_id
          const matchingRecipient = findRecipientById(campaignData.data.recipients, decodedToken.recipient_id);

          // Update recipient acknowledgment if not already acknowledged
          if (matchingRecipient &&
            (matchingRecipient.status !== "Acknowledged" ||
              (!matchingRecipient.acknowledgedAt && !acknowledged))) {
            console.log(
              "Updating acknowledgment for campaign recipient:",
              decodedToken.recipient_id
            );

            const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${decodedToken.recipient_id}/acknowledge`, {
            //const updateResponse = await fetch(`http://localhost:5500/v1/recipients/${decodedToken.recipient_id}/acknowledge`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              }
            });
            // const updateResponse = await fetch(
            //   `/api/recipients/${decodedToken.recipient_id}/acknowledge`,
            //   {
            //     method: "POST",
            //   }
            // );

            if (updateResponse.ok) {
              setAcknowledged(true);
              console.log("Successfully updated acknowledgment for campaign recipient");
            } else {
              console.error("Failed to update acknowledgment for campaign recipient");
            }
          }

          // Map campaign data to playbook state
          // Updated to handle both old and new campaign schema
          setPlaybook({
            template: {
              // Check for both old and new schema paths
              logoLink: campaignData.data.outcomeTemplate?.logoLink || campaignData.data.template?.logoLink,
              videoLink: campaignData.data.outcomeTemplate?.videoLink || campaignData.data.template?.videoLink,
              description: campaignData.data.outcomeTemplate?.description || campaignData.data.template?.description,
            },
            recipient: {
              // Find the recipient that matches the token's recipient_id if possible
              firstName: matchingRecipient?.firstName ||
                campaignData.data.recipients?.[0]?.firstName,
              lastName: matchingRecipient?.lastName ||
                campaignData.data.recipients?.[0]?.lastName,
              email: matchingRecipient?.mailId ||
                matchingRecipient?.email ||
                campaignData.data.recipients?.[0]?.mailId ||
                campaignData.data.recipients?.[0]?.email,
            },
          });
          return;
        }

        // Fetch recipient data using the decoded recipient_id
        console.log(
          "Fetching recipient data for ID:",
          decodedToken.recipient_id
        );
        const recipientResponse = await fetch(
          `/api/recipients/${decodedToken.recipient_id}`
        );
        if (!recipientResponse.ok) {
          console.error(
            "Recipient fetch failed:",
            await recipientResponse.text()
          );
          throw new Error("Failed to fetch recipient data");
        }

        const playbookData = await response.json();
        const recipientData = await recipientResponse.json();

        console.log("Fetched playbook data:", playbookData);
        console.log("Fetched recipient data:", recipientData);

        // Update acknowledgedAt if not already set
        if (
          recipientData?.data &&
          !recipientData.data.acknowledgedAt &&
          !acknowledged
        ) {
          console.log(
            "Updating acknowledgment for recipient:",
            decodedToken.recipient_id
          );
          const updateResponse = await fetch(
            `/api/recipients/${decodedToken.recipient_id}/acknowledge`,
            {
              method: "POST",
            }
          );

          if (updateResponse.ok) {
            setAcknowledged(true);
            console.log("Successfully updated acknowledgment");
          } else {
            console.error("Failed to update acknowledgment");
          }
        }

        setPlaybook({
          ...playbookData.playbook,
          recipient: recipientData.data,
        });
      } catch (err) {
        console.error("Detailed error in fetchPlaybookData:", err);
        if (err instanceof Error) {
          console.error("Error name:", err.name);
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybookData();
  }, [searchParams, acknowledged]);

  // Get recipient's full name
  const getRecipientName = () => {
    console.log("Recipient data:", playbook.recipient);

    if (!playbook.recipient) {
      console.log("No recipient data found");
      return "{{First Name}}";
    }

    // First try to get the name directly if it exists
    if (playbook.recipient.name) {
      return playbook.recipient.name;
    }

    // Then try first name and last name combinations
    const firstName =
      playbook.recipient.firstName || playbook.recipient.first_name;
    const lastName =
      playbook.recipient.lastName || playbook.recipient.last_name;

    console.log("Name components:", { firstName, lastName });

    // if (firstName && lastName) {
    //   return `${firstName} ${lastName}`;
    // }

    if (firstName) {
      return firstName;
    }

    // Fallback to email if name is not available
    const email =
      playbook.recipient.recipient_email || playbook.recipient.email;
    console.log("Fallback email:", email);

    if (email) {
      const [emailName] = email.split("@");
      return emailName
        .split(/[._]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }

    return "{{First Name}}";
  };

  // Transform video URL for embedding
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("watch?v=")
        ? url.split("watch?v=")[1]
        : url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-lg font-medium text-gray-700">
            Loading content...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-r from-[#ECFCFF] to-[#E8C2FF]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Oops!</h1>
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen">
      {/* Row 1: Logo */}
      <div className="w-full flex justify-end pt-6 pb-12 pr-6">
        {playbook.template?.logoLink && (
          <div className="w-[120px] sm:w-[160px] md:w-[200px] lg:w-[280px] h-[24px] sm:h-[32px] md:h-[40px] lg:h-[56px]">
            <Image
              src={playbook.template.logoLink}
              alt="Company Logo"
              width={280}
              height={56}
              className="object-contain w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Row 2: Content and Video */}
      <div className="relative w-full px-4 sm:px-6 md:px-[10%] max-w-[1920px] mx-auto pb-1">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Col 1: Text Content */}
          <div className="w-full md:w-[45%] space-y-3 md:space-y-6 lg:space-y-8 md:pr-4 lg:pr-8 flex-shrink-0">
            <div className="space-y-2 md:space-y-4 lg:space-y-6 relative z-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-bold text-[#101828] leading-tight">
                Hey {getRecipientName()}
              </h1>
              {playbook.template?.description && (
                <>
                  <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-[#101828] font-medium">
                    {playbook.template.description}
                  </p>
                </>
              )}
              {tokenData && (
              <BookingModal
                campaignId={tokenData?.campaign_id}
                recipientId={tokenData?.recipient_id}
                />
              )}
            </div>
          </div>

          {/* Col 2: Video */}
          <div className="w-full md:w-[55%] mt-4 md:mt-0 relative flex-shrink-0 flex flex-col items-end gap-2 md:gap-4">
            {playbook.template?.videoLink ? (
              <>
                <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-[#101828] shadow-lg">
                  <iframe
                    src={getEmbedUrl(playbook.template.videoLink)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </>
            ) : (
              <div className="aspect-video w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-[#101828] flex items-center justify-center shadow-lg">
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <Image
                    src="/svgs/video-placeholder.svg"
                    alt="Video Placeholder"
                    width={48}
                    height={48}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12"
                  />
                  <p className="text-white text-xs sm:text-sm">Loading video player...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Two columns, left empty, right with feedback/questions and footer */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 w-full mt-8">
          {/* Left column: empty, matches text col width */}
          <div className="w-full md:w-[45%] flex-shrink-0"></div>
          {/* Right column: feedback/questions only */}
          <div className="w-full md:w-[55%] flex-shrink-0">
            {/* Feedback Section */}
            <div className="relative h-[180px] sm:h-[200px] w-full">
              {currentQuestionIndex < questions.length ? (
                <div className="absolute w-full rounded-lg pl-0 pt-0">
                  <div className={`question-container ${animationState === 'exit' ? 'question-exit' : animationState === 'enter' ? 'question-enter' : ''}`}>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4">
                      {questions[currentQuestionIndex]}
                    </h3>
                  </div>
                  <div className={`options-container ${animationState === 'exit' ? 'options-exit' : animationState === 'enter' ? 'options-enter' : ''}`}>
                    {currentQuestionIndex === 0 ? (
                      <div className="flex items-center gap-3 sm:gap-4 justify-start">
                        <button
                          onClick={() => handleReaction('like')}
                          disabled={isAnimating}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
                          onClick={() => handleReaction('dislike')}
                          disabled={isAnimating}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
                          className="self-end px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute w-full mt-2 sm:mt-3 rounded-lg pl-0">
                  <div className="question-enter">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-2 sm:mb-4">
                      Thank you for your feedback!
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">We appreciate your responses to our questions.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Footer, full width */}
      <div className="w-full mt-8">
        <FooterMessage />
      </div>

      {/* Define CSS for animations - modified for fade upward transitions */}
      <style jsx global>{`
        @keyframes fadeOutUp {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-20px); opacity: 0; }
        }

        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .question-exit {
          animation: fadeOutUp 0.35s ease-out forwards;
        }

        .question-enter {
          animation: fadeInUp 0.35s ease-out forwards;
        }

        .options-exit {
          animation: fadeOutUp 0.35s ease-out forwards;
          animation-delay: 0.05s;
        }

        .options-enter {
          animation: fadeInUp 0.35s ease-out forwards;
          animation-delay: 0.05s;
        }

        /* Adjust footer for mobile */
        @media (max-width: 768px) {
          .fixed {
            position: relative;
            bottom: auto;
          }
        }
      `}</style>
    </div>
  );
}
