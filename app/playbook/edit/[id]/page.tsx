"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import GiftCard from "@/components/setup-budget/Gift-Card";
import Checkbox from "@/components/common/Checkbox";
import TemplateModal from "@/components/partner-integrations/select-gift/Template-modal";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import PageHeader from "@/components/layouts/PageHeader";
import { ArrowLeft } from "lucide-react";
import { EditableCardPreview } from "@/components/shared/EditableCardPreview";
import QuillEditor from "@/components/QuillEditor";

const animations = `
@keyframes fadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes cardDeal {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
.animate-card-deal { animation: cardDeal 0.5s ease-out forwards; opacity: 0; }
`;

export default function EditPlaybook() {
  const params = useParams();
  const playbookId = params?.id as string;
  const { authToken, userId, organizationId, isLoadingCookies } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playbook, setPlaybook] = useState<any>(null);
  // All create state hooks...
  const [budget, setBudget] = useState<{ min: number; max: number }>({
    min: 0,
    max: 20,
  });
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedGiftsByBundle, setSelectedGiftsByBundle] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [modal, setModal] = useState(false);
  const [bundleGifts, setBundleGifts] = useState<any[]>([]);
  const [currentBundle, setCurrentBundle] = useState<any>(null);
  const [selectedGiftsInModal, setSelectedGiftsInModal] = useState<Set<string>>(
    new Set()
  );
  const [focusTemplate, setFocusTemplate] = useState({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [hyperPersonalization, setHyperPersonalization] = useState(false);
  const [sendMode, setSendMode] = useState<"direct" | "permission">("direct");
  const [errorforPowerUpWallet, setErrorforPowerUpWallet] = useState<
    string | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    template1: boolean;
    template2: boolean;
    template3: boolean;
    template4: boolean;
  }>({
    template1: false,
    template2: false,
    template3: false,
    template4: false,
  });
  const [templateData, setTemplateData] = useState({
    type: "template1" as "template1" | "template2" | "template3" | "template4",
    description: "",
    date: null as Date | null,
    videoLink: "",
    logoLink: "",
    buttonText: "",
    buttonLink: "",
    mediaUrl: "",
  });
  const [playbookName, setPlaybookName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [requireApproval, setRequireApproval] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    "We have reserved a seat for you!"
  );
  const [logoUrl, setLogoUrl] = useState("/Logo Final.png");
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(true);
  const [showInTransit, setShowInTransit] = useState(false);
  const [showDeliveredEmail, setShowDeliveredEmail] = useState(false);
  const [showAcknowledgedEmail, setShowAcknowledgedEmail] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    addressConfirmedEmail: `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" width=\"150\" height=\"40\" style=\"display: block; width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you please confirm your preferred delivery address?</p>\n<p><a href=\"{{Verification URL}}\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Confirm Your Address Here</a></p>\n<p style=\"font-size: 16px; color: #555;\">Rest assured, your information will be kept confidential and used solely for this delivery.</p>\n<p style=\"font-size: 16px; color: #555;\">Looking forward to delighting you!</p>\n<p style=\"font-size: 16px; color: #555; margin-top: 20px;\">Best wishes,<br>The Delightloop Team</p>\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 12px; color: #888;\">© ${new Date().getFullYear()} Delightloop</p>\n</div>`,
    inTransitEmail: `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">We've got some delightful news — your gift is officially on its journey! ✨<br>Someone thought of you, and now a little joy is headed your way.</p>\n<p style=\"font-size: 16px; color: #555;\">We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.</p>\n<p style=\"font-size: 16px; color: #555;\">Enjoy the unboxing —<br><strong>The DelightLoop Team</strong></p>\n<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;\">\n<p style=\"font-size: 16px; color: #555; margin: 0;\">📦 <strong>Carrier:</strong> {{carrier}}<br>🔍 <strong>Tracking ID:</strong> {{trackingId}}<br>👉 <a target=\"_blank\" href=\"{{trackingUrl}}\" style=\"color: #6c5ce7; text-decoration: none; font-weight: bold;\">Track Your Gift</a></p>\n</div>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
    deliveredEmail: `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">Your gift has been delivered! We hope it brings a smile to your face. If you have any questions, feel free to reach out.</p>\n<p style=\"font-size: 16px; color: #555;\">Enjoy your gift!<br><strong>The DelightLoop Team</strong></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
    acknowledgedEmail: `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">Thank you for acknowledging your gift! We hope you enjoyed it. If you have any feedback, let us know.</p>\n<p style=\"font-size: 16px; color: #555;\">Best wishes,<br><strong>The DelightLoop Team</strong></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
  });
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const router = useRouter();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalInitialData, setTemplateModalInitialData] =
    useState(templateData);

  // Fetch playbook data on mount
  useEffect(() => {
    if (
      !isLoadingCookies &&
      playbookId &&
      authToken &&
      organizationId &&
      userId
    ) {
      setLoading(true);
      fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbooks/${playbookId}?user_id=${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("Playbook data received:", data); // For debugging
          setPlaybook(data);
          setPlaybookName(data.name || "");
          setBudget({ min: 0, max: data.budget || 20 });
          setSelectedBundles(new Set(data.bundleIds || []));
          setHyperPersonalization(!!data.hyper_personalization);
          setSendMode(data.sending_mode || "direct");

          // Correctly map template data (all fields)
          if (data.template) {
            setTemplateData({
              type: data.template.type || "template1",
              description: data.template.description || "",
              date: data.template.date ? new Date(data.template.date) : null,
              videoLink: data.template.videoLink || "",
              logoLink: data.template.logoLink || "",
              buttonText: data.template.buttonText || "",
              buttonLink: data.template.buttonLink || "",
              mediaUrl: data.template.mediaUrl || "",
            });
            setSelectedTemplate({
              template1: data.template.type === "template1",
              template2: data.template.type === "template2",
              template3: data.template.type === "template3",
              template4: data.template.type === "template4",
            });
            setFocusTemplate({
              template1: data.template.type === "template1",
              template2: data.template.type === "template2",
              template3: data.template.type === "template3",
              template4: data.template.type === "template4",
            });
          }

          // Map custom message data (stored in outcomeCard or customMessage field)
          if (data.outcomeCard && data.outcomeCard.message) {
            setCustomMessage(data.outcomeCard.message);
          } else if (data.customMessage) {
            setCustomMessage(data.customMessage);
          } else {
            setCustomMessage("We have reserved a seat for you!");
          }

          // Map logo URL (stored in outcomeCard or logoUrl field)
          if (data.outcomeCard && data.outcomeCard.logoLink) {
            setLogoUrl(data.outcomeCard.logoLink);
          } else if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            setLogoUrl("/Logo Final.png");
          }

          // Map email templates (all fields)
          if (data.emailTemplate) {
            setEmailTemplate({
              addressConfirmedEmail:
                data.emailTemplate.addressConfirmedEmail ||
                `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" width=\"150\" height=\"40\" style=\"display: block; width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">We're excited to share that we have a thoughtful gift waiting for you! To ensure it reaches you promptly, could you please confirm your preferred delivery address?</p>\n<p><a href=\"{{Verification URL}}\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Confirm Your Address Here</a></p>\n<p style=\"font-size: 16px; color: #555;\">Rest assured, your information will be kept confidential and used solely for this delivery.</p>\n<p style=\"font-size: 16px; color: #555;\">Looking forward to delighting you!</p>\n<p style=\"font-size: 16px; color: #555; margin-top: 20px;\">Best wishes,<br>The Delightloop Team</p>\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 12px; color: #888;\">© ${new Date().getFullYear()} Delightloop</p>\n</div>`,
              inTransitEmail:
                data.emailTemplate.inTransitEmail ||
                `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">We've got some delightful news — your gift is officially on its journey! ✨<br>Someone thought of you, and now a little joy is headed your way.</p>\n<p style=\"font-size: 16px; color: #555;\">We're just as excited as you are! If you have any questions or if the package needs a red carpet, we've got you covered.</p>\n<p style=\"font-size: 16px; color: #555;\">Enjoy the unboxing —<br><strong>The DelightLoop Team</strong></p>\n<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;\">\n<p style=\"font-size: 16px; color: #555; margin: 0;\">📦 <strong>Carrier:</strong> {{carrier}}<br>🔍 <strong>Tracking ID:</strong> {{trackingId}}<br>👉 <a target=\"_blank\" href=\"{{trackingUrl}}\" style=\"color: #6c5ce7; text-decoration: none; font-weight: bold;\">Track Your Gift</a></p>\n</div>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
              deliveredEmail:
                data.emailTemplate.deliveredEmail ||
                `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">Your gift has been delivered! We hope it brings a smile to your face. If you have any questions, feel free to reach out.</p>\n<p style=\"font-size: 16px; color: #555;\">Enjoy your gift!<br><strong>The DelightLoop Team</strong></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
              acknowledgedEmail:
                data.emailTemplate.acknowledgedEmail ||
                `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; text-align: left; background-color: #ffffff;\">\n<img src=\"https://ci3.googleusercontent.com/meips/ADKq_Na-pOK2zs1XL1nlExlDYFyhdd4DtqpCc0halvHimuA9pqyEgfc0WxaXi-6-tyWmul1tis_BnFS4H4ICZYDo_fYu6QEv1Ld5_uVXkulGmDGN-AuLZJpFsfj5oI4NGq9Dpp4_V0-qS5A-FoV90QU=s0-d-e1-ft#https://res.cloudinary.com/dfviyrkrl/image/upload/f_png,w_150,h_40/v1740589183/logo.svg\" alt=\"DelightLoop Logo\" style=\"width: 150px; height: 40px; margin-bottom: 20px;\">\n<p style=\"font-size: 18px; color: #333;\">Hi  {{First Name}},</p>\n<p style=\"font-size: 16px; color: #555;\">Thank you for acknowledging your gift! We hope you enjoyed it. If you have any feedback, let us know.</p>\n<p style=\"font-size: 16px; color: #555;\">Best wishes,<br><strong>The DelightLoop Team</strong></p>\n<hr style=\"border: 0; height: 1px; background: #eee; margin: 20px 0;\">\n<p style=\"font-size: 14px; color: #888;\">Curious how personalized gifting can transform your business relationships?<br>DelightLoop helps teams create meaningful connections that drive measurable results.</p>\n<p style=\"margin-top: 10px;\"><a href=\"https://www.delightloop.com/bookademo\" style=\"display: inline-block; padding: 10px 20px; background: #6c5ce7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;\">Transform Your Outreach Today →</a></p>\n<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">© 2025 DelightLoop</p>\n</div>`,
            });
          }

          // Email visibility settings based on actual email template content
          if (data.emailTemplate) {
            setShowAddressConfirmation(
              !!(
                data.emailTemplate.addressConfirmedEmail &&
                data.emailTemplate.addressConfirmedEmail.trim() !== ""
              )
            );
            setShowInTransit(
              !!(
                data.emailTemplate.inTransitEmail &&
                data.emailTemplate.inTransitEmail.trim() !== ""
              )
            );
            setShowDeliveredEmail(
              !!(
                data.emailTemplate.deliveredEmail &&
                data.emailTemplate.deliveredEmail.trim() !== ""
              )
            );
            setShowAcknowledgedEmail(
              !!(
                data.emailTemplate.acknowledgedEmail &&
                data.emailTemplate.acknowledgedEmail.trim() !== ""
              )
            );
          }

          // Approval setting
          setRequireApproval(!!data.approvalRequired);
        })
        .catch(() => toast.error("Failed to load playbook data"))
        .finally(() => setLoading(false));
    }
  }, [isLoadingCookies, playbookId, authToken, organizationId, userId]);

  // Fetch bundles (same as create)
  useEffect(() => {
    if (!isLoadingCookies) {
      fetch("/api/bundles")
        .then((res) => res.json())
        .then((data) => setBundles(data.bundles || []))
        .catch(() => setBundles([]));
    }
  }, [isLoadingCookies]);

  // All handlers (copy from create, but update for edit mode)
  const handleCheckboxChange = (bundle: any) => {
    setSelectedBundles((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(bundle._id)) {
        newSelected.delete(bundle._id);
        setSelectedGiftsByBundle((prev) => {
          const newMap = new Map(prev);
          newMap.delete(bundle._id);
          return newMap;
        });
      } else {
        newSelected.add(bundle._id);
        if (bundle.giftsList && bundle.giftsList.length > 0) {
          setSelectedGiftsByBundle((prev) => {
            const newMap = new Map(prev);
            const allGiftIds = new Set<string>(
              bundle.giftsList.map((g: any) => g.giftId)
            );
            newMap.set(bundle._id, allGiftIds);
            return newMap;
          });
        }
      }
      return newSelected;
    });
  };

  const handleGiftSelect = (bundleId: string, giftId: string) => {
    setSelectedGiftsInModal((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(giftId)) {
        newSelected.delete(giftId);
      } else {
        newSelected.add(giftId);
      }
      return newSelected;
    });

    setSelectedGiftsByBundle((prev) => {
      const newMap = new Map(prev);
      const bundleGifts = new Set(newMap.get(bundleId) || []);

      if (bundleGifts.has(giftId)) {
        bundleGifts.delete(giftId);
      } else {
        bundleGifts.add(giftId);
      }

      if (bundleGifts.size > 0) {
        newMap.set(bundleId, bundleGifts);
      } else {
        newMap.delete(bundleId);
      }

      return newMap;
    });
  };

  const handleEyeClick = async (bundle: any) => {
    try {
      setCurrentBundle(bundle);
      const validGiftIds = bundle.giftsList.filter(
        ({ giftId }: { giftId: string }) => giftId && giftId.length > 0
      );
      if (validGiftIds.length === 0) {
        throw new Error("No valid gifts found in this bundle");
      }
      const giftPromises = validGiftIds.map(
        async ({ giftId }: { giftId: string }) => {
          const res = await fetch(`/api/gifts/${giftId}`);
          if (!res.ok) {
            if (res.status === 404) {
              console.warn(`Gift ${giftId} not found, skipping...`);
              return null;
            }
            throw new Error(`Failed to fetch gift ${giftId}`);
          }
          return res.json();
        }
      );
      const gifts = (await Promise.all(giftPromises)).filter(
        (gift) => gift !== null
      );
      if (gifts.length === 0) {
        throw new Error("No gifts could be loaded for this bundle");
      }
      setBundleGifts(gifts);
      const existingSelections =
        selectedGiftsByBundle.get(bundle._id) || new Set();
      setSelectedGiftsInModal(existingSelections);
      setModal(true);
    } catch (err) {
      console.error("Error in handleEyeClick:", err);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = document.querySelector(".carousel-container");
    if (container) {
      const scrollAmount = 300;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  // Update playbook handler
  const handleUpdatePlaybook = async () => {
    // Validate fields (same as create)
    if (selectedBundles.size === 0) {
      setErrorforPowerUpWallet("Please select at least one Gift Catalog");
      return;
    }
    const templateType = templateData.type;
    const requiredFields = {
      template1: templateData.description && templateData.videoLink,
      template2: templateData.description && templateData.date,
      template3: templateData.description && templateData.buttonLink,
      template4: templateData.description && templateData.buttonLink,
    };
    if (!templateType || !requiredFields[templateType]) {
      setErrorforPowerUpWallet(
        !templateType
          ? "Please select a template"
          : "Please customize the selected template with required fields"
      );
      return;
    }
    try {
      setLoadingUpdate(true);
      const playbookData = {
        name: playbookName || "New Playbook",
        description: `Playbook updated on ${new Date().toLocaleDateString()}`,
        bundleIds: Array.from(selectedBundles),
        budget: budget.max,
        sending_mode: sendMode,
        hyper_personalization: hyperPersonalization,
        user_id: userId,
        organization_id: organizationId,
        template: templateData,
        cta_link: playbook?.cta_link || "",
        status: "Active",
        approvalRequired: requireApproval,
        // Add outcomeCard with message and logoLink
        outcomeCard: {
          message: customMessage,
          logoLink: logoUrl,
        },
        // Add emailTemplate - only send content for selected checkboxes
        emailTemplate: {
          addressConfirmedEmail: showAddressConfirmation
            ? emailTemplate.addressConfirmedEmail
            : "",
          inTransitEmail: showInTransit ? emailTemplate.inTransitEmail : "",
          deliveredEmail: showDeliveredEmail
            ? emailTemplate.deliveredEmail
            : "",
          acknowledgedEmail: showAcknowledgedEmail
            ? emailTemplate.acknowledgedEmail
            : "",
        },
        // Additional fields to ensure persistence
        showAddressConfirmation: showAddressConfirmation,
        showInTransit: showInTransit,
        showDeliveredEmail: showDeliveredEmail,
        showAcknowledgedEmail: showAcknowledgedEmail,
      };

      console.log("Sending playbook data:", playbookData); // For debugging

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/playbooks/${playbookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(playbookData),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update playbook");
      toast.success("Playbook updated successfully!");

      // Add a small delay before redirecting to ensure backend sync
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/playbook/view/" + playbookId);
    } catch (error: any) {
      toast.error(error.message || "Failed to update playbook");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleTemplateCardClick = (templateKey: string) => {
    const newFocusTemplate = {
      template1: false,
      template2: false,
      template3: false,
      template4: false,
    };
    newFocusTemplate[templateKey] = true;
    setFocusTemplate(newFocusTemplate);
    setSelectedTemplate(newFocusTemplate);
    setTemplateData((prev) => ({
      ...prev,
      type: templateKey as any,
    }));
    setTemplateModalInitialData(templateData);
    setShowTemplateModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
        <AdminSidebar />
        <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
            {/* Header Skeleton */}
            <div className="px-6 md:px-8 w-full mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4 mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-36 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              
              <div className="h-px bg-gray-200 w-full"></div>
            </div>

            {/* Content Container */}
            <div className="mx-4 md:mx-6 lg:mx-8">
              {/* Group 1 Card Skeleton */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
                {/* Playbook Name */}
                <div className="mb-8">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
                </div>

                {/* Budget Configuration */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1 min-w-[300px]">
                    <div className="h-6 w-52 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 w-32 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-[300px]">
                    <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
                    <div className="flex flex-col gap-4">
                      <div className="h-6 w-40 bg-gray-200 rounded"></div>
                      <div className="h-10 w-48 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2 Card Skeleton */}
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-8">
                {/* Recipients Experience Section Heading */}
                <div className="mb-8">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-80 bg-gray-200 rounded"></div>
                </div>

                {/* 1. Select Gift Catalog */}
                <div className="mb-12">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-72 bg-gray-200 rounded mb-6"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="w-full h-48 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>

                {/* 2. Craft Your Gift Message */}
                <div className="mb-12">
                  <div className="h-6 w-44 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-96 bg-gray-200 rounded mb-4"></div>
                  <div className="w-80 h-64 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-16 w-full bg-gray-100 rounded-md"></div>
                </div>

                {/* 3. Select and Customise Template */}
                <div className="mb-12">
                  <div className="h-6 w-56 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-88 bg-gray-200 rounded mb-6"></div>
                  <div className="flex gap-6 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="w-96 h-56 bg-gray-200 rounded-xl flex-shrink-0"></div>
                    ))}
                  </div>
                </div>

                {/* 4. Choose Mail Templates */}
                <div className="mb-8">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-72 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-8 mb-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-8">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index}>
                        <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded mb-4"></div>
                        <div className="h-48 w-full bg-gray-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Require Approval Checkbox */}
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>

                {/* Update Button */}
                <div className="flex flex-col items-center mt-8">
                  <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white rounded-tl-3xl h-full overflow-y-auto">
          <style jsx global>
            {animations}
          </style>
          <PageHeader
            backLink={{
              href: "/playbook",
              text: "Back to Playbooks"
            }}
            title="Edit Playbook"
            description="Edit your playbook details"
            chips={[{ text: "Draft", color: "gray" }]}
            showDivider={true}
            className="pt-2"
          />
          
          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            {/* --- Group 1 Card --- */}
            <div
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 animate-fade-in-up opacity-0"
              style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
            >
            {/* Playbook Name */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Enter Your Playbook Name
              </h2>
              <label className="block">
                <input
                  type="text"
                  placeholder="Webinar - After the Event"
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            {/* Budget Configuration */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-lg mb-4 flex items-center gap-2">
                  Gift Budget Configuration
                </h2>
                <p className="text-sm text-[#6B7280] mb-4">
                  Set your per-recipient gift budget limit
                </p>
                <div className="flex items-center gap-4 w-fit bg-[#F9F5FF] border border-[#D2CEFE] rounded-full px-4 py-2 shadow-sm">
                  <button
                    type="button"
                    aria-label="Decrease budget"
                    onClick={() =>
                      setBudget((prev) => ({
                        ...prev,
                        max: Math.max(prev.max - 1, 1),
                      }))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-semibold text-[#7F56D9]">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={budget.max}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 1;
                        setBudget((prev) => ({
                          ...prev,
                          max: Math.max(1, Math.min(val, 500)),
                        }));
                      }}
                      className="w-16 text-center text-lg font-semibold bg-transparent border-none focus:ring-0 focus:outline-none text-[#7F56D9] placeholder:text-[#D2CEFE]"
                      style={{ appearance: "textfield" }}
                      aria-label="Gift budget amount"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Increase budget"
                    onClick={() =>
                      setBudget((prev) => ({
                        ...prev,
                        max: Math.min(prev.max + 1, 500),
                      }))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D2CEFE] text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-[#7F56D9] mt-2 ml-2 flex items-center gap-1">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#7F56D9"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Budget can be edited anytime before sending gifts.
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-lg mb-4 flex items-center gap-2">
                  Gift Selection & Delivery Preferences
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={hyperPersonalization}
                        onChange={(e) =>
                          setHyperPersonalization(e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-sm font-medium">
                      Hyper-personalization
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Delivery Type:</span>
                    <div className="flex gap-2 border border-[#F2F4F7] bg-[#F9FAFB] rounded-lg p-1">
                      <button
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                          sendMode !== "permission"
                            ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                            : "text-[#667085] hover:bg-white/50"
                        }`}
                        onClick={() => setSendMode("direct")}
                      >
                        Direct
                      </button>
                      <button
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                          sendMode === "permission"
                            ? "text-primary bg-white shadow-sm border border-primary/10 ring-1 ring-primary/20"
                            : "text-[#667085] hover:bg-white/50"
                        }`}
                        onClick={() => setSendMode("permission")}
                      >
                        Permission
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* --- Group 2 Card --- */}
          <div
            className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-8 animate-fade-in-up opacity-0"
            style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
          >
            {/* Recipients Experience Section Heading (moved here) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                Recipients Experience
              </h2>
              <p className="text-gray-600">
                Customize the gifting experience for your recipients.
              </p>
            </div>
            {/* 1. Select Gift Catalog */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  1
                </span>
                Select Gift Catalog
              </h2>
              <p className="text-sm text-[#6B7280] mb-6 ml-10">
                Browse and select from our curated gift collections
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bundles.slice(0, 4).map((bundle, index) => (
                  <div
                    key={bundle._id}
                    className="bg-white transition-all duration-300 p-4 flex flex-col items-center cursor-pointer group relative transform hover:-translate-y-1 hover:scale-[1.03] animate-card-deal"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GiftCard
                      bundle={bundle}
                      isSelected={selectedBundles.has(bundle._id)}
                      onCheckboxChange={() => handleCheckboxChange(bundle)}
                      onEyeClick={() => handleEyeClick(bundle)}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* 2. Craft Your Gift Message */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  2
                </span>
                Craft Your Gift Message
              </h2>
              <p className="text-gray-600 mb-4 ml-10">
                This message will be printed on a physical postcard inside the
                gift box — the first thing your recipient reads.
              </p>
              <EditableCardPreview
                customMessage={customMessage}
                setCustomMessage={setCustomMessage}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                editable={true}
              />
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 ml-10">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
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
                  <p className="text-sm text-blue-700">
                    The QR code on the postcard will direct recipients to the
                    landing page you select below.
                  </p>
                </div>
              </div>
            </div>
            {/* 3. Select and Customise Template */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  3
                </span>
                Select and Customise Template
              </h2>
              <p className="text-sm text-[#6B7280] mb-6 ml-10">
                This is where your recipients land after scanning the QR, let's
                make it count!
              </p>
              <div className="relative">
                <button
                  onClick={() => handleScroll("left")}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-all z-10"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="overflow-x-auto carousel-container scroll-smooth p-2 scrollbar-hide">
                  <div className="flex gap-6 lg:gap-10 xl:gap-14">
                    {[1, 2, 3, 4].map((num, index) => (
                      <div
                        key={num}
                        className="animate-card-deal"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Image
                          src={`/partner-integrations/template${num}.png`}
                          alt={`Template ${num}`}
                          width={380}
                          height={220}
                          className={`hover:scale-105 transition-transform duration-300 cursor-pointer rounded-xl border-2 ${
                            focusTemplate[
                              `template${num}` as keyof typeof focusTemplate
                            ]
                              ? "outline outline-2 outline-primary"
                              : "border-[#E5E7EB]"
                          }`}
                          onClick={() =>
                            handleTemplateCardClick(`template${num}`)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleScroll("right")}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-all z-10"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* 4. Choose Mail Templates */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold mr-2">
                  4
                </span>
                Choose Mail Templates
              </h2>
              <p className="text-gray-600 mb-4 ml-10">
                Select templates for your gift emails. These emails will be sent
                to recipients at different stages.
              </p>
              <div className="flex gap-8 mb-6 ml-10">
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
                  <span className="text-sm text-gray-700">
                    In Transit Email
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDeliveredEmail}
                    onChange={() => setShowDeliveredEmail((v) => !v)}
                    className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Delivered Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAcknowledgedEmail}
                    onChange={() => setShowAcknowledgedEmail((v) => !v)}
                    className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Acknowledged Email
                  </span>
                </label>
              </div>
              {showAddressConfirmation && (
                <div className="mb-8 ml-10">
                  <h4 className="text-md font-medium mb-2">
                    Address Confirmation Email
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This email will be sent when requesting the recipient's
                    address.
                  </p>
                  <div className="mt-4">
                    <QuillEditor
                      content={emailTemplate.addressConfirmedEmail}
                      onChange={(value) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          addressConfirmedEmail: value,
                        }))
                      }
                      className="min-h-[300px]"
                    />
                  </div>
                </div>
              )}
              {showInTransit && (
                <div className="mb-8 ml-10">
                  <h4 className="text-md font-medium mb-2">In Transit Email</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This email will be sent when the gift is in transit to the
                    recipient.
                  </p>
                  <div className="mt-4">
                    <QuillEditor
                      content={emailTemplate.inTransitEmail}
                      onChange={(value) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          inTransitEmail: value,
                        }))
                      }
                      className="min-h-[300px]"
                    />
                  </div>
                </div>
              )}
              {showDeliveredEmail && (
                <div className="mb-8 ml-10">
                  <h4 className="text-md font-medium mb-2">Delivered Email</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This email will be sent when the gift is delivered to the
                    recipient.
                  </p>
                  <div className="mt-4">
                    <QuillEditor
                      content={emailTemplate.deliveredEmail}
                      onChange={(value) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          deliveredEmail: value,
                        }))
                      }
                      className="min-h-[300px]"
                    />
                  </div>
                </div>
              )}
              {showAcknowledgedEmail && (
                <div className="mb-8 ml-10">
                  <h4 className="text-md font-medium mb-2">
                    Acknowledged Email
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This email will be sent when the recipient acknowledges the
                    gift.
                  </p>
                  <div className="mt-4">
                    <QuillEditor
                      content={emailTemplate.acknowledgedEmail}
                      onChange={(value) =>
                        setEmailTemplate((prev) => ({
                          ...prev,
                          acknowledgedEmail: value,
                        }))
                      }
                      className="min-h-[300px]"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Require Approval Checkbox */}
            <div className="flex items-center gap-3 mt-6 ml-10">
              <Checkbox
                id="require-approval-checkbox"
                checked={requireApproval}
                onChange={() => setRequireApproval((v) => !v)}
              />
              <span className="text-sm font-medium">Require Approval</span>
            </div>
            {/* Update Button */}
            <div className="flex flex-col items-center mt-8">
              <button
                onClick={handleUpdatePlaybook}
                className={`flex items-center gap-3 bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-all ${
                  loadingUpdate ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loadingUpdate}
              >
                <Image
                  src="/svgs/Shimmer.svg"
                  alt="Shimmer"
                  width={24}
                  height={24}
                />
                {loadingUpdate ? "Updating..." : "Update Playbook"}
              </button>
              {errorforPowerUpWallet && (
                <p className="text-red-500 text-sm font-medium mt-2">
                  {errorforPowerUpWallet}
                </p>
              )}
            </div>
          </div>
          </div>
          
          {/* Modals */}
          {showTemplateModal && (
            <TemplateModal
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              onTemplateDataChange={setTemplateData}
              initialData={templateModalInitialData}
            />
          )}
          {/* Gift Selection Modal */}
          <div
            className={`${
              modal ? "translate-x-0" : "translate-x-full"
            } fixed z-50 right-0 top-0 bottom-0 left-0 duration-300 flex`}
          >
            <div
              onClick={() => setModal(false)}
              className="w-full bg-primary-xlight bg-opacity-80"
            ></div>
            <div className="w-[604px] overflow-y-auto shadow bg-white grid">
              <div className="w-full p-6">
                <div className="flex items-center justify-between h-fit">
                  <div className="text-xl font-medium">
                    {selectedBundles.size > 0
                      ? "Selected Bundles"
                      : "Select a bundle"}{" "}
                    Gifts
                  </div>
                  <svg
                    onClick={() => setModal(false)}
                    className="cursor-pointer stroke-black hover:stroke-red-400"
                    width="24"
                    height="24"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.0554 3.94444L3.94434 10.0556M3.94434 3.94444L10.0554 10.0556"
                      strokeWidth="1.01852"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {/* Gift List */}
                <div className="mt-[21px] text-xs font-medium border border-[#D2CEFE] rounded-lg h-fit">
                  <div className="text-[11px] text-[#101828] font-semibold flex items-center justify-between border-b px-8 border-[#D2CEFE]">
                    <div className="p-[11px]">GIFT ITEMS</div>
                    <div className="p-[11px]">COST</div>
                  </div>
                  {bundleGifts.map((gift, index) => (
                    <div
                      key={gift._id + index}
                      className="flex justify-between p-[11px] last:border-b-0 border-b border-[#D2CEFE]"
                    >
                      <div className="flex gap-3 items-center">
                        <Checkbox
                          id={`gift-card-${gift.name}`}
                          checked={selectedGiftsInModal.has(gift._id)}
                          onChange={() =>
                            handleGiftSelect(currentBundle?._id || "", gift._id)
                          }
                        />
                        <div className="flex gap-2 items-start">
                          <Image
                            src={gift.images?.primaryImgUrl || "/img/image.png"}
                            alt={gift.name || "gift"}
                            width={76}
                            height={76}
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement, Event>
                            ) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/img/image.png";
                            }}
                          />
                          <div className="grid gap-2">
                            <div className="w-[163px]">{gift.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 text-xs text-center font-medium">
                        ${gift.price}
                      </div>
                    </div>
                  ))}
                </div>
                {/* //? save button */}
                <div
                  className={`flex justify-end gap-3 mt-4 place-self-end border-t border-[#EAECF0] pt-4 w-full p-6 `}
                >
                  <button
                    onClick={() => setModal(false)}
                    className=" border border-[#D0D5DD] hover:bg-slate-50 text-xs font-medium text-[#344054] px-4 py-2.5 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setModal(false);
                    }}
                    className={`text-white text-xs font-medium px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
