import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface Publication {
  id: string;
  campaignObject: {
    id: string;
    title: string | null;
    type: string;
    campaign: { id: string; name: string; status: string };
  };
  socialAccount: {
    id: string;
    platform: string;
    accountName: string;
  };
  platform: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  externalId: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePublicationInput {
  campaignObject: string; // IRI: /api/campaign_objects/{id}
  socialAccount: string; // IRI: /api/social_accounts/{id}
  scheduledAt?: string;
}

export function usePublications(page = 1, search = "") {
  return useQuery({
    queryKey: ["publications", page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("platform", search);
      return apiFetch<HydraCollection<Publication>>(`/publications?${params}`);
    },
  });
}

export function usePublication(id: string) {
  return useQuery({
    queryKey: ["publications", id],
    queryFn: () => apiFetch<Publication>(`/publications/${id}`),
    enabled: !!id,
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePublicationInput) =>
      apiFetch<Publication>("/publications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });
}

export function useUpdatePublication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status?: string; scheduledAt?: string }) =>
      apiFetch<Publication>(`/publications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/publications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });
}
