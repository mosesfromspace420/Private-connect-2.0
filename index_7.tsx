import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

interface SuggestedUser {
  id: number;
  name: string;
  email: string;
  bio: string;
  followerCount: number;
  isFollowing: boolean;
}

export default function DiscoverScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  const followMutation = trpc.follows.follow.useMutation();
  const unfollowMutation = trpc.follows.unfollow.useMutation();

  useEffect(() => {
    // Simulate fetching suggested users
    const mockUsers: SuggestedUser[] = [
      {
        id: 2,
        name: "Sarah Chen",
        email: "sarah@example.com",
        bio: "Designer & photographer exploring privacy-first social media",
        followerCount: 1240,
        isFollowing: false,
      },
      {
        id: 3,
        name: "Alex Rodriguez",
        email: "alex@example.com",
        bio: "Tech enthusiast, privacy advocate, open source contributor",
        followerCount: 2850,
        isFollowing: false,
      },
      {
        id: 4,
        name: "Jordan Kim",
        email: "jordan@example.com",
        bio: "Music producer and digital artist",
        followerCount: 856,
        isFollowing: false,
      },
      {
        id: 5,
        name: "Morgan Lee",
        email: "morgan@example.com",
        bio: "Writer, storyteller, and community builder",
        followerCount: 1562,
        isFollowing: false,
      },
    ];

    setSuggestedUsers(mockUsers);
    setLoading(false);
  }, []);

  const handleFollow = async (userId: number) => {
    if (!user) return;

    try {
      await followMutation.mutateAsync({ userId });
      setFollowingMap((prev) => ({ ...prev, [userId]: true }));
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleUnfollow = async (userId: number) => {
    if (!user) return;

    try {
      await unfollowMutation.mutateAsync({ userId });
      setFollowingMap((prev) => ({ ...prev, [userId]: false }));
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  };

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-center text-lg text-muted">Please log in to discover users</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            🔍 Discover
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            Find interesting people to follow
          </Text>
        </View>

        {/* Suggested Users */}
        <View style={{ paddingHorizontal: 16 }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : suggestedUsers.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {suggestedUsers.map((suggestedUser) => (
                <View
                  key={suggestedUser.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* User Header */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>👤</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                        {suggestedUser.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        @{suggestedUser.email.split("@")[0]}
                      </Text>
                    </View>

                    {/* Follow Button */}
                    <Pressable
                      onPress={() =>
                        followingMap[suggestedUser.id]
                          ? handleUnfollow(suggestedUser.id)
                          : handleFollow(suggestedUser.id)
                      }
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: followingMap[suggestedUser.id] ? colors.border : colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: followingMap[suggestedUser.id] ? colors.foreground : colors.background,
                        }}
                      >
                        {followingMap[suggestedUser.id] ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Bio */}
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.foreground,
                      lineHeight: 16,
                      marginBottom: 10,
                    }}
                    numberOfLines={2}
                  >
                    {suggestedUser.bio}
                  </Text>

                  {/* Follower Count */}
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    👥 {suggestedUser.followerCount.toLocaleString()} followers
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                No more suggestions
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
