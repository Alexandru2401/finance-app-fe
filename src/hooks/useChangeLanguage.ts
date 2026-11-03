import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { addUserInfo } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import type { Language } from "@/i18n";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/format";

/**
 * Switches the app language right away and, when logged in, saves it on the
 * account (PATCH /auth/user-info) so it is kept on other devices.
 */
export function useChangeLanguage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();

  return async function changeLanguage(language: Language) {
    if (language === i18n.resolvedLanguage) return;
    await i18n.changeLanguage(language);
    if (!user) return;

    try {
      // The route also requires username and currency, so the current ones are
      // sent; the same currency means no amounts are converted
      const res = await addUserInfo(
        user.username || user.email.split("@")[0],
        isCurrency(user.currency) ? user.currency : DEFAULT_CURRENCY,
        language,
      );
      if (!res.ok || !res.data?.user) throw new Error();
      // Keeps AuthProvider from switching back to the old saved language
      setUser({ ...user, ...res.data.user });
    } catch {
      // The language stays switched locally, it is just not saved on the account
      toast.error(t("language.saveError"));
    }
  };
}
