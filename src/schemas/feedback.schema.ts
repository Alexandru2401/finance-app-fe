import { z } from "zod";

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 1000;

// Mesajele sunt chei din "roadmap.feedback.errors" (i18n), traduse la afișare
export type FeedbackErrorKey = "messageTooShort" | "messageTooLong";
const error = (key: FeedbackErrorKey) => ({ message: key });

const FeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(FEEDBACK_MESSAGE_MIN, error("messageTooShort"))
    .max(FEEDBACK_MESSAGE_MAX, error("messageTooLong")),
});

export default FeedbackSchema;
