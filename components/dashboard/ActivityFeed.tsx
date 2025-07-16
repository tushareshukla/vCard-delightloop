import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, Bell, PlusCircle, BotMessageSquare, Megaphone } from "lucide-react";

interface ActivityItem {
  id: string;
  emoji: string;
  message: string;
  campaignId?: string;
  formattedText?: string;
  campaignName?: string;
  description?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const EmptyActivityState = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
        <Bell className="h-6 w-6 text-purple-600" />
      </div>
      <h3 className="text-base font-medium text-gray-700 mb-2">No activity yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Your campaign activity will appear here once you create and launch your first campaign.
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 border transition-all duration-300 hover:border-purple-200" style={{
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
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Megaphone className="w-5 h-5 text-primary mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Recent Campaign Activity</h2>
        </div>
      </div>
      
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="activity-row group flex justify-between items-start py-3 border-b border-muted/20 last:border-0 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex gap-3">
                <div className="activity-icon w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{activity.formattedText || activity.message}</p>
                  {activity.campaignName && (
                    <Link 
                      href={activity.campaignId ? `/campaign-details/${activity.campaignId}` : "#"}
                      className="text-xs text-violet-600 hover:text-violet-700 hover:underline mt-1"
                    >
                      {activity.campaignName}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyActivityState />
        )}
      </div>
    </div>
  );
} 