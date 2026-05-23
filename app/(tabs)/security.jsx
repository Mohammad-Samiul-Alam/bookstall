import {
  View, Text, TouchableOpacity, StyleSheet, Switch, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function Security() {
  const [biometric, setBiometric] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const router = useRouter();

  const SectionCard = ({ title, children }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const ActionItem = ({ icon, iconBg, label, sub, onPress, rightEl }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {sub && <Text style={styles.itemSub}>{sub}</Text>}
      </View>
      {rightEl || <Ionicons name="chevron-forward" size={16} color={COLORS.placeholder} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
      </View>

      <View style={{ padding: 14, gap: 12 }}>
        <SectionCard title="PASSWORD">
          <ActionItem
            icon="lock-closed-outline" iconBg={COLORS.primaryPale}
            label="Change Password" sub="Last changed 30 days ago"
            onPress={() => Alert.alert("Coming soon")}
          />
        </SectionCard>

        <SectionCard title="AUTHENTICATION">
          <ActionItem
            icon="finger-print-outline" iconBg="#E8F5E9"
            label="Biometric Login" sub="Use fingerprint or face ID"
            rightEl={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#fff"
              />
            }
          />
          <ActionItem
            icon="shield-checkmark-outline" iconBg="#FFF8E1"
            label="Two-Factor Auth" sub="Extra security via email OTP"
            rightEl={
              <Switch
                value={twoFA}
                onValueChange={setTwoFA}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SectionCard>

        <SectionCard title="SESSIONS">
          <ActionItem
            icon="phone-portrait-outline" iconBg={COLORS.primaryPale}
            label="Active Sessions" sub="Manage logged-in devices"
            onPress={() => Alert.alert("1 active session", "This device (Android)\nLast active: Just now")}
          />
          <ActionItem
            icon="log-out-outline" iconBg="#FFEBEE"
            label="Sign Out All Devices" sub="Logout from everywhere"
            onPress={() => Alert.alert("Signed out", "All sessions have been terminated.")}
            rightEl={<Ionicons name="chevron-forward" size={16} color={COLORS.red} />}
          />
        </SectionCard>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  card: {
    backgroundColor: COLORS.white, borderRadius: 13, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { backgroundColor: COLORS.primaryPale, paddingHorizontal: 13, paddingVertical: 8 },
  cardHeaderText: { fontSize: 10, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.5 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  itemIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  itemLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  itemSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
});
