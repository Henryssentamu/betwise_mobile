import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiClient, Recommendation, unwrapList } from "../../../lib/api";
import { colors, fonts, radius } from "../../../lib/colors";
import LoadingSpinner from "../../../components/LoadingSpinner";
import RecommendationCard from "../../../components/RecommendationCard";

const RISK_FILTERS = [
  { value: "", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function Recommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (filter: string) => {
      apiClient
        .getRecommendations(filter ? { risk_tier: filter } : undefined)
        .then((res) => {
          setRecs(unwrapList(res.data));
          setError(null);
        })
        .catch(() => setError("Couldn't load recommendations. Try again shortly."))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(riskFilter);
    }, [load, riskFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(riskFilter);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>THIS WEEK</Text>
      <Text style={styles.title}>Recommendations</Text>

      <View style={styles.filterRow}>
        {RISK_FILTERS.map((f) => {
          const active = riskFilter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setRiskFilter(f.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingSpinner label="Scoring matches" />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={recs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <RecommendationCard rec={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ticker} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No recommendations yet.</Text>
              <Text style={styles.emptySubtitle}>
                This usually means your subscription isn't active yet, or matches haven't been
                scored for this window.
              </Text>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  filterChipActive: {
    borderColor: colors.ticker,
    backgroundColor: colors.ticker + "1A",
  },
  filterChipText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: colors.ticker,
  },
  listContent: {
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: colors.riskHigh + "1A",
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    padding: 14,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.riskHigh,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 17,
  },
});
