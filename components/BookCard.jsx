import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import COLORS from "../constants/colors";
import { getGenreEmoji } from "../lib/utils";

export default function BookCard({ item, onPress }) {
  const emoji = getGenreEmoji(item.genre);
  const isAvail = item.available > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cover, { backgroundColor: isAvail ? COLORS.primaryPale : "#FFF3F3" }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={[styles.dot, { backgroundColor: isAvail ? COLORS.green : COLORS.red }]} />
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
        <View style={styles.footer}>
          <Text style={[styles.genre, { backgroundColor: COLORS.primaryPale }]}>{item.genre || "General"}</Text>
          <Text style={[styles.avail, { color: isAvail ? COLORS.green : COLORS.red }]}>
            {isAvail ? `${item.available} left` : "Unavailable"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47.5%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  cover: {
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emoji: { fontSize: 34 },
  dot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ratingText: { fontSize: 9, color: "#fff", fontWeight: "600" },
  info: { padding: 8 },
  title: { fontSize: 11, fontWeight: "700", color: COLORS.textDark, lineHeight: 15 },
  author: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  genre: {
    fontSize: 8,
    fontWeight: "600",
    color: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  avail: { fontSize: 8, fontWeight: "700" },
});
