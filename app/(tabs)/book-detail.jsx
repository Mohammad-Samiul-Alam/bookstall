import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { getGenreEmoji, formatDate } from "../../lib/utils";
import api from "../../lib/api";
import Loader from "../../components/Loader";

export default function BookDetail() {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await api.get(`/books/${id}`);
        setBook(data);
      } catch (e) {
        Alert.alert("Error", e.message || "Failed to load book details", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBook();
  }, [id]);

  const handleRequest = () => {
    if (!book || book.available === 0) {
      Alert.alert("Unavailable", "This book is currently not available for borrowing.");
      return;
    }
    router.push({ pathname: "/(tabs)/request-book", params: { id: book._id, title: book.title } });
  };

  if (loading) return <Loader />;
  if (!book) return null;

  const isAvailable = book.available > 0;
  const availPercent = book.total > 0 ? (book.available / book.total) * 100 : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* COVER */}
        <View style={[styles.cover, { backgroundColor: isAvailable ? COLORS.primaryPale : "#FFF0F0" }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.textDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favBtn} onPress={() => setFavorited(!favorited)}>
            <Ionicons name={favorited ? "heart" : "heart-outline"} size={20}
              color={favorited ? COLORS.red : COLORS.textDark} />
          </TouchableOpacity>
          <Text style={{ fontSize: 80 }}>{getGenreEmoji(book.genre)}</Text>
          {/* Availability bar */}
          <View style={styles.availBarWrap}>
            <View style={[styles.availBar, { width: `${availPercent}%`, backgroundColor: isAvailable ? COLORS.green : COLORS.red }]} />
          </View>
        </View>

        <View style={styles.body}>
          {/* TITLE AREA */}
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>

          {/* BADGES */}
          <View style={styles.badgeRow}>
            {book.genre && (
              <View style={[styles.badge, { backgroundColor: COLORS.primaryPale }]}>
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>{book.genre}</Text>
              </View>
            )}
            {book.edition && (
              <View style={[styles.badge, { backgroundColor: "#E8F5E9" }]}>
                <Text style={[styles.badgeText, { color: COLORS.green }]}>{book.edition}</Text>
              </View>
            )}
            {book.rating > 0 && (
              <View style={[styles.badge, { backgroundColor: "#FFF8E1" }]}>
                <Text style={[styles.badgeText, { color: COLORS.orange }]}>⭐ {book.rating.toFixed(1)}</Text>
              </View>
            )}
            <View style={[styles.badge, {
              backgroundColor: isAvailable ? COLORS.statusActiveBg : COLORS.statusOverdueBg,
            }]}>
              <Text style={[styles.badgeText, { color: isAvailable ? COLORS.green : COLORS.red }]}>
                {isAvailable ? `✓ ${book.available} Available` : "✗ Unavailable"}
              </Text>
            </View>
          </View>

          {/* INFO CARD */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Book Details</Text>
            {[
              { key: "ISBN", val: book.isbn || "—" },
              { key: "Publisher", val: book.publisher || "—" },
              { key: "Year", val: book.year || "—" },
              { key: "Edition", val: book.edition || "—" },
              { key: "Total Copies", val: `${book.total || 0}` },
              { key: "Available", val: `${book.available || 0} / ${book.total || 0}` },
              { key: "Times Borrowed", val: `${book.borrowCount || 0}` },
            ].filter(r => r.val !== "—").map((r, i, arr) => (
              <View key={r.key} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.infoKey}>{r.key}</Text>
                <Text style={[styles.infoVal, r.key === "Available" && {
                  color: isAvailable ? COLORS.green : COLORS.red, fontWeight: "700",
                }]}>{r.val}</Text>
              </View>
            ))}
          </View>

          {/* DESCRIPTION */}
          {book.description && (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>About This Book</Text>
              <Text style={styles.descText}>{book.description}</Text>
            </View>
          )}

          {/* REVIEWS */}
          {book.reviews?.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.descTitle}>Reviews ({book.reviews.length})</Text>
              {book.reviews.slice(0, 3).map((rv, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={{ fontSize: 14 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{rv.user?.fullName || "Student"}</Text>
                      <Text style={styles.reviewDate}>{formatDate(rv.createdAt)}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <Text style={styles.reviewStarText}>{"⭐".repeat(rv.rating || 0)}</Text>
                    </View>
                  </View>
                  {rv.comment && <Text style={styles.reviewComment}>{rv.comment}</Text>}
                  {rv.tags?.length > 0 && (
                    <View style={styles.reviewTags}>
                      {rv.tags.map(tag => (
                        <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM BUTTONS */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => router.push({ pathname: "/(tabs)/write-review", params: { id: book._id, title: book.title } })}>
          <Ionicons name="star-outline" size={15} color={COLORS.primary} />
          <Text style={styles.btnOutlineText}>Review</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, !isAvailable && styles.btnDisabled]}
          onPress={handleRequest}
          disabled={!isAvailable}
        >
          <Ionicons name="arrow-up-circle-outline" size={16} color="#fff" />
          <Text style={styles.btnPrimaryText}>
            {isAvailable ? "Request Book" : "Not Available"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cover: {
    height: 220, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  availBarWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: COLORS.borderLight,
  },
  availBar: { height: 3 },
  backBtn: {
    position: "absolute", top: 50, left: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  favBtn: {
    position: "absolute", top: 50, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, lineHeight: 26 },
  author: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  infoCardTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textDark, marginBottom: 10 },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  infoKey: { fontSize: 11, color: COLORS.textSecondary },
  infoVal: { fontSize: 11, fontWeight: "600", color: COLORS.textDark },
  descCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  descTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textDark, marginBottom: 8 },
  descText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  reviewsSection: { marginBottom: 12 },
  reviewCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 6 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  reviewName: { fontSize: 11, fontWeight: "700", color: COLORS.textDark },
  reviewDate: { fontSize: 9, color: COLORS.textMuted },
  reviewStars: {},
  reviewStarText: { fontSize: 11 },
  reviewComment: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
  reviewTags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  tag: { backgroundColor: COLORS.primaryPale, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 9, color: COLORS.primary, fontWeight: "600" },
  bottomBtns: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10, padding: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  btnOutline: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 11, paddingVertical: 12,
  },
  btnOutlineText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  btnPrimary: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 11, paddingVertical: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { backgroundColor: COLORS.placeholder },
  btnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
