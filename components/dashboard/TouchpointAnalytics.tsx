/**
 * =====================================================
 * TOUCHPOINT ANALYTICS COMPONENT
 * =====================================================
 * 
 * This component provides individual recipient touchpoint timeline visualization
 * and analytics. It's designed to work in two modes: compact and full.
 * 
 * PURPOSE:
 * - Individual recipient journey visualization
 * - Touchpoint event timeline display
 * - Engagement analytics and scoring
 * - Interactive event details and metadata
 * 
 * DUAL MODE SUPPORT:
 * 1. COMPACT MODE (compact={true}):
 *    - Used in expanded recipient table rows
 *    - Minimal header, focused on timeline events
 *    - Smaller analytics cards and condensed layout
 * 
 * 2. FULL MODE (compact={false}):
 *    - Used in analytics tab and standalone views
 *    - Complete header with recipient info and engagement score
 *    - Full-sized analytics cards and detailed layout
 * 
 * TOUCHPOINT EVENT TYPES:
 * - invite_sent: Initial campaign invitation
 * - gift_selected: Gift assignment/selection
 * - address_confirmed: Recipient address verification
 * - message_viewed: Email/message engagement
 * - message_button_clicked: CTA button interactions
 * - gift_sent: Shipping initiation
 * - gift_in_transit: Delivery progress
 * - gift_delivered: Successful delivery
 * - landing_page_accessed: Landing page visits
 * - landing_page_button_clicked: Landing page CTAs
 * - feedback_submitted: Recipient feedback
 * 
 * DATA STRUCTURE:
 * - Receives TouchpointAnalytics objects from transformRecipientsToTouchpointAnalytics
 * - Events are sorted chronologically and rendered as timeline
 * - Analytics summary provides engagement scoring and stage tracking
 * 
 * USAGE CONTEXTS:
 * 1. Recipients Tab: Individual expanded rows (compact mode)
 * 2. Analytics Tab: Detailed recipient analysis (full mode)
 * 
 * @author Delightloop Development Team
 * @version 2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Mail, 
  Gift, 
  MapPin, 
  MessageSquare, 
  Eye, 
  MousePointer, 
  Package, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Calendar,
  User,
  Truck
} from 'lucide-react';

/**
 * =====================================================
 * DATA INTERFACES
 * =====================================================
 */

/**
 * Individual touchpoint event structure
 * Represents a single interaction or milestone in the recipient journey
 */
interface TouchpointEvent {
  id: string;                    // Unique event identifier
  type: TouchpointType;          // Event type classification
  timestamp: string;             // ISO timestamp of event occurrence
  data?: any;                   // Event-specific data payload
  metadata?: {                  // Optional tracking metadata
    userAgent?: string;         // Browser/client information
    ipAddress?: string;         // Client IP for geographic tracking
    location?: string;          // Geographic location
    referrer?: string;          // Source referrer URL
  };
}

/**
 * Touchpoint event type enumeration
 * Defines all possible touchpoint events in the recipient journey
 */
type TouchpointType = 
  | 'invite_sent'                    // Campaign invitation sent
  | 'gift_selected'                  // Gift assigned to recipient
  | 'address_confirmed'              // Shipping address verified
  | 'message_viewed'                 // Email/message opened
  | 'message_button_clicked'         // Email CTA button clicked
  | 'gift_sent'                      // Gift shipped
  | 'gift_in_transit'                // Gift in delivery
  | 'gift_delivered'                 // Gift successfully delivered
  | 'landing_page_accessed'          // Landing page visited
  | 'landing_page_button_clicked'    // Landing page CTA clicked
  | 'feedback_submitted';            // Feedback provided

/**
 * Complete touchpoint analytics data for a single recipient
 * Contains all events and calculated analytics for timeline visualization
 */
interface TouchpointAnalytics {
  recipientId: string;               // Unique recipient identifier
  recipientName: string;             // Recipient display name
  recipientEmail: string;            // Recipient email address
  events: TouchpointEvent[];         // Array of all touchpoint events
  summary: {                         // Calculated analytics summary
    totalInteractions: number;       // Count of all interactions
    firstInteraction?: string;       // Timestamp of first interaction
    lastInteraction?: string;        // Timestamp of last interaction
    engagementScore: number;         // Calculated engagement score (0-100)
    currentStage: string;            // Current journey stage
  };
}

/**
 * Props interface for TouchpointTimeline component
 */
interface TouchpointTimelineProps {
  analytics: TouchpointAnalytics;    // Recipient analytics data
  isExpanded?: boolean;              // Whether timeline is expanded (legacy)
  onToggle?: () => void;             // Toggle expansion callback (legacy)
  compact?: boolean;                 // Display mode: true=compact, false=full
}

/**
 * =====================================================
 * MAIN TOUCHPOINT TIMELINE COMPONENT
 * =====================================================
 * 
 * Renders individual recipient touchpoint timeline with events,
 * analytics summary, and interactive event details.
 * 
 * RENDERING MODES:
 * - Compact: Minimal layout for table row expansion
 * - Full: Complete layout with recipient header and full analytics
 * 
 * COMPONENT FEATURES:
 * - Chronological event timeline with visual indicators
 * - Color-coded event types with appropriate icons
 * - Interactive event details on click
 * - Analytics summary cards with key metrics
 * - Responsive design for different screen sizes
 */
const TouchpointTimeline: React.FC<TouchpointTimelineProps> = ({ 
  analytics, 
  isExpanded = false, 
  onToggle,
  compact = false 
}) => {
  /**
   * Component state for interactive features
   */
  const [selectedEvent, setSelectedEvent] = useState<TouchpointEvent | null>(null);

  /**
   * =====================================================
   * UTILITY FUNCTIONS
   * =====================================================
   */

  /**
   * Format timestamp for compact display (e.g., "Apr 17, 2:30 PM")
   */
  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFullDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  /**
   * Format relative time (e.g., "2 mins ago", "1 hour ago")
   */
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInMs = now.getTime() - eventTime.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return formatDateTime(timestamp);
  };

  const getEventIcon = (type: TouchpointType) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (type) {
      case 'invite_sent':
        return <Mail {...iconProps} />;
      case 'gift_selected':
        return <Gift {...iconProps} />;
      case 'address_confirmed':
        return <MapPin {...iconProps} />;
      case 'message_viewed':
        return <Eye {...iconProps} />;
      case 'message_button_clicked':
        return <MousePointer {...iconProps} />;
      case 'gift_sent':
        return <Package {...iconProps} />;
      case 'gift_in_transit':
        return <Truck {...iconProps} />;
      case 'gift_delivered':
        return <CheckCircle {...iconProps} />;
      case 'landing_page_accessed':
        return <Eye {...iconProps} />;
      case 'landing_page_button_clicked':
        return <MousePointer {...iconProps} />;
      case 'feedback_submitted':
        return <MessageSquare {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getEventColor = (type: TouchpointType) => {
    switch (type) {
      case 'invite_sent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'gift_selected':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'address_confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'message_viewed':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'message_button_clicked':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'gift_sent':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'gift_in_transit':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'gift_delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'landing_page_accessed':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'landing_page_button_clicked':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'feedback_submitted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTitle = (type: TouchpointType) => {
    switch (type) {
      case 'invite_sent':
        return 'Invitation Sent';
      case 'gift_selected':
        return 'Gift Selected';
      case 'address_confirmed':
        return 'Address Confirmed';
      case 'message_viewed':
        return 'Message Viewed';
      case 'message_button_clicked':
        return 'Message Button Clicked';
      case 'gift_sent':
        return 'Gift Sent';
      case 'gift_in_transit':
        return 'Gift In Transit';
      case 'gift_delivered':
        return 'Gift Delivered';
      case 'landing_page_accessed':
        return 'Landing Page Accessed';
      case 'landing_page_button_clicked':
        return 'Landing Page Button Clicked';
      case 'feedback_submitted':
        return 'Feedback Submitted';
      default:
        return 'Unknown Event';
    }
  };

  const getEventDescription = (event: TouchpointEvent) => {
    switch (event.type) {
      case 'invite_sent':
        return 'Initial invitation email sent to recipient';
      case 'gift_selected':
        return `Selected: ${event.data?.giftName || 'Gift'}`;
      case 'address_confirmed':
        return `Address verified: ${event.data?.address || 'Address confirmed'}`;
      case 'message_viewed':
        return `Viewed ${event.data?.viewDuration || 'for unknown duration'}`;
      case 'message_button_clicked':
        return `Clicked "${event.data?.buttonText || 'button'}"`;
      case 'gift_sent':
        return `Shipped via ${event.data?.carrier || 'carrier'} - ${event.data?.trackingId || 'N/A'}`;
      case 'gift_in_transit':
        return `Package in transit - ${event.data?.location || 'Unknown location'}`;
      case 'gift_delivered':
        return `Successfully delivered to recipient`;
      case 'landing_page_accessed':
        return `Accessed from ${event.data?.referrer || 'direct link'}`;
      case 'landing_page_button_clicked':
        return `Clicked "${event.data?.buttonText || 'button'}" on landing page`;
      case 'feedback_submitted':
        return `Submitted ${event.data?.feedbackType || 'feedback'}`;
      default:
        return 'Event occurred';
    }
  };

  const sortedEvents = [...analytics.events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getEngagementScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={compact ? "bg-white" : "bg-white border border-gray-200 rounded-lg shadow-sm"}>
      {/* Header - only show when not compact */}
      {!compact && (
        <div 
          className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-medium text-gray-900">{analytics.recipientName}</h3>
                <p className="text-sm text-gray-500">{analytics.recipientEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Engagement:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementScoreColor(analytics.summary.engagementScore)}`}>
                    {analytics.summary.engagementScore}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {analytics.summary.totalInteractions} touchpoints
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Content */}
      {(compact || isExpanded) && (
        <div className={compact ? "" : "p-4"}>
          {/* Header for non-compact mode */}
          {!compact && (
            <h4 className="font-medium text-gray-900 mb-4">Engagement Activity Feed</h4>
          )}

          {/* 2-Column Layout: Timeline Left, Metrics Right */}
          <div className="grid grid-cols-5 gap-6">
            {/* Timeline Column (Left - 3/5 width) */}
            <div className="col-span-3">
              <div className={compact ? "space-y-3" : "space-y-4"}>
                {sortedEvents.length > 0 ? (
                  <div className={compact ? "space-y-2" : "space-y-3"}>
                    {sortedEvents.map((event, index) => (
                      <div key={event.id} className="relative">
                        {/* Timeline line */}
                        {index < sortedEvents.length - 1 && (
                          <div className={`absolute ${compact ? 'left-4 top-8 w-0.5 h-8' : 'left-5 top-10 w-0.5 h-10'} bg-gray-200`}></div>
                        )}
                        
                        {/* Event card */}
                        <div 
                          className={`flex items-start space-x-3 cursor-pointer hover:bg-gray-50 ${compact ? 'rounded-md' : 'rounded-lg'} p-2 transition-colors w-full`}
                          onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                        >
                          <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center space-x-3 w-full">
                              <h5 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>{getEventTitle(event.type)}</h5>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{formatRelativeTime(event.timestamp)}</span>
                            </div>
                            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 ${compact ? 'mt-0.5' : 'mt-1'}`}>{getEventDescription(event)}</p>
                            
                            {/* Expanded details */}
                            {selectedEvent?.id === event.id && (
                              <div className={`${compact ? 'mt-2 p-2' : 'mt-3 p-3'} bg-gray-50 ${compact ? 'rounded-md' : 'rounded-lg'} border border-gray-200`}>
                                <div className="text-xs text-gray-500 mb-2">{compact ? 'Details' : 'Full Details'}</div>
                                <div className={`space-y-${compact ? '1' : '2'} ${compact ? 'text-xs' : 'text-sm'}`}>
                                  <div><span className="font-medium">Timestamp:</span> {formatFullDateTime(event.timestamp)}</div>
                                  {event.data && Object.keys(event.data).map(key => (
                                    <div key={key}>
                                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                      {typeof event.data[key] === 'object' ? JSON.stringify(event.data[key]) : event.data[key]}
                                    </div>
                                  ))}
                                  {event.metadata && (
                                    <div className={`${compact ? 'pt-1' : 'pt-2'} border-t border-gray-200`}>
                                      <div className="text-xs text-gray-500 mb-1">Metadata</div>
                                      {Object.entries(event.metadata).map(([key, value]) => (
                                        <div key={key} className="text-xs">
                                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center ${compact ? 'py-6' : 'py-8'}`}>
                    <Clock className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto ${compact ? 'mb-2' : 'mb-3'}`} />
                    <p className={`${compact ? 'text-xs' : ''} text-gray-500`}>
                      {compact ? 'No events recorded' : 'No touchpoint data available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Column (Right - 2/5 width) */}
            <div className="col-span-2">
              <div className="flex items-center justify-end space-x-2 text-xs overflow-x-auto">
                <div className="text-center flex-shrink-0">
                  <div className="text-gray-900 font-medium whitespace-nowrap">Total Interactions</div>
                  <div className="text-purple-600 font-bold whitespace-nowrap">{analytics.summary.totalInteractions}</div>
                </div>
                <div className="text-gray-300 text-lg h-10 flex items-center flex-shrink-0">/</div>
                <div className="text-center flex-shrink-0">
                  <div className="text-gray-900 font-medium whitespace-nowrap">First Interaction</div>
                  <div className="text-purple-600 font-bold whitespace-nowrap">
                    {analytics.summary.firstInteraction ? formatDateTime(analytics.summary.firstInteraction) : 'N/A'}
                  </div>
                </div>
                <div className="text-gray-300 text-lg h-10 flex items-center flex-shrink-0">/</div>
                <div className="text-center flex-shrink-0">
                  <div className="text-gray-900 font-medium whitespace-nowrap">Last Interaction</div>
                  <div className="text-purple-600 font-bold whitespace-nowrap">
                    {analytics.summary.lastInteraction ? formatDateTime(analytics.summary.lastInteraction) : 'N/A'}
                  </div>
                </div>
                <div className="text-gray-300 text-lg h-10 flex items-center flex-shrink-0">/</div>
                <div className="text-center flex-shrink-0">
                  <div className="text-gray-900 font-medium whitespace-nowrap">Current Stage</div>
                  <div className="text-purple-600 font-bold whitespace-nowrap">{analytics.summary.currentStage}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
  );
};

export default TouchpointTimeline;
export type { TouchpointAnalytics, TouchpointEvent, TouchpointType }; 