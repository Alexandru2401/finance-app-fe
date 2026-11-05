import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("places the symbol before the amount for USD", () => {
    expect(formatCurrency(1234.5, "USD", "auto", false, "en-US")).toBe(
      "$1,234.5",
    );
  });

  it("places RON after the amount", () => {
    expect(formatCurrency(1234.5, "RON", "auto", false, "en-US")).toBe(
      "1,234.5 RON",
    );
  });

  it("keeps the minus sign for negative amounts", () => {
    expect(formatCurrency(-20, "EUR", "auto", false, "en-US")).toBe("-€20");
  });

  it("shows two decimals when fixed is true", () => {
    expect(formatCurrency(10, "USD", "auto", true, "en-US")).toBe("$10.00");
  });
});
