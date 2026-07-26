import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useAuthStore } from "../lib/store";
import { colors, fonts } from "../lib/colors";

const HIDDEN_ON = ["/pricing", "/login", "/signup", "/onboarding"];

export default function SubscriptionBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const pathname = usePathname();
  const router = useRouter();

  if (!isAuthenticated || hasActiveSubscription !== false) return null;
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <View style={styles.banner}>
      <Sparkles size={14} color={colors.ticker} style={{ marginRight: 6 }} />
      <Text style={styles.text}>
        Subscribe to unlock BetWise's full potential.
      </Text>
      <Pressable onPress={() => router.push("/pricing")} hitSlop={8}>
        <Text style={styles.link}>View plans</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.ticker + "1A",
    borderBottomWidth: 1,
    borderBottomColor: colors.ticker + "40",
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkPaper,
    textAlign: "center",
  },
  link: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.ticker,
    textDecorationLine: "underline",
  },
});
