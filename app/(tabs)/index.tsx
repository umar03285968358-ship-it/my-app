import ClearAllCacheButton from "@/components/ClearAllChacheButton";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useWishlist } from "@/context/WishlistContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { MobProduct } from "@/services/api";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const {
    mainCategories,
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useMobCategories();

  const {
    wishlistProducts,
    loading: wishlistLoading,
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const previewWishlist = wishlistProducts.slice(0, 6);

  // Product detail screen needs catId/subCatId to fetch via useMobProducts.
  // Wishlist items only carry the subcategory NAME, so resolve the numeric
  // ids by matching against the categories list.
  const resolveIds = (product: MobProduct) => {
    const subcategory = categories.find(
      (c) =>
        c.type === "SubCat" &&
        c.name === product.subCategoryTitle
    );

    return {
      catId: subcategory?.parentId ?? null,
      subCatId: subcategory?.id ?? null,
    };
  };

  const goToProduct = (product: MobProduct) => {
    const { catId, subCatId } = resolveIds(product);

    router.push({
      pathname: "/product/[id]",
      params: {
        id: String(product.productID),
        catId: String(catId ?? ""),
        subCatId: String(subCatId ?? ""),
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: spacing.xxl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
        />

        <TextInput
          placeholder="Search..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
        />
      </View>

      {/* Promo banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>20% OFF</Text>

          <Text style={styles.bannerSubtitle}>
            On All Cakes
          </Text>

          <TouchableOpacity
            style={styles.bannerBtn}
            activeOpacity={0.8}
            onPress={() =>
              router.push("/(tabs)/categories")
            }
          >
            <Text style={styles.bannerBtnText}>
              Order Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Categories
        </Text>

        <Text
          style={styles.seeAll}
          onPress={() =>
            router.push("/(tabs)/categories")
          }
        >
          See All
        </Text>
      </View>

      {/* Categories */}
      {categoriesLoading ? (
        <View style={styles.categoryLoading}>
          <ActivityIndicator
            color={colors.primaryDark}
          />
        </View>
      ) : categoriesError ? (
        <View style={styles.categoryError}>
          <Ionicons
            name="cloud-offline-outline"
            size={24}
            color={colors.textSecondary}
          />

          <Text style={styles.categoryErrorText}>
            Unable to load categories
          </Text>
        </View>
      ) : mainCategories.length === 0 ? (
        <View style={styles.categoryError}>
          <Text style={styles.categoryErrorText}>
            No categories available
          </Text>
        </View>
      ) : (
        <FlatList
          data={mainCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryChip}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/category/[id]",
                  params: {
                    id: String(item.id),
                  },
                })
              }
            >
              {/* Category Image */}
              <View
                style={styles.categoryImageContainer}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="grid-outline"
                    size={28}
                    color={colors.primaryDark}
                  />
                )}
              </View>

              {/* Category Name */}
              <Text
                style={styles.categoryName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Wishlist Header */}
      <View style={styles.wishlistHeader}>
        <View style={styles.wishlistHeaderLeft}>
          <Text style={styles.wishlistTitle}>
            Wishlist
          </Text>

          {previewWishlist.length > 0 && (
            <View style={styles.wishlistCountPill}>
              <Text style={styles.wishlistCountText}>
                {wishlistProducts.length}
              </Text>
            </View>
          )}
        </View>

        {previewWishlist.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/wishlist")}
            hitSlop={8}
          >
            <Text style={styles.wishlistViewAll}>
              View all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Wishlist List */}
      {wishlistLoading ? (
        <View style={styles.categoryLoading}>
          <ActivityIndicator
            color={colors.primaryDark}
          />
        </View>
      ) : previewWishlist.length > 0 ? (
        <View style={styles.wishlistList}>
          {previewWishlist.map((product, index) => {
            const liked = isWishlisted(
              product.productID
            );

            const isLast =
              index === previewWishlist.length - 1;

            return (
              <TouchableOpacity
                key={product.productID}
                style={[
                  styles.wishRow,
                  isLast && styles.wishRowLast,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  goToProduct(product)
                }
              >
                {/* Thumbnail */}
                <View style={styles.wishThumb}>
                  {product.imagesPath ? (
                    <Image
                      source={{
                        uri: product.imagesPath,
                      }}
                      style={styles.wishThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={styles.wishThumbFallback}
                    >
                      <Ionicons
                        name="image-outline"
                        size={18}
                        color={
                          colors.textSecondary
                        }
                      />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.wishRowInfo}>
                  <Text
                    style={styles.wishRowName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {product.productTitle}
                  </Text>

                  <Text
                    style={styles.wishRowSub}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {product.subCategoryTitle}
                  </Text>
                </View>

                {/* Price */}
                <Text style={styles.wishRowPrice}>
                  {formatRs(product.salePrice)}
                </Text>

                {/* Heart toggle */}
                <TouchableOpacity
                  style={styles.wishRowHeart}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      liked
                        ? "heart"
                        : "heart-outline"
                    }
                    size={18}
                    color={
                      liked
                        ? colors.primaryDark
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {wishlistProducts.length >
            previewWishlist.length && (
            <TouchableOpacity
              style={styles.wishlistMoreRow}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/wishlist")
              }
            >
              <Text style={styles.wishlistMoreText}>
                +
                {wishlistProducts.length -
                  previewWishlist.length}{" "}
                more saved
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color={colors.primaryDark}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyWishlist}
          activeOpacity={0.8}
          onPress={() =>
            router.push("/wishlist")
          }
        >
          <Ionicons
            name="heart-outline"
            size={22}
            color={colors.primaryDark}
          />

          <Text style={styles.emptyWishlistText}>
            Tap the heart on any product to save it
            here
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {/* ================================================== */}
      {/* CLEAR ALL APP CACHE */}
      {/* ================================================== */}

      <View style={styles.clearCacheSection}>
        <Text style={styles.clearCacheTitle}>
          App Storage
        </Text>

        <Text style={styles.clearCacheDescription}>
          Remove all locally stored app data,
          including authentication, cart, wishlist
          and other AsyncStorage data.
        </Text>

        <ClearAllCacheButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 10,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  deliveryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  deliveryAddress: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },

  banner: {
    flexDirection: "row",
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.sm,
    marginTop: 12,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 120,
  },

  bannerTitle: {
    ...typography.h1,
    color: colors.white,
  },

  bannerSubtitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.md,
  },

  bannerBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
  },

  bannerBtnText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  seeAll: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
  },

  /* Categories */

  categoryLoading: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryError: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },

  categoryErrorText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  categoryChip: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryImageContainer: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },

  /* Wishlist */

  wishlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  wishlistHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  wishlistTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 19,
  },

  wishlistCountPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor:
      "rgba(241, 115, 31, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  wishlistCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryDark,
  },

  wishlistViewAll: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  wishlistList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  wishRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },

  wishRowLast: {
    borderBottomWidth: 0,
  },

  wishThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.background,
  },

  wishThumbImage: {
    width: "100%",
    height: "100%",
  },

  wishThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  wishRowInfo: {
    flex: 1,
    minWidth: 0,
  },

  wishRowName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  wishRowSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },

  wishRowPrice: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginRight: spacing.xs,
  },

  wishRowHeart: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  wishlistMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },

  wishlistMoreText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  /* Empty wishlist */

  emptyWishlist: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyWishlistText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },

  /* ================================================== */
  /* CLEAR CACHE */
  /* ================================================== */

  clearCacheSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },

  clearCacheTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  clearCacheDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
});