import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Compass,
  CreditCard,
  FileDown,
  KeyRound,
  LogIn,
  Search,
  UserCog,
} from "lucide-react";
import type ro from "@/i18n/locales/ro.json";

// Textele sunt în i18n: "roadmap.items.<id>" și "roadmap.statuses.<status>"
export const ROADMAP_STATUSES = ["next", "planned", "later"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export type RoadmapItemId = keyof typeof ro.roadmap.items;

export type RoadmapItem = {
  id: RoadmapItemId;
  status: RoadmapStatus;
  icon: LucideIcon;
};

const RoadmapItems: RoadmapItem[] = [
  { id: "changePassword", status: "next", icon: KeyRound },
  { id: "csvExport", status: "next", icon: FileDown },
  { id: "accountManagement", status: "planned", icon: UserCog },
  { id: "analytics", status: "planned", icon: BarChart3 },
  { id: "globalSearch", status: "planned", icon: Search },
  { id: "googleLogin", status: "later", icon: LogIn },
  { id: "guidedTour", status: "later", icon: Compass },
  { id: "paidPlans", status: "later", icon: CreditCard },
];

export default RoadmapItems;
