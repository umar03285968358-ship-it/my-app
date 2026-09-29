// components/common/ShimmerPlaceholder.tsx

import { colors } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

type Props = {
  width: number | `${number}%`;
  height: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Lightweight, dependency-free shimmer/skeleton block.
 *
 * Use this anywhere an image (or any async content) is still loading,
 * so the layout never shows a blank flash while it resolves — e.g. the
 * profile avatar, the crop screen's preview, gallery thumbnails, etc.
 */
export default function ShimmerPlaceholder({
  width,
  height,
  borderRadius = 8,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
    overflow: "hidden",
  },
});