import {
  View, Text, TouchableOpacity, ScrollView,
  RefreshControl, StyleSheet, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { sleep, getGenreEmoji, formatDate } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";

const CATEGORIES = [
  { icon: "🧑‍💻", label: "CSE",         color: "#E3F2FD" },
  { icon: "⚗️",   label: "Science",     color: "#E8F5E9" },
  { icon: "📐",   label: "Math",        color: "#FFF8E1" },
  { icon: "📜",   label: "History",     color: "#FCE4EC" },
  { icon: "🌍",   label: "Geography",   color: "#E8EAF6" },
  { icon: "📖",   label: "Literature",  color: "#F3E5F5" },
  { icon: "⚙️",   label: "Engineering", color: "#FFF3E0" },
  { icon: "🏥",   label: "Medical",     color: "#F1F8E9" },
];

export default function Home() {
  const { user } = useAuthStore();
  const [books,        setBooks]        = useState([]);
  const [activeIssues, setActiveIssues] = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const router = useRouter();

  /* ─── Fetch all home data via axios ────────────────────── */
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Fire all three requests in parallel
      const [booksRes, issuesRes, notifRes] = await Promise.allSettled([
        api.get("/books",          { params: { page: 1, limit: 6 } }),
        api.get("/books/my/active"),
        api.get("/notifications"),
      ]);

      if (booksRes.status === "fulfilled") {
        const d = booksRes.value.data;
        setBooks(d?.books || (Array.isArray(d) ? d : []));
      }

      if (issuesRes.status === "fulfilled") {
        setActiveIssues(issuesRes.value.data || []);
      }

      if (notifRes.status === "fulfilled") {
        const notifs = Array.isArray(notifRes.value.data)
          ? notifRes.value.data
          : notifRes.value.data?.notifications || [];
        // Backend now sends { read: boolean } correctly
        setUnreadCount(notifs.filter((n) => !n.read).length);
      }
    } catch (e) {
      console.log("Home fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(600); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Loader />;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const activeCount  = activeIssues.filter((i) => i.status === "active").length;
  const overdueCount = activeIssues.filter((i) => i.status === "overdue").length;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* ── HEADER ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            {user?.profileImage
              ? <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
              : <Text style={{ fontSize: 18 }}>👤</Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{greeting()} 👋</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.fullName || "Student"}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── LIVE STATS ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="📗"
            value={activeCount}
            label="Active"
            highlight={false}
          />
          <StatCard
            icon="⚠️"
            value={overdueCount}
            label="Overdue"
            highlight={overdueCount > 0}
          />
          <StatCard
            icon="🔔"
            value={unreadCount}
            label="Alerts"
            highlight={false}
          />
        </View>
      </View>

      {/* ── SEARCH BAR ─────────────────────────────────────── */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(tabs)/browse")}>
        <Ionicons name="search-outline" size={16} color={COLORS.placeholder} />
        <Text style={styles.searchPh}>Search books, authors, genres…</Text>
        <View style={styles.filterBtn}>
          <Ionicons name="options-outline" size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* ── CATEGORIES ─────────────────────────────────────── */}
      <SectionHeader title="Categories" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={styles.catChip}
            onPress={() => router.push({ pathname: "/(tabs)/browse", params: { category: c.label } })}
          >
            <View style={[styles.catIcon, { backgroundColor: c.color }]}>
              <Text style={{ fontSize: 24 }}>{c.icon}</Text>
            </View>
            <Text style={styles.catLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── FEATURED BOOKS ─────────────────────────────────── */}
      <SectionHeader
        title="Featured Books"
        actionLabel="See all"
        onAction={() => router.push("/(tabs)/browse")}
      />
      {books.length === 0 ? (
        <EmptySection icon="book-outline" text="No books available" />
      ) : (
        <View style={styles.booksGrid}>
          {books.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.bookCard}
              onPress={() => router.push({ pathname: "/(tabs)/book-detail", params: { id: item._id } })}
              activeOpacity={0.85}
            >
              <View style={[styles.bookCover, { backgroundColor: item.available > 0 ? COLORS.primaryPale : "#FFF3F3" }]}>
                {item.image
                  ? <Image source={{ uri: item.image }} style={styles.bookCoverImg} />
                  : <Text style={{ fontSize: 32 }}>{getGenreEmoji(item.genre)}</Text>
                }
                <View style={[styles.availDot, { backgroundColor: item.available > 0 ? COLORS.green : COLORS.red }]} />
                {item.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                <Text style={[
                  styles.bookAvail,
                  { color: item.available > 0 ? COLORS.green : COLORS.red,
                    backgroundColor: item.available > 0 ? COLORS.statusActiveBg : COLORS.statusOverdueBg }
                ]}>
                  {item.available > 0 ? `${item.available} left` : "Unavailable"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── CURRENTLY ISSUED ───────────────────────────────── */}
      <SectionHeader
        title="Currently Issued"
        actionLabel="View all"
        onAction={() => router.push("/(tabs)/my-books")}
      />
      {activeIssues.length === 0 ? (
        <View style={styles.emptyIssued}>
          <Text style={styles.emptyIssuedText}>No books currently issued</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/browse")}>
            <Text style={styles.emptyIssuedLink}>Browse books →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activeIssues.slice(0, 3).map((issue) => (
          <IssuedCard key={issue._id} issue={issue} />
        ))
      )}

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.seeAll}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({ icon, value, label, highlight }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, highlight && { color: COLORS.red }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IssuedCard({ issue }) {
  const { useRouter } = require("expo-router");
  const router = useRouter();
  const days      = Math.ceil((new Date(issue.dueDate) - new Date()) / 86400000);
  const isOverdue = days < 0 || issue.status === "overdue";
  return (
    <TouchableOpacity
      style={[styles.issuedCard, isOverdue && styles.issuedCardOverdue]}
      onPress={() => issue.bookId && router.push({ pathname: "/(tabs)/book-detail", params: { id: issue.bookId } })}
      activeOpacity={0.88}
    >
      <View style={[styles.issuedIcon, { backgroundColor: isOverdue ? "#FFEBEE" : "#E8F5E9" }]}>
        <Text style={{ fontSize: 22 }}>{isOverdue ? "📕" : "📗"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.issuedTitle} numberOfLines={1}>{issue.title}</Text>
        <Text style={styles.issuedAuthor}>{issue.author}</Text>
        <Text style={[styles.issuedDue, { color: isOverdue ? COLORS.red : COLORS.textSecondary }]}>
          {isOverdue
            ? `⚠️ Overdue by ${Math.abs(days)}d`
            : `📅 Due: ${formatDate(issue.dueDate)}`}
        </Text>
      </View>
      <View style={[styles.statusPill, {
        backgroundColor: isOverdue ? COLORS.statusOverdueBg : COLORS.statusActiveBg,
      }]}>
        <Text style={[styles.statusPillText, { color: isOverdue ? COLORS.red : COLORS.green }]}>
          {isOverdue ? "Overdue" : "Active"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptySection({ icon, text }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={COLORS.placeholder} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 54, paddingBottom: 18, paddingHorizontal: 16,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 11 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarImg:  { width: 44, height: 44, borderRadius: 22 },
  greet:      { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  userName:   { fontSize: 15, fontWeight: "800", color: "#fff" },

  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  notifBadge: {
    position: "absolute", top: 4, right: 4,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: COLORS.amber,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: COLORS.primaryDark,
    paddingHorizontal: 2,
  },
  notifBadgeText: { fontSize: 7, color: "#fff", fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12, padding: 10, alignItems: "center",
  },
  statCardHighlight: {
    backgroundColor: "rgba(198,40,40,0.18)",
    borderWidth: 1, borderColor: "rgba(198,40,40,0.4)",
  },
  statIcon:  { fontSize: 18, marginBottom: 3 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 8, color: "rgba(255,255,255,0.75)", textAlign: "center", fontWeight: "500" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 13,
    marginHorizontal: 16, marginTop: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  searchPh:  { fontSize: 13, color: COLORS.placeholder, flex: 1 },
  filterBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  seeAll:       { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  catScroll: { paddingHorizontal: 16, gap: 12 },
  catChip:   { alignItems: "center", gap: 6 },
  catIcon:   { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  catLabel:  { fontSize: 9, color: COLORS.textSecondary, fontWeight: "600" },

  booksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  bookCard:  {
    width: "47.5%", backgroundColor: COLORS.white, borderRadius: 14, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 8, elevation: 3,
  },
  bookCover: { height: 90, alignItems: "center", justifyContent: "center", position: "relative" },
  bookCoverImg: { width: "100%", height: "100%", position: "absolute" },
  availDot: {
    position: "absolute", top: 8, right: 8,
    width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: "#fff",
  },
  ratingBadge: {
    position: "absolute", bottom: 5, left: 5,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  ratingText: { fontSize: 9, color: "#fff", fontWeight: "600" },
  bookInfo:   { padding: 9 },
  bookTitle:  { fontSize: 11, fontWeight: "700", color: COLORS.textDark, lineHeight: 15 },
  bookAuthor: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },
  bookAvail:  {
    fontSize: 8, fontWeight: "700", marginTop: 5,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: "flex-start",
  },

  issuedCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 10, padding: 13,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  issuedCardOverdue: { borderLeftWidth: 3, borderLeftColor: COLORS.red, shadowColor: COLORS.red },
  issuedIcon:  { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  issuedTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  issuedAuthor:{ fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  issuedDue:   { fontSize: 10, fontWeight: "500", marginTop: 3 },
  statusPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: "700" },

  emptyIssued: {
    marginHorizontal: 16, padding: 18, backgroundColor: COLORS.white,
    borderRadius: 14, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.borderLight, borderStyle: "dashed",
  },
  emptyIssuedText: { fontSize: 12, color: COLORS.textMuted },
  emptyIssuedLink: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  empty:      { alignItems: "center", padding: 24, gap: 8 },
  emptyText:  { fontSize: 13, color: COLORS.textMuted },
});
