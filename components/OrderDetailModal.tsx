import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  getSingleOrderDetail,
  OrderDetailLineItem,
  RiderOrder,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  if (method.toLowerCase().includes("ibft")) {
    return colors.accentOrangeDark;
  }

  return colors.primaryLight;
}

/**
 * Converts IBFT payment details into a clean user-facing label.
 *
 * Example:
 * "IBFT - Meezan Bank - IBAN PK..."
 * becomes:
 * "Bank Transfer"
 */
function paymentDisplayName(method: string) {
  if (method.toLowerCase().includes("ibft")) {
    return "Bank Transfer";
  }

  return method;
}

type Props = {
  visible: boolean;
  order: RiderOrder | null;
  onClose: () => void;
};

export default function OrderDetailModal({ visible, order, onClose }: Props) {
  const [items, setItems] = useState<OrderDetailLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bottom-sheet animation
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const loadDetail = async (orderNo: number) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const data = await getSingleOrderDetail(orderNo);

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log("[ORDER DETAIL MODAL] Failed to load order detail:", e);

      setErrorMsg(e?.message || "Failed to load order items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || !order) {
      return;
    }

    // Reset animation
    translateY.setValue(400);
    backdropOpacity.setValue(0);

    // Load order details
    loadDetail(order.orderNo);

    // Animate modal from bottom
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, order?.orderNo]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  if (!order) {
    return null;
  }

  const statusColorValue = statusColor(order.orderStatus);
  const paymentColorValue = paymentColor(order.paymentMethod);

  // Clean payment label for the UI.
  // IBFT details such as IBAN/account name will never be displayed.
  const paymentDisplayValue = paymentDisplayName(order.paymentMethod);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Order No. {order.orderNo}</Text>

              <Text style={styles.subtitle} numberOfLines={1}>
                {order.customerName}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              hitSlop={{
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
              }}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Status + Payment */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: statusColorValue + "1A",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: statusColorValue,
                  },
                ]}
              >
                {order.orderStatus}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: paymentColorValue + "1A",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: paymentColorValue,
                  },
                ]}
              >
                {paymentDisplayValue}
              </Text>
            </View>
          </View>

          {/* Delivery Information */}
          <View style={styles.infoBlock}>
            <InfoRow icon="location-outline" text={order.deliveryAddress} />

            <InfoRow icon="call-outline" text={order.deliveryContact} />

            {order.deliveryInstruction && order.deliveryInstruction !== "-" && (
              <InfoRow
                icon="document-text-outline"
                text={order.deliveryInstruction}
              />
            )}
          </View>

          {/* Items Header */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Items</Text>

            {!loading && !errorMsg && items.length > 0 && (
              <Text style={styles.itemCount}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primaryDark} />

              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          )}

          {/* Error */}
          {!loading && errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.danger}
              />

              <Text style={styles.errorText}>{errorMsg}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.retryButton}
                onPress={() => loadDetail(order.orderNo)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scrollable Items Area */}
          {!loading && !errorMsg && (
            <View style={styles.itemsContainer}>
              <ScrollView
                style={styles.itemsScroll}
                contentContainerStyle={styles.itemsContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                bounces
                keyboardShouldPersistTaps="handled"
              >
                {items.length === 0 ? (
                  <Text style={styles.emptyText}>No item details found.</Text>
                ) : (
                  items.map((line, index) => {
                    const quantity = Number(line.quantity) || 0;
                    const salePrice = Number(line.salePrice) || 0;
                    const discount = Number(line.discInR) || 0;

                    const lineTotal = quantity * salePrice - discount;

                    return (
                      <View
                        key={`${line.productID}-${index}`}
                        style={styles.itemRow}
                      >
                        {/* Item Content */}
                        <View style={styles.itemInfo}>
                          {/* Product Name */}
                          <Text
                            style={styles.itemTitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {line.productTitle}
                          </Text>

                          {/* Quantity x Price */}
                          <View style={styles.itemMetaRow}>
                            <Text style={styles.itemMeta}>
                              {quantity} x {salePrice.toLocaleString()}
                            </Text>

                            {/* Calculated Line Total */}
                            <View style={styles.itemTotalContainer}>
                              <Text style={styles.itemTotal}>
                                {lineTotal.toLocaleString()}
                              </Text>
                            </View>
                          </View>

                          {/* Discount */}
                          {discount > 0 && (
                            <Text style={styles.discountText}>
                              Discount: -Rs. {discount.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Order Total</Text>

              <Text style={styles.footerValue}>
                Rs. {Number(order.orderTotal).toLocaleString()}
              </Text>
            </View>

            {Number(order.orderDiscount) > 0 && (
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Discount</Text>

                <Text
                  style={[
                    styles.footerValue,
                    {
                      color: colors.danger,
                    },
                  ]}
                >
                  -Rs. {Number(order.orderDiscount).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerLabelBold}>Net Total</Text>

              <Text style={styles.footerValueBold}>
                Rs. {Number(order.netTotal).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />

      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    maxHeight: "85%",
    overflow: "hidden",
  },

  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },

  headerTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },

  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },

  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
  },

  badgeText: {
    ...typography.caption,
    fontWeight: "600",
  },

  infoBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },

  infoText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },

  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  itemCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  centerBox: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  errorBox: {
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

  itemsContainer: {
    height: 260,
    minHeight: 0,
  },

  itemsScroll: {
    flex: 1,
  },

  itemsContent: {
    paddingBottom: spacing.xs,
  },

  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },

  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 5,
  },

  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    flexShrink: 0,
  },

  itemTotalContainer: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },

  itemTotal: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primaryDark,
  },

  discountText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 2,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  footerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  footerValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  footerLabelBold: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  footerValueBold: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primaryDark,
  },
});
