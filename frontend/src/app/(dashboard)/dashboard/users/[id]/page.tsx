"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, ShieldAlert } from "lucide-react";
import {
  useUser,
  useUpdateUser,
  useRoles,
  useUpdateUserRoles,
} from "@/lib/hooks/use-users";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuthStore();
  const { data: user, isLoading, refetch } = useUser(id);
  const updateUser = useUpdateUser(id);
  const { data: allRoles } = useRoles();
  const updateRoles = useUpdateUserRoles(id);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roleEntities.map((r) => r.name));
    }
  }, [user]);

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            You need admin access to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500">User not found.</p>
        <Link
          href="/dashboard/users"
          className="mt-2 text-blue-600 hover:underline"
        >
          Back to users
        </Link>
      </div>
    );
  }

  const handleToggleActive = async () => {
    await updateUser.mutateAsync({ isActive: !user.isActive });
    refetch();
  };

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = async () => {
    await updateRoles.mutateAsync(selectedRoles);
    refetch();
  };

  const rolesChanged =
    JSON.stringify(selectedRoles.sort()) !==
    JSON.stringify(user.roleEntities.map((r) => r.name).sort());

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/users"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      {/* User info card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {(user.firstName || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={updateUser.isPending}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50",
              user.isActive
                ? "border border-red-300 text-red-700 hover:bg-red-50"
                : "border border-green-300 text-green-700 hover:bg-green-50"
            )}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>

        <div className="mt-4 flex gap-6 text-xs text-gray-500">
          <span>
            Created: {new Date(user.createdAt).toLocaleDateString()}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 font-medium",
              user.isActive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 font-medium",
              user.emailVerified
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {user.emailVerified ? "Email verified" : "Unverified"}
          </span>
        </div>
      </div>

      {/* Role assignment */}
      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Role Assignment
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select which roles this user should have.
        </p>

        <div className="mt-4 space-y-2">
          {(allRoles ?? []).map((role) => (
            <label
              key={role.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                selectedRoles.includes(role.name)
                  ? "border-blue-300 bg-blue-50"
                  : "hover:bg-gray-50"
              )}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.name)}
                onChange={() => handleRoleToggle(role.name)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {role.name}
                  </p>
                  {role.description && (
                    <p className="text-xs text-gray-500">{role.description}</p>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        {rolesChanged && (
          <button
            onClick={handleSaveRoles}
            disabled={updateRoles.isPending}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateRoles.isPending ? "Saving..." : "Save Roles"}
          </button>
        )}
      </div>
    </div>
  );
}
