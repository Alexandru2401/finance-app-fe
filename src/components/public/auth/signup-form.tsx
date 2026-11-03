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
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { createUser } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { setUser } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

    try {
      setLoading(true);

      const response = await createUser(formData.email, formData.password);

      if (!response.ok) {
        toast.error(response.data.message || t("auth.signup.failed"));
        return;
      }

      setUser(response.data.user ?? null); // userul are username: null → onboarding

      navigate("/dashboard/user-info");
    } catch (err) {
      console.log(err);
      toast.error(t("auth.signup.failed")); // aici doar erori de retea
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("auth.signup.title")}</CardTitle>
        <CardDescription>
          {t("auth.signup.description")}
        </CardDescription>
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
              <FieldDescription>
                {t("auth.signup.emailHint")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => handleChange("password", e)}
              />
              <FieldDescription>
                {t("auth.signup.passwordHint")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t("auth.signup.confirmPassword")}
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e)}
              />
              <FieldDescription>
                {t("auth.signup.confirmPasswordHint")}
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">
                  {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
                </Button>
                <Button variant="outline" type="button">
                  {t("auth.signup.google")}
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
