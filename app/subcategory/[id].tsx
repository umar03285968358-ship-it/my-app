import KeyboardScreen from "@/components/KeyboardScreen";
import ProductCard, { ProductCardViewMode } from "@/components/ProductCard";
import SearchBar from "@/components/Searchbar";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { useMobProducts } from "@/hooks/useMobProducts";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const SEARCH_OWNER_ID = "subcategory-products";

export default function SubcategoryProductsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const subCatId = Number(id);

  const { width } = useWindowDimensions();

  const { categories } = useMobCategories();

  const subcategory = categories.find(
    (category) =>
      category.type === "SubCat" &&
      category.id === subCatId,
  );

  const catId = subcategory?.parentId ?? null;

  const {
    products,
    loading,
    refreshing,
    error,
    refetch,
  } = useMobProducts(catId, subCatId);

  const [search, setSearch] = useState("");

  /*
   * Grid is the default view.
   */
  const [viewMode, setViewMode] =
    useState<ProductCardViewMode>("grid");

  const {
    isSearchOpen,
    registerSearch,
    unregisterSearch,
    closeSearch,
  } = useHeaderSearch();

  const isFocused = useIsFocused();

  const screenHasSearch =
    !loading &&
    !error &&
    products.length > 0;

  /*
   * NOTE: The old ref-based "refresh when coming back to this
   * screen" effect has been removed. That logic relied on a ref
   * (hasLeftScreen) which only works correctly if the component
   * stays mounted the whole time you're away (e.g. a detail screen
   * pushed on top of this one). If this screen gets unmounted and
   * remounted instead (different route/tab), the ref resets and the
   * forced refetch never happened — which is why stale data only
   * showed up in some navigation flows.
   *
   * useMobProducts now handles this itself via useFocusEffect, which
   * fires reliably every time this screen becomes focused regardless
   * of how it was mounted. Pull-to-refresh / manual refetch() is
   * still available from the hook if you need it elsewhere.
   */

  useEffect(() => {
    if (isFocused && screenHasSearch) {
      registerSearch(SEARCH_OWNER_ID);
    } else {
      unregisterSearch(SEARCH_OWNER_ID);
    }
  }, [
    isFocused,
    screenHasSearch,
    registerSearch,
    unregisterSearch,
  ]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  /*
   * Search only by product title.
   */
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter((p) =>
      p.productTitle
        ?.toLowerCase()
        .includes(q),
    );
  }, [products, search]);

  /*
   * Grid sizing.
   */
  const horizontalPadding = 20;
  const columnGap = 8;

  const cardWidth =
    (width - horizontalPadding - columnGap) / 2;

  /*
   * Product count.
   */
  const productCount =
    visibleProducts.length;

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        {/* =========================
            SEARCH
        ========================= */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <View style={styles.searchWrap}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                showDivider={true}
                placeholder="Search products..."
                isOpen={isSearchOpen}
                onClose={closeSearch}
              />
            </View>
          )}

        {/* =========================
            LOADING
        ========================= */}

        {loading ? (
          <View style={styles.centerState}>
            <View style={styles.stateIconContainer}>
              <ActivityIndicator
                color={colors.primaryDark}
                size="small"
              />
            </View>

            <Text style={styles.stateTitle}>
              Loading products...
            </Text>

            <Text style={styles.stateText}>
              Please wait while we fetch the latest
              products.
            </Text>
          </View>
        ) : error ? (
          /* =========================
             ERROR
          ========================= */

          <View style={styles.centerState}>
            <View style={styles.stateIconContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.stateTitle}>
              Something went wrong
            </Text>

            <Text style={styles.stateText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.8}
              onPress={() => refetch()}
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                color={colors.white}
              />

              <Text style={styles.retryText}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          /* =========================
             EMPTY STATE
          ========================= */

          <View style={styles.centerState}>
            <View style={styles.stateIconContainer}>
              <Ionicons
                name="file-tray-outline"
                size={28}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.stateTitle}>
              No products yet
            </Text>

            <Text style={styles.stateText}>
              There are no products available in this
              category at the moment.
            </Text>
          </View>
        ) : visibleProducts.length === 0 ? (
          /* =========================
             NO SEARCH MATCHES
          ========================= */

          <View style={styles.centerState}>
            <View style={styles.stateIconContainer}>
              <Ionicons
                name="search-outline"
                size={28}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.stateTitle}>
              No matches
            </Text>

            <Text style={styles.stateText}>
              No products match &quot;{search}&quot;
            </Text>
          </View>
        ) : (
          /* =========================
             PRODUCT CONTENT
          ========================= */

          <>
            {/* =========================
                PRODUCT TOOLBAR
            ========================= */}

            <View style={styles.productToolbar}>
              <View style={styles.countContainer}>
                <Text style={styles.showingText}>
                  Showing{" "}
                  <Text style={styles.countText}>
                    {productCount}
                  </Text>{" "}
                  {productCount === 1
                    ? "product"
                    : "products"}
                </Text>
              </View>

              {/* VIEW TOGGLE */}

              <View style={styles.viewToggle}>
                {/* GRID */}

                <TouchableOpacity
                  style={[
                    styles.viewButton,
                    viewMode === "grid" &&
                      styles.viewButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setViewMode("grid")
                  }
                >
                  <Ionicons
                    name="grid-outline"
                    size={18}
                    color={
                      viewMode === "grid"
                        ? colors.white
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>

                {/* LIST */}

                <TouchableOpacity
                  style={[
                    styles.viewButton,
                    viewMode === "list" &&
                      styles.viewButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setViewMode("list")
                  }
                >
                  <Ionicons
                    name="list-outline"
                    size={20}
                    color={
                      viewMode === "list"
                        ? colors.white
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* =========================
                PRODUCT LIST
            ========================= */}

            <FlatList
              key={viewMode}
              data={visibleProducts}
              keyExtractor={(item) =>
                String(item.productID)
              }
              numColumns={
                viewMode === "grid" ? 2 : 1
              }
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={
                viewMode === "grid"
                  ? styles.columnWrapper
                  : undefined
              }
              contentContainerStyle={[
                styles.listContent,
                viewMode === "list" &&
                  styles.listViewContent,
              ]}
              renderItem={({ item }) => {
                if (viewMode === "list") {
                  return (
                    <ProductCard
                      product={item}
                      catId={catId ?? 0}
                      subCatId={subCatId}
                      viewMode="list"
                    />
                  );
                }

                return (
                  <View
                    style={{
                      width: cardWidth,
                    }}
                  >
                    <ProductCard
                      product={item}
                      catId={catId ?? 0}
                      subCatId={subCatId}
                      viewMode="grid"
                    />
                  </View>
                );
              }}
            />
          </>
        )}
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  /* =========================
     SCREEN
  ========================= */

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
  },

  /* =========================
     SEARCH
  ========================= */

  searchWrap: {
    backgroundColor: colors.background,
    zIndex: 10,
  },

  /* =========================
     PRODUCT TOOLBAR
  ========================= */

  productToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 12,

    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  countContainer: {
    flex: 1,
    minWidth: 0,
  },

  showingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  countText: {
    color: colors.primaryDark,
    fontWeight: "800",
  },

  /* =========================
     VIEW TOGGLE
  ========================= */

  viewToggle: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.white,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: radius.sm,

    padding: 2,

    gap: 2,
  },

  viewButton: {
    width: 34,
    height: 32,

    borderRadius: 6,

    alignItems: "center",
    justifyContent: "center",
  },

  viewButtonActive: {
    backgroundColor: colors.primaryDark,
  },

  /* =========================
     GRID LIST
  ========================= */

  listContent: {
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: spacing.xxl,
  },

  listViewContent: {
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: spacing.xxl,
  },

  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  /* =========================
     CENTER STATES
  ========================= */

  centerState: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: spacing.xl,
  },

  stateIconContainer: {
    width: 64,
    height: 64,

    borderRadius: 999,

    backgroundColor: "#FFF0E8",

    borderWidth: 1,
    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.md,
  },

  stateTitle: {
    ...typography.h3,

    color: colors.textPrimary,

    fontWeight: "700",

    marginBottom: spacing.xs,

    textAlign: "center",
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

    borderRadius: 999,

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