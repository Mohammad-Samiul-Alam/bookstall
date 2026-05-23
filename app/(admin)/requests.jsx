import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, RefreshControl, ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { formatDate, sleep, getGenreEmoji } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";
import Loader from "../../components/Loader";

const TABS = ["Pending", "Approved", "Rejected"];

export default function AdminRequests() {
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);
  const router = useRouter();

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/requests");
      setAllRequests(Array.isArray(data) ? data : data.requests || []);
    } catch (e) {
      console.log("Admin requests fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, action) => {
    setActionId(id);
    try {
      await api.put(`/requests/${id}/${action}`);
      setAllRequests((prev) =>
        prev.map((r) => r._id === id
          ? { ...r, status: action === "approve" ? "approved" : "rejected" }
          : r)
      );
      Alert.alert(
        action === "approve" ? "✅ Approved" : "❌ Rejected",
        `Request has been ${action === "approve" ? "approved" : "rejected"}.`
      );
    } catch (e) {
      Alert.alert("Error", e.message || `Failed to ${action} request.`);
    } finally {
      setActionId(null);
    }
  };

  const filtered = allRequests.filter((r) => {
    if (activeTab === "Pending") return r.status === "pending";
    if (activeTab === "Approved") return r.status === "approved";
    return r.status === "rejected";
  });

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;

  const RequestCard = ({ item }) => (
    <View style={styles.card}>
      {/* USER */}
      <View style={styles.cardTop}>
        <View style={styles.userAvatar}>
          <Text style={{ fontSize: 17 }}>👨‍🎓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.user?.fullName || "Student"}</Text>
          <Text style={styles.userId}>ID: {item.user?.studentId || "—"}</Text>
        </View>
        <View style={[styles.statusPill, {
          backgroundColor: item.status === "pending" ? COLORS.statusPendingBg
            : item.status === "approved" ? COLORS.statusActiveBg
            : COLORS.statusOverdueBg,
        }]}>
          <Text style={[styles.statusText, {
            color: item.status === "pending" ? COLORS.statusPending
              : item.status === "approved" ? COLORS.statusActive
              : COLORS.statusOverdue,
          }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* BOOK */}
      <TouchableOpacity
        style={styles.bookRow}
        onPress={() => item.book?._id && router.push({ pathname: "/(admin)/book-detail", params: { id: item.book._id } })}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 22 }}>{getGenreEmoji(item.book?.genre)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.book?.title || "Unknown Book"}
          </Text>
          <Text style={styles.bookMeta}>
            Duration: {item.duration} day{item.duration !== 1 ? "s" : ""}
            {item.requestDate ? `  ·  ${formatDate(item.requestDate)}` : ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.placeholder} />
      </TouchableOpacity>

      {/* ACTIONS */}
      {item.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleAction(item._id, "reject")}
            disabled={actionId === item._id}
          >
            {actionId === item._id
              ? <ActivityIndicator size="small" color={COLORS.red} />
              : <>
                  <Ionicons name="close" size={14} color={COLORS.red} />
                  <Text style={styles.rejectText}>Reject</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleAction(item._id, "approve")}
            disabled={actionId === item._id}
          >
            {actionId === item._id
              ? <ActivityIndicator size="small" color={COLORS.green} />
              : <>
                  <Ionicons name="checkmark" size={14} color={COLORS.green} />
                  <Text style={styles.approveText}>Approve</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <AdminHeader title="Book Requests" />

      {/* TABS */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            {t === "Pending" && pendingCount > 0 && (
              <View style={[styles.tabBadge, activeTab === t && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Text style={styles.tabBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RequestCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} requests</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: "row", backgroundColor: COLORS.indigoDark,
    paddingHorizontal: 14, paddingBottom: 12, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  tabTextActive: { color: COLORS.indigoDark },
  tabBadge: {
    backgroundColor: COLORS.orange, borderRadius: 10,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  userName: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  userId: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "700" },
  bookRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.background, borderRadius: 10, padding: 10, marginBottom: 10,
  },
  bookTitle: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  bookMeta: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: COLORS.statusActiveBg, borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.green,
  },
  approveText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: COLORS.statusOverdueBg, borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.red,
  },
  rejectText: { fontSize: 12, fontWeight: "700", color: COLORS.red },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
});
