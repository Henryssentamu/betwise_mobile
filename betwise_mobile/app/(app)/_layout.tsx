import { Tabs, Redirect } from "expo-router";
import { LayoutDashboard, TrendingUp, Users, CreditCard, CalendarDays, ClipboardList } from "lucide-react-native";
import { useAuthStore } from "../../lib/store";
import { colors, fonts } from "../../lib/colors";
import LoadingSpinner from "../../components/LoadingSpinner";
import AppHeader from "../../components/AppHeader";
import SubscriptionBanner from "../../components/SubscriptionBanner";
import { View } from "react-native";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LoadingSpinner label="Loading BetWise" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/*
        Deliberately mounted here rather than in the root layout: this
        branch only renders once isAuthenticated is confirmed true, so
        AppHeader/SubscriptionBanner are structurally impossible to render
        on /login, /signup, or /onboarding (separate top-level routes,
        siblings of this (app) segment) — no pathname string-matching or
        auth-flag check to keep in sync, and no risk of a stale value
        showing them somewhere they shouldn't be after a hot reload.
      */}
      <AppHeader />
      <SubscriptionBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.panel,
            borderTopColor: colors.hairline,
            borderTopWidth: 1,
            height: 84,
            paddingTop: 8,
            paddingBottom: 24,
          },
          tabBarActiveTintColor: colors.ticker,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarLabelStyle: {
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: 0.4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "OVERVIEW",
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="this-week"
          options={{
            title: "WEEK",
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="recommendations/index"
          options={{
            title: "PICKS",
            tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="bet-logs"
          options={{
            title: "BETS",
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="partners"
          options={{
            title: "TRUSTED",
            tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="pricing"
          options={{
            title: "PLANS",
            tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} />,
          }}
        />
        <Tabs.Screen
          name="recommendations/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
