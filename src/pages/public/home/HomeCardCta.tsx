import { BarChart3, FileText, Lock, PieChart, RefreshCw, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
    { icon: PieChart, key: "budgeting" },
    { icon: FileText, key: "expenses" },
    { icon: Target, key: "goals" },
    { icon: BarChart3, key: "analytics" },
    { icon: Lock, key: "security" },
    { icon: RefreshCw, key: "sync" },
] as const

export default function HomeCardCta() {
    const { t } = useTranslation();

    return <section className="w-full bg-background px-3 sm:px-6 py-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 max-w-2xl">
                <p className="mb-2 text-xs font-semibold uppercase text-amber-400">
                    {t("home.featureCards.eyebrow")}
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {t("home.featureCards.title")}
                </h2>
                <p className="mt-4 text-muted-foreground">
                    {t("home.featureCards.subtitle")}
                </p>
            </div>

            <div className="grid gap-x-8 gap-y-10 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, key }) => (
                    <div key={key}>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
                            <Icon size={20} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{t(`home.featureCards.items.${key}.title`)}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{t(`home.featureCards.items.${key}.desc`)}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
}
