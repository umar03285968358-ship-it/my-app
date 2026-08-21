import { colors, radius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getSingleOrderDetail,
  MobOrder,
  OrderDetailLineItem,
} from "../services/api";
import { formatRs } from "../utils/currency";

const ORANGE = "#F1731F";
const ORANGE_LIGHT = "#FFF1E7";
const ORANGE_SOFT = "#FFF8F3";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending: {
    bg: "#FFF4E5",
    text: "#B26A00",
  },
  Processing: {
    bg: "#E5F1FF",
    text: "#0B5FFF",
  },
  Dispatched: {
    bg: "#F1EBFF",
    text: "#7B4FE0",
  },
  Delivered: {
    bg: "#E6F7EC",
    text: "#1B8A3E",
  },
  Cancelled: {
    bg: "#FDEAEA",
    text: "#C62828",
  },
};

function formatOrderDate(iso?: string | null): string {
  if (!iso) return "-";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return (
    date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/**
 * Formats item-level prices WITHOUT "Rs".
 *
 * Example:
 * 1100 -> 1,100
 * 1500 -> 1,500
 */
function formatItemPrice(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Gets payment display text.
 *
 * For IBFT payments, bank/account information is stored
 * inside deliveryInstruction.
 */
function derivePaymentType(order: MobOrder): string {
  let paymentType = order.paymentMethod || "-";

  if (order.paymentMethod?.toUpperCase() === "IBFT") {
    const instruction = order.deliveryInstruction || "";

    const bankMatch = instruction.match(/Bank:\s*([^|]+)/i);
    const titleMatch = instruction.match(/Account Title:\s*([^|]+)/i);

    const bank = bankMatch?.[1]?.trim() || "";
    const title = titleMatch?.[1]?.trim() || "";

    if (bank && title) {
      paymentType = `${bank} · ${title}`;
    } else if (bank) {
      paymentType = bank;
    } else if (title) {
      paymentType = title;
    }
  }

  return paymentType;
}

/**
 * Removes IBFT bank information from the normal delivery note.
 */
function deriveNote(order: MobOrder): string {
  let note = order.deliveryInstruction || "";

  if (order.paymentMethod?.toUpperCase() === "IBFT") {
    note = note
      .split("|")
      .map((part) => part.trim())
      .filter((part) => {
        const lowerPart = part.toLowerCase();

        return (
          !lowerPart.startsWith("bank:") &&
          !lowerPart.startsWith("account title:") &&
          !lowerPart.startsWith("account no:") &&
          !lowerPart.startsWith("iban:")
        );
      })
      .join(" | ")
      .trim();
  }

  return note;
}

type Props = {
  visible: boolean;
  order: MobOrder | null;
  onClose: () => void;
};

export default function CustomerOrderDetailModal({
  visible,
  order,
  onClose,
}: Props) {
  const [items, setItems] = useState<OrderDetailLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  // ===============================================================
  // LOAD ORDER DETAILS
  // ===============================================================

  useEffect(() => {
    if (!visible || !order) {
      return;
    }

    let cancelled = false;

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setItems([]);

        const result = await getSingleOrderDetail(order.orderNo);

        if (!cancelled) {
          setItems(Array.isArray(result) ? result : []);
        }
      } catch (e: unknown) {
        console.log("[ORDER DETAIL MODAL] Failed to load order detail:", e);

        if (!cancelled) {
          const message =
            e instanceof Error
              ? e.message
              : "Couldn't load order items. Please try again.";

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [visible, order?.orderNo]);

  // ===============================================================
  // CLOSE
  // ===============================================================

  const handleClose = () => {
    setReceiptVisible(false);
    setItems([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  // ===============================================================
  // RETRY
  // ===============================================================

  const retryLoad = async () => {
    if (!order) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getSingleOrderDetail(order.orderNo);

      setItems(Array.isArray(result) ? result : []);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Couldn't load order items. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return null;
  }

  // ===============================================================
  // DERIVED DATA
  // ===============================================================

  const statusStyle = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Pending;

  const paymentType = derivePaymentType(order);
  const note = deriveNote(order);

  const itemsSubtotal = items.reduce((sum, item) => {
    const price = Number(item.salePrice) || 0;
    const quantity = Number(item.quantity) || 0;

    return sum + price * quantity;
  }, 0);

  // ===============================================================
  // RENDER
  // ===============================================================

  return (
    <>
      {/* ========================================================= */}
      {/* MAIN ORDER DETAIL MODAL */}
      {/* ========================================================= */}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleClose}
          />

          <View style={styles.sheet}>
            {/* Orange accent */}
            <View style={styles.topAccent} />

            {/* Grabber */}
            <View style={styles.grabber} />

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <View style={styles.orderTitleRow}>
                  <View style={styles.orderIcon}>
                    <Ionicons name="receipt-outline" size={18} color={ORANGE} />
                  </View>

                  <View style={styles.orderTitleContent}>
                    <Text style={styles.orderId}>Order #{order.orderNo}</Text>

                    <Text style={styles.date}>
                      {formatOrderDate(order.orderDate)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRightGroup}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: statusStyle.bg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: statusStyle.text,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: statusStyle.text,
                      },
                    ]}
                  >
                    {order.orderStatus || "Pending"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{
                    top: 8,
                    bottom: 8,
                    left: 8,
                    right: 8,
                  }}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ================================================= */}
            {/* CONTENT */}
            {/* ================================================= */}

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ================================================= */}
              {/* ORDER INFORMATION */}
              {/* ================================================= */}

              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color={ORANGE}
                    />
                  </View>

                  <Text style={styles.sectionTitle}>Order Information</Text>
                </View>

                <View style={styles.infoDivider} />

                {/* Delivery */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Ionicons
                      name="bicycle-outline"
                      size={16}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.summaryLabel}>Delivery</Text>
                  </View>

                  <Text style={styles.summaryValue}>
                    {order.deliveryType || "-"}
                  </Text>
                </View>

                {/* Address */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.summaryLabel}>Address</Text>
                  </View>

                  <Text style={styles.summaryValue}>
                    {order.deliveryAddress || "-"}
                  </Text>
                </View>

                {/* Contact */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.summaryLabel}>Contact</Text>
                  </View>

                  <Text style={styles.summaryValue}>
                    {order.deliveryContact || "-"}
                  </Text>
                </View>

                {/* Payment */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Ionicons
                      name="card-outline"
                      size={16}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.summaryLabel}>Payment</Text>
                  </View>

                  <Text style={styles.summaryValue}>{paymentType}</Text>
                </View>

                {/* Rider */}
                {order.riderName && (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLeft}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={colors.textSecondary}
                      />

                      <Text style={styles.summaryLabel}>Rider</Text>
                    </View>

                    <Text style={styles.summaryValue}>
                      {order.riderName}
                      {order.riderMobileNo ? ` · ${order.riderMobileNo}` : ""}
                    </Text>
                  </View>
                )}

                {/* Status date */}
                {order.deliveredOn && (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLeft}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textSecondary}
                      />

                      <Text style={styles.summaryLabel}>
                        {order.orderStatus || "Status"}
                      </Text>
                    </View>

                    <Text style={styles.summaryValue}>
                      {formatOrderDate(order.deliveredOn)}
                    </Text>
                  </View>
                )}
              </View>

              {/* ================================================= */}
              {/* DELIVERY NOTE */}
              {/* ================================================= */}

              {note.trim() !== "" && note.trim() !== "-" && (
                <View style={styles.noteCard}>
                  <View style={styles.noteIcon}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={17}
                      color={ORANGE}
                    />
                  </View>

                  <View style={styles.noteContent}>
                    <Text style={styles.noteLabel}>Delivery Note</Text>

                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* PAYMENT RECEIPT */}
              {/* ================================================= */}

              {order.paymentReceiptDoc ? (
                <TouchableOpacity
                  style={styles.receiptButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setImgLoading(true);
                    setReceiptVisible(true);
                  }}
                >
                  <View style={styles.receiptIcon}>
                    <Ionicons name="image-outline" size={18} color={ORANGE} />
                  </View>

                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptTitle}>Payment Receipt</Text>

                    <Text style={styles.receiptSubtitle}>
                      Tap to view uploaded receipt
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}

              {/* ================================================= */}
              {/* ORDER ITEMS */}
              {/* ================================================= */}

              <View style={styles.itemsSection}>
                <View style={styles.itemsHeaderRow}>
                  <View>
                    <Text style={styles.itemsHeader}>Order Items</Text>

                    {!loading && items.length > 0 && (
                      <Text style={styles.itemsCount}>
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </Text>
                    )}
                  </View>

                  {loading ? (
                    <ActivityIndicator size="small" color={ORANGE} />
                  ) : null}
                </View>

                {/* Error */}
                {error ? (
                  <View style={styles.errorBox}>
                    <View style={styles.errorIcon}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={22}
                        color={colors.danger}
                      />
                    </View>

                    <Text style={styles.errorText}>{error}</Text>

                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={retryLoad}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={14} color={colors.white} />

                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : loading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={ORANGE} />

                    <Text style={styles.loadingText}>Loading items...</Text>
                  </View>
                ) : items.length === 0 ? (
                  <View style={styles.emptyItemsBox}>
                    <Ionicons
                      name="bag-outline"
                      size={28}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.emptyItemsText}>
                      No item details available.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.itemsCard}>
                    {items.map((item, index) => {
                      const price = Number(item.salePrice) || 0;

                      const quantity = Number(item.quantity) || 0;

                      const itemTotal = price * quantity;

                      return (
                        <View
                          key={`${item.productID}-${item.orderNo}-${index}`}
                          style={[
                            styles.itemRow,
                            index === items.length - 1 && styles.itemRowLast,
                          ]}
                        >
                          {/* Item number */}
                          <View style={styles.itemNumber}>
                            <Text style={styles.itemNumberText}>
                              {index + 1}
                            </Text>
                          </View>

                          {/* Product */}
                          <View style={styles.itemLeft}>
                            <Text style={styles.itemTitle} numberOfLines={2}>
                              {item.productTitle || "Product"}
                            </Text>

                            <View style={styles.itemMetaRow}>
                              <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>
                                  Qty {quantity}
                                </Text>
                              </View>

                              <Text style={styles.multiplyText}>×</Text>

                              {/* NO Rs HERE */}
                              <Text style={styles.itemPrice}>
                                {formatItemPrice(price)}
                              </Text>
                            </View>
                          </View>

                          {/* NO Rs HERE */}
                          <Text style={styles.itemTotal}>
                            {formatItemPrice(itemTotal)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* ================================================= */}
              {/* TOTALS */}
              {/* ================================================= */}

              <View style={styles.totalsCard}>
                {items.length > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Items Subtotal</Text>

                    {/* Rs ONLY HERE */}
                    <Text style={styles.totalsValue}>
                      {formatRs(itemsSubtotal)}
                    </Text>
                  </View>
                )}

                {(Number(order.orderDiscount) || 0) > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Discount</Text>

                    <Text style={[styles.totalsValue, styles.discountValue]}>
                      -{formatItemPrice(Number(order.orderDiscount) || 0)}
                    </Text>
                  </View>
                )}

                <View style={styles.totalDivider} />

                <View style={styles.grandTotalRow}>
                  <View>
                    <Text style={styles.grandTotalLabel}>Net Total</Text>

                    <Text style={styles.grandTotalSubtext}>
                      Final payable amount
                    </Text>
                  </View>

                  {/* Rs ONLY HERE */}
                  <Text style={styles.grandTotalValue}>
                    {formatRs(Number(order.netTotal) || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomSpace} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* PAYMENT RECEIPT VIEWER */}
      {/* ========================================================= */}

      <Modal
        visible={receiptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.receiptOverlay}>
          <TouchableOpacity
            style={styles.receiptCloseButton}
            onPress={() => setReceiptVisible(false)}
            hitSlop={{
              top: 12,
              bottom: 12,
              left: 12,
              right: 12,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.receiptImageWrap}>
            {imgLoading && (
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
                style={styles.imageLoader}
              />
            )}

            {order.paymentReceiptDoc ? (
              <Image
                source={{
                  uri: order.paymentReceiptDoc,
                }}
                style={styles.receiptImage}
                resizeMode="contain"
                onLoadStart={() => setImgLoading(true)}
                onLoadEnd={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ===============================================================
  // MAIN MODAL
  // ===============================================================

  overlay: {
    flex: 1,
    backgroundColor: "rgba(33,30,61,0.48)",
    justifyContent: "flex-end",
  },

  sheet: {
    maxHeight: "90%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.md,
    overflow: "hidden",
  },

  topAccent: {
    height: 3,
    width: "100%",
    backgroundColor: ORANGE,
    marginBottom: spacing.sm,
  },

  grabber: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  // ===============================================================
  // HEADER
  // ===============================================================

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  headerInfo: {
    flex: 1,
  },

  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ORANGE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  orderTitleContent: {
    flex: 1,
  },

  orderId: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  date: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },

  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  // ===============================================================
  // SCROLL
  // ===============================================================

  scroll: {
    flexGrow: 0,
  },

  scrollContent: {
    paddingBottom: spacing.md,
  },

  // ===============================================================
  // INFORMATION CARD
  // ===============================================================

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: ORANGE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 10,
  },

  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: 105,
  },

  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 7,
  },

  summaryValue: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 17,
  },

  // ===============================================================
  // NOTE
  // ===============================================================

  noteCard: {
    flexDirection: "row",
    backgroundColor: ORANGE_SOFT,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FBE1CF",
  },

  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ORANGE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  noteContent: {
    flex: 1,
  },

  noteLabel: {
    fontSize: 10,
    color: ORANGE,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  noteText: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 17,
  },

  // ===============================================================
  // PAYMENT RECEIPT
  // ===============================================================

  receiptButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  receiptIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: ORANGE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  receiptInfo: {
    flex: 1,
  },

  receiptTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  receiptSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ===============================================================
  // ITEMS
  // ===============================================================

  itemsSection: {
    marginTop: 18,
  },

  itemsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  itemsHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  itemsCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  itemRowLast: {
    borderBottomWidth: 0,
  },

  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: ORANGE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  itemNumberText: {
    fontSize: 10,
    fontWeight: "800",
    color: ORANGE,
  },

  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },

  itemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 17,
  },

  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  quantityBadge: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  quantityText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  multiplyText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginHorizontal: 5,
  },

  itemPrice: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  itemTotal: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  // ===============================================================
  // LOADING
  // ===============================================================

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  // ===============================================================
  // ERROR
  // ===============================================================

  errorBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3D5D5",
  },

  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FDEAEA",
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ORANGE,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },

  retryText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  // ===============================================================
  // EMPTY
  // ===============================================================

  emptyItemsBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyItemsText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 7,
  },

  // ===============================================================
  // TOTALS
  // ===============================================================

  totalsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },

  totalsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  totalsValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  discountValue: {
    color: colors.success,
  },

  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  grandTotalSubtext: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },

  grandTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: ORANGE,
  },

  bottomSpace: {
    height: 8,
  },

  // ===============================================================
  // RECEIPT VIEWER
  // ===============================================================

  receiptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
    alignItems: "center",
  },

  receiptCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  receiptImageWrap: {
    width: "100%",
    height: "72%",
    justifyContent: "center",
    alignItems: "center",
  },

  imageLoader: {
    position: "absolute",
    zIndex: 2,
  },

  receiptImage: {
    width: "100%",
    height: "100%",
  },
});
