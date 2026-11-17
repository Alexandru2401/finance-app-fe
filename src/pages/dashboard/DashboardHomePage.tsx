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
import OverviewTour from "@/components/dashboard/overview/OverviewTour";
import PageHeader from "@/components/dashboard/shared/PageHeader";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTransactions } from "@/api/transactions";
import { useAuth } from "@/hooks/useAuth";
import { useGreeting } from "@/hooks/useGreeting";
import { DEFAULT_PERIOD, PERIODS, type Period } from "@/lib/periods";

// All-time totals: undefined while loading, null if the request failed
type AllTime = { count: number; balance: number } | null | undefined;

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
  }, []);

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
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
        <OverviewTour />
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <SelectTrigger
            data-tour="period"
            className="w-40"
            aria-label={t("dashboard.overview.selectPeriod")}
          >
            <SelectValue
              placeholder={t(`dashboard.periods.${DEFAULT_PERIOD}`)}
            />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`dashboard.periods.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {allTime?.count === 0 && <OnboardingCard />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Wrappers carry the tour targets (data-tour) */}
        <div data-tour="netBalance" className="col-span-1 md:col-span-2 grid">
          <NetBalance
            period={period}
            totalBalance={
              allTime === undefined ? undefined : (allTime?.balance ?? null)
            }
          />
        </div>
        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-tour="balance" className="grid">
            <BalanceOverview period={period} />
          </div>
          <div data-tour="spending" className="grid">
            <SpendingOverview period={period} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div data-tour="trend" className="grid">
          <SpendingTrendingChart period={period} />
        </div>
        <div data-tour="table" className="grid">
          <OverviewTable />
        </div>
      </div>
    </section>
  );
}
