import { colors, radius, spacing, typography } from "@/constants/theme";
import { MobOrder } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import StatusBadge from "./StatusBadge";

function formatOrderDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderCard({
  order,
  onPress,
}: {
  order: MobOrder;
  onPress: () => void;
}) {
  const isDelivered = order.orderStatus?.trim().toLowerCase() === "delivered";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowBetween}>
        <Text style={styles.orderNumber}>#{order.orderNo}</Text>
        <StatusBadge status={order.orderStatus} />
      </View>

      <Text style={styles.customerName}>{order.customerName}</Text>

      <View style={styles.row}>
        <Ionicons
          name="calendar-outline"
          size={13}
          color={colors.textSecondary}
        />
        <Text style={styles.dateText}>{formatOrderDate(order.orderDate)}</Text>
      </View>

      <View style={styles.rowBetween}>
        <View style={styles.riderRow}>
          <Ionicons
            name={isDelivered ? "checkmark-circle-outline" : "bicycle-outline"}
            size={14}
            color={isDelivered ? colors.success : colors.textSecondary}
          />
          <Text
            style={[styles.riderText, isDelivered && styles.riderTextDelivered]}
          >
            {order.riderName
              ? isDelivered
                ? `Delivered by ${order.riderName}`
                : order.riderName
              : "Unassigned"}
          </Text>
        </View>
        <Text style={styles.total}>Rs. {order.netTotal}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  customerName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  riderText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  riderTextDelivered: {
    color: colors.success,
    fontWeight: "600",
  },
  total: {
    ...typography.body,
    fontWeight: "700",
    color: colors.accentOrange,
  },
});