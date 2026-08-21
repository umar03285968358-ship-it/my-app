import { colors, radius, spacing, typography } from "@/constants/theme";
import { registerToastListener } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<string, any> = {
  success: "heart",
  error: "alert-circle",
  info: "information-circle",
};

export default function Toast() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<{ message: string; type: string }>({
    message: "",
    type: "info",
  });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return registerToastListener(({ message, type }) => {
      if (timer.current) clearTimeout(timer.current);
      setContent({ message, type });
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();

      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 1800);
    });
  }, []);

  if (!visible) return null;

  const iconColor =
    content.type === "error"
      ? "#d64545"
      : content.type === "success"
        ? "#e0533d"
        : colors.textPrimary;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.pill}>
        <Ionicons name={ICONS[content.type]} size={16} color={iconColor} />
        <Text style={styles.text}>{content.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1c1c1e",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: "88%",
  },
  text: { ...typography.caption, color: "#fff", fontWeight: "700" },
});
