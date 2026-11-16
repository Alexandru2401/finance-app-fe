import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Login and signup are only for visitors without a session. A logged-in user is
// sent to /dashboard, and ProtectedPage takes them on to the onboarding if it
// is not finished. The form is not shown while the session is still being
// checked (after a refresh or a typed URL), otherwise a logged-in user could
// submit it and create a second account. The check can take a while when the
// backend on Render wakes up, so a spinner is shown instead of a blank page.
export default function RedirectIfLoggedIn({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (isAuth) return <Navigate to="/dashboard" replace />;

  return children;
}
