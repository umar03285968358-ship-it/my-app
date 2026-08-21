import { colors, radius, spacing, typography } from "@/constants/theme";
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

interface RiderProfileButtonProps {
  orderCount?: number;
}

export default function RiderProfileButton({
  orderCount,
}: RiderProfileButtonProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handlePress = () => {
    setShowLogoutModal(true);
  };

  const closeModal = () => {
    if (!isLoggingOut) {
      setShowLogoutModal(false);
    }
  };

  const doLogout = async () => {
    try {
      setIsLoggingOut(true);
      await clearSession();
    } finally {
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      router.replace("/(auth)/login");
    }
  };

  return (
    <>
      {/* ============================================================
          HEADER RIGHT ACTIONS
      ============================================================ */}

      <View style={styles.headerActions}>
        {/* ORDER COUNT */}

        {typeof orderCount === "number" && (
          <View style={styles.headerCountBadge}>
            <Ionicons
              name="receipt-outline"
              size={15}
              color={colors.primaryDark}
            />

            <Text style={styles.headerCountText}>{orderCount}</Text>
          </View>
        )}

        {/* PROFILE BUTTON */}

        <TouchableOpacity
          onPress={handlePress}
          style={styles.profileButton}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-circle-outline"
            size={28}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </View>

      {/* ============================================================
          LOGOUT MODAL
      ============================================================ */}

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          {/* Close modal when tapping outside */}

          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View style={styles.modalContainer}>
            {/* ICON */}

            <View style={styles.iconContainer}>
              <Ionicons
                name="log-out-outline"
                size={30}
                color={colors.primaryDark}
              />
            </View>

            {/* CONTENT */}

            <Text style={styles.title}>Log out?</Text>

            <Text style={styles.description}>
              Are you sure you want to log out of your account? You’ll need to
              sign in again to access your account.
            </Text>

            {/* BUTTONS */}

            <View style={styles.buttonContainer}>
              {/* CANCEL */}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* LOGOUT */}

              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  isLoggingOut && styles.disabledButton,
                ]}
                onPress={doLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />

                <Text style={styles.logoutButtonText}>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ================================================================
  // HEADER
  // ================================================================

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },

  headerCountBadge: {
    minWidth: 42,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark + "12",
    borderWidth: 1,
    borderColor: colors.primaryDark + "20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },

  headerCountText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "800",
    marginLeft: 4,
  },

  profileButton: {
    padding: spacing.xs,
  },

  // ================================================================
  // OVERLAY
  // ================================================================

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // ================================================================
  // MODAL
  // ================================================================

  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 25,

    // Android shadow
    elevation: 12,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 26,
    paddingHorizontal: 8,
  },

  // ================================================================
  // BUTTONS
  // ================================================================

  buttonContainer: {
    width: "100%",
    gap: 12,
  },

  cancelButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  logoutButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
