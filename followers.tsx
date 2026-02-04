import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

interface Follower {
  id: number;
  name: string;
  email: string;
  bio: string;
  followerCount: number;
}

export default function FollowersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for followers
    const mockFollowers: Follower[] = [
      {
        id: 10,
        name: "Emma Wilson",
        email: "emma@example.com",
        bio: "Privacy enthusiast",
        followerCount: 342,
      },
      {
        id: 11,
        name: "David Brown",
        email: "david@example.com",
        bio: "Tech writer",
        followerCount: 567,
      },
      {
        id: 12,
        name: "Lisa Park",
        email: "lisa@example.com",
        bio: "Designer and artist",
        followerCount: 234,
      },
    ];

    setFollowers(mockFollowers);
    setLoading(false);
  }, [userId]);

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              Followers
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {followers.length} followers
            </Text>
          </View>
        </View>

        {/* Followers List */}
        <View style={{ paddingHorizontal: 16 }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : followers.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 20 }}>
              {followers.map((follower) => (
                <Pressable
                  key={follower.id}
                  onPress={() => router.push(`/(tabs)/profile`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
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
                      {follower.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {follower.bio}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    👥 {follower.followerCount}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                No followers yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
