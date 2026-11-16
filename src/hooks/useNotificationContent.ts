import type { AppNotification } from "@/api/notifications";
import { useCurrency } from "@/hooks/useCurrency";
import { useDateLocale } from "@/hooks/useDateLocale";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import {
  Bell,
  CalendarClock,
  PauseCircle,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export interface NotificationContent {
  icon: LucideIcon;
  // Icon colors
  tone: string;
  title: string;
  description?: string;
  // Where a click on the notification goes
  href: string;
}

const TRANSACTIONS = "/dashboard/transactions";
const CATEGORIES = "/dashboard/settings?tab=categories";

/** The translated text of a notification, built from its values (F12). */
export function useNotificationContent(
  notification: AppNotification,
): NotificationContent {
  const { t } = useTranslation();
  const { format: formatMoney } = useCurrency();
  const dateLocale = useDateLocale();
  const { data } = notification;

  const category = data.category ?? t("dashboard.common.uncategorized");
  const amount =
    typeof data.amount === "number"
      ? formatMoney(data.amount, "auto", true)
      : "";
  const date = data.date
    ? format(parseISO(data.date), "PPP", { locale: dateLocale })
    : "";

  switch (notification.type) {
    case "recurring_added":
      return {
        icon: Repeat,
        tone: "bg-finance-success-bg text-finance-success",
        title: t("dashboard.notifications.types.recurringAdded.title", {
          category,
        }),
        description: t(
          "dashboard.notifications.types.recurringAdded.description",
          { amount, date },
        ),
        href: TRANSACTIONS,
      };
    case "recurring_upcoming":
      return {
        icon: CalendarClock,
        tone: "bg-finance-primary-bg text-finance-primary",
        title: t("dashboard.notifications.types.recurringUpcoming.title", {
          category,
        }),
        description: t(
          "dashboard.notifications.types.recurringUpcoming.description",
          { amount, date },
        ),
        href: CATEGORIES,
      };
    case "recurring_paused":
      return {
        icon: PauseCircle,
        tone: "bg-finance-warning-bg text-finance-warning",
        title: t("dashboard.notifications.types.recurringPaused.title", {
          category,
        }),
        href: CATEGORIES,
      };
    default:
      return {
        icon: Bell,
        tone: "bg-muted text-muted-foreground",
        title: t("dashboard.notifications.types.unknown"),
        href: "/dashboard/notifications",
      };
  }
}
