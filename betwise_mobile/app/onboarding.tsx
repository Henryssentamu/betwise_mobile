import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useRouter } from "expo-router";
import { apiClient } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { colors, fonts, radius } from "../lib/colors";
import FormField from "../components/FormField";
import LoadingSpinner from "../components/LoadingSpinner";
import SubscriptionGate from "../components/SubscriptionGate";

const schema = z.object({
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD"),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD"),
  total_budget_ugx: z.coerce.number().min(10000, "Budget should be at least 10,000 UGX"),
  target_earnings_ugx: z.coerce.number().min(1, "Set a target"),
  risk_appetite: z.enum(["low", "medium", "high"]),
});
type FormValues = z.infer<typeof schema>;

const RISK_OPTIONS = [
  { value: "low", label: "Low", desc: "Favourites, tighter odds, steadier pace" },
  { value: "medium", label: "Medium", desc: "Mixed picks across the risk band" },
  { value: "high", label: "High", desc: "Longer odds, higher variance" },
] as const;

function defaultDates() {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { starts_on: fmt(start), ends_on: fmt(end) };
}

export default function Onboarding() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dates = defaultDates();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...dates,
      risk_appetite: user?.default_risk_appetite ?? "medium",
      total_budget_ugx: 500000,
      target_earnings_ugx: 150000,
    },
  });

  const selectedRisk = watch("risk_appetite");
  const budget = watch("total_budget_ugx");
  const target = watch("target_earnings_ugx");

  if (isLoading) return <LoadingSpinner label="Loading" />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (hasActiveSubscription === false) {
    return (
      <SubscriptionGate
        title="Season planning is a subscriber feature"
        description="Subscribe to build a season plan, get weekly stakes tailored to your budget, and track your pace all season."
      />
    );
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await apiClient.createSeasonPlan(values);
      router.replace("/");
    } catch (err: any) {
      const data = err?.response?.data;
      const firstError = (data && typeof data === "object" && Object.values(data)[0]) || null;
      const message = Array.isArray(firstError) ? firstError[0] : firstError;
      setServerError(message || "Couldn't set up your season plan. Please check your numbers.");
    } finally {
      setSubmitting(false);
    }
  };

  const impliedReturn = budget > 0 ? ((target / budget) * 100).toFixed(0) : "0";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>STEP 1 OF 1</Text>
        <Text style={styles.title}>Plan your season</Text>
        <Text style={styles.subtitle}>
          Set a budget and a target. We'll split it into weekly stakes and odds targets, and
          track your pace against it all season.
        </Text>

        <View style={styles.dateRow}>
          <Controller
            control={control}
            name="starts_on"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ flex: 1 }}>
                <FormField
                  label="Season starts"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.starts_on?.message}
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="ends_on"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ flex: 1 }}>
                <FormField
                  label="Season ends"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.ends_on?.message}
                />
              </View>
            )}
          />
        </View>

        <Controller
          control={control}
          name="total_budget_ugx"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Total budget (UGX)"
              keyboardType="numeric"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.total_budget_ugx?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="target_earnings_ugx"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <FormField
                label="Target earnings (UGX)"
                keyboardType="numeric"
                value={String(value)}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.target_earnings_ugx?.message}
              />
              <Text style={styles.impliedText}>Implies a {impliedReturn}% return on budget</Text>
            </View>
          )}
        />

        <Text style={styles.riskLabel}>Risk appetite for this season</Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          {RISK_OPTIONS.map((opt) => {
            const active = selectedRisk === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setValue("risk_appetite", opt.value)}
                style={[styles.riskCard, active && styles.riskCardActive]}
              >
                <Text style={[styles.riskCardTitle, active && { color: colors.inkPaper }]}>
                  {opt.label}
                </Text>
                <Text style={styles.riskCardDesc}>{opt.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {serverError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Setting up your season…" : "Start my season"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
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
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  impliedText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: -12,
    marginBottom: 18,
  },
  riskLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  riskCard: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  riskCardActive: {
    borderColor: colors.ticker,
    backgroundColor: colors.ticker + "1A",
  },
  riskCardTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  riskCardDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: colors.riskHigh + "1A",
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.riskHigh,
  },
  button: {
    backgroundColor: colors.ticker,
    borderRadius: radius.stub,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    color: colors.bg,
  },
});
