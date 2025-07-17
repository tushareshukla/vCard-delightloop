"use client"

import * as React from "react"
import { ChevronDown, Check, X, AlertCircle, Bell, Calendar, Clock, Mail, MessageSquare, Phone, Settings, User, FileText, Image, Video, Music, Package, Gift, Star, Heart, ThumbsUp, UserPlus, Tent, CalendarClock, Building, History, Flame, Award, Rocket, ArrowRightLeft, ArrowLeftRight, Trophy, HeartHandshake, Link } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface MotionOption {
  id: string;
  icon?: React.ReactNode;
  iconType?: keyof typeof lucideIcons;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

// Map of available Lucide icons
const lucideIcons = {
  check: Check,
  x: X,
  alertCircle: AlertCircle,
  bell: Bell,
  calendar: Calendar,
  clock: Clock,
  mail: Mail,
  messageSquare: MessageSquare,
  phone: Phone,
  settings: Settings,
  user: User,
  fileText: FileText,
  image: Image,
  video: Video,
  music: Music,
  package: Package,
  gift: Gift,
  star: Star,
  heart: Heart,
  thumbsUp: ThumbsUp,
  userPlus: UserPlus,
  tent: Tent,
  calendarClock: CalendarClock,
  building: Building,
  history: History,
  flame: Flame,
  award: Award,
  rocket: Rocket,
  arrowRightLeft: ArrowRightLeft,
  arrowLeftRight: ArrowLeftRight,
  trophy: Trophy,
  heartHandshake: HeartHandshake,
  linkIcon: Link,
}

interface MotionSelectProps {
  options: MotionOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: React.ReactNode;
  className?: string;
}

export function MotionSelect({ 
  options, 
  value,
  onChange,
  placeholder = "Select an option...",
  className
}: MotionSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selected = options.find(option => option.id === value);

  const handleSelect = (option: MotionOption) => {
    onChange(option.id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg p-4 w-full",
          "border border-gray-300 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
          "transition-colors",
          className
        )}
      >
        {selected ? (
          <SelectItem {...selected} />
        ) : (
          <span className="text-sm text-gray-500">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-lg border border-gray-200 rounded-lg"
        sideOffset={4}
      >
        <div className="overflow-hidden rounded-md">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-3 cursor-pointer",
                "transition-all duration-200",
                value === option.id
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100",
                option.className
              )}
            >
              <SelectItem {...option} />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SelectItem({ 
  icon, 
  iconType,
  title, 
  description 
}: Partial<MotionOption>) {
  // Render Lucide icon if iconType is provided
  const renderIcon = () => {
    if (icon) {
      return icon;
    }
    
    if (iconType && lucideIcons[iconType]) {
      const IconComponent = lucideIcons[iconType];
      return <IconComponent className="h-5 w-5 flex-shrink-0" />;
    }
    
    return null;
  };

  return (
    <>
      {renderIcon()}
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>
    </>
  )
} 