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
            {t("dashboard.tours.buttons.skip")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {index > 0 && (
            <Button {...backProps} variant="outline" size="sm">
              <ChevronLeft aria-hidden="true" />
              {t("dashboard.tours.buttons.back")}
            </Button>
          )}
          <Button
            {...primaryProps}
            size="sm"
            className="bg-finance-primary text-white hover:bg-finance-primary/90"
          >
            {isLastStep
              ? t("dashboard.tours.buttons.last")
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
}: PageTourProps<T>) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [run, setRun] = useState(false);

  // undefined (older backend) = don't start on its own
  const pending =
    !!user?.completed_tours && !user.completed_tours.includes(tour);

  // Auto-start after the page had a moment to render
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [pending]);

  const joyrideSteps: Step[] = steps.map(({ key, before }) => {
    const path = `dashboard.tours.${tour}.${key}` as StepPath;
    return {
      target: `[data-tour="${key}"]`,
      title: t(`${path}.title`),
      content: t(`${path}.content`),
      placement: "auto",
      // Give React a moment to render what before() opened
      before: before
        ? () =>
            new Promise<void>((resolve) => {
              before();
              setTimeout(resolve, 150);
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
        className="cursor-pointer gap-1.5"
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
          overlayColor: "rgb(0 0 0 / 0.45)",
          spotlightPadding: 8,
          spotlightRadius: 14,
          zIndex: 1000,
        }}
      />
    </>
  );
}
