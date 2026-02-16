import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  type: "string" | "boolean" | "integer";
  description: string | null;
  updatedAt: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      apiFetch<HydraCollection<SettingItem>>("/system_settings"),
  });
}

export function useUpdateSetting(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: string) =>
      apiFetch<SettingItem>(`/system_settings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
