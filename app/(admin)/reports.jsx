import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji, formatDate, sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

const PERIODS = [
  { key: "week",  label: "This Week"  },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year"  },
];

export default function Reports() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [overdue, setOverdue]     = useState([]);
  const [topBooks, setTopBooks]   = useState([]);
  const [period, setPeriod]       = useState("month");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashRes, overdueRes] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/reports/overdue"),
      ]);
      setDashboard(dashRes.data);
      const overdueList = Array.isArray(overdueRes.data)
        ? overdueRes.data
        : overdueRes.data?.issues || [];
      setOverdue(overdueList);
      setTopBooks(dashRes.data?.topBooks || []);
    } catch (e) {
      console.log("Reports fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Pick issued/returned counts based on active period
  const issuedCount = period === "week"
    ? (dashboard?.issuedThisWeek  ?? 0)
    : period === "year"
    ? (dashboard?.issuedThisYear  ?? 0)
    : (dashboard?.issuedThisMonth ?? 0);

  const returnedCount = period === "week"
    ? (dashboard?.returnedThisWeek  ?? 0)
    : period === "year"
    ? (dashboard?.returnedThisYear  ?? 0)
    : (dashboard?.returnedThisMonth ?? 0);

  // Build bar chart from monthly data
  const monthly    = dashboard?.monthlyStats || [];
  const maxIssued  = Math.max(...monthly.map((m) => m.issued || 0), 1);

  const SummaryCard = ({ value, label, icon, color, textColor, route }) => (
    <TouchableOpacity
      style={[styles.summaryCard, { borderTopColor: color, borderTopWidth: 3 }]}
      onPress={() => route && router.push(route)}
      activeOpacity={route ? 0.75 : 1}
    >
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={[styles.summaryVal, { color: textColor || COLORS.indigo }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AdminHeader title="Reports & Analytics" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Loading reports…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Reports & Analytics" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* PERIOD SELECTOR */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PERIOD STATS ROW */}
        <View style={styles.periodStatsRow}>
          <TouchableOpacity
            style={styles.periodStatCard}
            onPress={() => router.push("/(admin)/issued-records")}
            activeOpacity={0.78}
          >
            <Text style={styles.periodStatIcon}>📤</Text>
            <Text style={[styles.periodStatVal, { color: COLORS.orange }]}>{issuedCount}</Text>
            <Text style={styles.periodStatLabel}>Issued</Text>
          </TouchableOpacity>
          <View style={styles.periodStatDivider} />
          <TouchableOpacity
            style={styles.periodStatCard}
            onPress={() => router.push("/(admin)/returned-records")}
            activeOpacity={0.78}
          >
            <Text style={styles.periodStatIcon}>📥</Text>
            <Text style={[styles.periodStatVal, { color: COLORS.green }]}>{returnedCount}</Text>
            <Text style={styles.periodStatLabel}>Returned</Text>
          </TouchableOpacity>
        </View>

        {/* SUMMARY GRID */}
        <View style={styles.summaryGrid}>
          <SummaryCard icon="📚" value={dashboard?.totalBooks   ?? 0} label="Total Books"   color={COLORS.primary} textColor={COLORS.primary} />
          <SummaryCard icon="📤" value={dashboard?.activeIssues ?? 0} label="Active Issues" color={COLORS.orange}  textColor={COLORS.orange}
            route="/(admin)/issued-records" />
          <SummaryCard icon="⚠️" value={dashboard?.overdueIssues ?? 0} label="Overdue"      color={COLORS.red}     textColor={COLORS.red} />
          <SummaryCard icon="🎓" value={dashboard?.totalStudents ?? 0} label="Students"     color={COLORS.indigo}  textColor={COLORS.indigo}
            route="/(admin)/users" />
        </View>

        {/* MONTHLY BAR CHART */}
        {monthly.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📊 Monthly Issues (Last 6 months)</Text>
            <View style={styles.barContainer}>
              {monthly.map((d, i) => (
                <View key={d.month || i} style={styles.barWrap}>
                  <Text style={styles.barValue}>{d.issued || 0}</Text>
                  <View style={[styles.bar, {
                    height: Math.max(((d.issued || 0) / maxIssued) * 90, 4),
                    backgroundColor: i === monthly.length - 1 ? COLORS.indigo : COLORS.primaryPale,
                  }]} />
                  <Text style={styles.barLabel}>{d.month || ""}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* OVERDUE LIST */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚠️ Overdue Books ({overdue.length})</Text>
          </View>
          {overdue.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.green} />
              <Text style={styles.emptySectionText}>No overdue books — great!</Text>
            </View>
          ) : (
            overdue.slice(0, 10).map((item) => {
              const days = Math.ceil((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24));
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.overdueRow}
                  onPress={() => item.book?._id && router.push({ pathname: "/(admin)/book-detail", params: { id: item.book._id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.overdueIcon}>
                    <Text style={{ fontSize: 18 }}>📕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.overdueBook} numberOfLines={1}>
                      {item.book?.title || "Unknown Book"}
                    </Text>
                    <Text style={styles.overdueUser}>
                      {item.user?.fullName || "—"} · {item.user?.studentId || "—"}
                    </Text>
                    <Text style={styles.overdueDue}>Due: {formatDate(item.dueDate)}</Text>
                  </View>
                  <View style={styles.fineBox}>
                    <Text style={styles.fineDays}>{days}d</Text>
                    <Text style={styles.fineAmt}>৳{(item.fine || days * 5)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* TOP BOOKS */}
        {topBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Most Borrowed</Text>
            {topBooks.slice(0, 5).map((b, i) => (
              <TouchableOpacity
                key={b._id || i}
                style={styles.rankRow}
                onPress={() => b._id && router.push({ pathname: "/(admin)/book-detail", params: { id: b._id } })}
                activeOpacity={0.8}
              >
                <Text style={styles.rank}>#{i + 1}</Text>
                <Text style={{ fontSize: 20 }}>{getGenreEmoji(b.genre)}</Text>
                <Text style={styles.rankTitle} numberOfLines={1}>{b.title}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{b.borrowCount || b.count || 0}×</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  periodChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 1,
  },
  periodChipActive: { backgroundColor: COLORS.indigo },
  periodText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  periodTextActive: { color: "#fff" },

  periodStatsRow: {
    flexDirection: "row", backgroundColor: COLORS.white,
    marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 14,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  periodStatCard: { flex: 1, alignItems: "center" },
  periodStatIcon: { fontSize: 22, marginBottom: 4 },
  periodStatVal:  { fontSize: 26, fontWeight: "800" },
  periodStatLabel:{ fontSize: 10, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  periodStatDivider: { width: 1, backgroundColor: COLORS.borderLight, marginVertical: 4 },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  summaryCard: {
    width: "47%", backgroundColor: COLORS.white, borderRadius: 13, padding: 12,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  summaryIcon:  { fontSize: 20, marginBottom: 4 },
  summaryVal:   { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },

  chartCard: {
    backgroundColor: COLORS.white, borderRadius: 13, margin: 14, padding: 14,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  chartTitle:    { fontSize: 12, fontWeight: "700", color: COLORS.textDark, marginBottom: 14 },
  barContainer:  { flexDirection: "row", alignItems: "flex-end", gap: 5, height: 120 },
  barWrap:       { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3 },
  barValue:      { fontSize: 9, color: COLORS.textSecondary, fontWeight: "600" },
  bar:           { width: "85%", borderRadius: 4 },
  barLabel:      { fontSize: 9, color: COLORS.textSecondary },

  section:        { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8 },
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle:   { fontSize: 13, fontWeight: "800", color: COLORS.textDark },
  emptySection:   {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.statusActiveBg, borderRadius: 12, padding: 14,
  },
  emptySectionText: { fontSize: 12, color: COLORS.green, fontWeight: "600" },

  overdueRow: {
    flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 11, marginBottom: 7,
    borderLeftWidth: 3, borderLeftColor: COLORS.red,
    shadowColor: COLORS.red, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 1,
  },
  overdueIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center" },
  overdueBook:  { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  overdueUser:  { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  overdueDue:   { fontSize: 10, color: COLORS.red, marginTop: 1, fontWeight: "500" },
  fineBox:      { alignItems: "center", backgroundColor: "#FFEBEE", borderRadius: 8, padding: 6 },
  fineDays:     { fontSize: 12, fontWeight: "800", color: COLORS.red },
  fineAmt:      { fontSize: 9, color: COLORS.red, fontWeight: "600" },

  rankRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 10, marginBottom: 7,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  rank:       { fontSize: 11, fontWeight: "700", color: COLORS.indigo, width: 24 },
  rankTitle:  { flex: 1, fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  countBadge: { backgroundColor: "#E8EAF6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  countText:  { fontSize: 10, fontWeight: "700", color: COLORS.indigo },
});
