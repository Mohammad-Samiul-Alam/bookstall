import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { formatDate, sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

const PERIODS = [
  { key: "day",   label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
  { key: "all",   label: "All Time" },
];

function getRange(key) {
  const now = new Date();
  let from = null;
  if (key === "day") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (key === "week") {
    const day = now.getDay(); // 0=Sun
    from = new Date(now);
    from.setDate(now.getDate() - day);
    from.setHours(0, 0, 0, 0);
  } else if (key === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (key === "year") {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return from;
}

export default function IssuedRecords() {
  const router = useRouter();
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]     = useState("month");
  const [query, setQuery]       = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const fetchIssues = useCallback(async (pg = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await api.get("/issues", {
        params: { page: pg, limit: PAGE_SIZE },
      });
      const all = Array.isArray(data) ? data : (data.issues || []);
      if (pg === 1) setIssues(all);
      else setIssues((prev) => [...prev, ...all]);
      setTotalPages(data.totalPages || 1);
      setPage(pg);
    } catch (e) {
      console.log("IssuedRecords fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else if (pg === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchIssues(1); }, []);

  /* ── local filter by period + search ── */
  const filtered = useMemo(() => {
    const from = getRange(period);
    return issues.filter((item) => {
      if (from && new Date(item.createdAt) < from) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          item.book?.title?.toLowerCase().includes(q) ||
          item.user?.fullName?.toLowerCase().includes(q) ||
          item.user?.studentId?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, period, query]);

  const statusColor = (s) =>
    s === "active"   ? COLORS.green :
    s === "overdue"  ? COLORS.red   :
    s === "returned" ? COLORS.primary : COLORS.textMuted;

  const statusBg = (s) =>
    s === "active"   ? COLORS.statusActiveBg   :
    s === "overdue"  ? COLORS.statusOverdueBg  :
    s === "returned" ? COLORS.statusReturnedBg : "#F5F5F5";

  const IssueCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.book?.title || "Unknown Book"}
        </Text>
        <Text style={styles.studentName}>
          👤 {item.user?.fullName || "—"}
          {item.user?.studentId ? `  ·  ${item.user.studentId}` : ""}
        </Text>
        <View style={styles.dateRow}>
          <Ionicons name="arrow-up-circle-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>Issued: {formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>Due: {formatDate(item.dueDate)}</Text>
        </View>
        {item.returnedDate && (
          <View style={styles.dateRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.green} />
            <Text style={[styles.dateText, { color: COLORS.green }]}>
              Returned: {formatDate(item.returnedDate)}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusBg(item.status) }]}>
        <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
          {(item.status || "—").toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Issued Records" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading issued records…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader title="Issued Records" showBack />

      {/* PERIOD TABS */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.chip, period === p.key && styles.chipActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.chipText, period === p.key && styles.chipTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={14} color={COLORS.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search book, student…"
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={14} color={COLORS.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* COUNT BADGE */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <IssueCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchIssues(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={() => {
          if (!loadingMore && page < totalPages) fetchIssues(page + 1);
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ marginVertical: 12 }} color={COLORS.primary} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No issued records found</Text>
            <Text style={styles.emptySubtitle}>Try a different period or search term</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.textMuted, marginTop: 10, fontSize: 13 },
  periodRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  chipActive: { backgroundColor: COLORS.indigoDark },
  chipText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: "#fff" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 9,
    marginHorizontal: 14, marginVertical: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  countRow: { paddingHorizontal: 16, marginBottom: 6 },
  countText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.white, borderRadius: 13, padding: 13,
    marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { flex: 1 },
  bookTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 3 },
  studentName: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 5 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  dateText: { fontSize: 10, color: COLORS.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginLeft: 8 },
  statusText: { fontSize: 9, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptySubtitle: { fontSize: 12, color: COLORS.textMuted },
});
