import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface CommentAuthor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  author: CommentAuthor;
  body: string;
  mentions: string[] | null;
  replies: Omit<Comment, "replies">[];
  createdAt: string;
  updatedAt: string;
}

export function useComments(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: () =>
      apiFetch<Comment[]>(`/entities/${entityType}/${entityId}/comments`),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entityType: string;
      entityId: string;
      body: string;
      parent?: string;
    }) =>
      apiFetch<Comment>("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiFetch<Comment>(`/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/comments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
