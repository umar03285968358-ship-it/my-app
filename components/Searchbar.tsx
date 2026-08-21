import { colors, radius, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showDivider?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const ANIM_DURATION = 320;

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  showDivider = false,
  isOpen,
  onClose,
}: SearchBarProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const hasMeasured = useRef(false);

  // 0 = fully collapsed, 1 = fully open
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    if (!measuredHeight) return;

    Animated.timing(progress, {
      toValue: isOpen ? 1 : 0,
      duration: ANIM_DURATION,
      easing: isOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false, // height can't be driven natively
    }).start();
  }, [isOpen, measuredHeight]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (hasMeasured.current) return;

    const { height } = event.nativeEvent.layout;

    if (height > 0) {
      hasMeasured.current = true;
      setMeasuredHeight(height);
      progress.setValue(isOpen ? 1 : 0); // avoid a jump on first measure
    }
  };

  const animatedHeight = measuredHeight
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, measuredHeight],
      })
    : undefined;

  const animatedOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  const animatedTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0], // tucks up under the header as it collapses
  });

  return (
    <Animated.View
      pointerEvents={isOpen ? "auto" : "none"}
      style={[
        styles.outerWrapper,
        measuredHeight
          ? { height: animatedHeight, overflow: "hidden" }
          : undefined,
      ]}
    >
      <Animated.View
        onLayout={handleLayout}
        style={{
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }],
        }}
      >
        <View style={styles.wrapper}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />

            <TextInput
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              value={value}
              onChangeText={onChangeText}
              returnKeyType="search"
              autoCorrect={false}
            />

            {value.length > 0 && (
              <TouchableOpacity onPress={() => onChangeText("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            <View style={styles.separator} />

            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={styles.collapseButton}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showDivider && <View style={styles.divider} />}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: "transparent",
  },

  wrapper: {
    backgroundColor: "transparent",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },

  separator: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },

  collapseButton: {
    paddingLeft: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 12,
    width: "100%",
  },
});
