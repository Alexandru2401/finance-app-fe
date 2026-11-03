import { Check, Zap, Users, Rocket, Building2, Landmark } from "lucide-react";

// Textele sunt în i18n: "prices.plans.<id>" și "prices.features.<cheie>"
// Prețurile sunt pe monedă: RON pentru română, USD pentru engleză
export type PlanCurrency = "RON" | "USD";

const PersonalPlans = [
  {
    id: "free",
    price: { RON: 0, USD: 0 },
    icon: Check,
    popular: false,
    features: [
      "basicBudget",
      "categorization",
      "monthlyReports",
      "threeBankAccounts",
      "mobileApp",
      "emailSupport",
    ],
  },
  {
    id: "pro",
    price: { RON: 44.99, USD: 9.99 },
    icon: Zap,
    popular: true,
    includes: "free",
    features: [
      "advancedAnalytics",
      "unlimitedBankAccounts",
      "goalTracking",
      "billReminders",
      "customCategories",
      "exportData",
      "priorityEmailSupport",
      "adFree",
    ],
  },
  {
    id: "family",
    price: { RON: 89.99, USD: 19.99 },
    icon: Users,
    popular: false,
    includes: "pro",
    features: [
      "familySharing",
      "sharedBudgets",
      "sharedGoals",
      "privateSpaces",
      "kidsAllowance",
      "familyActivity",
      "multiCurrency",
      "netWorth",
      "support247",
    ],
  },
] as const;

// Textele sunt în i18n: "pricesEnterprise.plans.<id>" și "pricesEnterprise.features.<cheie>"
// Prețul este per utilizator / lună; null = preț personalizat (contact vânzări)
export const ANNUAL_DISCOUNT = 0.2;

export const EnterprisePlans = [
  {
    id: "team",
    pricePerSeat: { RON: 49.99, USD: 11.99 },
    minSeats: 3,
    icon: Rocket,
    popular: false,
    features: [
      "sharedWorkspace",
      "expenseApprovals",
      "receiptScanning",
      "departmentBudgets",
      "teamReports",
      "accountingExport",
      "emailSupport",
    ],
  },
  {
    id: "business",
    pricePerSeat: { RON: 99.99, USD: 22.99 },
    minSeats: 10,
    icon: Building2,
    popular: true,
    includes: "team",
    features: [
      "multiEntity",
      "cashflowForecast",
      "customRoles",
      "approvalWorkflows",
      "erpIntegrations",
      "auditLog",
      "apiAccess",
      "prioritySupport",
    ],
  },
  {
    id: "enterprise",
    pricePerSeat: null,
    minSeats: 50,
    icon: Landmark,
    popular: false,
    includes: "business",
    features: [
      "sso",
      "dedicatedManager",
      "sla",
      "dataResidency",
      "customIntegrations",
      "onboarding",
      "securityReview",
      "support247",
    ],
  },
] as const;

export default PersonalPlans;
