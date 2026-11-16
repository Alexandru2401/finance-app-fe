import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export type DayPart = "morning" | "afternoon" | "evening" | "night";

// 05-11 morning, 12-17 afternoon, 18-21 evening, 22-04 night (browser time)
export const dayPart = (hour: number): DayPart =>
  hour >= 5 && hour < 12
    ? "morning"
    : hour >= 12 && hour < 18
      ? "afternoon"
      : hour >= 18 && hour < 22
        ? "evening"
        : "night";

// The first visit is remembered in the browser (the backend has no "last
// login"). Only accounts younger than this get "Welcome": an older account on
// a new device sees the normal greeting
const NEW_ACCOUNT_DAYS = 7;
const STORAGE_PREFIX = "welcomed:";

const isNewAccount = (createdAt?: string) => {
  if (!createdAt) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age >= 0 && age < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
};

const wasWelcomed = (userId: string) => {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}`) !== null;
  } catch {
    // localStorage unavailable (e.g. private mode): no "Welcome"
    return true;
  }
};

/**
 * The greeting of the Overview: "first" on the first visit of a new account,
 * otherwise the part of the day. Read once, when the page opens, so it does not
 * change while the user is on it.
 */
export function useGreeting(): { firstVisit: boolean; part: DayPart } {
  const { user } = useAuth();
  const userId = user?.user_id;

  const [greeting] = useState(() => ({
    firstVisit:
      !!userId && isNewAccount(user?.created_at) && !wasWelcomed(userId),
    part: dayPart(new Date().getHours()),
  }));

  // After the first visit, the next ones get the normal greeting
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1");
    } catch {
      // ignored
    }
  }, [userId]);

  return greeting;
}
