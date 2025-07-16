/**
 * =====================================================
 * ANALYTICS OVERVIEW COMPONENT
 * =====================================================
 * 
 * This component provides a comprehensive analytics dashboard for campaign
 * performance tracking and recipient engagement analysis.
 * 
 * PURPOSE:
 * - Campaign-wide analytics visualization
 * - Engagement distribution analysis  
 * - Stage progression tracking
 * 
 * COMPONENT STRUCTURE:
 * 1. Key Metrics Section: Total recipients, interactions, avg engagement
 * 2. Engagement Distribution: High/Medium/Low/Very Low engagement breakdown
 * 
 * DATA TRANSFORMATION:
 * - Receives TouchpointAnalytics[] from transformRecipientsToTouchpointAnalytics
 * - Calculates real-time analytics metrics
 * 
 * USAGE CONTEXT:
 * - Used in the "Analytics" tab of Campaign Details page
 * - Displays campaign-wide performance metrics
 * 
 * @author Delightloop Development Team
 * @version 2.1
 */

'use client';

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  MousePointer,
  Clock,
  Info
} from 'lucide-react';
import { TouchpointAnalytics } from './TouchpointAnalytics';

/**
 * Props interface for the AnalyticsOverview component
 */
interface AnalyticsOverviewProps {
  recipients: TouchpointAnalytics[];  // Transformed recipient analytics data
}

/**
 * Calculated analytics data structure
 * Contains all computed metrics derived from recipient touchpoint data
 */
interface AnalyticsData {
  totalInteractions: number;          // Sum of all recipient interactions
  averageEngagement: number;          // Campaign-wide average engagement score
  mostActiveDay: string;              // Date with most touchpoint activity
  engagementDistribution: {
    high: number;    // Recipients with 80%+ engagement
    medium: number;  // Recipients with 60-79% engagement
    low: number;     // Recipients with 40-59% engagement
    veryLow: number; // Recipients with <40% engagement
  };
}

/**
 * AnalyticsOverview Component
 * 
 * Main component that renders the analytics dashboard with campaign-wide
 * metrics and engagement distribution.
 */
const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  recipients
}) => {
  
  /**
   * =====================================================
   * ANALYTICS CALCULATIONS
   * =====================================================
   * 
   * Real-time calculation of campaign analytics metrics
   * This is the core logic that transforms TouchpointAnalytics
   * data into meaningful campaign insights.
   */
  const analyticsData: AnalyticsData = useMemo(() => {
    if (!recipients.length) {
      return {
        totalInteractions: 0,
        averageEngagement: 0,
        mostActiveDay: 'N/A',
        engagementDistribution: { high: 0, medium: 0, low: 0, veryLow: 0 }
      };
    }

    const totalInteractions = recipients.reduce((sum, r) => sum + r.summary.totalInteractions, 0);
    const averageEngagement = recipients.reduce((sum, r) => sum + r.summary.engagementScore, 0) / recipients.length;

    // Daily activity calculation for most active day
    const dailyMap = new Map<string, number>();
    recipients.forEach(recipient => {
      recipient.events.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });
    });

    const mostActiveDay = Array.from(dailyMap.entries()).reduce((max, [date, interactions]) => 
      interactions > max.interactions ? { date, interactions } : max, 
      { date: 'N/A', interactions: 0 }
    ).date;

    // Engagement distribution
    const engagementDistribution = recipients.reduce((acc, r) => {
      const score = r.summary.engagementScore;
      if (score >= 80) acc.high++;
      else if (score >= 60) acc.medium++;
      else if (score >= 40) acc.low++;
      else acc.veryLow++;
      return acc;
    }, { high: 0, medium: 0, low: 0, veryLow: 0 });

    return {
      totalInteractions,
      averageEngagement: Math.round(averageEngagement),
      mostActiveDay,
      engagementDistribution
    };
  }, [recipients]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <MousePointer className="w-8 h-8 text-purple-500" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Total Interactions</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalInteractions)}</p>
                <p className="text-xs text-gray-600">All recipient touchpoint activities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Avg. Engagement</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">{analyticsData.averageEngagement}%</p>
                <p className="text-xs text-gray-600">Overall campaign performance score</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-500" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Most Active Day</p>
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold text-gray-900">
                  {analyticsData.mostActiveDay !== 'N/A' 
                    ? new Date(analyticsData.mostActiveDay).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-gray-600">Peak engagement activity date</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Engagement Distribution</h3>
          <div className="relative group">
            <Info className="w-5 h-5 text-blue-500 cursor-help animate-pulse" />
            <div className="absolute right-0 top-6 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
              <div className="space-y-2">
                <p><span className="font-semibold text-purple-300">High (80%+):</span> Excellent performers. Use as case studies and advocates.</p>
                <p><span className="font-semibold text-purple-400">Medium (60-79%):</span> Good engagement. Target with personalized follow-ups.</p>
                <p><span className="font-semibold text-purple-500">Low (40-59%):</span> Needs attention. Try different messaging approaches.</p>
                <p><span className="font-semibold text-purple-600">Very Low (&lt;40%):</span> Re-engagement required or remove from future campaigns.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">{analyticsData.engagementDistribution.high}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">High Engagement</div>
            <div className="text-xs text-gray-600">80%+ Score</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">{analyticsData.engagementDistribution.medium}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">Medium Engagement</div>
            <div className="text-xs text-gray-600">60-79% Score</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">{analyticsData.engagementDistribution.low}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">Low Engagement</div>
            <div className="text-xs text-gray-600">40-59% Score</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">{analyticsData.engagementDistribution.veryLow}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">Very Low Engagement</div>
            <div className="text-xs text-gray-600">&lt;40% Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview; 