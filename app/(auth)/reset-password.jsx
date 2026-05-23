import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";

export default function ResetPassword() {
  const { email, token } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const strength = password.length === 0 ? 0
    : password.length < 4 ? 1
    : password.length < 8 ? 2 : 3;

  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = [COLORS.border, COLORS.red, COLORS.amber, COLORS.green][strength];

  const handleReset = async () => {
    if (!password || !confirm) { Alert.alert("Error", "Please fill in all fields"); return; }
    if (password.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    if (password !== confirm) { Alert.alert("Error", "Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, token, password });
      Alert.alert("✅ Password Reset!", "Your password has been reset successfully. Please log in.", [
        { text: "Go to Login", onPress: () => router.replace("/(auth)") },
      ]);
    } catch (err) {
      Alert.alert("Reset Failed", err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔒</Text>
          <Text style={styles.heroTitle}>Reset Password</Text>
          <Text style={styles.heroSub}>Set a new strong password for your account</Text>
        </View>

        {/* NEW PASSWORD */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STRENGTH METER */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.strengthBar, {
                backgroundColor: i <= strength ? strengthColor : COLORS.border,
              }]} />
            ))}
            <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
          </View>
        )}

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <View style={[styles.inputContainer, confirm.length > 0 && {
            borderColor: confirm === password ? COLORS.green : COLORS.red,
          }]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.placeholder}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            {confirm.length > 0 && (
              <Ionicons
                name={confirm === password ? "checkmark-circle" : "close-circle"}
                size={18}
                color={confirm === password ? COLORS.green : COLORS.red}
              />
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Reset Password  →</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 56 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  backText: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  hero: { alignItems: "center", marginBottom: 30 },
  heroIcon: { fontSize: 54, marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center" },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 7, textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11,
  },
  icon: { marginRight: 9 },
  input: { flex: 1, fontSize: 14, color: COLORS.textDark },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, marginTop: -6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontWeight: "700", width: 40 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
