import { z } from "zod";
import { hasAtMostTwoDecimals, MAX_AMOUNT } from "@/lib/validation";

export const NOTES_MAX_LENGTH = 1500;

// The messages are translation keys; the form translates them
const ERRORS = "dashboard.budget.form.errors";

const BudgetItemSchema = z.object({
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
});

export type BudgetItemInput = z.input<typeof BudgetItemSchema>;
export type BudgetItemPayload = z.output<typeof BudgetItemSchema>;

export default BudgetItemSchema;
