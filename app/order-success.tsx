import Button from "@/components/Button";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function OrderSuccessScreen() {
  const orderId = useMemo(
    () => `#BK${Math.floor(1000 + Math.random() * 9000)}`,
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={48} color={colors.white} />
      </View>

      <Text style={styles.title}>Order Placed{"\n"}Successfully!</Text>
      <Text style={styles.subtitle}>
        Your order has been placed.{"\n"}We will deliver it to you soon.
      </Text>
      <Text style={styles.orderId}>Order ID: {orderId}</Text>

      <View style={styles.footer}>
        <Button
          title="Track Order"
          variant="secondary"
          onPress={() => router.replace("/(tabs)")}
        />
        <Text style={styles.backHome} onPress={() => router.replace("/(tabs)")}>
          Back to Home
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: radius.pill,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  orderId: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  footer: {
    position: "absolute",
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
  },
  backHome: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
