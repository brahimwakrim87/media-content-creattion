import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface MediaAssetItem {
  id: string;
  originalFilename: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  tags: string[] | null;
  folder: string | null;
  width: number | null;
  height: number | null;
  mediaType: "image" | "video" | "other";
  createdAt: string;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  folders: string[];
}

export function useMediaLibrary(params?: {
  page?: number;
  folder?: string;
  mimeType?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.folder) searchParams.set("folder", params.folder);
  if (params?.mimeType) searchParams.set("mimeType", params.mimeType);
  if (params?.search) searchParams.set("originalFilename", params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["media-library", params],
    queryFn: () =>
      apiFetch<HydraCollection<MediaAssetItem>>(
        `/media_assets${qs ? `?${qs}` : ""}`
      ),
  });
}

export function useMediaStats() {
  return useQuery({
    queryKey: ["media-library", "stats"],
    queryFn: () => apiFetch<MediaStats>("/media/stats"),
    staleTime: 60_000,
  });
}

export function useUpdateMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { alt?: string; tags?: string[]; folder?: string | null };
    }) =>
      apiFetch<MediaAssetItem>(`/media_assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
  });
}
