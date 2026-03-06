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

interface ResetPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export function ResetPasswordScreen({
  onNavigateToLogin,
}: ResetPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const { colors } = useTheme();

  const handleReset = async () => {
    if (!email.trim()) return;
    const success = await resetPassword(email.trim());
    if (success) {
      Alert.alert("Check your email", "We sent you a password reset link.");
      onNavigateToLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>
          Reset Password
        </Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Enter your email and we'll send you a reset link
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

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleReset}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryText }]}>
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToLogin} style={styles.link}>
          <Text style={[styles.linkText, { color: colors.textTertiary }]}>
            Back to sign in
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
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
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
});
