import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { CalendarDays, TrendingUp } from "lucide-react-native";
import { apiClient, WeekDetail, MonthSummary } from "../../lib/api";
import { colors, fonts, radius } from "../../lib/colors";
import { fmtUGX, fmtDateOnly } from "../../lib/formatting";
import LoadingSpinner from "../../components/LoadingSpinner";

function OddsGap({ gap }: { gap: number | null }) {
  if (gap === null) return <Text style={{ color: colors.inkFaint, fontFamily: fonts.body, fontSize: 12 }}>no wins yet</Text>;
  if (gap <= 0) return <Text style={{ color: colors.riskLow, fontFamily: fonts.body, fontSize: 12 }}>on target</Text>;
  return (
    <Text style={{ color: colors.riskHigh, fontFamily: fonts.body, fontSize: 12 }}>
      behind by {gap.toFixed(2)}
    </Text>
  );
}

export default function ThisWeek() {
  const [week, setWeek] = useState<WeekDetail | null>(null);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNoPlan, setHasNoPlan] = useState(false);

  const load = useCallback(async () => {
    try {
      const [weekRes, monthsRes] = await Promise.all([
        apiClient.getWeekPlan("current"),
        apiClient.getMonthlyBreakdown(),
      ]);
      setWeek(weekRes.data);
      setMonths(monthsRes.data.months);
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

  if (loading) return <LoadingSpinner label="Loading this week's plan" />;

  if (hasNoPlan || !week) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.eyebrow}>NO ACTIVE SEASON</Text>
        <Text style={styles.emptyTitle}>Set up your season to get started</Text>
      </View>
    );
  }

  const advice = week.bet_frequency_advice;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ticker} />}
    >
      <Text style={styles.eyebrow}>WEEK {week.week_number}</Text>
      <Text style={styles.title}>This week's plan</Text>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TARGET STAKE</Text>
          <Text style={styles.kpiValue}>{fmtUGX(week.target_stake_ugx)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>SPENT</Text>
          <Text style={styles.kpiValue}>{fmtUGX(week.spent_ugx)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>REMAINING</Text>
          <Text style={styles.kpiValue}>{fmtUGX(week.remaining_budget_ugx)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>NET</Text>
          <Text style={styles.kpiValue}>{fmtUGX(week.net_ugx)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>ODDS PROGRESS</Text>
        <View style={styles.oddsGrid}>
          <View>
            <Text style={styles.oddsLabel}>Won</Text>
            <Text style={[styles.oddsValue, { color: colors.riskLow }]}>{week.bets_won}</Text>
          </View>
          <View>
            <Text style={styles.oddsLabel}>Lost</Text>
            <Text style={[styles.oddsValue, { color: colors.riskHigh }]}>{week.bets_lost}</Text>
          </View>
          <View>
            <Text style={styles.oddsLabel}>Pending</Text>
            <Text style={styles.oddsValue}>{week.bets_pending}</Text>
          </View>
          <View>
            <Text style={styles.oddsLabel}>Avg odds on wins</Text>
            <Text style={styles.oddsValue}>
              {week.avg_odds_achieved_on_wins !== null ? week.avg_odds_achieved_on_wins.toFixed(2) : "—"}
            </Text>
          </View>
        </View>
        <View style={styles.oddsFooter}>
          <Text style={styles.oddsFooterText}>
            Target odds to chase: <Text style={styles.oddsFooterValue}>{week.target_odds_to_chase.toFixed(2)}</Text>
          </Text>
          <OddsGap gap={week.odds_gap} />
        </View>
      </View>

      <View style={styles.noticeCard}>
        <TrendingUp size={18} color={colors.ticker} />
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeText}>{advice.message}</Text>
          {advice.recommended_days.length > 0 && (
            <View style={styles.chipRow}>
              {advice.recommended_days.map((d) => (
                <View key={d} style={styles.chip}>
                  <Text style={styles.chipText}>{fmtDateOnly(d)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {week.daily_breakdown.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.eyebrow}>DAILY BREAKDOWN</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {week.daily_breakdown.map((day) => (
              <View key={day.date} style={styles.dayCard}>
                <View style={styles.dayHeaderRow}>
                  <CalendarDays size={14} color={colors.inkFaint} />
                  <Text style={styles.dayDate}>{fmtDateOnly(day.date)}</Text>
                  <Text style={styles.dayMatches}>
                    {day.qualifying_match_count} match{day.qualifying_match_count === 1 ? "" : "es"}
                  </Text>
                </View>
                <View style={styles.dayStatsRow}>
                  <View>
                    <Text style={styles.dayStatLabel}>Target</Text>
                    <Text style={styles.dayStatValue}>{fmtUGX(day.target_stake_ugx)}</Text>
                  </View>
                  <View>
                    <Text style={styles.dayStatLabel}>Remaining</Text>
                    <Text style={styles.dayStatValue}>{fmtUGX(day.remaining_budget_ugx)}</Text>
                  </View>
                  <OddsGap gap={day.odds_gap} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {months.length > 0 && (
        <View>
          <Text style={styles.eyebrow}>MONTHLY PROGRESS</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {months.map((mo) => (
              <View key={mo.month_number} style={styles.dayCard}>
                <Text style={styles.dayDate}>Month {mo.month_number}</Text>
                <Text style={styles.monthRange}>
                  {fmtDateOnly(mo.starts_on)} – {fmtDateOnly(mo.ends_on)}
                </Text>
                <View style={styles.dayStatsRow}>
                  <View>
                    <Text style={styles.dayStatLabel}>Spent</Text>
                    <Text style={styles.dayStatValue}>{fmtUGX(mo.spent_ugx)}</Text>
                  </View>
                  <View>
                    <Text style={styles.dayStatLabel}>Earned</Text>
                    <Text style={styles.dayStatValue}>{fmtUGX(mo.earned_ugx)}</Text>
                  </View>
                  <View>
                    <Text style={styles.dayStatLabel}>Net</Text>
                    <Text style={styles.dayStatValue}>{fmtUGX(mo.net_ugx)}</Text>
                  </View>
                  <OddsGap gap={mo.odds_gap} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
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
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 20,
  },
  oddsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginTop: 12,
  },
  oddsLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
  },
  oddsValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.inkPaper,
    marginTop: 4,
  },
  oddsFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    gap: 6,
  },
  oddsFooterText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  oddsFooterValue: {
    fontFamily: fonts.mono,
    color: colors.inkPaper,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.ticker + "4D",
    borderRadius: radius.stub,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ticker,
  },
  dayCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 14,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  dayDate: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.inkPaper,
  },
  dayMatches: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
  },
  dayStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    alignItems: "center",
  },
  dayStatLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
  },
  dayStatValue: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkPaper,
    marginTop: 2,
  },
  monthRange: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 10,
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
  },
});
