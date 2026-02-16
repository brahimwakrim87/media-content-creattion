"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { CalendarPublication } from "@/lib/hooks/use-calendar";
import { StatusBadge } from "@/components/status-badge";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { cn } from "@/lib/utils";

interface DayDetailPanelProps {
  date: Date;
  publications: CalendarPublication[];
  onClose: () => void;
  onScheduleClick: () => void;
}

export function DayDetailPanel({
  date,
  publications,
  onClose,
  onScheduleClick,
}: DayDetailPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {date.toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {publications.length === 0 ? (
        <p className="text-sm text-gray-500">No publications on this day.</p>
      ) : (
        <div className="space-y-2">
          {publications.map((pub) => {
            const Icon = getPlatformIcon(pub.platform);
            const color = getPlatformColor(pub.platform);
            return (
              <Link
                key={pub.id}
                href={`/dashboard/publications/${pub.id}`}
                className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-gray-50"
              >
                <Icon className={cn("h-4 w-4", color)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pub.campaignObject.title ||
                      `Untitled ${pub.campaignObject.type}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pub.socialAccount.accountName}
                  </p>
                </div>
                <StatusBadge status={pub.status} variant="publication" />
              </Link>
            );
          })}
        </div>
      )}
      <button
        onClick={onScheduleClick}
        className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600"
      >
        + Schedule publication
      </button>
    </div>
  );
}
