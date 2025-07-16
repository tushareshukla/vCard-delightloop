"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Poppins } from "next/font/google";
import Image from "next/image";
import InfinityLoader from "../common/InfinityLoader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Portal } from "@/components/Portal";
import QuillEditor from "../QuillEditor";

// Import necessary components and icons
import { Info, ShoppingBag } from "lucide-react";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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

interface PhysicalNudgeExperienceProps {
  nudgeId?: string;
  authToken: string;
  userId: string;
  organizationId: string;
  eventId?: string;
  maxBudget?: number;
  onSave: (nudgeData: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: {
    giftType?: string;
    message?: string;
    templateId?: string;
    logoUrl?: string;
    customMessage?: string;
    hyperPersonalization?: boolean;
    selectedGiftId?: string;
    selectedGift?: any;
    giftCatalogs?: any[];
    templateData?: {
      type?: string;
      description?: string;
      date?: string;
      videoLink?: string;
      buttonText?: string;
      buttonLink?: string;
      mediaUrl?: string;
    };
    emailTemplate?: {
      addressConfirmedEmail?: string;
      inTransitEmail?: string;
    };
    outcomeTemplate?: {
      type?: string;
      description?: string;
      date?: string;
      videoLink?: string;
      logoLink?: string;
      buttonText?: string;
      buttonLink?: string;
      mediaUrl?: string;
    };
  };
  campaignId: string;
  allRecipientsHaveLinkedin: boolean;
}

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
const EditableCardPreview = ({
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
      ctx.lineTo(
        x + stripeWidth * 4 - borderWidth,
        canvas.height - borderWidth
      );
      ctx.lineTo(
        x + stripeWidth * 3 - borderWidth,
        canvas.height - borderWidth
      );
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
    const drawPostmarkInfinity = (x: number, y?: number) => {
      if (typeof y !== "number" || isNaN(y)) {
        console.error("drawPostmarkInfinity: y is not defined or NaN", {
          x,
          y,
        });
        return;
      }
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
    // Debug log to verify arguments
    // console.log(
    //   "drawPostmarkInfinity called with",
    //   canvas.width * 0.85,
    //   contentY + 90
    // );
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
          left: "30px",
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
              src={logoUrl || "/placeholder.svg"}
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

const PhysicalNudgeExperience: React.FC<PhysicalNudgeExperienceProps> = ({
  nudgeId,
  authToken,
  userId,
  organizationId,
  eventId,
  maxBudget = 0,
  onSave,
  onCancel,
  initialData = {},
  campaignId,
  allRecipientsHaveLinkedin,
}) => {
  // Ensure maxBudget is a number at the very start
  const numericMaxBudget = Number(maxBudget);

  // Component initialization logging
  // console.log('[PhysicalNudgeExperience] Component Initialized with props:', {
  //   nudgeId,
  //   userId,
  //   organizationId,
  //   eventId,
  //   maxBudget: numericMaxBudget,
  //   campaignId,
  //   initialData,
  //   hasAuthToken: !!authToken,
  //   hasLinkedin: allRecipientsHaveLinkedin
  // });

  // --- STATE INITIALIZATION ---
  // Form data and errors
  const [formData, setFormData] = useState({
    giftType: initialData?.giftType || "",
    message: initialData?.message || "",
    templateId: initialData?.templateId || "",
    hyperPersonalization: initialData?.hyperPersonalization || false,
  });
  const [errors, setErrors] = useState<FormErrors>({ giftType: "" });

  // State for the multistep process
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Event and sequence tracking
  const [sequence, setSequence] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);

  // Gift selection state
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftSelectionMode, setGiftSelectionMode] = useState(
    initialData?.giftType === "ai" ? "hyper_personalize" : "manual"
  );

  // Gift catalog state
  const [gifts, setGifts] = useState<Map<string, Gift>>(new Map());
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);

  // Event-based gift recommendations state
  const [eventGifts, setEventGifts] = useState<Gift[]>([]);
  const [isLoadingEventGifts, setIsLoadingEventGifts] = useState(false);
  const [eventGiftError, setEventGiftError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  // Custom message state
  const [customMessage, setCustomMessage] = useState(
    initialData?.customMessage || "We have reserved a special gift for you!"
  );
  const [logoUrl, setLogoUrl] = useState(
    initialData?.logoUrl || "/Logo Final.png"
  );

  // Carousel states
  const [activeRow, setActiveRow] = useState(0);
  const [carouselPosition, setCarouselPosition] = useState([0, 0]);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const carouselContainerRef = useRef<HTMLDivElement>(null);

  // Landing page template state
  const [selectedTemplate, setSelectedTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [selectedTemplateOutline, setSelectedTemplateOutline] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [templateDataMap, setTemplateDataMap] = useState<Record<string, any>>({
    template1: { description: "", videoLink: "", logoLink: "", buttonLink: "" },
    template2: {
      description: "",
      date: new Date(),
      logoLink: "",
      buttonLink: "",
    },
    template3: { description: "", logoLink: "", buttonLink: "" },
    template4: { description: "", logoLink: "", buttonLink: "" },
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [initialLogoLinkForTemplateModal, setInitialLogoLinkForTemplateModal] =
    useState<string>("");

  // Email template states
  const [emailTemplate, setEmailTemplate] = useState(
    initialData?.emailTemplate?.addressConfirmedEmail ||
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;
    ">
      <img src="https://ci3.googleusercontent.com/meips/
      ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-
      e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg" alt="DelightLoop Logo" width="150" height="40"
      style="display: block; width: 150px; height: 40px; margin-bottom: 20px;">
      <p style="font-size: 18px; color: #333;">Hi {{First Name}},</p>
      <p style="font-size: 16px; color: #555;">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you
      please confirm your preferred delivery address?</p>

      <p><a href="{{Verification URL}}" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight:
      bold; border-radius: 5px;">Confirm Your Address Here</a></p>

      <p style="font-size: 16px; color: #555;">Rest assured, your information will be kept confidential and used solely for this delivery.</p>
      <p style="font-size: 16px; color: #555;">Looking forward to delighting you!</p>


      <p style="font-size: 16px; color: #555; margin-top: 20px;">Best wishes,<br>The Delightloop Team</p>

      <p style="font-size: 14px; color: #888;">Curious how personalized gifting can transform your business relationships?<br>
      DelightLoop helps teams create meaningful connections that drive measurable results</p>
      <p style="margin-top: 10px;"><a href="https://www.delightloop.com/bookademo" style="display: inline-block; padding: 10px 20px; background: #6c5ce7; color:
      #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Transform Your Outreach Today →</a></p>

      <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Delightloop</p>
    </div>`
  );
  const [inTransitEmailTemplate, setInTransitEmailTemplate] = useState(
    initialData?.emailTemplate?.inTransitEmail ||
      `<p style="font-size: 16px; color: #555;">
      We've got some delightful news — your gift is officially on its journey! ✨<br>
      Someone thought of you, and now a little joy is headed your way.
    </p>

    <p style="font-size: 16px; color: #555;">
      We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.
    </p>

    <p style="font-size: 16px; color: #555;">
      Enjoy the unboxing —<br>
      <strong>The DelightLoop Team</strong>
    </p>`
  );
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showInTransit, setShowInTransit] = useState(false);

  // Refs for scrolling to sections
  const giftSectionRef = useRef<HTMLDivElement>(null);
  const messageSectionRef = useRef<HTMLDivElement>(null);
  const templateSectionRef = useRef<HTMLDivElement>(null);
  const emailSectionRef = useRef<HTMLDivElement>(null);

  // Template data state
  const [templateData, setTemplateData] = useState({
    type: "template1" as "template1" | "template2" | "template3" | "template4",
    description: "",
    date: null as Date | null,
    videoLink: "",
    logoLink: "",
    buttonText: "Select Gift",
    buttonLink: "",
    mediaUrl: "",
  });

  // --- FIX FOR ISSUE 2: Reset state when initialData changes ---
  useEffect(() => {
    if (initialData) {
      // console.log('[InitialData Effect] Processing initial data:', initialData);
      // Determine hyperPersonalization from backend metadata
      const hyperPersonalization =
        initialData?.giftType === "ai" ||
        initialData?.giftSelectionMode === "hyper_personalize" ||
        (initialData?.giftCatalogs &&
          initialData.giftCatalogs[0]?.hyperPersonalization === true);

      // console.log('[InitialData Effect] Determined hyperPersonalization:', hyperPersonalization);

      setFormData({
        giftType: initialData?.giftType || "",
        message: initialData?.message || "",
        templateId: initialData?.templateId || "",
        hyperPersonalization: !!hyperPersonalization,
      });

      // Set custom message and logo URL
      setCustomMessage(
        initialData?.customMessage || "We have reserved a special gift for you!"
      );
      setLogoUrl(initialData?.logoUrl || "/Logo Final.png");

      // Set gift selection mode based on hyperPersonalization
      setGiftSelectionMode(
        hyperPersonalization ? "hyper_personalize" : "manual"
      );

      // --- Selected Gift Restoration ---
      // Only reset selectedGift if there's no current selection or if nudgeId actually changed
      const selectedGiftId =
        initialData?.selectedGiftId ||
        initialData?.giftCatalogs?.[0]?.selectedGift;

      // Check if we should update the selected gift
      const shouldUpdateSelectedGift =
        !selectedGift || // No current selection
        (selectedGiftId && selectedGift._id !== selectedGiftId); // Different gift selected

      if (shouldUpdateSelectedGift && selectedGiftId && gifts.size > 0) {
        const gift = gifts.get(selectedGiftId);
        if (gift) {
          setSelectedGift(gift);
          setFormData((prev) => ({
            ...prev,
            giftType: gift._id,
          }));
        }
      } else if (!selectedGiftId && !selectedGift) {
        // Only clear if there's no selected gift and no data to restore
        setFormData((prev) => ({ ...prev, giftType: "" }));
      }

      // --- Template Data Restoration (Landing Page) ---
      const templateSource =
        initialData?.outcomeTemplate || initialData?.templateData;
      if (templateSource) {
        setTemplateData({
          type:
            (templateSource.type as
              | "template1"
              | "template2"
              | "template3"
              | "template4") || "template1",
          description: templateSource.description || "",
          date: templateSource.date ? new Date(templateSource.date) : null,
          videoLink: templateSource.videoLink || "",
          logoLink: (templateSource as any).logoLink || logoUrl,
          buttonText: templateSource.buttonText || "Select Gift",
          buttonLink: templateSource.buttonLink || "",
          mediaUrl: templateSource.mediaUrl || "",
        });

        setSelectedTemplateOutline({
          template1: templateSource.type === "template1",
          template2: templateSource.type === "template2",
          template3: templateSource.type === "template3",
          template4: templateSource.type === "template4",
        });
      }

      // --- Email Template Restoration ---
      if (initialData.emailTemplate) {
        setShowAddressConfirmation(
          !!initialData.emailTemplate.addressConfirmedEmail
        );
        setShowInTransit(!!initialData.emailTemplate.inTransitEmail);
        setEmailTemplate(
          initialData.emailTemplate.addressConfirmedEmail ||
            `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;\">\n      <img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" width=\"150\" height=\"40\" style=\"display: block; width: 150px; height: 40px; margin-bottom: 20px;\">\n      <p style=\"font-size: 18px; color: #333;\">Hi {{First Name}},</p>\n      <p style=\"font-size: 16px; color: #555;\">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you please confirm your preferred delivery address?</p>\n\n      <p><a href=\"{{Verification URL}}\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Confirm Your Address Here</a></p>\n\n      <p style=\"font-size: 16px; color: #555;\">Rest assured, your information will be kept confidential and used solely for this delivery.</p>\n      <p style=\"font-size: 16px; color: #555;\">Looking forward to delighting you!</p>\n\n\n      <p style=\"font-size: 16px; color: #555; margin-top: 20px;\">Best wishes,<br>The Delightloop Team</p>\n\n      <p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>\n      DelightLoop helps teams create meaningful connections that drive measurable results</p>\n      <p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n\n      <hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n      <p style=\"font-size: 12px; color: #888;\">© ${new Date().getFullYear()} Delightloop</p>\n    </div>`
        );
        setInTransitEmailTemplate(
          initialData.emailTemplate.inTransitEmail ||
            `<p style=\"font-size: 16px; color: #555;\">\n      We've got some delightful news — your gift is officially on its journey! ✨<br>\n      Someone thought of you, and now a little joy is headed your way.\n    </p>\n\n    <p style=\"font-size: 16px; color: #555;\">\n      We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.\n    </p>\n\n    <p style=\"font-size: 16px; color: #555;\">\n      Enjoy the unboxing —<br>\n      <strong>The DelightLoop Team</strong>\n    </p>`
        );
      } else {
        setShowAddressConfirmation(false);
        setShowInTransit(false);
        setEmailTemplate(
          `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;\">\n      <img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" width=\"150\" height=\"40\" style=\"display: block; width: 150px; height: 40px; margin-bottom: 20px;\">\n      <p style=\"font-size: 18px; color: #333;\">Hi {{First Name}},</p>\n      <p style=\"font-size: 16px; color: #555;\">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you please confirm your preferred delivery address?</p>\n\n      <p><a href=\"{{Verification URL}}\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Confirm Your Address Here</a></p>\n\n      <p style=\"font-size: 16px; color: #555;\">Rest assured, your information will be kept confidential and used solely for this delivery.</p>\n      <p style=\"font-size: 16px; color: #555;\">Looking forward to delighting you!</p>\n\n\n      <p style=\"font-size: 16px; color: #555; margin-top: 20px;\">Best wishes,<br>The Delightloop Team</p>\n\n      <p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>\n      DelightLoop helps teams create meaningful connections that drive measurable results</p>\n      <p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n\n      <hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n      <p style=\"font-size: 12px; color: #888;\">© ${new Date().getFullYear()} Delightloop</p>\n    </div>`
        );
        setInTransitEmailTemplate(
          `<p style=\"font-size: 16px; color: #555;\">\n      We've got some delightful news — your gift is officially on its journey! ✨<br>\n      Someone thought of you, and now a little joy is headed your way.\n    </p>\n\n    <p style=\"font-size: 16px; color: #555;\">\n      We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.\n    </p>\n\n    <p style=\"font-size: 16px; color: #555;\">\n      Enjoy the unboxing —<br>\n      <strong>The DelightLoop Team</strong>\n    </p>`
        );
      }
    }
  }, [initialData, gifts, nudgeId]);

  // --- FIX FOR ISSUE 1: Always fetch recipients when campaignId or nudgeId changes ---
  // Replace the existing fetchCampaignRecipients function with this improved version
  // Around line 300-330

  // --- FIX FOR ISSUE 1: Always fetch recipients when campaignId or nudgeId changes ---
  useEffect(() => {
    if (authToken && campaignId) {
      fetchCampaignRecipients();
    }
  }, [campaignId, nudgeId, authToken]);

  // --- Fetch event-based gift recommendations (SYNCED WITH RecipientExperience) ---
  // --- Enhance fetchEventGiftRecommendations to handle errors better ---
  const fetchEventGiftRecommendations = useCallback(
    async (maxBudgetToUse?: number) => {
      // console.log('[fetchEventGiftRecommendations] Starting with budget:', maxBudgetToUse);
      if (!eventId || !authToken) return;
      try {
        setIsLoadingEventGifts(true);
        setEventGiftError("");
        // Fetch event/campaign details to get maxBudget if needed
        let effectiveMaxBudget = numericMaxBudget;
        if (!effectiveMaxBudget || effectiveMaxBudget === 0) {
          // Fetch event details
          try {
            const eventRes = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (eventRes.ok) {
              const eventData = await eventRes.json();
              // Try event's own budget
              effectiveMaxBudget = eventData.event?.budget?.maxPerGift || 0;
              // If event has campaignIds, fetch the campaign
              const campaignIdFromEvent = eventData.event?.campaignIds?.[0];
              if (campaignIdFromEvent) {
                const campaignRes = await fetch(
                  `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignIdFromEvent}`,
                  { headers: { Authorization: `Bearer ${authToken}` } }
                );
                if (campaignRes.ok) {
                  const campaignData = await campaignRes.json();
                  effectiveMaxBudget =
                    campaignData.campaign?.budget?.maxPerGift ||
                    effectiveMaxBudget;
                }
              }
            }
          } catch (err) {
            // Ignore, fallback below
          }
          // Fallback to a default if still 0
          if (!effectiveMaxBudget || effectiveMaxBudget === 0) {
            effectiveMaxBudget = 100;
          }
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/gift-recommendation/event-based`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventId: eventId,
              giftingContext: {
                maxBudget: maxBudgetToUse || effectiveMaxBudget,
                bundleIds: ["67ce2054e04f14d6638c7b6c"],
              },
            }),
          }
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch gift recommendations: ${response.status}`
          );
        }
        const responseData = await response.json();
        // console.log('[fetchEventGiftRecommendations] Response:', responseData);
        const giftData = responseData.data || [];
        const transformedGifts = giftData.map((gift: any) => ({
          _id: gift.giftId,
          name: gift.name,
          price: gift.price,
          descShort: gift.descShort || "",
          rationale: gift.rationale || "",
          confidence: gift.confidence,
          sku: gift.sku,
          images: {
            primaryImgUrl: gift.primaryImgUrl || "",
          },
        }));
        // Save to localStorage
        localStorage.setItem(
          `event_gifts_${eventId}`,
          JSON.stringify(transformedGifts)
        );
        setEventGifts(transformedGifts);
        setHasFetched(true);
      } catch (error) {
        console.error("Error in fetchEventGiftRecommendations:", error);
        setEventGiftError(
          error instanceof Error ? error.message : "Failed to fetch"
        );
        // Try to load from localStorage as fallback
        try {
          const storedGifts = localStorage.getItem(`event_gifts_${eventId}`);
          if (storedGifts) {
            setEventGifts(JSON.parse(storedGifts));
            setHasFetched(true);
          }
        } catch (e) {
          console.error("Error loading from localStorage:", e);
        }
      } finally {
        setIsLoadingEventGifts(false);
      }
    },
    [eventId, numericMaxBudget, authToken, organizationId]
  );

  // --- Check if all recipients have LinkedIn URLs (SYNCED) ---
  const fetchCampaignRecipients = async () => {
    // console.log('[fetchCampaignRecipients] Starting fetch for campaign:', campaignId);
    if (!campaignId || !authToken) return;
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
      // console.log('[fetchCampaignRecipients] Response:', data);
      if (data.success && Array.isArray(data.data)) {
        const allHaveLinkedinUrl = data.data.every(
          (recipient: any) =>
            recipient.linkedinUrl && recipient.linkedinUrl.trim() !== ""
        );
        // Instead of using setAllRecipientsHaveLinkedin, we'll return the value
        // since it's passed as a prop
        // console.log('[fetchCampaignRecipients] All recipients have LinkedIn:', allHaveLinkedinUrl);
        return allHaveLinkedinUrl;
      }
      return false;
    } catch (error) {
      console.error("[fetchCampaignRecipients] Error:", error);
      return false;
    }
  };

  // --- useEffect to load campaign data and fetch recommendations (SYNCED) ---
  useEffect(() => {
    const loadCampaignData = async () => {
      // console.log('[loadCampaignData] Starting campaign data load');
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
          // console.log('[loadCampaignData] Campaign data received:', campaignData);
          const campaign = campaignData.campaign;
          const effectiveMaxBudget =
            numericMaxBudget === 0
              ? campaign?.budget?.maxPerGift || 0
              : numericMaxBudget;

          // console.log('[loadCampaignData] Effective max budget:', effectiveMaxBudget);
          await fetchEventGiftRecommendations(effectiveMaxBudget);

          if (campaign?.giftSelectionMode) {
            setGiftSelectionMode(campaign.giftSelectionMode);
            setFormData((prev) => ({
              ...prev,
              hyperPersonalization:
                campaign.giftSelectionMode === "hyper_personalize",
            }));
          }
        }
      } catch (error) {
        console.error("[loadCampaignData] Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authToken && organizationId && campaignId) {
      loadCampaignData();
      fetchCampaignRecipients();
    }
  }, [
    campaignId,
    organizationId,
    authToken,
    numericMaxBudget,
    fetchEventGiftRecommendations,
  ]);

  // --- Load gift data from localStorage or fetch if needed ---
  useEffect(() => {
    if (!eventId || !authToken) return;

    const storageKey = `event_gifts_${eventId}`;
    const loadGifts = async () => {
      try {
        // Try to load from localStorage first
        const storedGifts = localStorage.getItem(storageKey);
        if (storedGifts) {
          const parsedGifts = JSON.parse(storedGifts);
          setEventGifts(parsedGifts);
          setHasFetched(true);
        } else if (!hasFetched) {
          // If no stored gifts and we haven't fetched yet, trigger a fetch
          await fetchEventGiftRecommendations();
        }
      } catch (localStorageError) {
        console.error("Error reading from localStorage:", localStorageError);
      }
    };

    loadGifts();
  }, [eventId, authToken, hasFetched, fetchEventGiftRecommendations]);

  // --- Fetch bundles and gifts ---
  useEffect(() => {
    const fetchBundles = async () => {
      // console.log('[fetchBundles] Starting bundle fetch');
      try {
        setIsLoading(true);
        const response = await fetch("/api/bundles");
        const data = await response.json();
        // console.log('[fetchBundles] Response:', data);
        if (data.bundles && Array.isArray(data.bundles)) {
          const availableBundles = data.bundles.filter(
            (bundle: Bundle) => bundle.isAvailable
          );
          setBundles(availableBundles);
          // console.log('[fetchBundles] Available bundles:', availableBundles.length);
          const allGiftIds = new Set<string>();
          availableBundles.forEach((bundle: Bundle) => {
            bundle.giftsList.forEach(({ giftId }) => {
              if (giftId) allGiftIds.add(giftId);
            });
          });
          const giftPromises = Array.from(allGiftIds).map((giftId) =>
            fetchGiftDetails(giftId)
          );
          await Promise.all(giftPromises);
        }
      } catch (error) {
        console.error("[fetchBundles] Error:", error);
        setError("Failed to load gift options. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundles();
  }, []);

  // --- Fetch gift details ---
  const fetchGiftDetails = async (giftId: string) => {
    // console.log('[fetchGiftDetails] Fetching gift:', giftId);
    if (!giftId) return null;
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      const giftData = await response.json();
      // console.log('[fetchGiftDetails] Gift data received:', giftData._id);
      setGifts((prev) => {
        const newMap = new Map(prev);
        newMap.set(giftId, giftData);
        return newMap;
      });
      return giftData;
    } catch (error) {
      console.error(`[fetchGiftDetails] Error fetching gift ${giftId}:`, error);
    }
    return null;
  };

  // --- Update allGifts when gifts map changes ---
  useEffect(() => {
    if (gifts.size > 0) {
      // console.log('[Effect] Gifts map updated. Total gifts:', gifts.size);
      const giftArray = Array.from(gifts.values());
      setAllGifts(giftArray);
      if (selectedGift) {
        const updatedGift = gifts.get(selectedGift._id);
        if (updatedGift) {
          // console.log('[Effect] Updating selected gift with latest data');
          setSelectedGift(updatedGift);
        }
      }
    }
  }, [gifts]);

  // --- Update items per row based on carousel container size ---
  useEffect(() => {
    function updateItemsPerRow() {
      let width = 0;
      if (carouselContainerRef.current) {
        width = carouselContainerRef.current.offsetWidth;
      } else {
        width = window.innerWidth;
      }
      // Each card is ~190px wide including gap
      const perRow = Math.max(1, Math.floor(width / 190));
      setItemsPerRow(perRow);
    }
    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, []);

  // --- Process the initial gift selection if provided ---
  useEffect(() => {
    if (initialData?.selectedGiftId && gifts.size > 0) {
      const gift = gifts.get(initialData.selectedGiftId);
      if (gift) setSelectedGift(gift);
    }
  }, [initialData, gifts]);

  // --- Update giftSelectionMode when hyperPersonalization changes ---
  useEffect(() => {
    const mode = formData.hyperPersonalization ? "hyper_personalize" : "manual";
    setGiftSelectionMode(mode);
  }, [formData.hyperPersonalization]);

  // --- Handle gift selection ---
  const handleGiftSelection = (gift: Gift) => {
    // console.log('[handleGiftSelection] Gift selected:', gift);
    setSelectedGift(gift);
    setFormData({ ...formData, giftType: gift._id });
    if (errors.giftType) {
      setErrors({ ...errors, giftType: "" });
    }
    setTimeout(() => {
      messageSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    setShowCatalog(false);
  };

  // --- Handle template selection ---
  const handleTemplateSelection = (templateId: string) => {
    // console.log('[handleTemplateSelection] Template selected:', templateId);
    setFormData({ ...formData, templateId });
  };

  // --- Validate form ---
  const validateForm = () => {
    // console.log('[validateForm] Starting form validation');
    const newErrors = {
      giftType: formData.giftType ? "" : "Please select a gift type",
    };

    // Only require gift selection if hyper-personalization is false
    if (!formData.hyperPersonalization && !formData.giftType) {
      // console.log('[validateForm] Gift type validation failed');
      newErrors.giftType = "Please select a gift";
    }

    setErrors(newErrors);
    const isValid = !Object.values(newErrors).some((error) => error !== "");
    // console.log('[validateForm] Validation result:', isValid);
    return isValid;
  };

  // --- Enhance handleSaveNudge to ensure all data is properly saved ---
  const handleSaveNudge = async () => {
    console.log("[handleSaveNudge] Starting save process");
    setSubmitLoading(true);

    try {
      let selectedGiftForSave = selectedGift;
      let giftTypeForSave = formData.giftType;

      // If hyper-personalization is enabled, fetch recommendations
      if (formData.hyperPersonalization) {
        try {
          // Get effective budget
          let effectiveMaxBudget = numericMaxBudget;
          if (!effectiveMaxBudget || effectiveMaxBudget === 0) {
            const eventRes = await fetch(
              `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (eventRes.ok) {
              const eventData = await eventRes.json();
              effectiveMaxBudget = eventData.event?.budget?.maxPerGift || 100; // Default to 100 if no budget
            }
          }

          // Fetch gift recommendations
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/gift-recommendation/event-based`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                eventId: eventId,
                giftingContext: {
                  maxBudget: effectiveMaxBudget,
                  bundleIds: ["67ce2054e04f14d6638c7b6c"],
                },
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch gift recommendations");
          }

          const recommendationData = await response.json();
          console.log(
            "[handleSaveNudge] Recommendation data:",
            recommendationData
          );

          // Select the first recommended gift
          if (
            recommendationData.success &&
            recommendationData.data.length > 0
          ) {
            // Get a random index between 0 and the length of recommendations
            const randomIndex = Math.floor(
              Math.random() * recommendationData.data.length
            );
            // Use the random index to select a gift
            const randomGift = recommendationData.data[randomIndex];

            selectedGiftForSave = {
              _id: randomGift.giftId,
              name: randomGift.name,
              price: randomGift.price || 0,
              descShort: randomGift.descShort,
              images: {
                primaryImgUrl: randomGift.primaryImgUrl,
              },
              sku: randomGift.sku,
              rationale: randomGift.rationale,
              confidence_score: randomGift.confidence.toString(),
            };
            giftTypeForSave = randomGift.giftId;

            // Add logging to track random selection
            console.log("[handleSaveNudge] Randomly selected gift:", {
              index: randomIndex,
              totalGifts: recommendationData.data.length,
              selectedGift: randomGift.name,
            });
          } else {
            throw new Error("No gift recommendations available");
          }
        } catch (error) {
          console.error("Error fetching gift recommendations:", error);
          setError("Failed to fetch gift recommendations. Please try again.");
          setSubmitLoading(false);
          return;
        }
      } else {
        // For manual mode, validate form
        if (!validateForm()) {
          console.log("[handleSaveNudge] Form validation failed");
          setSubmitLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // Prepare the nudge data with either manual or AI-recommended gift
      const nudgeData = {
        type: "physical-nudge",
        displayType: "physical-nudge",
        category: "physical-nudge",
        channel: "gift",
        giftType: formData.hyperPersonalization ? "ai" : "manual",
        message: selectedGiftForSave?.name || "We have a special gift for you!",
        customMessage:
          customMessage || "We have reserved a special gift for you!",
        templateId: templateData.type || "template1",
        logoUrl: logoUrl || "/Logo Final.png",
        selectedGiftId: selectedGiftForSave?._id || null,
        giftCatalogs: [
          {
            catalogId: "67ce2054e04f14d6638c7b6c",
            selectedGift: selectedGiftForSave?._id || null,
            hyperPersonalization: formData.hyperPersonalization,
          },
        ],
        giftSelectionMode: giftSelectionMode,
        outcomeTemplate: {
          type: templateData.type || "",
          description: templateData.description || "",
          date: templateData.date || new Date().toISOString(),
          videoLink: templateData.videoLink || "",
          logoLink: logoUrl || "",
          buttonText: templateData.buttonText || "Select Gift",
          buttonLink: templateData.buttonLink || "",
          mediaUrl: templateData.mediaUrl || "",
        },
        outcomeCard: {
          message: customMessage || "",
          logoLink: logoUrl || "",
        },
        emailTemplate: {
          addressConfirmedEmail: showAddressConfirmation
            ? emailTemplate
            : undefined,
          inTransitEmail: showInTransit ? inTransitEmailTemplate : undefined,
        },
      };

      // Save the nudge
      await onSave(nudgeData);

      // Update UI state after successful save - preserve selected gift for both manual and AI modes
      if (selectedGiftForSave) {
        setSelectedGift(selectedGiftForSave);
        setFormData((prev) => ({ ...prev, giftType: giftTypeForSave }));
        console.log(
          "[handleSaveNudge] Preserved selected gift after save:",
          selectedGiftForSave.name
        );
      }

      setTimeout(() => {
        setSubmitLoading(false);
      }, 1200);
    } catch (error) {
      console.error("Error saving physical nudge:", error);
      setError("Failed to save physical nudge. Please try again.");
      setSubmitLoading(false);
    }
  };

  // --- Handle price change in catalog ---
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    const isMin = e.target.id === "min-price";
    if (isMin) {
      setPriceRange([value, priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], value]);
    }
  };

  // --- Move carousel ---
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

  // --- Filter gifts based on search, category, and price ---
  const filteredGifts = allGifts.filter((gift) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gift.descShort &&
        gift.descShort.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by category
    const matchesCategory =
      categoryFilter === "all" ||
      (gift.category &&
        gift.category.toLowerCase() === categoryFilter.toLowerCase());

    // Filter by price range
    const matchesPrice =
      gift.price >= priceRange[0] && gift.price <= priceRange[1];

    // If max budget is set, only show gifts within budget
    const withinBudget =
      numericMaxBudget > 0 ? gift.price <= numericMaxBudget : true;

    return matchesSearch && matchesCategory && matchesPrice && withinBudget;
  });

  const firstRowGifts = filteredGifts.filter((_, idx) => idx % 2 === 0);
  const secondRowGifts = filteredGifts.filter((_, idx) => idx % 2 === 1);

  // --- Improve template selection to ensure proper data loading ---
  const handleTemplateCardClick = (templateKey: string) => {
    setSelectedTemplate({
      template1: templateKey === "template1",
      template2: templateKey === "template2",
      template3: templateKey === "template3",
      template4: templateKey === "template4",
    });
    setSelectedTemplateOutline({
      template1: templateKey === "template1",
      template2: templateKey === "template2",
      template3: templateKey === "template3",
      template4: templateKey === "template4",
    });

    // Use existing data for the template if available
    const existingData = templateDataMap[templateKey];
    setTemplateData((prev) => ({
      ...prev,
      type: templateKey as any,
      description: existingData?.description || "",
      videoLink: existingData?.videoLink || "",
      logoLink: existingData?.logoLink || logoUrl, // Use current logoUrl as fallback
      buttonLink: existingData?.buttonLink || "",
      buttonText: existingData?.buttonText || "Select Gift",
      date: existingData?.date || new Date(),
      mediaUrl: existingData?.mediaUrl || "",
    }));

    setFormData({ ...formData, templateId: templateKey });
    setInitialLogoLinkForTemplateModal(logoUrl); // Always set to current logoUrl
  };

  // --- Handle template data change ---
  const handleTemplateDataChange = (newData: any) => {
    // console.log('[handleTemplateDataChange] New template data:', newData);
    // Save the data to our map
    setTemplateDataMap((prev) => ({
      ...prev,
      [newData.type]: {
        description: newData.description,
        videoLink: newData.videoLink,
        logoLink: newData.logoLink,
        buttonLink: newData.buttonLink,
        date: newData.date,
        buttonText: newData.buttonText,
        mediaUrl: newData.mediaUrl,
      },
    }));

    // Update the template data
    setTemplateData(newData);

    // Sync logo URL if it's updated in the template modal
    if (newData.logoLink && newData.logoLink !== logoUrl) {
      setLogoUrl(newData.logoLink);
    }
  };

  // --- Handle save email template ---
  const handleSaveEmailTemplate = async () => {
    // console.log('[handleSaveEmailTemplate] Starting save');
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
      // console.log('[handleSaveEmailTemplate] Save response:', response.ok);

      if (!response.ok) {
        throw new Error("Failed to save email template");
      }
    } catch (error) {
      console.error("Error saving email template:", error);
    }
  };

  // --- Handle save in-transit email template ---
  const handleSaveInTransitEmailTemplate = async () => {
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
    } catch (error) {
      console.error("Error saving in-transit email template:", error);
    }
  };

  // --- Handle retry gift fetch ---
  const handleRetryGiftFetch = async () => {
    // console.log('[handleRetryGiftFetch] Starting retry');
    try {
      localStorage.removeItem(`event_gifts_${eventId}`);
      const campaignResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        // console.log('[handleRetryGiftFetch] Campaign data received:', campaignData);
        const campaign = campaignData.campaign;
        const effectiveMaxBudget =
          numericMaxBudget === 0
            ? campaign.budget?.maxPerGift || 0
            : numericMaxBudget;
        await fetchEventGiftRecommendations(effectiveMaxBudget);
      }
    } catch (error) {
      console.error("[handleRetryGiftFetch] Error:", error);
      setEventGiftError("Failed to retry fetching gifts");
    }
  };

  // --- Animation variants ---
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

  // Template options
  const TEMPLATE_OPTIONS = [
    {
      key: "template1",
      name: "Highlight Reel",
      description: "Show the best of what you offer in one short video.",
      image: "/partner-integrations/template1.png",
      accent: "from-[#ECFCFF] to-[#E8C2FF]",
    },
    {
      key: "template2",
      name: "Webinar Seat",
      description: "Professional, event-focused landing",
      image: "/partner-integrations/template2.png",
      accent: "from-[#E0EAFF] to-[#B6E0FE]",
    },
    {
      key: "template3",
      name: "Insight Report",
      description: "Minimal, report download experience",
      image: "/partner-integrations/template3.png",
      accent: "from-[#FDF2FA] to-[#F8E1F4]",
    },
    {
      key: "template4",
      name: "Book a Meeting",
      description: "Direct CTA for meetings or demos",
      image: "/partner-integrations/template4.png",
      accent: "from-[#F1FDF7] to-[#D1FADF]",
    },
  ];

  // --- Ensure selected gift is in recommended cards ---
  useEffect(() => {
    // Only run if eventGifts are loaded and initialData.selectedGiftId is present
    if (eventGifts && eventGifts.length > 0 && initialData?.selectedGiftId) {
      const found = eventGifts.find(
        (g) => g._id === initialData.selectedGiftId
      );
      if (found) {
        setSelectedGift(found);
        setFormData((prev) => ({ ...prev, giftType: found._id }));
      } else if (
        initialData.selectedGiftId &&
        typeof initialData.selectedGift === "object" &&
        initialData.selectedGift !== null
      ) {
        // If the backend's selectedGift is not in eventGifts, use the backend's saved gift as a custom card
        setSelectedGift(initialData.selectedGift);
        setFormData((prev) => ({
          ...prev,
          giftType: String(initialData.selectedGiftId),
        }));
      } else {
        setSelectedGift(null);
        setFormData((prev) => ({ ...prev, giftType: "" }));
      }
    }
    // If no selectedGiftId, do not auto-select any card
  }, [eventGifts, initialData?.selectedGiftId, initialData?.selectedGift]);

  // --- Define recommendedGifts before JSX render ---
  const recommendedGifts = Array.isArray(eventGifts)
    ? eventGifts.slice(0, 3)
    : [];

  // --- Ensure selected gift is always restored from backend when switching tabs ---
  useEffect(() => {
    if (initialData?.selectedGiftId) {
      // First try to find in eventGifts (AI recommendations)
      let found = eventGifts.find((g) => g._id === initialData.selectedGiftId);

      // If not found in eventGifts, try allGifts (manual selection from bundles)
      if (!found) {
        found = allGifts.find((g) => g._id === initialData.selectedGiftId);
      }

      if (found) {
        setSelectedGift(found);
        setFormData((prev) => ({ ...prev, giftType: found._id }));
      } else {
        // Only clear if we have both gift arrays loaded and still can't find it
        if (eventGifts.length > 0 && allGifts.length > 0) {
          setSelectedGift(null);
          setFormData((prev) => ({ ...prev, giftType: "" }));
        }
      }
    } else if (eventGifts.length > 0 && allGifts.length > 0) {
      // Only clear if both arrays are loaded
      setSelectedGift(null);
      setFormData((prev) => ({ ...prev, giftType: "" }));
    }
  }, [initialData?.selectedGiftId, eventGifts, allGifts]);

  // Add console logs for state updates
  useEffect(() => {
    // console.log('[Effect] Selected gift updated:', selectedGift);
  }, [selectedGift]);

  useEffect(() => {
    // console.log('[Effect] Form data updated:', formData);
  }, [formData]);

  useEffect(() => {
    // console.log('[Effect] Template data updated:', templateData);
  }, [templateData]);

  // Add console logs for error handling
  useEffect(() => {
    if (error) {
      console.error("[Error State] Application error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (eventGiftError) {
      console.error("[Error State] Event gift error:", eventGiftError);
    }
  }, [eventGiftError]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          onClick={() => setError(null)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-[calc(100vh-200px)]">
      <div className="p-6">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recipients Experience
          </h2>
          <p className="text-gray-600">
            Customize the gifting experience for your recipients.
          </p>
        </div>

        <div className="space-y-16">
          {/* Step 1: Gift Selection */}
          <div
            ref={giftSectionRef}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-medium mb-4">1. Select Gift Type</h3>
            {errors.giftType && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.giftType}
              </div>
            )}

            {/* Hyper-personalization Toggle */}
            <div className="flex relative items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 w-1/2">
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
                  formData.hyperPersonalization ? "bg-primary" : "bg-gray-200"
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                onClick={() => {
                  // Simply update the form data and gift selection mode
                  setFormData((prev) => ({
                    ...prev,
                    hyperPersonalization: !prev.hyperPersonalization,
                  }));
                  setGiftSelectionMode(
                    !formData.hyperPersonalization
                      ? "hyper_personalize"
                      : "manual"
                  );
                  // Clear selected gift when switching to hyper-personalization
                  if (!formData.hyperPersonalization) {
                    setSelectedGift(null);
                    setFormData((prev) => ({ ...prev, giftType: "" }));
                  }
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

            <h4 className="text-md font-medium mb-3 text-gray-700">
              Recommended for you
            </h4>

            {isLoadingEventGifts ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="relative w-24 h-24 mb-6">
                  <InfinityLoader width={56} height={56} />
                </div>
                <p className="text-gray-500 text-center max-w-md">
                  Loading recommended gifts...
                </p>
              </div>
            ) : eventGiftError ? (
              <div className="col-span-3 p-4 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium mb-2">
                  Error loading gift recommendations
                </p>
                <p className="text-sm">{eventGiftError}</p>
                <button
                  onClick={handleRetryGiftFetch}
                  className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`absolute top-0 left-0 w-full h-full bg-white/50 flex items-center justify-center z-10 ${
                    giftSelectionMode !== "manual" ? "block" : "hidden"
                  }`}
                />
                {/* Show only first 3 gifts from API response */}
                {recommendedGifts.map((gift, idx) => (
                  <motion.div
                    key={gift._id}
                    className={`rounded-lg border-2 ${
                      selectedGift?._id === gift._id
                        ? "border-primary"
                        : "border-gray-200"
                    } bg-white overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all`}
                    variants={cardMotion}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    custom={idx}
                    onClick={() => {
                      setSelectedGift(gift);
                      setFormData({ ...formData, giftType: gift._id });
                      if (errors.giftType) {
                        setErrors({ ...errors, giftType: "" });
                      }
                    }}
                  >
                    <div className="h-40 bg-gray-100 relative">
                      {gift.images?.primaryImgUrl ? (
                        <Image
                          src={gift.images.primaryImgUrl || "/placeholder.svg"}
                          alt={gift.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {gift.name}
                      </h4>
                      <p className="text-sm text-primary font-medium">
                        ${gift.price}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {gift.descShort || "No description available."}
                      </p>
                      {gift.rationale && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {gift.rationale}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Browse Catalog card */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="border border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center p-8 h-full"
                  onClick={() => setShowCatalog(true)}
                >
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-500"
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
                  <h4 className="font-medium text-gray-700 mb-1">
                    Browse Catalog
                  </h4>
                  <p className="text-sm text-gray-500 text-center">
                    Find more gift options
                  </p>
                </motion.div>
              </div>
            )}

            {/* Selected Gift Display */}
            {selectedGift && (
              <div className="mt-6 border border-primary/20 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-center">
                  <div className="flex-shrink-0 bg-white rounded-lg border border-gray-100 shadow-sm p-2 mr-4 relative w-[100px] h-[100px]">
                    <Image
                      src={
                        selectedGift.images?.primaryImgUrl || "/placeholder.jpg"
                      }
                      alt={selectedGift.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        className="h-5 w-5 text-primary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h4 className="text-primary font-semibold">
                        Selected Gift
                      </h4>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900 font-medium text-lg">
                          {selectedGift.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {selectedGift.descShort}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        ${selectedGift.price}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCatalog(true)}
                    className="ml-4 flex items-center justify-center p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <div className="bg-primary/10 px-4 py-2 flex justify-between items-center border-t border-primary/20">
                  <p className="text-xs text-primary/80">
                    This gift will be sent to all recipients in this campaign
                  </p>
                  <button
                    onClick={() => setShowCatalog(true)}
                    className="text-xs font-medium text-primary flex items-center hover:underline"
                  >
                    Change selection
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 ml-1"
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
              </div>
            )}

            {showCatalog && (
              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-700">
                    Gift Catalog
                  </h4>
                  <button
                    onClick={() => setShowCatalog(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 inline-block"
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
                    Close
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Price Range
                      </h5>
                      <div className="flex items-center space-x-4">
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
                            max="500"
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
                            max="500"
                            value={priceRange[1]}
                            onChange={handlePriceChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="hidden">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Gift Category
                      </h5>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="branded">Branded Items</option>
                        <option value="gourmet">Gourmet & Food</option>
                        <option value="electronics">Electronics</option>
                        <option value="charity">Charity</option>
                        <option value="wellness">Wellness</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}

                {!isLoading && filteredGifts.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 12H4M8.5 8l-4 4 4 4M15.5 4l4 4-4 4"
                      />
                    </svg>
                    <h5 className="text-gray-600 font-medium mb-2">
                      No gifts match your filters
                    </h5>
                    <p className="text-gray-500 text-sm">
                      Try adjusting your price range or category
                    </p>
                  </div>
                )}

                {/* First row carousel */}
                {!isLoading && firstRowGifts.length > 0 && (
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2"></div>
                    <div
                      className="relative overflow-x-auto min-w-[100%] max-w-full sm:max-w-screen-md mx-auto scrollbar-hide"
                      ref={carouselContainerRef}
                    >
                      <motion.div
                        className="flex gap-2 py-1"
                        style={{
                          WebkitOverflowScrolling: "touch",
                          transform: `translateX(-${
                            Math.min(
                              carouselPosition[0],
                              Math.max(0, firstRowGifts.length - itemsPerRow)
                            ) * 190
                          }px)`,
                          transition: "transform 0.5s ease-in-out",
                        }}
                        initial={false}
                        variants={carouselVariants}
                        animate="visible"
                      >
                        <AnimatePresence>
                          {firstRowGifts.map((gift, index) => (
                            <motion.div
                              key={gift._id}
                              custom={index}
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
                      formData.giftType === gift._id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-primary/30"
                    }`}
                                onClick={() => {
                                  handleGiftSelection(gift);
                                }}
                              >
                                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                  {gift.images?.primaryImgUrl ? (
                                    <div className="w-full h-full relative">
                                      <Image
                                        src={
                                          gift.images.primaryImgUrl ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                        alt={gift.name}
                                        fill
                                        className="object-contain transition-transform duration-400 group-hover:scale-110"
                                      />
                                      <div className="absolute inset-0 pointer-events-none rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-300" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                      <span className="text-gray-400 text-xs">
                                        {gift.name}
                                      </span>
                                    </div>
                                  )}
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
                                  {formData.giftType === gift._id && (
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
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Navigation Arrows - Positioned at left and right sides */}
                {!isLoading && filteredGifts.length > 0 && (
                  <div className="relative my-2 h-8">
                    <button
                      onClick={() => moveCarousel(-1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      aria-label="Previous gifts"
                      disabled={carouselPosition[0] === 0}
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
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      aria-label="Next gifts"
                      disabled={
                        carouselPosition[0] >=
                          Math.max(0, firstRowGifts.length - itemsPerRow) ||
                        carouselPosition[1] >=
                          Math.max(0, secondRowGifts.length - itemsPerRow)
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
                {!isLoading && secondRowGifts.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2"></div>
                    <div
                      className="relative overflow-x-auto min-w-[100%] max-w-full sm:max-w-screen-md mx-auto scrollbar-hide"
                      ref={carouselContainerRef}
                    >
                      <motion.div
                        className="flex gap-2 py-1"
                        style={{
                          WebkitOverflowScrolling: "touch",
                          transform: `translateX(-${
                            Math.min(
                              carouselPosition[1],
                              Math.max(0, secondRowGifts.length - itemsPerRow)
                            ) * 190
                          }px)`,
                          transition: "transform 0.5s ease-in-out",
                        }}
                        initial={false}
                        variants={carouselVariants}
                        animate="visible"
                      >
                        <AnimatePresence>
                          {secondRowGifts.map((gift, index) => (
                            <motion.div
                              key={gift._id}
                              custom={index}
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
                      formData.giftType === gift._id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-primary/30"
                    }`}
                                onClick={() => {
                                  handleGiftSelection(gift);
                                }}
                              >
                                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                  {gift.images?.primaryImgUrl ? (
                                    <div className="w-full h-full relative">
                                      <Image
                                        src={
                                          gift.images.primaryImgUrl ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                        alt={gift.name}
                                        fill
                                        className="object-contain transition-transform duration-400 group-hover:scale-110"
                                      />
                                      <div className="absolute inset-0 pointer-events-none rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-300" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                      <span className="text-gray-400 text-xs">
                                        {gift.name}
                                      </span>
                                    </div>
                                  )}
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
                                  {formData.giftType === gift._id && (
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
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>
                )}

                <style jsx global>{`
                  .scrollbar-hide {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  }
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Step 2: Craft Your Gift Message */}
          <div
            ref={messageSectionRef}
            className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-opacity duration-300 ${
              !formData.giftType && giftSelectionMode === "manual"
                ? "opacity-50"
                : "opacity-100"
            }`}
          >
            <h3 className="text-lg font-medium mb-4">
              2. Craft Your Gift Message
            </h3>
            <p className="text-gray-600 mb-4">
              This message will be printed on a physical postcard inside the
              gift box — the first thing your recipient reads.
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
            ref={templateSectionRef}
            className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-opacity duration-300 ${
              !formData.giftType && giftSelectionMode === "manual"
                ? "opacity-50"
                : "opacity-100"
            }`}
          >
            <h3 className="text-lg font-medium mb-4">3. Choose Landing Page</h3>
            <p className="text-gray-600 mb-4">
              After scanning the QR code on the postcard, your recipient will
              land on a personalized page. Select the goal you want to drive —
              and customize the content if needed.
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
                    onClick={() => handleTemplateCardClick(template.key)}
                  >
                    <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
                      <Image
                        src={template.image || "/placeholder.svg"}
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
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Remove the Customize Landing Page button as it's now handled by clicking on the template cards */}

            {(selectedTemplate.template1 ||
              selectedTemplate.template2 ||
              selectedTemplate.template3 ||
              selectedTemplate.template4) && (
              <Portal>
                <div className="fixed inset-0 z-[9999] isolate">
                  <TemplateModal
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    onTemplateDataChange={handleTemplateDataChange}
                    initialLogoLink={logoUrl}
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
          </div>

          {/* Step 4: Choose Mail Templates */}
          <div
            ref={emailSectionRef}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-medium mb-4">
              4. Choose Mail Templates
            </h3>
            <p className="text-gray-600 mb-4">
              Select templates for your gift emails. These emails will be sent
              to recipients at different stages.
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
                  This email will be sent when requesting the recipient's
                  address.
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
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2"
                    >
                      Save Template
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
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12">
          <button
            type="button"
            onClick={handleSaveNudge}
            className={`px-5 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center ${
              submitLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                <span>
                  {formData.hyperPersonalization
                    ? "Fetching recommendations..."
                    : "Saving..."}
                </span>
              </div>
            ) : (
              <>Save</>
            )}
          </button>
        </div>

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
    </ScrollArea>
  );
};

export default PhysicalNudgeExperience;
