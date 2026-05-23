import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function About() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroLogo}>
          <Text style={{ fontSize: 30 }}>📚</Text>
        </View>
        <Text style={styles.heroAppName}>BookStall</Text>
        <Text style={styles.heroTagline}>PUB LIBRARY SYSTEM</Text>
        <Text style={styles.heroVersion}>Version 1.0.0</Text>
      </View>

      {/* APP INFO */}
      <View style={styles.card}>
        {[
          { label: "University", value: "Pundra University of Science & Technology" },
          { label: "Location", value: "Bogura, Bangladesh" },
          { label: "Project", value: "CSE 3102 — Full Stack Development" },
          { label: "Batch", value: "23rd — B.Sc. in CSE (HSC)" },
          { label: "Total Screens", value: "34 Screens" },
          { label: "Platform", value: "React Native (Expo)" },
        ].map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowKey}>{r.label}</Text>
            <Text style={styles.rowVal}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* DEVELOPERS */}
      <Text style={styles.sectionTitle}>DEVELOPERS</Text>
      <View style={styles.card}>
        {[
          { name: "Md. Samiul Alam", role: "Full Stack Developer", emoji: "👨‍💻" },
          { name: "Chanchal Kumar Devnath", role: "UI/UX & Backend", emoji: "🧑‍💻" },
        ].map((dev) => (
          <View key={dev.name} style={styles.devRow}>
            <View style={styles.devAvatar}>
              <Text style={{ fontSize: 18 }}>{dev.emoji}</Text>
            </View>
            <View>
              <Text style={styles.devName}>{dev.name}</Text>
              <Text style={styles.devRole}>{dev.role}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        © 2024 Pundra University Library · All Rights Reserved
      </Text>
      <View style={{ height: 30 }} />
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
  hero: {
    backgroundColor: COLORS.primaryDark, alignItems: "center", gap: 6,
    paddingVertical: 28, margin: 14, borderRadius: 18,
  },
  heroLogo: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  heroAppName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroTagline: { fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 2 },
  heroVersion: {
    fontSize: 11, color: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 20, marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 13, marginHorizontal: 14, marginBottom: 12,
    overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  rowKey: { fontSize: 11, color: COLORS.textSecondary },
  rowVal: { fontSize: 11, fontWeight: "600", color: COLORS.textDark, maxWidth: "55%", textAlign: "right" },
  sectionTitle: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.5, paddingHorizontal: 14, paddingBottom: 8,
  },
  devRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  devAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryPale, alignItems: "center", justifyContent: "center",
  },
  devName: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  devRole: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  footer: {
    textAlign: "center", fontSize: 11, color: COLORS.textSecondary,
    paddingHorizontal: 14, paddingTop: 8,
  },
});
