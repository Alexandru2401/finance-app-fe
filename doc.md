# Rute API

Base URL: `VITE_API_URL` (implicit `http://localhost:3000/api/v1`).
Toate cererile trimit `credentials: "include"` (cookie de sesiune) și `Content-Type: application/json`.

> Backend-ul folosește `expense` (singular); frontend-ul folosește `expenses` — conversia se face în `src/api/`.
> Valori `period`: `this-month` | `last-month` | `last-3` | `last-6` | `this-year`.

## Auth — `src/api/user.ts`, `src/context/AuthProvider.tsx`

| Metodă | Rută              | Trimit                                                                                                          | Primesc                                    |
| ------ | ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| POST   | `/auth/register`  | `{ email, password, language? }` (`ro` implicit; contul primește cele 12 categorii de pornire în această limbă) | `{ success, message, token?, user? }`      |
| POST   | `/auth/login`     | `{ email, password }`                                                                                           | `{ success, message, token?, user? }`      |
| POST   | `/auth/logout`    | `{}`                                                                                                            | `{ success, message }`                     |
| GET    | `/auth/check-me`  | —                                                                                                               | `{ success, user? }` (401 dacă nu e logat) |
| GET    | `/auth/user-info` | —                                                                                                               | `{ success, message, user? }`              |
| PATCH  | `/auth/user-info` | `{ username, currency }`                                                                                        | `{ success, message, user? }`              |

`user`: `{ user_id, username, email, plan_type, currency, is_active, created_at }`

## Categorii — `src/api/budget.ts`

| Metodă | Rută                | Trimit                                         | Primesc                                                                                                                          |
| ------ | ------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/categories?type=` | `type` opțional (`income`/`expense`/`savings`) | `{ success, categories: [{ category_id, type, name }] }` (doar categoriile userului)                                             |
| POST   | `/categories`       | `{ type, name }` (nume 2–50 caractere)         | 201 `{ success, category }`; 409 dacă numele există deja la acel tip (fără diferență între litere mari/mici); 400 dacă e invalid |
| PATCH  | `/categories/:id`   | `{ name }` (doar numele; tipul nu se schimbă)  | 200 `{ success, category }`; 409 nume ocupat; 404 dacă nu e o categorie a userului                                               |
| DELETE | `/categories/:id`   | —                                              | 200 `{ success, category }` (categoria ștearsă); 404 dacă nu e o categorie a userului. Tranzacțiile ei rămân fără categorie      |

## Tranzacții — `src/api/transactions.ts`, `src/api/budget.ts`

| Metodă | Rută                                     | Trimit                                                                          | Primesc                                                                                                       |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GET    | `/transactions?type=&limit=&page=&sort=` | toate opționale; `limit` implicit 10, max 100; `sort` = `newest`/`oldest`       | `{ success, transactions: [{ item_id, type, amount, date, category_id, category_name, notes }], total, net }` |
| POST   | `/transactions`                          | `{ type, category_id, amount, date, notes? }`                                   | `{ message? }`                                                                                                |
| PATCH  | `/transactions/:id`                      | `{ amount?, date?, category_id?, notes? }` (`notes: null` sau `""` șterge nota) | 2xx; eroare `{ message }` (4xx) / `{ error }` (500)                                                           |
| DELETE | `/transactions/:id`                      | —                                                                               | 204 / 2xx; eroare `{ message }` / `{ error }`                                                                 |

## Statistici buget — `src/api/budget.ts`

| Metodă | Rută                           | Trimit                                     | Primesc                                                                                                    |
| ------ | ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/budget/summary?period=`      | `period` (implicit `last-month`)           | `{ success, summary: { income, expense, savings, net } }` (numerele pot veni ca string)                    |
| GET    | `/budget/spending/top?period=` | `period` (implicit `last-month`)           | `{ success, topExpenses: [{ item_id, category_id, category, amount (string), date, notes, created_at }] }` |
| GET    | `/budget/budget-trend?period=` | `period` opțional (fără = ultimele 6 luni) | `{ success, trend: [{ month, income, expense }] }`                                                         |
