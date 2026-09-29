import KeyboardScreen from "@/components/KeyboardScreen";
import SearchBar from "@/components/Searchbar";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Unique, stable id for this screen's search registration — must not
// collide with the ids used by the other 4 screens.
const SEARCH_OWNER_ID = "category-detail";

export default function CategorySubcategoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catId = Number(id);

  const {
    getCategoryById,
    getSubcategoriesByCategory,
    loading,
    refreshing,
    error,
    refetch,
  } = useMobCategories();

  const [search, setSearch] = useState("");

  const { isSearchOpen, registerSearch, unregisterSearch, closeSearch } =
    useHeaderSearch();

  const category = getCategoryById(catId);
  const subcategoryList = getSubcategoriesByCategory(catId);

  // Register this screen's search with the header whenever there's
  // content worth searching.
  //
  // This must react to TWO things: focus/blur (via useIsFocused,
  // since tab/stack screens can stay mounted in the background and
  // we need to unregister the instant we lose focus) AND the "has
  // content" condition changing WHILE still focused (e.g. loading
  // finishes after the screen already gained focus). A plain
  // useFocusEffect only re-runs on focus/blur transitions, not on
  // dependency changes while already focused — so if data loads a
  // moment after focus, registerSearch() would never fire and the
  // header search icon would silently never appear. A regular
  // useEffect keyed on isFocused avoids that trap.
  //
  // Registering always resets the search to collapsed, so
  // returning to this screen (a fresh focus) always shows it
  // hidden again.
  //
  // registerSearch/unregisterSearch now take this screen's owner id
  // so the context can track a registry (Set) of currently-registered
  // screens instead of one shared boolean — this prevents another
  // screen's unregister (e.g. the screen you're navigating away from)
  // from clobbering this screen's registration if the two effects
  // fire in overlapping renders during a tab switch.
  const isFocused = useIsFocused();
  const screenHasSearch = !loading && !error && subcategoryList.length > 0;

  useEffect(() => {
    console.log("[CATEGORY DETAIL SEARCH REG]", {
      isFocused,
      loading,
      error,
      count: subcategoryList.length,
      screenHasSearch,
      willRegister: isFocused && screenHasSearch,
    });

    if (isFocused && screenHasSearch) {
      console.log(
        "[CATEGORY DETAIL SEARCH REG] -> registerSearch(",
        SEARCH_OWNER_ID,
        ")",
      );
      registerSearch(SEARCH_OWNER_ID);
    } else {
      console.log(
        "[CATEGORY DETAIL SEARCH REG] -> unregisterSearch(",
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
    console.log(
      "[CATEGORY DETAIL SEARCH REG] isSearchOpen changed ->",
      isSearchOpen,
    );
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  // Filter client-side over the already-cached subcategory list.
  const visibleSubcategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return subcategoryList;

    return subcategoryList.filter((s) => s.name.toLowerCase().includes(q));
  }, [subcategoryList, search]);

  return (
    <KeyboardScreen>
    <View style={styles.container}>
      {!loading && !error && subcategoryList.length > 0 && (
        <>
          {/* Collections Header */}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listLabel}>COLLECTIONS</Text>

              <Text style={styles.listTitle}>Explore all collections</Text>
            </View>

            <View style={styles.countCircle}>
              <Text style={styles.countNumber}>
                {visibleSubcategories.length}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              showDivider={true}
              placeholder="Search collections..."
              isOpen={isSearchOpen}
              onClose={closeSearch}
            />
          </View>
        </>
      )}

      {loading ? (
        <View style={styles.centerState}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.textPrimary} />
          </View>

          <Text style={styles.stateTitle}>Loading collections</Text>

          <Text style={styles.stateDescription}>Please wait...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={30}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.stateTitle}>Something went wrong</Text>

          <Text style={styles.stateDescription}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />

            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : subcategoryList.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="file-tray-outline"
              size={30}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.stateTitle}>No collections yet</Text>

          <Text style={styles.stateDescription}>
            No collections are available in this category right now.
          </Text>
        </View>
      ) : visibleSubcategories.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="search-outline"
              size={30}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.stateTitle}>No matches</Text>

          <Text style={styles.stateDescription}>
            No collections match &quot;{search}&quot;
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleSubcategories}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch()}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.collectionCard}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/subcategory/[id]",
                  params: {
                    id: String(item.id),
                  },
                })
              }
            >
              {/* Subcategory Image */}
              <View style={styles.imageBox}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.collectionImage}
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.fallbackNumber}>
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </Text>
                  </View>
                )}
              </View>

              {/* Collection Info */}
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.viewProductsRow}>
                  <Text style={styles.viewProductsText}>View products</Text>

                  <Ionicons
                    name="arrow-forward-outline"
                    size={13}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textPrimary}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 26,
  },

  /* =========================
     Collections Header
  ========================= */

  listHeader: {
    marginHorizontal: 7,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: colors.background,
    zIndex: 10,

    paddingBottom: 12,
    marginBottom: 3,

    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  listLabel: {
    ...typography.caption,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: 3,
  },

  listTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  countCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  countNumber: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  /* =========================
     Search
  ========================= */

  /*
   * Same behavior as Wishlist:
   *
   * - SearchBar has the background behind it.
   * - No marginBottom.
   * - List provides the initial gap.
   * - Content can scroll underneath this area.
   */
  searchWrap: {
    backgroundColor: colors.background,
    zIndex: 10,
  },

  /* =========================
     List
  ========================= */

  /*
   * Small initial space below SearchBar.
   *
   * Because this belongs to the FlatList,
   * it scrolls away with the content.
   */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* =========================
     Collection Card
  ========================= */

  collectionCard: {
    minHeight: 82,
    width: "100%",
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  /* =========================
     Image
  ========================= */

  imageBox: {
    width: 58,
    height: 58,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },

  collectionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  fallbackNumber: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
  },

  /* =========================
     Collection Info
  ========================= */

  collectionInfo: {
    flex: 1,
    minWidth: 0,
  },

  collectionName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    lineHeight: 20,
    paddingRight: spacing.sm,
  },

  viewProductsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  viewProductsText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 4,
  },

  /* =========================
     Arrow
  ========================= */

  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  /* =========================
     States
  ========================= */

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  loadingBox: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  stateIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  stateTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },

  stateDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
  },

  retryButton: {
    marginTop: spacing.lg,
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    ...typography.caption,
    color: "#fff",
    fontWeight: "700",
    marginLeft: 7,
  },
});
