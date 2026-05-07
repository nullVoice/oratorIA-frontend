/**
 * Auth state — Zustand store.
 *
 * - `token` is persisted in localStorage under
 *   `AUTH_TOKEN_STORAGE_KEY`. The ky client reads the same key in its
 *   beforeRequest hook, so any HTTP call automatically inherits the
 *   authenticated identity.
 * - `user` is NOT persisted: on reload we re-fetch from `/users/me` so
 *   the UI reflects the latest server state and stale fields don't
 *   leak through page navigations.
 * - Actions throw on network/API failures; UI components catch and
 *   surface the message via `toast`.
 */
import { create } from "zustand";

import { AUTH_TOKEN_STORAGE_KEY, api } from "@/lib/api/client";
import {
  RegisterPayloadSchema,
  TokenSchema,
  UserSchema,
  type RegisterPayload,
  type User,
  type UserUpdatePayload,
} from "@/lib/api/schemas";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: () => void;
  fetchMe: () => Promise<User | null>;
  updateMe: (patch: UserUpdatePayload) => Promise<User>;
}

function readInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    /* localStorage may be blocked (private mode, quota) — ignore */
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: readInitialToken(),
  isLoading: false,

  async login(email, password) {
    set({ isLoading: true });
    try {
      const body = new URLSearchParams({ username: email, password });
      const tokenJson = await api
        .post("api/v1/auth/login", { body })
        .json();
      const token = TokenSchema.parse(tokenJson).access_token;
      persistToken(token);
      set({ token });

      const userJson = await api.get("api/v1/users/me").json();
      const user = UserSchema.parse(userJson);
      set({ user });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  async register(data) {
    set({ isLoading: true });
    try {
      const payload = RegisterPayloadSchema.parse(data);
      const userJson = await api
        .post("api/v1/auth/register", { json: payload })
        .json();
      const user = UserSchema.parse(userJson);
      // Auto-login right after register so the new user lands in the app
      // without an extra prompt.
      await get().login(data.email, data.password);
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout() {
    persistToken(null);
    set({ user: null, token: null });
  },

  async fetchMe() {
    if (!get().token) return null;
    set({ isLoading: true });
    try {
      const userJson = await api.get("api/v1/users/me").json();
      const user = UserSchema.parse(userJson);
      set({ user });
      return user;
    } catch (err) {
      // If the token is no longer valid the ky 401 hook clears it and
      // redirects; keep the store consistent with that.
      if (!get().token) set({ user: null });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  async updateMe(patch) {
    set({ isLoading: true });
    try {
      const userJson = await api
        .patch("api/v1/users/me", { json: patch })
        .json();
      const user = UserSchema.parse(userJson);
      set({ user });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },
}));
