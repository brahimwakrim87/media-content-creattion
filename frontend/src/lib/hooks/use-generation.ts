import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface GenerateContentInput {
  campaignObjectId: string;
  prompt: string;
  options?: {
    tone?: string;
    length?: string;
    platform?: string;
  };
}

export interface GenerateContentResponse {
  jobId: string;
  status: string;
}

export interface GenerationJob {
  id: string;
  campaignObject: {
    id: string;
    title: string | null;
    type: string;
  };
  provider: string;
  prompt: string;
  options: Record<string, unknown> | null;
  status: "pending" | "processing" | "completed" | "failed";
  result: string | null;
  tokensUsed: number | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GenerationStatusResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  provider: string;
  result: string | null;
  tokensUsed: number | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateContentInput) =>
      apiFetch<GenerateContentResponse>("/content/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["generations"] });
    },
  });
}

export function useGenerationStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["generations", jobId, "status"],
    queryFn: () =>
      apiFetch<GenerationStatusResponse>(
        `/content/generate/${jobId}/status`
      ),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });
}

export function useGenerationHistory(page = 1) {
  return useQuery({
    queryKey: ["generations", page],
    queryFn: () =>
      apiFetch<HydraCollection<GenerationJob>>(
        `/generation_jobs?page=${page}`
      ),
  });
}
