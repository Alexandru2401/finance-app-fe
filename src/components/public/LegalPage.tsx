import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

// Textele sunt în i18n: "legal.<page>.sections.<id>" (ordinea din JSON = ordinea din pagină)
type LegalSection = { title: string; paragraphs: string[] };

const LAST_UPDATED = new Date(2026, 8, 1);
const CONTACT_EMAIL = "legal@financeapp.com";

export default function LegalPage({ page }: { page: "terms" | "privacy" }) {
  const { t, i18n } = useTranslation();

  const sections = Object.entries(
    t(`legal.${page}.sections`, { returnObjects: true }) as Record<
      string,
      LegalSection
    >,
  );
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "long",
  }).format(LAST_UPDATED);

  return (
    <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t(`legal.${page}.title`)}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("legal.lastUpdated", { date })}
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t(`legal.${page}.intro`)}
        </p>
      </div>

      {/* Cuprins */}
      <nav className="mb-10 rounded-xl border bg-muted/40 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
          {t("legal.contents")}
        </h2>
        <ol className="grid gap-2 text-sm sm:grid-cols-2">
          {sections.map(([id, section]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-muted-foreground hover:text-foreground transition"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Secțiuni */}
      <div className="space-y-10">
        {sections.map(([id, section]) => (
          <article key={id} id={id} className="scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <Separator className="my-12" />

      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{t("legal.questions")}</h2>
        <p className="text-muted-foreground">
          {t("legal.questionsText", { email: CONTACT_EMAIL })}
        </p>
      </div>
    </section>
  );
}
