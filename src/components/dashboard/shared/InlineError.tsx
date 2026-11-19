import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * One-line error for a secondary piece of a card (a sparkline, a sub-total),
 * where the full CardError block would be too big.
 */
export default function InlineError({ message, onRetry, className }: Props) {
  const { t } = useTranslation();

  return (
    <p
      role="alert"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <AlertCircle
        className="size-3.5 shrink-0 text-finance-danger"
        aria-hidden="true"
      />
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer font-medium text-foreground underline underline-offset-2 hover:no-underline"
        >
          {t("dashboard.common.tryAgain")}
        </button>
      )}
    </p>
  );
}
