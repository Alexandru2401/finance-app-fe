import { useCurrency } from "@/hooks/useCurrency";

// From this amount up, narrow containers show the short form (10.000 -> 10K)
const COMPACT_FROM = 10_000;

// Container width from which the full amount is shown. Full class strings,
// so Tailwind can find them in the source
const FULL_FROM = {
  md: { short: "@md:hidden", full: "hidden @md:inline" }, // 28rem
  xl: { short: "@xl:hidden", full: "hidden @xl:inline" }, // 36rem
  "3xl": { short: "@3xl:hidden", full: "hidden @3xl:inline" }, // 48rem
} as const;

interface Props {
  value: number;
  sign?: "auto" | "+" | "-";
  fixed?: boolean;
  // Width of the nearest @container from which the full amount fits
  fullFrom?: keyof typeof FULL_FROM;
}

/**
 * For table cells, where FitAmount can't measure (a cell grows with its
 * text): large amounts get the short form (200K RON) while the nearest
 * @container is narrower than `fullFrom`. Full value in the tooltip.
 */
export default function CompactAmount({
  value,
  sign,
  fixed,
  fullFrom = "md",
}: Props) {
  const { format, formatCompact } = useCurrency();
  const full = format(value, sign, fixed);

  if (Math.abs(value) < COMPACT_FROM) return <>{full}</>;

  const classes = FULL_FROM[fullFrom];
  return (
    <span title={full}>
      <span className={classes.short}>{formatCompact(value, sign)}</span>
      <span className={classes.full}>{full}</span>
    </span>
  );
}
