import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineBanner from "./OfflineBanner";

// Reserves the safe-area top inset once, above the root Stack, so it's
// consumed exactly one time regardless of which screen is active below.
// AppHeader/SubscriptionBanner deliberately live inside (app)/_layout.tsx
// instead of here — see that file for why — so screens below this point
// (including it) already start below the safe area and don't need their
// own top-inset padding.
export default function TopChrome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <OfflineBanner />
    </View>
  );
}
