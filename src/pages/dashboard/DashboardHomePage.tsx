import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import BalanceOverview from "@/components/dashboard/overview/BalanceOverview";
import NetBalance from "@/components/dashboard/overview/NetBalance";
import OnboardingCard from "@/components/dashboard/overview/OnboardingCard";
import OverviewTable from "@/components/dashboard/overview/OverviewTable";
import SpendingOverview from "@/components/dashboard/overview/SpendingOverview";
import SpendingTrendingChart from "@/components/dashboard/overview/TrendChart";
import PageTour, {
  type TourStep,
} from "@/components/dashboard/shared/PageTour";
import PageHeader from "@/components/dashboard/shared/PageHeader";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTransactions } from "@/api/transactions";
import { useAuth } from "@/hooks/useAuth";
import { useGreeting } from "@/hooks/useGreeting";
import { DEFAULT_PERIOD, PERIODS, type Period } from "@/lib/periods";

// All-time totals: undefined while loading, null if the request failed
type AllTime = { count: number; balance: number } | null | undefined;

const TOUR_STEPS: TourStep<"overview">[] = [
  // Centered welcome before pointing at anything
  { key: "welcome", center: true },
  { key: "period" },
  { key: "netBalance" },
  { key: "balance" },
  { key: "spending" },
  { key: "trend" },
  { key: "table" },
];

export default function DashboardHomePage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);

  const user = useAuth().user;
  const name = user?.username || t("dashboard.overview.defaultUser");
  // "Good morning / afternoon / evening", or "Welcome" on the first visit
  const greeting = useGreeting();

  // Without filters, the transactions endpoint returns the count and net of all
  // transactions; one row is enough to read them
  const [allTime, setAllTime] = useState<AllTime>(undefined);
  const [allTimeAttempt, setAllTimeAttempt] = useState(0);
  const retryAllTime = () => {
    setAllTime(undefined);
    setAllTimeAttempt((n) => n + 1);
  };

  useEffect(() => {
    let cancelled = false;
    getTransactions({ limit: 1 })
      .then((res) => (res.ok ? res.data : null))
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        setAllTime(data ? { count: data.total, balance: data.net } : null);
      });
    return () => {
      cancelled = true;
    };
  }, [allTimeAttempt]);

  return (
    // @container: the grids below react to the space left next to the sidebar
    // (open or collapsed), not to the viewport width
    <section className="@container mx-auto max-w-7xl px-4 py-4">
      <PageHeader
        title={
          greeting.firstVisit
            ? t("dashboard.overview.greeting.welcome", { name })
            : t(`dashboard.overview.greeting.${greeting.part}`, { name })
        }
        subtitle={
          greeting.firstVisit
            ? t("dashboard.overview.greeting.welcomeSubtitle")
            : t("dashboard.overview.subtitle")
        }
      >
        <PageTour tour="overview" steps={TOUR_STEPS} values={{ name }} />
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <SelectTrigger
            data-tour="period"
            // Grows with a longer period name instead of cutting it
            className="w-fit min-w-40"
            aria-label={t("dashboard.overview.selectPeriod")}
          >
            <SelectValue
              placeholder={t(`dashboard.periods.${DEFAULT_PERIOD}`)}
            />
          </SelectTrigger>
          <SelectContent position="popper">
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`dashboard.periods.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {allTime?.count === 0 && <OnboardingCard />}

      {/* min-w-0 on every grid item: without it a column can't shrink below
          its content (chart, table) and spills out of the layout */}
      <div className="mb-6 grid grid-cols-1 gap-6 @5xl:grid-cols-2">
        {/* Wrappers carry the tour targets (data-tour) */}
        <div data-tour="netBalance" className="grid min-w-0">
          <NetBalance
            period={period}
            totalBalance={
              allTime === undefined ? undefined : (allTime?.balance ?? null)
            }
            onRetryTotal={retryAllTime}
          />
        </div>
        {/* Own container: the two small cards sit side by side only when
            this column is wide enough for both */}
        <div className="@container min-w-0">
          <div className="grid grid-cols-1 gap-6 @md:grid-cols-2">
            <div data-tour="balance" className="grid min-w-0">
              <BalanceOverview period={period} />
            </div>
            <div data-tour="spending" className="grid min-w-0">
              <SpendingOverview period={period} />
            </div>
          </div>
        </div>
      </div>

      {/* Side by side only when the content area is >= 64rem (1024px); with
          the sidebar open that means a ~1350px+ screen, otherwise they stack */}
      <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
        <div data-tour="trend" className="grid min-w-0">
          <SpendingTrendingChart period={period} />
        </div>
        <div data-tour="table" className="grid min-w-0">
          <OverviewTable />
        </div>
      </div>
    </section>
  );
}
