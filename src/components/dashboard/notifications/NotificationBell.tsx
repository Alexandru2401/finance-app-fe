import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/api/notifications";
import NotificationItem from "@/components/dashboard/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  refreshUnreadNotifications,
  setUnreadNotifications,
  useUnreadNotifications,
} from "@/hooks/useUnreadNotifications";
import { cn } from "@/lib/utils";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

// Notifications shown in the dropdown; the rest are on the notifications page
const LATEST = 5;

interface NotificationBellProps {
  className?: string;
}

/** Bell with the unread count; opens the latest notifications (F9-F10). */
export default function NotificationBell({ className }: NotificationBellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unread = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  // undefined = loading, null = request failed
  const [items, setItems] = useState<AppNotification[] | null | undefined>(
    undefined,
  );
  const [markingAll, setMarkingAll] = useState(false);

  // Loaded every time the dropdown opens, so it is never stale
  function load() {
    setItems(undefined);
    getNotifications({ limit: LATEST })
      .then((page) => setItems(page.notifications))
      .catch(() => setItems(null));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      load();
      refreshUnreadNotifications();
    }
  }

  async function openNotification(notification: AppNotification, href: string) {
    setOpen(false);
    navigate(href);
    if (notification.read_at !== null) return;
    try {
      await markNotificationRead(notification.id);
      if (unread !== null) setUnreadNotifications(unread - 1);
    } finally {
      refreshUnreadNotifications();
    }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) =>
        prev?.map((n) => ({ ...n, read_at: n.read_at ?? now })),
      );
      setUnreadNotifications(0);
    } catch {
      // The count is fetched again below; the list stays as it was
    } finally {
      setMarkingAll(false);
      refreshUnreadNotifications();
    }
  }

  const hasUnread = unread !== null && unread > 0;
  const label = hasUnread
    ? t("dashboard.notifications.bellUnread", { count: unread })
    : t("dashboard.notifications.title");

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            "group relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-xs transition-all",
            "hover:border-border hover:text-foreground hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[state=open]:border-finance-warning/60 data-[state=open]:text-foreground",
            className,
          )}
        >
          <Bell
            className="size-4.5 transition-transform group-hover:-rotate-12"
            aria-hidden="true"
          />
          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-finance-danger px-1 text-3xs font-semibold tabular-nums text-finance-foreground ring-2 ring-card"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl p-0 shadow-lg"
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">
              {t("dashboard.notifications.title")}
            </p>
            {hasUnread && (
              <span className="rounded-full bg-finance-danger/10 px-2 py-0.5 text-2xs font-semibold text-finance-danger">
                {t("dashboard.notifications.newCount", { count: unread })}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAll}
            disabled={markingAll || !hasUnread}
            className="h-7 cursor-pointer gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="size-3.5" aria-hidden="true" />
            {t("dashboard.notifications.markAll")}
          </Button>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto px-2 pb-2">
          {items === undefined ? (
            <div className="flex flex-col gap-1.5 p-1">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : items === null ? (
            <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
              <p className="text-sm text-destructive">
                {t("dashboard.notifications.loadError")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                className="cursor-pointer"
              >
                {t("dashboard.common.tryAgain")}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-muted-foreground">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent">
                <BellOff className="size-5" aria-hidden="true" />
              </span>
              {t("dashboard.notifications.empty")}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem
                    compact
                    notification={notification}
                    onOpen={openNotification}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t bg-muted/30 p-1.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full cursor-pointer text-xs font-medium"
          >
            <Link to="/dashboard/notifications" onClick={() => setOpen(false)}>
              {t("dashboard.notifications.seeAll")}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
