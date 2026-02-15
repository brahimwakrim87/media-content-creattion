import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface CampaignOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CampaignObject {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  owner: CampaignOwner;
  status: "draft" | "active" | "paused" | "completed";
  goals: Record<string, unknown> | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  tags: Tag[];
  campaignObjects?: CampaignObject[];
  createdAt: string;
  updatedAt: string;
}

export interface HydraCollection<T> {
  "hydra:member": T[];
  "hydra:totalItems": number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  status?: string;
  goals?: Record<string, unknown>;
  budget?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export function useCampaigns(page = 1) {
  return useQuery({
    queryKey: ["campaigns", page],
    queryFn: () =>
      apiFetch<HydraCollection<Campaign>>(`/campaigns?page=${page}`),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => apiFetch<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) =>
      apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateCampaignInput>) =>
      apiFetch<Campaign>(`/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
