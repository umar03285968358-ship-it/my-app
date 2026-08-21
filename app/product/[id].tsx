import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useMobProducts } from "@/hooks/useMobProducts";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#F1731F";
const ORANGE_LIGHT = "#FF914D";
const SOFT_ORANGE = "#FFF1E8";

export default function ProductDetailScreen() {
  const { id, catId, subCatId } = useLocalSearchParams<{
    id: string;
    catId: string;
    subCatId: string;
  }>();

  const productId = Number(id);

  const { products, loading, error, refetch } = useMobProducts(
    Number(catId),
    Number(subCatId),
  );

  const product = products.find((p) => p.productID === productId) ?? null;

  const { addToCart, updateQty, getItemQuantity } = useCart();

  const { isWishlisted, toggleWishlist } = useWishlist();

  /*
   * MobProduct currently doesn't expose
   * stock quantity, so keep unlimited quantity
   * until the backend field is available.
   */
  const stock = Infinity;

  const inCart = product ? getItemQuantity(product.productID) : 0;

  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setQty(inCart > 0 ? inCart : 1);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.productID]);

  const canDecrease = qty > 1;
  const canIncrease = qty < stock;

  const decrease = () => {
    setQty((current) => Math.max(1, current - 1));
  };

  const increase = () => {
    setQty((current) => Math.min(stock, current + 1));
  };

  const handleAddToCart = () => {
    if (!product) return;

    /*
     * If the product already exists in the cart,
     * update its quantity instead of adding on top.
     */
    if (inCart > 0) {
      updateQty(product.productID, qty);
    } else {
      addToCart(product, qty);
    }
  };

  const liked = product ? isWishlisted(product.productID) : false;

  const outOfStock = stock <= 0;

  const totalPrice = useMemo(() => {
    if (!product) return 0;

    return product.salePrice * qty;
  }, [product, qty]);

  const savingAmount = useMemo(() => {
    if (!product || product.discPercentage <= 0) {
      return 0;
    }

    return product.avgCostPrice - product.salePrice;
  }, [product]);

  /* =========================================
     LOADING STATE
  ========================================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <ActivityIndicator color={ORANGE} size="small" />
          </View>

          <Text style={styles.stateTitle}>Loading product</Text>

          <Text style={styles.stateText}>
            Please wait while we load the product details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================================
     ERROR / NOT FOUND STATE
  ========================================= */

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name={error ? "cloud-offline-outline" : "cube-outline"}
              size={30}
              color={ORANGE}
            />
          </View>

          <Text style={styles.stateTitle}>
            {error ? "Something went wrong" : "Product not found"}
          </Text>

          <Text style={styles.stateText}>
            {error ?? "This product is no longer available."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />

            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* =========================================
          MAIN CONTENT

          CustomerHeader is now responsible for:
          - Back button
          - Centered "Product Details" title
          - Cart button

          Therefore there is NO local top bar here.
      ========================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =====================================
            PRODUCT IMAGE AREA
        ===================================== */}

        <View style={styles.visualWrapper}>
          <View style={styles.imageCard}>
            <View style={styles.imageInner}>
              {product.imagesPath ? (
                <Image
                  source={{
                    uri: product.imagesPath,
                  }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <View style={styles.fallbackIcon}>
                    <Ionicons name="image-outline" size={36} color={ORANGE} />
                  </View>

                  <Text style={styles.fallbackText}>No image available</Text>
                </View>
              )}
            </View>
          </View>

          {/* =================================
              DISCOUNT BADGE
          ================================= */}

          {product.discPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Ionicons name="pricetag" size={13} color="#FFFFFF" />

              <Text style={styles.discountBadgeText}>
                {product.discPercentage}% OFF
              </Text>
            </View>
          )}

          {/* =================================
              WISHLIST
          ================================= */}

          <TouchableOpacity
            style={[
              styles.wishlistButton,
              liked && styles.wishlistButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => toggleWishlist(product)}
            hitSlop={6}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={21}
              color={liked ? ORANGE : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* =====================================
            PRODUCT INFORMATION
        ===================================== */}

        <View style={styles.infoContainer}>
          {/* TITLE */}

          <Text style={styles.title}>{product.productTitle}</Text>

          {/* AVAILABILITY */}

          <View style={styles.metaRow}>
            {!outOfStock ? (
              <View style={styles.availablePill}>
                <View style={styles.availableDot} />

                <Text style={styles.availableText}>In stock</Text>
              </View>
            ) : (
              <View style={styles.unavailablePill}>
                <View style={styles.unavailableDot} />

                <Text style={styles.unavailableText}>Out of stock</Text>
              </View>
            )}

            {product.discPercentage > 0 && (
              <Text style={styles.saveText}>Save {formatRs(savingAmount)}</Text>
            )}
          </View>

          {/* =================================
              DESCRIPTION
          ================================= */}

          {product.productDescription && product.productDescription !== "-" && (
            <View style={styles.descriptionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="information-outline"
                    size={17}
                    color={ORANGE}
                  />
                </View>

                <Text style={styles.sectionTitle}>About this product</Text>
              </View>

              <Text style={styles.description}>
                {product.productDescription}
              </Text>
            </View>
          )}

          {/* =================================
              QUANTITY
          ================================= */}

          {!outOfStock && (
            <View style={styles.quantityCard}>
              <View style={styles.quantityHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Quantity</Text>

                  <Text style={styles.quantityHint}>
                    Select the quantity...
                  </Text>
                </View>

                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      !canDecrease && styles.quantityDisabled,
                    ]}
                    activeOpacity={0.75}
                    disabled={!canDecrease}
                    onPress={decrease}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        canDecrease ? colors.textPrimary : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>

                  <View style={styles.quantityValueBox}>
                    <Text style={styles.quantityValue}>{qty}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      !canIncrease && styles.quantityDisabled,
                    ]}
                    activeOpacity={0.75}
                    disabled={!canIncrease}
                    onPress={increase}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        canIncrease ? colors.textPrimary : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {stock !== Infinity && (
                <Text style={styles.stockText}>{stock} available</Text>
              )}
            </View>
          )}

          {/* =================================
              ORDER SUMMARY
          ================================= */}

          {!outOfStock && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="receipt-outline" size={19} color={ORANGE} />
              </View>

              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Order total</Text>

                <Text style={styles.summarySubtitle}>
                  {qty} {qty === 1 ? "item" : "items"}
                </Text>
              </View>

              <Text style={styles.summaryPrice}>{formatRs(totalPrice)}</Text>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* =========================================
          FIXED FOOTER
      ========================================= */}

      {!outOfStock && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerLabel}>Total</Text>

            <Text style={styles.footerPrice}>{formatRs(totalPrice)}</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={21} color="#FFFFFF" />

            <Text style={styles.addButtonText}>
              {inCart > 0 ? "Update Cart" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =========================================
     SCREEN
  ========================================= */

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* =========================================
     SCROLL CONTENT
  ========================================= */

  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  /* =========================================
     PRODUCT VISUAL
  ========================================= */

  visualWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,

    position: "relative",
  },

  imageCard: {
    width: "100%",

    aspectRatio: 0.98,

    borderRadius: radius.lg,

    backgroundColor: colors.card,

    borderWidth: 2,
    borderColor: colors.primaryDark,

    overflow: "hidden",

    padding: spacing.sm,
  },

  imageInner: {
    flex: 1,

    borderRadius: radius.md,

    backgroundColor: colors.background,

    overflow: "hidden",

    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "94%",
    height: "94%",

    resizeMode: "contain",
  },

  imageFallback: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,
  },

  fallbackIcon: {
    width: 62,
    height: 62,

    borderRadius: radius.pill,

    backgroundColor: SOFT_ORANGE,

    alignItems: "center",
    justifyContent: "center",
  },

  fallbackText: {
    ...typography.caption,

    color: colors.textSecondary,
  },

  /* =========================================
     DISCOUNT
  ========================================= */

  discountBadge: {
    position: "absolute",

    left: spacing.md,
    bottom: spacing.md,

    backgroundColor: ORANGE,

    paddingHorizontal: spacing.sm,
    paddingVertical: 6,

    borderRadius: radius.pill,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  discountBadgeText: {
    fontSize: 10,

    color: "#FFFFFF",

    fontWeight: "900",

    letterSpacing: 0.4,
  },

  /* =========================================
     WISHLIST
  ========================================= */

  wishlistButton: {
    position: "absolute",

    top: spacing.md,
    right: spacing.md,

    width: 44,
    height: 44,

    borderRadius: radius.pill,

    backgroundColor: colors.card,

    borderWidth: 1,
    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.1,

    shadowRadius: 6,

    elevation: 4,
  },

  wishlistButtonActive: {
    backgroundColor: SOFT_ORANGE,

    borderColor: ORANGE_LIGHT,
  },

  /* =========================================
     PRODUCT INFORMATION
  ========================================= */

  infoContainer: {
    paddingHorizontal: spacing.lg,

    paddingTop: spacing.lg,
  },

  title: {
    ...typography.h1,

    color: colors.textPrimary,

    fontWeight: "700",

    lineHeight: 34,

    marginBottom: spacing.sm,
  },

  /* =========================================
     AVAILABILITY
  ========================================= */

  metaRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  availablePill: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  availableDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: colors.success,
  },

  availableText: {
    ...typography.caption,

    color: colors.success,

    fontWeight: "700",
  },

  unavailablePill: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  unavailableDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: colors.danger,
  },

  unavailableText: {
    ...typography.caption,

    color: colors.danger,

    fontWeight: "700",
  },

  saveText: {
    ...typography.caption,

    color: ORANGE,

    fontWeight: "700",
  },

  /* =========================================
     DESCRIPTION
  ========================================= */

  descriptionCard: {
    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    padding: spacing.md,

    marginBottom: spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    marginBottom: spacing.sm,
  },

  sectionIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: SOFT_ORANGE,

    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "700",
  },

  description: {
    ...typography.body,

    color: colors.textSecondary,

    lineHeight: 23,
  },

  /* =========================================
     QUANTITY
  ========================================= */

  quantityCard: {
    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    padding: spacing.md,

    marginBottom: spacing.md,
  },

  quantityHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  quantityHint: {
    ...typography.caption,

    color: colors.textSecondary,

    marginTop: 3,
  },

  quantitySelector: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,
  },

  quantityButton: {
    width: 36,
    height: 36,

    borderRadius: radius.pill,

    backgroundColor: colors.background,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",
  },

  quantityDisabled: {
    opacity: 0.4,
  },

  quantityValueBox: {
    width: 40,
    height: 36,

    borderRadius: radius.sm,

    backgroundColor: SOFT_ORANGE,

    alignItems: "center",
    justifyContent: "center",
  },

  quantityValue: {
    ...typography.h3,

    color: ORANGE,

    fontWeight: "800",
  },

  stockText: {
    ...typography.caption,

    color: colors.textSecondary,

    marginTop: spacing.sm,
  },

  /* =========================================
     ORDER SUMMARY
  ========================================= */

  summaryCard: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    padding: spacing.md,
  },

  summaryIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: SOFT_ORANGE,

    alignItems: "center",
    justifyContent: "center",

    marginRight: spacing.sm,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    ...typography.body,

    color: colors.textPrimary,

    fontWeight: "700",
  },

  summarySubtitle: {
    ...typography.caption,

    color: colors.textSecondary,

    marginTop: 2,
  },

  summaryPrice: {
    ...typography.h3,

    color: ORANGE,

    fontWeight: "800",
  },

  bottomSpacing: {
    height: spacing.lg,
  },

  /* =========================================
     FIXED FOOTER
  ========================================= */

  footer: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    gap: spacing.md,

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.sm,
    paddingBottom: spacing.md,

    backgroundColor: colors.background,

    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTotal: {
    minWidth: 82,
  },

  footerLabel: {
    ...typography.caption,

    color: colors.textSecondary,

    marginBottom: 2,
  },

  footerPrice: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "800",
  },

  addButton: {
    width: 140,

    minHeight: 52,

    borderRadius: radius.md,

    backgroundColor: ORANGE,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,

    shadowColor: ORANGE,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.22,

    shadowRadius: 8,

    elevation: 5,
  },

  addButtonText: {
    ...typography.button,

    color: "#FFFFFF",

    fontWeight: "700",
  },

  /* =========================================
     CENTER STATES
  ========================================= */

  centerState: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: spacing.xl,
  },

  stateIcon: {
    width: 66,
    height: 66,

    borderRadius: 33,

    backgroundColor: SOFT_ORANGE,

    borderWidth: 1,

    borderColor: "#FFD5BA",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,
  },

  stateTitle: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "700",

    textAlign: "center",

    marginBottom: spacing.xs,
  },

  stateText: {
    ...typography.body,

    color: colors.textSecondary,

    textAlign: "center",

    lineHeight: 21,

    maxWidth: 300,
  },

  retryButton: {
    marginTop: spacing.lg,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm + 2,

    borderRadius: radius.pill,

    backgroundColor: ORANGE,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.xs,
  },

  retryText: {
    ...typography.caption,

    color: "#FFFFFF",

    fontWeight: "700",
  },
});
