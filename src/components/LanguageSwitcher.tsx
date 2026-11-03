import { Check, ChevronDown, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { useChangeLanguage } from "@/hooks/useChangeLanguage";

export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;
  // Also saves the language on the account when logged in
  const changeLanguage = useChangeLanguage();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={t("language.label")}
          className={cn(
            "group h-9 cursor-pointer gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-amber-400/15 hover:text-foreground data-[state=open]:bg-amber-400/15 data-[state=open]:text-foreground",
            className,
          )}
        >
          <Languages className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {current}
          </span>
          <ChevronDown className="size-3.5 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-52 rounded-xl p-1.5 shadow-xl"
      >
        <DropdownMenuLabel className="pb-1 text-[11px] font-medium uppercase text-muted-foreground">
          {t("language.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-1" />

        {SUPPORTED_LANGUAGES.map((lng) => {
          const active = current === lng;

          return (
            <DropdownMenuItem
              key={lng}
              onSelect={() => changeLanguage(lng)}
              className={cn(
                "cursor-pointer gap-2 rounded-lg px-1 py-1",
                active && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-sm text-[11px] font-bold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-amber-400 text-black shadow-sm"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {lng}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium">
                  {t(`language.${lng}`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`language.${lng}Hint`)}
                </span>
              </span>
              {active && <Check className="ml-auto size-4 text-amber-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
