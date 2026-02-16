import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface AnalyticsDashboard {
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
  };
  content: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
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

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () =>
      apiFetch<AnalyticsDashboard>("/analytics/dashboard"),
    staleTime: 2 * 60 * 1000,
  });
}
