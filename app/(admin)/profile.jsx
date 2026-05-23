import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, RefreshControl, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

export default function AdminProfile() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ totalBooks: 0, totalMembers: 0, totalIssued: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/reports/dashboard");
      setStats({
        totalBooks:   data.totalBooks   ?? 0,
        totalMembers: data.totalStudents ?? 0,
        totalIssued:  data.activeIssues  ?? 0,
      });
    } catch (e) {
      console.log("Admin profile stats error:", e.message);
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

  const TOOL_ITEMS = [
    { icon: "bar-chart-outline",       label: "Reports & Analytics",  color: "#E3F2FD", route: "/(admin)/reports" },
    { icon: "megaphone-outline",       label: "Send Notification",    color: "#FFF8E1", route: "/(admin)/send-notification" },
    { icon: "person-add-outline",      label: "Register User",        color: "#E8F5E9", route: "/(admin)/register-user" },
  ];

  const ACCOUNT_ITEMS = [
    { icon: "pencil-outline",          label: "Edit Profile",         color: "#E8EAF6", route: "/(admin)/edit-admin-profile" },
    { icon: "lock-closed-outline",     label: "Change Password",      color: "#FCE4EC", route: "/(admin)/security" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Admin Profile" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* PROFILE HERO */}
        <View style={styles.hero}>
          <Text style={styles.panelLabel}>⚙️  ADMIN PANEL</Text>
          <View style={styles.heroRow}>
            <TouchableOpacity style={styles.avatarBox} onPress={() => router.push("/(admin)/edit-admin-profile")} activeOpacity={0.8}>
              {user?.profileImage
                ? <Image source={{ uri: user.profileImage }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                : <Text style={{ fontSize: 28 }}>👨‍💼</Text>
              }
              <View style={styles.camBadge}>
                <Ionicons name="camera" size={9} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{user?.fullName || "Admin"}</Text>
              <Text style={styles.heroRole}>{user?.designation || "Library Administrator"}</Text>
              <View style={styles.accessBadge}>
                <Ionicons name="lock-closed" size={10} color={COLORS.amber} />
                <Text style={styles.accessText}>Admin Access</Text>
              </View>
            </View>
          </View>

          {/* LIVE STATS — fetched from API */}
          <View style={styles.statsCard}>
            {[
              { val: stats.totalBooks,   label: "Books" },
              { val: stats.totalMembers, label: "Members" },
              { val: stats.totalIssued,  label: "Issued" },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.statItem, i < arr.length - 1 && styles.statDivider]}>
                <Text style={styles.statVal}>{s.val.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ADMIN TOOLS */}
        <MenuGroup title="ADMIN TOOLS" items={TOOL_ITEMS} router={router} />
        <MenuGroup title="ACCOUNT"     items={ACCOUNT_ITEMS} router={router} />

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>BookStall v2.0 · PUB Campus Library · Admin Build</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MenuGroup({ title, items, router }) {
  return (
    <View style={styles.menuGroup}>
      <Text style={styles.menuGroupTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, i, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={17} color={COLORS.indigoDark} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={15} color={COLORS.placeholder} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.indigoDark,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20,
    marginBottom: 6,
  },
  panelLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.55)", letterSpacing: 1, marginBottom: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarBox: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    position: "relative", overflow: "visible",
  },
  camBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.amber, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  heroName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  heroRole: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 },
  accessBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 7, backgroundColor: "rgba(249,168,37,0.2)",
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(249,168,37,0.4)",
  },
  accessText: { fontSize: 10, color: COLORS.amber, fontWeight: "700" },
  statsCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    flexDirection: "row", overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statDivider: { borderRightWidth: 1, borderRightColor: COLORS.borderLight },
  statVal: { fontSize: 22, fontWeight: "800", color: COLORS.primaryDark },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3, fontWeight: "500" },
  menuGroup: { paddingHorizontal: 14, paddingTop: 16 },
  menuGroupTitle: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase",
  },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: 14, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFF5F5", borderRadius: 13, padding: 14,
    marginHorizontal: 14, marginTop: 20,
    borderWidth: 1, borderColor: "#FFEBEE",
  },
  signOutText: { fontSize: 14, fontWeight: "700", color: COLORS.red },
  version: { textAlign: "center", fontSize: 10, color: COLORS.textMuted, marginTop: 14 },
});
