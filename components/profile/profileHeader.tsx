import {
  colors,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageCropModal from "../ImageCropModal";
import ShimmerPlaceholder from "../ShimmerPlaceholder";

type Props = {
  name: string;
  email: string;
  imageUri: string | null;
  uploading: boolean;
  onChangePhoto: (
    newImageUri: string
  ) => Promise<void> | void;
  onEditPress: () => void;
};

const PROFILE_ORANGE = colors.primaryDark;

type PendingSource = "camera" | "gallery" | null;

export default function ProfileHeader({
  name,
  email,
  imageUri,
  uploading,
  onChangePhoto,
  onEditPress,
}: Props) {
  const [isPickingImage, setIsPickingImage] =
    useState(false);

  const [viewerVisible, setViewerVisible] =
    useState(false);

  // ============================================================
  // AVATAR LOAD STATE (shimmer instead of a blank circle)
  // ============================================================

  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    setAvatarLoaded(false);
  }, [imageUri]);

  // ============================================================
  // CROP FLOW
  // ============================================================
  //
  // Raw picked photos go to our own ImageCropModal instead of
  // expo-image-picker's native `allowsEditing` cropper. That native
  // screen is a separate OS activity we can't restyle, and its
  // buttons are known to overflow/get pushed off-screen on some
  // devices — this custom screen keeps Cancel/Rotate/Done pinned to
  // the bottom on every device, same as WhatsApp.

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [uriPendingCrop, setUriPendingCrop] = useState<string | null>(
    null
  );
  const [pendingSource, setPendingSource] =
    useState<PendingSource>(null);

  // ============================================================
  // CAMERA / GALLERY CHOOSER
  // ============================================================

  const handlePickImage = () => {
    if (uploading || isPickingImage) {
      return;
    }

    Alert.alert(
      "Profile Photo",
      "Choose how you want to select your profile photo.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Camera",
          onPress: openCamera,
        },
        {
          text: "Gallery",
          onPress: openGallery,
        },
      ]
    );
  };

  // ============================================================
  // CAMERA
  // ============================================================

  const openCamera = async () => {
    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera permission to take a photo."
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
          base64: false,
        });

      if (
        !result.canceled &&
        result.assets?.[0]
      ) {
        setUriPendingCrop(result.assets[0].uri);
        setPendingSource("camera");
        setCropModalVisible(true);
      }
    } catch (error) {
      console.error(
        "[PROFILE HEADER] Camera error:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to take photo. Please try again."
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  // ============================================================
  // GALLERY
  // ============================================================

  const openGallery = async () => {
    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
          base64: false,
        });

      if (
        !result.canceled &&
        result.assets?.[0]
      ) {
        setUriPendingCrop(result.assets[0].uri);
        setPendingSource("gallery");
        setCropModalVisible(true);
      }
    } catch (error) {
      console.error(
        "[PROFILE HEADER] Gallery error:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to select image. Please try again."
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  // ============================================================
  // CROP MODAL CALLBACKS
  // ============================================================

  const handleCropCancel = () => {
    setCropModalVisible(false);
    setUriPendingCrop(null);
    setPendingSource(null);
  };

  const handleCropDone = async (croppedUri: string) => {
    setCropModalVisible(false);
    setUriPendingCrop(null);
    setPendingSource(null);

    // Both camera and gallery photos are handed to the parent the
    // same way now that cropping happens up-front in-app.
    await onChangePhoto(croppedUri);
  };

  // ============================================================
  // FULL IMAGE VIEWER
  // ============================================================

  const handleOpenImage = () => {
    if (!imageUri || uploading) {
      return;
    }

    setViewerVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <TouchableOpacity
          onPress={handleOpenImage}
          activeOpacity={0.9}
          disabled={!imageUri || uploading}
        >
          {imageUri ? (
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.image}
              onLoadEnd={() => setAvatarLoaded(true)}
            />
          ) : (
            <View
              style={[
                styles.image,
                styles.placeholder,
              ]}
            >
              <Ionicons
                name="person"
                size={48}
                color={
                  colors.textSecondary
                }
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Shimmer instead of a blank circle until the avatar has
            actually decoded. */}
        {imageUri && !avatarLoaded && (
          <View style={styles.shimmerOverlay} pointerEvents="none">
            <ShimmerPlaceholder
              width={100}
              height={100}
              borderRadius={50}
            />
          </View>
        )}

        {uploading && (
          <View
            style={
              styles.uploadingOverlay
            }
          >
            <ActivityIndicator
              color={colors.white}
              size="large"
            />
          </View>
        )}

        {/* CAMERA BUTTON */}

        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={handlePickImage}
          disabled={
            uploading || isPickingImage
          }
        >
          {isPickingImage ||
          uploading ? (
            <ActivityIndicator
              color={colors.white}
              size="small"
            />
          ) : (
            <Ionicons
              name="camera"
              size={16}
              color={colors.white}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>
          {name}
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={onEditPress}
      >
        <Ionicons
          name="pencil"
          size={18}
          color={PROFILE_ORANGE}
        />

        <Text style={styles.editText}>
          Edit
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={handlePickImage}
          disabled={
            uploading || isPickingImage
          }
        >
          <Ionicons
            name="image-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text
            style={
              styles.changePhotoText
            }
          >
            Change Profile Photo
          </Text>
        </TouchableOpacity>
      )}

      {/* ========================================================
          FULL IMAGE MODAL
          ======================================================== */}

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setViewerVisible(false)
        }
      >
        <View
          style={
            styles.viewerOverlay
          }
        >
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() =>
              setViewerVisible(false)
            }
          >
            <Ionicons
              name="close"
              size={30}
              color={colors.white}
            />
          </TouchableOpacity>

          {imageUri && (
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ========================================================
          CUSTOM CROP SCREEN
          ======================================================== */}

      <ImageCropModal
        visible={cropModalVisible}
        imageUri={uriPendingCrop}
        onCancel={handleCropCancel}
        onDone={handleCropDone}
      />
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

  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor:
      "rgba(0,0,0,0.5)",
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
    backgroundColor: PROFILE_ORANGE,
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
    borderColor: PROFILE_ORANGE,
    marginBottom: spacing.xs,
  },

  editText: {
    ...typography.body,
    color: PROFILE_ORANGE,
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

  // ==========================================================
  // FULL IMAGE VIEWER
  // ==========================================================

  viewerOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerClose: {
    position: "absolute",
    top: 55,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.15)",
  },

  fullImage: {
    width: "100%",
    height: "80%",
  },
});