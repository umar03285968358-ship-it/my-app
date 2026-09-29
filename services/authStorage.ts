import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/**
 * ============================================================
 * AUTH CHANGE EVENT BUS
 * ============================================================
 *
 * FIX FOR: wishlist (and any other per-user cached data) leaking
 * between accounts on the same device.
 *
 * Any screen-level context (WishlistProvider, CartProvider, etc.)
 * that caches data tied to the logged-in user needs to know the
 * INSTANT a login or logout happens — not just once when the
 * provider first mounts. Providers usually mount once near the
 * root of the app and never unmount across a logout -> login
 * transition, so a `useEffect(() => { load() }, [])` never fires
 * again once the user changes.
 *
 * This tiny pub/sub lets `saveSession()` / `clearSession()` notify
 * every subscriber the moment auth state changes, so consumers can
 * clear stale data (on logout) or refetch fresh data (on login).
 */
export type AuthChangeEvent = "login" | "logout";
export type AuthChangeListener = (
  event: AuthChangeEvent,
  user: any | null
) => void;

const authListeners = new Set<AuthChangeListener>();

export function subscribeAuthChange(
  listener: AuthChangeListener
): () => void {
  authListeners.add(listener);

  // return an unsubscribe function
  return () => {
    authListeners.delete(listener);
  };
}

function emitAuthChange(event: AuthChangeEvent, user: any | null) {
  authListeners.forEach((listener) => {
    try {
      listener(event, user);
    } catch (error) {
      console.warn(
        "[AUTH STORAGE] A subscribed auth-change listener threw:",
        error
      );
    }
  });
}

/**
 * ============================================================
 * SAVE SESSION
 * ============================================================
 */
export async function saveSession(token: string, user: any) {
  try {
    const userJSON = JSON.stringify(user ?? {});

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, userJSON);

    // 🔔 Tell every subscriber (WishlistProvider, CartProvider, ...)
    // that a NEW session just started, so they can drop whatever
    // they had cached for the previous user and load fresh data
    // for this one.
    emitAuthChange("login", user ?? null);
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to save session:", e);
  }
}

/**
 * ============================================================
 * GET TOKEN
 * ============================================================
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to read token:", e);
    return null;
  }
}

/**
 * ============================================================
 * GET USER
 * ============================================================
 */
export async function getUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to read user:", e);
    return null;
  }
}

/**
 * ============================================================
 * UPDATE STORED USER
 * ============================================================
 *
 * Merges partial fields into the already-stored user object.
 */
export async function updateStoredUser(partial: Record<string, any>) {
  try {
    const current = await getUser();
    const updated = {
      ...(current ?? {}),
      ...partial,
    };

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));

    return updated;
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to update user:", e);
    return null;
  }
}

/**
 * ============================================================
 * CLEAR AUTH SESSION
 * ============================================================
 *
 * Removes:
 *
 * auth_token
 * auth_user
 *
 * It does NOT remove other AsyncStorage data.
 */
export async function clearSession() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

    // 🔔 Tell every subscriber (WishlistProvider, CartProvider, ...)
    // that the session is gone RIGHT NOW, so they can wipe their
    // in-memory state immediately instead of waiting for a getUser()
    // call to eventually notice there's no user anymore.
    emitAuthChange("logout", null);
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to clear session:", e);
  }
}

/**
 * ============================================================
 * CONSOLE ALL ASYNC STORAGE
 * ============================================================
 *
 * IMPORTANT:
 *
 * This function DOES NOT DELETE anything.
 *
 * It only reads and prints every key/value currently
 * stored inside AsyncStorage.
 *
 * Use this with the "Check App Cache" button.
 */
export async function consoleAllAsyncStorage() {
  try {
    console.log("==================================================");
    console.log("[ASYNC STORAGE DEBUG] START");
    console.log("==================================================");

    const keys = await AsyncStorage.getAllKeys();

    if (keys.length === 0) {
      console.log("[ASYNC STORAGE DEBUG] AsyncStorage is empty");
      console.log("==================================================");
      console.log("[ASYNC STORAGE DEBUG] END");
      return [];
    }

    const entries = await AsyncStorage.multiGet(keys);

    entries.forEach(([key, value], index) => {
      console.log("--------------------------------------------------");
      console.log(`[ASYNC STORAGE DEBUG] #${index + 1}`);
      console.log("[ASYNC STORAGE DEBUG] KEY:", key);
      console.log("[ASYNC STORAGE DEBUG] VALUE:", value);
    });

    console.log("--------------------------------------------------");
    console.log("==================================================");
    console.log("[ASYNC STORAGE DEBUG] END");
    console.log("==================================================");

    return entries;
  } catch (error) {
    console.error("[ASYNC STORAGE DEBUG] Failed to read AsyncStorage:", error);
    return [];
  }
}

/**
 * ============================================================
 * CLEAR EVERYTHING
 * ============================================================
 *
 * WARNING:
 *
 * This removes EVERYTHING stored in AsyncStorage.
 *
 * This includes:
 *
 * - auth_token
 * - auth_user
 * - cart_items
 * - wishlist storage
 * - preferences
 * - onboarding data
 * - any other AsyncStorage key
 *
 * After clearing, this function verifies that ZERO keys
 * remain.
 */
export async function clearAllAsyncStorage() {
  try {
    await AsyncStorage.clear();

    const keysAfter = await AsyncStorage.getAllKeys();

    // 🔔 This wipes auth too, so treat it as a logout for subscribers.
    emitAuthChange("logout", null);

    return keysAfter.length === 0;
  } catch (e) {
    console.error("[AUTH STORAGE] Failed to clear ALL AsyncStorage:", e);
    return false;
  }
}