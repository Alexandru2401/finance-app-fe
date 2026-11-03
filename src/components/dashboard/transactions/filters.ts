export interface TransactionFilters {
  search: string;
  year: string;
  month: string;
  day: string;
  type: string;
  // "all" or a category_id; the backend filters by a single category
  categoryId: string;
  minAmount: string;
  maxAmount: string;
  sort: string;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  year: "all",
  month: "all",
  day: "all",
  type: "all",
  categoryId: "all",
  minAmount: "",
  maxAmount: "",
  sort: "date-desc",
};
