import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";

const DURATIONS = ["7 Days", "14 Days", "21 Days", "30 Days"];

export default function RequestBook() {
  const { id, title } = useLocalSearchParams();
  const [book, setBook] = useState(null);
  const [duration, setDuration] = useState("14 Days");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await api.get(`/books/${id}`);
        setBook(data);
      } catch (e) {
        console.log("Request book fetch error:", e.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBook();
    else setLoading(false);
  }, [id]);

  const dueDate = () => {
    const days = parseInt(duration);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      await api.post(`/books/${id}/request`, { duration: parseInt(duration) });
      Alert.alert(
        "✅ Request Submitted!",
        "Your request is pending approval by the librarian. You'll be notified once approved.",
        [{ text: "View My Books", onPress: () => router.replace("/(tabs)/my-books") }]
      );
    } catch (err) {
      Alert.alert("Request Failed", err.message || "Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const displayTitle = book?.title || title || "Unknown Book";
  const displayAuthor = book?.author || "";
  const displayGenre = book?.genre || "General";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Book</Text>
      </View>

      {/* BOOK CARD */}
      <View style={styles.bookCard}>
        <View style={[styles.bookIcon, { backgroundColor: COLORS.primaryPale }]}>
          <Text style={{ fontSize: 32 }}>{getGenreEmoji(displayGenre)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={2}>{displayTitle}</Text>
          {displayAuthor ? <Text style={styles.bookAuthor}>{displayAuthor}</Text> : null}
          <View style={styles.bookMeta}>
            {book?.available !== undefined && (
              <View style={[styles.availPill, { backgroundColor: book.available > 0 ? COLORS.statusActiveBg : COLORS.statusOverdueBg }]}>
                <Text style={[styles.availText, { color: book.available > 0 ? COLORS.green : COLORS.red }]}>
                  {book.available > 0 ? `${book.available} copies available` : "Currently unavailable"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* PICKUP INFO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>📍 PICKUP LOCATION</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>Main Library Counter · Ground Floor</Text>
        </View>
        <View style={[styles.infoRow, { marginTop: 8 }]}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>Sat–Thu: 8:00 AM – 5:00 PM</Text>
        </View>
      </View>

      {/* DURATION SELECTOR */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>⏱ BORROWING DURATION</Text>
        <View style={styles.durationGrid}>
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
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>📋 REQUEST SUMMARY</Text>
        {[
          { label: "Request Date", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
          { label: "Duration", value: duration },
          { label: "Expected Due Date", value: dueDate() },
          { label: "Fine per day (if overdue)", value: "৳5.00" },
          { label: "Status", value: "⏳ Pending Approval" },
        ].map((r, i, arr) => (
          <View key={r.label} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryKey}>{r.label}</Text>
            <Text style={[styles.summaryVal, r.label === "Status" && { color: COLORS.orange }]}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* NOTE */}
      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={17} color={COLORS.orange} />
        <Text style={styles.noteText}>
          Collect within <Text style={{ fontWeight: "700" }}>24 hours</Text> of approval.
          Late returns incur a fine of ৳5 per day. Renewals subject to librarian approval.
        </Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleRequest} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send-outline" size={15} color="#fff" />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 52, paddingBottom: 18, paddingHorizontal: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  bookCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.white, borderRadius: 16,
    margin: 14, padding: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  bookIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bookTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark, lineHeight: 19 },
  bookAuthor: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  bookMeta: { marginTop: 6 },
  availPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  availText: { fontSize: 10, fontWeight: "700" },
  sectionCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    marginHorizontal: 14, marginBottom: 10, padding: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  sectionLabel: {
    fontSize: 9, fontWeight: "800", color: COLORS.primary,
    letterSpacing: 0.8, marginBottom: 12, textTransform: "uppercase",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  infoText: { fontSize: 12, color: COLORS.textDark, fontWeight: "500" },
  durationGrid: { flexDirection: "row", gap: 8 },
  durationChip: {
    flex: 1, alignItems: "center", paddingVertical: 12,
    borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  durationChipActive: {
    backgroundColor: COLORS.primaryPale,
    borderColor: COLORS.primary,
  },
  durationDays: { fontSize: 18, fontWeight: "800", color: COLORS.textSecondary },
  durationLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: "600" },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  summaryKey: { fontSize: 11, color: COLORS.textSecondary },
  summaryVal: { fontSize: 11, fontWeight: "700", color: COLORS.textDark },
  noteCard: {
    flexDirection: "row", gap: 9, alignItems: "flex-start",
    backgroundColor: COLORS.statusPendingBg, borderRadius: 12,
    marginHorizontal: 14, marginBottom: 16, padding: 13,
    borderLeftWidth: 3, borderLeftColor: COLORS.orange,
  },
  noteText: { fontSize: 11, color: COLORS.orange, flex: 1, lineHeight: 17 },
  bottomBtns: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10, padding: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  submitBtn: {
    flex: 2, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 7,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
