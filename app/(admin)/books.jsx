import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji, sleep } from "../../lib/utils";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";
import Loader from "../../components/Loader";

export default function AdminBooks() {
  const [books, setBooks]       = useState([]);
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Availability modal state
  const [availModal, setAvailModal]   = useState(false);
  const [availTarget, setAvailTarget] = useState(null);   // { _id, title, total, available }
  const [editTotal, setEditTotal]     = useState("");
  const [editAvail, setEditAvail]     = useState("");
  const [savingAvail, setSavingAvail] = useState(false);

  const router = useRouter();

  /* ─── Fetch ──────────────────────────────────────────── */
  const fetchBooks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params = { limit: 100 };
      if (query.trim()) params.search = query.trim();
      const { data } = await api.get("/books", { params });
      setBooks(data.books || data || []);
    } catch (e) {
      console.log("Admin books fetch error:", e.message);
    } finally {
      if (isRefresh) { await sleep(500); setRefreshing(false); }
      else setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchBooks(), 400);
    return () => clearTimeout(t);
  }, [query]);

  /* ─── Delete ──────────────────────────────────────────── */
  const handleDelete = (id, title) => {
    Alert.alert("Delete Book", `Delete "${title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            await api.delete(`/books/${id}`);
            setBooks((prev) => prev.filter((b) => b._id !== id));
          } catch (e) {
            Alert.alert("Error", e.message || "Failed to delete book.");
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  /* ─── Open Availability Modal ────────────────────────── */
  const openAvailModal = (item) => {
    setAvailTarget(item);
    setEditTotal(String(item.total));
    setEditAvail(String(item.available));
    setAvailModal(true);
  };

  /* ─── Save Availability via PATCH ────────────────────── */
  const saveAvailability = async () => {
    const newTotal = parseInt(editTotal);
    const newAvail = parseInt(editAvail);

    if (isNaN(newTotal) || newTotal < 0) {
      Alert.alert("Invalid", "Total copies must be 0 or more."); return;
    }
    if (isNaN(newAvail) || newAvail < 0) {
      Alert.alert("Invalid", "Available copies must be 0 or more."); return;
    }
    if (newAvail > newTotal) {
      Alert.alert("Invalid", "Available cannot exceed total copies."); return;
    }

    setSavingAvail(true);
    try {
      const { data } = await api.patch(`/books/${availTarget._id}/availability`, {
        total: newTotal,
        available: newAvail,
      });
      // Update local state instantly — no full refetch needed
      setBooks((prev) =>
        prev.map((b) =>
          b._id === availTarget._id
            ? { ...b, total: data.total, available: data.available }
            : b
        )
      );
      setAvailModal(false);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update availability.");
    } finally {
      setSavingAvail(false);
    }
  };

  /* ─── Quick +/- buttons that call PATCH instantly ───── */
  const adjustAvailable = async (item, delta) => {
    const newAvail = Math.max(0, Math.min(item.available + delta, item.total));
    // Optimistic update
    setBooks((prev) =>
      prev.map((b) => (b._id === item._id ? { ...b, available: newAvail } : b))
    );
    try {
      await api.patch(`/books/${item._id}/availability`, { available: newAvail });
    } catch (e) {
      // Revert on failure
      setBooks((prev) =>
        prev.map((b) => (b._id === item._id ? { ...b, available: item.available } : b))
      );
      Alert.alert("Error", e.message || "Failed to update.");
    }
  };

  /* ─── Filter ──────────────────────────────────────────── */
  const filtered = books.filter(
    (b) =>
      !query ||
      b.title?.toLowerCase().includes(query.toLowerCase()) ||
      b.author?.toLowerCase().includes(query.toLowerCase()) ||
      b.genre?.toLowerCase().includes(query.toLowerCase())
  );

  /* ─── Row ─────────────────────────────────────────────── */
  const BookRow = ({ item }) => (
    <View style={styles.row}>
      {/* Genre icon — tap to view detail */}
      <TouchableOpacity
        style={[styles.icon, { backgroundColor: item.available > 0 ? COLORS.primaryPale : "#FFF3F3" }]}
        onPress={() => router.push({ pathname: "/(admin)/book-detail", params: { id: item._id } })}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 22 }}>{getGenreEmoji(item.genre)}</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.push({ pathname: "/(admin)/book-detail", params: { id: item._id } })}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
        <Text style={styles.bookSub}>{item.author} · {item.genre || "General"}</Text>

        {/* Available counter row */}
        <View style={styles.stockRow}>
          <TouchableOpacity
            style={[styles.adjBtn, item.available <= 0 && styles.adjBtnDisabled]}
            onPress={() => adjustAvailable(item, -1)}
            disabled={item.available <= 0}
          >
            <Ionicons name="remove" size={12} color={item.available <= 0 ? COLORS.placeholder : COLORS.red} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openAvailModal(item)} activeOpacity={0.7}>
            <Text style={styles.stockText}>
              <Text style={{ color: item.available > 0 ? COLORS.green : COLORS.red, fontWeight: "800" }}>
                {item.available}
              </Text>
              <Text style={{ color: COLORS.textSecondary }}>/{item.total}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adjBtn, item.available >= item.total && styles.adjBtnDisabled]}
            onPress={() => adjustAvailable(item, +1)}
            disabled={item.available >= item.total}
          >
            <Ionicons name="add" size={12} color={item.available >= item.total ? COLORS.placeholder : COLORS.green} />
          </TouchableOpacity>

          <Text style={styles.stockLabel}>available</Text>

          {/* Edit full counts button */}
          <TouchableOpacity onPress={() => openAvailModal(item)} style={styles.editCountsBtn}>
            <Ionicons name="options-outline" size={11} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primaryPale }]}
          onPress={() => router.push({ pathname: "/(admin)/add-book", params: { id: item._id } })}
        >
          <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.statusOverdueBg }]}
          onPress={() => handleDelete(item._id, item.title)}
          disabled={deleting === item._id}
        >
          {deleting === item._id
            ? <ActivityIndicator size="small" color={COLORS.red} />
            : <Ionicons name="trash-outline" size={14} color={COLORS.red} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Manage Books"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(admin)/add-book")}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={COLORS.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, genre…"
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
        <Text style={styles.resultCount}>{filtered.length} book{filtered.length !== 1 ? "s" : ""}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookRow item={item} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchBooks(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={52} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>No books found</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/add-book")}>
              <Text style={styles.emptyLink}>+ Add a book</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Availability Edit Modal ── */}
      <Modal visible={availModal} transparent animationType="slide" onRequestClose={() => setAvailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Availability</Text>
              <TouchableOpacity onPress={() => setAvailModal(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {availTarget && (
              <Text style={styles.modalBookTitle} numberOfLines={2}>{availTarget.title}</Text>
            )}

            {/* Total copies */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>TOTAL COPIES</Text>
              <View style={styles.modalInputRow}>
                <TouchableOpacity
                  style={styles.modalAdj}
                  onPress={() => setEditTotal((v) => String(Math.max(0, parseInt(v || "0") - 1)))}
                >
                  <Ionicons name="remove" size={18} color={COLORS.red} />
                </TouchableOpacity>
                <TextInput
                  style={styles.modalInput}
                  value={editTotal}
                  onChangeText={setEditTotal}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.modalAdj}
                  onPress={() => setEditTotal((v) => String((parseInt(v || "0") || 0) + 1))}
                >
                  <Ionicons name="add" size={18} color={COLORS.green} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Available copies */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>AVAILABLE COPIES</Text>
              <View style={styles.modalInputRow}>
                <TouchableOpacity
                  style={styles.modalAdj}
                  onPress={() => setEditAvail((v) => String(Math.max(0, parseInt(v || "0") - 1)))}
                >
                  <Ionicons name="remove" size={18} color={COLORS.red} />
                </TouchableOpacity>
                <TextInput
                  style={styles.modalInput}
                  value={editAvail}
                  onChangeText={setEditAvail}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.modalAdj}
                  onPress={() =>
                    setEditAvail((v) =>
                      String(Math.min((parseInt(v || "0") || 0) + 1, parseInt(editTotal) || 0))
                    )
                  }
                >
                  <Ionicons name="add" size={18} color={COLORS.green} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalHint}>Cannot exceed total copies</Text>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveAvailability} disabled={savingAvail}>
              {savingAvail
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.modalSaveTxt}>Save Changes</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.white, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 9,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  resultCount: { fontSize: 10, color: COLORS.textMuted, marginTop: 6, paddingHorizontal: 2 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: COLORS.white, borderRadius: 13, padding: 11, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  icon: { width: 48, height: 48, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bookTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  bookSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  stockRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  adjBtn: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  adjBtnDisabled: { opacity: 0.4 },
  stockText: { fontSize: 11, fontWeight: "700" },
  stockLabel: { fontSize: 9, color: COLORS.textSecondary },
  editCountsBtn: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },

  rowActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 36,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  modalBookTitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 18 },
  modalField: { marginBottom: 16 },
  modalLabel: {
    fontSize: 9, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 8,
  },
  modalInputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalAdj: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  modalInput: {
    flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary,
    fontSize: 18, fontWeight: "800", color: COLORS.textDark, backgroundColor: COLORS.primaryPale,
  },
  modalHint: { fontSize: 9, color: COLORS.placeholder, marginTop: 5 },
  modalSaveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 13, paddingVertical: 14,
    alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalSaveTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
