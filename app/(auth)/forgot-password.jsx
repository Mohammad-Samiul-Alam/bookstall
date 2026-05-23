import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert("Error", "Please enter your email"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      Alert.alert("📧 Email Sent", "Check your inbox for the OTP code.", [
        { text: "Enter OTP", onPress: () => router.push({ pathname: "/(auth)/otp", params: { email } }) },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to send OTP.");
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
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔑</Text>
          <Text style={styles.heroTitle}>Forgot Password?</Text>
          <Text style={styles.heroSub}>
            Enter your registered email and we'll send you a one-time OTP to reset your password.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="your@pub.edu.bd"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Send OTP  →</Text>
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
  hero: { alignItems: "center", marginBottom: 34 },
  heroIcon: { fontSize: 54, marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, marginBottom: 8 },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center", lineHeight: 18, maxWidth: 270 },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 7, textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  icon: { marginRight: 9 },
  input: { flex: 1, fontSize: 14, color: COLORS.textDark },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
