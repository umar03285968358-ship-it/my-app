import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
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
import OrderRatingModal, {
  OrderRatingSubmission,
} from "../../components/Orderratingmodal";

import {
  changeOrderStatus,
  getMobOrders,
  MobOrder,
  rateOrder,
} from "../../services/api";

import { getUser } from "../../services/authStorage";

type PresetKey =
  | "all"
  | "7d"
  | "30d"
  | "custom";

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

const STATUS_DOT_COLORS: Record<
  StatusKey,
  string
> = {
  All: "#FFFFFF",
  Pending: "#B26A00",
  Processing: "#0B5FFF",
  Dispatched: "#7B4FE0",
  Delivered: "#1B8A3E",
  Cancelled: "#C62828",
};

const CANCELLABLE_STATUSES: StatusKey[] = [
  "Pending",
  "Processing",
];

const RATABLE_STATUSES: StatusKey[] = [
  "Delivered",
];

function isCancellable(status: string) {
  return CANCELLABLE_STATUSES.includes(
    status as StatusKey,
  );
}

function isRatable(status: string) {
  return RATABLE_STATUSES.includes(
    status as StatusKey,
  );
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

  d.setDate(
    d.getDate() - n,
  );

  return startOfDay(d);
}

function formatShort(d: Date) {
  return d.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

const DATE_PRESETS: {
  key: PresetKey;
  label: string;
}[] = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "7d",
    label: "Last 7 days",
  },
  {
    key: "30d",
    label: "Last 30 days",
  },
  {
    key: "custom",
    label: "Custom",
  },
];

export default function OrdersScreen() {
  const [allOrders, setAllOrders] =
    useState<MobOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [preset, setPreset] =
    useState<PresetKey>("all");

  const [customFrom, setCustomFrom] =
    useState<Date>(
      daysAgo(30),
    );

  const [customTo, setCustomTo] =
    useState<Date>(
      new Date(),
    );

  const [pickerOpen, setPickerOpen] =
    useState<
      "from" | "to" | null
    >(null);

  const [statusFilter, setStatusFilter] =
    useState<StatusKey>("All");

  // Detail bottom-sheet
  const [detailOrder, setDetailOrder] =
    useState<MobOrder | null>(null);

  const [detailVisible, setDetailVisible] =
    useState(false);

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] =
    useState<MobOrder | null>(null);

  const [cancelVisible, setCancelVisible] =
    useState(false);

  // Rating flow
  const [ratingTarget, setRatingTarget] =
    useState<MobOrder | null>(null);

  const [ratingVisible, setRatingVisible] =
    useState(false);

  /*
   * Local record of ratings submitted
   * during this app session.
   *
   * Backend rating is also checked below,
   * so this is not the only source of truth.
   */
  const [ratedOrderNos, setRatedOrderNos] =
    useState<
      Record<
        string,
        OrderRatingSubmission
      >
    >({});

  // Needed for ChangeOrderStatus
  const [mobUserID, setMobUserID] =
    useState<number | null>(null);

  const resolveRange = useCallback(
    (): {
      from: Date;
      to: Date;
    } | null => {
      switch (preset) {
        case "all":
          return null;

        case "7d":
          return {
            from: daysAgo(7),
            to: endOfDay(
              new Date(),
            ),
          };

        case "30d":
          return {
            from: daysAgo(30),
            to: endOfDay(
              new Date(),
            ),
          };

        case "custom":
          return {
            from: startOfDay(
              customFrom,
            ),
            to: endOfDay(
              customTo,
            ),
          };

        default:
          return null;
      }
    },
    [
      preset,
      customFrom,
      customTo,
    ],
  );

  const loadOrders = useCallback(
    async (
      isRefresh = false,
    ) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        console.log(
          "[ORDERS] Loading orders...",
        );

        const user =
          await getUser();

        console.log(
          "[ORDERS] Logged in user:",
          user,
        );

        const userID =
          user?.mobUserID ??
          user?.MobUserID ??
          user?.mobUserId ??
          user?.MobUserId ??
          user?.id;

        console.log(
          "[ORDERS] MobUserID:",
          userID,
        );

        if (
          userID === undefined ||
          userID === null ||
          String(userID).trim() === ""
        ) {
          setError(
            "You need to be signed in to view your orders.",
          );

          setAllOrders([]);

          return;
        }

        const numericUserID =
          Number(userID);

        if (
          !Number.isFinite(
            numericUserID,
          ) ||
          numericUserID <= 0
        ) {
          setError(
            "Invalid user ID. Please login again.",
          );

          setAllOrders([]);

          return;
        }

        setMobUserID(
          numericUserID,
        );

        const range =
          resolveRange();

        console.log(
          "[ORDERS] Calling getMobOrders...",
        );

        const result = range
          ? await getMobOrders(
              numericUserID,
              toApiDate(
                range.from,
              ),
              toApiDate(
                range.to,
              ),
              "All",
            )
          : await getMobOrders(
              numericUserID,
              null,
              null,
              "All",
            );

        console.log(
          "[ORDERS] getMobOrders response:",
          result,
        );

        const safeResult =
          Array.isArray(result)
            ? result
            : [];

        /*
         * Client-side date safety.
         */
        const filtered = range
          ? safeResult.filter(
              (o) => {
                const t =
                  new Date(
                    o.orderDate,
                  ).getTime();

                return (
                  t >=
                    range.from.getTime() &&
                  t <=
                    range.to.getTime()
                );
              },
            )
          : safeResult;

        filtered.sort(
          (a, b) =>
            new Date(
              b.orderDate,
            ).getTime() -
            new Date(
              a.orderDate,
            ).getTime(),
        );

        setAllOrders(
          filtered,
        );

        /*
         * IMPORTANT:
         *
         * Read existing backend ratings.
         *
         * If the API already returns ratingStar,
         * we immediately mark that order as rated
         * locally as well.
         */
        setRatedOrderNos(
          (previous) => {
            const next = {
              ...previous,
            };

            filtered.forEach(
              (order) => {
                const rawRating =
                  (order as any)
                    ?.ratingStar ??
                  (order as any)
                    ?.RatingStar ??
                  (order as any)
                    ?.orderRatingStar ??
                  (order as any)
                    ?.OrderRatingStar ??
                  0;

                const rating =
                  Number(
                    rawRating,
                  );

                if (
                  Number.isFinite(
                    rating,
                  ) &&
                  rating > 0
                ) {
                  const rawRemarks =
                    (order as any)
                      ?.ratingRemarks ??
                    (order as any)
                      ?.RatingRemarks ??
                    (order as any)
                      ?.orderRatingRemarks ??
                    (order as any)
                      ?.OrderRatingRemarks ??
                    "";

                  next[
                    String(
                      order.orderNo,
                    )
                  ] = {
                    orderNo:
                      order.orderNo,
                    stars: rating,
                    remarks:
                      String(
                        rawRemarks ??
                          "",
                      ),
                  };
                }
              },
            );

            return next;
          },
        );

        console.log(
          "[ORDERS] Orders loaded:",
          filtered.length,
        );
      } catch (e: any) {
        console.log(
          "[ORDERS] Failed to load:",
          e,
        );

        setError(
          e?.message ??
            "Couldn't load your orders. Pull down to retry.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveRange],
  );

  useFocusEffect(
    useCallback(() => {
      console.log(
        "[ORDERS] Orders page focused - calling API",
      );

      loadOrders();

      return undefined;
    }, [loadOrders]),
  );

  /*
   * Status filtering.
   */
  const visibleOrders =
    useMemo(() => {
      if (
        statusFilter ===
        "All"
      ) {
        return allOrders;
      }

      return allOrders.filter(
        (o) =>
          o.orderStatus ===
          statusFilter,
      );
    }, [
      allOrders,
      statusFilter,
    ]);

  const onDateChange = (
    which:
      | "from"
      | "to",
    event: any,
    selected?: Date,
  ) => {
    setPickerOpen(null);

    if (!selected) {
      return;
    }

    if (
      which === "from"
    ) {
      setCustomFrom(
        selected,
      );
    } else {
      setCustomTo(
        selected,
      );
    }
  };

  // =========================================================
  // DETAIL
  // =========================================================

  const handleOpenDetail = (
    order: MobOrder,
  ) => {
    setDetailOrder(order);
    setDetailVisible(true);
  };

  const handleCloseDetail =
    () => {
      setDetailVisible(false);
      setDetailOrder(null);
    };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleRequestCancel =
    (order: MobOrder) => {
      if (
        !isCancellable(
          order.orderStatus,
        )
      ) {
        return;
      }

      setCancelTarget(order);
      setCancelVisible(true);
    };

  const handleCloseCancel =
    () => {
      setCancelVisible(false);
      setCancelTarget(null);
    };

  const handleConfirmCancel =
    async () => {
      if (
        !cancelTarget ||
        !mobUserID
      ) {
        return;
      }

      try {
        await changeOrderStatus(
          {
            orderNo:
              cancelTarget.orderNo,
            riderID: 0,
            orderStatus:
              "Cancelled",
            remarks:
              "Cancelled by customer",
            userID:
              mobUserID,
          },
        );

        setAllOrders(
          (prev) =>
            prev.map(
              (o) =>
                o.orderNo ===
                cancelTarget.orderNo
                  ? {
                      ...o,
                      orderStatus:
                        "Cancelled",
                    }
                  : o,
            ),
        );

        setCancelVisible(
          false,
        );

        setCancelTarget(
          null,
        );
      } catch (e: any) {
        console.log(
          "[ORDERS] Cancel failed:",
          e,
        );
      }
    };

  // =========================================================
  // RATING
  // =========================================================

  const getOrderRating = (
    order: MobOrder | null,
  ): number | null => {
    if (!order) {
      return null;
    }

    const rawRating =
      (order as any)
        ?.ratingStar ??
      (order as any)
        ?.RatingStar ??
      (order as any)
        ?.orderRatingStar ??
      (order as any)
        ?.OrderRatingStar ??
      0;

    const rating =
      Number(rawRating);

    if (
      !Number.isFinite(
        rating,
      ) ||
      rating <= 0
    ) {
      return null;
    }

    return Math.min(
      5,
      Math.max(
        1,
        rating,
      ),
    );
  };

  const getOrderRemarks = (
    order: MobOrder | null,
  ): string => {
    if (!order) {
      return "";
    }

    const remarks =
      (order as any)
        ?.ratingRemarks ??
      (order as any)
        ?.RatingRemarks ??
      (order as any)
        ?.orderRatingRemarks ??
      (order as any)
        ?.OrderRatingRemarks ??
      "";

    return String(
      remarks ?? "",
    ).trim();
  };

  const handleRequestRating =
    (order: MobOrder) => {
      if (
        !isRatable(
          order.orderStatus,
        )
      ) {
        console.log(
          "[RATING] Order is not ratable:",
          order.orderStatus,
        );

        return;
      }

      console.log(
        "====================================",
      );

      console.log(
        "[RATING] Opening rating modal",
      );

      console.log(
        "[RATING] Order No:",
        order.orderNo,
      );

      console.log(
        "[RATING] Existing Rating:",
        getOrderRating(
          order,
        ),
      );

      console.log(
        "[RATING] Existing Remarks:",
        getOrderRemarks(
          order,
        ),
      );

      console.log(
        "====================================",
      );

      setRatingTarget(
        order,
      );

      setRatingVisible(
        true,
      );
    };

  const handleCloseRating =
    () => {
      if (ratingVisible) {
        console.log(
          "[RATING] Rating modal closed",
        );
      }

      setRatingVisible(
        false,
      );

      setRatingTarget(
        null,
      );
    };

  /*
   * REAL ORDER RATING SUBMISSION.
   *
   * No fake API.
   */
  const handleRatingSubmitted =
    async (
      submission: OrderRatingSubmission,
    ) => {
      console.log(
        "====================================",
      );

      console.log(
        "[RATING] Submission received from modal",
      );

      console.log(
        "[RATING] Order No:",
        submission.orderNo,
      );

      console.log(
        "[RATING] Stars:",
        submission.stars,
      );

      console.log(
        "[RATING] Remarks:",
        submission.remarks,
      );

      console.log(
        "[RATING] Calling rateOrder API...",
      );

      console.log(
        "====================================",
      );

      /*
       * Validate stars.
       */
      if (
        submission.stars < 1 ||
        submission.stars > 5
      ) {
        throw new Error(
          "Rating must be between 1 and 5 stars.",
        );
      }

      try {
        const response =
          await rateOrder({
            orderNo:
              Number(
                submission.orderNo,
              ),
            ratingStar:
              Number(
                submission.stars,
              ),
            ratingRemarks:
              submission.remarks.trim(),
          });

        console.log(
          "====================================",
        );

        console.log(
          "[RATING] API CALL SUCCESS",
        );

        console.log(
          "[RATING] API Response:",
          response,
        );

        console.log(
          "====================================",
        );

        /*
         * Only update local rated state
         * AFTER API succeeds.
         */
        setRatedOrderNos(
          (prev) => ({
            ...prev,
            [String(
              submission.orderNo,
            )]: {
              ...submission,
              stars: Number(
                submission.stars,
              ),
              remarks:
                submission.remarks.trim(),
            },
          }),
        );

        /*
         * Immediately update the visible order
         * so UI changes without waiting for API.
         */
        setAllOrders(
          (prev) =>
            prev.map(
              (order) => {
                if (
                  String(
                    order.orderNo,
                  ) !==
                  String(
                    submission.orderNo,
                  )
                ) {
                  return order;
                }

                return {
                  ...order,

                  /*
                   * These fields may not exist in
                   * the current MobOrder TypeScript
                   * definition, therefore any is used
                   * only for these backend rating fields.
                   */
                  ...( {
                    ratingStar:
                      Number(
                        submission.stars,
                      ),
                    ratingRemarks:
                      submission.remarks.trim(),
                  } as any ),
                };
              },
            ),
        );

        /*
         * Close current modal.
         */
        setRatingVisible(
          false,
        );

        setRatingTarget(
          null,
        );

        /*
         * IMPORTANT:
         *
         * Fetch again so the backend becomes
         * the final source of truth.
         */
        try {
          await loadOrders(
            true,
          );
        } catch (refreshError) {
          console.log(
            "[RATING] Refresh after rating failed:",
            refreshError,
          );
        }
      } catch (error: any) {
        console.log(
          "====================================",
        );

        console.log(
          "[RATING] API CALL FAILED",
        );

        console.log(
          "[RATING] Error:",
          error,
        );

        console.log(
          "[RATING] Error message:",
          error?.message,
        );

        console.log(
          "====================================",
        );

        /*
         * Re-throw so OrderRatingModal
         * displays the error and does NOT
         * close the modal.
         */
        throw error;
      }
    };

  /*
   * Existing rating for currently selected order.
   */
  const selectedOrderRating =
    getOrderRating(
      ratingTarget,
    );

  /*
   * Existing remarks for currently
   * selected order.
   */
  const selectedOrderRemarks =
    getOrderRemarks(
      ratingTarget,
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["bottom"]}
    >
      {/* TOP DATE FILTERS */}

      <View
        style={
          styles.dateFilterContainer
        }
      >
        <View
          style={styles.chipRow}
        >
          {DATE_PRESETS.map(
            (p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.chip,
                  preset ===
                    p.key &&
                    styles.chipActive,
                ]}
                onPress={() =>
                  setPreset(
                    p.key,
                  )
                }
              >
                <Text
                  style={[
                    styles.chipLabel,
                    preset ===
                      p.key &&
                      styles.chipLabelActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {preset ===
          "custom" && (
          <View
            style={
              styles.customRow
            }
          >
            <TouchableOpacity
              style={
                styles.dateField
              }
              onPress={() =>
                setPickerOpen(
                  "from",
                )
              }
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#6B6B6B"
              />

              <Text
                style={
                  styles.dateFieldText
                }
              >
                {formatShort(
                  customFrom,
                )}
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.dateSeparator
              }
            >
              to
            </Text>

            <TouchableOpacity
              style={
                styles.dateField
              }
              onPress={() =>
                setPickerOpen(
                  "to",
                )
              }
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#6B6B6B"
              />

              <Text
                style={
                  styles.dateFieldText
                }
              >
                {formatShort(
                  customTo,
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.applyButton
              }
              onPress={() =>
                loadOrders()
              }
            >
              <Text
                style={
                  styles.applyButtonText
                }
              >
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {pickerOpen && (
          <DateTimePicker
            value={
              pickerOpen ===
              "from"
                ? customFrom
                : customTo
            }
            mode="date"
            display={
              Platform.OS ===
              "ios"
                ? "inline"
                : "default"
            }
            maximumDate={
              new Date()
            }
            onChange={(
              event,
              selected,
            ) =>
              onDateChange(
                pickerOpen,
                event,
                selected,
              )
            }
          />
        )}
      </View>

      {/* CONTENT */}

      {loading ? (
        <View
          style={
            styles.centerFill
          }
        >
          <ActivityIndicator
            size="large"
            color="#1A1A1A"
          />
        </View>
      ) : error ? (
        <View
          style={
            styles.centerFill
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color="#C62828"
          />

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={() =>
              loadOrders()
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : visibleOrders.length ===
        0 ? (
        <View
          style={
            styles.centerFill
          }
        >
          <Ionicons
            name="receipt-outline"
            size={44}
            color="#C7C7C7"
          />

          <Text
            style={
              styles.emptyText
            }
          >
            No orders match this
            filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            visibleOrders
          }
          keyExtractor={(
            item,
          ) =>
            String(
              item.orderNo,
            )
          }
          contentContainerStyle={
            styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                loadOrders(
                  true,
                )
              }
            />
          }
          renderItem={({
            item,
          }) => {
            /*
             * Backend rating.
             */
            const backendRating =
              getOrderRating(
                item,
              );

            /*
             * Session rating.
             */
            const sessionRating =
              ratedOrderNos[
                String(
                  item.orderNo,
                )
              ];

            /*
             * Order is considered rated
             * if backend already has a rating
             * OR we successfully submitted one
             * during this session.
             */
            const hasRating =
              backendRating !==
                null ||
              !!sessionRating;

            return (
              <OrderCard
                order={item}
                onPress={() =>
                  handleOpenDetail(
                    item,
                  )
                }
                cancellable={isCancellable(
                  item.orderStatus,
                )}
                onCancelPress={() =>
                  handleRequestCancel(
                    item,
                  )
                }
                ratable={isRatable(
                  item.orderStatus,
                )}
                rated={
                  hasRating
                }
                onRatePress={() =>
                  handleRequestRating(
                    item,
                  )
                }
              />
            );
          }}
        />
      )}

      {/* BOTTOM STATUS FILTER */}

      <View
        style={
          styles.statusBar
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.statusScrollContent
          }
        >
          {STATUS_OPTIONS.map(
            (s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  statusFilter ===
                    s &&
                    styles.statusChipActive,
                ]}
                onPress={() =>
                  setStatusFilter(
                    s,
                  )
                }
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        STATUS_DOT_COLORS[
                          s
                        ],
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusChipLabel,
                    statusFilter ===
                      s &&
                      styles.statusChipLabelActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/* DETAIL MODAL */}

      <CustomerOrderDetailModal
        visible={
          detailVisible
        }
        order={
          detailOrder
        }
        onClose={
          handleCloseDetail
        }
      />

      {/* CANCEL MODAL */}

      <CancelOrderModal
        visible={
          cancelVisible
        }
        orderNo={
          cancelTarget?.orderNo ??
          null
        }
        onClose={
          handleCloseCancel
        }
        onConfirm={
          handleConfirmCancel
        }
      />

      {/* RATING MODAL */}

      <OrderRatingModal
        visible={
          ratingVisible
        }
        orderNo={
          ratingTarget?.orderNo ??
          null
        }
        existingRating={
          selectedOrderRating
        }
        existingRemarks={
          selectedOrderRemarks
        }
        onClose={
          handleCloseRating
        }
        onSubmitted={
          handleRatingSubmitted
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
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

  dateFilterContainer: {
    backgroundColor:
      colors.background,
    borderBottomWidth: 1,
    borderBottomColor:
      "#E2E2E4",
    paddingBottom: 12,
  },

  chipRow: {
    flexDirection:
      "row",
    flexWrap:
      "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor:
      "#EDEDEF",
  },

  chipActive: {
    backgroundColor:
      "#1A1A1A",
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
    flexDirection:
      "row",
    alignItems:
      "center",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },

  dateField: {
    flexDirection:
      "row",
    alignItems:
      "center",
    gap: 6,
    borderWidth: 1,
    borderColor:
      "#E2E2E4",
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
    marginLeft:
      "auto",
    backgroundColor:
      "#1A1A1A",
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
    justifyContent:
      "center",
    alignItems:
      "center",
    paddingHorizontal: 32,
  },

  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B6B6B",
    textAlign:
      "center",
  },

  retryButton: {
    marginTop: 16,
    backgroundColor:
      "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#fff",
    fontWeight:
      "600",
    fontSize: 13,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8A8A8A",
  },

  statusBar: {
    position:
      "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor:
      "#E2E2E4",
    backgroundColor:
      colors.background,
    paddingTop: 10,
    paddingBottom: 10,
  },

  statusScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection:
      "row",
  },

  statusChip: {
    flexDirection:
      "row",
    alignItems:
      "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor:
      "#F2F2F4",
  },

  statusChipActive: {
    backgroundColor:
      "#1A1A1A",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusChipLabel: {
    fontSize: 12,
    fontWeight:
      "600",
    color: "#4A4A4A",
  },

  statusChipLabelActive: {
    color: "#fff",
  },
});