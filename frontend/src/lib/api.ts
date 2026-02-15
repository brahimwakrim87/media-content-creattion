const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("access_token");
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      logout();
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new Error(error.error || error.detail || error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; refresh_token: string }> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Login failed",
    }));
    throw new Error(error.error || error.detail || error.message || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ token: string; refresh_token: string }> {
  // Register the user
  const regResponse = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
    }),
  });

  if (!regResponse.ok) {
    const error = await regResponse.json().catch(() => ({
      detail: "Registration failed",
    }));
    throw new Error(error.error || error.detail || error.message || "Registration failed");
  }

  // Auto-login after successful registration
  return login(email, password);
}

export async function refreshToken(): Promise<boolean> {
  const token = localStorage.getItem("refresh_token");
  if (!token) return false;

  try {
    const response = await fetch(`${BASE_URL}/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem("access_token", data.token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
