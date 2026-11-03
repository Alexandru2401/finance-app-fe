import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import PersonalPlans, {
  ANNUAL_DISCOUNT,
  EnterprisePlans,
  type PlanCurrency,
} from "@/components/public/data/PublicPricesCards";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  CircleCheck,
  CreditCard,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";

const TRIAL_DAYS = 14;
// Prețurile Enterprise sunt fără TVA; cele Personal includ deja TVA
const VAT_RATE = 0.21;
const MAX_SEATS = 999;

type PlanType = "personal" | "enterprise";
type Billing = "monthly" | "annual";

type FormFields = {
  fullName: string;
  email: string;
  companyName: string;
  cui: string;
  address: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

type ErrorKey =
  | "required"
  | "email"
  | "cui"
  | "cardNumber"
  | "expiry"
  | "cvc"
  | "terms";

type FormErrors = Partial<Record<keyof FormFields | "terms", ErrorKey>>;

// Transformă ?plan=... într-un plan plătibil; null = plan inexistent, gratuit sau cu preț personalizat
function resolvePlan(type: PlanType, planId: string | null) {
  if (type === "personal") {
    const plan = PersonalPlans.find((p) => p.id === planId);
    if (!plan || plan.price.USD === 0) return null;
    return {
      icon: plan.icon,
      price: plan.price,
      minSeats: 1,
      nameKey: `prices.plans.${plan.id}.name`,
      descriptionKey: `prices.plans.${plan.id}.description`,
    } as const;
  }

  const plan = EnterprisePlans.find((p) => p.id === planId);
  if (!plan || plan.pricePerSeat === null) return null;
  return {
    icon: plan.icon,
    price: plan.pricePerSeat,
    minSeats: plan.minSeats,
    nameKey: `pricesEnterprise.plans.${plan.id}.name`,
    descriptionKey: `pricesEnterprise.plans.${plan.id}.description`,
  } as const;
}

// Algoritmul Luhn — verificarea standard a numerelor de card
function isValidCardNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // Cardul e valid până la finalul lunii de expirare
  return new Date(year, month, 1) > new Date();
}

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export default function PayPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuth } = useAuth();
  const { type: typeParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const type: PlanType = typeParam === "enterprise" ? "enterprise" : "personal";
  const isEnterprise = type === "enterprise";
  const plan = resolvePlan(type, searchParams.get("plan"));

  const billing: Billing =
    searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const annual = billing === "annual";
  const minSeats = plan?.minSeats ?? 1;
  const seatsParam = Number(searchParams.get("seats"));
  const seats = isEnterprise
    ? Math.min(Math.max(Number.isFinite(seatsParam) ? seatsParam : 0, minSeats), MAX_SEATS)
    : 1;

  const [form, setForm] = useState<FormFields>({
    fullName: "",
    email: user?.email ?? "",
    companyName: "",
    cui: "",
    address: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (typeParam !== "personal" && typeParam !== "enterprise") {
    return <Navigate to="/prices/personal" replace />;
  }
  if (!plan) {
    return <Navigate to={`/prices/${type}`} replace />;
  }

  // Română → lei, engleză → dolari (la fel ca pe paginile de prețuri)
  const planCurrency: PlanCurrency =
    i18n.resolvedLanguage === "ro" ? "RON" : "USD";
  const currency = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "currency",
    currency: planCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const unitPrice =
    plan.price[planCurrency] * (annual ? 1 - ANNUAL_DISCOUNT : 1);
  const subtotal = unitPrice * seats * (annual ? 12 : 1);
  const vat = isEnterprise ? subtotal * VAT_RATE : 0;
  const total = subtotal + vat;

  const firstChargeDate = new Date();
  firstChargeDate.setDate(firstChargeDate.getDate() + TRIAL_DAYS);
  const formattedChargeDate = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(firstChargeDate);

  const planName = t(plan.nameKey);
  const PlanIcon = plan.icon;

  function updateParam(key: "billing" | "seats", value: string) {
    setSearchParams(
      (params) => {
        params.set(key, value);
        return params;
      },
      { replace: true },
    );
  }

  function handleChange(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FormErrors {
    const result: FormErrors = {};
    const required: (keyof FormFields)[] = [
      "fullName",
      "email",
      "cardName",
      "cardNumber",
      "expiry",
      "cvc",
      ...(isEnterprise
        ? (["companyName", "cui", "address"] as const)
        : []),
    ];
    for (const field of required) {
      if (!form[field].trim()) result[field] = "required";
    }

    if (!result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      result.email = "email";
    if (isEnterprise && !result.cui && !/^(RO)?\d{2,10}$/i.test(form.cui.replace(/\s/g, "")))
      result.cui = "cui";
    if (!result.cardNumber && !isValidCardNumber(form.cardNumber))
      result.cardNumber = "cardNumber";
    if (!result.expiry && !isValidExpiry(form.expiry)) result.expiry = "expiry";
    if (!result.cvc && !/^\d{3,4}$/.test(form.cvc)) result.cvc = "cvc";
    if (!acceptedTerms) result.terms = "terms";

    return result;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    try {
      setLoading(true);
      // TODO: integrare cu procesatorul de plăți (ex. Stripe) și cu backend-ul.
      // Până atunci, plata este simulată și nu se trimite nimic.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setCompleted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.log(err);
      toast.error(t("pay.failed"));
    } finally {
      setLoading(false);
    }
  }

  const fieldError = (field: keyof FormFields | "terms") => {
    const key = errors[field];
    return key ? [{ message: t(`pay.errors.${key}`) }] : undefined;
  };

  const renderInput = (
    field: keyof FormFields,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <Field data-invalid={!!errors[field]}>
      <FieldLabel htmlFor={field}>{t(`pay.fields.${field}`)}</FieldLabel>
      <Input
        id={field}
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        aria-invalid={!!errors[field]}
        {...props}
      />
      <FieldError errors={fieldError(field)} />
    </Field>
  );

  if (completed) {
    return (
      <section className="py-16 px-4 md:px-8 max-w-xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CircleCheck className="h-14 w-14 text-emerald-500 mx-auto mb-2" />
            <CardTitle className="text-2xl">{t("pay.success.title")}</CardTitle>
            <CardDescription className="text-base">
              {t("pay.success.text", {
                plan: planName,
                amount: currency.format(total),
                date: formattedChargeDate,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("pay.success.emailNote", { email: form.email })}
            </p>
            <Link to={isAuth ? "/dashboard" : "/login"}>
              <Button size="lg" className="cursor-pointer">
                {isAuth ? t("pay.success.dashboard") : t("pay.login")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Link
          to={`/prices/${type}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("pay.backToPlans")}
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {t("pay.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t("pay.subtitle")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        {/* Checkout form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("pay.sections.account")}</CardTitle>
              {!isAuth && (
                <CardDescription>
                  {t("pay.haveAccount")}{" "}
                  <Link to="/login" className="underline hover:text-foreground">
                    {t("pay.login")}
                  </Link>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid sm:grid-cols-2 gap-4">
                {renderInput("fullName", {
                  autoComplete: "name",
                  placeholder: t("pay.placeholders.fullName"),
                })}
                {renderInput("email", {
                  type: "email",
                  autoComplete: "email",
                  placeholder: t("pay.placeholders.email"),
                })}
              </FieldGroup>
            </CardContent>
          </Card>

          {isEnterprise && (
            <Card>
              <CardHeader>
                <CardTitle>{t("pay.sections.company")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid sm:grid-cols-2 gap-4">
                  {renderInput("companyName", {
                    autoComplete: "organization",
                    placeholder: t("pay.placeholders.companyName"),
                  })}
                  {renderInput("cui", {
                    placeholder: t("pay.placeholders.cui"),
                  })}
                  <div className="sm:col-span-2">
                    {renderInput("address", {
                      autoComplete: "street-address",
                      placeholder: t("pay.placeholders.address"),
                    })}
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("pay.sections.payment")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  {renderInput("cardName", { autoComplete: "cc-name" })}
                </div>
                <div className="sm:col-span-2">
                  {renderInput("cardNumber", {
                    inputMode: "numeric",
                    autoComplete: "cc-number",
                    placeholder: "1234 5678 9012 3456",
                    onChange: (e) =>
                      handleChange("cardNumber", formatCardNumber(e.target.value)),
                  })}
                </div>
                {renderInput("expiry", {
                  inputMode: "numeric",
                  autoComplete: "cc-exp",
                  placeholder: "MM/YY",
                  onChange: (e) =>
                    handleChange("expiry", formatExpiry(e.target.value)),
                })}
                {renderInput("cvc", {
                  inputMode: "numeric",
                  autoComplete: "cc-csc",
                  placeholder: "123",
                  onChange: (e) =>
                    handleChange("cvc", e.target.value.replace(/\D/g, "").slice(0, 4)),
                })}
              </FieldGroup>
              <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                {t("pay.secure")}
              </p>
            </CardContent>
          </Card>

          <Field orientation="horizontal" data-invalid={!!errors.terms}>
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked === true);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              aria-invalid={!!errors.terms}
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="terms" className="font-normal block">
                <Trans
                  i18nKey="pay.terms"
                  components={{
                    terms: (
                      <Link
                        to="/terms-and-services"
                        target="_blank"
                        className="underline hover:text-primary"
                      />
                    ),
                    privacy: (
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        className="underline hover:text-primary"
                      />
                    ),
                  }}
                />
              </FieldLabel>
              <FieldError errors={fieldError("terms")} />
            </div>
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full cursor-pointer"
            disabled={loading}
          >
            {loading ? t("pay.processing") : t("pay.submit")}
          </Button>
        </form>

        {/* Order summary */}
        <Card className="order-first lg:order-last lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>{t("pay.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <PlanIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{planName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(plan.descriptionKey)}
                  </p>
                </div>
              </div>
              <Link
                to={`/prices/${type}`}
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                {t("pay.summary.changePlan")}
              </Link>
            </div>

            {/* Billing toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={annual ? "text-muted-foreground" : "font-semibold"}>
                {t("pay.summary.monthly")}
              </span>
              <Switch
                checked={annual}
                onCheckedChange={(checked) =>
                  updateParam("billing", checked ? "annual" : "monthly")
                }
                className="cursor-pointer"
                aria-label={t("pay.summary.annual")}
              />
              <span className={annual ? "font-semibold" : "text-muted-foreground"}>
                {t("pay.summary.annual")}
              </span>
              <Badge className="bg-emerald-400">
                {t("pay.summary.save", { percent: ANNUAL_DISCOUNT * 100 })}
              </Badge>
            </div>

            {/* Seats (doar Enterprise) */}
            {isEnterprise && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t("pay.summary.seats")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pay.summary.minSeats", { n: minSeats })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    disabled={seats <= minSeats}
                    onClick={() => updateParam("seats", String(seats - 1))}
                    aria-label="-1"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold tabular-nums">
                    {seats}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    disabled={seats >= MAX_SEATS}
                    onClick={() => updateParam("seats", String(seats + 1))}
                    aria-label="+1"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("pay.summary.unitPrice")}</dt>
                <dd className="tabular-nums">
                  {currency.format(unitPrice)}
                  {isEnterprise ? t("pay.summary.perSeat") : t("pay.summary.perMonth")}
                  {isEnterprise && ` × ${seats}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("pay.summary.subtotal")}</dt>
                <dd className="tabular-nums">{currency.format(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {isEnterprise
                    ? t("pay.summary.vat", { percent: VAT_RATE * 100 })
                    : t("pay.summary.vatIncluded")}
                </dt>
                {isEnterprise && (
                  <dd className="tabular-nums">{currency.format(vat)}</dd>
                )}
              </div>
            </dl>

            <Separator />

            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{t("pay.summary.total")}</span>
              <span className="text-right">
                <span className="text-2xl font-bold tabular-nums">
                  {currency.format(total)}
                </span>{" "}
                <span className="text-sm text-muted-foreground">
                  {annual
                    ? t("pay.summary.perYearPeriod")
                    : t("pay.summary.perMonthPeriod")}
                </span>
              </span>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
              <div className="flex justify-between font-semibold">
                <span>{t("pay.summary.dueToday")}</span>
                <span className="tabular-nums">{currency.format(0)}</span>
              </div>
              <p className="text-muted-foreground">
                {t("pay.summary.firstCharge", { date: formattedChargeDate })}
              </p>
              <p className="text-muted-foreground">
                {t("pay.summary.trialNote", { date: formattedChargeDate })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
