"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { CalendarPublication } from "@/lib/hooks/use-calendar";
import { getPlatformIcon, getPlatformColor } from "@/lib/platform-icons";
import { cn, formatRelativeTime, formatDateTime } from "@/lib/utils";

interface PublishingQueueProps {
  publications: CalendarPublication[];
}

export function PublishingQueue({ publications }: PublishingQueueProps) {
  const upcoming = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return publications
      .filter((p) => {
        if (p.status !== "scheduled" || !p.scheduledAt) return false;
        const d = new Date(p.scheduledAt);
        return d >= now && d <= weekFromNow;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() -
          new Date(b.scheduledAt!).getTime()
      );
  }, [publications]);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Publishing Queue</h3>
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {upcoming.length}
        </span>
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {upcoming.map((pub) => {
          const Icon = getPlatformIcon(pub.platform);
          const color = getPlatformColor(pub.platform);
          return (
            <Link
              key={pub.id}
              href={`/dashboard/publications/${pub.id}`}
              className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-gray-50"
            >
              <Icon className={cn("h-4 w-4 shrink-0", color)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {pub.campaignObject.title || "Untitled"}
                </p>
                <p className="text-xs text-gray-500">
                  {pub.socialAccount.accountName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-blue-600">
                  {formatRelativeTime(pub.scheduledAt!)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {formatDateTime(pub.scheduledAt!)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
