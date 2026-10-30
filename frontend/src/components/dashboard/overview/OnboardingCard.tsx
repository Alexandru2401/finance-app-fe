import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

/** Shown on the overview while the user has no transactions at all. */
export default function OnboardingCard() {
  const { t } = useTranslation();

  return (
    <Card className="mb-6 border-finance-primary/30">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-finance-primary-bg">
            <Sparkles
              className="h-5 w-5 text-finance-primary"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              {t("dashboard.overview.onboarding.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.overview.onboarding.description")}
            </p>
          </div>
        </div>

        {/* The transaction form lives on the budget page */}
        <Button asChild className="shrink-0">
          <Link to="budget">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("dashboard.overview.onboarding.addTransaction")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
