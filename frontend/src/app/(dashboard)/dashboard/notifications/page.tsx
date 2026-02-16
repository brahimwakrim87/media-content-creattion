"use client";

import { useState } from "react";
import {
  Bell,
  Sparkles,
  Send,
  FileText,
  Megaphone,
  Info,
  AtSign,
  UserPlus,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  useDeleteNotification,
  useClearReadNotifications,
} from "@/lib/hooks/use-notifications";
import { formatRelativeTime, cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Info> = {
  content: FileText,
  generation: Sparkles,
  publication: Send,
  campaign: Megaphone,
  mention: AtSign,
  member: UserPlus,
};

const typeLabels: Record<string, string> = {
  content: "Content",
  generation: "AI Generation",
  publication: "Publication",
  campaign: "Campaign",
  mention: "Mention",
  member: "Team",
};

const typeColors: Record<string, string> = {
  content: "bg-blue-100 text-blue-600",
  generation: "bg-purple-100 text-purple-600",
  publication: "bg-green-100 text-green-600",
  campaign: "bg-orange-100 text-orange-600",
  mention: "bg-pink-100 text-pink-600",
  member: "bg-teal-100 text-teal-600",
};

type FilterType = "all" | "unread" | string;

function NotificationCard({
  notification,
  onNavigate,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string | null;
    data: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: string;
  };
  onNavigate: (link: string) => void;
}) {
  const markRead = useMarkNotificationRead(notification.id);
  const deleteNotification = useDeleteNotification();
  const Icon = typeIcons[notification.type] || Info;
  const colorClass = typeColors[notification.type] || "bg-gray-100 text-gray-600";

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-lg border p-4 transition-colors",
        notification.isRead
          ? "border-gray-100 bg-white"
          : "border-blue-100 bg-blue-50/30"
      )}
    >
      <div className={cn("mt-0.5 shrink-0 rounded-lg p-2", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <button
        onClick={() => {
          if (!notification.isRead) markRead.mutate();
          const link = notification.data?.link as string | undefined;
          if (link) onNavigate(link);
        }}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              notification.isRead
                ? "text-gray-600"
                : "font-medium text-gray-900"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        {notification.message && (
          <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
            {typeLabels[notification.type] || notification.type}
          </span>
        </div>
      </button>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.isRead && (
          <button
            onClick={() => markRead.mutate()}
            title="Mark as read"
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => deleteNotification.mutate(notification.id)}
          title="Delete"
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const { data, isLoading } = useNotifications(page);
  const { data: countData } = useUnreadCount();
  const markAllRead = useMarkAllRead();
  const clearRead = useClearReadNotifications();

  const notifications = data?.member ?? [];
  const totalItems = data?.totalItems ?? 0;
  const unreadCount = countData?.count ?? 0;
  const totalPages = Math.ceil(totalItems / 10);

  const filtered =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.type === filter);

  const uniqueTypes = [...new Set(notifications.map((n) => n.type))];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => clearRead.mutate()}
            disabled={clearRead.isPending}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" />
        {["all", "unread", ...uniqueTypes].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all"
              ? "All"
              : f === "unread"
                ? `Unread (${unreadCount})`
                : typeLabels[f] || f}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
          <Bell className="h-8 w-8" />
          <p className="text-sm">
            {filter === "all"
              ? "No notifications yet"
              : "No notifications match this filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onNavigate={(link) => router.push(link)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({totalItems} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
