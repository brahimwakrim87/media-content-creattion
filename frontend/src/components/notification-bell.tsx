"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Sparkles, Send, FileText, Megaphone, Info, AtSign, UserPlus } from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/lib/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Info> = {
  content: FileText,
  generation: Sparkles,
  publication: Send,
  campaign: Megaphone,
  mention: AtSign,
  member: UserPlus,
};

function NotificationRow({
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
  const Icon = typeIcons[notification.type] || Info;

  return (
    <button
      onClick={() => {
        if (!notification.isRead) markRead.mutate();
        const link = notification.data?.link as string | undefined;
        if (link) onNavigate(link);
      }}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      <div className="mt-0.5 shrink-0 rounded-md bg-gray-100 p-1.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
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
        {notification.message && (
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: countData } = useUnreadCount();
  const { data: notificationsData } = useNotifications();
  const markAllRead = useMarkAllRead();

  const unreadCount = countData?.count ?? 0;
  const notifications = notificationsData?.member ?? [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-80 rounded-xl border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 divide-y overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onNavigate={(link) => {
                      setOpen(false);
                      router.push(link);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
