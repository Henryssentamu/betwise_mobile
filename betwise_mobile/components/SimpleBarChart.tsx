import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../lib/colors";

interface BarItem {
  label: string;
  value: number;
  color: string;
}

export default function SimpleBarChart({ data }: { data: BarItem[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      {data.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.trackWrap}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    width: 56,
  },
  trackWrap: {
    flex: 1,
    height: 18,
    backgroundColor: colors.hairline,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
    minWidth: 4,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkPaper,
    width: 20,
    textAlign: "right",
  },
});
