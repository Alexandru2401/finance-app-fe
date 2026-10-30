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
import type { Category } from "@/api/budget";
import type { TransactionFilters } from "./filters";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TYPE_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  savings: "Savings",
};

// Active filter chips: tinted so they stand out, with a clear remove button
const CHIP_CLASS =
  "gap-1.5 rounded-full border-finance-primary/30 bg-finance-primary/10 py-1 pl-3 pr-1 text-sm font-normal text-foreground";
const CHIP_REMOVE_CLASS =
  "inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50";

// Category types use "expenses", the type filter uses "expense"
const CATEGORY_GROUPS: {
  type: Category["type"];
  filter: string;
  label: string;
}[] = [
  { type: "income", filter: "income", label: "Income" },
  { type: "expenses", filter: "expense", label: "Expenses" },
  { type: "savings", filter: "savings", label: "Savings" },
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
            placeholder="Search category..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer gap-2">
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      {/* FILTRE */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex flex-col gap-1.5 ">
          <Label
            htmlFor="filter-year"
            className="text-xs text-muted-foreground"
          >
            Year
          </Label>
          <Select
            value={filters.year}
            onValueChange={(v) => onChange({ year: v })}
          >
            <SelectTrigger id="filter-year" className="w-27.5">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All years
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
            Month
          </Label>
          <Select
            value={filters.month}
            onValueChange={(v) => onChange({ month: v })}
          >
            <SelectTrigger id="filter-month" className="w-32.5">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-day" className="text-xs text-muted-foreground">
            Day
          </Label>
          <Select
            value={filters.day}
            onValueChange={(v) => onChange({ day: v })}
          >
            <SelectTrigger id="filter-day" className="w-25">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent className="**:data-radix-select-viewport:max-h-[min(22rem,var(--radix-select-content-available-height))]">
              <SelectItem value="all">All days</SelectItem>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
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
            Type
          </Label>
          <Select value={filters.type} onValueChange={changeType}>
            <SelectTrigger id="filter-type" className="w-35">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="filter-category"
            className="text-xs text-muted-foreground"
          >
            Category
          </Label>
          <Select
            value={filters.categoryId}
            onValueChange={(v) => onChange({ categoryId: v })}
          >
            <SelectTrigger id="filter-category" className="w-45">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="**:data-radix-select-viewport:max-h-[min(22rem,var(--radix-select-content-available-height))]">
              <SelectItem value="all">All categories</SelectItem>
              {categoryGroups.map(({ type, label }) => {
                const items = categories.filter((c) => c.type === type);
                if (items.length === 0) return null;
                return (
                  <SelectGroup key={type}>
                    <SelectLabel>{label}</SelectLabel>
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
            Amount
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="filter-min"
              type="number"
              placeholder="Min"
              className="w-22.5"
              value={filters.minAmount}
              onChange={(e) => onChange({ minAmount: e.target.value })}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder="Max"
              className="w-22.5"
              aria-label="Maximum amount"
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
            Clear filters
          </Button>
        )}

        <div className="flex flex-col gap-1.5 sm:ml-auto">
          <Label
            htmlFor="filter-sort"
            className="text-xs text-muted-foreground"
          >
            Sort
          </Label>
          <Select
            value={filters.sort}
            onValueChange={(v) => onChange({ sort: v })}
          >
            <SelectTrigger id="filter-sort" className="w-45">
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date: newest first</SelectItem>
              <SelectItem value="date-asc">Date: oldest first</SelectItem>
              <SelectItem value="amount-desc">Amount: high to low</SelectItem>
              <SelectItem value="amount-asc">Amount: low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ACTIVE FILTERS */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">Active:</span>

          {filters.search !== "" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Search: {filters.search}
              <button
                type="button"
                aria-label="Remove search filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ search: "" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {filters.year !== "all" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Year: {filters.year}
              <button
                type="button"
                aria-label="Remove year filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ year: "all" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {filters.month !== "all" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Month: {MONTHS[Number(filters.month) - 1]}
              <button
                type="button"
                aria-label="Remove month filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ month: "all" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {filters.day !== "all" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Day: {filters.day}
              <button
                type="button"
                aria-label="Remove day filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ day: "all" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {filters.type !== "all" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Type: {TYPE_LABELS[filters.type]}
              <button
                type="button"
                aria-label="Remove type filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ type: "all" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {filters.categoryId !== "all" && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Category: {selectedCategory?.name ?? "…"}
              <button
                type="button"
                aria-label="Remove category filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ categoryId: "all" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}

          {(filters.minAmount !== "" || filters.maxAmount !== "") && (
            <Badge variant="outline" className={CHIP_CLASS}>
              Amount: {filters.minAmount || "0"}–{filters.maxAmount || "∞"}
              <button
                type="button"
                aria-label="Remove amount filter"
                className={CHIP_REMOVE_CLASS}
                onClick={() => onChange({ minAmount: "", maxAmount: "" })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
