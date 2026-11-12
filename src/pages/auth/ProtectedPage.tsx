import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_PATH = "/dashboard/user-info";

export default function ProtectedPage() {
  const { user, isAuth, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;

  if (!isAuth) return <Navigate to="/login" replace />;

  // Onboarding is mandatory: until it is finished, every dashboard page
  // (also after logout + login) leads to it
  if (
    user?.has_completed_onboarding === false &&
    pathname.replace(/\/+$/, "") !== ONBOARDING_PATH
  ) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return <Outlet />;
}
