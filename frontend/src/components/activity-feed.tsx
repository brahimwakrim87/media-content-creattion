"use client";

import {
  Plus,
  Pencil,
  CheckCircle,
  MessageSquare,
  Send,
  UserPlus,
  UserMinus,
  Clock,
  XCircle,
} from "lucide-react";
import type { ActivityItem } from "@/lib/hooks/use-activity";
import { formatRelativeTime } from "@/lib/utils";

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  approve: CheckCircle,
  request_changes: XCircle,
  submit_review: Clock,
  comment: MessageSquare,
  publish: Send,
  add_member: UserPlus,
  remove_member: UserMinus,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-600",
  update: "bg-blue-100 text-blue-600",
  approve: "bg-emerald-100 text-emerald-600",
  request_changes: "bg-amber-100 text-amber-600",
  submit_review: "bg-purple-100 text-purple-600",
  comment: "bg-indigo-100 text-indigo-600",
  publish: "bg-cyan-100 text-cyan-600",
  add_member: "bg-teal-100 text-teal-600",
  remove_member: "bg-red-100 text-red-600",
};

function describeAction(item: ActivityItem): string {
  if (item.type === "comment") {
    return item.body ? `commented: "${item.body.slice(0, 100)}${item.body.length > 100 ? "..." : ""}"` : "left a comment";
  }

  const action = item.action || "update";

  if (item.details?.field) {
    return `updated ${item.details.field}${item.details.new ? ` to "${item.details.new}"` : ""}`;
  }

  switch (action) {
    case "create":
      return `created ${item.details?.title || item.entityType.toLowerCase()}`;
    case "approve":
      return "approved this content";
    case "request_changes":
      return "requested changes";
    case "submit_review":
      return "submitted for review";
    case "publish":
      return "published this content";
    case "add_member":
      return "added a team member";
    case "remove_member":
      return "removed a team member";
    default:
      return `${action}d ${item.entityType.toLowerCase()}`;
  }
}

interface ActivityFeedProps {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}

export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Activity</h3>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-4">
            {items.map((item, index) => {
              const actionKey = item.type === "comment" ? "comment" : (item.action || "update");
              const Icon = actionIcons[actionKey] || Pencil;
              const colorClass = actionColors[actionKey] || "bg-gray-100 text-gray-600";

              return (
                <div key={`${item.type}-${item.id || index}`} className="relative flex gap-3 pl-1">
                  <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">
                        {item.user
                          ? `${item.user.firstName} ${item.user.lastName}`
                          : "System"}
                      </span>{" "}
                      {describeAction(item)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
