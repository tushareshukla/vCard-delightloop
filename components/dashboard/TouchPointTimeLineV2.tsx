/**
 * =====================================================
 * TOUCHPOINT ANALYTICS COMPONENT (API-DRIVEN V3.2.1)
 * =====================================================
 *
 * This component provides an enhanced individual recipient touchpoint timeline
 * visualization, driven by the /v1/recipient-timeline API endpoint.
 *
 * PURPOSE:
 * - Visualize a recipient's journey with a professional and slick UI.
 * - Render a chronological event timeline with interactive, user-friendly details.
 * - Automatically render clickable links for URLs found in event data.
 *
 * DATA STRUCTURE:
 * - Receives `timelineEvents` from the API.
 * - Uses API-driven CSS for event icon styling.
 *
 * @version 3.2.1 (Clean UI Refinement)
 */

import React, { useState } from "react";
import { Clock, ExternalLink } from "lucide-react";

/**
 * =====================================================
 * DATA INTERFACES
 * =====================================================
 */
interface ApiTimelineEvent {
    series: number;
    touchpointType: string;
    touchpointDisplayName: {
        label: string;
        icon: string;
        css: string;
    };
    touchpointData: Array<{
        data: {
            submissionTimestamp?: string;
            pageUrl?: string;
            [key: string]: any;
        };
        meta?: any;
    }>;
}

interface TouchpointTimelineProps {
    timelineEvents: ApiTimelineEvent[];
    isExpanded?: boolean;
}

/**
 * =====================================================
 * HELPER COMPONENT: EventDataDetails
 * =====================================================
 */
const EventDataDetails: React.FC<{ source: Record<string, any>; title: string }> = ({
    source,
    title,
}) => {
    if (!source || Object.keys(source).length === 0) return null;

    const entries = Object.entries(source).filter(
        ([key]) => key !== "submissionTimestamp"
    );
    if (entries.length === 0) return null;

    return (
        <div className="mb-3">
            <h5 className="text-xs font-semibold text-gray-700 mb-1">{title}</h5>
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <dl className="divide-y divide-gray-200 text-xs">
                    {entries.map(([key, value]) => (
                        <div
                            className="py-2 flex justify-between items-start"
                            key={key}
                        >
                            <dt className="font-medium text-gray-600 capitalize mr-2 w-1/3">
                                {key.replace(/([A-Z])/g, " $1")}:
                            </dt>
                            <dd className="text-gray-800 text-right w-2/3 break-all">
                                {key === "pageUrl" && typeof value === "string" ? (
                                    <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-end text-blue-600 hover:underline"
                                    >
                                        View Page <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                ) : (
                                    <span>{String(value) || "-"}</span>
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
};

/**
 * =====================================================
 * MAIN COMPONENT: TouchpointTimelineV2
 * =====================================================
 */
const TouchpointTimelineV2: React.FC<TouchpointTimelineProps> = ({
    timelineEvents,
    isExpanded = true,
}) => {
    const [selectedEvent, setSelectedEvent] = useState<ApiTimelineEvent | null>(null);

    const formatFullDateTime = (timestamp: string): string => {
        if (!timestamp) return "No timestamp available";
        try {
            return new Date(timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return "Invalid Date";
        }
    };

    if (!isExpanded) return null;

    if (!timelineEvents || timelineEvents.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 text-sm">No Touchpoints Recorded</h3>
                <p className="text-gray-500 text-xs mt-1">
                    When the recipient interacts with the campaign, events will appear here.
                </p>
            </div>
        );
    }

    const sortedEvents = [...timelineEvents].sort((a, b) => a.series - b.series);

    return (
        <div className="w-full space-y-4">
            {sortedEvents.map((event, index) => {
                const timestamp = event.touchpointData[0]?.data?.submissionTimestamp;
                const isSelected = selectedEvent?.series === event.series;

                return (
                    <div key={event.series} className="relative flex items-start gap-4">
                        {/* Vertical Line */}
                        {index < sortedEvents.length - 1 && (
                            <div className="absolute left-[15px] top-6 w-0.5 h-full bg-gray-200" />
                        )}

                        {/* Icon */}
                        <div
                            className={`relative z-10 flex items-center justify-center min-w-8 min-h-8 w-8 h-8 rounded-full border ${event.touchpointDisplayName.css}`}
                        >
                            <div
                                className="w-4 h-4 flex items-center justify-center"
                                dangerouslySetInnerHTML={{
                                    __html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">${event.touchpointDisplayName.icon}</div>`,
                                }}
                            />
                        </div>

                        {/* Card */}
                        <div className="flex-grow">
                            <div
                                className={`rounded-md border bg-white text-xs transition-all duration-200 ${isSelected ? "shadow-md border-primary/40" : "shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div
                                    className="p-3 cursor-pointer"
                                    onClick={() => setSelectedEvent(isSelected ? null : event)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-800 text-sm">
                                            {event.touchpointDisplayName.label}
                                        </h4>
                                        {timestamp && (
                                            <span className="text-xs text-gray-500 ml-2 mt-0.5">
                                                {formatFullDateTime(timestamp)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Panel */}
                                {isSelected && (
                                    <div className="px-4 pb-3 pt-2 border-t border-gray-200 animate-fade-in-up">
                                        {event.touchpointData.length > 0 ? (
                                            event.touchpointData.map((touchpoint, idx) => (
                                                <div key={idx} className="mt-2">
                                                    <EventDataDetails
                                                        source={touchpoint.data}
                                                        title={`Submission Data ${event.touchpointData.length > 1 ? `#${idx + 1}` : ""
                                                            }`}
                                                    />
                                                    <EventDataDetails
                                                        source={touchpoint.meta}
                                                        title="Metadata"
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 py-2 text-xs">
                                                No detailed data for this event.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TouchpointTimelineV2;
export type { ApiTimelineEvent };
