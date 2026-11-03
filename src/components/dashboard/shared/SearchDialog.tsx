import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CornerDownLeft,
  FileSearch,
  PiggyBank,
  Search,
  Tag,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { dashboardNavigation } from "@/components/dashboard/routes/DashboardNavigation";
import { normalize, searchAll, type SearchResults } from "@/api/search";
import { useCurrency } from "@/hooks/useCurrency";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GroupKey = "pages" | "transactions" | "categories";

// One row in the list; all rows are flattened so arrow keys move across groups
interface ResultItem {
  id: string;
  group: GroupKey;
  icon: LucideIcon;
  iconTone: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  to: string;
}

const EMPTY_RESULTS: SearchResults = { transactions: [], categories: [] };
const DEBOUNCE_MS = 250;

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

// The response is kept together with the query it belongs to, so loading /
// error / results are derived from the current query instead of synced by hand
interface SearchResponse {
  query: string;
  data?: SearchResults;
  error?: boolean;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const current = response?.query === trimmed ? response : null;
  const results = (trimmed && current?.data) || EMPTY_RESULTS;
  const error = Boolean(trimmed && current?.error);
  const loading = Boolean(trimmed) && !current;

  // Debounced search; the previous request is cancelled on every keystroke
  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await searchAll(trimmed, controller.signal);
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

  // Pages are searched locally, they don't need the backend
  const pageItems = useMemo<ResultItem[]>(() => {
    const q = normalize(trimmed);
    return dashboardNavigation
      .flatMap((section) => section.items)
      .map((item) => ({
        id: `page-${item.to}`,
        group: "pages" as const,
        icon: item.icon ?? Search,
        iconTone: "text-muted-foreground bg-muted",
        title: t(`dashboard.nav.${item.label}`),
        to: item.to,
      }))
      .filter((item) => !q || normalize(item.title).includes(q));
  }, [trimmed, t]);

  const items = useMemo<ResultItem[]>(() => {
    const transactions: ResultItem[] = results.transactions.map((tr) => ({
      id: `tr-${tr.id}`,
      group: "transactions",
      icon: TYPE_ICON[tr.type].icon,
      iconTone: TYPE_ICON[tr.type].tone,
      title: tr.category,
      subtitle: [
        new Date(tr.date).toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        tr.notes,
      ]
        .filter(Boolean)
        .join(" · "),
      meta: (
        <span
          className={clsx(
            "text-sm font-semibold tabular-nums",
            tr.type === "expenses"
              ? "text-finance-danger"
              : "text-finance-success",
          )}
        >
          {format(tr.amount, tr.type === "expenses" ? "-" : "+")}
        </span>
      ),
      to: "/dashboard/transactions",
    }));

    const categories: ResultItem[] = results.categories.map((c) => ({
      id: `cat-${c.id}`,
      group: "categories",
      icon: Tag,
      iconTone: "text-finance-warning bg-finance-warning-bg",
      title: c.name,
      subtitle: t(`dashboard.search.types.${c.type}`),
      meta: c.custom ? (
        <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
          {t("dashboard.search.custom")}
        </span>
      ) : undefined,
      to: "/dashboard/settings?tab=categories",
    }));

    return [...pageItems, ...transactions, ...categories];
  }, [pageItems, results, format, i18n.language, t]);

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
    navigate(item.to);
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

  const groups: GroupKey[] = ["pages", "transactions", "categories"];
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
          <p className="px-3 py-8 text-center text-sm text-finance-danger">
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

        {!error &&
          groups.map((group) => {
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
