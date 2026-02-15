import { useMutation } from "@tanstack/react-query";

export interface UploadResponse {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export function useMediaUpload() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", file);

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
  });
}
