import React, {
  ReactElement,
  ReactNode,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface KeyboardScreenProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  scrollEnabled?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
}

export default function KeyboardScreen({
  children,
  contentContainerStyle,
  style,
  keyboardVerticalOffset,
  scrollEnabled = true,
  refreshControl,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();

  const defaultOffset =
    Platform.OS === "ios"
      ? insets.top
      : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={
        keyboardVerticalOffset ??
        defaultOffset
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={refreshControl}
        automaticallyAdjustKeyboardInsets={
          Platform.OS === "ios"
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    flexGrow: 1,
  },
});