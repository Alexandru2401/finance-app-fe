import CategoriesSettings from "@/components/dashboard/settings/CategoriesSettings";
import PreferencesSettings from "@/components/dashboard/settings/PreferencesSettings";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, Tags } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const TABS = ["preferences", "categories"] as const;
type SettingsTab = (typeof TABS)[number];

export default function SettingsPage() {
  const { t } = useTranslation();
  // The tab lives in the URL (?tab=categories), so other pages can link to it
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: SettingsTab = TABS.includes(tabParam as SettingsTab)
    ? (tabParam as SettingsTab)
    : "preferences";

  return (
    <section className="mx-auto max-w-4xl px-4 py-4">
      <PageHeader
        title={t("dashboard.settings.title")}
        subtitle={t("dashboard.settings.subtitle")}
      />

      <Tabs
        value={tab}
        onValueChange={(value) =>
          setSearchParams({ tab: value }, { replace: true })
        }
      >
        <TabsList className="mb-4">
          <TabsTrigger value="preferences" className="cursor-pointer gap-1.5">
            <SlidersHorizontal size={14} />
            {t("dashboard.settings.tabs.preferences")}
          </TabsTrigger>
          <TabsTrigger value="categories" className="cursor-pointer gap-1.5">
            <Tags size={14} />
            {t("dashboard.settings.tabs.categories")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesSettings />
        </TabsContent>
      </Tabs>
    </section>
  );
}
