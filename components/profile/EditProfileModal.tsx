import { colors, radius, spacing, typography } from "@/constants/theme";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserForm = {
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
  userAddress: string;
};

type Props = {
  visible: boolean;
  initialValues: UserForm;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onSave: (values: UserForm) => void;
  onDeleteAccount: () => Promise<void>;
};

// Your theme's actual orange.
const PROFILE_ORANGE = colors.primaryDark;

export default function EditProfileModal({
  visible,
  initialValues,
  saving,
  deleting,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<UserForm>(initialValues);

  React.useEffect(() => {
    if (visible) {
      setForm(initialValues);
    }
  }, [visible, initialValues]);

  const update = (key: keyof UserForm) => (value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const busy = saving || deleting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (deleting) return;
        onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>

            <TouchableOpacity onPress={onClose} disabled={busy}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>First Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor={colors.textSecondary}
              value={form.firstName}
              onChangeText={update("firstName")}
            />

            <Text style={styles.label}>Last Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor={colors.textSecondary}
              value={form.lastName}
              onChangeText={update("lastName")}
            />

            <Text style={styles.label}>Mobile Number</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={colors.textSecondary}
              value={form.mobileNo}
              onChangeText={update("mobileNo")}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor={colors.textSecondary}
              value={form.userAddress}
              onChangeText={update("userAddress")}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Email</Text>

            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={form.email}
              editable={false}
              selectTextOnFocus={false}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => onSave(form)}
              disabled={busy}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "90%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: spacing.xs,
  },

  scrollArea: {
    flexGrow: 0,
  },

  scrollContent: {
    paddingBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 2,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },

  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },

  inputDisabled: {
    backgroundColor: colors.border + "40",
    color: colors.textSecondary,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelText: {
    ...typography.body,
    color: colors.textPrimary,
  },

  saveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: PROFILE_ORANGE,
  },

  saveText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
  },
});
