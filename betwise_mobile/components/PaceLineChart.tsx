import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Line as SvgLine } from "react-native-svg";
import { colors, fonts } from "../lib/colors";

interface PacePoint {
  week: string;
  invested: number;
  earned: number;
}

const CHART_HEIGHT = 160;
const CHART_WIDTH = 320;
const PADDING = 12;

function buildPoints(values: number[], max: number) {
  const step = values.length > 1 ? (CHART_WIDTH - PADDING * 2) / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = PADDING + i * step;
      const y = CHART_HEIGHT - PADDING - (v / max) * (CHART_HEIGHT - PADDING * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function PaceLineChart({ data }: { data: PacePoint[] }) {
  if (data.length === 0) return null;

  const max = Math.max(1, ...data.map((d) => Math.max(d.invested, d.earned)));
  const investedPoints = buildPoints(
    data.map((d) => d.invested),
    max
  );
  const earnedPoints = buildPoints(
    data.map((d) => d.earned),
    max
  );

  return (
    <View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <SvgLine
          x1={PADDING}
          y1={CHART_HEIGHT - PADDING}
          x2={CHART_WIDTH - PADDING}
          y2={CHART_HEIGHT - PADDING}
          stroke={colors.hairline}
          strokeWidth={1}
        />
        <Polyline
          points={investedPoints}
          fill="none"
          stroke={colors.inkMuted}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Polyline
          points={earnedPoints}
          fill="none"
          stroke={colors.ticker}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.inkMuted }]} />
          <Text style={styles.legendLabel}>Invested</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.ticker }]} />
          <Text style={styles.legendLabel}>Earned</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
});
