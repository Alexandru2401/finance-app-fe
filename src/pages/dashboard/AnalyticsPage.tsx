import AnalyticsChart from "@/components/dashboard/analytics/AnalyticsCharts";
import ExpensesInfo from "@/components/dashboard/analytics/ExpensesInfo";
import type {
  BudgetItem,
  NewBudgetItem,
} from "@/store/dashboardStore/BudgetStoreContext";
import AnalyticsInsight from "@/components/dashboard/analytics/AnalyticsInsight";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export interface Section {
  title: string;
  items: BudgetItem[];
  total: number;
  section: "income" | "expenses" | "savings";
  onDelete: (id: string) => void;
  onEdit: (id: string, payload: Partial<NewBudgetItem>) => void;
}
import PageHeader from "@/components/dashboard/shared/PageHeader";
import BudgetHealth from "@/components/dashboard/analytics/BudgetHealth";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      {/* ===== HEADER ===== */}
      <PageHeader
        title="Analytics"
        subtitle="Spending patterns, trends and forecasts."
      >
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-2"
          data-active="true"
        // onClick={() => setOpenFilters((prev) => !prev)}
        >
          <SlidersHorizontal size={16} />
          Filters
          <ChevronDown size={14} className="opacity-60" />
        </Button>
      </PageHeader>

      {/* ===== RAND 1: insight ===== */}
      <div className="flex flex-col gap-5">
        <div className="flex gap-10 flex-col-reverse lg:flex-row lg:items-stretch">
          <AnalyticsInsight />

          <BudgetHealth />
        </div>

        {/* ===== RAND 2: grafice ===== */}
        <AnalyticsChart />

        {/* ===== RAND 3: breakdown ===== */}
        <ExpensesInfo />
      </div>
    </section>
  );
}
