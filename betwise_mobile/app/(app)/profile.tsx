import { View, Text, StyleSheet, ScrollView } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { useAuthStore } from "../../lib/store";
import { colors, fonts, radius } from "../../lib/colors";
import { fmtDateLong } from "../../lib/formatting";
import RiskBadge from "../../components/RiskBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LoadingSpinner label="Loading your profile" />
      </View>
    );
  }
  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.eyebrow}>PROFILE</Text>
      <Text style={styles.title}>{user.username}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>BIO DATA</Text>
        <View style={styles.rowGrid}>
          <Row label="Username" value={user.username} />
          <Row label="Email" value={user.email} />
          <Row label="Phone number" value={user.phone_number || "—"} />
          <Row label="Country" value={user.country || "—"} />
          <Row label="Date of birth" value={fmtDateLong(user.date_of_birth)} />
          <Row label="Member since" value={fmtDateLong(user.created_at.slice(0, 10))} />
        </View>
        {user.is_age_verified && (
          <View style={styles.verifiedRow}>
            <BadgeCheck size={14} color={colors.riskLow} />
            <Text style={styles.verifiedText}>Age verified</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>RISK APPETITE</Text>
        <View style={{ marginTop: 12 }}>
          <RiskBadge tier={user.default_risk_appetite} />
        </View>
        <Text style={styles.hint}>
          Your default risk appetite shapes which recommendations and season stakes we suggest.
        </Text>
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
    paddingTop: 64,
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
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.inkFaint,
  },
  rowGrid: {
    marginTop: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  rowValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkPaper,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  verifiedText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskLow,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 10,
    lineHeight: 16,
  },
});
