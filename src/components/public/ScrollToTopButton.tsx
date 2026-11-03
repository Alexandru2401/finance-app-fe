import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

// Butonul apare după ce utilizatorul a derulat mai mult de SHOW_AFTER px
const SHOW_AFTER = 400;

export default function ScrollToTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Button
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("footer.backToTop")}
      title={t("footer.backToTop")}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="size-5" />
    </Button>
  );
}
