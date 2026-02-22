

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LPColors } from "../../constants/theme";
import { createPost } from "../../services/posts";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AddPostScreen() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (!res.canceled) {
      const asset = res.assets[0];
      setImages((prev) => [...prev, { uri: asset.uri }]);
    }
  };

  const submit = async () => {
    if (!content.trim() && images.length === 0) return;

    try {
      setLoading(true);

      const form = new FormData();
      form.append("content", content.trim());

      images.forEach((img, index) => {
        const filename = img.uri.split("/").pop() || `image${index}.jpg`;
        const extMatch = /\.(\w+)$/.exec(filename);
        const type = extMatch ? `image/${extMatch[1]}` : "image/jpeg";


        form.append("images", {
          uri: img.uri,
          name: filename,
          type,
        });
      });

      await createPost(form);
      router.back();
    } catch (err) {
      console.log("Create post error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Create Post</Text>

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={LPColors.neon} />
        </TouchableOpacity>
      </View>

      {}
      <TextInput
        placeholder="Share your thoughts..."
        placeholderTextColor={LPColors.gray}
        style={styles.input}
        multiline
        value={content}
        onChangeText={setContent}
      />

      {}
      <TouchableOpacity style={styles.uploadBar} onPress={pickImage}>
        <Ionicons name="image-outline" size={20} color={LPColors.neon} />
        <Text style={styles.uploadBarText}>Add Image</Text>
      </TouchableOpacity>

      {}
      <View style={styles.imageGrid}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: img.uri }} style={styles.preview} />

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() =>
                setImages((prev) => prev.filter((_, i) => i !== index))
              }
            >
              <Ionicons name="close" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {}
      <TouchableOpacity
        style={[styles.submit, loading && { opacity: 0.6 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.submitText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LPColors.bg,
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },

  title: {
    color: LPColors.neon,
    fontSize: 22,
    fontWeight: "700",
  },

  input: {
    backgroundColor: LPColors.card,
    color: "#fff",
    minHeight: 120,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LPColors.border,
    fontSize: 15,
  },

  uploadBar: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: LPColors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LPColors.border,
    gap: 10,
  },

  uploadBarText: {
    color: LPColors.neon,
    fontSize: 15,
    fontWeight: "600",
  },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 10,
  },

  imageWrapper: {
    position: "relative",
  },

  preview: {
    width: 110,
    height: 110,
    borderRadius: 10,
  },

  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: LPColors.neon,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  submit: {
    marginTop: 24,
    backgroundColor: LPColors.neon,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  submitText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
