import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { sleep } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";

/*
  Backend notification types: "Due Reminder" | "Overdue Alert" | "New Arrival" | "Announcement"
  Backend `read` field: the toClient() helper sends { read: boolean }
*/
const TYPE_CONFIG = {
  "Due Reminder":   { icon: "alarm-outline",              bg: "#FFF8E1",  iconColor: COLORS.amber   },
  "Overdue Alert":  { icon: "warning-outline",            bg: "#FFEBEE",  iconColor: COLORS.red     },
  "New Arrival":    { icon: "book-outline",               bg: "#E8EAF6",  iconColor: COLORS.indigo  },
  "Announcement":   { icon: "notifications-outline",      bg: "#F3E5F5",  iconColor: COLORS.purple  },
  // Legacy / fallback keys
  approval:         { icon: "checkmark-circle-outline",   bg: "#E8F5E9",  iconColor: COLORS.green   },
  return:           { icon: "return-down-back-outline",   bg: COLORS.primaryPale, iconColor: COLORS.primary },
  general:          { icon: "notifications-outline",      bg: "#F3E5F5",  iconColor: COLORS.purple  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG["Announcement"];
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)      return "Just now";
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const router = useRouter();

  /* ─── Fetch ──────────────────────────────────────────── */
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/notifications");
      // Backend returns array with { read: boolean }
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch (e) {
      console.log("Notifications fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  /* ─── Mark single as read ────────────────────────────── */
  const markRead = async (id) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (_) {
      // Silently fail — next refresh will correct state
    }
  };

  /* ─── Mark all as read ───────────────────────────────── */
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/notifications/mark-all-read");
    } catch (e) {
      console.log("Mark all read error:", e.message);
    }
  };

  /* ─── Derived data ───────────────────────────────────── */
  const unreadCount  = notifications.filter((n) => !n.read).length;
  const todayItems   = notifications.filter((n) => (Date.now() - new Date(n.createdAt)) < 86400000);
  const earlierItems = notifications.filter((n) => (Date.now() - new Date(n.createdAt)) >= 86400000);

  /* ─── Render item ────────────────────────────────────── */
  const NotifItem = ({ item }) => {
    const cfg = getConfig(item.type);
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => markRead(item._id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title || "Notification"}
          </Text>
          <Text style={styles.itemMsg} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.itemTime}>{item.createdAt ? timeAgo(item.createdAt) : ""}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => "header"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotifications(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          notifications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={56} color={COLORS.placeholder} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>You'll see library updates and alerts here</Text>
            </View>
          ) : (
            <>
              {todayItems.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>TODAY</Text>
                  {todayItems.map((item) => <NotifItem key={item._id} item={item} />)}
                </>
              )}
              {earlierItems.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>EARLIER</Text>
                  {earlierItems.map((item) => <NotifItem key={item._id} item={item} />)}
                </>
              )}
            </>
          )
        }
      />
    </View>
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
  headerSub:   { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  markAllBtn: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  markAllTxt: { fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "600" },

  groupLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 7,
  },

  item: {
    flexDirection: "row", gap: 11, alignItems: "flex-start",
    backgroundColor: COLORS.white, borderRadius: 13,
    marginHorizontal: 14, marginBottom: 8, padding: 13,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconBox:    { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemTitle:  { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  itemMsg:    { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  itemTime:   { fontSize: 10, color: COLORS.placeholder, marginTop: 5 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 5 },

  empty: { alignItems: "center", paddingTop: 80, gap: 10, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  emptyText:  { fontSize: 12, color: COLORS.textSecondary, textAlign: "center" },
});
