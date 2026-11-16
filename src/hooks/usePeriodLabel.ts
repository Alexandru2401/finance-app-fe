import { useTranslation } from "react-i18next";
import {
  isCustomPeriod,
  monthYear,
  type AnalyticsPreset,
} from "@/lib/analytics";

/** The label of a period: the preset name or "nov. 2025 – mar. 2026". */
export function usePeriodLabel() {
  const { t, i18n } = useTranslation();
  return (period: string) => {
    if (!isCustomPeriod(period))
      return t(`dashboard.periods.${period as AnalyticsPreset}`);
    const [from, to] = period.split(":");
    return from === to
      ? monthYear(from, i18n.language)
      : `${monthYear(from, i18n.language)} – ${monthYear(to, i18n.language)}`;
  };
}
