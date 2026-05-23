import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../constants/colors";
import api from "../../lib/api";
import AdminHeader from "../../components/AdminHeader";

const GENRES = [
  "CSE", "Science", "Math", "History", "Literature",
  "Geography", "Engineering", "Medical", "Business",
  "Fiction", "Biography", "Philosophy", "General",
];

export default function AddBook() {
  const { id } = useLocalSearchParams();
  const isEdit  = !!id;

  const [form, setForm] = useState({
    title: "", author: "", isbn: "", genre: "CSE",
    edition: "", publisher: "", year: "", total: "1", description: "",
  });
  const [imageUri, setImageUri]         = useState(null);   // local URI for preview
  const [imageBase64, setImageBase64]   = useState(null);   // base64 to send to server
  const [existingImage, setExistingImage] = useState(null); // URL from server (edit mode)
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const router = useRouter();

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  /* ─── Load book data (edit mode) ──────────────────────── */
  useEffect(() => {
    if (!isEdit) return;
    const fetchBook = async () => {
      try {
        const { data } = await api.get(`/books/${id}`);
        setForm({
          title:       data.title       || "",
          author:      data.author      || "",
          isbn:        data.isbn        || "",
          genre:       data.genre       || "CSE",
          edition:     data.edition     || "",
          publisher:   data.publisher   || "",
          year:        data.year ? String(data.year) : "",
          total:       data.total ? String(data.total) : "1",
          description: data.description || "",
        });
        if (data.image) setExistingImage(data.image);
      } catch (e) {
        Alert.alert("Error", "Failed to load book data.");
        router.back();
      } finally {
        setFetching(false);
      }
    };
    fetchBook();
  }, [id]);

  /* ─── Image Picker ────────────────────────────────────── */
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access to pick a cover image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],       // portrait book cover ratio
      quality: 0.7,
      base64: true,          // we need base64 to send to Cloudinary via backend
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      // Build a data URI so the backend can pass it to Cloudinary
      const mime = asset.mimeType || "image/jpeg";
      setImageBase64(`data:${mime};base64,${asset.base64}`);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
    setExistingImage(null);
  };

  /* ─── Save ────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      Alert.alert("Required Fields", "Title and Author are required.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title:       form.title.trim(),
        author:      form.author.trim(),
        isbn:        form.isbn.trim(),
        genre:       form.genre,
        edition:     form.edition.trim(),
        publisher:   form.publisher.trim(),
        year:        form.year.trim(),
        total:       parseInt(form.total) || 1,
        description: form.description.trim(),
      };

      // Only send image if user picked a new one
      if (imageBase64) payload.image = imageBase64;

      if (isEdit) {
        await api.put(`/books/${id}`, payload);
      } else {
        await api.post("/books", payload);
      }

      Alert.alert("✅ Success", `Book ${isEdit ? "updated" : "added"} successfully.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save book.");
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { label: "Book Title *",  icon: "book-outline",          key: "title",       placeholder: "Enter book title" },
    { label: "Author *",      icon: "person-outline",         key: "author",      placeholder: "Author name(s)" },
    { label: "ISBN",          icon: "barcode-outline",        key: "isbn",        placeholder: "978-XXXXXXXXXX" },
    { label: "Edition",       icon: "layers-outline",         key: "edition",     placeholder: "e.g. 3rd Edition" },
    { label: "Publisher",     icon: "business-outline",       key: "publisher",   placeholder: "Publisher name" },
    { label: "Year",          icon: "calendar-outline",       key: "year",        placeholder: "e.g. 2023", keyboardType: "number-pad" },
    { label: "Total Copies",  icon: "copy-outline",           key: "total",       placeholder: "1", keyboardType: "number-pad" },
    { label: "Description",   icon: "document-text-outline",  key: "description", placeholder: "Brief description…", multiline: true },
  ];

  /* ─── Computed cover to show ──────────────────────────── */
  const coverUri = imageUri || existingImage;

  if (fetching) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AdminHeader title="Edit Book" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AdminHeader title={isEdit ? "Edit Book" : "Add New Book"} showBack />

      <View style={styles.form}>

        {/* ── COVER IMAGE PICKER ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>COVER IMAGE</Text>
          {coverUri ? (
            <View style={styles.coverPreviewWrap}>
              <Image source={{ uri: coverUri }} style={styles.coverPreview} resizeMode="cover" />
              <View style={styles.coverActions}>
                <TouchableOpacity style={styles.coverActionBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.coverActionTxt}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.coverActionBtn, { borderColor: COLORS.red }]} onPress={removeImage}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                  <Text style={[styles.coverActionTxt, { color: COLORS.red }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.imagePickerInner}>
                <Ionicons name="image-outline" size={36} color={COLORS.primary} />
                <Text style={styles.imagePickerTitle}>Tap to add cover image</Text>
                <Text style={styles.imagePickerSub}>JPG · PNG · WebP  ·  3:4 ratio recommended</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── TEXT FIELDS ── */}
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.inputGroup}>
            <Text style={styles.label}>{f.label.toUpperCase()}</Text>
            <View style={[styles.inputRow, f.multiline && { alignItems: "flex-start", paddingVertical: 11 }]}>
              <Ionicons
                name={f.icon} size={17} color={COLORS.primary}
                style={[styles.inputIcon, f.multiline && { marginTop: 2 }]}
              />
              <TextInput
                style={[styles.input, f.multiline && { height: 80, textAlignVertical: "top" }]}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.placeholder}
                value={form[f.key]}
                onChangeText={set(f.key)}
                keyboardType={f.keyboardType || "default"}
                multiline={f.multiline || false}
                autoCorrect={false}
              />
            </View>
          </View>
        ))}

        {/* ── GENRE PICKER ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GENRE</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genreChip, form.genre === g && styles.genreChipActive]}
                onPress={() => set("genre")(g)}
              >
                <Text style={[styles.genreText, form.genre === g && styles.genreTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SAVE BUTTON ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name={isEdit ? "checkmark-circle-outline" : "add-circle-outline"} size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? "Update Book" : "Add Book"}</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: 16 },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 9, fontWeight: "700", color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 7, textTransform: "uppercase",
  },

  /* Cover Image */
  imagePicker: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: "dashed",
    borderRadius: 14, overflow: "hidden",
  },
  imagePickerInner: {
    paddingVertical: 28, alignItems: "center", gap: 8,
    backgroundColor: COLORS.primaryPale,
  },
  imagePickerTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  imagePickerSub: { fontSize: 10, color: COLORS.textSecondary },
  coverPreviewWrap: { borderRadius: 14, overflow: "hidden", borderWidth: 1.5, borderColor: COLORS.border },
  coverPreview: { width: "100%", height: 220 },
  coverActions: {
    flexDirection: "row", gap: 10, padding: 10,
    backgroundColor: COLORS.white,
  },
  coverActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  coverActionTxt: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  /* Text fields */
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, fontSize: 13, color: COLORS.textDark },

  /* Genre */
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  genreChipActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  genreText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  genreTextActive: { color: "#fff" },

  /* Save */
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 13,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
    flexDirection: "row", justifyContent: "center", gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
