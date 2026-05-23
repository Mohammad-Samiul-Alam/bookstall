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
import { formatDate } from "../../lib/utils";

const DURATIONS = ["7 Days", "14 Days", "21 Days", "30 Days"];

export default function IssueBook() {
  const [studentId, setStudentId] = useState("");
  const [bookId, setBookId] = useState("");
  const [duration, setDuration] = useState("14 Days");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const dueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duration));
    return formatDate(d.toISOString());
  };

  const handleIssue = async () => {
    if (!studentId.trim() || !bookId.trim()) {
      Alert.alert("Missing Fields", "Please enter both Student ID and Book ID.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/issues", {
        studentId: studentId.trim(),
        bookId: bookId.trim(),
        duration: parseInt(duration),
      });
      Alert.alert("✅ Book Issued!", `Issued to Student ${studentId} for ${duration}.`, [
        { text: "Issue Another", onPress: () => { setStudentId(""); setBookId(""); } },
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Issue Failed", err.message || "Could not issue book. Please check the IDs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AdminHeader title="Issue Book" showBack />

      <View style={styles.body}>
        {/* STUDENT */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>🎓  STUDENT DETAILS</Text>
          <Text style={styles.fieldLabel}>STUDENT ID / EMAIL</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={17} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter student ID or email address"
              placeholderTextColor={COLORS.placeholder}
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* BOOK */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📚  BOOK DETAILS</Text>
          <Text style={styles.fieldLabel}>BOOK ID / ISBN</Text>
          <View style={styles.inputRow}>
            <Ionicons name="book-outline" size={17} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Book ID or ISBN"
              placeholderTextColor={COLORS.placeholder}
              value={bookId}
              onChangeText={setBookId}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* DURATION */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>⏱  ISSUE DURATION</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, duration === d && styles.durationChipActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.durationDays, duration === d && { color: COLORS.primary }]}>
                  {parseInt(d)}
                </Text>
                <Text style={[styles.durationLabel, duration === d && { color: COLORS.primary }]}>days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>📋  ISSUE SUMMARY</Text>
          {[
            { k: "Issue Date",      v: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
            { k: "Duration",        v: duration },
            { k: "Expected Due",    v: dueDate() },
            { k: "Fine per day",    v: "৳5.00" },
          ].map((r, i, arr) => (
            <View key={r.k} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryKey}>{r.k}</Text>
              <Text style={styles.summaryVal}>{r.v}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.issueBtn} onPress={handleIssue} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                <Text style={styles.issueBtnText}>Confirm Issue</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body: { padding: 14, gap: 12, paddingBottom: 50 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardLabel: {
    fontSize: 10, fontWeight: "800", color: COLORS.primary,
    letterSpacing: 0.5, marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 7, textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11,
  },
  icon: { marginRight: 9 },
  input: { flex: 1, fontSize: 13, color: COLORS.textDark },
  durationRow: { flexDirection: "row", gap: 8 },
  durationChip: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 11,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  durationChipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  durationDays: { fontSize: 18, fontWeight: "800", color: COLORS.textSecondary },
  durationLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted },
  summaryCard: {
    backgroundColor: COLORS.indigoDark, borderRadius: 14, padding: 14,
  },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)",
  },
  summaryKey: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  summaryVal: { fontSize: 11, fontWeight: "700", color: "#fff" },
  issueBtn: {
    backgroundColor: COLORS.primary, borderRadius: 13,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  issueBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
