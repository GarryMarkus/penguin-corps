

import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchComments,
  createComment,
  deleteComment,
} from "../../services/posts";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(true);

  const loadComments = async () => {
    try {
      const res = await fetchComments(postId!);
      const data = res.data as { comments: any[] };
      setComments(data.comments);
    } catch (err) {
      console.log("Comments load error:", err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!input.trim()) return;

    await createComment(postId!, input);
    setInput("");
    loadComments();
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    loadComments();
  };

  const closeModal = () => {

    router.replace({ pathname: "/(tabs)/explore", params: { refresh: "1" } });

    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={closeModal}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Comments</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 80 }}
              renderItem={({ item }) => (
                <View style={styles.commentBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.author}>{item.author.name}</Text>
                    <Text style={styles.content}>{item.content}</Text>
                  </View>

                  {item.author._id === user?._id && (
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                      <Text style={styles.delete}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor={LPColors.gray}
                value={input}
                onChangeText={setInput}
                style={styles.input}
              />

              <TouchableOpacity onPress={handleAddComment} style={styles.sendBtn}>
                <Text style={styles.sendTxt}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: LPColors.card,
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  title: { color: LPColors.neon, fontSize: 18, fontWeight: "700" },
  close: { color: "#fff", fontSize: 22 },

  commentBox: {
    backgroundColor: LPColors.bg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
  },
  author: { color: LPColors.neon, fontWeight: "700", marginBottom: 2 },
  content: { color: "#fff" },
  delete: { color: "red", fontSize: 12, paddingLeft: 10 },

  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  input: { flex: 1, color: "#fff", paddingHorizontal: 10 },
  sendBtn: {
    backgroundColor: LPColors.neon,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sendTxt: { color: "#000", fontWeight: "700" },
});
