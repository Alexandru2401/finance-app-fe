# CLAUDE.md

Frontend of a personal finance app (monthly budget, transactions, targets, categories, recurring transactions, in-app notifications). Stack: React 19, TypeScript, Vite 7, Tailwind 4, shadcn/ui (Radix), React Router 7, i18next, Zod, Recharts, react-joyride. The backend (Express + Postgres on Supabase) is a separate repo in `../finance-app-backend`; its route contracts are in `../finance-app-backend/routes-documentation.md`. The list of DB ↔ BE ↔ FE mismatches, with the current work order, is in `../inconcordante.md`.

# TECH STACK IMPORTANCE

- for request use useEffect and useState - will add react querry soon
- for form handling use useEffect and useState - will add react hook form soon

NEVER COMMIT ON GIT OR USE EXETERNAL TOOLS WITHOUT ASKING

## Commands

```bash
npm run dev                 # http://localhost:5173, needs the backend on :3000
npm run build               # tsc -b + vite build (the type check lives here)
npm run lint                # eslint
npm run format:check        # prettier
npm run test:run            # vitest, files matching src/**/*.test.{ts,tsx}
npx vitest run path/to/file.test.ts      # a single test file
npx vitest run -t "test name"            # a single test by name
npm run test:e2e            # Playwright (e2e/); starts its own Vite on port 5174
```

CI (`.github/workflows`) runs lint, format:check, test:run, build and Playwright on pushes and PRs to `main`/`dev`. The husky pre-commit hook runs `lint-staged` (eslint --fix + prettier). `VITE_API_URL` (`.env`) defaults to `http://localhost:3000/api/v1`.

## Architecture

- **API layer:** `src/api/client.ts` is the only fetch wrapper (`get/post/patch/del/getFile`).
  - It always sends cookies (httpOnly JWTs).
  - On 401/403 it calls `POST /auth/refresh` once and retries; parallel requests share a single refresh.
  - On 429 it shows a single toast with the wait time from the `RateLimit` header.
  - Calls return `{ ok, status, data }` instead of throwing.
  - The other files in `src/api/` add the types and map the responses.
- **Auth:** `context/AuthProvider.tsx` loads the user from `GET /auth/user-info` once, and `useAuth()` exposes `user`/`setUser`.
  - `PATCH /auth/user-info` returns only part of the user, so merge it: `setUser({ ...user, ...partial })`.
  - `pages/auth/ProtectedPage.tsx` guards `/dashboard/*` and redirects to `/dashboard/user-info` until `has_completed_onboarding`.
- **Routing:** defined in `App.tsx`.
  - Public routes go under `layout/PublicRootLayout`.
  - Dashboard routes go under `layout/DashboardRootLayout`, with the sidebar in `routes/navigation/DashboardMainNavigation.tsx` and the nav config in `components/dashboard/routes/DashboardNavigation.ts`.
  - `RemountOnSearch` remounts a page when the user picks a global search result.
- **Feature flags:** `lib/features.ts` (`FEATURES`) hides UI whose backend is not ready (payments, newsletter, feedback, roadmap votes…). Gate new unfinished features the same way.
- **i18n:** texts live in `src/i18n/locales/ro.json` and `en.json`.
  - Keys are typed from `ro.json` (`i18n/i18next.d.ts`), so every new text goes in both files.
  - A dynamically built key may need a cast to a typed template literal (see `PageTour.tsx`).
  - The default language is `ro`, and the user's saved language comes from the backend.
- **UI:**
  - shadcn primitives live in `components/ui/`.
  - Page pieces go in `components/dashboard/<page>/` and shared bits in `components/dashboard/shared/` (e.g. `PageHeader`, `CardError`, `EmptyState`).
  - Theme colors are CSS variables in `index.css` (`finance-primary`, `finance-success`, `finance-danger`, `finance-warning`…, each with a light and a dark value), used as Tailwind classes such as `bg-finance-primary`.
  - `@/` aliases `src/`.
- **Guided tours:** `components/dashboard/shared/PageTour.tsx` (react-joyride v3).
  - A page passes `steps` whose keys match `data-tour="<key>"` attributes. A step's `before` can open what the step points at.
  - Texts live under `dashboard.tours.<tour>.<key>`.
  - When a tour is finished or skipped, the FE sends `PATCH /auth/user-info { completeTour: "<tour>" }`, which adds the tour to `users.completed_tours`. A new tour name must also be added to `TourName` (`api/user.ts`) and to `ALLOWED_TOURS` in the backend.
  - Steps inside a `ResponsiveSheet` work: it ignores outside clicks from the tour's portal (`keepOpenForTour`), and `index.css` sets `pointer-events: auto` on `#react-joyride-portal`. Inside a plain `Dialog` / `Sheet` the tour's buttons stop working (pointer events disabled outside the modal), so do the same there first. A step whose `before` opens a panel can set `wait` (ms) for its animation.
- **Dates:** budget dates are calendar days (`DATE` in the DB), sent by the backend as `YYYY-MM-DD`. Use the helpers in `lib/date.ts` (`parseDay`, `formatDay`, `parseMonth`, `todayString`), not `new Date(...)`, which reads `YYYY-MM-DD` as UTC.

## Documentation

- We have 3 types of documentation (not hosted on GitHub), in the parent folder:
  - `../security.md` - all security features, fixes and patches
  - `../inconcordante.md` - shows all mismatches between FE and BE - invalid types, parameters, fields, etc.
  - `../neimplementat.md` - shows all upcoming features that are present in the project but not implemented yet (e.g. form for user feedback: the page is present, but the API integration and BE implementation are missing)
- The skill for docs is `.claude/skills/update-docs/SKILL.md`

## Conventions

- Code comments are in English.
- Branches: `main` (production), `dev`, `feature/*` → PR into `dev`. Commits: `feat: …`, `fix: …`, `refactor: …`.
- Deploy: Netlify (`netlify.toml`) proxies `/api/*` to the Render backend, so the cookies stay first-party (`SameSite=strict`). `VITE_*` variables are inlined at build time. The free Render instance sleeps, and the first request can take 30–50 s.
