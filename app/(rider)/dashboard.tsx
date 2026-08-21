import { colors, radius, spacing, typography } from "@/constants/theme";
import { getRiderTotals, RiderTotals } from "@/services/api";
import { getUser } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================================================================
// DATE HELPERS
// ================================================================

function getTodayDateString() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

// Used when "All" is selected.
const ALL_FROM_DATE = "2000-01-01";

// ================================================================
// EMPTY TOTALS
// ================================================================

const EMPTY_TOTALS: RiderTotals = {
  totalQty: 0,
  totalAmount: 0,

  pendingQty: 0,
  pendingAmount: 0,

  deliveredQty: 0,
  deliveredAmount: 0,

  cancelledQty: 0,
  cancelledAmount: 0,

  codQty: 0,
  codAmount: 0,

  ibftQty: 0,
  ibftAmount: 0,
};

// ================================================================
// NORMALIZE TOTALS
// ================================================================

function normalizeTotals(raw: unknown): RiderTotals {
  if (!raw) {
    return { ...EMPTY_TOTALS };
  }

  // API may return:
  // []
  // [{ ... }]
  // { ... }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return { ...EMPTY_TOTALS };
    }

    raw = raw[0];
  }

  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_TOTALS };
  }

  const obj = raw as Partial<RiderTotals>;

  return {
    totalQty: obj.totalQty ?? 0,
    totalAmount: obj.totalAmount ?? 0,

    pendingQty: obj.pendingQty ?? 0,
    pendingAmount: obj.pendingAmount ?? 0,

    deliveredQty: obj.deliveredQty ?? 0,
    deliveredAmount: obj.deliveredAmount ?? 0,

    cancelledQty: obj.cancelledQty ?? 0,
    cancelledAmount: obj.cancelledAmount ?? 0,

    codQty: obj.codQty ?? 0,
    codAmount: obj.codAmount ?? 0,

    ibftQty: obj.ibftQty ?? 0,
    ibftAmount: obj.ibftAmount ?? 0,
  };
}

// ================================================================
// TOTALS FILTER
// ================================================================

type TotalsFilter = "today" | "all";

const TOTALS_FILTERS: {
  key: TotalsFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "today",
    label: "Today",
    icon: "today-outline",
  },
  {
    key: "all",
    label: "All",
    icon: "layers-outline",
  },
];

// ================================================================
// STAT CARD TYPES
// ================================================================

type StatCardConfig = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  qty: number;
  amount: number;
  color: string;
};

// ================================================================
// DASHBOARD
// ================================================================

export default function RiderDashboardScreen() {
  // --------------------------------------------------------------
  // RIDER
  // --------------------------------------------------------------

  const [riderName, setRiderName] = useState("Rider");

  // --------------------------------------------------------------
  // TOTALS FILTER
  //
  // TODAY IS THE DEFAULT FILTER
  // --------------------------------------------------------------

  const [activeTotalsFilter, setActiveTotalsFilter] =
    useState<TotalsFilter>("today");

  // --------------------------------------------------------------
  // TOTALS
  // --------------------------------------------------------------

  const [totals, setTotals] = useState<RiderTotals>({
    ...EMPTY_TOTALS,
  });

  // --------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==============================================================
  // LOAD TOTALS
  // ==============================================================

  const loadTotals = useCallback(async () => {
    try {
      setErrorMsg(null);

      // ----------------------------------------------------------
      // GET USER
      // ----------------------------------------------------------

      const user = await getUser();

      setRiderName(user?.firstName ?? "Rider");

      const riderID = user?.riderID;

      if (!riderID) {
        throw new Error("No rider ID found in session. Please log in again.");
      }

      // ----------------------------------------------------------
      // TODAY
      // ----------------------------------------------------------

      const today = getTodayDateString();

      // ----------------------------------------------------------
      // BUILD API FILTER
      //
      // Today:
      // FromDate = today
      // ToDate   = today
      // reqFilter = Today
      //
      // All:
      // FromDate = 2000-01-01
      // ToDate   = today
      // reqFilter = All
      // ----------------------------------------------------------

      let fromDate: string;
      let toDate: string;
      let reqFilter: "Today" | "All";

      if (activeTotalsFilter === "today") {
        fromDate = today;
        toDate = today;
        reqFilter = "Today";
      } else {
        fromDate = ALL_FROM_DATE;
        toDate = today;
        reqFilter = "All";
      }

      // ----------------------------------------------------------
      // API REQUEST
      // ----------------------------------------------------------

      console.log("====================================");
      console.log("[RIDER DASHBOARD] Loading totals");
      console.log("[RIDER DASHBOARD] Filter:", activeTotalsFilter);
      console.log("[RIDER DASHBOARD] From Date:", fromDate);
      console.log("[RIDER DASHBOARD] To Date:", toDate);
      console.log("[RIDER DASHBOARD] reqFilter:", reqFilter);
      console.log("====================================");

      const data = await getRiderTotals(riderID, fromDate, toDate, reqFilter);

      // ----------------------------------------------------------
      // NORMALIZE RESPONSE
      // ----------------------------------------------------------

      setTotals(normalizeTotals(data));
    } catch (e: any) {
      console.log("[RIDER DASHBOARD] Failed to load totals:", e);

      setErrorMsg(e?.message ?? "Failed to load dashboard data.");

      // Keep the cards visible with zero values.
      setTotals({
        ...EMPTY_TOTALS,
      });
    }
  }, [activeTotalsFilter]);

  // ==============================================================
  // INITIAL LOAD + FILTER CHANGE
  // ==============================================================

  useEffect(() => {
    let mounted = true;

    const fetchTotals = async () => {
      if (mounted) {
        setLoading(true);
      }

      await loadTotals();

      if (mounted) {
        setLoading(false);
      }
    };

    fetchTotals();

    return () => {
      mounted = false;
    };
  }, [loadTotals]);

  // ==============================================================
  // REFRESH
  // ==============================================================

  const onRefresh = async () => {
    setRefreshing(true);

    await loadTotals();

    setRefreshing(false);
  };

  // ==============================================================
  // STAT CARDS
  // ==============================================================

  const cards: StatCardConfig[] = [
    {
      key: "assigned",
      label: "Assigned Orders",
      icon: "clipboard-outline",
      qty: totals.totalQty,
      amount: totals.totalAmount,
      color: colors.primaryDark,
    },

    {
      key: "pending",
      label: "Pending Orders",
      icon: "time-outline",
      qty: totals.pendingQty,
      amount: totals.pendingAmount,
      color: colors.accentOrange,
    },

    {
      key: "completed",
      label: "Completed",
      icon: "checkmark-done-outline",
      qty: totals.deliveredQty,
      amount: totals.deliveredAmount,
      color: colors.success,
    },

    {
      key: "cancelled",
      label: "Cancelled",
      icon: "close-circle-outline",
      qty: totals.cancelledQty,
      amount: totals.cancelledAmount,
      color: colors.danger,
    },

    {
      key: "cod",
      label: "Cash on Delivery",
      icon: "cash-outline",
      qty: totals.codQty,
      amount: totals.codAmount,
      color: "#7C5CFC",
    },

    {
      key: "ibft",
      label: "Bank Transfer",
      icon: "card-outline",
      qty: totals.ibftQty,
      amount: totals.ibftAmount,
      color: "#0EA5A5",
    },
  ];

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryDark}
          />
        }
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>

            <Text style={styles.name}>{riderName}</Text>
          </View>
        </View>

        {/* ======================================================
            TODAY / ALL FILTER
        ====================================================== */}

        <View style={styles.statusFilterContainer}>
          {TOTALS_FILTERS.map((filter) => {
            const active = filter.key === activeTotalsFilter;

            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.8}
                disabled={loading}
                onPress={() => {
                  if (filter.key === activeTotalsFilter) {
                    return;
                  }

                  setActiveTotalsFilter(filter.key);
                }}
                style={[
                  styles.statusFilterItem,
                  active && styles.statusFilterItemActive,
                ]}
              >
                <Ionicons
                  name={filter.icon}
                  size={17}
                  color={active ? colors.primaryDark : colors.textSecondary}
                />

                <Text
                  style={[
                    styles.statusFilterText,
                    active && styles.statusFilterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ======================================================
            DIVIDER
        ====================================================== */}

        <View style={styles.divider} />

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primaryDark} />

            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* ======================================================
            ERROR
        ====================================================== */}

        {!loading && errorMsg && (
          <View style={styles.errorBox}>
            <View style={styles.errorIconCircle}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.danger}
              />
            </View>

            <Text style={styles.errorTitle}>Something went wrong</Text>

            <Text style={styles.errorText}>{errorMsg}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadTotals}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.white} />

              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ======================================================
            STAT CARDS
        ====================================================== */}

        {!loading && (
          <View style={styles.statsGrid}>
            {cards.map((card) => {
              const { key, ...cardProps } = card;

              return <StatCard key={key} {...cardProps} />;
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ================================================================
// STAT CARD
// ================================================================

type StatCardProps = Omit<StatCardConfig, "key">;

function StatCard({ icon, label, qty, amount, color }: StatCardProps) {
  const safeQty = typeof qty === "number" && !Number.isNaN(qty) ? qty : 0;

  const safeAmount =
    typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;

  return (
    <View style={styles.statCard}>
      {/* ICON */}

      <View
        style={[
          styles.statIconWrap,
          {
            backgroundColor: color + "1A",
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>

      {/* QUANTITY */}

      <Text style={styles.statQty}>{safeQty.toLocaleString()}</Text>

      {/* LABEL */}

      <Text style={styles.statLabel}>{label}</Text>

      {/* AMOUNT */}

      <View style={styles.statAmountRow}>
        <Text
          style={[
            styles.statAmount,
            {
              color,
            },
          ]}
        >
          Rs. {safeAmount.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  // ==============================================================
  // SCREEN
  // ==============================================================

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  // ==============================================================
  // HEADER
  // ==============================================================

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  headerTextContainer: {
    flex: 1,
  },

  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },

  name: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: 2,
  },

  // ==============================================================
  // TODAY / ALL FILTER
  // ==============================================================

  statusFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 4,
    marginBottom: spacing.sm,
  },

  statusFilterItem: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },

  statusFilterItemActive: {
    backgroundColor: colors.primaryDark + "12",
  },

  statusFilterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: 6,
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
    marginBottom: spacing.sm,
  },

  // ==============================================================
  // LOADING
  // ==============================================================

  centerBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  // ==============================================================
  // ERROR
  // ==============================================================

  errorBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + "40",
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  errorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.danger + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },

  errorTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },

  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.sm,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    gap: 6,
  },

  retryButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },

  // ==============================================================
  // STAT GRID
  // ==============================================================

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // ==============================================================
  // STAT CARD
  // ==============================================================

  statCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  statQty: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },

  statAmountRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },

  statAmount: {
    ...typography.caption,
    fontWeight: "700",
  },
});
