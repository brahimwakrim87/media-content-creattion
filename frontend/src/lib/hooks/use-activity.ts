import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ActivityItem {
  type: "audit" | "comment";
  action?: string;
  entityType: string;
  entityId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  details?: {
    field?: string;
    old?: string;
    new?: string;
    title?: string;
  } | null;
  id?: string;
  body?: string;
  createdAt: string;
}

export function useCampaignActivity(campaignId: string) {
  return useQuery({
    queryKey: ["activity", "campaign", campaignId],
    queryFn: () =>
      apiFetch<ActivityItem[]>(`/campaigns/${campaignId}/activity`),
    enabled: !!campaignId,
  });
}

export function useContentActivity(contentId: string) {
  return useQuery({
    queryKey: ["activity", "content", contentId],
    queryFn: () =>
      apiFetch<ActivityItem[]>(`/campaign_objects/${contentId}/activity`),
    enabled: !!contentId,
  });
}
