import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SitePreferences from "@/components/SitePreferences";
import { useTheme } from "@/hooks/useTheme";

type SubmenuKey = "prices";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function PublicMainNavigation() {
  const [openMenu, setOpenMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme()

  // Fundal + umbră doar după ce pagina a fost derulată
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [openSubMenu, setOpenSubMenu] = useState<Record<SubmenuKey, boolean>>({
    prices: false,
  });

  const { isAuth } = useAuth();
  const { t } = useTranslation();

  function handleMenuToggle() {
    setOpenMenu((prev) => !prev);
  }

  function handleSubMenuToggle(identifier: SubmenuKey) {
    setOpenSubMenu((prev) => ({
      ...prev,
      [identifier]: !prev[identifier],
    }));
  }

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 flex w-full justify-between md:justify-around p-4 text-xl border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || openMenu
          ? "border-border/60 bg-background/80 shadow-sm backdrop-blur-lg supports-backdrop-filter:bg-background/65"
          : "border-transparent bg-background",
      )}
    >
      <div className="h-20 w-36">
        <img src={theme === "dark" ? "/logo-no-bg-dark.png" : "/logo-no-bg.png"} />
      </div>

      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex sticky z-50">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link to="/">{t("nav.home")}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Doar de test */}
          {isAuth && (
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}

          <NavigationMenuItem className="relative">
            <NavigationMenuTrigger>{t("nav.prices")}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-96 p-4">
                <ListItem href="/prices/personal" title={t("nav.personalUse")}>
                  {t("nav.personalUseDescription")}
                </ListItem>
                <ListItem href="/prices/enterprise" title={t("nav.enterprise")}>
                  {t("nav.enterpriseDescription")}
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link to="/blog">{t("nav.blog")}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem className="relative">
            <NavigationMenuTrigger>{t("nav.info")}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-96 p-4">
                <ListItem
                  href="/terms-and-services"
                  title={t("nav.readTerms")}
                >
                  {t("nav.terms")}
                </ListItem>
                <ListItem
                  href="/privacy-policy"
                  title={t("nav.readPrivacy")}
                >
                  {t("nav.privacy")}
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-3">
        <SitePreferences />

        {/* Desktop Auth Buttons */}
        {isAuth ? (
          <ul className="hidden sm:flex gap-4 items-center">
            <Link to="/dashboard">
              <Button variant="ghost" className="cursor-pointer">
                {t("nav.dashboard")}
              </Button>
            </Link>
          </ul>
        ) : (
          <ul className="hidden sm:flex gap-4 items-center">
            <Link to="/signin">
              <Button variant="ghost" className="cursor-pointer">
                {t("nav.createAccount")}
              </Button>
            </Link>
            <Link to="/login">
              <Button className="cursor-pointer">{t("nav.login")}</Button>
            </Link>
          </ul>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden cursor-pointer"
          onClick={handleMenuToggle}
          aria-label={t("nav.toggleMenu")}
        >
          {openMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {openMenu && (
        <div className="absolute top-full left-0 w-full bg-background border-b shadow-lg md:hidden z-50">
          <div className="flex flex-col p-6 gap-4">
            <Link
              to="/"
              className="text-sm font-medium hover:text-primary transition-colors py-2 border-b"
              onClick={() => setOpenMenu(false)}
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors py-2 border-b"
              onClick={() => setOpenMenu(false)}
            >
              {t("nav.dashboard")}
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium hover:text-primary transition-colors py-2 border-b"
              onClick={() => setOpenMenu(false)}
            >
              {t("nav.about")}
            </Link>
            {/* Prices Section */}
            <div className="border-b pb-4">
              <p
                className="text-sm font-semibold mb-2 text-muted-foreground cursor-pointer"
                onClick={() => handleSubMenuToggle("prices")}
              >
                {t("nav.prices")}
              </p>
              {openSubMenu.prices && (
                <div className="flex flex-col gap-2 pl-4">
                  <Link
                    to="/prices/personal"
                    className="text-sm hover:text-primary transition-colors"
                    onClick={() => setOpenMenu(false)}
                  >
                    {t("nav.personalUse")}
                  </Link>
                  <Link
                    to="/prices/enterprise"
                    className="text-sm hover:text-primary transition-colors"
                    onClick={() => setOpenMenu(false)}
                  >
                    {t("nav.enterprise")}
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/blog"
              className="text-sm font-medium hover:text-primary transition-colors py-2 border-b"
              onClick={() => setOpenMenu(false)}
            >
              {t("nav.blog")}
            </Link>
            {/* Auth Buttons */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t sm:hidden">
              <Button asChild variant="outline" className="w-full">
                <Link to="/signin" onClick={() => setOpenMenu(false)}>
                  {t("nav.createAccount")}
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/login" onClick={() => setOpenMenu(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
