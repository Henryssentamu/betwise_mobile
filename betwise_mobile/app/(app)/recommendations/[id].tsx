import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, AlertTriangle } from "lucide-react-native";
import { apiClient, MatchDetail as MatchDetailType, Recommendation, unwrapList } from "../../../lib/api";
import { colors, fonts, radius } from "../../../lib/colors";
import { fmtKickoffLong } from "../../../lib/formatting";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SimpleBarChart from "../../../components/SimpleBarChart";
import LogBetForm from "../../../components/LogBetForm";
import RiskBadge from "../../../components/RiskBadge";

const BET_TYPE_LABEL: Record<string, string> = {
  home_win: "Home win",
  away_win: "Away win",
  draw: "Draw",
  corners: "Corners",
  btts: "Both teams to score",
  over_under: "Over/Under",
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  minor: { label: "Minor knock", color: colors.riskLow },
  major: { label: "Major concern", color: colors.riskMedium },
  confirmed_out: { label: "Confirmed out", color: colors.riskHigh },
};

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetailType | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([
        apiClient.getMatchDetail(Number(id)),
        apiClient.getRecommendations({ match: id }),
      ])
        .then(([matchRes, recRes]) => {
          setMatch(matchRes.data);
          setRecommendation(unwrapList(recRes.data)[0] ?? null);
          setError(null);
        })
        .catch(() => setError("Couldn't load this match."))
        .finally(() => setLoading(false));
    }, [id])
  );

  if (loading) return <LoadingSpinner label="Pulling match data" />;

  if (error || !match) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Match not found."}</Text>
      </View>
    );
  }

  const h2h = match.head_to_head;
  const h2hData = h2h
    ? [
        { label: match.home_team.short_name, value: h2h.home_wins, color: colors.ticker },
        { label: "Draws", value: h2h.draws, color: colors.inkFaint },
        { label: match.away_team.short_name, value: h2h.away_wins, color: colors.riskMedium },
      ]
    : [];

  const allNews = [
    ...match.home_team_news.map((n) => ({ ...n, team: match.home_team.short_name })),
    ...match.away_team_news.map((n) => ({ ...n, team: match.away_team.short_name })),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ArrowLeft size={16} color={colors.inkMuted} />
        <Text style={styles.backText}>Back to recommendations</Text>
      </Pressable>

      <Text style={styles.eyebrow}>{match.league?.name}</Text>
      <Text style={styles.title}>
        {match.home_team.name}
        <Text style={styles.vs}>  vs  </Text>
        {match.away_team.name}
      </Text>
      <Text style={styles.kickoff}>{fmtKickoffLong(match.kickoff_at)}</Text>

      {recommendation && (
        <View style={styles.card}>
          <View style={styles.pickHeaderRow}>
            <Text style={styles.eyebrow}>THE PICK</Text>
            <RiskBadge tier={recommendation.risk_tier} size="sm" />
          </View>
          <Text style={styles.pickType}>
            {BET_TYPE_LABEL[recommendation.bet_type] ?? recommendation.bet_type}
            <Text style={styles.pickOdds}>
              {"  "}
              {recommendation.suggested_odds_min.toFixed(2)}–{recommendation.suggested_odds_max.toFixed(2)}
            </Text>
          </Text>
          <Text style={styles.pickReasoning}>{recommendation.reasoning_summary}</Text>
          <View style={styles.pickDivider}>
            <Text style={styles.pickHint}>
              Placed this bet with a bookmaker? Log it to track it against your plan.
            </Text>
            <LogBetForm
              recommendationId={recommendation.id}
              suggestedOdds={{
                min: recommendation.suggested_odds_min,
                max: recommendation.suggested_odds_max,
              }}
            />
          </View>
        </View>
      )}

      {h2h && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            HEAD-TO-HEAD — LAST {h2h.matches_considered} MEETINGS
          </Text>
          <View style={{ marginTop: 14 }}>
            <SimpleBarChart data={h2hData} />
          </View>
        </View>
      )}

      <View style={styles.formRow}>
        {[match.home_team, match.away_team].map((team) => (
          <View key={team.id} style={styles.formCard}>
            <Text style={styles.eyebrow}>{team.short_name.toUpperCase()} FORM</Text>
            <Text style={styles.formScore}>
              {team.current_form_score > 0 ? "+" : ""}
              {team.current_form_score.toFixed(1)}
            </Text>
            <Text style={styles.formScoreScale}>scale: -10 to +10</Text>
            <View style={styles.formTrack}>
              <View
                style={[
                  styles.formFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(0, ((team.current_form_score + 10) / 20) * 100)
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {allNews.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SQUAD NEWS</Text>
          <View style={{ marginTop: 12, gap: 14 }}>
            {allNews.map((n) => {
              const meta = SEVERITY_META[n.severity] || SEVERITY_META.minor;
              return (
                <View key={n.id} style={styles.newsRow}>
                  <AlertTriangle size={15} color={meta.color} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.newsHeader}>
                      <Text style={styles.newsName}>{n.player_name}</Text>
                      <Text style={styles.newsTeam}> · {n.team}</Text>
                    </View>
                    <View style={[styles.severityBadge, { borderColor: meta.color + "66", backgroundColor: meta.color + "22" }]}>
                      <Text style={[styles.severityText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={styles.newsNote}>{n.note}</Text>
                  </View>
                </View>
              );
            })}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.inkPaper,
    marginTop: 6,
    marginBottom: 4,
  },
  vs: {
    color: colors.inkFaint,
    fontSize: 18,
  },
  kickoff: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 16,
  },
  pickHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pickType: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
    marginBottom: 4,
  },
  pickOdds: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkFaint,
  },
  pickReasoning: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  pickDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 14,
  },
  pickHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
  },
  formScore: {
    fontFamily: fonts.mono,
    fontSize: 26,
    color: colors.inkPaper,
    marginTop: 8,
  },
  formScoreScale: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
  formTrack: {
    height: 5,
    backgroundColor: colors.hairline,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  formFill: {
    height: "100%",
    backgroundColor: colors.ticker,
    borderRadius: 3,
  },
  newsRow: {
    flexDirection: "row",
    gap: 10,
  },
  newsHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  newsName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkPaper,
  },
  newsTeam: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
  },
  severityBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    marginBottom: 4,
  },
  severityText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  newsNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 17,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
