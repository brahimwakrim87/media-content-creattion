import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface SocialAccount {
  id: string;
  platform:
    | "facebook"
    | "instagram"
    | "youtube"
    | "linkedin"
    | "tiktok"
    | "twitter";
  accountName: string;
  accountType: string | null;
  accountIdentifier: string;
  status: "active" | "expired" | "revoked" | "error";
  createdBy: { id: string; email: string; firstName: string; lastName: string };
  makeConnectionId: string | null;
  makeScenarioId: string | null;
  webhookUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export interface CreateAccountInput {
  platform: string;
  accountName: string;
  accountType?: string;
  accountIdentifier: string;
  metadata?: Record<string, unknown>;
}

export function useAccounts(page = 1) {
  return useQuery({
    queryKey: ["accounts", page],
    queryFn: () =>
      apiFetch<HydraCollection<SocialAccount>>(
        `/social_accounts?page=${page}`
      ),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => apiFetch<SocialAccount>(`/social_accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountInput) =>
      apiFetch<SocialAccount>("/social_accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateAccountInput> & { status?: string }) =>
      apiFetch<SocialAccount>(`/social_accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/social_accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
