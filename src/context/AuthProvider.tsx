import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getUserInfo } from "@/api/user";
import { AuthContext, type AuthValue, type User } from "@/context/AuthContext";
import { SUPPORTED_LANGUAGES, type Language } from "@/i18n";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  // The language saved on the account wins over the one saved in the browser
  const savedLanguage = user?.language;
  useEffect(() => {
    if (SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [savedLanguage, i18n]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // /auth/check-me does not return the currency, /auth/user-info does
        const res = await getUserInfo();
        if (active) setUser(res.data.user ?? null);
      } catch {
        if (active) setUser(null); // 401 / neautentificat
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value: AuthValue = {
    user,
    setUser,
    isAuth: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
