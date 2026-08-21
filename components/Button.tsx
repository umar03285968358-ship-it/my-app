import { colors, radius, spacing, typography } from "@/constants/theme";
import React from "react";
import {
    ActivityIndicator,
    GestureResponderEvent,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant].container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primaryDark
              : colors.white
          }
        />
      ) : (
        <Text style={[styles.text, variantStyles[variant].text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: { ...typography.button },
  disabled: { opacity: 0.5 },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle }
> = {
  primary: {
    container: { backgroundColor: colors.primaryDark },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.accentOrange },
    text: { color: colors.white },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.primaryDark,
    },
    text: { color: colors.primaryDark },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.primaryDark },
  },
};
