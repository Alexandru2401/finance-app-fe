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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { isValidPassword } from "@/lib/password";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { createUser } from "@/api/user";
import type { Language } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { setUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();

  const passwordInvalid = !isValidPassword(formData.password);
  const passwordMismatch = formData.password !== formData.confirmPassword;

  function handleChange(
    field: keyof typeof formData,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  }

  async function handleSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    // The errors show up after the first submit and update while typing
    setSubmitted(true);
    if (passwordInvalid || passwordMismatch) return;

    try {
      setLoading(true);

      const response = await createUser(
        formData.email,
        formData.password,
        i18n.language as Language,
      );

      if (!response.ok) {
        // e.g. "Email already exists"
        toast.error(response.data?.message || t("auth.signup.failed"));
        return;
      }

      setUser(response.data.user ?? null); // userul are username: null → onboarding

      navigate("/dashboard/user-info", { replace: true });
    } catch {
      toast.error(t("auth.signup.failed")); // aici doar erori de retea
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("auth.signup.title")}</CardTitle>
        <CardDescription>{t("auth.signup.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitForm}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e)}
                // className={errors.email ? "border-red-500" : ""}
              />
              <FieldDescription>{t("auth.signup.emailHint")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange("password", e)}
                aria-invalid={submitted && passwordInvalid}
                aria-describedby={
                  submitted && passwordInvalid ? "password-error" : undefined
                }
              />
              <FieldDescription>
                {t("auth.signup.passwordHint")}
              </FieldDescription>
              {submitted && passwordInvalid && (
                <FieldError id="password-error">
                  {t("auth.signup.passwordLength")}
                </FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t("auth.signup.confirmPassword")}
              </FieldLabel>
              <PasswordInput
                id="confirm-password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e)}
                aria-invalid={submitted && passwordMismatch}
                aria-describedby={
                  submitted && passwordMismatch
                    ? "confirm-password-error"
                    : undefined
                }
              />
              <FieldDescription>
                {t("auth.signup.confirmPasswordHint")}
              </FieldDescription>
              {submitted && passwordMismatch && (
                <FieldError id="confirm-password-error">
                  {t("auth.signup.passwordMismatch")}
                </FieldError>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">
                  {loading
                    ? t("auth.signup.submitting")
                    : t("auth.signup.submit")}
                </Button>
                <FieldDescription className="px-6 text-center">
                  {t("auth.signup.hasAccount")}{" "}
                  <a href="/login">{t("auth.signup.signIn")}</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
