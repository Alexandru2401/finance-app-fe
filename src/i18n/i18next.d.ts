import "i18next";
import type ro from "./locales/ro.json";

// Chei tipate: t("nav.home") are autocomplete, iar cheile greșite dau eroare TS
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof ro };
  }
}
