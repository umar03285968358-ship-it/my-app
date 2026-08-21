// app/checkout/review.tsx
import Button from "@/components/Button";
import { useCart } from "@/context/CartContext";
import { insertOrder } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { buildOrderDetail } from "@/utils/orderHelpers";
import { showToast } from "@/utils/toast";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

// TODO: pull these from your address/payment step (route params or a checkout context)
export default function ReviewOrderScreen({
  deliveryAddress,
  deliveryContact,
  paymentMethod = "Cash On Delivery",
  deliveryType = "Standard Delivery",
  deliveryInstruction = "",
}: {
  deliveryAddress: string;
  deliveryContact: string;
  paymentMethod?: string;
  deliveryType?: string;
  deliveryInstruction?: string;
}) {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    const user = await getUser();
    const mobUserID = user?.MobUserID ?? user?.mobUserID ?? user?.id;
    if (!mobUserID) {
      showToast("Please log in to place an order", "error");
      return;
    }
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    const orderDiscount = items.reduce(
      (sum, i) => sum + (i.product.discRupees ?? 0) * i.quantity,
      0,
    );

    try {
      setPlacing(true);
      await insertOrder({
        mobUserID,
        paymentMethod,
        orderTotal: subtotal + deliveryFee,
        orderDiscount,
        netTotal: total,
        deliveryType,
        deliveryAddress,
        deliveryInstruction,
        deliveryContact,
        orderDetail: buildOrderDetail(items),
      });

      await clearCart(); // wipes local storage now that the order is on the server
      showToast("Order placed successfully!", "success");
      router.replace("/orders/success");
    } catch (e: any) {
      showToast(e?.message || "Failed to place order. Try again.", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* your order summary UI here, reading from `items`, `subtotal`, `deliveryFee`, `total` */}
      <Button
        title={placing ? "Placing Order..." : "Place Order"}
        onPress={handlePlaceOrder}
        disabled={placing}
      />
    </View>
  );
}
