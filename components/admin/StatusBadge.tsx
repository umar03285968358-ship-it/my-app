import { colors, radius, spacing, typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type StatusStyle = {
  bg: string;
  fg: string;
};

type StatusStyleMap = Record<string, StatusStyle>;

const STATUS_STYLES: StatusStyleMap = {
  pending: {
    bg: colors.accentOrange + "18",
    fg: colors.accentOrange,
  },

  processing: {
    bg: colors.accentOrangeDark + "18",
    fg: colors.accentOrangeDark,
  },

  dispatched: {
    bg: colors.primaryDark + "18",
    fg: colors.primaryDark,
  },

  "out for delivery": {
    bg: colors.primaryDark + "18",
    fg: colors.primaryDark,
  },

  delivered: {
    bg: colors.success + "18",
    fg: colors.success,
  },

  cancelled: {
    bg: colors.danger + "18",
    fg: colors.danger,
  },
};

// Display-only relabeling. The backend now writes "Dispatched" for new
// status changes, but older orders created before that switch still have
// the literal string "Out for Delivery" stored against them. This map
// only affects what text is shown on screen — it never changes the
// underlying order data or what gets sent back to the API.
const DISPLAY_LABEL_OVERRIDES: Record<string, string> = {
  "out for delivery": "Dispatched",
};

const DEFAULT_STYLE: StatusStyle = {
  bg: colors.border,
  fg: colors.textSecondary,
};

export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  const key = (status ?? "").trim().toLowerCase();

  const style = STATUS_STYLES[key] ?? DEFAULT_STYLE;

  const label =
    DISPLAY_LABEL_OVERRIDES[key] ?? status ?? "Unknown";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: style.fg,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },

  label: {
    ...typography.caption,
    fontWeight: "700",
  },
});