import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { dark, setTheme } = useTheme();
  const next = dark ? "light" : "dark";
  const label = dark ? t("theme.switchToLight") : t("theme.switchToDark");

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!document.startViewTransition || reduceMotion) {
      setTheme(next);
      return;
    }

    // Tema nouă se extinde în cerc pornind de la buton
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 550,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={cn(
        "relative size-9 cursor-pointer rounded-full text-muted-foreground hover:bg-amber-400/15 hover:text-foreground",
        className,
      )}
    >
      <Sun className="size-[1.15rem] rotate-0 scale-100 text-amber-500 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-[1.15rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 dark:text-amber-300" />
    </Button>
  );
}
