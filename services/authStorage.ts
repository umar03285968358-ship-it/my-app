import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export async function saveSession(token: string, user: any) {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] saveSession()");
    console.log("[AUTH STORAGE] TOKEN_KEY:", TOKEN_KEY);
    console.log("[AUTH STORAGE] USER_KEY:", USER_KEY);
    console.log("[AUTH STORAGE] token:", token);
    console.log("[AUTH STORAGE] user:", user);
    console.log(
      "[AUTH STORAGE] user JSON:",
      JSON.stringify(user ?? {})
    );

    await AsyncStorage.setItem(TOKEN_KEY, token);

    console.log("[AUTH STORAGE] Token saved successfully");

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user ?? {})
    );

    console.log("[AUTH STORAGE] User saved successfully");

    // Verify saved values
    const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
    const savedUser = await AsyncStorage.getItem(USER_KEY);

    console.log("[AUTH STORAGE] Verification:");
    console.log("[AUTH STORAGE] Saved token:", savedToken);
    console.log("[AUTH STORAGE] Saved user:", savedUser);

    console.log("========================================");
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to save session:", e);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] getToken()");
    console.log("[AUTH STORAGE] TOKEN_KEY:", TOKEN_KEY);

    const token = await AsyncStorage.getItem(TOKEN_KEY);

    console.log("[AUTH STORAGE] Retrieved token:", token);
    console.log("[AUTH STORAGE] Token exists:", !!token);

    console.log("========================================");

    return token;
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to read token:", e);
    return null;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] getUser()");
    console.log("[AUTH STORAGE] USER_KEY:", USER_KEY);

    const raw = await AsyncStorage.getItem(USER_KEY);

    console.log("[AUTH STORAGE] Raw stored user:", raw);

    const user = raw ? JSON.parse(raw) : null;

    console.log("[AUTH STORAGE] Parsed user:", user);
    console.log("[AUTH STORAGE] User exists:", !!user);

    console.log("========================================");

    return user;
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to read user:", e);
    return null;
  }
}

/**
 * Merges partial fields into the already-stored user object.
 */
export async function updateStoredUser(
  partial: Record<string, any>
) {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] updateStoredUser()");
    console.log("[AUTH STORAGE] Partial update:", partial);

    const current = await getUser();

    console.log("[AUTH STORAGE] Current stored user:", current);

    const updated = {
      ...(current ?? {}),
      ...partial,
    };

    console.log("[AUTH STORAGE] Updated user:", updated);

    console.log(
      "[AUTH STORAGE] Updated user JSON:",
      JSON.stringify(updated)
    );

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(updated)
    );

    console.log("[AUTH STORAGE] User updated successfully");

    // Verify update
    const verification = await AsyncStorage.getItem(USER_KEY);

    console.log(
      "[AUTH STORAGE] User after update:",
      verification
    );

    console.log("========================================");

    return updated;
  } catch (e) {
    console.log("[AUTH STORAGE] Failed to update user:", e);
    return null;
  }
}

export async function clearSession() {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] clearSession()");
    console.log("[AUTH STORAGE] Starting session cleanup...");

    console.log("[AUTH STORAGE] Removing TOKEN_KEY:", TOKEN_KEY);
    console.log("[AUTH STORAGE] Removing USER_KEY:", USER_KEY);

    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      USER_KEY,
    ]);

    console.log(
      "[AUTH STORAGE] AsyncStorage multiRemove completed"
    );

    // Verify everything was removed
    const tokenAfterClear =
      await AsyncStorage.getItem(TOKEN_KEY);

    const userAfterClear =
      await AsyncStorage.getItem(USER_KEY);

    console.log(
      "[AUTH STORAGE] Token after clear:",
      tokenAfterClear
    );

    console.log(
      "[AUTH STORAGE] User after clear:",
      userAfterClear
    );

    console.log(
      "[AUTH STORAGE] Token cleared:",
      tokenAfterClear === null
    );

    console.log(
      "[AUTH STORAGE] User cleared:",
      userAfterClear === null
    );

    if (
      tokenAfterClear === null &&
      userAfterClear === null
    ) {
      console.log(
        "[AUTH STORAGE] ✅ AUTH SESSION COMPLETELY CLEARED"
      );
    } else {
      console.log(
        "[AUTH STORAGE] ❌ AUTH SESSION WAS NOT COMPLETELY CLEARED"
      );
    }

    console.log("========================================");
  } catch (e) {
    console.log(
      "[AUTH STORAGE] Failed to clear session:",
      e
    );
  }
}

/**
 * Debug helper.
 * Prints ALL keys currently stored in AsyncStorage.
 */
export async function debugAsyncStorage() {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] debugAsyncStorage()");
    console.log("[AUTH STORAGE] Reading ALL AsyncStorage keys...");

    const keys = await AsyncStorage.getAllKeys();

    console.log(
      "[AUTH STORAGE] Total keys:",
      keys.length
    );

    console.log("[AUTH STORAGE] Keys:", keys);

    if (keys.length === 0) {
      console.log(
        "[AUTH STORAGE] ✅ AsyncStorage is completely empty"
      );
      console.log("========================================");
      return;
    }

    const entries = await AsyncStorage.multiGet(keys);

    console.log("[AUTH STORAGE] Stored data:");

    entries.forEach(([key, value]) => {
      console.log("----------------------------------------");
      console.log("[AUTH STORAGE] KEY:", key);
      console.log("[AUTH STORAGE] VALUE:", value);
    });

    console.log("========================================");
  } catch (e) {
    console.log(
      "[AUTH STORAGE] Failed to debug AsyncStorage:",
      e
    );
  }
}

/**
 * Clears EVERYTHING from AsyncStorage.
 *
 * WARNING:
 * This removes auth, cart, preferences,
 * onboarding data, and any other AsyncStorage data
 * used by the application.
 */
export async function clearAllAsyncStorage() {
  try {
    console.log("========================================");
    console.log("[AUTH STORAGE] clearAllAsyncStorage()");
    console.log(
      "[AUTH STORAGE] ⚠️ STARTING COMPLETE ASYNCSTORAGE WIPE"
    );

    // Show everything before clearing
    const keysBefore =
      await AsyncStorage.getAllKeys();

    console.log(
      "[AUTH STORAGE] Keys BEFORE clear:",
      keysBefore
    );

    console.log(
      "[AUTH STORAGE] Number of keys BEFORE:",
      keysBefore.length
    );

    if (keysBefore.length > 0) {
      const valuesBefore =
        await AsyncStorage.multiGet(keysBefore);

      console.log(
        "[AUTH STORAGE] Data BEFORE clear:"
      );

      valuesBefore.forEach(([key, value]) => {
        console.log("----------------------------------------");
        console.log("[AUTH STORAGE] KEY:", key);
        console.log("[AUTH STORAGE] VALUE:", value);
      });
    }

    // Clear everything
    await AsyncStorage.clear();

    console.log(
      "[AUTH STORAGE] AsyncStorage.clear() completed"
    );

    // Verify
    const keysAfter =
      await AsyncStorage.getAllKeys();

    console.log(
      "[AUTH STORAGE] Keys AFTER clear:",
      keysAfter
    );

    console.log(
      "[AUTH STORAGE] Number of keys AFTER:",
      keysAfter.length
    );

    if (keysAfter.length === 0) {
      console.log(
        "[AUTH STORAGE] ✅ ALL ASYNCSTORAGE DATA SUCCESSFULLY CLEARED"
      );
    } else {
      console.log(
        "[AUTH STORAGE] ❌ SOME ASYNCSTORAGE DATA STILL EXISTS"
      );

      const remainingData =
        await AsyncStorage.multiGet(keysAfter);

      console.log(
        "[AUTH STORAGE] Remaining data:"
      );

      remainingData.forEach(([key, value]) => {
        console.log("----------------------------------------");
        console.log("[AUTH STORAGE] REMAINING KEY:", key);
        console.log(
          "[AUTH STORAGE] REMAINING VALUE:",
          value
        );
      });
    }

    console.log("========================================");
  } catch (e) {
    console.log(
      "[AUTH STORAGE] Failed to clear ALL AsyncStorage:",
      e
    );
  }
}