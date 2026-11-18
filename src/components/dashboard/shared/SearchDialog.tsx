import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Coins,
  CornerDownLeft,
  Download,
  FileSearch,
  Languages,
  Lock,
  Moon,
  PenLine,
  PiggyBank,
  Plus,
  Search,
  Sun,
  Tag,
  Tags,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import RecurringBadge from "@/components/dashboard/shared/RecurringBadge";
import type { SearchNavigationState } from "@/components/dashboard/shared/RemountOnSearch";
import { dashboardNavigation } from "@/components/dashboard/routes/DashboardNavigation";
import {
  MAX_RESULTS,
  filterCategories,
  loadSearchCategories,
  normalize,
  searchTransactions,
  type SearchCategory,
} from "@/api/search";
import type { Transaction } from "@/api/transactions";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { FEATURES } from "@/lib/features";
import { formatDay } from "@/lib/date";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GroupKey = "pages" | "actions" | "transactions" | "categories";
const GROUPS: GroupKey[] = ["pages", "actions", "transactions", "categories"];

// One row in the list; all rows are flattened so arrow keys move across groups
interface ResultItem {
  id: string;
  group: GroupKey;
  icon: LucideIcon;
  iconTone: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  // A page to open, or something to do right away
  to?: string;
  run?: () => void;
}

const DEBOUNCE_MS = 250;
const PAGE_TONE = "text-muted-foreground bg-muted";
const ACTION_TONE = "text-finance-primary bg-finance-primary-bg";

const TYPE_ICON = {
  income: {
    icon: ArrowDownLeft,
    tone: "text-finance-success bg-finance-success-bg",
  },
  expenses: {
    icon: ArrowUpRight,
    tone: "text-finance-danger bg-finance-danger-bg",
  },
  savings: {
    icon: PiggyBank,
    tone: "text-finance-primary bg-finance-primary-bg",
  },
} as const;

// Actions: label + extra words to find them (dashboard.search.actions.<id>)
type ActionId =
  | "addTransaction"
  | "categories"
  | "currency"
  | "language"
  | "theme"
  | "changeName"
  | "changePassword"
  | "export";

const ACTIONS: { id: ActionId; icon: LucideIcon; to?: string }[] = [
  { id: "addTransaction", icon: Plus, to: "/dashboard/transactions?add=1" },
  { id: "categories", icon: Tags, to: "/dashboard/settings?tab=categories" },
  { id: "currency", icon: Coins, to: "/dashboard/settings" },
  { id: "language", icon: Languages, to: "/dashboard/settings" },
  // Runs right away (toggles the theme), no page
  { id: "theme", icon: Moon },
  { id: "changeName", icon: PenLine, to: "/dashboard/profile?action=name" },
  {
    id: "changePassword",
    icon: Lock,
    to: "/dashboard/profile?action=password",
  },
  { id: "export", icon: Download, to: "/dashboard/transactions" },
];

// Title + extra words, so "cont" finds Profile and "monedă" finds Settings
const matches = (q: string, ...texts: string[]) =>
  !q || texts.some((text) => normalize(text).includes(q));

export default function SearchDialog({
  open,
  onOpenChange,
}: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {/* DialogContent unmounts when closed, so the panel state resets on its own */}
        <SearchPanel onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// The transactions are kept together with the query they belong to, so
// loading / error / results are derived from the current query
interface TransactionsResponse {
  query: string;
  data?: Transaction[];
  error?: boolean;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<TransactionsResponse | null>(null);
  // Loaded once per dialog; null = request failed (the group is left out)
  const [categories, setCategories] = useState<
    SearchCategory[] | null | undefined
  >(undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const q = normalize(trimmed);
  const current = response?.query === trimmed ? response : null;
  const currentData = current?.data;
  const transactions = useMemo(
    () => (trimmed && currentData) || [],
    [trimmed, currentData],
  );
  const error = Boolean(trimmed && current?.error);
  const loading = Boolean(trimmed) && !current;

  useEffect(() => {
    let ignore = false;
    loadSearchCategories()
      .then((list) => !ignore && setCategories(list))
      .catch(() => !ignore && setCategories(null));
    return () => {
      ignore = true;
    };
  }, []);

  // Debounced transactions search; an outdated answer is dropped
  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await searchTransactions(trimmed, controller.signal);
        setResponse({ query: trimmed, data });
        setActiveIndex(0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResponse({ query: trimmed, error: true });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const items = useMemo<ResultItem[]>(() => {
    // Pages: the sidebar + Notifications (searched locally)
    const pages = [
      ...dashboardNavigation.flatMap((section) => section.items),
      ...(FEATURES.notifications
        ? [
            {
              label: "notifications" as const,
              to: "/dashboard/notifications",
              icon: Bell,
            },
          ]
        : []),
    ]
      .map((page) => ({
        id: `page-${page.to}`,
        group: "pages" as const,
        icon: page.icon ?? Search,
        iconTone: PAGE_TONE,
        title:
          page.label === "notifications"
            ? t("dashboard.notifications.title")
            : t(`dashboard.nav.${page.label}`),
        keywords: t(`dashboard.search.pageKeywords.${page.label}`),
        to: page.to,
      }))
      .filter((page) => matches(q, page.title, page.keywords))
      .slice(0, MAX_RESULTS);

    // Actions: things to do, searched locally
    const actions = ACTIONS.map(({ id, icon, to }) => {
      const label =
        id === "theme"
          ? t(
              dark
                ? "dashboard.search.actions.theme.toLight"
                : "dashboard.search.actions.theme.toDark",
            )
          : t(`dashboard.search.actions.${id}.label`);
      return {
        id: `action-${id}`,
        group: "actions" as const,
        icon: id === "theme" ? (dark ? Sun : Moon) : icon,
        iconTone: ACTION_TONE,
        title: label,
        keywords: t(`dashboard.search.actions.${id}.keywords`),
        to,
        run: id === "theme" ? toggleTheme : undefined,
      };
    })
      .filter((action) => matches(q, action.title, action.keywords))
      .slice(0, MAX_RESULTS);

    // Transactions: from the backend, already at most MAX_RESULTS
    const transactionItems: ResultItem[] = transactions.map((tr) => ({
      id: `tr-${tr.item_id}`,
      group: "transactions",
      icon: TYPE_ICON[tr.type].icon,
      iconTone: TYPE_ICON[tr.type].tone,
      title: tr.category_name ?? t("dashboard.common.uncategorized"),
      subtitle: [formatDay(tr.date, i18n.language), tr.notes]
        .filter(Boolean)
        .join(" · "),
      meta: (
        <span className="flex items-center gap-1.5">
          {tr.recurring_id && <RecurringBadge compact />}
          <span
            className={clsx(
              "text-sm font-semibold tabular-nums",
              tr.type === "expenses"
                ? "text-finance-danger"
                : tr.type === "savings"
                  ? "text-finance-primary"
                  : "text-finance-success",
            )}
          >
            {format(
              tr.amount,
              tr.type === "expenses"
                ? "-"
                : tr.type === "income"
                  ? "+"
                  : "auto",
            )}
          </span>
        </span>
      ),
      // Opens Transactions with the same search applied
      to: `/dashboard/transactions?search=${encodeURIComponent(trimmed)}`,
    }));

    // Categories: filtered locally, with the recurring badge
    const categoryItems: ResultItem[] = filterCategories(
      categories ?? [],
      trimmed,
    ).map((c) => ({
      id: `cat-${c.id}`,
      group: "categories",
      icon: Tag,
      iconTone: "text-finance-warning bg-finance-warning-bg",
      title: c.name,
      subtitle: t(`dashboard.search.types.${c.type}`),
      meta: c.recurring ? <RecurringBadge compact /> : undefined,
      to: "/dashboard/settings?tab=categories",
    }));

    // Without a query: only pages and actions, as shortcuts
    return [
      ...pages,
      ...actions,
      ...(trimmed ? [...transactionItems, ...categoryItems] : []),
    ];
  }, [
    q,
    trimmed,
    transactions,
    categories,
    dark,
    toggleTheme,
    format,
    i18n.language,
    t,
  ]);

  // Kept inside the list when it gets shorter
  const active = Math.min(activeIndex, Math.max(items.length - 1, 0));

  // Keep the active row visible while moving with the arrows
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function select(item: ResultItem) {
    onClose();
    if (item.run) {
      item.run();
      return;
    }
    if (item.to) {
      // A new nonce mounts the page again, so the result works even when the
      // user is already on it (RemountOnSearch)
      const state: SearchNavigationState = { searchNonce: Date.now() };
      navigate(item.to, { state });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((active + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((active - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) select(item);
    }
  }

  const noResults =
    Boolean(trimmed) && !loading && !error && items.length === 0;

  return (
    <>
      <DialogTitle className="sr-only">
        {t("dashboard.search.title")}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t("dashboard.search.hint")}
      </DialogDescription>

      {/* ===== INPUT ===== */}
      <div className="flex items-center gap-3 border-b px-4">
        <Search
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("dashboard.search.placeholder")}
          aria-label={t("dashboard.search.placeholder")}
          aria-controls="search-results"
          aria-activedescendant={items[active]?.id}
          className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <Spinner className="h-4 w-4 text-muted-foreground" />}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Esc
        </kbd>
      </div>

      {/* ===== RESULTS ===== */}
      <div
        ref={listRef}
        id="search-results"
        role="listbox"
        className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
      >
        {error && (
          <p className="px-3 pb-1 pt-2 text-xs text-finance-danger">
            {t("dashboard.search.error")}
          </p>
        )}

        {noResults && (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <FileSearch className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.search.empty", { query: trimmed })}
            </p>
          </div>
        )}

        {GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (!groupItems.length) return null;

          return (
            <div key={group} className="mb-2 last:mb-0">
              <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                {t(`dashboard.search.groups.${group}`)}
              </p>
              {groupItems.map((item) => {
                const index = items.indexOf(item);
                const isActive = index === active;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    id={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-index={index}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => select(item)}
                    className={clsx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      isActive ? "bg-accent" : "hover:bg-accent/60",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        item.iconTone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    {item.meta}
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="hidden items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1">↑</kbd>
          <kbd className="rounded border bg-muted px-1">↓</kbd>
          {t("dashboard.search.shortcuts.navigate")}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1">Enter</kbd>
          {t("dashboard.search.shortcuts.select")}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1">Esc</kbd>
          {t("dashboard.search.shortcuts.close")}
        </span>
      </div>
    </>
  );
}
