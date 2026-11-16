import { z } from "zod";
import { hasAtMostTwoDecimals, MAX_AMOUNT } from "@/lib/validation";

export const NOTES_MAX_LENGTH = 1500;

// The messages are translation keys; the form translates them
const ERRORS = "dashboard.budget.form.errors";

const BudgetItemSchema = z
  .object({
    type: z.enum(["income", "expenses", "savings"]),

    category: z.string().min(1, { message: `${ERRORS}.categoryRequired` }),

    amount: z
      .string()
      .trim()
      .min(1, { message: `${ERRORS}.amountRequired` })
      .transform(Number)
      .pipe(
        z
          .number({ error: `${ERRORS}.amountInvalid` })
          .positive({ message: `${ERRORS}.amountPositive` })
          .max(MAX_AMOUNT, { message: `${ERRORS}.amountTooLarge` })
          .refine(hasAtMostTwoDecimals, {
            message: `${ERRORS}.amountDecimals`,
          }),
      ),

    notes: z
      .string()
      .trim()
      .max(NOTES_MAX_LENGTH, {
        message: `${ERRORS}.notesTooLong`,
      }),

    date: z.string(),

    // Recurring: added again automatically every month (notification.md)
    recurring: z.boolean(),
    // "" = the 1st of the month; otherwise 1-31. Ignored when not recurring
    dayOfMonth: z.string().trim(),
  })
  .superRefine((item, ctx) => {
    if (!item.recurring || item.dayOfMonth === "") return;

    const day = Number(item.dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: `${ERRORS}.dayOfMonthInvalid`,
      });
    }
  })
  .transform(({ dayOfMonth, ...item }) => ({
    ...item,
    dayOfMonth: item.recurring && dayOfMonth !== "" ? Number(dayOfMonth) : null,
  }));

export type BudgetItemInput = z.input<typeof BudgetItemSchema>;
export type BudgetItemPayload = z.output<typeof BudgetItemSchema>;

export default BudgetItemSchema;
