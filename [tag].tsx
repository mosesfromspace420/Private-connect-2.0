import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Skeleton } from "@/components/skeleton";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface Post {
  id: number;
  userId: number;
  content: string;
  image: string | null;
  likeCount: number | null;
  commentCount: number | null;
  createdAt: Date | string;
  author?: {
    name: string | null;
    avatarUrl: string | null;
  };
}

interface HashtagInfo {
  tag: string;
  postCount: number;
  isFollowing: boolean;
}

export default function HashtagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const colors = useColors();
  
  const [refreshing, setRefreshing] = useState(false);
  const [hashtagInfo, setHashtagInfo] = useState<HashtagInfo>({
    tag: tag || "",
    postCount: 0,
    isFollowing: false,
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const feedQuery = trpc.posts.getFeed.useMutation();

  useEffect(() => {
    if (tag) {
      loadHashtagData();
    }
  }, [tag]);

  const loadHashtagData = async () => {
    if (!tag) return;
    
    setIsLoading(true);
    try {
      // Get posts and filter by hashtag
      const result = await feedQuery.mutateAsync({ limit: 100 });
      const allPosts = (result || []) as Post[];
      // Filter posts containing this hashtag
      const postsData = allPosts.filter(p => p.content.toLowerCase().includes(`#${tag.toLowerCase()}`));
      setPosts(postsData);
      setHashtagInfo({
        tag,
        postCount: postsData.length,
        isFollowing: false, // Would be fetched from server
      });
    } catch (error) {
      console.error("Failed to load hashtag data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHashtagData();
    setRefreshing(false);
  };

  const handleFollowHashtag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHashtagInfo(prev => ({ ...prev, isFollowing: !prev.isFollowing }));
    // Would call API to follow/unfollow hashtag
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => router.push(`/post/${item.id}` as any)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* Post Image */}
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 200 }}
          resizeMode="cover"
        />
      )}
      
      {/* Post Content */}
      <View style={{ padding: 16 }}>
        {/* Author */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
            }}
          >
            {item.author?.avatarUrl ? (
              <Image
                source={{ uri: item.author.avatarUrl }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {(item.author?.name || "U")[0].toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              {item.author?.name || "User"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text
          style={{ fontSize: 15, color: colors.foreground, lineHeight: 22, marginBottom: 12 }}
          numberOfLines={4}
        >
          {item.content}
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>❤️</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.likeCount || 0}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>💬</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.commentCount || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={{ marginBottom: 24 }}>
      {/* Hashtag Info */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 24,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 36 }}>#</Text>
        </View>
        
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 4 }}>
          #{tag}
        </Text>
        
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
          {hashtagInfo.postCount} posts
        </Text>

        <TouchableOpacity
          onPress={handleFollowHashtag}
          style={{
            paddingHorizontal: 32,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: hashtagInfo.isFollowing ? colors.surface : colors.primary,
            borderWidth: hashtagInfo.isFollowing ? 1 : 0,
            borderColor: colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: hashtagInfo.isFollowing ? colors.primary : "#fff",
            }}
          >
            {hashtagInfo.isFollowing ? "Following" : "Follow Hashtag"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: colors.foreground,
          marginTop: 24,
          marginBottom: 4,
        }}
      >
        Recent Posts
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: "center", paddingVertical: 48 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>#</Text>
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
        No posts yet
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
        Be the first to post with #{tag}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={{ padding: 16 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Skeleton width={80} height={80} style={{ borderRadius: 40, marginBottom: 16 }} />
        <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={16} style={{ marginBottom: 16 }} />
        <Skeleton width={140} height={44} style={{ borderRadius: 22 }} />
      </View>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={200} style={{ borderRadius: 16, marginBottom: 12 }} />
      ))}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
          #{tag}
        </Text>
      </View>

      {isLoading ? (
        renderLoading()
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
