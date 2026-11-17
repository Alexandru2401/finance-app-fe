import { createContext } from "react";
import type { TourName } from "@/api/user";
import type { Language } from "@/i18n";
import type { Currency } from "@/lib/format";

export type User = {
  user_id: string;
  username: string | null;
  email: string;
  plan_type: string;
  currency: Currency;
  // Saved language; PATCH /auth/user-info and login/register return it too
  language: Language;
  // Missing from the PATCH /auth/user-info response
  is_active?: boolean;
  created_at: string;
  // false until the user finishes onboarding (name + currency); while false
  // every dashboard page redirects to /dashboard/user-info
  has_completed_onboarding: boolean;
  // Pages whose guided tour the user finished or skipped; the others start it
  // on their own
  completed_tours: TourName[];
};

export type AuthValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuth: boolean;
  loading: boolean;
};

export const AuthContext = createContext<AuthValue | null>(null);
