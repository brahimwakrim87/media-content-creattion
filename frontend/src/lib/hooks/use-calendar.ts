import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface CalendarPublication {
  id: string;
  platform: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  campaignObject: {
    id: string;
    title: string | null;
    type: string;
  };
  socialAccount: {
    id: string;
    platform: string;
    accountName: string;
  };
}

export interface CalendarCampaign {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export function useCalendarPublications(from: string, to: string) {
  return useQuery({
    queryKey: ["calendar", "publications", from, to],
    queryFn: () =>
      apiFetch<CalendarPublication[]>(
        `/publications/calendar?from=${from}&to=${to}`
      ),
    enabled: !!from && !!to,
  });
}

export function useCalendarCampaigns(from: string, to: string) {
  return useQuery({
    queryKey: ["calendar", "campaigns", from, to],
    queryFn: () =>
      apiFetch<CalendarCampaign[]>(
        `/campaigns/calendar?from=${from}&to=${to}`
      ),
    enabled: !!from && !!to,
  });
}
