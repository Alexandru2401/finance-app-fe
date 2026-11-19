import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "@/api/budget";
import { daysInMonth, type TransactionFilters } from "./filters";
import InlineError from "@/components/dashboard/shared/InlineError";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useIsMobile";

// Month names in the app language, e.g. "January" / "Ianuarie"
const monthNames = (locale: string) =>
  Array.from({ length: 12 }, (_, i) => {
    const name = new Date(2000, i, 1).toLocaleDateString(locale, {
      month: "long",
    });
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

const TYPES = ["income", "expenses", "savings"] as const;

// Active filter chips: quiet (neutral, small) so they don't compete with the
// table; shrink-0 + nowrap so they stay whole in the scrolling row
const CHIP_CLASS =
  "shrink-0 gap-1 whitespace-nowrap rounded-full border-border bg-muted/50 py-0.5 pl-2.5 pr-1 text-xs font-normal text-muted-foreground";
const CHIP_REMOVE_CLASS =
  "inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

// Long lists (days, categories) scroll instead of filling the screen
const LONG_LIST_CLASS =
  "**:data-radix-select-viewport:max-h-[min(22rem,var(--radix-select-content-available-height))]";

const CATEGORY_GROUPS: {
  type: Category["type"];
  filter: string;
}[] = [
  { type: "income", filter: "income" },
  { type: "expenses", filter: "expenses" },
  { type: "savings", filter: "savings" },
];

interface Props {
  // Extra controls at the start (before the search) and at the end of the row
  start?: ReactNode;
  end?: ReactNode;
  filters: TransactionFilters;
  // Categories / years could not be loaded: shown in the filters popover
  optionsError?: boolean;
  onRetryOptions?: () => void;
  onChange: (patch: Partial<TransactionFilters>) => void;
  onClear: () => void;
  years: string[];
  categories: Category[];
  // Downloads a CSV with all the transactions matching the filters
  onExport: () => void;
  exporting: boolean;
}

export default function TransactionsFilters({
  start,
  end,
  filters,
  optionsError = false,
  onRetryOptions,
  onChange,
  onClear,
  years,
  categories,
  onExport,
  exporting,
}: Props) {
  const { t, i18n } = useTranslation();
  const months = monthNames(i18n.language);

  const selectedCategory = categories.find(
    (c) => c.category_id === filters.categoryId,
  );

  // With a type selected, only its categories make sense
  const categoryGroups = CATEGORY_GROUPS.filter(
    (g) => filters.type === "all" || g.filter === filters.type,
  );

  const changeType = (type: string) => {
    const group = CATEGORY_GROUPS.find(
      (g) => g.type === selectedCategory?.type,
    );
    // Drop a selected category of another type, it would match nothing
    const keepCategory = type === "all" || !group || group.filter === type;
    onChange(keepCategory ? { type } : { type, categoryId: "all" });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.year !== "all" ||
    filters.month !== "all" ||
    filters.day !== "all" ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "";

  // Filters inside the popover; the button shows how many are set
  const moreFilters = [
    filters.type !== "all",
    filters.year !== "all",
    filters.month !== "all",
    filters.day !== "all",
    filters.categoryId !== "all",
    filters.minAmount !== "" || filters.maxAmount !== "",
  ].filter(Boolean).length;

  const clearMoreFilters = () =>
    onChange({
      type: "all",
      year: "all",
      month: "all",
      day: "all",
      categoryId: "all",
      minAmount: "",
      maxAmount: "",
    });

  const typeLabel = (type: string) =>
    TYPES.includes(type as (typeof TYPES)[number])
      ? t(
          `dashboard.overview.recentTransactions.types.${type as (typeof TYPES)[number]}`,
        )
      : type;

  // Chips of the active filters; `clear` resets just that filter
  const chips = [
    filters.search !== "" && {
      id: "search",
      value: filters.search,
      clear: { search: "" },
    },
    filters.year !== "all" && {
      id: "year",
      value: filters.year,
      clear: { year: "all" },
    },
    filters.month !== "all" && {
      id: "month",
      value: months[Number(filters.month) - 1],
      clear: { month: "all" },
    },
    filters.day !== "all" && {
      id: "day",
      value: filters.day,
      clear: { day: "all" },
    },
    filters.type !== "all" && {
      id: "type",
      value: typeLabel(filters.type),
      clear: { type: "all" },
    },
    filters.categoryId !== "all" && {
      id: "category",
      value: selectedCategory?.name ?? "…",
      clear: { categoryId: "all" },
    },
    (filters.minAmount !== "" || filters.maxAmount !== "") && {
      id: "amount",
      value: `${filters.minAmount || "0"}–${filters.maxAmount || "∞"}`,
      clear: { minAmount: "", maxAmount: "" },
    },
  ].filter(Boolean) as {
    id: "search" | "year" | "month" | "day" | "type" | "category" | "amount";
    value: string;
    clear: Partial<TransactionFilters>;
  }[];

  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const filtersButton = (
    <Button
      variant="outline"
      className="relative h-8 shrink-0 cursor-pointer gap-2 px-3 @3xl:h-9"
      aria-label={
        moreFilters > 0
          ? `${t("dashboard.transactions.filters.more")} (${moreFilters})`
          : t("dashboard.transactions.filters.more")
      }
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      <span className="hidden @md:inline">
        {t("dashboard.transactions.filters.more")}
      </span>
      {/* Phones: a small badge on the corner of the icon button;
          from sm: next to the label */}
      {moreFilters > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-finance-primary text-xs text-finance-foreground tabular-nums ring-2 ring-background @md:static @md:ring-0"
        >
          {moreFilters}
        </span>
      )}
    </Button>
  );

  const activeBadge = moreFilters > 0 && (
    <span className="rounded-full bg-finance-primary/10 px-2 py-0.5 text-2xs font-semibold text-finance-primary">
      {t("dashboard.transactions.filters.activeCount", { count: moreFilters })}
    </span>
  );

  const resetButton = (
    <Button
      variant="ghost"
      onClick={clearMoreFilters}
      disabled={moreFilters === 0}
      className="flex-1 cursor-pointer gap-1.5 sm:w-full"
    >
      <X className="h-4 w-4" aria-hidden="true" />
      {t("dashboard.transactions.filters.reset")}
    </Button>
  );

  // Group title above each block of fields
  const groupTitle = (text: string) => (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {text}
    </p>
  );

  // The same fields in the popover (desktop) and the drawer (phones),
  // in groups: type, period (year / month / day), category, amount
  const filtersBody = (
    <div className="flex flex-col gap-5">
      {/* Without categories / years those two selects would just be
          empty, which looks like the user has none */}
      {optionsError && (
        <InlineError
          message={t("dashboard.transactions.filters.optionsError")}
          onRetry={onRetryOptions}
          className="rounded-md border border-dashed p-2"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label
            htmlFor="filter-type"
            className="text-xs text-muted-foreground"
          >
            {t("dashboard.transactions.filters.type")}
          </Label>
          <Select value={filters.type} onValueChange={changeType}>
            <SelectTrigger id="filter-type" className="w-full">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.allTypes")}
              />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">
                {t("dashboard.transactions.filters.allTypes")}
              </SelectItem>
              {TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label
            htmlFor="filter-category"
            className="text-xs text-muted-foreground"
          >
            {t("dashboard.transactions.filters.category")}
          </Label>
          <Select
            value={filters.categoryId}
            onValueChange={(v) => onChange({ categoryId: v })}
          >
            <SelectTrigger id="filter-category" className="w-full">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.allCategories")}
              />
            </SelectTrigger>
            <SelectContent position="popper" className={LONG_LIST_CLASS}>
              <SelectItem value="all">
                {t("dashboard.transactions.filters.allCategories")}
              </SelectItem>
              {categoryGroups.map(({ type }) => {
                const items = categories.filter((c) => c.type === type);
                if (items.length === 0) return null;
                return (
                  <SelectGroup key={type}>
                    <SelectLabel>{t(`dashboard.common.${type}`)}</SelectLabel>
                    {items.map((c) => (
                      <SelectItem key={c.category_id} value={c.category_id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        {groupTitle(t("dashboard.transactions.filters.period"))}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor="filter-year"
              className="text-xs text-muted-foreground"
            >
              {t("dashboard.transactions.filters.year")}
            </Label>
            <Select
              value={filters.year}
              onValueChange={(v) => onChange({ year: v })}
            >
              <SelectTrigger id="filter-year" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">
                  {t("dashboard.transactions.filters.allYears")}
                </SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor="filter-month"
              className="text-xs text-muted-foreground"
            >
              {t("dashboard.transactions.filters.month")}
            </Label>
            <Select
              value={filters.month}
              onValueChange={(v) => onChange({ month: v })}
            >
              <SelectTrigger id="filter-month" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={LONG_LIST_CLASS}>
                <SelectItem value="all">
                  {t("dashboard.transactions.filters.allMonths")}
                </SelectItem>
                {months.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor="filter-day"
              className="text-xs text-muted-foreground"
            >
              {t("dashboard.transactions.filters.day")}
            </Label>
            <Select
              value={filters.day}
              onValueChange={(v) => onChange({ day: v })}
            >
              <SelectTrigger id="filter-day" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={LONG_LIST_CLASS}>
                <SelectItem value="all">
                  {t("dashboard.transactions.filters.allDays")}
                </SelectItem>
                {Array.from(
                  { length: daysInMonth(filters.year, filters.month) },
                  (_, i) => i + 1,
                ).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        {groupTitle(t("dashboard.transactions.filters.amount"))}
        <div className="flex items-center gap-2">
          <Input
            id="filter-min"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={t("dashboard.transactions.filters.min")}
            aria-label={t("dashboard.transactions.filters.min")}
            value={filters.minAmount}
            onChange={(e) => onChange({ minAmount: e.target.value })}
          />
          <span className="text-muted-foreground" aria-hidden="true">
            –
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={t("dashboard.transactions.filters.max")}
            aria-label={t("dashboard.transactions.filters.maxAmount")}
            value={filters.maxAmount}
            onChange={(e) => onChange({ maxAmount: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Search, all the filters in a popover, export; sorting is in the table
          headers. By the content width (@container), not the viewport, so the
          open sidebar counts: under 48rem the tour + search fill the first
          row and the buttons go left-aligned on a second one (icons only
          under 28rem, 32px like on Budget); from 48rem everything is one
          row, 36px, and the search takes the free space */}
      <div className="@container mb-4">
        <div
          data-tour="filters"
          className="flex flex-wrap items-center gap-2 @3xl:flex-nowrap"
        >
          {start}

          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            {/* The browser's own clear (x) is hidden, ours is below */}
            <Input
              type="search"
              id="search-transactions"
              placeholder={t(
                "dashboard.transactions.filters.searchPlaceholder",
              )}
              className="h-8 pl-9 pr-9 @3xl:h-9 [&::-webkit-search-cancel-button]:appearance-none"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChange({ search: "" })}
                aria-label={t("dashboard.transactions.filters.remove.search")}
                className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-destructive text-finance-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* After the search: export, filters, then the page's own action.
            Narrow: its own row, aligned to the left */}
          <div className="flex w-full items-center gap-2 @3xl:w-auto @3xl:shrink-0">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={exporting}
              className="h-8 shrink-0 cursor-pointer gap-2 px-3 @3xl:h-9"
              aria-label={
                exporting
                  ? t("dashboard.transactions.filters.exporting")
                  : t("dashboard.transactions.filters.exportCsv")
              }
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden @md:inline">
                {exporting
                  ? t("dashboard.transactions.filters.exporting")
                  : t("dashboard.transactions.filters.exportCsv")}
              </span>
            </Button>

            {isMobile ? (
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{filtersButton}</DrawerTrigger>
                <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[90dvh]">
                  <DrawerHeader className="flex-row items-center justify-between gap-2 text-left">
                    <DrawerTitle className="flex items-center gap-2">
                      {t("dashboard.transactions.filters.more")}
                      {activeBadge}
                    </DrawerTitle>
                    <DrawerDescription className="sr-only">
                      {t("dashboard.transactions.filters.searchPlaceholder")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="overflow-y-auto px-4 pb-2">{filtersBody}</div>
                  <DrawerFooter className="flex-row gap-2">
                    {resetButton}
                    <DrawerClose asChild>
                      <Button className="flex-1 cursor-pointer">
                        {t("dashboard.transactions.filters.done")}
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ) : (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>{filtersButton}</PopoverTrigger>
                {/* Under the button, right-aligned with it (it sits at the end
                  of the row now) */}
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0"
                >
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <p className="text-sm font-semibold">
                      {t("dashboard.transactions.filters.more")}
                    </p>
                    {activeBadge}
                  </div>
                  <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-4">
                    {filtersBody}
                  </div>
                  {moreFilters > 0 && (
                    <div className="border-t p-2">{resetButton}</div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {end}
          </div>
        </div>
      </div>

      {/* ACTIVE FILTERS: one chip per filter, plus clearing all of them.
          Always one row: the chips scroll sideways when they don't fit
          (phones, or many filters), the label and "Clear" stay in place */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("dashboard.transactions.filters.active")}
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:thin]">
            {chips.map(({ id, value, clear }) => (
              <Badge key={id} variant="outline" className={CHIP_CLASS}>
                {t(`dashboard.transactions.filters.chips.${id}`, { value })}
                <button
                  type="button"
                  aria-label={t(`dashboard.transactions.filters.remove.${id}`)}
                  className={CHIP_REMOVE_CLASS}
                  onClick={() => onChange(clear)}
                >
                  <X size={11} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 shrink-0 cursor-pointer px-2 text-xs"
          >
            {t("dashboard.transactions.filters.clear")}
          </Button>
        </div>
      )}
    </>
  );
}
