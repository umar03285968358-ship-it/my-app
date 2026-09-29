import {
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface FooterTab {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FooterProps {
  tabs: FooterTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
}

export default function Footer({
  tabs,
  activeKey,
  onTabPress,
}: FooterProps) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={styles.safeArea}
    >
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive =
            tab.key === activeKey;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() =>
                onTabPress(tab.key)
              }
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={
                  isActive
                    ? colors.accentOrange
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.label,
                  isActive &&
                    styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  labelActive: {
    color: colors.accentOrange,
    fontWeight: "600",
  },
});