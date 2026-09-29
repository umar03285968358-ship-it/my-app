
import {
  CUSTOMER_HEADER_HEIGHT,
} from "@/components/CustomerHeader";
import { colors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { items } = useCart();
  const { wishlistProducts } = useWishlist();

  const insets = useSafeAreaInsets();

  const cartCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const hasWishlistItems =
    wishlistProducts.length > 0;

  const headerHeight =
    CUSTOMER_HEADER_HEIGHT + insets.top;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor:
            colors.primaryDark,

          tabBarInactiveTintColor:
            colors.textSecondary,

          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },

          sceneStyle: {
            paddingTop: headerHeight,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="home-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="grid-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <View
                style={[
                  styles.cartIconWrapper,
                  {
                    width: size + 8,
                    height: size + 8,
                  },
                ]}
              >
                <Ionicons
                  name="cart-outline"
                  size={size}
                  color={color}
                />

                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99
                        ? "99+"
                        : cartCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="receipt-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <View
                style={[
                  styles.wishlistIconWrapper,
                  {
                    width: size + 8,
                    height: size + 8,
                  },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={size}
                  color={color}
                />

                {hasWishlistItems && (
                  <View
                    style={styles.wishlistDot}
                  />
                )}
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",

            tabBarIcon: ({
              color,
              size,
            }) => (
              <Ionicons
                name="person-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* =====================================================
            NOTIFICATIONS

            Notifications stays inside the Tabs layout so it
            receives the same footer.

            href: null hides Notifications from the footer.
            ===================================================== */}
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            title: "Notifications",
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },

  cartIconWrapper: {
    position: "relative" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  badge: {
    position: "absolute" as const,
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700" as const,
    lineHeight: 11,
    textAlign: "center" as const,
  },

  wishlistIconWrapper: {
    position: "relative" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  wishlistDot: {
    position: "absolute" as const,
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#F59E0B",
    borderWidth: 1.5,
    borderColor: colors.card,
  },
};