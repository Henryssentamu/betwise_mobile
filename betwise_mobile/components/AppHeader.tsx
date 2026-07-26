import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { User } from "lucide-react-native";
import { useAuthStore } from "../lib/store";
import { colors, fonts } from "../lib/colors";

const HIDDEN_ON = ["/onboarding"];

export default function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  if (!isAuthenticated || HIDDEN_ON.includes(pathname)) return null;

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        Bet<Text style={{ color: colors.ticker }}>Wise</Text>
      </Text>
      <Pressable style={styles.profileRow} onPress={() => router.push("/profile")} hitSlop={10}>
        {user && (
          <Text style={styles.username} numberOfLines={1}>
            {user.username}
          </Text>
        )}
        <View style={styles.avatar}>
          <User size={15} color={colors.inkPaper} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "55%",
  },
  username: {
    flexShrink: 1,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkMuted,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
