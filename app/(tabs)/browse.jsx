import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView, StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji } from "../../lib/utils";
import api from "../../lib/api";

const FILTERS = ["All", "CSE", "Science", "Math", "History", "Literature", "Geography", "Engineering", "Medical", "Business"];

export default function Browse() {
  const { category } = useLocalSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(category || "All");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef(null);
  const router = useRouter();

  const fetchBooks = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: currentPage, limit: 20 };
      if (query.trim()) params.search = query.trim();
      if (filter !== "All") params.genre = filter;
      const { data } = await api.get("/books", { params });
      const fetched = data.books || data || [];
      if (reset) {
        setBooks(fetched);
        setPage(2);
      } else {
        setBooks((prev) => [...prev, ...fetched]);
        setPage(currentPage + 1);
      }
      setHasMore(fetched.length === 20);
    } catch (e) {
      console.log("Browse fetch error:", e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, filter, page]);

  // Reset + fetch whenever filter changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchBooks(true);
  }, [filter]);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchBooks(true);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const BookRow = ({ item }) => (
    <TouchableOpacity
      style={styles.bookRow}
      onPress={() => router.push({ pathname: "/(tabs)/book-detail", params: { id: item._id } })}
      activeOpacity={0.82}
    >
      <View style={[styles.bookIcon, { backgroundColor: item.available > 0 ? COLORS.primaryPale : "#FFF3F3" }]}>
        <Text style={{ fontSize: 24 }}>{getGenreEmoji(item.genre)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookSub} numberOfLines={1}>{item.author} · {item.genre || "General"}</Text>
        {item.edition && <Text style={styles.bookEdition}>{item.edition}</Text>}
      </View>
      <View style={styles.right}>
        <View style={[styles.pill,
          { backgroundColor: item.available > 0 ? COLORS.statusActiveBg : COLORS.statusOverdueBg }]}>
          <Text style={[styles.pillText,
            { color: item.available > 0 ? COLORS.statusActive : COLORS.statusOverdue }]}>
            {item.available > 0 ? `${item.available} left` : "Out"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.placeholder} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Books</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author…"
            placeholderTextColor={COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER CHIPS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RESULTS COUNT */}
      {!loading && (
        <Text style={styles.resultCount}>
          {books.length} book{books.length !== 1 ? "s" : ""} found
          {filter !== "All" ? ` in ${filter}` : ""}
        </Text>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading books…</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BookRow item={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasMore && !loadingMore) fetchBooks(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={52} color={COLORS.placeholder} />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptyText}>Try a different search or filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 1,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: "#fff" },
  resultCount: { fontSize: 11, color: COLORS.textMuted, paddingHorizontal: 14, marginBottom: 4 },
  bookRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderRadius: 13,
    marginHorizontal: 14, marginBottom: 8, padding: 11,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  bookIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bookTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  bookSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  bookEdition: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 5 },
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 9, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  loadingText: { fontSize: 12, color: COLORS.textMuted },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyText: { fontSize: 12, color: COLORS.textSecondary },
});
