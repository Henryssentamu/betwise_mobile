import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useAuthStore } from "../lib/store";
import { colors, fonts } from "../lib/colors";

// Like AppHeader, this only ever mounts inside app/(app)/_layout.tsx, so
// /login, /signup, and /onboarding can't apply here structurally — the only
// route within this tree that still needs an explicit exclusion is /pricing
// (no point nudging someone to subscribe while they're already there).
const HIDDEN_ON = ["/pricing"];

export default function SubscriptionBanner() {
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const pathname = usePathname();
  const router = useRouter();

  if (hasActiveSubscription !== false) return null;
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
