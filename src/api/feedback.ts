import { post } from "./client";

export type FeedbackPayload = {
  message: string;
};

export function sendFeedback(payload: FeedbackPayload) {
  return post<{ success?: boolean; message?: string }>("/feedback", payload);
}
