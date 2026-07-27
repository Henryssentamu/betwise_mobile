import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { colors, fonts, radius } from "../lib/colors";

export default function SubscriptionGate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Lock size={22} color={colors.ticker} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable style={styles.button} onPress={() => router.push("/pricing")}>
        <Text style={styles.buttonText}>View plans</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ticker + "1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.inkPaper,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.bg,
  },
});
