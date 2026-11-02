import { Link, useLocation } from "react-router";
import { Menu, PanelLeftOpen, Search, X } from "lucide-react";
import { useState } from "react";
import { dashboardNavigation } from "@/components/dashboard/routes/DashboardNavigation";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

export default function DashboardMainNavigation() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const renderNav = (showLabels: boolean, onNavigate?: () => void) => (
    <nav className="flex h-full flex-col text-sm bg-accent">
      {/* ===== LOGO ===== */}
      <div
        className={clsx(
          "flex items-center px-3 py-4",
          !showLabels && "justify-center px-0",
        )}
      >
        <img
          src="/logo.png"
          alt={t("dashboard.nav.logoAlt")}
          className="h-18 shrink-0 rounded-lg object-cover"
        />
      </div>

      {/* ===== SEARCH ===== */}
      <div className={clsx("px-3 pb-4", !showLabels && "px-2")}>
        {showLabels ? (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={t("dashboard.nav.search")}
              aria-label={t("dashboard.nav.search")}
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-14 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-finance-warning focus-visible:ring-2 focus-visible:ring-finance-warning/40"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
              ⌘ +K
            </kbd>
          </div>
        ) : (
          <button
            type="button"
            aria-label={t("dashboard.nav.search")}
            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border bg-background transition-colors hover:bg-accent"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ===== SECTIUNI ===== */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6">
        {dashboardNavigation.map((section, index) => (
          <div key={index}>
            {showLabels && section.title && (
              <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
                {t(`dashboard.nav.sections.${section.title}`)}
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {section.items.map(({ label: labelKey, to, icon: Icon }) => {
                const label = t(`dashboard.nav.${labelKey}`);
                const isActive = location.pathname === to;

                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onNavigate}
                      title={!showLabels ? label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "group relative flex items-center gap-3 rounded-lg py-2.5 transition-colors",
                        showLabels ? "px-3" : "justify-center px-0",
                        isActive
                          ? "bg-card font-semibold text-finance-warning"
                          : "text-muted-foreground hover:bg-card hover:text-accent-foreground",
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={clsx(
                            "h-5 w-5 shrink-0 transition-colors",
                            isActive
                              ? "text-finance-warning"
                              : "text-muted-foreground group-hover:text-accent-foreground",
                          )}
                        />
                      )}

                      {showLabels && <span className="truncate">{label}</span>}

                      {/* Badge "New" — necesita camp optional `badge` in date
                      {showLabels && badge && (
                        <span className="ml-auto rounded-full bg-finance-warning px-2 py-0.5 text-[11px] font-semibold text-black">
                          {badge}
                        </span>
                      )}
                      */}

                      {/* Chevron pentru submeniu — necesita camp `children`
                      {showLabels && hasChildren && (
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      )}
                      */}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Buton hamburger - doar pe mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label={t("dashboard.nav.openMenu")}
        className="absolute top-6 left-6 z-30 md:hidden"
      >
        <Menu size={26} />
      </button>

      {/* Sidebar desktop */}
      <aside
        className={clsx(
          "relative hidden h-dvh border-r bg-background md:block",
          open ? "w-64" : "w-16",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="absolute cursor-pointer top-4 -right-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow hover:bg-accent transition-colors"
          aria-label={t("dashboard.nav.toggleSidebar")}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        {renderNav(open)}
      </aside>

      {/* Backdrop drawer - mobile */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer propriu-zis - mobile */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 h-dvh w-64 border-r bg-background transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label={t("dashboard.nav.closeMenu")}
          className={clsx(
            "absolute -right-4 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent transition-colors hover:bg-accent",
            !mobileOpen && "hidden",
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {renderNav(true, () => setMobileOpen(false))}
      </aside>
    </>
  );
}
