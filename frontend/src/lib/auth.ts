import { create } from "zustand";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await apiLogin(email, password);
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          const user: User = {
            id: (payload.sub as string) || (payload.id as string) || "",
            email: (payload.username as string) || (payload.email as string) || email,
            firstName: "",
            lastName: "",
            roles: (payload.roles as string[]) || [],
          };
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    set({ isLoading: true });
    try {
      await apiRegister(email, password, firstName, lastName);
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          const user: User = {
            id: (payload.sub as string) || (payload.id as string) || "",
            email: (payload.username as string) || (payload.email as string) || email,
            firstName: firstName,
            lastName: lastName,
            roles: (payload.roles as string[]) || [],
          };
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiLogout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Check token expiration
    const exp = payload.exp as number | undefined;
    if (exp && exp * 1000 < Date.now()) {
      apiLogout();
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const user: User = {
      id: (payload.sub as string) || (payload.id as string) || "",
      email: (payload.username as string) || (payload.email as string) || "",
      firstName: "",
      lastName: "",
      roles: (payload.roles as string[]) || [],
    };
    set({ user, isAuthenticated: true, isLoading: false });
  },
}));
