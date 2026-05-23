import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";

export default function OTPScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);
  const router = useRouter();

  const handleChange = (val, idx) => {
    const updated = [...otp];
    updated[idx] = val.replace(/[^0-9]/g, "").slice(-1);
    setOtp(updated);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { Alert.alert("Error", "Please enter the full 6-digit OTP"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp: code });
      router.replace({ pathname: "/(auth)/reset-password", params: { email, token: data.resetToken } });
    } catch (err) {
      Alert.alert("Invalid OTP", err.message || "The OTP you entered is incorrect or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      Alert.alert("✅ OTP Resent", "A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
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
          <Text style={styles.heroIcon}>📨</Text>
          <Text style={styles.heroTitle}>Check Your Email</Text>
          <Text style={styles.heroSub}>
            We sent a 6-digit OTP to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* OTP INPUT BOXES */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputs.current[idx] = ref)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(val) => handleChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Verify OTP  →</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
          {resending
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </>
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
  heroSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  emailText: { color: COLORS.primary, fontWeight: "700" },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 28 },
  otpBox: {
    width: 46, height: 56, borderRadius: 13,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    fontSize: 22, fontWeight: "800", color: COLORS.textDark,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 1,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  resendBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 2 },
  resendText: { fontSize: 12, color: COLORS.textSecondary },
  resendLink: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
});
