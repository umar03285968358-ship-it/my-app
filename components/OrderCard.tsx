import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MobOrder } from "../services/api";
import { formatRs } from "../utils/currency";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "#FFF4E5", text: "#B26A00" },
  Processing: { bg: "#E5F1FF", text: "#0B5FFF" },
  Dispatched: { bg: "#F1EBFF", text: "#7B4FE0" },
  Delivered: { bg: "#E6F7EC", text: "#1B8A3E" },
  Cancelled: { bg: "#FDEAEA", text: "#C62828" },
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export default function OrderCard({
  order,
  onPress,
  cancellable = false,
  onCancelPress,
  ratable = false,
  rated = false,
  onRatePress,
}: {
  order: MobOrder;
  // Tapping the card opens the full order-detail modal (which fetches
  // real line items from GetSingleOrderDetail).
  onPress: () => void;
  cancellable?: boolean;
  onCancelPress?: () => void;
  // Shown once the order is Delivered — tapping the star opens the
  // rating modal (quality + rider service + remarks).
  ratable?: boolean;
  // Whether the user has already submitted a rating for this order.
  // Just changes the star's look (outline vs filled) - tapping it
  // either way still opens the modal, so they can edit their rating.
  rated?: boolean;
  onRatePress?: () => void;
}) {
  const statusStyle = STATUS_STYLES[order.orderStatus] ?? STATUS_STYLES.Pending;

  // Stop the tap from bubbling up to the card's onPress — cancelling
  // shouldn't also open the detail modal.
  const handleCancelPress = (e: any) => {
    e.stopPropagation?.();
    onCancelPress?.();
  };

  // Same idea for rating — don't also open the detail modal.
  const handleRatePress = (e: any) => {
    e.stopPropagation?.();
    onRatePress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.orderId}>Order #{order.orderNo}</Text>
          <Text style={styles.date}>{formatOrderDate(order.orderDate)}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {order.orderStatus}
            </Text>
          </View>

          {/* Only shown once the order is Delivered — OrdersScreen
              already gates `ratable` on that. */}
          {ratable && (
            <TouchableOpacity
              onPress={handleRatePress}
              style={styles.rateIconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={rated ? "star" : "star-outline"}
                size={20}
                color="#F1731F"
              />
            </TouchableOpacity>
          )}

          {/* Only shown while the order is still Pending/Processing —
              OrdersScreen already gates `cancellable` on that. */}
          {cancellable && (
            <TouchableOpacity
              onPress={handleCancelPress}
              style={styles.cancelIconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#C62828" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {order.totalItems} item{order.totalItems !== 1 ? "s" : ""} ·{" "}
          {order.paymentMethod}
        </Text>
        <Text style={styles.total}>{formatRs(order.netTotal)}</Text>
      </View>

      <View style={styles.tapHintRow}>
        <Text style={styles.tapHintText}>Tap for details</Text>
        <Ionicons name="chevron-forward" size={14} color="#B5B5B5" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerRightGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderId: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  date: { fontSize: 12, color: "#8A8A8A", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cancelIconButton: { padding: 2 },
  rateIconButton: { padding: 2 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  metaText: { fontSize: 13, color: "#6B6B6B" },
  total: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  tapHintRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 2,
  },
  tapHintText: { fontSize: 11, color: "#B5B5B5" },
});