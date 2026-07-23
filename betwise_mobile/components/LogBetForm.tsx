import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { apiClient, BetLog } from "../lib/api";
import { colors, fonts, radius } from "../lib/colors";

interface LogBetFormProps {
  recommendationId?: number;
  suggestedOdds?: { min: number; max: number };
  onLogged?: (log: BetLog) => void;
}

export default function LogBetForm({ recommendationId, suggestedOdds, onLogged }: LogBetFormProps) {
  const [stake, setStake] = useState("");
  const [odds, setOdds] = useState(
    suggestedOdds ? ((suggestedOdds.min + suggestedOdds.max) / 2).toFixed(2) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState<BetLog | null>(null);

  const submit = async () => {
    const stakeValue = parseFloat(stake);
    const oddsValue = parseFloat(odds);
    if (!stakeValue || stakeValue <= 0) {
      setError("Enter how much you staked.");
      return;
    }
    if (!oddsValue || oddsValue <= 1) {
      setError("Enter the odds you actually got.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.logBet({
        recommendation: recommendationId,
        stake_ugx: stakeValue,
        odds_taken: oddsValue,
        followed_recommendation: recommendationId !== undefined,
      });
      setLogged(res.data);
      onLogged?.(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't log this bet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (logged) {
    return (
      <View style={styles.loggedRow}>
        <CheckCircle2 size={16} color={colors.riskLow} />
        <Text style={styles.loggedText}>Bet logged — track it under Bet log.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Stake (UGX)</Text>
          <TextInput
            value={stake}
            onChangeText={setStake}
            placeholder="e.g. 20000"
            placeholderTextColor={colors.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        <View style={{ width: 100 }}>
          <Text style={styles.label}>Odds taken</Text>
          <TextInput
            value={odds}
            onChangeText={setOdds}
            placeholder="e.g. 1.85"
            placeholderTextColor={colors.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>
      <Pressable
        onPress={submit}
        disabled={submitting}
        style={[styles.button, submitting && { opacity: 0.6 }]}
      >
        <Text style={styles.buttonText}>{submitting ? "Logging…" : "Log this bet"}</Text>
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkPaper,
  },
  button: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.bg,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskHigh,
    marginTop: 8,
  },
  loggedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loggedText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.riskLow,
  },
});
