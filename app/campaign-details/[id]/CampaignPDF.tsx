import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

// Define types
interface Campaign {
  _id: string;
  name: string;
  title?: string;
  status: string;
  motion: string;
  description: string;
  creatorUserId: string;
  organization_id: string;
  approvedAt?: string;
  approverUserId?: string;
  eventId?: string;
  eventStartDate?: string;
  deliverByDate?: string;
  createdAt: string;
  updatedAt: string;
  budget: {
    totalBudget: number;
    maxPerGift: number;
    currency: string;
    spent: number;
  };
  cta_link?: string;
  emailTemplate: {
    addressConfirmedEmail: string;
    inTransitEmail: string;
    deliveredEmail: string;
    acknowledgedEmail: string;
  };
  giftSelectionMode: string;
  goal: string;
  outcomeCard?: {
    message: string;
    logoLink: string;
  };
  outcomeTemplate?: {
    buttonLink?: ReactNode;
    type: string;
    description: string;
    date: string;
    videoLink?: string;
    logoLink: string;
    buttonText?: string;
    mediaUrl?: string;
  };
  recipientSummary: {
    statusCounts: Record<string, number>;
    totalCount: number;
  };
  total_recipients: number;
}

interface Recipient {
  _id: string;
  name: string;
  email: string;
  company: string;
  title?: string;
  status: string;
  assignedGift?: {
    name: string;
    price?: number;
    description?: string;
  };
  deliveryDetails?: {
    deliveredDate?: string;
    acknowledgedAt?: string;
    estimatedDelivery?: string;
  };
  feedback?: {
    reaction1?: string;
    reaction2?: string;
  };
}

interface Stats {
  recipients: number;
  giftsSent: number;
  delivered: number;
  acknowledged: number;
  pending: number;
  totalBudget: number;
}

interface EventDetails {
  event?: {
    name?: string;
    location?: string;
  };
}

interface CampaignPDFProps {
  campaign: Campaign;
  recipients: Recipient[];
  stats: Stats;
  eventDetails?: EventDetails;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#F9FAFB',
    fontFamily: 'Helvetica',
  },
  // Header styles
  headerContainer: {
    marginBottom: 20,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    color: '#6B7280',
    fontSize: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  campaignSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  campaignBadge: {
    backgroundColor: '#EEF2FF',
    padding: '2 6',
    borderRadius: 4,
    color: '#4F46E5',
    fontSize: 10,
    marginRight: 10,
  },
  campaignDate: {
    color: '#6B7280',
    fontSize: 10,
  },
  
  // Metadata table styles - Exact match to screenshot
  metadataTable: {
    width: '100%',
    marginBottom: 25,
    flexDirection: 'row',
  },
  metadataColumn: {
    width: '50%',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metadataLabel: {
    color: '#6B7280',
    fontSize: 10,
    width: 100,
  },
  metadataValue: {
    color: '#111827',
    fontSize: 10,
    flex: 1,
  },
  metadataValueHighlight: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  
  // Stats section styles
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 10,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statValueBlue: {
    color: '#4F46E5',
  },
  statValuePurple: {
    color: '#7C3AED',
  },
  statValueCyan: {
    color: '#0EA5E9',
  },
  statValueGreen: {
    color: '#10B981',
  },
  statValueAmber: {
    color: '#F59E0B',
  },
  
  // Recipients section styles
  recipientsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  table: {
    width: '100%',
    borderColor: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  tableHeaderCell: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: 'medium',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  tableCell: {
    fontSize: 9,
    color: '#111827',
  },
  tableCellSecondary: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
  },
  recipientColumn: {
    width: '18%',
    paddingRight: 8,
  },
  companyColumn: {
    width: '18%',
    paddingRight: 8,
  },
  giftColumn: {
    width: '18%',
    paddingRight: 8,
  },
  statusColumn: {
    width: '15%',
    paddingRight: 8,
  },
  datesColumn: {
    width: '22%',
    paddingRight: 8,
  },
  feedbackColumn: {
    width: '9%',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '2 4',
    borderRadius: 12,
    fontSize: 8,
    alignSelf: 'flex-start',
  },
  statusAcknowledged: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  statusAwaitingAddress: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  statusOrderPlaced: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  positiveFeedback: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: 'bold',
  },
  negativeFeedback: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  noFeedback: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  keyDatesText: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  // Experience section styles - Matching screenshot exactly
  recipientExperienceContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipientExperienceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  experienceDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 20,
  },
  
  // Custom Message section styles - Enhanced to match web version
  customMessageSection: {
    marginBottom: 30,
  },
  customMessageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  customMessageDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 15,
  },
  customMessagePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center', // Center the card
  },
  messageEnvelope: {
    borderWidth: 1,
    borderColor: '#7C3AED', // Purple border
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    backgroundColor: 'white',
    width: 500, // Fixed width to match screenshot
    height: 200, // Fixed height to match screenshot
    position: 'relative', // For absolute positioning of elements inside
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  messageHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
  },
  qrCodeSection: {
    position: 'absolute',
    right: 20,
    top: 80,
  },
  qrCodeText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  qrCodeBox: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Updated logo styles for image instead of text
  logoImage: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 80, // Adjust width as needed
    height: 20, // Adjust height as needed
  },
  
  // Landing page section styles - Enhanced to match web version
  landingPageSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  landingPageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  landingPageDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 15,
  },
  landingPagePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center', // Center the card
  },
  previewBox: {
    backgroundColor: '#F3E8FF', // Light purple background to match web version
    borderRadius: 8,
    padding: 20,
    width: 500, // Fixed width to match screenshot
    height: 200, // Fixed height to match screenshot
    position: 'relative',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  previewDescription: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 1.5,
    width: '80%', // Limit width to make room for video placeholder
  },
  previewButton: {
    backgroundColor: '#7C3AED',
    color: 'white',
    padding: '8 16',
    borderRadius: 4,
    fontSize: 12,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Updated footer with logo image
  footerContainer: {
    position: 'absolute',
    right: 20,
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
  },
  heartIcon: {
    fontSize: 8,
    color: '#EF4444',
    marginHorizontal: 2,
  },
  footerLogoImage: {
    width: 80, // Adjust width as needed
    height: 20, // Adjust height as needed
    marginLeft: 4,
  },
  verticalDivider: {
    position: 'absolute',
    width: 1,
    height: '80%',
    backgroundColor: '#E5E7EB',
    left: '65%',
    top: '10%',
  },
});

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

// Helper function to determine feedback text
const getFeedbackDisplay = (feedback?: { reaction1?: string; reaction2?: string }) => {
  if (!feedback || !feedback.reaction1) return null;

  // Check reaction1 for thumbs up/down
  if (feedback.reaction1 === 'thumbs_up') {
    return { text: 'Positive', style: styles.positiveFeedback };
  }

  if (feedback.reaction1 === 'thumbs_down') {
    return { text: 'Negative', style: styles.negativeFeedback };
  }

  return null;
};

// Helper function to generate URLs
const generateUrls = (campaign: Campaign, recipient: Recipient) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.delightloop.com';
  
  return {
    buttonUrl: campaign.outcomeTemplate?.buttonText ? 
      `${baseUrl}/public/gift-tracker/${recipient._id}` : null,
    videoUrl: campaign.outcomeTemplate?.videoLink || null,
    landingUrl: `${baseUrl}/public-landing/${campaign._id}?recipient_id=${recipient._id}`,
  };
};

// Add removeEmojis helper function after the existing helper functions
const removeEmojis = (text: string): string => {
  if (!text) return '';
  // Remove emojis and other special characters
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
};

// Helper function to get status badge style
const getStatusBadgeStyle = (status: string) => {
  if (status === 'Acknowledged') return styles.statusAcknowledged;
  if (status === 'Awaiting Address Confirmation') return styles.statusAwaitingAddress;
  if (status === 'OrderPlaced' || status === 'Order Placed') return styles.statusOrderPlaced;
  return styles.statusPending;
};

// Helper function to get absolute URL for logo
const getAbsoluteLogoUrl = (logoPath: string): string => {
  // If the logo path is already an absolute URL, return it as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // Otherwise, construct an absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.delightloop.com';
  // Remove leading slash if present to avoid double slashes
  const path = logoPath.startsWith('/') ? logoPath.substring(1) : logoPath;
  return `${baseUrl}/${path}`;
};

// Helper function to get a valid video URL
const getVideoUrl = (videoLink?: string): string | null => {
  if (!videoLink) return null;
  
  // If it's already a valid URL, return it
  if (videoLink.startsWith('http://') || videoLink.startsWith('https://')) {
    return videoLink;
  }
  
  // If it's a YouTube video ID, construct the URL
  if (videoLink.match(/^[a-zA-Z0-9_-]{11}$/)) {
    return `https://www.youtube.com/watch?v=${videoLink}`;
  }
  
  // If it's a YouTube shortened URL
  if (videoLink.includes('youtu.be/')) {
    const videoId = videoLink.split('youtu.be/')[1];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  // Default case - return as is
  return videoLink;
};

const CampaignPDF: React.FC<CampaignPDFProps> = ({ campaign, recipients, stats, eventDetails }) => {
  // Format motion name for display
  const getMotionDisplayName = (motion: string): string => {
    switch (motion) {
      case "boost_registration": return "Boost Registration";
      case "ensure_attendance": return "Ensure Attendance";
      case "setup_meeting": return "Set up 1:1 Meeting";
      case "vip_box_pickup": return "VIP Box Pickup";
      case "express_send": return "Express Send";
      case "booth_giveaways": return "Booth Giveaways";
      case "thank_you": return "Thank You";
      default: return motion || "";
    }
  };

  // Get the actual message content from campaign data
  const messageContent = campaign.outcomeCard?.message || "We have reserved a seat for you!";
  
  // Get the actual logo URL from campaign data and ensure it's an absolute URL
  const logoUrl = campaign.outcomeCard?.logoLink 
    ? getAbsoluteLogoUrl(campaign.outcomeCard.logoLink) 
    : getAbsoluteLogoUrl("/Logo Final.png");
  
  // Get the actual landing page template data
  const landingTemplate = campaign.outcomeTemplate || {
    type: "template4",
    description: "Let's take this forward!",
    buttonText: "Select Gift",
    logoLink: "/Logo Final.png"
  };
  
  // Get landing page logo URL
  const landingLogoUrl = landingTemplate.logoLink 
    ? getAbsoluteLogoUrl(landingTemplate.logoLink)
    : logoUrl;
  
  // Get video URL if available
  const videoUrl = getVideoUrl(landingTemplate.videoLink);
  
  // Clean description text to remove emojis for PDF rendering
  const cleanDescription = removeEmojis(landingTemplate.description || "");

  return (
    <Document>
      {/* First Page - Campaign Details and Recipients */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header Section with Breadcrumb and Title */}
        <View style={styles.headerContainer}>
          <View style={styles.breadcrumb}>
            <Text>Campaigns / {campaign.name}</Text>
          </View>
          <Text style={styles.title}>{campaign.name}</Text>
          
          {/* Campaign Subtitle with Badge and Date */}
          <View style={styles.campaignSubtitle}>
            <View style={styles.campaignBadge}>
              <Text>{getMotionDisplayName(campaign.motion)}</Text>
            </View>
            <Text style={styles.campaignDate}>{formatDate(campaign.eventStartDate || campaign.createdAt)}</Text>
          </View>

          {/* Campaign Details in Tabular Format - Exact match to screenshot */}
          <View style={styles.metadataTable}>
            <View style={styles.metadataColumn}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>ID:</Text>
                <Text style={styles.metadataValue}>{campaign._id}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Status:</Text>
                <Text style={[styles.metadataValue, styles.metadataValueHighlight]}>{campaign.status.toUpperCase()}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Created:</Text>
                <Text style={styles.metadataValue}>{formatDate(campaign.createdAt)}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Last Updated:</Text>
                <Text style={styles.metadataValue}>{formatDate(campaign.updatedAt)}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Creator:</Text>
                <Text style={styles.metadataValue}>{campaign.creatorUserId}</Text>
              </View>
            </View>
            
            <View style={styles.metadataColumn}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Organization:</Text>
                <Text style={styles.metadataValue}>{campaign.organization_id}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Budget:</Text>
                <Text style={styles.metadataValue}>
                  {campaign.budget.totalBudget} {campaign.budget.currency} (Max per gift: {campaign.budget.maxPerGift})
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Gift Mode:</Text>
                <Text style={styles.metadataValue}>{campaign.giftSelectionMode}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Recipients:</Text>
                <Text style={styles.metadataValue}>{campaign.total_recipients}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Event:</Text>
                <Text style={styles.metadataValue}>{eventDetails?.event?.name || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Recipients</Text>
            <Text style={[styles.statValue, styles.statValueBlue]}>{stats.recipients}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Gifts Sent</Text>
            <Text style={[styles.statValue, styles.statValuePurple]}>{stats.giftsSent}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Delivered</Text>
            <Text style={[styles.statValue, styles.statValueCyan]}>{stats.delivered}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Acknowledged</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>{stats.acknowledged}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.statValueAmber]}>{stats.pending}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Budget</Text>
            <Text style={styles.statValue}>${stats.totalBudget}</Text>
          </View>
        </View>

        {/* Recipients Section */}
        <View style={styles.recipientsSection}>
          <Text style={styles.sectionTitle}>Recipients List</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.recipientColumn]}>RECIPIENT</Text>
              <Text style={[styles.tableHeaderCell, styles.companyColumn]}>COMPANY & ROLE</Text>
              <Text style={[styles.tableHeaderCell, styles.giftColumn]}>GIFT</Text>
              <Text style={[styles.tableHeaderCell, styles.statusColumn]}>STATUS</Text>
              <Text style={[styles.tableHeaderCell, styles.datesColumn]}>KEY DATES</Text>
              <Text style={[styles.tableHeaderCell, styles.feedbackColumn]}>FEEDBACK</Text>
            </View>
            {recipients.map((recipient, index) => (
              <View key={recipient._id || index} style={styles.tableRow}>
                <View style={styles.recipientColumn}>
                  <Text style={styles.tableCell}>{recipient.name}</Text>
                  <Text style={styles.tableCellSecondary}>{recipient.email}</Text>
                </View>
                <View style={styles.companyColumn}>
                  <Text style={styles.tableCell}>{recipient.company}</Text>
                  <Text style={styles.tableCellSecondary}>{recipient.title}</Text>
                </View>
                <View style={styles.giftColumn}>
                  <Text style={styles.tableCell}>{recipient.assignedGift?.name}</Text>
                  {recipient.assignedGift?.price && (
                    <Text style={styles.tableCellSecondary}>${recipient.assignedGift.price}</Text>
                  )}
                </View>
                <View style={styles.statusColumn}>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(recipient.status)]}>
                    <Text>{recipient.status}</Text>
                  </View>
                </View>
                <View style={styles.datesColumn}>
                  {recipient.deliveryDetails?.deliveredDate && (
                    <Text style={styles.keyDatesText}>
                      Delivered: {formatDate(recipient.deliveryDetails.deliveredDate)}
                    </Text>
                  )}
                  {recipient.deliveryDetails?.acknowledgedAt && (
                    <Text style={styles.keyDatesText}>
                      Acknowledged: {formatDate(recipient.deliveryDetails.acknowledgedAt)}
                    </Text>
                  )}
                  {recipient.deliveryDetails?.estimatedDelivery && (
                    <Text style={styles.keyDatesText}>
                      Est. Delivery: {formatDate(recipient.deliveryDetails.estimatedDelivery)}
                    </Text>
                  )}
                </View>
                <View style={styles.feedbackColumn}>
                  {(() => {
                    const feedbackDisplay = getFeedbackDisplay(recipient.feedback);
                    if (feedbackDisplay) {
                      return <Text style={feedbackDisplay.style}>{feedbackDisplay.text}</Text>;
                    }
                    return <Text style={styles.noFeedback}>-</Text>;
                  })()}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Second Page - Custom Message */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Recipient Experience Container - Matching screenshot exactly */}
        <View style={styles.recipientExperienceContainer}>
          <Text style={styles.recipientExperienceTitle}>Recipient Experience</Text>
          <Text style={styles.experienceDescription}>
            This section shows how recipients will experience your campaign.
          </Text>

          {/* Custom Message Section - Enhanced to match web version */}
          <View style={styles.customMessageSection}>
            <Text style={styles.customMessageTitle}>Custom Message</Text>
            <Text style={styles.customMessageDescription}>
              This personalized message will appear on the landing page and in notification emails.
            </Text>
            <View style={styles.customMessagePreview}>
              <View style={styles.messageEnvelope}>
                <Text style={styles.messageHeader}>Hi {"{{First Name}}"},</Text>
                <Text style={styles.messageText}>
                  {messageContent}
                </Text>
                <View style={styles.verticalDivider} />
                <View style={styles.qrCodeSection}>
                  <Text style={styles.qrCodeText}>Scan for a Special Message</Text>
                  <View style={styles.qrCodeBox} />
                </View>
                {/* Use Image component for logo with proper styling */}
                <Image 
                  src={logoUrl || "/placeholder.svg"} 
                  style={styles.logoImage}
                  cache={false}
                />
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* Third Page - Landing Page Template */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Recipient Experience Container - Matching screenshot exactly */}
        <View style={styles.recipientExperienceContainer}>
          {/* Landing Page Template Section - Enhanced to match web version */}
          <View style={styles.landingPageSection}>
            <Text style={styles.landingPageTitle}>Landing Page Template</Text>
            <Text style={styles.landingPageDescription}>
              This is the template recipients will see when they claim their gift.
            </Text>
            
            <View style={styles.landingPagePreview}>
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Hey {"{{First Name}}"}</Text>
                <Text style={styles.previewDescription}>
                  {cleanDescription}
                </Text>
                
                {landingTemplate.buttonText && videoUrl && (
                  <Link src={videoUrl}>
                    <View style={styles.previewButton}>
                      <Text style={styles.buttonText}>{landingTemplate.buttonText}</Text>
                    </View>
                  </Link>
                )}
                
                {landingTemplate.buttonText && !videoUrl && (
                  <View style={styles.previewButton}>
                    <Text style={styles.buttonText}>{landingTemplate.buttonText}</Text>
                  </View>
                )}
                
                {/* Use footer with logo image */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Made with</Text>
                  <Text style={styles.heartIcon}>♥</Text>
                  <Image 
                    src={landingLogoUrl || "/placeholder.svg"} 
                    style={styles.footerLogoImage}
                    cache={false}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CampaignPDF;