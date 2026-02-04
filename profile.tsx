import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ProfileScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("Welcome to my PrivateConnect profile!");
  const [musicUrl, setMusicUrl] = useState("https://example.com/song.mp3");
  const [musicTitle, setMusicTitle] = useState("My Favorite Song");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisitors, setShowVisitors] = useState(false);
  const [showTopFriendsEditor, setShowTopFriendsEditor] = useState(false);

  const { data: profile, isLoading: profileLoading } = trpc.profile.getProfile.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const getUserPostsMutation = trpc.posts.getUserPosts.useMutation();
  const getTopFriendsMutation = trpc.topFriends.get.useMutation();
  const getVisitorsMutation = trpc.visitors.getMyVisitors.useMutation();
  
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [topFriends, setTopFriends] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Load posts
      setPostsLoading(true);
      getUserPostsMutation.mutateAsync({ userId: user.id })
        .then((posts) => setUserPosts(posts || []))
        .catch((err) => console.error("Failed to load posts:", err))
        .finally(() => setPostsLoading(false));

      // Load top friends
      getTopFriendsMutation.mutateAsync({ userId: user.id })
        .then((friends) => setTopFriends(friends || []))
        .catch((err) => console.error("Failed to load top friends:", err));

      // Load visitors
      setVisitorsLoading(true);
      getVisitorsMutation.mutateAsync({ limit: 10 })
        .then((v) => setVisitors(v || []))
        .catch((err) => console.error("Failed to load visitors:", err))
        .finally(() => setVisitorsLoading(false));
    }
  }, [user?.id]);

  const updateProfileMutation = trpc.profile.updateProfile.useMutation();

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfileMutation.mutateAsync({
        bio,
        musicUrl,
        musicTitle,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-center text-lg text-muted">Please log in to view your profile</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Background */}
        <View style={{ position: "relative" }}>
          {/* Background Image */}
          <View
            style={{
              height: 140,
              backgroundColor: colors.primary,
              opacity: 0.1,
            }}
          />

          {/* Profile Info Card */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: -60,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            {/* Avatar */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                  borderWidth: 3,
                  borderColor: colors.background,
                }}
              >
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>

              {/* Name and Username */}
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                {user.name || "Anonymous User"}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                @{user.email?.split("@")[0] || "user"}
              </Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                  {userPosts?.length || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Posts</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                  {profile?.followerCount || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Followers</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                  {profile?.followingCount || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Following</Text>
              </View>
            </View>

            {/* Bio */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Bio</Text>
              {isEditing ? (
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                  }}
                />
              ) : (
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                  {bio}
                </Text>
              )}
            </View>

            {/* Top 8 Friends Section - MySpace Style */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  ⭐ Top 8 Friends
                </Text>
                <Pressable
                  onPress={() => setShowTopFriendsEditor(!showTopFriendsEditor)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: colors.surface,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.primary }}>
                    {showTopFriendsEditor ? "Done" : "Edit"}
                  </Text>
                </Pressable>
              </View>

              {topFriends.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {topFriends.map((friend, index) => (
                    <View
                      key={friend.friendId}
                      style={{
                        width: "22%",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: colors.primary + "30",
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 4,
                          borderWidth: 2,
                          borderColor: index === 0 ? colors.warning : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>👤</Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.foreground,
                          textAlign: "center",
                        }}
                        numberOfLines={1}
                      >
                        {friend.friendName || `Friend ${index + 1}`}
                      </Text>
                      {index === 0 && (
                        <Text style={{ fontSize: 8, color: colors.warning }}>★ BFF</Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
                    No top friends yet!{"\n"}Add your closest friends here
                  </Text>
                  <Pressable
                    style={{
                      marginTop: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: "600", fontSize: 12 }}>
                      + Add Friends
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Profile Visitors Section - MySpace Style */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={() => setShowVisitors(!showVisitors)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                    👁️ Profile Visitors
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colors.background, fontWeight: "600" }}>
                      {visitors.length}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, color: colors.muted }}>
                  {showVisitors ? "▲" : "▼"}
                </Text>
              </Pressable>

              {showVisitors && (
                <View style={{ marginTop: 12 }}>
                  {visitorsLoading ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : visitors.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      {visitors.slice(0, 5).map((visitor, index) => (
                        <View
                          key={visitor.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            paddingVertical: 6,
                            borderBottomWidth: index < 4 ? 1 : 0,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: colors.primary + "30",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontSize: 14 }}>👤</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                              {visitor.visitorName || "Anonymous"}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.muted }}>
                              Visited {visitor.visitCount}x
                            </Text>
                          </View>
                          <Text style={{ fontSize: 10, color: colors.muted }}>
                            {new Date(visitor.lastVisited).toLocaleDateString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", paddingVertical: 12 }}>
                      No visitors yet. Share your profile!
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Music Player Section */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 }}>
                  🎵 Now Playing
                </Text>
                {isPlaying && (
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={{
                          width: 3,
                          height: 12 + i * 3,
                          backgroundColor: colors.primary,
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>

              {isEditing ? (
                <>
                  <TextInput
                    value={musicTitle}
                    onChangeText={setMusicTitle}
                    placeholder="Song Title"
                    placeholderTextColor={colors.muted}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.foreground,
                      marginBottom: 8,
                      fontSize: 12,
                    }}
                  />
                  <TextInput
                    value={musicUrl}
                    onChangeText={setMusicUrl}
                    placeholder="Music URL"
                    placeholderTextColor={colors.muted}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.foreground,
                      fontSize: 12,
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                    {musicTitle}
                  </Text>
                  <Pressable
                    onPress={() => setIsPlaying(!isPlaying)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: "600", marginRight: 6 }}>
                      {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Follower/Following Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  👥 Followers
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  ➡️ Following
                </Text>
              </Pressable>
            </View>

            {/* Edit/Save Button */}
            <Pressable
              onPress={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: colors.background, fontWeight: "700" }}>
                {isEditing ? "Save Profile" : "Edit Profile"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Posts Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Your Posts
          </Text>

          {postsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : userPosts && userPosts.length > 0 ? (
            <View style={{ gap: 12 }}>
              {userPosts.map((post: any) => (
                <View
                  key={post.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                    {post.content}
                  </Text>
                  {post.image && (
                    <Image
                      source={{ uri: post.image }}
                      style={{ width: "100%", height: 150, borderRadius: 8, marginTop: 10 }}
                      contentFit="cover"
                    />
                  )}
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>❤️ {post.likeCount}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>💬 {post.commentCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", paddingVertical: 20 }}>
              No posts yet. Start sharing!
            </Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
