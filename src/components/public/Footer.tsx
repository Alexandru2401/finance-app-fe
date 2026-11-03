import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-black text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">FinanceApp</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Public routes */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              {t("footer.product")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link to="/#about" className="hover:text-white transition">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link to="/signin" className="hover:text-white transition">
                  {t("footer.startFree")}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  {t("footer.login")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              {t("footer.social")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 hover:text-white transition">
                <Facebook className="h-4 w-4" /> Meta
              </li>
              <li className="flex items-center gap-2 hover:text-white transition">
                <Instagram className="h-4 w-4" /> Instagram
              </li>
              <li className="flex items-center gap-2 hover:text-white transition">
                <Youtube className="h-4 w-4" /> TikTok
              </li>
              <li className="flex items-center gap-2 hover:text-white transition">
                <Twitter className="h-4 w-4" /> X
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>{t("footer.email", { email: "contact@financeapp.com" })}</li>
              <li>{t("footer.phone", { phone: "+1 (555) 123-4567" })}</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-slate-800" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-white transition">
              {t("footer.privacy")}
            </Link>
            <Link
              to="/terms-and-services"
              className="hover:text-white transition"
            >
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
