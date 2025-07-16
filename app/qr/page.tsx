"use client";

import { useState, useEffect, Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function QRContent() {
  return (
    <Suspense 
      fallback={
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <QRGenerator />
    </Suspense>
  );
}

function QRGenerator() {
  const searchParams = useSearchParams();
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndGenerateQR = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get recipient and campaign IDs from URL
        const recipientId = searchParams.get('r');
        const campaignId = searchParams.get('c');

        if (!recipientId || !campaignId) {
          setError('Missing recipient or campaign ID');
          setLoading(false);
          return;
        }

        // Validate campaign status
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
        if (!campaignRes.ok) {
          throw new Error('Campaign not found');
        }
        const campaignData = await campaignRes.json();
        
        if (!campaignData.success || !campaignData.data) {
          throw new Error('Invalid campaign');
        }

        // Check if campaign is live
        if (campaignData.data.status !== 'live') {
          throw new Error('Campaign is not active');
        }

        // Validate recipient exists in campaign
        const recipientExists = campaignData.data.recipients?.some(
          (recipient: any) => recipient._id === recipientId
        );

        if (!recipientExists) {
          throw new Error('Recipient not found in campaign');
        }

        // Generate QR code URL
        const landingUrl = `${window.location.origin}/landing?r=${recipientId}&c=${campaignId}`;
        setQrValue(landingUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    validateAndGenerateQR();
  }, [searchParams]);

  const handleDownload = () => {
    const svg = document.querySelector('svg');
    if (!svg) return;

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    const img = document.createElement('img');
    const url = window.URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const scale = 3; // Scale up for better quality
      canvas.width = 256 * scale;
      canvas.height = 256 * scale;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and trigger download
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'delightloop-qr.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      
      // Clean up
      window.URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-gray-50">
      <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative h-32 rounded-xl overflow-hidden mb-8 animate-fadeIn">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95" />
          <div className="relative h-full flex items-center justify-center">
            <Image
              src="/img/bigHeaderFromDashboard.png"
              alt="DelightLoop"
              width={200}
              height={40}
              className="animate-float"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-slideUp">
          {/* Main Content */}
          <div className="bg-primary px-6 py-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-4">
              Gift QR Code
            </h1>
            <p className="text-primary-xlight">
              Print this QR code and attach it to the gift package for recipient tracking
            </p>
            <p className="text-sm text-primary-xlight mt-2 opacity-75">
              Recipients will scan this code to acknowledge their gift
            </p>
          </div>

          {/* QR Code Display */}
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              <p>{error}</p>
              <p className="text-sm mt-2">Please ensure the campaign is active and the recipient exists.</p>
            </div>
          ) : qrValue ? (
            <div className="p-6 bg-gray-50">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="bg-white p-6 rounded-lg inline-block shadow-lg">
                  <QRCodeSVG
                    value={qrValue}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-gray-50">
      <Suspense 
        fallback={
          <div className="flex justify-center items-center min-h-screen">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <QRContent />
      </Suspense>
    </div>
  );
} 