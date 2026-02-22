
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LPColors } from "../constants/theme";
import { Post } from "../types/post";

const screenW = Dimensions.get("window").width;

type Props = {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onDelete?: (id: string) => void;
  isOwn?: boolean;
};

export default function PostCard({ post, onLike, onComment, onDelete, isOwn }: Props) {
  return (
    <LinearGradient
      colors={[LPColors.surfaceLight, LPColors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.author?.name?.[0] || "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{post.author?.name || "Unknown"}</Text>
          <Text style={styles.time}>{new Date(post.createdAt).toLocaleString()}</Text>
        </View>
        {isOwn && onDelete ? (
          <TouchableOpacity onPress={() => onDelete(post._id)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="trash-outline" size={20} color={LPColors.error} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Image */}
      {post.images?.length > 0 ? (
        <Image source={{ uri: post.images[0].url }} style={styles.image} />
      ) : null}

      {/* Content */}
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => onLike(post._id)}>
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={22}
            color={post.isLiked ? LPColors.neon : LPColors.textGray}
          />
          <Text style={[styles.actionText, post.isLiked && { color: LPColors.neon }]}>{post.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => onComment(post._id)}>
          <Ionicons name="chatbubble-outline" size={22} color={LPColors.textGray} />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LPColors.border,
    ...LPColors.shadow, // Apply the shadow from theme
    shadowColor: "#000", // Override shadow color for card depth
    shadowOpacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LPColors.surfaceHighlight,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LPColors.primaryDark,
  },
  avatarText: {
    color: LPColors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  name: {
    color: LPColors.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  time: {
    color: LPColors.textGray,
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: "cover",
  },
  content: {
    color: LPColors.textHighlight,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    color: LPColors.textGray,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
});
