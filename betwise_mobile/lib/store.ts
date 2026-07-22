import { create } from "zustand";
import { apiClient, UserProfile, LoginPayload, SignupPayload } from "./api";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    await apiClient.waitUntilReady();
    if (!apiClient.isAuthenticated()) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await apiClient.getProfile();
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      await apiClient.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const res = await apiClient.getProfile();
      set({ user: res.data, isAuthenticated: true });
    } catch {
      // leave state as-is; interceptor handles token refresh/logout
    }
  },

  login: async (payload) => {
    const res = await apiClient.login(payload);
    await apiClient.setTokens(res.data.access, res.data.refresh);
    await get().refreshProfile();
    set({ isAuthenticated: true });
  },

  signup: async (payload) => {
    const res = await apiClient.signup(payload);
    await apiClient.setTokens(res.data.access, res.data.refresh);
    set({ user: res.data.profile, isAuthenticated: true });
  },

  logout: async () => {
    await apiClient.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
