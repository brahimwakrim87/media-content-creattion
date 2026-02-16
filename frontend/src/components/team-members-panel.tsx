"use client";

import { useState } from "react";
import { Users, UserPlus, Trash2 } from "lucide-react";
import {
  useCampaignMembers,
  useRemoveCampaignMember,
  useUpdateCampaignMember,
} from "@/lib/hooks/use-team-members";
import { AddMemberModal } from "@/components/add-member-modal";
import { cn } from "@/lib/utils";

interface TeamMembersPanelProps {
  campaignId: string;
  isOwner: boolean;
}

export function TeamMembersPanel({ campaignId, isOwner }: TeamMembersPanelProps) {
  const { data, isLoading } = useCampaignMembers(campaignId);
  const removeMember = useRemoveCampaignMember();
  const updateMember = useUpdateCampaignMember();
  const [showAddModal, setShowAddModal] = useState(false);

  const members = data?.member ?? [];

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Team Members</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {members.length}
          </span>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-gray-50" />
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500">No team members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                {(member.user.firstName?.[0] || member.user.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {member.user.email}
                </p>
              </div>
              {isOwner ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    updateMember.mutate({
                      id: member.id,
                      role: e.target.value as "editor" | "viewer",
                    })
                  }
                  className="rounded border px-2 py-1 text-xs text-gray-700"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    member.role === "editor"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {member.role}
                </span>
              )}
              {isOwner && (
                <button
                  onClick={() => removeMember.mutate(member.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMemberModal
          campaignId={campaignId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
