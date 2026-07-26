import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
  "http://localhost:8000/api";

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  country: string;
  phone_number: string;
  date_of_birth: string;
  default_risk_appetite?: "low" | "medium" | "high";
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  country: string;
  date_of_birth: string | null;
  is_age_verified: boolean;
  default_risk_appetite: "low" | "medium" | "high";
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  billing_cycle: "monthly" | "seasonal";
  price_ugx: string;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: "active" | "past_due" | "cancelled" | "expired";
  starts_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  is_active: boolean;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo_url: string;
  current_form_score: number;
}

export interface Match {
  id: number;
  league: League;
  home_team: Team;
  away_team: Team;
  kickoff_at: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  home_score: number | null;
  away_score: number | null;
  result: "" | "home_win" | "away_win" | "draw";
}

export interface MatchDetail extends Match {
  head_to_head: {
    matches_considered: number;
    home_wins: number;
    away_wins: number;
    draws: number;
  } | null;
  home_team_news: Array<{ id: number; player_name: string; severity: string; note: string }>;
  away_team_news: Array<{ id: number; player_name: string; severity: string; note: string }>;
}

export interface Recommendation {
  id: number;
  match: Match;
  bet_type: string;
  risk_tier: "low" | "medium" | "high";
  confidence_score: number;
  suggested_odds_min: number;
  suggested_odds_max: number;
  reasoning_summary: string;
  outcome: "pending" | "hit" | "missed";
  generated_at: string;
}

export interface WeeklyTarget {
  id: number;
  week_number: number;
  week_starts_on: string;
  target_stake_ugx: string;
  target_odds_to_chase: number;
}

export interface SeasonPlan {
  id: number;
  starts_on: string;
  ends_on: string;
  total_budget_ugx: string;
  target_earnings_ugx: string;
  risk_appetite: "low" | "medium" | "high";
  is_active: boolean;
  weekly_targets: WeeklyTarget[];
}

export interface PaceSummary {
  weeks_elapsed: number;
  total_weeks: number;
  total_invested_ugx: string;
  total_earned_ugx: string;
  net_ugx: string;
  expected_net_by_now_ugx: string;
  pace_status: "ahead" | "on_track" | "behind";
  season_bets_won: number;
  season_bets_lost: number;
  season_bets_pending: number;
  season_avg_odds_achieved_on_wins: number | null;
  season_target_odds_to_chase: number;
  season_odds_gap: number | null;
  course_correction_message: string | null;
}

// Shared shape for week/day/month budget + odds breakdowns.
interface BudgetAndOddsSummary {
  target_stake_ugx: string;
  spent_ugx: string;
  earned_ugx: string;
  net_ugx: string;
  remaining_budget_ugx: string;
  target_odds_to_chase: number;
  bets_won: number;
  bets_lost: number;
  bets_pending: number;
  avg_odds_achieved_on_wins: number | null;
  odds_gap: number | null;
}

export interface DayBreakdown extends BudgetAndOddsSummary {
  date: string;
  qualifying_match_count: number;
}

export interface BetFrequencyAdvice {
  available_match_days: number;
  min_stake_per_bet_ugx: string;
  recommended_bet_count: number;
  recommended_stake_per_bet_ugx?: string;
  recommended_days: string[];
  message: string;
}

export interface WeekDetail extends BudgetAndOddsSummary {
  week_number: number;
  week_starts_on: string;
  daily_breakdown: DayBreakdown[];
  bet_frequency_advice: BetFrequencyAdvice;
}

export interface MonthSummary extends BudgetAndOddsSummary {
  month_number: number;
  starts_on: string;
  ends_on: string;
  week_numbers: number[];
}

export interface BetLog {
  id: number;
  recommendation: number | null;
  week: number | null;
  stake_ugx: string;
  odds_taken: number;
  followed_recommendation: boolean;
  result: "pending" | "won" | "lost";
  payout_ugx: string | null;
  logged_at: string;
}

export interface BettingPartner {
  id: number;
  name: string;
  highlight_note: string;
  website_url: string;
  rank_order: number;
}

export interface Tipster {
  id: number;
  name: string;
  platform: "twitter" | "instagram" | "telegram" | "tiktok" | "youtube" | "website";
  handle_or_website: string;
  highlight_note: string;
  rank_order: number;
}

const ACCESS_KEY = "betwise_access_token";
const REFRESH_KEY = "betwise_refresh_token";

// Tracks in-flight requests so a global loading indicator can activate on
// any interaction that triggers a network call, and deactivate once it settles.
type LoadingListener = (isLoading: boolean) => void;
const loadingListeners = new Set<LoadingListener>();
let activeRequestCount = 0;

function notifyLoading(delta: number) {
  activeRequestCount = Math.max(0, activeRequestCount + delta);
  const isLoading = activeRequestCount > 0;
  loadingListeners.forEach((listener) => listener(isLoading));
}

export function subscribeToLoading(listener: LoadingListener): () => void {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
}

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private ready: Promise<void>;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    this.ready = this.hydrate();

    this.client.interceptors.request.use(async (config) => {
      await this.ready;
      notifyLoading(1);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        notifyLoading(-1);
        return response;
      },
      async (error) => {
        notifyLoading(-1);
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            const res = await axios.post(API_BASE_URL + "/auth/token/refresh/", {
              refresh: this.refreshToken,
            });
            await this.setTokens(res.data.access, this.refreshToken);
            error.config.headers.Authorization = "Bearer " + res.data.access;
            return this.client(error.config);
          } catch {
            await this.clearTokens();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async hydrate() {
    const [access, refresh] = await Promise.all([
      AsyncStorage.getItem(ACCESS_KEY),
      AsyncStorage.getItem(REFRESH_KEY),
    ]);
    this.accessToken = access;
    this.refreshToken = refresh;
    if (access) this.setAuthHeader();
  }

  private setAuthHeader() {
    if (this.accessToken) {
      this.client.defaults.headers.common["Authorization"] = "Bearer " + this.accessToken;
    }
  }

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    await AsyncStorage.setItem(ACCESS_KEY, access);
    await AsyncStorage.setItem(REFRESH_KEY, refresh);
    this.setAuthHeader();
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
    delete this.client.defaults.headers.common["Authorization"];
  }

  async waitUntilReady() {
    await this.ready;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  signup(payload: SignupPayload) {
    return this.client.post<{ access: string; refresh: string; profile: UserProfile }>(
      "/auth/signup/",
      payload
    );
  }

  login(payload: LoginPayload) {
    return this.client.post<{ access: string; refresh: string }>("/auth/login/", payload);
  }

  getProfile() {
    return this.client.get<UserProfile>("/auth/me/");
  }

  getSubscriptionPlans() {
    return this.client.get<{ results: SubscriptionPlan[] } | SubscriptionPlan[]>("/auth/plans/");
  }

  getMySubscription() {
    return this.client.get<Subscription | null>("/auth/subscription/");
  }

  updateProfile(payload: Partial<{ default_risk_appetite: "low" | "medium" | "high" }>) {
    return this.client.patch<UserProfile>("/auth/me/", payload);
  }

  getUpcomingMatches() {
    return this.client.get<{ results: Match[] } | Match[]>("/matches/upcoming/");
  }

  getMatchDetail(id: number) {
    return this.client.get<MatchDetail>("/matches/" + id + "/");
  }

  getRecommendations(filters?: Record<string, string>) {
    return this.client.get<{ results: Recommendation[] } | Recommendation[]>("/recommendations/", {
      params: filters,
    });
  }

  getBettingPartners() {
    return this.client.get<{ results: BettingPartner[] } | BettingPartner[]>("/betting-partners/");
  }

  getTipsters() {
    return this.client.get<{ results: Tipster[] } | Tipster[]>("/tipsters/");
  }

  createSeasonPlan(payload: {
    starts_on: string;
    ends_on: string;
    total_budget_ugx: number;
    target_earnings_ugx: number;
    risk_appetite: "low" | "medium" | "high";
  }) {
    return this.client.post<SeasonPlan>("/season-plans/", payload);
  }

  getActiveSeasonPlan() {
    return this.client.get<SeasonPlan>("/season-plans/active/");
  }

  getPaceDashboard() {
    return this.client.get<PaceSummary>("/season-plans/active/pace/");
  }

  getWeekPlan(week: number | "current") {
    return this.client.get<WeekDetail>("/season-plans/active/weeks/" + week + "/");
  }

  getMonthlyBreakdown() {
    return this.client.get<{ months: MonthSummary[] }>("/season-plans/active/months/");
  }

  validatePromoCode(payload: { code: string; plan_id: number }) {
    return this.client.post("/promo-codes/validate/", payload);
  }

  checkout(payload: { plan_id: number; promo_code?: string }) {
    return this.client.post<{
      merchant_reference: string;
      payment_required: boolean;
      redirect_url: string | null;
    }>("/checkout/", payload);
  }

  logBet(payload: {
    recommendation?: number;
    stake_ugx: number;
    odds_taken: number;
    followed_recommendation?: boolean;
  }) {
    return this.client.post<BetLog>("/bet-logs/", payload);
  }

  getBetLogs() {
    return this.client.get<{ results: BetLog[] } | BetLog[]>("/bet-logs/");
  }

  reportBetResult(id: number, payload: { result: "won" | "lost"; payout_ugx?: number }) {
    return this.client.patch<BetLog>("/bet-logs/" + id + "/", payload);
  }
}

export const apiClient = new APIClient();

export function unwrapList<T>(data: { results: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}
