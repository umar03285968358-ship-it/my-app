import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileHeader from "@/components/profile/profileHeader";
import ProfileMenu from "@/components/profile/ProfileMenu";
import { colors, spacing, typography } from "@/constants/theme";
import { updateMobUser, updateMobUserImage } from "@/services/api";
import {
  clearSession,
  getUser,
  updateStoredUser,
} from "@/services/authStorage";
import { pickAndPrepareProfileImage } from "@/utils/imageUpload";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

export default function ProfileScreen() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadUser = useCallback(async () => {
    const stored = await getUser();
    console.log("[PROFILE] Stored user:", stored);
    if (stored) setUser(stored);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

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
        email: user.email, // email is not editable, always send the original
        userAddress: form.userAddress,
        pinCode: STATIC_PIN_CODE, // never taken from the UI, always fixed
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

  const handleChangePhoto = async () => {
    if (!user) return;
    try {
      const prepared = await pickAndPrepareProfileImage();
      if (!prepared) return;

      setUploadingImage(true);
      await updateMobUserImage(user.mobUserID, prepared.base64Uri);

      const updated = await updateStoredUser({
        imagesPath: prepared.base64Uri,
      });
      setUser(updated);
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Could not update photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={typography.body}>Loading profile…</Text>
      </View>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed User";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: spacing.xxl,
        marginTop: spacing.md,
      }}
    >
      <ProfileHeader
        name={displayName}
        email={user.email || "No email"}
        imageUri={user.imagesPath ?? null}
        uploading={uploadingImage}
        onChangePhoto={handleChangePhoto}
        onEditPress={() => setEditVisible(true)}
      />

      <ProfileMenu />

      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color={colors.danger}
          style={{ width: 30 }}
        />
        <Text style={styles.logoutLabel}>Logout</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={editVisible}
        saving={saving}
        initialValues={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          mobileNo: user.mobileNo ?? "",
          email: user.email ?? "",
          userAddress: user.userAddress ?? "",
        }}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  logoutLabel: { ...typography.body, color: colors.danger, fontWeight: "600" },
});
