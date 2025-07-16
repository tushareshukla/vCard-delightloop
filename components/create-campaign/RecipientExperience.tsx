"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { Info } from "lucide-react";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";
import InfinityLoader from "../common/InfinityLoader";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Portal } from "@/components/Portal";
import QuillEditor from "../QuillEditor";
import Campaign from "@/models/Campaign";
import LandingPageDesigner, {
  LandingPageConfig,
} from "./landing-page-designer";
import { toast } from "react-hot-toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Default budget constant
const DEFAULT_BUDGET = 25;

interface GiftItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  explanation: string;
  category?: string;
}

interface Bundle {
  _id: string;
  bundleName: string;
  imgUrl: string;
  description: string;
  giftsList: Array<{ giftId: string }>;
  isAvailable: boolean;
}

interface Gift {
  _id: string;
  name: string;
  price: number;
  descShort: string;
  category?: string;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl?: string;
  };
  sku?: string;
  rationale?: string;
  confidence_score?: string;
}

interface RecipientExperienceProps {
  data: {
    giftType: string;
    message: string;
    templateId: string;
    hyperPersonalization?: boolean;
    motion?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
  campaignId: string;
  authToken: string;
  userId: string;
  organizationId: string;
  eventId: string;
  maxBudget: number;
}

interface EditableCardPreviewProps {
  customMessage: string;
  setCustomMessage: (message: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
}

// Add interface for errors state
interface FormErrors {
  giftType: string;
  description?: string;
}

/* ------------------------------------------------------------------
   EditableCardPreview Component

   This component replicates the complete postcard design from
   /app/public-QR/page.tsx by drawing a static background using a
   hidden canvas. It renders the striped border, vertical dotted divider,
   postmark infinity (with its wavy dotted line), and the QR code (from
   /img/RealQRcode.png) with its label and dotted line.

   Dynamic overlays for greeting, custom message and logo are rendered
   on top. The custom message and logo areas are inline editable.
--------------------------------------------------------------------- */
const EditableCardPreview: React.FC<EditableCardPreviewProps> = ({
  customMessage,
  setCustomMessage,
  logoUrl,
  setLogoUrl,
}) => {
  // Dynamic overlay states
  // Use a dynamic placeholder for recipient name.
  const recipientName = "{{First Name}}";

  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(customMessage);

  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogo, setTempLogo] = useState(logoUrl);

  // State to hold the background design image from canvas.
  const [templateImage, setTemplateImage] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create the static background design.
  const createTemplate = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use full dimensions to match your original design (1200 x 800).
    canvas.width = 1200;
    canvas.height = 800;

    // White background.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Draw Striped Border ---
    const stripeWidth = 40;
    const borderWidth = 35;
    const darkPurple = "#6941C6";
    const lightPurple = "#E9D7FE";
    const white = "#FFFFFF";

    // Horizontal stripes (top and bottom).
    for (let x = 0; x < canvas.width; x += stripeWidth * 4) {
      // Top stripes.
      ctx.fillStyle = darkPurple;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - borderWidth, borderWidth);
      ctx.lineTo(x - borderWidth, borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth * 2, 0);
      ctx.lineTo(x + stripeWidth * 2 - borderWidth, borderWidth);
      ctx.lineTo(x + stripeWidth - borderWidth, borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lightPurple;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth * 2, 0);
      ctx.lineTo(x + stripeWidth * 3, 0);
      ctx.lineTo(x + stripeWidth * 3 - borderWidth, borderWidth);
      ctx.lineTo(x + stripeWidth * 2 - borderWidth, borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth * 3, 0);
      ctx.lineTo(x + stripeWidth * 4, 0);
      ctx.lineTo(x + stripeWidth * 4 - borderWidth, borderWidth);
      ctx.lineTo(x + stripeWidth * 3 - borderWidth, borderWidth);
      ctx.closePath();
      ctx.fill();

      // Bottom stripes.
      ctx.fillStyle = darkPurple;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + stripeWidth, canvas.height);
      ctx.lineTo(x + stripeWidth - borderWidth, canvas.height - borderWidth);
      ctx.lineTo(x - borderWidth, canvas.height - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth, canvas.height);
      ctx.lineTo(x + stripeWidth * 2, canvas.height);
      ctx.lineTo(
        x + stripeWidth * 2 - borderWidth,
        canvas.height - borderWidth
      );
      ctx.lineTo(x + stripeWidth - borderWidth, canvas.height - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lightPurple;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth * 2, canvas.height);
      ctx.lineTo(x + stripeWidth * 3, canvas.height);
      ctx.lineTo(
        x + stripeWidth * 3 - borderWidth,
        canvas.height - borderWidth
      );
      ctx.lineTo(
        x + stripeWidth * 2 - borderWidth,
        canvas.height - borderWidth
      );
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth * 3, canvas.height);
      ctx.lineTo(x + stripeWidth * 4, canvas.height);
      ctx.lineTo(canvas.width - borderWidth, canvas.height - borderWidth);
      ctx.lineTo(canvas.width - borderWidth, canvas.height - borderWidth);
      ctx.closePath();
      ctx.fill();
    }

    // Vertical stripes (left and right).
    for (let y = 0; y < canvas.height; y += stripeWidth * 4) {
      // Left stripes.
      ctx.fillStyle = darkPurple;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(0, y + stripeWidth);
      ctx.lineTo(borderWidth, y + stripeWidth - borderWidth);
      ctx.lineTo(borderWidth, y - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(0, y + stripeWidth);
      ctx.lineTo(0, y + stripeWidth * 2);
      ctx.lineTo(borderWidth, y + stripeWidth * 2 - borderWidth);
      ctx.lineTo(borderWidth, y + stripeWidth - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lightPurple;
      ctx.beginPath();
      ctx.moveTo(0, y + stripeWidth * 2);
      ctx.lineTo(0, y + stripeWidth * 3);
      ctx.lineTo(borderWidth, y + stripeWidth * 3 - borderWidth);
      ctx.lineTo(borderWidth, y + stripeWidth * 2 - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(0, y + stripeWidth * 3);
      ctx.lineTo(0, y + stripeWidth * 4);
      ctx.lineTo(borderWidth, y + stripeWidth * 4 - borderWidth);
      ctx.lineTo(borderWidth, y + stripeWidth * 3 - borderWidth);
      ctx.closePath();
      ctx.fill();

      // Right stripes.
      ctx.fillStyle = darkPurple;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y);
      ctx.lineTo(canvas.width, y + stripeWidth);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth - borderWidth);
      ctx.lineTo(canvas.width - borderWidth, y - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y + stripeWidth);
      ctx.lineTo(canvas.width, y + stripeWidth * 2);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth * 2 - borderWidth);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lightPurple;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y + stripeWidth * 2);
      ctx.lineTo(canvas.width, y + stripeWidth * 3);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth * 3 - borderWidth);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth * 2 - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y + stripeWidth * 3);
      ctx.lineTo(canvas.width, y + stripeWidth * 4);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth * 4 - borderWidth);
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth * 3 - borderWidth);
      ctx.closePath();
      ctx.fill();
    }

    // --- Draw Vertical Dotted Divider ---
    const contentPadding = 80;
    const contentY = contentPadding + 40;
    ctx.strokeStyle = "#D0D5DD";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.65, contentY);
    ctx.lineTo(canvas.width * 0.65, canvas.height - contentY);
    ctx.stroke();

    // --- Draw Postmark Infinity Symbol ---
    const drawPostmarkInfinity = (x: number, y: number) => {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 70, 0, Math.PI * 2);
        ctx.fillStyle = "#F9F5FF";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 65, 0, Math.PI * 2);
        ctx.strokeStyle = "#6941C6";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#6941C6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const waveHeight = 10;
        const waveSpacing = 20;
        for (let i = 0; i < 5; i++) {
          const yPos = y - 40 + i * waveSpacing;
          ctx.beginPath();
          ctx.moveTo(x - 150, yPos);
          ctx.bezierCurveTo(
            x - 120,
            yPos - waveHeight,
            x - 90,
            yPos + waveHeight,
            x - 60,
            yPos
          );
          ctx.bezierCurveTo(
            x - 30,
            yPos - waveHeight,
            x - 15,
            yPos + waveHeight,
            x,
            yPos
          );
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.font = `bold 60px ${poppins.style.fontFamily}`;
        ctx.fillStyle = "#6941C6";
        ctx.fillText("∞", x - 25, y + 20);
        ctx.restore();
      } catch (err) {
        console.error("Error drawing postmark infinity:", err);
      }
    };
    drawPostmarkInfinity(canvas.width * 0.85, contentY + 90);

    // --- Draw QR Code with Label and Dotted Line ---
    try {
      const qrImage = new window.Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = "/img/RealQRcode.png";
      await new Promise<void>((resolve) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => resolve();
      });
      const qrSize = 220;
      const qrX = canvas.width * 0.72;
      const qrY = canvas.height * 0.5 + 30;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      ctx.font = `18px ${poppins.style.fontFamily}`;
      ctx.fillStyle = "#000";
      const labelText = "Scan for a Special Message";
      const labelWidth = ctx.measureText(labelText).width;
      const labelX = qrX + (qrSize - labelWidth) / 2;
      ctx.fillText(labelText, labelX, qrY - 30);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(qrX, qrY - 15);
      ctx.lineTo(qrX + qrSize, qrY - 15);
      ctx.stroke();
      ctx.setLineDash([]);
    } catch (qrErr) {
      console.error("Error drawing QR code:", qrErr);
    }

    // Finally, set the generated image as the background.
    setTemplateImage(canvas.toDataURL("image/png"));
  };

  useEffect(() => {
    createTemplate();
  }, []);

  // Render the preview container (scaled down to 600x400)
  return (
    <div
      style={{
        position: "relative",
        width: "600px",
        height: "400px",
        backgroundImage: `url(${templateImage})`,
        backgroundSize: "cover",
        borderRadius: "0px",
        overflow: "hidden",
      }}
      className="mx-auto"
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Overlay: Greeting text */}
      <div
        style={{
          position: "absolute",
          top: "65px",
          left: "50px",
          fontSize: "18px",
          color: "#000",
          fontWeight: "bold",
        }}
      >
        Hi {recipientName},
      </div>

      {/* Overlay: Editable Custom Message */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "30px",
          width: "300px",
          fontSize: "16px",
          color: "#000",
          lineHeight: "1.2",
          cursor: "pointer",
        }}
      >
        {isEditingMessage ? (
          <div>
            <textarea
              value={tempMessage}
              onChange={(e) => {
                if (e.target.value.length <= 200)
                  setTempMessage(e.target.value);
              }}
              className="w-full p-1 border border-gray-300 rounded"
              rows={3}
              placeholder="Type your message..."
              autoFocus
            />
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>{tempMessage.length}/200 characters</span>
              <div>
                <button
                  onClick={() => {
                    setTempMessage(customMessage);
                    setIsEditingMessage(false);
                  }}
                  className="mr-2 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCustomMessage(tempMessage);
                    setIsEditingMessage(false);
                  }}
                  className="text-primary font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingMessage(true)}
            className="flex items-center gap-1"
            title="Click to edit message"
          >
            <img src="/svgs/Edit.svg" alt="edit" width={16} height={16} />
            <span>{customMessage}</span>
          </div>
        )}
      </div>

      {/* Overlay: Editable Logo */}
      <div
        style={{
          position: "absolute",
          left: "50px",
          bottom: "50px",
        }}
      >
        {isEditingLogo ? (
          <div className="bg-white p-1 rounded shadow">
            <input
              type="url"
              value={tempLogo}
              onChange={(e) => setTempLogo(e.target.value)}
              className="w-200px border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter logo URL"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs mt-1">
              <button
                onClick={() => {
                  setTempLogo(logoUrl);
                  setIsEditingLogo(false);
                }}
                className="text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogoUrl(tempLogo);
                  setIsEditingLogo(false);
                }}
                className="text-primary font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: "100px", height: "50px", objectFit: "contain" }}
            />
            <div
              onClick={() => setIsEditingLogo(true)}
              style={{
                marginLeft: "8px",
                background: "rgba(255,255,255,0.8)",
                borderRadius: "50%",
                padding: "2px",
                cursor: "pointer",
              }}
              title="Edit logo"
            >
              <img
                src="/svgs/Edit.svg"
                alt="edit logo"
                width={16}
                height={16}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   RecipientExperience Component
   -------------------------------
   This component retains the original logic for selecting a gift,
   browsing the catalog (in a single-row grid of 4 cards),
   and choosing a landing page template. The "Craft Your Message" step
   now renders our EditableCardPreview.
------------------------------------------------------------------ */
const RecipientExperience: React.FC<RecipientExperienceProps> = ({
  data,
  onNext,
  onBack,
  campaignId,
  authToken,
  userId,
  organizationId,
  eventId,
  maxBudget = 0,
}) => {
  // Ensure maxBudget is a number
  const numericMaxBudget = Number(maxBudget);

  const [formData, setFormData] = useState({
    giftType: data.giftType || "",
    message: data.message || "",
    templateId: data.templateId || "",
    hyperPersonalization: data.hyperPersonalization || false,
    motion: data.motion,
  });

  // Add budget state for Smart Match
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [errors, setErrors] = useState<FormErrors>({ giftType: "" });
  const messageRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bundleFilter, setBundleFilter] = useState("all");
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [isLoadingBundles, setIsLoadingBundles] = useState(false);
  const [gifts, setGifts] = useState<Map<string, Gift>>(new Map());
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [allGiftsUnfiltered, setAllGiftsUnfiltered] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [recommendedGifts, setRecommendedGifts] = useState<Gift[]>([]);

  // Carousel states (used in gift catalog)
  const [activeRow, setActiveRow] = useState(0);
  const [carouselPosition, setCarouselPosition] = useState([0, 0]);
  const [itemsPerRow, setItemsPerRow] = useState(4);

  // --- Add state for showing TemplateModal ---
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Add these states at the top with other states
  const [customMessage, setCustomMessage] = useState(
    "We have reserved a seat for you!"
  );
  const [logoUrl, setLogoUrl] = useState("/Logo Final.png");

  // Add this with your other state variables
  const [emailTemplate, setEmailTemplate] = useState(
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg" alt="DelightLoop Logo" width="150" height="40" style="display: block; width: 150px; height: 40px; margin-bottom: 20px;">
                <p style="font-size: 18px; color: #333;">Hi {{First Name}},</p>
                <p style="font-size: 16px; color: #555;">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you please confirm your preferred delivery address?</p>

                <p><a href="{{Verification URL}}" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Confirm Your Address Here</a></p>

                <p style="font-size: 16px; color: #555;">Rest assured, your information will be kept confidential and used solely for this delivery.</p>
                <p style="font-size: 16px; color: #555;">Looking forward to delighting you!</p>


                <p style="font-size: 16px; color: #555; margin-top: 20px;">Best wishes,<br>The Delightloop Team</p>

                <p style="font-size: 14px; color: #888;">Curious how personalized gifting can transform your business relationships?<br>
                DelightLoop helps teams create meaningful connections that drive measurable results</p>
                <p style="margin-top: 10px;"><a href="https://www.delightloop.com/bookademo" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Transform Your Outreach Today →</a></p>

                <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Delightloop</p>
            </div>`
  );

  // Add this state at the top with other state variables
  const [giftsFetched, setGiftsFetched] = useState(false);

  // Add these new state variables at the top with other states
  const [templateDataMap, setTemplateDataMap] = useState<Record<string, any>>({
    template1: {
      description: "",
      videoLink: "",
      logoLink: "",
      buttonLink: "",
    },
    template2: {
      description: "",
      date: new Date(),
      logoLink: "",
      buttonLink: "",
    },
    template3: {
      description: "",
      logoLink: "",
      buttonLink: "",
    },
    template4: {
      description: "",
      logoLink: "",
      buttonLink: "",
    },
  });

  // Add state for landing page designer with default config
  const [landingPageConfig, setLandingPageConfig] =
    useState<LandingPageConfig | null>({
      logo: {
        type: "url",
        url: "/Logo Final.png",
      },
      background: {
        type: "gradient",
        color: "#FFFFFF",
        gradientFrom: "#ECFCFF",
        gradientTo: "#E8C2FF",
        gradientDirection: "to-br",
      },
      content: {
        headline: "Hello {{first-name}}, You've Got a Special Gift!",
        headlineColor: "#111827",
        description:
          "We're excited to share something special with you, {{first-name}}. Your gift is on its way!",
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
          enabled: false,
          text: "",
          color: "#6941C6",
          url: "",
        },
      },
      date: {
        enabled: false,
        value: undefined,
        color: "#8B5CF6",
      },
    });

  // Add this function to handle localStorage
  const getStorageKey = () => `campaign_gifts_${campaignId}`;

  // Load initial data
  useEffect(() => {
    if (!eventId || !authToken) {
      return;
    }
  }, [eventId]);

  const [allRecipientsHaveLinkedin, setAllRecipientsHaveLinkedin] =
    useState(false);
  const fetchCampaignRecipients = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/campaigns/${campaignId}/recipients`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          method: "GET",
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Check if all recipients have linkedinUrl
        const allHaveLinkedinUrl = data.data.every(
          (recipient) =>
            recipient.linkedinUrl && recipient.linkedinUrl.trim() !== ""
        );

        // You can store this result in state if needed
        setAllRecipientsHaveLinkedin(allHaveLinkedinUrl);

        return allHaveLinkedinUrl;
      }

      return false;
    } catch (error) {
      console.error("Error fetching campaign recipients:", error);
      return false;
    }
  };
  const [allCampaignData, setAllCampaignData] = useState<any>(null);
  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response?.ok) {
          const campaignData = await response.json();

          const campaign = campaignData.campaign;
          console.log("campaign", campaign);

          setAllCampaignData(campaign);

          // Set price range based on campaign budget or default
          const budgetMax =
            campaign.budget?.maxPerGift || numericMaxBudget || DEFAULT_BUDGET;
          setPriceRange([0, budgetMax]);

          // Set budget state for Smart Match
          if (campaign.budget?.maxPerGift) {
            setBudget(campaign.budget.maxPerGift);
          }

          // Set the gift selection mode
          if (campaign.giftSelectionMode) {
            setGiftSelectionMode(campaign.giftSelectionMode);
          }

          // Set form data
          setFormData((prev) => ({
            ...prev,
            giftType: campaign.giftCatalogs[0]?.selectedGift
              ? "manual_gift"
              : "",
            hyperPersonalization:
              campaign.giftSelectionMode === "hyper_personalize",
            motion: campaign.motion || prev.motion,
            templateId: campaign.outcomeTemplate?.type || prev.templateId,
          }));

          // Set outcome card data
          if (campaign.outcomeCard) {
            setCustomMessage(campaign.outcomeCard.message || "");
            setLogoUrl(campaign.outcomeCard.logoLink || "");
          }

          // Set template data
          if (campaign.outcomeTemplate) {
            const template = campaign.outcomeTemplate;
            setTemplateData({
              type: template.type || "",
              description: template.description || "",
              date: template.date ? new Date(template.date) : null,
              videoLink: template.videoLink || "",
              logoLink: template.logoLink || "",
              buttonText: template.buttonText || "Select Gift",
              buttonLink: template.buttonLink || "",
              mediaUrl: template.mediaUrl || "/partner-integrations/gift.png",
              buttonText1: template.buttonText1 || "Venue Map",
              buttonLink1:
                template.buttonLink1 ||
                "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620504/Twinkle_Function_Map_wdiowx.pdf",
              buttonText2:
                template.buttonText2 || "Upload your pictures for the couple",
              buttonLink2:
                template.buttonLink2 ||
                "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620503/20250517_144033_abplvy.jpg",
            });

            // Set selected template outline
            setSelectedTemplateOutline((prev) => ({
              ...prev,
              [template.type]: true,
            }));

            // Set template data map
            setTemplateDataMap((prev) => ({
              ...prev,
              [template.type]: {
                description: template.description || "",
                videoLink: template.videoLink || "",
                logoLink: template.logoLink || "",
                buttonLink: template.buttonLink || "",
                date: template.date ? new Date(template.date) : null,
              },
            }));

            setInitialLogoLinkForTemplateModal(template.logoLink || logoUrl);
          }

          // Handle landing page config - prioritize existing config over defaults
          if (campaign.landingPageConfig) {
            setLandingPageConfig(campaign.landingPageConfig);
            setFormData((prev) => ({
              ...prev,
              templateId: campaign.landingPageConfig.type || prev.templateId,
            }));
          }

          // Handle email templates
          if (campaign.emailTemplate) {
            if (campaign.emailTemplate.addressConfirmedEmail) {
              setShowAddressConfirmation(true);
              setEmailTemplate(campaign.emailTemplate.addressConfirmedEmail);
            }
            if (campaign.emailTemplate.inTransitEmail) {
              setShowInTransit(true);
              setInTransitEmailTemplate(campaign.emailTemplate.inTransitEmail);
            }
          }

          // Handle gift catalogs and bundle selection
          if (campaign.giftCatalogs && campaign.giftCatalogs.length > 0) {
            const catalog = campaign.giftCatalogs[0];

            // Fetch bundles first
            await fetchBundles();

            // Set selected bundle and fetch its gifts
            if (catalog.catalogId) {
              setSelectedBundle(catalog.catalogId);
              const fetchedGifts = await fetchGiftsForSelectedBundle(
                catalog.catalogId
              );

              // Handle single gift selection
              if (
                catalog.selectedGift &&
                !Array.isArray(catalog.selectedGift)
              ) {
                const selectedGift = fetchedGifts.find(
                  (g) => g._id === catalog.selectedGift
                );
                if (selectedGift) {
                  setSelectedGift(selectedGift);
                  setFormData((prev) => ({
                    ...prev,
                    giftType: selectedGift._id,
                  }));
                }
              }
              // Handle multiple gift selection
              else if (Array.isArray(catalog.selectedGift)) {
                const selectedGifts = fetchedGifts.filter((g) =>
                  catalog.selectedGift.includes(g._id)
                );
                setSelectedGifts(selectedGifts);
              }

              // Show catalog if gifts are selected
              if (catalog.selectedGift) {
                setShowCatalog(true);
              }
            }
          }
        } else {
          console.error("Failed to fetch campaign data");
        }
      } catch (error) {
        console.error("Error loading campaign data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignData();
    fetchCampaignRecipients();
  }, [campaignId, organizationId, authToken, numericMaxBudget]);

  // Remove the initial page load useEffect that was calling fetchEventGiftRecommendations
  // Keep only the error handling useEffect
  useEffect(() => {}, []);

  useEffect(() => {
    if (organizationId && authToken) {
      fetchBundles();
    }
  }, [organizationId, authToken]);

  const fetchGiftDetails = async (giftId: string) => {
    if (!giftId) return null;
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      if (response.ok) {
        const giftData = await response.json();
        setGifts((prev) => {
          const newMap = new Map(prev);
          newMap.set(giftId, giftData);
          return newMap;
        });
        return giftData;
      }
    } catch (error) {
      console.error(`Error fetching gift ${giftId}:`, error);
    }
    return null;
  };

  // Modified useEffect for gift sorting
  useEffect(() => {
    if (gifts.size > 0) {
      const giftArray = Array.from(gifts.values());
      // Sort gifts by price in descending order
      const sortedGifts = giftArray.sort((a, b) => b.price - a.price);
      console.log(
        "🔄 Sorting gifts in useEffect:",
        sortedGifts.slice(0, 3).map((g) => `${g.name} ($${g.price})`)
      );
      setAllGifts(sortedGifts);
      setAllGiftsUnfiltered(sortedGifts); // Also update unfiltered gifts to maintain sort order
      if (selectedGift) {
        const updatedGift = gifts.get(selectedGift._id);
        if (updatedGift) {
          setSelectedGift(updatedGift);
        }
      }
    }
  }, [gifts]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerRow(1);
      } else if (window.innerWidth < 768) {
        setItemsPerRow(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerRow(3);
      } else {
        setItemsPerRow(4);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to clean up selectedGifts - remove gifts that shouldn't be selected
  const cleanupSelectedGifts = () => {
    if (formData.giftType === "multi_gift") {
      setSelectedGifts((prev) => {
        // Only keep gifts that are currently in recommendedGifts and should be selected
        return prev.filter((selectedGift) => {
          // Check if this gift is in recommendations and should be checked
          const inRecommendations = recommendedGifts.some(
            (g) => g._id === selectedGift._id
          );
          return inRecommendations;
        });
      });
    }
  };

  // --- Update handleGiftSelection to close catalog ---
  const handleGiftSelection = (gift: Gift) => {
    // Only update gift selection, don't change gift type
    if (formData.giftType === "multi_gift") {
      setSelectedGifts((prev) => {
        const isSelected = prev.some((g) => g._id === gift._id);
        if (isSelected) {
          // Remove gift if it was selected - also remove from recommendations
          setRecommendedGifts((recPrev) =>
            recPrev.filter((g) => g._id !== gift._id)
          );
          return prev.filter((g) => g._id !== gift._id);
        } else {
          // Add gift if it wasn't selected - move to front of recommendations
          setRecommendedGifts((recPrev) => {
            const filtered = recPrev.filter((g) => g._id !== gift._id);
            return [gift, ...filtered];
          });
          return [...prev, gift];
        }
      });
      // Clear error if exists
      if (errors.giftType) {
        setErrors((prev) => ({ ...prev, giftType: "" }));
      }
    } else {
      // For single gift mode, update recommendations order - move selected gift to front
      setRecommendedGifts((prev) => {
        const filtered = prev.filter((g) => g._id !== gift._id);
        return [gift, ...filtered];
      });

      setSelectedGift(gift);
      // Clear error if exists
      if (errors.giftType) {
        setErrors((prev) => ({ ...prev, giftType: "" }));
      }
      // Scroll to message section
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      setShowCatalog(false);
    }

    // Update form data without changing gift type
    setFormData((prev) => ({
      ...prev,
      selectedGiftId: gift._id,
    }));
  };

  const handleTemplateSelection = (templateId: string) => {
    setFormData({ ...formData, templateId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "message" && value.length > 0 && !formData.message) {
      setTimeout(() => {
        templateRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 1000);
    }
  };

  const validateForm = () => {
    const newErrors = {
      giftType: formData.giftType ? "" : "Please select a gift type",
    };

    // Only require gift selection if hyper-personalization is false
    if (!formData.hyperPersonalization && !formData.giftType) {
      newErrors.giftType = "Please select a gift";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const mode = formData.hyperPersonalization ? "hyper_personalize" : "manual";
    setGiftSelectionMode(mode);
  }, [formData.hyperPersonalization]);
  const [giftSelectionMode, setGiftSelectionMode] = useState("manual");

  // Add this function after the handleGiftSelection function
  const calculateTotalCost = () => {
    if (formData.giftType === "multi_gift") {
      // Find the maximum price among selected gifts
      return selectedGifts.length > 0
        ? Math.max(...selectedGifts.map((gift) => gift.price || 0))
        : 0;
    } else if (selectedGift) {
      return selectedGift.price || 0;
    }
    return 0;
  };

  // Add this function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format budget function similar to Recipients.tsx
  const formatBudget = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    if (giftSelectionMode == "manual") {
      if (!validateForm()) {
        setSubmitLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Validation for new landing page designer - check if landingPageConfig exists with basic content
    if (!landingPageConfig || !landingPageConfig.content?.headline?.trim()) {
      setErrors({
        ...errors,
        description:
          "Please customize your landing page using the Landing Page Designer below. At minimum, add a headline to continue.",
      });
      setSubmitLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const baseUrl = window.location.origin;
    // Use the new dynamic landing page URL instead of template-specific URLs
    const dynamicLandingUrl = `${baseUrl}/experience/landing`;

    // Determine if user is using new landing page designer or old templates
    const isUsingNewDesigner = !templateData.type;
    const templateType = isUsingNewDesigner ? "template5" : templateData.type; // Default to template5 for new designer

    const campaignData = {
      giftCatalogs: [
        {
          catalogId: "67ce2054e04f14d6638c7b6c",
          selectedGift: formData.hyperPersonalization
            ? null
            : formData.giftType === "multi_gift"
            ? selectedGifts.map((g) => g._id)
            : selectedGift?._id,
          hyperPersonalization: formData.hyperPersonalization,
        },
      ],
      giftSelectionMode: giftSelectionMode,
      // Add budget for Smart Match
      ...(formData.hyperPersonalization && {
        budget: {
          maxPerGift: budget,
          totalBudget: budget, // This will be calculated based on recipients later
        },
      }),
      // Keep outcomeTemplate for backward compatibility but use landingPageConfig as primary
      outcomeTemplate: {
        type: templateType, // Use valid enum value (template1-5)
        description:
          landingPageConfig?.content?.headline ||
          templateData.description ||
          "Welcome to your personalized experience!",
        date: templateData.date || new Date().toISOString(),
        videoLink:
          landingPageConfig?.media?.videoUrl || templateData.videoLink || "",
        logoLink: landingPageConfig?.logo?.url || logoUrl || "",
        buttonText:
          landingPageConfig?.actionButtons?.primary?.text ||
          templateData.buttonText ||
          "Select Gift",
        buttonLink:
          landingPageConfig?.actionButtons?.primary?.url ||
          templateData.buttonLink ||
          "",
        mediaUrl:
          landingPageConfig?.media?.imageUrl || templateData.mediaUrl || "",
        buttonText1: templateData.buttonText1 || "Venue Map",
        buttonLink1:
          templateData.buttonLink1 ||
          "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620504/Twinkle_Function_Map_wdiowx.pdf",
        buttonText2:
          templateData.buttonText2 || "Upload your pictures for the couple",
        buttonLink2:
          templateData.buttonLink2 ||
          "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620503/20250517_144033_abplvy.jpg",
      },
      landingPageConfig: landingPageConfig,
      outcomeCard: {
        message: customMessage || "",
        logoLink: logoUrl || "",
      },
      cta_link: dynamicLandingUrl, // Use the new dynamic landing page URL
      totalCost: calculateTotalCost(), // Add this line to include total cost
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignData),
        }
      );

      if (!response.ok) {
        setSubmitLoading(false);
        const errorData = await response.json().catch(() => null);
        console.error("API Error Response:", errorData);
        throw new Error(
          `Failed to save campaign details: ${response.status}${
            errorData?.message ? ` - ${errorData.message}` : ""
          }`
        );
      }

      // If successful, proceed with onNext
      onNext({
        ...formData,
        selectedGift:
          formData.giftType === "multi_gift"
            ? selectedGifts.map((g) => g._id)
            : selectedGift?._id,
        outcomeTemplate: templateData,
        landingPageConfig: landingPageConfig || undefined,
        outcomeCard: {
          message: customMessage,
          logoLink: logoUrl,
        },
      });
      setSubmitLoading(false);
    } catch (error) {
      setSubmitLoading(false);
      console.error("Error saving campaign details:", error);
      setErrors({
        giftType: `Failed to save campaign details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    const isMin = e.target.id === "min-price";
    if (isMin) {
      setPriceRange([value, priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], value]);
    }
  };

  const moveCarousel = (direction: number) => {
    // Scroll both carousels simultaneously
    const newPosition = [...carouselPosition];

    // Get visible width of the container
    const containerWidth = window.innerWidth - 40; // Subtract some padding

    // Calculate how many items can be displayed at once (use the current itemsPerRow state)
    const itemWidth = 190; // Approximate width of each item with gap

    // Calculate the maximum scroll position for each row
    // This ensures we stop exactly when the last item becomes visible
    const maxPosition1 = Math.max(0, firstRowGifts.length - itemsPerRow);
    const maxPosition2 = Math.max(0, secondRowGifts.length - itemsPerRow);

    // Apply same direction to both rows, respecting their individual max positions
    newPosition[0] = Math.min(
      Math.max(0, newPosition[0] + direction),
      maxPosition1
    );
    newPosition[1] = Math.min(
      Math.max(0, newPosition[1] + direction),
      maxPosition2
    );

    // Check if we've reached the end in both rows
    const atEnd =
      newPosition[0] >= maxPosition1 && newPosition[1] >= maxPosition2;

    setCarouselPosition(newPosition);
  };

  // Helper function to find which bundle a gift belongs to
  const getGiftBundle = (giftId: string) => {
    return bundles.find(
      (bundle) => bundle.gifts && bundle.gifts.some((g) => g.giftId === giftId)
    );
  };

  // Update the filteredGifts logic to include price sorting and bundle filtering
  // Use allGiftsUnfiltered for catalog to show all available gifts
  const filteredGifts = useMemo(() => {
    // Use allGiftsUnfiltered for catalog, but fallback to allGifts if empty
    const giftsToFilter = showCatalog
      ? allGiftsUnfiltered.length > 0
        ? allGiftsUnfiltered
        : allGifts
      : allGifts;

    console.log("🔍 Debug filteredGifts:", {
      showCatalog,
      allGiftsUnfilteredLength: allGiftsUnfiltered.length,
      allGiftsLength: allGifts.length,
      giftsToFilterLength: giftsToFilter.length,
    });

    const filtered = giftsToFilter
      .filter((gift) => {
        const priceMatches =
          gift.price >= priceRange[0] && gift.price <= priceRange[1];
        const categoryMatches =
          categoryFilter === "all" ||
          (gift.category &&
            gift.category.toLowerCase().includes(categoryFilter.toLowerCase()));

        // Bundle filter logic
        let bundleMatches = true;
        if (bundleFilter !== "all") {
          const giftBundle = getGiftBundle(gift._id);
          bundleMatches = giftBundle?.bundleId === bundleFilter;
        }

        return (
          priceMatches &&
          (categoryFilter === "all" || categoryMatches) &&
          bundleMatches
        );
      })
      .sort((a, b) => b.price - a.price); // Sort by price in descending order

    console.log(
      "🔄 Filtered gifts (top 3):",
      filtered.slice(0, 3).map((g) => `${g.name} ($${g.price})`)
    );
    console.log("🔄 Total filtered gifts:", filtered.length);
    return filtered;
  }, [
    allGifts,
    allGiftsUnfiltered,
    priceRange,
    categoryFilter,
    bundleFilter,
    bundles,
    showCatalog,
  ]);

  // Update the row splitting logic based on total number of gifts
  const { firstRowGifts, secondRowGifts } = useMemo(() => {
    if (filteredGifts.length <= 15) {
      // If 15 or fewer gifts, return all in first row
      return {
        firstRowGifts: filteredGifts,
        secondRowGifts: [],
      };
    } else {
      // If more than 15 gifts, split into two rows
      const midPoint = Math.ceil(filteredGifts.length / 2);
      return {
        firstRowGifts: filteredGifts.slice(0, midPoint),
        secondRowGifts: filteredGifts.slice(midPoint),
      };
    }
  }, [filteredGifts]);

  // New function to get top recommended gifts
  const getTopRecommendedGifts = useCallback(() => {
    setShowCatalog(false);

    console.log("🟨 Current gifts Map size:", gifts.size);
    console.log("🟨 Sample gift data:", Array.from(gifts.values()).slice(0, 2));

    // Get all gifts from the current bundle
    const giftArray = Array.from(gifts.values());
    console.log("🟨 Converted gifts to array:", giftArray);

    // Sort by price in descending order first
    const sortedGifts = giftArray.sort((a, b) => b.price - a.price);

    // Filter by budget constraint
    const maxBudget = formData.hyperPersonalization
      ? budget
      : allCampaignData?.budget?.maxPerGift ||
        numericMaxBudget ||
        DEFAULT_BUDGET;
    const budgetRespectingGifts = sortedGifts.filter(
      (gift) => gift.price <= maxBudget
    );

    // Only return gifts within budget - no fallback to expensive gifts
    return budgetRespectingGifts.slice(0, 3);
  }, [gifts, allCampaignData, numericMaxBudget]);

  // Update recommendedGifts when bundle or gifts change
  useEffect(() => {
    if (selectedBundle && gifts.size > 0) {
      const topGifts = getTopRecommendedGifts();
      setRecommendedGifts(topGifts);
    }
  }, [selectedBundle, gifts, getTopRecommendedGifts]);

  // Clean up selectedGifts when recommendedGifts change for multi-gift mode
  useEffect(() => {
    if (formData.giftType === "multi_gift" && recommendedGifts.length > 0) {
      setSelectedGifts((prev) => {
        // Only keep gifts that are currently in recommendedGifts
        return prev.filter((selectedGift) => {
          return recommendedGifts.some((g) => g._id === selectedGift._id);
        });
      });
    }
  }, [recommendedGifts, formData.giftType]);

  // Update recommendations when budget changes for Smart Match
  useEffect(() => {
    if (formData.hyperPersonalization && selectedBundle && gifts.size > 0) {
      const topGifts = getTopRecommendedGifts();
      setRecommendedGifts(topGifts);
    }
  }, [
    budget,
    formData.hyperPersonalization,
    selectedBundle,
    gifts,
    getTopRecommendedGifts,
  ]);

  const templateOptions = [
    {
      id: "template_modern",
      name: "Modern",
      description: "Clean and professional design",
      image: "/images/templates/modern.jpg",
    },
    {
      id: "template_elegant",
      name: "Elegant",
      description: "Sophisticated and classy",
      image: "/images/templates/elegant.jpg",
    },
    {
      id: "template_playful",
      name: "Playful",
      description: "Fun and colorful design",
      image: "/images/templates/playful.jpg",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.03,
        duration: 0.22,
        type: "spring",
        stiffness: 320,
        damping: 22,
      },
    }),
    hover: {
      scale: 1.01,
      boxShadow: "0 6px 24px 0 rgba(127,86,217,0.08)",
      borderColor: "#7F56D9",
      transition: { type: "spring", stiffness: 400, damping: 14 },
    },
    tap: { scale: 0.97 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.18 } },
  };

  const carouselVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.2,
      },
    },
  };

  const TEMPLATE_OPTIONS = [
    {
      key: "template1",
      name: "Video Template",
      description: "Share a video message with your recipients",
      image: "/partner-integrations/template1.png",
      accent: "from-blue-50 to-purple-50",
    },
    {
      key: "template2",
      name: "Webinar Template",
      description: "Invite recipients to join your webinar",
      image: "/partner-integrations/template2.png",
      accent: "from-green-50 to-blue-50",
    },
    {
      key: "template3",
      name: "Report Template",
      description: "Share a downloadable report with your recipients",
      image: "/partner-integrations/template3.png",
      accent: "from-yellow-50 to-green-50",
    },
    {
      key: "template4",
      name: "Meeting Template",
      description: "Schedule a meeting with your recipients",
      image: "/partner-integrations/template4.png",
      accent: "from-red-50 to-yellow-50",
    },
    {
      key: "template5",
      name: "Video Template 2",
      description: "Share another video message with your recipients",
      image: "/partner-integrations/template5.png",
      accent: "from-purple-50 to-pink-50",
    },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
    template5: false,
  });
  const [selectedTemplateOutline, setSelectedTemplateOutline] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
    template5: false,
  });
  const [focusTemplate, setFocusTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
    template5: false,
  });

  type TemplateDataType = {
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
  };

  const [templateData, setTemplateData] = useState<TemplateDataType>({
    type: "template1",
    description: "",
    date: null,
    videoLink: "",
    logoLink: "",
    buttonText: "Select Gift",
    buttonLink: "",
    mediaUrl: "",
    buttonText1: "Venue Map",
    buttonLink1:
      "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620504/Twinkle_Function_Map_wdiowx.pdf",
    buttonText2: "Upload your pictures for the couple",
    buttonLink2:
      "https://res.cloudinary.com/dfviyrkrl/image/upload/v1748620503/20250517_144033_abplvy.jpg",
  });
  const [initialLogoLinkForTemplateModal, setInitialLogoLinkForTemplateModal] =
    useState<string>("");

  const cardMotion = {
    initial: { opacity: 0, y: 40, scale: 0.96 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        type: "spring",
        stiffness: 180,
        damping: 22,
      },
    }),
    hover: {
      scale: 1.04,
      boxShadow: "0 8px 32px 0 rgba(127,86,217,0.13)",
      rotateX: 3,
      rotateY: -3,
      transition: { type: "spring", stiffness: 300, damping: 18 },
    },
    tap: { scale: 0.98 },
    selected: {
      scale: 1.06,
      transition: { type: "spring", stiffness: 400, damping: 16 },
    },
  };

  // --- Restore TemplateModal logic ---
  const handleTemplateCardClick = (templateKey: string) => {
    setSelectedTemplate({
      template1: templateKey === "template1",
      template2: templateKey === "template2",
      template3: templateKey === "template3",
      template4: templateKey === "template4",
      template5: templateKey === "template5",
    });

    setSelectedTemplateOutline({
      template1: templateKey === "template1",
      template2: templateKey === "template2",
      template3: templateKey === "template3",
      template4: templateKey === "template4",
      template5: templateKey === "template5",
    });

    // Use existing data for the template if available
    const existingData = templateDataMap[templateKey];
    setTemplateData((prev) => ({
      ...prev,
      type: templateKey as any,
      description: existingData?.description || "",
      videoLink: existingData?.videoLink || "",
      logoLink: existingData?.logoLink || logoUrl,
      buttonLink: existingData?.buttonLink || "",
      date: existingData?.date || new Date(),
    }));

    setFormData({ ...formData, templateId: templateKey });
    setInitialLogoLinkForTemplateModal(logoUrl);
  };

  const [randomGiftCards, setRandomGiftCards] = useState<Gift[]>([]);
  useEffect(() => {
    if (allGifts.length >= 3) {
      const shuffled = [...allGifts].sort(() => 0.5 - Math.random());
      setRandomGiftCards(shuffled.slice(0, 3));
    }
  }, [allGifts]);

  // Update the onTemplateDataChange handler
  const handleTemplateDataChange = (newData: any) => {
    // Save the data to our map
    setTemplateDataMap((prev) => ({
      ...prev,
      [newData.type]: {
        description: newData.description,
        videoLink: newData.videoLink,
        logoLink: newData.logoLink,
        buttonLink: newData.buttonLink,
        date: newData.date,
      },
    }));

    // Update the template data
    setTemplateData(newData);

    // Sync logo URL if it's updated in the template modal
    if (newData.logoLink && newData.logoLink !== logoUrl) {
      setLogoUrl(newData.logoLink);
    }
  };

  // Add this new function with the other functions
  const [savingEmailTemplate, setSavingEmailTemplate] = useState(false);
  const handleSaveEmailTemplate = async () => {
    setSavingEmailTemplate(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailTemplate: {
              addressConfirmedEmail: emailTemplate,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save email template");
      }
      setSavingEmailTemplate(false);
    } catch (error) {
      console.error("Error saving email template:", error);
      setSavingEmailTemplate(false);
    }
  };

  // Add new state near other state declarations
  const [inTransitEmailTemplate, setInTransitEmailTemplate] = useState(
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;">
                            <img src="https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg" alt="DelightLoop Logo" style="width: 150px; height: 40px; margin-bottom: 20px;">
                            <p style="font-size: 18px; color: #333;">Hi  {{First Name}},</p>
      <p style="font-size: 16px; color: #555;">
        We've got some delightful news — your gift is officially on its journey! ✨<br>
        Someone thought of you, and now a little joy is headed your way.
      </p>

      <p style="font-size: 16px; color: #555;">
        We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.
      </p>

      <p style="font-size: 16px; color: #555;">
        Enjoy the unboxing —<br>
        <strong>The DelightLoop Team</strong>
      </p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="font-size: 16px; color: #555; margin: 0;">
            📦 <strong>Carrier:</strong> {{carrier}}<br>
            🔍 <strong>Tracking ID:</strong> {{trackingId}}<br>
            👉 <a target="_blank" href="{{trackingUrl}}" style="color: #6c5ce7; text-decoration: none; font-weight: bold;">Track Your Gift</a>
          </p>
        </div>

        <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">

        <p style="font-size: 14px; color: #888;">
          Curious how personalized gifting can transform your business relationships?<br>
          DelightLoop helps teams create meaningful connections that drive measurable results.
        </p>

        <p style="margin-top: 10px;">
          <a href="https://www.delightloop.com/bookademo" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Transform Your Outreach Today →</a>
        </p>

        <p style="font-size: 12px; color: #888; margin-top: 20px;">© 2025 DelightLoop</p>
      </div>`
  );

  // Add new save function with other functions
  const [savingInTransitEmailTemplate, setSavingInTransitEmailTemplate] =
    useState(false);
  const handleSaveInTransitEmailTemplate = async () => {
    setSavingInTransitEmailTemplate(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailTemplate: {
              inTransitEmail: inTransitEmailTemplate,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save in-transit email template");
      }
      setSavingInTransitEmailTemplate(false);
    } catch (error) {
      console.error("Error saving in-transit email template:", error);
      setSavingInTransitEmailTemplate(false);
    }
  };

  // Add state for toggling email template editors
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showInTransit, setShowInTransit] = useState(false);

  const handleTemplateSelect = (templateNumber: number) => {
    const newSelectedTemplate = {
      template1: false,
      template2: false,
      template3: false,
      template4: false,
      template5: false,
      [`template${templateNumber}`]: true,
    };
    setFocusTemplate({
      template1: templateNumber === 1,
      template2: templateNumber === 2,
      template3: templateNumber === 3,
      template4: templateNumber === 4,
      template5: templateNumber === 5,
    });
    setSelectedTemplate({ ...selectedTemplate, ...newSelectedTemplate });
  };

  // Function to load all gifts from all catalogues
  const loadAllGiftsFromAllCatalogues = async (giftType?: string) => {
    try {
      console.log("🎁 loadAllGiftsFromAllCatalogues - Starting with:", {
        giftType,
        bundlesLength: bundles.length,
        currentFormDataGiftType: formData.giftType,
      });

      const allGiftsMap = new Map<string, Gift>();

      // Process each bundle to get all gifts
      for (const bundle of bundles) {
        try {
          if (bundle.gifts && Array.isArray(bundle.gifts)) {
            // Convert bundle gifts to Gift objects and add to map
            bundle.gifts.forEach((gift: any) => {
              // Check if gift already exists in the main gifts Map (with price estimation)
              const existingGift = gifts.get(gift.giftId);

              if (existingGift) {
                // Use the existing gift with proper price estimation
                allGiftsMap.set(gift.giftId, existingGift);
              } else {
                // Generate a reasonable price based on gift name if not already estimated
                let estimatedPrice = 0;
                if (gift.name) {
                  const name = gift.name.toLowerCase();
                  if (
                    name.includes("executive") ||
                    name.includes("luxury") ||
                    name.includes("premium")
                  ) {
                    estimatedPrice = Math.floor(Math.random() * 200) + 100; // $100-300
                  } else if (
                    name.includes("smart") ||
                    name.includes("wireless") ||
                    name.includes("bluetooth")
                  ) {
                    estimatedPrice = Math.floor(Math.random() * 150) + 50; // $50-200
                  } else if (
                    name.includes("eco") ||
                    name.includes("bamboo") ||
                    name.includes("wooden")
                  ) {
                    estimatedPrice = Math.floor(Math.random() * 100) + 25; // $25-125
                  } else {
                    estimatedPrice = Math.floor(Math.random() * 100) + 20; // $20-120
                  }
                }

                const giftObj: Gift = {
                  _id: gift.giftId,
                  name: gift.name || "Unnamed Gift",
                  price: Number(gift.price) || estimatedPrice,
                  descShort: gift.shortDescription || gift.descShort || "",
                  category: gift.category || "",
                  images: {
                    primaryImgUrl:
                      gift.imageUrl && gift.imageUrl.trim() !== ""
                        ? gift.imageUrl
                        : gift.images?.primaryImgUrl &&
                          gift.images.primaryImgUrl.trim() !== ""
                        ? gift.images.primaryImgUrl
                        : "/images/placeholder-gift.svg",
                    secondaryImgUrl:
                      gift.secondaryImgUrl && gift.secondaryImgUrl.trim() !== ""
                        ? gift.secondaryImgUrl
                        : gift.images?.secondaryImgUrl &&
                          gift.images.secondaryImgUrl.trim() !== ""
                        ? gift.images.secondaryImgUrl
                        : "/images/placeholder-gift.svg",
                  },
                  sku: gift.sku || "",
                  rationale: gift.rationale || "",
                  confidence_score: gift.confidence_score || "0",
                };
                allGiftsMap.set(gift.giftId, giftObj);
              }
            });
          }
        } catch (error) {
          console.error(`Error processing bundle ${bundle.bundleId}:`, error);
        }
      }

      // Convert to array and sort by price in descending order (highest to lowest)
      const allGiftsArray = Array.from(allGiftsMap.values());

      // Sort by price in descending order (highest price first)
      const sortedGifts = allGiftsArray.sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        return priceB - priceA; // Descending order
      });

      // Filter by budget constraint - but ensure we always show at least 3 gifts
      const maxBudget = formData.hyperPersonalization
        ? budget
        : allCampaignData?.budget?.maxPerGift ||
          numericMaxBudget ||
          DEFAULT_BUDGET;
      let budgetFilteredGifts = sortedGifts.filter((gift) => {
        const giftPrice = Number(gift.price) || 0;
        return giftPrice <= maxBudget;
      });

      // If budget filtering results in less than 3 gifts, show all gifts
      if (budgetFilteredGifts.length < 3) {
        budgetFilteredGifts = sortedGifts;
      }

      // Update states with budget-filtered gifts
      console.log("🎁 loadAllGiftsFromAllCatalogues - Setting states:", {
        allGiftsMapSize: allGiftsMap.size,
        budgetFilteredGiftsLength: budgetFilteredGifts.length,
        sortedGiftsLength: sortedGifts.length,
        giftType: giftType || formData.giftType,
      });

      setGifts(allGiftsMap);
      setAllGifts(budgetFilteredGifts);
      setAllGiftsUnfiltered(sortedGifts); // Store unfiltered gifts for catalog

      // Set top 3 budget-appropriate gifts for recommendations (always respect budget for recommendations)
      const budgetRespectingGifts = sortedGifts.filter((gift) => {
        const giftPrice = Number(gift.price) || 0;
        return giftPrice <= maxBudget;
      });

      // Only recommend gifts that are within budget - no fallback to expensive gifts
      const topGifts = budgetRespectingGifts.slice(0, 3);

      setRecommendedGifts(topGifts);

      // Set default selections based on gift type (use passed parameter instead of state)
      const currentGiftType = giftType || formData.giftType;

      if (currentGiftType === "manual_gift" && topGifts.length > 0) {
        // For manual gift, select top 1 gift by default (within budget)
        setSelectedGift(topGifts[0]);
        setFormData((prev) => ({ ...prev, selectedGiftId: topGifts[0]._id }));
      } else if (currentGiftType === "multi_gift" && topGifts.length > 0) {
        // For multi gift, select all top gifts by default (within budget)
        setSelectedGifts(topGifts);
      }
    } catch (error) {
      console.error("Error loading all gifts from catalogues:", error);
    }
  };

  // Separate flow for "One Gift for All"
  const handleManualGiftFlow = async () => {
    try {
      console.log("🔧 handleManualGiftFlow - Starting manual gift flow");

      // Set gift type first
      setFormData((prev) => ({
        ...prev,
        giftType: "manual_gift",
        hyperPersonalization: false,
      }));

      console.log("🔧 handleManualGiftFlow - Bundles length:", bundles.length);

      // Check if bundles are already loaded, if not load them
      if (bundles.length === 0) {
        console.log("🔧 handleManualGiftFlow - Fetching bundles first");
        await fetchBundles();
        await loadAllGiftsFromAllCatalogues("manual_gift");
      } else {
        // Bundles already loaded, just process the gifts
        console.log(
          "🔧 handleManualGiftFlow - Bundles already loaded, loading gifts"
        );
        await loadAllGiftsFromAllCatalogues("manual_gift");
      }

      console.log("🔧 handleManualGiftFlow - Completed manual gift flow");
    } catch (error) {
      console.error("Error in manual gift flow:", error);
    }
  };

  // Separate flow for "Let Recipients Choose"
  const handleMultiGiftFlow = async () => {
    try {
      console.log("🔧 handleMultiGiftFlow - Starting multi gift flow");

      // Set gift type first
      setFormData((prev) => ({
        ...prev,
        giftType: "multi_gift",
        hyperPersonalization: false,
      }));

      console.log("🔧 handleMultiGiftFlow - Bundles length:", bundles.length);

      // Check if bundles are already loaded, if not load them
      if (bundles.length === 0) {
        console.log("🔧 handleMultiGiftFlow - Fetching bundles first");
        await fetchBundles();
        await loadAllGiftsFromAllCatalogues("multi_gift");
      } else {
        // Bundles already loaded, just process the gifts
        console.log(
          "🔧 handleMultiGiftFlow - Bundles already loaded, loading gifts"
        );
        await loadAllGiftsFromAllCatalogues("multi_gift");
      }

      console.log("🔧 handleMultiGiftFlow - Completed multi gift flow");
    } catch (error) {
      console.error("Error in multi gift flow:", error);
    }
  };

  // Separate flow for "Smart Match"
  const handleHyperPersonalizeFlow = async () => {
    try {
      // Check if bundles are already loaded, if not load them
      if (bundles.length === 0) {
        await fetchBundles();
      }

      // Select hardcoded catalogue by default
      const hardcodedBundleId = "67ce2054e04f14d6638c7b6c";
      setSelectedBundle(hardcodedBundleId);
      await handleBundleSelect(hardcodedBundleId);

      setFormData((prev) => ({
        ...prev,
        giftType: "hyper_personalize",
        hyperPersonalization: true,
      }));
    } catch (error) {
      console.error("Error in hyper personalize flow:", error);
    }
  };

  const handleGiftTypeSelect = async (giftType: string) => {
    // Start loading state
    setIsLoadingGiftType(true);
    setShowCatalog(false); // Close gift catalog

    // Clear existing data
    setRecommendedGifts([]);
    setSelectedGift(null);
    setSelectedGifts([]);
    setSelectedBundle(null);

    // Show loading for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Call appropriate flow function based on gift type
    try {
      if (giftType === "manual_gift") {
        await handleManualGiftFlow();
      } else if (giftType === "multi_gift") {
        await handleMultiGiftFlow();
      } else if (giftType === "hyper_personalize") {
        await handleHyperPersonalizeFlow();
      }
    } finally {
      // End loading state
      setIsLoadingGiftType(false);
    }
  };

  // Add loading state for recommendations
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  // Add loading state for gift type changes
  const [isLoadingGiftType, setIsLoadingGiftType] = useState(false);

  // Update handleBundleSelect to hide catalog
  const handleBundleSelect = async (bundleId: string) => {
    try {
      setIsLoading(true);
      setSelectedBundle(bundleId);

      // Always use stored mainBundleData for the main bundle
      if (
        bundleId === "67ce2054e04f14d6638c7b6c" &&
        mainBundleData &&
        mainBundleData.gifts
      ) {
        // Create gifts Map from the stored firstResponseData
        const giftMap = new Map<string, Gift>();
        mainBundleData.gifts.forEach((gift) => {
          const giftObj: Gift = {
            _id: gift.giftId,
            name: gift.name || "Unnamed Gift",
            price: Number(gift.price) || 0,
            descShort: gift.shortDescription || "",
            category: gift.category || "",
            images: {
              primaryImgUrl:
                gift.imageUrl && gift.imageUrl.trim() !== ""
                  ? gift.imageUrl
                  : "/images/placeholder-gift.svg",
              secondaryImgUrl:
                gift.secondaryImgUrl && gift.secondaryImgUrl.trim() !== ""
                  ? gift.secondaryImgUrl
                  : "/images/placeholder-gift.svg",
            },
            sku: gift.sku || "",
            rationale: gift.rationale || "",
            confidence_score: gift.confidence_score || "0",
          };
          giftMap.set(gift.giftId, giftObj);
        });

        // Convert to array and sort by price in descending order
        const sortedGifts = Array.from(giftMap.values()).sort(
          (a, b) => (b.price || 0) - (a.price || 0)
        );

        // Get top 3 gifts for recommendations
        const topGifts = sortedGifts.slice(0, 3);

        // Update all states with the complete data from firstResponseData
        setGifts(giftMap);
        setAllGifts(sortedGifts);
        setAllGiftsUnfiltered(sortedGifts);
        setRecommendedGifts(topGifts);

        return;
      }

      // For other bundles, fetch complete bundle data with all gift details

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles/${bundleId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bundle details: ${response.status}`);
      }

      const bundleData = await response.json();

      if (!bundleData.data || !bundleData.data.gifts) {
        console.error(
          "No complete bundle or gifts found for bundle:",
          bundleId
        );
        return;
      }

      const updatedGiftMap = new Map<string, Gift>();

      bundleData.data.gifts.forEach((gift) => {
        const giftObj: Gift = {
          _id: gift.giftId,
          name: gift.name || "Unnamed Gift",
          price: Number(gift.price) || 0,
          descShort: gift.shortDescription || "",
          category: gift.category || "",
          images: {
            primaryImgUrl:
              gift.imageUrl && gift.imageUrl.trim() !== ""
                ? gift.imageUrl
                : "/images/placeholder-gift.svg",
            secondaryImgUrl:
              gift.secondaryImgUrl && gift.secondaryImgUrl.trim() !== ""
                ? gift.secondaryImgUrl
                : "/images/placeholder-gift.svg",
          },
          sku: gift.sku || "",
          rationale: gift.rationale || "",
          confidence_score: gift.confidence_score || "0",
        };
        updatedGiftMap.set(gift.giftId, giftObj);
      });

      // Convert Map to array and sort by price in descending order
      const sortedGifts = Array.from(updatedGiftMap.values()).sort(
        (a, b) => (b.price || 0) - (a.price || 0)
      );

      // Get top 3 gifts for recommendations
      const topGifts = sortedGifts.slice(0, 3);

      // Update state - this will replace the previous catalog's gifts with the new ones
      setGifts(updatedGiftMap);
      setAllGifts(sortedGifts);
      setAllGiftsUnfiltered(sortedGifts);
      setRecommendedGifts(topGifts);
    } catch (error) {
      console.error("Error selecting bundle:", error);
      toast.error("Failed to load bundle details");
    } finally {
      setIsLoading(false);
    }
  };

  const [bundleError, setBundleError] = useState<string | null>(null);

  const fetchBundles = async () => {
    try {
      setIsLoading(true);
      setBundleError(null);

      // Use the new single API call to get all bundles with their gifts
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles?isGift=true&sortOrder=desc`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const bundlesResponse = await response.json();
      console.log("🟨 Bundles response:", bundlesResponse);

      if (!bundlesResponse.success || !bundlesResponse.data) {
        throw new Error("Invalid response format");
      }

      const bundlesData = bundlesResponse.data;

      // Create comprehensive gifts map from all bundles
      const allGiftsMap = new Map<string, Gift>();
      const bundleGiftsMap = new Map<string, any[]>();

      // Process each bundle and its gifts
      bundlesData.forEach((bundle: any) => {
        console.log(
          `📦 Processing bundle: ${bundle.bundleName} (${bundle.bundleId})`
        );
        console.log(`🎁 Sample gifts from bundle:`, bundle.gifts?.slice(0, 2));

        // Store gifts for this bundle
        bundleGiftsMap.set(bundle.bundleId, bundle.gifts || []);

        // Process each gift in the bundle
        (bundle.gifts || []).forEach((gift: any) => {
          // Generate a reasonable price based on gift name or use default values
          let estimatedPrice = 0;
          if (gift.name) {
            const name = gift.name.toLowerCase();
            if (
              name.includes("executive") ||
              name.includes("luxury") ||
              name.includes("premium")
            ) {
              estimatedPrice = Math.floor(Math.random() * 200) + 100; // $100-300
            } else if (
              name.includes("smart") ||
              name.includes("wireless") ||
              name.includes("bluetooth")
            ) {
              estimatedPrice = Math.floor(Math.random() * 150) + 50; // $50-200
            } else if (
              name.includes("eco") ||
              name.includes("bamboo") ||
              name.includes("wooden")
            ) {
              estimatedPrice = Math.floor(Math.random() * 100) + 25; // $25-125
            } else {
              estimatedPrice = Math.floor(Math.random() * 100) + 20; // $20-120
            }
          }

          const giftObj: Gift = {
            _id: gift.giftId,
            name: gift.name || "Unnamed Gift",
            price: Number(gift.price) || estimatedPrice, // Use provided price or estimated price
            descShort: gift.shortDescription || "",
            category: gift.category || "",
            images: {
              primaryImgUrl:
                gift.imageUrl && gift.imageUrl.trim() !== ""
                  ? gift.imageUrl
                  : "/images/placeholder-gift.svg",
              secondaryImgUrl:
                gift.imageUrl && gift.imageUrl.trim() !== ""
                  ? gift.imageUrl
                  : "/images/placeholder-gift.svg",
            },
            sku: gift.sku || "",
            rationale: gift.rationale || "",
            confidence_score: gift.confidence_score || "0",
          };
          allGiftsMap.set(gift.giftId, giftObj);
        });
      });

      // Create enriched bundle objects with proper structure
      const enrichedBundles = bundlesData.map((bundle: any) => ({
        _id: bundle.bundleId,
        bundleId: bundle.bundleId,
        bundleName: bundle.bundleName,
        description: bundle.description || "",
        imgUrl: bundle.imgUrl || "",
        isAvailable: bundle.isAvailable !== false,
        gifts: (bundle.gifts || []).map((gift: any) => ({
          giftId: gift.giftId,
          name: gift.name,
          shortDescription: gift.shortDescription,
          inventory: gift.inventory,
          imageUrl: gift.imageUrl,
        })),
      }));

      // Find and store main bundle data for later use
      const mainBundle = bundlesData.find(
        (bundle: any) => bundle.bundleId === "67ce2054e04f14d6638c7b6c"
      );
      if (mainBundle) {
        setMainBundleData({
          gifts: mainBundle.gifts || [],
        });

        // Prepare initial recommendations from the main bundle
        const mainBundleGifts = (mainBundle.gifts || [])
          .map((gift: any) => {
            return allGiftsMap.get(gift.giftId);
          })
          .filter(Boolean) as Gift[];

        const sortedGifts = mainBundleGifts.sort(
          (a, b) => (b.price || 0) - (a.price || 0)
        );
        setAllGifts(sortedGifts);
        setAllGiftsUnfiltered(sortedGifts);

        // Set top 3 as recommended gifts based on budget
        const maxBudget =
          allCampaignData?.budget?.maxPerGift || numericMaxBudget || 500;
        const topGifts = sortedGifts
          .filter((gift) => gift.price <= maxBudget)
          .slice(0, 3);
        setRecommendedGifts(topGifts);
      }

      // Set the gifts map with all processed gifts
      setGifts(allGiftsMap);
      setBundles(enrichedBundles);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      setBundleError(
        error instanceof Error
          ? error.message
          : "Failed to load bundles. Please try again."
      );
      toast.error("Failed to load gift bundles");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the individual gift fetch function since we now store all gifts from bundles
  const fetchGiftsForSelectedBundle = async (bundleId: string) => {
    const bundle = bundles.find(
      (b) => b.bundleId === bundleId || b._id === bundleId
    );

    if (!bundle || !bundle.gifts) {
      return [];
    }

    // Use the gifts we already have stored in the gifts Map
    const bundleGifts = bundle.gifts
      .map((g) => gifts.get(g.giftId))
      .filter(Boolean);

    return bundleGifts;
  };

  // Add state for multi-gift selection
  const [selectedGifts, setSelectedGifts] = useState<Gift[]>([]);

  // Store the main bundle data from firstResponseData
  const [mainBundleData, setMainBundleData] = useState<any>(null);

  return (
    <div className="">
      <h2 className="text-xl font-semibold mb-6">Recipients Experience</h2>
      <p className="text-gray-600 mb-8">
        Customize the gifting experience for your recipients.
      </p>

      <div className="space-y-16 ">
        {/* Step 1: Gift Selection */}
        <div className="space-y-16">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium mb-4">1. Select Gift Type</h3>

            {/* Gift Type Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Hyper Personalize Card */}
              <div
                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.hyperPersonalization
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                } ${
                  !allRecipientsHaveLinkedin
                    ? "opacity-50 pointer-events-none"
                    : ""
                } ${
                  allCampaignData?.motion === "booth_giveaways"
                    ? "hidden"
                    : "block"
                }`}
                onClick={() => {
                  if (!allRecipientsHaveLinkedin) return;
                  handleGiftTypeSelect("hyper_personalize");
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    {formData.hyperPersonalization && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
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
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Smart Match</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Let AI recommend a unique, hyper-personalized gift for each
                    recipient using profile insights and behavior.
                  </p>
                  {!allRecipientsHaveLinkedin && (
                    <div className="text-sm text-red-500 -mt-2 mb-4">
                      Some recipients do not have a LinkedIn URL. Please select
                      gift manually.
                    </div>
                  )}
                  <div className="mt-auto">
                    <span className="text-xs text-gray-500">
                      Best for personalized gifting at scale.
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Gift Card */}
              <div
                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.giftType === "manual_gift"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                }`}
                onClick={() => handleGiftTypeSelect("manual_gift")}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    {formData.giftType === "manual_gift" && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
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
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    One Gift for All
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Choose one gift to send to all recipients — simple,
                    consistent, and quick to launch.
                  </p>
                  <div className="mt-auto">
                    <span className="text-xs text-gray-500">
                      Best for fast campaigns or single-SKU use.
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi Gift Card */}
              <div
                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.giftType === "multi_gift"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                }`}
                onClick={() => handleGiftTypeSelect("multi_gift")}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    {formData.giftType === "multi_gift" && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
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
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    Let Recipients Choose
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Select a curated set of gifts and let each recipient pick
                    what they like most.
                  </p>
                  <div className="mt-auto">
                    <span className="text-xs text-gray-500">
                      Best for premium or inclusive experiences.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Slider - Only show for Smart Match */}
            {formData.hyperPersonalization && !isLoadingGiftType && (
              <div className="mt-8 mb-8 border-t border-gray-200 pt-8">
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Per Gift Budget
                    </h3>
                    <span className="text-lg font-semibold text-primary">
                      {formatBudget(budget)}
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBudget(Math.max(5, budget - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <div className="relative w-32">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value >= 0 && value <= 500) {
                              setBudget(value);
                            } else if (e.target.value === "") {
                              setBudget(0);
                            }
                          }}
                          min="5"
                          max="500"
                          step="1"
                          className="block w-full pl-7 pr-3 py-2 text-center border-gray-300 rounded-md focus:ring-primary focus:border-primary text-lg"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setBudget(Math.min(500, budget + 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 text-sm text-gray-500 text-center">
                      Adjust the budget to filter gift recommendations (Min: $5,
                      Max: $500)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading screen for gift type changes */}
            {isLoadingGiftType && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-24 h-24 mb-6">
                    <InfinityLoader width={96} height={96} />
                  </div>
                  <p className="text-gray-600 text-lg">
                    Loading gift recommendations...
                  </p>
                </div>
              </div>
            )}

            {/* Select Catalogue Section - Only show for hyper personalization and when not loading */}
            {formData.hyperPersonalization && !isLoadingGiftType && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
                <h3 className="text-lg font-medium mb-4">Select Catalogue</h3>

                {isLoadingBundles ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Only the single-line carousel, no large preview */}
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {bundles.map((bundle) => (
                          <div
                            key={bundle.bundleId}
                            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg flex-shrink-0 w-[280px] ${
                              selectedBundle === bundle.bundleId
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-primary/50"
                            }`}
                            onClick={() => handleBundleSelect(bundle.bundleId)}
                          >
                            <div className="flex flex-col h-full">
                              {/* Bundle Image */}
                              <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                                <Image
                                  src={
                                    bundle.imgUrl ||
                                    "/images/placeholder-bundle.jpg"
                                  }
                                  alt={bundle.bundleName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              {/* Bundle Info */}
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold mb-2">
                                  {bundle.bundleName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {bundle.gifts?.length || 0} gifts in this
                                  bundle
                                </p>
                              </div>

                              {/* Selection Indicator */}
                              {selectedBundle === bundle.bundleId && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
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
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {bundles.length > 0 && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
                        <button
                          onClick={() => {
                            const container =
                              document.querySelector(".scrollbar-hide");
                            if (container) {
                              container.scrollBy({
                                left: -300,
                                behavior: "smooth",
                              });
                            }
                          }}
                          className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 pointer-events-auto"
                          aria-label="Previous bundles"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const container =
                              document.querySelector(".scrollbar-hide");
                            if (container) {
                              container.scrollBy({
                                left: 300,
                                behavior: "smooth",
                              });
                            }
                          }}
                          className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 pointer-events-auto"
                          aria-label="Next bundles"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {bundles.length === 0 && !isLoadingBundles && (
                  <div className="text-center py-8 text-gray-500">
                    No catalogues available at the moment.
                  </div>
                )}
              </div>
            )}

            {/* Existing gift type selection content */}
            {errors.giftType && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.giftType}
              </div>
            )}

            {/* Add Hyper-personalization Toggle */}
            {/* {allRecipientsHaveLinkedin ? "yes" : "no"} */}
            {(formData.giftType === "manual_gift" ||
              formData.giftType === "multi_gift") && (
              <>
                <div
                  className={`relative items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 w-1/2 hidden`}
                >
                  {!allRecipientsHaveLinkedin && (
                    <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center text-red-400 text-sm rounded-lg font-medium text-center"></div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        Hyper-personalization
                      </span>
                      <span className="text-xs text-gray-500">
                        AI-powered gift recommendations based on recipient data
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.hyperPersonalization}
                    className={`${
                      formData.hyperPersonalization
                        ? "bg-primary"
                        : "bg-gray-200"
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    onClick={() => {
                      handleGiftTypeSelect(
                        formData.hyperPersonalization
                          ? "manual_gift"
                          : "hyper_personalize"
                      );
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        formData.hyperPersonalization
                          ? "translate-x-5"
                          : "translate-x-0"
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* <h4 className="text-md font-medium mb-3 text-gray-700">
                    Recommended for you
                  </h4> */}

                {/* Recommendations Section - Only show for manual_gift and multi_gift and when not loading */}
                {(formData.giftType === "manual_gift" ||
                  formData.giftType === "multi_gift") &&
                  bundles.length > 0 &&
                  !isLoadingGiftType && (
                    <div className="mt-8 bg-primary/10 px-4 py-6 rounded-lg border border-primary/20 relative">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          Selected Gifts for You
                        </h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {isLoadingRecommendations ? (
                          <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                            <div className="relative w-24 h-24 mb-6">
                              <InfinityLoader width={56} height={56} />
                            </div>
                            <p className="text-gray-600">
                              Loading recommendations...
                            </p>
                          </div>
                        ) : gifts.size > 0 ? (
                          <>
                            {recommendedGifts.map((giftItem) => {
                              const isSelected =
                                formData.giftType === "multi_gift"
                                  ? selectedGifts.some(
                                      (g) => g._id === giftItem._id
                                    )
                                  : selectedGift?._id === giftItem._id;

                              return (
                                <div
                                  key={giftItem._id}
                                  className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] p-0.5"
                                >
                                  <div
                                    className={`border rounded-xl overflow-hidden cursor-pointer bg-white group transition-all duration-200 ${
                                      isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-primary/30"
                                    }`}
                                    onClick={() =>
                                      handleGiftSelection(giftItem)
                                    }
                                  >
                                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                      <div className="w-full h-full relative">
                                        <Image
                                          src={
                                            giftItem.images?.primaryImgUrl ||
                                            "/images/placeholder-gift.svg"
                                          }
                                          alt={giftItem.name}
                                          fill
                                          className="object-contain transition-transform duration-400 group-hover:scale-110"
                                          onError={(e) => {
                                            console.log(
                                              `🚨 Image failed to load for ${giftItem.name}:`,
                                              giftItem.images?.primaryImgUrl
                                            );
                                            e.currentTarget.src =
                                              "/images/placeholder-gift.svg";
                                          }}
                                        />
                                        <div className="absolute inset-0 pointer-events-none rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-300" />
                                      </div>
                                    </div>
                                    <div className="px-2 py-2">
                                      <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-gray-900 text-xs truncate">
                                          {giftItem.name}
                                        </h4>
                                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                          ${giftItem.price}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 line-clamp-1">
                                        {giftItem.descShort}
                                      </p>
                                      {isSelected && (
                                        <div className="flex items-center text-primary text-xs mt-1">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                          Selected
                                        </div>
                                      )}
                                      {giftItem.rationale && (
                                        <div className="bg-blue-50 p-1.5 rounded-md mt-2">
                                          <p className="text-[10px] text-blue-700 italic line-clamp-2">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-3 w-3 inline-block mr-1"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            {giftItem.rationale}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Browse Catalog button - only show for hyper personalization */}
                            {formData.hyperPersonalization && (
                              <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] p-0.5"
                                onClick={async () => {
                                  if (selectedBundle) {
                                    setIsLoading(true);
                                    try {
                                      // Only fetch gifts if they haven't been loaded yet
                                      if (allGifts.length === 0) {
                                        const gifts =
                                          await fetchGiftsForSelectedBundle(
                                            selectedBundle
                                          );
                                        setAllGifts(gifts);
                                      }
                                      setShowCatalog(true); // Show catalog after gifts are loaded
                                    } catch (error) {
                                      console.error(
                                        "Error loading catalog:",
                                        error
                                      );
                                    } finally {
                                      setIsLoading(false);
                                    }
                                  }
                                }}
                              >
                                <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center bg-white h-full">
                                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 text-gray-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                  </div>
                                  <h4 className="font-medium text-gray-700 text-xs text-center mb-1">
                                    Browse Catalog
                                  </h4>
                                  <p className="text-[10px] text-gray-500 text-center px-2">
                                    Find more options
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                            <p>No recommendations available</p>
                          </div>
                        )}
                      </div>

                      {/* Browse more gifts button - positioned at bottom right */}
                      <button
                        onClick={() => setShowCatalog(true)}
                        className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        Browse more gifts
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                {/* Gift Catalog Section - Only show for manual_gift and multi_gift and when not loading */}
                {showCatalog &&
                  (formData.giftType === "manual_gift" ||
                    formData.giftType === "multi_gift") &&
                  !isLoadingGiftType && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold"> </h3>
                        <button
                          onClick={() => setShowCatalog(false)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Close catalog"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      {/* Price Filter */}
                      <div className="mb-6 flex items-center justify-end space-x-4">
                        <div className="w-28">
                          <label
                            htmlFor="min-price"
                            className="block text-xs text-gray-500 mb-1"
                          >
                            Min ($)
                          </label>
                          <input
                            type="number"
                            id="min-price"
                            min="0"
                            max={
                              allCampaignData?.budget?.maxPerGift ||
                              numericMaxBudget ||
                              DEFAULT_BUDGET
                            }
                            value={priceRange[0]}
                            onChange={handlePriceChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="text-gray-400">—</div>
                        <div className="w-28">
                          <label
                            htmlFor="max-price"
                            className="block text-xs text-gray-500 mb-1"
                          >
                            Max ($)
                          </label>
                          <input
                            type="number"
                            id="max-price"
                            min="0"
                            max={
                              allCampaignData?.budget?.maxPerGift ||
                              numericMaxBudget ||
                              DEFAULT_BUDGET
                            }
                            value={priceRange[1]}
                            onChange={handlePriceChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="w-48">
                          <label
                            htmlFor="bundle-filter"
                            className="block text-xs text-gray-500 mb-1"
                          >
                            Bundle
                          </label>
                          <select
                            id="bundle-filter"
                            value={bundleFilter}
                            onChange={(e) => setBundleFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="all">All Bundles</option>
                            {bundles.map((bundle) => (
                              <option
                                key={bundle.bundleId}
                                value={bundle.bundleId}
                              >
                                {bundle.bundleName} ({bundle.gifts?.length || 0}{" "}
                                gifts)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <>
                          {/* First row carousel */}
                          {firstRowGifts.length > 0 && (
                            <div className="mb-4">
                              <div className="relative overflow-hidden">
                                <motion.div
                                  className="flex gap-2 py-1"
                                  style={{
                                    WebkitOverflowScrolling: "touch",
                                    transform: `translateX(-${
                                      Math.min(
                                        carouselPosition[0],
                                        Math.max(
                                          0,
                                          firstRowGifts.length - itemsPerRow
                                        )
                                      ) * 190
                                    }px)`,
                                    transition: "transform 0.5s ease-in-out",
                                  }}
                                  initial={false}
                                  variants={carouselVariants}
                                  animate="visible"
                                >
                                  {firstRowGifts.map((gift) => (
                                    <motion.div
                                      key={gift._id}
                                      custom={gift._id}
                                      variants={cardVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      whileHover="hover"
                                      whileTap="tap"
                                      className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] p-0.5"
                                    >
                                      <div
                                        className={`border rounded-xl overflow-hidden cursor-pointer bg-white group transition-all duration-200
                                    ${
                                      formData.giftType === "multi_gift"
                                        ? selectedGifts.some(
                                            (g) => g._id === gift._id
                                          )
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-gray-200 hover:border-primary/30"
                                        : formData.giftType === gift._id
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-primary/30"
                                    }`}
                                        onClick={() =>
                                          handleGiftSelection(gift)
                                        }
                                      >
                                        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                          <div className="w-full h-full relative">
                                            <Image
                                              src={
                                                gift.images?.primaryImgUrl ||
                                                "/images/placeholder-gift.svg"
                                              }
                                              alt={gift.name}
                                              fill
                                              className="object-contain transition-transform duration-400 group-hover:scale-110"
                                              onError={(e) => {
                                                console.log(
                                                  `🚨 First row catalog image failed to load for ${gift.name}:`,
                                                  gift.images?.primaryImgUrl
                                                );
                                                e.currentTarget.src =
                                                  "/images/placeholder-gift.svg";
                                              }}
                                            />
                                            <div className="absolute inset-0 pointer-events-none rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-300" />
                                          </div>
                                        </div>
                                        <div className="px-2 py-2">
                                          <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-semibold text-gray-900 text-xs truncate">
                                              {gift.name}
                                            </h4>
                                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                              ${gift.price}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-gray-500 line-clamp-1">
                                            {gift.descShort}
                                          </p>
                                          {(formData.giftType === "multi_gift"
                                            ? selectedGifts.some(
                                                (g) => g._id === gift._id
                                              )
                                            : formData.giftType ===
                                              gift._id) && (
                                            <div className="flex items-center text-primary text-xs mt-1">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 mr-1"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Selected
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            </div>
                          )}

                          {/* Navigation Arrows - Between Rows */}
                          {(firstRowGifts.length > itemsPerRow ||
                            secondRowGifts.length > itemsPerRow) && (
                            <div className="flex justify-center space-x-4 my-4">
                              <button
                                onClick={() => moveCarousel(-1)}
                                className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="Previous gifts"
                                disabled={
                                  carouselPosition[0] === 0 &&
                                  carouselPosition[1] === 0
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveCarousel(1)}
                                className="bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="Next gifts"
                                disabled={
                                  carouselPosition[0] >=
                                    Math.max(
                                      0,
                                      firstRowGifts.length - itemsPerRow
                                    ) &&
                                  carouselPosition[1] >=
                                    Math.max(
                                      0,
                                      secondRowGifts.length - itemsPerRow
                                    )
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Second row carousel */}
                          {secondRowGifts.length > 0 && (
                            <div>
                              <div className="relative overflow-hidden">
                                <motion.div
                                  className="flex gap-2 py-1"
                                  style={{
                                    WebkitOverflowScrolling: "touch",
                                    transform: `translateX(-${
                                      Math.min(
                                        carouselPosition[1],
                                        Math.max(
                                          0,
                                          secondRowGifts.length - itemsPerRow
                                        )
                                      ) * 190
                                    }px)`,
                                    transition: "transform 0.5s ease-in-out",
                                  }}
                                  initial={false}
                                  variants={carouselVariants}
                                  animate="visible"
                                >
                                  {secondRowGifts.map((gift) => (
                                    <motion.div
                                      key={gift._id}
                                      custom={gift._id}
                                      variants={cardVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      whileHover="hover"
                                      whileTap="tap"
                                      className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] p-0.5"
                                    >
                                      <div
                                        className={`border rounded-xl overflow-hidden cursor-pointer bg-white group transition-all duration-200
                                    ${
                                      formData.giftType === "multi_gift"
                                        ? selectedGifts.some(
                                            (g) => g._id === gift._id
                                          )
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-gray-200 hover:border-primary/30"
                                        : formData.giftType === gift._id
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-primary/30"
                                    }`}
                                        onClick={() =>
                                          handleGiftSelection(gift)
                                        }
                                      >
                                        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                          <div className="w-full h-full relative">
                                            <Image
                                              src={
                                                gift.images?.primaryImgUrl ||
                                                "/images/placeholder-gift.svg"
                                              }
                                              alt={gift.name}
                                              fill
                                              className="object-contain transition-transform duration-400 group-hover:scale-110"
                                              onError={(e) => {
                                                console.log(
                                                  `🚨 Second row catalog image failed to load for ${gift.name}:`,
                                                  gift.images?.primaryImgUrl
                                                );
                                                e.currentTarget.src =
                                                  "/images/placeholder-gift.svg";
                                              }}
                                            />
                                            <div className="absolute inset-0 pointer-events-none rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-300" />
                                          </div>
                                        </div>
                                        <div className="px-2 py-2">
                                          <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-semibold text-gray-900 text-xs truncate">
                                              {gift.name}
                                            </h4>
                                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                              ${gift.price}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-gray-500 line-clamp-1">
                                            {gift.descShort}
                                          </p>
                                          {(formData.giftType === "multi_gift"
                                            ? selectedGifts.some(
                                                (g) => g._id === gift._id
                                              )
                                            : formData.giftType ===
                                              gift._id) && (
                                            <div className="flex items-center text-primary text-xs mt-1">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 mr-1"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Selected
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            </div>
                          )}

                          {/* Empty state when no gifts are found */}
                          {firstRowGifts.length === 0 &&
                            secondRowGifts.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  No gifts found
                                </h3>
                                <p className="text-gray-500 mb-4 max-w-sm">
                                  No gifts match your current filters. Try
                                  adjusting the price range or bundle selection.
                                </p>
                                <button
                                  onClick={() => {
                                    setPriceRange([0, 500]);
                                    setBundleFilter("all");
                                    setCategoryFilter("all");
                                  }}
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                  Reset Filters
                                </button>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  )}
              </>
            )}
          </div>
          {/* ...Step 2 and Step 3 remain unchanged... */}
        </div>

        {/* Step 2: Craft Your Message */}
        <div
          ref={messageRef}
          className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-opacity duration-300 ${
            !formData.giftType && giftSelectionMode == "manual"
              ? "opacity-50"
              : "opacity-100"
          }`}
        >
          <h3 className="text-lg font-medium mb-4">
            2. Craft Your Gift Message
          </h3>
          <p className="text-gray-600 mb-4">
            This message will be printed on a physical postcard inside the gift
            box — the first thing your recipient reads.
          </p>

          <EditableCardPreview
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
          />

          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                The QR code on the postcard will direct recipients to the
                landing page you select below.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Choose Landing Page Template */}
        <div
          ref={templateRef}
          className={`bg-white p-6 rounded-lg border  border-gray-200 shadow-sm transition-opacity duration-300 ${
            !formData.giftType && giftSelectionMode == "manual"
              ? "opacity-50"
              : "opacity-100"
          }`}
        >
          <h3 className="text-lg font-medium mb-4">3. Choose Landing Page</h3>
          <p className="text-gray-600 mb-4">
            After scanning the QR code on the postcard, your recipient will land
            on a personalized page. Select the goal you want to drive — and
            customize the content if needed.
          </p>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            animate="animate"
          >
            {TEMPLATE_OPTIONS.map((template, i) => {
              const isSelected = selectedTemplateOutline[template.key];
              return (
                <motion.div
                  key={template.key}
                  custom={i}
                  variants={cardMotion}
                  whileHover="hover"
                  whileTap="tap"
                  animate={isSelected ? "selected" : "animate"}
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className={`
                    group relative cursor-pointer rounded-2xl border-2 transition-all duration-300
                    bg-gradient-to-br ${template.accent}
                    ${
                      isSelected
                        ? "border-primary"
                        : "border-transparent hover:border-primary/30"
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary
                    shadow-lg
                  `}
                  onClick={() => {
                    setSelectedTemplate({
                      template1: template.key === "template1",
                      template2: template.key === "template2",
                      template3: template.key === "template3",
                      template4: template.key === "template4",
                      template5: template.key === "template5",
                    });
                    setSelectedTemplateOutline({
                      template1: template.key === "template1",
                      template2: template.key === "template2",
                      template3: template.key === "template3",
                      template4: template.key === "template4",
                      template5: template.key === "template5",
                    });
                    setTemplateData((prev) => ({
                      ...prev,
                      type: template.key as any,
                    }));
                    setFormData({
                      ...formData,
                      templateId: template.key,
                    });
                    setInitialLogoLinkForTemplateModal("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTemplate({
                        template1: template.key === "template1",
                        template2: template.key === "template2",
                        template3: template.key === "template3",
                        template4: template.key === "template4",
                        template5: template.key === "template5",
                      });
                      setTemplateData((prev) => ({
                        ...prev,
                        type: template.key as any,
                      }));
                      setFormData({
                        ...formData,
                        templateId: template.key,
                      });
                      setInitialLogoLinkForTemplateModal("");
                    }
                  }}
                >
                  <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
                    <Image
                      src={template.image}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={i === 0}
                    />
                    <motion.div
                      className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-1 text-xs font-semibold text-primary shadow"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      {template.name}
                    </motion.div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="font-semibold text-gray-900 text-base">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </div>
                    {isSelected && (
                      <motion.div
                        className="flex items-center text-primary text-sm mt-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Selected
                      </motion.div>
                    )}
                  </div>
                  {/* The dark thick border overlay has been removed */}
                </motion.div>
              );
            })}
          </motion.div>
          <AnimatePresence>
            {(selectedTemplate.template1 ||
              selectedTemplate.template2 ||
              selectedTemplate.template3 ||
              selectedTemplate.template4 ||
              selectedTemplate.template5) && (
              <Portal>
                <div className="fixed inset-0 z-[9999] isolate">
                  <TemplateModal
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    onTemplateDataChange={handleTemplateDataChange}
                    initialLogoLink={logoUrl} // Pass current logoUrl directly
                    initialData={
                      templateDataMap[
                        Object.keys(selectedTemplate).find(
                          (key) => selectedTemplate[key]
                        ) || "template1"
                      ]
                    }
                  />
                </div>
              </Portal>
            )}
          </AnimatePresence>

          {/* Landing Page Designer - Integrated into step 3 */}
          <div className="mt-8 border-t pt-6">
            <LandingPageDesigner
              preset={landingPageConfig || undefined}
              onChange={(config) => setLandingPageConfig(config)}
              campaignId={campaignId}
            />
          </div>
        </div>

        {/* Step 4: Choose mail template */}
        <div
          className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6 ${
            allCampaignData?.motion == "booth_giveaways" ? "hidden" : ""
          }`}
        >
          <h3 className="text-lg font-medium mb-4">4. Choose Mail Templates</h3>
          <p className="text-gray-600 mb-4">
            Select templates for your gift emails. These emails will be sent to
            recipients at different stages.
          </p>
          {/* Email Template Toggles */}
          <div className="flex gap-8 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAddressConfirmation}
                onChange={() => setShowAddressConfirmation((v) => !v)}
                className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Address Confirmation Email
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInTransit}
                onChange={() => setShowInTransit((v) => !v)}
                className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">In Transit Email</span>
            </label>
          </div>
          {/* Address Confirmed Email Template */}
          {showAddressConfirmation && (
            <div className="mb-8">
              <h4 className="text-md font-medium mb-2">
                Address Confirmation Email
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                This email will be sent when requesting the recipient's address.
              </p>
              <div className="mt-4">
                <QuillEditor
                  content={emailTemplate}
                  onChange={(html) => setEmailTemplate(html)}
                  className="min-h-[300px]"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveEmailTemplate}
                    disabled={savingEmailTemplate}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2"
                  >
                    {savingEmailTemplate ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* In Transit Email Template */}
          {showInTransit && (
            <div className="mb-8">
              <h4 className="text-md font-medium mb-2">In Transit Email</h4>
              <p className="text-sm text-gray-600 mb-4">
                This email will be sent when the gift is in transit to the
                recipient.
              </p>
              <div className="mt-4">
                <QuillEditor
                  content={inTransitEmailTemplate}
                  onChange={(html) => setInTransitEmailTemplate(html)}
                  className="min-h-[300px]"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveInTransitEmailTemplate}
                    disabled={savingInTransitEmailTemplate}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2"
                  >
                    {savingInTransitEmailTemplate
                      ? "Saving..."
                      : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between  mt-12">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`px-5 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center ${
            submitLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>Continue</>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div>
        {errors.description && (
          <div className="text-red-500 flex items-center justify-end w-fit place-self-end text-sm mt-4 text-end bg-red-50 border border-red-500 rounded-md p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-2">{errors.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientExperience;
