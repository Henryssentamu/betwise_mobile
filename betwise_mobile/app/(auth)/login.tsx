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
import FormField from "../../components/FormField";

const schema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(values);
      router.replace("/");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "That username or password isn't right.";
      setServerError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>SEASON ACCESS</Text>
        <Text style={styles.title}>Log in</Text>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Username"
              autoCapitalize="none"
              autoComplete="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
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
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

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
          <Text style={styles.buttonText}>{submitting ? "Logging in…" : "Log in"}</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to BetWise? </Text>
          <Link href="/signup" asChild>
            <Pressable>
              <Text style={styles.link}>Create an account</Text>
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
    paddingTop: 88,
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
    fontSize: 36,
    color: colors.inkPaper,
    marginTop: 6,
    marginBottom: 28,
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
