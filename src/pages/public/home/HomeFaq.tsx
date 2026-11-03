import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const faqs = [
  "free",
  "security",
  "bank",
  "business",
  "mobile",
  "cancel",
] as const;

export default function HomeFaq() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full md:max-w-2xl p-3 ">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("home.faq.title")}
        </h2>
        <p className="mt-4 text-muted-foreground">{t("home.faq.subtitle")}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
              {t(`home.faq.items.${key}.q`)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t(`home.faq.items.${key}.a`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
