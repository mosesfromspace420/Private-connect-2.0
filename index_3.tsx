import { Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { PremiumPostCard } from "@/components/premium-post-card";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const [filterMode, setFilterMode] = useState<"following" | "all">("following");
  const [refreshing, setRefreshing] = useState(false);
  const [showCaughtUp, setShowCaughtUp] = useState(false);
  const [lastSeenPostId, setLastSeenPostId] = useState<number | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [usageMinutes, setUsageMinutes] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const viewedPostIds = useRef<Set<number>>(new Set());

  // Fetch feed posts based on filter mode
  const getFeedMutation = trpc.posts.getFeed.useMutation();
  const checkCaughtUpMutation = trpc.wellness.checkCaughtUp.useMutation();
  const trackUsageMutation = trpc.wellness.trackUsage.useMutation();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track usage time
  useEffect(() => {
    const interval = setInterval(() => {
      const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
      setUsageMinutes(minutes);
      
      // Show break reminder after 30 minutes
      if (minutes >= 30 && !showBreakReminder) {
        setShowBreakReminder(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [sessionStartTime, showBreakReminder]);

  // Track usage when leaving
  useEffect(() => {
    return () => {
      if (isAuthenticated && usageMinutes > 0) {
        trackUsageMutation.mutate({ minutes: usageMinutes });
      }
    };
  }, [isAuthenticated, usageMinutes]);

  const fetchFeed = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await getFeedMutation.mutateAsync({
        limit: 20,
        offset: 0,
        followingOnly: filterMode === "following",
      });
      setPosts(result || []);
      
      // Check if user is caught up
      if (result && result.length > 0 && lastSeenPostId) {
        const newPosts = result.filter((p: any) => p.id > lastSeenPostId);
        if (newPosts.length === 0) {
          setShowCaughtUp(true);
        }
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [isAuthenticated, filterMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    setShowCaughtUp(false);
    await fetchFeed();
    setRefreshing(false);
  };

  // Track viewed posts
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach((item: any) => {
      if (item.item?.id && !viewedPostIds.current.has(item.item.id)) {
        viewedPostIds.current.add(item.item.id);
        setLastSeenPostId((prev) => Math.max(prev || 0, item.item.id));
      }
    });

    // Check if we've seen all posts
    if (posts.length > 0 && viewedPostIds.current.size >= posts.length) {
      setShowCaughtUp(true);
    }
  }).current;

  const dismissBreakReminder = () => {
    setShowBreakReminder(false);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <View className="items-center gap-4">
          <Text className="text-4xl">🔐</Text>
          <Text className="text-2xl font-bold text-foreground">Welcome to PrivateConnect</Text>
          <Text className="text-muted text-center text-base">
            Your privacy-first social network awaits
          </Text>
          <Text className="text-muted text-center text-sm mt-4">
            Please log in to see your personalized feed
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // "You're All Caught Up" Banner Component
  const CaughtUpBanner = () => (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 20,
        backgroundColor: colors.success + "15",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.success + "30",
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 12 }}>✨</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: colors.foreground,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        You're All Caught Up!
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 16,
        }}
      >
        You've seen all new posts from the past 3 days.{"\n"}
        Take a break and come back later!
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 16 }}>🧘</Text>
        <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>
          Time well spent: {usageMinutes} min today
        </Text>
      </View>
    </View>
  );

  // Break Reminder Banner
  const BreakReminderBanner = () => (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: colors.warning + "15",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.warning + "30",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Text style={{ fontSize: 24 }}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              Time for a break?
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              You've been scrolling for {usageMinutes} minutes
            </Text>
          </View>
        </View>
        <Pressable
          onPress={dismissBreakReminder}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: colors.warning,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#fff", fontWeight: "600" }}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header with gradient background */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text className="text-3xl font-bold text-foreground">Home</Text>
              <Text className="text-sm text-muted mt-1">Your feed, your way</Text>
            </View>
            {/* Usage indicator */}
            <View
              style={{
                backgroundColor: usageMinutes > 30 ? colors.warning + "20" : colors.primary + "20",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: usageMinutes > 30 ? colors.warning : colors.primary,
                  fontWeight: "600",
                }}
              >
                ⏱️ {usageMinutes}m
              </Text>
            </View>
          </View>
        </View>

        {/* Break Reminder */}
        {showBreakReminder && <BreakReminderBanner />}

        {/* Filter Toggle - Following/All Posts */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: "row" }}>
          <Pressable
            onPress={() => setFilterMode("following")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: filterMode === "following" ? colors.primary : colors.surface,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: filterMode === "following" ? 0 : 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
              alignItems: "center",
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: filterMode === "following" ? colors.background : colors.foreground,
              }}
            >
              👥 Following Only
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode("all")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: filterMode === "all" ? colors.primary : colors.surface,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: filterMode === "all" ? 0 : 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
              alignItems: "center",
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: filterMode === "all" ? colors.background : colors.foreground,
              }}
            >
              🌍 All Posts
            </Text>
          </Pressable>
        </View>

        {/* Posts Feed */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Loading your feed...</Text>
          </View>
        ) : (
          <FlatList
            data={posts || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: 12 }}>
                <PremiumPostCard
                  post={item}
                  onLike={() => console.log("Liked post", item.id)}
                  onComment={() => console.log("Comment on post", item.id)}
                  onShare={() => console.log("Share post", item.id)}
                  onBookmark={() => console.log("Bookmark post", item.id)}
                />
              </View>
            )}
            scrollEnabled={true}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            ListFooterComponent={showCaughtUp && posts.length > 0 ? <CaughtUpBanner /> : null}
            ListEmptyComponent={
              <View className="items-center justify-center py-16">
                <Text className="text-4xl mb-4">📭</Text>
                <Text className="text-foreground font-semibold mb-2">
                  {filterMode === "following" ? "No posts from following" : "No posts yet"}
                </Text>
                <Text className="text-muted text-center px-4">
                  {filterMode === "following"
                    ? "Follow more people to see their posts"
                    : "Be the first to post something!"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
