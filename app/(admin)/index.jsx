import {
  View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { sleep, formatDate } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";
import AdminHeader from "../../components/AdminHeader";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/reports/dashboard");
      setStats(data);
    } catch (e) {
      console.log("Dashboard error:", e.message);
    } finally {
      if (isRefresh) { await sleep(600); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <Loader />;

  /* ─── Stat card → route mapping ────────────────────────── */
  const statCards = [
    {
      icon: "📚", label: "Total Books",   value: stats?.totalBooks     ?? 0,
      color: "#E3F2FD", textColor: COLORS.primary,
      route: "/(admin)/books",
    },
    // {
    //   icon: "✅", label: "Available",     value: stats?.totalAvailable ?? 0,
    //   color: "#E8F5E9", textColor: COLORS.green,
    //   route: "/(admin)/books",
    // },
    {
      icon: "📤", label: "Active Issues", value: stats?.activeIssues   ?? 0,
      color: "#FFF3E0", textColor: COLORS.orange,
      route: "/(admin)/reports",
      routeParams: { filter: "active" },
    },
    {
      icon: "⚠️", label: "Overdue",       value: stats?.overdueIssues  ?? 0,
      color: "#FFEBEE", textColor: COLORS.red,
      route: "/(admin)/reports",
      routeParams: { filter: "overdue" },
    },
    {
      icon: "⏳", label: "Pending Req.",  value: stats?.pendingRequests ?? 0,
      color: "#F3E5F5", textColor: COLORS.purple,
      route: "/(admin)/requests",
    },
    {
      icon: "🎓", label: "Students",      value: stats?.totalStudents  ?? 0,
      color: "#E8EAF6", textColor: COLORS.indigo,
      route: "/(admin)/users",
    },
  ];

  const quickActions = [
    { icon: "book-outline",              label: "Add Book",      color: "#E3F2FD", route: "/(admin)/add-book" },
    { icon: "person-add-outline",        label: "Register User", color: "#E8F5E9", route: "/(admin)/register-user" },
    { icon: "arrow-up-circle-outline",   label: "Issue Book",    color: "#FFF3E0", route: "/(admin)/issue-book" },
    { icon: "arrow-down-circle-outline", label: "Return Book",   color: "#FCE4EC", route: "/(admin)/return-book" },
    { icon: "notifications-outline",     label: "Notify Users",  color: "#F3E5F5", route: "/(admin)/send-notification" },
    { icon: "bar-chart-outline",         label: "Reports",       color: "#E8EAF6", route: "/(admin)/reports" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader
        title="Admin Dashboard"
        rightAction={
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push("/(admin)/send-notification")}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* WELCOME BANNER */}
        <View style={styles.welcomeBanner}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{user?.fullName} 👋</Text>
            {user?.designation && <Text style={styles.designation}>{user.designation}</Text>}
          </View>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        {/* ── LIVE STATS GRID — each card tappable ─────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionSub}>Live data · tap to explore</Text>
        </View>
        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.statCard, { backgroundColor: s.color }]}
              onPress={() => router.push(s.route)}
              activeOpacity={0.78}
            >
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.textColor }]}>
                {(s.value).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              {/* small tap hint arrow */}
              <View style={styles.statArrow}>
                <Ionicons name="chevron-forward" size={9} color={s.textColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* THIS MONTH — each item tappable */}
        <View style={styles.monthCard}>
          <Text style={styles.monthTitle}>📅 This Month</Text>
          <View style={styles.monthRow}>
            <MonthItem
              value={stats?.issuedThisMonth  ?? 0}
              label="Issued"
              route="/(admin)/issued-records"
              router={router}
            />
            <View style={styles.monthDivider} />
            <MonthItem
              value={stats?.returnedThisMonth ?? 0}
              label="Returned"
              route="/(admin)/returned-records"
              router={router}
            />
            <View style={styles.monthDivider} />
            <MonthItem
              value={stats?.totalAdmins ?? 0}
              label="Admins"
              route="/(admin)/admins-list"
              router={router}
            />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: a.color }]}
              onPress={() => router.push(a.route)}
              activeOpacity={0.8}
            >
              <Ionicons name={a.icon} size={26} color={COLORS.indigoDark} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT ACTIVITY */}
        {(stats?.recentIssues || []).length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/reports")}>
                <Text style={styles.seeAll}>View all</Text>
              </TouchableOpacity>
            </View>
            {stats.recentIssues.map((issue) => (
              <TouchableOpacity
                key={issue._id}
                style={styles.activityRow}
                onPress={() => issue.book?._id && router.push({ pathname: "/(admin)/book-detail", params: { id: issue.book._id } })}
                activeOpacity={0.8}
              >
                <View style={styles.activityIcon}>
                  <Text style={{ fontSize: 16 }}>📤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityBook} numberOfLines={1}>
                    {issue.book?.title || "Unknown Book"}
                  </Text>
                  <Text style={styles.activityUser}>{issue.user?.fullName || "Unknown User"}</Text>
                </View>
                <Text style={styles.activityDate}>{formatDate(issue.createdAt)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function MonthItem({ value, label, route, router }) {
  return (
    <TouchableOpacity
      style={styles.monthItem}
      onPress={() => router.push(route)}
      activeOpacity={0.7}
    >
      <Text style={styles.monthValue}>{value}</Text>
      <Text style={styles.monthLabel}>{label}</Text>
      <View style={styles.monthArrow}>
        <Ionicons name="chevron-forward" size={9} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notifBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  welcomeBanner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  welcomeText: { fontSize: 11, color: COLORS.textMuted },
  welcomeName: { fontSize: 17, fontWeight: "800", color: COLORS.textDark, marginTop: 2 },
  designation: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  adminBadge: { backgroundColor: COLORS.indigoDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  adminBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  sectionSub: { fontSize: 10, color: COLORS.textMuted },
  seeAll: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  statCard: {
    width: "30.5%", borderRadius: 14, padding: 12, alignItems: "center",
    position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 9, color: COLORS.textSecondary, textAlign: "center", marginTop: 3, fontWeight: "500" },
  statArrow: { position: "absolute", top: 6, right: 6 },
  monthCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    marginHorizontal: 16, marginTop: 16, padding: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  monthTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 14 },
  monthRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  monthItem: { alignItems: "center" },
  monthArrow: { marginTop: 2 },
  monthValue: { fontSize: 26, fontWeight: "800", color: COLORS.primary },
  monthLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3, fontWeight: "500" },
  monthDivider: { width: 1, height: 36, backgroundColor: COLORS.borderLight },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  actionCard: {
    width: "30.5%", borderRadius: 14, padding: 14, alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  actionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.indigoDark, textAlign: "center" },
  activityRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center",
  },
  activityBook: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  activityUser: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  activityDate: { fontSize: 10, color: COLORS.textMuted },
});
