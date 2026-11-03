import { Outlet } from "react-router";
import PublicMainNavigation from "../routes/navigation/PublicMainNavigation";
import PublicFooter from "@/components/public/Footer";
import ScrollToTopButton from "@/components/public/ScrollToTopButton";

export default function PublicRootLayout() {
  return (
    <>
      <PublicMainNavigation />

      <main className="relative max-w-7xl flex justify-center mx-auto flex-col">
        <Outlet />
      </main>

      <PublicFooter />

      <ScrollToTopButton />
    </>
  );
}
