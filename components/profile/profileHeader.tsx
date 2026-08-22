import { colors, radius, spacing, typography } from "@/constants/theme";
import { pickAndPrepareProfileImage } from "@/utils/imageUpload";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  name: string;
  email: string;
  imageUri: string | null;
  uploading: boolean;
  onChangePhoto: (newImageUri: string) => Promise<void> | void;
  onEditPress: () => void;
};

export default function ProfileHeader({
  name,
  email,
  imageUri,
  uploading,
  onChangePhoto,
  onEditPress,
}: Props) {
  const [isPickingImage, setIsPickingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const prepared = await pickAndPrepareProfileImage();
      
      if (prepared?.base64Uri) {
        // Directly upload the image without showing preview modal
        await onChangePhoto(prepared.base64Uri);
      }
    } catch (error: any) {
      console.error("[PROFILE HEADER] Error picking image:", error);
    } finally {
      setIsPickingImage(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image} 
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="person" size={48} color={colors.textSecondary} />
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}

        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={handlePickImage}
          disabled={uploading || isPickingImage}
        >
          {isPickingImage || uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="camera" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
        <Ionicons name="pencil" size={18} color={colors.accentOrange} />
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>

      {/* Show "Change Photo" text button when image exists */}
      {imageUri && (
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={handlePickImage}
          disabled={uploading || isPickingImage}
        >
          <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  imageWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  placeholder: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },

  info: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  name: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2,
  },

  email: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentOrange,
    marginBottom: spacing.xs,
  },

  editText: {
    ...typography.body,
    color: colors.accentOrange,
    fontWeight: "600",
  },

  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },

  changePhotoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});