import { useTranslation } from "react-i18next";
import { enUS, ro } from "date-fns/locale";

/** date-fns locale of the app language, for format() and the Calendar. */
export function useDateLocale() {
  const { i18n } = useTranslation();
  return i18n.language === "ro" ? ro : enUS;
}
