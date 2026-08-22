
// ProfileScreen.js
import EditProfileModal from "@/components/profile/EditProfileModal";
import { typography } from "@/constants/theme";
import { updateMobUser, updateMobUserImage } from "@/services/api";
import {
  clearSession,
  getUser,
  updateStoredUser,
} from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Pin code is not user-editable — always sent as this fixed value.
const STATIC_PIN_CODE = "1234";

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

export default function ProfileScreen() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadUser = useCallback(async () => {
    const stored = await getUser();

    console.log("[PROFILE] Stored user:", stored);

    if (stored) {
      setUser(stored);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ============================================================
  // FULL LOGOUT + AUTH STORAGE VERIFICATION
  // ============================================================
  const performFullLogout = async () => {
    try {
      setLoggingOut(true);

      console.log("========================================");
      console.log("🚀 [LOGOUT] Starting comprehensive logout...");
      console.log("========================================");

      // ========================================================
      // 1. CHECK AUTH STORAGE BEFORE LOGOUT
      // ========================================================
      console.log("🔎 [AUTH STORAGE] Checking BEFORE logout...");

      try {
        const userBeforeLogout = await getUser();

        console.log(
          "🔎 [AUTH STORAGE] User BEFORE logout:",
          userBeforeLogout
        );

        if (userBeforeLogout) {
          console.log(
            "✅ [AUTH STORAGE] User data exists before logout."
          );
        } else {
          console.warn(
            "⚠️ [AUTH STORAGE] No user data found before logout."
          );
        }
      } catch (error) {
        console.error(
          "❌ [AUTH STORAGE] Failed to read user before logout:",
          error
        );
      }

      // ========================================================
      // 2. CLEAR ASYNC STORAGE
      // ========================================================
      console.log("📦 [LOGOUT] Clearing AsyncStorage...");
      
     
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        const allKeysBefore = await AsyncStorage.getAllKeys();

        console.log(
          "🔎 [ASYNC STORAGE] Keys BEFORE clear:",
          allKeysBefore
        );

        if (allKeysBefore.length > 0) {
          await AsyncStorage.multiRemove(allKeysBefore);
          console.log(
            "✅ [ASYNC STORAGE] Removed all existing keys."
          );
        }

        // Extra clear to make sure nothing remains.
        await AsyncStorage.clear();

        console.log(AsyncStorage.getItem('TOKEN_KEY'),'Logix Testing')

        console.log(
          "✅ [ASYNC STORAGE] AsyncStorage.clear() completed."
        );
      } catch (error) {
        console.warn(
          "⚠️ [ASYNC STORAGE] Clear warning:",
          error
        );
      }

      // ========================================================
      // 3. CLEAR SECURE STORE
      // ========================================================
      console.log("🔐 [LOGOUT] Clearing SecureStore...");

      try {
        const SecureStore = require("expo-secure-store");

        const tokenKeys = [
          "access_token",
          "refresh_token",
          "user_token",
          "auth_token",
          "fcm_token",
          "device_token",
          "session_token",
          "api_token",
        ];

        for (const key of tokenKeys) {
          try {
            await SecureStore.deleteItemAsync(key);

            console.log(
              `🗑️ [SECURE STORE] Deleted key: ${key}`
            );
          } catch (e) {
            console.log(
              `ℹ️ [SECURE STORE] Key not found or could not delete: ${key}`
            );
          }
        }

        console.log(
          "✅ [SECURE STORE] SecureStore cleanup completed."
        );
      } catch (secureError) {
        console.warn(
          "⚠️ [SECURE STORE] Clear warning:",
          secureError
        );
      }

      // ========================================================
      // 4. CLEAR AUTH SESSION
      // ========================================================
      console.log("👤 [AUTH STORAGE] Calling clearSession()...");

      try {
        await clearSession();

        console.log(
          "✅ [AUTH STORAGE] clearSession() completed."
        );
      } catch (sessionError) {
        console.error(
          "❌ [AUTH STORAGE] clearSession() failed:",
          sessionError
        );
      }

      // ========================================================
      // 5. VERIFY AUTH STORAGE AFTER clearSession()
      // ========================================================
      console.log("========================================");
      console.log("🔍 [AUTH STORAGE] VERIFYING AFTER LOGOUT");
      console.log("========================================");

      try {
        const userAfterLogout = await getUser();

        console.log(
          "🔎 [AUTH STORAGE] User AFTER logout:",
          userAfterLogout
        );

        if (
          userAfterLogout === null ||
          userAfterLogout === undefined
        ) {
          console.log(
            "✅ [AUTH STORAGE] SUCCESS!"
          );

          console.log(
            "✅ [AUTH STORAGE] User cache has been completely cleared."
          );
        } else {
          console.error(
            "❌ [AUTH STORAGE] FAILED!"
          );

          console.error(
            "❌ [AUTH STORAGE] User cache STILL EXISTS:",
            userAfterLogout
          );
        }
      } catch (error) {
        console.error(
          "❌ [AUTH STORAGE] Failed to verify user storage:",
          error
        );
      }

      // ========================================================
      // 6. VERIFY AUTH KEYS IN ASYNC STORAGE
      // ========================================================
      console.log(
        "🔎 [AUTH STORAGE] Checking auth_token and auth_user..."
      );

      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        const remainingKeys = await AsyncStorage.getAllKeys();

        console.log(
          "🔎 [ASYNC STORAGE] Remaining keys AFTER logout:",
          remainingKeys
        );

        const authKeys = remainingKeys.filter(
          (key: string) =>
            key === "auth_token" ||
            key === "auth_user"
        );

        if (authKeys.length === 0) {
          console.log(
            "✅ [AUTH STORAGE] VERIFIED!"
          );

          console.log(
            "✅ [AUTH STORAGE] auth_token and auth_user are completely cleared."
          );
        } else {
          console.error(
            "❌ [AUTH STORAGE] WARNING!"
          );

          console.error(
            "❌ [AUTH STORAGE] Auth keys STILL EXIST:",
            authKeys
          );

          for (const key of authKeys) {
            const value = await AsyncStorage.getItem(key);

            console.error(
              `❌ [AUTH STORAGE] ${key} still contains:`,
              value
            );
          }
        }
      } catch (error) {
        console.error(
          "❌ [AUTH STORAGE] Failed to verify AsyncStorage:",
          error
        );
      }

      // ========================================================
      // 7. CLEAR APP CACHE DIRECTORY
      // ========================================================
      console.log("🗑️ [CACHE] Clearing app cache...");

      try {
        const FileSystem = require("expo-file-system");

        if (Platform.OS !== "web") {
          const cacheDir = FileSystem.cacheDirectory;

          if (cacheDir) {
            try {
              const files =
                await FileSystem.readDirectoryAsync(cacheDir);

              console.log(
                "🔎 [CACHE] Files found:",
                files
              );

              for (const file of files) {
                try {
                  const filePath = cacheDir + file;

                  await FileSystem.deleteAsync(filePath, {
                    idempotent: true,
                  });

                  console.log(
                    `🗑️ [CACHE] Deleted: ${file}`
                  );
                } catch (e) {
                  console.warn(
                    `⚠️ [CACHE] Could not delete: ${file}`
                  );
                }
              }

              console.log(
                "✅ [CACHE] App cache cleanup completed."
              );
            } catch (readError) {
              console.warn(
                "⚠️ [CACHE] Cache directory read error:",
                readError
              );
            }
          }
        }
      } catch (fsError) {
        console.warn(
          "⚠️ [CACHE] FileSystem cache clear warning:",
          fsError
        );
      }

      // ========================================================
      // 8. CLEAR SPECIFIC STORAGE KEYS
      // ========================================================
      console.log(
        "🔑 [STORAGE] Removing specific storage keys..."
      );

      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        const specificKeys = [
          "user",
          "profile",
          "settings",
          "preferences",
          "cart",
          "favorites",
          "wishlist",
          "orders",
          "history",
          "search_history",
          "recent_searches",
          "app_state",
          "persist:root",
          "reduxPersist:root",
        ];

        const allKeys = await AsyncStorage.getAllKeys();

        const keysToRemove = allKeys.filter(
          (key: string) =>
            specificKeys.some((specific) =>
              key.includes(specific)
            )
        );

        console.log(
          "🔎 [STORAGE] Matching keys:",
          keysToRemove
        );

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);

          console.log(
            "✅ [STORAGE] Specific keys removed."
          );
        } else {
          console.log(
            "ℹ️ [STORAGE] No specific keys found."
          );
        }
      } catch (storageError) {
        console.warn(
          "⚠️ [STORAGE] Specific storage clear warning:",
          storageError
        );
      }

      // ========================================================
      // 9. WEB CACHE
      // ========================================================
      if (Platform.OS === "web") {
        console.log("🌐 [WEB] Clearing web cache...");

        try {
          if ("caches" in window) {
            const cacheKeys = await caches.keys();

            console.log(
              "🔎 [WEB] Cache keys:",
              cacheKeys
            );

            for (const key of cacheKeys) {
              await caches.delete(key);
            }

            console.log(
              "✅ [WEB] Browser caches cleared."
            );
          }

          // localStorage
          try {
            localStorage.clear();

            console.log(
              "✅ [WEB] localStorage cleared."
            );
          } catch (e) {
            console.warn(
              "⚠️ [WEB] localStorage clear warning:",
              e
            );
          }

          // sessionStorage
          try {
            sessionStorage.clear();

            console.log(
              "✅ [WEB] sessionStorage cleared."
            );
          } catch (e) {
            console.warn(
              "⚠️ [WEB] sessionStorage clear warning:",
              e
            );
          }

          // Cookies
          try {
            document.cookie
              .split(";")
              .forEach((c) => {
                document.cookie = c
                  .replace(/^ +/, "")
                  .replace(
                    /=.*/,
                    "=;expires=" +
                      new Date().toUTCString() +
                      ";path=/"
                  );
              });

            console.log(
              "✅ [WEB] Cookies cleared."
            );
          } catch (e) {
            console.warn(
              "⚠️ [WEB] Cookie clear warning:",
              e
            );
          }
        } catch (webError) {
          console.warn(
            "⚠️ [WEB] Web cache clear warning:",
            webError
          );
        }
      }

      // ========================================================
      // 10. FINAL AUTH STORAGE VERIFICATION
      // ========================================================
      console.log("========================================");
      console.log("🔐 [FINAL AUTH STORAGE CHECK]");
      console.log("========================================");

      try {
        const finalUser = await getUser();

        if (
          finalUser === null ||
          finalUser === undefined
        ) {
          console.log(
            "✅ FINAL RESULT: AUTH USER CACHE IS EMPTY."
          );
        } else {
          console.error(
            "❌ FINAL RESULT: AUTH USER CACHE STILL EXISTS:",
            finalUser
          );
        }
      } catch (error) {
        console.error(
          "❌ FINAL AUTH STORAGE CHECK FAILED:",
          error
        );
      }

      console.log("========================================");
      console.log(
        "✅ [LOGOUT] Comprehensive logout completed successfully!"
      );
      console.log("========================================");

      // ========================================================
      // 11. NAVIGATE TO LOGIN
      // ========================================================
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("❌ [LOGOUT] Logout error:", error);

      Alert.alert(
        "Logout Error",
        "Failed to complete logout. Please try again or force close the app."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out? All your local data will be cleared.",
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
      ]
    );
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
    if (!user) return;

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
      Alert.alert(
        "Update failed",
        err?.message ?? "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE PHOTO
  // ============================================================
  const handleChangePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: false,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets[0]
      ) {
        const imageUri = result.assets[0].uri;

        await uploadProfileImage(imageUri);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        "Failed to pick image. Please try again."
      );

      console.error(
        "Image picker error:",
        error
      );
    }
  };

  const uploadProfileImage = async (
    imageUri: string
  ) => {
    if (!user) return;

    try {
      setUploadingImage(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const reader = new FileReader();

      const base64 = await new Promise((resolve) => {
        reader.onload = () =>
          resolve(reader.result);

        reader.readAsDataURL(blob);
      });

      await updateMobUserImage(
        user.mobUserID,
        base64 as string
      );

      const updated = await updateStoredUser({
        imagesPath: imageUri,
      });

      setUser(updated);

      Alert.alert(
        "Success",
        "Profile photo updated successfully!"
      );
    } catch (err: any) {
      Alert.alert(
        "Upload failed",
        err?.message ?? "Could not update photo."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================================
  // MENU
  // ============================================================
  const handleMenuItemPress = (
    label: string
  ) => {
    setSelectedMenuItem(label);
    setComingSoonVisible(true);
  };

  const displayName =
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unnamed User";

  const userEmail =
    user?.email || "No email";

  const menuItems: MenuItem[] = [
    {
      id: "my-orders",
      icon: "receipt-outline",
      label: "My Orders",
      onPress: () =>
        handleMenuItemPress("My Orders"),
    },
    {
      id: "addresses",
      icon: "location-outline",
      label: "Addresses",
      onPress: () =>
        handleMenuItemPress("Addresses"),
    },
    {
      id: "payment-methods",
      icon: "card-outline",
      label: "Payment Methods",
      onPress: () =>
        handleMenuItemPress("Payment Methods"),
    },
    {
      id: "notifications",
      icon: "notifications-outline",
      label: "Notifications",
      onPress: () =>
        handleMenuItemPress("Notifications"),
    },
    {
      id: "help-support",
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () =>
        handleMenuItemPress("Help & Support"),
    },
    {
      id: "about",
      icon: "information-circle-outline",
      label: "About Us",
      onPress: () =>
        handleMenuItemPress("About Us"),
    },
  ];

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={typography.body}>
          Loading profile…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={
              styles.profileImageContainer
            }
            onPress={handleChangePhoto}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  styles.uploadingContainer,
                ]}
              >
                <ActivityIndicator
                  size="large"
                  color="#4CAF50"
                />
              </View>
            ) : user.imagesPath ? (
              <>
                <Image
                  source={{
                    uri: user.imagesPath,
                  }}
                  style={styles.profileImage}
                />

                <View
                  style={
                    styles.cameraOverlay
                  }
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
              </>
            ) : (
              <>
                <View
                  style={
                    styles.profileImagePlaceholder
                  }
                >
                  <Text
                    style={
                      styles.profileInitials
                    }
                  >
                    {displayName
                      .split(" ")
                      .map(
                        (n) => n[0]
                      )
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>

                <View
                  style={
                    styles.cameraOverlay
                  }
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>
            {displayName}
          </Text>

          <Text style={styles.userEmail}>
            {userEmail}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              setEditVisible(true)
            }
          >
            <Text
              style={
                styles.editButtonText
              }
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.menuContainer}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                style={
                  styles.menuLeftContainer
                }
              >
                <View
                  style={
                    styles.iconContainer
                  }
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color="#2E7D32"
                  />
                </View>

                <Text
                  style={styles.menuLabel}
                >
                  {item.label}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#C4C4C4"
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={
            styles.logoutContainer
          }
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <View
            style={
              styles.menuLeftContainer
            }
          >
            <View
              style={
                styles.iconContainer
              }
            >
              {loggingOut ? (
                <ActivityIndicator
                  size="small"
                  color="#FF4444"
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#FF4444"
                />
              )}
            </View>

            <Text
              style={[
                styles.logoutText,
                loggingOut &&
                  styles.logoutDisabled,
              ]}
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </Text>
          </View>
        </TouchableOpacity>

        <EditProfileModal
          visible={editVisible}
          saving={saving}
          initialValues={{
            firstName:
              user.firstName ?? "",
            lastName:
              user.lastName ?? "",
            mobileNo:
              user.mobileNo ?? "",
            email:
              user.email ?? "",
            userAddress:
              user.userAddress ?? "",
          }}
          onClose={() =>
            setEditVisible(false)
          }
          onSave={handleSaveProfile}
        />
      </ScrollView>

      <Modal
        visible={comingSoonVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          setComingSoonVisible(false)
        }
      >
        <TouchableWithoutFeedback
          onPress={() =>
            setComingSoonVisible(false)
          }
        >
          <View
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback>
              <View
                style={styles.modalContent}
              >
                <View
                  style={
                    styles.modalIconContainer
                  }
                >
                  <Ionicons
                    name="rocket-outline"
                    size={50}
                    color="#4CAF50"
                  />
                </View>

                <Text
                  style={styles.modalTitle}
                >
                  Coming Soon!
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {selectedMenuItem} feature
                  is under development
                </Text>

                <Text
                  style={
                    styles.modalDescription
                  }
                >
                  We're working hard to
                  bring you this feature.
                  Stay tuned for updates!
                </Text>

                <TouchableOpacity
                  style={
                    styles.modalButton
                  }
                  onPress={() =>
                    setComingSoonVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.modalButtonText
                    }
                  >
                    Got it
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },

  headerContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  profileImageContainer: {
    marginBottom: 16,
    position: "relative",
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#E8F5E9",
  },

  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadingContainer: {
    backgroundColor: "#F5F5F5",
  },

  profileInitials: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2E7D32",
  },

  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },

  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },

  menuLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 32,
    marginRight: 12,
  },

  menuLabel: {
    fontSize: 16,
    color: "#1A1A1A",
  },

  logoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },

  logoutText: {
    fontSize: 16,
    color: "#FF4444",
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
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
    color: "#1A1A1A",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4CAF50",
    marginBottom: 12,
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
