"use client";

import {
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Bell,
  Zap,
  Star,
  Link as LinkIcon,
} from "lucide-react";

interface AlertIconProps {
  iconName?: string;
  className?: string;
}

export default function AlertIcon({ iconName, className = "size-4" }: AlertIconProps) {
  switch (iconName) {
    case "megaphone":
      return <Megaphone className={className} />;
    case "warning":
      return <AlertTriangle className={className} />;
    case "info":
      return <Info className={className} />;
    case "success":
      return <CheckCircle className={className} />;
    case "bell":
      return <Bell className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "star":
      return <Star className={className} />;
    case "link":
      return <LinkIcon className={className} />;
    default:
      return null;
  }
} 