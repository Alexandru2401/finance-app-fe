import { useTranslation } from "react-i18next";

const brands = [
  "Forbes",
  "TechCrunch",
  "MarketWatch",
  "Yahoo Finance",
  "Product Hunt",
];

export default function HomeBrands() {
  const { t } = useTranslation();

  return (
    <section className="w-full border-y border-border bg-background py-6">
      <p className="mb-6 text-center text-sm font-semibold text-muted-foreground">
        {t("home.brands.title")}
      </p>

      <div className="group relative overflow-hidden">
        <div className="flex w-max animate-marquee gap-x-12 group-hover:paused">
          {[...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="shrink-0 text-lg font-semibold text-muted-foreground/60"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
