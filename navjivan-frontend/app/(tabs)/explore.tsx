

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard from "../../components/PostCard";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import { deletePost, fetchFeed, fetchMyPosts, toggleLike } from "../../services/posts";
import { Post } from "../../types/post";

export default function ExploreScreen() {
  const auth: any = useContext(AuthContext);
  const user = auth?.user;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [tab, setTab] = useState<"all" | "mine">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);


  const loadPosts = async (isRefresh = false) => {
    try {
      if (!user?._id) return;
      if (!isRefresh) setLoading(true);

      if (tab === "all") {
        const res = await fetchFeed();
        setPosts(res.data.posts);
      } else {
        const res = await fetchMyPosts(user._id);
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.log("Feed error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts(true);
    setRefreshing(false);
  };


  useEffect(() => {
    loadPosts();
  }, [tab, user]);


  useEffect(() => {
    if (params.refresh === "1") {
      loadPosts();

      router.replace("/(tabs)/explore");
    }
  }, [params.refresh]);

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
    loadPosts();
  };

  const handleComment = (postId: string) => {
    router.push({
      pathname: "/community/Comments",
      params: { postId },
    });
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
    loadPosts();
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} layout={Layout.springify()}>
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        onDelete={handleDelete}
        isOwn={item.author?._id === user?._id}
      />
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={[LPColors.bg, '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Text style={styles.title}>Community</Text>

        <TouchableOpacity onPress={() => router.push("/community/AddPost")}>
          <LinearGradient
            colors={[LPColors.primary, '#004d2c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.addButtonText}>Create</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.tabContainer}>
        <View style={styles.tabsBackground}>
          <TouchableOpacity
            onPress={() => setTab("all")}
            style={[styles.tab, tab === "all" && styles.tabActive]}
          >
            <Text style={tab === "all" ? styles.tabTextActive : styles.tabText}>
              All Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("mine")}
            style={[styles.tab, tab === "mine" && styles.tabActive]}
          >
            <Text style={tab === "mine" ? styles.tabTextActive : styles.tabText}>
              My Posts
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading community feed...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={LPColors.textGray} />
          <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          itemLayoutAnimation={Layout.springify()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={LPColors.primary}
              colors={[LPColors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { color: LPColors.text, fontSize: 28, fontWeight: "bold" },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: '#000',
    fontWeight: "700",
    fontSize: 14,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabsBackground: {
    flexDirection: "row",
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: LPColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: { color: LPColors.textGray, fontWeight: '500' },
  tabTextActive: { color: LPColors.primary, fontWeight: "700" },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  loadingText: {
    color: LPColors.textGray,
    marginTop: 10,
  },
  emptyText: {
    color: LPColors.textGray,
    marginTop: 12,
    fontSize: 16,
  },
});
