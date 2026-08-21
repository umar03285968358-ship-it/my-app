import AdvancedFiltersModal, {
  AdvancedFilterValues,
} from "@/components/AdvancedFiltersModal";
import MarkDeliveredModal from "@/components/MarkDeliveredModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import RiderProfileButton from "@/components/RiderProfileButton";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { getRiderMobOrders, RiderOrder } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================================================================
// DATE HELPERS
// ================================================================

function toDateString(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ================================================================
// MASTER DATE RANGE
// ================================================================

const MASTER_FROM = "2000-01-01";
const MASTER_TO = toDateString(daysAgo(-3650));

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatOrderDate(iso: string) {
  const d = new Date(iso);

  if (isNaN(d.getTime())) {
    return iso;
  }

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function dateOnly(iso: string) {
  return iso.slice(0, 10);
}

// ================================================================
// DATE FILTERS
// ================================================================

type FilterKey = "today" | "week" | "custom";

const FILTERS: {
  key: FilterKey;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "today",
    label: "Today",
  },
  {
    key: "week",
    label: "This Week",
  },
  {
    key: "custom",
    label: "Custom",
  },
];

function getPresetRange(filter: FilterKey): {
  from: string;
  to: string;
} {
  const today = new Date();

  switch (filter) {
    case "today":
      return {
        from: toDateString(today),
        to: toDateString(today),
      };

    case "week":
      return {
        from: toDateString(daysAgo(7)),
        to: toDateString(today),
      };

    case "custom":
    default:
      return {
        from: MASTER_FROM,
        to: MASTER_TO,
      };
  }
}

// ================================================================
// STATUS FILTERS
// ================================================================

type StatusFilter = "all" | "pending" | "delivered";

const STATUS_FILTERS: {
  key: StatusFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "all",
    label: "All",
    icon: "layers-outline",
  },
  {
    key: "pending",
    label: "Pending",
    icon: "time-outline",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "checkmark-circle-outline",
  },
];

// ================================================================
// STATUS / PAYMENT HELPERS
// ================================================================

const STATUS_COLORS: Record<string, string> = {
  Pending: colors.accentOrange,
  Processing: colors.accentOrangeDark,
  Dispatched: colors.primaryDark,
  Delivered: colors.success,
  Cancelled: colors.danger,
};

function statusColor(status: string) {
  return STATUS_COLORS[status] ?? colors.textSecondary;
}

function paymentColor(method: string) {
  const normalized = method.toLowerCase();

  if (
    normalized.includes("ibft") ||
    normalized.includes("bank") ||
    normalized.includes("transfer")
  ) {
    return colors.accentOrangeDark;
  }

  return colors.primaryLight;
}

function isUrgentDelivery(deliveryType: string) {
  return deliveryType.toLowerCase().includes("urgent");
}

// ================================================================
// ADVANCED FILTER HELPERS
// ================================================================

function matchesPaymentFilter(
  paymentMethod: string,
  selectedPayments: AdvancedFilterValues["paymentTypes"],
) {
  if (selectedPayments.length === 0) {
    return true;
  }

  const normalized = paymentMethod.trim().toLowerCase();

  const isCOD =
    normalized.includes("cod") ||
    normalized.includes("cash") ||
    normalized.includes("cash on delivery");

  const isBank =
    normalized.includes("ibft") ||
    normalized.includes("bank") ||
    normalized.includes("transfer");

  return (
    (selectedPayments.includes("COD") && isCOD) ||
    (selectedPayments.includes("Bank") && isBank)
  );
}

function matchesDeliveryFilter(
  deliveryType: string,
  selectedDeliveryTypes: AdvancedFilterValues["deliveryTypes"],
) {
  if (selectedDeliveryTypes.length === 0) {
    return true;
  }

  const normalized = deliveryType.trim().toLowerCase();

  const isUrgent = normalized.includes("urgent");

  const isNormal =
    normalized.includes("normal") || (!isUrgent && normalized.length > 0);

  return (
    (selectedDeliveryTypes.includes("Urgent") && isUrgent) ||
    (selectedDeliveryTypes.includes("Normal") && isNormal)
  );
}

// ================================================================
// SCREEN
// ================================================================

export default function RiderOrdersScreen() {
  // --------------------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------------------

  const navigation = useNavigation();

  // --------------------------------------------------------------
  // DATE FILTER
  // --------------------------------------------------------------

  const [activeFilter, setActiveFilter] = useState<FilterKey>("week");

  // --------------------------------------------------------------
  // STATUS FILTER
  // --------------------------------------------------------------

  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("all");

  // --------------------------------------------------------------
  // ADVANCED FILTERS
  // --------------------------------------------------------------

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues>({
    paymentTypes: [],
    deliveryTypes: [],
  });

  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);

  // --------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------

  const [allOrders, setAllOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --------------------------------------------------------------
  // CUSTOM DATE RANGE
  // --------------------------------------------------------------

  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);

  const [customToDate, setCustomToDate] = useState<Date | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [appliedCustomRange, setAppliedCustomRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const [customError, setCustomError] = useState<string | null>(null);

  // --------------------------------------------------------------
  // ORDER DETAIL MODAL
  // --------------------------------------------------------------

  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const openOrderDetail = (order: RiderOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // --------------------------------------------------------------
  // MARK DELIVERED MODAL
  // --------------------------------------------------------------

  const [deliverOrder, setDeliverOrder] = useState<RiderOrder | null>(null);

  const [deliverModalVisible, setDeliverModalVisible] = useState(false);

  const openMarkDelivered = (order: RiderOrder) => {
    setDeliverOrder(order);
    setDeliverModalVisible(true);
  };

  // --------------------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------------------

  const loadOrders = useCallback(async () => {
    try {
      setErrorMsg(null);

      const user = await getUser();
      const riderID = user?.riderID;

      if (!riderID) {
        throw new Error("No rider ID found in session. Please log in again.");
      }

      const data = await getRiderMobOrders(
        riderID,
        MASTER_FROM,
        MASTER_TO,
        "All",
      );

      data.sort(
        (a, b) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
      );

      setAllOrders(data);
    } catch (e: any) {
      console.log("[RIDER ORDERS] Failed to load orders:", e);

      setErrorMsg(e?.message ?? "Failed to load orders.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      await loadOrders();

      setLoading(false);
    })();
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);

    await loadOrders();

    setRefreshing(false);
  };

  // --------------------------------------------------------------
  // DELIVERED CONFIRMED
  // --------------------------------------------------------------

  const handleDeliveredConfirmed = async () => {
    setDeliverModalVisible(false);

    await loadOrders();
  };

  // --------------------------------------------------------------
  // DATE PICKER
  // --------------------------------------------------------------

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowFromPicker(false);
    }

    if (event?.type === "dismissed") {
      return;
    }

    if (!selectedDate) {
      return;
    }

    setCustomFromDate(selectedDate);
    setCustomError(null);

    if (!customToDate) {
      setCustomToDate(selectedDate);
      return;
    }

    if (
      startOfDay(selectedDate).getTime() > startOfDay(customToDate).getTime()
    ) {
      setCustomToDate(selectedDate);
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowToPicker(false);
    }

    if (event?.type === "dismissed") {
      return;
    }

    if (!selectedDate) {
      return;
    }

    setCustomToDate(selectedDate);
    setCustomError(null);
  };

  // --------------------------------------------------------------
  // APPLY CUSTOM RANGE
  // --------------------------------------------------------------

  const applyCustomRange = () => {
    setCustomError(null);

    if (!customFromDate || !customToDate) {
      setCustomError("Please select both From and To dates.");

      return;
    }

    const from = startOfDay(customFromDate);
    const to = startOfDay(customToDate);

    if (from.getTime() > to.getTime()) {
      setCustomError("From date must be before or equal to the To date.");

      return;
    }

    setAppliedCustomRange({
      from: toDateString(from),
      to: toDateString(to),
    });

    setShowFromPicker(false);
    setShowToPicker(false);
  };

  // --------------------------------------------------------------
  // COMBINED FILTERING
  // --------------------------------------------------------------

  const orders = useMemo(() => {
    let from: string;
    let to: string;

    if (activeFilter === "custom") {
      if (!appliedCustomRange) {
        return [];
      }

      from = appliedCustomRange.from;
      to = appliedCustomRange.to;
    } else {
      const range = getPresetRange(activeFilter);

      from = range.from;
      to = range.to;
    }

    return allOrders.filter((order) => {
      // ==========================================================
      // 1. DATE FILTER
      // ==========================================================

      const orderDate = dateOnly(order.orderDate);

      const matchesDate = orderDate >= from && orderDate <= to;

      if (!matchesDate) {
        return false;
      }

      // ==========================================================
      // 2. STATUS FILTER
      // ==========================================================

      if (activeStatusFilter === "pending") {
        /*
         * PENDING FILTER INCLUDES ALL ACTIVE DELIVERY STATES:
         *
         * - Pending
         * - Processing
         * - Dispatched
         *
         * Delivered and Cancelled are NOT included.
         */

        const isPending =
          order.orderStatus === "Pending" ||
          order.orderStatus === "Processing" ||
          order.orderStatus === "Dispatched";

        if (!isPending) {
          return false;
        }
      }

      if (activeStatusFilter === "delivered") {
        if (order.orderStatus !== "Delivered") {
          return false;
        }
      }

      // ==========================================================
      // 3. PAYMENT FILTER
      // ==========================================================

      const matchesPayment = matchesPaymentFilter(
        order.paymentMethod,
        advancedFilters.paymentTypes,
      );

      if (!matchesPayment) {
        return false;
      }

      // ==========================================================
      // 4. DELIVERY FILTER
      // ==========================================================

      const matchesDelivery = matchesDeliveryFilter(
        order.deliveryType,
        advancedFilters.deliveryTypes,
      );

      if (!matchesDelivery) {
        return false;
      }

      return true;
    });
  }, [
    allOrders,
    activeFilter,
    activeStatusFilter,
    appliedCustomRange,
    advancedFilters,
  ]);

  // --------------------------------------------------------------
  // HEADER ORDER COUNT
  // --------------------------------------------------------------

  /*
   * The header receives the SAME filtered orders.length.
   *
   * Therefore:
   *
   * Today      -> today's filtered count
   * This Week  -> this week's filtered count
   * Custom     -> custom range filtered count
   * Pending    -> Pending + Processing + Dispatched
   * Delivered  -> Delivered only
   * Advanced   -> count after advanced filters
   */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <RiderProfileButton orderCount={orders.length} />,
    });
  }, [navigation, orders.length]);

  // --------------------------------------------------------------
  // ADVANCED FILTER ACTIVE STATE
  // --------------------------------------------------------------

  const advancedFilterCount =
    advancedFilters.paymentTypes.length + advancedFilters.deliveryTypes.length;

  const hasAdvancedFilters = advancedFilterCount > 0;

  // --------------------------------------------------------------
  // DATE LABELS
  // --------------------------------------------------------------

  const fromDateLabel = customFromDate
    ? toDateString(customFromDate)
    : "Select date";

  const toDateLabel = customToDate ? toDateString(customToDate) : "Select date";

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      {/* ========================================================
          FILTER AREA
      ======================================================== */}

      <View style={styles.filterContainer}>
        {/* ======================================================
            DATE FILTERS + ADVANCED FILTER BUTTON
        ====================================================== */}

        <View style={styles.filterRowHeader}>
          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const active = filter.key === activeFilter;

              return (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => {
                    setActiveFilter(filter.key);

                    setShowFromPicker(false);
                    setShowToPicker(false);

                    if (filter.key !== "custom") {
                      setCustomError(null);
                    }
                  }}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.8}
                >
                  {filter.icon && (
                    <Ionicons
                      name={filter.icon}
                      size={16}
                      color={active ? colors.white : colors.textSecondary}
                    />
                  )}

                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ====================================================
              ADVANCED FILTER BUTTON
          ==================================================== */}

          {!loading && !errorMsg && (
            <View style={styles.rightFilterActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.advancedFilterButton,
                  hasAdvancedFilters && styles.advancedFilterButtonActive,
                ]}
                onPress={() => setAdvancedFiltersVisible(true)}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={
                    hasAdvancedFilters
                      ? colors.primaryDark
                      : colors.textSecondary
                  }
                />

                {hasAdvancedFilters && (
                  <View style={styles.filterDot}>
                    <Text style={styles.filterDotText}>
                      {advancedFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ======================================================
            CUSTOM DATE PICKER
        ====================================================== */}

        {activeFilter === "custom" && (
          <View style={styles.customBox}>
            <View style={styles.customDateRow}>
              {/* FROM */}

              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>From</Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowToPicker(false);
                    setShowFromPicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={1}
                    color={colors.primaryDark}
                  />

                  <Text
                    style={[
                      styles.dateButtonText,
                      !customFromDate && styles.dateButtonPlaceholder,
                    ]}
                  >
                    {fromDateLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ARROW */}

              <View style={styles.dateArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.textSecondary}
                />
              </View>

              {/* TO */}

              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>To</Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowFromPicker(false);
                    setShowToPicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.primaryDark}
                  />

                  <Text
                    style={[
                      styles.dateButtonText,
                      !customToDate && styles.dateButtonPlaceholder,
                    ]}
                  >
                    {toDateLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* APPLY DATE */}

              <TouchableOpacity
                style={styles.applyDateButton}
                activeOpacity={0.8}
                onPress={applyCustomRange}
              >
                <Ionicons name="checkmark" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            {customError && (
              <Text style={styles.customErrorText}>{customError}</Text>
            )}

            {/* FROM PICKER */}

            {showFromPicker && (
              <DateTimePicker
                value={customFromDate ?? customToDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleFromDateChange}
              />
            )}

            {/* TO PICKER */}

            {showToPicker && (
              <DateTimePicker
                value={customToDate ?? customFromDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={
                  customFromDate ? startOfDay(customFromDate) : undefined
                }
                maximumDate={new Date()}
                onChange={handleToDateChange}
              />
            )}

            {/* IOS DONE */}

            {Platform.OS === "ios" && (showFromPicker || showToPicker) && (
              <TouchableOpacity
                style={styles.iosDoneButton}
                onPress={() => {
                  setShowFromPicker(false);
                  setShowToPicker(false);
                }}
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ======================================================
            STATUS FILTERS
        ====================================================== */}

        <View style={styles.statusFilterWrapper}>
          <View style={styles.statusFilterContainer}>
            {STATUS_FILTERS.map((status) => {
              const active = status.key === activeStatusFilter;

              return (
                <TouchableOpacity
                  key={status.key}
                  onPress={() => setActiveStatusFilter(status.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.statusFilterItem,
                    active && styles.statusFilterItemActive,
                  ]}
                >
                  <Ionicons
                    name={status.icon}
                    size={16}
                    color={active ? colors.primaryDark : colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.statusFilterText,
                      active && styles.statusFilterTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ========================================================
          DIVIDER
      ======================================================== */}

      <View style={styles.divider} />

      {/* ========================================================
          LOADING
      ======================================================== */}

      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {!loading && errorMsg && (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={colors.danger}
          />

          <Text style={styles.errorText}>{errorMsg}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================
          CUSTOM RANGE NOT APPLIED
      ======================================================== */}

      {!loading &&
        !errorMsg &&
        activeFilter === "custom" &&
        !appliedCustomRange && (
          <View style={styles.centerBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.emptyText}>Select your date range</Text>

            <Text style={styles.emptySubText}>
              Choose From and To dates above.
            </Text>
          </View>
        )}

      {/* ========================================================
          EMPTY ORDERS
      ======================================================== */}

      {!loading &&
        !errorMsg &&
        orders.length === 0 &&
        !(activeFilter === "custom" && !appliedCustomRange) && (
          <View style={styles.centerBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="file-tray-outline"
                size={28}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.emptyText}>No orders found</Text>

            <Text style={styles.emptySubText}>
              Try another filter combination.
            </Text>
          </View>
        )}

      {/* ========================================================
          ORDERS
      ======================================================== */}

      {!loading && !errorMsg && orders.length > 0 && (
        <FlatList
          style={styles.orderList}
          data={orders}
          keyExtractor={(item) => String(item.orderNo)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryDark}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                isUrgentDelivery(item.deliveryType) && styles.cardUrgent,
              ]}
              activeOpacity={0.7}
              onPress={() => openOrderDetail(item)}
            >
              {/* CARD HEADER */}

              <View style={styles.cardTopRow}>
                <Text style={styles.orderId}>Order No. {item.orderNo}</Text>

                <View style={styles.cardTopRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusColor(item.orderStatus) + "1A",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: statusColor(item.orderStatus),
                        },
                      ]}
                    >
                      {item.orderStatus}
                    </Text>
                  </View>

                  {item.orderStatus === "Dispatched" && (
                    <TouchableOpacity
                      onPress={() => openMarkDelivered(item)}
                      style={styles.deliverButton}
                      hitSlop={{
                        top: 8,
                        bottom: 8,
                        left: 8,
                        right: 8,
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* CUSTOMER */}

              <Text style={styles.customerName}>{item.customerName}</Text>

              {/* META */}

              <View style={styles.metaRow}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>
                  {formatOrderDate(item.orderDate)}
                </Text>

                <Text style={styles.metaDot}>·</Text>

                <Text style={styles.metaText}>
                  {item.totalItems} item
                  {item.totalItems === 1 ? "" : "s"}
                </Text>
              </View>

              {/* FOOTER */}

              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.paymentBadge,
                    {
                      backgroundColor: paymentColor(item.paymentMethod) + "1A",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentBadgeText,
                      {
                        color: paymentColor(item.paymentMethod),
                      },
                    ]}
                  >
                    {item.paymentMethod}
                  </Text>
                </View>

                <Text style={styles.amount}>
                  Rs. {item.netTotal.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: spacing.sm,
              }}
            />
          )}
        />
      )}

      {/* ========================================================
          ADVANCED FILTER MODAL
      ======================================================== */}

      <AdvancedFiltersModal
        visible={advancedFiltersVisible}
        filters={advancedFilters}
        onClose={() => setAdvancedFiltersVisible(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setAdvancedFiltersVisible(false);
        }}
      />

      {/* ========================================================
          ORDER DETAIL MODAL
      ======================================================== */}

      <OrderDetailModal
        visible={detailModalVisible}
        order={selectedOrder}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* ========================================================
          MARK DELIVERED MODAL
      ======================================================== */}

      <MarkDeliveredModal
        visible={deliverModalVisible}
        order={deliverOrder}
        onClose={() => setDeliverModalVisible(false)}
        onConfirmed={handleDeliveredConfirmed}
      />
    </SafeAreaView>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ==============================================================
  // FILTER AREA
  // ==============================================================

  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  filterRowHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },

  // ==============================================================
  // DATE FILTERS
  // ==============================================================

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },

  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },

  filterChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    marginLeft: 5,
  },

  filterChipTextActive: {
    color: colors.white,
  },

  // ==============================================================
  // RIGHT ACTIONS
  // ==============================================================

  rightFilterActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },

  // ==============================================================
  // ADVANCED FILTER BUTTON
  // ==============================================================

  advancedFilterButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    position: "relative",
  },

  advancedFilterButtonActive: {
    backgroundColor: colors.primaryDark + "10",
    borderColor: colors.primaryDark + "50",
  },

  filterDot: {
    position: "absolute",
    right: -4,
    top: -5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.background,
  },

  filterDotText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
    color: colors.white,
  },

  // ==============================================================
  // CUSTOM DATE
  // ==============================================================

  customBox: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  customDateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  dateColumn: {
    flex: 1,
  },

  dateArrow: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
  },

  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },

  dateButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },

  dateButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    marginLeft: 6,
  },

  dateButtonPlaceholder: {
    color: colors.textSecondary,
    fontWeight: "400",
  },

  applyDateButton: {
    width: 42,
    height: 42,
    marginLeft: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  customErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },

  iosDoneButton: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },

  iosDoneText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },

  // ==============================================================
  // STATUS FILTER
  // ==============================================================

  statusFilterWrapper: {
    marginTop: spacing.xs,
    width: "100%",
  },

  statusFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
  },

  statusFilterItem: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },

  statusFilterItemActive: {
    backgroundColor: colors.primaryDark + "12",
  },

  statusFilterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: 5,
  },

  statusFilterTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },

  // ==============================================================
  // DIVIDER
  // ==============================================================

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // ==============================================================
  // LIST
  // ==============================================================

  orderList: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  // ==============================================================
  // CARD
  // ==============================================================

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardUrgent: {
    borderColor: colors.danger,
    borderWidth: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  cardTopRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  deliverButton: {
    marginLeft: spacing.xs,
  },

  orderId: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  statusBadgeText: {
    ...typography.caption,
    fontWeight: "600",
  },

  customerName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  metaDot: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: 6,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },

  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  paymentBadgeText: {
    ...typography.caption,
    fontWeight: "600",
  },

  amount: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primaryDark,
  },

  // ==============================================================
  // EMPTY STATES
  // ==============================================================

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },

  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.xs,
  },

  emptySubText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  // ==============================================================
  // ERROR
  // ==============================================================

  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + "40",
    padding: spacing.md,
    alignItems: "center",
  },

  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  retryButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },

  retryButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },
});
