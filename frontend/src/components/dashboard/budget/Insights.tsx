import {
  Calendar,
  Home,
  Lightbulb,
  PiggyBank,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";

export default function Insights() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  // Static values for now
  const insights = [
    {
      icon: <Target className="h-4 w-4" />,
      tone: "text-finance-success",
      label: t("dashboard.budget.insights.doingGreat"),
      value: t("dashboard.budget.insights.doingGreatValue", { pct: 222 }),
    },
    {
      icon: <Home className="h-4 w-4" />,
      tone: "text-finance-danger",
      label: t("dashboard.budget.insights.topExpense"),
      value: format(1000),
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      tone: "text-finance-success",
      label: t("dashboard.budget.insights.incomeTrend"),
      value: t("dashboard.budget.insights.incomeTrendValue", { pct: 50 }),
    },
    {
      icon: <PiggyBank className="h-4 w-4" />,
      tone: "text-finance-primary",
      label: t("dashboard.budget.insights.savingsRate"),
      value: t("dashboard.budget.insights.savingsRateValue", { pct: 15 }),
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      tone: "text-finance-purple",
      label: t("dashboard.budget.insights.daysLeft"),
      value: t("dashboard.budget.insights.daysLeftValue", { count: 2 }),
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Lightbulb className="h-4 w-4 text-finance-warning" />
        {t("dashboard.budget.insights.title")}
      </div>
      <div className="flex flex-col gap-2">
        {insights.map((i) => (
          <div
            key={i.label}
            className="flex items-start gap-2 rounded-lg border p-3"
          >
            <span className={`rounded-md p-1.5 bg-accent ${i.tone}`}>
              {i.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              <p className="truncate text-sm font-medium">{i.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
