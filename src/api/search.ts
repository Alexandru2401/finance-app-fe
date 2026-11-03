// Global search (dashboard modal).
// For now the results are DUMMY data filtered in the frontend.
// When the backend route exists (ex. GET /search?q=...&limit=...), only the
// body of `searchAll` changes — the dialog only depends on the types below.

type SearchTransactionType = "income" | "expenses" | "savings";

export interface SearchTransaction {
  id: string;
  type: SearchTransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface SearchCategory {
  id: string;
  type: SearchTransactionType;
  name: string;
  custom: boolean;
}

export interface SearchResults {
  transactions: SearchTransaction[];
  categories: SearchCategory[];
}

const MOCK_TRANSACTIONS: SearchTransaction[] = [
  { id: "t1", type: "income", category: "Salary", amount: 5000, date: "2026-11-01", notes: "Salariu noiembrie" },
  { id: "t2", type: "expenses", category: "Rent", amount: 1200, date: "2026-11-02", notes: "Chirie apartament" },
  { id: "t3", type: "expenses", category: "Groceries", amount: 245.5, date: "2026-11-02", notes: "Mega Image" },
  { id: "t4", type: "expenses", category: "Utilities", amount: 310, date: "2026-10-28", notes: "Curent + gaz" },
  { id: "t5", type: "expenses", category: "Internet", amount: 60, date: "2026-10-25" },
  { id: "t6", type: "savings", category: "Emergency fund", amount: 1000, date: "2026-10-20" },
  { id: "t7", type: "savings", category: "Vacation", amount: 750, date: "2026-10-15", notes: "Grecia 2027" },
  { id: "t8", type: "income", category: "Investments", amount: 320.75, date: "2026-10-10", notes: "Dividende" },
  { id: "t9", type: "expenses", category: "Restaurants", amount: 180, date: "2026-10-08", notes: "Cină aniversare" },
  { id: "t10", type: "expenses", category: "Transport", amount: 95, date: "2026-10-05", notes: "Abonament metrou" },
];

const MOCK_CATEGORIES: SearchCategory[] = [
  { id: "c1", type: "income", name: "Salary", custom: false },
  { id: "c2", type: "income", name: "Investments", custom: false },
  { id: "c3", type: "expenses", name: "Rent", custom: false },
  { id: "c4", type: "expenses", name: "Groceries", custom: false },
  { id: "c5", type: "expenses", name: "Utilities", custom: false },
  { id: "c6", type: "expenses", name: "Restaurants", custom: false },
  { id: "c7", type: "expenses", name: "Transport", custom: false },
  { id: "c8", type: "savings", name: "Emergency fund", custom: false },
  { id: "c9", type: "savings", name: "Vacation", custom: true },
];

const MAX_RESULTS = 5;

// Case and diacritics insensitive ("chirie" matches "Chirie", "cina" matches "Cină")
export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/**
 * Searches transactions (category, notes, amount) and categories.
 * `signal` cancels the previous request while the user is still typing.
 */
export async function searchAll(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResults> {
  const q = normalize(query.trim());
  if (!q) return { transactions: [], categories: [] };

  // TODO: replace with the backend call, ex.:
  // const response = await get<SearchResults>(`/search?q=${encodeURIComponent(query)}`, { signal });
  await wait(300, signal); // simulates the network latency

  const transactions = MOCK_TRANSACTIONS.filter(
    (tr) =>
      normalize(tr.category).includes(q) ||
      normalize(tr.notes ?? "").includes(q) ||
      String(tr.amount).includes(q),
  ).slice(0, MAX_RESULTS);

  const categories = MOCK_CATEGORIES.filter((c) =>
    normalize(c.name).includes(q),
  ).slice(0, MAX_RESULTS);

  return { transactions, categories };
}
