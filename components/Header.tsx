import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export default function Header({
  title,
  showBack = true,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
          <Ionicons name={rightIcon} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  iconBtn: { width: 32, alignItems: "center" },
  title: { ...typography.h3, color: colors.textPrimary },
});
