// Parts of the UI that need a backend that does not exist yet. While a flag is
// false the feature is hidden (or shown as "Coming soon"), so nothing in the
// app pretends to work. Set it to true once the backend route is ready.
export const FEATURES = {
  // Global search (Ctrl+K): pages, actions, transactions and categories, on the
  // existing routes (api/search.ts)
  globalSearch: true,
  // GET /roadmap/votes, POST + DELETE /roadmap/:id/vote
  roadmapVotes: false,
  // POST /feedback (the form on the Roadmap page)
  feedback: false,
  // POST /newsletter (the form on the Blog page)
  newsletter: false,
  // Stripe: pay page, upgrade plans page, paid plan buttons, "Upgrade" in the avatar menu
  payments: false,
  // Analytics page (static data for now)
  analytics: true,
  // Insights + ExtraInfo on the Budget page (static data for now)
  budgetInsights: true,
  // "Recurring" inputs in the add form. POST /recurring is not in the backend
  // yet (notification.md, R1-R4): set to false before deploying without it
  recurring: true,
  // Bell + /dashboard/notifications. The /notifications routes are not in the
  // backend yet (notification.md, N1-N2): set to false before deploying without them
  notifications: true,
} as const;
