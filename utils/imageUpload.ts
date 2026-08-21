import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_SIZE_BYTES = 1024 * 1024; // hard cap: 1MB
const MIN_QUALITY = 0.3;
const MIN_WIDTH = 480;

/**
 * Opens the photo library and returns the picked image's local URI,
 * or null if the user cancelled.
 */
export async function pickProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permission to access photos is required.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/**
 * Compresses an image and returns it as a base64 data URI,
 * shrinking quality/width in steps until it's under 1MB.
 * Throws if it still can't get under the limit.
 */
export async function compressAndEncodeImage(uri: string): Promise<{
  base64Uri: string;
  sizeKB: number;
}> {
  let quality = 0.8;
  let width = 1080;
  let base64: string | null = null;
  let sizeBytes = Infinity;

  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    base64 = result.base64 ?? null;
    if (!base64) throw new Error("Failed to encode image.");

    // base64 is ~4/3 the size of the raw bytes
    sizeBytes = Math.ceil((base64.length * 3) / 4);

    if (sizeBytes <= MAX_SIZE_BYTES) break;

    quality = Math.max(MIN_QUALITY, quality - 0.15);
    width = Math.max(MIN_WIDTH, Math.floor(width * 0.8));
  }

  if (!base64 || sizeBytes > MAX_SIZE_BYTES) {
    throw new Error(
      "Image is still too large after compression. Please choose a smaller image.",
    );
  }

  return {
    base64Uri: `data:image/jpeg;base64,${base64}`,
    sizeKB: Math.round(sizeBytes / 1024),
  };
}

/** Convenience wrapper: pick + compress in one call. Returns null if cancelled. */
export async function pickAndPrepareProfileImage(): Promise<{
  base64Uri: string;
  sizeKB: number;
} | null> {
  const uri = await pickProfileImage();
  if (!uri) return null;
  return compressAndEncodeImage(uri);
}
