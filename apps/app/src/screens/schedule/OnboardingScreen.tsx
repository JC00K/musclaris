/**
 * OnboardingScreen
 *
 * First-time user flow after signup. Guides the user through
 * setting up their work schedule in a step-by-step flow:
 *
 *   1. Welcome message
 *   2. Schedule setup (work days, window, availability)
 *   3. Schedule confirmation
 *
 * After confirmation, persists the schedule to Supabase
 * and marks onboarding as complete.
 */

import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { ScheduleSetupScreen } from "./ScheduleSetupScreen";
import type { ScheduleConfig } from "./ScheduleSetupScreen";
import { ScheduleConfirmScreen } from "./ScheduleConfirmScreen";

type OnboardingStep = "welcome" | "setup" | "confirm";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(
    null,
  );

  const handleSetupComplete = (config: ScheduleConfig) => {
    setScheduleConfig(config);
    setStep("confirm");
  };

  const handleConfirm = async (_config: ScheduleConfig) => {
    /* TODO: Persist schedule to Supabase via ScheduleRepository
       - Update user_profiles with work window and default availability
       - Create daily_schedules for each selected work day
       - Create sessions for each proposed slot */
    onComplete();
  };

  if (step === "setup") {
    return (
      <ScheduleSetupScreen
        onConfirm={handleSetupComplete}
        onBack={() => setStep("welcome")}
        isOnboarding
      />
    );
  }

  if (step === "confirm" && scheduleConfig) {
    return (
      <ScheduleConfirmScreen
        config={scheduleConfig}
        onConfirm={handleConfirm}
        onBack={() => setStep("setup")}
      />
    );
  }

  /* Welcome step */
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to Musclaris
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Musclaris schedules six short workout sessions throughout your workday
          to keep you active and focused. Each session takes about 7 minutes.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Let's set up your work schedule so we can find the best times for your
          workouts.
        </Text>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => setStep("setup")}>
          <Text style={[styles.startText, { color: colors.primaryText }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 32,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 16,
  },
  startButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  startText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
