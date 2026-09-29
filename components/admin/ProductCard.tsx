import { colors, radius, spacing, typography } from "@/constants/theme";
import { Product } from "@/types/admin";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>
          Stock: {product.stock ?? "-"} · Rs. {product.price}
        </Text>
      </View>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: product.isActive
              ? colors.success
              : colors.danger,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  info: {
    gap: 4,
  },
  name: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});