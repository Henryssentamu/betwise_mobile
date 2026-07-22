import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius } from "../lib/colors";

interface RiskBadgeProps {
  tier: "low" | "medium" | "high";
  size?: "sm" | "md";
}

const TIER_LABEL: Record<string, string> = {
  low: "LOW RISK",
  medium: "MEDIUM RISK",
  high: "HIGH RISK",
};

const TIER_COLOR: Record<string, string> = {
  low: colors.riskLow,
  medium: colors.riskMedium,
  high: colors.riskHigh,
};

export default function RiskBadge({ tier, size = "md" }: RiskBadgeProps) {
  const color = TIER_COLOR[tier];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color + "66",
          backgroundColor: color + "22",
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color, fontSize: isSmall ? 9 : 11 }]}>{TIER_LABEL[tier]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.full,
    gap: 6,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
});
