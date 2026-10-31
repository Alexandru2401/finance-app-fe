import type { User } from "@/context/AuthContext";
import type { Currency } from "@/lib/format";
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

  console.log("Response:", response);
  console.log("Data:", response.data);
  return response;
}

async function createUser(email: string, password: string) {
  const response = await post<AuthResponse>("/auth/register", {
    email,
    password,
  });
  console.log("test")
  console.log("Response:", response);
  console.log("Data:", response.data);
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
// the response user only has user_id, username and currency
async function addUserInfo(username: string, currency: Currency) {
  const response = await patch<AuthResponse>("/auth/user-info", {
    username,
    currency,
  });
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
