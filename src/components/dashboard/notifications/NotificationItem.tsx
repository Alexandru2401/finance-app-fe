import type { AppNotification } from "@/api/notifications";
import { Skeleton } from "@/components/ui/skeleton";
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
  // Extra buttons on the right (the notifications page: read / delete).
  // Rendered inside the item's @container, so they can use @md: classes
  actions?: ReactNode;
  compact?: boolean;
}

/**
 * One notification: icon, text, time ago and the unread dot.
 * @container: on narrow items (phones, the bell list) the time goes under
 * the text instead of squeezing the title next to it.
 */
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
        "@container group flex items-start gap-2 rounded-xl transition-colors @md:gap-3",
        compact
          ? "p-2.5 hover:bg-accent"
          : "border border-border/60 bg-card p-3 hover:border-border @md:p-3.5",
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
            "flex size-8 shrink-0 items-center justify-center rounded-full @md:size-9",
            tone,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "min-w-0 text-sm leading-snug wrap-break-word",
                unread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/80",
              )}
            >
              {title}
            </span>
            {/* Wide items: the time next to the title */}
            <span className="hidden shrink-0 pt-0.5 text-2xs text-muted-foreground @md:inline">
              {timeAgo}
            </span>
          </span>
          {description && (
            <span className="text-xs leading-relaxed wrap-break-word text-muted-foreground">
              {description}
            </span>
          )}
          {/* Narrow items: the time on its own line, under the text */}
          <span className="text-2xs text-muted-foreground @md:hidden">
            {timeAgo}
          </span>
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

/** Loading placeholder with the item's shape: icon, title, a description line, time. */
export function NotificationItemSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-start gap-3 rounded-xl",
        compact ? "p-2.5" : "border border-border/60 bg-card p-3 md:p-3.5",
      )}
    >
      <Skeleton className="size-8 shrink-0 rounded-full md:size-9" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <div className="flex h-5 items-center">
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="flex h-4 items-center">
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </div>
  );
}
