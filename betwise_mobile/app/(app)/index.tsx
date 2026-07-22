import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react-native";
import { apiClient, SeasonPlan, PaceSummary } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { colors, fonts, radius } from "../../lib/colors";
import { fmtUGX } from "../../lib/formatting";
import LoadingSpinner from "../../components/LoadingSpinner";
import PaceLineChart from "../../components/PaceLineChart";

const PACE_META = {
  ahead: { label: "Ahead of pace", icon: ArrowUpRight, color: colors.riskLow },
  on_track: { label: "On track", icon: Minus, color: colors.ticker },
  behind: { label: "Behind pace", icon: ArrowDownRight, color: colors.riskHigh },
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [plan, setPlan] = useState<SeasonPlan | null>(null);
  const [pace, setPace] = useState<PaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNoPlan, setHasNoPlan] = useState(false);

  const load = useCallback(async () => {
    try {
      const [planRes, paceRes] = await Promise.all([
        apiClient.getActiveSeasonPlan(),
        apiClient.getPaceDashboard(),
      ]);
      setPlan(planRes.data);
      setPace(paceRes.data);
      setHasNoPlan(false);
    } catch (err: any) {
      if (err?.response?.status === 404) setHasNoPlan(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <LoadingSpinner label="Loading your season" />;

  if (hasNoPlan || !plan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.eyebrow}>NO ACTIVE SEASON</Text>
        <Text style={styles.emptyTitle}>Set up your season to get started</Text>
        <Text style={styles.emptySubtitle}>
          Tell us your budget and target, and we'll build weekly stakes and start scoring matches
          for you.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/onboarding")}>
          <Text style={styles.primaryButtonText}>Plan my season</Text>
        </Pressable>
      </View>
    );
  }

  const meta = pace ? PACE_META[pace.pace_status] : PACE_META.on_track;
  const PaceIcon = meta.icon;

  const chartData = (plan.weekly_targets || []).map((wt) => ({
    week: "W" + wt.week_number,
    invested: parseFloat(wt.actual_invested_ugx || "0"),
    earned: parseFloat(wt.actual_earned_ugx || "0"),
  }));

  const currentWeek = plan.weekly_targets?.find((wt) => {
    const start = new Date(wt.week_starts_on);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const now = new Date();
    return now >= start && now < end;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ticker} />}
    >
      <Text style={styles.eyebrow}>
        WELCOME BACK{user ? `, ${user.username.toUpperCase()}` : ""}
      </Text>
      <Text style={styles.title}>Season overview</Text>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>INVESTED</Text>
          <Text style={styles.kpiValue}>{pace ? fmtUGX(pace.total_invested_ugx) : "—"}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>EARNED</Text>
          <Text style={styles.kpiValue}>{pace ? fmtUGX(pace.total_earned_ugx) : "—"}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>NET</Text>
          <Text style={styles.kpiValue}>{pace ? fmtUGX(pace.net_ugx) : "—"}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>PACE</Text>
          <View style={styles.paceRow}>
            <PaceIcon size={16} color={meta.color} />
            <Text style={[styles.paceText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>

      {chartData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>WEEKLY INVESTED VS EARNED</Text>
          <View style={{ marginTop: 12 }}>
            <PaceLineChart data={chartData} />
          </View>
        </View>
      )}

      {pace?.course_correction_message && (
        <View style={styles.noticeCard}>
          <TrendingUp size={18} color={colors.ticker} />
          <Text style={styles.noticeText}>{pace.course_correction_message}</Text>
        </View>
      )}

      {currentWeek && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>THIS WEEK'S TARGET — WEEK {currentWeek.week_number}</Text>
          <View style={styles.weekRow}>
            <View>
              <Text style={styles.weekLabel}>Stake</Text>
              <Text style={styles.weekValue}>{fmtUGX(currentWeek.target_stake_ugx)}</Text>
            </View>
            <View>
              <Text style={styles.weekLabel}>Odds to chase</Text>
              <Text style={styles.weekValue}>{currentWeek.target_odds_to_chase.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/recommendations")}
      >
        <Text style={styles.primaryButtonText}>View this week's recommendations</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.inkPaper,
    marginTop: 6,
    marginBottom: 24,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: "47%",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
  },
  kpiLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  kpiValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.inkPaper,
    marginTop: 8,
  },
  paceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  paceText: {
    fontFamily: fonts.display,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 20,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.ticker + "0D",
    borderWidth: 1,
    borderColor: colors.ticker + "40",
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkPaper,
    lineHeight: 19,
  },
  weekRow: {
    flexDirection: "row",
    gap: 32,
    marginTop: 12,
  },
  weekLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
  },
  weekValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.inkPaper,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    color: colors.bg,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.inkPaper,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
});
