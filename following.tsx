import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface Following {
  id: number;
  name: string;
  email: string;
  bio: string;
  followerCount: number;
}

export default function FollowingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for following
    const mockFollowing: Following[] = [
      {
        id: 2,
        name: "Sarah Chen",
        email: "sarah@example.com",
        bio: "Designer & photographer",
        followerCount: 1240,
      },
      {
        id: 3,
        name: "Alex Rodriguez",
        email: "alex@example.com",
        bio: "Tech enthusiast",
        followerCount: 2850,
      },
    ];

    setFollowing(mockFollowing);
    setLoading(false);
  }, []);

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
              Following
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {following.length} people
            </Text>
          </View>
        </View>

        {/* Following List */}
        <View style={{ paddingHorizontal: 16 }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : following.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 20 }}>
              {following.map((person) => (
                <Pressable
                  key={person.id}
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
                      {person.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {person.bio}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    👥 {person.followerCount}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Not following anyone yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
