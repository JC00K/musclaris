import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../hooks/useTheme";

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  {
    label: "At least 1 uppercase letter",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "At least 1 lowercase letter",
    test: (pw: string) => /[a-z]/.test(pw),
  },
  { label: "At least 1 number", test: (pw: string) => /\d/.test(pw) },
  {
    label: "At least 1 special character",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function SignUpScreen({ onNavigateToLogin }: SignUpScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const { colors } = useTheme();

  const ruleResults = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    met: rule.test(password),
  }));

  const allRulesMet = ruleResults.every((r) => r.met);
  const passwordsMatch = password === confirmPassword;

  const handleSignUp = async () => {
    setAttempted(true);

    if (!email.trim() || !password.trim()) return;

    if (!allRulesMet) return;

    if (!passwordsMatch) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const success = await signUp(email.trim(), password);
    if (success) {
      Alert.alert(
        "Check your email",
        "We sent you a confirmation link to verify your account.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Get started with Myonites
        </Text>

        {error && (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: colors.dangerBackground },
            ]}>
            <Text style={[styles.errorText, { color: colors.dangerText }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={[styles.errorDismiss, { color: colors.dangerText }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={colors.inputPlaceholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={colors.inputPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {password.length > 0 && (
          <View style={styles.rulesContainer}>
            {ruleResults.map((rule) => {
              const showError = attempted && !rule.met;
              return (
                <Text
                  key={rule.label}
                  style={[
                    styles.ruleText,
                    {
                      color: rule.met
                        ? colors.success
                        : showError
                          ? colors.danger
                          : colors.textTertiary,
                    },
                  ]}>
                  {rule.met ? "✓" : "○"} {rule.label}
                </Text>
              );
            })}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Confirm password"
          placeholderTextColor={colors.inputPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {attempted && confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={[styles.mismatchText, { color: colors.danger }]}>
            Passwords do not match
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSignUp}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryText }]}>
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToLogin} style={styles.link}>
          <Text style={[styles.linkText, { color: colors.textTertiary }]}>
            Already have an account?{" "}
            <Text style={[styles.linkBold, { color: colors.text }]}>
              Sign in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  rulesContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  mismatchText: {
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    fontWeight: "600",
    marginLeft: 8,
  },
  link: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
  },
  linkBold: {
    fontWeight: "600",
  },
});
