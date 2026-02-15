"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
  url: string;
  type?: "image" | "video";
  alt?: string;
  className?: string;
}

function detectType(url: string): "image" | "video" {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  return "image";
}

export function MediaPreview({ url, type, alt, className }: MediaPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const mediaType = type ?? detectType(url);

  return (
    <>
      <div className={cn("group relative", className)}>
        {mediaType === "video" ? (
          <video
            src={url}
            controls
            className="w-full rounded-lg"
            preload="metadata"
          />
        ) : (
          <div className="relative">
            <img
              src={url}
              alt={alt ?? "Media preview"}
              className="w-full rounded-lg object-cover"
            />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {mediaType === "video" ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={url}
              alt={alt ?? "Media preview"}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
