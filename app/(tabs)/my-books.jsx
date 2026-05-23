import {
  View, Text, TouchableOpacity, FlatList,
  RefreshControl, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { formatDate, sleep, getStatusColor, getGenreEmoji } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";

const TABS = ["Active", "History", "Requests"];

export default function MyBooks() {
  const [activeTab, setActiveTab] = useState("Active");
  const [data, setData] = useState({ Active: [], History: [], Requests: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Return modal state
  const [returnModal, setReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returning, setReturning] = useState(false);

  const router = useRouter();

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [activeRes, historyRes, requestsRes] = await Promise.all([
        api.get("/books/my/active"),
        api.get("/books/my/history"),
        api.get("/books/my/requests"),
      ]);
      setData({
        Active:   activeRes.data   || [],
        History:  historyRes.data  || [],
        Requests: requestsRes.data || [],
      });
    } catch (e) {
      console.log("MyBooks fetch error:", e.message);
    } finally {
      if (isRefresh) {
        await sleep(500);
        setRefreshing(false);
      } else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  /* ─── Early Return ──────────────────────────────────────── */
  const openReturnModal = (item) => {
    setReturnTarget(item);
    setReturnModal(true);
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    setReturning(true);
    try {
      const { data: res } = await api.post(`/books/my/return/${returnTarget.issueId}`);
      setReturnModal(false);
      setReturnTarget(null);
      const fineMsg = res.fine > 0
        ? `\n\nOverdue fine: ৳${res.fine} (${res.daysOverdue} day${res.daysOverdue !== 1 ? "s" : ""})`
        : res.isEarly
          ? `\n\nReturned ${res.daysEarly} day${res.daysEarly !== 1 ? "s" : ""} early — thank you!`
          : "\n\nReturned on time — no fine!";
      Alert.alert("✅ Book Returned", `"${returnTarget.title}" has been returned.${fineMsg}`);
      fetchAll();
    } catch (err) {
      Alert.alert("Error", err.message || "Could not process the return.");
    } finally {
      setReturning(false);
    }
  };

  /* ─── Status pill ───────────────────────────────────────── */
  const StatusPill = ({ status }) => {
    const colors = getStatusColor(status, COLORS);
    return (
      <View style={[styles.pill, { backgroundColor: colors.bg }]}>
        <Text style={[styles.pillText, { color: colors.text }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  /* ─── Book card ─────────────────────────────────────────── */
  const BookItem = ({ item }) => {
    const isOverdue = item.status === "overdue";
    const isActive = item.status === "active" || isOverdue;

    // Compute days info for active books
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    const now = new Date();
    const daysLeft = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;

    return (
      <TouchableOpacity
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => item.bookId && router.push({ pathname: "/(tabs)/book-detail", params: { id: item.bookId } })}
        activeOpacity={0.88}
      >
        <View style={[styles.cardIcon, { backgroundColor: isOverdue ? "#FFEBEE" : COLORS.primaryPale }]}>
          <Text style={{ fontSize: 24 }}>{getGenreEmoji(item.genre)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardSub}>{item.author}</Text>
          {item.dueDate && (
            <Text style={[styles.cardMeta, isOverdue && { color: COLORS.red, fontWeight: "600" }]}>
              {isOverdue ? "⚠️ " : daysLeft !== null && daysLeft <= 3 ? "🔴 " : "📅 "}
              {isOverdue
                ? `Overdue · Due ${formatDate(item.dueDate)}`
                : daysLeft === 0 ? "Due today!"
                : daysLeft < 0 ? `Overdue (${Math.abs(daysLeft)}d)`
                : `Due ${formatDate(item.dueDate)} (${daysLeft}d left)`
              }
            </Text>
          )}
          {item.returnDate && (
            <Text style={styles.cardMeta}>✅ Returned: {formatDate(item.returnDate)}</Text>
          )}
          {item.requestedDate && (
            <Text style={styles.cardMeta}>🕐 Requested: {formatDate(item.requestedDate)}</Text>
          )}
          {item.fine > 0 && (
            <Text style={{ fontSize: 10, color: COLORS.red, fontWeight: "700", marginTop: 2 }}>
              Fine: ৳{item.fine}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <StatusPill status={item.status} />
          {isActive && item.issueId && (
            <TouchableOpacity
              style={styles.returnBtn}
              onPress={(e) => { e.stopPropagation?.(); openReturnModal(item); }}
            >
              <Ionicons name="return-down-back-outline" size={11} color={COLORS.teal} />
              <Text style={styles.returnBtnText}>Return</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Compute days overdue/early for return modal
  const modalDueDate = returnTarget?.dueDate ? new Date(returnTarget.dueDate) : null;
  const modalNow = new Date();
  const modalDaysLeft = modalDueDate ? Math.ceil((modalDueDate - modalNow) / (1000 * 60 * 60 * 24)) : 0;
  const modalIsEarly = modalDaysLeft > 0;
  const modalIsOverdue = modalDaysLeft < 0;
  const modalFine = modalIsOverdue ? Math.abs(modalDaysLeft) * 5 : 0;

  const overdueCount = data.Active.filter((i) => i.status === "overdue").length;
  const pendingCount = data.Requests.filter((i) => i.status === "pending").length;

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Books</Text>
        <Text style={styles.headerSub}>Track your library activity</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryVal}>{data.Active.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={[styles.summaryChip, overdueCount > 0 && { borderLeftColor: COLORS.red }]}>
            <Text style={[styles.summaryVal, overdueCount > 0 && { color: COLORS.red }]}>{overdueCount}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryVal}>{data.History.length}</Text>
            <Text style={styles.summaryLabel}>Returned</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, pendingCount > 0 && { color: COLORS.orange }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const badge = t === "Active" ? data.Active.length
            : t === "Requests" ? pendingCount : null;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              {badge > 0 && (
                <View style={[styles.tabBadge, activeTab === t && { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                  <Text style={styles.tabBadgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={data[activeTab]}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookItem item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === "Active" ? "You have no active issues"
                : activeTab === "History" ? "No return history yet"
                : "No book requests found"}
            </Text>
            {activeTab !== "History" && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/browse")}>
                <Text style={styles.emptyLink}>Browse books →</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* ── RETURN CONFIRMATION MODAL ──────────────────────── */}
      <Modal visible={returnModal} transparent animationType="slide" onRequestClose={() => setReturnModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Return Book</Text>
              <TouchableOpacity onPress={() => setReturnModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Book info */}
              <View style={styles.modalBookRow}>
                <View style={styles.modalBookIcon}>
                  <Text style={{ fontSize: 26 }}>{getGenreEmoji(returnTarget?.genre)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBookTitle} numberOfLines={2}>{returnTarget?.title}</Text>
                  <Text style={styles.modalBookAuthor}>{returnTarget?.author}</Text>
                </View>
              </View>

              {/* Status banner */}
              {modalIsEarly && (
                <View style={[styles.modalBanner, { backgroundColor: "#E8F5E9", borderLeftColor: COLORS.green }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalBannerTitle, { color: COLORS.green }]}>
                      Returning {modalDaysLeft} day{modalDaysLeft !== 1 ? "s" : ""} early
                    </Text>
                    <Text style={[styles.modalBannerSub, { color: COLORS.green }]}>
                      No fine — great job returning on time!
                    </Text>
                  </View>
                </View>
              )}

              {!modalIsEarly && !modalIsOverdue && (
                <View style={[styles.modalBanner, { backgroundColor: "#E3F2FD", borderLeftColor: COLORS.primary }]}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.modalBannerTitle, { color: COLORS.primary }]}>Returning on due date</Text>
                </View>
              )}

              {modalIsOverdue && (
                <View style={[styles.modalBanner, { backgroundColor: "#FFEBEE", borderLeftColor: COLORS.red }]}>
                  <Ionicons name="warning-outline" size={20} color={COLORS.red} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalBannerTitle, { color: COLORS.red }]}>
                      Overdue by {Math.abs(modalDaysLeft)} day{Math.abs(modalDaysLeft) !== 1 ? "s" : ""}
                    </Text>
                    <Text style={[styles.modalBannerSub, { color: COLORS.red }]}>
                      Fine: ৳{modalFine} (৳5/day)
                    </Text>
                  </View>
                </View>
              )}

              {/* Info rows */}
              <View style={styles.modalInfo}>
                {[
                  { k: "Due Date",     v: returnTarget?.dueDate ? formatDate(returnTarget.dueDate) : "—" },
                  { k: "Issued",       v: returnTarget?.issuedDate ? formatDate(returnTarget.issuedDate) : "—" },
                  { k: "Fine Amount",  v: modalFine > 0 ? `৳${modalFine}` : "None", red: modalFine > 0 },
                ].map((r) => (
                  <View key={r.k} style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoKey}>{r.k}</Text>
                    <Text style={[styles.modalInfoVal, r.red && { color: COLORS.red }]}>{r.v}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.modalNote}>
                Once confirmed, the book will be marked as returned and availability will be restored.
              </Text>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReturnModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, modalIsOverdue && { backgroundColor: COLORS.red }]}
                  onPress={handleReturn}
                  disabled={returning}
                >
                  {returning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="return-down-back-outline" size={16} color="#fff" />
                      <Text style={styles.modalConfirmText}>Confirm Return</Text>
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
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2, marginBottom: 12 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryChip: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10,
    padding: 8, alignItems: "center", borderLeftWidth: 2, borderLeftColor: "rgba(255,255,255,0.3)",
  },
  summaryVal: { fontSize: 16, fontWeight: "800", color: "#fff" },
  summaryLabel: { fontSize: 8, color: "rgba(255,255,255,0.7)", marginTop: 1, fontWeight: "500" },
  tabBar: {
    flexDirection: "row", backgroundColor: COLORS.white,
    borderRadius: 12, padding: 3, margin: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  tab: {
    flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9,
    flexDirection: "row", justifyContent: "center", gap: 5,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    backgroundColor: COLORS.statusPendingBg, borderRadius: 10,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabBadgeText: { fontSize: 9, fontWeight: "800", color: COLORS.orange },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 13, padding: 12, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardOverdue: {
    borderLeftWidth: 3, borderLeftColor: COLORS.red,
    shadowColor: COLORS.red,
  },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  cardSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  cardMeta: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 10, fontWeight: "700" },
  returnBtn: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#E0F7FA", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 4,
    borderWidth: 1, borderColor: "#B2EBF2",
  },
  returnBtnText: { fontSize: 9, fontWeight: "700", color: COLORS.teal },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center" },
  emptyLink: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "85%",
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
  modalBookAuthor: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  modalBanner: {
    flexDirection: "row", gap: 10, alignItems: "center",
    borderRadius: 12, padding: 12, marginBottom: 14,
    borderLeftWidth: 3,
  },
  modalBannerTitle: { fontSize: 13, fontWeight: "700" },
  modalBannerSub: { fontSize: 11, marginTop: 2 },
  modalInfo: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  modalInfoKey: { fontSize: 12, color: COLORS.textSecondary },
  modalInfoVal: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  modalNote: {
    fontSize: 10, color: COLORS.textSecondary, marginBottom: 16,
    textAlign: "center", lineHeight: 15,
  },
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
  modalConfirmText: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
