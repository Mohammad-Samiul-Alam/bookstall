import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

export default function RegisterUser() {
  const [form, setForm] = useState({
    fullName: "", studentId: "", email: "",
    department: "", role: "student", password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      Alert.alert("Missing Fields", "Full Name, Email and Password are required.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        fullName:   form.fullName.trim(),
        studentId:  form.studentId.trim(),
        email:      form.email.trim().toLowerCase(),
        department: form.department.trim(),
        role:       form.role,
        password:   form.password,
      });
      Alert.alert(
        "✅ User Registered!",
        `${form.fullName} has been added as ${form.role}.`,
        [
          { text: "Add Another", onPress: () => setForm({ fullName: "", studentId: "", email: "", department: "", role: "student", password: "" }) },
          { text: "Done", onPress: () => router.back() },
        ]
      );
    } catch (err) {
      Alert.alert("Registration Failed", err.message || "Could not register user.");
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { label: "Full Name *",       icon: "person-outline",      key: "fullName",   placeholder: "Enter full name" },
    { label: "Student / Staff ID",icon: "id-card-outline",     key: "studentId",  placeholder: "e.g. 0322320105101032" },
    { label: "Email *",           icon: "mail-outline",        key: "email",      placeholder: "user@pub.edu.bd", keyboard: "email-address" },
    { label: "Department",        icon: "school-outline",      key: "department", placeholder: "e.g. B.Sc. in CSE" },
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AdminHeader title="Register User" showBack />

      <View style={styles.form}>
        {/* ROLE TOGGLE */}
        <View style={styles.group}>
          <Text style={styles.label}>USER ROLE</Text>
          <View style={styles.roleRow}>
            {["student", "admin"].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, form.role === r && styles.roleChipActive]}
                onPress={() => set("role")(r)}
              >
                <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
                  {r === "student" ? "🎓 Student" : "⚙️ Admin"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FORM FIELDS */}
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.group}>
            <Text style={styles.label}>{f.label.toUpperCase()}</Text>
            <View style={styles.inputRow}>
              <Ionicons name={f.icon} size={17} color={COLORS.primary} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={form[f.key]}
                onChangeText={set(f.key)}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.placeholder}
                keyboardType={f.keyboard || "default"}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        ))}

        {/* PASSWORD */}
        <View style={styles.group}>
          <Text style={styles.label}>PASSWORD *</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={17} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={set("password")}
              placeholder="Set initial password (min 6 chars)"
              placeholderTextColor={COLORS.placeholder}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={17} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO NOTE */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.noteText}>
            The user can log in immediately with these credentials.
            Advise them to change their password after first login.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Register User</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: 16, paddingBottom: 50 },
  group: { marginBottom: 14 },
  label: {
    fontSize: 9, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 7, textTransform: "uppercase",
  },
  roleRow: { flexDirection: "row", gap: 10 },
  roleChip: {
    flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  roleChipActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  roleText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  roleTextActive: { color: "#fff" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11,
  },
  icon: { marginRight: 9 },
  input: { flex: 1, fontSize: 13, color: COLORS.textDark },
  noteCard: {
    flexDirection: "row", gap: 9, alignItems: "flex-start",
    backgroundColor: COLORS.primaryPale, borderRadius: 12, padding: 13,
    marginBottom: 18, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  noteText: { fontSize: 11, color: COLORS.primary, flex: 1, lineHeight: 17 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 13,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
