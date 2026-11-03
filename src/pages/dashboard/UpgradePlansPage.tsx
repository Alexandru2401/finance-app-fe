import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Minus } from "lucide-react";
import { Link } from "react-router";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For getting started with basic tracking.",
    features: [
      { label: "Up to 50 transactions/month", included: true },
      { label: "Basic dashboard", included: true },
      { label: "1 account", included: true },
      { label: "Advanced statistics", included: false },
      { label: "Data export", included: false },
    ],
    cta: "Current plan",
    current: true,
    featured: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For tracking everything, properly.",
    features: [
      { label: "Unlimited transactions", included: true },
      { label: "Advanced statistics & forecasts", included: true },
      { label: "Up to 5 accounts", included: true },
      { label: "Data export (CSV, PDF)", included: true },
      { label: "Custom categories", included: true },
    ],
    cta: "Upgrade to Pro",
    current: false,
    featured: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "For shared budgets and teams.",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Unlimited accounts", included: true },
      { label: "Shared budgets (up to 10 members)", included: true },
      { label: "Receipt scanning (OCR)", included: true },
      { label: "Priority support", included: true },
    ],
    cta: "Upgrade to Business",
    current: false,
    featured: false,
  },
];

export default function UpgradePlansPage() {
  return (
    <section className="py-8 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
        <p className="text-sm text-muted-foreground">
          Upgrade anytime. Cancel anytime. No hidden fees.
        </p>

        {/* Toggle monthly/yearly — necesita state cand il legi */}
        <div className="mt-6 inline-flex items-center gap-1 rounded-full border bg-muted/40 p-1">
          <button
            type="button"
            className="cursor-pointer rounded-full bg-background px-4 py-1.5 text-sm font-medium shadow-sm"
          >
            Monthly
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Yearly
            <span className="ml-1.5 text-xs font-semibold text-[#8a6d00] dark:text-[#ffd649]">
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Planuri */}
      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.featured
                ? "relative border-[#ffd649] shadow-md md:-mt-3"
                : "relative"
            }
          >
            {plan.featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ffd649] text-black hover:bg-[#ffd649]">
                Most popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-2">
                <span className="text-3xl font-bold tabular-nums">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </p>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6d00] dark:text-[#ffd649]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Minus
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        feature.included ? "" : "text-muted-foreground"
                      }
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                disabled={plan.current}
                variant={plan.featured ? "default" : "outline"}
                className={
                  plan.featured
                    ? "w-full cursor-pointer bg-[#ffd649] text-black hover:bg-[#ffd649]/90"
                    : "w-full cursor-pointer"
                }
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Questions about billing?{" "}
        <Link to="/settings" className="underline hover:text-foreground">
          Manage your subscription
        </Link>
      </p>
    </section>
  );
}