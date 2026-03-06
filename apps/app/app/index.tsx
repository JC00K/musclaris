import { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuthStore } from "../src/store/authStore";
import { useTheme } from "../src/hooks/useTheme";
import { pullThemeFromSupabase } from "../src/services/themeSync";
import { LoginScreen } from "../src/screens/auth/LoginScreen";
import { SignUpScreen } from "../src/screens/auth/SignUpScreen";
import { ResetPasswordScreen } from "../src/screens/auth/ResetPasswordScreen";
import { HomeScreen } from "../src/screens/HomeScreen";
import { SettingsScreen } from "../src/screens/SettingsScreen";
import { PosePrototypeScreen } from "../src/screens/pose/PosePrototypeScreen";
import { OnboardingScreen } from "../src/screens/schedule/OnboardingScreen";
import { ScheduleSetupScreen } from "../src/screens/schedule/ScheduleSetupScreen";
import { ScheduleConfirmScreen } from "../src/screens/schedule/ScheduleConfirmScreen";
import type { ScheduleConfig } from "../src/screens/schedule/ScheduleSetupScreen";

type AuthView = "login" | "signup" | "reset";
type AppView =
  | "home"
  | "pose-prototype"
  | "settings"
  | "schedule-setup"
  | "schedule-confirm";

export default function Index() {
  const { session, isLoading, initialize } = useAuthStore();
  const { colors } = useTheme();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [appView, setAppView] = useState<AppView>("home");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  /* Sync theme from Supabase after login */
  useEffect(() => {
    if (session?.userId) {
      pullThemeFromSupabase(session.userId);
    }
  }, [session?.userId]);

  /* TODO: Check if user has completed onboarding via Supabase
     (e.g., user_profiles.default_availability is not null) */
  useEffect(() => {
    if (session?.userId) {
      /* Placeholder — will check Supabase for existing schedule */
      setHasCompletedOnboarding(false);
    }
  }, [session?.userId]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    /* Onboarding flow for first-time users */
    if (!hasCompletedOnboarding) {
      return (
        <OnboardingScreen onComplete={() => setHasCompletedOnboarding(true)} />
      );
    }

    if (appView === "pose-prototype") {
      return <PosePrototypeScreen onBack={() => setAppView("home")} />;
    }
    if (appView === "settings") {
      return <SettingsScreen onBack={() => setAppView("home")} />;
    }
    if (appView === "schedule-setup") {
      return (
        <ScheduleSetupScreen
          onConfirm={(config) => {
            setScheduleConfig(config);
            setAppView("schedule-confirm");
          }}
          onBack={() => setAppView("home")}
        />
      );
    }
    if (appView === "schedule-confirm" && scheduleConfig) {
      return (
        <ScheduleConfirmScreen
          config={scheduleConfig}
          onConfirm={async (_config) => {
            /* TODO: Persist to Supabase */
            setScheduleConfig(null);
            setAppView("home");
          }}
          onBack={() => setAppView("schedule-setup")}
        />
      );
    }
    return (
      <HomeScreen
        onNavigateToPosePrototype={() => setAppView("pose-prototype")}
        onNavigateToSettings={() => setAppView("settings")}
        onNavigateToSchedule={() => setAppView("schedule-setup")}
      />
    );
  }

  switch (authView) {
    case "signup":
      return <SignUpScreen onNavigateToLogin={() => setAuthView("login")} />;
    case "reset":
      return (
        <ResetPasswordScreen onNavigateToLogin={() => setAuthView("login")} />
      );
    default:
      return (
        <LoginScreen
          onNavigateToSignUp={() => setAuthView("signup")}
          onNavigateToReset={() => setAuthView("reset")}
        />
      );
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
