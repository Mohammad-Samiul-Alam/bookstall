import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TextInput, TouchableOpacity,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { formatDate, sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

export default function AdminsList() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]       = useState("");

  const fetchAdmins = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/users");
      const all = Array.isArray(data) ? data : (data.users || []);
      // keep only admins
      setUsers(all.filter((u) => u.role === "admin"));
    } catch (e) {
      console.log("AdminsList fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, []);

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
    );
  }, [users, query]);

  const AdminCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarEmoji}>👨‍💼</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.fullName}</Text>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={10} color={COLORS.indigo} />
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={11} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        {item.studentId && (
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.infoText}>ID: {item.studentId}</Text>
          </View>
        )}
        {item.department && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{item.department}</Text>
          </View>
        )}
        {item.designation && (
          <View style={styles.infoRow}>
            <Ionicons name="ribbon-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{item.designation}</Text>
          </View>
        )}
        {item.createdAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.infoText}>Joined: {formatDate(item.createdAt)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Admins" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading admins…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader title="Admin Members" showBack />

      {/* COUNT STRIP */}
      <View style={styles.strip}>
        <Ionicons name="shield-checkmark" size={18} color="#fff" />
        <Text style={styles.stripText}>
          {filtered.length} Admin{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={14} color={COLORS.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, department…"
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AdminCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAdmins(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No admins found</Text>
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
  strip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.indigoDark,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  stripText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 9,
    marginHorizontal: 14, marginVertical: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.white, borderRadius: 14, padding: 13, marginBottom: 9,
    borderLeftWidth: 3, borderLeftColor: COLORS.indigo,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  avatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#E8EAF6", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 22 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.textDark, flex: 1 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#E8EAF6", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: COLORS.indigo },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  infoText: { fontSize: 11, color: COLORS.textSecondary },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
});
