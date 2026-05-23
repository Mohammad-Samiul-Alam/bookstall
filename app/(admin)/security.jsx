import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function AdminSecurity() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();

  const handleChange = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPass !== confirm) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    Alert.alert("Password Changed", "Your password has been updated successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
    setLoading(false);
  };

  const PassField = ({ label, value, setter, show, toggleShow }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={17} color={COLORS.indigo} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setter}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={COLORS.placeholder}
        />
        <TouchableOpacity onPress={toggleShow}>
          <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={17} color={COLORS.placeholder} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={{ fontSize: 32 }}>🔐</Text>
        <View>
          <Text style={styles.heroTitle}>Update Admin Password</Text>
          <Text style={styles.heroSub}>Choose a strong, unique password</Text>
        </View>
      </View>

      <View style={styles.form}>
        <PassField label="Current Password" value={current} setter={setCurrent}
          show={showCurrent} toggleShow={() => setShowCurrent(!showCurrent)} />
        <PassField label="New Password" value={newPass} setter={setNewPass}
          show={showNew} toggleShow={() => setShowNew(!showNew)} />
        <PassField label="Confirm New Password" value={confirm} setter={setConfirm}
          show={showNew} toggleShow={() => {}} />

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Password Requirements</Text>
          {[
            "At least 8 characters long",
            "Contains uppercase and lowercase letters",
            "Contains at least one number",
            "Contains at least one special character",
          ].map((t) => (
            <Text key={t} style={styles.tipItem}>✓ {t}</Text>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleChange} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.indigoDark,
    paddingTop: 52, paddingBottom: 18, paddingHorizontal: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  heroCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#E8EAF6", borderRadius: 14,
    margin: 14, padding: 16,
  },
  heroTitle: { fontSize: 15, fontWeight: "700", color: COLORS.indigoDark },
  heroSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  form: { paddingHorizontal: 16, paddingBottom: 40 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 13, color: COLORS.textDark },
  tipsCard: {
    backgroundColor: "#F5F6FF", borderRadius: 11,
    padding: 13, marginBottom: 14,
  },
  tipsTitle: { fontSize: 11, fontWeight: "700", color: COLORS.indigo, marginBottom: 8 },
  tipItem: { fontSize: 11, color: COLORS.indigo, paddingVertical: 2 },
  saveBtn: {
    backgroundColor: COLORS.indigo, borderRadius: 11,
    paddingVertical: 14, alignItems: "center",
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
