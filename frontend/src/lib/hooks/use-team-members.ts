import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "@/lib/hooks/use-campaigns";

export interface CampaignMember {
  id: string;
  campaign: { id: string };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  role: "editor" | "viewer";
  joinedAt: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export function useCampaignMembers(campaignId: string) {
  return useQuery({
    queryKey: ["campaign-members", campaignId],
    queryFn: () =>
      apiFetch<HydraCollection<CampaignMember>>(
        `/campaign_members?campaign=/api/campaigns/${campaignId}`
      ),
    enabled: !!campaignId,
  });
}

export function useAddCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      campaign: string;
      user: string;
      role: "editor" | "viewer";
    }) =>
      apiFetch<CampaignMember>("/campaign_members", {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-members"] });
    },
  });
}

export function useUpdateCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: "editor" | "viewer" }) =>
      apiFetch<CampaignMember>(`/campaign_members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-members"] });
    },
  });
}

export function useRemoveCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/campaign_members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-members"] });
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: () => apiFetch<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
