import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiClient, BetLog, unwrapList } from "../../lib/api";
import { colors, fonts } from "../../lib/colors";
import LoadingSpinner from "../../components/LoadingSpinner";
import BetLogRow from "../../components/BetLogRow";

export default function BetLogs() {
  const [logs, setLogs] = useState<BetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    apiClient
      .getBetLogs()
      .then((res) => setLogs(unwrapList(res.data)))
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

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>BET LOG</Text>
      <Text style={styles.title}>Your bets</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
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
