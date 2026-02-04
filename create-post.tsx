import { View, Text, ScrollView, Pressable, TextInput, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function CreateVideoPostScreen() {
  const colors = useColors();
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("720p");
  const [loading, setLoading] = useState(false);

  const qualities = ["360p", "480p", "720p", "1080p"];

  const handleCreatePost = async () => {
    if (!caption.trim()) {
      alert("Please add a caption");
      return;
    }

    setLoading(true);
    try {
      // Simulate video post creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.back();
    } catch (error) {
      alert("Failed to create video post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text className="text-2xl font-bold text-foreground">Create Video Post</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-2xl">✕</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ padding: 16, flex: 1 }}>
          {/* Video Preview */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
              height: 200,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="text-4xl mb-2">🎥</Text>
            <Text className="text-sm text-muted text-center">
              Video preview will appear here
            </Text>
          </View>

          {/* Caption */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Caption</Text>
            <TextInput
              placeholder="What's happening in your video?"
              placeholderTextColor={colors.muted}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              style={{ color: colors.foreground, textAlignVertical: "top" }}
            />
          </View>

          {/* Quality Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Video Quality</Text>
            <View className="flex-row gap-2">
              {qualities.map((quality) => (
                <Pressable
                  key={quality}
                  onPress={() => setSelectedQuality(quality)}
                  style={({ pressed }) => ({
                    backgroundColor:
                      selectedQuality === quality ? colors.primary : colors.surface,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color:
                        selectedQuality === quality ? colors.background : colors.foreground,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {quality}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Ephemeral Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Story Mode</Text>
              <Text className="text-xs text-muted">Disappears after 24 hours</Text>
            </View>
            <Switch
              value={isEphemeral}
              onValueChange={setIsEphemeral}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {isEphemeral && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: colors.warning,
              }}
            >
              <Text className="text-xs text-muted">
                ⏰ This video will be visible for 24 hours only and will automatically disappear.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
          <Pressable
            onPress={handleCreatePost}
            disabled={loading || !caption.trim()}
            style={({ pressed }) => ({
              backgroundColor: caption.trim() ? colors.primary : colors.border,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              className="font-bold"
              style={{
                color: caption.trim() ? colors.background : colors.muted,
              }}
            >
              {loading ? "Creating..." : "Create Video Post"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text className="font-semibold text-foreground">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
