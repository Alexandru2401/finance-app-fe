// Parts of the UI that need a backend that does not exist yet. While a flag is
// false the feature is hidden (or shown as "Coming soon"), so nothing in the
// app pretends to work. Set it to true once the backend route is ready.
export const FEATURES = {
  // GET /search?q= (api/search.ts still returns dummy data)
  globalSearch: false,
  // GET /roadmap/votes, POST + DELETE /roadmap/:id/vote
  roadmapVotes: false,
  // POST /feedback (the form on the Roadmap page)
  feedback: false,
  // POST /newsletter (the form on the Blog page)
  newsletter: false,
  // Stripe: pay page, upgrade plans page, paid plan buttons, "Upgrade" in the avatar menu
  payments: false,
  // Analytics page (static data for now)
  analytics: false,
  // Insights + ExtraInfo on the Budget page (static data for now)
  budgetInsights: true,
} as const;
