import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";
import { formatDate, getGenreEmoji, sleep } from "../../lib/utils";

const FILTER_TABS = ["All", "Overdue", "Active"];

export default function ReturnBook() {
  const [issues, setIssues]         = useState([]);
  const [query, setQuery]           = useState("");
  const [activeTab, setActiveTab]   = useState("All");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Confirmation modal
  const [selected, setSelected]   = useState(null);
  const [returning, setReturning] = useState(false);

  const router = useRouter();
  const debounceRef = useRef(null);

  /* ─── Fetch active/overdue issues ───────────────────────── */
  const fetchIssues = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params = { limit: 100 };
      if (activeTab !== "All") params.status = activeTab.toLowerCase();
      const { data } = await api.get("/issues", { params });
      const list = data.issues || data || [];
      // Only show non-returned
      setIssues(list.filter((i) => i.status !== "returned"));
    } catch (e) {
      console.log("Return book fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(400); setRefreshing(false); }
      else setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchIssues(); }, [activeTab]);

  /* ─── Process return ────────────────────────────────────── */
  const handleReturn = async () => {
    if (!selected) return;
    setReturning(true);
    try {
      const { data } = await api.put(`/issues/${selected._id}/return`);
      setSelected(null);
      const fineMsg = data.fine > 0
        ? `\nFine collected: ৳${data.fine}`
        : "\nNo fine charged.";
      Alert.alert("✅ Book Returned", `"${selected.book?.title}" has been returned.${fineMsg}`);
      fetchIssues();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to process return.");
    } finally {
      setReturning(false);
    }
  };

  /* ─── Filtered list ─────────────────────────────────────── */
  const filtered = issues.filter((i) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      i.book?.title?.toLowerCase().includes(q) ||
      i.user?.fullName?.toLowerCase().includes(q) ||
      i.user?.studentId?.toLowerCase().includes(q)
    );
  });

  const overdueCount = issues.filter((i) => i.status === "overdue").length;
  const activeCount  = issues.filter((i) => i.status === "active").length;

  /* ─── Fine / days calc for selected ─────────────────────── */
  const now = new Date();
  const selDueDate  = selected?.dueDate ? new Date(selected.dueDate) : null;
  const selDaysLeft = selDueDate ? Math.ceil((selDueDate - now) / (1000 * 60 * 60 * 24)) : 0;
  const selOverdue  = selDaysLeft < 0;
  const selFine     = selOverdue ? Math.abs(selDaysLeft) * 5 : 0;
  const selEarly    = selDaysLeft > 0;

  /* ─── Issue row ─────────────────────────────────────────── */
  const IssueRow = ({ item }) => {
    const daysLeft = item.dueDate
      ? Math.ceil((new Date(item.dueDate) - now) / (1000 * 60 * 60 * 24))
      : 0;
    const isOverdue = item.status === "overdue" || daysLeft < 0;
    const daysOverdue = isOverdue ? Math.abs(daysLeft) : 0;
    const fine = daysOverdue * 5;

    return (
      <View style={[styles.card, isOverdue && styles.cardOverdue]}>
        {/* Book & student info */}
        <View style={styles.cardTop}>
          <View style={[styles.bookIcon, { backgroundColor: isOverdue ? "#FFEBEE" : COLORS.primaryPale }]}>
            <Text style={{ fontSize: 22 }}>{getGenreEmoji(item.book?.genre)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle} numberOfLines={1}>{item.book?.title || "Unknown Book"}</Text>
            <Text style={styles.studentName}>{item.user?.fullName || "—"}</Text>
            <Text style={styles.studentId}>ID: {item.user?.studentId || "—"}</Text>
          </View>
          <View style={[styles.statusPill, {
            backgroundColor: isOverdue ? COLORS.statusOverdueBg : COLORS.statusActiveBg,
          }]}>
            <Text style={[styles.statusText, { color: isOverdue ? COLORS.red : COLORS.green }]}>
              {isOverdue ? "Overdue" : "Active"}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>Due: {formatDate(item.dueDate)}</Text>
          </View>
          {isOverdue && (
            <View style={[styles.dateChip, { backgroundColor: "#FFEBEE" }]}>
              <Ionicons name="warning-outline" size={11} color={COLORS.red} />
              <Text style={[styles.dateText, { color: COLORS.red, fontWeight: "700" }]}>
                {daysOverdue}d overdue · ৳{fine} fine
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => item.book?._id && router.push({ pathname: "/(admin)/book-detail", params: { id: item.book._id } })}
          >
            <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
            <Text style={styles.viewBtnText}>View Book</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.returnBtn, isOverdue && styles.returnBtnOverdue]}
            onPress={() => setSelected(item)}
          >
            <Ionicons name="return-down-back-outline" size={14} color="#fff" />
            <Text style={styles.returnBtnText}>
              {isOverdue ? `Return + ৳${fine} Fine` : "Allow Return"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Return Book" showBack />

      {/* SUMMARY STRIP */}
      <View style={styles.summaryStrip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{issues.length}</Text>
          <Text style={styles.stripLabel}>Total Out</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: "#FFA726" }]}>{activeCount}</Text>
          <Text style={styles.stripLabel}>Active</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, { color: "#EF5350" }]}>{overdueCount}</Text>
          <Text style={styles.stripLabel}>Overdue</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={15} color={COLORS.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search book, student name or ID…"
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={15} color={COLORS.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <IssueRow item={item} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchIssues(true)}
              colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={52} color={COLORS.green} />
              <Text style={styles.emptyTitle}>No pending returns</Text>
              <Text style={styles.emptyText}>All books are accounted for</Text>
            </View>
          }
        />
      )}

      {/* ── CONFIRM RETURN MODAL ─────────────────────────────── */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Return</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Book row */}
              <View style={styles.modalBookRow}>
                <View style={styles.modalBookIcon}>
                  <Text style={{ fontSize: 26 }}>{getGenreEmoji(selected?.book?.genre)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBookTitle} numberOfLines={2}>{selected?.book?.title}</Text>
                  <Text style={styles.modalBookSub}>{selected?.user?.fullName} · {selected?.user?.studentId}</Text>
                </View>
              </View>

              {/* Status banner */}
              {selOverdue ? (
                <View style={[styles.banner, { backgroundColor: "#FFEBEE", borderLeftColor: COLORS.red }]}>
                  <Ionicons name="warning-outline" size={20} color={COLORS.red} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bannerTitle, { color: COLORS.red }]}>
                      Overdue by {Math.abs(selDaysLeft)} day{Math.abs(selDaysLeft) !== 1 ? "s" : ""}
                    </Text>
                    <Text style={[styles.bannerSub, { color: COLORS.red }]}>Fine: ৳{selFine} (৳5/day)</Text>
                  </View>
                </View>
              ) : selEarly ? (
                <View style={[styles.banner, { backgroundColor: "#E8F5E9", borderLeftColor: COLORS.green }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} />
                  <Text style={[styles.bannerTitle, { color: COLORS.green }]}>
                    Early return — {selDaysLeft} day{selDaysLeft !== 1 ? "s" : ""} ahead
                  </Text>
                </View>
              ) : (
                <View style={[styles.banner, { backgroundColor: "#E3F2FD", borderLeftColor: COLORS.primary }]}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.bannerTitle, { color: COLORS.primary }]}>Returning on due date</Text>
                </View>
              )}

              {/* Detail rows */}
              <View style={styles.detailBox}>
                {[
                  { k: "Student",   v: selected?.user?.fullName },
                  { k: "Student ID",v: selected?.user?.studentId },
                  { k: "Book",      v: selected?.book?.title },
                  { k: "Issued On", v: formatDate(selected?.issuedDate || selected?.createdAt) },
                  { k: "Due Date",  v: formatDate(selected?.dueDate) },
                  { k: "Fine",      v: selFine > 0 ? `৳${selFine}` : "None", red: selFine > 0 },
                ].map((r) => (
                  <View key={r.k} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{r.k}</Text>
                    <Text style={[styles.detailVal, r.red && { color: COLORS.red }]}>{r.v || "—"}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, selOverdue && { backgroundColor: COLORS.red }]}
                  onPress={handleReturn}
                  disabled={returning}
                >
                  {returning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="return-down-back-outline" size={16} color="#fff" />
                      <Text style={styles.modalConfirmText}>
                        {selFine > 0 ? `Allow Return + ৳${selFine} Fine` : "Allow Return"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryStrip: {
    flexDirection: "row", backgroundColor: COLORS.indigoDark,
    paddingHorizontal: 20, paddingBottom: 14,
  },
  stripItem: { flex: 1, alignItems: "center" },
  stripVal: { fontSize: 22, fontWeight: "800", color: "#fff" },
  stripLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 2, fontWeight: "500" },
  stripDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },
  tabRow: {
    flexDirection: "row", backgroundColor: COLORS.white,
    marginHorizontal: 14, marginTop: 12, borderRadius: 12, padding: 3,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: "#fff" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11, marginHorizontal: 14,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 9,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 13, marginBottom: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: COLORS.red },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  bookIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bookTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  studentName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  studentId: { fontSize: 10, color: COLORS.textMuted },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "700" },
  dateRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  dateChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  dateText: { fontSize: 10, color: COLORS.textSecondary },
  actionRow: { flexDirection: "row", gap: 8 },
  viewBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 8,
  },
  viewBtnText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  returnBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLORS.teal, borderRadius: 10, paddingVertical: 9,
  },
  returnBtnOverdue: { backgroundColor: COLORS.red },
  returnBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyText: { fontSize: 12, color: COLORS.textSecondary },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  modalBookRow: {
    flexDirection: "row", gap: 12, alignItems: "center",
    backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 14,
  },
  modalBookIcon: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  modalBookTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  modalBookSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  banner: {
    flexDirection: "row", gap: 10, alignItems: "center",
    borderRadius: 12, padding: 12, marginBottom: 14, borderLeftWidth: 3,
  },
  bannerTitle: { fontSize: 13, fontWeight: "700" },
  bannerSub: { fontSize: 11, marginTop: 2 },
  detailBox: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 14 },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  detailKey: { fontSize: 12, color: COLORS.textSecondary },
  detailVal: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  modalActions: { flexDirection: "row", gap: 10, marginBottom: 8 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  modalConfirmBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: COLORS.teal, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  modalConfirmText: { fontSize: 12, fontWeight: "800", color: "#fff" },
});
