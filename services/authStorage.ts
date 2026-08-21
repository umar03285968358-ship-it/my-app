import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export async function saveSession(token: string, user: any) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user ?? {}));
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to save session:", e);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to read token:", e);
    return null;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to read user:", e);
    return null;
  }
}

/**
 * NEW: merges partial fields into the already-stored user object, so we
 * don't have to re-save the whole session just to update e.g. the avatar
 * after a profile edit or photo upload. Returns the merged user, or null
 * on failure.
 */
export async function updateStoredUser(partial: Record<string, any>) {
  try {
    const current = await getUser();
    const updated = { ...(current ?? {}), ...partial };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to update user:", e);
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to clear session:", e);
  }
}
