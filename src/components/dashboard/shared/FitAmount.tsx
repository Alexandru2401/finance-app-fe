import { useLayoutEffect, useRef, useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  sign?: "auto" | "+" | "-";
  // Always 2 decimals in the full form (the short form is rounded anyway)
  fixed?: boolean;
  className?: string;
}

/**
 * An amount that switches to the short form (200K RON) only when the full one
 * doesn't fit its box, and back when there is room again (resize, sidebar
 * toggle). The full value stays in the tooltip and for screen readers.
 *
 * It is a block, so its width comes from the parent, not from the text. Don't
 * use it inside table cells: a cell grows with its content, so the text always
 * "fits" there (use CompactAmount instead). Its width must not come from its
 * own text, or once shortened it never grows back: in a flex row give it
 * `flex-1`, in a centered column a fixed width.
 */
export default function FitAmount({ value, sign, fixed, className }: Props) {
  const { format, formatCompact } = useCurrency();
  const full = format(value, sign, fixed);
  const compact = formatCompact(value, sign);

  const boxRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;
    // The hidden copy always holds the full text, so the check doesn't
    // depend on which version is currently shown
    const check = () => setFits(measure.offsetWidth <= box.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(box);
    return () => observer.disconnect();
  }, [full]);

  const shortened = !fits && compact !== full;

  return (
    <span
      ref={boxRef}
      title={shortened ? full : undefined}
      className={cn(
        "relative block min-w-0 overflow-hidden whitespace-nowrap text-ellipsis tabular-nums",
        className,
      )}
    >
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute left-0 top-0 whitespace-nowrap"
      >
        {full}
      </span>
      {shortened ? (
        <>
          <span aria-hidden="true">{compact}</span>
          <span className="sr-only">{full}</span>
        </>
      ) : (
        full
      )}
    </span>
  );
}
