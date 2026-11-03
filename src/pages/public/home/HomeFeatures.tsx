import { Button } from "@/components/ui/button";
import { Check, Coins, Play } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const points = [
  "whereMoneyGoes",
  "smarterSpending",
  "betterHabits",
  "achieveGoals",
] as const;

export default function HomeFeatures() {
  const { t } = useTranslation();

  return (
    <section className="w-full px-3 sm:px-6 py-8">
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            <Trans
              i18nKey="home.features.title"
              components={{ highlight: <span className="text-amber-400" /> }}
            />
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("home.features.subtitle")}
          </p>

          <ul className="mt-6 space-y-3">
            {points.map((key) => (
              <li
                key={key}
                className="flex items-center gap-2.5 text-sm text-foreground"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-finance-warning-bg">
                  <Check size={13} className="text-finance-warning" />
                </span>
                {t(`home.features.points.${key}`)}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-amber-400 text-black hover:bg-finance-warning/90"
            >
              <Link to="/signin">
                {t("home.features.seePricing")}
                <Coins size={18} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signin">
                {t("home.features.startFree")}
                <Play size={18} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right — dashboard screenshot slot */}
        <div className="rounded-2xl border border-border p-2 shadow-xl">
          <img
            src="/cta.png"
            alt={t("home.features.imageAlt")}
            className="w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}
