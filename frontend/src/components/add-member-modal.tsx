"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Loader2 } from "lucide-react";
import { useSearchUsers, useAddCampaignMember } from "@/lib/hooks/use-team-members";

interface AddMemberModalProps {
  campaignId: string;
  onClose: () => void;
}

export function AddMemberModal({ campaignId, onClose }: AddMemberModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const addMember = useAddCampaignMember();
  const { data: users, isLoading: searching } = useSearchUsers(debouncedQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (userId: string) => {
    await addMember.mutateAsync({
      campaign: `/api/campaigns/${campaignId}`,
      user: `/api/users/${userId}`,
      role,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Team Member
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className="rounded border px-2 py-1 text-xs text-gray-700"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto">
          {searching && debouncedQuery.length >= 2 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : debouncedQuery.length < 2 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Type at least 2 characters to search
            </p>
          ) : !users || users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No users found
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(user.id)}
                    disabled={addMember.isPending}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {addMember.isError && (
          <p className="mt-3 text-sm text-red-600">
            {(addMember.error as Error)?.message || "Failed to add member"}
          </p>
        )}
      </div>
    </div>
  );
}
