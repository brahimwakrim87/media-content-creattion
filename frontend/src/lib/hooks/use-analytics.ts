import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface PipelineItem {
  status: string;
  count: number;
}

export interface AnalyticsDashboard {
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
  };
  content: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    pipeline: PipelineItem[];
  };
  publications: {
    total: number;
    byPlatform: Record<string, number>;
    byStatus: Record<string, number>;
  };
  generations: {
    total: number;
    completed: number;
    failed: number;
    totalTokens: number;
    avgProcessingTimeMs: number;
    byProvider: Record<string, number>;
  };
  team: {
    members: number;
    comments: number;
  };
  monthlyTrends: Array<{
    month: string;
    content: number;
    publications: number;
    generations: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    contentCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  content: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    pipeline: PipelineItem[];
  };
  publications: {
    total: number;
    byPlatform: Record<string, number>;
    byStatus: Record<string, number>;
  };
  generations: {
    total: number;
    completed: number;
    failed: number;
    totalTokens: number;
    avgProcessingTimeMs: number;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m" | "all";

export function useAnalytics(period: AnalyticsPeriod = "all") {
  return useQuery({
    queryKey: ["analytics", "dashboard", period],
    queryFn: () =>
      apiFetch<AnalyticsDashboard>(
        `/analytics/dashboard${period !== "all" ? `?period=${period}` : ""}`
      ),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCampaignAnalytics(campaignId: string) {
  return useQuery({
    queryKey: ["analytics", "campaign", campaignId],
    queryFn: () =>
      apiFetch<CampaignAnalytics>(`/analytics/campaigns/${campaignId}`),
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });
}
