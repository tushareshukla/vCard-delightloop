"use client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
// TypeScript: declare module for qr-code-styling if not present
// @ts-ignore
// eslint-disable-next-line
import type QRCodeStylingType from "qr-code-styling";
import { saveAs } from "file-saver";
import { Poppins } from "next/font/google";
import router from "next/router";
import { useAuth } from "../context/AuthContext";
import dynamic from "next/dynamic";
import { EditableCardPreview } from "@/components/shared/EditableCardPreview";
import html2canvas from "html2canvas";

// Suppress TS error for missing qr-code-styling types
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-ignore
declare module 'qr-code-styling';

// Helper to base64 encode Unicode SVG
function toBase64Unicode(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Load Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function PublicQR() {
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [recipientName, setRecipientName] = useState("[Recipient Name]");
  const [customMessage, setCustomMessage] = useState("Welcome to DelightLoop! Enjoy your personalized gift.");
  const [customLogo, setCustomLogo] = useState("");
  const [logoUrl, setLogoUrl] = useState("/Logo Final.png");
  const [qrImage, setQrImage] = useState<string>("");
  // Store a reference to the QRCodeStyling instance
  const qrCodeInstanceRef = useRef<any>(null);

  // Fetch metadata for download template
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/qr-code/metadata?token=${token}`, {
      headers: { "accept": "application/json" }
    })
      .then(res => res.json())
      .then(data => {
        if (data.metadata) {
          if (data.metadata.recipientName) setRecipientName(data.metadata.recipientName);
          setCustomMessage(data.metadata.outcomeMessage || "");
          setCustomLogo(data.metadata.outcomeLogo || "");
        }
      })
      .catch(e => console.error("Error fetching QR code metadata:", e));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("No token provided in URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Dynamically import qr-code-styling only on client
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      const qrCode = new QRCodeStyling({
        type: "canvas",
        shape: "square",
        width: 100,
        height: 100,
        data: token,
        margin: 0,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "Q"
        },
        imageOptions: {
          saveAsBlob: true,
          hideBackgroundDots: true,
          imageSize: 0.4, // Reduced logo size
          margin: 0,
          crossOrigin: "anonymous"
        },
        dotsOptions: {
          type: "extra-rounded",
          color: "#000000", // Black color
          roundSize: true
        },
        backgroundOptions: {
          round: 0,
          color: "#ffffff"
        },
        image: "img/favicon-logo.png", // Use favicon as logo
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#000000" // Black color
        },
        cornersDotOptions: {
          color: "#000000" // Black color
        }
      });
      setQrReady(true);
      qrCodeInstanceRef.current = qrCode;
      setLoading(false);
      // Generate base64 image and set state
      qrCode.getRawData('png').then((data: any) => {
        let url = "";
        if (typeof data === "string") {
          url = data;
        } else if (data instanceof Blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setQrImage(reader.result as string);
          };
          reader.readAsDataURL(data);
        } else if (data instanceof HTMLImageElement) {
          // fallback, not expected
          url = data.src;
        }
        if (url) setQrImage(url);
      });
    }).catch((err) => {
      setError("Failed to load QR code library: " + err);
      setLoading(false);
    });
  }, [token]);

  // After the useEffect that sets up qrCodeInstanceRef, add a useEffect to append the QR code to the preview div
  useEffect(() => {
    if (qrReady && qrCodeInstanceRef.current) {
      const qrDiv = document.getElementById("qr-code-preview");
      if (qrDiv) {
        qrDiv.innerHTML = "";
        qrCodeInstanceRef.current.append(qrDiv);
      }
    }
  }, [qrReady]);

  const handleDownloadPNG = async () => {
    if (qrCodeInstanceRef.current && typeof qrCodeInstanceRef.current.download === 'function') {
      qrCodeInstanceRef.current.download({ extension: 'png', name: 'qr' });
    }
  };

  // Automatically generate the template preview when ready
  useEffect(() => {
    if (qrReady) {
      // The template generation logic is now handled by EditableCardPreview
      // We just need to ensure the QR code is ready for download
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrReady]);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPreviewPNG = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: null });
      canvas.toBlob((blob) => {
        if (blob) saveAs(blob, "delightloop-preview.png");
      });
    }
  };

  const handleDownloadPreviewPDF = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("delightloop-preview.pdf");
    }
  };

  const handleDownloadPreviewWord = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const { Document, Packer, Paragraph, ImageRun, AlignmentType } = await import("docx");
      const response = await fetch(imgData);
      const blob = await response.blob();
      const imageBuffer = await blob.arrayBuffer();
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 600,
                    height: 400,
                  },
                  type: "png",
                }),
              ],
            }),
          ],
        }],
      });
      const docBlob = await Packer.toBlob(doc);
      saveAs(docBlob, "delightloop-preview.docx");
    }
  };

  return (
    <main className={`bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-9 px-11 ${poppins.className}`}>
      <div className="flex flex-col items-center mb-8">
        <Image src="/Logo Final.png" alt="Delightloop Logo" width={157} height={50} className="mb-6" />
        <h1 className="text-3xl text-primary font-bold text-center">
          Download QR Card
        </h1>
      </div>
      
      <div className="flex flex-col items-center justify-center h-full">
        {/* Instructions and download buttons */}
        {qrReady && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mb-8">
              <h2 className="text-2xl text-primary font-bold mb-4">Instructions for Gifting Partner Operations</h2>
              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li>Download the template in your preferred format (PNG, PDF, or Word).</li>
                <li>Print the template on high-quality card stock or photo paper.</li>
                <li>Ensure the QR code is clearly visible and not distorted.</li>
                <li>Cut along the border if necessary, maintaining the colored edge.</li>
                <li>Include this card with the recipient's gift package.</li>
                <li>Handle with care to avoid damaging the QR code.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Show the actual QR code generated by qrCodeInstanceRef */}
        {/*<div className="mb-6">
          <div id="qr-code-preview" />
        </div>*/}
        {/* Download template preview (canvas) replaced with EditableCardPreview */}
        <div ref={previewRef}>
          <EditableCardPreview
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            editable={false}
            qrImage={qrImage}
            recipientName={recipientName}
          />
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleDownloadPreviewPNG}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download as PNG
          </button>
          <button
            onClick={handleDownloadPreviewPDF}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download as PDF
          </button>
          <button
            onClick={handleDownloadPreviewWord}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download as Word
          </button>
        </div>
        
        {loading && <p className="text-center mt-8">Loading...</p>}
        {error && <p className="text-red-500 text-center mt-8">Error: {error}</p>}
      </div>
    </main>
  );
}
