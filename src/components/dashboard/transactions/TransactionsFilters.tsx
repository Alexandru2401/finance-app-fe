import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Category } from "@/api/budget";
import { daysInMonth, type TransactionFilters } from "./filters";

// Month names in the app language, e.g. "January" / "Ianuarie"
const monthNames = (locale: string) =>
  Array.from({ length: 12 }, (_, i) => {
    const name = new Date(2000, i, 1).toLocaleDateString(locale, {
      month: "long",
    });
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

const TYPES = ["income", "expense", "savings"] as const;

const SORTS = ["date-desc", "date-asc", "amount-desc", "amount-asc"] as const;

// Active filter chips: tinted so they stand out, with a clear remove button
const CHIP_CLASS =
  "gap-1.5 rounded-full border-finance-primary/30 bg-finance-primary/10 py-1 pl-3 pr-1 text-sm font-normal text-foreground";
const CHIP_REMOVE_CLASS =
  "inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50";

// Category types use "expenses", the type filter uses "expense"
const CATEGORY_GROUPS: {
  type: Category["type"];
  filter: string;
}[] = [
  { type: "income", filter: "income" },
  { type: "expenses", filter: "expense" },
  { type: "savings", filter: "savings" },
];

interface Props {
  filters: TransactionFilters;
  onChange: (patch: Partial<TransactionFilters>) => void;
  onClear: () => void;
  years: string[];
  categories: Category[];
}

export default function TransactionsFilters({
  filters,
  onChange,
  onClear,
  years,
  categories,
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

  return (
    <>
      {/* SEARCH + EXPORT */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-50">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            id="search-transactions"
            placeholder={t("dashboard.transactions.filters.searchPlaceholder")}
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer gap-2">
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("dashboard.transactions.filters.exportCsv")}
        </Button>
      </div>

      {/* FILTRE */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex flex-col gap-1.5 ">
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
            <SelectTrigger id="filter-year" className="w-27.5">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.year")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
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

        <div className="flex flex-col gap-1.5">
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
            <SelectTrigger id="filter-month" className="w-32.5">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.month")}
              />
            </SelectTrigger>
            <SelectContent>
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-day" className="text-xs text-muted-foreground">
            {t("dashboard.transactions.filters.day")}
          </Label>
          <Select
            value={filters.day}
            onValueChange={(v) => onChange({ day: v })}
          >
            <SelectTrigger id="filter-day" className="w-25">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.day")}
              />
            </SelectTrigger>
            <SelectContent className="**:data-radix-select-viewport:max-h-[min(22rem,var(--radix-select-content-available-height))]">
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

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="filter-type"
            className="text-xs text-muted-foreground"
          >
            {t("dashboard.transactions.filters.type")}
          </Label>
          <Select value={filters.type} onValueChange={changeType}>
            <SelectTrigger id="filter-type" className="w-35">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.allTypes")}
              />
            </SelectTrigger>
            <SelectContent>
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

        <div className="flex flex-col gap-1.5">
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
            <SelectTrigger id="filter-category" className="w-45">
              <SelectValue
                placeholder={t("dashboard.transactions.filters.allCategories")}
              />
            </SelectTrigger>
            <SelectContent className="**:data-radix-select-viewport:max-h-[min(22rem,var(--radix-select-content-available-height))]">
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-min" className="text-xs text-muted-foreground">
            {t("dashboard.transactions.filters.amount")}
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="filter-min"
              type="number"
              placeholder={t("dashboard.transactions.filters.min")}
              className="w-22.5"
              value={filters.minAmount}
              onChange={(e) => onChange({ minAmount: e.target.value })}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder={t("dashboard.transactions.filters.max")}
              className="w-22.5"
              aria-label={t("dashboard.transactions.filters.maxAmount")}
              value={filters.maxAmount}
              onChange={(e) => onChange({ maxAmount: e.target.value })}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            className="cursor-pointer gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onClear}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {t("dashboard.transactions.filters.clear")}
          </Button>
        )}

        <div className="flex flex-col gap-1.5 sm:ml-auto">
          <Label
            htmlFor="filter-sort"
            className="text-xs text-muted-foreground"
          >
            {t("dashboard.transactions.filters.sort")}
          </Label>
          <Select
            value={filters.sort}
            onValueChange={(v) => onChange({ sort: v })}
          >
            <SelectTrigger id="filter-sort" className="w-45">
              <SelectValue
                placeholder={t(
                  "dashboard.transactions.filters.sorts.date-desc",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {t(`dashboard.transactions.filters.sorts.${sort}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ACTIVE FILTERS */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">
            {t("dashboard.transactions.filters.active")}
          </span>

          {chips.map(({ id, value, clear }) => (
            <Badge key={id} variant="outline" className={CHIP_CLASS}>
              {t(`dashboard.transactions.filters.chips.${id}`, { value })}
              <button
                type="button"
                aria-label={t(`dashboard.transactions.filters.remove.${id}`)}
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange(clear)}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
