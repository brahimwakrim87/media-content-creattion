import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// --- Approvals ---

export interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  status: string;
  campaign: { id: string; name: string };
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useApprovals() {
  return useQuery({
    queryKey: ["approvals"],
    queryFn: () => apiFetch<ApprovalItem[]>("/approvals"),
  });
}

// --- Bulk Actions ---

export interface BulkActionResult {
  processed: number;
  errors: string[];
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; action: string }) =>
      apiFetch<BulkActionResult>("/content/bulk-action", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

// --- Global Search ---

export interface SearchResults {
  campaigns: {
    id: string;
    name: string;
    status: string;
    type: "campaign";
  }[];
  content: {
    id: string;
    title: string;
    status: string;
    campaignName: string;
    type: "content";
  }[];
  publications: {
    id: string;
    platform: string;
    status: string;
    title: string;
    type: "publication";
  }[];
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      apiFetch<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

// --- CSV Export ---

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

async function downloadCsv(endpoint: string, filename: string) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Export failed: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function useExportCampaigns() {
  return useMutation({
    mutationFn: () => downloadCsv("/campaigns/export", "campaigns.csv"),
  });
}

export function useExportContent() {
  return useMutation({
    mutationFn: () => downloadCsv("/content/export", "content.csv"),
  });
}
