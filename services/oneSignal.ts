import {
  LogLevel,
  OneSignal,
} from "react-native-onesignal";

const ONE_SIGNAL_APP_ID =
  "3de7673e-3e04-4557-8ecc-249babd5b5a7";

let initialized = false;

export function initializeOneSignal() {
  if (initialized) {
    return;
  }

  try {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    OneSignal.initialize(ONE_SIGNAL_APP_ID);

    initialized = true;

    console.log(
      "[OneSignal] SDK initialized successfully",
    );
  } catch (error) {
    console.error(
      "[OneSignal] Initialization failed:",
      error,
    );
  }
}

export async function requestOneSignalPermission(): Promise<boolean> {
  try {
    const granted =
      await OneSignal.Notifications.requestPermission(
        false,
      );

    console.log(
      "[OneSignal] Notification permission:",
      granted ? "GRANTED" : "DENIED",
    );

    return granted;
  } catch (error) {
    console.error(
      "[OneSignal] Permission request failed:",
      error,
    );

    return false;
  }
}

export async function getOneSignalSubscriptionId(): Promise<string | null> {
  try {
    const subscriptionId =
      await OneSignal.User.pushSubscription.getIdAsync();

    console.log(
      "[OneSignal] Subscription ID:",
      subscriptionId,
    );

    return subscriptionId ?? null;
  } catch (error) {
    console.error(
      "[OneSignal] Failed to get subscription ID:",
      error,
    );

    return null;
  }
}

/**
 * ============================================================
 * UPDATE ONESIGNAL USER
 * ============================================================
 *
 * Sets the application's backend user ID as the OneSignal
 * External ID and also reads the current OneSignal
 * Subscription ID for this device.
 *
 * IMPORTANT:
 * The Subscription ID is NOT sent to the backend here.
 * It is only returned to the caller.
 */
export async function updateOneSignalUser(
  userId: number | string,
) {
  try {
    const externalId = String(userId).trim();

    if (!externalId) {
      console.error(
        "[OneSignal] External ID cannot be empty",
      );

      return {
        success: false,
        externalId: null,
        subscriptionId: null,
      };
    }

    /*
     * ========================================================
     * STEP 1: SET ONESIGNAL EXTERNAL ID
     * ========================================================
     */
    await OneSignal.login(externalId);

    console.log(
      "[OneSignal] External ID updated:",
      externalId,
    );

    /*
     * ========================================================
     * STEP 2: GET SUBSCRIPTION ID
     * ========================================================
     */
    const subscriptionId =
      await getOneSignalSubscriptionId();

    console.log(
      "[OneSignal] OneSignal user synchronization completed:",
      {
        externalId,
        subscriptionId,
      },
    );

    return {
      success: true,
      externalId,
      subscriptionId,
    };
  } catch (error) {
    console.error(
      "[OneSignal] Failed to update OneSignal user:",
      error,
    );

    return {
      success: false,
      externalId: null,
      subscriptionId: null,
    };
  }
}