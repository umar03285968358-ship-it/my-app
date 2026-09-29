// ProfileScreen.js

import ImageCropModal from "@/components/ImageCropModal";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ShimmerPlaceholder from "@/components/ShimmerPlaceholder";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  deleteMobUser,
  updateMobUser,
  updateMobUserImage,
} from "@/services/api";
import {
  clearSession,
  getUser,
  updateStoredUser,
} from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ============================================================
// THEME COLORS
// ============================================================

// #F1731F from theme.ts
const PROFILE_ORANGE = colors.primaryDark;

// ============================================================
// STATIC PIN
// ============================================================

// Pin code is not user-editable — always sent as this fixed value.
const STATIC_PIN_CODE = "1234";

// ============================================================
// TYPES
// ============================================================

type StoredUser = {
  mobUserID: number;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
  userAddress?: string | null;
  pinCode?: string | null;
  imagesPath?: string | null;
};

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type PendingPhotoSource = "camera" | "gallery" | null;

// ============================================================
// PROFILE SCREEN
// ============================================================

export default function ProfileScreen() {
  const [user, setUser] = useState<StoredUser | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  // ============================================================
  // IMAGE VIEWER
  // ============================================================

  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  // ============================================================
  // AVATAR LOAD STATE (shimmer instead of a blank circle)
  // ============================================================

  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    // Whenever the avatar URI changes (initial load, or after a
    // fresh upload), show the shimmer again until the new image
    // has actually finished decoding.
    setAvatarLoaded(false);
  }, [user?.imagesPath]);

  // ============================================================
  // CROP FLOW
  // ============================================================
  //
  // Both the camera and the gallery now hand the raw picked photo
  // to our own ImageCropModal instead of expo-image-picker's native
  // `allowsEditing` cropper (see ImageCropModal.tsx for why).
  //
  // - Gallery keeps the existing "preview -> Cancel/Save" step after
  //   cropping, unchanged from before.
  // - Camera uploads immediately after cropping, same as before.

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [uriPendingCrop, setUriPendingCrop] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingPhotoSource>(null);

  // ============================================================
  // GALLERY IMAGE PREVIEW
  // ============================================================

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  // ============================================================
  // LOAD USER
  // ============================================================

  const loadUser = useCallback(async () => {
    try {
      const stored = await getUser();

      console.log("========================================");
      console.log("[PROFILE] Loading stored user");
      console.log("[PROFILE] Stored user:", stored);
      console.log("========================================");

      if (stored) {
        setUser(stored);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("[PROFILE] Failed to load user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ============================================================
  // COMPLETE DEVICE-LOCAL USER DATA CLEANUP
  // ============================================================

  const performFullLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    console.log("");
    console.log("##################################################");
    console.log("#");
    console.log("# 🚨 COMPLETE USER LOGOUT STARTED");
    console.log("#");
    console.log("##################################################");
    console.log("");

    try {
      // ========================================================
      // STEP 1 — SHOW STORAGE BEFORE LOGOUT
      // ========================================================

      console.log("========================================");
      console.log("🔎 STEP 1: STORAGE BEFORE LOGOUT");
      console.log("========================================");

      try {
        const userBefore = await getUser();

        console.log("👤 [AUTH STORAGE] User before logout:", userBefore);
      } catch (error) {
        console.error("❌ [AUTH STORAGE] Could not read user:", error);
      }

      try {
        const keysBefore = await AsyncStorage.getAllKeys();

        console.log("📦 [ASYNC STORAGE] Keys before logout:", keysBefore);

        for (const key of keysBefore) {
          try {
            const value = await AsyncStorage.getItem(key);

            console.log(`📦 [ASYNC STORAGE] ${key}:`, value);
          } catch (error) {
            console.warn(`[ASYNC STORAGE] Could not read ${key}:`, error);
          }
        }
      } catch (error) {
        console.error("❌ [ASYNC STORAGE] Failed to inspect storage:", error);
      }

      // ========================================================
      // STEP 2 — CLEAR AUTH SESSION
      // ========================================================

      console.log("========================================");
      console.log("🔐 STEP 2: CLEAR AUTH SESSION");
      console.log("========================================");

      try {
        await clearSession();

        console.log("✅ [AUTH STORAGE] clearSession() completed");
      } catch (error) {
        console.error("❌ [AUTH STORAGE] clearSession() failed:", error);
      }

      // ========================================================
      // STEP 3 — CLEAR ALL ASYNC STORAGE
      // ========================================================

      console.log("========================================");
      console.log("📦 STEP 3: CLEAR ALL ASYNC STORAGE");
      console.log("========================================");

      try {
        const keys = await AsyncStorage.getAllKeys();

        console.log("🔎 [ASYNC STORAGE] Keys found:", keys);

        if (keys.length > 0) {
          await AsyncStorage.multiRemove(keys);

          console.log("✅ [ASYNC STORAGE] All existing keys removed");
        }

        await AsyncStorage.clear();

        console.log("✅ [ASYNC STORAGE] AsyncStorage.clear() completed");
      } catch (error) {
        console.error("❌ [ASYNC STORAGE] Complete clear failed:", error);
      }

      // ========================================================
      // STEP 4 — CLEAR SECURE STORE
      // ========================================================

      console.log("========================================");
      console.log("🔐 STEP 4: CLEAR SECURE STORE");
      console.log("========================================");

      const secureStoreKeys = [
        "access_token",
        "refresh_token",
        "user_token",
        "auth_token",
        "fcm_token",
        "device_token",
        "session_token",
        "api_token",
        "token",
        "user",
        "auth_user",
        "user_data",
        "profile",
        "session",
      ];

      for (const key of secureStoreKeys) {
        try {
          await SecureStore.deleteItemAsync(key);

          console.log(`🗑️ [SECURE STORE] Removed: ${key}`);
        } catch (error) {
          console.log(`ℹ️ [SECURE STORE] ${key} was not present`);
        }
      }

      console.log("✅ [SECURE STORE] Cleanup completed");

      // ========================================================
      // STEP 5 — WEB STORAGE CLEANUP
      // ========================================================

      if (typeof window !== "undefined") {
        console.log("========================================");
        console.log("🌐 STEP 5: CLEAR WEB STORAGE");
        console.log("========================================");

        try {
          if ("caches" in window) {
            const cacheKeys = await caches.keys();

            console.log("🌐 [WEB CACHE] Cache keys:", cacheKeys);

            for (const cacheKey of cacheKeys) {
              try {
                await caches.delete(cacheKey);

                console.log(`🗑️ [WEB CACHE] Deleted: ${cacheKey}`);
              } catch (error) {
                console.warn(
                  `[WEB CACHE] Could not delete ${cacheKey}:`,
                  error,
                );
              }
            }

            console.log("✅ [WEB CACHE] Cleanup completed");
          }
        } catch (error) {
          console.warn("⚠️ [WEB CACHE] Cleanup failed:", error);
        }

        try {
          if (typeof localStorage !== "undefined") {
            localStorage.clear();

            console.log("✅ [WEB] localStorage cleared");
          }
        } catch (error) {
          console.warn("⚠️ [WEB] localStorage cleanup failed:", error);
        }

        try {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();

            console.log("✅ [WEB] sessionStorage cleared");
          }
        } catch (error) {
          console.warn("⚠️ [WEB] sessionStorage cleanup failed:", error);
        }
      }

      // ========================================================
      // STEP 6 — EXPLICIT AUTH KEY REMOVAL
      // ========================================================

      console.log("========================================");
      console.log("🔑 STEP 6: REMOVE AUTH KEYS AGAIN");
      console.log("========================================");

      try {
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");

        console.log("✅ [AUTH STORAGE] auth_token removed");
        console.log("✅ [AUTH STORAGE] auth_user removed");
      } catch (error) {
        console.error(
          "❌ [AUTH STORAGE] Explicit auth key removal failed:",
          error,
        );
      }

      // ========================================================
      // STEP 7 — VERIFY AUTH STORAGE
      // ========================================================

      console.log("========================================");
      console.log("🔍 STEP 7: VERIFY AUTH STORAGE");
      console.log("========================================");

      try {
        const tokenAfter = await AsyncStorage.getItem("auth_token");
        const userAfter = await AsyncStorage.getItem("auth_user");

        console.log("🔎 auth_token AFTER logout:", tokenAfter);
        console.log("🔎 auth_user AFTER logout:", userAfter);

        if (tokenAfter === null && userAfter === null) {
          console.log("✅ AUTH STORAGE VERIFIED: EMPTY");
        } else {
          console.error("❌ AUTH STORAGE STILL CONTAINS DATA");
        }
      } catch (error) {
        console.error("❌ Failed to verify auth storage:", error);
      }

      // ========================================================
      // STEP 8 — VERIFY ENTIRE ASYNC STORAGE
      // ========================================================

      console.log("========================================");
      console.log("🔍 STEP 8: VERIFY ALL ASYNC STORAGE");
      console.log("========================================");

      try {
        const remainingKeys = await AsyncStorage.getAllKeys();

        console.log("📦 Remaining AsyncStorage keys:", remainingKeys);

        if (remainingKeys.length === 0) {
          console.log("✅ ASYNC STORAGE VERIFIED: COMPLETELY EMPTY");
        } else {
          console.warn("⚠️ AsyncStorage still contains:", remainingKeys);

          for (const key of remainingKeys) {
            try {
              const value = await AsyncStorage.getItem(key);

              console.warn(`⚠️ Remaining key ${key}:`, value);
            } catch (error) {
              console.warn(`⚠️ Could not read remaining key ${key}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to verify AsyncStorage:", error);
      }

      // ========================================================
      // STEP 9 — VERIFY getUser()
      // ========================================================

      console.log("========================================");
      console.log("🔍 STEP 9: VERIFY getUser()");
      console.log("========================================");

      try {
        const finalUser = await getUser();

        console.log("👤 [AUTH STORAGE] getUser() AFTER LOGOUT:", finalUser);

        if (finalUser === null || finalUser === undefined) {
          console.log("✅ FINAL USER CHECK: NO USER EXISTS");
        } else {
          console.error("❌ FINAL USER CHECK FAILED");
          console.error("❌ USER STILL EXISTS:", finalUser);
        }
      } catch (error) {
        console.error("❌ Final getUser() verification failed:", error);
      }

      // ========================================================
      // STEP 10 — CLEAR REACT STATE
      // ========================================================

      console.log("========================================");
      console.log("🧠 STEP 10: CLEAR PROFILE STATE");
      console.log("========================================");

      setUser(null);
      setEditVisible(false);
      setComingSoonVisible(false);
      setSelectedMenuItem("");
      setImageViewerVisible(false);
      setImagePreviewVisible(false);
      setSelectedImageUri(null);
      setCropModalVisible(false);
      setUriPendingCrop(null);
      setPendingSource(null);

      console.log("✅ React user state cleared");

      // ========================================================
      // FINAL LOG
      // ========================================================

      console.log("");
      console.log("##################################################");
      console.log("#");
      console.log("# ✅ COMPLETE LOGOUT FINISHED");
      console.log("#");
      console.log("# Authentication data removed.");
      console.log("# AsyncStorage cleared.");
      console.log("# SecureStore cleanup attempted.");
      console.log("# Web storage cleanup attempted.");
      console.log("# React user state cleared.");
      console.log("#");
      console.log("##################################################");
      console.log("");

      // ========================================================
      // STEP 11 — NAVIGATE TO LOGIN
      // ========================================================

      router.replace("/(auth)/login");
    } catch (error) {
      console.error("❌ [LOGOUT] Unexpected logout error:", error);

      Alert.alert(
        "Logout Error",
        "Failed to completely log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // ============================================================
  // LOGOUT CONFIRMATION
  // ============================================================

  const handleLogout = () => {
    if (loggingOut || deletingAccount) {
      return;
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to log out? Your locally stored account data will be removed from this app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: performFullLogout,
        },
      ],
    );
  };

  // ============================================================
  // DELETE ACCOUNT CONFIRMATION
  // ============================================================

  const handleDeleteAccountConfirmation = () => {
    if (loggingOut || deletingAccount || !user) {
      return;
    }

    Alert.alert(
      "Delete Account?",
      "Are you sure you want to delete your account? All your account data and progress will be permanently lost after this action. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ],
    );
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================
  //
  // 1. Calls /mob/DelMobUser with the logged-in user's ID + static PIN.
  // 2. Only if the API succeeds (apiRequest throws otherwise) does it
  // run the exact same cleanup + redirect as a normal logout.

  const handleDeleteAccount = async () => {
    if (!user || deletingAccount || loggingOut) {
      return;
    }

    setDeletingAccount(true);

    try {
      // Use the ID stored in auth storage (falls back to state).
      const stored = await getUser();
      const mobUserID = stored?.mobUserID ?? user.mobUserID;

      await deleteMobUser(mobUserID, STATIC_PIN_CODE);
    } catch (err: any) {
      console.error("[PROFILE] Delete account failed:", err);

      Alert.alert(
        "Delete failed",
        err?.message ?? "Could not delete your account. Please try again.",
      );

      setDeletingAccount(false);
      return;
    }

    setDeletingAccount(false);

    // API returned success -> same activity as logout.
    await performFullLogout();
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const handleSaveProfile = async (form: {
    firstName: string;
    lastName: string;
    mobileNo: string;
    email: string;
    userAddress: string;
  }) => {
    if (!user) {
      return;
    }

    setSaving(true);

    try {
      await updateMobUser({
        mobUserID: user.mobUserID,
        firstName: form.firstName,
        lastName: form.lastName,
        mobileNo: form.mobileNo,
        email: user.email,
        userAddress: form.userAddress,
        pinCode: STATIC_PIN_CODE,
      });

      const updated = await updateStoredUser({
        firstName: form.firstName,
        lastName: form.lastName,
        mobileNo: form.mobileNo,
        email: user.email,
        userAddress: form.userAddress,
        pinCode: STATIC_PIN_CODE,
      });

      setUser(updated);
      setEditVisible(false);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CAMERA / GALLERY CHOOSER
  // ============================================================

  const handleChangePhoto = () => {
    if (uploadingImage) {
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
      ],
    );
  };

  // ============================================================
  // CAMERA
  // ============================================================

  const openCamera = async () => {
    try {
      let permissionResult = await ImagePicker.getCameraPermissionsAsync();

      if (!permissionResult.granted) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera permission to take a profile photo.",
        );

        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUriPendingCrop(result.assets[0].uri);
        setPendingSource("camera");
        setCropModalVisible(true);
      }
    } catch (error: any) {
      console.error("[PROFILE] Camera error:", error);

      Alert.alert("Camera Error", "Failed to take photo. Please try again.");
    }
  };

  // ============================================================
  // GALLERY
  // ============================================================

  const openGallery = async () => {
    try {
      let permissionResult =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUriPendingCrop(result.assets[0].uri);
        setPendingSource("gallery");
        setCropModalVisible(true);
      }
    } catch (error: any) {
      console.error("[PROFILE] Gallery error:", error);

      Alert.alert("Gallery Error", "Failed to select image. Please try again.");
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

    const source = pendingSource;

    setUriPendingCrop(null);
    setPendingSource(null);

    if (source === "camera") {
      // Camera flow uploads immediately, same as before.
      await uploadProfileImage(croppedUri);
    } else {
      // Gallery flow still shows the existing Cancel/Save preview.
      setSelectedImageUri(croppedUri);
      setImagePreviewVisible(true);
    }
  };

  // ============================================================
  // SAVE SELECTED GALLERY IMAGE
  // ============================================================

  const handleSaveSelectedImage = async () => {
    if (!selectedImageUri) {
      return;
    }

    const imageUri = selectedImageUri;

    setImagePreviewVisible(false);

    await uploadProfileImage(imageUri);

    setSelectedImageUri(null);
  };

  // ============================================================
  // CANCEL SELECTED GALLERY IMAGE
  // ============================================================

  const handleCancelSelectedImage = () => {
    if (uploadingImage) {
      return;
    }

    setSelectedImageUri(null);
    setImagePreviewVisible(false);
  };

  // ============================================================
  // UPLOAD PROFILE IMAGE
  // ============================================================

  const uploadProfileImage = async (imageUri: string) => {
    if (!user) {
      return;
    }

    try {
      setUploadingImage(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const reader = new FileReader();

      const base64 = await new Promise<string | ArrayBuffer | null>(
        (resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        },
      );

      if (typeof base64 !== "string") {
        throw new Error("Failed to convert image to base64.");
      }

      console.log("[PROFILE IMAGE] Calling updateMobUserImage API...");

      await updateMobUserImage(user.mobUserID, base64);

      const updated = await updateStoredUser({
        imagesPath: imageUri,
      });

      setUser(updated);

      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (err: any) {
      console.error("[PROFILE IMAGE] Upload failed:", err);

      Alert.alert("Upload failed", err?.message ?? "Could not update photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================================
  // OPEN FULL PROFILE IMAGE
  // ============================================================

  const handleOpenProfileImage = () => {
    if (!user?.imagesPath || uploadingImage) {
      return;
    }

    setImageViewerVisible(true);
  };

  // ============================================================
  // MENU
  // ============================================================

  const handleMenuItemPress = (label: string) => {
    setSelectedMenuItem(label);
    setComingSoonVisible(true);
  };

  // ============================================================
  // USER DISPLAY DATA
  // ============================================================

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Unnamed User";

  const userEmail = user?.email || "No email";

  // ============================================================
  // MENU ITEMS
  // ============================================================

  const menuItems: MenuItem[] = [
    {
      id: "my-orders",
      icon: "receipt-outline",
      label: "My Orders",

      // Orders is a real tab.
      // Do NOT show Coming Soon for this item.
      onPress: () => {
        router.push("/(tabs)/orders");
      },
    },
    {
      id: "addresses",
      icon: "location-outline",
      label: "Addresses",
      onPress: () => handleMenuItemPress("Addresses"),
    },
    {
      id: "payment-methods",
      icon: "card-outline",
      label: "Payment Methods",
      onPress: () => handleMenuItemPress("Payment Methods"),
    },
    {
      id: "notifications",
      icon: "notifications-outline",
      label: "Notifications",

      // Notifications is a real screen now.
      // Do NOT show Coming Soon for this item.
      onPress: () => {
        router.push("/notifications");
      },
    },
    {
      id: "privacy-policy",
      icon: "shield-checkmark-outline",
      label: "Privacy Policy",

      // Real screen — do NOT show Coming Soon for this item.
      onPress: () => {
        router.push("/privacy-policy");
      },
    },
    // {
    //   id: "terms-conditions",
    //   icon: "document-text-outline",
    //   label: "Terms & Conditions",

    //   // Real screen — do NOT show Coming Soon for this item.
    //   onPress: () => {
    //     router.push("/terms-conditions");
    //   },
    // },
    {
      id: "about",
      icon: "information-circle-outline",
      label: "About Us",
      onPress: () => handleMenuItemPress("About Us"),
    },
  ];

  // ============================================================
  // LOADING
  // ============================================================

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={typography.body}>Loading profile…</Text>
      </View>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================
            PROFILE HEADER
            ====================================================== */}

        <View style={styles.headerContainer}>
          {/* PROFILE IMAGE */}

          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleOpenProfileImage}
            disabled={uploadingImage || !user.imagesPath}
            activeOpacity={0.85}
          >
            {user.imagesPath ? (
              <>
                <Image
                  source={{
                    uri: user.imagesPath,
                  }}
                  style={styles.profileImage}
                  onLoadEnd={() => setAvatarLoaded(true)}
                />

                {/* Shimmer sits on top until the image has actually
                    decoded, so this never shows a blank circle. */}
                {!avatarLoaded && (
                  <View
                    style={styles.avatarShimmerOverlay}
                    pointerEvents="none"
                  >
                    <ShimmerPlaceholder
                      width={76}
                      height={76}
                      borderRadius={38}
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            )}

            {uploadingImage && (
              <View
                style={[styles.avatarShimmerOverlay, styles.uploadingOverlay]}
              >
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}

            {/* CAMERA BUTTON */}

            <TouchableOpacity
              style={styles.cameraOverlay}
              onPress={handleChangePhoto}
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={PROFILE_ORANGE} />
              ) : (
                <Ionicons name="camera" size={14} color={PROFILE_ORANGE} />
              )}
            </TouchableOpacity>
          </TouchableOpacity>

          {/* NAME + EMAIL */}

          <View style={styles.userInfoContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>

            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>

          {/* EDIT ICON */}

          <TouchableOpacity
            style={styles.editIconButton}
            onPress={() => setEditVisible(true)}
            disabled={loggingOut || saving || deletingAccount}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={25}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* ======================================================
            MENU
            ====================================================== */}

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
              disabled={loggingOut || deletingAccount}
            >
              <View style={styles.menuLeftContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={22} color={PROFILE_ORANGE} />
                </View>

                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ======================================================
            LOGOUT
            ====================================================== */}

        <TouchableOpacity
          style={styles.logoutContainer}
          onPress={handleLogout}
          disabled={loggingOut || deletingAccount}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeftContainer}>
            <View style={styles.iconContainer}>
              {loggingOut ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.danger}
                />
              )}
            </View>

            <Text
              style={[styles.logoutText, loggingOut && styles.logoutDisabled]}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ======================================================
            DELETE ACCOUNT
            ====================================================== */}

        <TouchableOpacity
          style={styles.deleteAccountContainer}
          onPress={handleDeleteAccountConfirmation}
          disabled={loggingOut || deletingAccount}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeftContainer}>
            <View style={styles.iconContainer}>
              {deletingAccount ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.danger}
                />
              )}
            </View>

            <Text
              style={[
                styles.deleteAccountText,
                deletingAccount && styles.logoutDisabled,
              ]}
            >
              {deletingAccount ? "Deleting account..." : "Delete Account"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ======================================================
            EDIT PROFILE MODAL
            ====================================================== */}

        <EditProfileModal
          visible={editVisible}
          saving={saving}
          deleting={deletingAccount}
          initialValues={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            mobileNo: user.mobileNo ?? "",
            email: user.email ?? "",
            userAddress: user.userAddress ?? "",
          }}
          onClose={() => setEditVisible(false)}
          onSave={handleSaveProfile}
          onDeleteAccount={handleDeleteAccount}
        />
      </ScrollView>

      {/* ========================================================
          FULL IMAGE VIEWER
          ======================================================== */}

      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setImageViewerVisible(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={30} color={colors.white} />
          </TouchableOpacity>

          {user.imagesPath && (
            <Image
              source={{
                uri: user.imagesPath,
              }}
              style={styles.fullProfileImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ========================================================
          CUSTOM CROP SCREEN
          Replaces expo-image-picker's native `allowsEditing` crop.
          ======================================================== */}

      <ImageCropModal
        visible={cropModalVisible}
        imageUri={uriPendingCrop}
        onCancel={handleCropCancel}
        onDone={handleCropDone}
      />

      {/* ========================================================
          GALLERY IMAGE PREVIEW
          ======================================================== */}

      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelSelectedImage}
      >
        <View style={styles.imagePreviewOverlay}>
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviewHeader}>
              <Text style={styles.imagePreviewTitle}>Preview Photo</Text>

              <TouchableOpacity
                onPress={handleCancelSelectedImage}
                disabled={uploadingImage}
              >
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedImageUri && (
              <Image
                source={{
                  uri: selectedImageUri,
                }}
                style={styles.selectedImagePreview}
                resizeMode="cover"
              />
            )}

            <View style={styles.imagePreviewActions}>
              <TouchableOpacity
                style={styles.imagePreviewCancelButton}
                onPress={handleCancelSelectedImage}
                disabled={uploadingImage}
              >
                <Text style={styles.imagePreviewCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imagePreviewSaveButton}
                onPress={handleSaveSelectedImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.imagePreviewSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================
          COMING SOON MODAL
          ======================================================== */}

      <Modal
        visible={comingSoonVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setComingSoonVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name="rocket-outline"
                    size={50}
                    color={PROFILE_ORANGE}
                  />
                </View>

                <Text style={styles.modalTitle}>Coming Soon!</Text>

                <Text style={styles.modalSubtitle}>
                  {selectedMenuItem} feature is under development
                </Text>

                <Text style={styles.modalDescription}>
                  We're working hard to bring you this feature. Stay tuned for
                  updates!
                </Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setComingSoonVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // MAIN
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  // ==========================================================
  // PROFILE HEADER
  // Matches the supplied reference design:
  // image -> name/email -> edit icon
  // ==========================================================

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 26,
    backgroundColor: colors.background,
  },

  profileImageContainer: {
    width: 76,
    height: 76,
    position: "relative",
    marginRight: 18,
  },

  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.border,
  },

  profileImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarShimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadingOverlay: {
    borderRadius: 38,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  profileInitials: {
    fontSize: 26,
    fontWeight: "600",
    color: PROFILE_ORANGE,
  },

  cameraOverlay: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  userInfoContainer: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  userName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 3,
  },

  userEmail: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  editIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // ==========================================================
  // MENU
  // ==========================================================

  menuContainer: {
    paddingHorizontal: 26,
  },

  menuItem: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  menuLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconContainer: {
    width: 34,
    marginRight: 0,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  menuLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400",
    color: colors.textPrimary,
  },

  // ==========================================================
  // LOGOUT
  // No extra top border — matching reference image
  // ==========================================================

  logoutContainer: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    marginTop: 4,
  },

  logoutText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.danger,
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  deleteAccountContainer: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingBottom: 12,
  },

  deleteAccountText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.danger,
  },

  // ==========================================================
  // FULL IMAGE VIEWER - FIXED SCROLLING ISSUE
  // ==========================================================

  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },

  imageViewerClose: {
    position: "absolute",
    top: 55,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  fullProfileImage: {
    width: "100%",
    height: "100%",
    maxHeight: "80%",
  },

  // ==========================================================
  // IMAGE PREVIEW
  // ==========================================================

  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  imagePreviewContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: "hidden",
  },

  imagePreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  imagePreviewTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  selectedImagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },

  imagePreviewActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  imagePreviewCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePreviewCancelText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  imagePreviewSaveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: PROFILE_ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePreviewSaveText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },

  // ==========================================================
  // COMING SOON MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 30,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalIconContainer: {
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: PROFILE_ORANGE,
    marginBottom: 12,
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  modalButton: {
    backgroundColor: PROFILE_ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: radius.pill,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
