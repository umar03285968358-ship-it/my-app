import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/**
 * Hard ceiling — we will throw rather than send anything bigger than this.
 */
const MAX_SIZE_BYTES = 1024 * 1024; // 1MB

/**
 * What we actually aim for. Base64 JSON payloads are slow to upload and
 * parse, so we compress well below the hard cap rather than right up to it.
 */
const DEFAULT_TARGET_BYTES = 200 * 1024; // ~200KB

export interface CompressedImage {
  /** Ready to send as-is, e.g. as `MobUserImage` in UpdateMobUserImage */
  base64: string; // "data:image/jpeg;base64,...."
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Compresses the image at `uri` and returns it as a base64 data URI.
 * Iteratively lowers quality, then dimensions, until the result is under
 * `targetBytes`. Always guarantees the final result is under 1MB, or throws.
 */
export async function compressImageToBase64(
  uri: string,
  options?: { maxWidth?: number; targetBytes?: number },
): Promise<CompressedImage> {
  const targetBytes = options?.targetBytes ?? DEFAULT_TARGET_BYTES;
  let width = options?.maxWidth ?? 1024;
  let quality = 0.8;

  const maxAttempts = 7;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    if (!result.base64) {
      throw new Error("Image compression failed: no base64 data returned.");
    }

    const sizeBytes = base64SizeInBytes(result.base64);
    const isLastAttempt = attempt === maxAttempts - 1;

    if (sizeBytes <= targetBytes || isLastAttempt) {
      if (sizeBytes > MAX_SIZE_BYTES) {
        throw new Error(
          `Image is still ${(sizeBytes / 1024 / 1024).toFixed(
            2,
          )}MB after compression. Please choose a smaller photo.`,
        );
      }

      return {
        base64: `data:image/jpeg;base64,${result.base64}`,
        sizeBytes,
        width: result.width,
        height: result.height,
      };
    }

    // Still too big — shrink quality first, then fall back to shrinking dimensions.
    if (quality > 0.4) {
      quality = Math.round((quality - 0.15) * 100) / 100;
    } else {
      width = Math.round(width * 0.75);
    }
  }

  throw new Error("Unable to compress image to target size.");
}

/**
 * Convenience wrapper: opens the system image picker, then compresses
 * whatever the user picked. Returns null if they cancelled.
 */
export async function pickAndCompressImage(options?: {
  maxWidth?: number;
  targetBytes?: number;
}): Promise<CompressedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission was not granted.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, // don't let the picker pre-compress; we control that ourselves
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return compressImageToBase64(result.assets[0].uri, options);
}

/** Byte length of the raw data a base64 string decodes to (ignores the data-URI prefix). */
function base64SizeInBytes(base64: string): number {
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}
