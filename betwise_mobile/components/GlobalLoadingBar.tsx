import { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";
import { subscribeToLoading } from "../lib/api";
import { colors } from "../lib/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_WIDTH = SCREEN_WIDTH / 3;

export default function GlobalLoadingBar() {
  const [loading, setLoading] = useState(false);
  const translateX = useRef(new Animated.Value(-BAR_WIDTH)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => subscribeToLoading(setLoading), []);

  useEffect(() => {
    if (loading) {
      translateX.setValue(-BAR_WIDTH);
      loopRef.current = Animated.loop(
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 1100,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
    }
    return () => loopRef.current?.stop();
  }, [loading, translateX]);

  if (!loading) return null;

  return (
    <View style={styles.track} pointerEvents="none">
      <Animated.View style={[styles.bar, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
    backgroundColor: colors.hairline + "60",
    overflow: "hidden",
  },
  bar: {
    width: BAR_WIDTH,
    height: 3,
    backgroundColor: colors.ticker,
  },
});
