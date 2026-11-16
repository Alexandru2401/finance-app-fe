import { post } from "./client";

// POST /recurring does not exist in the backend yet (notification.md, R1-R4);
// the form calls it only while FEATURES.recurring is true

type ApiBudgetType = "income" | "expense" | "savings";

export interface RecurringItem {
  id: string;
  type: ApiBudgetType;
  category_id: string | null;
  category_name: string | null;
  amount: number;
  notes: string | null;
  // null = the 1st of the month
  day_of_month: number | null;
  // "YYYY-MM-DD"
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
}

type RecurringResponse =
  | { success: true; recurring: RecurringItem }
  | { success: false; message?: string }
  | null;

async function createRecurring(item: NewRecurringItem): Promise<RecurringItem> {
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
    throw new Error(message ?? "Could not create the recurring item");
  }
  return response.data.recurring;
}

export { createRecurring };
