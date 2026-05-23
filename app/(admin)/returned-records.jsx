import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
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
  if (key === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (key === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "year")  return new Date(now.getFullYear(), 0, 1);
  return null;
}

export default function ReturnedRecords() {
  const [issues, setIssues]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]       = useState("month");
  const [query, setQuery]         = useState("");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const fetchReturned = useCallback(async (pg = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await api.get("/issues", {
        params: { page: pg, limit: PAGE_SIZE, status: "returned" },
      });
      const all = Array.isArray(data) ? data : (data.issues || []);
      if (pg === 1) setIssues(all);
      else setIssues((prev) => [...prev, ...all]);
      setTotalPages(data.totalPages || 1);
      setPage(pg);
    } catch (e) {
      console.log("ReturnedRecords fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else if (pg === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchReturned(1); }, []);

  const filtered = useMemo(() => {
    const from = getRange(period);
    return issues.filter((item) => {
      // filter by returnedDate for the period
      const refDate = item.returnedDate || item.createdAt;
      if (from && new Date(refDate) < from) return false;
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

  // Fine summary for filtered
  const totalFine = filtered.reduce((sum, i) => sum + (i.fine || 0), 0);
  const onTimeCount = filtered.filter((i) => (i.fine || 0) === 0).length;

  const ReturnCard = ({ item }) => {
    const fine = item.fine || 0;
    const hasFine = fine > 0;
    return (
      <View style={[styles.card, { borderLeftColor: hasFine ? COLORS.red : COLORS.green }]}>
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
            <Ionicons name="arrow-down-circle-outline" size={12} color={COLORS.green} />
            <Text style={[styles.dateText, { color: COLORS.green }]}>
              Returned: {formatDate(item.returnedDate)}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.dateText}>Due: {formatDate(item.dueDate)}</Text>
          </View>
        </View>
        <View style={styles.fineColumn}>
          {hasFine ? (
            <View style={styles.fineBadge}>
              <Text style={styles.fineLabel}>Fine</Text>
              <Text style={styles.fineValue}>৳{fine}</Text>
            </View>
          ) : (
            <View style={styles.onTimeBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
              <Text style={styles.onTimeText}>On Time</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Returned Records" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading return records…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader title="Returned Records" showBack />

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

      {/* SUMMARY STRIP */}
      <View style={styles.summaryStrip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{filtered.length}</Text>
          <Text style={styles.stripLabel}>Returned</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{onTimeCount}</Text>
          <Text style={styles.stripLabel}>On Time</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripVal, totalFine > 0 && { color: COLORS.red }]}>
            ৳{totalFine}
          </Text>
          <Text style={styles.stripLabel}>Total Fines</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ReturnCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReturned(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={() => {
          if (!loadingMore && page < totalPages) fetchReturned(page + 1);
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ marginVertical: 12 }} color={COLORS.primary} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="arrow-down-circle-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No return records found</Text>
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
  summaryStrip: {
    flexDirection: "row", backgroundColor: COLORS.indigoDark,
    marginHorizontal: 14, borderRadius: 13, padding: 12, marginBottom: 10,
  },
  stripItem: { flex: 1, alignItems: "center" },
  stripVal: { fontSize: 18, fontWeight: "800", color: "#fff" },
  stripLabel: { fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 1, fontWeight: "500" },
  stripDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.white, borderRadius: 13, padding: 13,
    marginBottom: 8, borderLeftWidth: 3,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { flex: 1 },
  bookTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 3 },
  studentName: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 5 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  dateText: { fontSize: 10, color: COLORS.textMuted },
  fineColumn: { alignItems: "center", justifyContent: "center", marginLeft: 8 },
  fineBadge: {
    alignItems: "center", backgroundColor: COLORS.statusOverdueBg,
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10,
  },
  fineLabel: { fontSize: 9, color: COLORS.red, fontWeight: "600" },
  fineValue: { fontSize: 13, fontWeight: "800", color: COLORS.red },
  onTimeBadge: { alignItems: "center", gap: 2 },
  onTimeText: { fontSize: 9, color: COLORS.green, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptySubtitle: { fontSize: 12, color: COLORS.textMuted },
});
