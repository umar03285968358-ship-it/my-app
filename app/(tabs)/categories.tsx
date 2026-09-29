import KeyboardScreen from "@/components/KeyboardScreen";
import SearchBar from "@/components/Searchbar";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
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

// Unique, stable id for this screen's search registration. A fixed
// string is enough — only one instance of CategoriesScreen is ever
// mounted at a time — this just has to not collide with the ids
// used by the other 4 screens (cart, wishlist, category-detail,
// subcategory-products).
const SEARCH_OWNER_ID = "categories";

export default function CategoriesScreen() {
  const { mainCategories, loading, refreshing, error, refetch } =
    useMobCategories();

  const [search, setSearch] = useState("");

  const { isSearchOpen, registerSearch, unregisterSearch, closeSearch } =
    useHeaderSearch();

  // Register this screen's search with the header whenever there's
  // content worth searching.
  //
  // This must react to TWO things: focus/blur (via useIsFocused,
  // since tab screens can stay mounted in the background and we
  // need to unregister the instant we lose focus) AND the "has
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

  const screenHasSearch = !loading && mainCategories.length > 0;

  useEffect(() => {
    console.log("[CATEGORIES SEARCH REG]", {
      isFocused,
      loading,
      count: mainCategories.length,
      screenHasSearch,
      willRegister: isFocused && screenHasSearch,
    });

    if (isFocused && screenHasSearch) {
      console.log(
        "[CATEGORIES SEARCH REG] -> registerSearch(",
        SEARCH_OWNER_ID,
        ")",
      );
      registerSearch(SEARCH_OWNER_ID);
    } else {
      console.log(
        "[CATEGORIES SEARCH REG] -> unregisterSearch(",
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
      "[CATEGORIES SEARCH REG] isSearchOpen changed ->",
      isSearchOpen,
    );
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  const visibleCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return mainCategories;

    return mainCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [mainCategories, search]);

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            showDivider={true}
            placeholder="Search categories..."
            isOpen={isSearchOpen}
            onClose={closeSearch}
          />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colors.textSecondary}
            />

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : mainCategories.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="file-tray-outline"
              size={32}
              color={colors.textSecondary}
            />

            <Text style={styles.errorText}>No categories available yet.</Text>
          </View>
        ) : visibleCategories.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="search-outline"
              size={32}
              color={colors.textSecondary}
            />

            <Text style={styles.errorText}>
              No categories match &quot;{search}&quot;
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleCategories}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => refetch()}
              />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
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
                <View style={styles.iconCircle}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.iconImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.iconFallback}>
                      {item.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </Text>
                  )}
                </View>

                {/* Category Name */}
                <View style={styles.nameContainer}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
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
  },

  /*
   * Same behavior as Wishlist:
   *
   * - SearchBar has its own background
   * - It stays visually above the list
   * - No marginBottom here
   * - The list itself provides the small initial gap
   */
  searchContainer: {
    marginTop: 12,
    backgroundColor: colors.background,
    zIndex: 10,
  },

  /*
   * Small space between SearchBar and first category.
   *
   * Because this padding belongs to the FlatList,
   * it scrolls away together with the content.
   *
   * Extra bottom space ensures the final category card
   * can be completely scrolled above the bottom area.
   */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + 40,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },

  retryButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
  },

  retryText: {
    ...typography.caption,
    color: "#fff",
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    overflow: "hidden",
  },

  iconImage: {
    width: 48,
    height: 48,
  },

  iconFallback: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  nameContainer: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});