import {
  colors,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { clearSession } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export default function Header({
  title,
  showBack = false,
}: HeaderProps) {
  const [logoutModalVisible, setLogoutModalVisible] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);

      await clearSession();

      setLogoutModalVisible(false);

      router.replace("/(auth)/login" as any);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <SafeAreaView
        edges={["top"]}
        style={styles.safeArea}
      >
        <View style={styles.container}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>
          )}

          <Text
            style={[
              styles.title,
              showBack &&
              styles.titleWithBack,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setLogoutModalVisible(true)
            }
            activeOpacity={0.7}
            style={styles.profileButton}
          >
            <Ionicons
              name="power-outline"
              size={26}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setLogoutModalVisible(false)
        }
      >
        <Pressable
          style={styles.overlay}
          onPress={() =>
            setLogoutModalVisible(false)
          }
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) =>
              e.stopPropagation()
            }
          >
            <View style={styles.modalIconWrap}>
              <Ionicons
                name="log-out-outline"
                size={28}
                color={colors.accentOrange}
              />
            </View>

            <Text style={styles.modalTitle}>
              Log Out
            </Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to log out
              of your account?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() =>
                  setLogoutModalVisible(false)
                }
                disabled={loggingOut}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleConfirmLogout}
                disabled={loggingOut}
              >
                <Text
                  style={
                    styles.logoutButtonText
                  }
                >
                  {loggingOut
                    ? "Logging out..."
                    : "Log Out"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primaryDark,
  },

  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
  },

  backButton: {
    marginRight: spacing.sm,
  },

  title: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: "left",
  },

  titleWithBack: {
    marginLeft: 0,
  },

  profileButton: {
    width: 34,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },

  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },

  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },

  logoutButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
    alignItems: "center",
  },

  logoutButtonText: {
    ...typography.button,
    color: colors.white,
  },
});