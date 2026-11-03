# finans — frontend

Personal finance app: monthly budget, transactions, targets, custom categories and currency conversion.
The backend lives in a separate repo: [`finance-app-backend`](https://github.com/Alexandru2401/finance-app-backend).

## Stack
React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · shadcn/ui (Radix) · React Router 7 · i18next (RO/EN) · Zod · Recharts

## Getting started
```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

The backend has to run separately (by default on `http://localhost:3000`).

### Environment variables (`.env`)
| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | API base URL |

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## Structure (`src`)
```
api/          backend calls (client.ts handles cookies + refresh token)
components/   ui/ (shadcn), dashboard/ per page, public/
pages/        public, auth and dashboard pages
i18n/         ro.json / en.json translations (keys are typed from ro.json)
hooks/ lib/   hooks and utilities (formatting, periods)
```

## Conventions
- New texts go into **both** `ro.json` and `en.json`.
- Branches: `main` (production), `dev`, `feature/*` → PR into `dev`.
- Commits: `feat: ...`, `fix: ...`, `refactor: ...`.

Remaining work: [`neimplementat.md`](neimplementat.md).
