import EmptyState from "@/components/admin/EmptyState";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { getAllMobOrders, MobOrder } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* =========================================================
   ADMIN FOOTER TABS
========================================================= */

const ADMIN_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" as const },
  { key: "orders", label: "Orders", icon: "receipt-outline" as const },
  { key: "notifications", label: "Notifications", icon: "notifications-outline" as const },
];

/* =========================================================
   DATE HELPERS
========================================================= */

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatShort(d: Date) {
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/* =========================================================
   ORDER HELPERS
========================================================= */

function statusColor(status: string) {
  switch (String(status).toLowerCase()) {
    case "pending":
      return colors.accentOrange;
    case "processing":
      return colors.accentOrangeDark;
    case "dispatched":
      return colors.primaryDark;
    case "delivered":
      return colors.success;
    case "cancelled":
      return colors.danger;
    default:
      return colors.textSecondary;
  }
}

function paymentColor(method: string) {
  const normalized = String(method ?? "").toLowerCase();
  if (normalized.includes("ibft") || normalized.includes("bank") || normalized.includes("transfer")) {
    return colors.accentOrangeDark;
  }
  return colors.primaryLight;
}

function isUrgentDelivery(deliveryType: string) {
  return String(deliveryType ?? "").toLowerCase().includes("urgent");
}

/* =========================================================
   RATING STARS (small, fixed-height, used on the card)
========================================================= */

function RatingStars({
  rating,
  size = 10,
  gap = 2,
}: {
  rating: number;
  size?: number;
  gap?: number;
}) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  return (
    <View style={[styles.starRow, { gap }]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= safeRating ? "star" : "star-outline"}
          size={size}
          color={i <= safeRating ? colors.accentOrange : colors.border}
        />
      ))}
    </View>
  );
}

/* =========================================================
   ADMIN ORDER CARD
========================================================= */

function AdminOrderCard({ order, onPress }: { order: MobOrder; onPress: () => void }) {
  const status = String(order.orderStatus ?? "");
  const paymentMethod = String(order.paymentMethod ?? "");
  const deliveryType = String(order.deliveryType ?? "");
  const customerName = String(order.customerName ?? "") || "Customer";
  const orderNumber = String(order.orderNo);
  const totalItems = Number(order.totalItems) || 0;
  const netTotal = Number(order.netTotal) || 0;
  // ratingStar may not be on the MobOrder type yet, but the API always sends it
  const ratingStar = Number((order as any).ratingStar) || 0;

  const urgent = isUrgentDelivery(deliveryType);
  const currentStatusColor = statusColor(status);
  const currentPaymentColor = paymentColor(paymentMethod);

  return (
    <TouchableOpacity
      style={[styles.orderCard, urgent && styles.orderCardUrgent]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      {/* CARD HEADER */}
      <View style={styles.cardTopRow}>
        <Text style={styles.orderNumber} numberOfLines={1}>
          Order No. {orderNumber}
        </Text>

        <View style={styles.cardTopRight}>
          <View style={[styles.statusBadge, { backgroundColor: currentStatusColor + "18" }]}>
            <Text style={[styles.statusBadgeText, { color: currentStatusColor }]}>{status}</Text>
          </View>
        </View>
      </View>

      {/* CUSTOMER */}
      <Text style={styles.customerName} numberOfLines={1}>
        {customerName}
      </Text>

      {/* META */}
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.metaText} numberOfLines={1}>
          {formatOrderDate(order.orderDate)}
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Ionicons name="cube-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.metaText}>
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </Text>
      </View>

      {/* DELIVERY TYPE + RATING STARS */}
      {deliveryType.length > 0 && (
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryLeft}>
            <Ionicons
              name={urgent ? "flash-outline" : "bicycle-outline"}
              size={14}
              color={urgent ? colors.danger : colors.textSecondary}
            />
            <Text style={[styles.deliveryText, urgent && styles.deliveryTextUrgent]}>
              {deliveryType}
            </Text>
          </View>

          <RatingStars rating={ratingStar} size={10} gap={2} />
        </View>
      )}

      {/* FOOTER */}
      <View style={styles.cardFooter}>
        <View style={styles.paymentAndType}>
          {paymentMethod.length > 0 && (
            <View style={[styles.paymentBadge, { backgroundColor: currentPaymentColor + "18" }]}>
              <Text style={[styles.paymentBadgeText, { color: currentPaymentColor }]} numberOfLines={1}>
                {paymentMethod}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.amount} numberOfLines={1}>
          Rs. {netTotal.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   ORDERS SCREEN
========================================================= */

export default function OrdersScreen() {
  const [orders, setOrders] = useState<MobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const [customFrom, setCustomFrom] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return startOfDay(d);
  });

  const [customTo, setCustomTo] = useState<Date>(() => endOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = useState<"from" | "to" | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getAllMobOrders(null, null, null, null, "All");
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        setLoading(true);
        await loadOrders();
        if (isActive) setLoading(false);
      })();

      return () => {
        isActive = false;
      };
    }, [loadOrders]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleTabPress = (key: string) => {
    if (key === "dashboard") {
      router.replace("/(admin)/dashboard" as any);
      return;
    }
    if (key === "orders") {
      router.replace("/(admin)/orders" as any);
      return;
    }
    if (key === "notifications") {
      router.push("/(admin)/notifications" as any);
      return;
    }
  };

  const filters = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(orders.map((order) => order.orderStatus).filter(Boolean).map((status) => String(status))),
    );
    return ["All", ...uniqueStatuses, "Custom"];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (activeFilter === "Custom") {
      const from = startOfDay(customFrom).getTime();
      const to = endOfDay(customTo).getTime();

      result = result.filter((order) => {
        const orderTime = new Date(order.orderDate).getTime();
        if (Number.isNaN(orderTime)) return false;
        return orderTime >= from && orderTime <= to;
      });
    } else if (activeFilter !== "All") {
      result = result.filter((order) => String(order.orderStatus) === activeFilter);
    }

    result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return result;
  }, [orders, activeFilter, customFrom, customTo]);

  const onDateChange = (which: "from" | "to", event: any, selected?: Date) => {
    setPickerOpen(null);
    if (!selected) return;

    if (which === "from") {
      setCustomFrom(startOfDay(selected));
    } else {
      setCustomTo(endOfDay(selected));
    }
  };

  const clearCustomFilter = () => {
    setActiveFilter("All");
    setPickerOpen(null);
  };

  return (
    <ScreenLayout title="Orders" footerTabs={ADMIN_TABS} activeTabKey="orders" onTabPress={handleTabPress}>
      {/* STATUS FILTERS */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeFilter === "Custom" && (
          <View style={styles.customDateRow}>
            <TouchableOpacity style={styles.dateField} onPress={() => setPickerOpen("from")} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={16} color={colors.accentOrange} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateCaption}>START DATE</Text>
                <Text style={styles.dateValue}>{formatShort(customFrom)}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward-outline" size={16} color={colors.textSecondary} />
            </View>

            <TouchableOpacity style={styles.dateField} onPress={() => setPickerOpen("to")} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={16} color={colors.accentOrange} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateCaption}>END DATE</Text>
                <Text style={styles.dateValue}>{formatShort(customTo)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearCustomButton} onPress={clearCustomFilter} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {pickerOpen && (
        <DateTimePicker
          value={pickerOpen === "from" ? customFrom : customTo}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={new Date()}
          onChange={(event, selected) => onDateChange(pickerOpen, event, selected)}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.orderNo)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentOrange} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" message="No orders found for this filter." />}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          renderItem={({ item }) => (
            <AdminOrderCard
              order={item}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/orders/[id]",
                  params: { id: String(item.orderNo), order: JSON.stringify(item) },
                } as any)
              }
            />
          )}
        />
      )}
    </ScreenLayout>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentOrange,
    borderColor: colors.accentOrange,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  filterLabelActive: {
    color: colors.white,
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateTextContainer: { flex: 1 },
  dateCaption: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  dateArrow: { width: 24, alignItems: "center", justifyContent: "center" },
  clearCustomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  cardSeparator: { height: spacing.sm },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderCardUrgent: { borderColor: colors.danger, borderWidth: 2 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  orderNumber: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTopRight: { flexDirection: "row", alignItems: "center" },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  statusBadgeText: { ...typography.caption, fontWeight: "700" },
  customerName: { ...typography.h3, color: colors.textPrimary, marginBottom: 5 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  metaText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4 },
  metaDot: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 6 },

  // DELIVERY ROW — now split left (icon+text) / right (rating stars)
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    marginBottom: spacing.sm,
  },
  deliveryLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  deliveryText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: 5,
  },
  deliveryTextUrgent: { color: colors.danger, fontWeight: "700" },

  // RATING STARS (small, fixed height so card shape never changes)
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 12,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: 1,
  },
  paymentAndType: { flex: 1, flexDirection: "row", alignItems: "center" },
  paymentBadge: { maxWidth: "80%", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  paymentBadgeText: { ...typography.caption, fontWeight: "700" },
  amount: { ...typography.body, fontWeight: "800", color: colors.accentOrange, marginLeft: spacing.sm },
});