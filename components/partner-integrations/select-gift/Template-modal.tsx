import Calendar from "@/components/Gift-Recommendations/Calendar";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// Function to convert YouTube watch URL to embed URL
const getEmbedUrl = (url: string): string => {
  if (!url) return "";
  // Handle YouTube URLs
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }
  // Handle YouTube short URLs
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/");
  }
  // Handle Vimeo URLs
  if (url.includes("vimeo.com")) {
    return url.replace("vimeo.com", "player.vimeo.com/video");
  }
  // Handle Dailymotion URLs
  if (url.includes("dai.ly/") || url.includes("dailymotion.com/video/")) {
    try {
      // Extract video ID from URL
      let videoId = "";
      if (url.includes("dai.ly/")) {
        videoId = url.split("dai.ly/")[1].split("?")[0].split("#")[0];
      } else if (url.includes("dailymotion.com/video/")) {
        videoId = url
          .split("dailymotion.com/video/")[1]
          .split("_")[0]
          .split("?")[0]
          .split("#")[0];
      }

      if (!videoId) {
        console.error("Could not extract video ID from Dailymotion URL");
        return url; // Return original URL if we can't extract ID
      }

      // Construct embed URL with additional parameters for better compatibility
      return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=0&controls=1&mute=0&loop=0&ui-highlight=0&ui-logo=0&ui-start-screen-info=0`;
    } catch (error) {
      console.error("Error processing Dailymotion URL:", error);
      return url; // Return original URL if there's an error
    }
  }
  // Return original URL if no conversion needed
  return url;
};

// Function to extract video content from URL
const extractVideoContent = async (
  url: string
): Promise<{ embedUrl: string; type: "iframe" | "video" } | null> => {
  try {
    // First try known platforms
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

    // For other URLs, try to extract video content
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const html = await response.text();

      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Try to find video content
      // 1. Check for Open Graph video tags
      const ogVideo =
        doc
          .querySelector('meta[property="og:video"]')
          ?.getAttribute("content") ||
        doc
          .querySelector('meta[property="og:video:url"]')
          ?.getAttribute("content");

      if (ogVideo) {
        return {
          embedUrl: ogVideo,
          type: "iframe",
        };
      }

      // 2. Check for video elements
      const videoElement = doc.querySelector("video");
      if (videoElement) {
        const videoSrc = videoElement.getAttribute("src");
        if (videoSrc) {
          return {
            embedUrl: videoSrc,
            type: "video",
          };
        }
      }

      // 3. Check for iframe elements
      const iframeElement = doc.querySelector("iframe");
      if (iframeElement) {
        const iframeSrc = iframeElement.getAttribute("src");
        if (iframeSrc) {
          return {
            embedUrl: iframeSrc,
            type: "iframe",
          };
        }
      }

      // 4. Check for video source elements
      const sourceElement = doc.querySelector('source[type*="video"]');
      if (sourceElement) {
        const sourceSrc = sourceElement.getAttribute("src");
        if (sourceSrc) {
          return {
            embedUrl: sourceSrc,
            type: "video",
          };
        }
      }

      // If no video content found, return null
      return null;
    } catch (error) {
      console.error("Error extracting video content:", error);
      return null;
    }
  } catch (error) {
    console.error("Error processing URL:", error);
    return null;
  }
};

interface TemplateModalProps {
  selectedTemplate: any;
  setSelectedTemplate: (template: any) => void;
  onTemplateDataChange: (templateData: {
    type: "template1" | "template2" | "template3" | "template4" | "template5";
    description: string;
    date: Date | null;
    videoLink: string;
    logoLink: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl: string;
    buttonText1: string;
    buttonLink1: string;
    buttonText2: string;
    buttonLink2: string;
    buttonName1?: string;
    buttonName2?: string;
  }) => void;
  initialLogoLink?: string;
  initialData?: {
    type: "template1" | "template2" | "template3" | "template4" | "template5";
    description: string;
    date: Date | null;
    videoLink: string;
    logoLink: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl: string;
    buttonText1: string;
    buttonLink1: string;
    buttonText2: string;
    buttonLink2: string;
    buttonName1?: string;
    buttonName2?: string;
  };
  viewOnly?: boolean;
}

export default function TemplateModal({
  selectedTemplate,
  setSelectedTemplate,
  onTemplateDataChange,
  initialLogoLink,
  initialData,
  viewOnly = false,
}: TemplateModalProps) {
  const defaultEditState = {
    description: false,
    date: false,
    link: false,
    link1: false,
    link2: false,
    buttonName1: false,
    buttonName2: false,
  };

  const [edit, setEdit] = useState(defaultEditState);
  const [openLogoLink, setOpenLogoLink] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    initialData?.date || new Date()
  );
  const [urlEntered, setUrlEntered] = useState(initialData?.buttonLink || "");
  const [description, setDescription] = useState(
    initialData?.description ||
      (selectedTemplate.template1
        ? "We've got something special for you—🚀 A power-packed 3-minute explainer video that reveals the ultimate solution to your challenge! 🎯\n\nTrust us, you don't want to miss this. Hit play now! 🎥"
        : selectedTemplate.template2
        ? "We have reserved a seat for you!"
        : selectedTemplate.template3
        ? "We've put together an exclusive report packed with insights to help you stay ahead! 🚀\n\nDownload it now and discover the key takeaways! 👇"
        : selectedTemplate.template4
        ? "Let's take this forward! 🚀\n\nBook a quick chat, and let's unlock new possibilities together. Pick a time that works for you! 👇"
        : selectedTemplate.template5
        ? "We've got something special for you—🚀 A power-packed 3-minute explainer video that reveals the ultimate solution to your challenge! 🎯\n\nTrust us, you don't want to miss this. Hit play now! 🎥"
        : "")
  );
  const [videoLink, setVideoLink] = useState(initialData?.videoLink || "");
  const [logoLink, setLogoLink] = useState(initialData?.logoLink || "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState({
    description:
      initialData?.description ||
      (selectedTemplate.template1
        ? "We've got something special for you—🚀 A power-packed 3-minute explainer video that reveals the ultimate solution to your challenge! 🎯\n\nTrust us, you don't want to miss this. Hit play now! 🎥"
        : selectedTemplate.template2
        ? "We have reserved a seat for you!"
        : selectedTemplate.template3
        ? "We've put together an exclusive report packed with insights to help you stay ahead! 🚀\n\nDownload it now and discover the key takeaways! 👇"
        : selectedTemplate.template4
        ? "Let's take this forward! 🚀\n\nBook a quick chat, and let's unlock new possibilities together. Pick a time that works for you! 👇"
        : selectedTemplate.template5
        ? "We've got something special for you—🚀 A power-packed 3-minute explainer video that reveals the ultimate solution to your challenge! 🎯\n\nTrust us, you don't want to miss this. Hit play now! 🎥"
        : ""),
    date: initialData?.date || new Date(),
    videoLink: initialData?.videoLink || "",
    logoLink: initialData?.logoLink || "",
    buttonLink: initialData?.buttonLink || "",
    buttonLink1: initialData?.buttonLink1 || "",
    buttonLink2: initialData?.buttonLink2 || "",
    buttonName1: initialData?.buttonName1 || "Button 1",
    buttonName2: initialData?.buttonName2 || "Button 2",
    isEdited: !!initialData,
  });
  const [videoError, setVideoError] = useState<string | null>(null);

  const [buttonNames, setButtonNames] = useState({
    button1: initialData?.buttonName1 || "Button 1",
    button2: initialData?.buttonName2 || "Button 2",
  });

  const [buttonLinks, setButtonLinks] = useState({
    link1: initialData?.buttonLink1 || "",
    link2: initialData?.buttonLink2 || "",
  });

  // Function to validate logo URL
  const validateLogoUrl = async (url: string) => {
    try {
      console.log("Validating logo URL:", url);
      setLogoError(null); // Clear any previous errors

      // Check if URL is empty
      if (!url) {
        console.log("Logo URL is empty, using default");
        return true; // Allow empty URL to use default
      }

      // Check if it's a local file path (starts with /)
      if (url.startsWith("/")) {
        console.log("Local file path detected, checking extension");
        // Check file extension for local paths
        const validExtensions = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".svg",
          ".webp",
        ];
        const hasValidExtension = validExtensions.some((ext) =>
          url.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          const errorMsg =
            "Logo must be a valid image file (.png, .jpg, .jpeg, .gif, .svg, .webp)";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }

        // Check if the local file exists
        try {
          const response = await fetch(url);
          if (!response.ok) {
            const errorMsg = "Logo file not found. Please check the file path.";
            setLogoError(errorMsg);
            toast.error(errorMsg);
            return false;
          }
        } catch (error) {
          const errorMsg = "Error checking logo file. Please verify the path.";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }

        return true;
      }

      // For remote URLs, validate format and extension
      try {
        // Validate URL format
        const urlObj = new URL(url);

        // Check if URL is HTTPS
        if (urlObj.protocol !== "https:") {
          const errorMsg = "Logo URL must use HTTPS";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }

        // Check file extension
        const validExtensions = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".svg",
          ".webp",
        ];
        const hasValidExtension = validExtensions.some((ext) =>
          url.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          const errorMsg =
            "Logo URL must end with a valid image extension (.png, .jpg, .jpeg, .gif, .svg, .webp)";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }

        // Check if the remote file exists
        try {
          const response = await fetch(url, {
            method: "HEAD",
            mode: "no-cors", // Add this to handle CORS issues
          });

          // With no-cors mode, we can't check response.ok
          // Instead, we'll try to load the image to verify it exists
          const img = document.createElement("img");
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });

          console.log("Remote URL validation successful");
          return true;
        } catch (error) {
          console.error("Error validating image:", error);
          const errorMsg =
            "Error accessing logo URL. Please verify the URL is correct and the image exists.";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
      } catch (error) {
        console.error("Error parsing URL:", error);
        const errorMsg = "Invalid logo URL format";
        setLogoError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("General validation error:", error);
      const errorMsg = "Invalid logo URL format";
      setLogoError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  // Function to validate video URL
  const validateVideoUrl = async (url: string) => {
    try {
      console.log("Validating video URL:", url);
      setVideoError(null); // Clear any previous errors

      // Check if URL is empty
      if (!url) {
        console.log("Video URL is empty");
        return true; // Allow empty URL
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        const errorMsg = "Invalid video URL format";
        setVideoError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // Try to extract video content
      const videoContent = await extractVideoContent(url);
      if (!videoContent) {
        const errorMsg = "No video content found at the provided URL";
        setVideoError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // If we found video content, try to verify it's accessible
      try {
        const response = await fetch(videoContent.embedUrl, {
          method: "HEAD",
          mode: "no-cors",
        });
        return true;
      } catch (error) {
        console.error("Error validating video URL:", error);
        const errorMsg =
          "Error accessing video content. Please verify the URL is correct.";
        setVideoError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("General validation error:", error);
      const errorMsg = "Invalid video URL format";
      setVideoError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  // Function to handle saving template data
  const handleSaveTemplateData = () => {
    try {
      console.log(logoLink, "logoLink");
      // Validate logo URL if it's being changed
      if (logoLink && logoLink !== savedContent.logoLink) {
        if (!validateLogoUrl(logoLink)) {
          return;
        }
      }

      // Validate video URL if it's being changed
      if (videoLink && videoLink !== savedContent.videoLink) {
        if (!validateVideoUrl(videoLink)) {
          return;
        }
      }

      const templateType = Object.keys(selectedTemplate).find(
        (key) => selectedTemplate[key as keyof typeof selectedTemplate]
      ) as "template1" | "template2" | "template3" | "template4" | "template5";

      // Update saved content for preview
      setSavedContent({
        description: description || "Updated template description",
        date: selectedDate,
        videoLink: videoLink || "",
        logoLink: logoLink || "/partner-integrations/gift.png",
        buttonLink: urlEntered,
        buttonLink1: buttonLinks.link1,
        buttonLink2: buttonLinks.link2,
        buttonName1: buttonNames.button1,
        buttonName2: buttonNames.button2,
        isEdited: true,
      });

      const templateData = {
        type: templateType,
        description: description || "Updated template description",
        date: selectedDate,
        videoLink: videoLink || "",
        logoLink: logoLink || "/partner-integrations/gift.png",
        buttonText: getButtonText(),
        buttonLink: urlEntered,
        mediaUrl: getMediaUrl(templateType),
        buttonText1: buttonNames.button1,
        buttonLink1: buttonLinks.link1,
        buttonText2: buttonNames.button2,
        buttonLink2: buttonLinks.link2,
        buttonName1: buttonNames.button1,
        buttonName2: buttonNames.button2
      };

      onTemplateDataChange(templateData);
      setEdit(defaultEditState);
      toast.success("Template changes saved!");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  // Helper function to get button text based on template
  const getButtonText = () => {
    if (selectedTemplate.template1) return "Watch Video";
    if (selectedTemplate.template2) return "Register For Webinar";
    if (selectedTemplate.template3) return "Download the Report";
    if (selectedTemplate.template4) return "Book a Meeting";
    if (selectedTemplate.template5) return "Watch Video";
    return "Select Gift";
  };

  // Helper function to get media URL based on template type
  const getMediaUrl = (templateType: string) => {
    switch (templateType) {
      case "template2":
        return "/partner-integrations/seat.png";
      case "template3":
        return "/partner-integrations/report.png";
      case "template4":
        return "/partner-integrations/meeting.png";
      case "template5":
        return "/partner-integrations/template5.png";
      default:
        return "/partner-integrations/gift.png";
    }
  };

  // Load existing template data when template is selected
  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        const templateType = Object.keys(selectedTemplate).find(
          (key) => selectedTemplate[key as keyof typeof selectedTemplate]
        );

        if (!templateType) return;

        const response = await fetch(`/api/templates?type=${templateType}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.template) {
          setDescription(data.template.description || "");
          setUrlEntered(data.template.buttonLink || "");
          setVideoLink(data.template.videoLink || "");
          setLogoLink(data.template.logoLink || "");
          setButtonNames({
            button1: data.template.buttonName1 || "Button 1",
            button2: data.template.buttonName2 || "Button 2",
          });
          setButtonLinks({
            link1: data.template.buttonLink1 || "",
            link2: data.template.buttonLink2 || "",
          });
          // Also update saved content for preview
          setSavedContent({
            description: data.template.description || "",
            date: data.template.date
              ? new Date(data.template.date)
              : new Date(),
            videoLink: data.template.videoLink || "",
            logoLink: data.template.logoLink || "",
            buttonLink: data.template.buttonLink || "",
            buttonLink1: data.template.buttonLink1 || "",
            buttonLink2: data.template.buttonLink2 || "",
            buttonName1: data.template.buttonName1 || "Button 1",
            buttonName2: data.template.buttonName2 || "Button 2",
            isEdited: false,
          });
          if (data.template.date) {
            setSelectedDate(new Date(data.template.date));
          }
        }
      } catch (error) {
        console.error("Error loading template data:", error);
      }
    };

    if (Object.values(selectedTemplate).some(Boolean)) {
      loadTemplateData();
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (initialLogoLink) {
      setLogoLink(initialLogoLink || "");
      setSavedContent({
        ...savedContent,
        logoLink: initialLogoLink || "",
      });
    }
  }, [initialLogoLink]);

  // Update the logo save button click handler
  const handleLogoSave = async () => {
    console.log("Logo save button clicked");
    console.log("Current logo URL:", logoLink);

    if (await validateLogoUrl(logoLink)) {
      console.log("Logo URL validated, proceeding with save");
      handleSaveTemplateData();
      setOpenLogoLink(false);
    } else {
      console.log("Logo URL validation failed, not saving");
    }
  };

  // Update the video player component
  const VideoPlayer = ({ url }: { url: string }) => {
    const [videoContent, setVideoContent] = useState<{
      embedUrl: string;
      type: "iframe" | "video";
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
      const loadVideo = async () => {
        try {
          setLoading(true);
          const content = await extractVideoContent(url);
          if (content) {
            setVideoContent(content);
          } else {
            setError("No video content found");
          }
        } catch (error) {
          console.error("Error loading video:", error);
          setError("Error loading video content");
        } finally {
          setLoading(false);
        }
      };

      if (url) {
        loadVideo();
      }
    }, [url]);

    const handleReload = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await extractVideoContent(url);
        if (content) {
          setVideoContent(content);
        } else {
          setError("No video content found");
        }
      } catch (error) {
        console.error("Error reloading video:", error);
        setError("Error reloading video content");
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = () => {
      setVideoContent(null);
      setVideoLink("");
      setSavedContent((prev) => ({
        ...prev,
        videoLink: "",
        isEdited: false,
      }));
      toast.success("Video removed successfully");
    };

    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-4">
          <p>{error}</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      );
    }

    if (!videoContent) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          No video content found
        </div>
      );
    }

    return (
      <div
        className="w-full h-full relative group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
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
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* Controls overlay */}
        {showControls && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleDelete}
              className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              title="Delete video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => {
        setSelectedTemplate({
          template1: false,
          template2: false,
          template3: false,
          template4: false,
          template5: false,
        });
        setEdit(defaultEditState);
        setSelectedDate(new Date());
      }}
      className={`${
        selectedTemplate.template1 ||
        selectedTemplate.template2 ||
        selectedTemplate.template3 ||
        selectedTemplate.template4 ||
        selectedTemplate.template5
          ? "translate-y-0"
          : "translate-y-full"
      } bg-black fixed bg-opacity-40 inset-0 z-[100] duration-300 grid place-items-center overflow-y-auto`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] w-[90%] h-[90%] lg:w-[1300px] lg:h-[800px]   grid lg:grid-cols-2 px-4 lg:px-24 gap-10 "
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedTemplate({
              template1: false,
              template2: false,
              template3: false,
              template4: false,
              template5: false,
            });
            setEdit(defaultEditState);
          }}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18"
              stroke="#444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 6L18 18"
              stroke="#444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* //?------ Text section --------- */}
        <div className="grid  place-items-center ">
          <div className="grid gap-10 mt-10 lg:-mt-10">
            {/* User name */}
            {!selectedTemplate.template5 && (
              <div className="lg:text-[40px] font-semibold">
                Hey {"{{First Name}}"}{" "}
              </div>
            )}

            {selectedTemplate.template2 && (
              <div className="grid gap-10">
                {/* description */}
                <div
                  onClick={() =>
                    !viewOnly && setEdit({ ...defaultEditState, description: true })
                  }
                  className={`flex items-center ${!viewOnly ? 'cursor-pointer' : ''} gap-4 lg:text-[28px] font-semibold ${
                    edit.description ? "hidden" : ""
                  }`}
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      alt="message"
                    />
                  )}
                  {savedContent.isEdited
                    ? savedContent.description.length > 250
                      ? savedContent.description.substring(0, 250) + "..."
                      : savedContent.description
                    : "We have reserved a seat for you!"}
                </div>
                {/* input for Message */}
                {edit.description && !viewOnly && (
                  <div className="">
                    <textarea
                      value={description}
                      placeholder="We have reserved a seat for you!"
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full lg:w-96 border-2 resize-none rounded-lg p-2 ${
                        description.length > 250
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        description.length > 250
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{description.length}/250 characters</span>
                      {description.length > 250 && (
                        <span>Text is too long</span>
                      )}
                    </div>
                    <div className="flex gap-4 justify-end font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        disabled={description.length > 250}
                        className={`text-white px-5 py-1.5 duration-300 rounded-lg ${
                          description.length > 250
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                {/* date and time */}
                <div
                  onClick={() => !viewOnly && setEdit({ ...defaultEditState, date: true })}
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-center gap-4 lg:text-[28px] font-semibold ${
                    edit.date ? "hidden" : ""
                  }`}
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      alt="message"
                    />
                  )}
                  <Image
                    src="/svgs/Calender.svg"
                    width={24}
                    height={24}
                    alt="message"
                  />
                  {savedContent.isEdited
                    ? savedContent.date.toLocaleDateString()
                    : "[Date:Time]"}
                </div>
                {/* input for date and time */}
                {edit.date && !viewOnly && (
                  <div className="grid gap-2">
                    <Calendar
                      selectedDate={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                      }}
                    />
                    <div className="flex gap-4 justify-start font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                {/* Link */}
                <div
                  onClick={() => !viewOnly && setEdit({ ...defaultEditState, link: true })}
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-center gap-4 ${
                    edit.link ? "hidden" : ""
                  }`}
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      alt="message"
                    />
                  )}
                  <button className="flex   hover:opacity-95 lg:text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold lg:px-5 lg:py-2.5 px-3 py-2   rounded-lg">
                    <Image
                      src="/svgs/Shimmer.svg"
                      alt="Shimmer"
                      width={24}
                      height={24}
                    />
                    Register For Webinar
                  </button>
                </div>
                {/* input for link */}
                {edit.link && !viewOnly && (
                  <div className="grid gap-2">
                    <div className="flex h-fit ">
                      <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                        https://
                      </div>
                      <input
                        type="url"
                        onChange={(e) => setUrlEntered(e.target.value)}
                        placeholder="Enter URL"
                        className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium"
                      />
                    </div>
                    <div className="flex gap-4 justify-end font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedTemplate.template1 && (
              <>
                <div
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-start gap-2 sm:gap-4 lg:text-[28px] text-base sm:text-lg font-semibold ${
                    edit.description ? "hidden" : ""
                  }`}
                  onClick={() =>
                    !viewOnly && setEdit({ ...defaultEditState, description: true })
                  }
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      className="mt-1 sm:mt-2 lg:mt-3 w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
                      alt="message"
                    />
                  )}
                  <div className="max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-none">
                    {savedContent.isEdited ? (
                      savedContent.description.length > 250 ? (
                        savedContent.description.substring(0, 250) + "..."
                      ) : (
                        savedContent.description
                      )
                    ) : (
                      <>
                        <span className="font-semibold">
                          We&apos;ve got something special for you—
                        </span>
                        🚀 A power-packed 3-minute explainer video that reveals
                        the ultimate solution to your challenge! 🎯
                        <br />
                        <br />
                        <span className="font-semibold">
                          Trust us, you don&apos;t want to miss this. Hit play
                          now! 🎥
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {edit.description && !viewOnly && (
                  <div className="w-full sm:w-[350px] md:w-[400px] lg:w-96">
                    <textarea
                      value={description}
                      placeholder="Enter your message here"
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full border-2 resize-none rounded-lg p-2 text-sm sm:text-base ${
                        description.length > 250
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        description.length > 250
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{description.length}/250 characters</span>
                      {description.length > 250 && (
                        <span>Text is too long</span>
                      )}
                    </div>
                    <div className="flex gap-2 sm:gap-4 justify-end font-medium mt-2">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-3 sm:px-5 py-1.5 text-sm sm:text-base hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        disabled={description.length > 250}
                        className={`text-white px-3 sm:px-5 py-1.5 text-sm sm:text-base duration-300 rounded-lg ${
                          description.length > 250
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {selectedTemplate.template3 && (
              <>
                <div
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-start gap-4 lg:text-[28px] font-semibold ${
                    edit.description ? "hidden" : ""
                  }`}
                  onClick={() =>
                    !viewOnly && setEdit({ ...defaultEditState, description: true })
                  }
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      className="mt-3"
                      alt="message"
                    />
                  )}

                  <div className="lg:text-[24px] font-semibold lg:mb-6">
                    {savedContent.isEdited ? (
                      savedContent.description.length > 250 ? (
                        savedContent.description.substring(0, 250) + "..."
                      ) : (
                        savedContent.description
                      )
                    ) : (
                      <>
                        We've put together an exclusive report packed with
                        insights to help you stay ahead! 🚀
                        <br />
                        Download it now and discover the key takeaways! 👇
                      </>
                    )}
                  </div>
                </div>

                {edit.description && !viewOnly && (
                  <div className="w-full sm:w-[350px] md:w-[400px] lg:w-96">
                    <textarea
                      value={description}
                      placeholder="Enter your message here"
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full border-2 resize-none rounded-lg p-2 ${
                        description.length > 250
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        description.length > 250
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{description.length}/250 characters</span>
                      {description.length > 250 && (
                        <span>Text is too long</span>
                      )}
                    </div>
                    <div className="flex gap-4 justify-end font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        disabled={description.length > 250}
                        className={`text-white px-5 py-1.5 duration-300 rounded-lg ${
                          description.length > 250
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => !viewOnly && setEdit({ ...defaultEditState, link: true })}
                  className={` flex w-fit hover:opacity-95 lg:text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold lg:px-5 lg:py-2.5 px-3 py-2   rounded-lg ${
                    edit.link ? "hidden" : ""
                  } ${viewOnly ? 'cursor-default' : 'cursor-pointer'}`}
                  disabled={viewOnly}
                >
                  <Image
                    src="/svgs/Shimmer.svg"
                    alt="Shimmer"
                    width={24}
                    height={24}
                  />
                  Download the Report
                </button>

                {edit.link && !viewOnly && (
                  <div className="grid gap-2">
                    <div className="flex h-fit ">
                      <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                        https://
                      </div>
                      <input
                        type="url"
                        onChange={(e) => setUrlEntered(e.target.value)}
                        placeholder="Enter URL"
                        className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium"
                      />
                    </div>
                    <div className="flex gap-4 justify-end font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {selectedTemplate.template4 && (
              <div>
                <div
                  onClick={() =>
                    !viewOnly && setEdit({ ...defaultEditState, description: true })
                  }
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-start gap-4 lg:text-[28px] font-semibold ${
                    edit.description ? "hidden" : ""
                  }`}
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      alt="message"
                    />
                  )}
                  <div>
                    {savedContent.isEdited ? (
                      savedContent.description.length > 250 ? (
                        savedContent.description.substring(0, 250) + "..."
                      ) : (
                        savedContent.description
                      )
                    ) : (
                      <>
                        Let's take this forward! 🚀
                        <br />
                        <br />
                        Book a quick chat, and let's unlock new possibilities
                        together. Pick a time that works for you! 👇
                      </>
                    )}
                  </div>
                </div>
                {edit.description && !viewOnly && (
                  <div className="">
                    <textarea
                      value={description}
                      placeholder="Enter your message here"
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full lg:w-96 border-2 resize-none rounded-lg p-2 ${
                        description.length > 250
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        description.length > 250
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{description.length}/250 characters</span>
                      {description.length > 250 && (
                        <span>Text is too long</span>
                      )}
                    </div>
                    <div className="flex gap-4 justify-end font-medium p-3">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        disabled={description.length > 250}
                        className={`text-white px-5 py-1.5 duration-300 rounded-lg ${
                          description.length > 250
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => !viewOnly && setEdit({ ...defaultEditState, link: true })}
                  className={` flex w-fit hover:opacity-95 lg:text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold lg:px-5 lg:py-2.5 px-3 py-2 mt-4 rounded-lg ${
                    edit.link ? "hidden" : ""
                  } ${viewOnly ? 'cursor-default' : 'cursor-pointer'}`}
                  disabled={viewOnly}
                >
                  <Image
                    src="/svgs/Shimmer.svg"
                    alt="Shimmer"
                    width={24}
                    height={24}
                  />
                  Book a Meeting
                </button>
                {edit.link && !viewOnly && (
                  <div className="grid gap-2">
                    <div className="flex h-fit ">
                      <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                        https://
                      </div>
                      <input
                        type="url"
                        onChange={(e) => setUrlEntered(e.target.value)}
                        placeholder="Enter URL"
                        className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium"
                      />
                    </div>
                    <div className="flex gap-4 justify-end font-medium">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedTemplate.template5 && (
              <div>
                <h1 className="text-4xl font-semibold ml-6 mb-6">
   [ Event Name ]
                </h1>
                <div
                  onClick={() =>
                    !viewOnly && setEdit({ ...defaultEditState, description: true })
                  }
                  className={`flex ${!viewOnly ? 'cursor-pointer' : ''} w-fit items-start gap-4 lg:text-[28px] font-semibold ${
                    edit.description ? "hidden" : ""
                  }`}
                >
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={24}
                      height={24}
                      alt="message"
                    />
                  )}
                  <div>
                    {savedContent.isEdited ? (
                      savedContent.description.length > 250 ? (
                        savedContent.description.substring(0, 250) + "..."
                      ) : (
                        savedContent.description
                      )
                    ) : (
                      <>
                        We&apos;ve got something special for you—🚀 A
                        power-packed 3-minute explainer video that reveals the
                        ultimate solution to your challenge! 🎯
                        <br />
                        <br />
                        Trust us, you don&apos;t want to miss this. Hit play
                        now! 🎥
                      </>
                    )}
                  </div>
                </div>
                {edit.description && !viewOnly && (
                  <div className="">
                    <textarea
                      value={description}
                      placeholder="Enter your message here"
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full lg:w-96 border-2 resize-none rounded-lg p-2 ${
                        description.length > 250
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    <div
                      className={`text-xs mt-1 flex justify-between items-center ${
                        description.length > 250
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{description.length}/250 characters</span>
                      {description.length > 250 && (
                        <span>Text is too long</span>
                      )}
                    </div>
                    <div className="flex gap-4 justify-end font-medium p-3">
                      <button
                        onClick={() => setEdit(defaultEditState)}
                        className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplateData}
                        disabled={description.length > 250}
                        className={`text-white px-5 py-1.5 duration-300 rounded-lg ${
                          description.length > 250
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:opacity-90"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
<div className="flex gap-12 -mb-12 mt-10 ">
                {/* Button 1 */}
                <div className="">
                  <div
                    onClick={() =>
                      !viewOnly && setEdit({ ...defaultEditState, buttonName1: true })
                    }
                    className={`flex ${!viewOnly ? 'cursor-pointer' : ''} items-center gap-2 ${
                      edit.buttonName1 ? "hidden" : ""
                    }`}
                  >
                    {!viewOnly && (
                      <Image
                        src="/svgs/Edit.svg"
                        width={24}
                        height={24}
                        alt="edit"
                      />
                    )}
                    <span className="text-lg font-medium">
                      {buttonNames.button1}
                    </span>
                  </div>
                  {edit.buttonName1 && !viewOnly && (
                    <div className="grid gap-2">
                      <input
                        type="text"
                        value={buttonNames.button1}
                        onChange={(e) =>
                          setButtonNames({
                            ...buttonNames,
                            button1: e.target.value,
                          })
                        }
                        placeholder="Enter button name"
                        className="border border-gray-300 rounded-lg px-4 py-2"
                      />
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setEdit(defaultEditState)}
                          className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplateData}
                          className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      !viewOnly && setEdit({ ...defaultEditState, link1: true })
                    }
                    className={`flex w-fit hover:opacity-95 text-xl duration-300 items-center gap-3 text-primary font-semibold px-5 py-2.5 rounded-full border-primary border mt-2 hover:bg-white ${
                      edit.link1 ? "hidden" : ""
                    } ${viewOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={viewOnly}
                  >
                    {/* <Image
                      src="/svgs/Shimmer.svg"
                      alt="Shimmer"
                      width={24}
                      height={24}
                    /> */}
                    {buttonNames.button1}
                  </button>
                  {edit.link1 && !viewOnly && (
                    <div className="grid gap-2">
                      <div className="flex h-fit">
                        <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                          https://
                        </div>
                        <input
                          type="url"
                          value={buttonLinks.link1}
                          onChange={(e) =>
                            setButtonLinks({
                              ...buttonLinks,
                              link1: e.target.value,
                            })
                          }
                          placeholder="Enter URL"
                          className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setEdit(defaultEditState)}
                          className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplateData}
                          className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Button 2 */}
                <div className="">
                  <div
                    onClick={() =>
                      !viewOnly && setEdit({ ...defaultEditState, buttonName2: true })
                    }
                    className={`flex ${!viewOnly ? 'cursor-pointer' : ''} items-center gap-2 ${
                      edit.buttonName2 ? "hidden" : ""
                    }`}
                  >
                    {!viewOnly && (
                      <Image
                        src="/svgs/Edit.svg"
                        width={24}
                        height={24}
                        alt="edit"
                      />
                    )}
                    <span className="text-lg font-medium">
                      {buttonNames.button2}
                    </span>
                  </div>
                  {edit.buttonName2 && !viewOnly && (
                    <div className="grid gap-2">
                      <input
                        type="text"
                        value={buttonNames.button2}
                        onChange={(e) =>
                          setButtonNames({
                            ...buttonNames,
                            button2: e.target.value,
                          })
                        }
                        placeholder="Enter button name"
                        className="border border-gray-300 rounded-lg px-4 py-2"
                      />
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setEdit(defaultEditState)}
                          className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplateData}
                          className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      !viewOnly && setEdit({ ...defaultEditState, link2: true })
                    }
                    className={`flex w-fit hover:opacity-95 text-xl duration-300 items-center gap-3  text-primary font-semibold px-5 py-2.5 rounded-full border-primary border mt-2 hover:bg-white ${
                      edit.link2 ? "hidden" : ""
                    } ${viewOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={viewOnly}
                  >
                    {/* <Image
                      src="/svgs/Shimmer.svg"
                      alt="Shimmer"
                      width={24}
                      height={24}
                    /> */}
                    {buttonNames.button2}
                  </button>
                  {edit.link2 && !viewOnly && (
                    <div className="grid gap-2">
                      <div className="flex h-fit">
                        <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                          https://
                        </div>
                        <input
                          type="url"
                          value={buttonLinks.link2}
                          onChange={(e) =>
                            setButtonLinks({
                              ...buttonLinks,
                              link2: e.target.value,
                            })
                          }
                          placeholder="Enter URL"
                          className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setEdit(defaultEditState)}
                          className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplateData}
                          className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                </div>
              </div>
            )}
          </div>
        </div>
        {/* //?------ Media section --------- */}
        <div className=" ">
          {/* Comapany Logo */}
          <div className="place-self-end lg:mt-10 lg:mb-20 ">
            <div className="text-center">
              {savedContent.logoLink ? (
                // Show saved logo
                <div className="relative lg:w-[84px] lg:h-[84px]">
                  <Image
                    src={savedContent.logoLink}
                    alt="company logo"
                    width={84}
                    height={84}
                    className={`${!viewOnly ? 'hover:scale-105 cursor-pointer' : ''} duration-300 object-contain`}
                    onClick={() => !viewOnly && setOpenLogoLink(true)}
                    onError={(e: any) => {
                      console.error("Error loading logo:", e);
                      e.target.src = "/img/upload.png";
                      toast.error("Failed to load logo. Using default image.");
                    }}
                  />
                  {!viewOnly && (
                    <Image
                      src="/svgs/Edit.svg"
                      width={16}
                      height={16}
                      alt="edit"
                      className="absolute top-0 right-0 cursor-pointer"
                      onClick={() => setOpenLogoLink(true)}
                    />
                  )}
                </div>
              ) : (
                // Show placeholder
                <Image
                  src="/img/upload.png"
                  alt="upload"
                  onClick={() => !viewOnly && setOpenLogoLink(true)}
                  className={`${!viewOnly ? 'hover:scale-105 cursor-pointer' : ''} duration-300 ${
                    openLogoLink ? "hidden" : ""
                  }`}
                  width={84}
                  height={84}
                />
              )}
              {openLogoLink && !viewOnly && (
                <div className="grid gap-2">
                  <div className="flex h-fit">
                    <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                      https://
                    </div>
                    <input
                      type="url"
                      value={logoLink}
                      onChange={(e) => {
                        setLogoLink(e.target.value);
                        setLogoError(null); // Clear error when user types
                      }}
                      placeholder="Enter logo URL"
                      className={`border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium ${
                        logoError ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                  </div>
                  {logoError && (
                    <div className="text-red-500 text-sm flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {logoError}
                    </div>
                  )}
                  <div className="flex gap-4 justify-end font-medium">
                    <button
                      onClick={() => {
                        setOpenLogoLink(false);
                        setLogoLink(savedContent.logoLink);
                        setLogoError(null); // Clear error on cancel
                      }}
                      className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogoSave}
                      className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Media */}
          <div className="grid w-fit gap-4">
            {!selectedTemplate.template1 && !selectedTemplate.template5 && (
              <Image
                src={`/partner-integrations/${
                  selectedTemplate.template2
                    ? "seat.png"
                    : selectedTemplate.template3
                    ? "report.png"
                    : selectedTemplate.template4
                    ? "meeting.png"
                    : "seat.png"
                }`}
                width={521}
                height={321}
                alt="media"
              />
            )}
            {(selectedTemplate.template1 ||
              selectedTemplate.template5) && (
                <div className={`relative lg:h-[321px] lg:w-[521px] ${!viewOnly ? 'hover:scale-105' : ''} duration-300`}>
                  {savedContent.isEdited && savedContent.videoLink ? (
                    // Video player when link is provided
                    <div className="w-full h-full rounded-lg overflow-hidden">
                      <VideoPlayer url={savedContent.videoLink} />
                    </div>
                  ) : (
                    // Placeholder image and edit functionality
                    <>
                      <Image
                        src="/partner-integrations/upload-video.png"
                        alt="upload"
                        onClick={() =>
                          !viewOnly && setEdit({ ...defaultEditState, link: true })
                        }
                        className={`${
                          edit.link ? "hidden" : ""
                        } w-full h-full object-cover rounded-lg ${!viewOnly ? 'cursor-pointer' : ''}`}
                        width={521}
                        height={321}
                      />
                      {edit.link && !viewOnly && (
                        <div className="grid gap-2">
                          <div className="flex h-fit">
                            <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0">
                              https://
                            </div>
                            <input
                              type="url"
                              value={videoLink}
                              onChange={(e) => setVideoLink(e.target.value)}
                              placeholder="Enter video URL (YouTube, Vimeo, or direct video link)"
                              className="border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-4 py-2.5 text-sm placeholder:text-[#667085] placeholder:font-medium"
                            />
                          </div>
                          <div className="flex gap-4 justify-end font-medium">
                            <button
                              onClick={() => setEdit(defaultEditState)}
                              className="bg-white border border-gray-300 text-gray-500 px-5 py-1.5 hover:bg-gray-100 duration-300 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveTemplateData}
                              className="bg-primary text-white px-5 py-1.5 hover:opacity-90 duration-300 rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            <Image
              src="/partner-integrations/made-with-delightloop.png"
              width={207}
              className="place-self-end"
              height={27}
              alt="media"
            />
          </div>
          {
            selectedTemplate.template5 && (
                <div className="flex gap-12 -mb-12 mt-5 bg-primary text-white px-5 py-2.5 rounded-full font-medium w-fit">

            Send your  Message To the host..
          </div>
       ) }
        </div>
      </div>
    </div>
  );
}
