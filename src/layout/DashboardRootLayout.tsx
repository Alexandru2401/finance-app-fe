import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet } from "react-router";
import DashboardMainNavigation from "../routes/navigation/DashboardMainNavigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import NotificationBell from "@/components/dashboard/notifications/NotificationBell";
import { FEATURES } from "@/lib/features";

export default function DashboardRootLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardMainNavigation />

        <main className="flex-1 overflow-y-auto md:px-4 py-6 bg-accent">
          {/* Mobile: room for the fixed top bar (h-14) from DashboardMainNavigation */}
          <div className="h-14 md:hidden" aria-hidden="true" />

          {/* Desktop: the bell top-right, staying there while the page scrolls
              (on mobile it is in the fixed top bar). No background: the bell
              has its own, and the empty row lets clicks through to the page.
              -mt-6 cancels the top padding of <main> so it sticks to the edge */}
          {FEATURES.notifications && (
            <div className="pointer-events-none sticky top-0 z-20 -mt-6 mb-2 hidden h-14 items-center justify-end px-4 md:flex">
              <NotificationBell className="pointer-events-auto" />
            </div>
          )}

          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </TooltipProvider>
  );
}
