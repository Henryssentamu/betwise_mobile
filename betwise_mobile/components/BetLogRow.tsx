import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Check, X, Lock } from "lucide-react-native";
import { apiClient, BetLog } from "../lib/api";
import { colors, fonts, radius } from "../lib/colors";
import { fmtUGX } from "../lib/formatting";

const RESULT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: colors.hairline + "40", border: colors.hairline, text: colors.inkMuted },
  won: { bg: colors.riskLow + "26", border: colors.riskLow + "66", text: colors.riskLow },
  lost: { bg: colors.riskHigh + "26", border: colors.riskHigh + "66", text: colors.riskHigh },
};

function ResultBadge({ result }: { result: BetLog["result"] }) {
  const c = RESULT_COLORS[result];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{result.toUpperCase()}</Text>
    </View>
  );
}

export default function BetLogRow({
  log,
  onResolved,
}: {
  log: BetLog;
  onResolved: (updated: BetLog) => void;
}) {
  const [payoutDraft, setPayoutDraft] = useState(() =>
    log.stake_ugx && log.odds_taken ? (parseFloat(log.stake_ugx) * log.odds_taken).toFixed(2) : ""
  );
  const [reportingWon, setReportingWon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvesAutomatically = log.followed_recommendation && log.recommendation !== null;
  const canReport = !resolvesAutomatically && log.result === "pending";

  const submit = async (result: "won" | "lost") => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: { result: "won" | "lost"; payout_ugx?: number } = { result };
      if (result === "won" && payoutDraft) payload.payout_ugx = parseFloat(payoutDraft);
      const res = await apiClient.reportBetResult(log.id, payload);
      onResolved(res.data);
      setReportingWon(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.detail ||
          "Couldn't report result."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.infoRow}>
          <ResultBadge result={log.result} />
          <Text style={styles.stake}>{fmtUGX(log.stake_ugx)}</Text>
          <Text style={styles.odds}>@ {log.odds_taken.toFixed(2)}</Text>
        </View>
        {resolvesAutomatically && (
          <View style={styles.autoRow}>
            <Lock size={12} color={colors.inkFaint} />
            <Text style={styles.autoText}>Resolves automatically</Text>
          </View>
        )}
      </View>

      {log.payout_ugx !== null && (
        <Text style={styles.payout}>payout {fmtUGX(log.payout_ugx)}</Text>
      )}

      {canReport && (
        <View style={styles.actionsRow}>
          {reportingWon ? (
            <>
              <TextInput
                value={payoutDraft}
                onChangeText={setPayoutDraft}
                placeholder="Payout (UGX)"
                placeholderTextColor={colors.inkFaint}
                keyboardType="numeric"
                style={styles.payoutInput}
              />
              <Pressable
                onPress={() => submit("won")}
                disabled={submitting}
                style={[styles.actionButton, { backgroundColor: colors.riskLow + "26", borderColor: colors.riskLow + "66" }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.riskLow }]}>Confirm</Text>
              </Pressable>
              <Pressable onPress={() => setReportingWon(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setReportingWon(true)}
                disabled={submitting}
                style={[styles.actionButton, { backgroundColor: colors.riskLow + "26", borderColor: colors.riskLow + "66" }]}
              >
                <Check size={12} color={colors.riskLow} />
                <Text style={[styles.actionButtonText, { color: colors.riskLow }]}>Won</Text>
              </Pressable>
              <Pressable
                onPress={() => submit("lost")}
                disabled={submitting}
                style={[styles.actionButton, { backgroundColor: colors.riskHigh + "26", borderColor: colors.riskHigh + "66" }]}
              >
                <X size={12} color={colors.riskHigh} />
                <Text style={[styles.actionButtonText, { color: colors.riskHigh }]}>Lost</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  stake: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.inkPaper,
  },
  odds: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  autoText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
  },
  payout: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.stub,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
  },
  payoutInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkPaper,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.riskHigh,
    marginTop: 8,
  },
});
