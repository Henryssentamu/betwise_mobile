import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineBanner from "./OfflineBanner";
import AppHeader from "./AppHeader";
import SubscriptionBanner from "./SubscriptionBanner";

// Single place that reserves the safe-area top inset for the whole banner
// stack, so OfflineBanner/AppHeader/SubscriptionBanner (any subset of which
// may be visible at once) don't each pad for it independently and end up
// double-spaced.
export default function TopChrome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <OfflineBanner />
      <AppHeader />
      <SubscriptionBanner />
    </View>
  );
}
