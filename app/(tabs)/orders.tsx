import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import CancelOrderModal from "../../components/CancelOrderModal";
import CustomerOrderDetailModal from "../../components/CustomerOrderDetailModal";
import OrderCard from "../../components/OrderCard";
import { changeOrderStatus, getMobOrders, MobOrder } from "../../services/api";
import { getUser } from "../../services/authStorage";

type PresetKey = "all" | "7d" | "30d" | "custom";
type StatusKey =
  | "All"
  | "Pending"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

const STATUS_OPTIONS: StatusKey[] = [
  "All",
  "Pending",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

const STATUS_DOT_COLORS: Record<StatusKey, string> = {
  All: "#FFFFFF",
  Pending: "#B26A00",
  Processing: "#0B5FFF",
  Dispatched: "#7B4FE0",
  Delivered: "#1B8A3E",
  Cancelled: "#C62828",
};

// Orders can only be self-cancelled while they're still Pending or Processing.
// Once a rider has been dispatched, cancellation has to go through support.
const CANCELLABLE_STATUSES: StatusKey[] = ["Pending", "Processing"];

function isCancellable(status: string) {
  return CANCELLABLE_STATUSES.includes(status as StatusKey);
}

function toApiDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function formatShort(d: Date) {
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DATE_PRESETS: { key: PresetKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Custom" },
];

export default function OrdersScreen() {
  const [allOrders, setAllOrders] = useState<MobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preset, setPreset] = useState<PresetKey>("all");
  const [customFrom, setCustomFrom] = useState<Date>(daysAgo(30));
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState<"from" | "to" | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusKey>("All");

  // Detail bottom-sheet — fetches real line items via getSingleOrderDetail
  // once `detailOrder` is set (see CustomerOrderDetailModal).
  const [detailOrder, setDetailOrder] = useState<MobOrder | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<MobOrder | null>(null);
  const [cancelVisible, setCancelVisible] = useState(false);

  // Needed to build the ChangeOrderStatus payload when the customer cancels.
  const [mobUserID, setMobUserID] = useState<number | null>(null);

  const resolveRange = useCallback((): { from: Date; to: Date } | null => {
    switch (preset) {
      case "all":
        return null;
      case "7d":
        return { from: daysAgo(7), to: endOfDay(new Date()) };
      case "30d":
        return { from: daysAgo(30), to: endOfDay(new Date()) };
      case "custom":
        return { from: startOfDay(customFrom), to: endOfDay(customTo) };
    }
  }, [preset, customFrom, customTo]);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);

        const user = await getUser();
        const userID = user?.mobUserID ?? user?.MobUserID ?? user?.id;

        if (!userID) {
          setError("You need to be signed in to view your orders.");
          setAllOrders([]);
          return;
        }

        setMobUserID(userID);

        const range = resolveRange();

        const result = range
          ? await getMobOrders(
              userID,
              toApiDate(range.from),
              toApiDate(range.to),
              "All",
            )
          : await getMobOrders(userID, null, null, "All");

        // Client-side safety net in case the backend ignores FromDate/ToDate.
        const filtered = range
          ? result.filter((o) => {
              const t = new Date(o.orderDate).getTime();
              return t >= range.from.getTime() && t <= range.to.getTime();
            })
          : result;

        filtered.sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
        );

        setAllOrders(filtered);
      } catch (e: any) {
        console.log("[ORDERS] Failed to load:", e);
        setError(
          e?.message || "Couldn't load your orders. Pull down to retry.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveRange],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Status filtering is applied client-side on top of whatever the date
  // range already fetched — GetMobOrders has no status param of its own.
  const visibleOrders = useMemo(() => {
    if (statusFilter === "All") return allOrders;

    return allOrders.filter((o) => o.orderStatus === statusFilter);
  }, [allOrders, statusFilter]);

  const onDateChange = (which: "from" | "to", event: any, selected?: Date) => {
    setPickerOpen(null);

    if (!selected) return;

    if (which === "from") setCustomFrom(selected);
    else setCustomTo(selected);
  };

  // ---- Detail modal (line items via getSingleOrderDetail) ----
  const handleOpenDetail = (order: MobOrder) => {
    setDetailOrder(order);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setDetailOrder(null);
  };

  // ---- Cancel flow ----

  const handleRequestCancel = (order: MobOrder) => {
    // Belt-and-braces: OrderCard should already hide the icon once an order
    // is no longer cancellable, but don't trust it blindly.
    if (!isCancellable(order.orderStatus)) return;

    setCancelTarget(order);
    setCancelVisible(true);
  };

  const handleCloseCancel = () => {
    setCancelVisible(false);
    setCancelTarget(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !mobUserID) return;

    // NOTE: ChangeOrderStatusPayload requires riderID. A self-cancelled
    // order (still Pending/Processing) has no rider assigned yet, so this
    // sends 0. Swap in the real value if your backend expects otherwise.
    await changeOrderStatus({
      orderNo: cancelTarget.orderNo,
      riderID: 0,
      orderStatus: "Cancelled",
      remarks: "Cancelled by customer",
      userID: mobUserID,
    });

    // Reflect the change locally right away instead of waiting on a refetch.
    setAllOrders((prev) =>
      prev.map((o) =>
        o.orderNo === cancelTarget.orderNo
          ? { ...o, orderStatus: "Cancelled" }
          : o,
      ),
    );

    setCancelVisible(false);
    setCancelTarget(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      {/* Top date filters — attached to the top */}
      <View style={styles.dateFilterContainer}>
        <View style={styles.chipRow}>
          {DATE_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, preset === p.key && styles.chipActive]}
              onPress={() => setPreset(p.key)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  preset === p.key && styles.chipLabelActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {preset === "custom" && (
          <View style={styles.customRow}>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setPickerOpen("from")}
            >
              <Ionicons name="calendar-outline" size={14} color="#6B6B6B" />
              <Text style={styles.dateFieldText}>
                {formatShort(customFrom)}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateSeparator}>to</Text>

            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setPickerOpen("to")}
            >
              <Ionicons name="calendar-outline" size={14} color="#6B6B6B" />
              <Text style={styles.dateFieldText}>{formatShort(customTo)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => loadOrders()}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {pickerOpen && (
          <DateTimePicker
            value={pickerOpen === "from" ? customFrom : customTo}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={new Date()}
            onChange={(event, selected) =>
              onDateChange(pickerOpen, event, selected)
            }
          />
        )}
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadOrders()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : visibleOrders.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="receipt-outline" size={44} color="#C7C7C7" />
          <Text style={styles.emptyText}>No orders match this filter</Text>
        </View>
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={(item) => String(item.orderNo)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => handleOpenDetail(item)}
              cancellable={isCancellable(item.orderStatus)}
              onCancelPress={() => handleRequestCancel(item)}
            />
          )}
        />
      )}

      {/* Bottom status filter bar — completely attached to bottom */}
      <View style={styles.statusBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScrollContent}
        >
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusChip,
                statusFilter === s && styles.statusChipActive,
              ]}
              onPress={() => setStatusFilter(s)}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_DOT_COLORS[s] },
                ]}
              />
              <Text
                style={[
                  styles.statusChipLabel,
                  statusFilter === s && styles.statusChipLabelActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <CustomerOrderDetailModal
        visible={detailVisible}
        order={detailOrder}
        onClose={handleCloseDetail}
      />

      <CancelOrderModal
        visible={cancelVisible}
        orderNo={cancelTarget?.orderNo ?? null}
        onClose={handleCloseCancel}
        onConfirm={handleConfirmCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Top date filters
  dateFilterContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E2E4",
    paddingBottom: 12,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#EDEDEF",
  },

  chipActive: {
    backgroundColor: "#1A1A1A",
  },

  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B6B",
  },

  chipLabelActive: {
    color: "#fff",
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },

  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E2E4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  dateFieldText: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "500",
  },

  dateSeparator: {
    fontSize: 12,
    color: "#8A8A8A",
  },

  applyButton: {
    marginLeft: "auto",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  applyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  centerFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8A8A8A",
  },

  // Bottom status filter bar
  statusBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#E2E2E4",
    backgroundColor: colors.background,
    paddingTop: 10,
    paddingBottom: 10,
  },

  statusScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F2F2F4",
  },

  statusChipActive: {
    backgroundColor: "#1A1A1A",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4A4A",
  },

  statusChipLabelActive: {
    color: "#fff",
  },
});
