import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { User } from "lucide-react-native";
import { useAuthStore } from "../lib/store";
import { colors, fonts } from "../lib/colors";
import NotificationBell from "./NotificationBell";

// No auth/route-hiding check here on purpose — this component only ever
// mounts inside app/(app)/_layout.tsx, which itself only renders once
// isAuthenticated is confirmed true. /login, /signup, and /onboarding are
// sibling routes outside that tree, so this can't render there structurally;
// no pathname string-matching to keep in sync or risk going stale.
export default function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  // Profile lives in its own tab, so router.back() only pops within that
  // tab's own (empty) stack instead of returning to whichever tab the user
  // came from. Remember the last non-profile tab so the second tap can
  // navigate straight back to it.
  const lastTabRef = useRef("/");
  useEffect(() => {
    if (pathname !== "/profile") lastTabRef.current = pathname;
  }, [pathname]);

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        Bet<Text style={{ color: colors.ticker }}>Wise</Text>
      </Text>
      <View style={styles.rightRow}>
        <NotificationBell />
        <Pressable
          style={styles.profileRow}
          onPress={() =>
            pathname === "/profile" ? router.replace(lastTabRef.current) : router.push("/profile")
          }
          hitSlop={10}
        >
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
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
