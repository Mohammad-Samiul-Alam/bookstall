import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

const NOTIF_TYPES = [
  { icon: "alarm-outline",    label: "Due Reminder",  color: "#FFF8E1" },
  { icon: "warning-outline",  label: "Overdue Alert", color: "#FFEBEE" },
  { icon: "book-outline",     label: "New Arrival",   color: "#E3F2FD" },
  { icon: "megaphone-outline",label: "Announcement",  color: "#E8EAF6" },
];

const AUDIENCES = ["All Members", "Students Only", "Overdue Members"];

export default function SendNotification() {
  const [type, setType] = useState("Announcement");
  const [audience, setAudience] = useState("All Members");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please fill in both title and message.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/notifications/send", {
        type,
        audience,
        title: title.trim(),
        message: message.trim(),
      });
      Alert.alert("✅ Notification Sent!", `Successfully sent to: ${audience}`, [
        { text: "Send Another", onPress: () => { setTitle(""); setMessage(""); } },
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Send Failed", err.message || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AdminHeader title="Send Notification" showBack />

      <View style={styles.body}>
        {/* TYPE */}
        <Text style={styles.sectionLabel}>📢  NOTIFICATION TYPE</Text>
        <View style={styles.typeGrid}>
          {NOTIF_TYPES.map((t) => (
            <TouchableOpacity
              key={t.label}
              style={[styles.typeCard, type === t.label && styles.typeCardActive]}
              onPress={() => setType(t.label)}
            >
              <View style={[styles.typeIcon, { backgroundColor: t.color }]}>
                <Ionicons name={t.icon} size={22} color={COLORS.indigoDark} />
              </View>
              <Text style={[styles.typeLabel, type === t.label && { color: COLORS.primary, fontWeight: "700" }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AUDIENCE */}
        <Text style={styles.sectionLabel}>👥  SEND TO</Text>
        <View style={styles.audienceRow}>
          {AUDIENCES.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.audienceChip, audience === a && styles.audienceChipActive]}
              onPress={() => setAudience(a)}
            >
              <Text style={[styles.audienceText, audience === a && styles.audienceTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TITLE */}
        <Text style={styles.sectionLabel}>📝  TITLE</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Library Closure Notice"
            placeholderTextColor={COLORS.placeholder}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* MESSAGE */}
        <Text style={styles.sectionLabel}>💬  MESSAGE</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Write your notification message here…"
          placeholderTextColor={COLORS.placeholder}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* PREVIEW */}
        {(title || message) && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>PREVIEW</Text>
            <Text style={styles.previewTitle}>{title || "Title…"}</Text>
            <Text style={styles.previewMsg} numberOfLines={3}>{message || "Message…"}</Text>
            <Text style={styles.previewMeta}>
              {type} · {audience} · Just now
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send Notification</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body: { padding: 16, paddingBottom: 50 },
  sectionLabel: {
    fontSize: 10, fontWeight: "800", color: COLORS.primary,
    letterSpacing: 0.5, marginBottom: 10, marginTop: 18,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%", backgroundColor: COLORS.white, borderRadius: 13,
    padding: 13, alignItems: "center", gap: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale },
  typeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textDark, textAlign: "center" },
  audienceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  audienceChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  audienceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  audienceText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  audienceTextActive: { color: "#fff" },
  inputBox: {
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11,
  },
  input: { fontSize: 13, color: COLORS.textDark },
  textarea: {
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 13, padding: 13, fontSize: 13, color: COLORS.textDark,
    minHeight: 120,
  },
  previewCard: {
    backgroundColor: COLORS.white, borderRadius: 13, padding: 14, marginTop: 16,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  previewLabel: {
    fontSize: 9, fontWeight: "700", color: COLORS.primary,
    letterSpacing: 1, marginBottom: 8,
  },
  previewTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  previewMsg: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 16 },
  previewMeta: { fontSize: 9, color: COLORS.textMuted, marginTop: 8 },
  sendBtn: {
    backgroundColor: COLORS.primary, borderRadius: 13,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9, marginTop: 22,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
