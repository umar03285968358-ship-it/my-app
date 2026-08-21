import {
  CUSTOMER_HEADER_HEIGHT,
} from "@/components/CustomerHeader";
import { colors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { items } = useCart();

  const insets = useSafeAreaInsets();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const headerHeight = CUSTOMER_HEADER_HEIGHT + insets.top;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.textSecondary,

          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },

          /*
           * Reserve exactly the amount of space occupied
           * by CustomerHeader.
           *
           * This prevents Categories, Orders, Cart, etc.
           * from rendering underneath the header.
           */
          sceneStyle: {
            paddingTop: headerHeight,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            ),

            tabBarBadge: cartCount > 0 ? cartCount : undefined,
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Header stays visually on top */}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
};
