import AsyncStorage from "@react-native-async-storage/async-storage";

import { MobProduct } from "./api";

// FIX: this used to be a single hardcoded key ("cart_items") shared by
// EVERY account that ever logged into the device — user A's cart was
// literally user B's cart the moment B logged in. Every cart operation
// now takes a `userKey` (the logged-in user's id, or "guest" when
// nobody is logged in) and reads/writes a key scoped to that user.
const CART_KEY_PREFIX = "cart_items";
export const GUEST_CART_KEY = "guest";

export interface StoredCartItem {
  product: MobProduct;
  quantity: number;
}

export function getCartStorageKey(userKey: string | number | null): string {
  const safeKey = userKey == null ? GUEST_CART_KEY : String(userKey);
  return `${CART_KEY_PREFIX}:${safeKey}`;
}

export async function saveCart(
  userKey: string | number | null,
  items: StoredCartItem[],
) {
  const storageKey = getCartStorageKey(userKey);

  try {
    console.log("========================================");
    console.log("[CART STORAGE] saveCart()");
    console.log("[CART STORAGE] Storage key:", storageKey);
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
      storageKey,
      cartJSON
    );

    console.log(
      "[CART STORAGE] Cart saved successfully"
    );

    // Verify
    const savedCart =
      await AsyncStorage.getItem(storageKey);

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

export async function getCart(
  userKey: string | number | null,
): Promise<StoredCartItem[]> {
  const storageKey = getCartStorageKey(userKey);

  try {
    console.log("========================================");
    console.log("[CART STORAGE] getCart()");
    console.log("[CART STORAGE] Storage key:", storageKey);

    const raw =
      await AsyncStorage.getItem(storageKey);

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

export async function clearCartStorage(
  userKey: string | number | null,
) {
  const storageKey = getCartStorageKey(userKey);

  try {
    console.log("========================================");
    console.log("[CART STORAGE] clearCartStorage()");
    console.log(
      "[CART STORAGE] Removing:",
      storageKey
    );

    // Check before deleting
    const cartBefore =
      await AsyncStorage.getItem(storageKey);

    console.log(
      "[CART STORAGE] Cart BEFORE clear:",
      cartBefore
    );

    await AsyncStorage.removeItem(storageKey);

    console.log(
      "[CART STORAGE] Cart removeItem completed"
    );

    // Verify deletion
    const cartAfter =
      await AsyncStorage.getItem(storageKey);

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

/**
 * Wipes every per-user cart bucket ever written on this device.
 * Only use this for a genuine "factory reset" style action — normal
 * logout should NOT call this, since it would delete other still
 * logged-out users' saved carts too. Regular logout should just stop
 * reading/writing the current user's key (handled by CartContext).
 */
export async function clearAllCartStorages() {
  try {
    console.log("========================================");
    console.log("[CART STORAGE] clearAllCartStorages()");

    const keys = await AsyncStorage.getAllKeys();
    const cartKeys = keys.filter((k) => k.startsWith(`${CART_KEY_PREFIX}:`));

    console.log("[CART STORAGE] Cart keys found:", cartKeys);

    if (cartKeys.length > 0) {
      await AsyncStorage.multiRemove(cartKeys);
      console.log("[CART STORAGE] ✅ All per-user carts removed");
    } else {
      console.log("[CART STORAGE] No per-user cart keys to remove");
    }

    console.log("========================================");
  } catch (e) {
    console.log(
      "[CART STORAGE] Failed to clear all cart storages:",
      e
    );
  }
}