import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, ActionSheetIOS, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

export default function EditAdminProfile() {
  const { user, updateUser } = useAuthStore();
  const [fullName,    setFullName]    = useState(user?.fullName    || "");
  const [phone,       setPhone]       = useState(user?.phone       || "");
  const [designation, setDesignation] = useState(user?.designation || "Librarian");
  const [loading,     setLoading]     = useState(false);
  const [imageUri,    setImageUri]    = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const router = useRouter();

  /* ─── Camera ────────────────────────────────────────────── */
  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setImageUri(a.uri);
      setImageBase64(`data:${a.mimeType || "image/jpeg"};base64,${a.base64}`);
    }
  };

  /* ─── Gallery ───────────────────────────────────────────── */
  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setImageUri(a.uri);
      setImageBase64(`data:${a.mimeType || "image/jpeg"};base64,${a.base64}`);
    }
  };

  /* ─── Photo picker — Cancel / Take Photo / Gallery ─────── */
  const handlePickPhoto = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Gallery"], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) launchCamera(); else if (idx === 2) launchGallery(); }
      );
    } else {
      Alert.alert("Change Photo", "Choose a source", [
        { text: "📷  Take Photo",           onPress: launchCamera },
        { text: "🖼️  Choose from Gallery",  onPress: launchGallery },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  /* ─── Save ──────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Validation", "Full name cannot be empty."); return; }
    setLoading(true);
    try {
      const payload = { fullName: fullName.trim(), phone: phone.trim(), designation: designation.trim() };
      if (imageBase64) payload.profileImage = imageBase64;
      const { data } = await api.put("/auth/profile", payload);
      if (typeof updateUser === "function" && data.user) await updateUser(data.user);
      Alert.alert("✅ Saved", "Admin profile updated successfully.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar = imageUri || user?.profileImage;
  const fields = [
    { label: "Full Name",    icon: "person-outline",   value: fullName,    setter: setFullName,    placeholder: "Enter full name" },
    { label: "Phone Number", icon: "call-outline",     value: phone,       setter: setPhone,       placeholder: "+880 1XXX-XXXXXX", keyboard: "phone-pad" },
    { label: "Designation",  icon: "briefcase-outline",value: designation, setter: setDesignation, placeholder: "e.g. Chief Librarian" },
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* AVATAR */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto} activeOpacity={0.8}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={{ fontSize: 30 }}>👨‍💼</Text>
            </View>
          )}
          <View style={styles.camOverlay}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changePic}>Tap to change photo</Text>
        {imageUri && (
          <TouchableOpacity onPress={() => { setImageUri(null); setImageBase64(null); }}>
            <Text style={styles.removePhoto}>Remove new photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        {/* READ-ONLY */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, { opacity: 0.6 }]}>
            <Ionicons name="mail-outline" size={17} color={COLORS.indigo} style={styles.icon} />
            <Text style={styles.readOnly}>{user?.email || "admin@pub.edu.bd"}</Text>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={[styles.inputContainer, { opacity: 0.6 }]}>
            <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.indigo} style={styles.icon} />
            <Text style={styles.readOnly}>Administrator</Text>
          </View>
        </View>

        {fields.map((f) => (
          <View key={f.label} style={styles.inputGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name={f.icon} size={17} color={COLORS.indigo} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.placeholder}
                keyboardType={f.keyboard || "default"}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.indigoDark,
    paddingTop: 52, paddingBottom: 18, paddingHorizontal: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  avatarSection: { alignItems: "center", paddingVertical: 20, gap: 6 },
  avatarWrapper: {
    width: 88, height: 88, borderRadius: 44, position: "relative",
    borderWidth: 3, borderColor: COLORS.indigo,
  },
  avatarImg: { width: 82, height: 82, borderRadius: 41 },
  avatarFallback: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: "#E8EAF6", alignItems: "center", justifyContent: "center",
  },
  camOverlay: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.indigo, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.white, elevation: 3,
  },
  changePic: { fontSize: 12, color: COLORS.indigo, fontWeight: "600" },
  removePhoto: { fontSize: 11, color: COLORS.red, fontWeight: "500" },
  form: { paddingHorizontal: 16, paddingBottom: 40 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 13, color: COLORS.textDark },
  readOnly: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  saveBtn: {
    backgroundColor: COLORS.indigo, borderRadius: 11,
    paddingVertical: 14, alignItems: "center", marginTop: 6,
    shadowColor: COLORS.indigo, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
