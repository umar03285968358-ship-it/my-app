import { colors, radius, spacing, typography } from "@/constants/theme";
import { changeOrderStatus, RiderOrder } from "@/services/api";
import { getUser } from "@/services/authStorage";
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
  order: RiderOrder | null;
  onClose: () => void;
  onConfirmed: () => void; // parent should refetch orders after this
};

export default function MarkDeliveredModal({
  visible,
  order,
  onClose,
  onConfirmed,
}: Props) {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return; // don't allow dismiss mid-submit
    setRemarks("");
    setErrorMsg(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!order) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const user = await getUser();
      const userID = user?.mobUserID ?? user?.riderID;

      if (!userID) {
        throw new Error("No user session found. Please log in again.");
      }

      await changeOrderStatus({
        orderNo: order.orderNo,
        riderID: order.riderID,
        orderStatus: "Delivered",
        remarks: remarks.trim() || "-",
        userID,
      });

      setSubmitting(false);
      setRemarks("");
      onConfirmed();
      onClose();
    } catch (e: any) {
      console.log("[MARK DELIVERED] Failed:", e);
      setSubmitting(false);
      setErrorMsg(e?.message ?? "Failed to update order status.");
    }
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="checkmark-circle"
              size={42}
              color={colors.success}
            />
          </View>

          <Text style={styles.title}>Mark as Delivered?</Text>
          <Text style={styles.message}>
            Order No. {order.orderNo} for {order.customerName} will be marked as
            delivered.
          </Text>

          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add remarks (optional)"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            multiline
            editable={!submitting}
          />

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
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
    ...typography.h3,
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
  input: {
    ...typography.body,
    color: colors.textPrimary,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    marginBottom: spacing.sm,
    textAlignVertical: "top",
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.success,
    marginLeft: spacing.xs,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
