import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { MobProduct } from "@/services/api";
import { formatRs } from "@/utils/currency";
import { getDiscountedPrice, getProductImageUrl } from "@/utils/pricing";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ProductCardViewMode = "grid" | "list";

interface ProductCardProps {
  product: MobProduct;
  catId: number;
  subCatId: number;
  viewMode?: ProductCardViewMode;
}

export default function ProductCard({
  product,
  catId,
  subCatId,
  viewMode = "grid",
}: ProductCardProps) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCart, updateQty, getItemQuantity } = useCart();

  const liked = isWishlisted(product.productID);
  const price = getDiscountedPrice(product);
  const imageUrl = getProductImageUrl(product);
  const hasDiscount = product.discPercentage > 0;
  const quantity = getItemQuantity(product.productID);

  const rating = (product as { rating?: number }).rating;
  const reviewCount = (product as { reviewCount?: number }).reviewCount;

  const handleOpenProduct = () =>
    router.push({
      pathname: "/product/[id]",
      params: {
        id: String(product.productID),
        catId: String(catId),
        subCatId: String(subCatId),
      },
    });

  const handleAdd = (event: any) => {
    event.stopPropagation();
    addToCart(product, 1);
  };

  const handleIncrement = (event: any) => {
    event.stopPropagation();
    updateQty(product.productID, quantity + 1);
  };

  const handleDecrement = (event: any) => {
    event.stopPropagation();
    updateQty(product.productID, quantity - 1);
  };

  /*
   * =====================================================
   * LIST VIEW
   * =====================================================
   */

  if (viewMode === "list") {
    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.9}
        onPress={handleOpenProduct}
      >
        {/* IMAGE */}

        <View style={styles.listImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.listImageFallback}>
              <Ionicons
                name="image-outline"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          )}

          {hasDiscount && (
            <View style={styles.listDiscountBadge}>
              <Text style={styles.discountBadgeText}>
                -{product.discPercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* CONTENT */}

        <View style={styles.listInfo}>
          {/* WISHLIST */}

          <TouchableOpacity
            style={[styles.listHeart, liked && styles.heartActive]}
            activeOpacity={0.8}
            onPress={(event) => {
              event.stopPropagation();
              toggleWishlist(product);
            }}
            hitSlop={6}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={17}
              color={liked ? colors.primaryDark : colors.textPrimary}
            />
          </TouchableOpacity>

          {/* PRODUCT NAME */}

          <Text style={styles.listName} numberOfLines={1} ellipsizeMode="tail">
            {product.productTitle}
          </Text>

          {/* RATING */}

          {typeof rating === "number" && (
            <View style={styles.listRatingRow}>
              <Ionicons name="star" size={12} color={colors.primaryDark} />

              <Text style={styles.ratingText}>
                {rating.toFixed(1)}
                {typeof reviewCount === "number" ? ` (${reviewCount})` : ""}
              </Text>
            </View>
          )}

          {/* PRICE + CART */}

          <View style={styles.listBottomRow}>
            <View style={styles.priceGroup}>
              <Text
                style={styles.listPrice}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {formatRs(price)}
              </Text>

              {hasDiscount && (
                <Text style={styles.originalPrice} numberOfLines={1}>
                  {formatRs(product.salePrice)}
                </Text>
              )}
            </View>

            {quantity === 0 ? (
              <TouchableOpacity
                style={styles.cartButton}
                activeOpacity={0.85}
                onPress={handleAdd}
                hitSlop={6}
              >
                <Ionicons name="cart-outline" size={16} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.8}
                  onPress={handleDecrement}
                  hitSlop={6}
                >
                  <Ionicons name="remove" size={14} color={colors.white} />
                </TouchableOpacity>

                <Text style={styles.stepperQty}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.8}
                  onPress={handleIncrement}
                  hitSlop={6}
                >
                  <Ionicons name="add" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /*
   * =====================================================
   * GRID VIEW
   * =====================================================
   */

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={handleOpenProduct}
    >
      {/* IMAGE */}

      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons
              name="image-outline"
              size={28}
              color={colors.textSecondary}
            />
          </View>
        )}

        {/* DISCOUNT */}

        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              -{product.discPercentage}%
            </Text>
          </View>
        )}

        {/* WISHLIST */}

        <TouchableOpacity
          style={[styles.heart, liked && styles.heartActive]}
          activeOpacity={0.8}
          onPress={(event) => {
            event.stopPropagation();
            toggleWishlist(product);
          }}
          hitSlop={6}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? colors.primaryDark : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* INFO */}

      <View style={styles.infoContainer}>
        {/* PRODUCT NAME */}

        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {product.productTitle}
        </Text>

        {/* RATING */}

        {typeof rating === "number" && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={colors.primaryDark} />

            <Text style={styles.ratingText}>
              {rating.toFixed(1)}
              {typeof reviewCount === "number" ? ` (${reviewCount})` : ""}
            </Text>
          </View>
        )}

        {/* PRICE + CART */}

        <View style={styles.bottomRow}>
          <View style={styles.priceGroup}>
            <Text
              style={styles.price}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {formatRs(price)}
            </Text>

            {hasDiscount && (
              <Text style={styles.originalPrice} numberOfLines={1}>
                {formatRs(product.salePrice)}
              </Text>
            )}
          </View>

          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.85}
              onPress={handleAdd}
              hitSlop={6}
            >
              <Ionicons name="cart-outline" size={17} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.8}
                onPress={handleDecrement}
                hitSlop={6}
              >
                <Ionicons name="remove" size={15} color={colors.white} />
              </TouchableOpacity>

              <Text style={styles.stepperQty}>{quantity}</Text>

              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.8}
                onPress={handleIncrement}
                hitSlop={6}
              >
                <Ionicons name="add" size={15} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /* =====================================================
     GRID CARD
  ===================================================== */

  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    overflow: "hidden",
    marginBottom: spacing.md,

    shadowColor: "transparent",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#FFF7F1",
    position: "relative",
    padding: 6,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F1",
  },

  discountBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },

  discountBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },

  heart: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },

  heartActive: {
    backgroundColor: "#FFF0E6",
  },

  infoContainer: {
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 7,
    gap: 2,
  },

  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 19,
    height: 19,
    flexShrink: 1,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 18,
  },

  ratingText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -2,
    minHeight: 34,
    width: "100%",
  },

  priceGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    minWidth: 0,
    marginRight: 5,
  },

  price: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: "900",
    fontSize: 16,
    flexShrink: 1,
    transform: [{ translateY: -7 }],
  },

  originalPrice: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
    flexShrink: 1,
    transform: [{ translateY: -5 }],
  },

  /* =====================================================
     CART
  ===================================================== */

  cartButton: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.sm,
    height: 34,
    paddingHorizontal: 2,
    gap: 0,
  },

  stepperButton: {
    width: 23,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  stepperQty: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
    fontSize: 13,
    minWidth: 17,
    textAlign: "center",
  },

  /* =====================================================
     LIST CARD
  ===================================================== */

  listCard: {
    width: "100%",
    height: 104,

    backgroundColor: colors.white,

    borderRadius: radius.lg,

    borderWidth: 1.5,
    borderColor: colors.primaryDark,

    overflow: "hidden",

    marginBottom: 8,

    flexDirection: "row",

    shadowColor: "transparent",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  listImageContainer: {
    width: 104,
    height: 104,

    backgroundColor: "#FFF7F1",

    position: "relative",

    padding: 5,
  },

  listImage: {
    width: "100%",
    height: "100%",
  },

  listImageFallback: {
    width: "100%",
    height: "100%",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF7F1",
  },

  listDiscountBadge: {
    position: "absolute",

    top: 6,
    left: 6,

    backgroundColor: colors.primaryDark,

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRadius: 6,
  },

  listInfo: {
    flex: 1,

    minWidth: 0,

    paddingLeft: 10,
    paddingRight: 9,

    paddingVertical: 8,

    justifyContent: "space-between",

    position: "relative",
  },

  listHeart: {
    position: "absolute",

    top: 7,
    right: 7,

    width: 27,
    height: 27,

    borderRadius: radius.pill,

    backgroundColor: colors.white,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: colors.primaryDark,

    zIndex: 5,
  },

  listName: {
    ...typography.body,

    color: colors.textPrimary,

    fontWeight: "800",

    fontSize: 14,

    lineHeight: 18,

    height: 18,

    paddingRight: 34,

    flexShrink: 1,
  },

  /*
   * IMPORTANT:
   * React Native StyleSheet does NOT support
   * CSS-style nested selectors.
   */

  listRatingRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    height: 16,
  },

  listBottomRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    width: "100%",

    height: 34,
  },

  listPrice: {
    ...typography.body,

    color: colors.primaryDark,

    fontWeight: "900",

    fontSize: 16,

    flexShrink: 1,

    transform: [{ translateY: -3 }],
  },
});
