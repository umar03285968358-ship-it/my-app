import { MobProduct } from "@/services/api";
import { clearCartStorage, getCart, saveCart } from "@/services/cartStorage";
import { getDiscountedPrice } from "@/utils/pricing";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface CartItem {
  product: MobProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: MobProduct, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  getItemQuantity: (productId: number) => number;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// TODO: replace with your real delivery-fee logic (flat, distance-based, or from an API)
const DELIVERY_FEE = 0;
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  // Load persisted cart once on mount, BEFORE anything is allowed to persist,
  // so we never accidentally overwrite storage with an empty array on boot.
  useEffect(() => {
    (async () => {
      const stored = await getCart();
      setItems(stored);
      hasLoaded.current = true;
      setLoading(false);
    })();
  }, []);

  // Persist on every change, but only after the initial load has finished.
  useEffect(() => {
    if (!hasLoaded.current) return;
    saveCart(items);
  }, [items]);

  const addToCart = useCallback((product: MobProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.productID === product.productID,
      );
      if (existing) {
        return prev.map((i) =>
          i.product.productID === product.productID
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.productID !== productId));
  }, []);

  const updateQty = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.productID !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.productID === productId ? { ...i, quantity } : i,
      ),
    );
  }, []);

  const getItemQuantity = useCallback(
    (productId: number) =>
      items.find((i) => i.product.productID === productId)?.quantity ?? 0,
    [items],
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    await clearCartStorage();
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce(
    (sum, i) => sum + getDiscountedPrice(i.product) * i.quantity,
    0,
  );
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

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
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
