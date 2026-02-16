import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  mediaType: "image" | "video" | "other";
  folder: string | null;
  createdAt: string;
}

export function useMediaUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      fileOrOpts: File | { file: File; folder?: string }
    ): Promise<UploadResponse> => {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();

      if (fileOrOpts instanceof File) {
        formData.append("file", fileOrOpts);
      } else {
        formData.append("file", fileOrOpts.file);
        if (fileOrOpts.folder) formData.append("folder", fileOrOpts.folder);
      }

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
  });
}
