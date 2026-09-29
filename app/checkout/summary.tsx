import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { insertOrder } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { formatRs } from "@/utils/currency";
import { buildOrderDetail } from "@/utils/orderHelpers";
import { getDiscountedPrice, getProductImageUrl } from "@/utils/pricing";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#F1731F";
const SOFT_ORANGE = "#FFF1E8";

export default function CheckoutSummaryScreen() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { data, resetCheckout, logCheckoutData } = useCheckout();

  const [showConfirm, setShowConfirm] = useState(false);
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    console.log("====================================");
    console.log("[CHECKOUT SUMMARY] Placing order...");
    console.log("[CHECKOUT SUMMARY] Full checkout data:");
    logCheckoutData();
    console.log("====================================");

    const user = await getUser();
    const mobUserID = user?.MobUserID ?? user?.mobUserID ?? user?.id;

    if (!mobUserID) {
      showToast("Please log in to place an order", "error");
      setShowConfirm(false);
      return;
    }

    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      setShowConfirm(false);
      return;
    }

    const orderDiscount = items.reduce(
      (sum, i) => sum + (i.product.discRupees ?? 0) * i.quantity,
      0,
    );

    // IMPORTANT: Check if coordinates are present
    console.log("[CHECKOUT SUMMARY] Coordinates check:", {
      latitude: data.latitude,
      longitude: data.longitude,
      hasCoordinates: data.latitude !== null && data.longitude !== null,
    });

    // Prepare the payload with coordinates
    const orderPayload = {
      mobUserID,
      paymentMethod: data.paymentMethod,
      paymentReceiptDoc: data.screenshotBase64 ?? "-",
      orderTotal: subtotal + deliveryFee,
      orderDiscount,
      netTotal: total,
      deliveryType: data.deliveryType,
      deliveryAddress: data.address,
      deliveryInstruction: data.note?.trim() || "-",
      deliveryContact: data.contactNumber,
      // ADD THESE LINES - Send coordinates to backend
      latitude: data.latitude !== null ? String(data.latitude) : "0",
      longitude: data.longitude !== null ? String(data.longitude) : "0",
      orderDetail: buildOrderDetail(items),
    };

    console.log("[CHECKOUT SUMMARY] Order payload being sent:", {
      ...orderPayload,
      paymentReceiptDoc: orderPayload.paymentReceiptDoc ? "PRESENT" : "NONE",
      orderDetail: `${orderPayload.orderDetail.length} items`,
      latitude: orderPayload.latitude,
      longitude: orderPayload.longitude,
    });

    try {
      setPlacing(true);

      const response = await insertOrder(orderPayload);

      console.log("[CHECKOUT SUMMARY] Order placed successfully:", response);

      await clearCart();
      resetCheckout();
      setShowConfirm(false);

      showToast("Order placed successfully!", "success");
      router.replace("/order-success");
    } catch (e: any) {
      console.error("[CHECKOUT SUMMARY] Failed to place order:", e);
      setShowConfirm(false);

      showToast(
        e?.message || "Failed to place order. Please try again.",
        "error",
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={21} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Order Summary</Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ITEMS */}
        <Text style={styles.sectionTitle}>Items ({items.length})</Text>

        {items.map((item) => {
          const price = getDiscountedPrice(item.product);
          const imageUrl = getProductImageUrl(item.product);

          return (
            <View key={item.product.productID} style={styles.itemRow}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImageFallback]}>
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.productTitle}
                </Text>

                <Text style={styles.itemMeta}>
                  {item.quantity} x {formatRs(price)}
                </Text>
              </View>

              <Text style={styles.itemTotal}>
                {formatRs(price * item.quantity)}
              </Text>
            </View>
          );
        })}

        {/* DELIVERY DETAILS */}
        <Text style={styles.sectionTitle}>Delivery Details</Text>

        <View style={styles.card}>
          <SummaryRow
            icon="location-outline"
            label="Address"
            value={data.address}
          />

          {/* Show coordinates if available */}
          {data.latitude !== null && data.longitude !== null && (
            <SummaryRow
              icon="navigate-outline"
              label="Coordinates"
              value={`${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`}
            />
          )}

          <SummaryRow
            icon="call-outline"
            label="Contact"
            value={data.contactNumber}
          />

          <SummaryRow
            icon="bicycle-outline"
            label="Delivery Type"
            value={data.deliveryType}
          />

          {!!data.note?.trim() && (
            <SummaryRow
              icon="chatbox-ellipses-outline"
              label="Note"
              value={data.note.trim()}
            />
          )}
        </View>

        {/* PAYMENT */}
        <Text style={styles.sectionTitle}>Payment</Text>

        <View style={styles.card}>
          <SummaryRow
            icon={
              data.paymentMethod === "IBFT" ? "card-outline" : "cash-outline"
            }
            label="Method"
            value={
              data.paymentMethod === "IBFT"
                ? "IBFT / Bank Transfer"
                : "Cash on Delivery"
            }
          />

          {data.paymentMethod === "IBFT" && data.bankDetail && (
            <>
              <SummaryRow
                icon="business-outline"
                label="Bank"
                value={data.bankDetail.bankName}
              />

              <SummaryRow
                icon="person-outline"
                label="Account Title"
                value={data.bankDetail.accountTitle}
              />

              <SummaryRow
                icon="card-outline"
                label="Account No"
                value={data.bankDetail.accountNo}
              />

              <SummaryRow
                icon="document-text-outline"
                label="IBAN"
                value={data.bankDetail.iban}
              />

              {data.screenshotUri && (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={styles.rowLabel}>Screenshot</Text>

                  <Image
                    source={{ uri: data.screenshotUri }}
                    style={styles.screenshotThumb}
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* PRICE BREAKDOWN */}
        <Text style={styles.sectionTitle}>Price Details</Text>

        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatRs(subtotal)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>{formatRs(deliveryFee)}</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRs(total)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          activeOpacity={0.85}
          onPress={() => setShowConfirm(true)}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />

          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => !placing && setShowConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="help-circle-outline" size={32} color={ORANGE} />
            </View>

            <Text style={styles.modalTitle}>Place this order?</Text>

            <Text style={styles.modalText}>
              Total {formatRs(total)} ·{" "}
              {data.paymentMethod === "IBFT"
                ? "IBFT / Bank Transfer"
                : "Cash on Delivery"}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowConfirm(false)}
                disabled={placing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={placeOrder}
                disabled={placing}
              >
                {placing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={16} color={ORANGE} style={{ marginTop: 2 }} />

      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>

        <Text style={styles.rowValue}>{value || "-"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topBar: {
    height: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  topBarTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
    fontWeight: "700",
    marginHorizontal: spacing.md,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  itemImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },

  itemImageFallback: {
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  itemName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  itemTotal: {
    ...typography.body,
    color: ORANGE,
    fontWeight: "700",
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },

  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginTop: 2,
  },

  screenshotThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  priceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },

  priceValue: {
    ...typography.body,
    color: colors.textPrimary,
  },

  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  totalValue: {
    ...typography.h3,
    color: ORANGE,
    fontWeight: "800",
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  placeOrderButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  placeOrderText: {
    ...typography.button,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  modalCard: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },

  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SOFT_ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  modalText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: "100%",
  },

  modalBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalCancelText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  modalConfirmBtn: {
    backgroundColor: ORANGE,
  },

  modalConfirmText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});