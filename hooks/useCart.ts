import { MobProduct } from "@/services/api";
import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  product: MobProduct;
  quantity: number;
}

let cartItems: CartItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

// TODO: no stock field exists on MobProduct yet — replace Infinity with
// product.stockQuantity (or whatever your backend calls it) once confirmed.
function getStock(_product: MobProduct): number {
  return Infinity;
}

export function getCartQuantity(productId: number): number {
  return (
    cartItems.find((i) => i.product.productID === productId)?.quantity ?? 0
  );
}

export function setCartQuantity(product: MobProduct, quantity: number) {
  const stock = getStock(product);
  const clamped = Math.max(0, Math.min(quantity, stock));
  const existing = cartItems.find(
    (i) => i.product.productID === product.productID,
  );

  if (clamped === 0) {
    cartItems = cartItems.filter(
      (i) => i.product.productID !== product.productID,
    );
  } else if (existing) {
    existing.quantity = clamped;
    cartItems = [...cartItems];
  } else {
    cartItems = [...cartItems, { product, quantity: clamped }];
  }
  notify();
}

export function useCart() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addToCart = useCallback((product: MobProduct, quantity: number) => {
    setCartQuantity(product, quantity);
  }, []);

  return {
    cartItems,
    addToCart,
    getCartQuantity,
    totalItems: cartItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}
