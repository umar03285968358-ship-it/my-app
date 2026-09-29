
import { MobProduct } from "@/services/api";
import {
  AuthChangeEvent,
  getUser,
  subscribeAuthChange,
} from "@/services/authStorage";
import {
  clearCartStorage,
  getCart,
  saveCart,
} from "@/services/cartStorage";
import { getDiscountedPrice } from "@/utils/pricing";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

export interface CartItem {
  product: MobProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  addToCart: (
    product: MobProduct,
    quantity?: number,
  ) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (
    productId: number,
    quantity: number,
  ) => void;
  getItemQuantity: (
    productId: number,
  ) => number;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// TODO: replace with your real delivery-fee logic (flat, distance-based, or from an API)
const DELIVERY_FEE = 0;

const CartContext =
  createContext<CartContextValue | null>(null);

// Cold-start safety net — same rationale as WishlistContext: the very
// first AsyncStorage/SecureStore read on a fresh app launch can race
// with native module hydration and come back empty even though a
// session actually exists. Retry a few times before giving up.
const COLD_START_RETRY_ATTEMPTS = 3;
const COLD_START_RETRY_DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const hasLoaded =
    useRef(false);

  // Which "bucket" we're currently reading/writing. null means "no
  // logged-in user" (guest cart). getCart/saveCart/clearCartStorage
  // treat null as the guest key internally.
  const userKeyRef =
    useRef<string | number | null>(null);

  // Bumped on every load() call, mirrors the same stale-response guard
  // used in WishlistContext — prevents a slow in-flight read for the
  // PREVIOUS user from clobbering the cart after a fast logout/login.
  const fetchIdRef =
    useRef(0);

  const load = useCallback(
    async (
      opts?: { allowRetry?: boolean },
    ) => {
      const allowRetry =
        opts?.allowRetry ?? true;

      const myFetchId =
        ++fetchIdRef.current;

      try {
        // Block the persist effect from writing anything under the old
        // key while we're mid-switch.
        hasLoaded.current = false;

        setLoading(true);

        let user = await getUser();

        let attempts = 0;

        while (
          !user &&
          allowRetry &&
          attempts <
            COLD_START_RETRY_ATTEMPTS
        ) {
          await delay(
            COLD_START_RETRY_DELAY_MS,
          );

          if (
            myFetchId !==
            fetchIdRef.current
          )
            return; // superseded

          user = await getUser();

          attempts++;
        }

        if (
          myFetchId !==
          fetchIdRef.current
        )
          return; // superseded

        // TODO: confirm the real field name from your login/signup response
        const userId =
          user?.MobUserID ??
          user?.mobUserID ??
          user?.id ??
          null;

        userKeyRef.current =
          userId;

        const stored =
          await getCart(userId);

        if (
          myFetchId !==
          fetchIdRef.current
        )
          return; // superseded

        setItems(stored);
      } catch (e) {
        console.log(
          "[CART] Failed to load:",
          e,
        );
      } finally {
        if (
          myFetchId ===
          fetchIdRef.current
        ) {
          hasLoaded.current =
            true;

          setLoading(false);
        }
      }
    },
    [],
  );

  // Initial load when the provider mounts.
  useEffect(() => {
    load();
  }, [load]);

  // 🔔 React to login/logout as they happen — same fix as
  // WishlistContext. Without this, a cart loaded for user A stays in
  // memory (and on the very first mount-only load, could even have
  // been user A's cart loaded for user B) because nothing ever told
  // this provider the account changed.
  useEffect(() => {
    const unsubscribe =
      subscribeAuthChange(
        (
          event: AuthChangeEvent,
        ) => {
          if (
            event === "logout"
          ) {
            fetchIdRef.current++;
            hasLoaded.current =
              false;
            userKeyRef.current =
              null;

            setItems([]);

            setLoading(false);

            // Note: we deliberately do NOT delete the cart from storage
            // here — it stays saved under that user's own key so it's
            // there again next time they log back in. It's just no
            // longer visible in memory for whoever uses the app next.
          } else if (
            event === "login"
          ) {
            load({
              allowRetry: false,
            });
          }
        },
      );

    return unsubscribe;
  }, [load]);

  // Extra safety net for the cold-start race: if the app comes to the
  // foreground and we still ended up with nothing loaded, try again.
  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        "change",
        (nextState) => {
          if (
            nextState ===
              "active" &&
            !hasLoaded.current
          ) {
            load();
          }
        },
      );

    return () =>
      subscription.remove();
  }, [load]);

  // Persist on every change, but only once the current user's cart has
  // actually finished loading (guards against overwriting storage with
  // an empty array on boot, and against writing under the wrong key
  // mid-switch between users).
  useEffect(() => {
    if (!hasLoaded.current)
      return;

    saveCart(
      userKeyRef.current,
      items,
    );
  }, [items]);

  const addToCart = useCallback(
    (
      product: MobProduct,
      quantity = 1,
    ) => {
      setItems((prev) => {
        const existing =
          prev.find(
            (i) =>
              i.product.productID ===
              product.productID,
          );

        if (existing) {
          return prev.map((i) =>
            i.product.productID ===
            product.productID
              ? {
                  ...i,
                  quantity:
                    i.quantity +
                    quantity,
                }
              : i,
          );
        }

        return [
          ...prev,
          {
            product,
            quantity,
          },
        ];
      });
    },
    [],
  );

  const removeFromCart =
    useCallback(
      (productId: number) => {
        setItems((prev) =>
          prev.filter(
            (i) =>
              i.product.productID !==
              productId,
          ),
        );
      },
      [],
    );

  const updateQty = useCallback(
    (
      productId: number,
      quantity: number,
    ) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) =>
              i.product.productID !==
              productId,
          ),
        );

        return;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.product.productID ===
          productId
            ? {
                ...i,
                quantity,
              }
            : i,
        ),
      );
    },
    [],
  );

  const getItemQuantity =
    useCallback(
      (productId: number) =>
        items.find(
          (i) =>
            i.product.productID ===
            productId,
        )?.quantity ?? 0,
      [items],
    );

  const clearCart =
    useCallback(async () => {
      setItems([]);

      await clearCartStorage(
        userKeyRef.current,
      );
    }, []);

  const totalItems =
    items.reduce(
      (sum, i) =>
        sum + i.quantity,
      0,
    );

  const subtotal =
    items.reduce(
      (sum, i) =>
        sum +
        getDiscountedPrice(
          i.product,
        ) *
          i.quantity,
      0,
    );

  const deliveryFee =
    items.length > 0
      ? DELIVERY_FEE
      : 0;

  const total =
    subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateQty,
        getItemQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx =
    useContext(CartContext);

  if (!ctx)
    throw new Error(
      "useCart must be used within a CartProvider",
    );

  return ctx;
}

