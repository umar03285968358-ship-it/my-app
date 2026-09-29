import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  orderNo: number | null;
  onClose: () => void;
  // Return the cancellation comment to the parent.
  onConfirm: (comment: string) => Promise<void>;
};

export default function CancelOrderModal({
  visible,
  orderNo,
  onClose,
  onConfirm,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const handleConfirm = async () => {
    if (submitting) return;

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      setErrorMsg("Please enter a cancellation reason.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      await onConfirm(trimmedComment);

      // onConfirm is expected to close the modal itself on success
      // (so the parent controls when `orderNo` is cleared).
    } catch (e: any) {
      console.log("[CANCEL ORDER MODAL] Failed to cancel order:", e);
      setErrorMsg(e?.message || "Failed to cancel order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;

    setErrorMsg(null);
    setComment("");
    onClose();
  };

  if (orderNo == null) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={colors.danger}
            />
          </View>

          <Text style={styles.title}>Cancel Order?</Text>

          <Text style={styles.message}>
            Are you sure you want to cancel Order No. {orderNo}? This action
            cannot be undone.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Cancellation Reason <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={(text) => {
                setComment(text);

                if (text.trim()) {
                  setErrorMsg(null);
                }
              }}
              placeholder="Please tell us why you want to cancel this order..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {comment.length}/500
            </Text>
          </View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClose}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Keep Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.dangerButton,
                !comment.trim() && styles.disabledDangerButton,
              ]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.dangerButtonText}>Yes, Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },

  iconWrap: {
    marginBottom: spacing.sm,
  },

  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },

  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  inputContainer: {
    width: "100%",
    marginBottom: spacing.sm,
  },

  inputLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },

  required: {
    color: colors.danger,
  },

  commentInput: {
    width: "100%",
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },

  characterCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },

  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  secondaryButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },

  dangerButton: {
    backgroundColor: colors.danger,
  },

  disabledDangerButton: {
    opacity: 0.6,
  },

  dangerButtonText: {
    ...typography.button,
    color: colors.white,
  },
});