import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, ScrollView, StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login, isCheckingAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }
    const result = await login(email.trim().toLowerCase(), password, role);
    if (!result.success) Alert.alert("Login Failed", result.error);
  };

  if (isCheckingAuth) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>📚</Text>
          </View>
          <Text style={styles.appName}>BookStall</Text>
          <Text style={styles.tagline}>PUB CAMPUS LIBRARY SYSTEM</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>🏫 Pabna University of Science & Technology</Text>

          {/* ROLE TABS */}
          <View style={styles.roleTabs}>
            {["student", "admin"].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleTab, role === r && styles.roleTabActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleTabText, role === r && styles.roleTabTextActive]}>
                  {r === "student" ? "🎓 Student" : "⚙️ Admin"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{role === "student" ? "Email Address" : "Admin Email"}</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={role === "student" ? "student@pub.edu.bd" : "admin@pub.edu.bd"}
                placeholderTextColor={COLORS.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In  →</Text>
            }
          </TouchableOpacity>

          {role === "student" && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Register</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>

        <Text style={styles.version}>BookStall v2.0  •  PUB Campus Library</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "center",
    gap: 10,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
    fontFamily: "JetBrainsMono-Medium",
  },
  tagline: { fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 2, fontWeight: "600" },
  card: {
    margin: 16,
    marginTop: 22,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 22,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5,
  },
  greeting: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  cardTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textDark, marginBottom: 2 },
  cardSub: { fontSize: 11, color: COLORS.primaryLight, fontWeight: "500", marginBottom: 18 },
  roleTabs: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
  },
  roleTabActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  roleTabTextActive: { color: COLORS.primary },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, fontSize: 14, color: COLORS.textDark },
  eyeBtn: { padding: 2 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 18 },
  forgotText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 18,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  footerLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  version: { textAlign: "center", color: COLORS.textMuted, fontSize: 10, marginBottom: 20, marginTop: 4 },
});
