import { colors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import { useMobCategories } from "@/hooks/useMobCategories";
import { getUser } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const CUSTOMER_HEADER_HEIGHT = 58;

export default function CustomerHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { hasSearchScreen, isSearchOpen, openSearch } = useHeaderSearch();

  const {
    categories,
    getCategoryById,
    loading: categoriesLoading,
  } = useMobCategories();

  const [userName, setUserName] = useState("User");

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const user = await getUser();

        if (!mounted) return;

        const name =
          user?.name ||
          user?.fullName ||
          user?.userName ||
          user?.firstName ||
          user?.username ||
          "User";

        setUserName(String(name).trim() || "User");
      } catch (error) {
        console.log("[CUSTOMER HEADER] Failed to load user:", error);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const isHome =
    pathname === "/" ||
    pathname === "/(tabs)" ||
    pathname === "/(tabs)/" ||
    pathname === "/(tabs)/index";

  const isCategories =
    pathname === "/categories" || pathname === "/(tabs)/categories";

  const isCart = pathname === "/cart" || pathname === "/(tabs)/cart";

  const isOrders = pathname === "/orders" || pathname === "/(tabs)/orders";

  const isWishlist =
    pathname === "/wishlist" || pathname === "/(tabs)/wishlist";

  const isProfile = pathname === "/profile" || pathname === "/(tabs)/profile";

  const isCategoryDetail = pathname.startsWith("/category/");
  const isSubcategoryDetail = pathname.startsWith("/subcategory/");
  const isProductDetail = pathname.startsWith("/product/");

  const isDetailPage =
    isCategoryDetail || isSubcategoryDetail || isProductDetail;

  const getRouteId = (routeName: string): number | null => {
    const parts = pathname.split("/");
    const routeIndex = parts.indexOf(routeName);

    if (routeIndex === -1) return null;

    const rawId = parts[routeIndex + 1];
    if (!rawId) return null;

    const id = Number(decodeURIComponent(rawId));
    return Number.isFinite(id) ? id : null;
  };

  const categoryId = useMemo(() => {
    if (!isCategoryDetail) return null;
    return getRouteId("category");
  }, [pathname, isCategoryDetail]);

  const subcategoryId = useMemo(() => {
    if (!isSubcategoryDetail) return null;
    return getRouteId("subcategory");
  }, [pathname, isSubcategoryDetail]);

  const currentCategory = useMemo(() => {
    if (categoryId === null) return null;
    return getCategoryById(categoryId) ?? null;
  }, [categoryId, categories, getCategoryById]);

  const currentSubcategory = useMemo(() => {
    if (subcategoryId === null) return null;

    return (
      categories.find(
        (category) =>
          category.type === "SubCat" && category.id === subcategoryId,
      ) ?? null
    );
  }, [subcategoryId, categories]);

  const getPageTitle = () => {
    if (isHome) return `Hi, ${userName}`;
    if (isCategories) return "Categories";
    if (isCart) return "Cart";
    if (isOrders) return "Orders";
    if (isWishlist) return "Wishlist";
    if (isProfile) return "Profile";

    if (isCategoryDetail) {
      if (currentCategory?.name) return currentCategory.name;
      return "Category";
    }

    if (isSubcategoryDetail) {
      if (currentSubcategory?.name) return currentSubcategory.name;
      return "Subcategory";
    }

    if (isProductDetail) return "Product Details";

    return "MY APP";
  };

  const handleCartPress = () => {
    router.push("/(tabs)/cart");
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  /*
   * ---------------------------------------------------------
   * SEARCH ICON (shows in header when a screen's search bar
   * is collapsed) — classy fade + scale in/out.
   *
   * Product detail pages never have a search bar, so they're
   * excluded. Category/Subcategory detail pages DO register
   * search (e.g. Subcategory Products screen), so they must
   * still be allowed to show the icon — only the overall
   * header LAYOUT differs for detail pages (back button +
   * centered title), not whether search applies.
   * ---------------------------------------------------------
   */
  const shouldShowSearchIcon =
    hasSearchScreen && !isSearchOpen && !isProductDetail;

  const [renderSearchIcon, setRenderSearchIcon] =
    useState(shouldShowSearchIcon);
  const searchIconAnim = useRef(
    new Animated.Value(shouldShowSearchIcon ? 1 : 0),
  ).current;

  // Holds whichever Animated.timing is currently in flight (in or
  // out). Stopping it before starting the next one guarantees a
  // previous animation's .start() callback can never fire after a
  // newer render has already decided the icon's visibility —
  // that stale-callback race was the actual bug (see investigation
  // log Section 3.2/3.3): two separate effects shared one Animated
  // .Value with no way to cancel an in-flight timing, so a
  // 200ms animate-out queued right before a quick re-show would
  // still land afterwards and silently force the icon back to
  // hidden even though the current render state said it should be
  // visible.
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // DEBUG: snapshot every render, after both pieces of state exist
  console.log("[HEADER RENDER]", {
    pathname,
    hasSearchScreen,
    isSearchOpen,
    isProductDetail,
    shouldShowSearchIcon,
    renderSearchIcon,
  });

  useEffect(() => {
    console.log("[ICON EFFECT] fired", {
      shouldShowSearchIcon,
      renderSearchIcon,
    });

    // Stop whatever animation was previously in flight. This is
    // what closes the race: if an animate-out was mid-flight with
    // a pending setRenderSearchIcon(false) callback, .stop() means
    // that callback will simply never be invoked, instead of firing
    // late and clobbering the correct state.
    currentAnimationRef.current?.stop();
    currentAnimationRef.current = null;

    if (shouldShowSearchIcon) {
      setRenderSearchIcon(true);

      console.log("[ICON EFFECT] -> animating in, toValue 1");
      const anim = Animated.timing(searchIconAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

      currentAnimationRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) {
          console.log("[ICON EFFECT] -> animate-in complete");
        }
      });
    } else if (renderSearchIcon) {
      console.log("[ICON EFFECT] -> animating out, toValue 0");
      const anim = Animated.timing(searchIconAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });

      currentAnimationRef.current = anim;
      anim.start(({ finished }) => {
        // `finished` is false when .stop() cut this animation off
        // early (i.e. a newer render superseded it) — only commit
        // the hide when this animation actually ran to completion.
        if (finished) {
          console.log(
            "[ICON EFFECT] -> animate-out complete, setRenderSearchIcon(false)",
          );
          setRenderSearchIcon(false);
        } else {
          console.log("[ICON EFFECT] -> animate-out stopped early, ignoring");
        }
      });
    } else {
      console.log(
        "[ICON EFFECT] -> no-op (already hidden, nothing to animate)",
      );
    }

    // Belt-and-suspenders: also stop on unmount so nothing tries to
    // touch state after the component is gone.
    return () => {
      currentAnimationRef.current?.stop();
    };
  }, [shouldShowSearchIcon]);

  const renderSearchIconButton = () => {
    if (!renderSearchIcon) {
      console.log(
        "[RENDER BUTTON] renderSearchIcon is false -> returning null",
      );
      return null;
    }

    console.log("[RENDER BUTTON] rendering the Animated.View + icon");

    return (
      <Animated.View
        style={{
          opacity: searchIconAnim,
          transform: [
            {
              scale: searchIconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={styles.searchIconButton}
          activeOpacity={0.75}
          onPress={openSearch}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="search" size={19} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        {isDetailPage ? (
          <>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.75}
              onPress={handleBackPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={19} color={colors.white} />
            </TouchableOpacity>

            <View
              style={[
                styles.detailTitleContainer,
                renderSearchIcon && styles.detailTitleContainerWithSearch,
              ]}
            >
              <Text
                style={styles.detailTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getPageTitle()}
              </Text>
            </View>

            <View style={styles.detailRightActions}>
              {renderSearchIconButton()}

              <TouchableOpacity
                style={styles.cartButton}
                activeOpacity={0.75}
                onPress={handleCartPress}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="cart-outline" size={19} color={colors.white} />

                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalItems > 99 ? "99+" : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {getPageTitle()}
            </Text>

            <View style={styles.headerActions}>
              {renderSearchIconButton()}

              <TouchableOpacity
                style={[styles.cartButton, { marginLeft: 0 }]}
                activeOpacity={0.75}
                onPress={handleCartPress}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="cart-outline" size={21} color={colors.white} />

                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalItems > 99 ? "99+" : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: colors.primaryDark,
  },

  header: {
    height: CUSTOMER_HEADER_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  detailTitleContainer: {
    position: "absolute",
    left: 60,
    right: 60,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * When the search icon also occupies the right side of a
   * detail-page header (Subcategory/Category detail pages
   * with search registered), the title needs extra right
   * clearance so it doesn't collide with/overlap the icon.
   */
  detailTitleContainerWithSearch: {
    right: 96,
  },

  detailTitle: {
    maxWidth: "100%",
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },

  detailRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },

  searchIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
});
