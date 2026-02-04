import { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  RefreshControl,
  Platform,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  PostSkeleton,
  UserCardSkeleton,
  Skeleton,
} from "@/components/skeleton";

interface TrendingHashtag {
  tag: string;
  count: number;
  trend: "up" | "down" | "stable";
}

interface SuggestedUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
  isFollowing: boolean;
}

interface TrendingPost {
  id: number;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  author: {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
  };
  createdAt: string;
}

export default function ExploreScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "users" | "hashtags">("trending");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  // tRPC mutations
  const followUserMutation = trpc.follows.follow.useMutation();
  const unfollowUserMutation = trpc.follows.unfollow.useMutation();

  useEffect(() => {
    loadExploreData();
  }, []);

  const loadExploreData = async () => {
    setIsLoading(true);
    try {
      // Load trending data (mock for now)
      
      // Mock data for demonstration (in production, this would come from the API)
      setTrendingPosts([
        {
          id: 1,
          content: "Just discovered the most amazing sunset spot! 🌅 #nature #photography",
          imageUrl: null,
          likesCount: 1247,
          commentsCount: 89,
          author: { id: 1, username: "naturelover", name: "Nature Explorer", avatar: null },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          content: "Privacy matters. That's why I switched to PrivateConnect. No algorithms, just real connections. 💪",
          imageUrl: null,
          likesCount: 892,
          commentsCount: 156,
          author: { id: 2, username: "techadvocate", name: "Tech Advocate", avatar: null },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          content: "Who else remembers customizing their MySpace profile for hours? PrivateConnect brings that back! 🎨",
          imageUrl: null,
          likesCount: 2341,
          commentsCount: 312,
          author: { id: 3, username: "nostalgia90s", name: "90s Kid", avatar: null },
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      setSuggestedUsers([
        { id: 1, username: "creativemind", name: "Creative Mind", avatar: null, bio: "Artist & Designer | Creating beautiful things daily", followersCount: 15420, isFollowing: false },
        { id: 2, username: "techguru", name: "Tech Guru", avatar: null, bio: "Software engineer | Privacy advocate | Open source contributor", followersCount: 8932, isFollowing: false },
        { id: 3, username: "wellnesscoach", name: "Wellness Coach", avatar: null, bio: "Helping you live your best life 🌱 | Mindfulness | Health", followersCount: 23156, isFollowing: false },
        { id: 4, username: "foodieadventures", name: "Foodie Adventures", avatar: null, bio: "Exploring cuisines around the world 🍜 | Food blogger", followersCount: 45678, isFollowing: false },
        { id: 5, username: "musicproducer", name: "Music Producer", avatar: null, bio: "Making beats | Collaborations welcome 🎵", followersCount: 12890, isFollowing: false },
      ]);

      setTrendingHashtags([
        { tag: "PrivateConnect", count: 15420, trend: "up" },
        { tag: "NoAlgorithm", count: 8932, trend: "up" },
        { tag: "DigitalWellness", count: 7654, trend: "up" },
        { tag: "MySpaceVibes", count: 5421, trend: "stable" },
        { tag: "SocialGaming", count: 4312, trend: "up" },
        { tag: "PrivacyFirst", count: 3890, trend: "stable" },
        { tag: "RealConnections", count: 3245, trend: "up" },
        { tag: "AntiToxicity", count: 2987, trend: "up" },
      ]);
    } catch (error) {
      console.error("Failed to load explore data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExploreData();
    setRefreshing(false);
  };

  const handleFollow = async (userId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const isCurrentlyFollowing = followingIds.has(userId);
    
    // Optimistic update
    if (isCurrentlyFollowing) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setSuggestedUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );
    } else {
      setFollowingIds((prev) => new Set(prev).add(userId));
      setSuggestedUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );
    }

    try {
      if (isCurrentlyFollowing) {
        await unfollowUserMutation.mutateAsync({ userId });
      } else {
        await followUserMutation.mutateAsync({ userId });
      }
    } catch (error) {
      // Revert on error
      if (isCurrentlyFollowing) {
        setFollowingIds((prev) => new Set(prev).add(userId));
      } else {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const renderTrendingPost = (post: TrendingPost) => (
    <Pressable
      key={post.id}
      onPress={() => router.push(`/post/${post.id}` as any)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Author header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {post.author.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
            {post.author.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            @{post.author.username} · {getTimeAgo(post.createdAt)}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.primary + "15",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
            🔥 Trending
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22, marginBottom: 12 }}>
        {post.content}
      </Text>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>❤️</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>{formatCount(post.likesCount)}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>💬</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>{formatCount(post.commentsCount)}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderSuggestedUser = (user: SuggestedUser) => {
    const isFollowing = followingIds.has(user.id) || user.isFollowing;
    
    return (
      <View
        key={user.id}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {user.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
              @{user.username} · {formatCount(user.followersCount)} followers
            </Text>
          </View>
          <Pressable
            onPress={() => handleFollow(user.id)}
            style={{
              backgroundColor: isFollowing ? colors.surface : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: isFollowing ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isFollowing ? colors.foreground : "#fff",
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>
        {user.bio && (
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginTop: 12,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        )}
      </View>
    );
  };

  const renderHashtag = (hashtag: TrendingHashtag, index: number) => (
    <Pressable
      key={hashtag.tag}
      onPress={() => router.push(`/search?q=%23${hashtag.tag}` as any)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary + "15",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
          {index + 1}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
          #{hashtag.tag}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {formatCount(hashtag.count)} posts
        </Text>
      </View>
      <Text style={{ fontSize: 20 }}>
        {hashtag.trend === "up" ? "📈" : hashtag.trend === "down" ? "📉" : "➡️"}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 32, fontWeight: "700", color: colors.foreground }}>
            Explore
          </Text>
          <Text style={{ fontSize: 15, color: colors.muted, marginTop: 4 }}>
            Discover trending content and new connections
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 12 }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users, posts, hashtags..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.foreground,
            }}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}` as any);
              }
            }}
            returnKeyType="search"
          />
        </View>

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {(["trending", "users", "hashtags"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: activeTab === tab ? colors.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: activeTab === tab ? "#fff" : colors.muted,
                }}
              >
                {tab === "trending" ? "🔥 Trending" : tab === "users" ? "👥 Users" : "#️⃣ Hashtags"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content based on active tab */}
        {isLoading ? (
          <View>
            {activeTab === "trending" && (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}
            {activeTab === "users" && (
              <>
                <UserCardSkeleton />
                <UserCardSkeleton />
                <UserCardSkeleton />
                <UserCardSkeleton />
                <UserCardSkeleton />
              </>
            )}
            {activeTab === "hashtags" && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height={60} style={{ marginBottom: 8 }} />
                ))}
              </>
            )}
          </View>
        ) : (
          <View>
            {activeTab === "trending" && (
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.foreground,
                    marginBottom: 16,
                  }}
                >
                  What's happening now
                </Text>
                {trendingPosts.map(renderTrendingPost)}
              </View>
            )}

            {activeTab === "users" && (
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.foreground,
                    marginBottom: 16,
                  }}
                >
                  People you might like
                </Text>
                {suggestedUsers.map(renderSuggestedUser)}
              </View>
            )}

            {activeTab === "hashtags" && (
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.foreground,
                    marginBottom: 16,
                  }}
                >
                  Trending hashtags
                </Text>
                {trendingHashtags.map((tag, index) => renderHashtag(tag, index))}
              </View>
            )}
          </View>
        )}

        {/* PrivateConnect Promo */}
        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 16,
            padding: 20,
            marginTop: 24,
            borderWidth: 1,
            borderColor: colors.primary + "20",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            ✨ Why PrivateConnect is Different
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
            No algorithms manipulating your feed. No data selling. Just real connections with real people.
            Explore content chronologically and discover users organically.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
