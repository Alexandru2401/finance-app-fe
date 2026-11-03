import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Search, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type BudgetType = "income" | "expenses" | "savings";

const CATEGORIES_BY_TYPE: Record<
  BudgetType,
  { value: string; label: string }[]
> = {
  income: [
    { value: "salary", label: "Salary" },
    { value: "freelance", label: "Freelance" },
    { value: "investments", label: "Investments" },
    { value: "bonus", label: "Bonus" },
    { value: "rental", label: "Rental Income" },
    { value: "dividends", label: "Dividends" },
    { value: "other", label: "Other" },
  ],
  expenses: [
    { value: "groceries", label: "Groceries" },
    { value: "rent", label: "Rent / Mortgage" },
    { value: "utilities", label: "Utilities" },
    { value: "transport", label: "Transport" },
    { value: "healthcare", label: "Healthcare" },
    { value: "entertainment", label: "Entertainment" },
    { value: "invoice", label: "Invoice" },
    { value: "subscriptions", label: "Subscriptions" },
    { value: "dining", label: "Dining Out" },
    { value: "other", label: "Other" },
  ],
  savings: [
    { value: "emergency", label: "Emergency Fund" },
    { value: "retirement", label: "Retirement" },
    { value: "vacation", label: "Vacation" },
    { value: "education", label: "Education" },
    { value: "investment", label: "Investment Fund" },
    { value: "house", label: "House / Property" },
    { value: "other", label: "Other" },
  ],
};

export default function BudgetFilters() {
  return (
    <Card className="mb-4 border border-slate-800 py-4 absolute top-39 md:top-20 max-w-1/2 md:max-w-1/3 md:right-15 z-40">
      <CardContent className="px-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Categorii — multi-select grupat pe tip */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Categories</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-50 cursor-pointer justify-between font-normal"
                >
                  <span className="truncate text-muted-foreground">
                    All categories
                  </span>
                  <ChevronDown size={16} className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-65 p-0">
                <div className="border-b p-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="Search category…"
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                </div>

                <div className="max-h-70 overflow-y-auto p-1">
                  {(Object.keys(CATEGORIES_BY_TYPE) as BudgetType[]).map(
                    (type) => (
                      <div key={type} className="mb-1">
                        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {type}
                        </p>
                        {CATEGORIES_BY_TYPE[type].map((cat) => (
                          <Label
                            key={`${type}-${cat.value}`}
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-normal hover:bg-accent"
                          >
                            <Checkbox id={`cat-${type}-${cat.value}`} />
                            {cat.label}
                          </Label>
                        ))}
                      </div>
                    ),
                  )}
                </div>

                <div className="flex items-center justify-between border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-xs"
                  >
                    Clear
                  </Button>
                  <Button size="sm" className="cursor-pointer text-xs">
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search pe note */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-search"
              className="text-xs text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="filter-search"
                type="search"
                placeholder="Notes…"
                className="w-50 pl-9"
              />
            </div>
          </div>

          {/* Interval suma */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-min"
              className="text-xs text-muted-foreground"
            >
              Amount
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="filter-min"
                type="number"
                placeholder="Min"
                className="w-22.5"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                placeholder="Max"
                className="w-22.5"
                aria-label="Maximum amount"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-muted-foreground"
          >
            <X size={16} />
            Clear all
          </Button>
        </div>

        {/* Chip-uri cu filtrele active */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">Active:</span>

          <Badge variant="secondary" className="gap-1 pr-1 font-normal">
            Category: Rent
            <button
              type="button"
              aria-label="Remove category filter"
              className="cursor-pointer rounded-full p-0.5 hover:bg-background/70"
            >
              <X size={12} />
            </button>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
