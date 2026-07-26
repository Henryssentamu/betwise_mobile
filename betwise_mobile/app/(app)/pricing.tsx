import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Check, Tag, CheckCircle2 } from "lucide-react-native";
import { apiClient, Subscription, SubscriptionPlan, unwrapList } from "../../lib/api";
import { colors, fonts, radius } from "../../lib/colors";
import { fmtUGX } from "../../lib/formatting";
import { friendlyErrorMessage } from "../../lib/errors";
import { useAuthStore } from "../../lib/store";
import LoadingSpinner from "../../components/LoadingSpinner";
import InlineError from "../../components/InlineError";

export default function Pricing() {
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    discounted_price_ugx: number;
    original_price_ugx: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([apiClient.getSubscriptionPlans(), apiClient.getMySubscription()])
        .then(([plansRes, subRes]) => {
          setPlans(unwrapList(plansRes.data));
          setCurrentSubscription(subRes.data);
          setLoadError(null);
        })
        .catch((err) => setLoadError(friendlyErrorMessage(err, "Couldn't load plans.")))
        .finally(() => setLoading(false));
    }, [])
  );

  const selectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPromoResult(null);
    setPromoCode("");
    setCheckoutError(null);
    setActivated(false);
  };

  const handleValidatePromo = async () => {
    if (!selectedPlan || !promoCode.trim()) return;
    setValidating(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const res: any = await apiClient.validatePromoCode({
        code: promoCode.trim(),
        plan_id: selectedPlan.id,
      });
      setPromoResult(res.data);
    } catch (err: any) {
      setPromoError(friendlyErrorMessage(err, "That promo code isn't valid."));
    } finally {
      setValidating(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await apiClient.checkout({
        plan_id: selectedPlan.id,
        promo_code: promoResult?.valid ? promoCode.trim() : undefined,
      });
      if (res.data.payment_required) {
        await WebBrowser.openBrowserAsync(res.data.redirect_url as string);
      } else {
        setActivated(true);
        refreshProfile();
      }
    } catch (err: any) {
      setCheckoutError(friendlyErrorMessage(err, "Checkout failed. Please try again."));
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading plans" />;

  if (loadError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>SUBSCRIPTION</Text>
        <Text style={styles.title}>Choose your plan</Text>
        <InlineError message={loadError} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.eyebrow}>SUBSCRIPTION</Text>
      <Text style={styles.title}>Choose your plan</Text>

      <View style={{ gap: 12, marginBottom: 24 }}>
        {plans.map((plan) => {
          const active = selectedPlan?.id === plan.id;
          const isCurrent = currentSubscription?.plan?.id === plan.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => selectPlan(plan)}
              style={[styles.planCard, active && styles.planCardActive]}
            >
              <View style={styles.planCardHeader}>
                <Text style={styles.eyebrow}>{plan.billing_cycle.toUpperCase()}</Text>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{fmtUGX(plan.price_ugx)}</Text>
              <Text style={styles.planCycle}>
                per {plan.billing_cycle === "monthly" ? "month" : "season"}
              </Text>
              <View style={{ marginTop: 10, gap: 5 }}>
                {(plan.features || []).map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Check size={12} color={colors.riskLow} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedPlan && activated && (
        <View style={styles.activatedCard}>
          <CheckCircle2 size={32} color={colors.riskLow} style={{ marginBottom: 10 }} />
          <Text style={styles.activatedTitle}>You're all set</Text>
          <Text style={styles.activatedSubtitle}>
            Your {selectedPlan.name} subscription is active — no payment was required.
          </Text>
          <Pressable style={styles.viewProfileButton} onPress={() => router.push("/profile")}>
            <Text style={styles.viewProfileButtonText}>View in profile</Text>
          </Pressable>
        </View>
      )}

      {selectedPlan && !activated && currentSubscription?.plan?.id === selectedPlan.id && (
        <View style={styles.activatedCard}>
          <CheckCircle2 size={32} color={colors.riskLow} style={{ marginBottom: 10 }} />
          <Text style={styles.activatedTitle}>This is your current plan</Text>
          <Text style={styles.activatedSubtitle}>Pick a different plan above to switch.</Text>
        </View>
      )}

      {selectedPlan && !activated && currentSubscription?.plan?.id !== selectedPlan.id && (
        <View style={styles.checkoutCard}>
          <Text style={styles.checkoutTitle}>
            {currentSubscription ? "Switch to " : "Checkout — "}
            {selectedPlan.name}
          </Text>

          <View style={styles.promoRow}>
            <View style={styles.promoInputWrap}>
              <Tag size={14} color={colors.inkFaint} style={{ marginLeft: 12 }} />
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Promo code"
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="characters"
                style={styles.promoInput}
              />
            </View>
            <Pressable
              onPress={handleValidatePromo}
              disabled={validating || !promoCode.trim()}
              style={[styles.applyButton, (!promoCode.trim() || validating) && { opacity: 0.5 }]}
            >
              <Text style={styles.applyButtonText}>{validating ? "Checking…" : "Apply"}</Text>
            </Pressable>
          </View>

          {promoError && <Text style={styles.promoErrorText}>{promoError}</Text>}

          {promoResult?.valid ? (
            <View style={styles.priceBox}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Original price</Text>
                <Text style={styles.priceOriginal}>{fmtUGX(promoResult.original_price_ugx)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.riskLow }]}>Your price</Text>
                <Text style={[styles.priceFinal, { color: colors.riskLow }]}>
                  {fmtUGX(promoResult.discounted_price_ugx)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceFinal}>{fmtUGX(selectedPlan.price_ugx)}</Text>
            </View>
          )}

          {checkoutError && <Text style={styles.promoErrorText}>{checkoutError}</Text>}

          <Pressable
            style={[styles.payButton, checkingOut && { opacity: 0.6 }]}
            onPress={handleCheckout}
            disabled={checkingOut}
          >
            <Text style={styles.payButtonText}>
              {checkingOut ? "Redirecting to Pesapal…" : "Pay with Pesapal"}
            </Text>
          </Pressable>
        </View>
      )}
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
  planCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 18,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentBadge: {
    borderWidth: 1,
    borderColor: colors.riskLow + "66",
    backgroundColor: colors.riskLow + "22",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.riskLow,
  },
  planCardActive: {
    borderColor: colors.ticker,
  },
  planName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
    marginTop: 4,
    marginBottom: 8,
  },
  planPrice: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.ticker,
  },
  planCycle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  checkoutCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 18,
  },
  activatedCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    padding: 24,
    alignItems: "center",
  },
  activatedTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkPaper,
    marginBottom: 6,
  },
  activatedSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  viewProfileButton: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  viewProfileButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.bg,
  },
  checkoutTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.inkPaper,
    marginBottom: 14,
  },
  promoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
  },
  promoInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkPaper,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  applyButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  applyButtonText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  promoErrorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskHigh,
    marginBottom: 10,
  },
  priceBox: {
    backgroundColor: colors.riskLow + "1A",
    borderWidth: 1,
    borderColor: colors.riskLow + "4D",
    borderRadius: radius.stub,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  priceLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  priceOriginal: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkFaint,
    textDecorationLine: "line-through",
  },
  priceFinal: {
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.inkPaper,
  },
  payButton: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 15,
    alignItems: "center",
  },
  payButtonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    color: colors.bg,
  },
});
