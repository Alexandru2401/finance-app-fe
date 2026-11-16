import { del, get, patch } from "./client";

// In-app notifications (notification.md, N1-N2 / F8). The backend routes
// /notifications do not exist yet; while they are missing every call fails
// and the UI shows the error / no badge.

export type NotificationType =
  "recurring_added" | "recurring_upcoming" | "recurring_paused";

// The values, not the text: the frontend translates them and formats the
// amount in the user's currency
export interface NotificationData {
  recurring_id?: string;
  item_id?: string;
  // income | expense | savings
  type?: string;
  amount?: number;
  category?: string;
  // "YYYY-MM-DD"
  date?: string;
}

export interface AppNotification {
  id: string;
  // A type the frontend does not know yet is shown with a generic text
  type: NotificationType | (string & {});
  data: NotificationData;
  // null = unread
  read_at: string | null;
  created_at: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  total: number;
  page: number;
  totalPages: number;
}

type ApiError = { success?: boolean; message?: string } | null;

// GET /notifications?page=&limit=&unread=true → newest first
async function getNotifications({
  page = 1,
  limit = 20,
  unread = false,
}: {
  page?: number;
  limit?: number;
  unread?: boolean;
} = {}): Promise<NotificationsPage> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (unread) qs.set("unread", "true");

  const response = await get<{ success: boolean } & Partial<NotificationsPage>>(
    `/notifications?${qs}`,
  );
  if (!response.ok || !response.data?.notifications) {
    throw new Error("Could not load notifications");
  }
  return {
    notifications: response.data.notifications,
    total: response.data.total ?? response.data.notifications.length,
    page: response.data.page ?? page,
    totalPages: response.data.totalPages ?? 1,
  };
}

// GET /notifications/unread-count → the number on the bell
async function getUnreadCount(): Promise<number> {
  const response = await get<{ success: boolean; count?: number }>(
    "/notifications/unread-count",
  );
  if (!response.ok || typeof response.data?.count !== "number") {
    throw new Error("Could not load the unread count");
  }
  return response.data.count;
}

// PATCH /notifications/:id/read → 204
async function markNotificationRead(id: string): Promise<void> {
  const response = await patch<ApiError>(`/notifications/${id}/read`, {});
  if (!response.ok) throw new Error("Could not mark the notification as read");
}

// PATCH /notifications/read-all → 204
async function markAllNotificationsRead(): Promise<void> {
  const response = await patch<ApiError>("/notifications/read-all", {});
  if (!response.ok) throw new Error("Could not mark the notifications as read");
}

// DELETE /notifications/:id → 204
async function deleteNotification(id: string): Promise<void> {
  const response = await del<ApiError>(`/notifications/${id}`);
  if (!response.ok) throw new Error("Could not delete the notification");
}

export {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
