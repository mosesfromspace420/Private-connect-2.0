import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";

export default function CreatePostScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "followers" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const createPostMutation = trpc.posts.create.useMutation();
  const uploadImageMutation = trpc.posts.uploadImage.useMutation();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to your photo library to upload images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      setUploading(true);

      try {
        let base64Data: string;
        
        if (Platform.OS === "web") {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          base64Data = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        const response = await uploadImageMutation.mutateAsync({
          imageData: base64Data,
          mimeType: asset.mimeType || "image/jpeg",
          fileName: `post_${Date.now()}`,
        });

        if (response.success && response.imageUrl) {
          setUploadedImageUrl(response.imageUrl);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (err) {
        console.error("Image upload error:", err);
        Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
        setSelectedImage(null);
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.error("Image picker error:", err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to your camera to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      setUploading(true);

      try {
        const base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await uploadImageMutation.mutateAsync({
          imageData: base64Data,
          mimeType: asset.mimeType || "image/jpeg",
          fileName: `photo_${Date.now()}`,
        });

        if (response.success && response.imageUrl) {
          setUploadedImageUrl(response.imageUrl);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (err) {
        console.error("Photo upload error:", err);
        Alert.alert("Upload Failed", "Failed to upload photo. Please try again.");
        setSelectedImage(null);
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !uploadedImageUrl) {
      setError("Please add some text or an image to your post");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a post");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createPostMutation.mutateAsync({
        content: content.trim() || "📷",
        image: uploadedImageUrl || undefined,
        privacyLevel,
      });

      setSuccess(true);
      setContent("");
      setPrivacyLevel("public");
      setSelectedImage(null);
      setUploadedImageUrl(null);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        setSuccess(false);
        router.replace("/(tabs)");
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create post";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center items-center">
        <Text className="text-center text-lg text-muted">Please log in to create a post</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              ✍️ Create Post
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Share your thoughts with the PrivateConnect community
            </Text>
          </View>

          {/* User Info */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                {user.name || "Anonymous"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Posting as {privacyLevel === "public" ? "Public" : privacyLevel === "followers" ? "Followers" : "Private"}
              </Text>
            </View>
          </View>

          {/* Content Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              What's on your mind?
            </Text>
            <TextInput
              placeholder="Share your thoughts, ideas, or updates..."
              placeholderTextColor={colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              maxLength={500}
              editable={!loading}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                textAlignVertical: "top",
                fontSize: 14,
                fontFamily: "System",
                minHeight: 120,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {content.length}/500
              </Text>
            </View>
          </View>

          {/* Image Section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
              Add Photo
            </Text>
            
            {selectedImage ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                  contentFit="cover"
                />
                {uploading && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 12,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 8 }}>Uploading...</Text>
                  </View>
                )}
                {!uploading && (
                  <Pressable
                    onPress={removeImage}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 20,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>✕</Text>
                  </Pressable>
                )}
                {uploadedImageUrl && !uploading && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      backgroundColor: colors.success,
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>✓ Uploaded</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={pickImage}
                  disabled={loading}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingVertical: 20,
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>🖼️</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>Gallery</Text>
                </Pressable>

                {Platform.OS !== "web" && (
                  <Pressable
                    onPress={takePhoto}
                    disabled={loading}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingVertical: 20,
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>Camera</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Privacy Level */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
              Privacy Level
            </Text>
            <View style={{ gap: 8 }}>
              {(["public", "followers", "private"] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setPrivacyLevel(level)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: privacyLevel === level ? colors.primary + "20" : colors.surface,
                    borderWidth: 1,
                    borderColor: privacyLevel === level ? colors.primary : colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: privacyLevel === level ? colors.primary : colors.border,
                      backgroundColor: privacyLevel === level ? colors.primary : "transparent",
                      marginRight: 10,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, textTransform: "capitalize" }}>
                      {level}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                      {level === "public"
                        ? "Everyone can see this post"
                        : level === "followers"
                        ? "Only your followers can see this"
                        : "Only you can see this post"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{
                backgroundColor: colors.error + "20",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.error }}>
                {error}
              </Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View
              style={{
                backgroundColor: colors.success + "20",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.success }}>
                ✓ Post created successfully!
              </Text>
            </View>
          )}

          {/* Post Button */}
          <Pressable
            onPress={handleCreatePost}
            disabled={loading || uploading || (!content.trim() && !uploadedImageUrl)}
            style={({ pressed }) => ({
              backgroundColor: loading || uploading || (!content.trim() && !uploadedImageUrl) ? colors.muted : colors.primary,
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed || loading ? 0.8 : 1,
              minHeight: 48,
            })}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
                {uploadedImageUrl ? "Post with Photo" : "Post Now"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
