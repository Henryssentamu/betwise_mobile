import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, fonts, radius } from "../lib/colors";

const RISK_OPTIONS = [
  { value: "low", label: "Low", desc: "Steadier picks, smaller swings" },
  { value: "medium", label: "Medium", desc: "Balanced risk and reward" },
  { value: "high", label: "High", desc: "Bigger odds, bigger swings" },
] as const;

interface RiskAppetitePickerProps {
  value: "low" | "medium" | "high";
  onChange: (tier: "low" | "medium" | "high") => void;
  disabled?: boolean;
}

export default function RiskAppetitePicker({ value, onChange, disabled }: RiskAppetitePickerProps) {
  return (
    <View style={styles.row}>
      {RISK_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={disabled}
            style={[styles.card, active && styles.cardActive, disabled && { opacity: 0.6 }]}
          >
            <Text style={[styles.cardTitle, active && { color: colors.inkPaper }]}>{opt.label}</Text>
            <Text style={styles.cardDesc}>{opt.desc}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardActive: {
    borderColor: colors.ticker,
    backgroundColor: colors.ticker + "1A",
  },
  cardTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
});
