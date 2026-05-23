import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

const FAQS = [
  { q: "How do I borrow a book?", a: "Browse the catalogue, tap 'Request Issue', choose duration and submit. Collect from the library counter after admin approval." },
  { q: "How many books can I borrow at once?", a: "Students can borrow up to 3 books simultaneously. Faculty can borrow up to 5 books." },
  { q: "What is the maximum loan duration?", a: "Standard loan period is 14 days. You can choose up to 30 days when requesting." },
  { q: "How do I renew a book?", a: "Go to My Books > Active, tap on the book and press 'Renew'. Renewal is allowed once per book." },
  { q: "What happens if I return a book late?", a: "A fine of ৳5 per day will be applied. Fines must be cleared before borrowing new books." },
  { q: "How do I reset my password?", a: "Use 'Forgot Password' on the login screen. An OTP will be sent to your registered email." },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState(null);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={{ fontSize: 32 }}>🤝</Text>
        <View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers to common questions below</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
      {FAQS.map((faq, i) => (
        <TouchableOpacity key={i} style={styles.faqItem} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
          <View style={styles.faqQ}>
            <Text style={styles.faqQText}>{faq.q}</Text>
            <Ionicons name={openIndex === i ? "chevron-up" : "chevron-down"} size={14} color={COLORS.placeholder} />
          </View>
          {openIndex === i && <Text style={styles.faqA}>{faq.a}</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>CONTACT SUPPORT</Text>
      <View style={styles.contactRow}>
        {[
          { icon: "call-outline", label: "Call Us", action: () => Linking.openURL("tel:+8801700000000") },
          { icon: "mail-outline", label: "Email", action: () => Linking.openURL("mailto:library@pub.edu.bd") },
          { icon: "chatbubble-outline", label: "Live Chat", action: () => {} },
        ].map((c) => (
          <TouchableOpacity key={c.label} style={styles.contactBtn} onPress={c.action}>
            <Text style={{ fontSize: 22 }}>{c.icon.includes("call") ? "📞" : c.icon.includes("mail") ? "📧" : "💬"}</Text>
            <Text style={styles.contactLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  heroCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.primaryPale, borderRadius: 14,
    margin: 14, padding: 16,
  },
  heroTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primaryDark },
  heroSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 10, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.5, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8,
  },
  faqItem: {
    backgroundColor: COLORS.white, borderRadius: 12,
    marginHorizontal: 14, marginBottom: 7, padding: 13,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  faqQ: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQText: { fontSize: 12, fontWeight: "600", color: COLORS.textDark, flex: 1, paddingRight: 8 },
  faqA: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, lineHeight: 17 },
  contactRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14 },
  contactBtn: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 13,
    alignItems: "center", paddingVertical: 14, gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  contactLabel: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
});
