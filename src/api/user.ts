import type { User } from "@/context/AuthContext";
import type { Currency } from "@/lib/format";
import type { Language } from "@/i18n";
import { post, get, patch } from "./client";

interface AuthResponse {
  message: string;
  // PATCH /auth/user-info sends errors as { error }
  error?: string;
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
// the response user only has user_id, username, currency and language.
// The backend keeps the value of every field that is not sent
async function addUserInfo(info: {
  username?: string;
  currency?: Currency;
  language?: Language;
}) {
  const response = await patch<AuthResponse>("/auth/user-info", info);
  return response;
}

export {
  loginUser,
  createUser,
  checkUserAuthentication,
  logoutUser,
  addUserInfo,
  getUserInfo,
};
