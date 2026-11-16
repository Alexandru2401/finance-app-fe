// Global search (the Ctrl+K dialog), on the existing routes only:
// - transactions: GET /transactions?search= (category, notes, exact amount)
// - categories: GET /categories + GET /recurring, loaded once per dialog and
//   filtered here (pages and actions are searched in the dialog itself)
import { getCategories, type Category } from "./budget";
import { getRecurring } from "./recurring";
import { getTransactions, type Transaction } from "./transactions";

// At most this many rows per group
export const MAX_RESULTS = 5;

export interface SearchCategory {
  id: string;
  type: Category["type"];
  name: string;
  // An active recurring rule (the badge in the list)
  recurring: boolean;
}

// Case and diacritics insensitive ("chirie" matches "Chirie", "cina" matches "Cină")
export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const aborted = () => new DOMException("Aborted", "AbortError");

/** The latest transactions matching the text (or an exact amount, e.g. "1200"). */
export async function searchTransactions(
  query: string,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const res = await getTransactions({
    search: query,
    limit: MAX_RESULTS,
    sort: "newest",
  });
  // The request itself cannot be cancelled; an outdated answer is dropped
  if (signal?.aborted) throw aborted();
  if (!res.ok) throw new Error(res.error);
  return res.data.transactions;
}

/** Every category of the user, with the recurring flag. */
export async function loadSearchCategories(): Promise<SearchCategory[]> {
  const [categories, recurring] = await Promise.all([
    getCategories(),
    // Without the recurring list the categories still show, without badges
    getRecurring().catch(() => []),
  ]);
  const recurringIds = new Set(
    recurring.filter((r) => r.is_active).map((r) => r.category_id),
  );
  return categories.map((c) => ({
    id: c.category_id,
    type: c.type,
    name: c.name,
    recurring: recurringIds.has(c.category_id),
  }));
}

/** The categories whose name contains the text, at most MAX_RESULTS. */
export function filterCategories(
  categories: SearchCategory[],
  query: string,
): SearchCategory[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return categories
    .filter((c) => normalize(c.name).includes(q))
    .slice(0, MAX_RESULTS);
}
