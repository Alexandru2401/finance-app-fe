import { TooltipProvider } from "@/components/ui/tooltip";
import { BudgetStoreProvider } from "@/store/dashboardStore/BudgetStoreContext";
import { Outlet } from "react-router";
import DashboardMainNavigation from "../routes/navigation/DashboardMainNavigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardRootLayout() {
  return (
    <BudgetStoreProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <DashboardMainNavigation />

          <main className="flex-1 overflow-y-auto md:px-4 py-6 bg-accent">
            {/* Mobile: room for the fixed top bar (h-14) from DashboardMainNavigation */}
            <div className="h-14 md:hidden" aria-hidden="true" />
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </TooltipProvider>
    </BudgetStoreProvider>
  );
}
