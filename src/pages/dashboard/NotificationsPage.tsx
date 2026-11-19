import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationsPage as NotificationsResult,
} from "@/api/notifications";
import NotificationItem, {
  NotificationItemSkeleton,
} from "@/components/dashboard/notifications/NotificationItem";
import CardError from "@/components/dashboard/shared/CardError";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  refreshUnreadNotifications,
  useUnreadNotifications,
} from "@/hooks/useUnreadNotifications";
import { BellOff, Check, CheckCheck, Ellipsis, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

/** Every notification, paginated, with read / delete (F11). */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotifications();
  // The filter lives in the URL (?filter=unread), so Back keeps it
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: Filter =
    searchParams.get("filter") === "unread" ? "unread" : "all";
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  // Key of the request the result belongs to, so a new filter / page shows loading
  const requestKey = `${filter}#${page}#${reloadKey}`;
  const [result, setResult] = useState<{
    key: string;
    data: NotificationsResult | null;
  } | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let ignore = false;
    getNotifications({ page, limit: PAGE_SIZE, unread: filter === "unread" })
      .then((data) => !ignore && setResult({ key: requestKey, data }))
      .catch(() => !ignore && setResult({ key: requestKey, data: null }));
    return () => {
      ignore = true;
    };
  }, [filter, page, requestKey]);

  const loading = result?.key !== requestKey;
  const data = loading ? undefined : result?.data;

  const reload = () => setReloadKey((k) => k + 1);

  // After a change: the list and the bell are fetched again
  function changed() {
    reload();
    refreshUnreadNotifications();
  }

  function changeFilter(value: string) {
    setPage(1);
    setSearchParams(value === "unread" ? { filter: "unread" } : {}, {
      replace: true,
    });
  }

  async function open(notification: AppNotification, href: string) {
    if (notification.read_at === null) {
      // Fire and forget: the page changes anyway
      markNotificationRead(notification.id)
        .catch(() => {})
        .finally(refreshUnreadNotifications);
    }
    navigate(href);
  }

  async function markRead(notification: AppNotification) {
    try {
      await markNotificationRead(notification.id);
      changed();
    } catch {
      toast.error(t("dashboard.notifications.errors.update"));
    }
  }

  async function remove(notification: AppNotification) {
    try {
      await deleteNotification(notification.id);
      // The last one of a page: go back one page instead of showing it empty
      if (data?.notifications.length === 1 && page > 1) setPage(page - 1);
      changed();
      toast.success(t("dashboard.notifications.deleted"));
    } catch {
      toast.error(t("dashboard.notifications.errors.delete"));
    }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      changed();
    } catch {
      toast.error(t("dashboard.notifications.errors.update"));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-4">
      <PageHeader
        title={t("dashboard.notifications.title")}
        subtitle={t("dashboard.notifications.subtitle")}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={markAll}
          disabled={markingAll || !unreadCount}
          className="cursor-pointer gap-1.5"
        >
          <CheckCheck size={16} aria-hidden="true" />
          {t("dashboard.notifications.markAll")}
        </Button>
      </PageHeader>

      <Tabs value={filter} onValueChange={changeFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="all" className="cursor-pointer">
            {t("dashboard.notifications.filters.all")}
          </TabsTrigger>
          <TabsTrigger value="unread" className="cursor-pointer gap-1.5">
            {t("dashboard.notifications.filters.unread")}
            {unreadCount !== null && unreadCount > 0 && (
              <span className="rounded-full bg-finance-danger px-1.5 text-3xs font-semibold leading-4 text-finance-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Phones: no outer card, the items are cards themselves (a card in a
          card wastes the narrow width); from md the list sits in a card */}
      <Card className="gap-0 border-0 bg-transparent py-0 shadow-none md:border md:bg-card md:py-4">
        <CardContent className="px-0 md:px-6">
          {data === undefined ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <NotificationItemSkeleton key={i} />
              ))}
            </div>
          ) : data === null ? (
            <CardError
              message={t("dashboard.notifications.loadError")}
              onRetry={reload}
            />
          ) : data.notifications.length === 0 ? (
            <EmptyState
              icon={BellOff}
              message={
                filter === "unread"
                  ? t("dashboard.notifications.emptyUnread")
                  : t("dashboard.notifications.empty")
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.notifications.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onOpen={open}
                    actions={
                      <>
                        {/* Narrow items: read / delete in a "..." menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 cursor-pointer @md:hidden"
                              aria-label={t("dashboard.notifications.actions")}
                            >
                              <Ellipsis className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {notification.read_at === null && (
                              <DropdownMenuItem
                                onSelect={() => markRead(notification)}
                              >
                                <Check />
                                {t("dashboard.notifications.markRead")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => remove(notification)}
                            >
                              <Trash2 />
                              {t("dashboard.notifications.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Wider items: the two buttons */}
                        {notification.read_at === null && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markRead(notification)}
                            className="hidden size-8 cursor-pointer @md:inline-flex"
                            aria-label={t("dashboard.notifications.markRead")}
                            title={t("dashboard.notifications.markRead")}
                          >
                            <Check className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(notification)}
                          className="hidden size-8 cursor-pointer text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger @md:inline-flex"
                          aria-label={t("dashboard.notifications.delete")}
                          title={t("dashboard.notifications.delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer"
              >
                {t("dashboard.notifications.previous")}
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("dashboard.notifications.pageOf", {
                  page: data.page,
                  total: data.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer"
              >
                {t("dashboard.notifications.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
