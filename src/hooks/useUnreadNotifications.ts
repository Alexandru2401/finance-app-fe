import { useSyncExternalStore } from "react";
import { getUnreadCount } from "@/api/notifications";

// The number of unread notifications, shared by every bell on the page (the
// sidebar one and the mobile header one are both mounted), so there is only
// one request and one timer for all of them.

// Fetched again every 15 minutes while the tab is visible, and right away when
// it becomes visible again or the page changes (notification.md, F9).
// Notifications are created once a night, so a short interval is not needed
const REFRESH_MS = 15 * 60_000;

// null = not loaded or the request failed (no badge then)
let count: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
// The latest request wins, so an older answer never overwrites a newer one
let requestId = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

/** Fetches the unread count again, e.g. after the user reads a notification. */
export function refreshUnreadNotifications() {
  const id = ++requestId;
  getUnreadCount()
    .then((value) => {
      if (id !== requestId) return;
      count = value;
      emit();
    })
    .catch(() => {
      if (id !== requestId) return;
      count = null;
      emit();
    });
}

/** Changes the count right away (e.g. after "mark all as read"), before the refetch. */
export function setUnreadNotifications(value: number) {
  count = Math.max(0, value);
  emit();
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") refreshUnreadNotifications();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // The first bell starts the timer, the last one stops it
  if (listeners.size === 1) {
    refreshUnreadNotifications();
    timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshUnreadNotifications();
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

export function useUnreadNotifications(): number | null {
  return useSyncExternalStore(subscribe, () => count);
}
