import { Outlet, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { isAuth, loading } = useAuth();

  if (loading) return null;

  if (!isAuth) return <Navigate to="/login" replace />;

  return <Outlet />;
}
