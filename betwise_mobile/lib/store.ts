import { create } from "zustand";
import { apiClient, UserProfile, LoginPayload, SignupPayload } from "./api";
import { isNetworkError } from "./errors";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // null = not yet known; false = known and inactive; true = known and active.
  hasActiveSubscription: boolean | null;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateRiskAppetite: (tier: "low" | "medium" | "high") => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasActiveSubscription: null,

  hydrate: async () => {
    await apiClient.waitUntilReady();
    if (!apiClient.isAuthenticated()) {
      set({ user: null, isAuthenticated: false, hasActiveSubscription: null, isLoading: false });
      return;
    }
    try {
      const [profileRes, subRes] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getMySubscription(),
      ]);
      set({
        user: profileRes.data,
        isAuthenticated: true,
        hasActiveSubscription: subRes.data !== null,
        isLoading: false,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        // Offline at launch, not a bad/expired token — keep the session
        // (we still have a valid stored token) instead of logging out.
        // Screens will surface their own "you're offline" state as they
        // try to load, and a real 401 later will still log out via the
        // response interceptor.
        set({ isAuthenticated: true, isLoading: false });
        return;
      }
      await apiClient.clearTokens();
      set({ user: null, isAuthenticated: false, hasActiveSubscription: null, isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const [profileRes, subRes] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getMySubscription(),
      ]);
      set({ user: profileRes.data, isAuthenticated: true, hasActiveSubscription: subRes.data !== null });
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
    set({ user: res.data.profile, isAuthenticated: true, hasActiveSubscription: false });
  },

  logout: async () => {
    await apiClient.clearTokens();
    set({ user: null, isAuthenticated: false, hasActiveSubscription: null });
  },

  updateRiskAppetite: async (tier) => {
    const res = await apiClient.updateProfile({ default_risk_appetite: tier });
    set({ user: res.data });
  },
}));
