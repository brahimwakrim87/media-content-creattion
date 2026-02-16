"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCalendarPublications,
  useCalendarCampaigns,
} from "@/lib/hooks/use-calendar";
import { CalendarGrid } from "@/components/calendar-grid";
import { DayDetailPanel } from "@/components/day-detail-panel";
import { QuickScheduleModal } from "@/components/quick-schedule-modal";
import { PublishingQueue } from "@/components/publishing-queue";
import { formatDateISO } from "@/lib/utils";
import type { CalendarPublication } from "@/lib/hooks/use-calendar";

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPubs, setSelectedPubs] = useState<CalendarPublication[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>(today);

  const { from, to } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - offset);
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 41);
    return {
      from: formatDateISO(gridStart),
      to: formatDateISO(gridEnd),
    };
  }, [year, month]);

  const { data: publications = [], isLoading: pubsLoading } =
    useCalendarPublications(from, to);
  const { data: campaigns = [], isLoading: campsLoading } =
    useCalendarCampaigns(from, to);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const handleDayClick = (date: Date, pubs: CalendarPublication[]) => {
    setSelectedDate(date);
    setSelectedPubs(pubs);
  };

  const handlePublicationClick = (pub: CalendarPublication) => {
    window.location.href = `/dashboard/publications/${pub.id}`;
  };

  const handleScheduleClick = (date?: Date) => {
    setScheduleDate(date || selectedDate || today);
    setShowScheduleModal(true);
  };

  const monthLabel = new Date(year, month).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  const isLoading = pubsLoading || campsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and schedule your content publications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {monthLabel}
            </h2>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {isLoading ? (
            <div className="h-96 animate-pulse rounded-xl border bg-gray-50" />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <CalendarGrid
                year={year}
                month={month}
                publications={publications}
                campaigns={campaigns}
                onDayClick={handleDayClick}
                onPublicationClick={handlePublicationClick}
                selectedDate={selectedDate}
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Published
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Failed
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-6 rounded bg-purple-100" />{" "}
              Campaign
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDate && (
            <DayDetailPanel
              date={selectedDate}
              publications={selectedPubs}
              onClose={() => setSelectedDate(null)}
              onScheduleClick={() => handleScheduleClick()}
            />
          )}

          <PublishingQueue publications={publications} />
        </div>
      </div>

      {showScheduleModal && (
        <QuickScheduleModal
          date={scheduleDate}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}
