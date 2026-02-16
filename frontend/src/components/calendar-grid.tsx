"use client";

import { useMemo } from "react";
import { cn, getCalendarDays, isSameDay, formatDateISO } from "@/lib/utils";
import type { CalendarPublication, CalendarCampaign } from "@/lib/hooks/use-calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusDotColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  published: "bg-green-500",
  publishing: "bg-yellow-500",
  failed: "bg-red-500",
  draft: "bg-gray-400",
};

interface CalendarGridProps {
  year: number;
  month: number;
  publications: CalendarPublication[];
  campaigns: CalendarCampaign[];
  onDayClick: (date: Date, publications: CalendarPublication[]) => void;
  onPublicationClick: (pub: CalendarPublication) => void;
  selectedDate?: Date | null;
}

export function CalendarGrid({
  year,
  month,
  publications,
  campaigns,
  onDayClick,
  onPublicationClick,
  selectedDate,
}: CalendarGridProps) {
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);
  const today = new Date();

  const pubsByDate = useMemo(() => {
    const map: Record<string, CalendarPublication[]> = {};
    for (const pub of publications) {
      const dateStr = pub.scheduledAt
        ? pub.scheduledAt.split("T")[0]
        : pub.publishedAt
          ? pub.publishedAt.split("T")[0]
          : null;
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(pub);
      }
    }
    return map;
  }, [publications]);

  const getCampaignsForDay = (date: Date) => {
    return campaigns.filter((c) => {
      if (!c.startDate || !c.endDate) return false;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return date >= start && date <= end;
    });
  };

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l">
        {days.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const dateStr = formatDateISO(date);
          const dayPubs = pubsByDate[dateStr] || [];
          const hasCampaign = getCampaignsForDay(date).length > 0;

          return (
            <div
              key={i}
              onClick={() => onDayClick(date, dayPubs)}
              className={cn(
                "relative min-h-[80px] cursor-pointer border-b border-r p-1.5 transition-colors hover:bg-gray-50",
                !isCurrentMonth && "bg-gray-50/50 text-gray-300",
                isToday && "ring-2 ring-inset ring-blue-500",
                isSelected && "bg-blue-50",
                hasCampaign && isCurrentMonth && "bg-purple-50/40"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isToday &&
                    "rounded-full bg-blue-600 px-1.5 py-0.5 text-white"
                )}
              >
                {date.getDate()}
              </span>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {dayPubs.slice(0, 4).map((pub) => (
                  <button
                    key={pub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublicationClick(pub);
                    }}
                    title={`${pub.campaignObject.title || "Untitled"} - ${pub.socialAccount.accountName}`}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      statusDotColors[pub.status] || "bg-gray-400"
                    )}
                  />
                ))}
                {dayPubs.length > 4 && (
                  <span className="text-[10px] text-gray-400">
                    +{dayPubs.length - 4}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
