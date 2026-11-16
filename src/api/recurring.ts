import { del, get, patch, post } from "./client";
import type { Transaction } from "./transactions";

// Recurring rules (notification.md); the add form uses them while
// FEATURES.recurring is true

type ApiBudgetType = "income" | "expense" | "savings";

// Every error from the backend is { success: false, message }
type ApiError = { success?: boolean; message?: string } | null;

// Keeps the HTTP status and the backend message
export class RecurringRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RecurringRequestError";
    this.status = status;
  }
}

export interface RecurringItem {
  id: string;
  type: ApiBudgetType;
  // Every rule belongs to one category (at most one rule per category);
  // deleting the category deletes the rule
  category_id: string;
  category_name: string;
  amount: number;
  notes: string | null;
  // null = the 1st of the month
  day_of_month: number | null;
  // "YYYY-MM-DD", the next date it is added on
  next_run: string;
  is_active: boolean;
}

export interface NewRecurringItem {
  // The frontend uses "expenses", the backend "expense"
  type: "income" | "expenses" | "savings";
  category_id: string;
  amount: number;
  notes?: string;
  day_of_month: number | null;
  // "YYYY-MM-DD": the first transaction, saved together with the rule and
  // linked to it (so it shows the recurring badge too). Without it only the
  // rule is created (e.g. from Settings → Categories)
  date?: string;
}

type RecurringResponse =
  | { success: true; recurring: RecurringItem; transaction?: Transaction }
  | { success: false; message?: string }
  | null;

// POST /recurring → the rule (+ its first transaction when `date` is sent),
// saved together: if one fails, neither is saved.
// 409 = the category already has a recurring item (at most one per category)
async function createRecurring(
  item: NewRecurringItem,
): Promise<{ recurring: RecurringItem; transaction?: Transaction }> {
  const response = await post<RecurringResponse>("/recurring", {
    ...item,
    type: item.type === "expenses" ? "expense" : item.type,
    ...(item.notes ? { notes: item.notes } : {}),
  });
  if (!response.ok || !response.data || !("recurring" in response.data)) {
    const message =
      response.data && "message" in response.data
        ? response.data.message
        : undefined;
    throw new RecurringRequestError(
      message ?? "Could not create the recurring item",
      response.status,
    );
  }
  return {
    recurring: response.data.recurring,
    transaction: response.data.transaction,
  };
}

// GET /recurring → the active rules first, then by next_run
async function getRecurring(): Promise<RecurringItem[]> {
  const response = await get<{ success: boolean; recurring: RecurringItem[] }>(
    "/recurring",
  );
  if (!response.ok) throw new Error("Could not load the recurring items");
  return response.data.recurring;
}

export interface UpdateRecurringPayload {
  amount?: number;
  // null = the 1st of the month
  day_of_month?: number | null;
  // false = paused (nothing is added), true = resumed from today
  is_active?: boolean;
}

// PATCH /recurring/:id → only future transactions change; the ones already
// added stay as they are
async function updateRecurring(
  id: string,
  payload: UpdateRecurringPayload,
): Promise<RecurringItem> {
  const response = await patch<
    { success: true; recurring: RecurringItem; message?: string } | ApiError
  >(`/recurring/${id}`, payload);
  if (!response.ok || !response.data || !("recurring" in response.data)) {
    throw new RecurringRequestError(
      response.data?.message ?? "Could not update the recurring item",
      response.status,
    );
  }
  return response.data.recurring;
}

// DELETE /recurring/:id → 204; the transactions already added stay, without
// the recurring badge
async function deleteRecurring(id: string): Promise<void> {
  const response = await del<ApiError>(`/recurring/${id}`);
  if (!response.ok) {
    throw new RecurringRequestError(
      response.data?.message ?? "Could not delete the recurring item",
      response.status,
    );
  }
}

export { createRecurring, getRecurring, updateRecurring, deleteRecurring };
