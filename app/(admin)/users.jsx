import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, Alert, RefreshControl, ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";
import Loader from "../../components/Loader";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (e) {
      console.log("Admin users fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete User",
      `Remove "${name}" from the system? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await api.delete(`/users/${id}`);
              setUsers((prev) => prev.filter((u) => u._id !== id));
            } catch (e) {
              Alert.alert("Error", e.message || "Failed to delete user.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) =>
    !query ||
    u.fullName?.toLowerCase().includes(query.toLowerCase()) ||
    u.studentId?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const studentCount = users.filter((u) => u.role === "student").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const UserRow = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.avatar, {
        backgroundColor: item.role === "admin" ? "#E8EAF6" : COLORS.primaryPale,
      }]}>
        <Text style={{ fontSize: 18 }}>{item.role === "admin" ? "👨‍💼" : "👨‍🎓"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.fullName}</Text>
          <View style={[styles.rolePill, {
            backgroundColor: item.role === "admin" ? "#E8EAF6" : COLORS.primaryPale,
          }]}>
            <Text style={[styles.roleText, {
              color: item.role === "admin" ? COLORS.indigo : COLORS.primary,
            }]}>{item.role}</Text>
          </View>
        </View>
        <Text style={styles.studentId}>{item.studentId}</Text>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        {item.department && <Text style={styles.dept}>{item.department}</Text>}
      </View>
      {item.role !== "admin" && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item._id, item.fullName)}
          disabled={deletingId === item._id}
        >
          {deletingId === item._id
            ? <ActivityIndicator size="small" color={COLORS.red} />
            : <Ionicons name="trash-outline" size={16} color={COLORS.red} />
          }
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Users" />

      {/* STATS STRIP */}
      <View style={styles.statsStrip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{users.length}</Text>
          <Text style={styles.stripLabel}>Total</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{studentCount}</Text>
          <Text style={styles.stripLabel}>Students</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripVal}>{adminCount}</Text>
          <Text style={styles.stripLabel}>Admins</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={COLORS.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID, email…"
            placeholderTextColor={COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={15} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserRow item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsStrip: {
    flexDirection: "row", backgroundColor: COLORS.indigoDark,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  stripItem: { flex: 1, alignItems: "center" },
  stripVal: { fontSize: 20, fontWeight: "800", color: "#fff" },
  stripLabel: { fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 1, fontWeight: "500" },
  stripDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 9,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  row: {
    flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: COLORS.white, borderRadius: 13, padding: 12, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, flex: 1 },
  rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  roleText: { fontSize: 9, fontWeight: "700" },
  studentId: { fontSize: 10, color: COLORS.textSecondary },
  email: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  dept: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.statusOverdueBg,
    alignItems: "center", justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
});
