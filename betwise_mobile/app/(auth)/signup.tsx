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
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "../../lib/store";
import { colors, fonts, radius } from "../../lib/colors";
import { isAtLeast18 } from "../../lib/formatting";
import FormField from "../../components/FormField";

const schema = z
  .object({
    username: z.string().min(3, "At least 3 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD"),
    national_id_number: z.string().min(5, "Enter a valid ID number"),
    default_risk_appetite: z.enum(["low", "medium", "high"]),
  })
  .refine((data) => isAtLeast18(data.date_of_birth), {
    message: "You must be 18 or older to use BetWise.",
    path: ["date_of_birth"],
  });

type FormValues = z.infer<typeof schema>;

const RISK_OPTIONS = [
  { value: "low", label: "Low", desc: "Steadier picks, smaller swings" },
  { value: "medium", label: "Medium", desc: "Balanced risk and reward" },
  { value: "high", label: "High", desc: "Bigger odds, bigger swings" },
] as const;

export default function Signup() {
  const signup = useAuthStore((s) => s.signup);
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { default_risk_appetite: "medium" },
  });

  const selectedRisk = watch("default_risk_appetite");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await signup(values);
      router.replace("/onboarding");
    } catch (err: any) {
      const data = err?.response?.data;
      const firstError = (data && typeof data === "object" && Object.values(data)[0]) || null;
      const message = Array.isArray(firstError) ? firstError[0] : firstError;
      setServerError(message || "Couldn't create your account. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>18+ · UGANDA</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          BetWise plans your season and scores matches — you place the bets, on your own terms.
        </Text>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Username"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Password"
              secureTextEntry
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="date_of_birth"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Date of birth (YYYY-MM-DD)"
              placeholder="1998-04-12"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.date_of_birth?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="national_id_number"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="National ID number"
              placeholder="For age verification only"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.national_id_number?.message}
            />
          )}
        />

        <Text style={styles.riskLabel}>Default risk appetite</Text>
        <View style={styles.riskRow}>
          {RISK_OPTIONS.map((opt) => {
            const active = selectedRisk === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setValue("default_risk_appetite", opt.value)}
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
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? "Creating account…" : "Create account"}</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
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
  riskLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  riskRow: {
    gap: 8,
    marginBottom: 20,
  },
  riskCard: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    color: colors.bg,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ticker,
  },
});
