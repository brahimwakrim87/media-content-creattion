import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const platformIcons: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Globe,
};

export const platformColors: Record<string, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  youtube: "text-red-600",
  linkedin: "text-blue-700",
  twitter: "text-sky-500",
  tiktok: "text-gray-900",
};

export function getPlatformIcon(platform: string): LucideIcon {
  return platformIcons[platform] || Globe;
}

export function getPlatformColor(platform: string): string {
  return platformColors[platform] || "text-gray-600";
}
