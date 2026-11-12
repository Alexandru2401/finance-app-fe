import { createContext } from "react";

export type User = {
  user_id: string;
  username: string | null;
  email: string;
  plan_type: string;
  currency: string | null;
  // Saved language; PATCH /auth/user-info and login/register return it too
  language?: string;
  is_active: boolean;
  created_at: string;
  // false until the user finishes onboarding (name + currency); while false
  // every dashboard page redirects to /dashboard/user-info.
  // undefined if the backend does not send it yet: no redirect then
  has_completed_onboarding?: boolean;
};

export type AuthValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuth: boolean;
  loading: boolean;
};

export const AuthContext = createContext<AuthValue | null>(null);
