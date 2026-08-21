import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useMobProducts } from "@/hooks/useMobProducts";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ProductDetailScreen() {
  const router = useRouter();

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

  /*
   * Currently there is no stock quantity
   * exposed by MobProduct.
   */
  const stock = Infinity;

  /*
   * Quantity currently inside cart.
   */
  const inCart = product ? getItemQuantity(product.productID) : 0;

  /*
   * Local quantity selector.
   */
  const [qty, setQty] = useState(1);

  /*
   * Sync quantity with cart when product changes.
   */
  useEffect(() => {
    if (!product) return;

    setQty(inCart > 0 ? inCart : 1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.productID]);

  /*
   * Quantity controls.
   */
  const canDecrease = qty > 0;
  const canIncrease = qty < stock;

  /*
   * Is the product currently added?
   */
  const isAddedToCart = inCart > 0 && qty > 0;

  /*
   * Total price.
   */
  const totalPrice = useMemo(() => {
    if (!product || qty <= 0) {
      return 0;
    }

    return product.salePrice * qty;
  }, [product, qty]);

  /*
   * Decrease quantity.
   */
  const decrease = () => {
    if (!product) return;

    const nextQty = Math.max(0, qty - 1);

    setQty(nextQty);

    if (inCart > 0) {
      updateQty(product.productID, nextQty);
    }
  };

  /*
   * Increase quantity.
   */
  const increase = () => {
    if (!product) return;

    const nextQty = Math.min(stock, qty + 1);

    setQty(nextQty);

    if (inCart > 0) {
      updateQty(product.productID, nextQty);
    }
  };

  /*
   * Add product to cart.
   */
  const handleAddToCart = () => {
    if (!product) return;

    if (qty <= 0) {
      return;
    }

    if (inCart > 0) {
      updateQty(product.productID, qty);
      return;
    }

    addToCart(product, qty);
  };

  /*
   * Checkout is available only when
   * product has actually been added.
   */
  const canCheckout = inCart > 0 && qty > 0;

  const handleCheckout = () => {
    if (!canCheckout) {
      return;
    }

    router.push("/cart");
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <ActivityIndicator color={colors.primaryDark} size="small" />
          </View>

          <Text style={styles.stateTitle}>Loading product</Text>

          <Text style={styles.stateText}>
            Please wait while we load the product details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * Error / not found.
   */
  if (error || !product) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name={error ? "cloud-offline-outline" : "cube-outline"}
              size={30}
              color={colors.primaryDark}
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
            <Ionicons name="refresh-outline" size={17} color={colors.white} />

            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* SCROLLABLE CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {/* PRODUCT IMAGE */}

        <View style={styles.visualWrapper}>
          <View style={styles.imageCard}>
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
                  <Ionicons
                    name="image-outline"
                    size={38}
                    color={colors.primaryDark}
                  />
                </View>

                <Text style={styles.fallbackText}>No image available</Text>
              </View>
            )}
          </View>
        </View>

        {/* PRODUCT NAME + PRICE */}

        <View style={styles.productHeader}>
          <View style={styles.productNameWrapper}>
            <Text style={styles.title}>{product.productTitle}</Text>
          </View>

          <Text style={styles.price}>{formatRs(product.salePrice)}</Text>
        </View>

        {/* QUANTITY + ADD TO CART */}

        <View style={styles.cartSection}>
          <View style={styles.quantityBlock}>
            <Text style={styles.quantityLabel}>Quantity</Text>

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

          {/* ADD TO CART */}

          <TouchableOpacity
            style={[
              styles.addButton,
              isAddedToCart && styles.addedButton,
              qty === 0 && styles.addButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={qty === 0}
            onPress={handleAddToCart}
          >
            <Ionicons
              name={isAddedToCart ? "checkmark-circle-outline" : "cart-outline"}
              size={20}
              color={colors.white}
            />

            <Text style={styles.addButtonText}>
              {isAddedToCart ? "Added to Cart" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PRODUCT DETAILS */}

        <View style={styles.detailsSection}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIcon}>
              <Ionicons
                name="information-outline"
                size={18}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.detailsTitle}>Product Details</Text>
          </View>

          {product.productDescription &&
          product.productDescription.trim() !== "" &&
          product.productDescription !== "-" ? (
            <Text style={styles.description}>{product.productDescription}</Text>
          ) : (
            <Text style={styles.noDescription}>
              No product description available.
            </Text>
          )}
        </View>

        {/* EXTRA SPACE SO CONTENT IS NOT HIDDEN BEHIND STICKY FOOTER */}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* STICKY FOOTER - ALWAYS AT BOTTOM */}

      <View style={styles.checkoutBar}>
        {/* TOTAL */}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>
            Total ({qty} {qty === 1 ? "Item" : "Items"})
          </Text>

          <Text style={styles.totalPrice}>{formatRs(totalPrice)}</Text>
        </View>

        {/* CHECKOUT BUTTON */}

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            !canCheckout && styles.checkoutButtonDisabled,
          ]}
          activeOpacity={canCheckout ? 0.85 : 1}
          disabled={!canCheckout}
          onPress={handleCheckout}
        >
          <Text
            style={[
              styles.checkoutButtonText,
              !canCheckout && styles.checkoutButtonTextDisabled,
            ]}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            Checkout
          </Text>

          <Ionicons
            name="arrow-forward"
            size={25}
            color={canCheckout ? colors.white : colors.textSecondary}
            style={styles.checkoutArrow}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* SCREEN */

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 4,
  },

  scrollContent: {
    paddingTop: 0,

    /*
     * Keeps the last content above the sticky
     * checkout footer.
     */
    paddingBottom: 90,
  },

  /* PRODUCT IMAGE */

  visualWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: 0,
    paddingTop: 0,
  },

  imageCard: {
    width: "100%",
    aspectRatio: 1,

    backgroundColor: colors.card,

    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: "#FFDCC2",
    padding: spacing.md,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
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
    width: 64,
    height: 64,

    borderRadius: radius.pill,

    backgroundColor: colors.background,

    alignItems: "center",
    justifyContent: "center",
  },

  fallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  /* PRODUCT HEADER */

  productHeader: {
    paddingHorizontal: spacing.lg,

    paddingTop: spacing.lg,

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  productNameWrapper: {
    flex: 1,

    paddingRight: spacing.sm,
  },

  title: {
    ...typography.h2,

    color: colors.textPrimary,

    fontWeight: "700",

    lineHeight: 30,
  },

  price: {
    ...typography.h2,

    color: colors.primaryDark,

    fontWeight: "800",

    lineHeight: 30,

    textAlign: "right",
  },

  /* QUANTITY + ADD TO CART */

  cartSection: {
    paddingHorizontal: spacing.lg,

    marginTop: spacing.sm,

    flexDirection: "row",

    alignItems: "flex-end",

    gap: spacing.md,
  },

  quantityBlock: {
    flex: 1,
    minWidth: 0,
  },

  quantityLabel: {
    ...typography.caption,

    color: colors.textSecondary,

    fontWeight: "700",

    marginBottom: spacing.xs,
  },

  quantitySelector: {
    height: 52,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    paddingHorizontal: 5,
  },

  quantityButton: {
    width: 42,
    height: 42,

    borderRadius: radius.sm,

    alignItems: "center",
    justifyContent: "center",
  },

  quantityDisabled: {
    opacity: 0.35,
  },

  quantityValueBox: {
    flex: 1,

    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  quantityValue: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "800",
  },

  addButton: {
    flex: 1,

    minHeight: 52,

    minWidth: 0,

    borderRadius: radius.md,

    backgroundColor: colors.primaryDark,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,

    paddingHorizontal: spacing.md,

    shadowColor: colors.primaryDark,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.18,

    shadowRadius: 8,

    elevation: 4,
  },

  addedButton: {
    backgroundColor: colors.primaryLight,
  },

  addButtonDisabled: {
    opacity: 0.5,
  },

  addButtonText: {
    ...typography.button,

    color: colors.white,

    fontWeight: "700",

    textAlign: "center",

    flexShrink: 1,
  },

  /* PRODUCT DETAILS */

  detailsSection: {
    marginHorizontal: spacing.lg,

    marginTop: spacing.md,

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    padding: spacing.md,
  },

  detailsHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    marginBottom: spacing.sm,
  },

  detailsIcon: {
    width: 36,
    height: 36,

    borderRadius: radius.pill,

    backgroundColor: colors.background,

    alignItems: "center",
    justifyContent: "center",
  },

  detailsTitle: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "700",
  },

  description: {
    ...typography.body,

    color: colors.textSecondary,

    lineHeight: 23,
  },

  noDescription: {
    ...typography.body,

    color: colors.textSecondary,

    lineHeight: 23,
  },

  /* STICKY CHECKOUT BAR */

  checkoutBar: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: colors.card,

    borderTopWidth: 1,

    borderTopColor: colors.border,

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.sm,

    paddingBottom: spacing.sm,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.md,

    shadowColor: colors.black,

    shadowOffset: {
      width: 0,
      height: -3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 8,

    elevation: 10,

    zIndex: 100,
  },

  /* TOTAL */

  totalSection: {
    flex: 1,

    justifyContent: "center",

    minWidth: 0,
    paddingBottom: 7,
  },

  totalLabel: {
    ...typography.caption,

    color: colors.textPrimary,

    fontWeight: "600",

    marginBottom: 2,
  },

  totalPrice: {
    ...typography.h2,

    color: colors.primaryDark,

    fontWeight: "800",

    lineHeight: 30,
  },

  /* CHECKOUT BUTTON */

  checkoutButton: {
    minHeight: 50,

    marginBottom: 3,

    width: 130,

    borderRadius: radius.md,

    backgroundColor: colors.primaryDark,

    paddingHorizontal: spacing.sm,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    overflow: "hidden",
  },

  checkoutButtonDisabled: {
    backgroundColor: colors.border,

    opacity: 0.9,
  },

  checkoutButtonText: {
    ...typography.button,

    color: colors.white,

    fontWeight: "700",

    fontSize: 16,

    textAlign: "center",

    flexShrink: 1,

    minWidth: 0,
  },

  checkoutButtonTextDisabled: {
    color: colors.textSecondary,
  },

  checkoutArrow: {
    flexShrink: 0,
  },

  /* FOOTER SPACING */

  footerSpace: {
    height: spacing.xl,
  },

  /* LOADING / ERROR */

  centerState: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: spacing.xl,
  },

  stateIcon: {
    width: 66,
    height: 66,

    borderRadius: radius.pill,

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.primaryLight,

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

    backgroundColor: colors.primaryDark,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.xs,
  },

  retryText: {
    ...typography.caption,

    color: colors.white,

    fontWeight: "700",
  },
});
