import Button from "@/components/Button";
import SearchBar from "@/components/Searchbar";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { CartItem, useCart } from "@/context/CartContext";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { getDiscountedPrice, getProductImageUrl } from "@/utils/pricing";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Unique, stable id for this screen's search registration — must not
// collide with the ids used by the other 4 screens.
const SEARCH_OWNER_ID = "cart";

export default function CartScreen() {
  const {
    items,
    loading,
    updateQty,
    removeFromCart,
    subtotal,
    deliveryFee,
    total,
  } = useCart();

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
  //
  // NOTE: this effect must run unconditionally (before the early
  // returns below) to respect the Rules of Hooks — the loading/empty
  // checks live inside the effect body instead.
  const isFocused = useIsFocused();
  const screenHasSearch = !loading && items.length > 0;

  useEffect(() => {
    console.log("[CART SEARCH REG]", {
      isFocused,
      loading,
      count: items.length,
      screenHasSearch,
      willRegister: isFocused && screenHasSearch,
    });

    if (isFocused && screenHasSearch) {
      console.log("[CART SEARCH REG] -> registerSearch(", SEARCH_OWNER_ID, ")");
      registerSearch(SEARCH_OWNER_ID);
    } else {
      console.log(
        "[CART SEARCH REG] -> unregisterSearch(",
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
    console.log("[CART SEARCH REG] isSearchOpen changed ->", isSearchOpen);
    if (!isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((i) =>
      i.product.productTitle.toLowerCase().includes(q),
    );
  }, [items, search]);

  if (loading) {
    return <View style={styles.emptyContainer} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={56} color={colors.textSecondary} />

        <Text style={styles.emptyTitle}>Your cart is empty</Text>

        <Text style={styles.emptySubtitle}>
          Add some delicious treats to get started.
        </Text>

        <Button
          title="Browse Categories"
          onPress={() => router.push("/(tabs)/categories")}
          style={{
            marginTop: spacing.lg,
            width: 200,
          }}
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => {
    const price = getDiscountedPrice(item.product);

    return (
      <View style={styles.itemRow}>
        <Image
          source={{
            uri: getProductImageUrl(item.product),
          }}
          style={styles.itemImage}
        />

        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
            {item.product.productTitle}
          </Text>

          <Text style={styles.itemMeta}>{item.product.uomTitle ?? "1pc"}</Text>

          <View style={styles.priceActionRow}>
            <Text style={styles.itemPrice}>Rs {price.toFixed(0)}</Text>

            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  updateQty(item.product.productID, item.quantity - 1)
                }
              >
                <Ionicons name="remove" size={16} color={colors.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.qtyText}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  updateQty(item.product.productID, item.quantity + 1)
                }
              >
                <Ionicons name="add" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => removeFromCart(item.product.productID)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          showDivider={true}
          placeholder="Search in cart..."
          isOpen={isSearchOpen}
          onClose={closeSearch}
        />
      </View>

      {/* Scrollable Cart Content */}
      {visibleItems.length === 0 ? (
        <View style={styles.noResults}>
          <Ionicons
            name="search-outline"
            size={40}
            color={colors.textSecondary}
          />

          <Text style={styles.noResultsText}>
            No items match &quot;{search}&quot;
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => String(item.product.productID)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Bottom Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>

          <Text style={styles.summaryValue}>Rs {subtotal.toFixed(0)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>

          <Text style={styles.summaryValue}>Rs {deliveryFee.toFixed(0)}</Text>
        </View>

        <View
          style={[
            styles.summaryRow,
            {
              marginTop: spacing.xs,
            },
          ]}
        >
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
        </View>

        <Button
          title="Proceed to Checkout"
          onPress={() => router.push("/checkout/address")}
          style={{
            marginTop: spacing.md,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /*
   * 12px space from the top.
   * No elevation or shadow.
   * No bottom margin, so the list can move
   * directly underneath the SearchBar.
   */
  searchContainer: {
    marginTop: 12,
    backgroundColor: colors.background,
    zIndex: 10,
  },

  /*
   * The initial gap belongs to the FlatList.
   * It scrolls away together with the content.
   */
  listContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  itemImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  priceActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  itemPrice: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
    flex: 1,
  },

  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  qtyText: {
    ...typography.body,
    color: colors.textPrimary,
    minWidth: 18,
    textAlign: "center",
  },

  deleteButton: {
    marginLeft: spacing.md,
  },

  noResults: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  noResultsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },

  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.card,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },

  summaryValue: {
    ...typography.body,
    color: colors.textPrimary,
  },

  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  totalValue: {
    ...typography.h3,
    color: colors.primaryDark,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
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
});
