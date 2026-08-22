import AsyncStorage from "@react-native-async-storage/async-storage";

import { MobProduct } from "./api";

const CART_KEY = "cart_items";

export interface StoredCartItem {
  product: MobProduct;
  quantity: number;
}

export async function saveCart(items: StoredCartItem[]) {
  try {
    console.log("========================================");
    console.log("[CART STORAGE] saveCart()");
    console.log("[CART STORAGE] CART_KEY:", CART_KEY);
    console.log("[CART STORAGE] Items:", items);
    console.log(
      "[CART STORAGE] Item count:",
      items?.length ?? 0
    );

    const cartJSON = JSON.stringify(items ?? []);

    console.log(
      "[CART STORAGE] Cart JSON:",
      cartJSON
    );

    await AsyncStorage.setItem(
      CART_KEY,
      cartJSON
    );

    console.log(
      "[CART STORAGE] Cart saved successfully"
    );

    // Verify
    const savedCart =
      await AsyncStorage.getItem(CART_KEY);

    console.log(
      "[CART STORAGE] Cart after save:",
      savedCart
    );

    console.log("========================================");
  } catch (e) {
    console.log(
      "[CART STORAGE] Failed to save cart:",
      e
    );
  }
}

export async function getCart(): Promise<StoredCartItem[]> {
  try {
    console.log("========================================");
    console.log("[CART STORAGE] getCart()");
    console.log("[CART STORAGE] CART_KEY:", CART_KEY);

    const raw =
      await AsyncStorage.getItem(CART_KEY);

    console.log(
      "[CART STORAGE] Raw stored cart:",
      raw
    );

    if (!raw) {
      console.log(
        "[CART STORAGE] No cart found"
      );

      console.log("========================================");

      return [];
    }

    const cart = JSON.parse(raw);

    console.log(
      "[CART STORAGE] Parsed cart:",
      cart
    );

    console.log(
      "[CART STORAGE] Cart item count:",
      cart?.length ?? 0
    );

    console.log("========================================");

    return cart;
  } catch (e) {
    console.log(
      "[CART STORAGE] Failed to read cart:",
      e
    );

    return [];
  }
}

export async function clearCartStorage() {
  try {
    console.log("========================================");
    console.log("[CART STORAGE] clearCartStorage()");
    console.log(
      "[CART STORAGE] Removing:",
      CART_KEY
    );

    // Check before deleting
    const cartBefore =
      await AsyncStorage.getItem(CART_KEY);

    console.log(
      "[CART STORAGE] Cart BEFORE clear:",
      cartBefore
    );

    await AsyncStorage.removeItem(CART_KEY);

    console.log(
      "[CART STORAGE] Cart removeItem completed"
    );

    // Verify deletion
    const cartAfter =
      await AsyncStorage.getItem(CART_KEY);

    console.log(
      "[CART STORAGE] Cart AFTER clear:",
      cartAfter
    );

    console.log(
      "[CART STORAGE] Cart cleared:",
      cartAfter === null
    );

    if (cartAfter === null) {
      console.log(
        "[CART STORAGE] ✅ CART STORAGE COMPLETELY CLEARED"
      );
    } else {
      console.log(
        "[CART STORAGE] ❌ CART STORAGE WAS NOT CLEARED"
      );
    }

    console.log("========================================");
  } catch (e) {
    console.log(
      "[CART STORAGE] Failed to clear cart:",
      e
    );
  }
}