// Same limits as the backend

export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 50;

// The largest value of the numeric(12,2) amount columns
export const MAX_AMOUNT = 9_999_999_999.99;

export const hasAtMostTwoDecimals = (amount: number) =>
  Math.round(amount * 100) / 100 === amount;

/** An amount the backend saves exactly as it was typed. */
export const isValidAmount = (amount: number) =>
  Number.isFinite(amount) &&
  amount > 0 &&
  amount <= MAX_AMOUNT &&
  hasAtMostTwoDecimals(amount);
