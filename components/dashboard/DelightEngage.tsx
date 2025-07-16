import { Sparkles, BotMessageSquare, Mail, Gift, MessageCircle, Play, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DelightEngageActivity = {
  id: string;
  type:
    | 'email_outreach'
    | 'linkedin_outreach'
    | 'address_updated'
    | 'digital_gift_claimed'
    | 'physical_gift_dispatched'
    | 'physical_gift_delivered'
    | 'landing_page_viewed'
    | 'webinar_registered'
    | 'resource_downloaded'
    | 'meeting_booked'
    | 'feedback_given';
  channel?: 'email' | 'linkedin' | 'web' | 'gift';
  campaignName: string;
  recipientName?: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: {
    feedbackType?: 'like' | 'text' | 'video' | 'audio';
    feedbackValue?: string;
    assetType?: 'video' | 'pdf' | 'webinar' | 'meeting';
    assetName?: string;
    giftId?: string;
  };
};

// Empty activities array for default state
const dummyActivities: DelightEngageActivity[] = [];

const getActivityIcon = (type: DelightEngageActivity['type']) => {
  switch (type) {
    case 'email_outreach':
    case 'linkedin_outreach':
      return <Mail className="w-5 h-5 text-violet-600" />;
    case 'physical_gift_delivered':
    case 'digital_gift_claimed':
      return <Gift className="w-5 h-5 text-violet-600" />;
    case 'feedback_given':
      return <MessageCircle className="w-5 h-5 text-violet-600" />;
    case 'webinar_registered':
    case 'landing_page_viewed':
      return <Play className="w-5 h-5 text-violet-600" />;
    case 'meeting_booked':
      return <CalendarClock className="w-5 h-5 text-violet-600" />;
    default:
      return <Sparkles className="w-5 h-5 text-violet-600" />;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

export default function DelightEngage() {
  return (
    <div className="bg-white rounded-lg p-6 border transition-all duration-300 hover:border-purple-200 h-full flex flex-col" style={{
      boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
      borderColor: '#EAECF0'
    }}>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(20deg); }
          40% { transform: rotate(-20deg); }
          60% { transform: rotate(20deg); }
          80% { transform: rotate(-20deg); }
        }
        .activity-row:hover .activity-icon {
          animation: shake 2.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .engage-icon:hover {
          animation: shake 2.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <div className="flex items-center mb-4">
        <div className="engage-icon w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <BotMessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delight Engage</h2>
        </div>
      </div>
      
      {dummyActivities.length === 0 ? (
        <div className="flex flex-col flex-grow">
          <p className="text-muted-foreground mb-auto">
            Delight Engage helps you deliver the right message through the right channel at the right time. 
            Our AI-powered platform crafts personalized outreach campaigns, suggests optimal channels, 
            and recommends physical or digital gifts that resonate with your prospects and customers.
          </p>
          
          <div className="mt-6">
            <Link
              href="https://www.delightloop.com/bookademo"
              className="block w-full"
            >
              <Button className="w-full text-white" size="lg">
                ✨ Activate DelightEngage
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dummyActivities.map((activity) => (
            <div key={activity.id} className="activity-row group flex justify-between items-start py-3 border-b border-muted/20 last:border-0 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer">
              <div className="flex gap-3">
                <div className="activity-icon w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  {activity.description && (
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  )}
                  <Link 
                    href="#" 
                    className="text-xs text-violet-600 hover:text-violet-700 hover:underline mt-1"
                  >
                    {activity.campaignName}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 