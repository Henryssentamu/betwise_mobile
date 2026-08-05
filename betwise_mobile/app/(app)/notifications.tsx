import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { Bell, Check } from "lucide-react-native";
import { apiClient, Notification, unwrapList } from "../../lib/api";
import { colors, fonts, radius } from "../../lib/colors";
import LoadingSpinner from "../../components/LoadingSpinner";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function NotificationRow({ n, onRead }: { n: Notification; onRead: (updated: Notification) => void }) {
  const handleRead = async () => {
    const res = await apiClient.markNotificationRead(n.id);
    onRead(res.data);
  };

  return (
    <View style={[styles.card, !n.is_read && styles.cardUnread]}>
      {!n.is_read && <View style={styles.dot} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{n.title}</Text>
        <Text style={styles.body}>{n.body}</Text>
        <Text style={styles.timestamp}>{fmtDateTime(n.created_at)}</Text>
      </View>
      {!n.is_read && (
        <Pressable onPress={handleRead} hitSlop={10}>
          <Check size={16} color={colors.ticker} />
        </Pressable>
      )}
    </View>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    apiClient
      .getNotifications()
      .then((res) => setNotifications(unwrapList(res.data)))
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

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  if (loading) return <LoadingSpinner label="Loading notifications" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
          <Text style={styles.title2}>Your notifications</Text>
        </View>
        {hasUnread && (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllRead} disabled={markingAll}>
            <Text style={styles.markAllButtonText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow
            n={item}
            onRead={(updated) =>
              setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ticker} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Bell size={28} color={colors.inkFaint} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>You don't have any notifications yet.</Text>
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
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  title2: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.inkPaper,
    marginTop: 4,
  },
  markAllButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  markAllButtonText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: colors.ticker + "66",
    backgroundColor: colors.ticker + "0D",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ticker,
    marginTop: 5,
  },
  title: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.inkPaper,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  timestamp: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
