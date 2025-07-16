"use client";

import { useState, useEffect, useRef } from 'react';
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface EditableCardPreviewProps {
  customMessage: string;
  setCustomMessage?: (message: string) => void;
  logoUrl: string;
  setLogoUrl?: (url: string) => void;
  editable?: boolean;
  qrImage?: string; // Optional base64 QR code image
  recipientName?: string; // Optional recipient name
}

/* ------------------------------------------------------------------
   EditableCardPreview Component

   This component replicates the complete postcard design from
   /app/public-QR/page.tsx by drawing a static background using a
   hidden canvas. It renders the striped border, vertical dotted divider,
   postmark infinity (with its wavy dotted line), and the QR code (from
   /img/RealQRcode.png) with its label and dotted line.

   Dynamic overlays for greeting, custom message and logo are rendered
   on top. The custom message and logo areas are inline editable when
   the editable prop is true.
--------------------------------------------------------------------- */
export const EditableCardPreview: React.FC<EditableCardPreviewProps> = ({
  customMessage,
  setCustomMessage,
  logoUrl,
  setLogoUrl,
  editable = true,
  qrImage,
  recipientName,
}) => {
  // Dynamic overlay states
  // Use provided recipientName or default placeholder
  const displayRecipientName = recipientName || "{{Recipient Name}}";

  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(customMessage);

  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogo, setTempLogo] = useState(logoUrl);

  // State to hold the background design image from canvas.
  const [templateImage, setTemplateImage] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update temp values when props change
  useEffect(() => {
    setTempMessage(customMessage);
    setTempLogo(logoUrl);
  }, [customMessage, logoUrl]);

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
      ctx.lineTo(
        canvas.width - borderWidth,
        y + stripeWidth * 2 - borderWidth
      );
      ctx.lineTo(canvas.width - borderWidth, y + stripeWidth - borderWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lightPurple;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y + stripeWidth * 2);
      ctx.lineTo(canvas.width, y + stripeWidth * 3);
      ctx.lineTo(
        canvas.width - borderWidth,
        y + stripeWidth * 3 - borderWidth
      );
      ctx.lineTo(
        canvas.width - borderWidth,
        y + stripeWidth * 2 - borderWidth
      );
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(canvas.width, y + stripeWidth * 3);
      ctx.lineTo(canvas.width, y + stripeWidth * 4);
      ctx.lineTo(
        canvas.width - borderWidth,
        y + stripeWidth * 4 - borderWidth
      );
      ctx.lineTo(
        canvas.width - borderWidth,
        y + stripeWidth * 3 - borderWidth
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw vertical dotted divider
    const contentY = borderWidth + 20;
    ctx.strokeStyle = lightPurple;
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
      const qrSize = 220;
      const qrX = canvas.width * 0.72;
      const qrY = canvas.height * 0.5 + 30;

      // Draw QR code placeholder
      ctx.fillStyle = "#F4EBFF";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      // We'll now use a real image in the rendered component instead
      // of trying to draw it on the canvas - this is more reliable

      // QR code label text
      ctx.font = `18px ${poppins.style.fontFamily}`;
      ctx.fillStyle = "#000";
      const labelText = "Scan for a Special Message!";
      const labelWidth = ctx.measureText(labelText).width;
      const labelX = qrX + (qrSize - labelWidth) / 2;
      ctx.fillText(labelText, labelX, qrY - 40);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(qrX, qrY - 20);
      ctx.lineTo(qrX + qrSize, qrY - 20);
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

      {/* Add QR code image directly in the component */}
      <div 
        style={{
          position: "absolute",
          right: "58px",
          top: "215px",
          width: "110px",
          height: "110px",
        }}
      >
        <img 
          src={qrImage && qrImage !== "" ? qrImage : "/img/RealQRcode.png"}
          alt="QR Code" 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      </div>

      {/* Overlay: Greeting text */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "50px",
          width: "300px",
          fontSize: "16px",
          color: "#000",
          fontWeight: "normal",
          textAlign: "left",
          marginBottom: "28px", // Extra space between greeting and message
        }}
      >
        Hi {displayRecipientName},
      </div>

      {/* Overlay: Editable Custom Message */}
      <div
        style={{
          position: "absolute",
          top: "100px", // 60px + 28px marginBottom from above
          left: "50px",
          width: "300px",
          fontSize: "16px",
          color: "#000",
          lineHeight: "1.6", // More space between message lines
          cursor: editable ? "pointer" : "default",
          textAlign: "left",
          fontFamily: poppins.style.fontFamily,
        }}
      >
        {editable && isEditingMessage ? (
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
                    if (setCustomMessage) {
                      setCustomMessage(tempMessage);
                    }
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
            onClick={() => editable && setIsEditingMessage(true)}
            className={`flex ${editable ? 'items-center gap-1' : ''}`}
            title={editable ? "Click to edit message" : ""}
          >
            {editable && <img src="/svgs/Edit.svg" alt="edit" width={16} height={16} />}
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
        {editable && isEditingLogo ? (
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
                  if (setLogoUrl) {
                    setLogoUrl(tempLogo);
                  }
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
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: "100px", height: "50px", objectFit: "contain" }}
              />
            )}
            {editable && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 