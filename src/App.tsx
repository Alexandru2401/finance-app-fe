import { createBrowserRouter, RouterProvider } from "react-router";
import { lazy } from "react";
import Login from "./pages/auth/Login";
import ProtectedPage from "./pages/auth/ProtectedPage";
import SignIn from "./pages/auth/Signin";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
const BudgetPage = lazy(() => import("./pages/dashboard/BudgetPage"));
import DashboardHomePage from "./pages/dashboard/DashboardHomePage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import TransactionsPage from "./pages/dashboard/TransactionsPage";
import UpgradePlansPage from "./pages/dashboard/UpgradePlansPage";
import PublicAboutPage from "./pages/public/home/HomeOurMission";
import PublicHomePage from "./pages/public/PublicHomePage";
import PublicPricesPersonalPage from "./pages/public/PublicPricesPersonalPage";
import PublicPricesEnterprisePage from "./pages/public/PublicPricesEnterprisePage";
import BlogPage from "./pages/public/blog/BlogPage";
import PayPage from "./pages/public/paypage/PayPage";
import PrivacyPolicy from "./pages/public/terms-and-policy/PrivacyPolicy";
import TermsAndConditions from "./pages/public/terms-and-policy/TermsAndConditions";
import ErrorPage from "./routes/Error";
import DashboardRootLayout from "./layout/DashboardRootLayout";
import PublicRootLayout from "./layout/PublicRootLayout";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthProvider";
import ErrorBoundary from "./components/dashboard/shared/ErrorBoundary";
import UserInfoForm from "./components/public/auth/userInfoForm";

const dashboardRoutes = [
  { index: true, element: <DashboardHomePage /> },
  { path: "user-info", element: <UserInfoForm /> },
  { path: "budget", element: <BudgetPage /> },
  { path: "transactions", element: <TransactionsPage /> },
  { path: "profile", element: <ProfilePage /> },
  { path: "analytics", element: <AnalyticsPage /> },
  { path: "upgrade-plans", element: <UpgradePlansPage /> },
  { path: "settings", element: <SettingsPage /> },
];

const publicRoutes = [
  { index: true, element: <PublicHomePage /> },
  { path: "about", element: <PublicAboutPage /> },
  { path: "prices/personal", element: <PublicPricesPersonalPage /> },
  { path: "prices/enterprise", element: <PublicPricesEnterprisePage /> },
  { path: "blog", element: <BlogPage /> },
  { path: "paypage/:type", element: <PayPage /> },
  { path: "terms-and-services", element: <TermsAndConditions /> },
  { path: "privacy-policy", element: <PrivacyPolicy /> },
  { path: "signin", element: <SignIn /> },
  { path: "login", element: <Login /> },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicRootLayout />,
    errorElement: <ErrorPage />,
    children: publicRoutes,
  },
  {
    path: "/dashboard",
    element: <ProtectedPage />,
    errorElement: <ErrorPage />,
    children: [
      { path: "user-info", element: <UserInfoForm /> },
      {
        element: (
          <ErrorBoundary>
            <DashboardRootLayout />
          </ErrorBoundary>
        ),
        children: dashboardRoutes,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
