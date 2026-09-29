import NotificationsModal, {
  NotificationModalData,
} from "@/components/NotificationsModal";
import { colors, radius } from "@/constants/theme";
import {
  getMobNotifications,
  MobNotification,
  updateNotificationStatus,
} from "@/services/api";
import { getUser } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// TYPES
// ============================================================

type NotificationType =
  | "order"
  | "delivery"
  | "promo"
  | "payment"
  | "system";

type NotificationItem = {
  id: string;
  notificationID: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

type DateBucket = "Today" | "Yesterday" | "Earlier";

type FilterKey =
  | "all"
  | "unread"
  | "Today"
  | "Yesterday"
  | "Earlier";

// ============================================================
// COLOR HELPER
// ============================================================

function withOpacity(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// TYPE -> ICON / ACCENT MAP
// ============================================================

type NotificationMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
};

const TYPE_META: Record<NotificationType, NotificationMeta> = {
  order: {
    icon: "receipt-outline",
    fg: colors.primaryDark,
    bg: withOpacity(colors.primaryDark, 0.12),
  },

  delivery: {
    icon: "bicycle-outline",
    fg: colors.accentOrangeDark,
    bg: withOpacity(colors.accentOrangeDark, 0.12),
  },

  promo: {
    icon: "pricetag-outline",
    fg: colors.primaryLight,
    bg: withOpacity(colors.primaryLight, 0.12),
  },

  payment: {
    icon: "card-outline",
    fg: colors.success,
    bg: withOpacity(colors.success, 0.12),
  },

  system: {
    icon: "information-circle-outline",
    fg: colors.textSecondary,
    bg: withOpacity(colors.textSecondary, 0.12),
  },
};

// ============================================================
// TITLE -> TYPE HEURISTIC
// ============================================================

function inferNotificationType(title: string): NotificationType {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes("deliver")) {
    return "delivery";
  }

  if (
    normalized.includes("promo") ||
    normalized.includes("off")
  ) {
    return "promo";
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("paid")
  ) {
    return "payment";
  }

  if (normalized.includes("order")) {
    return "order";
  }

  return "system";
}

// ============================================================
// NORMALIZE RAW API NOTIFICATION
// ============================================================

function normalizeNotification(
  raw: MobNotification,
  index: number,
): NotificationItem {
  const createdAt = new Date(raw.createdOn);

  const id =
    raw.notificationID &&
    raw.notificationID.trim().length > 0
      ? raw.notificationID
      : `${raw.mobUserID}-${raw.createdOn}-${index}`;

  return {
    id,
    notificationID: raw.notificationID ?? "",
    type: inferNotificationType(raw.notificationTitle),
    title: raw.notificationTitle,
    message: raw.notificationSubTitle,
    createdAt: Number.isNaN(createdAt.getTime())
      ? new Date()
      : createdAt,
    read: !!raw.flag,
  };
}

// ============================================================
// DATE BUCKETING
// ============================================================

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateBucketFor(date: Date): DateBucket {
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  }

  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatNotificationTime(date: Date): string {
  const bucket = dateBucketFor(date);

  if (bucket === "Today") {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (bucket === "Yesterday") {
    return `Yesterday, ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  const diffDays = Math.floor(
    (Date.now() - date.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  if (diffDays <= 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

const SECTION_ORDER: DateBucket[] = [
  "Today",
  "Yesterday",
  "Earlier",
];

function buildSections(items: NotificationItem[]) {
  const buckets: Record<
    string,
    NotificationItem[]
  > = {};

  items.forEach((item) => {
    const label = dateBucketFor(item.createdAt);

    if (!buckets[label]) {
      buckets[label] = [];
    }

    buckets[label].push(item);
  });

  return SECTION_ORDER
    .filter((label) => buckets[label]?.length)
    .map((label) => ({
      title: label,
      data: buckets[label],
    }));
}

// ============================================================
// FILTERS
// ============================================================

const FILTERS: {
  key: FilterKey;
  label: string;
}[] = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "unread",
    label: "Unread",
  },
  {
    key: "Today",
    label: "Today",
  },
  {
    key: "Yesterday",
    label: "Yesterday",
  },
  {
    key: "Earlier",
    label: "Earlier",
  },
];

// ============================================================
// NOTIFICATIONS SCREEN
// ============================================================

export default function NotificationsScreen() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [filter, setFilter] =
    useState<FilterKey>("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // ==========================================================
  // MODAL STATE
  // ==========================================================

  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  const loadNotifications = useCallback(async () => {
    const user = await getUser();

    const mobUserID =
      Number(user?.mobUserID) || 0;

    const raw =
      await getMobNotifications(mobUserID);

    setNotifications(
      raw.map(normalizeNotification),
    );
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        await loadNotifications();
      } catch (error) {
        console.error(
          "[NOTIFICATIONS] Failed to load:",
          error,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [loadNotifications]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadNotifications();
    } catch (error) {
      console.error(
        "[NOTIFICATIONS] Refresh failed:",
        error,
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // COUNTS
  // ==========================================================

  const unreadCount = notifications.filter(
    (n) => !n.read,
  ).length;

  const bucketCounts = useMemo(() => {
    const counts: Record<DateBucket, number> = {
      Today: 0,
      Yesterday: 0,
      Earlier: 0,
    };

    notifications.forEach((n) => {
      counts[dateBucketFor(n.createdAt)] += 1;
    });

    return counts;
  }, [notifications]);

  // ==========================================================
  // FILTERED NOTIFICATIONS
  // ==========================================================

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (n) => !n.read,
      );
    }

    if (
      filter === "Today" ||
      filter === "Yesterday" ||
      filter === "Earlier"
    ) {
      return notifications.filter(
        (n) =>
          dateBucketFor(n.createdAt) === filter,
      );
    }

    return notifications;
  }, [notifications, filter]);

  const sections = useMemo(
    () => buildSections(visibleNotifications),
    [visibleNotifications],
  );

  // ==========================================================
  // OPEN NOTIFICATION
  //
  // IMPORTANT:
  // Modal opens first.
  // Notification is marked read immediately when opened.
  // API is called only if notification was previously unread.
  // ==========================================================

  const handlePressItem = async (
    item: NotificationItem,
  ) => {
    // --------------------------------------------------------
    // OPEN MODAL
    // --------------------------------------------------------

    setSelectedNotification(item);
    setModalVisible(true);

    // --------------------------------------------------------
    // ALREADY READ?
    // Don't call API again.
    // --------------------------------------------------------

    if (item.read) {
      return;
    }

    // --------------------------------------------------------
    // MARK READ LOCALLY IMMEDIATELY
    // --------------------------------------------------------

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id
          ? {
              ...n,
              read: true,
            }
          : n,
      ),
    );

    // --------------------------------------------------------
    // NO BACKEND ID
    // --------------------------------------------------------

    if (!item.notificationID) {
      return;
    }

    // --------------------------------------------------------
    // UPDATE BACKEND
    // --------------------------------------------------------

    try {
      await updateNotificationStatus(
        item.notificationID,
      );
    } catch (error) {
      console.error(
        "[NOTIFICATIONS] Failed to update status:",
        error,
      );
    }
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleCloseModal = () => {
    setModalVisible(false);

    // Small delay isn't necessary, but clearing after close
    // keeps the modal animation clean.
    setTimeout(() => {
      setSelectedNotification(null);
    }, 200);
  };

  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(
      (n) => !n.read,
    );

    if (unread.length === 0) {
      return;
    }

    // --------------------------------------------------------
    // UPDATE UI IMMEDIATELY
    // --------------------------------------------------------

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      })),
    );

    const withRealId = unread.filter(
      (n) => !!n.notificationID,
    );

    try {
      await Promise.all(
        withRealId.map((n) =>
          updateNotificationStatus(
            n.notificationID,
          ),
        ),
      );
    } catch (error) {
      console.error(
        "[NOTIFICATIONS] Failed to mark all read:",
        error,
      );
    }
  };

  // ==========================================================
  // MODAL DATA
  // ==========================================================

  const modalData: NotificationModalData | null =
    selectedNotification
      ? {
          title: selectedNotification.title,
          message: selectedNotification.message,
          time: formatNotificationTime(
            selectedNotification.createdAt,
          ),
          type: selectedNotification.type,
          read: selectedNotification.read,
        }
      : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View style={styles.container}>
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <View style={styles.topBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;

            const badgeCount =
              key === "unread"
                ? unreadCount
                : key === "Today" ||
                    key === "Yesterday" ||
                    key === "Earlier"
                  ? bucketCounts[key]
                  : 0;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.pill,
                  active &&
                    styles.pillActive,
                ]}
                onPress={() =>
                  setFilter(key)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    active &&
                      styles.pillTextActive,
                  ]}
                >
                  {label}
                </Text>

                {badgeCount > 0 && (
                  <View
                    style={[
                      styles.pillBadge,
                      active &&
                        styles.pillBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        !active &&
                          styles.pillBadgeTextInactive,
                      ]}
                    >
                      {badgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
          style={styles.markAllButton}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={15}
            color={
              unreadCount === 0
                ? colors.textSecondary
                : colors.primaryDark
            }
          />

          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 &&
                styles.markAllTextDisabled,
            ]}
          >
            Mark all
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator
            size="large"
            color={colors.primaryDark}
          />
        </View>
      ) : sections.length === 0 ? (
        /* ====================================================
           EMPTY STATE
        ==================================================== */

        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="notifications-off-outline"
              size={34}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            {filter === "unread"
              ? "You're all caught up"
              : "No notifications here"}
          </Text>

          <Text style={styles.emptySubtitle}>
            {filter === "unread"
              ? "New updates will show up here."
              : "Nothing to show for this filter yet."}
          </Text>
        </View>
      ) : (
        /* ====================================================
           NOTIFICATION LIST
        ==================================================== */

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={
                colors.primaryDark
              }
            />
          }
          renderSectionHeader={({
            section,
          }) => (
            <View
              style={
                styles.sectionHeaderRow
              }
            >
              <View
                style={styles.sectionChip}
              >
                <Text
                  style={
                    styles.sectionChipText
                  }
                >
                  {section.title}
                </Text>
              </View>

              <View
                style={styles.sectionLine}
              />
            </View>
          )}
          renderItem={({ item }) => {
            const meta =
              TYPE_META[item.type];

            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  !item.read &&
                    styles.itemUnread,
                ]}
                onPress={() =>
                  handlePressItem(item)
                }
                activeOpacity={0.7}
              >
                {/* ==================================================
                    ICON
                ================================================== */}

                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        meta.bg,
                    },
                  ]}
                >
                  <Ionicons
                    name={meta.icon}
                    size={20}
                    color={meta.fg}
                  />
                </View>

                {/* ==================================================
                    BODY
                ================================================== */}

                <View
                  style={styles.itemBody}
                >
                  <View
                    style={
                      styles.itemTopRow
                    }
                  >
                    <Text
                      style={[
                        styles.itemTitle,
                        !item.read &&
                          styles.itemTitleUnread,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={styles.itemTime}
                    >
                      {formatNotificationTime(
                        item.createdAt,
                      )}
                    </Text>
                  </View>

                  {/* ==================================================
                      MESSAGE
                      Only 2 lines are shown here.
                      Long text automatically becomes "..."
                  ================================================== */}

                  <Text
                    style={
                      styles.itemMessage
                    }
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.message}
                  </Text>
                </View>

                {/* ==================================================
                    UNREAD DOT
                ================================================== */}

                {!item.read && (
                  <View
                    style={
                      styles.unreadDot
                    }
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ========================================================
          NOTIFICATION MODAL
      ======================================================== */}

      <NotificationsModal
        visible={modalVisible}
        notification={modalData}
        onClose={handleCloseModal}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ==========================================================
  // TOP BAR
  // ==========================================================

  topBar: {
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 10,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pillActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },

  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  pillTextActive: {
    color: colors.white,
  },

  pillBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: withOpacity(
      colors.primaryDark,
      0.15,
    ),
    alignItems: "center",
    justifyContent: "center",
  },

  pillBadgeActive: {
    backgroundColor:
      "rgba(255,255,255,0.3)",
  },

  pillBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },

  pillBadgeTextInactive: {
    color: colors.primaryDark,
  },

  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 22,
    paddingTop: 2,
  },

  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryDark,
  },

  markAllTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.6,
  },

  // ==========================================================
  // SECTION HEADER
  // ==========================================================

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 10,
  },

  sectionChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: withOpacity(
      colors.primaryDark,
      0.1,
    ),
  },

  sectionChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // ==========================================================
  // LIST
  // ==========================================================

  listContent: {
    paddingBottom: 40,
  },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  itemUnread: {
    backgroundColor: withOpacity(
      colors.primaryDark,
      0.045,
    ),
    borderColor: withOpacity(
      colors.primaryDark,
      0.18,
    ),
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  itemBody: {
    flex: 1,
    minWidth: 0,
  },

  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginRight: 8,
  },

  itemTitleUnread: {
    fontWeight: "700",
  },

  itemTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  itemMessage: {
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark,
    marginLeft: 8,
    marginTop: 6,
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
