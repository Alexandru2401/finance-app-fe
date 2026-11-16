import { Fragment, type ReactNode } from "react";
import { useLocation } from "react-router";

// The global search opens pages with `state: { searchNonce }`. The pages read
// their URL (filters, open panel) only when they mount, so a new nonce mounts
// the page again: a result works even when the user is already on that page.
export interface SearchNavigationState {
  searchNonce?: number;
}

export default function RemountOnSearch({ children }: { children: ReactNode }) {
  const state = useLocation().state as SearchNavigationState | null;
  return <Fragment key={state?.searchNonce ?? "page"}>{children}</Fragment>;
}
