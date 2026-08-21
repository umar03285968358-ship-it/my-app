import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatusBarBackground() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { height: insets.top }]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primaryDark,
    zIndex: 999,
  },
});
