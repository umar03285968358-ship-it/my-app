import Header from "@/components/Header";
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

// Unique, stable id for this screen's search registration — must not
// collide with the ids used by the other 4 screens.
const SEARCH_OWNER_ID = "wishlist";

export default function WishlistScreen() {
  const { wishlistProducts, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const { categories } = useMobCategories();

  const { isSearchOpen, registerSearch, unregisterSearch, closeSearch } =
    useHeaderSearch();

  const [search, setSearch] = useState("");

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return wishlistProducts;

    return wishlistProducts.filter((p) =>
      p.productTitle.toLowerCase().includes(q),
    );
  }, [wishlistProducts, search]);

  /*
   * ---------------------------------------------------------
   * REGISTER SEARCH WITH HEADER
   * ---------------------------------------------------------
   *
   * Once this screen has content worth searching (i.e. the
   * wishlist isn't empty/loading), tell the header a search
   * bar exists on this screen. When collapsed, the header
   * will show a search icon that reopens it.
   *
   * This must react to TWO things:
   * - focus/blur (via useIsFocused) — tab screens can stay
   *   mounted in the background, so we register while focused
   *   and unregister the instant we lose focus, otherwise the
   *   search bar's open/closed state leaks between screens.
   * - the "has content" condition changing WHILE we're still
   *   focused (e.g. loading finishes after the screen is
   *   already focused). A plain useFocusEffect only re-runs on
   *   focus/blur transitions, NOT when its dependencies change
   *   while already focused — so if data loads a moment after
   *   the screen gains focus, registerSearch() would never
   *   fire and the header search icon would silently never
   *   appear. A regular useEffect keyed on isFocused avoids
   *   that trap.
   *
   * Registering always resets the search to collapsed, so
   * returning to this screen (a fresh focus) always shows it
   * hidden again.
   *
   * registerSearch/unregisterSearch now take this screen's owner
   * id so the context can track a registry (Set) of currently-
   * registered screens instead of one shared boolean — this
   * prevents another screen's unregister (e.g. the screen you're
   * navigating away from) from clobbering this screen's
   * registration if the two effects fire in overlapping renders
   * during a tab switch.
   */
  const isFocused = useIsFocused();
  const screenHasSearch = !loading && wishlistProducts.length > 0;

  useEffect(() => {
    console.log("[WISHLIST SEARCH REG]", {
      isFocused,
      loading,
      count: wishlistProducts.length,
      screenHasSearch,
      willRegister: isFocused && screenHasSearch,
    });

    if (isFocused && screenHasSearch) {
      console.log(
        "[WISHLIST SEARCH REG] -> registerSearch(",
        SEARCH_OWNER_ID,
        ")",
      );
      registerSearch(SEARCH_OWNER_ID);
    } else {
      console.log(
        "[WISHLIST SEARCH REG] -> unregisterSearch(",
        SEARCH_OWNER_ID,
        ")",
      );
      unregisterSearch(SEARCH_OWNER_ID);
    }
  }, [isFocused, screenHasSearch, registerSearch, unregisterSearch]);

  // Whenever the search bar collapses (X button, header icon on
  // another screen, navigating away, etc.), clear any active filter
  // so a stale query never silently stays applied.
  useEffect(() => {
    console.log("[WISHLIST SEARCH REG] isSearchOpen changed ->", isSearchOpen);
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  /*
   * Open Product Details
   *
   * Wishlist products contain:
   * - categoryTitle
   * - subCategoryTitle
   *
   * ProductDetailScreen requires:
   * - id
   * - catId
   * - subCatId
   *
   * We use the categories hook to resolve those IDs.
   */
  const handleProductPress = (product: (typeof wishlistProducts)[number]) => {
    const productSubCategoryName = product.subCategoryTitle
      ?.trim()
      .toLowerCase();

    const productCategoryName = product.categoryTitle?.trim().toLowerCase();

    /*
     * Find the matching subcategory.
     *
     * MobCategory:
     * - id = subcategory ID
     * - name = subcategory name
     * - type = "SubCat"
     * - parentId = parent category ID
     */
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

    /*
     * Extra safety:
     *
     * Make sure the resolved parent category actually
     * matches the product's category title.
     */
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

    /*
     * Navigate exactly like SubcategoryProductsScreen.
     */
    router.push({
      pathname: "/product/[id]",
      params: {
        id: String(product.productID),
        catId: String(catId),
        subCatId: String(subCatId),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="My Wishlist" />

        <View style={styles.centerState}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </View>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="My Wishlist" />

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
    );
  }

  const handleAddAll = () => {
    visibleProducts.forEach((p) => addToCart(p, 1));

    router.push("/(tabs)/cart");
  };

  return (
    <View style={styles.container}>
      {/* Search */}
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
                  source={{ uri: item.imagesPath }}
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
                <Text style={styles.name} numberOfLines={2}>
                  {item.productTitle}
                </Text>

                <Text style={styles.price}>{formatRs(item.salePrice)}</Text>
              </View>

              {/* Remove From Wishlist */}
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  toggleWishlist(item);
                }}
                hitSlop={8}
                style={styles.heartButton}
              >
                <Ionicons name="heart" size={20} color="#e0533d" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom Add All Button */}
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

  /*
   * 12px space from the top.
   * No marginBottom so the content can move
   * directly underneath the SearchBar.
   */
  searchContainer: {
    marginTop: 12,
    backgroundColor: colors.background,
    zIndex: 10,
  },

  /*
   * Initial small gap below SearchBar.
   * This belongs to the FlatList, so it scrolls away.
   */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
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
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  addAllText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "700",
  },
});
