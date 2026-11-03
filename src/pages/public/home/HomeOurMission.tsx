import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function OurMission() {
  const { t } = useTranslation();

  return (
    <section
      className="bg-background px-3 sm:px-6 scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-6 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            {t("home.mission.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("home.mission.subtitle")}
          </p>
        </div>

        {/* Two columns: intro + image */}
        <div className="mb-6 grid items-center gap-5 lg:gap-10 lg:grid-cols-2">
          {/* Left — intro */}


          {/* Right — image */}
          <div className="rounded-2xl border border-border p-2 shadow-xl">
            <img src="/cta2.png" alt={t("home.mission.imageAlt")} className="w-full rounded-xl object-cover" />
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p className="text-2xl font-semibold text-foreground">
              {t("home.mission.whyUs")}
            </p>
            <p>
              {t("home.mission.whyUsP1")}
            </p>
            <p>
              {t("home.mission.whyUsP2")}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{t("home.mission.personal.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <p className="text-muted-foreground">
                {t("home.mission.personal.desc")}
              </p>
              <Button asChild className="w-fit bg-amber-500 text-black hover:bg-finance-warning/90">
                <Link to="/signup">{t("home.mission.personal.cta")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-finance-warning/30 transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{t("home.mission.business.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <p className="text-muted-foreground">
                {t("home.mission.business.desc")}
              </p>
              <Button asChild variant="outline" className="w-fit">
                <Link to="/enterprise">{t("home.mission.business.cta")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}