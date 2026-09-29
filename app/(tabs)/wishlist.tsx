import KeyboardScreen from "@/components/KeyboardScreen";
import SearchBar from "@/components/Searchbar";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { useWishlist } from "@/context/WishlistContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { formatRs } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SEARCH_OWNER_ID = "wishlist";

export default function WishlistScreen() {
  const { wishlistProducts, loading, toggleWishlist, clearWishlist } =
    useWishlist();

  const { addToCart } = useCart();

  const { categories } = useMobCategories();

  const { isSearchOpen, registerSearch, unregisterSearch, closeSearch } =
    useHeaderSearch();

  const [search, setSearch] = useState("");

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return wishlistProducts;
    }

    return wishlistProducts.filter((product) =>
      product.productTitle?.toLowerCase().includes(q),
    );
  }, [wishlistProducts, search]);

  const isFocused = useIsFocused();

  const screenHasSearch = !loading && wishlistProducts.length > 0;

  useEffect(() => {
    if (isFocused && screenHasSearch) {
      registerSearch(SEARCH_OWNER_ID);
    } else {
      unregisterSearch(SEARCH_OWNER_ID);
    }

    return () => {
      unregisterSearch(SEARCH_OWNER_ID);
    };
  }, [isFocused, screenHasSearch, registerSearch, unregisterSearch]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  /*
   * Open Product Details
   */
  const handleProductPress = (product: (typeof wishlistProducts)[number]) => {
    const productSubCategoryName = product.subCategoryTitle
      ?.trim()
      .toLowerCase();

    const productCategoryName = product.categoryTitle?.trim().toLowerCase();

    const subcategory = categories.find(
      (category) =>
        category.type === "SubCat" &&
        category.name?.trim().toLowerCase() === productSubCategoryName &&
        category.parentId !== null,
    );

    if (!subcategory) {
      console.warn("Unable to open product details: subcategory not found.", {
        productID: product.productID,
        categoryTitle: product.categoryTitle,
        subCategoryTitle: product.subCategoryTitle,
      });

      return;
    }

    const subCatId = subcategory.id;
    const catId = subcategory.parentId;

    const parentCategory = categories.find(
      (category) =>
        category.type === "Cat" &&
        category.id === catId &&
        category.name?.trim().toLowerCase() === productCategoryName,
    );

    if (!parentCategory) {
      console.warn(
        "Unable to open product details: parent category not found.",
        {
          productID: product.productID,
          categoryTitle: product.categoryTitle,
          subCategoryTitle: product.subCategoryTitle,
          catId,
          subCatId,
        },
      );

      return;
    }

    router.push({
      pathname: "/product/[id]",
      params: {
        id: String(product.productID),
        catId: String(catId),
        subCatId: String(subCatId),
      },
    });
  };

  /*
   * Clear complete wishlist
   */
  const handleClearAll = async () => {
    if (wishlistProducts.length === 0) {
      return;
    }

    await clearWishlist();
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryDark} />
        </View>
      </View>
    );
  }

  /*
   * Empty Wishlist
   */
  if (wishlistProducts.length === 0) {
    return (
      <KeyboardScreen>
        <View style={styles.container}>
          {/* <Header title="My Wishlist" /> */}

          <View style={styles.centerState}>
            <Ionicons
              name="heart-outline"
              size={48}
              color={colors.textSecondary}
            />

            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>

            <Text style={styles.emptySubtitle}>
              Save products you love and they will appear here.
            </Text>

            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(tabs)/categories")}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardScreen>
    );
  }

  /*
   * Add visible/all products to cart
   */
  const handleAddAll = () => {
    visibleProducts.forEach((product) => {
      addToCart(product, 1);
    });

    router.push("/(tabs)/cart");
  };

  return (
    <View style={styles.container}>
      {/* Search + Clear All */}
      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            showDivider={true}
            placeholder="Search wishlist..."
            isOpen={isSearchOpen}
            onClose={closeSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={handleClearAll}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.primaryDark} />

          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {visibleProducts.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="search-outline"
            size={40}
            color={colors.textSecondary}
          />

          <Text style={styles.emptySubtitle}>
            No items match &quot;{search}&quot;
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          keyExtractor={(item) => String(item.productID)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => handleProductPress(item)}
            >
              {/* Product Image */}
              {item.imagesPath ? (
                <Image
                  source={{
                    uri: item.imagesPath,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.image, styles.imageFallback]}>
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              )}

              {/* Product Information */}
              <View style={styles.productInfo}>
                <Text
                  style={styles.name}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.productTitle}
                </Text>

                <Text style={styles.price}>{formatRs(item.salePrice)}</Text>
              </View>

              {/* Wishlist Toggle */}
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  toggleWishlist(item);
                }}
                hitSlop={8}
                style={styles.heartButton}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add All */}
      {visibleProducts.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addAllButton}
            onPress={handleAddAll}
            activeOpacity={0.8}
          >
            <Text style={styles.addAllText}>
              {search
                ? `Add ${visibleProducts.length} to Cart`
                : "Add All to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  browseButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
  },

  browseButtonText: {
    ...typography.caption,
    color: "#fff",
    fontWeight: "700",
  },

  topSection: {
    backgroundColor: colors.background,
    zIndex: 10,
  },

  searchContainer: {
    marginTop: 12,
  },

  clearAllButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },

  clearAllText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 260,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  image: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },

  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  price: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },

  heartButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  addAllButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: "center",

    // Subtle depth
    shadowColor: colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },

  addAllText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "700",
  },
});
