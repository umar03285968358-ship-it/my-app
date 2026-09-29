import {
  addRemoveFromWishlist,
  getMobWishlistProducts,
  MobProduct,
} from "@/services/api";
import {
  AuthChangeEvent,
  getUser,
  subscribeAuthChange,
} from "@/services/authStorage";
import { showToast } from "@/utils/toast";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

interface WishlistContextValue {
  wishlistProducts: MobProduct[];
  loading: boolean;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (
    product: MobProduct,
  ) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refetch: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext =
  createContext<WishlistContextValue | null>(
    null,
  );

const COLD_START_RETRY_ATTEMPTS = 3;
const COLD_START_RETRY_DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wishlistProducts, setWishlistProducts] =
    useState<MobProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const userIdRef = useRef<number | null>(null);

  const pending = useRef<Set<number>>(new Set());

  const fetchIdRef = useRef(0);

  const load = useCallback(
    async (opts?: { allowRetry?: boolean }) => {
      const allowRetry =
        opts?.allowRetry ?? true;

      const myFetchId =
        ++fetchIdRef.current;

      try {
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
          ) {
            return;
          }

          user = await getUser();

          attempts++;
        }

        if (
          myFetchId !==
          fetchIdRef.current
        ) {
          return;
        }

        const userId =
          user?.MobUserID ??
          user?.mobUserID ??
          user?.id ??
          null;

        userIdRef.current = userId;

        if (userId == null) {
          setWishlistProducts([]);
          return;
        }

        const data =
          await getMobWishlistProducts(
            userId,
          );

        if (
          myFetchId !==
          fetchIdRef.current
        ) {
          return;
        }

        setWishlistProducts(data);
      } catch (e) {
        console.log(
          "[WISHLIST] Failed to load:",
          e,
        );
      } finally {
        if (
          myFetchId ===
          fetchIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe =
      subscribeAuthChange(
        (event: AuthChangeEvent) => {
          if (event === "logout") {
            fetchIdRef.current++;

            userIdRef.current = null;

            setWishlistProducts([]);

            setLoading(false);
          } else if (event === "login") {
            load({
              allowRetry: false,
            });
          }
        },
      );

    return unsubscribe;
  }, [load]);

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        "change",
        (nextState) => {
          if (
            nextState === "active" &&
            userIdRef.current == null
          ) {
            load();
          }
        },
      );

    return () =>
      subscription.remove();
  }, [load]);

  const isWishlisted = useCallback(
    (productId: number) =>
      wishlistProducts.some(
        (p) =>
          p.productID === productId,
      ),
    [wishlistProducts],
  );

  const toggleWishlist =
    useCallback(
      async (product: MobProduct) => {
        const userId =
          userIdRef.current;

        if (userId == null) {
          showToast(
            "Please log in to save favourites",
            "error",
          );

          return;
        }

        if (
          pending.current.has(
            product.productID,
          )
        ) {
          return;
        }

        pending.current.add(
          product.productID,
        );

        const currentlyLiked =
          wishlistProducts.some(
            (p) =>
              p.productID ===
              product.productID,
          );

        const nextFavStatus =
          !currentlyLiked;

        setWishlistProducts(
          (prev) =>
            nextFavStatus
              ? [...prev, product]
              : prev.filter(
                  (p) =>
                    p.productID !==
                    product.productID,
                ),
        );

        try {
          await addRemoveFromWishlist({
            productID:
              product.productID,
            mobUserID: userId,
            favStatus:
              nextFavStatus,
          });

          showToast(
            nextFavStatus
              ? "Added to favourites"
              : "Removed from favourites",
            nextFavStatus
              ? "success"
              : "info",
          );
        } catch (e: any) {
          setWishlistProducts(
            (prev) =>
              nextFavStatus
                ? prev.filter(
                    (p) =>
                      p.productID !==
                      product.productID,
                  )
                : [
                    ...prev,
                    product,
                  ],
          );

          showToast(
            e?.message ||
              "Something went wrong. Please try again.",
            "error",
          );
        } finally {
          pending.current.delete(
            product.productID,
          );
        }
      },
      [wishlistProducts],
    );

  /*
   * Clear the entire wishlist.
   *
   * The existing wishlist API is used with favStatus=false
   * for every currently saved product.
   */
  const clearWishlist =
    useCallback(async () => {
      const userId =
        userIdRef.current;

      if (userId == null) {
        showToast(
          "Please log in to manage your wishlist",
          "error",
        );

        return;
      }

      if (wishlistProducts.length === 0) {
        return;
      }

      const productsToClear = [
        ...wishlistProducts,
      ];

      const productIds =
        productsToClear.map(
          (product) =>
            product.productID,
        );

      // Optimistically clear the UI immediately.
      setWishlistProducts([]);

      try {
        await Promise.all(
          productIds.map((productID) =>
            addRemoveFromWishlist({
              productID,
              mobUserID: userId,
              favStatus: false,
            }),
          ),
        );

        showToast(
          "Wishlist cleared",
          "success",
        );
      } catch (e: any) {
        console.log(
          "[WISHLIST] Failed to clear wishlist:",
          e,
        );

        // Re-fetch from the server so the UI reflects
        // exactly what was successfully removed.
        await load({
          allowRetry: false,
        });

        showToast(
          e?.message ||
            "Some wishlist items could not be removed. Please try again.",
          "error",
        );
      }
    }, [wishlistProducts, load]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistProducts,
        loading,
        isWishlisted,
        toggleWishlist,
        clearWishlist,

        refetch: load,

        refreshWishlist: () => load(),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx =
    useContext(WishlistContext);

  if (!ctx) {
    throw new Error(
      "useWishlist must be used within a WishlistProvider",
    );
  }

  return ctx;
}