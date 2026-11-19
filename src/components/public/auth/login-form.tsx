import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useRef, useState } from "react";
import LoginSchema, { type LoginErrorKey } from "@/schemas/login.schema";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { loginUser } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import { Turnstile, type TurnstileHandle } from "./Turnstile";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { setUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<{
    email?: LoginErrorKey;
    password?: LoginErrorKey;
  }>({});

  const [isSubmiting, setIsSubmiting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  function handleChange(
    identifier: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    setFormData((prevVal) => ({
      ...prevVal,
      [identifier]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [identifier]: undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmiting) return;

    const result = LoginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0] as LoginErrorKey | undefined,
        password: fieldErrors.password?.[0] as LoginErrorKey | undefined,
      });
      return;
    }

    setErrors({});

    if (!captchaToken) {
      toast.error(t("auth.captcha.required"));
      return;
    }

    setIsSubmiting(true);

    try {
      const response = await loginUser(
        formData.email,
        formData.password,
        captchaToken,
      );

      if (!response.ok) {
        // the captcha token is spent, get a new one for the next try
        toast.error(response.data.message || t("auth.login.failed"));
        turnstileRef.current?.reset();
        return;
      }

      setUser(response.data.user ?? null);
      toast.success(response.data.message || t("auth.login.success"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("auth.errors.unknown");
      toast.error(t("auth.errors.generic", { message: errorMessage }));
      turnstileRef.current?.reset();
    } finally {
      setIsSubmiting(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.login.title")}</CardTitle>
          <CardDescription>{t("auth.login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Email Field */}
              <Field className="max-h-16">
                <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 min-h-5">
                    {t(`auth.errors.${errors.email}`)}
                  </p>
                )}
              </Field>

              {/* Password Field */}
              <Field className="mt-2 max-h-16">
                <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 min-h-5">
                    {t(`auth.errors.${errors.password}`)}
                  </p>
                )}
              </Field>

              <Field className="mt-3">
                <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="cursor-pointer w-full"
                  disabled={isSubmiting || !captchaToken}
                >
                  {isSubmiting
                    ? t("auth.login.submitting")
                    : t("auth.login.submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("auth.login.noAccount")}{" "}
                  <a href="/signin" className="underline">
                    {t("auth.login.startFree")}
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
