import type { User } from "@/context/AuthContext";
import type { Currency } from "@/lib/format";
import type { Language } from "@/i18n";
import { post, get, patch, del } from "./client";

interface AuthResponse {
  // Errors are { success: false, message }
  message: string;
  success: boolean;
  token?: string;
  user?: User;
}

async function loginUser(email: string, password: string) {
  const response = await post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return response;
}

async function createUser(email: string, password: string, language: Language) {
  const response = await post<AuthResponse>("/auth/register", {
    email,
    password,
    language,
  });
  return response;
}

async function getUserInfo() {
  const response = await get<AuthResponse>("/auth/user-info");
  return response;
}

async function checkUserAuthentication() {
  const response = await get<AuthResponse>("/auth/check-me");
  return response;
}

async function logoutUser() {
  const response = await post<AuthResponse>("/auth/logout", {});
  return response;
}

// Changing the currency converts all saved amounts on the backend (BNR rate);
// the response user only has user_id, username, currency, language and
// has_completed_onboarding. The backend keeps the value of every field that is
// not sent. completeOnboarding marks the onboarding as finished (needs
// username and currency in the same request)
async function addUserInfo(info: {
  username?: string;
  currency?: Currency;
  language?: Language;
  completeOnboarding?: true;
}) {
  const response = await patch<AuthResponse>("/auth/user-info", info);
  return response;
}

// 204 on success; the other sessions of the user are logged out.
// A wrong current password is a 400 with { message: "Current password is incorrect" }
async function updatePassword(currentPassword: string, newPassword: string) {
  const response = await patch<AuthResponse | null>("/auth/update-password", {
    currentPassword,
    newPassword,
  });
  return response;
}

// 204 on success. Deletes transactions, targets, recurring items, notifications
// and categories, then adds back the starter categories; the account stays.
// A wrong password is a 400 with { message: "Password is incorrect" }
async function resetUserData(password: string) {
  return del<AuthResponse | null>("/auth/data", { password });
}

// 204 on success: the account and all its data are deleted and the session
// cookies are cleared. A wrong password is a 400 { message: "Password is incorrect" }
async function deleteAccount(password: string) {
  return del<AuthResponse | null>("/auth/account", { password });
}

export {
  resetUserData,
  deleteAccount,
  updatePassword,
  loginUser,
  createUser,
  checkUserAuthentication,
  logoutUser,
  addUserInfo,
  getUserInfo,
};
