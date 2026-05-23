import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
  Image, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { sleep } from "../../lib/utils";
import api from "../../lib/api";

export default function Profile() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ active: 0, returned: 0, pending: 0, overdue: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [activeRes, historyRes, requestsRes] = await Promise.all([
        api.get("/books/my/active"),
        api.get("/books/my/history"),
        api.get("/books/my/requests"),
      ]);
      const active = activeRes.data || [];
      const history = historyRes.data || [];
      const requests = requestsRes.data || [];
      setStats({
        active: active.length,
        returned: history.length,
        pending: requests.filter((r) => r.status === "pending").length,
        overdue: active.filter((r) => r.status === "overdue").length,
      });
    } catch (e) {
      console.log("Profile stats error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const MENU_SECTIONS = [
    {
      title: "ACCOUNT",
      items: [
        { icon: "person-outline",           label: "Edit Profile",      sub: "Update your personal info",     color: "#E3F2FD", route: "/(tabs)/edit-profile" },
        { icon: "notifications-outline",    label: "Notifications",     sub: "Alerts and updates",            color: "#FFF8E1", route: "/(tabs)/notifications" },
        { icon: "shield-checkmark-outline", label: "Security",          sub: "Password & privacy",            color: "#E8F5E9", route: "/(tabs)/security" },
      ],
    },
    {
      title: "LIBRARY",
      items: [
        { icon: "library-outline",          label: "My Books",          sub: "Active, history & requests",    color: "#E8EAF6", route: "/(tabs)/my-books" },
        { icon: "heart-outline",            label: "Wishlist",          sub: "Books you want to read",        color: "#FCE4EC", route: "/(tabs)/wishlist" },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { icon: "help-circle-outline",      label: "Help & FAQ",        sub: "Common questions",              color: "#F3E5F5", route: "/(tabs)/help" },
        { icon: "information-circle-outline", label: "About",           sub: "BookStall v2.0",                color: "#E0F7FA", route: "/(tabs)/about" },
      ],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)}
          colors={[COLORS.primary]} tintColor={COLORS.primary} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/(tabs)/edit-profile")}>
            <Ionicons name="pencil-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* AVATAR + INFO */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/edit-profile")}
            activeOpacity={0.8}
          >
            {user?.profileImage
              ? <Image source={{ uri: user.profileImage }} style={{ width: 72, height: 72, borderRadius: 36 }} />
              : <Text style={{ fontSize: 32 }}>👤</Text>
            }
            <View style={styles.camBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.fullName || "Student"}</Text>
          <Text style={styles.dept}>{user?.department || "—"}</Text>
          <Text style={styles.studentId}>ID: {user?.studentId || "N/A"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.green} />
            <Text style={styles.verifiedText}>Verified Member</Text>
          </View>
        </View>

        {/* LIVE STATS */}
        <View style={styles.statsRow}>
          {[
            { val: stats.active,   label: "Active",   color: "#E3F2FD" },
            { val: stats.returned, label: "Returned",  color: "#E8F5E9" },
            { val: stats.pending,  label: "Pending",   color: "#FFF3E0" },
            { val: stats.overdue,  label: "Overdue",   color: "#FFEBEE" },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: s.color }]}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* MENU */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={17} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={COLORS.placeholder} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>BookStall v2.0 · PUB Campus Library</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 52, paddingBottom: 22, paddingHorizontal: 14,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  avatarWrap: { alignItems: "center", marginBottom: 18 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 10, position: "relative",
  },
  camBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff", elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "800", color: "#fff" },
  dept: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  studentId: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  email: { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 8, backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1, alignItems: "center", borderRadius: 11, paddingVertical: 10,
  },
  statVal: { fontSize: 18, fontWeight: "800", color: COLORS.primaryDark },
  statLabel: { fontSize: 8, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  section: { paddingHorizontal: 14, paddingTop: 18 },
  sectionTitle: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  menuSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFF5F5", borderRadius: 13, padding: 14,
    marginHorizontal: 14, marginTop: 20,
    borderWidth: 1, borderColor: "#FFEBEE",
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: COLORS.red },
  version: { textAlign: "center", fontSize: 10, color: COLORS.textMuted, marginTop: 14 },
});
