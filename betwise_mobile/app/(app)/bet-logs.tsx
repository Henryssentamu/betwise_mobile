import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { apiClient, BetLog, unwrapList } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { colors, fonts, radius } from "../../lib/colors";
import { friendlyErrorMessage } from "../../lib/errors";
import LoadingSpinner from "../../components/LoadingSpinner";
import InlineError from "../../components/InlineError";
import BetLogRow from "../../components/BetLogRow";
import LogBetForm from "../../components/LogBetForm";
import SubscriptionGate from "../../components/SubscriptionGate";

export default function BetLogs() {
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const [logs, setLogs] = useState<BetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiClient
      .getBetLogs()
      .then((res) => {
        setLogs(unwrapList(res.data));
        setError(null);
      })
      .catch((err) => setError(friendlyErrorMessage(err, "Couldn't load your bet log.")))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <LoadingSpinner label="Loading bet logs" />;

  if (hasActiveSubscription === false) {
    return (
      <SubscriptionGate
        title="Bet logging is a subscriber feature"
        description="Subscribe to track your stakes, odds, and results against your season plan."
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>BET LOG</Text>
          <Text style={styles.title}>Your bets</Text>
        </View>
        <Pressable style={styles.logButton} onPress={() => setShowLogForm((v) => !v)}>
          <Plus size={14} color={colors.inkMuted} />
          <Text style={styles.logButtonText}>Log a bet</Text>
        </Pressable>
      </View>

      {showLogForm && (
        <View style={styles.logFormCard}>
          <Text style={styles.logFormHint}>
            For a bet you picked yourself, not one of our recommendations.
          </Text>
          <LogBetForm
            onLogged={(log) => {
              setLogs((prev) => [log, ...prev]);
              setShowLogForm(false);
            }}
          />
        </View>
      )}

      {error ? (
        <InlineError message={error} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BetLogRow
              log={item}
              onResolved={(updated) =>
                setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ticker} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>You haven't logged any bets yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  logButtonText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  logFormCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginTop: 16,
  },
  logFormHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 12,
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
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
