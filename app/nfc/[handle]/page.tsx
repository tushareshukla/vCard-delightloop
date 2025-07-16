"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import InfinityLoader from "@/components/common/InfinityLoader";
import {
  MessageCircle,
  ExternalLink,
  MapPin,
} from "lucide-react";

// Import brand icons from react-icons
import {
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaPhone,
  FaGlobe,
  FaGithub,
  FaFacebookF,
  FaYoutube,
  FaTwitter
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

interface ProfileData {
  handle: string;
  key?: string;
  fullName: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme: string;
  nfcEnabled: boolean;
  links: Array<{
    type: string;
    value: string;
    isVisible: boolean;
    iconType?: string;
  }>;
  note?: {
    value: string;
    isVisible: boolean;
  } | null;
  lastUpdatedAt: string;
}

export default function NFCProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const router = useRouter();
  const { handle } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfcDisabled, setNfcDisabled] = useState(false);
  const [saveContactClicked, setSaveContactClicked] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTab, setContactTab] = useState<"EMAIL">("EMAIL");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingError, setSendingError] = useState<string | null>(null);

  // Load profile data based on handle
  useEffect(() => {
    const loadProfile = async () => {
      console.log("handle", handle);
      try {
        if (!handle) {
          setNotFound(true);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/vcard/handle/${handle.toLowerCase()}`);
        const data = await response.json();

        if (response.ok) {
          console.log("data", data.data);
          if (data?.data?.nfcEnabled === false) {
            setProfile(data?.data);
            setNfcDisabled(true);
            setNotFound(false);
            setError("NFC sharing is not enabled for this profile");
          } else {
            setProfile(data?.data);
            setNotFound(false);
            setNfcDisabled(false);
          }
        } else {
          setProfile(null);
          setNotFound(true);
          setNfcDisabled(false);
          setError(data.error || "Profile not found");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setNotFound(true);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [handle]);

  // Handle save contact (show modal)
  const handleSaveContact = () => {
    setShowContactModal(true);
  };

  // Create vCard content
  const createVCard = (profile: ProfileData): string => {
    let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
    vcard += `FN:${profile.fullName}\n`;

    if (profile.title) {
      vcard += `TITLE:${profile.title}\n`;
    }

    if (profile.company) {
      vcard += `ORG:${profile.company}\n`;
    }

    // Add contact methods from links
    profile.links.forEach((link) => {
      if (link.isVisible) {
        const formattedUrl = formatLinkUrl(link);
        switch (link.type.toLowerCase()) {
          case "email":
            vcard += `EMAIL;type=INTERNET:${link.value}\n`;
            break;
          case "linkedin":
            vcard += `X-SOCIALPROFILE;type=linkedin:${formattedUrl}\n`;
            break;
          case "website":
            vcard += `URL;type=WORK:${formattedUrl}\n`;
            break;
          case "whatsapp":
            vcard += `TEL;type=CELL:${link.value}\n`;
            break;
          case "sms":
            // Apple/Google vCard SMS support
            vcard += `item1.X-ABLabel:SMS\nitem1.TEL:sms:${link.value}\n`;
            break;
          case "instagram":
            vcard += `X-SOCIALPROFILE;type=instagram:${formattedUrl}\n`;
            break;
          case "twitter":
            vcard += `X-SOCIALPROFILE;type=twitter:${formattedUrl}\n`;
            break;
          case "facebook":
            vcard += `X-SOCIALPROFILE;type=facebook:${formattedUrl}\n`;
            break;
          case "youtube":
            vcard += `X-SOCIALPROFILE;type=youtube:${formattedUrl}\n`;
            break;
          case "github":
            vcard += `X-SOCIALPROFILE;type=github:${formattedUrl}\n`;
            break;
        }
      }
    });

    if (profile.note && profile.note.isVisible) {
      vcard += `NOTE:${profile.note.value}\n`;
    }

    if (profile.avatarUrl) {
      vcard += `PHOTO;VALUE=URL:${profile.avatarUrl}\n`;
    }

    vcard += "END:VCARD";
    return vcard;
  };

  // Handle contact form submission
  const handleContactSubmit = async () => {
    if (!profile) return;

    if (contactTab === "EMAIL" && !emailAddress.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    try {
      setIsValidatingEmail(true);
      setEmailError(null);
      setSendingError(null);
      
      // Validate email first
      const emailValidationResponse = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.NEXT_PUBLIC_ABSTRACT_EMAIL_VERIFICATION_API_KEY}&email=${emailAddress}`
      );

      const validationResult = await emailValidationResponse.json();

      // Check if email is valid and deliverable
      if (
        !validationResult.is_valid_format?.value ||
        validationResult.deliverability === "UNDELIVERABLE"
      ) {
        setEmailError("Please enter a valid email address");
        return;
      }

      setIsValidatingEmail(false);
      setIsSendingEmail(true);

      // Create vCard content for attachment
      const vCardContent = createVCard(profile);

      // Convert vCard content to base64
      const vCardBase64 = Buffer.from(vCardContent).toString("base64");

      // Create HTML content for email
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${profile.fullName}'s Contact Info</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px; text-align: center; font-family: Arial, sans-serif;">
            <!-- Company Logo -->
            <div style="margin-bottom: 40px;">
              <img src="https://sandbox-app.delightloop.ai/Logo Final.png" alt="DelightLoop" style="width: 120px; height: auto;" />
            </div>

            <!-- Profile Image -->
            ${
              profile.avatarUrl
                ? `
              <div style="margin-bottom: 24px;">
                <img src="${profile.avatarUrl}" alt="${profile.fullName}"
                  style="width: 120px; height: 120px; border-radius: 60px; object-fit: cover; background-color: #f8f8f8;" />
              </div>
            `
                : ""
            }

            <!-- Profile Info -->
            <h2 style="margin: 0 0 8px 0; color: #333333; font-size: 24px; font-weight: 600;">${profile.fullName}</h2>
            ${profile.title ? `<p style="margin: 0 0 4px 0; color: #666666; font-size: 16px;">${profile.title}</p>` : ""}
            ${profile.company ? `<p style="margin: 0; color: #666666; font-size: 16px;">${profile.company}</p>` : ""}

            <!-- Main Message -->
            <div style="margin: 40px 0 24px 0;">
              <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px;">Hi there, open the attached contact</p>
              <p style="margin: 0; color: #333333; font-size: 16px;">to view and save ${profile.fullName}'s contact info.</p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eeeeee;">
              <p style="color: #666666; font-size: 14px; margin: 0;">Made with ❤️ by DelightLoop</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email using our API
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailAddress,
          subject: `${profile.fullName}'s Contact Info`,
          html: htmlContent,
          text: `Contact Information for ${profile.fullName}\n\n${profile.title || ""}\n${profile.company || ""}\n\nOpen the attached contact file to save the contact information.\n\nYou can also reply to this email to reach out to ${profile.fullName}.`,
          attachments: [
            {
              content: vCardBase64,
              filename: `${profile.fullName.replace(/\s+/g, "_")}.vcf`,
              type: "text/vcard",
              disposition: "attachment",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send email");
      }

      // Success - show success state
      setEmailSent(true);
      setSaveContactClicked(true);
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setShowContactModal(false);
        setEmailAddress("");
        setEmailSent(false);
        setSendingError(null);
        setTimeout(() => setSaveContactClicked(false), 500);
      }, 3000);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setSendingError(error instanceof Error ? error.message : "Failed to send contact information. Please try again.");
    } finally {
      setIsValidatingEmail(false);
      setIsSendingEmail(false);
    }
  };

  // Helper function to format link URLs properly
  const formatLinkUrl = (link: { type: string; value: string }) => {
    const url = link.value;
    switch (link.type.toLowerCase()) {
      case "linkedin":
        return link.value.startsWith("http")
          ? link.value
          : `https://linkedin.com/in/${link.value}`;
      case "instagram":
        return link.value.startsWith("http")
          ? link.value
          : `https://instagram.com/${link.value}`;
      case "github":
        return link.value.startsWith("http")
          ? link.value
          : `https://github.com/${link.value}`;
      case "facebook":
        return link.value.startsWith("http")
          ? link.value
          : `https://facebook.com/${link.value}`;
      case "youtube":
        return link.value.startsWith("http")
          ? link.value
          : `https://youtube.com/@${link.value}`;
      case "twitter":
        return link.value.startsWith("http")
          ? link.value
          : `https://twitter.com/${link.value}`;
      case "email":
        return `mailto:${link.value}`;
      case "whatsapp":
        return `https://wa.me/${link.value.replace(/[^0-9]/g, "")}`;
      case "website":
        return link.value.startsWith("http")
          ? link.value
          : `https://${link.value}`;
      default:
        return url;
    }
  };

  // Handle social link clicks
  const handleLinkClick = (link: {
    type: string;
    value: string;
    iconType?: string;
  }) => {
    let url = link.value;

    // Use iconType if available, otherwise fall back to type
    const actionType = (link.iconType || link.type).toLowerCase();

    // Format URLs properly
    switch (actionType) {
      case "linkedin":
        url = link.value.startsWith("http")
          ? link.value
          : `https://linkedin.com/in/${link.value}`;
        break;
      case "instagram":
        url = link.value.startsWith("http")
          ? link.value
          : `https://instagram.com/${link.value}`;
        break;
      case "github":
        url = link.value.startsWith("http")
          ? link.value
          : `https://github.com/${link.value}`;
        break;
      case "facebook":
        url = link.value.startsWith("http")
          ? link.value
          : `https://facebook.com/${link.value}`;
        break;
      case "youtube":
        url = link.value.startsWith("http")
          ? link.value
          : `https://youtube.com/@${link.value}`;
        break;
      case "twitter":
        url = link.value.startsWith("http")
          ? link.value
          : `https://twitter.com/${link.value}`;
        break;
      case "email":
        url = `mailto:${link.value}`;
        break;
      case "whatsapp":
        // Extract only numbers from phone number for WhatsApp
        const whatsappNumber = link.value.replace(/[^0-9]/g, "");
        url = `https://wa.me/${whatsappNumber}`;
        break;
      case "phone":
        // Use tel: protocol for phone calls
        url = `tel:${link.value}`;
        break;
      case "website":
        url = link.value.startsWith("http")
          ? link.value
          : `https://${link.value}`;
        break;
      case "sms":
        // Use sms: protocol for SMS
        // Remove non-numeric chars for phone number
        const smsNumber = link.value.replace(/[^0-9+]/g, "");
        url = `sms:${smsNumber}`;
        break;
      case "book-meeting":
      case "book a meeting":
        // Handle meeting booking links (Calendly, Zoom, etc.)
        url = link.value.startsWith("http")
          ? link.value
          : `https://${link.value}`;
        break;
      default:
        // For custom types, assume it's a URL
        url = link.value.startsWith("http")
          ? link.value
          : `https://${link.value}`;
        break;
    }

    // For phone calls and SMS, try to initiate directly without opening new window
    if (actionType === "phone" || actionType === "sms") {
      window.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  };

  const getSocialIcon = (link: { type: string; iconType?: string }) => {
    // Use iconType if available, otherwise fall back to type
    const iconKey = (link.iconType || link.type).toLowerCase();
    switch (iconKey) {
      case "linkedin":
        return <div className="bg-[#0077B5] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaLinkedinIn className="w-8 h-8 text-white" /></div>;
      case "instagram":
        return <div className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaInstagram className="w-8 h-8 text-white" /></div>;
      case "whatsapp":
        return <div className="bg-[#25D366] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaWhatsapp className="w-8 h-8 text-white" /></div>;
      case "phone":
        return <div className="bg-[#0088FF] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaPhone className="w-8 h-8 text-white" /></div>;
      case "email":
        return <div className="bg-[#D44638] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><MdEmail className="w-8 h-8 text-white" /></div>;
      case "website":
        return <div className="bg-[#0088FF] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaGlobe className="w-8 h-8 text-white" /></div>;
      case "github":
        return <div className="bg-[#333333] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaGithub className="w-8 h-8 text-white" /></div>;
      case "facebook":
        return <div className="bg-[#1877F2] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaFacebookF className="w-8 h-8 text-white" /></div>;
      case "youtube":
        return <div className="bg-[#FF0000] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaYoutube className="w-8 h-8 text-white" /></div>;
      case "twitter":
        return <div className="bg-[#1DA1F2] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><FaTwitter className="w-8 h-8 text-white" /></div>;
      case "message":
        return <div className="bg-[#8A3FFC] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><MessageCircle className="w-8 h-8 text-white" /></div>;
              case "sms":
        return <div className="bg-[#8A3FFC] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><MessageCircle className="w-8 h-8 text-white" /></div>;
      case "address":
        return <div className="bg-[#8A3FFC] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><MapPin className="w-8 h-8 text-white" /></div>;
      case "book-meeting":
      case "book a meeting":
        return <div className="bg-[#0F766E] rounded-lg p-2 w-12 h-12 flex items-center justify-center"><svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>;
      default:
        return <div className="bg-gray-500 rounded-lg p-2 w-12 h-12 flex items-center justify-center"><ExternalLink className="w-8 h-8 text-white" /></div>;
    }
  };

  const getSocialLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "linkedin":
        return "LinkedIn";
      case "instagram":
        return "Instagram";
      case "whatsapp":
        return "WhatsApp";
      case "phone":
        return "Phone";
      case "email":
        return "Email";
      case "website":
        return "Website";
      case "github":
        return "GitHub";
      case "facebook":
        return "Facebook";
      case "youtube":
        return "YouTube";
      case "twitter":
        return "Twitter";
      case "message":
        return "Message";
      case "address":
        return "Address";
      case "book-meeting":
      case "book a meeting":
        return "Book a Meeting";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getSocialDescription = (link: { type: string; iconType?: string }) => {
    // Use iconType if available, otherwise fall back to type
    const actionType = (link.iconType || link.type).toLowerCase();
    switch (actionType) {
      case "linkedin":
        return "Connect professionally";
      case "instagram":
        return "Follow my updates";
      case "whatsapp":
        return "Chat with me";
      case "phone":
        return "Call me";
      case "email":
        return "Send me an email";
      case "website":
        return "Visit my website";
      case "github":
        return "View my code";
      case "facebook":
        return "Connect on Facebook";
      case "youtube":
        return "Watch my content";
      case "twitter":
        return "Follow my tweets";
      case "message":
        return "Send a direct message";
      case "address":
        return "Meet in person";
      case "book-meeting":
      case "book a meeting":
        return "Schedule a meeting";
      default:
        return `Connect via ${link.type}`;
    }
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case "modern-blue":
        return {
          gradient: "from-blue-500 to-blue-600",
          accent: "bg-blue-500 hover:bg-blue-600",
          text: "text-blue-600",
        };
      case "elegant-black":
        return {
          gradient: "from-gray-800 to-gray-900",
          accent: "bg-gray-800 hover:bg-gray-900",
          text: "text-gray-800",
        };
      case "vibrant-red":
        return {
          gradient: "from-red-500 to-red-600",
          accent: "bg-red-500 hover:bg-red-600",
          text: "text-red-600",
        };
      default: // classic-purple
        return {
          gradient: "from-[#7C3AED] to-[#A855F7]",
          accent: "bg-[#7C3AED] hover:bg-[#6D28D9]",
          text: "text-[#7C3AED]",
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br  from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
        <div className="text-center">
          <InfinityLoader width={64} height={64} />
          {/* <p className="text-black text-lg font-medium mt-4">Loading profile...</p> */}
        </div>
      </div>
    );
  }

  // Profile not found state
  if (notFound || nfcDisabled || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-r  from-[#ECFCFF] to-[#E8C2FF] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {nfcDisabled ? (
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 2h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {nfcDisabled ? "NFC Not Enabled" : "Profile Not Found"}
            </h1>
            <p className="text-gray-600 mb-6">
              {nfcDisabled
                ? `${profile?.fullName}'s profile exists but NFC sharing is not enabled. Please contact them to enable NFC sharing.`
                : error || `The profile "${handle}" doesn't exist.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const themeColors = getThemeColors(profile.theme);

  return (
    <div className="min-h-screen bg-gradient-to-r  from-[#ECFCFF] to-[#E8C2FF] ">
      <div className="max-w-md mx-auto  ">
        {/* Profile Card */}
        <div className="bg-white min-h-screen md:min-h-fit shadow-lg overflow-hidden  pb-10">
          {/* Cover Image */}
          <div
            className={`h-40 bg-gradient-to-r ${themeColors.gradient} relative`}
          >
            {profile.coverImageUrl && (
              <Image
                src={profile.coverImageUrl}
                alt="Cover"
                fill
                className="object-contain"
              />
            )}
            <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2">
              <div className="w-48 h-48 bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    width={192}
                    height={192}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full  bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                    {profile?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {profile?.companyLogoUrl && (
              <div
                className={`absolute -bottom-2 -right-2 w-16 h-16 bg-white p-1 rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center overflow-hidden`}
              >
                  <Image
                    src={profile.companyLogoUrl}
                    alt={profile.company || ""}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
              </div>
)}
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-28 pb-8 px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.fullName}
            </h2>
            {profile.title && (
              <p className={`${themeColors.text} text-xl font-medium mb-1.5`}>
                {profile.title}
              </p>
            )}
            {profile.company && (
              <p className="text-gray-600 text-lg mb-6">{profile.company}</p>
            )}

            {/* Note */}
            {profile.note && profile.note.value.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-gray-700">{profile.note.value}</p>
              </div>
            )}

            {/* Save Contact Button */}
            <Button
              onClick={handleSaveContact}
              className={`w-full ${themeColors.accent} text-white font-bold py-6 rounded-full mb-8 text-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                saveContactClicked ? "animate-pulse bg-green-600 hover:bg-green-700" : ""
              }`}
            >
              {saveContactClicked ? (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Contact Saved!
                </div>
              ) : (
                <div className="flex items-center justify-center">
                 
                  Save Contact
                </div>
              )}
            </Button>

            {/* Default Social Links */}
            <div className="space-y-4">
              {[
                { type: 'LinkedIn', iconType: 'linkedin' },
                { type: 'Email', iconType: 'email' },
                { type: 'WhatsApp', iconType: 'whatsapp' },
                { type: 'Phone', iconType: 'phone' }
              ].map((defaultSection, index) => {
                // Find matching link in profile data
                const matchingLink = profile.links?.find(link => 
                  link.isVisible && (
                    link.iconType?.toLowerCase() === defaultSection.iconType ||
                    link.type?.toLowerCase() === defaultSection.type.toLowerCase()
                  )
                );

                const isDisabled = !matchingLink;

                return (
                  <button
                    key={index}
                    onClick={() => matchingLink ? handleLinkClick(matchingLink) : null}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      isDisabled 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : 'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-500 hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)]'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getSocialIcon({ type: defaultSection.type, iconType: defaultSection.iconType })}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-normal text-lg ${
                        isDisabled ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {getSocialLabel(defaultSection.type)}
                      </div>
                      <div className={`${
                        isDisabled ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {isDisabled ? 'Not available' : getSocialDescription({ type: defaultSection.type, iconType: defaultSection.iconType })}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Additional Custom Links */}
              {profile.links && profile.links
                .filter(link => 
                  link.isVisible && 
                  !['linkedin', 'email', 'whatsapp', 'phone'].includes(link.iconType?.toLowerCase() || link.type?.toLowerCase())
                )
                .map((link, index) => (
                  <button
                    key={`custom-${index}`}
                    onClick={() => handleLinkClick(link)}
                    className="w-full flex items-center gap-4 p-4 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] duration-500  hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg  transition-colors"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getSocialIcon(link)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-normal text-gray-900 text-lg">
                        {getSocialLabel(link.type)}
                      </div>
                      <div className="text-gray-500">
                        {getSocialDescription(link)}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
            <Link
              href={`/?vcr=${profile?.key}`}
              className="text-gray-500 px-8 py-3.5 shadow-[0_3px_10px_rgb(0,0,0,0.2)] duration-500  hover:shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-3xl  transition-colors font-medium bg-white flex justify-center w-fit mx-auto  "
            >
              Manage Your Own Card
            </Link>
        </div>

        {/* Footer */}
        {/* <div className="text-center mt-8 pb-4">
          <p className="text-white/60 text-sm">Powered by Delightloop</p>
        </div> */}
      </div>

      {/* Contact Slider */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-300 ${
          showContactModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => {
          setShowContactModal(false);
          setEmailAddress("");
          setEmailError(null);
          setSendingError(null);
          setEmailSent(false);
        }}
      >
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 transform ${
            showContactModal ? "translate-y-0" : "translate-y-full"
          } max-w-md w-full`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setShowContactModal(false);
              setEmailAddress("");
              setEmailError(null);
              setSendingError(null);
              setEmailSent(false);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">
            {/* Success State */}
            {emailSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact Sent!</h3>
                <p className="text-gray-600 mb-4">Check your email for {profile?.fullName}'s contact information.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">💡 Tip:</p>
                  <p>Open the attached .vcf file to automatically add to your contacts</p>
                </div>
              </div>
            ) : (
              <>
                {/* Slider Header */}
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pr-8 text-center">
                  Get {profile?.fullName}'s contact info
                </h2>

                {/* Tabs */}
                <div className="flex justify-center mb-6">
                  <div className="w-full flex flex-col items-center">
                    <span
                      className="text-[#A259F7] font-medium uppercase text-base tracking-wide text-center mb-1"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      EMAIL
                    </span>
                    <span className="block h-0.5 w-full max-w-full bg-[#A259F7] rounded-full" />
                  </div>
                </div>

                {/* Error Message */}
                {sendingError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{sendingError}</p>
                  </div>
                )}

                {/* Form Content */}
                <div className="mb-6">
                  
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      setEmailError(null);
                      setSendingError(null);
                    }}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 border ${
                      emailError ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      emailError ? "focus:ring-red-500" : "focus:ring-purple-500"
                    } focus:border-transparent transition-colors`}
                    disabled={isValidatingEmail || isSendingEmail}
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleContactSubmit}
                  disabled={isValidatingEmail || isSendingEmail || !emailAddress.trim()}
                  className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 ${
                    isValidatingEmail || isSendingEmail || !emailAddress.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  }`}
                >
                  {isValidatingEmail ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Validating Email...
                    </div>
                  ) : isSendingEmail ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending Contact...
                    </div>
                  ) : (
                    "Receive Contact"
                  )}
                </button>

                {/* Info Text */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  We'll send you an email with {profile?.fullName}'s contact information as a downloadable file.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
