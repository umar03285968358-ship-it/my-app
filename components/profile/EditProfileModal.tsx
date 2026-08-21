import { colors, radius, spacing, typography } from "@/constants/theme";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
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
  onClose: () => void;
  onSave: (values: UserForm) => void;
};

export default function EditProfileModal({
  visible,
  initialValues,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<UserForm>(initialValues);

  React.useEffect(() => {
    if (visible) setForm(initialValues);
  }, [visible, initialValues]);

  const update = (key: keyof UserForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Edit Profile</Text>

          {/* First Name */}
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor={colors.textSecondary}
            value={form.firstName}
            onChangeText={update("firstName")}
          />

          {/* Last Name */}
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor={colors.textSecondary}
            value={form.lastName}
            onChangeText={update("lastName")}
          />

          {/* Mobile Number */}
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor={colors.textSecondary}
            value={form.mobileNo}
            onChangeText={update("mobileNo")}
            keyboardType="phone-pad"
          />

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            placeholderTextColor={colors.textSecondary}
            value={form.userAddress}
            onChangeText={update("userAddress")}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={form.email}
            editable={false}
            selectTextOnFocus={false}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => onSave(form)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },

  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
  },

  inputDisabled: {
    backgroundColor: colors.border + "40",
    color: colors.textSecondary,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
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
    backgroundColor: colors.accentOrange,
  },

  saveText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "700",
  },
});
