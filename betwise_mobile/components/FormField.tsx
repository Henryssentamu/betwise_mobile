import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { colors, fonts, radius } from "../lib/colors";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function FormField({
  label,
  error,
  style,
  secureTextEntry,
  ...rest
}: FormFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.input,
            secureTextEntry ? styles.inputWithIcon : null,
            error ? styles.inputError : null,
            style,
          ]}
          secureTextEntry={secureTextEntry && !visible}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            style={styles.eyeButton}
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
          >
            {visible ? (
              <EyeOff size={18} color={colors.inkFaint} />
            ) : (
              <Eye size={18} color={colors.inkFaint} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  inputRow: {
    justifyContent: "center",
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkPaper,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: colors.riskHigh,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskHigh,
    marginTop: 5,
  },
});
