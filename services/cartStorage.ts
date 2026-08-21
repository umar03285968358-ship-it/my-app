import AsyncStorage from "@react-native-async-storage/async-storage";
import { MobProduct } from "./api";

const CART_KEY = "cart_items";

export interface StoredCartItem {
  product: MobProduct;
  quantity: number;
}

export async function saveCart(items: StoredCartItem[]) {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items ?? []));
  } catch (e) {
    console.log("[CART STORAGE] Failed to save cart:", e);
  }
}

export async function getCart(): Promise<StoredCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("[CART STORAGE] Failed to read cart:", e);
    return [];
  }
}

export async function clearCartStorage() {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch (e) {
    console.log("[CART STORAGE] Failed to clear cart:", e);
  }
}
