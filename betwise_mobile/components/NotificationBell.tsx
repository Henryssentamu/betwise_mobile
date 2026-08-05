import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Bell } from "lucide-react-native";
import { apiClient } from "../lib/api";
import { colors, fonts } from "../lib/colors";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    apiClient
      .getUnreadNotificationCount()
      .then((res) => setCount(res.data.count))
      .catch(() => {});
  }, [pathname]);

  return (
    <Pressable style={styles.wrap} onPress={() => router.push("/notifications")} hitSlop={10}>
      <Bell size={18} color={colors.inkMuted} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.riskHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkPaper,
  },
});
