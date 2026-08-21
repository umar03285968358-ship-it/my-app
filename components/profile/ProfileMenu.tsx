import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const menuItems: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "My Orders", icon: "receipt-outline" },
  { label: "Addresses", icon: "location-outline" },
  { label: "Payment Methods", icon: "card-outline" },
  { label: "Notifications", icon: "notifications-outline" },
  { label: "Help & Support", icon: "help-circle-outline" },
  { label: "About Us", icon: "information-circle-outline" },
];

export default function ProfileMenu() {
  const handleMenuPress = (label: string) => {
    Alert.alert(label, "Coming soon.");
  };

  return (
    <View style={styles.menu}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => handleMenuPress(item.label)}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={colors.textPrimary}
            style={styles.icon}
          />

          <Text style={styles.menuLabel}>{item.label}</Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    paddingHorizontal: spacing.lg,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  icon: {
    width: 30,
  },

  menuLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
});
