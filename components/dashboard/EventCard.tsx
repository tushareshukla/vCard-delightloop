import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Tag } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    image?: string;
    date: string;
    location?: string;
    type: string;
    topics?: string[];
    updatedAt: string;
    status: string;
  };
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  // Function to format the status badge
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      upcoming: "bg-green-100 text-green-800 border-green-200",
      live: "bg-blue-100 text-blue-800 border-blue-200",
      past: "bg-gray-100 text-gray-800 border-gray-200",
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const statusClass = statusClasses[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
    
    return (
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${statusClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  // Function to format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Format date (e.g., "Jan 10, 2023")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate animation delay based on card index
  const calculateDelay = () => {
    const baseDelay = 400; // base delay in ms
    const increment = 100; // increment per card in ms
    return `${baseDelay + (index * increment)}ms`;
  };

  return (
    <Link href={`/event/${event.id}`} className="block">
      <div 
        className="rounded-xl border border-gray-200 hover:border-purple-200 shadow-sm bg-white transition-all duration-300 overflow-hidden group animate-card-deal"
        style={{ 
          animationDelay: calculateDelay(),
          animationFillMode: "forwards"
        }}
      >
        {/* Event Image with Status Badge */}
        <div className="relative h-[120px] w-full overflow-hidden">
          <Image
            src={event.image || "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop"}
            alt={event.name || "Event"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop";
            }}
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge(event.status)}
          </div>
          <div className="absolute bottom-2 left-2">
            <div className="bg-white/80 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm">
              Updated {getTimeAgo(event.updatedAt)}
            </div>
          </div>
        </div>

        {/* Event Header with Title and Meta Information */}
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 hover:text-primary transition-colors truncate group-hover:text-primary">
            {event.name}
          </h3>
          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.location && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>{event.location}</span>
                </div>
              </>
            )}
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-gray-400" />
              <span>{event.type}</span>
            </div>
          </div>

          {/* Event Topics/Tags */}
          {event.topics && event.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {event.topics.slice(0, 3).map((topic, index) => (
                <span 
                  key={index}
                  className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full shadow-sm hover:bg-purple-200 transition-colors"
                >
                  {topic}
                </span>
              ))}
              {event.topics.length > 3 && (
                <span className="text-xs text-gray-500">+{event.topics.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 