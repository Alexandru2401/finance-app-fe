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
  // Analytics page: /budget/budget-trend, /by-category, /health, /costs,
  // /forecast and /recurring
  analytics: true,
  // Insights + ExtraInfo on the Budget page: /budget/summary, /budget-trend,
  // /spending/top and /by-category
  budgetInsights: true,
  // "Recurring" inputs in the add form and in the category settings: /recurring
  recurring: true,
  // Bell + /dashboard/notifications: /notifications
  notifications: true,
} as const;
