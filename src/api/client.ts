// api/client.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Routes that must not trigger a refresh: no session yet, or the refresh itself
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

// Shared so that parallel requests failing at once wait for a single refresh
let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function request(path: string, options: RequestOptions) {
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const response = await request(path, options);

  // 401 = access token missing (cookie expired), 403 = token invalid/expired.
  // Get a new access token from the refresh cookie and retry once.
  if (
    (response.status === 401 || response.status === 403) &&
    !NO_REFRESH_PATHS.includes(path) &&
    (await refreshAccessToken())
  ) {
    return request(path, options);
  }
  return response;
}

async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await send(path, options);

  if (response.status === 204) {
    return { ok: true, status: 204, data: null as T };
  }

  let data: T;
  try {
    data = await response.json();
  } catch {
    data = null as T;
  }

  return { ok: response.ok, status: response.status, data };
}

// A file instead of JSON (e.g. a CSV export), with the same token refresh
export async function getFile(
  path: string,
): Promise<{ ok: boolean; status: number; blob: Blob | null }> {
  const response = await send(path, { method: "GET" });
  if (!response.ok) {
    return { ok: false, status: response.status, blob: null };
  }
  return { ok: true, status: response.status, blob: await response.blob() };
}

export const get = <T = unknown>(path: string) =>
  api<T>(path, { method: "GET" });

export const post = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });

export const put = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });

export const patch = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export const del = <T = unknown>(path: string) =>
  api<T>(path, { method: "DELETE" });
