import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Tag, HydraCollection } from "./use-campaigns";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => apiFetch<HydraCollection<Tag>>("/tags"),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      apiFetch<Tag>("/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
