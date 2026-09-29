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

  const [userName, setUserName] = useState<string | null>(null);

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
          user?.username;

        setUserName(name ? String(name).trim() : null);
      } catch (error) {
        console.log("[CUSTOMER HEADER] Failed to load user:", error);

        if (mounted) {
          setUserName(null);
        }
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

  const isNotifications =
    pathname === "/notifications" ||
    pathname === "/(tabs)/notifications";

  const isPrivacyPolicy =
    pathname === "/privacy-policy" || pathname === "/(tabs)/privacy-policy";

  const isTermsConditions =
    pathname === "/terms-conditions" || pathname === "/(tabs)/terms-conditions";

  const isCategoryDetail = pathname.startsWith("/category/");
  const isSubcategoryDetail = pathname.startsWith("/subcategory/");
  const isProductDetail = pathname.startsWith("/product/");

  /* ===================================================
     CHECKOUT FLOW + ORDER SUCCESS

     app/checkout/address.tsx   -> /checkout/address
     app/checkout/payment.tsx   -> /checkout/payment
     app/checkout/review.tsx    -> /checkout/review
     app/checkout/summary.tsx   -> /checkout/summary
     app/order-success.tsx      -> /order-success
  =================================================== */

  const isCheckoutAddress = pathname === "/checkout/address";
  const isCheckoutPayment = pathname === "/checkout/payment";
  const isCheckoutReview = pathname === "/checkout/review";
  const isCheckoutSummary = pathname === "/checkout/summary";
  const isOrderSuccess = pathname === "/order-success";

  const isCheckoutFlow =
    isCheckoutAddress ||
    isCheckoutPayment ||
    isCheckoutReview ||
    isCheckoutSummary ||
    isOrderSuccess;

  const isDetailPage =
    isCategoryDetail ||
    isSubcategoryDetail ||
    isProductDetail ||
    isCheckoutFlow ||
    isPrivacyPolicy ||
    isTermsConditions;


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
    if (isHome) return userName ? `Hi, ${userName}` : "";
    if (isCategories) return "Categories";
    if (isCart) return "Cart";
    if (isOrders) return "Orders";
    if (isWishlist) return "Wishlist";
    if (isProfile) return "Profile";
    if (isNotifications) return "Notifications";
    if (isPrivacyPolicy) return "Privacy Policy";
    if (isTermsConditions) return "Terms & Conditions";

    if (isCategoryDetail) {
      if (currentCategory?.name) return currentCategory.name;
      return "Category";
    }

    if (isSubcategoryDetail) {
      if (currentSubcategory?.name) return currentSubcategory.name;
      return "Subcategory";
    }

    if (isProductDetail) return "Product Details";

    if (isCheckoutAddress) return "Delivery Address";
    if (isCheckoutPayment) return "Payment";
    if (isCheckoutReview) return "Review Order";
    if (isCheckoutSummary) return "Order Summary";
    if (isOrderSuccess) return "Order Confirmed";

    return "MY APP";
  };

  /*
   * ---------------------------------------------------------
   * CART NAVIGATION
   *
   * Remember the screen the customer is currently on before
   * opening Cart.
   *
   * Examples:
   *
   * Products -> Cart -> Back -> Products
   * Categories -> Cart -> Back -> Categories
   * Home -> Cart -> Back -> Home
   * Product Detail -> Cart -> Back -> Product Detail
   *
   * If Cart is opened directly from the Cart tab, no returnTo
   * parameter is added and normal navigation behavior remains.
   * ---------------------------------------------------------
   */
  const handleCartPress = () => {
    if (isCart) {
      return;
    }

    router.push({
      pathname: "/(tabs)/cart",
      params: {
        returnTo: pathname,
      },
    });
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

  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

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
                hitSlop={{ top: 6, bottom: 8, left: 6, right: 6 }}
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
    minWidth: 0,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
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
    minWidth: 0,
    overflow: "hidden",
  },

  detailTitleContainerWithSearch: {
    right: 96,
  },

  detailTitle: {
    maxWidth: "100%",
    minWidth: 0,
    flexShrink: 1,
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
    flexShrink: 0,
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