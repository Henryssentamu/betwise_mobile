import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { apiClient, BettingPartner, unwrapList } from "../../lib/api";
import { colors, fonts, radius } from "../../lib/colors";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Partners() {
  const [partners, setPartners] = useState<BettingPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      apiClient
        .getBettingPartners()
        .then((res) => setPartners(unwrapList(res.data)))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WHERE TO PLACE YOUR BETS</Text>
      <Text style={styles.title}>Betting partners</Text>
      <Text style={styles.subtitle}>
        BetWise doesn't take bets. These are the sportsbooks our editorial team rates highest for
        odds and reliability.
      </Text>

      {loading ? (
        <LoadingSpinner label="Loading partners" />
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { borderColor: colors.ticker + "80" }]}
              onPress={() => Linking.openURL(item.website_url)}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.note}>{item.highlight_note}</Text>
              </View>
              <ExternalLink size={16} color={colors.inkFaint} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No partners listed yet.</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 10,
  },
  rank: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.inkFaint,
    width: 26,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.inkPaper,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    paddingVertical: 60,
  },
});
