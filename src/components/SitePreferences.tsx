import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

// Limbă + temă, grupate într-o singură "pastilă"
export default function SitePreferences({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/7  shadow-sm",
        className,
      )}
    >
      <LanguageSwitcher />
      <span aria-hidden className="h-5 w-px bg-border" />
      <ThemeToggle />
    </div>
  );
}
