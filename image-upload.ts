import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
};

/**
 * Compress and optimize an image for upload
 */
export async function compressImage(
  imageUri: string,
  options: ImageUploadOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Get image dimensions
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error("Image file not found");
    }

    // Manipulate image (resize and compress)
    const manipulatedImage = await ImageManipulator.manipulateAsync(imageUri, [
      { resize: { width: opts.maxWidth, height: opts.maxHeight } },
    ]);

    // Save compressed image
    const compressedUri = `${FileSystem.documentDirectory}compressed_${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await FileSystem.writeAsStringAsync(compressedUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return compressedUri;
  } catch (error) {
    console.error("[Image Upload] Compression error:", error);
    throw error;
  }
}

/**
 * Convert image to base64 for API upload
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("[Image Upload] Base64 conversion error:", error);
    throw error;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  imageUri: string
): Promise<{ width: number; height: number }> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(imageUri, []);
    return {
      width: manipulatedImage.width,
      height: manipulatedImage.height,
    };
  } catch (error) {
    console.error("[Image Upload] Dimension error:", error);
    throw error;
  }
}

/**
 * Calculate image file size
 */
export async function getImageFileSize(imageUri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists && fileInfo.size) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    console.error("[Image Upload] File size error:", error);
    return 0;
  }
}

/**
 * Delete image from file system
 */
export async function deleteImage(imageUri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(imageUri);
  } catch (error) {
    console.error("[Image Upload] Delete error:", error);
  }
}
