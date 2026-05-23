import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji, sleep } from "../../lib/utils";
import api from "../../lib/api";

export default function Wishlist() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  /* ─── Fetch wishlist via axios ───────────────────────── */
  const fetchWishlist = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // The wishlist endpoint may vary; fall back gracefully
      const { data } = await api.get("/books/my/wishlist");
      setBooks(Array.isArray(data) ? data : data.books || []);
    } catch (e) {
      // If endpoint not yet available, keep an empty list
      if (e?.response?.status !== 404) {
        console.log("Wishlist fetch error:", e.message);
      }
      setBooks([]);
    } finally {
      if (isRefresh) { await sleep(400); setRefreshing(false); }
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, []);

  /* ─── Remove from wishlist ───────────────────────────── */
  const remove = (item) => {
    Alert.alert("Remove from Wishlist", `Remove "${item.title}" from your wishlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/books/my/wishlist/${item._id}`);
            setBooks((prev) => prev.filter((b) => b._id !== item._id));
          } catch {
            // Optimistic update regardless
            setBooks((prev) => prev.filter((b) => b._id !== item._id));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          {!loading && <Text style={styles.headerSub}>{books.length} book{books.length !== 1 ? "s" : ""} saved</Text>}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchWishlist(true)}
              colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={52} color={COLORS.placeholder} />
              <Text style={styles.emptyTitle}>Wishlist is empty</Text>
              <Text style={styles.emptyText}>Save books you want to borrow later</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/browse")}>
                <Text style={styles.emptyLink}>Browse books →</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: "/(tabs)/book-detail", params: { id: item._id } })}
              activeOpacity={0.88}
            >
              <View style={[styles.icon, { backgroundColor: COLORS.primaryPale }]}>
                <Text style={{ fontSize: 22 }}>{getGenreEmoji(item.genre)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
                <Text style={[styles.avail, { color: item.available > 0 ? COLORS.green : COLORS.red }]}>
                  {item.available > 0 ? `${item.available} copy available` : "Currently unavailable"}
                </Text>
              </View>
              <View style={styles.actions}>
                {item.available > 0 && (
                  <TouchableOpacity
                    style={styles.requestBtn}
                    onPress={() => router.push({ pathname: "/(tabs)/request-book", params: { id: item._id, title: item.title } })}
                  >
                    <Ionicons name="book-outline" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item)}>
                  <Ionicons name="heart-dislike-outline" size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyText: { fontSize: 12, color: COLORS.textSecondary },
  emptyLink: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginTop: 4 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 13, padding: 12, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  icon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  author: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  avail: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  actions: { gap: 6 },
  requestBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  removeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#FFF0F0", alignItems: "center", justifyContent: "center",
  },
});
