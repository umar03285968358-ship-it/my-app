import { colors } from "@/constants/theme";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Payment method selection now happens inside checkout/address.tsx as part
 * of the single data-collection step. This screen is kept only so any
 * existing navigation to "/checkout/payment" doesn't crash — it just
 * forwards straight to the real flow.
 */
export default function CheckoutPaymentScreen() {
  useEffect(() => {
    router.replace("/checkout/address");
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primaryDark} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
