import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ANNUAL_DISCOUNT,
  EnterprisePlans,
  type PlanCurrency,
} from "@/components/public/data/PublicPricesCards";
import {
  ArrowRight,
  Check,
  Headset,
  Lock,
  Minus,
  Plus,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SALES_EMAIL = "sales@financeapp.com";
const MAX_CALCULATOR_SEATS = 100;

const trustItems = [
  { key: "security", icon: ShieldCheck },
  { key: "gdpr", icon: Lock },
  { key: "uptime", icon: ServerCog },
  { key: "support", icon: Headset },
] as const;

const faqs = [
  "seats",
  "change",
  "invoice",
  "migration",
  "security",
  "trial",
] as const;

export default function PublicPricesEnterprisePage() {
  const { t, i18n } = useTranslation();
  const [annual, setAnnual] = useState(true);
  const [seats, setSeats] = useState(15);

  // Română → lei, engleză → dolari (la fel ca pe pagina Personal)
  const planCurrency: PlanCurrency =
    i18n.resolvedLanguage === "ro" ? "RON" : "USD";
  const currency = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "currency",
    currency: planCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const seatPrice = (price: { RON: number; USD: number }) =>
    price[planCurrency] * (annual ? 1 - ANNUAL_DISCOUNT : 1);

  const updateSeats = (value: number) =>
    setSeats(Math.min(Math.max(Number.isNaN(value) ? 1 : value, 1), 999));

  return (
    <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-16">
        <span
          className={annual ? "text-muted-foreground" : "font-semibold"}
        >
          {t("pricesEnterprise.monthly")}
        </span>
        <Switch
          checked={annual}
          onCheckedChange={setAnnual}
          className="cursor-pointer"
          aria-label={t("pricesEnterprise.annual")}
        />
        <span
          className={annual ? "font-semibold" : "text-muted-foreground"}
        >
          {t("pricesEnterprise.annual")}
        </span>
        <Badge className="bg-emerald-400">
          {t("pricesEnterprise.save", { percent: ANNUAL_DISCOUNT * 100 })}
        </Badge>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {EnterprisePlans.map((plan) => {
          const Icon = plan.icon;
          const isCustom = plan.pricePerSeat === null;
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
                  {t("pricesEnterprise.mostPopular")}
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className={`h-6 w-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <CardTitle className="text-2xl">
                    {t(`pricesEnterprise.plans.${plan.id}.name`)}
                  </CardTitle>
                </div>
                <CardDescription>
                  {t(`pricesEnterprise.plans.${plan.id}.description`)}
                </CardDescription>
                <div className="mt-4">
                  {isCustom ? (
                    <span className="text-4xl font-bold">
                      {t("pricesEnterprise.customPrice")}
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {currency.format(seatPrice(plan.pricePerSeat))}
                      </span>
                      <span className="text-muted-foreground">
                        {t("pricesEnterprise.perSeat")}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isCustom
                    ? t("pricesEnterprise.customPriceHint")
                    : [
                        t("pricesEnterprise.minSeats", { n: plan.minSeats }),
                        annual && t("pricesEnterprise.billedAnnually"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </CardHeader>

              <CardContent className="grow">
                <ul className="space-y-3">
                  {"includes" in plan && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">
                        {t("pricesEnterprise.everythingIn", {
                          plan: t(`pricesEnterprise.plans.${plan.includes}.name`),
                        })}
                      </span>
                    </li>
                  )}
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{t(`pricesEnterprise.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCustom ? (
                  <a href={`mailto:${SALES_EMAIL}`} className="w-full">
                    <Button
                      className="w-full cursor-pointer"
                      variant="outline"
                      size="lg"
                    >
                      {t("pricesEnterprise.contactSales")}
                    </Button>
                  </a>
                ) : (
                  <Link
                    to={`/paypage/enterprise?${new URLSearchParams({
                      plan: plan.id,
                      billing: annual ? "annual" : "monthly",
                      seats: String(Math.max(seats, plan.minSeats)),
                    })}`}
                    className="w-full"
                  >
                    <Button
                      className="w-full cursor-pointer"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {t("pricesEnterprise.startTrial")}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Cost calculator */}
      <Card className="max-w-4xl mx-auto mb-20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t("pricesEnterprise.calculator.title")}
          </CardTitle>
          <CardDescription>
            {t("pricesEnterprise.calculator.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="seats" className="text-sm font-medium">
              {t("pricesEnterprise.calculator.seats")}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => updateSeats(seats - 1)}
                aria-label="-1"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="seats"
                type="number"
                min={1}
                max={999}
                value={seats}
                onChange={(e) => updateSeats(e.target.valueAsNumber)}
                className="w-24 text-center text-lg font-semibold"
              />
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => updateSeats(seats + 1)}
                aria-label="+1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {EnterprisePlans.map((plan) => {
              // Planul Enterprise are preț personalizat, nu intră în calculator
              if (plan.pricePerSeat === null) return null;
              const billedSeats = Math.max(seats, plan.minSeats);
              const total = billedSeats * seatPrice(plan.pricePerSeat);
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border p-5 ${
                    plan.popular ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(`pricesEnterprise.plans.${plan.id}.name`)}
                  </p>
                  <p className="mt-1">
                    <span className="text-3xl font-bold">
                      {currency.format(total)}
                    </span>
                    <span className="text-muted-foreground">
                      {t("pricesEnterprise.calculator.perMonth")}
                    </span>
                  </p>
                  {seats < plan.minSeats && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("pricesEnterprise.calculator.belowMin", {
                        n: plan.minSeats,
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {seats > MAX_CALCULATOR_SEATS && (
            <p className="text-center text-sm font-medium text-primary">
              {t("pricesEnterprise.calculator.overLimit", {
                n: MAX_CALCULATOR_SEATS,
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trust */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-10 text-center">
          {t("pricesEnterprise.trust.title")}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-lg border p-6">
              <div className="mb-4 inline-flex rounded-md bg-primary/10 p-2">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">
                {t(`pricesEnterprise.trust.items.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`pricesEnterprise.trust.items.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {t("pricesEnterprise.faq.title")}
        </h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger>
                {t(`pricesEnterprise.faq.items.${key}.q`)}
              </AccordionTrigger>
              <AccordionContent>
                {t(`pricesEnterprise.faq.items.${key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-12 md:px-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          {t("pricesEnterprise.cta.title")}
        </h2>
        <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
          {t("pricesEnterprise.cta.text")}
        </p>
        <a href={`mailto:${SALES_EMAIL}`}>
          <Button size="lg" variant="secondary" className="cursor-pointer">
            {t("pricesEnterprise.cta.button")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </section>
  );
}
