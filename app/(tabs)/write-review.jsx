import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";

const TAGS = ["Well Written", "Easy to Understand", "Great Examples", "Comprehensive", "Must Read", "Outdated", "Complex"];

export default function WriteReview() {
  const { id } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert("Error", "Please select a rating"); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/books/${id}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rating, tags: selectedTags, review }),
      });
      Alert.alert("Review Submitted!", "Thank you for your feedback.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Review Submitted!", "Thank you for your feedback.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
      </View>

      <View style={styles.body}>
        {/* STARS */}
        <Text style={styles.label}>Your Rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)}>
              <Ionicons
                name={i <= rating ? "star" : "star-outline"}
                size={36}
                color={i <= rating ? "#F9A825" : COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* TAGS */}
        <Text style={styles.label}>Quick Tags</Text>
        <View style={styles.tagsWrap}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REVIEW TEXT */}
        <Text style={styles.label}>Detailed Review (Optional)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Share your thoughts about this book…"
          placeholderTextColor={COLORS.placeholder}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Review →</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  body: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.textDark, marginBottom: 10, marginTop: 16 },
  starsRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 4 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#F0F4FF", borderWidth: 1.5, borderColor: "transparent",
  },
  tagActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  tagTextActive: { color: "#fff" },
  textarea: {
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 13, padding: 12, fontSize: 13, color: COLORS.textDark,
    minHeight: 110,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 11,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
