import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
}

export default function Input({
  label,
  icon,
  isPassword = false,
  error,
  style,
  ...rest
}: InputProps) {
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error && styles.errorBorder]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure((s) => !s)}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md, width: "100%" },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  errorBorder: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, ...typography.body, color: colors.textPrimary },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
