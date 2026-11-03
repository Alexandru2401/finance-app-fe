import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export default function AnalyticsFilters() {
  return (
    <Card className="mb-4 border-dashed py-4">
      <CardContent className="px-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Perioada */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-period"
              className="text-xs text-muted-foreground"
            >
              Period
            </Label>
            <Select>
              <SelectTrigger id="filter-period" className="w-42.5">
                <SelectValue placeholder="This month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="last-month">Last month</SelectItem>
                <SelectItem value="last-3">Last 3 months</SelectItem>
                <SelectItem value="last-6">Last 6 months</SelectItem>
                <SelectItem value="last-12">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom range…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval custom — vizibil doar cand period === "custom" */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-from"
              className="text-xs text-muted-foreground"
            >
              From
            </Label>
            <Input id="filter-from" type="date" className="w-37.5" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-to"
              className="text-xs text-muted-foreground"
            >
              To
            </Label>
            <Input id="filter-to" type="date" className="w-37.5" disabled />
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
            Period: This month
            <button
              type="button"
              aria-label="Remove period filter"
              className="cursor-pointer rounded-full p-0.5 hover:bg-background/70"
            >
              <X size={12} />
            </button>
          </Badge>

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
