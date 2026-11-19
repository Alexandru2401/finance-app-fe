import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import CardError from "@/components/dashboard/shared/CardError";
import type {
  BudgetHealth as Health,
  HealthComponent,
  HealthLabel,
} from "@/api/budget";
import type { RequestState } from "@/hooks/useRequest";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { Gauge as GaugeIcon, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

// Colors of the labels (analitycs.md)
const TONES: Record<HealthLabel, { stroke: string; text: string }> = {
  excellent: { stroke: "var(--finance-success)", text: "text-finance-success" },
  good: { stroke: "var(--finance-primary)", text: "text-finance-primary" },
  warning: { stroke: "var(--finance-warning)", text: "text-finance-warning" },
  risk: { stroke: "var(--destructive)", text: "text-destructive" },
};

// Half-circle gauge: 0..100 mapped on 180°
function Gauge({
  value,
  label,
  labelText,
}: {
  value: number;
  label: HealthLabel;
  labelText: string;
}) {
  const segments = 40;
  const filled = Math.round((value / 100) * segments);
  return (
    <div
      className="relative flex flex-col items-center"
      role="img"
      aria-label={`${value} / 100, ${labelText}`}
    >
      <svg viewBox="0 0 200 110" className="w-55" aria-hidden="true">
        {Array.from({ length: segments }).map((_, i) => {
          const angle = 180 - (i / (segments - 1)) * 180;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={100 + 78 * Math.cos(rad)}
              y1={100 - 78 * Math.sin(rad)}
              x2={100 + 92 * Math.cos(rad)}
              y2={100 - 92 * Math.sin(rad)}
              strokeWidth={4}
              strokeLinecap="round"
              stroke={i < filled ? TONES[label].stroke : "var(--muted)"}
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 top-10.5 flex flex-col items-center">
        <span className={cn("text-xs font-medium", TONES[label].text)}>
          {labelText}
        </span>
        <span className="text-4xl font-bold tabular-nums">{value}</span>
      </div>
    </div>
  );
}

/** The sentence of one component, built from its values. */
function useReason() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const k = "dashboard.analytics.health.reasons";

  return (c: HealthComponent): string => {
    switch (c.key) {
      case "pace": {
        const source = c.values.fromTarget
          ? t(`${k}.fromTarget`)
          : t(`${k}.fromAverage`);
        return t(c.values.pace <= 1 ? `${k}.paceUnder` : `${k}.paceOver`, {
          spent: format(c.values.spent),
          expected: format(c.values.expected),
          base: format(c.values.base),
          source,
        });
      }
      case "savingsRate":
        if (c.values.noIncome) return t(`${k}.noIncome`);
        return t(
          c.values.fromTarget ? `${k}.savingsTarget` : `${k}.savingsDefault`,
          { rate: c.values.ratePct, goal: c.values.goalPct },
        );
      case "positiveMonths":
        return t(`${k}.positiveMonths`, {
          positive: c.values.positive,
          months: c.values.months,
        });
      case "trend": {
        const pct = Math.abs(c.values.deltaPct);
        const key =
          c.values.deltaPct > 0
            ? `${k}.trendAbove`
            : c.values.deltaPct < 0
              ? `${k}.trendBelow`
              : `${k}.trendSame`;
        return t(key, {
          projection: format(c.values.projection),
          average: format(c.values.average),
          pct,
        });
      }
    }
  };
}

// Dot color of a component: how many of its points it kept
const dotClass = (c: HealthComponent) => {
  const share = c.points / c.max;
  return share >= 0.8
    ? "bg-finance-success"
    : share >= 0.5
      ? "bg-finance-warning"
      : "bg-finance-danger";
};

export default function BudgetHealth({
  health,
}: {
  health: RequestState<Health>;
}) {
  const { t } = useTranslation();
  const reason = useReason();
  const data = health.data;

  function body() {
    if (health.loading)
      return (
        <div className="flex flex-col items-center gap-3 py-4">
          <Skeleton className="h-24 w-48 rounded-t-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    if (health.error || !data)
      return (
        <CardError
          message={t("dashboard.analytics.loadError")}
          onRetry={health.retry}
        />
      );
    if (data.score === null || data.label === null)
      return (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent">
            <GaugeIcon
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <p className="max-w-64 text-sm text-muted-foreground">
            {t("dashboard.analytics.health.notEnoughData")}
          </p>
        </div>
      );

    const labelText = t(`dashboard.analytics.health.labels.${data.label}`);
    return (
      <>
        <Gauge value={data.score} label={data.label} labelText={labelText} />

        <p className="mt-1 text-center text-sm">
          {t(`dashboard.analytics.health.summary.${data.label}`)}
        </p>

        <div className="mt-4 flex justify-center border-t pt-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info size={13} aria-hidden="true" />
                {t("dashboard.analytics.health.why")}
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-80">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dashboard.analytics.health.why")}
              </p>
              <ul className="space-y-2">
                {data.components.map((c) => (
                  <li key={c.key} className="flex gap-2 text-sm">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        dotClass(c),
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-muted-foreground">
                      {reason(c)}
                    </span>
                    <span className="shrink-0 text-xs font-medium tabular-nums">
                      {c.points}/{c.max}
                    </span>
                  </li>
                ))}
              </ul>
              {data.day <= 5 && (
                <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  {t("dashboard.analytics.health.earlyMonth")}
                </p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </>
    );
  }

  return (
    <Card className="flex-1 lg:max-w-sm">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {t("dashboard.analytics.health.title")}
          </h3>
        </div>
        {body()}
      </CardContent>
    </Card>
  );
}
