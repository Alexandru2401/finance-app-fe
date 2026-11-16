import { Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  // Only the icon, for narrow places (the Budget list); the label stays for
  // screen readers
  compact?: boolean;
  className?: string;
}

/** Marks a transaction that belongs to a recurring rule (recurring_id). */
export default function RecurringBadge({ compact = false, className }: Props) {
  const { t } = useTranslation();
  const hint = t("dashboard.common.recurringHint");

  return (
    <Badge
      variant="outline"
      title={hint}
      className={cn(
        "gap-1 text-muted-foreground",
        compact && "px-1.5",
        className,
      )}
    >
      <Repeat aria-hidden="true" />
      {compact ? (
        <span className="sr-only">{t("dashboard.common.recurring")}</span>
      ) : (
        t("dashboard.common.recurring")
      )}
    </Badge>
  );
}
