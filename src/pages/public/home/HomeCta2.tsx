import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function HomeCta2() {
  const { t } = useTranslation();

  return (
    <section className="w-full bg-background px-3 sm:px-6 py-16">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-amber-500 p-4 md:px-12 md:py-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/10">
              <BarChart3 size={28} className="text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black md:text-3xl">
                {t("home.cta.title")}
              </h2>
              <p className="mt-1 text-sm text-black/70">
                {t("home.cta.subtitle")}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="gap-2 bg-black text-white hover:bg-black/80"
          >
            <Link to="/signin">
              {t("home.cta.button")}
              <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
