/**
 * LandingPageDesigner Component
 *
 * A customizable landing page designer that allows users to create and preview
 * personalized landing pages with dynamic content, media, and styling options.
 *
 * @component
 *
 * Usage:
 * ```tsx
 * // Basic usage with default values
 * <LandingPageDesigner />
 *
 * // Usage with preset data
 * <LandingPageDesigner
 *   preset={{
 *     logo: { url: 'https://example.com/logo.png' },
 *     content: {
 *       headline: 'Welcome {{first-name}}!',
 *       description: 'Your custom message here'
 *     },
 *     media: {
 *       type: 'image',
 *       url: 'https://example.com/image.jpg'
 *     },
 *     actionButtons: {
 *       primary: {
 *         text: 'Get Started',
 *         url: '/start'
 *       },
 *       secondary: {
 *         text: 'Learn More',
 *         url: '/about'
 *       }
 *     }
 *   }}
 *   onChange={(config) => console.log('Landing page config:', config)}
 * />
 * ```
 *
 * Features:
 * - Customizable logo upload/URL
 * - Background color with solid/gradient options
 * - Dynamic content with variable placeholders (e.g., {{first-name}})
 * - Media section supporting both images and videos
 * - Configurable primary and secondary action buttons
 * - Live preview with mobile/desktop views
 * - Optional preset data for all fields
 *
 * Available variables for dynamic content:
 * - {{first-name}} - Recipient's first name
 * - {{last-name}} - Recipient's last name
 * - {{company}} - Recipient's company name
 *
 * @param {LandingPageDesignerProps} props - Component props
 */

"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Calendar as CalendarIcon,
  Palette,
  Bold,
  Italic,
  Underline,
  ThumbsUp,
  ThumbsDown,
  X,
  MessageSquare,
  Play,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Calendar from "@/components/Gift-Recommendations/Calendar";
import { toast } from "react-hot-toast";

// Character limits for content fields
const CHARACTER_LIMITS = {
  headline: 120,
  description: 500
} as const;

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

// Default configuration for the landing page
const defaultConfig: LandingPageConfig = {
  logo: {
    type: "url",
    url: "/Logo Final.png",
  },
  background: {
    type: "gradient",
    color: "#FFFFFF",
    gradientFrom: "#ECFCFF",
    gradientTo: "#E8C2FF",
    gradientDirection: "to-r",
  },
  content: {
    headline: "Hello {{first-name}}, You've Got a Special Gift!",
    headlineColor: "#111827",
    description:
      "We're excited to share something special with you, {{first-name}}. Your gift is on its way, and we wanted to create this personalized experience just for you.",
    descriptionColor: "#6B7280",
  },
  media: {
    type: "image",
    imageUrl: "",
    videoUrl: "",
  },
  actionButtons: {
    primary: {
      enabled: true,
      text: "Claim Your Gift",
      color: "#6941C6",
      url: "",
    },
    secondary: {
      enabled: true,
      text: "Learn More",
      color: "#6941C6",
      url: "",
    },
  },
  date: {
    enabled: true,
    value: new Date("2025-06-05"),
    color: "#6941C6",
  },
};

interface LandingPageDesignerProps {
  /**
   * Optional preset configuration for the landing page.
   * Any unspecified fields will use default values.
   */
  preset?: Partial<LandingPageConfig>;

  /**
   * Callback function that is called whenever the configuration changes.
   * @param config - The current landing page configuration
   */
  onChange?: (config: LandingPageConfig) => void;

  /**
   * Optional class name for additional styling
   */
  className?: string;

  /**
   * Campaign ID for file uploads
   */
  campaignId?: string;
}

const LandingPageDesigner: React.FC<LandingPageDesignerProps> = ({
  preset,
  onChange,
  className,
  campaignId,
}) => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [config, setConfig] = useState<LandingPageConfig>(() => {
    if (!preset) return defaultConfig;

    // Merge preset with default config
    return {
      logo: { ...defaultConfig.logo, ...preset.logo },
      background: { ...defaultConfig.background, ...preset.background },
      content: { ...defaultConfig.content, ...preset.content },
      media: { ...defaultConfig.media, ...preset.media },
      actionButtons: {
        primary: {
          ...defaultConfig.actionButtons.primary,
          ...preset.actionButtons?.primary,
        },
        secondary: {
          ...defaultConfig.actionButtons.secondary,
          ...preset.actionButtons?.secondary,
        },
      },
      date: { ...defaultConfig.date, ...preset.date },
    };
  });

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    logo: true,
    background: false,
    content: false,
    media: false,
    actionButtons: false,
  });

  // State for logo URL input and validation
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoError, setLogoError] = useState<string | null>(null);

  // State for media errors
  const [mediaError, setMediaError] = useState<{
    image: string | null;
    video: string | null;
  }>({ image: null, video: null });

  // State for action button validation errors
  const [buttonErrors, setButtonErrors] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({ primary: null, secondary: null });

  // State for content validation errors
  const [contentErrors, setContentErrors] = useState<{
    headline: string | null;
    description: string | null;
  }>({ headline: null, description: null });

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Call onChange whenever config changes
  useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);

  // Initial validation on mount and when config changes
  useEffect(() => {
    // Validate content fields
    const headlineError = validateContentField('headline', config.content.headline);
    const descriptionError = validateContentField('description', config.content.description);
    setContentErrors({
      headline: headlineError,
      description: descriptionError
    });

    // Validate action buttons
    const primaryError = validateActionButton('primary');
    const secondaryError = validateActionButton('secondary');
    setButtonErrors({
      primary: primaryError,
      secondary: secondaryError
    });
  }, [config.content.headline, config.content.description, config.actionButtons.primary, config.actionButtons.secondary]);

  // Initialize logo URL input from config
  useEffect(() => {
    if (config.logo.url) {
      // For local paths, display as-is, for remote URLs remove https:// prefix
      if (config.logo.url.startsWith("/")) {
        setLogoUrlInput(config.logo.url);
      } else {
        const urlWithoutHttps = config.logo.url.startsWith("https://")
          ? config.logo.url.substring(8)
          : config.logo.url;
        setLogoUrlInput(urlWithoutHttps);
      }
    }
  }, [config.logo.url]);

  // Function to validate logo URL with proper error messages
  const validateLogoUrl = async (url: string) => {
    try {
      setLogoError(null);

      if (!url) {
        return true; // Allow empty URL
      }

      // Check if it's a local file path (starts with /)
      if (url.startsWith("/")) {
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
        return true;
      }

      // For remote URLs, validate format and extension
      try {
        // Check if user is trying to enter a remote URL without https://
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
          const errorMsg = "Logo URL must use HTTPS";
          setLogoError(errorMsg);
          toast.error(errorMsg);
          return false;
        }

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

        return true;
      } catch (error) {
        const errorMsg = "Invalid logo URL format";
        setLogoError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = "Invalid logo URL format";
      setLogoError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  const handleConfigChange = (section: keyof LandingPageConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  const updateData = (field: keyof LandingPageConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);

    // Validate content fields after update if it's content section
    if (field === 'content') {
      setTimeout(() => {
        const headlineError = validateContentField('headline', value.headline);
        const descriptionError = validateContentField('description', value.description);
        setContentErrors({
          headline: headlineError,
          description: descriptionError
        });
      }, 0);
    }
  };  const updateButton = (
    buttonNum: 1 | 2,
    field: "enabled" | "text" | "url" | "color",
    value: any
  ) => {
    const buttonKey = buttonNum === 1 ? "primary" : "secondary";
    const newConfig = {
      ...config,
      actionButtons: {
        ...config.actionButtons,
        [buttonKey]: {
          ...config.actionButtons[buttonKey],
          [field]: value,
        },
      },
    };
    setConfig(newConfig);

    // Immediate validation for real-time feedback
    if (field === "url" || field === "text" || field === "enabled") {
      const button = newConfig.actionButtons[buttonKey];
      let error: string | null = null;

      // Only show error if button is enabled and has text
      if (button.enabled && button.text.trim()) {
        if (!button.url.trim()) {
          error = "URL is required when button text is provided";
        } else if (!isValidUrl(button.url)) {
          error = "Please enter a valid URL (must start with http:// or https://)";
        }
      }

      setButtonErrors(prev => ({
        ...prev,
        [buttonKey]: error
      }));
    }
  };

  const updateBackground = (
    field: keyof LandingPageConfig["background"],
    value: any
  ) => {
    const newConfig = {
      ...config,
      background: {
        ...config.background,
        [field]: value,
      },
    };
    setConfig(newConfig);
  };

  const handleLogoUrlChange = (inputValue: string) => {
    setLogoUrlInput(inputValue);
    setLogoError(null);

    // Determine the actual URL based on input
    let actualUrl = "";
    if (inputValue) {
      if (inputValue.startsWith("/")) {
        // Local path - use as-is
        actualUrl = inputValue;
      } else if (inputValue.startsWith("https://")) {
        // Already has https://
        actualUrl = inputValue;
      } else {
        // Remote URL without https://
        actualUrl = `https://${inputValue}`;
      }
    }

    updateData("logo", {
      ...config.logo,
      url: actualUrl,
    });
  };

  const handleLogoUrlSave = async () => {
    const fullUrl = logoUrlInput
      ? logoUrlInput.startsWith("https://")
        ? logoUrlInput
        : `https://${logoUrlInput}`
      : "";

    if (await validateLogoUrl(fullUrl)) {
      updateData("logo", {
        ...config.logo,
        url: fullUrl,
      });
      console.log("Logo URL saved successfully");
    }
  };

  // Logo upload function
  const handleLogoUpload = async (file: File) => {
    if (!campaignId) {
      toast.error("Campaign ID is required for logo upload");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)"
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be less than 5MB");
      return;
    }

    setIsUploadingLogo(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", campaignId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/templates/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        // Update the logo URL in config
        updateData("logo", {
          type: "upload",
          url: data.imageUrl,
        });

        // Update the logo URL input for display
        setLogoUrlInput(data.imageUrl);

        toast.success("Logo uploaded successfully!");
      } else {
        throw new Error(data.error_message || "Upload failed");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload logo";
      setLogoError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Media upload function
  const handleMediaUpload = async (file: File) => {
    if (!campaignId) {
      toast.error("Campaign ID is required for media upload");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please upload a valid image or video file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Media file size must be less than 10MB");
      return;
    }

    setIsUploadingMedia(true);
    setMediaError((prev) => ({ ...prev, [config.media.type]: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", campaignId);

      // Use appropriate upload endpoint based on file type
      const endpoint = isVideo
        ? `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/video`
        : `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/templates/upload`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload media");
      }

      const data = await response.json();

      if (data.success) {
        const mediaUrl = data.videoUrl || data.imageUrl;

        if (mediaUrl) {
          // Update the media URL in config based on type
          if (isVideo) {
            updateData("media", {
              ...config.media,
              type: "video",
              videoUrl: mediaUrl,
            });
          } else {
            updateData("media", {
              ...config.media,
              type: "image",
              imageUrl: mediaUrl,
            });
          }

          toast.success(
            `${isVideo ? "Video" : "Image"} uploaded successfully!`
          );
        } else {
          throw new Error("No media URL returned from server");
        }
      } else {
        throw new Error(data.error_message || "Upload failed");
      }
    } catch (error) {
      console.error("Media upload error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload media";
      setMediaError((prev) => ({ ...prev, [config.media.type]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Handle file input change for logo
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
    // Reset the input
    event.target.value = "";
  };

  // Handle file input change for media
  const handleMediaFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMediaUpload(file);
    }
    // Reset the input
    event.target.value = "";
  };

  const getBackgroundStyle = () => {
    if (config.background.type === "gradient") {
      const direction = config.background.gradientDirection || "to-br";
      return {
        background: `linear-gradient(${
          direction === "to-r"
            ? "to right"
            : direction === "to-br"
            ? "to bottom right"
            : direction === "to-b"
            ? "to bottom"
            : "to bottom left"
        }, ${config.background.gradientFrom || "#7C3AED"}, ${
          config.background.gradientTo || "#A855F7"
        })`,
      };
    }
    return { backgroundColor: config.background.color };
  };

  // Dynamic tags configuration - can be extended based on campaign data
  const getAvailableTags = () => {
    // Base available tags
    const baseTags = [
      { label: "First Name", value: "{{first-name}}" },
      { label: "Last Name", value: "{{last-name}}" },
      { label: "Company", value: "{{company}}" },
      { label: "Gift Name", value: "{{gift-name}}" },
    ];

    // Additional tags could be added based on campaign type, recipient data, etc.
    // For example, if campaignId is available, we could fetch campaign-specific fields

    return baseTags;
  };

  const availableTags = getAvailableTags();

  const insertTag = (field: "headline" | "description", tag: string) => {
    const currentValue = config.content[field];
    // Add a space before the tag if the current value doesn't end with a space
    const separator = currentValue && !currentValue.endsWith(' ') ? ' ' : '';
    const newValue = currentValue + separator + tag;

    // Check character limits
    const limit = CHARACTER_LIMITS[field];
    if (newValue.length > limit) {
      toast.error(`${field === 'headline' ? 'Headline' : 'Description'} cannot exceed ${limit} characters`);
      return;
    }

    updateData("content", {
      ...config.content,
      [field]: newValue,
    });
  };

  // Function to validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false;

    try {
      const urlObject = new URL(url.trim());
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Validate action button: if text is provided, URL must be required and valid
  const validateActionButton = (buttonKey: 'primary' | 'secondary') => {
    const button = config.actionButtons[buttonKey];

    if (button.enabled && button.text.trim()) {
      if (!button.url.trim()) {
        return "URL is required when button text is provided";
      }
      if (!isValidUrl(button.url)) {
        return "Please enter a valid URL (must start with http:// or https://)";
      }
    }

    return null;
  };

  // Validate content field character limits
  const validateContentField = (field: 'headline' | 'description', value: string) => {
    const limit = CHARACTER_LIMITS[field];

    if (value.length > limit) {
      return `${field === 'headline' ? 'Headline' : 'Description'} cannot exceed ${limit} characters (currently ${value.length}/${limit})`;
    }

    return null;
  };

  const renderDynamicText = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      // Dynamic replacement mapping
      const replacements: Record<string, string> = {
        'first-name': '{first-name}',
        'last-name': '{{ last-name }}',
        'company': '{{ company }}',
        'gift-name': '{{ gift-name }}'
      };

      return replacements[field] || match;
    });
  };

  const validateImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith("/")) {
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
        return "Image URL must end with a valid image extension (.png, .jpg, .jpeg, .gif, .svg, .webp)";
      }
      return null;
    }
    if (!url.startsWith("https://")) {
      return "Image URL must use HTTPS";
    }
    const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      return "Image URL must end with a valid image extension (.png, .jpg, .jpeg, .gif, .svg, .webp)";
    }
    return null;
  };

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
      // For other URLs, just try to use as direct video
      return { embedUrl: url, type: "video" };
    } catch {
      return null;
    }
  };

  const validateVideoUrl = async (url: string) => {
    if (!url) return null;
    if (!url.startsWith("https://")) {
      return "Video URL must use HTTPS";
    }
    const content = await extractVideoContent(url);
    if (!content) {
      return "Invalid or unsupported video URL";
    }
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    const runValidation = async () => {
      if (config.media.type === "image") {
        const error = validateImageUrl(config.media.imageUrl);
        if (!cancelled) setMediaError((prev) => ({ ...prev, image: error }));
      } else if (config.media.type === "video") {
        const error = await validateVideoUrl(config.media.videoUrl);
        if (!cancelled) setMediaError((prev) => ({ ...prev, video: error }));
      }
    };
    runValidation();
    return () => {
      cancelled = true;
    };
  }, [config.media.type, config.media.imageUrl, config.media.videoUrl]);

  const VideoPlayer = ({
    url,
    className,
  }: {
    url: string;
    className?: string;
  }) => {
    const [videoContent, setVideoContent] = useState<{
      embedUrl: string;
      type: "iframe" | "video";
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  };

  const renderLandingPageContent = () => {
    const hasMedia = (config.media.type === "image" && config.media.imageUrl && config.media.imageUrl.trim()) ||
                     (config.media.type === "video" && config.media.videoUrl && config.media.videoUrl.trim());

    return (
      <div
        className={`${
          viewMode === "mobile" ? "p-6" : "p-8"
        } space-y-6 min-h-full`}
        style={getBackgroundStyle()}
      >
        <div className={`${
          viewMode === "desktop"
            ? "flex flex-col md:flex-row md:gap-8 lg:gap-12 items-start"
            : "space-y-6"
        }`}>
          {/* Left Side - Text Content */}
          <div className={`${
            viewMode === "desktop"
              ? "w-full md:w-[45%] md:pr-4 lg:pr-8 flex-shrink-0"
              : "w-full"
          } space-y-6`}>
            {/* Logo above headline, top-left aligned with headline */}
            {config.logo.url && config.logo.url.trim() && (
              <div className="mb-4">
                <img
                  src={config.logo.url}
                  alt="Logo"
                  className={`${viewMode === "mobile" ? "h-8" : "h-10"}`}
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

            <div className="space-y-3">
              <h1
                className={`font-bold leading-tight ${
                  viewMode === "mobile" ? "text-xl" : "text-2xl"
                }`}
                style={{ color: config.content.headlineColor }}
              >
                {renderDynamicText(config.content.headline)}
              </h1>
              <p
                className={`leading-relaxed ${
                  viewMode === "mobile" ? "text-sm" : "text-lg"
                }`}
                style={{ color: config.content.descriptionColor }}
              >
                {renderDynamicText(config.content.description)}
              </p>
            </div>

            {/* Date Field */}
            {config.date.enabled && (
              <div
                className={`flex items-center gap-2 font-medium ${
                  viewMode === "mobile" ? "text-sm" : "text-base"
                }`}
                style={{ color: config.date.color }}
              >
                <CalendarIcon
                  className={viewMode === "mobile" ? "w-4 h-4" : "w-5 h-5"}
                />
                {config.date.value
                  ? config.date.value instanceof Date
                    ? config.date.value.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : new Date(config.date.value).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                  : "June 5, 2025"}
              </div>
            )}

            {/* Action buttons below content if no media */}
            {!hasMedia && (
              <div className="w-full">
                <div className={`${
                  viewMode === "desktop"
                    ? "flex flex-col md:flex-row gap-3 justify-start"
                    : "space-y-2"
                }`}>
                  {config.actionButtons.primary.enabled && config.actionButtons.primary.text && isValidUrl(config.actionButtons.primary.url) && (
                    <Button
                      variant="default"
                      className={`${
                        viewMode === "desktop" ? "flex-1 md:flex-none px-6 py-2" : "w-full text-sm"
                      } text-white hover:opacity-90 rounded-lg transition-all duration-200`}
                      style={{
                        backgroundColor: config.actionButtons.primary.color,
                      }}
                    >
                      {config.actionButtons.primary.text}
                    </Button>
                  )}
                  {config.actionButtons.secondary.enabled && config.actionButtons.secondary.text && isValidUrl(config.actionButtons.secondary.url) && (
                    <Button
                      variant="default"
                      className={`${
                        viewMode === "desktop" ? "flex-1 md:flex-none px-6 py-2" : "w-full text-sm"
                      } text-white hover:opacity-90 rounded-lg transition-all duration-200`}
                      style={{
                        backgroundColor: config.actionButtons.secondary.color,
                      }}
                    >
                      {config.actionButtons.secondary.text}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section for Desktop - Left side (when no media is present) */}
            {/* {!hasMedia && (
              <div className="hidden md:block w-full">
                <div className="relative h-[180px] sm:h-[200px] w-full">
                  <div className="absolute w-full rounded-lg pl-0 pt-0">
                    <div className="question-container">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                        Was this experience delightful?
                      </h3>
                    </div>
                    <div className="options-container">
                      <div className="flex items-center gap-3 sm:gap-4 justify-center">
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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
                    </div>
                  </div>
                </div>
              </div>
            )} */}
          </div>

          {/* Right Side - Media and Buttons */}
          {hasMedia && (
            <div className={`${
              viewMode === "desktop"
                ? "w-full md:w-[55%] mt-0 md:mt-20 relative flex-shrink-0"
                : "w-full"
            } flex flex-col gap-4`}>
              <div className={`${
                viewMode === "desktop"
                  ? "aspect-video w-full md:w-[95%] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
                  : "rounded-lg overflow-hidden bg-gray-100"
              }`}>
                {config.media.type === "image" ? (
                  config.media.imageUrl && config.media.imageUrl.trim() && !mediaError.image ? (
                    <img
                      src={config.media.imageUrl}
                      alt="Resource"
                      className={`w-full h-full object-cover ${
                        viewMode === "mobile" ? "" : ""
                      }`}
                      onError={(e) => {
                        // Hide media container if image fails to load
                        const mediaContainer = e.currentTarget.closest('.aspect-video, .rounded-lg');
                        if (mediaContainer) {
                          (mediaContainer as HTMLElement).style.display = 'none';
                        }
                        setMediaError((prev) => ({
                          ...prev,
                          image: "Failed to load image. Please check the URL.",
                        }));
                      }}
                    />
                  ) : null
                ) : (
                  config.media.videoUrl && config.media.videoUrl.trim() && (
                    <VideoPlayer
                      url={config.media.videoUrl}
                      className="w-full h-full"
                    />
                  )
                )}
              </div>

              {/* Action buttons below media on the right */}
              <div className="w-full">
                <div className={`${
                  viewMode === "desktop"
                    ? "flex flex-col md:flex-row gap-3 justify-center"
                    : "space-y-2"
                }`}>
                  {config.actionButtons.primary.enabled && config.actionButtons.primary.text && config.actionButtons.primary.url && (
                    <Button
                      variant="default"
                      className={`${
                        viewMode === "desktop" ? "flex-1 md:flex-none px-6 py-2" : "w-full text-sm"
                      } text-white hover:opacity-90 rounded-lg transition-all duration-200`}
                      style={{
                        backgroundColor: config.actionButtons.primary.color,
                      }}
                    >
                      {config.actionButtons.primary.text}
                    </Button>
                  )}
                  {config.actionButtons.secondary.enabled && config.actionButtons.secondary.text && config.actionButtons.secondary.url && (
                    <Button
                      variant="default"
                      className={`${
                        viewMode === "desktop" ? "flex-1 md:flex-none px-6 py-2" : "w-full text-sm"
                      } text-white hover:opacity-90 rounded-lg transition-all duration-200`}
                      style={{
                        backgroundColor: config.actionButtons.secondary.color,
                      }}
                    >
                      {config.actionButtons.secondary.text}
                    </Button>
                  )}
                </div>
              </div>

              {/* Feedback Section for Desktop - Right side (when media is present) */}
              {/* <div className="hidden md:block w-full">
                <div className="relative h-[180px] sm:h-[200px] w-full">
                  <div className="absolute w-full rounded-lg pl-0 pt-0">
                    <div className="question-container">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-3 sm:mb-4 text-center">
                        Was this experience delightful?
                      </h3>
                    </div>
                    <div className="options-container">
                      <div className="flex items-center gap-3 sm:gap-4 justify-center">
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white/80 text-xs sm:text-sm text-gray-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* Mobile Feedback Section - Always shows */}
        {/* <div className="block md:hidden w-full mt-4">
          <div className="backdrop-blur-sm p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-3 text-center">
              Was this experience delightful?
            </h3>
            <div className="flex items-center gap-3 justify-center">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-xs text-gray-600 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-xs text-gray-600 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
          </div>
        </div> */}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}


      {/* Main Content - Split Layout */}
      <div className="grid lg:grid-cols-6 gap-8">
        {/* Left Panel - Customization Controls */}
        <div className="lg:col-span-2">
          <div className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-medium">
                  Customize Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-4 pb-4">
                {/* Logo Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("logo")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Logo
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        openSections.logo ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openSections.logo && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      {/* Hidden file input for logo upload */}
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        style={{ display: "none" }}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs w-full"
                        onClick={() =>
                          document.getElementById("logo-upload")?.click()
                        }
                        disabled={isUploadingLogo || !campaignId}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <div className="space-y-2">
                        {logoUrlInput.startsWith("/") ? (
                          // Show full input for local paths
                          <input
                            type="text"
                            value={logoUrlInput}
                            onChange={(e) =>
                              handleLogoUrlChange(e.target.value)
                            }
                            onBlur={() => validateLogoUrl(config.logo.url)}
                            placeholder="Enter logo path (e.g., /Logo Final.png)"
                            className={`border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg px-3 py-2.5 text-xs placeholder:text-[#667085] placeholder:font-medium ${
                              logoError
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                          />
                        ) : (
                          // Show HTTPS prefix for remote URLs
                          <div className="flex h-fit">
                            <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0 text-xs">
                              https://
                            </div>
                            <input
                              type="url"
                              value={logoUrlInput}
                              onChange={(e) =>
                                handleLogoUrlChange(e.target.value)
                              }
                              onBlur={() => validateLogoUrl(config.logo.url)}
                              placeholder="Enter logo URL"
                              className={`border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-3 py-2.5 text-xs placeholder:text-[#667085] placeholder:font-medium ${
                                logoError
                                  ? "border-red-500 focus:border-red-500"
                                  : ""
                              }`}
                            />
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          You can use a local path (e.g., /Logo Final.png) or an
                          HTTPS URL
                        </div>
                        {logoError && (
                          <div className="text-red-500 text-xs flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
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
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("background")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Background
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        openSections.background ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openSections.background && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      <Tabs
                        value={config.background.type}
                        onValueChange={(value) =>
                          updateBackground(
                            "type",
                            value as "solid" | "gradient"
                          )
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="solid" className="text-xs px-1">
                            Solid
                          </TabsTrigger>
                          <TabsTrigger
                            value="gradient"
                            className="text-xs px-1"
                          >
                            Gradient
                          </TabsTrigger>
                        </TabsList>

                        <div className="mt-3 space-y-3">
                          {config.background.type === "solid" ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={config.background.color}
                                  onChange={(e) =>
                                    updateBackground("color", e.target.value)
                                  }
                                  className="h-8 w-16 p-1 border rounded"
                                />
                                <Input
                                  type="text"
                                  value={config.background.color}
                                  onChange={(e) =>
                                    updateBackground("color", e.target.value)
                                  }
                                  placeholder="#FFFFFF"
                                  className="flex-1 text-xs"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="text-xs text-gray-600">
                                  From Color
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={
                                      config.background.gradientFrom ||
                                      "#7C3AED"
                                    }
                                    onChange={(e) =>
                                      updateBackground(
                                        "gradientFrom",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-16 p-1 border rounded"
                                  />
                                  <Input
                                    type="text"
                                    value={
                                      config.background.gradientFrom ||
                                      "#7C3AED"
                                    }
                                    onChange={(e) =>
                                      updateBackground(
                                        "gradientFrom",
                                        e.target.value
                                      )
                                    }
                                    placeholder="#7C3AED"
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-xs text-gray-600">
                                  To Color
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={
                                      config.background.gradientTo || "#A855F7"
                                    }
                                    onChange={(e) =>
                                      updateBackground(
                                        "gradientTo",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-16 p-1 border rounded"
                                  />
                                  <Input
                                    type="text"
                                    value={
                                      config.background.gradientTo || "#A855F7"
                                    }
                                    onChange={(e) =>
                                      updateBackground(
                                        "gradientTo",
                                        e.target.value
                                      )
                                    }
                                    placeholder="#A855F7"
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Tabs>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("content")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Content
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        openSections.content ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openSections.content && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      {/* Headline */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium text-gray-700">
                            Headline
                          </div>
                          <div className={`text-xs ${
                            config.content.headline.length > CHARACTER_LIMITS.headline
                              ? 'text-red-500'
                              : 'text-gray-500'
                          }`}>
                            {config.content.headline.length}/{CHARACTER_LIMITS.headline}
                          </div>
                        </div>
                        <Input
                          value={config.content.headline}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Prevent input if it exceeds character limit
                            if (value.length <= CHARACTER_LIMITS.headline) {
                              updateData("content", {
                                ...config.content,
                                headline: value,
                              });
                            }
                          }}
                          className={`text-xs ${
                            contentErrors.headline ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Enter headline..."
                        />
                        {contentErrors.headline && (
                          <div className="text-red-500 text-xs flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {contentErrors.headline}
                          </div>
                        )}

                        {/* Headlines Tags */}
                        <div className="space-y-1 ">
                          <div className="text-xs text-gray-500">
                            Available Tags:
                          </div>
                          <div className="flex flex-wrap gap-1 ">
                            {availableTags.map((tag) => (
                              <button
                                key={tag.value}
                                onClick={() => insertTag("headline", tag.value)}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Headline Color */}
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            Headline Color:
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={config.content.headlineColor}
                              onChange={(e) =>
                                updateData("content", {
                                  ...config.content,
                                  headlineColor: e.target.value,
                                })
                              }
                              className="h-8 w-16 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={config.content.headlineColor}
                              onChange={(e) =>
                                updateData("content", {
                                  ...config.content,
                                  headlineColor: e.target.value,
                                })
                              }
                              placeholder="#111827"
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium text-gray-700">
                            Description
                          </div>
                          <div className={`text-xs ${
                            config.content.description.length > CHARACTER_LIMITS.description
                              ? 'text-red-500'
                              : 'text-gray-500'
                          }`}>
                            {config.content.description.length}/{CHARACTER_LIMITS.description}
                          </div>
                        </div>
                        <Textarea
                          value={config.content.description}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Prevent input if it exceeds character limit
                            if (value.length <= CHARACTER_LIMITS.description) {
                              updateData("content", {
                                ...config.content,
                                description: value,
                              });
                            }
                          }}
                          className={`text-xs min-h-[60px] ${
                            contentErrors.description ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Enter description..."
                        />
                        {contentErrors.description && (
                          <div className="text-red-500 text-xs flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {contentErrors.description}
                          </div>
                        )}

                        {/* Description Tags */}
                        <div className="space-y-1 hidden">
                          <div className="text-xs text-gray-500">
                            Available Tags:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {availableTags.map((tag) => (
                              <button
                                key={tag.value}
                                onClick={() =>
                                  insertTag("description", tag.value)
                                }
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Description Color */}
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            Description Color:
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={config.content.descriptionColor}
                              onChange={(e) =>
                                updateData("content", {
                                  ...config.content,
                                  descriptionColor: e.target.value,
                                })
                              }
                              className="h-8 w-16 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={config.content.descriptionColor}
                              onChange={(e) =>
                                updateData("content", {
                                  ...config.content,
                                  descriptionColor: e.target.value,
                                })
                              }
                              placeholder="#6B7280"
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Event Date */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-700">
                            Event Date
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={config.date.enabled}
                              onChange={(e) =>
                                updateData("date", {
                                  ...config.date,
                                  enabled: e.target.checked,
                                })
                              }
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        {config.date.enabled && (
                          <div className="space-y-2">
                            <Calendar
                              selectedDate={
                                config.date.value
                                  ? config.date.value instanceof Date
                                    ? config.date.value
                                    : new Date(config.date.value)
                                  : new Date("2025-06-05")
                              }
                              onChange={(date) => {
                                updateData("date", {
                                  ...config.date,
                                  value: date,
                                });
                              }}
                            />
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">
                                Date Color:
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={config.date.color}
                                  onChange={(e) =>
                                    updateData("date", {
                                      ...config.date,
                                      color: e.target.value,
                                    })
                                  }
                                  className="h-8 w-16 p-1 border rounded"
                                />
                                <Input
                                  type="text"
                                  value={config.date.color}
                                  onChange={(e) =>
                                    updateData("date", {
                                      ...config.date,
                                      color: e.target.value,
                                    })
                                  }
                                  placeholder="#7C3AED"
                                  className="flex-1 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("media")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Media
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        openSections.media ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openSections.media && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      <Tabs
                        value={config.media.type}
                        onValueChange={(value) =>
                          updateData("media", {
                            ...config.media,
                            type: value as "video" | "image",
                          })
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="image" className="text-xs px-1">
                            <ImageIcon className="w-4 h-4 mr-1" />
                            Image
                          </TabsTrigger>
                          <TabsTrigger value="video" className="text-xs px-1">
                            <Play className="w-4 h-4 mr-1" />
                            Video
                          </TabsTrigger>
                        </TabsList>
                        <div className="mt-3 space-y-2">
                          {/* Hidden file input for media upload */}
                          <input
                            type="file"
                            id="media-upload"
                            accept={
                              config.media.type === "video"
                                ? "video/*"
                                : "image/*"
                            }
                            onChange={handleMediaFileChange}
                            style={{ display: "none" }}
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs w-full"
                            onClick={() =>
                              document.getElementById("media-upload")?.click()
                            }
                            disabled={isUploadingMedia || !campaignId}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploadingMedia
                              ? "Uploading..."
                              : `Upload ${config.media.type}`}
                          </Button>
                          {config.media.type === "image" ? (
                            <div>
                              <div className="flex h-fit">
                                {config.media.imageUrl.startsWith(
                                  "/"
                                ) ? null : (
                                  <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0 text-xs">
                                    https://
                                  </div>
                                )}
                                <input
                                  type="url"
                                  value={config.media.imageUrl}
                                  onChange={(e) => {
                                    let inputValue = e.target.value.trim();
                                    if (!inputValue) {
                                      // If the input is empty, clear the imageUrl
                                      updateData("media", {
                                        ...config.media,
                                        imageUrl: "",
                                      });
                                      setMediaError((prev) => ({
                                        ...prev,
                                        image: null,
                                      }));
                                      return;
                                    }
                                    let fullUrl = inputValue;
                                    if (inputValue.startsWith("/")) {
                                      // local path, use as-is
                                    } else if (
                                      inputValue.startsWith("https://")
                                    ) {
                                      // already has https://, use as-is
                                    } else {
                                      fullUrl = `https://${inputValue}`;
                                    }
                                    updateData("media", {
                                      ...config.media,
                                      imageUrl: fullUrl,
                                    });
                                    setMediaError((prev) => ({
                                      ...prev,
                                      image: null,
                                    }));
                                  }}
                                  placeholder="Enter image URL"
                                  className={`border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg ${
                                    config.media.imageUrl.startsWith("/")
                                      ? ""
                                      : "rounded-l-none"
                                  } px-3 py-2.5 text-xs placeholder:text-[#667085] placeholder:font-medium ${
                                    mediaError.image
                                      ? "border-red-500 focus:border-red-500"
                                      : ""
                                  }`}
                                />
                              </div>
                              {mediaError.image && (
                                <div className="text-red-500 text-xs flex items-center gap-2 mt-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {mediaError.image}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex h-fit">
                                <div className="text-[#667085] py-2.5 px-[14px] bg-white rounded-l-lg border border-[#D0D5DD] w-fit border-r-0 text-xs">
                                  https://
                                </div>
                                <input
                                  type="url"
                                  value={
                                    config.media.videoUrl.startsWith("https://")
                                      ? config.media.videoUrl.substring(8)
                                      : config.media.videoUrl
                                  }
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    const fullUrl = inputValue
                                      ? `https://${inputValue}`
                                      : "";
                                    updateData("media", {
                                      ...config.media,
                                      videoUrl: fullUrl,
                                    });
                                  }}
                                  placeholder="Enter video URL (YouTube, Vimeo, or direct video link)"
                                  className={`border w-full border-[#D0D5DD] focus:outline-none focus:border-primary rounded-lg rounded-l-none px-3 py-2.5 text-xs placeholder:text-[#667085] placeholder:font-medium ${
                                    mediaError.video
                                      ? "border-red-500 focus:border-red-500"
                                      : ""
                                  }`}
                                />
                              </div>
                              {mediaError.video && (
                                <div className="text-red-500 text-xs flex items-center gap-2 mt-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {mediaError.video}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Tabs>
                    </div>
                  )}
                </div>

                {/* Action Buttons Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("actionButtons")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Action Buttons
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        openSections.actionButtons ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openSections.actionButtons && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      {/* Primary Button */}
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-700">
                            Primary Button
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={config.actionButtons.primary.enabled}
                              onChange={(e) =>
                                updateButton(1, "enabled", e.target.checked)
                              }
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        {config.actionButtons.primary.enabled && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Button text"
                              value={config.actionButtons.primary.text}
                              onChange={(e) =>
                                updateButton(1, "text", e.target.value)
                              }
                              className="text-xs"
                            />
                            <Input
                              placeholder="Button URL"
                              value={config.actionButtons.primary.url}
                              onChange={(e) =>
                                updateButton(1, "url", e.target.value)
                              }
                              className={`text-xs ${
                                buttonErrors.primary ? 'border-red-500 focus:border-red-500' : ''
                              }`}
                            />
                            {buttonErrors.primary && (
                              <div className="text-red-500 text-xs flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {buttonErrors.primary}
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">
                                Button Color:
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={config.actionButtons.primary.color}
                                  onChange={(e) =>
                                    updateButton(1, "color", e.target.value)
                                  }
                                  className="h-8 w-16 p-1 border rounded"
                                />
                                <Input
                                  type="text"
                                  value={config.actionButtons.primary.color}
                                  onChange={(e) =>
                                    updateButton(1, "color", e.target.value)
                                  }
                                  placeholder="#7C3AED"
                                  className="flex-1 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Secondary Button */}
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-700">
                            Secondary Button
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={config.actionButtons.secondary.enabled}
                              onChange={(e) =>
                                updateButton(2, "enabled", e.target.checked)
                              }
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        {config.actionButtons.secondary.enabled && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Button text"
                              value={config.actionButtons.secondary.text}
                              onChange={(e) =>
                                updateButton(2, "text", e.target.value)
                              }
                              className="text-xs"
                            />
                            <Input
                              placeholder="Button URL"
                              value={config.actionButtons.secondary.url}
                              onChange={(e) =>
                                updateButton(2, "url", e.target.value)
                              }
                              className={`text-xs ${
                                buttonErrors.secondary ? 'border-red-500 focus:border-red-500' : ''
                              }`}
                            />
                            {buttonErrors.secondary && (
                              <div className="text-red-500 text-xs flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {buttonErrors.secondary}
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">
                                Button Color:
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={config.actionButtons.secondary.color}
                                  onChange={(e) =>
                                    updateButton(2, "color", e.target.value)
                                  }
                                  className="h-8 w-16 p-1 border rounded"
                                />
                                <Input
                                  type="text"
                                  value={config.actionButtons.secondary.color}
                                  onChange={(e) =>
                                    updateButton(2, "color", e.target.value)
                                  }
                                  placeholder="#6B7280"
                                  className="flex-1 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="lg:col-span-4 space-y-4">
          {/* Preview Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Live Preview</div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={viewMode === "mobile" ? "secondary" : "default"}
                size="sm"
                onClick={() => setViewMode("mobile")}
                className="h-8 px-3"
              >
                <Smartphone className="w-4 h-4 mr-1" />
                Mobile
              </Button>
              <Button
                variant={viewMode === "desktop" ? "secondary" : "default"}
                size="sm"
                onClick={() => setViewMode("desktop")}
                className="h-8 px-3"
              >
                <Monitor className="w-4 h-4 mr-1" />
                Desktop
              </Button>
            </div>
          </div>

          {/* Preview Container */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {viewMode === "mobile" ? (
                /* Mobile Preview Frame */
                <div className="flex justify-center p-6">
                  <div className="bg-gray-900 rounded-[2rem] p-2 max-w-sm">
                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                      {renderLandingPageContent()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Preview */
                <div className="bg-white rounded-lg overflow-hidden border">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="bg-white rounded px-3 py-1 text-xs text-gray-600 inline-block">
                        your-landing-page.com
                      </div>
                    </div>
                  </div>
                  <div className="max-w-5xl mx-auto">
                    {renderLandingPageContent()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500">
            {viewMode === "mobile" ? "Mobile" : "Desktop"} Preview - Updates in
            real-time
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Landing Page Preview</p>
          <p>
            Recipients will see this page when they scan the QR code on their
            postcard. Most recipients will view on mobile devices, but the page
            works on all screen sizes.
          </p>
        </div>
      </div>
    </div>
  );
};

export type { LandingPageConfig };
export default LandingPageDesigner;
