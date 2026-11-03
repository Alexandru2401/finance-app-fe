import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";

type Tab = "income" | "expenses" | "savings";

// Keys under dashboard.budget.extraInfo.items
type ItemKey =
  | "salary"
  | "investments"
  | "internet"
  | "rent"
  | "utilities"
  | "emergency"
  | "vacation";

// Title and badge come from dashboard.budget.extraInfo.<tab>
const DATA: Record<Tab, { key: ItemKey; amount: number; pct: number }[]> = {
  income: [
    { key: "salary", amount: 5000, pct: 67 },
    { key: "investments", amount: 2500, pct: 33 },
    { key: "internet", amount: 60, pct: 4 },
  ],
  expenses: [
    { key: "rent", amount: 1200, pct: 75 },
    { key: "utilities", amount: 300, pct: 19 },
    { key: "internet", amount: 60, pct: 4 },
  ],
  savings: [
    { key: "emergency", amount: 1000, pct: 57 },
    { key: "vacation", amount: 750, pct: 43 },
    { key: "internet", amount: 60, pct: 4 },
  ],
};

export default function ExtraInfo({ activeTab }: { activeTab: Tab }) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const items = DATA[activeTab];
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
            <Pin
              size={14}
              className="text-foreground"
              aria-hidden="true"
            />
          </span>
          <CardTitle className="text-sm">
            {t(`dashboard.budget.extraInfo.${activeTab}.title`)}
          </CardTitle>
          <span className="ml-auto rounded-full bg-accent px-2 py-1 text-xs font-medium text-foreground">
            {t(`dashboard.budget.extraInfo.${activeTab}.badge`)}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2.5">
          {items.map(({ key, amount, pct }) => (
            <li key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t(`dashboard.budget.extraInfo.items.${key}`)}
                </span>
                <span className="font-medium tabular-nums">
                  {format(amount)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-blue-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {t("dashboard.budget.extraInfo.monthlyTotal")}{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {format(total)}
          </span>
        </p>
      </CardFooter>
    </Card>
  );
}
