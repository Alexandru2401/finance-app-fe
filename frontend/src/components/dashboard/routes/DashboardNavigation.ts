import {
  ChartNoAxesCombined,
  CircleFadingArrowUp,
  LayoutDashboard,
  PiggyBank,
  UserRound,
  UserRoundPen
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

// Labels are translation keys under dashboard.nav, translated when rendered
export type DashboardNavItem = {
  label:
    | "overview"
    | "budget"
    | "transactions"
    | "analytics"
    | "upgrade"
    | "profile";
  to: string;
  icon?: LucideIcon;
};

export type DashboardNavSection = {
  items: DashboardNavItem[];
  // Key under dashboard.nav.sections
  title?: "dashboard" | "budgetInfo" | "settings";
};

export const dashboardNavigation: DashboardNavSection[] = [
  {
    items: [
      {
        label: "overview",
        to: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "budget",
        to: "/dashboard/budget",
        icon: PiggyBank,
      },
    ],
    title: "dashboard",
  },
  {
    items: [
      {
        label: "transactions",
        to: "/dashboard/transactions",
        icon: UserRoundPen,
      },
      {
        label: "analytics",
        to: "/dashboard/analytics",
        icon: ChartNoAxesCombined,
      },
    ],
    title: "budgetInfo",
  },
  {
    items: [
      {
        label: "upgrade",
        to: "/dashboard/upgrade-plans",
        icon: CircleFadingArrowUp,
      },
      {
        label: "profile",
        to: "/dashboard/profile",
        icon: UserRound,
      },
    ],
    title: "settings",
  },
];
