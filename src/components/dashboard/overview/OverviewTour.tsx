import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Joyride,
  STATUS,
  type EventData,
  type Step,
  type TooltipRenderProps,
} from "react-joyride";
import { ChevronLeft, ChevronRight, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addUserInfo } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const STEP_KEYS = [
  "period",
  "netBalance",
  "balance",
  "spending",
  "trend",
  "table",
] as const;

/** The tooltip of the tour, built from the app's Card and Button. */
function TourTooltip({
  index,
  size,
  step,
  isLastStep,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const { t } = useTranslation();

  return (
    <Card
      {...tooltipProps}
      className="w-[min(22rem,calc(100vw-2rem))] gap-4 p-5 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-finance-primary-bg">
            <Compass
              className="h-4 w-4 text-finance-primary"
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.overview.tour.progress", {
                current: index + 1,
                total: size,
              })}
            </p>
            {step.title && (
              <h2 className="font-semibold leading-tight text-foreground">
                {step.title}
              </h2>
            )}
          </div>
        </div>
        <Button
          {...closeProps}
          variant="ghost"
          size="icon-sm"
          className="-mr-2 -mt-2 text-muted-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{step.content}</p>

      {/* Progress dots */}
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: size }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-5 bg-finance-primary"
                : i < index
                  ? "w-1.5 bg-finance-primary/50"
                  : "w-1.5 bg-muted",
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        {!isLastStep ? (
          <Button
            {...skipProps}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            {t("dashboard.overview.tour.skip")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {index > 0 && (
            <Button {...backProps} variant="outline" size="sm">
              <ChevronLeft aria-hidden="true" />
              {t("dashboard.overview.tour.back")}
            </Button>
          )}
          <Button
            {...primaryProps}
            size="sm"
            className="bg-finance-primary text-white hover:bg-finance-primary/90"
          >
            {isLastStep
              ? t("dashboard.overview.tour.last")
              : t("dashboard.overview.tour.next")}
            {!isLastStep && <ChevronRight aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Guided tour of the Overview page. Targets use `data-tour="<key>"`.
 * Starts on its own until the user finishes or skips it (saved on the user as
 * has_completed_tour); it can always be replayed from the header button.
 */
export default function OverviewTour() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(false);

  // false = not done yet; undefined (older backend) = don't start on its own
  const pending = user?.has_completed_tour === false;

  // Auto-start after the cards had a moment to render
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [pending]);

  const steps: Step[] = STEP_KEYS.map((key) => ({
    target: `[data-tour="${key}"]`,
    title: t(`dashboard.overview.tour.steps.${key}.title`),
    content: t(`dashboard.overview.tour.steps.${key}.content`),
    placement: "auto",
  }));

  const handleEvent = (data: EventData) => {
    const finished =
      data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    if (!finished) return;
    setRun(false);

    if (user && pending) {
      setUser({ ...user, has_completed_tour: true });
      // A failed save only means the tour shows again next time
      addUserInfo({ completeTour: true }).catch(() => {});
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setRun(true)}
        aria-label={t("dashboard.overview.tour.start")}
      >
        <Compass aria-hidden="true" />
        <span className="hidden sm:inline">
          {t("dashboard.overview.tour.start")}
        </span>
      </Button>

      <Joyride
        run={run}
        steps={steps}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        tooltipComponent={TourTooltip}
        options={{
          skipBeacon: true,
          closeButtonAction: "skip",
          arrowColor: "var(--card)",
          overlayColor: "rgb(0 0 0 / 0.45)",
          spotlightPadding: 8,
          spotlightRadius: 14,
          zIndex: 1000,
        }}
        locale={{
          back: t("dashboard.overview.tour.back"),
          close: t("dashboard.overview.tour.close"),
          last: t("dashboard.overview.tour.last"),
          next: t("dashboard.overview.tour.next"),
          skip: t("dashboard.overview.tour.skip"),
        }}
      />
    </>
  );
}
