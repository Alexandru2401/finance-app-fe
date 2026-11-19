import type { AppNotification } from "@/api/notifications";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useNotificationContent } from "@/hooks/useNotificationContent";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { parseISO } from "date-fns/parseISO";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface NotificationItemProps {
  notification: AppNotification;
  // Marks it as read (if needed) and opens its page
  onOpen: (notification: AppNotification, href: string) => void;
  // Extra buttons on the right (the notifications page: read / delete)
  actions?: ReactNode;
  compact?: boolean;
}

/** One notification: icon, text, time ago and the unread dot. */
export default function NotificationItem({
  notification,
  onOpen,
  actions,
  compact = false,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const {
    icon: Icon,
    tone,
    title,
    description,
    href,
  } = useNotificationContent(notification);
  const unread = notification.read_at === null;

  const timeAgo = formatDistanceToNow(parseISO(notification.created_at), {
    addSuffix: true,
    locale: dateLocale,
  });

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl transition-colors",
        compact
          ? "p-2.5 hover:bg-accent"
          : "border border-border/60 bg-card p-3.5 hover:border-border",
        unread && (compact ? "bg-accent/50" : "border-finance-warning/30"),
      )}
    >
      {/* The whole text opens the notification */}
      <button
        type="button"
        onClick={() => onOpen(notification, href)}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            tone,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm leading-snug",
                unread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/80",
              )}
            >
              {title}
            </span>
            <span className="shrink-0 pt-0.5 text-2xs text-muted-foreground">
              {timeAgo}
            </span>
          </span>
          {description && (
            <span className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        {unread && (
          <span className="mt-2 size-2 shrink-0 rounded-full bg-finance-warning shadow-[0_0_0_3px] shadow-finance-warning/20">
            <span className="sr-only">
              {t("dashboard.notifications.unread")}
            </span>
          </span>
        )}
      </button>

      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </div>
  );
}
