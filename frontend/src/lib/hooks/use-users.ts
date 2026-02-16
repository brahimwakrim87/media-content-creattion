import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { HydraCollection } from "./use-campaigns";

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  roleEntities: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string | null;
}

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      apiFetch<HydraCollection<UserItem>>(`/users?page=${page}`),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiFetch<UserItem>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { isActive?: boolean; firstName?: string; lastName?: string }) =>
      apiFetch<UserItem>(`/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiFetch<RoleItem[]>("/admin/roles"),
  });
}

export function useUpdateUserRoles(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roles: string[]) =>
      apiFetch(`/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
