# Neimplementat (fără API / date hardcodate)

## Buget (`/dashboard/budget`)
- **Ținte buget** (`BudgetPage.tsx`, `TargetsPanel.tsx`) — doar state local (implicit 8000 / 4000 / 1500), se pierd la refresh. Lipsește ex. `GET/PUT /budget/targets` → `{ income, expenses, savings }`.
- **ExtraInfo** (`ExtraInfo.tsx`) — venituri/cheltuieli recurente hardcodate (`DATA`). Lipsește o rută pentru tranzacții recurente.
- **Insights** (`Insights.tsx`) — listă statică `insights`.

## Tranzacții (`/dashboard/transactions`)
- `TransactionsPage.tsx` cere doar `limit: 10`, fără paginare; filtrele (căutare, an/lună/zi, tip, categorii, sumă min/max, sortare) se aplică doar pe client pe cele 10. `GET /transactions` nu primește încă `search`, `from/to`, `category_id`, `min/max`.

## Analytics (`/dashboard/analytics`) — toată pagina e statică
- `AnalyticsCharts.tsx` — `chartData` hardcodat.
- `ExpensesInfo.tsx` — `savingsWithForecast`, `fixedCosts`, `variableCosts` hardcodate.
- `BudgetHealth.tsx` — `reasons` hardcodate.
- `AnalyticsInsight.tsx` — `tips` hardcodate.
- `AnalitycsFilters.tsx` — filtrele nu sunt legate de nimic (butonul de deschidere e comentat în `AnalyticsPage.tsx`).

## Profil (`/dashboard/profile`) — doar `getUserInfo` și `logout` sunt legate
- Change Currency — UI fără apel (ar putea folosi `PATCH /auth/user-info`).
- Change Plan — fără rută.
- Change Email — fără rută (ex. `PATCH /auth/email`).
- Change Password — fără rută (ex. `PATCH /auth/password` cu `{ currentPassword, newPassword }`).
- Add an Account (bancă/portofel, nume + sold) — fără rută.
- Reset Data (șterge toate tranzacțiile + categoriile) — fără rută (ex. `DELETE /transactions`).
- Delete Account — fără rută (ex. `DELETE /auth/user`).

## Planuri și plăți
- `UpgradePlansPage.tsx` — `plans` hardcodate, fără apel de schimbare plan.
- `PayPage.tsx` — `TODO`: plata e simulată cu `setTimeout`; lipsește integrarea Stripe + backend.

## Altele
- `SettingsPage.tsx` — pagină goală.
- `user.ts` — `checkUserAuthentication` nu e folosit (`AuthProvider` apelează direct `get("/auth/check-me")`); `loginUser`/`createUser` au `console.log` rămase.
