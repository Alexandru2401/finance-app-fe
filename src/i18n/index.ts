import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ro from "./locales/ro.json";

export const SUPPORTED_LANGUAGES = ["ro", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE: Language = "ro";

function isSupported(lng: string | null): lng is Language {
  return SUPPORTED_LANGUAGES.includes(lng as Language);
}

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // localStorage indisponibil (ex. private mode)
  }
  const browser = navigator.language.slice(0, 2);
  return isSupported(browser) ? browser : DEFAULT_LANGUAGE;
}

export const resources = {
  ro: { translation: ro },
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false }, // React face deja escape
});

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignorăm
  }
});

export default i18n;
