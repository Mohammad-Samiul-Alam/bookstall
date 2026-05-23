import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function AdminHeader({ title, showBack = false, rightAction }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>📚</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {rightAction ? rightAction : <View style={{ width: 36 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.indigoDark,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 18 },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
