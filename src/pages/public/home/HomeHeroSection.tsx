import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

const perks = ["free", "secure", "sync"] as const;

export default function HomeHeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full overflow-hidden bg-background px-3 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center sm:gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-center lg:text-left md:text-6xl">
            <Trans
              i18nKey="home.hero.title"
              components={{ highlight: <span className="text-amber-400" /> }}
            />
          </h1>

          <p className="mt-6 sm:mx-auto lg:mx-0 lg:text-start max-w-md text-lg">
            {t("home.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-amber-400 text-black hover:bg-finance-warning/90"
            >
              <Link to="/signin">
                {t("home.hero.getStarted")}
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/about">
                <Play size={16} />
                {t("home.hero.howItWorks")}
              </Link>
            </Button>
          </div>

          <ul className="mt-8 flex justify-center sm:justify-center flex-wrap lg:justify-start gap-x-6 gap-y-2">
            {perks.map((key) => (
              <li key={key} className="flex items-center gap-1.5 text-sm">
                <Check size={15} className="text-amber-400" />
                {t(`home.hero.perks.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex justify-center">
          <div className="relative w-full max-w-sm rounded-2xl p-4">
            <img
              src="/hero-2.png"
              alt={t("home.hero.imageAlt")}
              className="relative z-20"
            />

            <div className="absolute top-50 -left-1 sm:left-0 z-10  h-50 w-95 sm:w-100 rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
