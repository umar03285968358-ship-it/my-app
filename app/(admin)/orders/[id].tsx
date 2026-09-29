import ConfirmationModal from "@/components/admin/ConfirmationModal";
import EmptyState from "@/components/admin/EmptyState";
import SelectModal, { SelectOption } from "@/components/admin/SelectModal";
import StatusBadge from "@/components/admin/StatusBadge";
import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { getAdminUserId } from "@/services/adminSession";
import {
  assignRiderToOrder,
  getAllMobOrders,
  getMobRiders,
  getSingleOrderDetail,
  MobOrder,
  MobUser,
  OrderDetailLineItem,
  updateOrderStatusAdmin,
} from "@/services/api";
import { ORDER_STATUS_OPTIONS } from "@/types/admin";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* =========================================================
   CONSTANTS
========================================================= */

const TERMINAL_STATUSES = new Set(["delivered", "cancelled"]);

/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusOptions(currentStatus: string): SelectOption[] {
  const current = currentStatus.trim().toLowerCase();
  return ORDER_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: status,
    disabled: status.trim().toLowerCase() === current,
  }));
}

function validateStatusChange(
  currentStatus: string,
  targetStatus: string,
  hasRider: boolean,
): { ok: true } | { ok: false; message: string } {
  const current = currentStatus.trim().toLowerCase();
  const target = targetStatus.trim().toLowerCase();

  if (TERMINAL_STATUSES.has(current)) {
    return {
      ok: false,
      message: `This order is already ${currentStatus} and its status can no longer be changed.`,
    };
  }

  if (target === "dispatched" && !hasRider) {
    return { ok: false, message: "Please assign a rider before dispatching this order." };
  }

  if (target === "delivered" && !hasRider) {
    return {
      ok: false,
      message: "This order cannot be marked as Delivered until a rider has been assigned.",
    };
  }

  if (current === "dispatched" && (target === "pending" || target === "processing")) {
    return { ok: false, message: "Dispatched orders cannot be moved back to Pending or Processing." };
  }

  return { ok: true };
}

/* =========================================================
   DATE / DISPLAY HELPERS
========================================================= */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/* =========================================================
   COLOR HELPERS
========================================================= */

function statusColor(status: string) {
  switch (status.trim().toLowerCase()) {
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
  const normalized = method.toLowerCase();
  if (normalized.includes("ibft") || normalized.includes("bank") || normalized.includes("transfer")) {
    return colors.accentOrangeDark;
  }
  return colors.primaryLight;
}

function isUrgentDelivery(deliveryType: string) {
  return deliveryType.toLowerCase().includes("urgent");
}

/* =========================================================
   RATING STARS (used in the Rating & Feedback section)
========================================================= */

function RatingStars({ rating, size = 20, gap = 4 }: { rating: number; size?: number; gap?: number }) {
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
   SCREEN
========================================================= */

export default function OrderDetailScreen() {
  const { order: orderParam } = useLocalSearchParams<{ id: string; order?: string }>();

  const [order, setOrder] = useState<MobOrder | null>(null);
  const [lineItems, setLineItems] = useState<OrderDetailLineItem[]>([]);
  const [riders, setRiders] = useState<MobUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRider, setSavingRider] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const [riderModalVisible, setRiderModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const [pendingRiderId, setPendingRiderId] = useState<string | null>(null);
  const [riderConfirmVisible, setRiderConfirmVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusConfirmVisible, setStatusConfirmVisible] = useState(false);

  const refreshOrderData = useCallback(async (orderNo: number) => {
    try {
      setRefreshingData(true);

      const [latestOrders, latestItems] = await Promise.all([
        getAllMobOrders(null, null, null, null, "All"),
        getSingleOrderDetail(orderNo),
      ]);

      const latestOrder = latestOrders.find((item) => Number(item.orderNo) === Number(orderNo));

      if (latestOrder) setOrder(latestOrder);
      setLineItems(latestItems);
    } catch (error) {
      console.error("[ORDER DETAIL] Failed to refresh order data:", error);
    } finally {
      setRefreshingData(false);
    }
  }, []);

  useEffect(() => {
    if (!orderParam) {
      setLoading(false);
      return;
    }

    let parsedOrder: MobOrder;

    try {
      parsedOrder = JSON.parse(orderParam);
    } catch (error) {
      console.error("[ORDER DETAIL] Invalid order parameter:", error);
      setLoading(false);
      return;
    }

    setOrder(parsedOrder);

    (async () => {
      try {
        setLoading(true);

        const [items, riderList] = await Promise.all([
          getSingleOrderDetail(parsedOrder.orderNo),
          getMobRiders(),
        ]);

        setLineItems(items);
        setRiders(riderList);
      } catch (error) {
        console.error("[ORDER DETAIL] Failed to load:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderParam]);

  const handleCallCustomer = async () => {
    if (!order?.deliveryContact) return;

    try {
      await Linking.openURL(`tel:${order.deliveryContact}`);
    } catch (error) {
      Alert.alert("Unable to Call", "The phone number could not be opened.");
    }
  };

  const handleRiderPicked = (riderIdStr: string) => {
    setPendingRiderId(riderIdStr);
    setRiderModalVisible(false);
    setRiderConfirmVisible(true);
  };

  const handleConfirmAssignRider = async () => {
    if (!order || !pendingRiderId) return;

    const rider = riders.find((r) => String(r.id) === pendingRiderId);
    if (!rider) return;

    try {
      setSavingRider(true);

      const adminUserID = await getAdminUserId();

      await assignRiderToOrder({ orderNo: order.orderNo, riderID: rider.id, userID: adminUserID });

      await refreshOrderData(order.orderNo);

      setRiderConfirmVisible(false);
      setPendingRiderId(null);
    } catch (error: any) {
      Alert.alert("Failed to assign rider", error?.message || "Please try again.");
    } finally {
      setSavingRider(false);
    }
  };

  const handleCancelAssignRider = () => {
    setRiderConfirmVisible(false);
    setPendingRiderId(null);
  };

  const handleStatusPicked = (status: string) => {
    if (!order) return;

    const validation = validateStatusChange(order.orderStatus, status, !!order.riderID);

    if (!validation.ok) {
      setStatusModalVisible(false);
      Alert.alert("Cannot Change Status", validation.message);
      return;
    }

    setPendingStatus(status);
    setStatusModalVisible(false);
    setStatusConfirmVisible(true);
  };

  const handleConfirmChangeStatus = async () => {
    if (!order || !pendingStatus) return;

    try {
      setSavingStatus(true);

      const adminUserID = await getAdminUserId();

      await updateOrderStatusAdmin({
        orderNo: order.orderNo,
        riderID: order.riderID ?? 0,
        orderStatus: pendingStatus,
        adminUserID,
      });

      await refreshOrderData(order.orderNo);

      setStatusConfirmVisible(false);
      setPendingStatus(null);
    } catch (error: any) {
      Alert.alert("Failed to update status", error?.message || "Please try again.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCancelChangeStatus = () => {
    setStatusConfirmVisible(false);
    setPendingStatus(null);
  };

  if (loading) {
    return (
      <ScreenLayout title="Order Details" showBack>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
        </View>
      </ScreenLayout>
    );
  }

  if (!order) {
    return (
      <ScreenLayout title="Order Details" showBack>
        <EmptyState icon="alert-circle-outline" message="Order not found." />
      </ScreenLayout>
    );
  }

  const hasRider = !!order.riderID;

  // Orders that are already Delivered or Cancelled are locked:
  // no more status changes, no more rider (re)assignment.
  const isTerminalOrder = TERMINAL_STATUSES.has(order.orderStatus.trim().toLowerCase());

  // Rating & Feedback section is only relevant once an order has
  // actually been delivered and rated by the customer.
  const isDeliveredOrder = order.orderStatus.trim().toLowerCase() === "delivered";

  const riderOptions: SelectOption[] = riders.map((r) => ({
    value: String(r.id),
    label: r.fullName,
    subLabel: r.phone,
    disabled: order.riderID === r.id,
  }));

  const statusOptions = getStatusOptions(order.orderStatus);

  const pendingRider = pendingRiderId ? riders.find((r) => String(r.id) === pendingRiderId) : null;

  const grossTotal = lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.salePrice), 0);

  const discountTotal = lineItems.reduce((sum, item) => sum + Number(item.discInR || 0), 0);

  const netTotal = Number(order.netTotal) || grossTotal - discountTotal;

  const displayedTotal = lineItems.length > 0 ? netTotal : Number(order.netTotal) || 0;

  const currentStatusColor = statusColor(order.orderStatus);
  const currentPaymentColor = paymentColor(order.paymentMethod ?? "");
  const urgent = isUrgentDelivery(order.deliveryType ?? "");

  // Rating / remarks (always sent by the API, even if empty)
  const ratingStar = Number((order as any).ratingStar) || 0;
  const ratingRemarks = String((order as any).ratingRemarks ?? "").trim();
  const hasRemarks = ratingRemarks.length > 0 && ratingRemarks !== "-";

  return (
    <ScreenLayout title={`#${order.orderNo}`} showBack>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* ORDER SUMMARY */}
        <View style={[styles.card, urgent && styles.cardUrgent]}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderNumber}>Order No. {order.orderNo}</Text>
              <Text style={styles.customerNameHeader} numberOfLines={1}>
                {order.customerName}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: currentStatusColor + "18" }]}>
              <Text style={[styles.statusBadgeText, { color: currentStatusColor }]}>{order.orderStatus}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatOrderDate(order.orderDate)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {Number(order.totalItems) || 0} item{Number(order.totalItems) === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.summaryBadges}>
            {!!order.deliveryType && (
              <View style={[styles.infoBadge, urgent && styles.urgentBadge]}>
                <Ionicons
                  name={urgent ? "flash-outline" : "bicycle-outline"}
                  size={14}
                  color={urgent ? colors.danger : colors.textSecondary}
                />
                <Text style={[styles.infoBadgeText, urgent && styles.urgentBadgeText]}>{order.deliveryType}</Text>
              </View>
            )}

            {!!order.paymentMethod && (
              <View style={[styles.infoBadge, { backgroundColor: currentPaymentColor + "18" }]}>
                <Ionicons name="card-outline" size={14} color={currentPaymentColor} />
                <Text style={[styles.infoBadgeText, { color: currentPaymentColor }]}>{order.paymentMethod}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalSummary}>
            <Text style={styles.totalSummaryLabel}>Order Total</Text>
            <Text style={styles.totalSummaryValue}>Rs. {displayedTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* STATUS — hidden for Delivered / Cancelled orders */}
        {!isTerminalOrder && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Order Status</Text>
                <Text style={styles.sectionSubtitle}>Manage the current order state</Text>
              </View>

              <StatusBadge status={order.orderStatus} color={currentStatusColor} />
            </View>

            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => setStatusModalVisible(true)}
              disabled={savingStatus}
              activeOpacity={0.8}
            >
              {savingStatus ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="swap-horizontal-outline" size={17} color={colors.white} />
                  <Text style={styles.primaryActionText}>Change Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* RIDER — hidden for Delivered / Cancelled orders */}
        {!isTerminalOrder && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Rider</Text>
                <Text style={styles.sectionSubtitle}>Delivery assignment</Text>
              </View>

              <View style={styles.sectionIcon}>
                <Ionicons name="bicycle-outline" size={18} color={colors.accentOrange} />
              </View>
            </View>

            <View style={styles.personBlock}>
              <Text style={styles.personName}>{order.riderName ?? "No rider assigned"}</Text>
              {order.riderMobileNo && <Text style={styles.personSecondary}>{order.riderMobileNo}</Text>}
            </View>

            <TouchableOpacity
              style={styles.outlineAction}
              onPress={() => setRiderModalVisible(true)}
              disabled={savingRider}
              activeOpacity={0.8}
            >
              {savingRider ? (
                <ActivityIndicator size="small" color={colors.accentOrange} />
              ) : (
                <>
                  <Ionicons name="bicycle-outline" size={17} color={colors.accentOrange} />
                  <Text style={styles.outlineActionText}>{hasRider ? "Reassign Rider" : "Assign Rider"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* CUSTOMER */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.sectionSubtitle}>Delivery information</Text>
            </View>

            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color={colors.accentOrange} />
            </View>
          </View>

          <InfoRow icon="person-outline" text={order.customerName} />

          {order.deliveryContact && (
            <View style={styles.phoneRow}>
              <View style={styles.phoneInfo}>
                <Ionicons name="call-outline" size={17} color={colors.textSecondary} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {order.deliveryContact}
                </Text>
              </View>

              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer} activeOpacity={0.8}>
                <Ionicons name="call" size={17} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <InfoRow icon="location-outline" text={order.deliveryAddress} />

          {order.deliveryInstruction && order.deliveryInstruction !== "-" && (
            <InfoRow icon="information-circle-outline" text={order.deliveryInstruction} />
          )}
        </View>

        {/* RATING & FEEDBACK — only shown once the order is Delivered */}
        {isDeliveredOrder && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Rating & Feedback</Text>
                <Text style={styles.sectionSubtitle}>Customer's review for this order</Text>
              </View>

              <View style={styles.sectionIcon}>
                <Ionicons name="star-outline" size={18} color={colors.accentOrange} />
              </View>
            </View>

            <RatingStars rating={ratingStar} size={20} gap={4} />

            <Text style={styles.remarksText}>
              {hasRemarks ? ratingRemarks : "No remarks were left for this order."}
            </Text>
          </View>
        )}

        {/* ITEMS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Items</Text>
              <Text style={styles.sectionSubtitle}>Order item breakdown</Text>
            </View>

            <View style={styles.sectionIcon}>
              <Ionicons name="cube-outline" size={18} color={colors.accentOrange} />
            </View>
          </View>

          {lineItems.length === 0 ? (
            <Text style={styles.emptyItemsText}>No line-item breakdown available for this order.</Text>
          ) : (
            <View style={styles.itemsContainer}>
              {lineItems.map((item) => (
                <View key={item.productID} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productTitle}
                    </Text>
                  </View>

                  <Text style={styles.itemPrice}>
                    Rs. {(Number(item.quantity) * Number(item.salePrice)).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Gross Total</Text>
              <Text style={styles.breakdownValue}>Rs. {grossTotal.toLocaleString()}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Discount</Text>
              <Text style={styles.discountValue}>- Rs. {discountTotal.toLocaleString()}</Text>
            </View>

            <View style={styles.netTotalRow}>
              <Text style={styles.totalLabel}>Net Total</Text>
              <Text style={styles.totalValue}>Rs. {netTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {refreshingData && (
          <View style={styles.refreshingRow}>
            <ActivityIndicator size="small" color={colors.accentOrange} />
            <Text style={styles.refreshingText}>Updating order...</Text>
          </View>
        )}
      </ScrollView>

      <SelectModal
        visible={riderModalVisible}
        title="Assign Rider"
        options={riderOptions}
        selectedValue={order.riderID ? String(order.riderID) : null}
        onSelect={handleRiderPicked}
        onClose={() => setRiderModalVisible(false)}
        emptyText="No riders found"
      />

      <SelectModal
        visible={statusModalVisible}
        title="Change Order Status"
        options={statusOptions}
        selectedValue={order.orderStatus}
        onSelect={handleStatusPicked}
        onClose={() => setStatusModalVisible(false)}
      />

      <ConfirmationModal
        visible={riderConfirmVisible}
        title={order.riderID ? "Reassign Rider?" : "Assign Rider?"}
        message={
          pendingRider
            ? `Assign ${pendingRider.fullName} to order #${order.orderNo}?`
            : "Assign this rider to the order?"
        }
        confirmLabel={order.riderID ? "Reassign" : "Assign"}
        icon="bicycle-outline"
        loading={savingRider}
        onConfirm={handleConfirmAssignRider}
        onCancel={handleCancelAssignRider}
      />

      <ConfirmationModal
        visible={statusConfirmVisible}
        title="Change Status?"
        message={
          pendingStatus
            ? `Change order #${order.orderNo} status to "${pendingStatus}"?`
            : "Change this order's status?"
        }
        confirmLabel="Change Status"
        icon="swap-horizontal-outline"
        loading={savingStatus}
        onConfirm={handleConfirmChangeStatus}
        onCancel={handleCancelChangeStatus}
      />
    </ScreenLayout>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardUrgent: { borderColor: colors.danger, borderWidth: 2 },
  orderHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  orderHeaderLeft: { flex: 1, marginRight: spacing.sm },
  orderNumber: { ...typography.body, fontWeight: "700", color: colors.textPrimary },
  customerNameHeader: { ...typography.h3, color: colors.textPrimary, marginTop: 3 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginTop: 1 },
  statusBadgeText: { ...typography.caption, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  metaText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4, flexShrink: 1 },
  metaDot: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 6 },
  summaryBadges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  infoBadgeText: { ...typography.caption, color: colors.textSecondary, fontWeight: "700", marginLeft: 5 },
  urgentBadge: { backgroundColor: colors.danger + "12" },
  urgentBadgeText: { color: colors.danger },
  totalSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalSummaryLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
  totalSummaryValue: { ...typography.body, color: colors.accentOrange, fontWeight: "800" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentOrange + "12",
  },
  primaryAction: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accentOrange,
    borderRadius: radius.sm,
  },
  primaryActionText: { ...typography.button, color: colors.white },
  outlineAction: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accentOrange,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  outlineActionText: { ...typography.button, color: colors.accentOrange },
  personBlock: { marginBottom: spacing.sm },
  personName: { ...typography.body, color: colors.textPrimary, fontWeight: "700" },
  personSecondary: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  infoRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIcon: { width: 30, alignItems: "flex-start", justifyContent: "center" },
  infoText: { ...typography.body, color: colors.textPrimary, flex: 1, paddingVertical: spacing.xs },
  phoneRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  phoneInfo: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0, gap: spacing.sm },
  callButton: {
    width: 30,
    height: 30,
    borderRadius: 17,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  // RATING & FEEDBACK
  starRow: { flexDirection: "row", alignItems: "center" },
  remarksText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  itemsContainer: { gap: 0 },
  itemRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  itemQuantity: { ...typography.caption, color: colors.accentOrange, fontWeight: "800", minWidth: 30 },
  itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  itemPrice: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
  emptyItemsText: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xs },
  totalBreakdown: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 32 },
  breakdownLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
  breakdownValue: { ...typography.caption, color: colors.textPrimary, fontWeight: "700" },
  discountValue: { ...typography.caption, color: colors.success, fontWeight: "700" },
  netTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalLabel: { ...typography.h3, color: colors.textPrimary },
  totalValue: { ...typography.h3, color: colors.accentOrange, fontWeight: "800" },
  refreshingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.xs },
  refreshingText: { ...typography.caption, color: colors.textSecondary, marginLeft: 6 },
});