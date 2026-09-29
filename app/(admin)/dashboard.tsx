import ScreenLayout from "@/components/layout/ScreenLayout";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AdminTotals, getAdminTotals } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

const ADMIN_TABS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "grid-outline" as const,
  },
  {
    key: "orders",
    label: "Orders",
    icon: "receipt-outline" as const,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: "notifications-outline" as const,
  },
];

type StatsFilter = "today" | "all";

const STATS_FILTERS: {
  key: StatsFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "today",
    label: "Today",
    icon: "calendar-outline",
  },
  {
    key: "all",
    label: "All Time",
    icon: "infinite-outline",
  },
];

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

const ALL_FROM_DATE = "2000-01-01";

// ================================================================
// EMPTY TOTALS
// ================================================================

const EMPTY_TOTALS: AdminTotals = {
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

function normalizeTotals(raw: unknown): AdminTotals {
  if (!raw) {
    return { ...EMPTY_TOTALS };
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return { ...EMPTY_TOTALS };
    }

    raw = raw[0];
  }

  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_TOTALS };
  }

  const obj = raw as Partial<AdminTotals>;

  return {
    totalQty: Number(obj.totalQty) || 0,
    totalAmount: Number(obj.totalAmount) || 0,

    pendingQty: Number(obj.pendingQty) || 0,
    pendingAmount: Number(obj.pendingAmount) || 0,

    deliveredQty: Number(obj.deliveredQty) || 0,
    deliveredAmount: Number(obj.deliveredAmount) || 0,

    cancelledQty: Number(obj.cancelledQty) || 0,
    cancelledAmount: Number(obj.cancelledAmount) || 0,

    codQty: Number(obj.codQty) || 0,
    codAmount: Number(obj.codAmount) || 0,

    ibftQty: Number(obj.ibftQty) || 0,
    ibftAmount: Number(obj.ibftAmount) || 0,
  };
}

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
// ADMIN DASHBOARD
// ================================================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [statsFilter, setStatsFilter] =
    useState<StatsFilter>("today");

  const [stats, setStats] = useState<AdminTotals>({
    ...EMPTY_TOTALS,
  });

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==============================================================
  // LOAD STATS
  // ==============================================================

  const loadStats = useCallback(
    async (filter: StatsFilter = statsFilter) => {
      try {
        setErrorMsg(null);

        const today = getTodayDateString();

        let fromDate: string;
        let toDate: string;
        let reqFilter: "Today" | "All";

        if (filter === "today") {
          fromDate = today;
          toDate = today;
          reqFilter = "Today";
        } else {
          fromDate = ALL_FROM_DATE;
          toDate = today;
          reqFilter = "All";
        }

        console.log("====================================");
        console.log("[ADMIN DASHBOARD] Loading totals");
        console.log("[ADMIN DASHBOARD] Filter:", filter);
        console.log("[ADMIN DASHBOARD] From Date:", fromDate);
        console.log("[ADMIN DASHBOARD] To Date:", toDate);
        console.log("[ADMIN DASHBOARD] reqFilter:", reqFilter);
        console.log("====================================");

        const data = await getAdminTotals(
          fromDate,
          toDate,
          reqFilter,
        );

        setStats(normalizeTotals(data));
      } catch (error: any) {
        console.error(
          "[ADMIN DASHBOARD] Failed to load stats:",
          error,
        );

        setErrorMsg(
          error?.message ??
            "Failed to load dashboard data.",
        );

        setStats({
          ...EMPTY_TOTALS,
        });
      }
    },
    [statsFilter],
  );

  // ==============================================================
  // INITIAL LOAD + FILTER CHANGE
  // ==============================================================

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      if (mounted) {
        setLoading(true);
      }

      await loadStats(statsFilter);

      if (mounted) {
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [statsFilter, loadStats]);

  // ==============================================================
  // REFRESH
  // ==============================================================

  const onRefresh = async () => {
    setRefreshing(true);

    await loadStats(statsFilter);

    setRefreshing(false);
  };

  // ==============================================================
  // TAB NAVIGATION
  // ==============================================================

  const handleTabPress = (key: string) => {
    setActiveTab(key);

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

  // ==============================================================
  // STAT CARDS
  // ==============================================================

  const cards: StatCardConfig[] = [
    {
      key: "total",
      label: "Total Orders",
      icon: "bar-chart-outline",
      qty: stats.totalQty,
      amount: stats.totalAmount,
      color: colors.accentOrange,
    },

    {
      key: "pending",
      label: "Pending Orders",
      icon: "hourglass-outline",
      qty: stats.pendingQty,
      amount: stats.pendingAmount,
      color: "#E58A00",
    },

    {
      key: "delivered",
      label: "Delivered",
      icon: "checkmark-circle-outline",
      qty: stats.deliveredQty,
      amount: stats.deliveredAmount,
      color: colors.success,
    },

    {
      key: "cancelled",
      label: "Cancelled",
      icon: "ban-outline",
      qty: stats.cancelledQty,
      amount: stats.cancelledAmount,
      color: colors.danger,
    },

    {
      key: "cod",
      label: "Cash on Delivery",
      icon: "wallet-outline",
      qty: stats.codQty,
      amount: stats.codAmount,
      color: "#7C5CFC",
    },

    {
      key: "ibft",
      label: "Bank Transfer",
      icon: "business-outline",
      qty: stats.ibftQty,
      amount: stats.ibftAmount,
      color: "#0EA5A5",
    },
  ];

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <ScreenLayout
      title="Admin Dashboard"
      footerTabs={ADMIN_TABS}
      activeTabKey={activeTab}
      onTabPress={handleTabPress}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentOrange}
          />
        }
      >
        {/* ======================================================
            DASHBOARD INTRO
        ====================================================== */}

      

        {/* ======================================================
            FILTER
        ====================================================== */}

        <View style={styles.filterWrapper}>
         

          <View style={styles.filterContainer}>
            {STATS_FILTERS.map((filter) => {
              const active =
                filter.key === statsFilter;

              return (
                <TouchableOpacity
                  key={filter.key}
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={() => {
                    if (filter.key === statsFilter) {
                      return;
                    }

                    setStatsFilter(filter.key);
                  }}
                  style={[
                    styles.filterItem,
                    active && styles.filterItemActive,
                  ]}
                >
                  <Ionicons
                    name={filter.icon}
                    size={16}
                    color={
                      active
                        ? colors.white
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
            <ActivityIndicator
              size="large"
              color={colors.accentOrange}
            />

            <Text style={styles.loadingText}>
              Loading dashboard...
            </Text>
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

            <Text style={styles.errorTitle}>
              Something went wrong
            </Text>

            <Text style={styles.errorText}>
              {errorMsg}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadStats(statsFilter)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.white}
              />

              <Text style={styles.retryButtonText}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ======================================================
            STATS
        ====================================================== */}

        {!loading && (
          <View style={styles.statsGrid}>
            {cards.map((card) => {
              const { key, ...cardProps } = card;

              return (
                <AdminStatCard
                  key={key}
                  {...cardProps}
                />
              );
            })}
          </View>
        )}

        {/* ======================================================
            MANAGE
        ====================================================== */}

        <Text style={styles.sectionHeading}>
          Manage
        </Text>

        <TouchableOpacity
          style={styles.riderManagementCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push("/(admin)/riders" as any)
          }
        >
          <View style={styles.riderManagementIconWrap}>
            <Ionicons
              name="bicycle"
              size={24}
              color={colors.white}
            />
          </View>

          <View style={styles.riderManagementText}>
            <Text style={styles.riderManagementTitle}>
              Rider Management
            </Text>

            <Text style={styles.riderManagementSubtitle}>
              View, add, and manage delivery riders
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

// ================================================================
// ADMIN STAT CARD
// ================================================================

type AdminStatCardProps = Omit<StatCardConfig, "key">;

function AdminStatCard({
  icon,
  label,
  qty,
  amount,
  color,
}: AdminStatCardProps) {
  const safeQty =
    typeof qty === "number" && !Number.isNaN(qty)
      ? qty
      : 0;

  const safeAmount =
    typeof amount === "number" && !Number.isNaN(amount)
      ? amount
      : 0;

  return (
    <View style={styles.statCard}>
      {/* TOP ACCENT */}

      <View
        style={[
          styles.cardAccent,
          {
            backgroundColor: color,
          },
        ]}
      />

      {/* TOP ROW */}

      <View style={styles.cardTopRow}>
        <View
          style={[
            styles.statIconWrap,
            {
              backgroundColor: color + "14",
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={21}
            color={color}
          />
        </View>

        <View
          style={[
            styles.cardIndicator,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* VALUE */}

      <Text style={styles.statQty}>
        {safeQty.toLocaleString()}
      </Text>

      {/* LABEL */}

      <Text style={styles.statLabel}>
        {label}
      </Text>

      {/* AMOUNT */}

      <View
        style={[
          styles.amountBadge,
          {
            backgroundColor: color + "10",
          },
        ]}
      >
        <Text
          style={[
            styles.statAmount,
            {
              color,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
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
  // CONTAINER
  // ==============================================================

  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // ==============================================================
  // INTRO
  // ==============================================================

  dashboardIntro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  introIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.accentOrange + "14",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  introTextContainer: {
    flex: 1,
  },

  introTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "800",
  },

  introSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ==============================================================
  // FILTER
  // ==============================================================

  filterWrapper: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },

  filterTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "800",
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 4,
  },

  filterItem: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },

  filterItemActive: {
    backgroundColor: colors.accentOrange,
  },

  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: 6,
  },

  filterTextActive: {
    color: colors.white,
    fontWeight: "700",
  },

  // ==============================================================
  // DIVIDER
  // ==============================================================

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  // STATS GRID
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
    minHeight: 178,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  // ==============================================================
  // TOP ACCENT
  // ==============================================================

  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // ==============================================================
  // CARD TOP
  // ==============================================================

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  cardIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // ==============================================================
  // QUANTITY
  // ==============================================================

  statQty: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: "800",
    marginTop: 2,
  },

  // ==============================================================
  // LABEL
  // ==============================================================

  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 3,
    marginBottom: spacing.sm,
  },

  // ==============================================================
  // AMOUNT BADGE
  // ==============================================================

  amountBadge: {
    minHeight: 30,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  statAmount: {
    ...typography.caption,
    fontWeight: "800",
  },

  // ==============================================================
  // MANAGE
  // ==============================================================

  sectionHeading: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  riderManagementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,

    elevation: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },

  riderManagementIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
  },

  riderManagementText: {
    flex: 1,
    gap: 2,
  },

  riderManagementTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  riderManagementSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
