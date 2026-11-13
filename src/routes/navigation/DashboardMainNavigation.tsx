import { FEATURES } from "@/lib/features";
import { Link, useLocation } from "react-router";
import { Menu, PanelLeftOpen, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardNavigation } from "@/components/dashboard/routes/DashboardNavigation";
import SearchDialog from "@/components/dashboard/shared/SearchDialog";
import SidebarUserMenu from "@/components/dashboard/shared/SidebarUserMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);
const shortcutLabel = isMac ? "⌘ K" : "Ctrl K";

// Global search: the field, the mobile button and the Ctrl+K shortcut
const SEARCH_ENABLED = FEATURES.globalSearch;

export default function DashboardMainNavigation() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useTranslation();

  // Ctrl+K (Windows/Linux) or ⌘+K (Mac) opens the search from anywhere in the dashboard
  useEffect(() => {
    if (!SEARCH_ENABLED) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const renderNav = (showLabels: boolean, onNavigate?: () => void) => (
    <nav className="flex h-full flex-col text-sm bg-accent">
      {/* ===== LOGO ===== */}
      <div
        className={clsx(
          "flex items-center px-3 py-4",
          !showLabels && "justify-center px-0",
        )}
      >
        {/* Collapsed sidebar: only the mark, the full wordmark doesn't fit in 64px */}
        {showLabels ? (
          <img
            src="/logo.png"
            alt={t("dashboard.nav.logoAlt")}
            className="h-18 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <img
            src="/logo-mark.png"
            alt={t("dashboard.nav.logoAlt")}
            className="h-10 w-10 shrink-0 object-contain"
          />
        )}
      </div>

      {/* ===== SEARCH ===== */}
      {/* Looks like an input, but opens the search modal */}
      {SEARCH_ENABLED && (
        <div className={clsx("px-3 pb-4", !showLabels && "px-2")}>
          {showLabels ? (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                setSearchOpen(true);
              }}
              aria-label={t("dashboard.nav.search")}
              aria-haspopup="dialog"
              className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground outline-none transition-colors hover:border-finance-warning/60 focus-visible:border-finance-warning focus-visible:ring-2 focus-visible:ring-finance-warning/40"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate text-left">
                {t("dashboard.nav.search")}
              </span>
              <kbd className="text-[11px] font-medium">{shortcutLabel}</kbd>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t("dashboard.nav.search")}
                  aria-haspopup="dialog"
                  className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border bg-background transition-colors hover:bg-accent"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("dashboard.nav.search")}
                <kbd className="ml-2 opacity-70">{shortcutLabel}</kbd>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

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

                const link = (
                  <Link
                    to={to}
                    onClick={onNavigate}
                    aria-label={!showLabels ? label : undefined}
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
                );

                return (
                  <li key={to}>
                    {/* Collapsed sidebar: the route name shows in a tooltip on hover */}
                    {showLabels ? (
                      link
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {label}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ===== USER (jos de tot) ===== */}
      <div className={clsx("border-t p-3", !showLabels && "px-2")}>
        <SidebarUserMenu
          showLabels={showLabels}
          // Only the mobile drawer passes onNavigate
          mobile={Boolean(onNavigate)}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );

  return (
    <>
      {/* Bara de sus - doar pe mobile: hamburger, logo, search */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-3 text-card-foreground shadow-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("dashboard.nav.openMenu")}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-warning/60"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center">
          <img
            src="/logo-mark.png"
            alt={t("dashboard.nav.logoAlt")}
            className="h-8 w-8 object-contain"
          />
        </Link>

        {SEARCH_ENABLED && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t("dashboard.nav.search")}
            aria-haspopup="dialog"
            className="ml-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-warning/60"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </header>

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

      {SEARCH_ENABLED && (
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </>
  );
}
