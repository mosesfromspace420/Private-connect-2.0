import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface ImagePickerComponentProps {
  onImageSelected: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  selectedImage?: string | null;
  maxSizeMB?: number;
}

export function ImagePickerComponent({
  onImageSelected,
  onImageRemoved,
  selectedImage,
  maxSizeMB = 10,
}: ImagePickerComponentProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);

  const uploadImageMutation = trpc.posts.uploadImage.useMutation();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to your photo library to upload images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setLocalImage(asset.uri);
      setUploading(true);

      try {
        // Read file as base64
        let base64Data: string;
        
        if (Platform.OS === "web") {
          // For web, fetch the blob and convert to base64
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove the data:image/xxx;base64, prefix
              const base64 = result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // For native, use FileSystem
          base64Data = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        // Check file size (base64 is ~33% larger than original)
        const estimatedSizeMB = (base64Data.length * 0.75) / (1024 * 1024);
        if (estimatedSizeMB > maxSizeMB) {
          Alert.alert(
            "Image Too Large",
            `Please select an image smaller than ${maxSizeMB}MB.`
          );
          setLocalImage(null);
          setUploading(false);
          return;
        }

        // Determine MIME type
        const mimeType = asset.mimeType || "image/jpeg";
        const fileName = asset.fileName || `image_${Date.now()}`;

        // Upload to server
        const response = await uploadImageMutation.mutateAsync({
          imageData: base64Data,
          mimeType,
          fileName,
        });

        if (response.success && response.imageUrl) {
          onImageSelected(response.imageUrl);
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
        setLocalImage(null);
      } finally {
        setUploading(false);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to your camera to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setLocalImage(asset.uri);
      setUploading(true);

      try {
        // Read file as base64
        const base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Upload to server
        const response = await uploadImageMutation.mutateAsync({
          imageData: base64Data,
          mimeType: asset.mimeType || "image/jpeg",
          fileName: `photo_${Date.now()}`,
        });

        if (response.success && response.imageUrl) {
          onImageSelected(response.imageUrl);
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Photo upload error:", error);
        Alert.alert("Upload Failed", "Failed to upload photo. Please try again.");
        setLocalImage(null);
      } finally {
        setUploading(false);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const removeImage = () => {
    setLocalImage(null);
    onImageRemoved?.();
  };

  const displayImage = selectedImage || localImage;

  if (displayImage) {
    return (
      <View className="relative">
        <Image
          source={{ uri: displayImage }}
          style={{ width: "100%", height: 200, borderRadius: 12 }}
          contentFit="cover"
        />
        {uploading && (
          <View className="absolute inset-0 bg-black/50 rounded-xl items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="text-white mt-2">Uploading...</Text>
          </View>
        )}
        {!uploading && (
          <TouchableOpacity
            className="absolute top-2 right-2 bg-black/60 rounded-full p-2"
            onPress={removeImage}
          >
            <Text className="text-white text-lg font-bold">✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row gap-3">
      <TouchableOpacity
        className="flex-1 bg-surface border border-border rounded-xl p-4 items-center"
        onPress={pickImage}
        disabled={uploading}
      >
        <IconSymbol name="house.fill" size={24} color={colors.primary} />
        <Text className="text-foreground mt-2 text-sm">Gallery</Text>
      </TouchableOpacity>

      {Platform.OS !== "web" && (
        <TouchableOpacity
          className="flex-1 bg-surface border border-border rounded-xl p-4 items-center"
          onPress={takePhoto}
          disabled={uploading}
        >
          <IconSymbol name="house.fill" size={24} color={colors.primary} />
          <Text className="text-foreground mt-2 text-sm">Camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
