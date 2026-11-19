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
import { addUserInfo, type TourName } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import type ro from "@/i18n/locales/ro.json";

type Tours = Omit<(typeof ro)["dashboard"]["tours"], "buttons">;
// "dashboard.tours.<tour>.<step>" for every step that has texts
type StepPath = {
  [T in TourName]: `dashboard.tours.${T}.${keyof Tours[T] & string}`;
}[TourName];

export interface TourStep<T extends TourName = TourName> {
  // Target: the element with data-tour="<key>"; texts under
  // dashboard.tours.<tour>.<key>.title / .content
  key: keyof Tours[T] & string;
  // Runs before the step, e.g. to open the panel the step points at
  before?: () => void;
  // ms to wait after before(), e.g. for a sheet to finish sliding in (default 150)
  wait?: number;
  // Intro / outro step: a centered card with no target (no data-tour needed)
  center?: boolean;
}

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
      className="w-[min(22rem,calc(100vw-1.5rem))] gap-3 p-4 shadow-lg sm:gap-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-finance-primary-bg sm:size-9">
            <Compass
              className="h-4 w-4 text-finance-primary"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.tours.buttons.progress", {
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

      <p className="max-h-[40dvh] overflow-y-auto text-sm text-muted-foreground">
        {step.content}
      </p>

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
            className="-ml-2 px-2 text-muted-foreground"
          >
            {t("dashboard.tours.buttons.skip")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {index > 0 && (
            <Button
              {...backProps}
              variant="outline"
              size="sm"
              aria-label={t("dashboard.tours.buttons.back")}
            >
              <ChevronLeft aria-hidden="true" />
              <span className="hidden sm:inline">
                {t("dashboard.tours.buttons.back")}
              </span>
            </Button>
          )}
          <Button
            {...primaryProps}
            size="sm"
            className="bg-finance-primary text-finance-foreground hover:bg-finance-primary/90"
          >
            {isLastStep
              ? t("dashboard.tours.buttons.last")
              : index === 0 && step.placement === "center"
                ? t("dashboard.tours.buttons.begin")
                : t("dashboard.tours.buttons.next")}
            {!isLastStep && <ChevronRight aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface PageTourProps<T extends TourName> {
  tour: T;
  steps: TourStep<T>[];
  // Runs when the tour ends (finished or skipped), e.g. to close a panel
  onEnd?: () => void;
  // Interpolation values for the step texts, e.g. { name } for "Welcome, {{name}}!"
  values?: Record<string, string>;
  // Extra classes for the "Guided tour" button, e.g. "h-9" in a toolbar
  className?: string;
}

/**
 * Guided tour of a dashboard page, with its own "Guided tour" button.
 * Starts on its own until the user finishes or skips it (saved on the user
 * in completed_tours); it can always be replayed from the button.
 */
export default function PageTour<T extends TourName>({
  tour,
  steps,
  onEnd,
  values,
  className,
}: PageTourProps<T>) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(false);
  const isMobile = useIsMobile();

  // undefined (older backend) = don't start on its own
  const pending =
    !!user?.completed_tours && !user.completed_tours.includes(tour);

  // Auto-start after the page had a moment to render
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [pending]);

  const joyrideSteps: Step[] = steps.map(({ key, before, center, wait }) => {
    const path = `dashboard.tours.${tour}.${key}` as StepPath;
    return {
      target: center ? "body" : `[data-tour="${key}"]`,
      title: t(`${path}.title`, values),
      content: t(`${path}.content`, values),
      // Phones: above or below the target (flips when there is no room);
      // "auto" would also try left/right, where a narrow screen has no space
      placement: center ? "center" : isMobile ? "bottom" : "auto",
      // Give React a moment to render what before() opened
      before: before
        ? () =>
            new Promise<void>((resolve) => {
              before();
              setTimeout(resolve, wait ?? 150);
            })
        : undefined,
    };
  });

  const handleEvent = (data: EventData) => {
    const finished =
      data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    if (!finished) return;
    setRun(false);
    onEnd?.();

    if (user && pending) {
      setUser({
        ...user,
        completed_tours: [...(user.completed_tours ?? []), tour],
      });
      // A failed save only means the tour shows again next time
      addUserInfo({ completeTour: tour }).catch(() => {});
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRun(true)}
        className={cn("cursor-pointer gap-1.5", className)}
        aria-label={t("dashboard.tours.buttons.start")}
      >
        <Compass size={16} aria-hidden="true" />
        <span className="hidden sm:inline">
          {t("dashboard.tours.buttons.start")}
        </span>
      </Button>

      <Joyride
        run={run}
        steps={joyrideSteps}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        tooltipComponent={TourTooltip}
        options={{
          skipBeacon: true,
          closeButtonAction: "skip",
          arrowColor: "var(--card)",
          overlayColor: "var(--overlay)",
          spotlightPadding: isMobile ? 4 : 8,
          spotlightRadius: 14,
          offset: isMobile ? 8 : 10,
          // Phones: clear the fixed top bar (h-14) when scrolling to a target
          scrollOffset: isMobile ? 72 : 20,
          zIndex: 1000,
        }}
        // Keep the tooltip at least 12px from the screen edges
        floatingOptions={{ shiftOptions: { padding: 12 } }}
      />
    </>
  );
}
