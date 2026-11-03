import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import PersonalPlans, {
  type PlanCurrency,
} from "@/components/public/data/PublicPricesCards";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const faqs = [
  "switch",
  "trial",
  "payment",
  "cancel",
  "security",
  "refund",
] as const;

export default function PublicPricesPersonalPage() {
  const { t, i18n } = useTranslation();

  // Română → lei ("44,99 RON"), engleză → dolari ("$9.99")
  const planCurrency: PlanCurrency =
    i18n.resolvedLanguage === "ro" ? "RON" : "USD";
  const currency = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "currency",
    currency: planCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t("prices.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("prices.subtitle")}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {PersonalPlans.map((plan) => {
          const Icon = plan.icon;
          const price = plan.price[planCurrency];
          const isFree = price === 0;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400">
                  {t("prices.mostPopular")}
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className={`h-6 w-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <CardTitle className="text-2xl">
                    {t(`prices.plans.${plan.id}.name`)}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t(`prices.plans.${plan.id}.description`)}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {currency.format(price)}
                  </span>
                  <span className="text-muted-foreground">
                    {t("prices.perMonth")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="grow">
                <ul className="space-y-3">
                  {"includes" in plan && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">
                        {t("prices.everythingIn", {
                          plan: t(`prices.plans.${plan.includes}.name`),
                        })}
                      </span>
                    </li>
                  )}
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{t(`prices.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link
                  to={isFree ? "/signin" : `/paypage/personal?plan=${plan.id}`}
                  className="w-full"
                >
                  <Button
                    className="w-full cursor-pointer"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {isFree
                      ? t("prices.getStartedFree")
                      : t("prices.startTrial")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {t("prices.faq.title")}
        </h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger>{t(`prices.faq.items.${key}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`prices.faq.items.${key}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
