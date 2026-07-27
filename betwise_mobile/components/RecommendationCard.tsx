import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Recommendation } from "../lib/api";
import { colors, fonts, radius } from "../lib/colors";
import { fmtKickoff } from "../lib/formatting";
import RiskBadge from "./RiskBadge";

const BET_TYPE_LABEL: Record<string, string> = {
  home_win: "Home win",
  away_win: "Away win",
  draw: "Draw",
  corners: "Corners",
  btts_yes: "Both teams to score: Yes",
  btts_no: "Both teams to score: No",
  over_2_5: "Over 2.5 goals",
  under_2_5: "Under 2.5 goals",
};

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  const router = useRouter();
  const m = rec.match;

  return (
    <Pressable
      onPress={() => router.push(`/recommendations/${m.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.mainSection}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{m.league?.name ?? "League"}</Text>
          <Text style={styles.eyebrow}>{fmtKickoff(m.kickoff_at)}</Text>
        </View>

        <Text style={styles.matchup} numberOfLines={1}>
          {m.home_team?.short_name ?? m.home_team?.name}
          <Text style={styles.vs}>  vs  </Text>
          {m.away_team?.short_name ?? m.away_team?.name}
        </Text>

        <Text style={styles.reasoning} numberOfLines={2}>
          {rec.reasoning_summary}
        </Text>

        <View style={styles.footerRow}>
          <RiskBadge tier={rec.risk_tier} size="sm" />
          <Text style={styles.betType}>{BET_TYPE_LABEL[rec.bet_type] ?? rec.bet_type}</Text>
        </View>
      </View>

      {/* Perforation line */}
      <View style={styles.perforation}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View key={i} style={styles.perfDot} />
        ))}
      </View>

      {/* Stub section */}
      <View style={styles.stub}>
        <Text style={styles.stubEyebrow}>CONFIDENCE</Text>
        <Text style={styles.confidence}>
          {Math.round(rec.confidence_score)}
          <Text style={styles.confidencePct}>%</Text>
        </Text>
        <Text style={styles.odds}>
          {rec.suggested_odds_min.toFixed(2)}–{rec.suggested_odds_max.toFixed(2)}
        </Text>
        <ChevronRight size={16} color={colors.inkFaint} style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.panel,
    borderRadius: radius.stub,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardPressed: {
    borderColor: colors.ticker + "80",
  },
  mainSection: {
    flex: 1,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
    textTransform: "uppercase",
  },
  matchup: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
    marginBottom: 4,
  },
  vs: {
    color: colors.inkFaint,
    fontSize: 14,
  },
  reasoning: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  betType: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  perforation: {
    width: 1,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  perfDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.hairline,
    marginLeft: -1,
  },
  stub: {
    width: 108,
    backgroundColor: colors.panel2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 2,
  },
  stubEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  confidence: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ticker,
    lineHeight: 34,
  },
  confidencePct: {
    fontSize: 15,
    color: colors.ticker + "99",
  },
  odds: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
