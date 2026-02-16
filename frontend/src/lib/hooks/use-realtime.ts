"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { NotificationItem } from "./use-notifications";

export interface RealtimeNotification extends NotificationItem {
  _realtime: true;
}

type NotificationCallback = (notification: RealtimeNotification) => void;

const listeners = new Set<NotificationCallback>();
let activeSource: EventSource | null = null;
let activeTopic: string | null = null;

function connectMercure(topic: string, hubUrl: string) {
  if (activeSource) {
    activeSource.close();
    activeSource = null;
  }

  const url = new URL(hubUrl, window.location.origin);
  url.searchParams.append("topic", topic);

  const es = new EventSource(url.toString(), { withCredentials: true });

  es.onmessage = (event) => {
    try {
      const notification: RealtimeNotification = {
        ...JSON.parse(event.data),
        _realtime: true,
      };
      listeners.forEach((cb) => cb(notification));
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = () => {
    // EventSource auto-reconnects on error
  };

  activeSource = es;
  activeTopic = topic;
}

function disconnectMercure() {
  if (activeSource) {
    activeSource.close();
    activeSource = null;
    activeTopic = null;
  }
}

export function useRealtimeNotifications(
  onNotification?: NotificationCallback
) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  // Register the callback
  useEffect(() => {
    const cb: NotificationCallback = (notification) => {
      callbackRef.current?.(notification);
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  // Invalidate queries on any real-time notification
  useEffect(() => {
    const cb: NotificationCallback = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, [queryClient]);

  // Connect to Mercure when authenticated
  const connect = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { topic } = await apiFetch<{ topic: string }>(
        "/notifications/mercure-auth"
      );

      if (activeTopic !== topic) {
        connectMercure(topic, "/.well-known/mercure");
      }
    } catch {
      // Mercure not available — fall back to polling (already in use-notifications.ts)
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect();
    }
    return () => {
      // Only disconnect if no listeners remain
      if (listeners.size === 0) {
        disconnectMercure();
      }
    };
  }, [isAuthenticated, user?.id, connect]);
}
