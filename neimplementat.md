# Ce mai e de terminat (FE + BE)

Analiză pe `finans/frontend` și `finance-app-backend` — 2 noiembrie 2026.
Legendă: **BE** = backend, **FE** = frontend.

## ✅ Deja gata (scoase din lista veche)
- Refresh token (`POST /auth/refresh` + retry în `api/client.ts`).
- Ținte buget legate la `GET /target`, `GET /target/all`, `POST /target`; progresul vine din `summary.target` / `summary.progress`.
- Tranzacții: filtre, sortare și paginare pe server (`TransactionsPage.tsx`).
- Selector de lună pe Budget (`?period=YYYY-MM:YYYY-MM`).
- Schimbare monedă din Profil (`PATCH /auth/user-info`, cu conversie BNR a sumelor).
- Login fără user enumeration (401 generic), validare parolă 8–72 în BE, `GBP` scos din FE.

---

## 1. Critice — nu merg acum

| # | Problemă | Unde | Cine |
|---|---|---|---|
| 1 | **`POST /budget/categories` nu există** → crearea unei categorii custom din `BudgetForm` dă 404. DB-ul e pregătit (constraint-uri `user_id`/`key`/nume unic). | `budget.routes.js`, `api/budget.ts → createCategory` | **BE** |
| 2 | **`npm run dev` e stricat**: scriptul e `nodemon index.js`, fișierul e `src/index.js`. | `finance-app-backend/package.json` | **BE** |
| 3 | **Login-ul așteaptă artificial 2 secunde** (`setTimeout(2000)` înainte de request). | `login-form.tsx:84` | **FE** |

## 2. Rute BE care lipsesc (UI-ul există deja)

| Rută propusă | Pentru | Prioritate |
|---|---|---|
| `POST /budget/categories` `{ type, name }` | Categorii custom (FE o apelează deja) | Mare |
| `PATCH` / `DELETE /budget/categories/:id` | Editare/ștergere categorii custom | Medie |
| `PATCH /auth/email` `{ email, password }` | Profil → Change Email | Medie |
| `DELETE /transactions` (sau `DELETE /auth/data`) | Profil → Reset Data (tranzacții + categorii custom + target-uri) | Medie |
| `DELETE /auth/user` (cu confirmare parolă) | Profil → Delete Account | Medie |
| `GET /analytics/...` (pe categorii, fixe vs variabile, economii + prognoză, health score, sfaturi) | Pagina Analytics — 100% hardcodată | Medie |
| `GET /target/export` (CSV) | Butonul Download din `TargetHistory.tsx` (`TODO`) | Mică |
| Tranzacții recurente (`GET/POST /recurring`) | `ExtraInfo.tsx` din Budget | Mică |
| Insights buget (sau calcul în FE din summary + trend + top) | `Insights.tsx` | Mică |
| `PATCH /auth/plan` + plăți (Stripe checkout + webhook) | `UpgradePlansPage`, `PayPage`, Profil → Change Plan | Mică |
| Conturi bancă/portofel (`GET/POST /accounts`) | Profil → Add an Account | Mică |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | DB are deja `reset_token`, `reset_token_exp`; în FE nu există pagină | Mică |
| `GET /transactions/years` (anii cu date) | Filtrul de an din `TransactionsPage` (acum ultimii 6 ani fixi) | Mică |

## 3. FE — UI fără apel la backend

### Profil (`ProfilePage.tsx`)
- **Change Password** — ruta există în BE (`PATCH /auth/update-password` `{ currentPassword, newPassword }` → 204), dar inputurile nu au state/submit. Lipsește `updatePassword` în `api/user.ts` + verificare „confirm password”.
- **Change Email** — UI static (așteaptă ruta BE).
- **Change Plan** — butoanele Free/Pro/Business nu fac nimic (ar putea duce la `/dashboard/upgrade-plans`).
- **Add an Account**, **Reset Data**, **Delete Account** — butoanele de confirmare nu au `onClick`.
- Pagina nu e tradusă (texte în engleză hardcodate).

### Budget (`/dashboard/budget`)
- `Insights.tsx` — valori statice (222%, 1000, 50%, 15%).
- `ExtraInfo.tsx` — `DATA` hardcodat (salary/rent/internet...).
- `TargetHistory.tsx` — butonul Download nu face nimic.

### Analytics (`/dashboard/analytics`) — toată pagina e statică
- `AnalyticsCharts.tsx` — `chartData` hardcodat.
- `ExpensesInfo.tsx` — `savingsWithForecast`, `fixedCosts`, `variableCosts` hardcodate.
- `BudgetHealth.tsx` — `reasons` hardcodate.
- `AnalyticsInsight.tsx` — `tips` hardcodate.
- `AnalitycsFilters.tsx` — nelegat (butonul Filters are `onClick` comentat în `AnalyticsPage.tsx`).
- `AnalyticsPage.tsx` / `AnalyticsCharts` / `ExpensesInfo` încă importă tipuri din vechiul `BudgetStoreContext`.
- Fără i18n.
- Parțial se poate face deja cu ce există: `/budget/budget-trend` (grafic), `/budget/summary` (rată economisire), `/transactions?type=expense` (pe categorii).

### Planuri și plăți
- `UpgradePlansPage.tsx` — `plans` hardcodate, fără acțiune, fără i18n.
- `PayPage.tsx:261` — `TODO`: plata e simulată cu `setTimeout(1200)`.

### Altele
- `SettingsPage.tsx` — pagină goală (`<div>Settings page</div>`); ori se implementează (limbă, temă, monedă), ori se scoate din navigare.
- `store/dashboardStore/BudgetStoreContext.tsx` — store local vechi, încă montat în `DashboardRootLayout.tsx`; de șters după ce Analytics nu mai depinde de el.
- `BudgetFilters.tsx` — nefolosit nicăieri; de șters.

## 4. Contract FE ↔ BE / bug-uri mai mici

| # | Problemă | Cine |
|---|---|---|
| 4 | Format erori inconsistent: controller → `{ success:false, message }`, `errorMiddleware` → `{ succes:false, error }` (typo), `validateToken` → `{ message }`. FE citește uneori `message`, alteori `error` (ex. `ProfilePage` doar `error`, login/signup doar `message`). | **BE** (un singur format) + **FE** |
| 5 | User diferit pe fiecare rută: `login` fără `username`/`currency`/`language`; `register` fără `currency`; `check-me` doar `user_id, email, username`; `PATCH user-info` doar `user_id, username, currency, language`. FE compensează cu `{...user, ...res.user}`. | **BE** (același SELECT ca `fetchUserInfoById`) |
| 6 | `date` vine ca timestamp ISO din `GET /transactions`, `/budget/spending/top`, POST/PATCH `/transactions` → poate sări o zi în funcție de timezone. Doar `fetchTransactionById` folosește `to_char`. | **BE** |
| 7 | `/budget/spending/top` întoarce `amount` ca string (FE face `parseFloat`). | **BE**, apoi **FE** scoate conversia |
| 8 | `PATCH /auth/user-info` cere obligatoriu `username` + `currency` → pentru schimbarea doar a limbii/monedei FE trimite username-ul curent. Ar fi mai curat cu câmpuri opționale. | **BE** |
| 9 | Căutarea din Transactions caută doar în numele categoriei (nu și în `notes`). | **BE** |
| 10 | Validare parolă la signup doar în BE (8–72); `login.schema.ts`/signup nu au regula → userul vede eroarea abia după request. | **FE** |
| 11 | `ProtectedPage` nu redirecționează la `/dashboard/user-info` userii fără `username` (onboarding neterminat) care se loghează. | **FE** |
| 12 | `userInfoForm` — la eroare nu se afișează nimic (comentariu „toast cu Sonner dacă vrei”). | **FE** |
| 13 | Cookie-uri `sameSite: "strict"` — OK pe localhost, dar în producție cu FE/BE pe domenii diferite nu se mai trimit. | **BE** (config per mediu) |
| 14 | Refresh token-urile expirate nu se șterg niciodată din `refresh_tokens` (crește la fiecare login); refresh-ul nu face rotație de token. | **BE** |
| 15 | Fără rate limiting pe `/auth/login` și `/auth/register`. | **BE** |

## 5. Curățenie

- **FE:** `console.log` în `api/user.ts` (inclusiv `console.log("test")`), `login-form.tsx`, `signup-form.tsx`, `userInfoForm.tsx`, `ProfileBadge.tsx`, `ProfilePage.tsx`, `PayPage.tsx`.
- **FE:** `checkUserAuthentication` nefolosit; `token?` din `AuthResponse` nu vine niciodată de la BE.
- **FE:** `AuthResponse.message` e marcat obligatoriu, dar `PATCH user-info` nu îl trimite.
- **BE:** `console.log` în toate controller-ele și în `errorMiddleware`; `fetchUserByUsername` nefolosit; `validators.isEmpty` / `isValidUserName` nefolosite (username-ul se validează doar pe lungime).
- **BE:** `TO DO = FUNCTIE CUSTOM DE SANITIZARE` în `auth.controller.js`.
- **BE:** nu există teste (`"test": "echo \"Error: no test specified\""`), nici în FE.
- **BE:** în `supabase/migrations` există doar migrația de categorii; schema tabelelor (`users`, `budget_items`, `budget_targets`, `refresh_tokens`) nu e versionată.
- **Docs:** `finans/doc.md` e depășit (ex. `limit` max 100 → acum 15, `sort` doar newest/oldest, perioada implicită `last-month`, lipsesc rutele `/target` și `/auth/refresh`, `/auth/update-password`).

## Ordine recomandată
1. `POST /budget/categories` + fix `npm run dev` + scos `setTimeout` din login.
2. Change Password în FE (BE e gata).
3. Format unic de erori + user complet pe toate rutele auth + `date` ca `YYYY-MM-DD`.
4. Reset Data / Delete Account / Change Email (BE + FE).
5. Analytics din datele existente, apoi rute dedicate.
6. Insights / ExtraInfo / Settings / i18n pe paginile rămase.
7. Planuri + plăți, conturi, forgot password.
