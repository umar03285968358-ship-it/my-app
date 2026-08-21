import {
  addRemoveFromWishlist,
  getMobWishlistProducts,
  MobProduct,
} from "@/services/api";
import { getUser } from "@/services/authStorage";
import { showToast } from "@/utils/toast";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface WishlistContextValue {
  wishlistProducts: MobProduct[];
  loading: boolean;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (product: MobProduct) => Promise<void>;
  refetch: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<MobProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<number | null>(null);
  const pending = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const user = await getUser();
      // TODO: confirm the real field name from your login/signup response
      const userId = user?.MobUserID ?? user?.mobUserID ?? user?.id ?? null;
      userIdRef.current = userId;

      if (userId == null) {
        setWishlistProducts([]);
        return;
      }
      setLoading(true);
      const data = await getMobWishlistProducts(userId);
      setWishlistProducts(data);
    } catch (e) {
      console.log("[WISHLIST] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isWishlisted = useCallback(
    (productId: number) =>
      wishlistProducts.some((p) => p.productID === productId),
    [wishlistProducts],
  );

  const toggleWishlist = useCallback(
    async (product: MobProduct) => {
      const userId = userIdRef.current;
      if (userId == null) {
        showToast("Please log in to save favourites", "error");
        return;
      }
      if (pending.current.has(product.productID)) return; // guard against double-tap
      pending.current.add(product.productID);

      const currentlyLiked = wishlistProducts.some(
        (p) => p.productID === product.productID,
      );
      const nextFavStatus = !currentlyLiked;

      // optimistic UI update
      setWishlistProducts((prev) =>
        nextFavStatus
          ? [...prev, product]
          : prev.filter((p) => p.productID !== product.productID),
      );

      try {
        await addRemoveFromWishlist({
          productID: product.productID,
          mobUserID: userId,
          favStatus: nextFavStatus,
        });
        showToast(
          nextFavStatus ? "Added to favourites" : "Removed from favourites",
          nextFavStatus ? "success" : "info",
        );
      } catch (e: any) {
        // rollback on failure
        setWishlistProducts((prev) =>
          nextFavStatus
            ? prev.filter((p) => p.productID !== product.productID)
            : [...prev, product],
        );
        showToast(
          e?.message || "Something went wrong. Please try again.",
          "error",
        );
      } finally {
        pending.current.delete(product.productID);
      }
    },
    [wishlistProducts],
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistProducts,
        loading,
        isWishlisted,
        toggleWishlist,
        refetch: load,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
