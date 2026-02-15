import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Tag, HydraCollection } from "./use-campaigns";

export interface ContentItem {
  id: string;
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  type: "video" | "post" | "article" | "image" | "advertisement";
  title: string | null;
  content: string | null;
  mediaUrl: string | null;
  status: "draft" | "generating" | "ready" | "approved" | "published";
  tags: Tag[];
  generationMeta: {
    lastGeneratedAt?: string;
    provider?: string;
    tokensUsed?: number;
    contentType?: string;
    mediaUrl?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentInput {
  campaign: string; // IRI: /api/campaigns/{id}
  type: string;
  title?: string;
  content?: string;
  tags?: string[]; // IRIs: /api/tags/{id}
}

export function useContentList(page = 1) {
  return useQuery({
    queryKey: ["content", page],
    queryFn: () =>
      apiFetch<HydraCollection<ContentItem>>(
        `/campaign_objects?page=${page}`
      ),
  });
}

export function useCampaignContent(campaignId: string, page = 1) {
  return useQuery({
    queryKey: ["content", "campaign", campaignId, page],
    queryFn: () =>
      apiFetch<HydraCollection<ContentItem>>(
        `/campaigns/${campaignId}/objects?page=${page}`
      ),
    enabled: !!campaignId,
  });
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: ["content", id],
    queryFn: () => apiFetch<ContentItem>(`/campaign_objects/${id}`),
    enabled: !!id,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContentInput) =>
      apiFetch<ContentItem>("/campaign_objects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateContentInput>) =>
      apiFetch<ContentItem>(`/campaign_objects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/campaign_objects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
