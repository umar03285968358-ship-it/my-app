import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  router,
  Stack,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import CustomerHeader, {
  CUSTOMER_HEADER_HEIGHT,
} from "@/components/CustomerHeader";
import StatusBarBackground from "@/components/StatusBarBackground";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { HeaderSearchProvider } from "@/context/HeaderSearchContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getToken, getUser } from "@/services/authStorage";

export const unstable_settings = {
  anchor: "(auth)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

type LandingRoute = "/(rider)/dashboard" | "/(tabs)";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationState = useRootNavigationState();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const [landingRoute, setLandingRoute] = useState<LandingRoute>("/(tabs)");

  const hasRedirected = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();

        setHasToken(!!token);

        if (token) {
          const user = await getUser();

          const userType = String(user?.userType ?? "")
            .trim()
            .toLowerCase();

          setLandingRoute(
            userType === "rider" ? "/(rider)/dashboard" : "/(tabs)",
          );
        }
      } catch (e) {
        console.log("[ROOT LAYOUT] Auth check failed:", e);

        setHasToken(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!navigationState?.key) return;
    if (hasRedirected.current) return;

    hasRedirected.current = true;

    if (hasToken) {
      router.replace(landingRoute as Parameters<typeof router.replace>[0]);
    } else {
      router.replace("/(auth)/login");
    }

    SplashScreen.hideAsync().catch(() => {});
  }, [authChecked, navigationState?.key, hasToken, landingRoute]);

  return (
    <HeaderSearchProvider>
      <SafeAreaProvider>
        <CartProvider>
          <CheckoutProvider>
            <WishlistProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <RootContent />

                <StatusBarBackground />
                <StatusBar style="light" />
              </ThemeProvider>
            </WishlistProvider>
          </CheckoutProvider>
        </CartProvider>
      </SafeAreaProvider>
    </HeaderSearchProvider>
  );
}

/**
 * Root content
 *
 * CustomerHeader is mounted here instead of inside
 * the Tabs layout so it can also appear on:
 *
 * /category/[id]
 * /subcategory/[id]
 * /product/[id]
 *
 * But it must NOT appear on auth screens (login,
 * signup, otp, etc.) or on the rider app, since
 * CustomerHeader is customer-only chrome (cart icon,
 * customer page titles, customer search). We use
 * useSegments() rather than usePathname() here because
 * segments preserve the route GROUP name ("(auth)"),
 * while usePathname() strips group parentheses and
 * would make "(auth)" indistinguishable from "(tabs)".
 */
function RootContent() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const headerHeight = CUSTOMER_HEADER_HEIGHT + insets.top;

  const rootSegment = segments[0];
  const isAuthGroup = rootSegment === "(auth)";
  const isRiderGroup = rootSegment === "(rider)";

  const showCustomerHeader = !isAuthGroup && !isRiderGroup;

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* ================================
            AUTH
        ================================= */}

        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        {/* ================================
            CUSTOMER TABS
        ================================= */}

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* ================================
            RIDER
        ================================= */}

        <Stack.Screen
          name="(rider)"
          options={{
            headerShown: false,
          }}
        />

        {/* ================================
            CATEGORY DETAIL
        ================================= */}

        <Stack.Screen
          name="category/[id]"
          options={{
            headerShown: false,

            contentStyle: {
              paddingTop: headerHeight,
            },
          }}
        />

        {/* ================================
            SUBCATEGORY DETAIL
        ================================= */}

        <Stack.Screen
          name="subcategory/[id]"
          options={{
            headerShown: false,

            contentStyle: {
              paddingTop: headerHeight,
            },
          }}
        />

        {/* ================================
            PRODUCT DETAIL
        ================================= */}

        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: false,

            contentStyle: {
              paddingTop: headerHeight,
            },
          }}
        />

        {/* ================================
            CHECKOUT
        ================================= */}

        <Stack.Screen
          name="checkout/address"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="checkout/payment"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="checkout/summary"
          options={{
            headerShown: false,
          }}
        />

        {/* ================================
            ORDER SUCCESS
        ================================= */}

        <Stack.Screen
          name="order-success"
          options={{
            headerShown: false,
          }}
        />

        {/* ================================
            MODAL
        ================================= */}

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      {/*
       * Global customer header.
       *
       * Only mounted for customer-facing routes.
       * Hidden entirely on (auth) and (rider) groups
       * so login/signup/otp/rider screens render with
       * no customer chrome at all.
       */}
      {showCustomerHeader && <CustomerHeader />}
    </View>
  );
}
