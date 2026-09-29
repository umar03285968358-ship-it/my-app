import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  router,
  Stack,
  usePathname,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { BackHandler, ToastAndroid, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import CustomerHeader, {
  CUSTOMER_HEADER_HEIGHT,
} from "@/components/CustomerHeader";
import StatusBarBackground from "@/components/StatusBarBackground";
import { colors } from "@/constants/theme";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { HeaderSearchProvider } from "@/context/HeaderSearchContext";
import { WishlistProvider } from "@/context/WishlistContext";
import {
  AuthChangeEvent,
  getToken,
  getUser,
  subscribeAuthChange,
} from "@/services/authStorage";
import {
  getOneSignalSubscriptionId,
  initializeOneSignal,
  requestOneSignalPermission,
} from "@/services/oneSignal";
import { resolvePostLoginRoute } from "@/utils/authRouting";

export const unstable_settings = {
  anchor: "(auth)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

type UserRole = "rider" | "admin" | "customer";

function deriveUserType(user: any): UserRole {
  const userType = String(user?.userType ?? "")
    .trim()
    .toLowerCase();

  if (userType === "rider") return "rider";
  if (userType === "admin") return "admin";
  return "customer";
}

interface AuthState {
  checked: boolean;
  loggedIn: boolean;
  userType: UserRole;
}

export default function RootLayout() {
  const navigationState = useRootNavigationState();

  const [authState, setAuthState] = useState<AuthState>({
    checked: false,
    loggedIn: false,
    userType: "customer",
  });

  // --------------------------------------------------------------
  // ONESIGNAL INITIALIZATION
  // --------------------------------------------------------------

  useEffect(() => {
    const setupOneSignal = async () => {
      initializeOneSignal();
      await requestOneSignalPermission();
      await getOneSignalSubscriptionId();
    };

    setupOneSignal();
  }, []);

  const lastRedirectedFor = useRef<string | null>(null);

  // --------------------------------------------------------------
  // INITIAL AUTH CHECK
  // --------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const user = token ? await getUser() : null;

        setAuthState({
          checked: true,
          loggedIn: !!token,
          userType: deriveUserType(user),
        });
      } catch (e) {
        console.error("[ROOT LAYOUT] Auth check failed:", e);

        setAuthState({
          checked: true,
          loggedIn: false,
          userType: "customer",
        });
      }
    })();
  }, []);

  // --------------------------------------------------------------
  // LOGIN / LOGOUT
  // --------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(
      (event: AuthChangeEvent, user: any | null) => {
        if (event === "logout") {
          lastRedirectedFor.current = null;

          setAuthState({
            checked: true,
            loggedIn: false,
            userType: "customer",
          });
        } else if (event === "login") {
          lastRedirectedFor.current = null;

          setAuthState({
            checked: true,
            loggedIn: true,
            userType: deriveUserType(user),
          });
        }
      },
    );

    return unsubscribe;
  }, []);

  // --------------------------------------------------------------
  // AUTH REDIRECT
  // --------------------------------------------------------------

  useEffect(() => {
    if (!authState.checked) return;
    if (!navigationState?.key) return;

    const target = authState.loggedIn
      ? resolvePostLoginRoute({ userType: authState.userType })
      : "/(auth)/login";

    if (lastRedirectedFor.current === target) return;

    lastRedirectedFor.current = target;

    router.replace(target as Parameters<typeof router.replace>[0]);

    SplashScreen.hideAsync().catch(() => {});
  }, [
    authState.checked,
    authState.loggedIn,
    authState.userType,
    navigationState?.key,
  ]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeaderSearchProvider>
        <SafeAreaProvider>
          <CartProvider>
            <CheckoutProvider>
              <WishlistProvider>
                <ThemeProvider value={DefaultTheme}>
                  {/*
                   * CRITICAL: don't mount the Stack at all until the
                   * auth check resolves. While `checked` is false,
                   * every Stack.Protected guard below evaluates to
                   * false, which means NO guarded group is registered
                   * — but any route file living outside a
                   * Stack.Protected block (e.g. notifications.tsx)
                   * would still be reachable and could flash as the
                   * default screen. Rendering a plain background
                   * view instead guarantees nothing can flash.
                   */}
                  {authState.checked ? (
                    <RootContent authState={authState} />
                  ) : (
                    <View
                      style={{ flex: 1, backgroundColor: colors.background }}
                    />
                  )}

                  <StatusBarBackground />
                  <StatusBar style="light" />
                </ThemeProvider>
              </WishlistProvider>
            </CheckoutProvider>
          </CartProvider>
        </SafeAreaProvider>
      </HeaderSearchProvider>
    </GestureHandlerRootView>
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
 * /notifications
 *
 * But it must NOT appear on auth, rider, or admin screens.
 */
function RootContent({ authState }: { authState: AuthState }) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();

  const headerHeight = CUSTOMER_HEADER_HEIGHT + insets.top;

  const rootSegment = segments[0];

  const isAuthGroup = rootSegment === "(auth)";
  const isRiderGroup = rootSegment === "(rider)";
  const isAdminGroup = rootSegment === "(admin)";

  const showCustomerHeader = !isAuthGroup && !isRiderGroup && !isAdminGroup;

  const isCustomerLoggedIn =
    authState.checked &&
    authState.loggedIn &&
    authState.userType === "customer";

  const isRiderLoggedIn =
    authState.checked && authState.loggedIn && authState.userType === "rider";

  const isAdminLoggedIn =
    authState.checked && authState.loggedIn && authState.userType === "admin";

  const isLoggedOut = authState.checked && !authState.loggedIn;

  // --------------------------------------------------------------
  // ANDROID BACK BUTTON
  // --------------------------------------------------------------

  const lastBackPress = useRef(0);

  const isHome =
    pathname === "/" ||
    pathname === "/(tabs)" ||
    pathname === "/(tabs)/" ||
    pathname === "/(tabs)/index";

  useEffect(() => {
    const handleBackPress = () => {
      if (!isHome) {
        return false;
      }

      const currentTime = Date.now();

      if (currentTime - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPress.current = currentTime;

      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => {
      subscription.remove();
    };
  }, [isHome]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* AUTH */}

        <Stack.Protected guard={isLoggedOut}>
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        {/* CUSTOMER */}

        <Stack.Protected guard={isCustomerLoggedIn}>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="category/[id]"
            options={{
              headerShown: false,
              contentStyle: {
                paddingTop: headerHeight,
                backgroundColor: colors.background,
              },
            }}
          />

          <Stack.Screen
            name="subcategory/[id]"
            options={{
              headerShown: false,
              contentStyle: {
                paddingTop: headerHeight,
                backgroundColor: colors.background,
              },
            }}
          />

          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: false,
              contentStyle: {
                paddingTop: headerHeight,
                backgroundColor: colors.background,
              },
            }}
          />

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

          <Stack.Screen
            name="order-success"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="notifications"
            options={{
              headerShown: false,
              contentStyle: {
                paddingTop: headerHeight,
                backgroundColor: colors.background,
              },
            }}
          />

          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
            }}
          />
        </Stack.Protected>

        {/* RIDER */}

        <Stack.Protected guard={isRiderLoggedIn}>
          <Stack.Screen
            name="(rider)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        {/* ADMIN */}

        <Stack.Protected guard={isAdminLoggedIn}>
          <Stack.Screen
            name="(admin)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
      </Stack>

      {showCustomerHeader && <CustomerHeader />}
    </View>
  );
}
