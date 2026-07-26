import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius } from "../lib/colors";

export default function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.riskHigh + "1A",
    borderWidth: 1,
    borderColor: colors.riskHigh + "4D",
    borderRadius: radius.stub,
    padding: 14,
    marginTop: 12,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.riskHigh,
  },
});
