import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import { ExternalLink, AtSign, Camera, Send, Music2, Play, Globe } from "lucide-react-native";
import { apiClient, BettingPartner, Tipster, unwrapList } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { colors, fonts, radius } from "../../lib/colors";
import { friendlyErrorMessage } from "../../lib/errors";
import LoadingSpinner from "../../components/LoadingSpinner";
import InlineError from "../../components/InlineError";
import SubscriptionGate from "../../components/SubscriptionGate";

const PLATFORM_ICON: Record<Tipster["platform"], typeof AtSign> = {
  twitter: AtSign,
  instagram: Camera,
  telegram: Send,
  tiktok: Music2,
  youtube: Play,
  website: Globe,
};

const PLATFORM_URL_BASE: Record<Tipster["platform"], string> = {
  twitter: "https://twitter.com/",
  instagram: "https://instagram.com/",
  telegram: "https://t.me/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  website: "",
};

function tipsterLink(t: Tipster): string {
  if (t.platform === "website" || t.handle_or_website.startsWith("http")) {
    return t.handle_or_website;
  }
  return PLATFORM_URL_BASE[t.platform] + t.handle_or_website.replace(/^@/, "");
}

export default function Partners() {
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const [partners, setPartners] = useState<BettingPartner[]>([]);
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([apiClient.getBettingPartners(), apiClient.getTipsters()])
        .then(([partnersRes, tipstersRes]) => {
          setPartners(unwrapList(partnersRes.data));
          setTipsters(unwrapList(tipstersRes.data));
          setError(null);
        })
        .catch((err) => setError(friendlyErrorMessage(err, "Couldn't load this page.")))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) return <LoadingSpinner label="Loading trusted picks" />;

  if (hasActiveSubscription === false) {
    return (
      <SubscriptionGate
        title="Partners & tipsters is a subscriber feature"
        description="Subscribe to see our trusted sportsbook and tipster recommendations."
      />
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>WHERE TO PLACE YOUR BETS, WHO TO FOLLOW</Text>
        <Text style={styles.title}>Trusted sportsbooks & tipsters</Text>
        <InlineError message={error} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.eyebrow}>WHERE TO PLACE YOUR BETS, WHO TO FOLLOW</Text>
      <Text style={styles.title}>Trusted sportsbooks & tipsters</Text>

      <Text style={styles.sectionTitle}>Betting companies</Text>
      <Text style={styles.subtitle}>
        Independent sportsbooks our editorial team rates highest for odds coverage and
        reliability — not affiliated with BetWise.
      </Text>
      <View style={{ marginBottom: 28 }}>
        {partners.map((item, index) => (
          <Pressable
            key={item.id}
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
        ))}
        {partners.length === 0 && <Text style={styles.emptyText}>No sportsbooks listed yet.</Text>}
      </View>

      <Text style={styles.sectionTitle}>Tipsters</Text>
      <Text style={styles.subtitle}>
        Independent prediction accounts our editorial team is tracking for a consistent public
        record — not affiliated with BetWise.
      </Text>
      <View>
        {tipsters.map((item) => {
          const Icon = PLATFORM_ICON[item.platform];
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.row, pressed && { borderColor: colors.ticker + "80" }]}
              onPress={() => Linking.openURL(tipsterLink(item))}
            >
              <View style={styles.iconBadge}>
                <Icon size={16} color={colors.inkFaint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.note}>{item.highlight_note}</Text>
                <Text style={styles.handle}>{item.handle_or_website}</Text>
              </View>
              <ExternalLink size={16} color={colors.inkFaint} />
            </Pressable>
          );
        })}
        {tipsters.length === 0 && <Text style={styles.emptyText}>No tipsters listed yet.</Text>}
      </View>
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
    marginBottom: 14,
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
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panel2,
    alignItems: "center",
    justifyContent: "center",
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
  handle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    paddingVertical: 30,
  },
});
