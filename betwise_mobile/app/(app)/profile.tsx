import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BadgeCheck, ChevronRight, Lock, LogOut, Trash2 } from "lucide-react-native";
import { useAuthStore } from "../../lib/store";
import { apiClient, Subscription } from "../../lib/api";
import { colors, fonts, radius } from "../../lib/colors";
import { fmtDateLong, fmtUGX } from "../../lib/formatting";
import { friendlyErrorMessage } from "../../lib/errors";
import RiskAppetitePicker from "../../components/RiskAppetitePicker";
import LoadingSpinner from "../../components/LoadingSpinner";
import InlineError from "../../components/InlineError";

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
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const updateRiskAppetite = useAuthStore((s) => s.updateRiskAppetite);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const router = useRouter();

  const [savingRisk, setSavingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoadingSubscription(true);
      apiClient
        .getMySubscription()
        .then((res) => {
          setSubscription(res.data);
          setSubscriptionError(null);
        })
        .catch((err) => setSubscriptionError(friendlyErrorMessage(err, "Couldn't load your subscription.")))
        .finally(() => setLoadingSubscription(false));
    }, [])
  );

  const handleRiskChange = async (tier: "low" | "medium" | "high") => {
    if (tier === user?.default_risk_appetite) return;
    setSavingRisk(true);
    setRiskError(null);
    try {
      await updateRiskAppetite(tier);
    } catch (err: any) {
      setRiskError(friendlyErrorMessage(err, "Couldn't update your risk appetite."));
    } finally {
      setSavingRisk(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      router.replace("/login");
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.password?.[0] ||
          friendlyErrorMessage(err, "Couldn't delete your account.")
      );
    } finally {
      setDeleting(false);
    }
  };

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
        {hasActiveSubscription === false ? (
          <View style={styles.lockedRow}>
            <Lock size={14} color={colors.inkFaint} />
            <Text style={styles.lockedText}>Subscribe to set your risk appetite.</Text>
            <Pressable onPress={() => router.push("/pricing")}>
              <Text style={styles.lockedLink}>View plans</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ marginTop: 12 }}>
              <RiskAppetitePicker
                value={user.default_risk_appetite}
                onChange={handleRiskChange}
                disabled={savingRisk}
              />
            </View>
            {riskError && <Text style={styles.errorText}>{riskError}</Text>}
            <Text style={styles.hint}>
              Your default risk appetite shapes which recommendations and season stakes we suggest.
            </Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>SUBSCRIPTION</Text>
        {loadingSubscription ? (
          <Text style={[styles.hint, { marginTop: 12 }]}>Loading…</Text>
        ) : subscriptionError ? (
          <InlineError message={subscriptionError} />
        ) : subscription ? (
          <>
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>{subscription.plan.name}</Text>
                <Text style={styles.planMeta}>
                  {fmtUGX(subscription.plan.price_ugx)} / {subscription.plan.billing_cycle === "monthly" ? "month" : "season"}
                  {subscription.ends_at ? ` · renews ${fmtDateLong(subscription.ends_at.slice(0, 10))}` : ""}
                </Text>
              </View>
            </View>
            <Pressable style={styles.upgradeButton} onPress={() => router.push("/pricing")}>
              <Text style={styles.upgradeButtonText}>Change plan</Text>
              <ChevronRight size={14} color={colors.inkMuted} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.hint, { marginTop: 12 }]}>
              You don't have an active subscription yet.
            </Text>
            <Pressable style={styles.upgradeButton} onPress={() => router.push("/pricing")}>
              <Text style={styles.upgradeButtonText}>Choose a plan</Text>
              <ChevronRight size={14} color={colors.inkMuted} />
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>SETTINGS</Text>
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={15} color={colors.riskHigh} />
          <Text style={styles.logoutButtonText}>
            {loggingOut ? "Logging out…" : "Log out"}
          </Text>
        </Pressable>

        {!showDeleteConfirm ? (
          <Pressable
            style={styles.deleteButton}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={15} color={colors.riskHigh} />
            <Text style={styles.logoutButtonText}>Delete account</Text>
          </Pressable>
        ) : (
          <View style={styles.deleteConfirmBox}>
            <Text style={styles.deleteConfirmText}>
              This deactivates your account and cancels any active subscription — you won't be able to log in
              again. Your data is kept for our records but you'll lose access. This can't be undone from the app.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password to confirm"
              placeholderTextColor={colors.inkFaint}
              secureTextEntry
              style={styles.deletePasswordInput}
            />
            {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}
            <View style={styles.deleteActionsRow}>
              <Pressable
                style={styles.deleteCancelButton}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteConfirmButton, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {deleting ? "Deleting…" : "Delete my account"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
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
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  lockedText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  lockedLink: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.ticker,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskHigh,
    marginTop: 8,
  },
  planRow: {
    marginTop: 12,
  },
  planName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.inkPaper,
  },
  planMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 3,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingVertical: 12,
    marginTop: 14,
  },
  upgradeButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    paddingVertical: 12,
    marginTop: 12,
  },
  logoutButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.riskHigh,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    paddingVertical: 12,
    marginTop: 10,
  },
  deleteConfirmBox: {
    backgroundColor: colors.riskHigh + "0D",
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    padding: 14,
    marginTop: 10,
  },
  deleteConfirmText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  deletePasswordInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkPaper,
    marginBottom: 10,
  },
  deleteActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  deleteCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteCancelButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: colors.riskHigh,
    borderRadius: radius.stub,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteConfirmButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.bg,
  },
});
