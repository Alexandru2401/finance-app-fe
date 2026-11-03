import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function CardError({ message, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <AlertCircle className="h-6 w-6 text-finance-danger" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {message ?? t("dashboard.common.loadError")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("dashboard.common.tryAgain")}
        </Button>
      )}
    </div>
  );
}
