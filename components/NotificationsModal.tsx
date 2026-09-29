import { colors, radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export type NotificationModalData = {
  title: string;
  message: string;
  time: string;
  type: "order" | "delivery" | "promo" | "payment" | "system";
  read: boolean;
};

type NotificationsModalProps = {
  visible: boolean;
  notification: NotificationModalData | null;
  onClose: () => void;
};

type NotificationMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
};

function withOpacity(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TYPE_META: Record<
  NotificationModalData["type"],
  NotificationMeta
> = {
  order: {
    icon: "receipt-outline",
    fg: colors.primaryDark,
    bg: withOpacity(colors.primaryDark, 0.12),
  },

  delivery: {
    icon: "bicycle-outline",
    fg: colors.accentOrangeDark,
    bg: withOpacity(colors.accentOrangeDark, 0.12),
  },

  promo: {
    icon: "pricetag-outline",
    fg: colors.primaryLight,
    bg: withOpacity(colors.primaryLight, 0.12),
  },

  payment: {
    icon: "card-outline",
    fg: colors.success,
    bg: withOpacity(colors.success, 0.12),
  },

  system: {
    icon: "information-circle-outline",
    fg: colors.textSecondary,
    bg: withOpacity(colors.textSecondary, 0.12),
  },
};

export default function NotificationsModal({
  visible,
  notification,
  onClose,
}: NotificationsModalProps) {
  if (!notification) return null;

  const meta = TYPE_META[notification.type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* ======================================================
              CLOSE BUTTON
          ====================================================== */}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Ionicons
              name="close"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* ======================================================
              ICON
          ====================================================== */}

          <View
            style={[
              styles.iconCircle,
              { backgroundColor: meta.bg },
            ]}
          >
            <Ionicons
              name={meta.icon}
              size={28}
              color={meta.fg}
            />
          </View>

          {/* ======================================================
              TITLE
          ====================================================== */}

          <Text style={styles.title}>
            {notification.title}
          </Text>

          {/* ======================================================
              TIME
          ====================================================== */}

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />

            <Text style={styles.time}>
              {notification.time}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* ======================================================
              FULL NOTIFICATION MESSAGE
          ====================================================== */}

          <ScrollView
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.message}>
              {notification.message}
            </Text>
          </ScrollView>

          {/* ======================================================
              CLOSE BUTTON
          ====================================================== */}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  modalCard: {
    width: "100%",
    maxHeight: "78%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: 35,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },

  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  messageScroll: {
    width: "100%",
    maxHeight: 300,
  },

  messageContent: {
    paddingBottom: 4,
  },

  message: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: "left",
  },

  doneButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
